# Selah Sonora AI Office · Netlify

Esta versión está adaptada a Netlify Functions y conserva las rutas `/api/*`.

## Despliegue recomendado (sin instalar Node en tu Mac)
1. Descomprime este ZIP.
2. Sube los archivos a un repositorio privado de GitHub.
3. En Netlify, crea/importa un sitio desde ese repositorio.
4. En la configuración del sitio, agrega la variable de entorno `OPENAI_API_KEY` con el valor de tu clave API de OpenAI. Su scope debe incluir Functions.
5. Agrega `OPENAI_MODEL` opcionalmente con un modelo disponible en tu proyecto, por ejemplo `gpt-5.5`.
6. Despliega el sitio desde Netlify.
7. Abre `https://TU-SITIO.netlify.app/api/health`. Debe devolver JSON con `ready: true`.
8. Abre la oficina y prueba un chat individual.

## ¿Por qué GitHub?
Arrastrar un ZIP a Netlify Drop normalmente publica archivos estáticos y no compila/implementa estas funciones. Para Functions, conecta un repositorio Git para que Netlify las construya, o usa Netlify CLI desde un entorno con Node.

## Seguridad
- Nunca pongas la clave API en `index.html`.
- No la subas a GitHub ni la compartas en chats o capturas.
- Si se expone, revócala y crea otra.
- La API se factura aparte de ChatGPT.
- Añade límites de uso/autenticación antes de compartir públicamente el sitio para evitar consumo no autorizado.

## Estado de esta versión
- Los chats y el flujo de lanzamiento llaman a un backend de Netlify.
- El chat grupal usa una respuesta coordinadora que representa las distintas áreas; todavía no son procesos paralelos independientes.
- La retroalimentación se guarda en el navegador como preferencias; no reentrena el modelo base.
- La dirección de arte genera un prompt, no una imagen directamente.
- Revisa siempre letra, referencias bíblicas y doctrina antes de publicar.
