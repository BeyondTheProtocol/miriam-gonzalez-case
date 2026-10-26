// Regla R10 del lint de diseño (sistema v3, S6): lo que solo se ve con la página pintada, en Chrome, sobre el build ESTÁTICO.
// Mismo ratchet que scripts/test-diseno.ts: un recuento puede BAJAR, nunca subir (scripts/diseno-render-baseline.json).
//
// Mide en cada ruta, a 390 y a 1280 px:
//   desborde            1 si la página se sale del ancho (scroll horizontal).
//   h1_borde            1 si el borde izquierdo del H1 no cae bajo el del logo (±1 px).
//   texto_bajo_suelo    elementos con texto por debajo de 13 px (12 solo en mono y mayúsculas; por debajo de 12, nunca).
//   texto_svg_bajo_suelo  lo mismo para el texto DENTRO de un <svg>, que el recuento anterior no mira (el recorrido salta todo lo que está en un SVG):
//                       el tamaño que cuenta es el de pantalla, font-size del <text> × escala de su viewBox (getScreenCTM). Un `font-size="9"` en un
//                       viewBox de 440 mostrado a 290 px son 6 px, y eso es lo que lee quien mira (revisión de P1: las marcas de vértebra y el contador
//                       de la insignia de EsqueletoFocos salían a 6 px y el `texto_bajo_suelo 33 → 0` de /lesiones lo daba por resuelto sin contarlos).
//   objetivos_pequenos  controles de menos de 44 px (salvo un enlace dentro de una frase, que la norma exime). Cuenta la zona pulsable, no solo el dibujo: un
//                       `::before` o `::after` absoluto de 44 px (sin `pointer-events: none`) la amplía (revisión del barrido).
//   objetivos_svg       controles que cuelgan de un <svg> (`[role=button]`, `[role=tab]`, `a[href]`) y miden menos de 24 px por algún lado, el MÍNIMO de WCAG 2.5.8
//                       (T3-BARRIDO). El recorrido del DOM de arriba salta todo lo que está dentro de un SVG, así que los marcadores de evento de 22 × 22 px y las
//                       barras de línea de 20 px de alto de «El caso en el tiempo» no los veía nadie. Umbral de 24 y no de 44 porque una figura no puede crecer como un
//                       botón. Se mide la caja de su <g>, zona táctil transparente incluida. Es una métrica NUEVA con su propia baseline (objetivos_pequenos no puede subir).
//   El build estático no trae /donations.json (es una función de Netlify): sin datos, /colabora no pinta el muro de donantes ni sus controles (zoom del
//   mapa de estrellas, «Recientes» y «Top», paginador), y siete controles de 36 px no los veía nadie (revisión del barrido). Se inyecta un `fetch` con
//   datos SINTÉTICOS (nombres inventados, solo para medir; nunca entran en el repo ni en la web) para /colabora y /en/collaborate.
//   La barra fija de apoyo del móvil (`.mobile-support-bar`) solo aparece tras pasar el hero (480 px de scroll): con el scroll en 0 no existía y su texto
//   de 11,5 px y su enlace de 20 px de alto salían en verde. A 390 px, tras bajar, se miden sus controles y su texto y se suman a `objetivos_pequenos`
//   y `texto_bajo_suelo` de la ruta (0 si la ruta no la pinta).
//   RUTAS lleva también las páginas en inglés (T3-BARRIDO): las palabras de la cabecera y del pie son más cortas y un enlace de 36 px de ancho («Team», «Press»)
//   que en español mide 60 no saltaba en ninguna medición.
//   desborde_oculto     cajas visibles cuyo borde derecho cae fuera de la ventana y que NO están dentro de un contenedor de scroll o de recorte más estrecho que
//                       ella (revisión del barrido, 26-oct-2026). `desborde` mira solo `scrollWidth` de la página, y la raíz lleva `overflow-x: clip`: lo que se
//                       sale queda cortado y el recuento da 0. Así pasó con la gráfica del FDG del mapa a 375 px: una rejilla sin columna explícita la dejaba en
//                       460 px dentro de una tarjeta de 277, se perdían el segundo punto, la fecha y el final de los párrafos, y ningún test lo veía. Se cuenta la
//                       caja más externa que se sale; lo decorativo (`aria-hidden`) y lo fijo no cuentan. Una pieza que se desliza a propósito (`.tabla-scroll`,
//                       la galería de /laminillas: `overflow-x: auto` o `scroll`) no cuenta, ni un recorte (`hidden`, `clip`) dentro de una caja más estrecha que la
//                       ventana. Sí cuenta lo que solo tapa la raíz o un contenedor tan ancho como la ventana.
//   contraste           elementos de texto por debajo de 4,5:1 (3:1 si es grande) sobre su fondo aplanado.
//   foco_tapado         pasos de Tab cuyo foco queda debajo de la cabecera fija (WCAG 2.4.11).
//   linea_larga         bloques de texto cuya línea MÁS LARGA, tal como se pinta, pasa de 90 caracteres (lote 0 del repaso de escritorio,
//                       25-oct-2026). Se cuenta el texto de verdad con Range (no el CSS): un `max-w-3xl` suelto da 100 a 190 caracteres y
//                       ningún otro recuento lo veía. Por qué 90: `--measure` (68ch) da unos 80 a 85 caracteres con Hanken a 15 a 17 px, y el
//                       umbral deja un 8 % de holgura (inferencia mía sobre el ancho medio de Hanken, sin probar con lectores). Un bloque
//                       cuenta aunque tenga una sola línea: una línea de 120 caracteres es larga se parta o no. No se miran: tablas (columnas),
//                       <pre>, SVG ni lo oculto. A 390 px da 0 en la práctica (342 px no dan para 90 caracteres), así que es una métrica de 1280.
//                       ¿Da lo mismo en otra máquina? (revisión del lote 0) Hay decenas de bloques con la línea más larga entre 86 y 94 caracteres, y el
//                       ratchet falla también cuando un recuento BAJA, así que un corte de línea distinto pondría rojo el PR. Comprobado (25-oct-2026): el
//                       mismo build da los mismos recuentos, ruta por ruta, en el Chrome del Mac y en el Chromium 156 de Debian 12 (Linux arm64, en un
//                       contenedor), con y sin `--font-render-hinting=none`. Aun así el test fija ese flag y espera a `document.fonts.ready`, para que el
//                       corte no dependa del hinting ni de que la fuente haya cargado. SIN probar: el Google Chrome de ubuntu-latest (x86_64) de
//                       diseno.yml. Si su primer run da otro recuento, mira `--detalle` antes de tocar la baseline.
//   sticky_tapado       elementos `position: sticky` (fuera de la cabecera) cuyo `top` queda por encima del borde de abajo de la cabecera fija:
//                       al pegarse, la cabecera los tapa (WCAG 2.4.11). Un `lg:top-24` son 96 px y la cabecera mide 73 (112 con la barra «lo
//                       último»). Se mide por geometría y no haciendo scroll: solo cuenta el que SÍ puede pegarse (su contenedor es más alto
//                       que él y ningún antepasado tiene overflow, que anularía el sticky) y se mueve con el viewport.
//
// Y dos comprobaciones SIN baseline (o cumplen o no): `.rejilla-par` a 390 px, con un SVG de 700 px dentro, no ensancha la columna del texto; y el cielo de
// /links a 1024, 1280, 1440 y 1920 px (desde `lg`) deja ver la estrella coral «tú» (al menos el 90 % de su área, sin el avatar ni nada encima) y la
// guía dentro de su caja, y en las cajas anchas (1440 y 1920) las once ancladas (lote 3, A36). Por debajo de `lg` no se afirma nada: ahí la «tú» sigue detrás del
// avatar (a 375 px se ve un 0,6 %, a 768 un 4,3 %; arreglarlo toca la composición del móvil).
//
// No mide el texto sobre degradados ni sobre imágenes (se salta cualquier nodo con un ANTEPASADO con background-image; el degradado del
// propio nodo, el marcador de los enlaces en línea, sí se mide sobre su color de fondo y los de sus antepasados),
// ni los visores 3D con WebGL (se miden sin él, para que el recuento no dependa de la GPU de cada máquina), ni dispositivo real: es emulación de Chrome, y hover pegado, zoom de iOS y safe-area quedan «sin verificar en teléfono».
//
//   pnpm exec nuxt generate && pnpm test:diseno-render
//   pnpm test:diseno-render --actualizar           graba la baseline (solo si nada sube)
//   pnpm test:diseno-render --actualizar --absorber   además admite las RUTAS NUEVAS (las que la baseline no conoce) y las MÉTRICAS NUEVAS (las que
//                                                  su ruta aún no trae) con el recuento que traen; jamás sube un recuento conocido. Igual que `pnpm test:diseno --absorber`: una ruta nueva que
//                                                  entra en RUTAS no puede «bajar» desde un 0 que nunca existió.
//   pnpm test:diseno-render --rutas /,/datos       solo esas rutas (no compara la baseline)
//   pnpm test:diseno-render --detalle              imprime los primeros ejemplos de cada recuento
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, ROOT } from './lib/navegador-cdp.mjs'

const RUTA_BASELINE = join(import.meta.dirname, 'diseno-render-baseline.json')
export const RUTAS = [
  '/', '/ciencia', '/ciencia/evidencia', '/colabora', '/contacto', '/datos', '/equipo', '/gastos', '/gracias',
  '/laminillas', '/lesiones', '/links', '/mapa-metastasis', '/marcas', '/prensa', '/timeline', '/celula-a-celula',
  '/celula-a-celula/explorar', '/aviso-legal', '/privacidad', '/cookies', '/guia-de-estilo',
  // T2a (24-oct-2026): las tres páginas que volvieron a la vida (el mapa ya estaba)
  '/herramientas', '/reservorio', '/historia',
  // T3-BARRIDO: las páginas en inglés más largas y el pie, que se pinta en todas (la palabra inglesa del pie es más corta: «Team», «Press», «Slides»)
  '/en', '/en/science', '/en/science/evidence', '/en/data', '/en/tools', '/en/team',
]
const ANCHOS = [390, 1280]
const METRICAS = ['desborde', 'desborde_oculto', 'h1_borde', 'texto_bajo_suelo', 'texto_svg_bajo_suelo', 'objetivos_pequenos', 'objetivos_svg', 'contraste', 'foco_tapado', 'linea_larga', 'sticky_tapado']
const PASOS_TAB = 14
// Nombre corto de cada métrica en la línea de salida (con slice(0, 8), «desborde» y «desborde_oculto», u «objetivos_pequenos» y «objetivos_svg», salían iguales).
const ETIQUETA = { desborde: 'desborde', desborde_oculto: 'desb_ocu', h1_borde: 'h1_borde', texto_bajo_suelo: 'txt_bajo', texto_svg_bajo_suelo: 'txt_svg', objetivos_pequenos: 'obj_peq', objetivos_svg: 'obj_svg', contraste: 'contraste', foco_tapado: 'foco_tap', linea_larga: 'lin_larg', sticky_tapado: 'sticky' }

/** Corre dentro de la página. Devuelve recuentos y los primeros ejemplos de cada uno. */
const MEDIR = `(() => {
  const ej = { desborde_oculto: [], texto_bajo_suelo: [], texto_svg_bajo_suelo: [], objetivos_pequenos: [], objetivos_svg: [], contraste: [], linea_larga: [], sticky_tapado: [] }
  const cuenta = { desborde: 0, desborde_oculto: 0, h1_borde: 0, texto_bajo_suelo: 0, texto_svg_bajo_suelo: 0, objetivos_pequenos: 0, objetivos_svg: 0, contraste: 0, linea_larga: 0, sticky_tapado: 0 }
  const lienzo = document.createElement('canvas'); lienzo.width = lienzo.height = 1
  const cx = lienzo.getContext('2d', { willReadFrequently: true })
  const rgba = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = (c) => { const f = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const nombre = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + ' «' + (e.textContent || '').trim().slice(0, 24) + '»'
  const visible = (e, r) => r.width > 1 && r.height > 1 && getComputedStyle(e).visibility !== 'hidden'
  const srOnly = (r, cs) => cs.position === 'absolute' && (r.width <= 2 || r.height <= 2)
  const enSvg = (e) => !!e.closest('svg')

  // desborde
  if (document.documentElement.scrollWidth > innerWidth + 1) cuenta.desborde = 1

  // desborde oculto: una caja que se sale por la derecha y que ningún contenedor de scroll o de recorte más estrecho que la ventana explica. Se cuenta la más
  // externa (si su padre ya se sale, el hijo no suma).
  const clipEstrecho = (el) => {
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX
      if (o === 'auto' || o === 'scroll') return true // se desliza: llega a todo (la galería de /laminillas ocupa la ventana entera y se desliza)
      if ((o === 'hidden' || o === 'clip') && a.getBoundingClientRect().width < innerWidth - 2) return true // recorte dentro de una caja más estrecha que la ventana
    }
    return false
  }
  for (const el of document.body.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || el.closest('[aria-hidden="true"]')) continue
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2 || r.right <= innerWidth + 1.5 || clipEstrecho(el)) continue
    const p = el.parentElement
    if (p && p !== document.body && p.getBoundingClientRect().right > innerWidth + 1.5 && getComputedStyle(p).display !== 'none') continue
    cuenta.desborde_oculto++
    if (ej.desborde_oculto.length < 6) ej.desborde_oculto.push('right ' + Math.round(r.right) + ' > ' + innerWidth + ', ' + Math.round(r.width) + 'px de ancho ' + nombre(el))
  }

  // H1 bajo el logo
  const logo = document.querySelector('header a[href="/"], header a[href="/en"], header a')
  const h1 = document.querySelector('main h1, h1')
  if (logo && h1) {
    const rh = h1.getBoundingClientRect()
    if (rh.width > 2 && Math.abs(rh.left - logo.getBoundingClientRect().left) > 1) cuenta.h1_borde = 1
  }

  // fondo aplanado de un elemento. Se salta (null) lo que tenga una imagen o un degradado en un ANTEPASADO, porque detrás del texto
  // hay algo que no se puede aplanar a un color. El degradado del PROPIO nodo no lo salta: es el marcador de .link-inline y
  // .prose a (background-size 0 % en reposo), y saltárselo dejaba sin medir justo la clase de elemento que más contraste pierde
  // (revisión de la fase DS: un enlace a 2,88:1 en /guia-de-estilo salía con contraste 0 y el CI en verde).
  const fondoDe = (e) => {
    let capas = []
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (n !== e && n !== document.body && n !== document.documentElement && cs.backgroundImage !== 'none') return null
      const c = rgba(cs.backgroundColor)
      if (c[3] > 0) capas.push(c)
      if (c[3] >= 1) break
    }
    let base = rgba(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = capas.length - 1; i >= 0; i--) { const c = capas[i]; base = [0, 1, 2].map((k) => c[k] * c[3] + base[k] * (1 - c[3])).concat([1]) }
    return base
  }
  const opacidad = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o }

  // cabecera fija: su borde de abajo (con el scroll en 0 es su alto). Un sticky con el top por encima queda tapado al pegarse.
  const cabecera = document.querySelector('[data-cabecera-fija]') || document.querySelector('header')
  const cabBorde = cabecera ? cabecera.getBoundingClientRect().bottom : 0
  // ¿Se pega de verdad al viewport? Un antepasado con overflow (auto, scroll o hidden) es su contenedor de scroll y el sticky no llega a
  // pegarse a la ventana; y si su contenedor no es más alto que él, no tiene recorrido para pegarse.
  const sePegaAlViewport = (e) => {
    for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const o = getComputedStyle(a)
      if (/(auto|scroll|hidden)/.test(o.overflowX + ' ' + o.overflowY)) return false
    }
    const p = e.parentElement
    return !!p && p.getBoundingClientRect().height > e.getBoundingClientRect().height + 1
  }

  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let n
  while ((n = w.nextNode())) {
    if (enSvg(n) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.tagName)) continue
    const cs = getComputedStyle(n)
    const r = n.getBoundingClientRect()
    if (!visible(n, r) || srOnly(r, cs)) continue
    if (n.disabled || n.getAttribute('aria-disabled') === 'true') continue // un control deshabilitado está exento de contraste y de tamaño
    if (cs.position === 'sticky' && cabecera && !n.closest('[data-cabecera-fija], header')) {
      const arriba = parseFloat(cs.top)
      if (!Number.isNaN(arriba) && arriba < cabBorde - 1 && sePegaAlViewport(n)) { cuenta.sticky_tapado++; if (ej.sticky_tapado.length < 6) ej.sticky_tapado.push('top ' + Math.round(arriba) + 'px < cabecera ' + Math.round(cabBorde) + 'px ' + nombre(n)) }
    }
    const propio = [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim().length > 0)

    if (propio) {
      // texto bajo el suelo
      const fs = parseFloat(cs.fontSize)
      const mono = /mono|jetbrains/i.test(cs.fontFamily) && cs.textTransform === 'uppercase'
      if (fs < 12 || (fs < 13 && !mono)) { cuenta.texto_bajo_suelo++; if (ej.texto_bajo_suelo.length < 6) ej.texto_bajo_suelo.push(fs + 'px ' + nombre(n)) }
      // contraste
      const fondo = fondoDe(n)
      if (fondo && opacidad(n) > 0.05) {
        const fg = rgba(cs.color)
        const o = opacidad(n)
        const a = fg[3] * o
        const color = [0, 1, 2].map((k) => fg[k] * a + fondo[k] * (1 - a))
        const grande = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700)
        const rr = ratio(color, fondo)
        if (rr < (grande ? 3 : 4.5)) { cuenta.contraste++; if (ej.contraste.length < 6) ej.contraste.push(rr.toFixed(2) + ' ' + nombre(n)) }
      }
    }

    // objetivos táctiles
    const interactivo = n.matches('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=radio], [role=checkbox], [role=switch]')
    if (interactivo && r.right > 0 && r.left < innerWidth + 1 && !n.closest('.skip-link, .sr-only') && !n.classList.contains('skip-link')) {
      let enFrase = false
      if (n.tagName === 'A' && cs.display === 'inline') {
        const pariente = n.parentElement
        const otro = [...pariente.childNodes].filter((c) => c !== n && (c.nodeType === 3 ? c.textContent.trim().length > 2 : (c.nodeType === 1 && getComputedStyle(c).display === 'inline'))).length
        enFrase = otro > 0
      }
      // La zona pulsable también es la de un ::before o ::after absoluto y con ratón (el patrón del botón de descargar la imagen clave del mapa: dibujo de 28 px,
      // zona de 44 con inset de -8 px). Se mide su caja real (getComputedStyle da el ancho y el alto usados de un pseudo posicionado); un pseudo con
      // pointer-events none es decoración y no cuenta.
      let ancho = r.width, alto = r.height
      for (const q of ['::before', '::after']) {
        const ps = getComputedStyle(n, q)
        if (ps.content === 'none' || ps.display === 'none' || ps.position !== 'absolute' || ps.pointerEvents === 'none') continue
        ancho = Math.max(ancho, parseFloat(ps.width) || 0); alto = Math.max(alto, parseFloat(ps.height) || 0)
      }
      if (!enFrase && (alto < 43.5 || ancho < 43.5)) { cuenta.objetivos_pequenos++; if (ej.objetivos_pequenos.length < 6) ej.objetivos_pequenos.push(Math.round(ancho) + 'x' + Math.round(alto) + ' ' + nombre(n)) }
    }
  }

  // texto dentro de un SVG, a su tamaño de pantalla (el recorrido de arriba salta todo lo que cuelga de un <svg>)
  for (const t of document.querySelectorAll('svg text')) {
    if (!(t.textContent || '').trim()) continue
    const r = t.getBoundingClientRect()
    const cs = getComputedStyle(t)
    if (!visible(t, r) || cs.display === 'none') continue
    const ctm = t.getScreenCTM()
    if (!ctm) continue
    const escala = Math.sqrt(Math.abs(ctm.a * ctm.d - ctm.b * ctm.c)) // escala de área: vale también si el SVG se gira
    const fs = parseFloat(cs.fontSize) * escala
    const mono = /mono|jetbrains/i.test(cs.fontFamily) && cs.textTransform === 'uppercase'
    if (fs < 12 || (fs < 13 && !mono)) { cuenta.texto_svg_bajo_suelo++; if (ej.texto_svg_bajo_suelo.length < 6) ej.texto_svg_bajo_suelo.push(fs.toFixed(1) + 'px ' + nombre(t)) }
  }

  // controles dentro de un SVG: el recorrido de arriba salta todo lo que cuelga de un <svg>. Umbral de WCAG 2.5.8 (24 px), no los 44 de la marca.
  for (const c of document.querySelectorAll('svg [role=button], svg [role=tab], svg a[href]')) {
    const r = c.getBoundingClientRect()
    const cs = getComputedStyle(c)
    if (!visible(c, r) || cs.display === 'none' || c.getAttribute('aria-disabled') === 'true') continue
    if (r.width < 23.5 || r.height < 23.5) { cuenta.objetivos_svg++; if (ej.objetivos_svg.length < 6) ej.objetivos_svg.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + nombre(c)) }
  }

  // línea larga: se agrupa el texto por su bloque (el antepasado más cercano que no es en línea) y se cuentan los caracteres de cada línea
  // PINTADA con Range. Una línea nueva empieza cuando un carácter cae más de media altura por debajo del anterior.
  const LINEA_MAX = 90
  const bloques = new Map()
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let tn
  while ((tn = tw.nextNode())) {
    if (!tn.textContent.trim()) continue
    const padre = tn.parentElement
    if (!padre || padre.closest('svg, script, style, noscript, pre, table, textarea, [aria-hidden="true"], .sr-only')) continue
    let b = padre
    while (b && b !== document.body && /^(inline|contents)$/.test(getComputedStyle(b).display)) b = b.parentElement
    if (!b || b === document.body) continue
    if (!bloques.has(b)) bloques.set(b, [])
    bloques.get(b).push(tn)
  }
  const rango = document.createRange()
  for (const [b, nodos] of bloques) {
    const rb = b.getBoundingClientRect()
    const cb = getComputedStyle(b)
    if (!visible(b, rb) || cb.display === 'none') continue
    let total = 0
    for (const t of nodos) total += t.textContent.length
    if (total <= LINEA_MAX) continue
    if (rb.width < LINEA_MAX * parseFloat(cb.fontSize) * 0.36) continue // ni con el carácter más estrecho caben 90 en esa anchura
    let max = 0, actual = 0, arriba = null
    for (const t of nodos) {
      const txt = t.textContent
      for (let i = 0; i < txt.length; i++) {
        rango.setStart(t, i); rango.setEnd(t, i + 1)
        const q = rango.getClientRects()
        if (!q.length || (q[0].width === 0 && q[0].height === 0)) continue
        if (arriba !== null && q[0].top > arriba + q[0].height * 0.5) { if (actual > max) max = actual; actual = 0 }
        arriba = q[0].top
        actual++
      }
    }
    if (actual > max) max = actual
    if (max > LINEA_MAX) { cuenta.linea_larga++; if (ej.linea_larga.length < 8) ej.linea_larga.push(max + ' car. en ' + Math.round(rb.width) + 'px (' + cb.fontSize + ') ' + nombre(b)) }
  }
  return { cuenta, ej }
})()`

async function pulsarTab(nav) {
  for (const type of ['keyDown', 'keyUp']) {
    await nav.cdp('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 })
  }
  await nav.sleep(60)
}

/** Foco por teclado: ¿queda tapado por la cabecera fija? */
async function focoTapado(nav) {
  await nav.evaluate('window.scrollTo(0, 0); document.activeElement && document.activeElement.blur()')
  let tapados = 0
  const ej = []
  for (let i = 0; i < PASOS_TAB; i++) {
    await pulsarTab(nav)
    const d = await nav.evaluate(`(() => {
      const a = document.activeElement
      if (!a || a === document.body) return null
      if (a.closest('header, [data-cabecera-fija], .skip-link') || a.classList.contains('skip-link')) return { dentro: true }
      const cab = document.querySelector('[data-cabecera-fija]') || document.querySelector('header')
      const hb = cab ? cab.getBoundingClientRect().bottom : 0
      const r = a.getBoundingClientRect()
      return { dentro: false, top: r.top, bottom: r.bottom, alto: r.height, hb, nombre: a.tagName.toLowerCase() + ' «' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 20) + '»' }
    })()`)
    if (!d || d.dentro) continue
    // tapado = más de la mitad del control queda bajo la cabecera
    if (d.top < d.hb && d.bottom - d.hb < d.alto / 2) { tapados++; if (ej.length < 4) ej.push(`top ${Math.round(d.top)} < cabecera ${Math.round(d.hb)}: ${d.nombre}`) }
  }
  return { tapados, ej }
}

// Los visores 3D (/lesiones, /mapa-metastasis, el explorador) pintan un DOM distinto según si el Chrome tiene WebGL: el del Mac
// y el del runner de Linux no coinciden (lo midió el primer run de diseno.yml, 24-oct-2026: solo esas dos rutas daban otro recuento).
// Se mide SIEMPRE sin WebGL, que es el estado que ve quien no puede usarlo, y así el número es el mismo en cualquier máquina.
const SIN_WEBGL = `(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (tipo, ...resto) {
    return /webgl/i.test(String(tipo)) ? null : original.call(this, tipo, ...resto)
  }
})()`

// Datos SINTÉTICOS del muro de donantes (revisión del barrido). Nombres inventados; el importe y la fecha, también. Solo en /colabora y /en/collaborate.
const STUB_DONACIONES = `(() => {
  if (!/^\\/(colabora|en\\/collaborate)\\/?$/.test(location.pathname)) return
  const nombres = ['Lucía M.', 'Carlos R. G.', 'Marta', 'Álvaro S.', 'Noelia P. T.', 'Iván', 'Sofía L.', 'Pablo D.', 'Elena V.', 'Jorge C.', 'Irene', 'Hugo B.', 'Clara F.', 'Rubén A.', 'Paula N.', 'Daniel O.', 'Inés', 'Adrián M.', 'Carmen R.', 'Sergio L.', 'Beatriz', 'Óscar T.', 'Laura G.', 'Mario P.', 'Anónimo']
  const importes = [5, 10, 10, 15, 20, 20, 25, 30, 40, 50, 50, 60, 75, 100, 100, 120, 150, 200, 250, 300, 500, 8, 12, 18, 35]
  const donaciones = []
  for (let i = 0; i < 120; i++) donaciones.push({ id: 'sint' + i, name: nombres[i % nombres.length] + (i >= 25 ? ' ' + String.fromCharCode(65 + (i % 26)) + '.' : ''), amount: importes[(i * 7) % importes.length], currencyCode: 'EUR', createdAt: '2026-10-' + String((i % 25) + 1).padStart(2, '0') })
  const campana = { currentAmount: { amount: 97972, currencyCode: 'EUR' }, donationCount: 2339, donationsEnabled: true, origen: 'vivo', actualizado: new Date().toISOString() }
  const original = window.fetch.bind(window)
  window.fetch = (entrada, init) => {
    const url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || ''
    const json = (d) => Promise.resolve(new Response(JSON.stringify(d), { status: 200, headers: { 'content-type': 'application/json' } }))
    if (/\\/donations\\.json(\\?|$)/.test(url)) return json(donaciones)
    if (/\\/fundraiser\\.json(\\?|$)/.test(url)) return json(campana)
    return original(entrada, init)
  }
})()`

// La barra fija de apoyo del móvil, tras bajar: sus controles y su texto, medidos como el resto (44 px de alto y de ancho; 13 px como suelo, 12 en mono y mayúsculas).
const BARRA_FIJA = `(async () => {
  for (let i = 0; i < 30 && !document.querySelector('.mobile-support-bar'); i++) await new Promise((r) => setTimeout(r, 100))
  await new Promise((r) => setTimeout(r, 300))
  const b = document.querySelector('.mobile-support-bar')
  if (!b) return { existe: false, pequenos: [], bajoSuelo: [] }
  const nombre = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/ +/).slice(0, 2).join('.') : '') + ' «' + (e.textContent || '').trim().slice(0, 24) + '»'
  const pequenos = [], bajoSuelo = []
  for (const c of b.querySelectorAll('a[href], button')) {
    const r = c.getBoundingClientRect()
    if (r.height < 43.5 || r.width < 43.5) pequenos.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + nombre(c))
  }
  for (const e of [b, ...b.querySelectorAll('*')]) {
    if (![...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue
    const cs = getComputedStyle(e)
    const fs = parseFloat(cs.fontSize)
    const mono = /mono|jetbrains/i.test(cs.fontFamily) && cs.textTransform === 'uppercase'
    if (fs < 12 || (fs < 13 && !mono)) bajoSuelo.push(fs + 'px ' + nombre(e))
  }
  return { existe: true, alto: Math.round(b.getBoundingClientRect().height), pequenos, bajoSuelo }
})()`

// `.rejilla-par` en el móvil (revisión del lote 0): una pieza ancha (aquí un SVG de 700 px) no debe ensanchar la columna del texto. Con la pista `auto`
// implícita el texto pasaba a medir 700 px en una ventana de 390; con `minmax(0, 1fr)` conserva el ancho del contenedor. No lleva baseline: o cumple o no.
const REJILLA_PAR = `(() => {
  const w = document.createElement('div'); w.className = 'rejilla-par'
  w.innerHTML = '<div class="measure"><p>Texto de ejemplo en la medida de lectura.</p></div><div><svg width="700" height="40" aria-hidden="true"></svg></div>'
  ;(document.querySelector('main') || document.body).appendChild(w)
  const r = { texto: Math.round(w.children[0].getBoundingClientRect().width), ancho: innerWidth, pista: getComputedStyle(w).gridTemplateColumns }
  w.remove()
  return r
})()`

// El cielo de /links desde `lg` (lote 3, A36). El SVG de la constelación usa un viewBox de 100 × 100 con `slice`: en una caja más ancha que alta solo se ve la
// franja central en vertical, y las dos estrellas protagonistas (la coral «tú», y = 7, y la violeta guía, y = 9) quedaban fuera, arriba (a 1920 px, `.cn-you`
// a -57 px del borde de la página). `Constellation.vue` mide su caja y reparte las posiciones por la franja visible. Pero que quepa en la caja no es que se
// vea: la «tú» cae a unos 97 px del borde de arriba y el avatar de /links empieza a 80, así que quedaba detrás de él (entre un 4 y un 7 % de su área a 1024,
// 1280, 1440 y 1920). Por eso aquí se cuenta lo que se ve de verdad: se muestrea el relleno de la estrella (isPointInFill, en su espacio de 20 × 20) y, de
// cada punto, se mira qué hay encima con elementsFromPoint (el SVG lleva pointer-events: none, así que no sale: solo salen los elementos de la página).
// Tapa lo que sea imagen, titular, párrafo, enlace o botón, y cualquier cosa fija o pegada (la cabecera). Sin baseline: o se ve o no. Hay que esperar al cielo:
// es ClientOnly y se redibuja cuando el ResizeObserver le da la caja.
const CIELO = `(async () => {
  for (let i = 0; i < 50 && !document.querySelector('.cn-you'); i++) await new Promise((r) => setTimeout(r, 100))
  await new Promise((r) => setTimeout(r, 500))
  const svg = document.querySelector('svg.constellation')
  if (!svg) return { error: 'la página no pinta el cielo' }
  const caja = svg.getBoundingClientRect()
  const dentro = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); return r.left >= caja.left - 1 && r.right <= caja.right + 1 && r.top >= caja.top - 1 && r.bottom <= caja.bottom + 1 }
  const anclas = [...document.querySelectorAll('.cn-anchor')]
  const tu = document.querySelector('.cn-you')
  const molde = document.querySelector('#cn-star')
  const m = tu.getScreenCTM()
  const N = 24
  let relleno = 0, libres = 0
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    const p = new DOMPoint(1.6 + ((a + 0.5) * 16.8) / N, 1.6 + ((b + 0.5) * 16.8) / N)
    if (!molde.isPointInFill(p)) continue
    relleno++
    const q = p.matrixTransform(m)
    const tapada = document.elementsFromPoint(q.x, q.y).some((e) => e.matches('img, h1, h2, p, a, button') || ['fixed', 'sticky'].includes(getComputedStyle(e).position))
    if (!tapada) libres++
  }
  return { ancho: innerWidth, proporcion: +(caja.width / caja.height).toFixed(2), tu: dentro(tu), guia: dentro(anclas[0]), anclas: anclas.length, visibles: anclas.filter(dentro).length, tuLibre: relleno ? +((libres / relleno) * 100).toFixed(1) : 0 }
})()`
// Anchos de la comprobación: desde `lg` (1024 px). 1024 y 1280 son cajas ALTAS (la página mide ~1390 px), 1440 casi cuadrada y 1920 ancha.
const ANCHOS_CIELO = [1024, 1280, 1440, 1920]
const TU_LIBRE_MIN = 90

async function medir(rutas) {
  // `--font-render-hinting=none`: el avance de cada letra no se redondea al píxel según la plataforma. `linea_larga` cuenta caracteres por línea
  // pintada y el corte de línea depende de ese avance; sin el flag, un Chrome de Linux con hinting podría partir una línea una palabra antes o
  // después que el del Mac. Es endurecimiento: en el Chromium de Linux que probé (ver la cabecera) daba lo mismo con y sin él.
  const nav = await abrirNavegador({ ancho: ANCHOS[0], alto: 900, escala: 1, chromeArgs: ['--font-render-hinting=none'] })
  await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source: SIN_WEBGL })
  await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source: STUB_DONACIONES })
  const res = {}
  const ejemplos = {}
  let rejilla
  let cielo
  try {
    for (const ruta of rutas) {
      for (const ancho of ANCHOS) {
        const clave = `${ruta}:${ancho}`
        try {
          await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false })
          await nav.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
          await nav.cargar(ruta)
          // Las fuentes son propias con `font-display: swap`: hasta que cargan, el texto se pinta con la de reserva y sus líneas cortan en otro sitio.
          await nav.evaluate('document.fonts.ready.then(() => true)')
          await nav.evaluate("(() => { const s = document.createElement('style'); s.textContent = '*{animation:none!important;transition:none!important}'; document.documentElement.appendChild(s) })()")
          await nav.sleep(300)
          const { cuenta, ej } = await nav.evaluate(MEDIR)
          const f = await focoTapado(nav)
          if (ancho < 1024) {
            // La barra fija solo existe tras pasar el hero (480 px) y si ningún botón coral está a la vista: se baja a 700 px y se espera a que entre.
            await nav.evaluate('window.scrollTo(0, 700)')
            const barra = await nav.evaluate(BARRA_FIJA)
            cuenta.objetivos_pequenos += barra.pequenos.length
            cuenta.texto_bajo_suelo += barra.bajoSuelo.length
            ej.objetivos_pequenos.push(...barra.pequenos.map((x) => 'barra fija: ' + x))
            ej.texto_bajo_suelo.push(...barra.bajoSuelo.map((x) => 'barra fija: ' + x))
            if (barra.existe) console.log(`    (barra fija de ${clave}: ${barra.alto} px de alto)`)
          }
          res[clave] = { ...cuenta, foco_tapado: f.tapados }
          ejemplos[clave] = { ...ej, foco_tapado: f.ej }
          console.log(`  ${clave.padEnd(34)} ${METRICAS.map((m) => `${ETIQUETA[m]} ${res[clave][m]}`).join('  ')}`)
        } catch (e) {
          res[clave] = { error: String(e.message || e) }
          console.log(`✘ ${clave}  ${e.message || e}`)
        }
      }
    }
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ANCHOS[0], height: 900, deviceScaleFactor: 1, mobile: false })
    await nav.cargar('/guia-de-estilo')
    rejilla = await nav.evaluate(REJILLA_PAR)
    cielo = []
    for (const ancho of ANCHOS_CIELO) {
      await nav.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 900, deviceScaleFactor: 1, mobile: false })
      await nav.cargar('/links')
      cielo.push(await nav.evaluate(CIELO))
    }
  } finally {
    await nav.cerrar()
  }
  return { res, ejemplos, rejilla, cielo }
}

const args = process.argv.slice(2)
const arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined)

if (!existsSync(ROOT)) {
  console.error('No existe .output/public: corre antes `pnpm exec nuxt generate`.')
  process.exit(2)
}
const rutas = arg('--rutas') ? arg('--rutas').split(',') : RUTAS
const { res, ejemplos, rejilla, cielo } = await medir(rutas)
const errores = Object.entries(res).filter(([, v]) => v.error)
if (errores.length) {
  console.log(`\n✘ ${errores.length} medición(es) con error: ${errores.map(([k]) => k).join(', ')}`)
  process.exit(1)
}
if (rejilla.texto > rejilla.ancho) {
  console.log(`\n✘ .rejilla-par a ${ANCHOS[0]} px: el texto mide ${rejilla.texto} px en una ventana de ${rejilla.ancho} (pista «${rejilla.pista}»). Una pieza ancha ensancha la columna: la pista de la pila debe ser minmax(0, 1fr).`)
  process.exit(1)
}
const fallosCielo = []
for (const c of cielo) {
  if (c.error) { fallosCielo.push(`a ${c.ancho ?? '?'} px: ${c.error}`); continue }
  if (!c.tu || !c.guia) fallosCielo.push(`a ${c.ancho} px (proporción ${c.proporcion}): la estrella «tú» ${c.tu ? 'cabe' : 'NO cabe'} y la guía ${c.guia ? 'cabe' : 'NO cabe'} dentro de su caja`)
  if (c.tuLibre < TU_LIBRE_MIN) fallosCielo.push(`a ${c.ancho} px (proporción ${c.proporcion}): de la estrella «tú» se ve solo el ${c.tuLibre} % (mínimo ${TU_LIBRE_MIN} %): hay algo encima, y en /links es el avatar. Constellation.vue debe anclarla a unos px del borde de arriba, por encima de él`)
  if (c.proporcion > 1 && c.visibles !== c.anclas) fallosCielo.push(`a ${c.ancho} px (proporción ${c.proporcion}): caben ${c.visibles} de ${c.anclas} ancladas dentro de la caja. En una caja ancha, Constellation.vue debe repartir las posiciones por la franja que \`slice\` deja ver`)
}
if (fallosCielo.length) {
  console.log(`\n✘ El cielo de /links:\n   ${fallosCielo.join('\n   ')}`)
  process.exit(1)
}
if (args.includes('--detalle')) {
  for (const [clave, por] of Object.entries(ejemplos)) for (const [m, lista] of Object.entries(por)) if (lista.length) console.log(`\n${clave} ${m}:\n   ${lista.join('\n   ')}`)
}
if (arg('--rutas')) process.exit(0)

const previa = existsSync(RUTA_BASELINE) ? JSON.parse(readFileSync(RUTA_BASELINE, 'utf8')) : null
const total = (m) => Object.values(res).reduce((a, v) => a + v[m], 0)
const resumen = METRICAS.map((m) => `${m} ${total(m)}`).join(' · ')

if (args.includes('--actualizar')) {
  if (previa) {
    const sube = []
    const absorber = args.includes('--absorber')
    for (const [k, v] of Object.entries(res)) {
      if (absorber && !previa.rutas[k]) continue // ruta nueva: entra con lo que trae
      for (const m of METRICAS) {
        if (absorber && !(m in previa.rutas[k])) continue // métrica nueva (la baseline no la conoce): entra con lo que trae
        if (v[m] > (previa.rutas[k]?.[m] ?? 0)) sube.push(`${k} ${m}: ${previa.rutas[k]?.[m] ?? 0} → ${v[m]}`)
      }
    }
    if (sube.length) {
      console.log(`✘ La baseline no se actualiza: solo puede bajar.\n   ${sube.join('\n   ')}`)
      process.exit(1)
    }
  }
  const nota = 'Generado por scripts/test-diseno-render.mjs (pnpm test:diseno-render --actualizar). Un recuento puede bajar, nunca subir. No se edita a mano.'
  writeFileSync(RUTA_BASELINE, JSON.stringify({ version: 1, nota, rutas: res }, null, 2) + '\n')
  console.log(`Baseline de render actualizada. ${resumen}`)
  process.exit(0)
}

if (!previa) {
  console.log('✘ No existe scripts/diseno-render-baseline.json. Créala con: pnpm test:diseno-render --actualizar')
  process.exit(1)
}
const fallos = []
for (const k of new Set([...Object.keys(res), ...Object.keys(previa.rutas)])) {
  for (const m of METRICAS) {
    const a = res[k]?.[m] ?? 0, b = previa.rutas[k]?.[m] ?? 0
    if (a > b) fallos.push(`${k} ${m}: ${b} → ${a} (SUBE)`)
    else if (a < b) fallos.push(`${k} ${m}: ${b} → ${a} (BAJA: bien; regenera con pnpm test:diseno-render --actualizar)`)
  }
}
if (fallos.length) {
  console.log(fallos.map((f) => `✘ ${f}`).join('\n'))
  console.log(`\n${fallos.length} fallo(s). ${resumen}`)
  process.exit(1)
}
console.log(`✔ test:diseno-render  ${resumen}`)
