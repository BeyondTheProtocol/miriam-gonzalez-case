<script setup lang="ts">
/**
 * CelulaExplorarEstructura: la estructura PREDICHA de la proteína del gen abierto en el explorador (AlphaFold DB),
 * girable, como isla de cliente. Vive plegada en el detalle del gen y solo se monta al desplegarla, así que three.js y
 * el modelo no se piden a quien no la abre (app/utils/alphafold.ts; nació en una página aparte, retirada el 20-oct-2026).
 *
 * El modelo se pide a la API pública de AlphaFold DB por su UniProt al montarse el visor; no se guarda en la web. Se
 * dibuja la traza de los carbonos alfa como un tubo coloreado por la confianza del modelo (pLDDT, columna del factor B)
 * con los tokens del DS. El color no va solo (ceci, 20-oct): el tubo
 * es más fino cuanto menos confianza (estilo «putty»), y la leyenda va en texto con su porcentaje de aminoácidos.
 *
 * Movimiento (gramática del sitio: «dibuja una vez al entrar y descansa»): UNA vuelta cuando el visor está a la vista
 * de verdad (mitad dentro), nunca con «movimiento reducido», y nunca dos visores a la vez (al girar uno, los otros
 * paran). Botón para dar otra vuelta o pararla (WCAG 2.2.2). Ratón: arrastrar gira, Ctrl/⌘ + rueda acerca. Teclado
 * (con el foco en el visor) y botones de paso para quien no arrastra (2.5.7): girar y acercar. En táctil el visor no
 * captura el dedo: la página sigue desplazándose y ampliándose; se gira con los botones.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ruedaConModificador } from '~/composables/useAlVer'
import { BANDAS, ETIQUETA_BANDA, banda, encuadre, pdbDeRespuesta, trazaCA, urlApiAlphaFold, urlEntradaAlphaFold, urlUniprot, type Banda } from '~/utils/alphafold'

/** gen del explorador, su UniProt (UNIPROT de utils/alphafold), el nombre de la proteína con el que se la conoce y el tema
 * del explorador (data-tema es de su bloque, no de :root: los colores del tubo lo necesitan; diseno, 20-oct) */
const props = defineProps<{ gen: string; uniprot: string; proteina: string; lang: 'es' | 'en'; tema: 'claro' | 'oscuro' }>()
/** al montarse, el lienzo: el explorador lo pone a la vista (al desplegar en escritorio se abría fuera; diseno, 20-oct) */
const emit = defineEmits<{ montado: [HTMLElement] }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

/** el visor que gira ahora (uno solo en la página): compartido entre instancias */
const girandoAhora = useState<string | null>('estructura-girando', () => null)

const caja = ref<HTMLElement | null>(null)
const lienzo = ref<HTMLElement | null>(null)
const host = ref<HTMLElement | null>(null)
const estado = ref<'espera' | 'cargando' | 'listo' | 'error'>('espera')
const girando = ref(false)
const version = ref<number | null>(null)
const nResiduos = ref(0)
const reparto = ref<Record<Banda, number>>({ muy_alta: 0, alta: 0, baja: 0, muy_baja: 0 })
const uid = `de-${props.uniprot}`

let renderer: THREE.WebGLRenderer | null = null
let escena: THREE.Scene | null = null
let camara: THREE.PerspectiveCamera | null = null
let controles: OrbitControls | null = null
let malla: THREE.Mesh | null = null
let raf = 0
let ioVista: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
let sueltaRueda: (() => void) | null = null
let reduce = false
let vueltaDeEntrada = false
/** ángulo que falta para completar la vuelta en curso (rad) */
let falta = 0
let ultimo = 0
/** hay que volver a pintar (el bucle no pinta si nada cambia) */
let sucio = true

/** Radio del tubo por banda: más fino cuanto menos confianza. */
const RADIO: Record<Banda, number> = { muy_alta: 0.75, alta: 0.6, baja: 0.42, muy_baja: 0.28 }

/** Colores por banda, de los tokens (ningún hex nuevo): la rampa --viz-sev del violeta y un gris de tinta. En oscuro la
 * rampa parte del violeta claro y baja hacia la tinta: con la de claro, lo menos fiable brillaba y lo más fiable se hundía
 * (muy alta 2,03:1 sobre el lienzo; diseno, 20-oct). Alta y baja quedan bajo 3:1 en los dos temas, como se aceptó el
 * 20-oct: el grosor del tubo y la leyenda en texto con su % llevan la señal. */
function colores(tema: 'claro' | 'oscuro'): Record<Banda, THREE.Color> {
  const css = getComputedStyle(document.documentElement)
  const rgb = (v: string) => css.getPropertyValue(v).trim().split(/\s+/).map(Number) as [number, number, number]
  const tinta = rgb('--color-text-rgb'), violeta = rgb('--color-miriam-rgb'), crema = rgb('--color-bg-rgb')
  const mezcla = (a: number[], b: number[], p: number) => a.map((x, i) => Math.round(x * p + b[i]! * (1 - p)))
  const c = (x: number[]) => new THREE.Color().setRGB(x[0]! / 255, x[1]! / 255, x[2]! / 255, THREE.SRGBColorSpace)
  if (tema === 'oscuro') {
    const claro = rgb('--color-miriam-claro-rgb')
    return { muy_alta: c(claro), alta: c(mezcla(claro, tinta, 0.8)), baja: c(mezcla(claro, tinta, 0.6)), muy_baja: c(mezcla(crema, tinta, 0.5)) }
  }
  // rampa (diseno, 20-oct): violeta firma → --viz-sev-3 (mezcla 0,6) → --viz-sev-2 (mezcla 0,38); la muy baja, gris de tinta neutro
  return { muy_alta: c(violeta), alta: c(mezcla(violeta, crema, 0.6)), baja: c(mezcla(violeta, crema, 0.38)), muy_baja: c(mezcla(tinta, crema, 0.55)) }
}
/** banda de cada anillo del tubo: para repintar al cambiar de tema sin rehacer la geometría */
let bandaAnillo: Banda[] = []
let radialTubo = 0
function pinta() {
  if (!malla) return
  const cs = colores(props.tema)
  muestras.value = Object.fromEntries(BANDAS.map((b) => [b, `#${cs[b].getHexString(THREE.SRGBColorSpace)}`])) as Record<Banda, string>
  const geo = malla.geometry
  const n = geo.attributes.position!.count
  const col = (geo.getAttribute('color') as THREE.BufferAttribute | undefined)?.array as Float32Array | undefined ?? new Float32Array(n * 3)
  for (let j = 0; j < bandaAnillo.length; j++) {
    const c = cs[bandaAnillo[j]!]
    for (let k = 0; k <= radialTubo; k++) { const i = j * (radialTubo + 1) + k; col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b }
  }
  if (!geo.getAttribute('color')) geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  else geo.getAttribute('color')!.needsUpdate = true
  sucio = true
}
watch(() => props.tema, pinta)
/** Muestras de la leyenda: los mismos colores, en CSS. */
const muestras = ref<Record<Banda, string>>({ muy_alta: '', alta: '', baja: '', muy_baja: '' })

/** el modelo ya leído, por UniProt: reabrir el bloque no vuelve a pedirlo (diseno, 20-oct: 40 peticiones en 19 aperturas) */
const CACHE = ((globalThis as { __afCache?: Map<string, { traza: ReturnType<typeof trazaCA>; version: number | null }> }).__afCache ??= new Map())
let corta: AbortController | null = null
async function carga() {
  estado.value = 'cargando'
  try {
    let m = CACHE.get(props.uniprot)
    if (!m) {
      corta = new AbortController()
      const op = { credentials: 'omit', referrerPolicy: 'no-referrer', signal: corta.signal } as const
      const r = await fetch(urlApiAlphaFold(props.uniprot), op)
      if (!r.ok) throw new Error(`API ${r.status}`)
      const pdb = pdbDeRespuesta(await r.json(), props.uniprot)
      if (!pdb) throw new Error('respuesta sin modelo de ese UniProt')
      const f = await fetch(pdb.url, op)
      if (!f.ok) throw new Error(`PDB ${f.status}`)
      m = { traza: trazaCA(await f.text()), version: pdb.version }
      if (m.traza.n < 4) throw new Error('modelo vacío')
      CACHE.set(props.uniprot, m)
    }
    const traza = m.traza
    version.value = m.version
    nResiduos.value = traza.n
    const cuenta: Record<Banda, number> = { muy_alta: 0, alta: 0, baja: 0, muy_baja: 0 }
    for (const p of traza.plddt) cuenta[banda(p)]++
    reparto.value = cuenta
    if (!monta(traza)) throw new Error('sin WebGL')
    estado.value = 'listo'
  }
  catch (e) {
    if (corta?.signal.aborted) return   // se plegó mientras cargaba: no es un error
    console.warn('[CelulaExplorarEstructura]', props.uniprot, e)
    estado.value = 'error'
  }
}

function monta(traza: ReturnType<typeof trazaCA>): boolean {
  const el = host.value
  if (!el) return false
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) }
  catch { return false }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'

  escena = new THREE.Scene()
  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a7a90, 1.6))
  const luz = new THREE.DirectionalLight(0xffffff, 1.4)
  luz.position.set(1, 1.5, 2)
  escena.add(luz)

  const { centro, radio } = encuadre(traza)
  const puntos: THREE.Vector3[] = []
  for (let i = 0; i < traza.n; i++) puntos.push(new THREE.Vector3(traza.xyz[3 * i]! - centro[0], traza.xyz[3 * i + 1]! - centro[1], traza.xyz[3 * i + 2]! - centro[2]))
  const curva = new THREE.CatmullRomCurve3(puntos, false, 'centripetal')
  const tramos = Math.min(traza.n * 4, 6000), radial = 6
  const geo = new THREE.TubeGeometry(curva, tramos, 1, radial, false)   // radio 1: cada anillo se escala a su banda
  const pos = geo.attributes.position!
  const p = new THREE.Vector3(), v = new THREE.Vector3()
  bandaAnillo = []
  radialTubo = radial
  for (let j = 0; j <= tramos; j++) {
    const b = banda(traza.plddt[Math.min(traza.n - 1, Math.round((j / tramos) * (traza.n - 1)))]!)
    bandaAnillo.push(b)
    curva.getPointAt(j / tramos, p)
    for (let k = 0; k <= radial; k++) {
      const i = j * (radial + 1) + k
      v.fromBufferAttribute(pos, i).sub(p).multiplyScalar(RADIO[b]).add(p)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 }))
  pinta()   // los colores del tema y las muestras de la leyenda
  escena.add(malla)

  camara = new THREE.PerspectiveCamera(35, 1, 0.1, radio * 20)
  camara.position.set(0, 0, radio * 2.9)
  controles = new OrbitControls(camara, renderer.domElement)
  controles.enableDamping = true
  controles.enablePan = false
  controles.minDistance = radio * 0.8
  controles.maxDistance = radio * 5
  // táctil: el visor no se queda el dedo (ni uno ni dos): la página se desplaza y se amplía; se gira con los botones
  controles.touches = { ONE: -1 as unknown as THREE.TOUCH, TWO: -1 as unknown as THREE.TOUCH }
  renderer.domElement.style.touchAction = 'pan-x pan-y pinch-zoom'
  controles.addEventListener('start', () => para())
  controles.addEventListener('change', () => { sucio = true })
  sueltaRueda = ruedaConModificador(el, () => L('Ctrl o ⌘ + rueda para acercar', 'Ctrl or ⌘ + scroll to zoom'))

  ajusta()
  ro = new ResizeObserver(ajusta)
  ro.observe(el)
  // la vuelta de entrada, solo con el visor a la vista de verdad (no al cargarlo 200 px antes)
  if (!reduce && caja.value) {
    ioVista = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && !vueltaDeEntrada) { vueltaDeEntrada = true; ioVista?.disconnect(); unaVuelta() }
    }, { threshold: 0.5 })
    ioVista.observe(caja.value)
  }
  ultimo = performance.now()
  bucle()
  return true
}

function ajusta() {
  const el = host.value
  if (!el || !renderer || !camara) return
  const w = el.clientWidth || 300, h = el.clientHeight || 300
  renderer.setSize(w, h, false)
  renderer.domElement.style.width = `${w}px`
  renderer.domElement.style.height = `${h}px`
  camara.aspect = w / h
  camara.updateProjectionMatrix()
  sucio = true
}

/** Una vuelta completa (~14 s) y quieto. Para a los demás visores. */
function unaVuelta() { falta = Math.PI * 2; girando.value = true; girandoAhora.value = uid }
function para() { falta = 0; girando.value = false; if (girandoAhora.value === uid) girandoAhora.value = null }
function alterna() { if (girando.value) para(); else unaVuelta() }
watch(girandoAhora, (g) => { if (g !== uid && girando.value) { falta = 0; girando.value = false } })

function bucle() {
  raf = requestAnimationFrame(bucle)
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000)
  ultimo = ahora
  if (malla && falta > 0) {
    const paso = Math.min(falta, dt * (Math.PI * 2 / 14))
    malla.rotation.y += paso
    falta -= paso
    sucio = true
    if (falta <= 0) para()
  }
  if (controles?.update()) sucio = true
  if (sucio && renderer && escena && camara) { renderer.render(escena, camara); sucio = false }
}

/** Pasos de giro y zoom: los usan el teclado y los botones. */
function gira(dx: number, dy: number) { if (!malla) return; malla.rotation.y += dx; malla.rotation.x += dy; para(); sucio = true }
function acerca(f: number) {
  if (!camara || !controles) return
  const d = camara.position.length() * f
  if (d < controles.minDistance || d > controles.maxDistance) return
  camara.position.multiplyScalar(f); para(); sucio = true
}
const PASO = Math.PI / 12
function tecla(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') gira(-PASO, 0)
  else if (e.key === 'ArrowRight') gira(PASO, 0)
  else if (e.key === 'ArrowUp') gira(0, -PASO)
  else if (e.key === 'ArrowDown') gira(0, PASO)
  else if (e.key === '+' || e.key === '=') acerca(0.9)
  else if (e.key === '-') acerca(1.1)
  else return
  e.preventDefault()
}

onMounted(() => {
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (lienzo.value) emit('montado', lienzo.value)
})
// en el explorador el visor solo se monta cuando alguien despliega el bloque: carga ya, sin esperar a verlo en pantalla
// (la espera por IntersectionObserver era de la página con tres visores; dentro del panel dejaba «Cargando…» sin pedir nada)
watch(caja, (el) => { if (el && estado.value === 'espera') void carga() }, { immediate: true, flush: 'post' })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (girandoAhora.value === uid) girandoAhora.value = null
  ioVista?.disconnect(); ro?.disconnect(); sueltaRueda?.()
  controles?.dispose()
  corta?.abort()
  if (malla) { malla.geometry.dispose(); (malla.material as THREE.Material).dispose() }
  // soltar el contexto WebGL YA: dispose() no lo hace, y a la 16.ª apertura el navegador mataba el del mapa (diseno, 20-oct)
  renderer?.forceContextLoss()
  renderer?.dispose()
  renderer?.domElement.remove()
})

/** lo que anuncia la región viva: hay un solo visor, así que «cargando» ya no es ruido (diseno, 20-oct) */
const anuncio = computed(() => (estado.value === 'cargando' ? L(`Cargando la forma de ${props.proteina}…`, `Loading the ${props.proteina} shape…`)
  : estado.value === 'listo' ? L(`Forma de ${props.proteina} cargada.`, `${props.proteina} shape loaded.`)
    : estado.value === 'error' ? L(`No se ha podido cargar la forma de ${props.proteina}.`, `The ${props.proteina} shape could not be loaded.`) : ''))
const pct = (k: number) => (nResiduos.value ? Math.round((100 * k) / nResiduos.value) : 0)
const descripcion = computed(() => L(
  `Forma predicha de ${props.proteina} (${props.gen}, UniProt ${props.uniprot}) por AlphaFold, ${nResiduos.value} aminoácidos, coloreada por la confianza del modelo; el tubo es más fino donde la confianza es menor. Es una predicción, no una medición.`,
  `Predicted shape of ${props.proteina} (${props.gen}, UniProt ${props.uniprot}) by AlphaFold, ${nResiduos.value} amino acids, colored by model confidence; the tube is thinner where confidence is lower. A prediction, not a measurement.`,
))
</script>

<template>
  <figure ref="caja" class="de">
    <div ref="lienzo" class="de__lienzo">
      <div
        ref="host"
        class="de__host"
        :role="estado === 'listo' ? 'application' : undefined"
        :aria-roledescription="estado === 'listo' ? L('visor 3D', '3D viewer') : undefined"
        :aria-label="estado === 'listo' ? L(`Forma de ${proteina}`, `${proteina} shape`) : undefined"
        :aria-describedby="estado === 'listo' ? `${uid}-desc ${uid}-uso` : undefined"
        :aria-hidden="estado === 'listo' ? undefined : 'true'"
        :tabindex="estado === 'listo' ? 0 : undefined"
        @keydown="tecla"
      />
      <p v-if="estado === 'espera' || estado === 'cargando'" class="de__aviso" aria-hidden="true">{{ L('Cargando el modelo de AlphaFold DB…', 'Loading the AlphaFold DB model…') }}</p>
      <p v-else-if="estado === 'error'" class="de__aviso">
        {{ L('No se ha podido cargar el modelo aquí. Puedes verlo en', 'The model could not be loaded here. You can see it on') }}
        <a :href="urlEntradaAlphaFold(uniprot)" class="link-underline" target="_blank" rel="noopener">AlphaFold DB</a>.
      </p>
    </div>
    <!-- los mandos, debajo del lienzo y en flujo: superpuestos tapaban casi un tercio del modelo a 320 px (diseno, 20-oct) -->
    <div v-if="estado === 'listo'" class="de__mandos">
      <div class="de__pasos" role="group" :aria-label="L(`Mover la forma de ${proteina}`, `Move the ${proteina} shape`)">
        <button type="button" class="de__paso" :aria-label="L('Girar a la izquierda', 'Rotate left')" @click="gira(-PASO, 0)"><span aria-hidden="true">↶</span></button>
        <button type="button" class="de__paso" :aria-label="L('Girar a la derecha', 'Rotate right')" @click="gira(PASO, 0)"><span aria-hidden="true">↷</span></button>
        <button type="button" class="de__paso" :aria-label="L('Acercar', 'Zoom in')" @click="acerca(0.9)"><span aria-hidden="true">+</span></button>
        <button type="button" class="de__paso" :aria-label="L('Alejar', 'Zoom out')" @click="acerca(1.1)"><span aria-hidden="true">−</span></button>
      </div>
      <button type="button" class="de__girar" @click="alterna">
        {{ girando ? L('Parar el giro', 'Stop rotation') : L('Dar una vuelta', 'Rotate once') }}
      </button>
    </div>
    <p class="sr-only" role="status">{{ anuncio }}</p>
    <!-- orden (Adri y diseno, 20-oct): primero lo que hace falta para leer el modelo (aviso corto, leyenda y su clave),
         después la explicación larga, el modelo y el crédito -->
    <figcaption class="de__pie">
      <p class="de__sello">{{ L('Predicción, no medición.', 'A prediction, not a measurement.') }}</p>
      <!-- que nadie lea «la proteína de Miriam»: el bloque va bajo las cifras de la biopsia (Adri y verificacion, 20-oct) -->
      <p class="de__ctx">{{ L('Es la proteína humana de referencia (UniProt), no la de la biopsia de Miriam.', 'This is the human reference protein (UniProt), not the one from Miriam’s biopsy.') }}</p>
      <template v-if="estado === 'listo'">
        <p :id="`${uid}-desc`" class="sr-only">{{ descripcion }}</p>
        <p class="de__ley-t" aria-hidden="true">{{ L('Confianza del modelo en cada parte de la proteína (pLDDT)', 'Model confidence in each part of the protein (pLDDT)') }}</p>
        <ul class="de__leyenda" :aria-label="L('Confianza del modelo en cada parte de la proteína (pLDDT)', 'Model confidence in each part of the protein (pLDDT)')">
          <li v-for="b in BANDAS" :key="b">
            <span class="de__muestra" :class="`de__muestra--${b}`" :style="{ background: muestras[b] }" aria-hidden="true" />
            <span>{{ ETIQUETA_BANDA[b][lang] }}</span>
            <span class="de__cifra">{{ pct(reparto[b]) }}&nbsp;%</span>
          </li>
        </ul>
        <!-- la regla de lectura de < 50 es la de la FAQ de AlphaFold DB («should not be interpreted»; verificacion, 20-oct) -->
        <p class="de__clave">
          {{ L('El porcentaje es la parte de la proteína en cada nivel. El tubo es más fino donde el modelo confía menos. Las zonas de confianza muy baja (< 50) no se interpretan: AlphaFold DB las asocia a regiones sin una forma fija.',
               'The percentage is the share of the protein at each level. The tube is thinner where the model is less confident. Very low confidence regions (< 50) should not be interpreted: AlphaFold DB associates them with regions without a fixed shape.') }}
        </p>
      </template>
      <p class="de__clave">
        {{ L('AlphaFold es un programa de inteligencia artificial que predice cómo se pliega una proteína a partir de su secuencia de aminoácidos. Aquí parte de la secuencia de referencia de la proteína humana, así que no dice si esta proteína está en las células de Miriam; eso lo dice la inmunohistoquímica.',
             'AlphaFold is an artificial intelligence program that predicts how a protein folds from its amino acid sequence. Here it starts from the reference sequence of the human protein, so it does not say whether this protein is in Miriam’s cells; immunohistochemistry tells you that.') }}
      </p>
      <template v-if="estado === 'listo'">
        <p class="de__meta">{{ L('Modelo', 'Model') }} AF-{{ uniprot }}-F1{{ version ? ` v${version}` : '' }} · {{ nResiduos }} {{ L('aminoácidos', 'amino acids') }}</p>
        <p :id="`${uid}-uso`" class="de__meta">
          {{ L('Gírala con los botones, arrastrando con el ratón o, con el foco en el visor, con las flechas; acerca con + y −.', 'Rotate it with the buttons, by dragging with the mouse or, with focus on the viewer, with the arrow keys; zoom with + and −.') }}
        </p>
      </template>
      <p class="de__fuente">
        <a :href="urlEntradaAlphaFold(uniprot)" class="link-underline" target="_blank" rel="noopener">AlphaFold DB<span class="sr-only">{{ L(' (se abre en otra pestaña)', ' (opens in a new tab)') }}</span></a> (Google DeepMind · EMBL-EBI) · <a href="https://creativecommons.org/licenses/by/4.0/" class="link-underline" target="_blank" rel="noopener license">CC BY 4.0<span class="sr-only">{{ L(' (se abre en otra pestaña)', ' (opens in a new tab)') }}</span></a>
        · <a :href="urlUniprot(uniprot)" class="link-underline" target="_blank" rel="noopener">UniProt {{ uniprot }}<span class="sr-only">{{ L(' (se abre en otra pestaña)', ' (opens in a new tab)') }}</span></a>
      </p>
      <!-- las citas que pide AlphaFold DB (su FAQ, 20-oct-2026; volumen y páginas de Bertoni según Crossref): vivían en el pie de la página aparte -->
      <p class="de__meta">
        {{ L('Referencias:', 'References:') }}
        Jumper J. et al. <cite>Nature</cite> 596, 583–589 (2021), <a href="https://doi.org/10.1038/s41586-021-03819-2" class="link-underline" target="_blank" rel="noopener">doi:10.1038/s41586-021-03819-2</a> ·
        Bertoni D. et al. <cite>Nucleic Acids Research</cite> 54, D358–D362 (2025), <a href="https://doi.org/10.1093/nar/gkaf1226" class="link-underline" target="_blank" rel="noopener">doi:10.1093/nar/gkaf1226</a> ·
        <span lang="en">AlphaFold Data Copyright (2022) DeepMind Technologies Limited</span>
      </p>
    </figcaption>
  </figure>
</template>

<style scoped>
.de { margin: 0; display: grid; gap: var(--sp-12); }
.de__lienzo { position: relative; aspect-ratio: 1 / 1; max-height: 420px; width: 100%; border-radius: var(--radius-btn); background: var(--superficie); border: 1px solid var(--trazo-medio); overflow: hidden; }
.de__host { position: absolute; inset: 0; cursor: grab; }
.de__host:active { cursor: grabbing; }
.de__host:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: -4px; border-radius: var(--radius-btn); }
.de__aviso { position: absolute; inset: 0; display: grid; place-items: center; padding: var(--sp-16); text-align: center; font: var(--tipo-body-sm); color: var(--texto-2); }
.de__mandos { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--sp-8); }
.de__pasos { display: flex; gap: var(--sp-4); }
.de__paso, .de__girar {
  min-height: 44px; border-radius: 9999px; border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1);
  font: 600 var(--texto-sm)/1 var(--font-body); cursor: pointer;
  /* táctil (vara movimiento-movil; diseno, 20-oct): sin destello ni retardo de doble toque, y respuesta al pulsar */
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  transition: transform var(--dur-micro) var(--curva-entrada);
}
.de__paso:active, .de__girar:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .de__paso, .de__girar { transition: none; } .de__paso:active, .de__girar:active { transform: none; } }
.de__paso { min-width: 44px; font-size: 1.1rem; }
.de__girar { padding: 0 var(--sp-16); }
@media (hover: hover) and (pointer: fine) { .de__paso:hover, .de__girar:hover { background: var(--superficie); } }
.de__paso:focus-visible, .de__girar:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.de__pie { display: grid; gap: var(--sp-8); }
.de__sello { margin: 0; font: var(--tipo-eyebrow); color: var(--identidad); }
.de__fuente { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.de__fuente a { white-space: nowrap; }   /* «CC BY 4.0» y «UniProt P04626» se partían (diseno, 20-oct) */
.de__ctx { margin: 0; font: var(--tipo-body-sm); color: var(--texto-1); }
.de__clave { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.de__ley-t { margin: 0; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.de__leyenda { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4) var(--sp-16); font: var(--tipo-body-sm); color: var(--texto-2); }
.de__leyenda li { display: flex; align-items: center; gap: var(--sp-8); }
/* borde ≥ 3:1 (ceci, 20-oct) y la misma señal de forma que el tubo: muestra más baja cuanto menos confianza */
.de__muestra { width: 16px; border-radius: 3px; flex-shrink: 0; border: 1px solid var(--trazo-interactivo); }
.de__muestra--muy_alta { height: 16px; }
.de__muestra--alta { height: 12px; }
.de__muestra--baja { height: 8px; }
.de__muestra--muy_baja { height: 5px; }
.de__cifra { margin-left: auto; font-family: var(--font-mono); font-size: 0.85em; }
.de__meta { margin: 0; font: var(--tipo-body-sm); color: var(--texto-3); }
@media (max-width: 380px) { .de__leyenda { grid-template-columns: minmax(0, 1fr); } }
</style>
