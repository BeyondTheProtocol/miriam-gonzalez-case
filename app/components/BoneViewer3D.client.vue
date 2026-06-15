<script setup lang="ts">
/**
 * Visor 3D real (WebGL) del hueso reconstruido del CT, con color por vértice
 * unificado: morfología (densidad CT: blástico/marfil) + captación co-registrada
 * (púrpura = receptor/Galio, naranja = azúcar/FDG). Rotación libre 360° (todos los
 * ejes) con arrastre; rueda para acercar. Malla PLY en /public/metastasis/mesh.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ meshKey?: string }>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)
const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const imgFailed = ref(false)
/* Si WebGL/PLY falla (navegador sin 3D, o headless), caemos a un fotograma estático
   reconstruido del mismo CT — informativo y digno, no un cartel de error. */
const frameSrc = computed(() => (props.meshKey ? `/metastasis/vertebra/${props.meshKey}-06.jpg` : ''))
let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls
let pmrem: THREE.PMREMGenerator | null = null
let mesh: THREE.Mesh | null = null
let raf = 0, ro: ResizeObserver | null = null

function resize() {
  if (!host.value || !renderer) return
  const w = host.value.clientWidth, h = host.value.clientHeight || Math.round(w * 0.8)
  renderer.setSize(w, h)            // updateStyle=true: el canvas llena el contenedor (si no, se dibuja gigante y se ve solo una esquina)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}
function init() {
  const el = host.value!
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d1117)
  camera = new THREE.PerspectiveCamera(38, 1.25, 0.1, 8000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping       // filmic roll-off → bone no se "quema"
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
function load(key: string) {
  loading.value = true; failed.value = false
  new PLYLoader().load(`/metastasis/mesh/${key}.ply`, (geo) => {
    try {
      if (!geo.getAttribute('normal')) geo.computeVertexNormals()
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.0, envMapIntensity: 0.55 })
      mesh = new THREE.Mesh(geo, mat); scene.add(mesh)
      geo.computeBoundingSphere(); const s = geo.boundingSphere
      const r = (s && s.radius) || 50
      if (s) mesh.position.set(-s.center.x, -s.center.y, -s.center.z)
      camera.position.set(0, 0, r * 3.4); camera.near = r * 0.03; camera.far = r * 40; camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0); controls.minDistance = r * 1.4; controls.maxDistance = r * 8; controls.update()
      loading.value = false
    } catch (e) { console.error('[BoneViewer3D] build', e); loading.value = false; failed.value = true }
  }, undefined, (e) => { console.error('[BoneViewer3D] PLY load error', e); loading.value = false; failed.value = true })
}
onMounted(() => {
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
watch(() => props.meshKey, (k) => {
  if (!k || !renderer) return
  try { load(k) } catch (e) { console.error('[BoneViewer3D] load', e); failed.value = true; loading.value = false }
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect()
  if (mesh) { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
  pmrem?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div class="relative w-full select-none" style="aspect-ratio:5/4;background:#0d1117;border-radius:0.5rem;overflow:hidden">
    <div ref="host" class="absolute inset-0 cursor-grab active:cursor-grabbing" :style="failed ? 'opacity:0' : ''" />

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
        :alt="L('Reconstrucción del hueso a partir de tu TC', 'Bone reconstruction from your CT')"
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
        {{ L('Vista estática · tu navegador no permite 3D interactivo', 'Static view · your browser does not support interactive 3D') }}
      </div>
    </div>
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
</style>
