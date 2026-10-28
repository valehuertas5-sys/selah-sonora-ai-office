import OpenAI from "openai";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const agents = {
  group: { name: "Mara", role: "Directora de producción y chat grupal", instructions: `Eres Mara, directora de producción de Selah Sonora. Coordina el equipo y resume próximos pasos. No afirmes que otro agente trabajó si no ejecutaste su rol.` },
  research: { name: "Nora", role: "Investigación musical", instructions: `Eres Nora, investigadora musical. Investiga rasgos generales verificables de género, estructura, tempo, instrumentación, armonía, dinámica, interpretación vocal y evolución emocional. Si se menciona un artista vivo, no imites exactamente su estilo ni copies letras o melodías; describe rasgos generales y propone una dirección original. Distingue hechos e inferencias y no inventes fuentes.` },
  lyrics: { name: "Alma", role: "Composición y revisión bíblica", instructions: `Eres Alma, compositora de canciones cristianas originales en español. Escribe letras cantables, emotivas, coherentes y memorables, con rimas naturales, métrica razonable, imágenes concretas, progresión emocional y secciones apropiadas. Enfoque en Jesucristo y doctrina unicitaria apostólica coherente con la IPUC: un solo Dios, Jesucristo como Dios manifestado en carne; evita formulaciones trinitarias o ambiguas. Usa pasajes bíblicos en contexto y señala referencias. Marca dudas doctrinales para revisión humana. No copies letras existentes ni frases distintivas de artistas.` },
  style: { name: "Teo", role: "Dirección musical y Style para Suno", instructions: `Eres Teo, director musical y productor. Crea un único Style para Suno de máximo 1000 caracteres, preferiblemente en inglés si ayuda al generador. Incluye género, tempo/feel, instrumentación, groove, voz, dinámica, producción y arco emocional. Debe ser original y no imitar exactamente a un artista. Entrega el Style claramente separado y cuenta caracteres.` },
  art: { name: "Lía", role: "Dirección de arte y portada", instructions: `Eres Lía, directora de arte de portadas para YouTube. Crea concepto cinematográfico, original y emocional según título, género y letra; la adoración a Jesucristo debe aparecer de forma respetuosa y pertinente. Devuelve composición, paleta, iluminación, foco, formato 16:9 y prompt detallado para generador de imágenes. No digas que generaste un archivo de imagen si solo has creado un prompt.` },
  growth: { name: "Ciro", role: "Alcance y retención para YouTube", instructions: `Eres Ciro, estratega de YouTube para música cristiana. Propón 5 títulos atractivos y honestos con intención de búsqueda, género, emoción y claridad; recomienda uno y explica por qué. Sugiere texto de miniatura y gancho inicial. No prometas vistas ni inventes tendencias o métricas.` },
  producer: { name: "Mara", role: "Dirección de producción", instructions: `Eres Mara, directora de producción. Integra el paquete: investigación, letra, Style de Suno con conteo <=1000 caracteres, concepto/prompt de portada, títulos de YouTube, miniatura, gancho y checklist. Marca dudas para revisión humana.` }
};
const labels = {
  research: "INVESTIGACIÓN MUSICAL",
  lyrics: "LETRA ORIGINAL Y REVISIÓN BÍBLICA",
  style: "STYLE PARA SUNO (MÁXIMO 1.000 CARACTERES)",
  art: "CONCEPTO Y PROMPT DE PORTADA",
  growth: "ALCANCE Y RETENCIÓN PARA YOUTUBE"
};
const agentOrder = ["research","lyrics","style","art","growth"];

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
function getMemory(extra="") {
  return `Reglas de Selah Sonora: responde en español salvo el Style para Suno, que puede ir en inglés. Las letras deben ser originales, bíblicas en contexto y doctrinalmente cuidadosas. Si algo no puede verificarse, dilo. Las correcciones del usuario son preferencias contextuales, no entrenamiento del modelo base.\n\nAprendizajes guardados:\n${extra || "(sin preferencias guardadas)"}`;
}
async function ask(client, agentId, input, memory="") {
  const a = agents[agentId] || agents.group;
  const useSearch = agentId === "research" || agentId === "growth";
  const result = await client.responses.create({
    model: MODEL,
    instructions: `${a.instructions}\n\n${getMemory(memory)}`,
    input,
    ...(useSearch ? { tools: [{ type: "web_search" }] } : {})
  });
  return result.output_text || "No se recibió texto de respuesta.";
}
function getKey() { return Netlify.env.get("OPENAI_API_KEY") || process.env.OPENAI_API_KEY; }
export const config = { path: ["/api/health", "/api/chat", "/api/feedback", "/api/memory", "/api/launch"] };

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  if (req.method === "GET" && path === "/api/health") {
    return json({ ready: Boolean(getKey()), model: MODEL });
  }
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "El cuerpo debe ser JSON válido." }, 400); }

  if (path === "/api/feedback" || path === "/api/memory") {
    // This starter version returns success but does not persist these values server-side.
    // The browser stores memory in localStorage and sends it with each request.
    return json({ ok: true });
  }
  const apiKey = getKey();
  if (!apiKey) return json({ error: "Falta OPENAI_API_KEY en las variables de entorno de Netlify. Añádela y vuelve a desplegar." }, 503);
  const client = new OpenAI({ apiKey });

  try {
    if (path === "/api/chat") {
      const { agentId="group", message="", history=[], memory="" } = body;
      if (!String(message).trim()) return json({ error: "El mensaje está vacío." }, 400);
      if (agentId === "group") {
        const prompt = `La directora escribió: ${message}\n\nEntrega una respuesta de chat grupal con secciones breves de Nora (investigación), Alma (composición), Teo (Suno), Lía (arte), Ciro (YouTube) y Mara (coordinación). Para cada rol, aporta algo concreto y coherente con la solicitud. Si no hay datos suficientes, pregunta o declara la limitación.`;
        const text = await ask(client, "group", prompt, memory);
        const replies = [
          { agentId: "research", text: "Participación de Nora:\n" + text },
          { agentId: "lyrics", text: "Participación de Alma:\n" + text },
          { agentId: "style", text: "Participación de Teo:\n" + text },
          { agentId: "art", text: "Participación de Lía:\n" + text },
          { agentId: "growth", text: "Participación de Ciro:\n" + text },
          { agentId: "group", text: "Coordinación de Mara:\n" + text }
        ];
        return json({ replies });
      }
      const recent = Array.isArray(history) ? history.slice(-8).map(m => `${m.role === "user" ? "Directora" : agents[m.agentId]?.name || "Equipo"}: ${m.text}`).join("\n\n") : "";
      const text = await ask(client, agents[agentId] ? agentId : "group", `Contexto reciente:\n${recent}\n\nMensaje nuevo de la directora:\n${message}`, memory);
      return json({ text });
    }

    if (path === "/api/launch") {
      const { brief={}, memory="" } = body;
      if (!brief.genre?.trim()) return json({ error: "Especifica un género musical." }, 400);
      const prompt = `Crea un paquete completo de lanzamiento para Selah Sonora. Ejecuta estos roles en orden y separa claramente los entregables con encabezados:
1. ${agents.research.instructions}
2. ${agents.lyrics.instructions}
3. ${agents.style.instructions}
4. ${agents.art.instructions}
5. ${agents.growth.instructions}
6. ${agents.producer.instructions}

BRIEF
Género: ${brief.genre}
Referencia: ${brief.reference || "No especificada"}
Mensaje/emoción: ${brief.theme || "Propón una idea coherente"}
Notas: ${brief.notes || "Sin notas adicionales"}

En la sección de Style, comprueba y declara el número de caracteres, nunca más de 1000. No afirmes haber creado un archivo de imagen; proporciona un prompt listo para un generador de imágenes. No garantices visualizaciones. Añade referencias bíblicas y marca cualquier duda doctrinal para revisión humana.`;
      const packageText = await ask(client, "producer", prompt, memory);
      return json({ package: packageText, stages: { combined: packageText } });
    }
    return json({ error: "Ruta no encontrada." }, 404);
  } catch (e) {
    console.error("Selah API error", e);
    return json({ error: e?.message || "Error al consultar el modelo." }, 500);
  }
};
