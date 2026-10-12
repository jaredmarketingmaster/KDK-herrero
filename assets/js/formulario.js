/*
 * Formulario de cualificación en dos pasos.
 *
 * - Paso 1 · Tu negocio (todo obligatorio) · Paso 2 · Contacto.
 * - Validación al pulsar "Continuar"/"Enviar" y al salir de cada campo tocado.
 * - Calcula "prioridad" y "revisar_expectativas" (no cambia nada de lo que ve el usuario).
 * - POST JSON a FORM_ENDPOINT. Si está vacío: console.info y éxito simulado.
 * - Tras el éxito, la página de gracias sustituye al formulario en el mismo
 *   contenedor y el estado se guarda en sessionStorage.
 * - Eventos: form_start, form_step_complete, form_error, generate_lead.
 *   Nunca se envían datos personales ni el Instagram al dataLayer.
 */
(function () {
  "use strict";

  var CFG = window.KDK_CONFIG || {};
  var form = document.getElementById("form-lead");
  var caja = document.querySelector("[data-form-caja]");
  if (!form || !caja) return;

  var CLAVE_LEAD = "kdk_lead";
  var CLAVE_UTM = "kdk_utm";
  var CLAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  var NECESIDADES_EXCLUIDAS = ["gestion-anuncios", "responder-comentarios-mensajes", "grabaciones-local"];
  var TIEMPO_MAXIMO_ENVIO = 15000;

  var CAMPOS_PASO = {
    1: ["tipo_negocio", "cargo", "instagram", "gestion_actual", "necesidades", "inversion_mensual", "plazo_inicio"],
    2: ["nombre", "negocio", "email", "telefono", "acepta_privacidad", "acepta_llamada_ia"]
  };

  /* --- Utilidades ------------------------------------------------------------ */
  function push(evento) {
    if (window.kdkPush) {
      window.kdkPush(evento);
    } else {
      (window.dataLayer = window.dataLayer || []).push(evento);
    }
  }

  function leerSesion(clave) {
    try {
      var v = window.sessionStorage.getItem(clave);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  function guardarSesion(clave, valor) {
    try {
      window.sessionStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) { /* sin sessionStorage: se sigue funcionando en esta visita */ }
  }

  function uuidv4() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    var b = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(b);
    } else {
      for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    }
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 0x100).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }

  function valorRadio(nombre) {
    var marcado = form.querySelector('input[name="' + nombre + '"]:checked');
    return marcado ? marcado.value : "";
  }

  function valoresCheckbox(nombre) {
    return Array.prototype.map.call(
      form.querySelectorAll('input[name="' + nombre + '"]:checked'),
      function (i) { return i.value; }
    );
  }

  function campo(nombre) {
    return form.querySelector('[data-campo="' + nombre + '"]');
  }

  /* --- UTM y fbclid: desde la URL, guardados en sessionStorage --------------- */
  var utm = (function capturarUtm() {
    var guardado = leerSesion(CLAVE_UTM) || {};
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return guardado;
    }
    var hayNuevos = CLAVES_UTM.some(function (k) { return params.get(k); });
    if (!hayNuevos) return guardado;
    var nuevos = {};
    CLAVES_UTM.forEach(function (k) {
      var v = params.get(k);
      if (v) nuevos[k] = v.slice(0, 500);
    });
    guardarSesion(CLAVE_UTM, nuevos);
    return nuevos;
  })();

  /* --- Normalización y validación ------------------------------------------ */
  var RUTAS_INSTAGRAM = /^(p|reel|reels|stories|explore|tv|accounts|direct)$/i;

  function normalizarInstagram(bruto) {
    var v = String(bruto || "").trim();
    if (!v) return { valido: false, vacio: true };
    var usuario;
    var url = v.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/([^\/?#\s]+)/i);
    if (url) {
      usuario = url[1];
    } else if (/[\/:]/.test(v)) {
      return { valido: false };
    } else {
      usuario = v.replace(/^@+/, "");
    }
    usuario = usuario.replace(/^@+/, "");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(usuario) || RUTAS_INSTAGRAM.test(usuario)) {
      return { valido: false };
    }
    return { valido: true, valor: "@" + usuario.toLowerCase() };
  }

  function normalizarTelefono(prefijo, bruto) {
    var digitos = String(bruto || "").replace(/\D/g, "");
    var cc = String(prefijo || "").replace(/\D/g, "");
    if (!digitos) return { vacio: true };
    /* Si se escribió el prefijo dentro del número (+34…, 0034…), se quita. */
    if (digitos.indexOf("00" + cc) === 0 && digitos.length > cc.length + 2 + 5) {
      digitos = digitos.slice(cc.length + 2);
    } else if (/^\s*\+/.test(String(bruto)) && digitos.indexOf(cc) === 0) {
      digitos = digitos.slice(cc.length);
    } else if (cc === "34" && digitos.length === 11 && digitos.indexOf("34") === 0) {
      digitos = digitos.slice(2);
    }
    var valido;
    if (prefijo === "+34") {
      valido = /^\d{9}$/.test(digitos);
    } else {
      valido = /^\d{6,14}$/.test(digitos) && (cc.length + digitos.length) <= 15;
    }
    return { valido: valido, nacional: digitos, e164: prefijo + digitos };
  }

  var RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

  function errorDe(nombre) {
    switch (nombre) {
      case "tipo_negocio":
        return valorRadio(nombre) ? "" : "Elige el tipo de negocio.";
      case "cargo":
        return valorRadio(nombre) ? "" : "Elige tu cargo.";
      case "gestion_actual":
      case "inversion_mensual":
      case "plazo_inicio":
        return valorRadio(nombre) ? "" : "Elige una opción.";
      case "necesidades":
        return valoresCheckbox(nombre).length ? "" : "Elige al menos una opción.";
      case "instagram": {
        var ig = normalizarInstagram(form.elements.instagram.value);
        if (ig.vacio) return "Escribe el Instagram de tu negocio.";
        return ig.valido ? "" : "Escribe un usuario de Instagram válido, por ejemplo @tunegocio, o el enlace a su perfil.";
      }
      case "nombre":
        return form.elements.nombre.value.trim() ? "" : "Escribe tu nombre.";
      case "negocio":
        return form.elements.negocio.value.trim() ? "" : "Escribe el nombre de tu negocio.";
      case "email": {
        var email = form.elements.email.value.trim();
        if (!email) return "Escribe tu email.";
        return RE_EMAIL.test(email) ? "" : "Escribe un email válido, por ejemplo nombre@tunegocio.es.";
      }
      case "telefono": {
        var prefijo = form.elements.telefono_prefijo.value;
        var tel = normalizarTelefono(prefijo, form.elements.telefono.value);
        if (tel.vacio) return "Escribe tu teléfono móvil.";
        if (tel.valido) return "";
        return prefijo === "+34"
          ? "El número debe tener 9 dígitos."
          : "Escribe un número válido, sin el prefijo.";
      }
      case "acepta_privacidad":
        return form.elements.acepta_privacidad.checked ? "" : "Para continuar, acepta la política de privacidad.";
      case "acepta_llamada_ia":
        return form.elements.acepta_llamada_ia.checked ? "" : "Para continuar, acepta recibir la llamada del asistente.";
      default:
        return "";
    }
  }

  function controlesDe(nombre) {
    return Array.prototype.slice.call(form.querySelectorAll('[name="' + nombre + '"]'));
  }

  function anadirDescribedBy(nodo, id) {
    var ids = (nodo.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (ids.indexOf(id) === -1) ids.push(id);
    nodo.setAttribute("aria-describedby", ids.join(" "));
  }

  function quitarDescribedBy(nodo, id) {
    var ids = (nodo.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) {
      return x && x !== id;
    });
    if (ids.length) nodo.setAttribute("aria-describedby", ids.join(" "));
    else nodo.removeAttribute("aria-describedby");
  }

  function pintarError(nombre, mensaje) {
    var contenedor = campo(nombre);
    if (!contenedor) return;
    var nodoError = document.getElementById("error-" + nombre);
    var controles = controlesDe(nombre);
    var esCasilla = contenedor.classList.contains("casilla");
    if (mensaje) {
      if (nodoError) nodoError.textContent = mensaje;
      contenedor.classList.add(esCasilla ? "casilla--error" : "campo--error");
      controles.forEach(function (c) {
        c.setAttribute("aria-invalid", "true");
        if (nodoError) anadirDescribedBy(c, nodoError.id);
      });
    } else {
      if (nodoError) nodoError.textContent = "";
      contenedor.classList.remove("casilla--error", "campo--error");
      controles.forEach(function (c) {
        c.removeAttribute("aria-invalid");
        if (nodoError) quitarDescribedBy(c, nodoError.id);
      });
    }
  }

  var tocados = {};

  function validarCampo(nombre) {
    var mensaje = errorDe(nombre);
    pintarError(nombre, mensaje);
    return !mensaje;
  }

  function validarPaso(paso) {
    var invalidos = [];
    CAMPOS_PASO[paso].forEach(function (nombre) {
      tocados[nombre] = true;
      if (!validarCampo(nombre)) invalidos.push(nombre);
    });
    return invalidos;
  }

  function enfocarCampo(nombre) {
    var controles = controlesDe(nombre);
    if (!controles.length) return;
    var objetivo = controles.filter(function (c) { return c.checked; })[0] || controles[0];
    objetivo.focus();
  }

  function nombreDeControl(control) {
    var contenedor = control.closest("[data-campo]");
    return contenedor ? contenedor.getAttribute("data-campo") : null;
  }

  /* Validación al salir de un campo tocado (para grupos, al salir del grupo). */
  form.addEventListener("focusout", function (ev) {
    var nombre = nombreDeControl(ev.target);
    if (!nombre || nombre === "comentario") return;
    var contenedor = campo(nombre);
    if (ev.relatedTarget && contenedor && contenedor.contains(ev.relatedTarget)) return;
    tocados[nombre] = true;
    if (nombre === "instagram") {
      var ig = normalizarInstagram(form.elements.instagram.value);
      if (ig.valido) form.elements.instagram.value = ig.valor;
    }
    validarCampo(nombre);
  });

  /* Si un campo ya muestra error, se revalida mientras se corrige. */
  function revalidar(ev) {
    var nombre = nombreDeControl(ev.target);
    if (!nombre) return;
    if (ev.target.name === "telefono_prefijo") nombre = "telefono";
    if (tocados[nombre]) validarCampo(nombre);
  }
  form.addEventListener("input", revalidar);
  form.addEventListener("change", revalidar);

  /* --- Contador del comentario ------------------------------------------- */
  var comentario = form.elements.comentario;
  var contador = document.getElementById("contador-comentario");
  function actualizarContador() {
    if (contador) contador.textContent = comentario.value.length + " / 500 caracteres";
  }
  if (comentario) {
    comentario.addEventListener("input", actualizarContador);
    actualizarContador();
  }

  /* --- form_start: primera interacción ---------------------------------- */
  var iniciado = false;
  function marcarInicio() {
    if (iniciado) return;
    iniciado = true;
    push({ event: "form_start" });
  }
  ["focusin", "pointerdown", "change", "input"].forEach(function (tipo) {
    form.addEventListener(tipo, marcarInicio, { once: true });
  });

  /* --- Cálculos internos --------------------------------------------------- */
  function calcularRevisarExpectativas(necesidades) {
    if (!necesidades.length) return false;
    return necesidades.every(function (n) { return NECESIDADES_EXCLUIDAS.indexOf(n) !== -1; });
  }

  function calcularPrioridad(d) {
    if (d.tipo_negocio === "otro") return "fuera_de_alcance";
    var inversionAlta = d.inversion_mensual === "1000-1500" || d.inversion_mensual === "mas-1500";
    var plazoCercano = d.plazo_inicio === "este-mes" || d.plazo_inicio === "proximos-3-meses";
    if (d.cargo !== "otro" && inversionAlta && plazoCercano) return "alta";
    if (d.inversion_mensual === "menos-1000" || d.plazo_inicio === "solo-informando") return "baja";
    return "media";
  }

  function datosPaso1() {
    var d = {
      tipo_negocio: valorRadio("tipo_negocio"),
      cargo: valorRadio("cargo"),
      gestion_actual: valorRadio("gestion_actual"),
      necesidades: valoresCheckbox("necesidades"),
      inversion_mensual: valorRadio("inversion_mensual"),
      plazo_inicio: valorRadio("plazo_inicio")
    };
    d.prioridad = calcularPrioridad(d);
    d.revisar_expectativas = calcularRevisarExpectativas(d.necesidades);
    return d;
  }

  /* --- Navegación entre pasos -------------------------------------------- */
  var pasos = {
    1: form.querySelector('[data-paso="1"]'),
    2: form.querySelector('[data-paso="2"]')
  };
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function irAPaso(n) {
    Object.keys(pasos).forEach(function (k) {
      pasos[k].setAttribute("data-activo", String(Number(k) === n));
    });
    form.setAttribute("data-paso-actual", String(n));
    /* Reinicia la animación de entrada del paso (solo visual). */
    pasos[n].classList.remove("is-entrando");
    void pasos[n].offsetWidth;
    pasos[n].classList.add("is-entrando");
    var titulo = pasos[n].querySelector(".formulario__paso-titulo");
    var caja_ = caja.getBoundingClientRect();
    if (caja_.top < 0 || caja_.top > window.innerHeight * 0.5) {
      caja.scrollIntoView({ block: "start", behavior: reducido ? "auto" : "smooth" });
    }
    if (titulo) titulo.focus({ preventScroll: true });
  }

  var pasoCompletadoEnviado = false;

  function pasoActivo() {
    return pasos[2].getAttribute("data-activo") === "true" ? 2 : 1;
  }

  function continuar() {
    var invalidos = validarPaso(1);
    if (invalidos.length) {
      invalidos.forEach(function (nombre) { push({ event: "form_error", step: 1, field: nombre }); });
      enfocarCampo(invalidos[0]);
      return;
    }
    var ig = normalizarInstagram(form.elements.instagram.value);
    if (ig.valido) form.elements.instagram.value = ig.valor;

    var d = datosPaso1();
    form.elements.prioridad.value = d.prioridad;
    form.elements.revisar_expectativas.value = String(d.revisar_expectativas);
    if (!pasoCompletadoEnviado) {
      pasoCompletadoEnviado = true;
      push({
        event: "form_step_complete",
        step: 1,
        tipo_negocio: d.tipo_negocio,
        cargo: d.cargo,
        gestion_actual: d.gestion_actual,
        necesidades: d.necesidades,
        inversion_mensual: d.inversion_mensual,
        plazo_inicio: d.plazo_inicio,
        prioridad: d.prioridad,
        revisar_expectativas: d.revisar_expectativas
      });
    }
    irAPaso(2);
  }

  form.querySelector('[data-accion="continuar"]').addEventListener("click", continuar);

  form.querySelector('[data-accion="volver"]').addEventListener("click", function () {
    irAPaso(1);
  });

  /* --- Envío -------------------------------------------------------------- */
  var botonEnviar = form.querySelector('button[type="submit"]');
  var contenidoBoton = botonEnviar.innerHTML;
  var errorEnvio = form.querySelector("[data-error-envio]");
  var enviando = false;
  var eventIdPendiente = null;

  function bloquearEnvio(bloquear) {
    enviando = bloquear;
    botonEnviar.disabled = bloquear;
    if (bloquear) {
      botonEnviar.setAttribute("aria-busy", "true");
      botonEnviar.textContent = "Enviando…";
    } else {
      botonEnviar.removeAttribute("aria-busy");
      botonEnviar.innerHTML = contenidoBoton;
    }
  }

  function mostrarErrorEnvio(texto) {
    errorEnvio.textContent = texto;
    errorEnvio.hidden = !texto;
  }

  function construirDatos(eventId) {
    var d1 = datosPaso1();
    var ig = normalizarInstagram(form.elements.instagram.value);
    var tel = normalizarTelefono(form.elements.telefono_prefijo.value, form.elements.telefono.value);
    var datos = {
      tipo_negocio: d1.tipo_negocio,
      cargo: d1.cargo,
      instagram: ig.valor,
      gestion_actual: d1.gestion_actual,
      necesidades: d1.necesidades,
      inversion_mensual: d1.inversion_mensual,
      plazo_inicio: d1.plazo_inicio,
      nombre: form.elements.nombre.value.trim(),
      negocio: form.elements.negocio.value.trim(),
      email: form.elements.email.value.trim().toLowerCase(),
      telefono: tel.e164,
      comentario: form.elements.comentario.value.trim().slice(0, 500),
      acepta_privacidad: form.elements.acepta_privacidad.checked,
      acepta_llamada_ia: form.elements.acepta_llamada_ia.checked,
      acepta_comunicaciones: form.elements.acepta_comunicaciones.checked,
      acepta_medicion_publicitaria: form.elements.acepta_medicion_publicitaria.checked,
      utm_source: utm.utm_source || "",
      utm_medium: utm.utm_medium || "",
      utm_campaign: utm.utm_campaign || "",
      utm_content: utm.utm_content || "",
      utm_term: utm.utm_term || "",
      fbclid: utm.fbclid || "",
      event_id: eventId,
      prioridad: d1.prioridad,
      revisar_expectativas: d1.revisar_expectativas,
      landing_url: window.location.href,
      timestamp: new Date().toISOString()
    };
    /* Se reflejan también en los campos ocultos del formulario. */
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid",
      "event_id", "prioridad", "revisar_expectativas", "landing_url", "timestamp"].forEach(function (k) {
      if (form.elements[k]) form.elements[k].value = String(datos[k]);
    });
    return datos;
  }

  function enviarAlEndpoint(datos) {
    var endpoint = String(CFG.FORM_ENDPOINT || "").trim();
    if (!endpoint) {
      console.info("[KDK] FORM_ENDPOINT vacío: modo de desarrollo, no se envía nada. Datos del formulario:", datos);
      return Promise.resolve();
    }
    var controlador = typeof AbortController === "function" ? new AbortController() : null;
    var temporizador = controlador ? setTimeout(function () { controlador.abort(); }, TIEMPO_MAXIMO_ENVIO) : null;
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(datos),
      signal: controlador ? controlador.signal : undefined
    }).then(function (respuesta) {
      if (temporizador) clearTimeout(temporizador);
      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    }, function (error) {
      if (temporizador) clearTimeout(temporizador);
      throw error;
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enviando) return;
    /* Intro en un campo del paso 1 equivale a "Continuar". */
    if (pasoActivo() === 1) {
      continuar();
      return;
    }
    mostrarErrorEnvio("");

    /* Por si se llega aquí sin pasar por "Continuar" (por ejemplo, con Intro). */
    var invalidos1 = validarPaso(1);
    if (invalidos1.length) {
      invalidos1.forEach(function (nombre) { push({ event: "form_error", step: 1, field: nombre }); });
      irAPaso(1);
      enfocarCampo(invalidos1[0]);
      return;
    }
    var invalidos2 = validarPaso(2);
    if (invalidos2.length) {
      invalidos2.forEach(function (nombre) { push({ event: "form_error", step: 2, field: nombre }); });
      enfocarCampo(invalidos2[0]);
      return;
    }

    var nombre = form.elements.nombre.value.trim();

    /* Campo trampa: si viene relleno, se simula el éxito y no se envía nada. */
    if (form.elements.website && form.elements.website.value) {
      mostrarGracias(nombre, true);
      return;
    }

    if (!eventIdPendiente) eventIdPendiente = uuidv4();
    var datos = construirDatos(eventIdPendiente);

    bloquearEnvio(true);
    enviarAlEndpoint(datos).then(function () {
      push({
        event: "generate_lead",
        event_id: datos.event_id,
        tipo_negocio: datos.tipo_negocio,
        cargo: datos.cargo,
        gestion_actual: datos.gestion_actual,
        necesidades: datos.necesidades,
        inversion_mensual: datos.inversion_mensual,
        plazo_inicio: datos.plazo_inicio,
        prioridad: datos.prioridad,
        revisar_expectativas: datos.revisar_expectativas,
        acepta_comunicaciones: datos.acepta_comunicaciones,
        acepta_medicion_publicitaria: datos.acepta_medicion_publicitaria,
        utm_source: datos.utm_source,
        utm_medium: datos.utm_medium,
        utm_campaign: datos.utm_campaign,
        utm_content: datos.utm_content,
        utm_term: datos.utm_term
      });
      guardarSesion(CLAVE_LEAD, { enviado: true, nombre: nombre });
      mostrarGracias(nombre, true);
    }).catch(function () {
      bloquearEnvio(false);
      push({ event: "form_error", step: 2, field: "envio" });
      mostrarErrorEnvio("No hemos podido enviar el formulario. Inténtalo de nuevo en unos segundos.");
      botonEnviar.focus();
    });
  });

  /* --- Página de gracias ------------------------------------------------- */
  function telefonoAsistente() {
    return String(CFG.TELEFONO_ASISTENTE || "").trim();
  }

  function enlaceVcard(numero) {
    var tel = numero.replace(/[^\d+]/g, "");
    var vcf = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:;KDK Design — Asistente;;;",
      "FN:KDK Design — Asistente",
      "ORG:KDK Design",
      "TEL;TYPE=CELL,VOICE:" + tel,
      "END:VCARD",
      ""
    ].join("\r\n");
    var a = document.createElement("a");
    a.className = "enlace-flecha";
    a.download = "kdk-design-asistente.vcf";
    try {
      a.href = URL.createObjectURL(new Blob([vcf], { type: "text/vcard;charset=utf-8" }));
    } catch (e) {
      a.href = "data:text/vcard;charset=utf-8," + encodeURIComponent(vcf);
    }
    a.appendChild(document.createTextNode("Guardar el número en mis contactos "));
    var flecha = document.createElement("span");
    flecha.className = "flecha";
    flecha.setAttribute("aria-hidden", "true");
    flecha.textContent = "→";
    a.appendChild(flecha);
    return a;
  }

  function mostrarGracias(nombre, enfocar) {
    var numero = telefonoAsistente();
    var bloque = document.createElement("div");
    bloque.className = "gracias";
    bloque.setAttribute("tabindex", "-1");

    /* Flor de la marca dibujada a línea (decorativa). */
    var flor = document.querySelector("[data-plantilla-flor]");
    if (flor && flor.content) {
      var ornamento = flor.content.cloneNode(true);
      bloque.appendChild(ornamento);
    }

    var titulo = document.createElement("h3");
    titulo.textContent = nombre ? "Gracias, " + nombre + "." : "Gracias.";
    bloque.appendChild(titulo);

    var texto = document.createElement("p");
    texto.textContent = "Ten el móvil a mano: en unos minutos te llamará el asistente de inteligencia artificial de KDK Design" +
      (numero ? " desde el " + numero : "") +
      " para agendar la reunión. Mientras tanto, prepara ejemplos de contenido que te gusten; nos ayudarán a entender tu marca.";
    bloque.appendChild(texto);

    if (numero) bloque.appendChild(enlaceVcard(numero));

    caja.innerHTML = "";
    caja.appendChild(bloque);
    document.documentElement.classList.add("lead-enviado");
    if (enfocar) bloque.focus();
  }

  /* Si ya se envió en esta sesión, se muestra directamente la página de gracias. */
  var estado = leerSesion(CLAVE_LEAD);
  if (estado && estado.enviado) {
    mostrarGracias(typeof estado.nombre === "string" ? estado.nombre : "", false);
  }
})();
