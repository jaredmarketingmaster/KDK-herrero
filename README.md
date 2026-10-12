# KDK Design · Landing

Landing de captación para **KDK Design** (tráfico de Meta Ads en España). Sitio estático en HTML, CSS y JavaScript vanilla: sin frameworks, sin paso de compilación y sin dependencias externas. Todas las rutas internas son relativas, así que funciona en la raíz de un dominio o en un subdirectorio.

> **Estado:** maqueta completa y probada, **no publicable todavía**. Quedan datos marcados como `[PENDIENTE: …]` (fondo amarillo, clase `.pendiente`) que hay que completar antes de lanzar. Están todos en la sección 2.

---

## 1. Estructura

```
/index.html                      Landing
/legal/aviso-legal.html          Borrador para revisión del abogado
/legal/politica-privacidad.html  Borrador para revisión del abogado
/legal/politica-cookies.html     Borrador para revisión del abogado
/404.html
/assets/css/styles.css           Tokens de marca y estilos
/assets/js/config.js             Constantes configurables (lo único que hay que editar)
/assets/js/consent.js            Banner y panel de cookies, Consent Mode v2 y carga de GTM
/assets/js/datalayer.js          Helper del dataLayer, cta_click y faq_open
/assets/js/formulario.js         Formulario en dos pasos, validación, envío y página de gracias
/assets/js/portafolio.js         Secciones de vídeo y portafolio (solo si hay material)
/assets/js/main.js               Numeración de secciones, movimiento editorial, barra fija, pie
/assets/fonts/                   Inter y Playfair Display autoalojadas (WOFF2) + licencias OFL
/assets/img/logo-kdk.webp        Logo (fondo eliminado y recortado a partir del archivo aportado)
/assets/img/favicon.png          Favicon (flor del logo)
/assets/img/apple-touch-icon.png Icono para iOS (flor del logo sobre crema)
/assets/img/foto-equipo.jpg      MARCADOR AMARILLO: sustituir por la foto real
/assets/portafolio/              Vacía: aquí van las piezas del portafolio
/.nojekyll                       GitHub Pages sirve los archivos tal cual
/.htaccess                       Caché y compresión en Hostinger / Apache / LiteSpeed
```

`main.js` no estaba en la estructura del encargo: se ha añadido para el comportamiento general de la página (ver sección 9).

---

## 2. Pendientes agrupados por responsable

### Cliente (KDK)

| Pendiente | Dónde |
| --- | --- |
| Razón social (titular legal), NIF y domicilio | Pie de todas las páginas · `legal/aviso-legal.html` §1 y §4 · `legal/politica-privacidad.html` §1 |
| Teléfono y datos registrales (provincia, tomo, folio, hoja) | `legal/aviso-legal.html` §1 |
| Email de contacto verificado (comprobar que `hola@kdkdesign.es` existe antes de usarlo) | `EMAIL_CONTACTO` en `config.js` (pie) · `legal/aviso-legal.html` §1 · `legal/politica-privacidad.html` §1 y §8 |
| Portafolio: entre 6 y 9 piezas (la sección aparece a partir de 3) | Archivos en `assets/portafolio/` y lista `PORTAFOLIO` en `config.js` |
| Vídeo publicitario premium y su póster | `VIDEO_URL` y `VIDEO_POSTER` en `config.js` |
| Foto del equipo | Sustituir `assets/img/foto-equipo.jpg` (ahora es un marcador amarillo) y ajustar `width`/`height` del `<img>` en `index.html` a las medidas reales |
| Nombre y cargo de quien aparece en la foto | `PIE_FOTO_EQUIPO` en `config.js` |
| Etiquetas "Creado con IA" y "Concepto" del vídeo | Pie del vídeo en `assets/js/portafolio.js` (`[PENDIENTE: confirmar etiquetas]`). Si el vídeo es un concepto, cambiar `etiquetas(pie, true, false)` por `etiquetas(pie, true, true)` y borrar el marcador |
| Etiquetas de cada pieza del portafolio | Campos `ia` y `concepto` de cada pieza en `config.js` |

### Abogado

| Pendiente | Dónde |
| --- | --- |
| Revisión completa de los tres borradores legales y fecha de "Última actualización" | Marcador al principio de cada página de `legal/` |
| Bases legales (revisión del perfil de Instagram; medición con Meta) | `legal/politica-privacidad.html` §3 |
| Casilla de Meta (`acepta_medicion_publicitaria`): mantener o eliminar | `index.html`, paso 2 del formulario · `legal/politica-privacidad.html` §3 y §6 |
| Textos de consentimiento: casillas del formulario y texto del banner de cookies | `index.html` (marcador sobre las casillas) · `assets/js/consent.js` (texto del banner y descripciones de categorías) |
| Plazo de conservación | `legal/politica-privacidad.html` §5 |
| Grabación o transcripción de la llamada del asistente | `legal/politica-privacidad.html` §4 |
| Acceso del equipo comercial desde fuera del EEE y garantías de las transferencias | `legal/politica-privacidad.html` §6 y §7 |
| Meta: encargado o corresponsable del tratamiento | `legal/politica-privacidad.html` §6 |
| Delegado de protección de datos (o eliminar la línea) | `legal/politica-privacidad.html` §1 |
| Filas `[VERIFICAR]` (Google, Microsoft y duraciones de cookies) | `legal/politica-privacidad.html` §6 · `legal/politica-cookies.html` §2 |
| Etiquetado del contenido generado con IA | Etiquetas del vídeo y del portafolio · `legal/aviso-legal.html` §4 |

### Jared

| Pendiente | Dónde |
| --- | --- |
| `GTM_ID` | `config.js` |
| `FORM_ENDPOINT` (debe aceptar CORS, ver sección 6) | `config.js` |
| `TELEFONO_ASISTENTE` | `config.js` |
| Proveedores: alojamiento, CRM, setter de IA, calendario y email (nombre, país y garantías) | `legal/politica-privacidad.html` §6 |
| Lista de cookies real: eliminar las filas de herramientas que no se instalen y escanear las cookies una vez publicado | `legal/politica-cookies.html` §2 |
| API de conversiones de Meta en el servidor (ver sección 5.4) | Sistema que recibe `FORM_ENDPOINT` |
| Despliegue (sección 8) | — |

---

## 3. Constantes (`assets/js/config.js`)

| Constante | Qué hace | Si está vacía |
| --- | --- | --- |
| `GTM_ID` | ID del contenedor de Google Tag Manager (`GTM-XXXXXXX`) | GTM no se carga nunca |
| `FORM_ENDPOINT` | URL que recibe el JSON del formulario por `POST` | Modo de desarrollo: `console.info` con los datos y éxito simulado |
| `VIDEO_URL` | URL del vídeo vertical premium | La sección 05 no existe en el DOM |
| `VIDEO_POSTER` | Imagen de póster del vídeo | El vídeo se muestra sin póster |
| `TELEFONO_ASISTENTE` | Número desde el que llama el asistente de IA | La página de gracias no muestra número ni enlace `.vcf` |
| `EMAIL_CONTACTO` | Email del pie | Se ve `[PENDIENTE: email de contacto]` |
| `PIE_FOTO_EQUIPO` | Nombre y cargo bajo la foto del equipo | Se ve `[PENDIENTE: nombre y cargo]` |
| `PORTAFOLIO` | Lista de piezas `{ src, alt, sector, ia, concepto }` | Con menos de 3 piezas válidas, la sección 06 no existe en el DOM. Se muestran como máximo 9 |

Nunca pongas claves ni secretos en `config.js`: es un archivo público.

Las secciones se numeran solas (01, 02…) según las que existan: 01–11 sin vídeo ni portafolio, 01–13 con ambos.

---

## 4. Formulario

Dos pasos con indicador "01 / 02". Validación al pulsar "Continuar"/"Enviar" y al salir de cada campo tocado; mensajes en `--error` con `aria-invalid` y `aria-describedby`; el foco va al primer error. Intro en un campo del paso 1 equivale a "Continuar".

### 4.1 Tabla de *slugs*

| Campo | Etiqueta visible | *Slug* |
| --- | --- | --- |
| `tipo_negocio` | Hotel | `hotel` |
| | Apartamentos turísticos | `apartamentos-turisticos` |
| | Discoteca | `discoteca` |
| | Beach club | `beach-club` |
| | Restaurante | `restaurante` |
| | Otro | `otro` |
| `cargo` | Propietario o fundador | `propietario-fundador` |
| | Gerente o director | `gerente-director` |
| | Responsable de marketing o comunicación | `responsable-marketing` |
| | Otro | `otro` |
| `gestion_actual` | Nadie de forma constante | `nadie` |
| | Alguien del equipo | `alguien-del-equipo` |
| | Una agencia o freelance | `agencia-freelance` |
| `necesidades` (varias, mínimo 1) | Publicaciones e historias | `publicaciones-historias` |
| | Vídeos publicitarios | `videos-publicitarios` |
| | Gestión de anuncios | `gestion-anuncios` |
| | Responder comentarios y mensajes | `responder-comentarios-mensajes` |
| | Grabaciones en el local | `grabaciones-local` |
| `inversion_mensual` (importes en euros) | Menos de 1.000 | `menos-1000` |
| | Entre 1.000 y 1.500 | `1000-1500` |
| | Más de 1.500 | `mas-1500` |
| | Aún no lo sé | `no-lo-se` |
| `plazo_inicio` | Este mes | `este-mes` |
| | En los próximos 3 meses | `proximos-3-meses` |
| | Más adelante | `mas-adelante` |
| | Solo me estoy informando | `solo-informando` |

### 4.2 Cálculos internos (no cambian nada de lo que ve el usuario)

- `revisar_expectativas = true` si en `necesidades` **solo** hay `gestion-anuncios`, `responder-comentarios-mensajes` y/o `grabaciones-local`.
- `prioridad` (se evalúa en este orden):
  1. `fuera_de_alcance`: `tipo_negocio = otro`.
  2. `alta`: `cargo ≠ otro`, `inversion_mensual` en `1000-1500` o `mas-1500`, y `plazo_inicio` en `este-mes` o `proximos-3-meses`.
  3. `baja`: `inversion_mensual = menos-1000` o `plazo_inicio = solo-informando`.
  4. `media`: el resto.

### 4.3 JSON que recibe `FORM_ENDPOINT`

```json
{
  "tipo_negocio": "hotel",
  "cargo": "propietario-fundador",
  "instagram": "@minegocio",
  "gestion_actual": "nadie",
  "necesidades": ["publicaciones-historias", "videos-publicitarios"],
  "inversion_mensual": "1000-1500",
  "plazo_inicio": "este-mes",
  "nombre": "…",
  "negocio": "…",
  "email": "…",
  "telefono": "+34600000000",
  "comentario": "…",
  "acepta_privacidad": true,
  "acepta_llamada_ia": true,
  "acepta_comunicaciones": false,
  "acepta_medicion_publicitaria": false,
  "utm_source": "…", "utm_medium": "…", "utm_campaign": "…", "utm_content": "…", "utm_term": "…",
  "fbclid": "…",
  "event_id": "UUID v4",
  "prioridad": "alta",
  "revisar_expectativas": false,
  "landing_url": "https://…",
  "timestamp": "2026-01-01T10:00:00.000Z"
}
```

- `instagram` se normaliza a `@usuario` (acepta `@usuario`, `usuario` o la URL del perfil).
- `telefono` va en formato E.164 (prefijo + número). Con +34 se exigen 9 dígitos; con otros prefijos, de 6 a 14 dígitos.
- `utm_*` y `fbclid` se leen de la URL y se guardan en `sessionStorage` (`kdk_utm`).
- `event_id` se genera al enviar y se reutiliza si hay que reintentar, para que el servidor pueda deduplicar.
- Campo trampa `website`: si llega relleno, se simula el éxito y no se envía nada (ni se registra `generate_lead`).
- Si el envío falla o tarda más de 15 s: "No hemos podido enviar el formulario. Inténtalo de nuevo en unos segundos.", sin perder datos.
- Tras el éxito, la página de gracias sustituye al formulario y persiste al recargar (`sessionStorage`, clave `kdk_lead`).

**CORS:** el formulario envía `Content-Type: application/json` desde el navegador, así que el endpoint debe responder a la petición previa `OPTIONS` con `Access-Control-Allow-Origin` (el dominio de la landing), `Access-Control-Allow-Methods: POST` y `Access-Control-Allow-Headers: Content-Type`, y devolver un código 2xx en el `POST`. Sin eso, el navegador da el envío por fallido aunque el servidor lo haya recibido.

---

## 5. Medición: dataLayer, GTM y consentimiento

### 5.1 Reglas

- Ningún `dataLayer.push` lleva nombre, email, teléfono, negocio, Instagram ni comentario. `kdkPush()` (en `datalayer.js`) además elimina esas claves si alguien las añade por error.
- `window.dataLayer = window.dataLayer || [];` antes de cualquier push.
- GTM solo se carga si `GTM_ID` tiene valor **y** el usuario ha aceptado al menos una categoría no técnica (ver 5.3).

### 5.2 Eventos

| `event` | Cuándo | Parámetros |
| --- | --- | --- |
| `cta_click` | Clic en cualquier "Ver si encajamos" | `cta_location`: `hero` · `video` · `sticky` |
| `video_play` | Primera reproducción del vídeo | — |
| `form_start` | Primera interacción con el formulario | — |
| `form_step_complete` | Paso 1 válido (una vez por carga de página) | `step: 1`, `tipo_negocio`, `cargo`, `gestion_actual`, `necesidades` (lista de *slugs*), `inversion_mensual`, `plazo_inicio`, `prioridad`, `revisar_expectativas` |
| `form_error` | Error al avanzar o al enviar (un evento por campo con error) | `step`, `field` (nombre del campo; `envio` si falla el envío al servidor) |
| `generate_lead` | Envío correcto | `event_id`, `tipo_negocio`, `cargo`, `gestion_actual`, `necesidades`, `inversion_mensual`, `plazo_inicio`, `prioridad`, `revisar_expectativas`, `acepta_comunicaciones`, `acepta_medicion_publicitaria`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` |
| `faq_open` | Se abre una pregunta | `faq_question` |
| `consent_update` | Se guarda la elección de cookies | `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` |

### 5.3 Consentimiento (`consent.js`)

- Al cargar cualquier página se envía `gtag('consent', 'default', …)` con todo en `denied` y `wait_for_update: 500`.
- Banner editorial con tres botones idénticos en tamaño y estilo: "Aceptar todas", "Rechazar todas" y "Configurar". Categorías: Técnicas (siempre activas) · Analíticas (Google Analytics 4 y Microsoft Clarity) · Publicitarias (Pixel de Meta). Analíticas → `analytics_storage`; Publicitarias → `ad_storage`, `ad_user_data` y `ad_personalization`.
- La elección se guarda en `localStorage` (`kdk_consent`, con fecha) dentro de `try/catch`, y se vuelve a preguntar a los 12 meses.
- "Configurar cookies" (pie de todas las páginas) reabre el panel con la elección actual.
- **Sin consentimiento no hay ninguna petición a Google, Meta ni Microsoft**: GTM no se descarga hasta que el usuario acepta alguna categoría. Consecuencia: para quien rechaza no hay "pings" sin cookies del modo avanzado de Consent Mode (ni conversiones modeladas a partir de ellos). Es lo que exige el encargo.
- Si se retira un consentimiento con GTM ya cargado, se borran las cookies propias de esa categoría (`_ga*`, `_gid`, `_gat*`, `_clck`, `_clsk`, `_fbp`, `_fbc`, `_gcl_*`) y se recarga la página.

**En GTM**, configura cada etiqueta con la comprobación de consentimiento de GTM (Configuración avanzada → Configuración de consentimiento):
- GA4 y Microsoft Clarity: `analytics_storage`.
- Pixel de Meta: `ad_storage` (y `ad_user_data`).
- No añadas otro gestor de consentimiento (CMP) en el contenedor: ya lo hace `consent.js`.

### 5.4 API de conversiones de Meta

No va en el front-end. La envía el sistema que recibe `FORM_ENDPOINT`, como evento `Lead`, con el **mismo `event_id`** del JSON. El Pixel (desde GTM, con el disparador `generate_lead`) debe enviar también `Lead` con ese `event_id`, para que Meta deduplique el evento del navegador y el del servidor. Los datos de contacto cifrados (hash) solo deben enviarse a Meta si `acepta_medicion_publicitaria` es `true` (y si el abogado mantiene esa casilla).

---

## 6. Indexación

La landing y las páginas legales llevan `<meta name="robots" content="noindex, follow">`: es una landing de pauta y no debe aparecer en buscadores. Por eso Lighthouse da una puntuación SEO baja (sección 10); es intencionado.

---

## 7. Identidad visual aplicada

- Colores: tokens de `:root` en `styles.css`. Proporción 80/15/5. Terracota, melocotón y salvia solo como decoración (filetes, puntos, fondos de etiquetas con texto carbón, selección de texto).
- Tipografía: Playfair Display (titulares y cifras, 400/600 y cursiva 400) e Inter (cuerpo, 400/500), escala fluida con `clamp()`; H1 entre 2,6rem y 5,5rem.
- Grilla de 12 columnas, contenedor de 1200 px, filetes de 1 px, sin sombras ni degradados, radio máximo de 2 px en cajas y botones.
- Arquetipo "revista impresa": todo el movimiento es editorial y sirve a la lectura. No hay imágenes de stock, librerías externas, pantalla de carga ni cursor personalizado.

### 7.1 Capa editorial (ornamentos, iconos y movimiento)

| Elemento | Qué hace | Dónde |
| --- | --- | --- |
| Textura de papel | Ruido fino centrado en el crema de marca: la media medida es (245, 242, 235) = #F5F2EB, con ±3,7 niveles de variación | `--grano` y `--grano-calido` en `styles.css` |
| Barra de progreso de lectura | Filete terracota de 2 px en la parte superior (landing y páginas legales) | `main.js` |
| Flor de la marca a línea | Ornamento derivado del logo: se dibuja en la cabecera y gira muy despacio; también sobre la cita, en el pie, en la página de gracias y en la 404 | SVG en el HTML |
| Entrada de la cabecera | El filete se dibuja, el titular emerge línea a línea y el resto aparece en cascada. Solo CSS, no depende de JavaScript | `styles.css` |
| Cabeceras de sección | El filete superior se dibuja, el número aparece y el titular emerge | `styles.css` + `main.js` |
| Aparición escalonada | Fundido + 12 px, 800 ms, con retraso progresivo en listas y rejillas | `[data-reveal]`, `[data-escalonado]` |
| Iconos de línea propios | 11 iconos de trazo fino que se dibujan al aparecer (sin logos de marcas ajenas: para "publicar en Instagram y TikTok" se usa un avión de papel) | SVG en el HTML |
| Letra capitular | Primera letra de "La idea" en Playfair | `[data-capitular]` |
| Cita que se imprime | Las palabras pasan de gris (#7D7972, 3,87:1, válido para texto grande) a carbón según se lee. Los lectores de pantalla reciben el texto completo | `[data-cita-palabras]` |
| Línea de tiempo | La línea de "Así trabajamos" se rellena con el scroll y cada número se activa al llegar | `[data-pasos]` |
| Fotos | Máscara que se abre al aparecer y parallax de 16 px como máximo (solo escritorio) | `.foto`, `[data-parallax]` |
| FAQ | Índice numerado y apertura con altura animada | `main.js` |
| Formulario | Filete de progreso 50 % → 100 % y transición entre pasos | `formulario.js` |
| CTA principal | El texto rueda al pasar el ratón y la flecha se desplaza 4 px | `.cta__texto` |
| Enlaces | Subrayado que se redibuja al pasar el ratón | `styles.css` |

Reglas de robustez:
- **Todo el contenido está en el HTML:** sin JavaScript se ve la página completa.
- **Fallos aislados:** cada módulo de `main.js` va envuelto en `safe()`, así que si uno falla los demás siguen funcionando. Hay un único bucle de scroll.
- **Revelado:** el observador usa un umbral de 0,01 y, a los 6 s, una red de seguridad muestra lo que siga oculto.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` no hay desplazamientos, parallax, dibujos animados ni giros. El contenido se ve desde el principio, la cita aparece completa y la línea de tiempo, rellena. Se mantienen los cambios de color, el subrayado y la flecha de 4 px al pasar el ratón.

**Tipografías autoalojadas.** Se sirven desde `assets/fonts/` en vez de desde los servidores de Google, para que no haya peticiones a Google sin consentimiento. Son subconjuntos latinos (incluyen el símbolo del euro, ¿, ¡, tildes, ñ y flechas). Playfair Display tiene "Reserved Font Name" en su licencia OFL: al recortarla, la licencia prohíbe usar ese nombre en la versión modificada, así que internamente y en el CSS se llama **"KDK Display Serif"**. El diseño es el de Playfair Display. Licencias en `assets/fonts/OFL-*.txt`.

---

## 8. Despliegue

Es un sitio estático: se publica la carpeta tal cual, sin compilación.

- **GitHub Pages:** *Settings → Pages → Deploy from a branch*, rama `main`, carpeta `/ (root)`. Quedará en `https://<usuario>.github.io/<repositorio>/` (funciona en subdirectorio). El archivo `.nojekyll` hace que se sirvan los archivos sin procesar.
- **Netlify:** importar el repositorio sin comando de compilación y con la raíz como carpeta de publicación (o arrastrar la carpeta a Netlify Drop).
- **Vercel:** importar el repositorio con el preset "Other", sin comando de compilación y con la raíz como carpeta de salida.

- **Hostinger (o cualquier Apache / LiteSpeed):** subir el contenido de la carpeta a `public_html` con el Administrador de archivos o por FTP, incluido el archivo oculto `.htaccess`.

Los nombres de los menús de cada servicio pueden cambiar. GitHub Pages y Netlify usan `404.html` automáticamente; en Vercel, compruébalo tras el primer despliegue.

**Caché (importante en cada actualización):**
- Todas las hojas de estilo y scripts se cargan con `?v=20261012`. **En cada despliegue que cambie CSS o JS (incluido `config.js`), cambia esa fecha en las cuatro páginas HTML** (y en `404.html` para la hoja de estilos) para que nadie vea una versión antigua guardada en caché.
- `.htaccess` hace que HTML, CSS y JS se revaliden en cada visita y que imágenes y fuentes se guarden un mes. Comprime con gzip. Solo funciona en Apache/LiteSpeed (Hostinger); en Nginx, Netlify, Vercel o GitHub Pages no tiene efecto y la protección es el `?v=`.
- Si publicas en un subdirectorio, enlaza la URL con barra final (`…/landing/`): sin ella, algunos servidores resuelven mal las rutas relativas.

Notas:
- Este `README.md` y los borradores legales quedan accesibles públicamente si se publica la raíz del repositorio. No contienen secretos.
- `404.html` usa rutas relativas: se ve completa cuando la URL inexistente está en el primer nivel (por ejemplo `/pagina-que-no-existe`). En rutas más profundas carga unos estilos mínimos de respaldo.
- Antes de lanzar: completar todos los `[PENDIENTE]`, configurar las constantes, revisar en móvil real y escanear las cookies.

---

## 9. Decisiones tomadas respecto al encargo

Todo el copy de la sección 5 del encargo es literal. Estas son las decisiones que no venían especificadas o que se apartan del encargo, con su motivo:

1. **Fuentes autoalojadas en lugar de cargarlas de Google Fonts con `preconnect`.** Cargarlas desde Google haría peticiones a Google sin consentimiento, lo que contradice la regla 7.3.6 y la comprobación 10 del propio encargo (en Alemania, el Tribunal Regional de Múnich condenó en 2022 a una web por incrustar Google Fonts sin consentimiento). Se mantiene `font-display: swap` y se precargan las fuentes del titular.
2. **GTM se carga solo después del consentimiento** (no antes con todo denegado). Es la única forma de cumplir "sin consentimiento, ninguna petición a Google, Meta ni Microsoft". El `consent default` se sigue enviando antes de cargar GTM.
3. **Se añade `assets/js/main.js`** para la numeración de secciones, la animación, la barra fija y los datos del pie.
4. **Logo:** el PNG aportado tenía fondo beige opaco (#F2E9D8), distinto del crema de la web (#F5F2EB). Se le ha quitado el fondo y se ha recortado. Como no es monocromo, en el pie va sobre una placa crema. El favicon es la flor del logo.
5. **Foto del equipo:** no se aportó, así que `foto-equipo.jpg` es un marcador amarillo `[PENDIENTE: foto del equipo]` (evita un error 404 en consola). Se sustituye subiendo la foto real con el mismo nombre.
6. **Barra fija inferior:** además de ocultarse con el formulario a la vista, se oculta mientras se ve el botón de la cabecera, para no duplicar el CTA ni tapar la nota que hay debajo. También desaparece tras enviar el formulario.
7. **Marcadores añadidos** donde había textos sin validar: sobre las casillas del formulario, en el banner de cookies y al principio de cada borrador legal.
8. **Microcopy funcional escrito para la interfaz** (no es marketing): texto del banner y del panel de cookies (las descripciones reutilizan las finalidades de la Política de cookies), mensajes de error, "Enviando…", lista de prefijos telefónicos, *placeholder* "@usuario", "(varias respuestas)", "(opcional)" en las dos casillas opcionales, aviso `<noscript>` y la página 404.
9. **Títulos de sección** sin "Titular" en el encargo: "Preguntas frecuentes" (nombre de la sección) y, en "Para quién es y para quién no", los encabezados de las dos columnas. En "Por tipo de negocio", los títulos de las columnas van sin los dos puntos finales.
10. **Eventos:** `form_error` se envía una vez por campo con error y con `field: "envio"` si falla el servidor; `form_step_complete`, una vez por carga de página.
11. **Páginas legales** también con `noindex, follow`.
12. **Capa editorial (petición posterior).** El encargo pedía un movimiento mínimo: fundido + 12 px en 400 ms. A petición expresa, se ha enriquecido (sección 7.1) manteniendo el tono de lujo silencioso: 12 px, 800 ms, cascadas, filetes que se dibujan, ornamentos e iconos. No se han añadido textos de marketing nuevos. La flor es un ornamento derivado del logo y los iconos son decorativos (`aria-hidden`).
13. **Reglas del skill de webs premium que no se han aplicado, y por qué:**
    - **Sin GSAP, Lenis ni Three.js:** el encargo no admite dependencias. Todo es CSS y JavaScript propios.
    - **Sin imágenes de stock (Openverse):** el encargo las prohíbe.
    - **Sin pantalla de carga ni cursor personalizado:** retrasarían la primera impresión de un tráfico de pago que llega sobre todo desde móvil.
    - **`prefers-reduced-motion` sí desactiva el movimiento:** el skill recomienda mantener las microinteracciones, pero el encargo pide expresamente respetar esta preferencia.
    - **Formatos de imagen:** el logo pasa a WebP (5,9 KB frente a 14,3 KB, con los píxeles visibles idénticos). `foto-equipo.jpg` sigue en JPG porque esa ruta la fija el encargo, y los iconos de la pestaña y de iOS siguen en PNG, que es su formato estándar.
    - **Puntos de corte:** se mantienen 480/640/768/1024 px, ya probados a 360–1440 px.
14. **`config.js` y `consent.js` ahora se cargan con `defer`.** Es seguro: GTM solo lo carga `consent.js`, después de fijar el consentimiento por defecto, y los `defer` se ejecutan en orden. La página ya no tiene scripts que bloqueen el pintado.

---

## 10. Comprobación final (sección 9 del encargo)

Pruebas automáticas con Playwright (Chromium 141) sirviendo el sitio desde un subdirectorio (`/sub/kdk/`): 105 de 105 comprobaciones superadas, más una auditoría axe-core (WCAG 2.1 A/AA) sin violaciones en 14 estados (banner, panel de cookies, errores del paso 1 y 2, página de gracias, a 390 y 1440 px; páginas legales y 404).

| # | Comprobación | Resultado |
| --- | --- | --- |
| 1 | Palabras y cifras prohibidas | Cumple en el sitio (HTML, CSS y JS): ninguna palabra, cifra ni marca de la lista, y sin voseo. El símbolo del euro solo aparece en las opciones del formulario y las palabras permitidas solo donde el encargo las permite. Dos apariciones más de la familia de "garantía", ambas copy literal del encargo que niega garantías: la segunda frase de "No es para ti si:" (sección 10) y el §5 del aviso legal |
| 2 | Acentos nunca como color de texto ni fondo de botón | Cumple (solo filetes, puntos, fondos de etiquetas con texto carbón y selección de texto) |
| 3 | Contraste AA | Cumple. Carbón/crema 15,24:1 · texto suave/crema 6,96:1 · error/crema 6,16:1 · crema/carbón 15,24:1 · carbón/marcador 13,39:1 · carbón/melocotón 10,55:1 · carbón/salvia 7,62:1 · bordes de campos 3,87:1 (WCAG 1.4.11). Sobre el píxel más oscuro de la textura de papel: carbón 13,67:1 · texto suave 6,25:1 · error 5,53:1 · cita apagada (texto grande) 3,47:1. axe-core sin violaciones (con la textura, axe deja muchos nodos como "sin determinar"; por eso el cálculo manual) |
| 4 | Sin vídeo ni portafolio, las secciones no existen en el DOM | Cumple; la numeración se ajusta (01–11) |
| 5 | Cabecera tipográfica a 360 px | Cumple |
| 6 | Casillas sin marcar, obligatorias bloquean el envío, aviso de IA junto al botón | Cumple |
| 7 | `prioridad` y `revisar_expectativas` | Cumple (8 casos de prioridad probados) |
| 8 | Gracias sustituye al formulario y persiste; sin número no hay número ni enlace | Cumple (con número: " desde el …" y `.vcf` "KDK Design — Asistente") |
| 9 | Ningún `dataLayer.push` con datos personales ni Instagram | Cumple |
| 10 | Sin consentimiento, 0 peticiones a Google, Meta ni Microsoft; botones de igual peso | Cumple, incluso con `GTM_ID` configurado. Los tres botones miden lo mismo y tienen el mismo estilo |
| 11 | Funciona desde un subdirectorio | Cumple |
| 12 | Lighthouse móvil | Ver abajo |
| 13 | README con pendientes agrupados | Este documento |

También comprobado:
- Sin scroll horizontal a 360, 390, 768, 1024 y 1440 px.
- Sin errores en consola servido por HTTP.
- Foco visible y enlace "Saltar al contenido".
- `prefers-reduced-motion` desactiva todo el movimiento.
- Con JavaScript desactivado se ve todo el contenido.

Abierto con doble clic (`file://`), Chrome muestra avisos de CORS sobre la precarga de fuentes: es una limitación de `file://`, y las fuentes cargan igualmente. Servido por HTTP no aparecen.

### Lighthouse móvil

Lighthouse 13.5.0, perfil móvil con limitación simulada, sitio servido en local, configuración vacía (sin GTM, vídeo ni portafolio), tres ejecuciones por caso:

| Servidor de prueba | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Con compresión gzip (como Hostinger con el `.htaccess`, Netlify o GitHub Pages) | 99 | 100 | 100 | 63 | 1,2 s | 1,8 s | 0 |
| Sin compresión | 97 | 100 | 100 | 63 | 1,5 s | 2,6 s | 0 |

Para comparar, la versión anterior a la capa editorial, medida con gzip en las mismas condiciones, daba Rendimiento 99, FCP 1,4 s y LCP 1,9 s. La capa editorial no empeora el rendimiento real.

La única auditoría SEO que falla es "is-crawlable", por el `noindex` intencionado. Las cifras cambiarán con el alojamiento definitivo y al activar GTM, el Pixel y Clarity, así que conviene repetir la medición tras publicar.
