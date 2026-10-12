/*
 * Medición: helper del dataLayer y eventos de interacción.
 *
 * Regla: nunca se envían al dataLayer nombre, email, teléfono, negocio,
 * Instagram ni comentario. kdkPush() elimina esas claves por si acaso.
 *
 * Eventos de este archivo: cta_click, faq_open.
 * video_play lo envía portafolio.js; los del formulario, formulario.js;
 * consent_update, consent.js.
 */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];

  var PROHIBIDAS = ["nombre", "email", "telefono", "negocio", "instagram", "comentario", "website"];

  window.kdkPush = function (evento) {
    var limpio = {};
    Object.keys(evento || {}).forEach(function (clave) {
      if (PROHIBIDAS.indexOf(clave) === -1) limpio[clave] = evento[clave];
    });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(limpio);
  };

  /* cta_click: cualquier "Ver si encajamos" (hero, vídeo, barra fija). */
  document.addEventListener("click", function (ev) {
    var cta = ev.target.closest && ev.target.closest("[data-cta]");
    if (!cta) return;
    window.kdkPush({ event: "cta_click", cta_location: cta.getAttribute("data-cta") });
  });

  /* faq_open: el evento "toggle" no burbujea, así que se escucha en captura. */
  document.addEventListener("toggle", function (ev) {
    var detalle = ev.target;
    if (!detalle || detalle.tagName !== "DETAILS" || !detalle.open) return;
    if (!detalle.closest(".faq")) return;
    var pregunta = detalle.querySelector(".faq__pregunta");
    window.kdkPush({
      event: "faq_open",
      faq_question: pregunta ? pregunta.textContent.trim() : ""
    });
  }, true);
})();
