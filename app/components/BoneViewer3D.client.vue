<script setup lang="ts">
/**
 * Visor 3D real (WebGL) del hueso reconstruido del CT — UN SOLO visor, UNA geometría,
 * UN PLY por hueso. Tres MODOS de lectura que se intercambian SIN recargar la malla:
 * sólo se reescribe el ATRIBUTO DE COLOR POR VÉRTICE (rápido). Rotación libre 360° con
 * arrastre, rueda para acercar. Malla PLY en /public/metastasis/mesh.
 *
 * EL DATO (mallas re-generadas): cada vértice trae, además del RGB, TRES canales float
 * REALES y SEPARADOS, leídos con PLYLoader.setCustomPropertyNameMapping → quedan en
 * geometry.attributes.density / .fdg / .ga (Float32, itemSize 1):
 *   · density_hu  → densidad del CT en HU (~0–1000; cortical/blástico alto).
 *   · suv_fdg     → SUV de FDG real, co-registrado (0–~7; pico por foco).
 *   · suv_ga      → SUV de Galio (receptor) — PROXY transferido de la malla previa
 *                   (0–~13), por ahora APROXIMADO hasta tener su volumen propio.
 * El color de cada modo se calcula DESDE estos canales reales (no del RGB horneado). Como
 * FDG y Galio son canales distintos, los trazadores ya se separan limpio: donde domina el
 * receptor se ve violeta y donde domina el azúcar, naranja. El RGB empaquetado
 * (R=HU/1500, G=FDG/15, B=GA/15) queda sólo como FALLBACK si algún día faltan los canales.
 *
 * MODOS:
 *  1) «Área» (por defecto) — la HUELLA REAL de captación (tipo MTV). Un vértice está dentro
 *     de la lesión si suv_fdg ≥ ~2.5 o suv_ga ≥ ~2.5 (umbral SUV CRUDO de cada canal, borde
 *     difuso por smoothstep en [0.7·THR, THR]) → REGIÓN contigua en el color del trazador
 *     DOMINANTE. La dominancia es ESCALA-JUSTA: como el canal Ga es un proxy con rango mayor
 *     (~0–13) que el FDG real (~0–8), se NORMALIZA cada canal por su referencia antes de
 *     comparar (gaN = suv_ga/13 vs fdgN = suv_fdg/8); gaN > fdgN → violeta receptor, si no
 *     naranja FDG, y donde ambos normalizados son altos y parecidos se mezclan (mixta). El
 *     resto del hueso en marfil mate. La lesión ES el área: NO hay diana-punto flotante.
 *  2) «Mapa de calor» — intensidad continua: t = clamp(max(suv_fdg, suv_ga)/8, 0, 1) →
 *     rampa térmica perceptual (azul→cian→amarillo→naranja→rojo). Referencia ABSOLUTA
 *     (comparable entre huesos). Marca discreta del vértice más caliente (SUVmáx).
 *  3) «Morfología» — densidad REAL del CT (HU). t = clamp((density_hu−150)/(850−150), 0, 1)
 *     con gamma ~1.3 → rampa SIN BLANCO ARRIBA: trabecular/normal (t bajo) = tostado/marfil
 *     neutro; denso/blástico (t alto) = AZUL OSCURO SATURADO. El sombreado de las luces
 *     (Lambert/PBR mate) da el volumen encima. Es FORMA, no biología, no trazador.
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

/* ---- canales REALES por vértice (Float32, itemSize 1) leídos del PLY ---- */
let vDensity: Float32Array | null = null   // density_hu · densidad del CT (HU)
let vFdg: Float32Array | null = null       // suv_fdg · SUV de FDG real (azúcar)
let vGa: Float32Array | null = null        // suv_ga · SUV de Galio (receptor) · PROXY aprox.
let outColors: Float32Array | null = null  // buffer de salida reutilizado (count*3, LINEAL)
let hotIndex = -1                           // vértice del punto más caliente (máx SUV)
let hotSuv = 0                              // SUV del punto más caliente

/* umbrales / rangos del color-math (SUV absolutos y banda de HU del CT) */
const THR_SUV = 2.5             // «Área»: pertenencia a la lesión, SUV absoluto (FDG o Ga)
const HEAT_MAX = 8              // «Calor»: SUV que satura la rampa (rojo) — referencia absoluta
const HU_LO = 150, HU_HI = 850 // «Morfología»: trabecular/normal → blástico denso
/* «Área» · dominancia de trazador ESCALA-JUSTA: el canal Ga es un PROXY con rango mayor
   (~0–13) que el FDG real (~0–8); comparar SUV crudos (g>f) sesga la dominancia hacia
   violeta. Antes de comparar, cada canal se normaliza por su MÁXIMO observado (su referencia)
   → fdgN = suv_fdg/FDG_REF, gaN = suv_ga/GA_REF. La PERTENENCIA al área sigue sobre el SUV
   crudo (un vértice capta de verdad si supera THR en cualquier trazador); sólo el COLOR usa
   los normalizados. Donde ambos normalizados son altos y parecidos → captación MIXTA. */
const FDG_REF = 8               // máx observado del canal FDG real → normaliza para comparar
const GA_REF = 13               // máx observado del canal Ga (proxy, rango mayor) → normaliza
const MIX_BAND = 0.15           // |gaN−fdgN| ≤ banda → mezcla violeta+naranja (captación mixta)

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

/* ---------- precálculo por vértice desde los canales REALES (density/fdg/ga) ----------
   Los tres canales llegan como atributos Float32 itemSize 1 (PLYLoader custom mapping).
   FALLBACK si faltan: se desempaquetan del RGB horneado (R=HU/1500, G=FDG/15, B=GA/15). */
function precompute(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const dAttr = geo.getAttribute('density') as THREE.BufferAttribute | undefined
  const fAttr = geo.getAttribute('fdg') as THREE.BufferAttribute | undefined
  const gAttr = geo.getAttribute('ga') as THREE.BufferAttribute | undefined
  const hasReal = !!(dAttr && fAttr && gAttr)
  const col = geo.getAttribute('color') as THREE.BufferAttribute | undefined
  vDensity = new Float32Array(n); vFdg = new Float32Array(n); vGa = new Float32Array(n)
  outColors = new Float32Array(n * 3)
  hotIndex = -1; hotSuv = 0
  for (let i = 0; i < n; i++) {
    let d: number, f: number, g: number
    if (hasReal) {
      d = dAttr!.getX(i); f = fAttr!.getX(i); g = gAttr!.getX(i)
    } else {
      // fallback: desempaquetar del RGB horneado (sRGB→lineal ya aplicado por el loader,
      // pero la magnitud relativa se conserva lo suficiente para no quedar a oscuras)
      d = (col ? col.getX(i) : 0.5) * 1500
      f = (col ? col.getY(i) : 0) * 15
      g = (col ? col.getZ(i) : 0) * 15
    }
    vDensity[i] = d; vFdg[i] = f; vGa[i] = g
    const s = f > g ? f : g
    if (s > hotSuv) { hotSuv = s; hotIndex = i }
  }
}

/* ---------- pintar el atributo de color por vértice según el modo ---------- */
function applyMode() {
  if (!mesh || !vDensity || !vFdg || !vGa || !outColors) return
  const geo = mesh.geometry
  const n = vDensity.length
  const out = outColors
  const m = mode.value
  const fdgA = vFdg, gaA = vGa, denA = vDensity

  if (m === 'area') {
    // huella REAL de captación (tipo MTV): dentro de lesión si suv_fdg≥THR o suv_ga≥THR
    // (SUV CRUDO de cada canal — la pertenencia no se normaliza). Borde difuso con smoothstep
    // en [0.7·THR, THR]. El COLOR (qué trazador domina) es ESCALA-JUSTA: se normaliza cada
    // canal por su referencia (fdgN=f/FDG_REF, gaN=g/GA_REF) y se compara gaN vs fdgN, así el
    // proxy Ga (rango mayor) no sesga hacia violeta. En la banda |gaN−fdgN|≤MIX_BAND ambos
    // normalizados son parecidos → mezcla violeta+naranja (captación mixta), sin forzar uno.
    const thr = THR_SUV
    const e0 = 0.7 * thr
    const fInv = 1 / FDG_REF, gInv = 1 / GA_REF
    for (let i = 0; i < n; i++) {
      const f = fdgA[i], g = gaA[i]
      const a = Math.max(smoothstep(e0, thr, f), smoothstep(e0, thr, g)) // pertenencia 0..1 (SUV crudo)
      // dominancia normalizada: gaN≫fdgN → violeta (1); fdgN≫gaN → naranja (0); parecidos → mezcla (~0.5)
      const wRec = smoothstep(-MIX_BAND, MIX_BAND, g * gInv - f * fInv)
      const tr0 = FDG_LIN[0] + (REC_LIN[0] - FDG_LIN[0]) * wRec
      const tr1 = FDG_LIN[1] + (REC_LIN[1] - FDG_LIN[1]) * wRec
      const tr2 = FDG_LIN[2] + (REC_LIN[2] - FDG_LIN[2]) * wRec
      const k = i * 3
      out[k] = IVORY_LIN[0] + (tr0 - IVORY_LIN[0]) * a
      out[k + 1] = IVORY_LIN[1] + (tr1 - IVORY_LIN[1]) * a
      out[k + 2] = IVORY_LIN[2] + (tr2 - IVORY_LIN[2]) * a
    }
  } else if (m === 'heat') {
    // intensidad continua: t = clamp(max(suv_fdg, suv_ga)/8, 0, 1) → rampa térmica.
    // Referencia ABSOLUTA (8 SUV satura el rojo) → comparable entre huesos.
    const inv = 1 / HEAT_MAX
    for (let i = 0; i < n; i++) {
      const s = fdgA[i] > gaA[i] ? fdgA[i] : gaA[i]
      let t = s * inv; t = t < 0 ? 0 : t > 1 ? 1 : t
      const c = heatRamp(t)
      const k = i * 3; out[k] = c[0]; out[k + 1] = c[1]; out[k + 2] = c[2]
    }
  } else {
    // morfología: densidad REAL del CT (HU). t = clamp((HU−150)/(850−150), 0, 1)^1.3 →
    // rampa SIN BLANCO arriba: trabecular/normal = tostado; blástico/denso = azul oscuro.
    const inv = 1 / (HU_HI - HU_LO)
    for (let i = 0; i < n; i++) {
      let t = (denA[i] - HU_LO) * inv; t = t < 0 ? 0 : t > 1 ? 1 : t
      t = Math.pow(t, 1.3)   // gamma>1 reserva el azul oscuro a lo MÁS denso (blástico)
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
  // SOLO el modo calor lleva marca (el punto más caliente, SUVmáx). «Área» NO usa
  // diana-punto (el área ES la lesión); «Morfología» es forma. Sólo si hay captación real.
  if (mode.value !== 'heat' || hotIndex < 0 || hotSuv < THR_SUV) return
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
  const loader = new PLYLoader()
  // canales float REALES por vértice → geometry.attributes.density / .fdg / .ga (itemSize 1)
  loader.setCustomPropertyNameMapping({ density: ['density_hu'], fdg: ['suv_fdg'], ga: ['suv_ga'] })
  loader.load(`/metastasis/mesh/${key}.ply`, (geo) => {
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
          <span :style="{ color: C_REC }">●</span> {{ L('violeta · receptor (Galio)', 'violet · receptor (gallium)') }} ·
          <span :style="{ color: C_FDG }">●</span> {{ L('naranja · azúcar (FDG)', 'orange · sugar (FDG)') }}
          <span style="color:#7c8694"> · {{ L('Área de captación real (PET) sobre el hueso — SUV ≥ ~2.5; difusa por la resolución del PET (~4–5 mm). El Galio es un proxy aproximado por ahora.', 'Real PET uptake area on the bone — SUV ≥ ~2.5; diffuse due to PET resolution (~4–5 mm). Gallium is an approximate proxy for now.') }}</span>
        </template>

        <template v-else-if="mode === 'heat'">
          {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#1f6ed6">●</span> {{ L('frío', 'cool') }} →
          <span style="color:#0db9c8">●</span> <span style="color:#e8e030">●</span>
          <span style="color:#f58a1a">●</span> <span style="color:#de1c1c">●</span> {{ L('caliente', 'hot') }} ·
          <span style="color:#cdd5e0">○ {{ L('punto más caliente (SUVmáx)', 'hottest point (SUVmax)') }}</span>
          <span style="color:#7c8694"> · {{ L('Intensidad de captación (SUV real); rampa fría→caliente. El Galio es un proxy aproximado por ahora.', 'Uptake intensity (real SUV); cool→hot ramp. Gallium is an approximate proxy for now.') }}</span>
        </template>

        <template v-else>
          {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#9c794a">●</span> {{ L('tostado · hueso normal', 'tan · normal bone') }} →
          <span style="color:#2c5cb2">●</span> {{ L('azul oscuro · blástico (denso)', 'dark blue · blastic (dense)') }}
          <span style="color:#7c8694"> · {{ L('Densidad real del CT (HU): el hueso denso/blástico resalta en azul oscuro. Orientativo para la factibilidad de biopsia (el blástico denso rinde menos tejido).', 'Real CT density (HU): dense/blastic bone stands out in dark blue. Indicative of biopsy feasibility (dense blastic bone yields less tissue).') }}</span>
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
