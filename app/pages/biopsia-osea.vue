<script setup lang="ts">
/**
 * Visor de la microfotografía HE de la biopsia ósea (cresta ilíaca).
 *
 * Pieza hermana de `mapa-metastasis.vue`: fuentes propias de la paciente, sin
 * interpretación añadida más allá de lo que se puede medir sobre el píxel.
 *
 * Todo lo que se afirma aquí sale de la imagen y está calibrado con su barra de
 * escala de 100 µm. Lo que NO se puede afirmar pesa lo mismo que lo que sí, y
 * ocupa su propia tarjeta: es el punto de la pieza.
 *
 * Publicada por decisión explícita de la paciente (5/9/2026), con el argumento
 * en contra del comité de marca sobre la mesa. Herramienta de apoyo a la
 * conversación clínica. No es diagnóstico ni consejo médico.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'What can be measured in a bone biopsy — Miriam’s case'
    : 'Lo que se puede medir en una biopsia ósea — el caso de Miriam'
const seoDescription = () =>
  lang.value === 'en'
    ? 'What a histology slide can and cannot tell you. Miriam’s own bone biopsy, calibrated against its 100 µm scale bar, with the limits of the image stated as plainly as the measurements.'
    : 'Lo que un corte de histología puede decir y lo que no. La biopsia ósea de Miriam, calibrada con su propia barra de 100 µm, con los límites de la imagen dichos tan claro como las medidas.'

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
})

type Punto = { x: number; y: number; a: number }
type Datos = {
  campo_px: [number, number]
  campo_um: [number, number]
  px_por_um: number
  calibracion: { um_px: number; incertidumbre_pct: number; nota: string }
  inset: { um_px_min: number; um_px_max: number; por_que: string }
  fragmentos_nota: { rango_frag1_mm: [number, number]; fuente_buena: string }
  trabecula: { area_mm2_min: number; area_mm2_max: number; pct_tejido_min: number; pct_tejido_max: number; nota: string }
  composicion: { tejido_mm2_ref: number; tejido_mm2_min: number; tejido_mm2_max: number; tejido_pct_ref: number; tejido_pct_min: number; tejido_pct_max: number }
  nucleos: { n: number; modelo: string; diam_mediano_um: number; diam_p10: number; diam_p90: number; densidad_masa_celular: number; puntos: Punto[] }
  osteocitos: { en_trabecula: number; publicado_min: number; publicado_max: number; veredicto: string }
  resolucion: { senal_clara_um: number; suelo_um: number; nota: string }
  panel: {
    titulo_es: string; titulo_en: string; intro_es: string; intro_en: string
    calidad: { es: string; en: string; v: string }[]
    firmas: { es: string; en: string; v: string }[]
    amplicones: { locus: string; genes: string; copias: number }[]
    amplicones_nota_es: string; amplicones_nota_en: string
    variante: { gen: string; cambio: string; vaf: string; es: string; en: string }
    limpios: string; limpios_nota_es: string; limpios_nota_en: string
  }
}

import datosCrudos from '~/data/histologia.json'
const D = computed<Datos>(() => datosCrudos as unknown as Datos)

const cv = ref<HTMLCanvasElement | null>(null)
const caja = ref<HTMLDivElement | null>(null)
const medida = ref('—')
const capas = reactive({ nucleos: false, regiones: true, reticula: false })

let ctx: CanvasRenderingContext2D | null = null
let img: HTMLImageElement, ovl: HTMLImageElement
const vista = { x: 0, y: 0, esc: 1 }
let regla: { x0: number; y0: number; x1: number; y1: number } | null = null
let cursor: { x: number; y: number } | null = null
let esperandoPunto = 0

const PX = computed(() => D.value?.px_por_um ?? 2.205)
const ANCHO = computed(() => D.value?.campo_px[0] ?? 1832)
const ALTO = computed(() => D.value?.campo_px[1] ?? 653)

function ajusta() {
  const c = cv.value
  if (!c || !c.parentElement) return
  const ancho = c.parentElement.clientWidth
  c.width = ancho * devicePixelRatio
  c.height = ancho * (ALTO.value / ANCHO.value) * devicePixelRatio
  c.style.height = `${c.height / devicePixelRatio}px`
  pinta()
}
const base = () => (cv.value ? cv.value.width / ANCHO.value : 1)

function pinta() {
  const c = cv.value
  if (!c || !ctx || !D.value) return
  const k = base() * vista.esc
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.imageSmoothingEnabled = vista.esc < 3
  ctx.setTransform(k, 0, 0, k, vista.x, vista.y)
  if (img?.complete) ctx.drawImage(img, 0, 0)
  if (capas.regiones && ovl?.complete) {
    ctx.globalAlpha = 0.9
    ctx.drawImage(ovl, 0, 0)
    ctx.globalAlpha = 1
  }
  if (capas.reticula) {
    ctx.strokeStyle = '#fff'
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 0.8 / k
    const paso = 100 * PX.value
    for (let x = 0; x < ANCHO.value; x += paso) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ALTO.value); ctx.stroke() }
    for (let y = 0; y < ALTO.value; y += paso) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ANCHO.value, y); ctx.stroke() }
    ctx.globalAlpha = 1
  }
  if (capas.nucleos) {
    ctx.strokeStyle = '#28d1b8'
    ctx.lineWidth = 1 / k
    ctx.globalAlpha = 0.85
    for (const n of D.value.nucleos.puntos) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, Math.sqrt((n.a * PX.value * PX.value) / Math.PI), 0, 6.284)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
  if (regla) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 / k
    ctx.beginPath(); ctx.moveTo(regla.x0, regla.y0); ctx.lineTo(regla.x1, regla.y1); ctx.stroke()
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2 / k
    ctx.beginPath(); ctx.moveTo(regla.x0, regla.y0); ctx.lineTo(regla.x1, regla.y1); ctx.stroke()
  }
  if (cursor) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 / k
    ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 7 / k, 0, 6.284); ctx.stroke()
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1 / k
    ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 7 / k, 0, 6.284); ctx.stroke()
  }
  escala(k)
}

function escala(k: number) {
  const c = cv.value
  if (!c || !ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const objetivo = c.width * 0.22
  const um = [10, 20, 50, 100, 200, 500].find((u) => u * PX.value * k > objetivo) ?? 500
  const largo = um * PX.value * k
  const x = c.width - largo - 18 * devicePixelRatio
  const y = c.height - 20 * devicePixelRatio
  ctx.fillStyle = 'rgba(0,0,0,.62)'
  ctx.fillRect(x - 10 * devicePixelRatio, y - 24 * devicePixelRatio, largo + 20 * devicePixelRatio, 40 * devicePixelRatio)
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * devicePixelRatio
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + largo, y); ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `${12 * devicePixelRatio}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`${um} µm`, x + largo / 2, y - 8 * devicePixelRatio)
}

function aImagen(clientX: number, clientY: number) {
  const c = cv.value!
  const r = c.getBoundingClientRect()
  const k = base() * vista.esc
  return { x: ((clientX - r.left) * devicePixelRatio - vista.x) / k, y: ((clientY - r.top) * devicePixelRatio - vista.y) / k }
}
function muestra(d: number) { medida.value = d < 1000 ? `${d.toFixed(1)} µm` : `${(d / 1000).toFixed(2)} mm` }
const dist = (r: NonNullable<typeof regla>) => Math.hypot(r.x1 - r.x0, r.y1 - r.y0) / PX.value

const vivos = new Map<number, PointerEvent>()
let arrastra: { sx: number; sy: number; vx: number; vy: number } | null = null
let modoRegla = false
let pellizco: { d: number; esc: number; cx: number; cy: number; p: { x: number; y: number } } | null = null

function zoomA(nueva: number, cx: number, cy: number, p: { x: number; y: number }) {
  vista.esc = Math.min(14, Math.max(1, nueva))
  const k1 = base() * vista.esc
  const r = cv.value!.getBoundingClientRect()
  vista.x = (cx - r.left) * devicePixelRatio - p.x * k1
  vista.y = (cy - r.top) * devicePixelRatio - p.y * k1
  pinta()
}
function onDown(e: PointerEvent) {
  caja.value?.setPointerCapture(e.pointerId)
  vivos.set(e.pointerId, e)
  if (vivos.size === 2) {
    const [a, b] = [...vivos.values()]
    const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2
    pellizco = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), esc: vista.esc, cx, cy, p: aImagen(cx, cy) }
    arrastra = null
    return
  }
  const p = aImagen(e.clientX, e.clientY)
  if (e.shiftKey) { modoRegla = true; regla = { x0: p.x, y0: p.y, x1: p.x, y1: p.y } }
  else arrastra = { sx: e.clientX, sy: e.clientY, vx: vista.x, vy: vista.y }
}
function onMove(e: PointerEvent) {
  if (vivos.has(e.pointerId)) vivos.set(e.pointerId, e)
  if (pellizco && vivos.size === 2) {
    const [a, b] = [...vivos.values()]
    zoomA(pellizco.esc * (Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pellizco.d), pellizco.cx, pellizco.cy, pellizco.p)
    return
  }
  if (modoRegla && regla) {
    const p = aImagen(e.clientX, e.clientY)
    regla.x1 = p.x; regla.y1 = p.y
    muestra(dist(regla)); pinta()
  } else if (arrastra) {
    vista.x = arrastra.vx + (e.clientX - arrastra.sx) * devicePixelRatio
    vista.y = arrastra.vy + (e.clientY - arrastra.sy) * devicePixelRatio
    pinta()
  }
}
function onUp(e: PointerEvent) { vivos.delete(e.pointerId); if (vivos.size < 2) pellizco = null; arrastra = null; modoRegla = false }
function onWheel(e: WheelEvent) {
  // La rueda a secas tiene que seguir haciendo scroll de la página: si el visor se la queda,
  // el lector se atasca al pasar el ratón por encima. El zoom pide intención explícita.
  if (!e.ctrlKey && !e.metaKey && document.activeElement !== caja.value) return
  e.preventDefault()
  zoomA(vista.esc * (e.deltaY < 0 ? 1.14 : 1 / 1.14), e.clientX, e.clientY, aImagen(e.clientX, e.clientY))
}
function onKey(e: KeyboardEvent) {
  const paso = 40 * devicePixelRatio
  const r = cv.value!.getBoundingClientRect()
  const cx = r.left + cv.value!.clientWidth / 2, cy = r.top + cv.value!.clientHeight / 2
  const mueve = (dx: number, dy: number) => {
    if (!cursor) cursor = { x: ANCHO.value / 2, y: ALTO.value / 2 }
    cursor.x = Math.max(0, Math.min(ANCHO.value, cursor.x + (dx * 20) / vista.esc))
    cursor.y = Math.max(0, Math.min(ALTO.value, cursor.y + (dy * 20) / vista.esc))
    if (esperandoPunto === 2 && regla) { regla.x1 = cursor.x; regla.y1 = cursor.y; muestra(dist(regla)) }
  }
  switch (e.key) {
    case 'ArrowLeft': esperandoPunto ? mueve(-1, 0) : (vista.x += paso); break
    case 'ArrowRight': esperandoPunto ? mueve(1, 0) : (vista.x -= paso); break
    case 'ArrowUp': esperandoPunto ? mueve(0, -1) : (vista.y += paso); break
    case 'ArrowDown': esperandoPunto ? mueve(0, 1) : (vista.y -= paso); break
    case '+': case '=': zoomA(vista.esc * 1.25, cx, cy, aImagen(cx, cy)); break
    case '-': case '_': zoomA(vista.esc / 1.25, cx, cy, aImagen(cx, cy)); break
    case '0': vista.x = 0; vista.y = 0; vista.esc = 1; regla = null; cursor = null; esperandoPunto = 0; break
    case 'm': case 'M':
      esperandoPunto = 1; cursor = { x: ANCHO.value / 2, y: ALTO.value / 2 }; regla = null
      medida.value = L('Marca el primer punto con Intro', 'Mark the first point with Enter'); break
    case 'Enter':
      if (esperandoPunto === 1) {
        regla = { x0: cursor!.x, y0: cursor!.y, x1: cursor!.x, y1: cursor!.y }; esperandoPunto = 2
        medida.value = L('Mueve y marca el segundo punto', 'Move and mark the second point')
      } else if (esperandoPunto === 2 && regla) { esperandoPunto = 0; muestra(dist(regla)) }
      break
    default: return
  }
  e.preventDefault(); pinta()
}

function reset() { vista.x = 0; vista.y = 0; vista.esc = 1; regla = null; cursor = null; esperandoPunto = 0; pinta() }

onMounted(() => {
  ctx = cv.value?.getContext('2d') ?? null
  ovl = new Image(); ovl.onload = () => pinta(); ovl.src = '/histologia/overlay.png'
  img = new Image(); img.onload = () => ajusta(); img.src = '/histologia/campo.jpg'
  window.addEventListener('resize', ajusta)
})
onBeforeUnmount(() => window.removeEventListener('resize', ajusta))
</script>

<template>
  <main v-if="D" class="hist">
    <header class="hist__head">
      <span class="hist__tag">{{ L('Biopsia ósea · cresta ilíaca · tinción HE', 'Bone biopsy · iliac crest · H&E stain') }}</span>
      <h1>{{ L('Lo que se puede medir en mi biopsia ósea', 'What can be measured in my bone biopsy') }}</h1>
      <p class="hist__lede">
        {{ L(
          'Este es el corte de mi biopsia de cresta ilíaca, teñido con hematoxilina-eosina: el mismo tejido del que salió el panel molecular. Cada número de esta página sale de la propia imagen, calibrada con su barra de escala. Abajo está lo que se puede contar y medir en ella, y con el mismo detalle dónde se acaba lo que puede afirmarse mirándola.',
          'This is the slide from my iliac crest biopsy, stained with haematoxylin and eosin: the same tissue the molecular panel came from. Every number on this page is measured on the image itself, calibrated against its own scale bar. Below is what can be counted and measured in it and, in the same detail, where what you can claim by looking at it runs out.') }}
        <strong>{{ L('Ningún dato de aquí es un diagnóstico.', 'Nothing here is a diagnosis.') }}</strong>
      </p>
    </header>

    <div class="hist__grid">
      <div>
        <div class="hist__card">
          <div
            ref="caja" class="hist__visor" tabindex="0" role="img"
            :aria-label="L(
              'Microfotografía de un corte de biopsia ósea teñido con hematoxilina-eosina. Una trabécula ósea cruza el campo en diagonal, teñida de rosa intenso, con osteocitos en sus lagunas. Por debajo y a ambos lados hay una masa celular densa de núcleos morados, separada del hueso por una hendidura clara, la retracción habitual del procesado.',
              'Micrograph of a bone biopsy slide stained with haematoxylin and eosin. A bone trabecula crosses the field diagonally, stained deep pink, with osteocytes in their lacunae. Below and on both sides there is a dense cellular mass of purple nuclei, separated from the bone by a clear cleft, the usual retraction from processing.')"
            aria-describedby="hist-desc"
            @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
            @wheel="onWheel" @keydown="onKey"
          >
            <canvas ref="cv" />
          </div>
          <p id="hist-desc" class="hist__sr">
            {{ L(
              `Campo de ${D.campo_um[0]} por ${D.campo_um[1]} micras. Se han segmentado ${D.nucleos.n} núcleos con un modelo entrenado, de ${D.nucleos.diam_mediano_um} micras de diámetro mediano. Las tablas de esta página son la alternativa textual completa a la imagen.`,
              `Field of ${D.campo_um[0]} by ${D.campo_um[1]} microns. ${D.nucleos.n} nuclei were segmented with a trained model, with a median diameter of ${D.nucleos.diam_mediano_um} microns. The tables on this page are the full text alternative to the image.`) }}
          </p>

          <div class="hist__barra" role="group" :aria-label="L('Capas y encuadre', 'Layers and framing')">
            <button :aria-pressed="capas.nucleos" @click="capas.nucleos = !capas.nucleos; pinta()">
              {{ L('Núcleos', 'Nuclei') }}
            </button>
            <button :aria-pressed="capas.regiones" @click="capas.regiones = !capas.regiones; pinta()">
              {{ L('Regiones', 'Regions') }}
            </button>
            <button :aria-pressed="capas.reticula" @click="capas.reticula = !capas.reticula; pinta()">
              {{ L('Retícula 100 µm', '100 µm grid') }}
            </button>
            <button @click="reset()">{{ L('Encuadre completo', 'Reset view') }}</button>
          </div>

          <div class="hist__leyenda">
            <span><i class="is-hueso" />{{ L('Matriz ósea, rayado diagonal', 'Bone matrix, diagonal hatch') }}</span>
            <span><i class="is-celula" />{{ L('Masa celular, punteado', 'Cellular mass, dotted') }}</span>
            <span><i class="is-nucleo" />{{ L('Núcleos segmentados', 'Segmented nuclei') }}</span>
            <span class="hist__leyenda-nota">{{ L(
              'Cada capa lleva su propia trama además del color, para que se distingan sin depender del tono. Las regiones salen de deconvolver la tinción de la propia imagen (Ruifrok-Johnston, fondo por Macenko), no de un trazado a mano.',
              'Each layer carries its own pattern as well as colour, so they can be told apart without relying on hue. The regions come from deconvolving the stain of the image itself (Ruifrok-Johnston, background by Macenko), not from hand tracing.') }}</span>
          </div>

          <div class="hist__inset">
            <img src="/histologia/inset.jpg" :alt="L(
              'Panorámica del corte completo: dos fragmentos de tejido sobre fondo claro, con un recuadro que marca la zona ampliada.',
              'Overview of the whole slide: two tissue fragments on a pale background, with a box marking the magnified area.')">
            <p class="hist__hint">{{ D.inset.por_que }}</p>
          </div>
        </div>

        <section class="hist__limites">
          <h2>{{ L('Hasta dónde llega esta imagen', 'How far this image goes') }}</h2>
          <p class="hist__hint">{{ L(
            'Cosas que se han querido leer en una imagen como esta y que aquí no se sostienen. Tres de ellas estuvieron mal en versiones anteriores de esta misma página; abajo está el número corregido y de dónde venía el error. Cuentan tanto como los números del panel.',
            'Things people have tried to read in an image like this one that do not hold up here. Three of them were wrong in earlier versions of this very page; below is the corrected figure and where the error came from. They count as much as the numbers in the panel.') }}</p>
          <ul>
            <li><strong>{{ L('Si el tumor es neuroendocrino.', 'Whether the tumour is neuroendocrine.') }}</strong>
              {{ L(`La textura de cromatina necesita más resolución de la que hay aquí: la señal clara llega a ${D.resolucion.senal_clara_um} µm y el suelo de ruido está en ${D.resolucion.suelo_um} µm. Lo decide la inmunohistoquímica.`,
                   `Chromatin texture needs more resolution than there is here: clear signal reaches ${D.resolucion.senal_clara_um} µm and the noise floor sits at ${D.resolucion.suelo_um} µm. Immunohistochemistry decides it.`) }}</li>
            <li><strong>{{ L('Cuánto tumor queda en el bloque.', 'How much tumour is left in the block.') }}</strong>
              {{ L('Esto es un corte y el bloque tiene profundidad. Solo el laboratorio que lo guarda puede decir cuántas micras restan.',
                   'This is one slide and the block has depth. Only the lab holding it can say how many microns remain.') }}</li>
            <li><strong>{{ L('Si la metástasis destruye o forma hueso.', 'Whether the metastasis destroys or forms bone.') }}</strong>
              {{ L('Es una trabécula en un campo de 831 µm de ancho. Con eso no se concluye.',
                   'It is one trabecula in a field 831 µm wide. That settles nothing.') }}</li>
            <li><strong>{{ L('El grado y el índice proliferativo.', 'Grade and proliferation index.') }}</strong>
              {{ L('El grado lo asigna un patólogo sobre el porta completo, no sobre un campo suelto; el índice proliferativo necesita su propia tinción.',
                   'Grade is assigned by a pathologist on the whole slide, not on a single field; the proliferation index needs its own stain.') }}</li>
            <li><strong>{{ L('Cuántos osteocitos hay.', 'How many osteocytes there are.') }}</strong>
              {{ D.osteocitos.veredicto }}</li>
            <li><strong>{{ L('Cuánto miden los fragmentos.', 'How large the fragments are.') }}</strong>
              {{ D.fragmentos_nota.fuente_buena }}</li>
          </ul>
        </section>
      </div>

      <aside class="hist__panel">
        <section>
          <h2>{{ L('Campo mostrado', 'Field shown') }}</h2>
          <p class="hist__dato">{{ D.campo_um[0] }} × {{ D.campo_um[1] }} µm</p>
          <table>
            <tbody>
              <tr><td>{{ L('Calibración', 'Calibration') }}</td><td>{{ D.calibracion.um_px }} ± {{ D.calibracion.incertidumbre_pct }}% µm/px</td></tr>
              <tr><td>{{ L('Señal clara hasta', 'Clear signal to') }}</td><td>{{ D.resolucion.senal_clara_um }} µm</td></tr>
              <tr><td>{{ L('Suelo de ruido', 'Noise floor') }}</td><td>{{ D.resolucion.suelo_um }} µm</td></tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2>{{ L('Cuánto tejido hay', 'How much tissue') }}</h2>
          <p class="hist__dato">{{ D.composicion.tejido_mm2_ref }} mm²</p>
          <table>
            <tbody>
              <tr><td>{{ L('Rango según umbral', 'Range by threshold') }}</td><td>{{ D.composicion.tejido_mm2_min }}–{{ D.composicion.tejido_mm2_max }} mm²</td></tr>
              <tr><td>{{ L('Ocupación del encuadre', 'Share of the frame') }}</td><td>{{ D.composicion.tejido_pct_min }}–{{ D.composicion.tejido_pct_max }} %</td></tr>
              <tr><td>{{ L('Trabécula ósea', 'Bone trabecula') }}</td><td>{{ D.trabecula.area_mm2_min }}–{{ D.trabecula.area_mm2_max }} mm²</td></tr>
              <tr><td>{{ L('Trabécula (% del tejido)', 'Trabecula (% of tissue)') }}</td><td>{{ D.trabecula.pct_tejido_min }}–{{ D.trabecula.pct_tejido_max }} %</td></tr>
            </tbody>
          </table>
          <p class="hist__hint">{{ D.trabecula.nota }}</p>
        </section>
        <section>
          <h2>{{ L('Núcleos', 'Nuclei') }}</h2>
          <p class="hist__dato">{{ D.nucleos.n }}</p>
          <table>
            <tbody>
              <tr><td>{{ L('Diámetro mediano', 'Median diameter') }}</td><td>{{ D.nucleos.diam_mediano_um }} µm</td></tr>
              <tr><td>{{ L('Rango 10–90', '10–90 range') }}</td><td>{{ D.nucleos.diam_p10 }}–{{ D.nucleos.diam_p90 }} µm</td></tr>
              <tr><td>{{ L('Densidad', 'Density') }}</td><td>{{ D.nucleos.densidad_masa_celular }}/mm²</td></tr>
            </tbody>
          </table>
          <p class="hist__hint">{{ L(`Segmentados con ${D.nucleos.modelo}.`, `Segmented with ${D.nucleos.modelo}.`) }}</p>
        </section>
        <section>
          <h2>{{ L('Regla', 'Ruler') }}</h2>
          <p class="hist__hint">{{ L('Con ratón: mantén Mayús y arrastra. Con teclado: pulsa M, mueve con las flechas y marca cada extremo con Intro. Para acercar con la rueda, pulsa Ctrl o haz clic antes en la imagen.',
                                     'With a mouse: hold Shift and drag. With a keyboard: press M, move with the arrows and mark each end with Enter. To zoom with the wheel, hold Ctrl or click the image first.') }}</p>
          <p class="hist__dato" role="status" aria-live="polite">{{ medida }}</p>
        </section>
      </aside>
    </div>

    <section class="hist__panel-mol">
      <h2>{{ L(D.panel.titulo_es, D.panel.titulo_en) }}</h2>
      <p class="hist__lede">{{ L(D.panel.intro_es, D.panel.intro_en) }}</p>

      <div class="hist__mol-grid">
        <div class="hist__mol-card">
          <h3>{{ L('Los dos amplicones', 'The two amplicons') }}</h3>
          <div v-for="a in D.panel.amplicones" :key="a.locus" class="hist__ampli">
            <span class="hist__locus">{{ a.locus }}</span>
            <span class="hist__genes">{{ a.genes }}</span>
            <span class="hist__copias">{{ a.copias }} {{ L('copias', 'copies') }}</span>
          </div>
          <p class="hist__hint">{{ L(D.panel.amplicones_nota_es, D.panel.amplicones_nota_en) }}</p>
        </div>

        <div class="hist__mol-card">
          <h3>{{ L('Firmas genómicas', 'Genomic signatures') }}</h3>
          <table>
            <tbody>
              <tr v-for="f in D.panel.firmas" :key="f.es"><td>{{ L(f.es, f.en) }}</td><td>{{ f.v }}</td></tr>
            </tbody>
          </table>
          <h3 class="hist__h3b">{{ L('Calidad de la muestra', 'Sample quality') }}</h3>
          <table>
            <tbody>
              <tr v-for="c in D.panel.calidad" :key="c.es"><td>{{ L(c.es, c.en) }}</td><td>{{ c.v }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="hist__mol-card">
          <h3>{{ L('Una variante puntual', 'One point variant') }}</h3>
          <p class="hist__dato">{{ D.panel.variante.gen }} {{ D.panel.variante.cambio }}</p>
          <p class="hist__hint">{{ L('Frecuencia alélica', 'Allele frequency') }} {{ D.panel.variante.vaf }}.
            {{ L(D.panel.variante.es, D.panel.variante.en) }}</p>
          <h3 class="hist__h3b">{{ L('Sin alteración reportable', 'No reportable alteration') }}</h3>
          <p class="hist__genes-limpios">{{ D.panel.limpios }}</p>
          <p class="hist__hint">{{ L(D.panel.limpios_nota_es, D.panel.limpios_nota_en) }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hist { max-width: 1180px; margin: 0 auto; padding: var(--space-8, 2rem) var(--space-4, 1rem) var(--space-16, 4rem); }
.hist__head { margin-bottom: var(--space-6, 1.5rem); }
.hist__tag { display: inline-block; font-family: var(--font-mono); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; color: var(--color-miriam); border: 1px solid currentColor; border-radius: var(--radius-sm, 3px); padding: 2px 7px; margin-bottom: .6rem; }
.hist h1 { font-family: var(--font-display); font-size: clamp(1.6rem, 4vw, 2rem); line-height: 1.15; margin: 0 0 .4rem; }
.hist__lede { color: var(--color-text-soft); max-width: var(--measure, 66ch); }
.hist__grid { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 1.1rem; align-items: start; }
@media (max-width: 900px) { .hist__grid { grid-template-columns: 1fr; } }
.hist__card, .hist__limites, .hist__panel { background: var(--color-bg-card); border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); border-radius: var(--radius-card, 10px); }
.hist__visor { position: relative; overflow: hidden; border-radius: var(--radius-card, 10px) var(--radius-card, 10px) 0 0; background: #000; cursor: crosshair; touch-action: none; }
.hist__visor:focus-visible { outline: 3px solid var(--color-miriam); outline-offset: -3px; }
.hist__visor canvas { display: block; width: 100%; height: auto; }
.hist__barra { display: flex; flex-wrap: wrap; gap: .4rem; padding: .65rem; border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.hist__barra button { font: inherit; font-size: .82rem; min-height: 44px; padding: 0 .85rem; background: transparent; color: var(--color-text); border: 1px solid color-mix(in srgb, var(--color-text) 20%, transparent); border-radius: var(--radius-btn, 6px); cursor: pointer; }
.hist__barra button:hover { border-color: var(--color-miriam); color: var(--color-miriam); }
.hist__barra button[aria-pressed="true"] { background: var(--color-miriam); border-color: var(--color-miriam); color: #fff; }
.hist__leyenda { display: flex; flex-wrap: wrap; gap: .9rem; padding: .75rem .9rem; border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); font-size: .82rem; color: var(--color-text-soft); }
.hist__leyenda i { display: inline-block; width: 16px; height: 12px; border-radius: 2px; margin-right: .35rem; vertical-align: -2px; border: 1px solid currentColor; }
.hist__leyenda i.is-hueso { background: #c0175c; color: #c0175c; }
.hist__leyenda i.is-celula { background: #6a2f92; color: #6a2f92; }
.hist__leyenda i.is-nucleo { background: #0a6459; color: #0a6459; }
.hist__leyenda-nota { flex-basis: 100%; font-size: .78rem; }
.hist__inset { padding: .75rem .9rem; border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.hist__inset img { width: 100%; display: block; border-radius: var(--radius-md, 6px); border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.hist__limites { margin-top: 1.1rem; padding: 1.1rem 1.25rem; border-left: 4px solid var(--color-miriam); }
.hist__limites h2 { font-family: var(--font-display); font-size: 1.05rem; margin: 0 0 .2rem; }
.hist__limites li { margin-bottom: .5rem; }
.hist__panel section { padding: .9rem 1rem; }
.hist__panel section + section { border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); }
.hist__panel h2 { font-size: .7rem; letter-spacing: .07em; text-transform: uppercase; color: var(--color-text-soft); margin: 0 0 .5rem; }
.hist__dato { font-family: var(--font-mono); font-size: 1.35rem; font-weight: 600; margin: 0 0 .4rem; font-variant-numeric: tabular-nums; }
.hist__panel table { font-family: var(--font-mono); width: 100%; border-collapse: collapse; font-size: .82rem; }
.hist__panel td { padding: .15rem 0; }
.hist__panel td:last-child { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.hist__hint { font-size: .78rem; color: var(--color-text-soft); margin: .45rem 0 0; }
.hist__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.hist__panel-mol { margin-top: 1.4rem; }
.hist__panel-mol > h2 { font-family: var(--font-display); font-size: 1.25rem; margin: 0 0 .3rem; }
.hist__mol-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-top: .9rem; }
.hist__mol-card { background: var(--color-bg-card); border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent); border-radius: var(--radius-card, 10px); padding: 1rem 1.1rem; }
.hist__mol-card h3 { font-size: .7rem; letter-spacing: .07em; text-transform: uppercase; color: var(--color-text-soft); margin: 0 0 .6rem; }
.hist__mol-card .hist__h3b { margin-top: 1.1rem; }
.hist__mol-card table { width: 100%; border-collapse: collapse; font-size: .82rem; font-family: var(--font-mono); }
.hist__mol-card td { padding: .18rem 0; }
.hist__mol-card td:last-child { text-align: right; white-space: nowrap; }
.hist__ampli { display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; padding: .45rem 0; border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent); }
.hist__locus { font-family: var(--font-mono); font-weight: 600; color: var(--color-miriam); }
.hist__genes { font-family: var(--font-mono); font-size: .8rem; flex: 1; }
.hist__copias { font-family: var(--font-mono); font-size: .8rem; color: var(--color-text-soft); }
.hist__genes-limpios { font-family: var(--font-mono); font-size: .8rem; margin: 0; color: var(--color-text-soft); }
</style>
