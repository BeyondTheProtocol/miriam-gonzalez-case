<script setup lang="ts">
/**
 * Visor 3D real (WebGL) del hueso reconstruido del CT — UN SOLO visor, UNA geometría,
 * UN PLY por hueso. Tres MODOS de lectura que se intercambian SIN recargar la malla:
 * sólo se reescribe el ATRIBUTO DE COLOR POR VÉRTICE (rápido). Rotación libre 360° con
 * arrastre, rueda para acercar. Malla PLY en /public/metastasis/mesh.
 *
 * EL DATO: las mallas .ply traen UN solo color RGB por vértice, con dos señales horneadas
 * JUNTAS: la DENSIDAD del CT vive en la LUMINANCIA y la CAPTACIÓN del PET en el CROMA/MATIZ
 * (magenta ≈ receptor/Galio, naranja-cálido ≈ azúcar/FDG). La separación de trazadores es
 * una HEURÍSTICA del matiz, no perfecta; donde Galio y FDG solapan el matiz no puede
 * separar ambos. No hace falta otra malla ni textura: cada modo deriva su color del MISMO
 * RGB por vértice. (Confirmado sobre los PLY: la luminancia ósea está comprimida muy arriba
 * —p2≈0.80, p50≈0.86–0.94— por eso «todo blanco»; el croma es débil y variable por hueso
 * —sat máx 0.10 en C3 a 0.33 en D11— por eso los umbrales son adaptativos por hueso.)
 *
 * MODOS:
 *  1) «Área» (por defecto) — la HUELLA de la lesión. Se umbraliza el croma por vértice
 *     (adaptativo por hueso, con suelo absoluto y borde suave) → los vértices por encima
 *     del umbral se pintan como REGIÓN contigua en el color del trazador que domina en
 *     cada vértice (violeta receptor / naranja FDG); el resto del hueso en marfil mate.
 *     La lesión ES el área: NO hay diana-punto flotante. «Dónde y cuánto», no un punto.
 *  2) «Mapa de calor» — intensidad de captación continua: score de captación por vértice
 *     → rampa térmica perceptual (azul→cian→amarillo→rojo), normalizada a una referencia
 *     ABSOLUTA (comparable entre huesos, no se sobre-dramatizan los huesos planos). Marca
 *     discreta del punto más caliente (SUVmáx) si hay captación apreciable.
 *  3) «Morfología» — densidad/forma del CT. La LUMINANCIA por vértice (estirada por hueso,
 *     p2→p98, con gamma que reserva el extremo a lo más denso) → rampa SIN BLANCO ARRIBA:
 *     tostado/neutro (normal) → azul oscuro saturado (blástico/denso). El sombreado de las
 *     luces (Lambert/PBR mate) da el volumen encima. Es FORMA, no biología, no trazador.
 *
 * HUESO MATE Y OPACO (no romper la opacidad ya arreglada): MeshStandardMaterial muy rugoso,
 * sin metal, casi sin entorno; DoubleSide + normales recalculadas del winding → nunca se ve
 * «a través» del hueso. Con vertexColors:true el color por vértice ES el albedo y las luces
 * lo sombrean encima (se lee el volumen). El marfil del modo «Área» es el mismo tono mate
 * de siempre.
 *
 * FALLBACK sin-WebGL: fotogramas dignos vía BoneFrameViewer (vertebra/ para área y calor,
 * morfo/ realzado para morfología). Honestidad en los captions: aproximaciones derivadas
 * del RGB horneado; informar, no concluir; voz neutral.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type Mode = 'area' | 'heat' | 'morpho'
const props = defineProps<{
  meshKey?: string
  mode?: Mode
  dota?: number | null            // SUVmáx receptor (⁶⁸Ga-DOTATOC)
  fdg?: number | null             // SUVmáx azúcar (¹⁸F-FDG)
  pheno?: string
  focusId?: number
}>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)
const mode = computed<Mode>(() => props.mode ?? 'area')

/* colores de trazador (vivos, leen sobre marfil y sobre fondo oscuro) */
const C_REC = '#c061d6'    // receptor · Galio (violeta)
const C_FDG = '#ff8a3a'    // azúcar · FDG (naranja)
const C_IVORY = '#dcd3c2'  // hueso mate, uniforme (igual que el look ya aprobado)
const C_HOT = '#fff1f1'    // núcleo de la marca del SUVmáx (punto más caliente)

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
/* foco sin malla PLY individual (p. ej. #17 costilla, #19): estado honesto */
const noMesh = computed(() => !props.meshKey)
/* kind de fotograma para el fallback sin-WebGL, según el modo */
const fallbackKind = computed<'vertebra' | 'morfo'>(() => (mode.value === 'morpho' ? 'morfo' : 'vertebra'))

let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls
let pmrem: THREE.PMREMGenerator | null = null
let mesh: THREE.Mesh | null = null
let markerGroup: THREE.Group | null = null
let raf = 0, ro: ResizeObserver | null = null
let curKey = ''
let boneCenter = new THREE.Vector3()
let boneRadius = 50

/* ---- datos por vértice derivados del RGB horneado (se calculan UNA vez al cargar) ---- */
let vRecLean: Float32Array | null = null   // magenta-lean (receptor) por vértice
let vWarmLean: Float32Array | null = null  // warm-lean (FDG) por vértice
let vScore: Float32Array | null = null     // score de captación = max(recLean, warmLean)
let vLum: Float32Array | null = null       // luminancia (densidad del CT) por vértice
let outColors: Float32Array | null = null  // buffer de salida reutilizado (count*3, LINEAL)
let scoreHi = 0.04                          // máximo robusto del score (p99.5)
let lumLo = 0, lumHi = 1                     // p2 / p98 de luminancia (estiramiento por hueso)
let hotIndex = -1                           // vértice del punto más caliente

/* ---------- color: sRGB → lineal (three multiplica los colores por vértice en LINEAL) ---------- */
function lin(hex: string): [number, number, number] {
  const c = new THREE.Color(hex)        // hex sRGB → componentes LINEALES (ColorManagement)
  return [c.r, c.g, c.b]
}
function linFrom255(r: number, g: number, b: number): [number, number, number] {
  const c = new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
  return [c.r, c.g, c.b]
}
const REC_LIN = lin(C_REC)
const FDG_LIN = lin(C_FDG)
const IVORY_LIN = lin(C_IVORY)
/* rampa: pares [posición 0..1, color sRGB 0..255] → evaluador que interpola en LINEAL */
function makeRamp(stops: [number, [number, number, number]][]) {
  const L2 = stops.map(([p, c]) => { const [r, g, b] = linFrom255(c[0], c[1], c[2]); return [p, r, g, b] as const })
  return (t: number): [number, number, number] => {
    t = t < 0 ? 0 : t > 1 ? 1 : t
    for (let i = 0; i < L2.length - 1; i++) {
      const a = L2[i], b = L2[i + 1]
      if (t <= b[0]) { const f = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0; return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f] }
    }
    const z = L2[L2.length - 1]; return [z[1], z[2], z[3]]
  }
}
/* «Mapa de calor»: frío→caliente perceptual (azul→cian→amarillo→naranja→rojo) */
const heatRamp = makeRamp([
  [0.00, [20, 34, 90]],     // sin captación · azul profundo (la forma se lee por la luz)
  [0.25, [26, 110, 214]],   // azul
  [0.45, [10, 185, 200]],   // cian
  [0.65, [232, 224, 48]],   // amarillo
  [0.82, [245, 138, 26]],   // naranja
  [1.00, [222, 28, 28]],    // rojo · más caliente
])
/* «Morfología»: SIN blanco arriba — tostado/neutro (normal) → azul oscuro saturado
   (blástico). Los azules van DELIBERADAMENTE oscuros y saturados: las luces (Lambert)
   aclaran el albedo, así que un azul oscuro de partida queda como azul medio-oscuro
   legible (no azul casi-blanco). */
const morphoRamp = makeRamp([
  [0.00, [122, 94, 60]],    // recoveco / baja densidad · tostado cálido
  [0.32, [176, 150, 110]],  // bajo-normal · tostado
  [0.52, [210, 194, 160]],  // hueso normal · marfil neutro
  [0.66, [70, 104, 168]],   // transición · azul apagado
  [0.82, [22, 56, 140]],    // blástico · azul saturado
  [1.00, [6, 22, 78]],      // lo más denso · azul oscuro saturado
])

function smoothstep(e0: number, e1: number, x: number): number {
  if (e1 <= e0) return x >= e1 ? 1 : 0
  let t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t)
}
function percentile(sorted: Float32Array, p: number): number {
  if (!sorted.length) return 0
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))
  return sorted[i]
}

function resize() {
  if (!host.value || !renderer) return
  const w = host.value.clientWidth, h = host.value.clientHeight || Math.round(w * 0.8)
  renderer.setSize(w, h)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}

function init() {
  const el = host.value!
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1117)
  camera = new THREE.PerspectiveCamera(38, 1.25, 0.1, 8000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping       // roll-off filmic → ni el marfil ni el rojo del calor se «queman»
  renderer.toneMappingExposure = 0.95
  el.appendChild(renderer.domElement)
  // ambiente tenue (room) SOLO como relleno difuso — sin reflejos especulares (roughness ~0.95)
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  // luz difusa/hemisférica protagonista → look de HUESO MACIZO mate; sombrea el color por vértice (volumen)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1d26, 0.95))
  const key = new THREE.DirectionalLight(0xfff4ea, 0.85); key.position.set(-0.6, 0.9, 1.0); scene.add(key)
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.38); fill.position.set(0.7, -0.2, -0.7); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.28); rim.position.set(0.2, 0.4, -1.0); scene.add(rim)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
  controls.rotateSpeed = 0.9; controls.minDistance = 1; controls.maxDistance = 100000
  resize()
  ro = new ResizeObserver(resize); ro.observe(el)
  const tick = () => { raf = requestAnimationFrame(tick); controls.update(); renderer.render(scene, camera) }
  tick()
}

/* encuadre: el boundingSphere ENTERO llena el marco con un margen pequeño */
function frameObject(fill = 0.9) {
  if (!mesh || !camera || !controls) return
  const r = boneRadius
  const vFov = (camera.fov * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
  const fitH = r / Math.sin(vFov / 2)
  const fitW = r / Math.sin(hFov / 2)
  const dist = Math.max(fitH, fitW) / fill
  const dir = new THREE.Vector3(0.32, 0.16, 1).normalize()
  camera.position.copy(dir.multiplyScalar(dist))
  camera.near = Math.max(0.01, dist - r * 2)
  camera.far = dist + r * 4
  camera.updateProjectionMatrix()
  controls.target.set(0, 0, 0)
  controls.minDistance = r * 0.75
  controls.maxDistance = dist * 2.6
  controls.update()
}
function reframe() { frameObject() }

/* ---------- precálculo por vértice a partir del RGB horneado ---------- */
function precompute(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const col = geo.getAttribute('color') as THREE.BufferAttribute | undefined
  const n = pos.count
  vRecLean = new Float32Array(n); vWarmLean = new Float32Array(n)
  vScore = new Float32Array(n); vLum = new Float32Array(n)
  outColors = new Float32Array(n * 3)
  hotIndex = -1
  let best = -1
  for (let i = 0; i < n; i++) {
    const r = col ? col.getX(i) : 0.86, g = col ? col.getY(i) : 0.83, b = col ? col.getZ(i) : 0.76
    const rl = Math.max(0, (r + b) / 2 - g)   // magenta-lean (receptor)
    const wl = Math.max(0, r - b)             // warm-lean (FDG)
    vRecLean[i] = rl; vWarmLean[i] = wl
    const s = Math.max(rl, wl); vScore[i] = s
    vLum[i] = 0.2126 * r + 0.7152 * g + 0.114 * b
    if (s > best) { best = s; hotIndex = i }
  }
  // estadística robusta: máximo de score (p99.5) y banda de luminancia (p2..p98)
  const ss = Float32Array.from(vScore).sort(); scoreHi = Math.max(0.04, percentile(ss, 0.995))
  const ll = Float32Array.from(vLum).sort(); lumLo = percentile(ll, 0.02); lumHi = percentile(ll, 0.98)
  if (lumHi - lumLo < 1e-3) lumHi = lumLo + 1e-3
}

/* ---------- pintar el atributo de color por vértice según el modo ---------- */
function applyMode() {
  if (!mesh || !vScore || !vLum || !outColors || !vRecLean || !vWarmLean) return
  const geo = mesh.geometry
  const n = vScore.length
  const out = outColors
  const m = mode.value

  if (m === 'area') {
    // umbral adaptativo por hueso + suelo absoluto; borde suave → REGIÓN contigua
    const floor = 0.06
    const thr = Math.max(floor, 0.42 * scoreHi)
    const e0 = thr * 0.62
    for (let i = 0; i < n; i++) {
      const a = smoothstep(e0, thr, vScore[i])                 // pertenencia 0..1 (suave)
      const tr = vRecLean[i] >= vWarmLean[i] ? REC_LIN : FDG_LIN  // color del trazador dominante EN ESTE vértice
      const k = i * 3
      out[k] = IVORY_LIN[0] + (tr[0] - IVORY_LIN[0]) * a
      out[k + 1] = IVORY_LIN[1] + (tr[1] - IVORY_LIN[1]) * a
      out[k + 2] = IVORY_LIN[2] + (tr[2] - IVORY_LIN[2]) * a
    }
  } else if (m === 'heat') {
    // intensidad continua normalizada a una referencia ABSOLUTA (comparable entre huesos)
    const REF = 0.28
    for (let i = 0; i < n; i++) {
      let t = vScore[i] / REF; t = t > 1 ? 1 : t
      t = Math.pow(t, 0.9)
      const c = heatRamp(t)
      const k = i * 3; out[k] = c[0]; out[k + 1] = c[1]; out[k + 2] = c[2]
    }
  } else {
    // morfología: luminancia estirada por hueso; gamma>1 reserva el azul oscuro a lo más denso
    const inv = 1 / (lumHi - lumLo)
    for (let i = 0; i < n; i++) {
      let t = (vLum[i] - lumLo) * inv; t = t < 0 ? 0 : t > 1 ? 1 : t
      t = Math.pow(t, 1.45)   // gamma>1 reserva el azul oscuro a lo MÁS denso (blástico)
      const c = morphoRamp(t)
      const k = i * 3; out[k] = c[0]; out[k + 1] = c[1]; out[k + 2] = c[2]
    }
  }

  const existing = geo.getAttribute('color') as THREE.BufferAttribute | undefined
  if (existing && existing.array === out) { existing.needsUpdate = true }
  else geo.setAttribute('color', new THREE.BufferAttribute(out, 3))
  buildMarkers()
}

/* ---------- marca discreta del punto más caliente (SOLO en «Mapa de calor») ---------- */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
function hotTexture(): THREE.CanvasTexture {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S
  const ctx = cv.getContext('2d')!; const c = S / 2
  ctx.clearRect(0, 0, S, S)
  // halo cálido tenue + anillo fino blanco + punto central → «punto más caliente»
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, hexA('#ff3b3b', 0.35)); g.addColorStop(0.5, hexA('#ff3b3b', 0.10)); g.addColorStop(1, hexA('#ff3b3b', 0))
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = C_HOT; ctx.globalAlpha = 0.95; ctx.lineWidth = S * 0.03; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(c, c, S * 0.30, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 1; ctx.fillStyle = C_HOT
  ctx.beginPath(); ctx.arc(c, c, S * 0.07, 0, Math.PI * 2); ctx.fill()
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function disposeMarkers() {
  if (!markerGroup) return
  markerGroup.children.forEach((o) => {
    const me = o as THREE.Mesh
    const mt = me.material as THREE.MeshBasicMaterial
    mt.map?.dispose(); mt.dispose(); me.geometry?.dispose()
  })
  markerGroup.clear()
}
function buildMarkers() {
  if (!mesh || !markerGroup) return
  disposeMarkers()
  // SOLO el modo calor lleva marca (el punto más caliente). «Área» NO usa diana-punto; «Morfología» es forma.
  if (mode.value !== 'heat' || hotIndex < 0 || scoreHi < 0.07) return
  const geo = mesh.geometry
  const posA = geo.getAttribute('position') as THREE.BufferAttribute
  const norA = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
  const point = new THREE.Vector3(posA.getX(hotIndex), posA.getY(hotIndex), posA.getZ(hotIndex)).add(mesh.position)
  const normal = norA
    ? new THREE.Vector3(norA.getX(hotIndex), norA.getY(hotIndex), norA.getZ(hotIndex))
      .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize()
    : point.clone().sub(boneCenter).normalize()
  if (normal.lengthSq() < 1e-6) normal.set(0, 0, 1)
  const diameter = boneRadius * 0.16
  const m = new THREE.Mesh(new THREE.CircleGeometry(diameter / 2, 48), new THREE.MeshBasicMaterial({
    map: hotTexture(), transparent: true, opacity: 0.95,
    depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    side: THREE.DoubleSide, blending: THREE.NormalBlending, toneMapped: false,
  }))
  m.position.copy(point).add(normal.clone().multiplyScalar(boneRadius * 0.004))
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  m.renderOrder = 5
  markerGroup.add(m)
}

function load(key: string) {
  loading.value = true; failed.value = false; curKey = key
  new PLYLoader().load(`/metastasis/mesh/${key}.ply`, (geo) => {
    try {
      if (curKey !== key) return
      // Normales recalculadas del winding (la reconstrucción trae winding inconsistente);
      // con DoubleSide la cara visible se ilumina bien y el hueso nunca se ve translúcido.
      geo.deleteAttribute('normal'); geo.computeVertexNormals()
      // Si el PLY trae RGBA, quedarnos sólo con RGB (una alfa<1 translucía el hueso).
      const colAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined
      if (colAttr && colAttr.itemSize === 4) {
        const n = colAttr.count, rgb = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) { rgb[i * 3] = colAttr.getX(i); rgb[i * 3 + 1] = colAttr.getY(i); rgb[i * 3 + 2] = colAttr.getZ(i) }
        geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
      }
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
      disposeMarkers()
      // HUESO MACIZO MATE y OPACO. vertexColors:true + color blanco → el color por vértice
      // ES el albedo (lo escribe applyMode por modo); las luces lo sombrean encima (volumen).
      const mat = new THREE.MeshStandardMaterial({
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
      })
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh)
      geo.computeBoundingSphere(); const s = geo.boundingSphere
      boneRadius = (s && s.radius) || 50
      boneCenter = s ? s.center.clone() : new THREE.Vector3()
      if (s) mesh.position.set(-s.center.x, -s.center.y, -s.center.z)   // recentrar al origen
      boneCenter = new THREE.Vector3(0, 0, 0)
      mesh.updateMatrixWorld(true)
      precompute(geo)
      if (!markerGroup) { markerGroup = new THREE.Group(); scene.add(markerGroup) }
      markerGroup.position.set(0, 0, 0)
      frameObject()
      applyMode()
      loading.value = false
    } catch (e) { console.error('[BoneViewer3D] build', e); loading.value = false; failed.value = true }
  }, undefined, (e) => { console.error('[BoneViewer3D] PLY load error', e); loading.value = false; failed.value = true })
}

onMounted(() => {
  if (noMesh.value) { loading.value = false; return }   // sin malla → estado honesto, no init WebGL inútil
  let tries = 0
  const start = () => {
    if (!host.value) {
      if (tries++ < 30) { requestAnimationFrame(start); return }
      console.error('[BoneViewer3D] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    try { init(); if (props.meshKey) load(props.meshKey) }
    catch (e) { console.error('[BoneViewer3D] init', e); failed.value = true; loading.value = false }
  }
  start()
})
/* cambia el hueso → recarga la malla */
watch(() => props.meshKey, (k) => {
  if (!k || !renderer) return
  try { load(k) } catch (e) { console.error('[BoneViewer3D] load', e); failed.value = true; loading.value = false }
})
/* cambia el MODO → sólo se reescribe el color por vértice (sin recargar la malla) */
watch(mode, () => {
  if (mesh && !loading.value && !failed.value) applyMode()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect()
  disposeMarkers()
  if (mesh) { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
  pmrem?.dispose()
  renderer?.dispose()
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
      <div class="relative w-full select-none" style="aspect-ratio:5/4;background:#0d1117;border-radius:0.5rem;overflow:hidden">
        <div ref="host" class="absolute inset-0 cursor-grab active:cursor-grabbing" :style="failed ? 'opacity:0;pointer-events:none' : ''" />

        <!-- botón de reencuadre ⟲ -->
        <button
          v-if="!failed"
          type="button"
          class="bv-reframe"
          :aria-label="L('Reencuadrar la vista', 'Reset the view')"
          :title="L('Reencuadrar', 'Reset view')"
          @click="reframe"
        >⟲</button>

        <!-- cargando -->
        <div v-if="loading && !failed" class="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <span class="bv-spin" />
          <span class="text-[11px]" style="color:#aeb6c2">{{ L('reconstruyendo 3D…', 'building 3D…') }}</span>
        </div>

        <!-- fallback digno sin-WebGL: fotogramas del MISMO CT (vertebra/ para área y calor, morfo/ realzado para morfología) -->
        <div v-if="failed" class="absolute inset-0">
          <BoneFrameViewer :mesh-key="meshKey" :kind="fallbackKind" :enhance="fallbackKind === 'morfo'" />
          <div
            class="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] text-center"
            style="color:#cdd5e0;background:linear-gradient(to top,rgba(8,11,16,0.88),rgba(8,11,16,0));pointer-events:none"
          >
            {{ L('Vista estática · este navegador no permite 3D interactivo', 'Static view · this browser does not support interactive 3D') }}
          </div>
        </div>
      </div>

      <!-- leyenda / caption HONESTO según el modo (voz neutral; informa, no concluye) -->
      <p class="bv-cap">
        <template v-if="mode === 'area'">
          {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span :style="{ color: C_REC }">●</span> {{ L('receptor · Galio', 'receptor · gallium') }} ·
          <span :style="{ color: C_FDG }">●</span> {{ L('azúcar · FDG', 'sugar · FDG') }}
          <span style="color:#7c8694"> · {{ L('Área de captación real (PET) sobre el hueso — aproximada por la resolución del PET (~4–5 mm) y el co-registro; muestra la zona, no el borde exacto.', 'Real PET uptake area on the bone — approximated by the PET resolution (~4–5 mm) and the co-registration; it shows the zone, not the exact edge.') }}</span>
        </template>

        <template v-else-if="mode === 'heat'">
          {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#1f6ed6">●</span> {{ L('frío', 'cool') }} →
          <span style="color:#0db9c8">●</span> <span style="color:#e8e030">●</span>
          <span style="color:#f58a1a">●</span> <span style="color:#de1c1c">●</span> {{ L('caliente', 'hot') }} ·
          <span style="color:#cdd5e0">○ {{ L('punto más caliente (SUVmáx)', 'hottest point (SUVmax)') }}</span>
          <span style="color:#7c8694"> · {{ L('intensidad de captación (orientativa).', 'uptake intensity (indicative).') }}</span>
        </template>

        <template v-else>
          {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#9c794a">●</span> {{ L('tostado · hueso normal', 'tan · normal bone') }} →
          <span style="color:#2c5cb2">●</span> {{ L('azul oscuro · blástico (denso)', 'dark blue · blastic (dense)') }}
          <span style="color:#7c8694"> · {{ L('realce de densidad del CT — blástico (denso) resaltado; orientativo, no es una medida (HU).', 'CT density enhancement — blastic (dense) highlighted; indicative, not a measurement (HU).') }}</span>
        </template>
      </p>
    </template>
  </div>
</template>

<style scoped>
.bv-spin {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(174, 182, 194, 0.25);
  border-top-color: #c061d6;
  animation: bv-rot 0.8s linear infinite;
}
@keyframes bv-rot { to { transform: rotate(360deg); } }
.bv-reframe {
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
.bv-reframe:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.bv-reframe:focus-visible { outline: 2px solid #c061d6; outline-offset: 2px; }
.bv-cap {
  font-size: 10px;
  text-align: center;
  margin-top: 6px;
  font-family: ui-monospace, monospace;
  line-height: 1.4;
  color: #aeb6c2;
}
</style>
