/*
 * Consentimiento de cookies (Google Consent Mode v2) y carga de GTM.
 *
 * - Antes de cargar GTM, todo el consentimiento está denegado por defecto.
 * - GTM solo se carga si GTM_ID tiene valor Y el usuario ha aceptado al menos
 *   una categoría no técnica. Sin consentimiento no hay ninguna petición a
 *   Google, Meta ni Microsoft.
 * - La elección se guarda en localStorage ("kdk_consent", con fecha) y se
 *   vuelve a preguntar a los 12 meses.
 * - Cualquier elemento con [data-abrir-cookies] reabre el panel.
 *
 * Se carga de forma síncrona en <head>, después de config.js.
 */
(function () {
  "use strict";

  var CFG = window.KDK_CONFIG || {};
  var CLAVE = "kdk_consent";
  var VERSION = 1;
  var MESES_VALIDEZ = 12;
  var raiz = document.documentElement.getAttribute("data-raiz") || "";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  var gtmCargado = false;
  var eleccion = leerEleccion();

  if (eleccion) {
    window.gtag("consent", "update", aEstado(eleccion));
    if (eleccion.analiticas || eleccion.publicitarias) {
      cargarGTM();
    }
  }

  function leerEleccion() {
    try {
      var bruto = window.localStorage.getItem(CLAVE);
      if (!bruto) return null;
      var datos = JSON.parse(bruto);
      if (!datos || datos.version !== VERSION || !datos.fecha) return null;
      var caduca = new Date(datos.fecha);
      if (isNaN(caduca.getTime())) return null;
      caduca.setMonth(caduca.getMonth() + MESES_VALIDEZ);
      if (new Date() >= caduca) return null;
      return {
        version: VERSION,
        fecha: datos.fecha,
        analiticas: datos.analiticas === true,
        publicitarias: datos.publicitarias === true
      };
    } catch (e) {
      return null;
    }
  }

  function aEstado(e) {
    var ads = e.publicitarias ? "granted" : "denied";
    return {
      analytics_storage: e.analiticas ? "granted" : "denied",
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads
    };
  }

  function cargarGTM() {
    var id = String(CFG.GTM_ID || "").trim();
    if (gtmCargado || !/^GTM-[A-Z0-9]+$/.test(id)) return;
    gtmCargado = true;
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
    (document.head || document.documentElement).appendChild(s);
  }

  /* Al retirar un consentimiento, se borran las cookies propias de esa categoría. */
  var COOKIES = {
    analiticas: [/^_ga/, /^_gid$/, /^_gat/, /^_clck$/, /^_clsk$/],
    publicitarias: [/^_fbp$/, /^_fbc$/, /^_gcl_/]
  };

  function borrarCookies(patrones) {
    var nombres = document.cookie.split(";").map(function (c) {
      return c.split("=")[0].trim();
    });
    var partes = window.location.hostname.split(".");
    var dominios = [""];
    for (var i = 0; i < partes.length - 1; i++) {
      dominios.push("." + partes.slice(i).join("."));
    }
    nombres.forEach(function (nombre) {
      if (!nombre) return;
      var coincide = patrones.some(function (p) { return p.test(nombre); });
      if (!coincide) return;
      dominios.forEach(function (dominio) {
        document.cookie = nombre + "=; Max-Age=0; path=/" + (dominio ? "; domain=" + dominio : "");
      });
    });
  }

  function guardar(analiticas, publicitarias) {
    var anterior = eleccion;
    eleccion = {
      version: VERSION,
      fecha: new Date().toISOString(),
      analiticas: analiticas === true,
      publicitarias: publicitarias === true
    };
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(eleccion));
    } catch (e) { /* almacenamiento no disponible: la elección vale para esta visita */ }

    var estado = aEstado(eleccion);
    window.gtag("consent", "update", estado);
    window.dataLayer.push({
      event: "consent_update",
      analytics_storage: estado.analytics_storage,
      ad_storage: estado.ad_storage,
      ad_user_data: estado.ad_user_data,
      ad_personalization: estado.ad_personalization
    });

    cerrar();

    var retiraAnaliticas = anterior && anterior.analiticas && !eleccion.analiticas;
    var retiraPublicitarias = anterior && anterior.publicitarias && !eleccion.publicitarias;
    if (retiraAnaliticas) borrarCookies(COOKIES.analiticas);
    if (retiraPublicitarias) borrarCookies(COOKIES.publicitarias);

    if (gtmCargado && (retiraAnaliticas || retiraPublicitarias)) {
      /* GTM ya estaba cargado y se ha retirado un consentimiento: se recarga
         la página para que los scripts de terceros ya cargados dejen de actuar.
         Tras la recarga, GTM solo vuelve si queda alguna categoría aceptada. */
      window.location.reload();
      return;
    }
    if (eleccion.analiticas || eleccion.publicitarias) {
      cargarGTM();
    }
  }

  /* --- Interfaz: banner y panel ------------------------------------------ */
  var banner = null;
  var panel = null;
  var botonConfigurar = null;
  var casillaAnaliticas = null;
  var casillaPublicitarias = null;
  var botonCerrar = null;
  var focoPrevio = null;

  function el(etiqueta, atributos, hijos) {
    var nodo = document.createElement(etiqueta);
    Object.keys(atributos || {}).forEach(function (k) {
      if (k === "texto") nodo.textContent = atributos[k];
      else nodo.setAttribute(k, atributos[k]);
    });
    (hijos || []).forEach(function (h) {
      nodo.appendChild(typeof h === "string" ? document.createTextNode(h) : h);
    });
    return nodo;
  }

  function categoria(id, nombre, descripcion, marcada, bloqueada) {
    var input = el("input", { type: "checkbox", id: id });
    input.checked = marcada;
    if (bloqueada) input.disabled = true;
    var cont = el("div", { "class": "consent__categoria" }, [
      input,
      el("label", { "for": id, texto: nombre }),
      el("p", { texto: descripcion })
    ]);
    return { nodo: cont, input: input };
  }

  function construir() {
    if (banner) return;

    var titulo = el("p", { "class": "meta consent__titulo", id: "consent-titulo", texto: "Cookies" });
    botonCerrar = el("button", { type: "button", "class": "boton-cerrar-consent", texto: "Cerrar" });
    botonCerrar.hidden = true;
    botonCerrar.addEventListener("click", cerrar);

    var enlacePolitica = el("a", { href: raiz + "legal/politica-cookies.html", texto: "Política de cookies" });

    var texto = el("p", { "class": "consent__texto", id: "consent-texto" }, [
      "Usamos cookies técnicas, necesarias para que la web funcione, y, solo si las aceptas, cookies analíticas y publicitarias para medir el uso del sitio y la eficacia de nuestros anuncios. Más información en la ",
      enlacePolitica,
      ". ",
      el("span", { "class": "pendiente", texto: "[PENDIENTE abogado: validar este texto]" })
    ]);

    var aceptar = el("button", { type: "button", "class": "boton-consent", texto: "Aceptar todas" });
    var rechazar = el("button", { type: "button", "class": "boton-consent", texto: "Rechazar todas" });
    botonConfigurar = el("button", {
      type: "button",
      "class": "boton-consent",
      "aria-expanded": "false",
      "aria-controls": "consent-panel",
      texto: "Configurar"
    });

    aceptar.addEventListener("click", function () { guardar(true, true); });
    rechazar.addEventListener("click", function () { guardar(false, false); });
    botonConfigurar.addEventListener("click", function () {
      mostrarPanel(panel.hidden);
    });

    var tecnicas = categoria("consent-tecnicas", "Técnicas (siempre activas)", "Recordar tu elección de cookies.", true, true);
    var analiticas = categoria("consent-analiticas", "Analíticas", "Google Analytics 4 y Microsoft Clarity: medir el uso del sitio y entender cómo se usa la página.", false, false);
    var publicitarias = categoria("consent-publicitarias", "Publicitarias", "Pixel de Meta: medir y optimizar los anuncios de Meta.", false, false);
    casillaAnaliticas = analiticas.input;
    casillaPublicitarias = publicitarias.input;

    var guardarEleccion = el("button", { type: "button", "class": "boton-consent", texto: "Guardar mi elección" });
    guardarEleccion.addEventListener("click", function () {
      guardar(casillaAnaliticas.checked, casillaPublicitarias.checked);
    });

    panel = el("div", { "class": "consent__panel", id: "consent-panel" }, [
      el("fieldset", {}, [
        el("legend", { "class": "visualmente-oculto", texto: "Categorías de cookies" }),
        tecnicas.nodo,
        analiticas.nodo,
        publicitarias.nodo
      ]),
      guardarEleccion
    ]);
    panel.hidden = true;

    banner = el("section", {
      "class": "consent",
      role: "region",
      "aria-labelledby": "consent-titulo",
      "aria-describedby": "consent-texto"
    }, [
      el("div", { "class": "contenedor consent__interior" }, [
        el("div", { "class": "consent__cabecera" }, [titulo, botonCerrar]),
        texto,
        el("div", { "class": "consent__botones" }, [aceptar, rechazar, botonConfigurar]),
        panel
      ])
    ]);
    banner.hidden = true;
    banner.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && eleccion) cerrar();
    });
    document.body.appendChild(banner);
  }

  function mostrarPanel(abrir) {
    panel.hidden = !abrir;
    botonConfigurar.setAttribute("aria-expanded", abrir ? "true" : "false");
    if (abrir) {
      casillaAnaliticas.checked = !!(eleccion && eleccion.analiticas);
      casillaPublicitarias.checked = !!(eleccion && eleccion.publicitarias);
    }
  }

  function abrir(conPanel) {
    construir();
    focoPrevio = document.activeElement;
    banner.hidden = false;
    botonCerrar.hidden = !eleccion;
    document.documentElement.classList.add("consent-abierto");
    mostrarPanel(!!conPanel);
    if (conPanel) {
      casillaAnaliticas.focus();
    }
  }

  function cerrar() {
    if (!banner) return;
    var teniaFoco = banner.contains(document.activeElement);
    banner.hidden = true;
    document.documentElement.classList.remove("consent-abierto");
    if (teniaFoco && focoPrevio && typeof focoPrevio.focus === "function" && document.contains(focoPrevio)) {
      focoPrevio.focus();
    }
  }

  function iniciarInterfaz() {
    document.addEventListener("click", function (ev) {
      var disparador = ev.target.closest && ev.target.closest("[data-abrir-cookies]");
      if (!disparador) return;
      ev.preventDefault();
      abrir(true);
    });
    if (!eleccion) abrir(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarInterfaz);
  } else {
    iniciarInterfaz();
  }

  /* API mínima para otros scripts y para depuración. */
  window.KDK_CONSENT = {
    abrir: function () { abrir(true); },
    estado: function () { return eleccion ? aEstado(eleccion) : null; }
  };
})();
