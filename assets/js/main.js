/*
 * Comportamiento general de la página (landing y páginas legales):
 * numeración de secciones, aparición al hacer scroll, barra fija inferior,
 * año del pie, email de contacto y pie de la foto del equipo desde config.js.
 */
(function () {
  "use strict";

  var CFG = window.KDK_CONFIG || {};
  var raiz = document.documentElement;

  /* --- Numeración editorial: 01, 02… según las secciones que existan ------ */
  var secciones = document.querySelectorAll("[data-seccion]");
  Array.prototype.forEach.call(secciones, function (s, i) {
    var num = s.querySelector("[data-num]");
    if (num) num.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
  });

  /* --- Año actual en el pie --------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-anio]"), function (n) {
    n.textContent = String(new Date().getFullYear());
  });

  /* --- Email de contacto (si está configurado y tiene formato válido) ----- */
  var email = String(CFG.EMAIL_CONTACTO || "").trim();
  if (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-email-contacto]"), function (n) {
      var a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      n.textContent = "";
      n.appendChild(a);
    });
  }

  /* --- Pie de la foto del equipo --------------------------------------- */
  var pieFoto = String(CFG.PIE_FOTO_EQUIPO || "").trim();
  if (pieFoto) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-pie-foto]"), function (n) {
      n.textContent = pieFoto;
    });
  }

  /* --- Aparición con fundido y 12 px al entrar en pantalla ------------- */
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revelables = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (!reducido && "IntersectionObserver" in window && revelables.length) {
    /* Lo que ya está en pantalla se muestra sin animar (sin parpadeos). */
    var alto = window.innerHeight || document.documentElement.clientHeight;
    var pendientes = revelables.filter(function (n) {
      var r = n.getBoundingClientRect();
      var visible = r.top < alto && r.bottom > 0;
      if (visible) n.classList.add("is-visible");
      return !visible;
    });
    raiz.classList.add("reveal-activo");

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        observador.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    pendientes.forEach(function (n) { observador.observe(n); });
  }

  /* --- Barra fija inferior ------------------------------------------------
     Se oculta cuando el formulario está a la vista. También mientras se ve el
     botón de la cabecera, para no duplicar el CTA ni tapar la nota que lo acompaña. */
  var barra = document.querySelector("[data-barra-fija]");
  var seccionFormulario = document.getElementById("formulario");
  var ctaCabecera = document.querySelector('[data-cta="hero"]');
  if (barra && seccionFormulario && "IntersectionObserver" in window) {
    var visibles = new Set();
    var observadorBarra = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) visibles.add(e.target);
        else visibles.delete(e.target);
      });
      barra.classList.toggle("is-oculta", visibles.size > 0);
    }, { threshold: 0 });
    observadorBarra.observe(seccionFormulario);
    if (ctaCabecera) observadorBarra.observe(ctaCabecera);
  }
})();
