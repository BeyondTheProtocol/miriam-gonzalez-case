<script setup lang="ts">
/**
 * Visor 3D real (WebGL) del hueso reconstruido del CT, con color por vértice
 * unificado: morfología (densidad CT: blástico/marfil) + captación co-registrada
 * (violeta = receptor/Galio, naranja = azúcar/FDG). Rotación libre 360° (todos los
 * ejes) con arrastre; rueda para acercar. Malla PLY en /public/metastasis/mesh.
 *
 * Encuadre: el hueso ENTERO llena el marco (boundingSphere → distancia de cámara
 * con margen pequeño, sensible al aspecto). Hueso macizo y opaco; las aberturas
 * anatómicas (canal medular / foramen) se respetan, no se rellenan.
 *
 * Marcador de captación: sprite billboard SIEMPRE visible (depthTest:false,
 * renderOrder alto) anclado a la ZONA de captación del foco — el centroide de la
 * malla ponderado por el tinte del trazador co-registrado (violeta=receptor,
 * naranja=FDG). Tamaño ∝ SUVmáx. No finge precisión sub-milimétrica: es la zona,
 * y se rotula como aproximada.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{
  meshKey?: string
  dota?: number | null            // SUVmáx receptor (⁶⁸Ga-DOTATOC)
  fdg?: number | null             // SUVmáx azúcar (¹⁸F-FDG)
  pheno?: string
  focusId?: number
}>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)

/* colores de marcador (vivos para destacar sobre el hueso/fondo oscuro) */
const C_REC = '#c061d6'    // receptor · Galio (violeta)
const C_FDG = '#ff8a3a'    // azúcar · FDG (naranja)

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const imgFailed = ref(false)
/* foco sin malla PLY individual (p. ej. #17 costilla, #19): estado honesto */
const noMesh = computed(() => !props.meshKey)
/* Si WebGL/PLY falla (navegador sin 3D, o headless), caemos a un fotograma estático
   reconstruido del mismo CT — informativo y digno, no un cartel de error. */
const frameSrc = computed(() => (props.meshKey ? `/metastasis/vertebra/${props.meshKey}-06.jpg` : ''))

let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls
let pmrem: THREE.PMREMGenerator | null = null
let mesh: THREE.Mesh | null = null
let markerGroup: THREE.Group | null = null
let raf = 0, ro: ResizeObserver | null = null
let curKey = ''
/* geometría del hueso cargado (en coords. del modelo, antes de recentrar) */
let boneCenter = new THREE.Vector3()
let boneRadius = 50
let recPos = new THREE.Vector3()   // centroide de captación del receptor
let warmPos = new THREE.Vector3()  // centroide de captación del azúcar (FDG)

function resize() {
  if (!host.value || !renderer) return
  const w = host.value.clientWidth, h = host.value.clientHeight || Math.round(w * 0.8)
  renderer.setSize(w, h)            // updateStyle=true: el canvas llena el contenedor
  camera.aspect = w / h; camera.updateProjectionMatrix()
}

function init() {
  const el = host.value!
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1117)
  camera = new THREE.PerspectiveCamera(38, 1.25, 0.1, 8000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping       // filmic roll-off → el hueso no se "quema"
  renderer.toneMappingExposure = 1.05
  el.appendChild(renderer.domElement)
  // entorno suave (room) para reflejos sutiles → la superficie ósea gana volumen
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202028, 0.65))
  const key = new THREE.DirectionalLight(0xfff4ea, 1.45); key.position.set(-0.6, 0.9, 1.0); scene.add(key)
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.40); fill.position.set(0.7, -0.2, -0.7); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.55); rim.position.set(0.2, 0.4, -1.0); scene.add(rim) // contraluz para separar del fondo
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
  controls.rotateSpeed = 0.9; controls.minDistance = 1; controls.maxDistance = 100000
  resize()
  ro = new ResizeObserver(resize); ro.observe(el)
  const tick = () => { raf = requestAnimationFrame(tick); controls.update(); renderer.render(scene, camera) }
  tick()
}

/* encuadre: el boundingSphere ENTERO llena el marco con un margen pequeño, sea cual
   sea el aspecto (ajusta por el lado limitante para que NUNCA se recorte el hueso). */
function frameObject(fill = 0.9) {
  if (!mesh || !camera || !controls) return
  const r = boneRadius
  const vFov = (camera.fov * Math.PI) / 180
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect)
  const fitH = r / Math.sin(vFov / 2)
  const fitW = r / Math.sin(hFov / 2)
  const dist = Math.max(fitH, fitW) / fill         // fill<1 → 10% de aire alrededor del hueso entero
  const dir = new THREE.Vector3(0.32, 0.16, 1).normalize()   // vista 3/4 ligera
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

/* ---------- centroides de captación a partir del tinte por vértice ----------
   La captación PET viene co-registrada como tinte por vértice. No separa limpio,
   así que ponderamos: receptor = verde suprimido frente a rojo/azul (magenta);
   azúcar/FDG = azul suprimido frente a rojo (cálido). Acotamos el centroide a
   ≤0.55·radio del centro óseo para que el marcador no se vaya fuera del hueso. */
function uptakeCentroids(geo: THREE.BufferGeometry) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const col = geo.getAttribute('color') as THREE.BufferAttribute | undefined
  const center = boneCenter
  let rx = 0, ry = 0, rz = 0, rw = 0
  let wx = 0, wy = 0, wz = 0, ww = 0
  if (col) {
    for (let i = 0; i < pos.count; i++) {
      const r = col.getX(i), g = col.getY(i), b = col.getZ(i)   // 0..1
      const rl = Math.max(0, (r + b) / 2 - g)     // receptor-lean (magenta)
      const wl = Math.max(0, r - b)               // warm-lean (naranja/FDG)
      if (rl > 0) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); rx += x * rl; ry += y * rl; rz += z * rl; rw += rl }
      if (wl > 0) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); wx += x * wl; wy += y * wl; wz += z * wl; ww += wl }
    }
  }
  const clampTo = (p: THREE.Vector3) => {
    const d = p.clone().sub(center)
    const max = boneRadius * 0.55
    if (d.length() > max) { d.setLength(max); p.copy(center).add(d) }
    return p
  }
  recPos = rw > 1e-4 ? clampTo(new THREE.Vector3(rx / rw, ry / rw, rz / rw)) : center.clone()
  warmPos = ww > 1e-4 ? clampTo(new THREE.Vector3(wx / ww, wy / ww, wz / ww)) : center.clone()
}

/* ---------- sprites de marcador (canvas → textura) ---------- */
function discTexture(hex: string, hollow: boolean): THREE.CanvasTexture {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  const c = S / 2
  // halo suave
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, hex + 'cc'); g.addColorStop(0.45, hex + '66'); g.addColorStop(1, hex + '00')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill()
  if (hollow) {
    // anillo (para el segundo trazador → lectura bicolor cuando co-localizan)
    ctx.lineWidth = S * 0.12; ctx.strokeStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(c, c, c * 0.5, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = S * 0.085; ctx.strokeStyle = hex
    ctx.beginPath(); ctx.arc(c, c, c * 0.5, 0, Math.PI * 2); ctx.stroke()
  } else {
    // núcleo sólido con borde blanco
    ctx.beginPath(); ctx.arc(c, c, c * 0.34, 0, Math.PI * 2)
    ctx.fillStyle = hex; ctx.fill(); ctx.lineWidth = S * 0.05; ctx.strokeStyle = '#ffffff'; ctx.stroke()
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
function makeSprite(tex: THREE.CanvasTexture, worldSize: number, order: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
  const sp = new THREE.Sprite(mat); sp.scale.set(worldSize, worldSize, 1); sp.renderOrder = order
  return sp
}
function disposeMarkers() {
  if (!markerGroup) return
  markerGroup.children.forEach((o) => {
    const m = (o as THREE.Sprite).material as THREE.SpriteMaterial
    m.map?.dispose(); m.dispose()
  })
  markerGroup.clear()
}
/* tamaño del marcador ∝ SUVmáx (acotado), en unidades de mundo */
function markerSize(suv: number | null | undefined): number {
  const s = Math.min(Math.max(suv || 0, 0), 14) / 14
  return boneRadius * (0.30 + 0.42 * s)
}
function buildMarkers() {
  if (!mesh || !markerGroup) return
  disposeMarkers()
  markerGroup.position.set(0, 0, 0)   // recPos/warmPos ya están en coords. de escena (mesh recentrado)
  const hasRec = props.dota != null
  const hasFdg = props.fdg != null
  // receptor = disco sólido violeta · FDG = anillo naranja (bicolor al co-localizar)
  // receptor = disco sólido violeta · FDG = anillo naranja (bicolor al co-localizar).
  // Honestidad: marcan la ZONA de captación (aprox.); el caption lo deja explícito.
  if (hasRec) markerGroup.add(positioned(makeSprite(discTexture(C_REC, false), markerSize(props.dota), 20), recPos))
  if (hasFdg) markerGroup.add(positioned(makeSprite(discTexture(C_FDG, true), markerSize(props.fdg), 21), warmPos))
}
function positioned(sp: THREE.Sprite, p: THREE.Vector3): THREE.Sprite { sp.position.copy(p); return sp }

function load(key: string) {
  loading.value = true; failed.value = false; curKey = key
  new PLYLoader().load(`/metastasis/mesh/${key}.ply`, (geo) => {
    try {
      if (curKey !== key) return                  // llegó tarde: hay una carga más reciente
      if (!geo.getAttribute('normal')) geo.computeVertexNormals()
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
      disposeMarkers()
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.0, envMapIntensity: 0.55 })
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh)
      geo.computeBoundingSphere(); const s = geo.boundingSphere
      boneRadius = (s && s.radius) || 50
      boneCenter = s ? s.center.clone() : new THREE.Vector3()
      if (s) mesh.position.set(-s.center.x, -s.center.y, -s.center.z)   // recentrar al origen
      uptakeCentroids(geo)
      // recentrar los centroides al mismo origen que la malla
      recPos.add(mesh.position); warmPos.add(mesh.position)
      boneCenter = new THREE.Vector3(0, 0, 0)
      if (!markerGroup) { markerGroup = new THREE.Group(); scene.add(markerGroup) }
      markerGroup.position.set(0, 0, 0)
      frameObject()
      buildMarkers()
      loading.value = false
    } catch (e) { console.error('[BoneViewer3D] build', e); loading.value = false; failed.value = true }
  }, undefined, (e) => { console.error('[BoneViewer3D] PLY load error', e); loading.value = false; failed.value = true })
}

onMounted(() => {
  if (noMesh.value) { loading.value = false; return }   // sin malla → estado honesto, no init WebGL inútil
  let tries = 0
  const start = () => {
    if (!host.value) {                               // el ref del contenedor aún no está enganchado
      if (tries++ < 30) { requestAnimationFrame(start); return }
      console.error('[BoneViewer3D] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    try { init(); if (props.meshKey) load(props.meshKey) }
    catch (e) { console.error('[BoneViewer3D] init', e); failed.value = true; loading.value = false }
  }
  start()
})
/* cambia el foco: si cambia el hueso recargamos la malla; si es el mismo hueso
   (p. ej. #7→#8 en D11) sólo rehacemos los marcadores con los nuevos SUV. */
watch(() => props.meshKey, (k) => {
  if (!k || !renderer) return
  try { load(k) } catch (e) { console.error('[BoneViewer3D] load', e); failed.value = true; loading.value = false }
})
watch(() => [props.focusId, props.dota, props.fdg], () => {
  if (mesh && !loading.value && !failed.value) buildMarkers()
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
        <div ref="host" class="absolute inset-0 cursor-grab active:cursor-grabbing" :style="failed ? 'opacity:0' : ''" />

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

        <!-- fallback digno: fotograma estático del MISMO CT (si no hay WebGL/PLY) -->
        <div v-if="failed" class="absolute inset-0">
          <img
            v-if="frameSrc && !imgFailed"
            :src="frameSrc"
            :alt="L('Reconstrucción del hueso a partir del CT', 'Bone reconstruction from the CT')"
            class="absolute inset-0 w-full h-full"
            style="object-fit:contain;background:#0d1117"
            @error="imgFailed = true"
          >
          <div v-else class="absolute inset-0 flex items-center justify-center text-center text-[12px] px-4" style="color:#aeb6c2">
            {{ L('Vista 3D no disponible en este navegador.', '3D view not available in this browser.') }}
          </div>
          <div
            v-if="frameSrc && !imgFailed"
            class="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] text-center"
            style="color:#cdd5e0;background:linear-gradient(to top,rgba(8,11,16,0.88),rgba(8,11,16,0))"
          >
            {{ L('Vista estática · este navegador no permite 3D interactivo', 'Static view · this browser does not support interactive 3D') }}
          </div>
        </div>
      </div>

      <!-- leyenda / caption (voz neutral) -->
      <p class="bv-cap">
        {{ L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
        <span style="color:#dbe4f7">●</span> {{ L('blanco denso = blástico (hueso duro)', 'dense white = blastic (hard bone)') }} ·
        <span :style="{ color: C_REC }">●</span> {{ L('receptor · Galio', 'receptor · gallium') }} ·
        <span :style="{ color: C_FDG }">○</span> {{ L('azúcar · FDG', 'sugar · FDG') }}
        <span style="color:#7c8694"> · {{ L('co-registrados sobre el hueso; el marcador señala la zona de captación (aprox.)', 'co-registered on the bone; the marker shows the uptake zone (approx.)') }}</span>
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
