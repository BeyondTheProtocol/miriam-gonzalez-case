<script setup lang="ts">
/**
 * BoneTriView — visor 3D «small multiples» del hueso reconstruido del CT.
 *
 * CONCEPTO A (aprobado): el MISMO hueso mostrado TRES VECES en paralelo y
 * SINCRONIZADAS, cada vista un mapa LIMPIO de UNA sola variable por vértice:
 *   · GALIO (receptor)   — gris → TEAL/cian, de suv_ga   (0 → ~9; ≥9 satura)
 *   · FDG   (azúcar)     — gris → ÁMBAR/naranja, de suv_fdg (0 → ~9)
 *   · BLÁSTICO (densidad)— gris → SEPIA, de density_hu (denso/blástico = sepia
 *                          oscuro saturado; trabecular = claro neutro)
 * La INTENSIDAD = saturación/valor dentro de cada colormap (perceptual, suave).
 * La captación es un GRADIENTE continuo: SIN contorno, SIN iso-líneas, SIN diana,
 * SIN halos, SIN parche-borde. Mapa limpio sobre TODO el hueso; la luz da el volumen.
 *
 * ARQUITECTURA (eficiente y sincronizada):
 *   · UN solo WebGLRenderer + UN canvas, dividido en 3 VIEWPORTS con setViewport +
 *     setScissor (scissor test): cada viewport pinta su propia escena.
 *   · La GEOMETRÍA se carga UNA vez (un PLY) y se COMPARTE entre los 3 meshes:
 *     mismo BufferGeometry, distinto MATERIAL y distinto ATRIBUTO DE COLOR por
 *     vértice (un colormap cada uno). Tres escenas, un mesh por escena.
 *   · UNA sola cámara + UN OrbitControls → rotar/zoom mueve las 3 vistas A LA VEZ
 *     (comparten orientación automáticamente). Arrastrar = girar, rueda = zoom.
 *   · El hueso es MATE/OPACO (MeshStandardMaterial, DoubleSide, normales
 *     recalculadas del winding) → nunca se ve «a través».
 *
 * DATOS reales por vértice en /metastasis/mesh/${KEY}.ply (PLYLoader custom mapping):
 *   density_hu → density · suv_fdg → fdg · suv_ga → ga (Float32, itemSize 1).
 *
 * BIOPSIA (#13): toggle de la simulación ILUSTRATIVA de la biopsia previa (aguja),
 * OFF por defecto; al activarse dibuja la aguja SOBRE el panel de densidad/blástico
 * (no ensucia las vistas limpias por defecto). Lógica portada de BoneViewer3D.
 *
 * HONESTIDAD: captación = gradiente, sin borde tumoral neto; Galio = proxy calibrado
 * por ahora; etiquetar por trazador/densidad, nunca por biología; informa, no concluye.
 * Fallback sin-WebGL digno (BoneFrameViewer). Bilingüe L(es,en). Estilo limpio, AA.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

const props = defineProps<{
  meshKey?: string
  /* Foco con biopsia previa (hecho del caso: #13 ilíaco derecho, 26B585). Cuando es
     true se OFRECE el toggle «Ver la biopsia previa» que dibuja una aguja ILUSTRATIVA
     sobre el panel de densidad/blástico. OFF por defecto. */
  biopsied?: boolean
  biopsyLabel?: string
  /* (auditoría fidelidad) foco IA montado sobre un hueso-PROXY (no es su hueso): NO dibujar
     el anillo-diana, que marcaría la zona ávida de un hueso ajeno como si fuera su diana. */
  noTarget?: boolean
}>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)

/* ---- panel definitions (data channel → colormap) ---- */
type Channel = 'ga' | 'fdg' | 'density'
interface Panel {
  id: Channel
  title: { es: string; en: string }
  sub: { es: string; en: string }
  /* leyenda 0 → máx */
  unit: { es: string; en: string }
  max: number
  /* dos paradas para el gradiente de la leyenda CSS (claro → saturado) */
  legendFrom: string
  legendTo: string
}
const PANELS: Panel[] = [
  {
    id: 'ga',
    title: { es: 'Galio · receptor', en: 'Gallium · receptor' },
    sub: { es: '⁶⁸Ga-DOTATOC (SSTR)', en: '⁶⁸Ga-DOTATOC (SSTR)' },
    unit: { es: 'SUV', en: 'SUV' },
    max: 9, // = GA_MAX (la escala de color satura en 9; ≥9 = teal máx)
    legendFrom: '#e7e2d6',
    legendTo: '#0f8c93',
  },
  {
    id: 'fdg',
    title: { es: 'FDG · azúcar', en: 'FDG · sugar' },
    sub: { es: '¹⁸F-FDG (glucólisis)', en: '¹⁸F-FDG (glycolysis)' },
    unit: { es: 'SUV', en: 'SUV' },
    max: 9,
    legendFrom: '#e7e2d6',
    legendTo: '#d2691a',
  },
  {
    id: 'density',
    title: { es: 'Blástico · densidad CT', en: 'Blastic · CT density' },
    sub: { es: 'densidad (HU)', en: 'density (HU)' },
    unit: { es: 'HU', en: 'HU' },
    max: 1000,
    legendFrom: '#e7e2d6',
    legendTo: '#4a2f18',
  },
]

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
/* foco sin malla PLY individual (#17 costilla, #19): estado honesto, sin init WebGL */
const noMesh = computed(() => !props.meshKey)
const biopsyAvailable = computed(() => !!props.biopsied && !noMesh.value && !failed.value)
const showBiopsy = ref(false)

/* ---- three.js state (1 renderer / 3 scenes / 1 camera / 1 controls) ---- */
let renderer: THREE.WebGLRenderer
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let pmrem: THREE.PMREMGenerator | null = null
/* 3 escenas, una por viewport; cada una con un mesh que comparte la MISMA geometría */
const scenes: THREE.Scene[] = []
const meshes: (THREE.Mesh | null)[] = [null, null, null]
let sharedGeo: THREE.BufferGeometry | null = null
let needleGroups: THREE.Group[] = []           // aguja de biopsia ILUSTRATIVA · una por panel (los 3)
let targetGroups: THREE.Group[] = []           // diana ILUSTRATIVA (anillo zona ávida) · una por panel
let raf = 0, ro: ResizeObserver | null = null
let curKey = ''
let boneRadius = 50

/* ---- canales REALES por vértice (Float32, itemSize 1) leídos del PLY ---- */
let vDensity: Float32Array | null = null
let vFdg: Float32Array | null = null
let vGa: Float32Array | null = null
/* pico de captación combinada (max fdg/ga) → ancla de la aguja ilustrativa */
let hotIndex = -1

/* ---- material del hueso (MATE / OPACO) ---- */
const BONE_MAT_BASE = {
  color: new THREE.Color(0xffffff),
  vertexColors: true,
  roughness: 0.95,
  metalness: 0.0,
  envMapIntensity: 0.08,
  transparent: false,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  flatShading: false,
  side: THREE.DoubleSide,
}

/* ---- colormap helpers (sRGB → lineal: three multiplica el color por vértice en LINEAL) ---- */
function lin255(r: number, g: number, b: number): [number, number, number] {
  const c = new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
  return [c.r, c.g, c.b]
}
/* rampa perceptual de paradas [pos 0..1, sRGB 0..255] → evaluador que interpola en LINEAL */
function makeRamp(stops: [number, [number, number, number]][]) {
  const S = stops.map(([p, c]) => { const [r, g, b] = lin255(c[0], c[1], c[2]); return [p, r, g, b] as const })
  return (t: number): [number, number, number] => {
    t = t < 0 ? 0 : t > 1 ? 1 : t
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1]
      if (t <= b[0]) { const f = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0; return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f] }
    }
    const z = S[S.length - 1]; return [z[1], z[2], z[3]]
  }
}

/* GALIO · gris neutro → TEAL/cian. Intensidad = valor+saturación: el fondo es un
   marfil-gris neutro (sin captación) y sube a teal saturado y oscuro en el núcleo. */
const gaRamp = makeRamp([
  [0.00, [222, 221, 214]],  // sin captación · marfil-gris neutro
  [0.18, [186, 200, 196]],  // muy bajo · gris verdoso apenas teñido
  [0.42, [104, 184, 188]],  // medio · cian claro
  [0.68, [28, 150, 158]],   // alto · teal
  [1.00, [9, 92, 100]],     // máx · teal oscuro saturado
])
/* FDG · gris neutro → ÁMBAR/naranja. */
const fdgRamp = makeRamp([
  [0.00, [222, 221, 214]],  // sin captación · marfil-gris neutro
  [0.18, [214, 198, 168]],  // muy bajo · arena
  [0.42, [232, 168, 92]],   // medio · ámbar claro
  [0.68, [214, 110, 28]],   // alto · naranja
  [1.00, [150, 64, 10]],    // máx · ámbar oscuro saturado
])
/* BLÁSTICO · densidad CT. Trabecular/normal = claro neutro; denso/blástico = SEPIA
   oscuro saturado. Tono cálido-marrón que sube en saturación y baja en valor con la HU. */
const densityRamp = makeRamp([
  [0.00, [226, 219, 204]],  // baja densidad / trabecular · marfil-arena claro neutro
  [0.22, [206, 184, 148]],  // normal · arena cálida
  [0.45, [183, 142, 92]],   // transición · sepia medio claro
  [0.68, [138, 94, 50]],    // denso · sepia
  [0.86, [96, 60, 30]],     // muy denso · sepia oscuro
  [1.00, [58, 34, 16]],     // blástico · sepia oscuro saturado
])

/* normalización por canal → t ∈ [0,1] con gamma suave (perceptual).
   GA_MAX=9 (no 13): la mayoría de focos de Galio están en 2.5–5 SUV; con el máximo
   en el outlier (D11 13.27) toda la captación moderada caía a ~0.3 de la rampa y se
   veía CASI BLANCA (p.ej. escápula #3, C3/C4, ilíaco-izq → «no se aprecia la lesión»).
   Con 9, esos focos suben a ~0.5 (teal claro y visible) y los muy ávidos (D11/L5,
   ≥9) saturan como los más calientes. El SUVmáx exacto se lee en la ficha y la tabla. */
const GA_MAX = 9, FDG_MAX = 9
/* DENSIDAD: la SUPERFICIE del hueso reconstruido se mueve sobre todo en 50–700 HU
   (la malla muestrea la corteza/borde, no el interior cortical de >1000 HU). Si
   normalizamos a 150→1000, casi todo el hueso cae en la zona clara y el mapa se ve
   «lavado» (casi blanco). Anclamos la rampa al rango REAL observado en la superficie
   (≈50→700 HU) con gamma<1 para realzar el contraste: trabecular/normal en sepia
   claro y el hueso DENSO/BLÁSTICO en sepia oscuro saturado, bien diferenciado. */
const HU_LO = 50, HU_HI = 700
function tGa(v: number): number { return Math.min(Math.max(v / GA_MAX, 0), 1) ** 0.80 }
function tFdg(v: number): number { return Math.min(Math.max(v / FDG_MAX, 0), 1) ** 0.80 }
function tDensity(v: number): number {
  const t = (v - HU_LO) / (HU_HI - HU_LO)
  return Math.min(Math.max(t, 0), 1) ** 0.85
}

/* construye un atributo de color por vértice para un canal dado → un mesh por colormap */
function buildColorAttr(channel: Channel): THREE.BufferAttribute {
  const n = vDensity!.length
  const col = new Float32Array(n * 3)
  const ramp = channel === 'ga' ? gaRamp : channel === 'fdg' ? fdgRamp : densityRamp
  for (let i = 0; i < n; i++) {
    let t: number
    if (channel === 'ga') t = tGa(vGa![i])
    else if (channel === 'fdg') t = tFdg(vFdg![i])
    else t = tDensity(vDensity![i])
    const [r, g, b] = ramp(t)
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b
  }
  return new THREE.BufferAttribute(col, 3)
}

function resize() {
  if (!host.value || !renderer) return
  // El canvas cubre las 3 vistas: en escritorio 3 columnas (w/3 cada una),
  // en móvil apilado 1 columna; lo gobierna `stacked` (recalculado aquí por ancho).
  updateStacked()
  const w = host.value.clientWidth
  const h = host.value.clientHeight
  if (w < 1 || h < 1) return        // aún sin layout (aspect-ratio sin resolver) → no encuadres con basura
  renderer.setSize(w, h, false)
  renderer.domElement.style.width = w + 'px'
  renderer.domElement.style.height = h + 'px'
  updateCameraAspect()
  // CLAVE: el aspecto de CADA celda cambió → hay que RE-ENCUADRAR (distancia + target),
  // no sólo la matriz de proyección. Si no, el hueso queda encuadrado para otro aspecto
  // (p.ej. el aspecto 1 inicial, antes de que el `aspect-ratio` CSS resolviera la altura)
  // y aparece descentrado / cortado / pegado arriba. Conservamos la orientación actual
  // del orbit (keepDir) para no resetear la rotación del usuario al redimensionar.
  if (sharedGeo) frameObject(FILL, true)
}

/* aspecto de la cámara = aspecto de UNA celda (no del canvas entero), para que el
   hueso no se deforme. La celda mide cellW × cellH (en píxeles CSS) según el layout;
   es EXACTAMENTE el aspecto del viewport que pinta esa celda en renderScenes(). */
const stacked = ref(false)
function cellSize(): { w: number; h: number } {
  if (!host.value) return { w: 1, h: 1 }
  const W = Math.max(1, host.value.clientWidth), H = Math.max(1, host.value.clientHeight)
  return stacked.value ? { w: W, h: H / 3 } : { w: W / 3, h: H }
}
function updateCameraAspect() {
  if (!camera) return
  const { w, h } = cellSize()
  const a = w / h
  if (!Number.isFinite(a) || a <= 0) return
  camera.aspect = a
  camera.updateProjectionMatrix()
}

function init() {
  const el = host.value!
  // 3 escenas idénticas en iluminación; cada una recibe un mesh con su colormap.
  for (let i = 0; i < 3; i++) {
    const sc = new THREE.Scene()
    sc.background = new THREE.Color(0x0d1117)
    sc.add(new THREE.HemisphereLight(0xffffff, 0x1a1d26, 0.95))
    const key = new THREE.DirectionalLight(0xfff4ea, 0.85); key.position.set(-0.6, 0.9, 1.0); sc.add(key)
    const fill = new THREE.DirectionalLight(0xbcd0ff, 0.38); fill.position.set(0.7, -0.2, -0.7); sc.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.28); rim.position.set(0.2, 0.4, -1.0); sc.add(rim)
    scenes.push(sc)
  }
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 8000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.autoClear = false                 // limpiamos a mano por viewport (scissor)
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  // ambiente difuso tenue (mismo para las 3 escenas)
  pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  for (const sc of scenes) sc.environment = envTex
  // UNA sola cámara + UN OrbitControls (las 3 vistas comparten orientación)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
  controls.rotateSpeed = 0.9; controls.minDistance = 1; controls.maxDistance = 100000
  resize()
  ro = new ResizeObserver(resize); ro.observe(el)
  const tick = () => { raf = requestAnimationFrame(tick); controls.update(); renderScenes() }
  tick()
}

/* render: UN canvas, 3 viewports (setViewport + setScissor). Cada celda dibuja su
   escena con la MISMA cámara → orientación y zoom compartidos automáticamente. */
function renderScenes() {
  if (!renderer || !host.value) return
  // PARPADEO de la diana CALCADA en la superficie (el bucle ya es continuo): la diana
  // es un decal pegado al hueso (no se mueve), así que sólo «respira» en intensidad —
  // opacidad + brillo emisivo sinusoidales → late de forma suave sin despegarse jamás.
  if (targetDecals.length) {
    const t = performance.now()
    const breath = 0.5 + 0.5 * Math.sin(t * 0.0026)            // 0..1, ~2.4 s/ciclo
    const op = 0.50 + 0.50 * breath                            // 0.50 → 1.0
    const emi = 0.25 + 0.55 * breath                           // brillo de los aros
    for (const m of targetMats) {
      m.opacity = op
      m.emissiveIntensity = emi
    }
  }
  const W = host.value.clientWidth, H = host.value.clientHeight
  // OJO: setViewport/setScissor reciben píxeles CSS — three.js los multiplica por el
  // pixelRatio INTERNAMENTE. Multiplicar aquí por dpr provocaba un escalado ×dpr² (en
  // pantallas retina dpr=2 → ×4): el viewport se salía y el hueso aparecía arriba/cortado.
  renderer.setScissorTest(true)
  for (let i = 0; i < 3; i++) {
    let x: number, y: number, w: number, h: number
    if (stacked.value) {
      // apilado vertical: fila 0 arriba. El origen de WebGL es abajo-izquierda → invertimos.
      w = W; h = H / 3
      x = 0; y = H - (i + 1) * h
    } else {
      w = W / 3; h = H
      x = i * w; y = 0
    }
    renderer.setViewport(x, y, w, h)
    renderer.setScissor(x, y, w, h)
    renderer.render(scenes[i], camera)
  }
  renderer.setScissorTest(false)
}

/* encuadre: la boundingSphere ENTERA (radio r, centrada en el ORIGEN tras recentrar la
   geometría al CENTRO DE LA CAJA) cabe en la celda por su lado LIMITANTE, con margen.

   Aspecto: cada celda mide W/3 × H (escritorio) o W × H/3 (apilado) → es estrecha/alta,
   con aspect < 1. El FOV horizontal es entonces MENOR que el vertical, así que el lado
   que primero «toca» el borde es el HORIZONTAL. Encuadramos al FOV LIMITANTE = min(vFov,
   hFov): así el hueso cabe entero por los dos lados y queda centrado, sin cortarse ni
   dejar huecos negros. Es lo que hacía falta: si encuadras sólo al FOV vertical en una
   celda alta-estrecha, el hueso queda demasiado grande/desbordado a los lados; si usas un
   aspecto que no es el real del viewport, queda descentrado y pegado a un borde. */
const FILL = 0.84                                  // margen ~16 % (holgura para que NUNCA se corte)
const DEFAULT_DIR = new THREE.Vector3(0.32, 0.16, 1).normalize()
const _camRight = new THREE.Vector3()
const _camUp = new THREE.Vector3()
const _v = new THREE.Vector3()
/* medio-extentos del hueso PROYECTADOS sobre los ejes derecha/arriba de la cámara para una
   dirección de vista dada. Usar la esfera envolvente (radio r) para encuadrar deja huecos
   negros enormes en huesos «planos» o estrechos (p.ej. la vértebra D11, más ancha que alta):
   la esfera es el peor caso 3D, no lo que se VE. Midiendo el rectángulo real que ocupa el
   hueso en pantalla, llena cada celda por igual tanto si es pequeño como grande. */
function orientedHalfExtents(dir: THREE.Vector3): { halfW: number; halfH: number } | null {
  if (!sharedGeo) return null
  const pos = sharedGeo.getAttribute('position') as THREE.BufferAttribute | undefined
  if (!pos) return null
  // base ortonormal de la cámara: forward = -dir; right = forward × up0; up = right × forward
  const forward = dir.clone().normalize().multiplyScalar(-1)
  const up0 = Math.abs(forward.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
  _camRight.copy(forward).cross(up0).normalize()
  _camUp.copy(_camRight).cross(forward).normalize()
  let maxW = 0, maxH = 0
  const n = pos.count
  for (let i = 0; i < n; i++) {
    _v.set(pos.getX(i), pos.getY(i), pos.getZ(i))   // geo recentrada: origen = centro de la caja
    const w = Math.abs(_v.dot(_camRight))
    const h = Math.abs(_v.dot(_camUp))
    if (w > maxW) maxW = w
    if (h > maxH) maxH = h
  }
  return { halfW: maxW, halfH: maxH }
}
function frameObject(fill = FILL, keepDir = false) {
  if (!sharedGeo || !camera || !controls) return
  updateCameraAspect()                             // aspecto REAL del viewport antes de medir el FOV
  // dirección de la cámara: conservar la del orbit actual al redimensionar (no resetea la
  // rotación del usuario); en carga / reencuadre manual, volver a la vista por defecto.
  let dir: THREE.Vector3
  if (keepDir) {
    dir = camera.position.clone().sub(controls.target)
    if (dir.lengthSq() < 1e-6) dir = DEFAULT_DIR.clone()
    else dir.normalize()
  } else {
    dir = DEFAULT_DIR.clone()
  }
  const r = boneRadius
  const vFov = (camera.fov * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
  // distancia para que el hueso quepa por su lado LIMITANTE: medimos los medio-extentos
  // PROYECTADOS (halfW en X-pantalla, halfH en Y-pantalla) y exigimos que CADA uno entre en
  // su FOV → dist = max(halfW/tan(hFov/2), halfH/tan(vFov/2)). Así llena bien tanto el ilíaco
  // grande como la vértebra pequeña, y queda centrado (el centro de la caja está en el origen
  // = controls.target). Reservamos la esfera (r) como cota mínima de seguridad por si algún
  // vértice cae fuera (no se corta nunca).
  const ext = orientedHalfExtents(dir)
  let dist: number
  if (ext) {
    const distH = ext.halfH / Math.tan(vFov / 2)
    const distW = ext.halfW / Math.tan(hFov / 2)
    dist = Math.max(distH, distW) / fill
  } else {
    dist = r / Math.sin(Math.min(vFov, hFov) / 2) / fill
  }
  controls.target.set(0, 0, 0)                     // centro de la CAJA = origen (geo recentrada)
  camera.position.copy(dir.multiplyScalar(dist))   // a `dist` mirando al centro
  camera.near = Math.max(0.01, dist - r * 2)
  camera.far = dist + r * 4
  camera.updateProjectionMatrix()
  controls.minDistance = r * 0.6
  controls.maxDistance = dist * 2.6
  controls.update()
}
function reframe() { frameObject(FILL, false) }

/* ---------- precálculo: lee los 3 canales reales por vértice ---------- */
function precompute(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const dAttr = geo.getAttribute('density') as THREE.BufferAttribute | undefined
  const fAttr = geo.getAttribute('fdg') as THREE.BufferAttribute | undefined
  const gAttr = geo.getAttribute('ga') as THREE.BufferAttribute | undefined
  const hasReal = !!(dAttr && fAttr && gAttr)
  const col = geo.getAttribute('color') as THREE.BufferAttribute | undefined
  vDensity = new Float32Array(n); vFdg = new Float32Array(n); vGa = new Float32Array(n)
  hotIndex = -1
  let hotSuv = 0
  for (let i = 0; i < n; i++) {
    let d: number, f: number, g: number
    if (hasReal) { d = dAttr!.getX(i); f = fAttr!.getX(i); g = gAttr!.getX(i) }
    else {
      // FALLBACK: desempaquetar del RGB horneado (R=HU/1500, G=FDG/15, B=GA/15)
      d = (col ? col.getX(i) : 0.5) * 1500
      f = (col ? col.getY(i) : 0) * 15
      g = (col ? col.getZ(i) : 0) * 15
    }
    vDensity[i] = d; vFdg[i] = f; vGa[i] = g
    const s = f > g ? f : g
    if (s > hotSuv) { hotSuv = s; hotIndex = i }
  }
}

/* ---------- carga del PLY (UNA vez) + 3 meshes que comparten la geometría ---------- */
function load(key: string) {
  loading.value = true; failed.value = false; curKey = key
  const loader = new PLYLoader()
  loader.setCustomPropertyNameMapping({ density: ['density_hu'], fdg: ['suv_fdg'], ga: ['suv_ga'] })
  loader.load(`/metastasis/mesh/${key}.ply`, (geo) => {
    try {
      if (curKey !== key) return
      // normales recalculadas del winding (DoubleSide → hueso opaco, nunca translúcido)
      geo.deleteAttribute('normal'); geo.computeVertexNormals()
      // si el PLY trae RGBA, reducir a RGB (alfa<1 translucía el hueso) — sólo para el fallback
      const colAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined
      if (colAttr && colAttr.itemSize === 4) {
        const n = colAttr.count, rgb = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) { rgb[i * 3] = colAttr.getX(i); rgb[i * 3 + 1] = colAttr.getY(i); rgb[i * 3 + 2] = colAttr.getZ(i) }
        geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
      }
      disposeTargetMarker()   // libera el marcador anterior ANTES de descartar sus grupos/meshes
      disposeMeshes()
      disposeBiopsyNeedle()
      // RECENTRAR al CENTRO DE LA CAJA (bounding box), no al centro de la esfera: en
      // huesos irregulares (ilíaco, sacro) el centro de la esfera envolvente cae lejos
      // del centro visual y el hueso aparece descentrado en cada celda. El centro de la
      // caja queda en el medio del hueso → la cámara orbita el centro y se ve centrado.
      geo.computeBoundingBox()
      const bb = geo.boundingBox!
      const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2
      geo.translate(-cx, -cy, -cz)
      // radio de encuadre = radio de la esfera centrada en el ORIGEN que contiene la caja
      // recentrada (máxima distancia de un vértice al nuevo centro) → encuadre completo.
      geo.computeBoundingSphere()
      const s = geo.boundingSphere
      boneRadius = (s && s.radius) || 50
      sharedGeo = geo
      precompute(geo)
      // 3 meshes: MISMA geometría compartida, distinto material + atributo de color por vértice.
      for (let i = 0; i < 3; i++) {
        const mat = new THREE.MeshStandardMaterial({ ...BONE_MAT_BASE, color: new THREE.Color(0xffffff) })
        const m = new THREE.Mesh(geo, mat)
        // cada mesh necesita SU propio atributo de color → usamos un mesh con geometría
        // que comparte buffers de posición/normal/índice pero tiene su propio `color`.
        const perChannelGeo = geo.clone()                      // clona referencias (buffers compartidos)
        perChannelGeo.setAttribute('color', buildColorAttr(PANELS[i].id))
        m.geometry = perChannelGeo
        meshes[i] = m
        scenes[i].add(m)
      }
      // aguja de biopsia ILUSTRATIVA · UNA POR PANEL: cuelga de cada malla (los 3),
      // así rota con cada hueso y se ve en Galio, FDG y densidad por igual.
      needleGroups = []
      targetGroups = []
      for (let i = 0; i < 3; i++) {
        const ng = new THREE.Group(); meshes[i]!.add(ng); needleGroups.push(ng)
        const tg = new THREE.Group(); meshes[i]!.add(tg); targetGroups.push(tg)
      }
      updateCameraAspect()
      frameObject()
      buildBiopsyNeedle()
      buildTargetMarker()
      loading.value = false
      // El contenedor usa aspect-ratio CSS: su ALTURA real puede asentarse DESPUÉS de este
      // primer encuadre (sobre todo en ventanas anchas) → el hueso quedaría grande/cortado.
      // Re-encuadramos con el tamaño REAL en los siguientes frames y de nuevo a los 300 ms.
      requestAnimationFrame(() => requestAnimationFrame(() => { if (sharedGeo) resize() }))
      setTimeout(() => { if (sharedGeo) resize() }, 300)
    } catch (e) { console.error('[BoneTriView] build', e); loading.value = false; failed.value = true }
  }, undefined, (e) => { console.error('[BoneTriView] PLY load error', e); loading.value = false; failed.value = true })
}

function disposeMeshes() {
  for (let i = 0; i < 3; i++) {
    const m = meshes[i]
    if (m) {
      scenes[i].remove(m)
      ;(m.material as THREE.Material).dispose()
      // geometría per-canal: dispose; los buffers compartidos los libera sharedGeo
      if (m.geometry !== sharedGeo) m.geometry.dispose()
      meshes[i] = null
    }
  }
  if (sharedGeo) { sharedGeo.dispose(); sharedGeo = null }
}

/* ====================================================================== */
/*  AGUJA DE BIOPSIA ILUSTRATIVA (#13, 26B585) — portada de BoneViewer3D.  */
/*  Sólo sobre el panel de DENSIDAD/BLÁSTICO; OFF por defecto. NO es la     */
/*  trayectoria real: recreación didáctica del abordaje posterolateral.    */
/* ====================================================================== */
const C_NEEDLE = '#b9c0c9'     // cuerpo · gris metálico claro
const C_NEEDLE_TIP = '#e6ebf0' // bisel de la punta · acero más claro
const C_ENTRY = '#d98a2b'      // marcador de ENTRADA · ámbar
const C_TIP_MK = '#c25a2b'     // marcador de la PUNTA (en hueso) · ámbar oscuro
let needleMats: THREE.Material[] = []
let needleGeos: THREE.BufferGeometry[] = []
/* ====================================================================== */
/*  SEÑAL DE LA ZONA DE MÁXIMA CAPTACIÓN (≈ dónde apuntaría la biopsia).    */
/*  Petición LITERAL de la paciente: la diana DIBUJADA como TEXTURA, como   */
/*  si el hueso tuviera una capa invisible por encima con la diana          */
/*  «siguiendo» la superficie → al rotar NO se despega (los intentos v1–v4  */
/*  con toro/sprite/baliza FLOTABAN: eran objetos SOBRE el hueso, no parte  */
/*  de él). HONESTO: la captación es un GRADIENTE sin borde tumoral neto →  */
/*  NO es un contorno; es un SÍMBOLO orientativo CALCADO en la superficie.  */
/*                                                                          */
/*  DISEÑO v5 «DIANA CALCADA» = THREE.DecalGeometry (solución A):           */
/*   El decal se construye CLIPEANDO los TRIÁNGULOS REALES del hueso contra */
/*   un proyector cúbico en el punto del pico, orientado por la normal. Sus */
/*   vértices yacen SOBRE las caras del hueso → conforma la curvatura local */
/*   y, al ser hijo de la malla en transform IDENTIDAD, gira CLAVADO con el */
/*   hueso: imposible que se despegue, porque ES la superficie. La textura  */
/*   (anillos de diana + cruceta) se pinta en canvas; depthTest:true → se   */
/*   ocluye sola cuando el punto rota detrás (comportamiento de algo        */
/*   pintado). polygonOffset evita z-fight con la cara que recubre. El      */
/*   PARPADEO anima la opacidad/emisivo en el bucle continuo.               */
/*  DS: aros coral #ff6b47 con borde malva #9d44ab de contraste, mate.      */
/*  Se distingue de la aguja de biopsia (#13, ÁMBAR FIJA) por color y      */
/*  parpadeo, y por SER superficie (la aguja es un objeto 3D montado).      */
/* ====================================================================== */
const C_TARGET_RING = '#9d44ab'   // miriam/malva · borde de contraste de la diana
const C_TARGET_CORE = '#ff6b47'   // coral · aros de la diana (color de acción del DS)
let targetMats: THREE.MeshStandardMaterial[] = [] // materiales del decal (uno por panel) — dispose
let targetGeos: THREE.BufferGeometry[] = []       // geometrías de decal — dispose
let targetDecalTex: THREE.Texture | null = null   // textura de la diana (anillos) compartida
/* decales para el parpadeo (referencia a su material en renderScenes) */
let targetDecals: THREE.Mesh[] = []

/* textura de la DIANA (anillos concéntricos + cruceta) sobre fondo transparente, para
   proyectarla como decal sobre la superficie. Aros CORAL con borde MALVA de contraste
   (legible sobre hueso teal/ámbar/sepia). Honesto: símbolo orientativo, no contorno. */
function makeTargetDecalTex(): THREE.Texture {
  const s = 256, c = s / 2
  const cv = document.createElement('canvas'); cv.width = s; cv.height = s
  const ctx = cv.getContext('2d')!
  ctx.clearRect(0, 0, s, s)
  ctx.lineCap = 'round'
  // dos anillos concéntricos (radio externo ≈ 0.46·s para dejar margen del recorte del decal)
  const rings = [0.30, 0.46]
  for (const rr of rings) {
    const r = rr * s
    // halo malva de contraste por debajo
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.strokeStyle = C_TARGET_RING; ctx.lineWidth = s * 0.060; ctx.stroke()
    // aro coral encima
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.strokeStyle = C_TARGET_CORE; ctx.lineWidth = s * 0.034; ctx.stroke()
  }
  // cruceta (4 trazos cortos que apuntan al centro) — refuerza el «punto»
  const inner = 0.10 * s, outer = 0.24 * s
  const ticks: [number, number, number, number][] = [
    [c, c - inner, c, c - outer], [c, c + inner, c, c + outer],
    [c - inner, c, c - outer, c], [c + inner, c, c + outer, c],
  ]
  for (const [x1, y1, x2, y2] of ticks) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
    ctx.strokeStyle = C_TARGET_RING; ctx.lineWidth = s * 0.050; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
    ctx.strokeStyle = C_TARGET_CORE; ctx.lineWidth = s * 0.026; ctx.stroke()
  }
  // punto central coral con halo malva
  ctx.beginPath(); ctx.arc(c, c, s * 0.052, 0, Math.PI * 2)
  ctx.fillStyle = C_TARGET_RING; ctx.fill()
  ctx.beginPath(); ctx.arc(c, c, s * 0.034, 0, Math.PI * 2)
  ctx.fillStyle = C_TARGET_CORE; ctx.fill()
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}
function disposeTargetMarker() {
  targetGroups.forEach((g) => g.clear())
  targetMats.forEach((m) => m.dispose()); targetMats = []
  targetGeos.forEach((g) => g.dispose()); targetGeos = []
  if (targetDecalTex) { targetDecalTex.dispose(); targetDecalTex = null }
  targetDecals = []
}
function buildTargetMarker() {
  disposeTargetMarker()
  if (props.noTarget || !targetGroups.length || hotIndex < 0) return
  targetDecalTex = makeTargetDecalTex()
  // tamaño del proyector del decal ~ 0.22·boneRadius (lado del cubo proyector); la
  // profundidad (Z del proyector) algo mayor para que clipe bien la cara curva.
  const half = boneRadius * 0.22
  const depth = boneRadius * 0.40
  const size = new THREE.Vector3(half * 2, half * 2, depth)
  for (let i = 0; i < 3; i++) {
    const mesh = meshes[i]
    if (!mesh) continue
    // DecalGeometry usa mesh.matrixWorld para la matriz de normales: asegúralo al día
    // (el mesh está en transform IDENTIDAD → coords locales = mundo).
    mesh.updateMatrixWorld(true)
    const geo = mesh.geometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    const nrm = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
    const peak = new THREE.Vector3(pos.getX(hotIndex), pos.getY(hotIndex), pos.getZ(hotIndex))
    const normal = (nrm
      ? new THREE.Vector3(nrm.getX(hotIndex), nrm.getY(hotIndex), nrm.getZ(hotIndex))
      : peak.clone()).normalize()

    // orientación del proyector: su eje +Z mira HACIA AFUERA (a lo largo de la normal),
    // así la cara texturizada del decal queda «de frente» sobre la superficie del hueso.
    // El proyector se sitúa LIGERAMENTE por fuera del pico y proyecta hacia el hueso.
    const projPos = peak.clone().addScaledVector(normal, depth * 0.5)
    const m4 = new THREE.Matrix4()
    const up = Math.abs(normal.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    // mira desde projPos hacia el pico → -Z del proyector apunta al hueso (lookAt usa -Z)
    m4.lookAt(projPos, peak, up)
    const orientation = new THREE.Euler().setFromRotationMatrix(m4)

    // DecalGeometry clipea los triángulos REALES de la malla → vértices SOBRE la superficie.
    const decalGeo = new DecalGeometry(mesh, projPos, orientation, size)
    targetGeos.push(decalGeo)

    const mat = new THREE.MeshStandardMaterial({
      map: targetDecalTex,
      color: new THREE.Color(0xffffff),
      emissive: new THREE.Color(C_TARGET_CORE),
      emissiveMap: targetDecalTex,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 1,
      roughness: 0.6,
      metalness: 0.0,
      depthTest: true,        // se ocluye solo al rotar el punto detrás (es superficie)
      depthWrite: false,      // capa pintada encima → no escribe profundidad (sin artefactos de orden)
      polygonOffset: true,    // anti z-fight con la cara que recubre
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      toneMapped: true,
      side: THREE.FrontSide,
    })
    targetMats.push(mat)
    const decal = new THREE.Mesh(decalGeo, mat)
    decal.renderOrder = 6
    targetGroups[i]!.add(decal)
    targetDecals.push(decal)
  }
}
function disposeBiopsyNeedle() {
  needleGroups.forEach((g) => g.clear())
  needleMats.forEach((m) => m.dispose()); needleMats = []
  needleGeos.forEach((g) => g.dispose()); needleGeos = []
}
/* vértice de hueso MÁS DENSO dentro de un radio del punto p (coords de geometría) */
function densestNear(geo: THREE.BufferGeometry, p: THREE.Vector3, radius: number): THREE.Vector3 | null {
  if (!vDensity) return null
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count, r2 = radius * radius
  let best = -Infinity, bi = -1
  for (let i = 0; i < n; i++) {
    const dx = pos.getX(i) - p.x, dy = pos.getY(i) - p.y, dz = pos.getZ(i) - p.z
    if (dx * dx + dy * dy + dz * dz > r2) continue
    if (vDensity[i] > best) { best = vDensity[i]; bi = i }
  }
  if (bi < 0) return null
  return new THREE.Vector3(pos.getX(bi), pos.getY(bi), pos.getZ(bi))
}
function smallSphere(color: string, r: number): THREE.Mesh {
  const g = new THREE.SphereGeometry(r, 16, 12); needleGeos.push(g)
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.5, metalness: 0.1, depthTest: true, depthWrite: true, toneMapped: true })
  needleMats.push(m)
  return new THREE.Mesh(g, m)
}
function buildBiopsyNeedle() {
  disposeBiopsyNeedle()
  if (!needleGroups.length || !sharedGeo) return
  if (!props.biopsied || !showBiopsy.value) return
  if (hotIndex < 0) return
  const geo = meshes[2]!.geometry            // geometría del panel densidad (per-canal; mismos pos)
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
  const peak = new THREE.Vector3(pos.getX(hotIndex), pos.getY(hotIndex), pos.getZ(hotIndex))
  const peakNrm = nrm
    ? new THREE.Vector3(nrm.getX(hotIndex), nrm.getY(hotIndex), nrm.getZ(hotIndex)).normalize()
    : peak.clone().normalize()
  // PUNTA en hueso denso cerca del foco pero DESPLAZADA del pico (la biopsia cayó en hueso)
  const inward = peakNrm.clone().multiplyScalar(-1)
  const offset = peak.clone().addScaledVector(inward, boneRadius * 0.18)
  let tip = densestNear(geo, offset, boneRadius * 0.22) ?? offset
  if (tip.distanceTo(peak) < boneRadius * 0.12) tip = peak.clone().addScaledVector(inward, boneRadius * 0.22)
  // abordaje posterolateral hacia el ala ilíaca, mezclado con la normal de la superficie
  const approach = new THREE.Vector3(0.78, 0.30, -0.54).normalize()
  const dir = approach.clone().multiplyScalar(0.6).add(peakNrm.clone().multiplyScalar(0.4)).normalize()
  const needleLen = boneRadius * 1.85
  const entry = tip.clone().addScaledVector(dir, needleLen)
  const axis = entry.clone().sub(tip)
  const len = axis.length()
  const up = axis.clone().normalize()
  // cuerpo: cilindro fino metálico
  const rad = Math.max(0.5, boneRadius * 0.018)
  const bodyLen = len * 0.93
  const bodyGeo = new THREE.CylinderGeometry(rad, rad, bodyLen, 20, 1, true); needleGeos.push(bodyGeo)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(C_NEEDLE), roughness: 0.32, metalness: 0.85,
    side: THREE.DoubleSide, depthTest: true, depthWrite: true, toneMapped: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })
  needleMats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.copy(tip.clone().addScaledVector(up, len - bodyLen / 2))
  body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)
  // bisel de la punta: cono corto coaxial
  const bevelLen = Math.min(rad * 6, len * 0.07)
  const bevelGeo = new THREE.ConeGeometry(rad, bevelLen, 20); needleGeos.push(bevelGeo)
  const bevelMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C_NEEDLE_TIP), roughness: 0.28, metalness: 0.9, depthTest: true, depthWrite: true, toneMapped: true })
  needleMats.push(bevelMat)
  const bevel = new THREE.Mesh(bevelGeo, bevelMat)
  bevel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up.clone().multiplyScalar(-1))
  bevel.position.copy(tip.clone().addScaledVector(up, bevelLen / 2))
  // marcadores: entrada (ámbar) + punta (ámbar oscuro, en hueso)
  const entryMk = smallSphere(C_ENTRY, Math.max(1.0, boneRadius * 0.035)); entryMk.position.copy(entry)
  const tipMk = smallSphere(C_TIP_MK, Math.max(0.9, boneRadius * 0.03)); tipMk.position.copy(tip)
  body.renderOrder = 7; bevel.renderOrder = 8; entryMk.renderOrder = 8; tipMk.renderOrder = 8
  // mete la aguja en LOS 3 paneles: original al panel 0, clones a 1 y 2 (clonan
  // geometría+material → mismo dibujo en Galio, FDG y densidad).
  const parts = [body, bevel, entryMk, tipMk]
  needleGroups.forEach((g, gi) => { for (const part of parts) g.add(gi === 0 ? part : part.clone()) })
}
function toggleBiopsy() { if (biopsyAvailable.value) showBiopsy.value = !showBiopsy.value }

/* ---------- ciclo de vida ---------- */
/* APILA vertical sólo cuando 3 columnas no caben con holgura (≈ < 150 px/columna).
   El visor vive en una COLUMNA del wiki (no en el ancho total de la página): a 1440
   esa columna mide ~600 px → 3 columnas de ~200 px caben bien (NO apilar). En móvil
   real (~310–360 px de columna) sí se apila. Umbral por el ANCHO DEL COMPONENTE, no
   por el breakpoint global, porque el componente puede ir en una columna estrecha. */
const STACK_BELOW = 460
function updateStacked() {
  if (!host.value) return
  const wasStacked = stacked.value
  stacked.value = host.value.clientWidth < STACK_BELOW
  if (wasStacked !== stacked.value) { updateCameraAspect(); frameObject() }
}

onMounted(() => {
  if (noMesh.value) { loading.value = false; return }
  let tries = 0
  const start = () => {
    if (!host.value) {
      if (tries++ < 30) { requestAnimationFrame(start); return }
      console.error('[BoneTriView] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    try { updateStacked(); init(); if (props.meshKey) load(props.meshKey) }
    catch (e) { console.error('[BoneTriView] init', e); failed.value = true; loading.value = false }
  }
  start()
})
watch(() => props.meshKey, (k) => {
  showBiopsy.value = false
  if (!k || !renderer) return
  try { load(k) } catch (e) { console.error('[BoneTriView] load', e); failed.value = true; loading.value = false }
})
watch(() => props.biopsied, (b) => { if (!b) { showBiopsy.value = false; buildBiopsyNeedle() } })
watch(showBiopsy, () => { buildBiopsyNeedle() })
watch(() => props.noTarget, () => buildTargetMarker())
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect()
  disposeBiopsyNeedle(); disposeTargetMarker(); disposeMeshes()
  pmrem?.dispose(); renderer?.dispose()
})
</script>

<template>
  <div class="w-full">
    <!-- sin reconstrucción 3D individual para este foco (honesto, sin inventar) -->
    <div
      v-if="noMesh"
      class="relative w-full flex items-center justify-center text-center text-[12px] px-5 leading-snug"
      style="aspect-ratio:5/4;background:#0d1117;border-radius:0.5rem;color:#aeb6c2"
    >
      {{ L('Sin reconstrucción 3D individual para este foco.', 'No individual 3D reconstruction for this focus.') }}
    </div>

    <template v-else>
      <!-- TÍTULOS + LEYENDA por panel (encima del canvas; en escritorio 3 columnas,
           en móvil apilado las 3 filas). Cada panel: título + escala 0→máx. -->
      <div
        class="btv-titles"
        :class="failed ? 'btv-titles--hidden' : ''"
        aria-hidden="false"
      >
        <div v-for="p in PANELS" :key="p.id" class="btv-title-cell">
          <p class="btv-title">{{ L(p.title.es, p.title.en) }}</p>
          <p class="btv-sub">{{ L(p.sub.es, p.sub.en) }}</p>
          <div class="btv-legend">
            <span class="btv-legend-min">0</span>
            <span class="btv-legend-bar" :style="{ background: `linear-gradient(to right, ${p.legendFrom}, ${p.legendTo})` }" />
            <span class="btv-legend-max">{{ p.max }}<span class="btv-legend-unit"> {{ L(p.unit.es, p.unit.en) }}</span></span>
          </div>
        </div>
      </div>

      <!-- CANVAS único · 3 viewports (setViewport+setScissor). Una cámara → giran juntos.
           El aspecto cambia con el layout: fila ancha (3 celdas ~4:5) en escritorio,
           columna alta (3 celdas apiladas) en móvil. -->
      <div
        class="relative w-full select-none"
        :style="`aspect-ratio:${stacked ? '4/15' : '12/5'};background:#0d1117;border-radius:0.5rem;overflow:hidden`"
      >
        <div ref="host" role="img" :aria-label="L('Hueso en 3D · tres mapas del mismo hueso: captación del receptor (Galio), del azúcar (FDG) y forma (densidad del CT). Arrástralo para girar; la tabla y las imágenes clave son la alternativa textual.', '3D bone · three maps of the same bone: receptor (gallium) uptake, sugar (FDG) uptake and shape (CT density). Drag to rotate; the table and key images are the text alternative.')" class="absolute inset-0 cursor-grab active:cursor-grabbing" :style="failed ? 'opacity:0;pointer-events:none' : ''" />

        <!-- separadores entre vistas (sólo decorativos; el canvas es único) -->
        <template v-if="!failed && !stacked">
          <span class="btv-divider" style="left:33.333%" aria-hidden="true" />
          <span class="btv-divider" style="left:66.666%" aria-hidden="true" />
        </template>
        <template v-else-if="!failed">
          <span class="btv-divider-h" style="top:33.333%" aria-hidden="true" />
          <span class="btv-divider-h" style="top:66.666%" aria-hidden="true" />
        </template>

        <!-- botón de reencuadre ⟲ -->
        <button
          v-if="!failed"
          type="button"
          class="btv-reframe"
          :aria-label="L('Reencuadrar la vista', 'Reset the view')"
          :title="L('Reencuadrar', 'Reset view')"
          @click="reframe"
        >⟲</button>

        <!-- TOGGLE de la aguja de biopsia ILUSTRATIVA (#13). OFF por defecto; dibuja
             la aguja sobre el panel de densidad/blástico. -->
        <button
          v-if="biopsyAvailable"
          type="button"
          class="btv-biopsy-toggle"
          :class="{ 'is-on': showBiopsy }"
          :aria-pressed="showBiopsy"
          @click="toggleBiopsy"
        >
          <span class="btv-biopsy-dot" aria-hidden="true" />
          {{ showBiopsy
            ? L('Ocultar la biopsia previa', 'Hide prior biopsy')
            : L('Ver la biopsia previa (' + (biopsyLabel || '26B585') + ')', 'Show prior biopsy (' + (biopsyLabel || '26B585') + ')') }}
        </button>

        <!-- cargando -->
        <div v-if="loading && !failed" class="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <span class="btv-spin" />
          <span class="text-[11px]" style="color:#aeb6c2">{{ L('reconstruyendo 3D…', 'building 3D…') }}</span>
        </div>

        <!-- fallback digno sin-WebGL: fotograma del MISMO CT -->
        <div v-if="failed" class="absolute inset-0">
          <BoneFrameViewer :mesh-key="meshKey" kind="vertebra" />
          <div
            class="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] text-center"
            style="color:#cdd5e0;background:linear-gradient(to top,rgba(8,11,16,0.88),rgba(8,11,16,0));pointer-events:none"
          >
            {{ L('Vista estática · este navegador no permite 3D interactivo', 'Static view · this browser does not support interactive 3D') }}
          </div>
        </div>
      </div>

      <!-- CAPTION · UNA línea corta de interacción (la honestidad va al desplegable) -->
      <div class="btv-foot">
        <p class="btv-cap">
          {{ failed
            ? L('Reconstrucción del CT · vista estática', 'Reconstruction from the CT · static view')
            : L('Arrastra para girar · rueda para acercar · las 3 vistas a la vez', 'Drag to rotate · scroll to zoom · all 3 views at once') }}
        </p>

        <!-- HONESTIDAD REUBICADA · desplegable SUTIL, PLEGADO por defecto. La info
             clínica sigue accesible (criterio del radiólogo) sin abrumar (criterio del
             diseñador). Voz neutral: informa, no concluye. -->
        <!-- (homogeneidad · §13) ⓘ «Cómo se lee el mapa» → tooltip Term (al pasar/enfocar),
             en vez de un <details> de clic-para-ver. La info queda en el aria-label de Term. -->
        <Term v-if="!failed" id="lectura_mapa3d" :label="L('ⓘ Cómo se lee el mapa', 'ⓘ How to read the map')" />
        <p v-if="!failed && !noTarget" class="flex items-center gap-1.5 mt-1.5 text-[11px] leading-snug" style="color:#3a3340">
          <span aria-hidden="true" style="width:0.65rem;height:0.65rem;border-radius:50%;flex-shrink:0;display:inline-block;border:2px solid #ff6b47;box-shadow:0 0 0 1.5px rgba(157,68,171,0.55)" />
          {{ L('La diana parpadeante (aros coral calcados SOBRE el hueso, siguiendo su superficie) señala el punto orientativo sugerido (zona de máxima captación) — una opción, no una indicación.', 'The blinking target (coral rings printed ONTO the bone, following its surface) marks the suggested orientative point (peak-uptake zone) — an option, not an instruction.') }}
        </p>
      </div>

      <!-- RÓTULO HONESTO de la aguja ILUSTRATIVA (sólo con el toggle activo) -->
      <p v-if="biopsyAvailable && showBiopsy" class="btv-biopsy-cap">
        <span class="btv-biopsy-cap-head">
          <span class="btv-biopsy-swatch" :style="{ background: C_NEEDLE }" aria-hidden="true" />
          {{ L('Simulación ILUSTRATIVA de la biopsia previa (' + (biopsyLabel || '26B585') + ') · sobre el mapa de densidad', 'ILLUSTRATIVE simulation of the prior biopsy (' + (biopsyLabel || '26B585') + ') · over the density map') }}
        </span>
        {{ L('Trayectoria APROXIMADA, no la real — recreación didáctica. La punta queda en hueso denso (blástico): la biopsia dio solo hueso/músculo, sin tumor evaluable — el hueso blástico denso rinde poco tejido tumoral.',
             'APPROXIMATE trajectory, not the actual one — a teaching recreation. The tip lands in dense (blastic) bone: the biopsy yielded only bone/muscle, no evaluable tumour — dense blastic bone yields little tumour tissue.') }}
        <span class="btv-biopsy-key">
          <span class="btv-biopsy-mk" :style="{ background: C_ENTRY }" aria-hidden="true" /> {{ L('entrada', 'entry') }} ·
          <span class="btv-biopsy-mk" :style="{ background: C_TIP_MK }" aria-hidden="true" /> {{ L('punta (en hueso)', 'tip (in bone)') }}
        </span>
      </p>
    </template>
  </div>
</template>

<style scoped>
/* ---- títulos + leyenda por panel ---- */
.btv-titles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.btv-titles--hidden { opacity: 0.45; }
@media (max-width: 639px) {
  .btv-titles { grid-template-columns: 1fr; gap: 4px; }
}
.btv-title-cell { min-width: 0; }
.btv-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d1b3d;
  line-height: 1.2;
}
.btv-sub {
  font-size: 10.5px;
  color: #6b6275;
  line-height: 1.2;
  margin-top: 1px;
}
.btv-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
}
.btv-legend-bar {
  flex: 1 1 auto;
  height: 7px;
  border-radius: 4px;
  border: 1px solid rgba(45, 27, 61, 0.14);
  min-width: 28px;
}
.btv-legend-min, .btv-legend-max {
  font-size: 10px;
  color: #6b6275;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.btv-legend-unit { color: #6b6275; }

/* ---- canvas / vistas ---- */
.btv-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(174, 182, 194, 0.22);
  pointer-events: none;
  z-index: 1;
}
.btv-divider-h {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(174, 182, 194, 0.22);
  pointer-events: none;
  z-index: 1;
}

.btv-spin {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(174, 182, 194, 0.25);
  border-top-color: #1c969e;
  animation: btv-rot 0.8s linear infinite;
}
@keyframes btv-rot { to { transform: rotate(360deg); } }

.btv-reframe {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(174, 182, 194, 0.28);
  background: rgba(13, 17, 23, 0.7);
  color: #cdd5e0;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.btv-reframe:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.btv-reframe:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }

/* toggle de la aguja de biopsia ILUSTRATIVA — abajo-izquierda */
.btv-biopsy-toggle {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(217, 138, 43, 0.55);
  background: rgba(13, 17, 23, 0.72);
  color: #e7c79a;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.btv-biopsy-toggle:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(217, 138, 43, 0.85); }
.btv-biopsy-toggle:focus-visible { outline: 2px solid #d98a2b; outline-offset: 2px; }
.btv-biopsy-toggle.is-on { background: rgba(217, 138, 43, 0.18); border-color: rgba(217, 138, 43, 0.95); color: #f3d8ad; }
.btv-biopsy-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d98a2b;
  box-shadow: 0 0 0 2px rgba(217, 138, 43, 0.25);
}

/* rótulo honesto de la aguja */
.btv-biopsy-cap {
  font-size: 10px;
  text-align: left;
  margin-top: 6px;
  padding: 7px 9px;
  border-radius: 6px;
  border: 1px solid rgba(217, 138, 43, 0.35);
  background: rgba(217, 138, 43, 0.07);
  font-family: ui-monospace, monospace;
  line-height: 1.45;
  color: #8a5a1a;
}
.btv-biopsy-cap-head {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.btv-biopsy-swatch {
  display: inline-block;
  width: 14px;
  height: 4px;
  border-radius: 2px;
  border: 1px solid rgba(125, 133, 143, 0.7);
}
.btv-biopsy-key { display: inline-flex; align-items: center; gap: 5px; margin-left: 2px; }
.btv-biopsy-mk { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }

/* PIE del visor · una sola línea de interacción + el desplegable de honestidad, en una
   fila que se reparte (la línea a la izquierda, el «Cómo se lee» a la derecha). En
   estrecho se apila sin huecos muertos. */
.btv-foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 8px;
}
/* CAPTION sobre fondo CREAM (no oscuro): fuente del cuerpo, color legible (AA),
   alineado a la izquierda. UNA sola línea de interacción; lo demás va al desplegable. */
.btv-cap {
  font-size: 11.5px;
  text-align: left;
  font-family: inherit;
  line-height: 1.4;
  color: #6b6470;
  margin: 0;
}

/* (homogeneidad) CSS de .btv-read* eliminado: la ⓘ «Cómo se lee el mapa» pasó a tooltip Term. */
</style>
