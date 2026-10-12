/*
 * Secciones que dependen de material del cliente:
 *   05 · El vídeo premium: solo existe si VIDEO_URL tiene valor.
 *   06 · Portafolio: solo existe si PORTAFOLIO tiene al menos 3 piezas válidas.
 * Si no se cumplen las condiciones, no se añade nada al DOM.
 * Se insertan justo después de la sección #incluye (04).
 */
(function () {
  "use strict";

  var CFG = window.KDK_CONFIG || {};
  var ancla = document.getElementById("incluye");
  if (!ancla) return;

  var MIN_PIEZAS = 3;
  var MAX_PIEZAS = 9;

  function el(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto) nodo.textContent = texto;
    return nodo;
  }

  function cabecera(idTitulo, titulo) {
    var header = el("header", "seccion__cabecera");
    header.setAttribute("data-reveal", "");
    var num = el("span", "num");
    num.setAttribute("data-num", "");
    num.setAttribute("aria-hidden", "true");
    var h2 = el("h2", "", titulo);
    h2.id = idTitulo;
    header.appendChild(num);
    header.appendChild(h2);
    return header;
  }

  function etiquetas(pie, ia, concepto) {
    if (ia) pie.appendChild(el("span", "etiqueta", "Creado con IA"));
    if (concepto) pie.appendChild(el("span", "etiqueta etiqueta--concepto", "Concepto"));
  }

  /* CTA con el mismo marcado que los del HTML: el texto duplicado
     (aria-hidden) solo sirve para el efecto de rodillo al pasar el ratón. */
  function crearCta(texto, ubicacion) {
    var cta = el("a", "cta");
    cta.href = "#formulario";
    cta.setAttribute("data-cta", ubicacion);
    var rodillo = el("span", "cta__texto");
    rodillo.appendChild(el("span", "cta__linea", texto));
    var copia = el("span", "cta__linea", texto);
    copia.setAttribute("aria-hidden", "true");
    rodillo.appendChild(copia);
    cta.appendChild(rodillo);
    cta.appendChild(document.createTextNode(" "));
    var flecha = el("span", "flecha", "→");
    flecha.setAttribute("aria-hidden", "true");
    cta.appendChild(flecha);
    return cta;
  }

  function seccion(idTitulo) {
    var s = el("section", "seccion");
    s.setAttribute("data-seccion", "");
    s.setAttribute("aria-labelledby", idTitulo);
    return s;
  }

  /* --- 05 · Vídeo premium -------------------------------------------------- */
  function crearVideo() {
    var url = String(CFG.VIDEO_URL || "").trim();
    if (!url) return null;

    var s = seccion("titulo-video");
    s.classList.add("video");
    var cont = el("div", "contenedor rejilla");

    cont.appendChild(cabecera("titulo-video", "Un vídeo publicitario con estética de gran marca, cada mes"));

    var texto = el("div", "video__texto");
    texto.setAttribute("data-reveal", "");
    texto.appendChild(el("p", "", "Planos verticales, macros y animaciones realistas, pensados para anuncios y para destacar en el feed."));
    texto.appendChild(crearCta("Ver si encajamos", "video"));

    var figura = el("figure", "video__pieza marco");
    figura.setAttribute("data-reveal", "");
    var video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-label", "Vídeo publicitario premium de KDK Design");
    var poster = String(CFG.VIDEO_POSTER || "").trim();
    if (poster) video.poster = poster;
    video.src = url;

    var primeraVez = true;
    video.addEventListener("play", function () {
      if (!primeraVez) return;
      primeraVez = false;
      if (window.kdkPush) window.kdkPush({ event: "video_play" });
    });

    var pie = el("figcaption", "marco__pie");
    etiquetas(pie, true, false);
    pie.appendChild(el("span", "pendiente", "[PENDIENTE: confirmar etiquetas]"));

    figura.appendChild(video);
    figura.appendChild(pie);

    /* Bajo la cabecera: el texto en su columna y el vídeo vertical en la suya. */
    cont.appendChild(texto);
    cont.appendChild(figura);
    s.appendChild(cont);
    return s;
  }

  /* --- 06 · Portafolio ------------------------------------------------------ */
  function piezasValidas() {
    var lista = Array.isArray(CFG.PORTAFOLIO) ? CFG.PORTAFOLIO : [];
    return lista.filter(function (p) {
      return p && typeof p.src === "string" && p.src.trim() &&
        typeof p.alt === "string" && p.alt.trim();
    }).slice(0, MAX_PIEZAS);
  }

  function crearPortafolio() {
    var piezas = piezasValidas();
    if (piezas.length < MIN_PIEZAS) return null;

    var s = seccion("titulo-portafolio");
    var cont = el("div", "contenedor rejilla");
    cont.appendChild(cabecera("titulo-portafolio", "Cada pieza, tratada como portada"));

    var rejilla = el("div", "portafolio");
    piezas.forEach(function (p) {
      var figura = el("figure", "marco");
      figura.setAttribute("data-reveal", "");
      var foto = el("div", "foto");
      var img = document.createElement("img");
      img.src = p.src.trim();
      img.alt = p.alt.trim();
      img.loading = "lazy";
      img.decoding = "async";
      img.setAttribute("data-parallax", "");
      foto.appendChild(img);
      figura.appendChild(foto);

      var pie = el("figcaption", "marco__pie");
      if (typeof p.sector === "string" && p.sector.trim()) {
        pie.appendChild(el("span", "meta", p.sector.trim()));
      }
      etiquetas(pie, p.ia === true, p.concepto === true);
      if (pie.childNodes.length) figura.appendChild(pie);
      rejilla.appendChild(figura);
    });

    cont.appendChild(rejilla);
    s.appendChild(cont);
    return s;
  }

  var video = crearVideo();
  var portafolio = crearPortafolio();
  var referencia = ancla;
  [video, portafolio].forEach(function (nodo) {
    if (!nodo) return;
    referencia.insertAdjacentElement("afterend", nodo);
    referencia = nodo;
  });
})();
