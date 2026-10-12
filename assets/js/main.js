/*
 * Comportamiento general de la página (landing y páginas legales).
 *
 * Contenido: numeración de secciones, año del pie, email y pie de foto desde
 * config.js. Movimiento editorial: aparición al entrar en pantalla, barra de
 * progreso de lectura, cita que se "imprime" palabra a palabra, línea de
 * tiempo que se rellena, parallax sutil en las fotos y acordeón con altura
 * animada. Barra fija inferior en móvil.
 *
 * Reglas de robustez:
 * - Todo el contenido está en el HTML; este archivo solo lo enriquece.
 * - Cada módulo va en safe(): si uno falla, los demás siguen funcionando.
 * - Un único bucle de scroll (requestAnimationFrame) para todos los efectos.
 * - Con prefers-reduced-motion: reduce no hay desplazamientos ni parallax.
 */
(function () {
  "use strict";

  var CFG = window.KDK_CONFIG || {};
  var raiz = document.documentElement;
  var reducido = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function $$(sel, ambito) {
    return Array.prototype.slice.call((ambito || document).querySelectorAll(sel));
  }

  function safe(fn, nombre) {
    try {
      fn();
    } catch (e) {
      if (window.console && console.warn) console.warn("[KDK] " + nombre + ":", e);
    }
  }

  function limitar(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  /* --- Bucle de scroll único --------------------------------------------- */
  var actualizadores = [];
  var pendiente = false;

  function alHacerScroll() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () {
      pendiente = false;
      var alto = window.innerHeight || raiz.clientHeight;
      actualizadores.forEach(function (fn) {
        safe(function () { fn(alto); }, "scroll");
      });
    });
  }

  function registrar(fn) {
    actualizadores.push(fn);
  }

  /* --- Contenido desde config.js ---------------------------------------- */
  function initNumeracion() {
    $$("[data-seccion]").forEach(function (s, i) {
      var num = s.querySelector("[data-num]");
      if (num) num.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    });
  }

  function initAnio() {
    $$("[data-anio]").forEach(function (n) {
      n.textContent = String(new Date().getFullYear());
    });
  }

  function initEmail() {
    var email = String(CFG.EMAIL_CONTACTO || "").trim();
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email)) return;
    $$("[data-email-contacto]").forEach(function (n) {
      if (n.querySelector("a")) return;
      var a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      n.textContent = "";
      n.appendChild(a);
    });
  }

  function initPieFoto() {
    var pieFoto = String(CFG.PIE_FOTO_EQUIPO || "").trim();
    if (!pieFoto) return;
    $$("[data-pie-foto]").forEach(function (n) {
      n.textContent = pieFoto;
    });
  }

  /* --- Aparición al entrar en pantalla ---------------------------------- */
  function initApariciones() {
    var revelables = $$("[data-reveal]");
    if (reducido || !("IntersectionObserver" in window) || !revelables.length) return;

    /* Lo que ya está en pantalla se marca antes de activar la animación. */
    var alto = window.innerHeight || raiz.clientHeight;
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
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    pendientes.forEach(function (n) { observador.observe(n); });

    /* Red de seguridad: a los 6 s se muestra todo lo que quede por encima
       del borde inferior de la pantalla, pase lo que pase con el observador. */
    window.setTimeout(function () {
      $$("[data-reveal]:not(.is-visible)").forEach(function (n) {
        if (n.getBoundingClientRect().top < (window.innerHeight || raiz.clientHeight)) {
          n.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* --- Barra de progreso de lectura ------------------------------------- */
  function initProgresoLectura() {
    var barra = document.querySelector("[data-progreso-lectura]");
    if (!barra) return;
    registrar(function (alto) {
      var max = raiz.scrollHeight - alto;
      var p = max > 0 ? limitar(window.pageYOffset / max, 0, 1) : 0;
      barra.style.transform = "scaleX(" + p.toFixed(4) + ")";
    });
  }

  /* --- Cita que se "imprime" palabra a palabra al hacer scroll ---------- */
  function initCita() {
    var cita = document.querySelector("[data-cita-palabras]");
    if (!cita || cita.getAttribute("data-cita-lista")) return;
    var texto = cita.textContent.replace(/\s+/g, " ").trim();
    if (!texto) return;
    cita.setAttribute("data-cita-lista", "1");

    /* El texto completo queda para los lectores de pantalla; las palabras
       separadas son solo visuales. */
    var accesible = document.createElement("span");
    accesible.className = "visualmente-oculto";
    accesible.textContent = texto;
    var visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    var palabras = texto.split(" ").map(function (p, i, lista) {
      var s = document.createElement("span");
      s.className = "cita__palabra";
      s.textContent = p;
      visual.appendChild(s);
      if (i < lista.length - 1) visual.appendChild(document.createTextNode(" "));
      return s;
    });
    cita.textContent = "";
    cita.appendChild(accesible);
    cita.appendChild(visual);

    if (reducido) {
      palabras.forEach(function (p) { p.classList.add("is-on"); });
      return;
    }
    cita.classList.add("cita--imprimible");
    registrar(function (alto) {
      var r = cita.getBoundingClientRect();
      var p = limitar((alto * 0.88 - r.top) / (alto * 0.5), 0, 1);
      var encendidas = Math.round(p * palabras.length);
      palabras.forEach(function (w, i) {
        w.classList.toggle("is-on", i < encendidas);
      });
    });
  }

  /* --- Línea de tiempo de "Así trabajamos" ------------------------------- */
  function initPasos() {
    var lista = document.querySelector("[data-pasos]");
    if (!lista) return;
    var pasos = $$("li", lista);
    if (reducido) {
      lista.classList.add("pasos--completos");
      return;
    }
    lista.classList.add("pasos--vivos");
    registrar(function (alto) {
      var linea = alto * 0.62;
      pasos.forEach(function (li) {
        var r = li.getBoundingClientRect();
        li.classList.toggle("is-activo", r.top + 16 <= linea);
        var inicio = r.top + 48;
        var fin = r.bottom - 8;
        var llenado = fin > inicio ? limitar((linea - inicio) / (fin - inicio), 0, 1) : 0;
        li.style.setProperty("--llenado", llenado.toFixed(3));
      });
    });
  }

  /* --- Parallax sutil en las fotos (máx. 16 px, solo escritorio) ------- */
  function initParallax() {
    if (reducido || !window.matchMedia || !window.matchMedia("(min-width: 960px)").matches) return;
    var fotos = $$("[data-parallax]");
    if (!fotos.length) return;
    registrar(function (alto) {
      fotos.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > alto) return;
        var centro = (r.top + r.height / 2 - alto / 2) / alto;
        img.style.translate = "0 " + (limitar(centro, -1, 1) * -16).toFixed(1) + "px";
      });
    });
  }

  /* --- Acordeón con altura animada ------------------------------------- */
  function initAcordeon() {
    if (reducido || typeof Element.prototype.animate !== "function") return;
    $$(".faq details").forEach(function (det) {
      var resumen = det.querySelector("summary");
      if (!resumen || det.getAttribute("data-acordeon")) return;
      det.setAttribute("data-acordeon", "1");
      var anim = null;

      function terminar(abierto) {
        det.open = abierto;
        det.style.height = "";
        det.style.overflow = "";
        det.classList.remove("is-cerrando");
        anim = null;
      }

      resumen.addEventListener("click", function (ev) {
        ev.preventDefault();
        if (anim) anim.cancel();
        det.style.overflow = "hidden";
        var inicio = det.offsetHeight;
        if (det.open && !det.classList.contains("is-cerrando")) {
          det.classList.add("is-cerrando");
          var finCierre = resumen.offsetHeight;
          anim = det.animate({ height: [inicio + "px", finCierre + "px"] }, { duration: 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
          anim.onfinish = function () { terminar(false); };
          anim.oncancel = function () { det.classList.remove("is-cerrando"); };
        } else {
          det.classList.remove("is-cerrando");
          det.style.height = inicio + "px";
          det.open = true;
          window.requestAnimationFrame(function () {
            var finApertura = det.scrollHeight;
            anim = det.animate({ height: [inicio + "px", finApertura + "px"] }, { duration: 460, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
            anim.onfinish = function () { terminar(true); };
          });
        }
      });
    });
  }

  /* --- Barra fija inferior (móvil) ---------------------------------------
     Se oculta con el formulario a la vista y mientras se ve el botón de la
     cabecera, para no duplicar el CTA ni tapar la nota que lo acompaña. */
  function initBarraFija() {
    var barra = document.querySelector("[data-barra-fija]");
    var seccionFormulario = document.getElementById("formulario");
    if (!barra || !seccionFormulario || !("IntersectionObserver" in window)) return;
    var ctaCabecera = document.querySelector('[data-cta="hero"]');
    var visibles = new Set();
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) visibles.add(e.target);
        else visibles.delete(e.target);
      });
      barra.classList.toggle("is-oculta", visibles.size > 0);
    }, { threshold: 0 });
    observador.observe(seccionFormulario);
    if (ctaCabecera) observador.observe(ctaCabecera);
  }

  /* --- Arranque ------------------------------------------------------------ */
  safe(initNumeracion, "numeración");
  safe(initAnio, "año");
  safe(initEmail, "email");
  safe(initPieFoto, "pie de foto");
  safe(initCita, "cita");
  safe(initApariciones, "apariciones");
  safe(initProgresoLectura, "progreso de lectura");
  safe(initPasos, "pasos");
  safe(initParallax, "parallax");
  safe(initAcordeon, "acordeón");
  safe(initBarraFija, "barra fija");

  if (actualizadores.length) {
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", alHacerScroll, { passive: true });
    alHacerScroll();
  }
})();
