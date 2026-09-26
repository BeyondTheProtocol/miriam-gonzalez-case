<script setup lang="ts">
/**
 * LiverView — el hígado en 3D, girable, con TODAS sus lesiones: las dos dianas del informe con
 * la medida del radiólogo, y el resto como detección automática sin validar (igual que el vídeo).
 *
 * La escena es la del vídeo del hígado ya aprobado (tools/visor3d_web/render.js en Polaris):
 * mismos materiales (hígado translúcido con Fresnel, vasos, vesícula, lesión crema), mismas
 * luces, mismo color por tamaño (≥ 10 mm crema brillante, < 10 mm lila mate) y mismo rótulo de
 * diana («Diana s.II · 20 mm»). La interacción copia BoneTriView:
 * arrastrar = girar, rueda = acercar, botón de reencuadre. Gira solo hasta que se toca
 * (nunca con prefers-reduced-motion). Si WebGL falla, queda la imagen fija de respaldo.
 *
 * Mallas: public/lesiones/higado/ (visor3d.py web: centradas en el hígado, sin coordenadas
 * del escáner ni metadatos) + escena.json con las etiquetas del radiólogo y los diámetros
 * automáticos. Los recuentos de la leyenda salen de ahí, no están escritos a mano.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ base: string; fallback: string; fallbackAlt: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const langIdx = computed(() => (lang.value === 'en' ? 1 : 0))

interface Lesion { malla: string; diametro_auto_mm: number; diana: string | null; mm_informe: number | null; suvmax?: number | null; pet?: string }
interface Pet { fecha: string; fondo_suvmean: number; fondo_suvsd: number; umbral_percist: number; dice_registro: number; focos_higado?: number; focos_sobre_lesion?: number; focos_sin_lesion?: number }
interface Foco { suvmax: number; segmento: number | null; centro: [number, number, number]; distancia_mm: number }
/* Marca del radiólogo SIN lesión automática debajo (35 de las 55): un punto, no una forma —
   ya no hay contorno segmentado que dibujar. `radio_mm` es lo que él midió, no el volumen de
   nada. `categoria` distingue sus dos salvedades (imagen 127: tres lesiones que se tocan entre
   sí, él las cuenta como tres; imagen 123: pegada a la cápsula, más difícil de valorar) del
   resto — no cambia el color, solo documenta el porqué si algún día hace falta filtrar. */
interface MarcaRadiologo { centro: [number, number, number]; radio_mm: number; categoria: 'confluente' | 'subcapsular' | 'estandar' }
interface Escena { mallas: Record<string, string>; lesiones: Lesion[]; pet?: Pet; focos?: Foco[]; marcas_radiologo?: MarcaRadiologo[] }

/* ── tooltip por lesión (comité de diseño, 26-sep) ──────────────────────────────────────
   Tres tipos: A (Polaris+radiólogo), B (diana del informe), C (solo radiólogo). Cada
   `Entrada` lleva su propio objeto 3D (para el rayo y para proyectar su posición) y el
   contenido YA resuelto en los dos idiomas — nada se recalcula en el hover, solo se elige
   el idioma. `obj` es el mesh/esfera; su centro en mundo es `geometry.boundingSphere.center`
   para las lesiones (mismo dato que ya usa `actualizaRotulos`) o `mesh.position` para las
   esferas de marca (creadas ya centradas, sin geometría trasladada). */
interface Entrada {
  tipo: 'A' | 'B' | 'C'
  obj: THREE.Object3D
  titulo: [string, string]
  lineas: [string, string][]
  medida: [string, string]
  procedencia: [string, string]
}
/* PET por lesión, singular: deriva de las MISMAS cuatro palabras que ya usa la leyenda de
   la lente PET (líneas 416-432), no un quinto vocabulario. La spec de diseño asumía una
   frase «sin captación relevante» verificada en el código — no está (verificado al leer el
   componente en esta sesión): la leyenda es de RECUENTO («12 indistinguibles…»), no por
   lesión. Se deriva la forma singular del mismo adjetivo en vez de inventar una redacción
   nueva; decisión de implementación, no de diseño. */
const PET_LABEL: Record<string, [string, string]> = {
  sobre_umbral: ['por encima del umbral tipo PERCIST', 'above the PERCIST-type threshold'],
  sobre_fondo: ['por encima del fondo, sin llegar al umbral', 'above background, below the threshold'],
  en_fondo: ['indistinguible del fondo del hígado', 'indistinguishable from liver background'],
  no_evaluable: ['no evaluable: más pequeña que el vóxel del PET', 'not assessable: smaller than the PET voxel'],
}
const CATEGORIA_LINEA: Record<'confluente' | 'subcapsular', [string, string]> = {
  confluente: [
    'Puede ser una de tres lesiones que se tocan entre sí (el radiólogo las cuenta por separado).',
    'May be one of three lesions touching each other (the radiologist counts them separately).',
  ],
  subcapsular: [
    'Está pegada a la cápsula del hígado, lo que limita su crecimiento y dificulta valorarla.',
    'It sits right against the liver capsule, which limits its growth and makes it harder to assess.',
  ],
}
/* Construyen el contenido bilingüe de cada tipo, UNA vez al cargar — el tooltip solo elige
   el idioma en el momento de pintar, no recalcula nada (mismo criterio que el resto de la
   página: los textos ES/EN viven emparejados, no se traducen al vuelo). */
function tipoA(les: Lesion): Pick<Entrada, 'titulo' | 'lineas' | 'medida' | 'procedencia'> {
  const lineas: [string, string][] = [[
    `Diámetro: ${les.diametro_auto_mm} mm (medida automática)`,
    `Size: ${les.diametro_auto_mm} mm (automatic measurement)`,
  ]]
  if (les.pet && PET_LABEL[les.pet]) {
    const [es, en] = PET_LABEL[les.pet]!
    lineas.push([`PET: ${es}`, `PET: ${en}`])
  }
  lineas.push(['La vio Polaris y la confirmó un radiólogo.', 'Flagged by Polaris and confirmed by a radiologist.'])
  return {
    titulo: ['Lesión candidata', 'Candidate lesion'],
    lineas,
    medida: [`${les.diametro_auto_mm} mm`, `${les.diametro_auto_mm} mm`],
    procedencia: ['Polaris + radiólogo', 'Polaris + radiologist'],
  }
}
function tipoB(les: Lesion): Pick<Entrada, 'titulo' | 'lineas' | 'medida' | 'procedencia'> {
  // «diana s.II» -> «II» (mismo rótulo que ya escribe `_cmd_web`, ninguna fuente nueva)
  const seg = (les.diana || '').replace(/^diana\s+s\.?/i, '').trim()
  const lineas: [string, string][] = [[
    `Medida del radiólogo: ${les.mm_informe} mm`, `Radiologist's measurement: ${les.mm_informe} mm`,
  ]]
  // La evolución «18 → 20 mm en el TC previo» de la spec no tiene campo en escena.json (solo
  // hay `diametro_auto_mm` y `mm_informe`, ninguno es la medida del TC anterior): se omite en
  // vez de inventar o hardcodear una cifra clínica en el componente — decisión de
  // implementación ante un hueco de la spec, no un cambio de diseño.
  if (les.suvmax != null) lineas.push([`SUV ${les.suvmax.toFixed(1)}`, `SUV ${les.suvmax.toFixed(1)}`])
  lineas.push(['Diana del informe oficial de TC.', 'Target from the official CT report.'])
  return {
    titulo: [`Diana del informe · segmento ${seg}`, `Report target · segment ${seg}`],
    lineas,
    medida: [`${les.mm_informe} mm`, `${les.mm_informe} mm`],
    procedencia: ['Diana del informe oficial', 'Official report target'],
  }
}
function tipoC(m: MarcaRadiologo): Pick<Entrada, 'titulo' | 'lineas' | 'medida' | 'procedencia'> {
  const mm = Math.round(m.radio_mm * 2)
  const lineas: [string, string][] = [
    [`Medida: ${mm} mm`, `Size: ${mm} mm`],
    ['Solo la marcó el radiólogo; la IA no la vio.', "Only the radiologist marked it; the AI didn't see it."],
  ]
  if (m.categoria !== 'estandar') lineas.push(CATEGORIA_LINEA[m.categoria])
  return {
    titulo: ['Marca del radiólogo', "Radiologist's mark"],
    lineas,
    medida: [`${mm} mm`, `${mm} mm`],
    procedencia: ['Solo radiólogo', 'Radiologist only'],
  }
}
const entradas = ref<Entrada[]>([])
/* índice en `entradas`, o null; `origenSel` distingue cómo se abrió para saber cómo se
   cierra (WCAG 2.2 1.4.13: hoverable/dismissible/persistent, uno por dispositivo). */
const seleccion = ref<number | null>(null)
const tooltipEntry = computed(() => (seleccion.value != null ? entradas.value[seleccion.value] ?? null : null))
// dianas primero, luego Polaris+radiólogo, luego solo radiólogo — el mismo orden de lectura
// que ya usa la leyenda de la lente de tamaño (spec de diseño, 2.5.1).
const ORDEN_TIPO = { B: 0, A: 1, C: 2 } as const
const filasTabla = computed(() =>
  entradas.value
    .map((e, i) => ({ e, i }))
    .sort((a, b) => ORDEN_TIPO[a.e.tipo] - ORDEN_TIPO[b.e.tipo]))
const origenSel = ref<'hover' | 'tap' | 'focus' | null>(null)
const tooltipPos = ref({ x: 0, y: 0, visible: false })
const tooltipEl = ref<HTMLDivElement | null>(null)
const raycastables: THREE.Object3D[] = []
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let cierreTimer: ReturnType<typeof setTimeout> | undefined
let gestoInicio = { x: 0, y: 0, t: 0 }
let esTactil = false

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const rotulos = ref<{ texto: string; x: number; y: number; r: number; tx: number; ty: number; visible: boolean }[]>([])
const cuenta = ref({ dianas: 0, medibles: 0, pequenas: 0 })
const cuentaMarcas = ref(0)   // 35 marcas «solo radiólogo» — sale de escena.json, no escrito a mano
/* PET: cuántas lesiones caen en cada estado. NUNCA existe el estado «PET negativo» — con vóxel
   de 4 mm el volumen parcial hunde en el fondo a las pequeñas, así que poca captación no
   descarta nada. Los recuentos salen de escena.json, no están escritos a mano. */
const pet = ref<Pet | null>(null)
const lente = ref<'tamano' | 'pet'>('tamano')
/* cada lesión con sus DOS materiales ya construidos: cambiar de lente es cambiar el puntero,
   no rehacer geometría. */
const cuerpos: { malla: THREE.Mesh; tamano: THREE.Material; pet: THREE.Material | null }[] = []
const petCuenta = ref({ sobre_umbral: 0, sobre_fondo: 0, en_fondo: 0, no_evaluable: 0 })

let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let scene: THREE.Scene
let pmrem: THREE.PMREMGenerator | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let raf = 0
let enVista = true
let radio = 100
const dianas: { malla: THREE.Mesh; texto: string }[] = []

/* ── materiales del vídeo (render.js) ─────────────────────────────────────────────── */
function fresnel(mat: THREE.Material, min: number, max: number, pot: number) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uMin = { value: min }; sh.uniforms.uMax = { value: max }; sh.uniforms.uPot = { value: pot }
    sh.fragmentShader = 'uniform float uMin; uniform float uMax; uniform float uPot;\n'
      + sh.fragmentShader.replace('#include <opaque_fragment>',
        'float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), uPot);\n'
        + 'diffuseColor.a = mix(uMin, uMax, fr);\n#include <opaque_fragment>')
  }
  return mat
}
const higadoMat = (lado: THREE.Side) => fresnel(new THREE.MeshPhysicalMaterial({
  color: 0x9a3f2c, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.22,
  sheen: 0.5, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xe39a86),
  transparent: true, depthWrite: false, side: lado }), 0.10, 0.92, 2.4)
const vaso = (c: number) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.15 })
/* Los focos del PET que NO tienen lesión segmentada debajo. Un punto de TAMAÑO FIJO —medio
   vóxel del PET— y nada más. No lleva la forma de una lesión porque no hay contorno que
   dibujar, y no lleva su volumen porque el volumen es el dato menos fiable que hay aquí: con
   3 a 6 vóxeles, uno arriba o abajo lo mueve un tercio, y el diámetro equivalente (7-9 mm)
   coincidiría con el de las lesiones pequeñas reales. Un punto fijo dice «aquí hay señal»;
   una esfera del tamaño del volumen diría «esto mide esto», que es afirmar de más.
   (Comité de verificación, 20-sep: la esfera por volumen queda vetada.) */
const focoMat = () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.35,
  clearcoat: 0.6, emissive: 0xb02d10, emissiveIntensity: 0.9 })
// El tamaño NO se toca: es lo que sostiene que el punto no mida nada. Lo que se sube es el
// contraste. Translúcidos y mates se perdían entre las lesiones pálidas del fondo a través
// del hígado (20-sep): un marcador que no se ve no informa, y agrandarlo sería afirmar.
const focos: THREE.Object3D[] = []
/* Las 35 marcas «solo radiólogo»: esfera LISA (sin caras del hígado alrededor — la forma ya
   dice «no es una segmentación») en verde-agua #1c969e, el mismo color que ya usa el botón de
   reencuadre de este visor como foco (línea del CSS `.lv-reencuadre:focus-visible`) — reuso,
   no un color nuevo con un tercer significado (comité de diseño, 26-sep: el coral pedido queda
   DEVUELTO porque ya significa CTA y «PET sobre umbral» en este mismo visor). Translúcida y
   mate (sin clearcoat, roughness alta): mismo recurso que `MAT_PET.no_evaluable` para decir
   «esto es menos sólido que un hallazgo firme» — una esfera sólida y brillante leería como un
   hallazgo tan firme como la malla de al lado. */
const marcaRadiologoMat = () => new THREE.MeshPhysicalMaterial({ color: 0x1c969e, roughness: 0.75,
  clearcoat: 0, transparent: true, opacity: 0.55, depthWrite: false })

/* LENTE DEL PET — los mismos cuerpos, pintados por lo que dice el PET de cada uno.
   Además del tono, cambia la TEXTURA (mismo criterio que la lente de tamaño, por el
   daltonismo azul-amarillo): lo que capta va brillante y emisivo; lo que se confunde con el
   fondo, mate; lo que no se puede evaluar, casi transparente, porque no hay dato, no es que
   sea negativo. Ninguna lesión se pinta como «PET negativa»: ese estado no existe. */
const MAT_PET: Record<string, () => THREE.Material> = {
  sobre_umbral: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.25,
    clearcoat: 0.9, clearcoatRoughness: 0.1, emissive: 0xb02d10, emissiveIntensity: 0.8 }),
  sobre_fondo: () => new THREE.MeshPhysicalMaterial({ color: 0xf2b23c, roughness: 0.35,
    clearcoat: 0.6, emissive: 0x7a4a08, emissiveIntensity: 0.3 }),
  en_fondo: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa4b2, roughness: 0.85,
    clearcoat: 0.05, emissive: 0x2a3340, emissiveIntensity: 0.15 }),
  no_evaluable: () => new THREE.MeshPhysicalMaterial({ color: 0xcfd6df, roughness: 0.9,
    transparent: true, opacity: 0.35, depthWrite: false }),
}
const MAT: Record<string, () => THREE.Material> = {
  // RECIST 1.1: ≥ 10 mm = medible; < 10 mm = no medible. Además del color, textura distinta
  // (daltonismo azul-amarillo): medibles brillantes, pequeñas mates.
  lesion: () => new THREE.MeshPhysicalMaterial({ color: 0xf2b23c, roughness: 0.3, clearcoat: 0.85,
    clearcoatRoughness: 0.1, emissive: 0x7a4a08, emissiveIntensity: 0.35 }),
  // Miriam, 20-sep: «no distingo las pequeñas de las grandes». Las dos clases eran crema pálido
  // y lila casi blanco, y a través del hígado translúcido acababan igual de pálidas: medido,
  // aclarar el lila subía el contraste real de 2,28:1 a 2,42:1, o sea nada. Lo que las separa es
  // el TONO: ≥ 10 mm en dorado, < 10 mm en violeta, y encima brillante contra mate. El violeta va
  // SATURADO: a tamaño real de móvil, uno pálido llegaba descolorido y se leía como un punto blanco.
  lesionPequena: () => new THREE.MeshPhysicalMaterial({ color: 0x7c5cf0, roughness: 0.5, clearcoat: 0.25,
    emissive: 0x5b3ce0, emissiveIntensity: 0.85 }),
  porta: () => vaso(0x5236b0), vasos: () => vaso(0x2d63d6), vci: () => vaso(0x1f45a8),
  vesicula: () => fresnel(new THREE.MeshPhysicalMaterial({ color: 0x6f9a3a, roughness: 0.25, clearcoat: 1,
    transparent: true, depthWrite: false }), 0.35, 0.95, 2.0),
}
/* RAS (mm) → ejes de three: x = izquierda del paciente a la derecha de la pantalla (vista
   anterior, como el esqueleto), y = arriba, z = hacia quien mira. */
const RAS_A_THREE = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1)

async function geo(url: string) {
  const g = await new PLYLoader().loadAsync(url)
  g.applyMatrix4(RAS_A_THREE); g.computeVertexNormals(); g.computeBoundingSphere(); return g
}
function malla(g: THREE.BufferGeometry, mat: THREE.Material, orden: number) {
  const m = new THREE.Mesh(g, mat); m.renderOrder = orden; scene.add(m); return m
}

function tamano() {
  const el = host.value!
  return { w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) }
}
function resize() {
  if (!renderer) return
  const { w, h } = tamano()
  renderer.setSize(w, h, false)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}
function reencuadra() {
  const fov = THREE.MathUtils.degToRad(camera.fov / 2)
  const ajuste = Math.min(1, camera.aspect)
  const d = (radio * 1.08) / Math.sin(fov) / ajuste
  const incl = THREE.MathUtils.degToRad(9)   // la misma inclinación suave del vídeo
  camera.position.set(0, Math.sin(incl) * d, Math.cos(incl) * d)
  controls.target.set(0, 0, 0); controls.update()
}

/* Cambiar de lente no rehace nada: solo apunta cada malla a su otro material. */
watch(lente, (cual) => {
  for (const c of cuerpos) {
    const m = cual === 'pet' ? (c.pet ?? c.tamano) : c.tamano
    if (c.malla.material !== m) c.malla.material = m
  }
})

const p3 = new THREE.Vector3()
function actualizaRotulos() {
  const { w, h } = tamano()
  rotulos.value = dianas.map((D) => {
    const bs = D.malla.geometry.boundingSphere!
    p3.copy(bs.center).project(camera)
    const x = (p3.x + 1) / 2 * w, y = (1 - p3.y) / 2 * h
    // radio en pantalla: la esfera envolvente proyectada a la distancia de la lesión
    const dist = camera.position.distanceTo(bs.center)
    const r = Math.max(12, (bs.radius / (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * h / 2 * 1.35)
    // el rótulo se centra sobre la lesión pero nunca se sale del visor (JetBrains Mono 12 px
    // ≈ 7,3 px por carácter + 12 px de relleno)
    const medio = (D.texto.length * 7.3 + 12) / 2 + 6
    const tx = Math.min(Math.max(x, medio), w - medio)
    const ty = Math.max(y - r - 6, 26)
    return { texto: D.texto, x, y, r, tx, ty, visible: p3.z < 1 }
  })
}

/* centro en mundo de una entrada: las lesiones usan el centro de su esfera envolvente (igual
   que `actualizaRotulos`), las 35 esferas de marca ya nacen centradas en su posición. */
function centroEntrada(o: THREE.Object3D): THREE.Vector3 {
  const m = o as THREE.Mesh
  const bs = m.geometry?.boundingSphere
  return bs ? bs.center : m.position
}
function actualizaTooltip() {
  if (seleccion.value == null) { tooltipPos.value = { x: 0, y: 0, visible: false }; return }
  const e = entradas.value[seleccion.value]
  if (!e) { tooltipPos.value = { x: 0, y: 0, visible: false }; return }
  const { w, h } = tamano()
  const c = centroEntrada(e.obj)
  p3.copy(c).project(camera)
  const x = (p3.x + 1) / 2 * w, y = (1 - p3.y) / 2 * h
  const anchoTip = tooltipEl.value?.offsetWidth || 220
  const medio = anchoTip / 2 + 8
  const tx = Math.min(Math.max(x, medio), w - medio)
  // encima del punto (nunca centrado sobre él, como `.lv-rotulo`); en táctil, 12 px más
  // arriba para que el dedo no tape lo que acaba de abrir (yema ~10-14 px).
  const arriba = esTactil && origenSel.value === 'tap' ? 30 : 18
  const ty = Math.max(y - arriba, 8)
  tooltipPos.value = { x: tx, y: ty, visible: p3.z < 1 }
}

/* ── interacción del tooltip: hover (ratón), tap (táctil), focus (fila de la tabla) ──────
   WCAG 2.2 1.4.13: hoverable (mover el puntero al tooltip no lo cierra — `cancelaCierre`
   en su propio pointerenter), dismissible (Escape, en cualquier origen) y persistent (el
   táctil NUNCA se autocierra por tiempo — solo por tap fuera, tap en la misma lesión o
   Escape). */
function mostrar(i: number, origen: 'hover' | 'tap' | 'focus') {
  cancelaCierre()
  if (origen === 'tap' && seleccion.value === i && origenSel.value === 'tap') { ocultar(); return }
  seleccion.value = i; origenSel.value = origen
}
function ocultar() { seleccion.value = null; origenSel.value = null }
function programaCierre() {
  cancelaCierre()
  cierreTimer = setTimeout(() => { if (origenSel.value === 'hover') ocultar() }, 150)
}
function cancelaCierre() { if (cierreTimer) { clearTimeout(cierreTimer); cierreTimer = undefined } }

function ndcDesde(clientX: number, clientY: number) {
  const rect = host.value!.getBoundingClientRect()
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
}
function raycast(): number | null {
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(raycastables, false)
  return hits.length ? ((hits[0].object.userData.entradaIdx as number) ?? null) : null
}
function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return   // hover es solo de ratón; táctil usa tap
  ndcDesde(e.clientX, e.clientY)
  const idx = raycast()
  if (idx != null) mostrar(idx, 'hover')
  else if (origenSel.value === 'hover') programaCierre()
}
function onPointerLeave(e: PointerEvent) {
  if (e.pointerType === 'mouse') programaCierre()
}
function onPointerDown(e: PointerEvent) {
  esTactil = e.pointerType !== 'mouse'
  gestoInicio = { x: e.clientX, y: e.clientY, t: performance.now() }
}
function onPointerUp(e: PointerEvent) {
  if (e.pointerType === 'mouse') return   // el clic de ratón no abre/cierra: eso es el hover
  const dx = e.clientX - gestoInicio.x, dy = e.clientY - gestoInicio.y
  const dist = Math.hypot(dx, dy), dt = performance.now() - gestoInicio.t
  if (dist > 6 || dt > 150) return   // arrastre de cámara, no un tap (mismo umbral que OrbitControls)
  ndcDesde(e.clientX, e.clientY)
  const idx = raycast()
  if (idx != null) mostrar(idx, 'tap')
  else ocultar()
}
function onFilaFocus(i: number) { mostrar(i, 'focus') }
function onFilaBlur(i: number) { if (origenSel.value === 'focus') ocultar() }
function onEscape() { if (seleccion.value != null) ocultar() }

async function init() {
  const el = host.value!
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1c1126)   // berenjena profundo, el mismo fondo que el visor del hueso
  camera = new THREE.PerspectiveCamera(26, 1, 1, 5000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.9
  const luz = (c: number, i: number, x: number, y: number, z: number) => {
    const l = new THREE.DirectionalLight(c, i); l.position.set(x, y, z); camera.add(l)
  }
  // luces pegadas a la cámara: el hígado se ve igual de bien lo gires como lo gires
  luz(0xfff0dc, 1.7, 2.5, 3, 4); luz(0xb8c8ff, 0.6, -4, 0.5, 2); luz(0xffd9f0, 2.2, -1, 2, -5)
  scene.add(camera)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
  controls.rotateSpeed = 0.9
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 1.6
  controls.addEventListener('start', () => { controls.autoRotate = false; ocultar() })

  const esc: Escena = await (await fetch(props.base + 'escena.json')).json()
  const tareas: Promise<unknown>[] = []
  for (const k of ['porta', 'vasos', 'vci']) {
    if (esc.mallas[k]) tareas.push(geo(props.base + esc.mallas[k]).then((g) => malla(g, MAT[k]!(), 1)))
  }
  if (esc.mallas.vesicula) tareas.push(geo(props.base + esc.mallas.vesicula).then((g) => malla(g, MAT.vesicula!(), 2)))
  for (const les of esc.lesiones) {
    const medible = (les.mm_informe ?? les.diametro_auto_mm) >= 10
    tareas.push(geo(props.base + les.malla).then((g) => {
      const matTam = (medible ? MAT.lesion : MAT.lesionPequena)!()
      const m = malla(g, matTam, 1)
      cuerpos.push({ malla: m, tamano: matTam, pet: les.pet ? MAT_PET[les.pet]!() : null })
      if (les.diana) {
        const et = lang.value === 'en' ? les.diana.replace('diana', 'Target') : les.diana.replace('diana', 'Diana')
        // El SUV va en el rótulo de CUALQUIER diana que lo tenga, capte o no. Enseñarlo solo
        // en la que capta dejaba a la otra sin cifra, y eso se lee como «no evaluada» justo
        // donde la leyenda dice que ninguna es «PET negativa» (comité de diseño, 20-sep).
        const suv = les.suvmax != null ? ' · SUV ' + les.suvmax.toFixed(1) : ''
        dianas.push({ malla: m, texto: et + ' · ' + les.mm_informe + ' mm' + suv })
      }
      m.userData.entradaIdx = entradas.value.length
      entradas.value.push({ tipo: les.diana ? 'B' : 'A', obj: m, ...(les.diana ? tipoB(les) : tipoA(les)) })
      raycastables.push(m)
    }))
  }
  cuenta.value = {
    dianas: esc.lesiones.filter((x) => x.diana).length,
    medibles: esc.lesiones.filter((x) => !x.diana && x.diametro_auto_mm >= 10).length,
    pequenas: esc.lesiones.filter((x) => !x.diana && x.diametro_auto_mm < 10).length,
  }
  pet.value = esc.pet ?? null
  /* Un anillo hueco por foco, del tamaño de un vóxel del PET (4 mm de radio): actividad
     metabólica donde la segmentación no puso lesión. No es una malla de lesión y no se pinta
     como tal — si lo pareciera, estaríamos dibujando un bulto que nadie ha visto. */
  for (const f of esc.focos ?? []) {
    const punto = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 14), focoMat())
    punto.position.set(f.centro[0], f.centro[1], f.centro[2])
    punto.renderOrder = 5
    punto.visible = false
    scene.add(punto)
    focos.push(punto)
  }
  if (esc.pet) {
    const n = (e: string) => esc.lesiones.filter((x) => x.pet === e).length
    petCuenta.value = { sobre_umbral: n('sobre_umbral'), sobre_fondo: n('sobre_fondo'),
                        en_fondo: n('en_fondo'), no_evaluable: n('no_evaluable') }
  }
  /* Las 35 marcas del radiólogo sin lesión automática debajo: esferas verde-agua, tamaño real
     de su medida (no fijo, al revés que los focos del PET — aquí SÍ hay un número suyo que
     mostrar). Se ven en las dos lentes: son de lo que marcó el radiólogo, no de lo que dice
     el PET. */
  for (const m of esc.marcas_radiologo ?? []) {
    const esf = new THREE.Mesh(new THREE.SphereGeometry(m.radio_mm, 20, 14), marcaRadiologoMat())
    esf.position.set(m.centro[0], m.centro[1], m.centro[2])
    esf.renderOrder = 2
    scene.add(esf)
    esf.userData.entradaIdx = entradas.value.length
    entradas.value.push({ tipo: 'C', obj: esf, ...tipoC(m) })
    raycastables.push(esf)
  }
  cuentaMarcas.value = (esc.marcas_radiologo ?? []).length
  const gh = await geo(props.base + esc.mallas.higado)
  malla(gh, higadoMat(THREE.BackSide), 3)   // caras de detrás primero…
  malla(gh, higadoMat(THREE.FrontSide), 4)  // …y las de delante encima
  await Promise.all(tareas)
  radio = gh.boundingSphere!.radius
  controls.minDistance = radio * 1.2; controls.maxDistance = radio * 12

  resize(); reencuadra()
  ro = new ResizeObserver(() => { resize() }); ro.observe(el)
  io = new IntersectionObserver((e) => { enVista = e.some((x) => x.isIntersecting) }); io.observe(el)
  loading.value = false
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!enVista) return   // fuera de pantalla no se pinta (batería)
    controls.update()
    for (const f of focos) f.visible = lente.value === 'pet'
    renderer!.render(scene, camera); actualizaRotulos(); actualizaTooltip()
  }
  tick()
}

// el reencuadre y el cambio de lente cierran cualquier tooltip abierto: apuntaría a una
// posición 3D que ya cambió de encuadre (spec de diseño, 2.4).
watch(lente, () => ocultar())
const reencuadraYCierra = () => { ocultar(); reencuadra() }

function onWindowKeydown(e: KeyboardEvent) { if (e.key === 'Escape') onEscape() }

onMounted(() => {
  // Igual que BoneTriView: dentro de <ClientOnly> el contenedor puede no estar aún en el DOM
  // en onMounted; se reintenta unos fotogramas antes de rendirse a la imagen fija.
  let intentos = 0
  const arranca = () => {
    if (!host.value) {
      if (intentos++ < 30) { requestAnimationFrame(arranca); return }
      console.error('[LiverView] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    init().catch((e) => { console.error('[LiverView]', e); failed.value = true; loading.value = false })
  }
  arranca()
  window.addEventListener('keydown', onWindowKeydown)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect()
  cancelaCierre()
  window.removeEventListener('keydown', onWindowKeydown)
  scene?.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose() }
  })
  controls?.dispose(); pmrem?.dispose(); renderer?.dispose()
})
</script>

<template>
  <div class="w-full">
    <div class="relative w-full lv-caja">
      <img v-if="failed" :src="fallback" :alt="fallbackAlt" width="1000" height="1000" class="absolute inset-0 w-full h-full object-cover">
      <div
        v-else
        ref="host"
        role="img"
        :aria-label="L('Hígado en 3D con los vasos, la vesícula y todas las lesiones: las dos diana del informe de radiología rotuladas con su medida y su SUV, y el resto detectadas automáticamente. Debajo, lo que dice de cada una el PET del mismo día. Y, en verde agua, las 35 marcas que solo señaló el radiólogo, como puntos del tamaño que él midió. Arrástralo para girar; todas las cifras están escritas debajo.', 'Liver in 3D with the vessels, the gallbladder and all the lesions: the two targets from the radiology report labelled with their size and SUV, and the rest detected automatically. Below, what the same-day PET says about each one. And, in teal, the 35 marks flagged only by the radiologist, as points the size he measured. Drag to rotate; all the figures are written below.')"
        class="absolute inset-0 cursor-grab active:cursor-grabbing"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
      />
      <!-- anillo + rótulo de cada diana, como en el vídeo -->
      <div v-if="!loading && !failed" class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <template v-for="(r, i) in rotulos" :key="i">
          <span v-if="r.visible" class="lv-anillo" :style="{ left: r.x + 'px', top: r.y + 'px', width: 2 * r.r + 'px', height: 2 * r.r + 'px' }" />
          <span v-if="r.visible" class="lv-rotulo" :style="{ left: r.tx + 'px', top: r.ty + 'px' }">{{ r.texto }}</span>
        </template>
      </div>
      <!-- tooltip por lesión: puramente visual (aria-hidden) — el mismo contenido vive
           siempre en la tabla de abajo (2.5), que es lo que anuncia un lector de pantalla.
           Hoverable de verdad: entra al propio tooltip cancela el cierre programado. -->
      <div
        v-if="seleccion != null && tooltipEntry && tooltipPos.visible"
        ref="tooltipEl"
        class="lv-tooltip"
        aria-hidden="true"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
        @pointerenter="cancelaCierre"
        @pointerleave="programaCierre"
      >
        <p class="lv-tooltip__titulo">{{ tooltipEntry.titulo[langIdx] }}</p>
        <p v-for="(ln, i) in tooltipEntry.lineas" :key="i" class="lv-tooltip__linea">{{ ln[langIdx] }}</p>
      </div>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-[12px]" style="color:#aeb6c2">
        {{ L('reconstruyendo 3D…', 'rebuilding 3D…') }}
      </div>
      <button
        v-if="!loading && !failed"
        type="button"
        class="lv-reencuadre"
        :aria-label="L('Reencuadrar la vista', 'Reset the view')"
        :title="L('Reencuadrar', 'Reset view')"
        @click="reencuadraYCierra"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
          <path d="M19 12a7 7 0 0 1-11.95 4.95M5 12a7 7 0 0 1 11.95-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17 3.2V7.2H13M7 20.8V16.8H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
    <p v-if="!failed" class="text-[11px] text-tinta mt-1.5">
      {{ L('Arrastra para girar · rueda para acercar', 'Drag to rotate · scroll to zoom') }}
    </p>
    <!-- DOS LENTES sobre los mismos cuerpos. Por defecto la de tamaño, que es la gramática
         de color que ya tenía la página (dorado ≥10 mm, violeta <10 mm). La del PET pinta lo
         que dice el PET de cada lesión, que es información visual y no tiene por qué leerse
         en un párrafo (Miriam, 20-sep). -->
    <div v-if="pet && !loading && !failed" class="mt-2.5 flex items-center gap-1" role="group" :aria-label="L('Cómo se pintan las lesiones', 'How the lesions are coloured')">
      <button v-for="op in ([['tamano', L('Por tamaño', 'By size')], ['pet', L('Por el PET', 'By PET')]] as const)" :key="op[0]"
        type="button"
        class="lv-lente border transition-colors"
        :class="lente === op[0]
          ? 'bg-berenjena/10 border-berenjena/40 text-berenjena font-semibold'
          : 'bg-transparent border-berenjena/20 text-tinta hover:border-berenjena/40'"
        :aria-pressed="lente === op[0]" @click="lente = op[0]">{{ op[1] }}</button>
    </div>

    <!-- subtítulo ancla, antes del detalle (comité de diseño, 26-sep) -->
    <p v-if="!loading && !failed && lente === 'tamano'" class="mt-2 text-[11px] font-semibold text-berenjena">
      {{ L('Sus 55 marcas, no solo las 20 que mide la IA', 'All 55 of his marks, not just the 20 the AI measures') }}
    </p>
    <!-- leyenda de la lente de TAMAÑO; los recuentos salen de escena.json. Los CUATRO puntos
         llevan borde berenjena (no solo el de diana): sin él, el dorado y el violeta no llegan
         al 3:1 de contraste no-textual de WCAG 2.2 1.4.11 sobre el fondo crema de esta lista
         (comité de diseño, 26-sep — medido: dorado ≈1,7:1, violeta similar; con el borde, los
         cuatro pasan de sobra). -->
    <ul v-if="!loading && !failed && lente === 'tamano'" class="mt-1 space-y-1 text-[11px] text-tinta">
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena/70" style="background:#f2b23c" aria-hidden="true" />
        {{ L(`${cuenta.dianas} lesiones diana, con anillo: medida del radiólogo`, `${cuenta.dianas} target lesions, ringed: radiologist's measurement`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena/70" style="background:#f2b23c" aria-hidden="true" />
        {{ L(`Otras ${cuenta.medibles} lesiones candidatas de 10 mm o más (detección automática)`, `${cuenta.medibles} other candidate lesions of 10 mm or more (automatic detection)`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena/70" style="background:#7c5cf0" aria-hidden="true" />
        {{ L(`${cuenta.pequenas} lesiones candidatas de menos de 10 mm (detección automática)`, `${cuenta.pequenas} candidate lesions under 10 mm (automatic detection)`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena/70" style="background:#1c969e" aria-hidden="true" />
        {{ L(`${cuentaMarcas} puntos marcados solo por el radiólogo: el tamaño de su punto es el que él midió, no el contorno real de la lesión — ahí la IA no vio nada que dibujar`, `${cuentaMarcas} points marked only by the radiologist: the size of the dot is what he measured, not the lesion's real outline — the AI didn't see anything to draw there`) }}
      </li>
    </ul>

    <!-- leyenda de la lente del PET: los mismos cuatro estados que se están pintando, en el
         mismo orden de la masa que NO respalda hacia la única que sí. -->
    <!-- PRIMERO cuántos focos activos hay, y solo después cuántas lesiones coinciden. Sin esta
         frase, «1 capta por encima del umbral» se lee como «el hígado tiene un solo punto
         activo», que es justo lo contrario de lo que dice el informe. -->
    <p v-if="pet?.focos_higado && !loading && !failed && lente === 'pet'" class="mt-2 text-[11px] text-tinta leading-snug">
      {{ L(`En el hígado hay ${pet.focos_higado} focos activos por encima del umbral. ${pet.focos_sobre_lesion} coincide con una lesión de las que marca el TC; ${pet.focos_sin_lesion} caen donde la segmentación no puso ninguna.`, `There are ${pet.focos_higado} active foci above the threshold in the liver. ${pet.focos_sobre_lesion} matches a lesion marked on the CT; ${pet.focos_sin_lesion} fall where the segmentation placed none.`) }}
    </p>
    <ul v-if="pet && !loading && !failed && lente === 'pet'" class="mt-2 space-y-1 text-[11px] text-tinta">
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#9aa4b2" aria-hidden="true" />
        {{ L(`${petCuenta.en_fondo} indistinguibles del fondo del hígado`, `${petCuenta.en_fondo} indistinguishable from liver background`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full opacity-40" style="background:#cfd6df" aria-hidden="true" />
        {{ L(`${petCuenta.no_evaluable} no evaluables: más pequeñas que el vóxel del PET`, `${petCuenta.no_evaluable} not assessable: smaller than the PET voxel`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#f2b23c" aria-hidden="true" />
        {{ L(`${petCuenta.sobre_fondo} por encima del fondo, sin llegar al umbral`, `${petCuenta.sobre_fondo} above background, below the threshold`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#ff6b47" aria-hidden="true" />
        {{ L(`${petCuenta.sobre_umbral} coincide con un foco por encima del umbral`, `${petCuenta.sobre_umbral} matches a focus above the threshold`) }}
      </li>
      <li v-if="pet?.focos_sin_lesion" class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full opacity-60" style="background:#ff6b47" aria-hidden="true" />
        {{ L(`${pet.focos_sin_lesion} puntos: señal del PET por encima del umbral sin lesión en el TC`, `${pet.focos_sin_lesion} dots: PET signal above the threshold with no lesion on the CT`) }}
      </li>
    </ul>
    <p v-if="pet?.focos_sin_lesion && !loading && !failed && lente === 'pet'" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L('Los puntos marcan DÓNDE hay señal, no cuánta ni de qué tamaño: su tamaño es fijo, medio vóxel del PET, y no mide nada. Uno de ellos, en el segmento VIII, es el que el informe del PET nombra; los otros dos no aparecen en el informe.', 'The dots mark WHERE there is signal, not how much or how large: their size is fixed, half a PET voxel, and measures nothing. One of them, in segment VIII, is the one named in the PET report; the other two do not appear in it.') }}
    </p>
    <p v-if="pet && !loading && !failed && lente === 'pet'" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L('Poca captación NO descarta lesión: con vóxel de 4 mm, el volumen parcial hunde en el fondo a las lesiones pequeñas. Por eso ninguna se pinta como «PET negativa».', 'Low uptake does NOT rule out a lesion: with a 4 mm voxel, partial volume sinks small lesions into the background. That is why none is coloured as “PET negative”.') }}
    </p>
    <p v-if="pet && !loading && !failed && lente === 'pet'" class="mt-1 text-[11px] text-tinta leading-snug">
      {{ L(`PET-TC FDG del mismo día · fondo del hígado SUV ${pet.fondo_suvmean} ± ${pet.fondo_suvsd} · umbral PERCIST ${pet.umbral_percist} · registro del hígado TC↔PET, Dice ${pet.dice_registro}.`, `Same-day FDG PET-CT · liver background SUV ${pet.fondo_suvmean} ± ${pet.fondo_suvsd} · PERCIST threshold ${pet.umbral_percist} · CT↔PET liver registration, Dice ${pet.dice_registro}.`) }}
    </p>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[11px] text-tinta">
      <li v-for="[c, es, en] in [['#5236b0', 'Vena porta', 'Portal vein'], ['#2d63d6', 'Vasos hepáticos', 'Hepatic vessels'], ['#1f45a8', 'Vena cava inferior', 'Inferior vena cava'], ['#6f9a3a', 'Vesícula', 'Gallbladder']]" :key="c" class="inline-flex items-center gap-1.5">
        <span class="inline-block w-2.5 h-2.5 rounded-full" :style="{ background: c }" aria-hidden="true" />{{ L(es!, en!) }}
      </li>
    </ul>
    <p v-if="!loading && !failed" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L('RECIST 1.1 solo mide lesiones de 10 mm o más. Las lesiones candidatas vienen de segmentación automática (IA, 100 % local): el modelo las detecta y ningún radiólogo las ha confirmado. Puede haber de más o de menos, y en las dianas el modelo mide 2-6 mm por debajo del radiólogo. Las venas más finas pueden salir incompletas.', 'RECIST 1.1 only measures lesions of 10 mm or more. Candidate lesions come from automatic segmentation (AI, 100% local): the model detects them and no radiologist has confirmed them. It may miss some or flag extra ones, and on the targets it measures 2-6 mm below the radiologist. The thinnest veins may appear incomplete.') }}
    </p>

    <!-- Alternativa accesible al 3D (spec de diseño, 2.5): un <canvas> con 55 puntos no es
         navegable por teclado ni por lector de pantalla más allá del aria-label de arriba.
         Esta tabla lleva el MISMO contenido del tooltip, en texto plano, siempre en el DOM
         (colapsada con <details> nativo, que el lector de pantalla anuncia como expandible;
         nunca display:none). Enfocar una fila resalta y proyecta el tooltip sobre su punto
         en el 3D (sincronía bidireccional); el 3D en sí no añade tabstops nuevos — 55 Tabs
         sobre un lienzo de 343 px sería peor experiencia de teclado que esta tabla nativa. -->
    <details v-if="!loading && !failed" class="lv-detalle mt-3">
      <summary class="lv-detalle__resumen">
        {{ L(`Las 55 marcas en una tabla (${entradas.length})`, `All 55 marks as a table (${entradas.length})`) }}
      </summary>
      <div class="lv-tabla-envoltorio">
        <table class="lv-tabla">
          <caption class="sr-only">
            {{ L('Cada lesión o marca del hígado: tipo, medida y quién la vio.', 'Every liver lesion or mark: type, size and who saw it.') }}
          </caption>
          <thead>
            <tr>
              <th scope="col">{{ L('Lesión', 'Lesion') }}</th>
              <th scope="col">{{ L('Medida', 'Size') }}</th>
              <th scope="col">{{ L('Procedencia', 'Source') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in filasTabla" :key="fila.i"
              tabindex="0"
              :aria-current="seleccion === fila.i ? 'true' : undefined"
              :class="{ 'lv-fila--activa': seleccion === fila.i }"
              @focus="onFilaFocus(fila.i)"
              @blur="onFilaBlur(fila.i)"
              @keydown.enter.prevent="onFilaFocus(fila.i)"
              @keydown.space.prevent="onFilaFocus(fila.i)"
            >
              <td>{{ fila.e.titulo[langIdx] }}</td>
              <td>{{ fila.e.medida[langIdx] }}</td>
              <td>{{ fila.e.procedencia[langIdx] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style scoped>
.lv-caja { aspect-ratio: 1 / 1; background: #1c1126; border-radius: 0.75rem; overflow: hidden; }
.lv-lente {
  font-size: 11px;
  line-height: 1;
  padding: 7px 11px;
  min-height: 32px;
  border-radius: 999px;
}
@media (pointer: coarse) { .lv-lente { min-height: 44px; padding: 0 14px; } }

.lv-anillo {
  position: absolute; transform: translate(-50%, -50%); border-radius: 9999px;
  border: 2px solid rgba(245, 239, 230, 0.92);
}
.lv-rotulo {
  position: absolute; transform: translate(-50%, -100%); white-space: nowrap;
  font: 600 12px/1.2 'JetBrains Mono', ui-monospace, monospace; color: #F5EFE6;
  background: rgba(28, 17, 38, 0.72); padding: 2px 6px; border-radius: 4px;
}
.lv-reencuadre {
  position: absolute; bottom: 10px; right: 10px; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 10px;
  color: #d9dee6; background: rgba(20, 24, 32, 0.78); border: 1px solid rgba(174, 182, 194, 0.3);
}
.lv-reencuadre:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.lv-reencuadre:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }

/* Tooltip por lesión: tokens del sistema (sección 3 de la spec), cero hex nuevo. Nunca más
   ancho que el visor menos 16 px de margen; envuelve, no desborda (2.3). Puramente visual
   (aria-hidden): el contenido accesible vive en la tabla de abajo. */
.lv-tooltip {
  position: absolute; transform: translate(-50%, -100%); pointer-events: auto;
  max-width: calc(100% - 16px); width: max-content;
  background: var(--viz-tooltip-bg); color: var(--viz-tooltip-text);
  border-radius: var(--radius-md); box-shadow: var(--sombra-flotante);
  padding: 8px 10px; z-index: 5;
}
.lv-tooltip__titulo { font: var(--tipo-body-sm); font-weight: 600; margin: 0 0 2px; }
.lv-tooltip__linea { font: var(--tipo-body-sm); margin: 0; opacity: 0.92; }

/* Tabla sincronizada (2.5): siempre en el DOM, colapsada con <details> nativo. */
.lv-detalle__resumen {
  cursor: pointer; font-size: 12px; font-weight: 600; color: var(--color-text, #2d1b3d);
  padding: 6px 0; min-height: 32px; display: inline-flex; align-items: center;
}
.lv-detalle__resumen:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }
.lv-tabla-envoltorio { overflow-x: auto; margin-top: 6px; }
.lv-tabla { width: 100%; border-collapse: collapse; font-size: 11px; }
.lv-tabla th, .lv-tabla td {
  text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(45, 27, 61, 0.12);
  white-space: nowrap;
}
.lv-tabla th { font-weight: 600; color: var(--color-text, #2d1b3d); }
.lv-tabla tbody tr { cursor: pointer; }
.lv-tabla tbody tr:hover, .lv-fila--activa { background: rgba(28, 150, 158, 0.08); }
.lv-tabla tbody tr:focus-visible, .lv-tabla tbody tr:focus {
  outline: 2px solid #1c969e; outline-offset: -2px;
}
</style>
