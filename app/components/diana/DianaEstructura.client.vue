<script setup lang="ts">
/**
 * DianaEstructura — la estructura PREDICHA de una proteína (AlphaFold DB), girable, como isla de cliente.
 *
 * El modelo se pide a la API pública de AlphaFold DB por su UniProt (app/utils/tresDianas.ts) cuando el visor
 * entra en pantalla; no se guarda en la web. Se dibuja la traza de los carbonos alfa como un tubo, coloreado por la
 * confianza de la predicción (pLDDT, columna del factor B) con los tokens del design system.
 *
 * Movimiento (gramática del sitio: «dibuja una vez al entrar y descansa»): da UNA vuelta al entrar en pantalla y se
 * para; nunca con «movimiento reducido». Botón para dar otra vuelta o pararla (WCAG 2.2.2). Arrastrar gira (ratón; en
 * táctil, dos dedos, para que uno siga desplazando la página), Ctrl/⌘ + rueda acerca, y con el foco en el visor las
 * flechas giran a pasos. Todo lo que dice el dibujo está también en texto (leyenda y descripción).
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ruedaConModificador } from '~/composables/useAlVer'
import { BANDAS, ETIQUETA_BANDA, banda, encuadre, pdbDeRespuesta, trazaCA, urlApiAlphaFold, urlEntradaAlphaFold, type Banda, type Diana } from '~/utils/tresDianas'

const props = defineProps<{ diana: Diana; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

const caja = ref<HTMLElement | null>(null)
const host = ref<HTMLElement | null>(null)
const estado = ref<'espera' | 'cargando' | 'listo' | 'error'>('espera')
const girando = ref(false)
const version = ref<number | null>(null)
const nResiduos = ref(0)
const reparto = ref<Record<Banda, number>>({ muy_alta: 0, alta: 0, baja: 0, muy_baja: 0 })

let renderer: THREE.WebGLRenderer | null = null
let escena: THREE.Scene | null = null
let camara: THREE.PerspectiveCamera | null = null
let controles: OrbitControls | null = null
let malla: THREE.Mesh | null = null
let raf = 0
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
let sueltaRueda: (() => void) | null = null
let reduce = false
/** ángulo que falta para completar la vuelta en curso (rad) */
let falta = 0
let ultimo = 0

/** Colores por banda, de los tokens (ningún hex nuevo): tinta, violeta firma, violeta suave y gris de tinta. */
function colores(): Record<Banda, THREE.Color> {
  const css = getComputedStyle(document.documentElement)
  const rgb = (v: string) => css.getPropertyValue(v).trim().split(/\s+/).map(Number) as [number, number, number]
  const tinta = rgb('--color-text-rgb'), violeta = rgb('--color-miriam-rgb'), crema = rgb('--color-bg-rgb')
  const mezcla = (a: number[], b: number[], p: number) => a.map((x, i) => Math.round(x * p + b[i]! * (1 - p)))
  const c = (x: number[]) => new THREE.Color().setRGB(x[0]! / 255, x[1]! / 255, x[2]! / 255, THREE.SRGBColorSpace)
  return { muy_alta: c(tinta), alta: c(violeta), baja: c(mezcla(violeta, crema, 0.45)), muy_baja: c(mezcla(tinta, crema, 0.3)) }
}
/** Muestras de la leyenda: los mismos colores, en CSS. */
const muestras = ref<Record<Banda, string>>({ muy_alta: '', alta: '', baja: '', muy_baja: '' })

async function carga() {
  estado.value = 'cargando'
  try {
    const r = await fetch(urlApiAlphaFold(props.diana.uniprot), { credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!r.ok) throw new Error(`API ${r.status}`)
    const pdb = pdbDeRespuesta(await r.json(), props.diana.uniprot)
    if (!pdb) throw new Error('respuesta sin modelo de ese UniProt')
    const f = await fetch(pdb.url, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!f.ok) throw new Error(`PDB ${f.status}`)
    const traza = trazaCA(await f.text())
    if (traza.n < 4) throw new Error('modelo vacío')
    version.value = pdb.version
    nResiduos.value = traza.n
    const cuenta: Record<Banda, number> = { muy_alta: 0, alta: 0, baja: 0, muy_baja: 0 }
    for (const p of traza.plddt) cuenta[banda(p)]++
    reparto.value = cuenta
    monta(traza)
    estado.value = 'listo'
  }
  catch (e) {
    console.warn('[DianaEstructura]', props.diana.uniprot, e)
    estado.value = 'error'
  }
}

function monta(traza: ReturnType<typeof trazaCA>) {
  const el = host.value
  if (!el) return
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) }
  catch { estado.value = 'error'; return }
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
  const geo = new THREE.TubeGeometry(curva, tramos, 0.55, radial, false)
  const cs = colores()
  muestras.value = Object.fromEntries(BANDAS.map((b) => [b, `#${cs[b].getHexString(THREE.SRGBColorSpace)}`])) as Record<Banda, string>
  const col = new Float32Array(geo.attributes.position!.count * 3)
  for (let j = 0; j <= tramos; j++) {
    const res = Math.min(traza.n - 1, Math.round((j / tramos) * (traza.n - 1)))
    const c = cs[banda(traza.plddt[res]!)]
    for (let k = 0; k <= radial; k++) { const v = j * (radial + 1) + k; col[3 * v] = c.r; col[3 * v + 1] = c.g; col[3 * v + 2] = c.b }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 }))
  escena.add(malla)

  camara = new THREE.PerspectiveCamera(35, 1, 0.1, radio * 20)
  camara.position.set(0, 0, radio * 2.9)
  controles = new OrbitControls(camara, renderer.domElement)
  controles.enableDamping = true
  controles.enablePan = false
  controles.minDistance = radio * 0.8
  controles.maxDistance = radio * 5
  // táctil: un dedo desplaza la página; dos dedos giran y acercan
  controles.touches = { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE }
  renderer.domElement.style.touchAction = 'pan-y'
  controles.addEventListener('start', () => { falta = 0; girando.value = false })
  sueltaRueda = ruedaConModificador(el, () => L('Ctrl o ⌘ + rueda para acercar', 'Ctrl or ⌘ + scroll to zoom'))

  ajusta()
  ro = new ResizeObserver(ajusta)
  ro.observe(el)
  if (!reduce) unaVuelta()
  ultimo = performance.now()
  bucle()
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
}

/** Una vuelta completa (~14 s) y quieto. */
function unaVuelta() { falta = Math.PI * 2; girando.value = true }
function para() { falta = 0; girando.value = false }
function alterna() { if (girando.value) para(); else unaVuelta() }

function bucle() {
  raf = requestAnimationFrame(bucle)
  const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000)
  ultimo = ahora
  if (malla && falta > 0) {
    const paso = Math.min(falta, dt * (Math.PI * 2 / 14))
    malla.rotation.y += paso
    falta -= paso
    if (falta <= 0) girando.value = false
  }
  controles?.update()
  if (renderer && escena && camara) renderer.render(escena, camara)
}

/** Teclado: flechas giran 15° (el tubo, no la cámara: así no se pelea con el amortiguado), + y − acercan. */
function tecla(e: KeyboardEvent) {
  if (!malla || !camara || !controles) return
  const p = Math.PI / 12
  if (e.key === 'ArrowLeft') malla.rotation.y -= p
  else if (e.key === 'ArrowRight') malla.rotation.y += p
  else if (e.key === 'ArrowUp') malla.rotation.x -= p
  else if (e.key === 'ArrowDown') malla.rotation.x += p
  else if (e.key === '+' || e.key === '=') camara.position.multiplyScalar(0.9)
  else if (e.key === '-') camara.position.multiplyScalar(1.1)
  else return
  e.preventDefault()
  para()
}

onMounted(() => { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches })
// la ref puede llegar después de montar (isla de cliente dentro de <ClientOnly>): se vigila en vez de leerla al montar
watch(caja, (el) => {
  if (!el || io || estado.value !== 'espera') return
  io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting && estado.value === 'espera') { io?.disconnect(); carga() } }, { rootMargin: '200px' })
  io.observe(el)
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  io?.disconnect(); ro?.disconnect(); sueltaRueda?.()
  controles?.dispose()
  if (malla) { malla.geometry.dispose(); (malla.material as THREE.Material).dispose() }
  renderer?.dispose()
  renderer?.domElement.remove()
})

const pct = (k: number) => (nResiduos.value ? Math.round((100 * k) / nResiduos.value) : 0)
const descripcion = computed(() => L(
  `Estructura predicha de ${props.diana.proteina} (${props.diana.gen}, UniProt ${props.diana.uniprot}) por AlphaFold, ${nResiduos.value} aminoácidos, coloreada por la confianza de la predicción. Es una predicción, no una medición.`,
  `Predicted structure of ${props.diana.proteina} (${props.diana.gen}, UniProt ${props.diana.uniprot}) by AlphaFold, ${nResiduos.value} amino acids, colored by prediction confidence. A prediction, not a measurement.`,
))
</script>

<template>
  <figure ref="caja" class="de">
    <div class="de__lienzo">
      <div
        ref="host"
        class="de__host"
        role="img"
        tabindex="0"
        :aria-label="estado === 'listo' ? `${descripcion} ${L('Con el foco aquí, las flechas la giran.', 'With focus here, the arrow keys rotate it.')}` : L(`Estructura predicha de ${diana.proteina}`, `Predicted structure of ${diana.proteina}`)"
        @keydown="tecla"
      />
      <p v-if="estado === 'espera' || estado === 'cargando'" class="de__aviso" aria-live="polite">{{ L('Cargando el modelo de AlphaFold DB…', 'Loading the AlphaFold DB model…') }}</p>
      <p v-else-if="estado === 'error'" class="de__aviso" role="status">
        {{ L('No se ha podido cargar el modelo aquí. Puedes verlo en', 'The model could not be loaded here. You can see it on') }}
        <a :href="urlEntradaAlphaFold(diana.uniprot)" class="link-underline" target="_blank" rel="noopener">AlphaFold DB</a>.
      </p>
      <button v-if="estado === 'listo'" type="button" class="de__girar" :aria-pressed="girando" @click="alterna">
        {{ girando ? L('Parar el giro', 'Stop rotation') : L('Dar una vuelta', 'Rotate once') }}
      </button>
    </div>
    <figcaption class="de__pie">
      <p class="de__sello">{{ L('Predicción, no medición.', 'A prediction, not a measurement.') }}</p>
      <p v-if="estado === 'listo'" class="de__ley-t" aria-hidden="true">{{ L('Confianza del modelo (pLDDT), por aminoácido', 'Model confidence (pLDDT), per amino acid') }}</p>
      <ul v-if="estado === 'listo'" class="de__leyenda" :aria-label="L('Confianza del modelo (pLDDT), por aminoácido', 'Model confidence (pLDDT), per amino acid')">
        <li v-for="b in BANDAS" :key="b">
          <span class="de__muestra" :style="{ background: muestras[b] }" aria-hidden="true" />
          <span>{{ ETIQUETA_BANDA[b][lang] }}</span>
          <span class="de__cifra">{{ pct(reparto[b]) }}&nbsp;%</span>
        </li>
      </ul>
      <p v-if="estado === 'listo'" class="de__meta">
        {{ L('Modelo', 'Model') }} AF-{{ diana.uniprot }}-F1{{ version ? ` v${version}` : '' }} · {{ nResiduos }} {{ L('aminoácidos', 'amino acids') }} ·
        {{ L('arrastra para girar; Ctrl/⌘ + rueda para acercar', 'drag to rotate; Ctrl/⌘ + scroll to zoom') }}
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
.de__girar {
  position: absolute; right: var(--sp-8); bottom: var(--sp-8); min-height: 44px; padding: 0 var(--sp-16);
  border-radius: 9999px; border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1);
  font: 600 var(--texto-sm)/1 var(--font-body); cursor: pointer;
}
.de__girar:hover { background: var(--superficie); }
.de__girar:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.de__pie { display: grid; gap: var(--sp-8); }
.de__sello { margin: 0; font: var(--tipo-eyebrow); color: var(--identidad); }
.de__ley-t { margin: 0; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.de__leyenda { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4) var(--sp-16); font: var(--tipo-body-sm); color: var(--texto-2); }
.de__leyenda li { display: flex; align-items: center; gap: var(--sp-8); }
.de__muestra { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; border: 1px solid var(--trazo-fuerte); }
.de__cifra { margin-left: auto; font-family: var(--font-mono); font-size: 0.85em; }
.de__meta { margin: 0; font: var(--tipo-body-sm); color: var(--texto-3); }
</style>
