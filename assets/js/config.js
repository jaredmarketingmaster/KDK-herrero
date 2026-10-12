/*
 * Constantes configurables de la landing de KDK Design.
 * Es el único archivo que hay que editar para poner la página en marcha.
 * Nunca pongas claves ni secretos aquí: todo lo que hay en este archivo es público.
 */
window.KDK_CONFIG = {
  GTM_ID: "",             // [PENDIENTE] Si está vacío, GTM no se carga.
  FORM_ENDPOINT: "",      // [PENDIENTE] Webhook del CRM o del setter de IA que recibe el JSON del formulario.
  VIDEO_URL: "",          // [PENDIENTE] Vídeo publicitario premium. Si está vacía, la sección se oculta.
  VIDEO_POSTER: "",       // [PENDIENTE]
  TELEFONO_ASISTENTE: "", // [PENDIENTE] Número desde el que llama el asistente de IA.
  EMAIL_CONTACTO: "",     // [PENDIENTE] Verificar hola@kdkdesign.es antes de usarlo.
  PIE_FOTO_EQUIPO: "",    // [PENDIENTE] Nombre y cargo de quien aparece en la foto.
  PORTAFOLIO: [
    // Se rellena cuando haya piezas. Ejemplo:
    // { src: "assets/portafolio/hotel-01.jpg", alt: "Habitación de hotel con luz de atardecer", sector: "Hotel", ia: true, concepto: false }
  ]
};
