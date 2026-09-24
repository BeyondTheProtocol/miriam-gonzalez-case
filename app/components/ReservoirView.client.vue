<script setup lang="ts">
/**
 * ReservoirView — el catéter del reservorio venoso en 3D, girable, en tres fechas separadas
 * por meses. La historia no es gravedad: es «medir para descartar». El port dejó de dar
 * retorno; en vez de asumir que el catéter se había movido, su trayecto se reconstruyó sobre
 * el TC de cada fecha y la punta sale en el mismo sitio las tres veces.
 *
 * Mallas: public/reservorio/ (tools/visor3d.py `web-reservorio`: sin DICOM, sin cabeceras, sin
 * marca ni modelo del dispositivo, sin hospital). El trayecto sale partido en dos piezas:
 *   - medido: los DOS puntos leídos directamente en el TC (portal y punta), con un tramo corto
 *     de ancla — trazo CONTINUO.
 *   - interpolado: el tramo intermedio, reconstruido por coste de brillo entre esos dos puntos
 *     (no medido punto a punto) — trazo DISCONTINUO DE VERDAD: son huecos reales en la malla
 *     (arco geodésico sobre la propia superficie), no un efecto de línea.
 * Hueso y tráquea van de contexto anatómico, en gris apagado, sin protagonismo.
 *
 * Interacción: arrastrar o rueda para girar/acercar (OrbitControls), Y flechas de teclado
 * rotan de verdad la cámara (azimut/polar a mano: OrbitControls no orbita con las flechas de
 * fábrica, solo desplaza). Sin autorrotación: no hay movimiento que prefers-reduced-motion
 * tenga que frenar.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ base: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

interface Fecha { mallas: Record<string, string>; longitud_mm: number }
interface Escena { fechas: Record<string, Fecha>; error_medida_mm: number; error_diferencia_mm: number }

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const escena = ref<Escena | null>(null)
const fechas = computed(() => (escena.value ? Object.keys(escena.value.fechas).sort() : []))
const fechaActual = ref('')

// RAS (mm) → ejes de three, igual que LiverView/BreastView.
const RAS_A_THREE = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1)

let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let scene: THREE.Scene
let pmrem: THREE.PMREMGenerator | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let raf = 0
let enVista = true
let radio = 60
let grupo = new THREE.Group()

const MAT = {
  // medido e interpolado: la MISMA familia de color (coral, acción/énfasis del sitio) — lo que
  // los distingue es la FORMA del trazo (continuo/discontinuo), no el tono.
  medido: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  interpolado: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  portal: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
  hueso: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa4b2, roughness: 0.9, transparent: true, opacity: 0.28, depthWrite: false }),
  traquea: () => new THREE.MeshPhysicalMaterial({ color: 0x9aa4b2, roughness: 0.9, transparent: true, opacity: 0.22, depthWrite: false }),
}

async function geo(url: string) {
  const g = await new PLYLoader().loadAsync(url)
  g.applyMatrix4(RAS_A_THREE); g.computeVertexNormals(); g.computeBoundingSphere(); return g
}

function limpiaGrupo() {
  while (grupo.children.length) {
    const o = grupo.children[0]
    const m = o as THREE.Mesh
    if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose() }
    grupo.remove(o)
  }
}

async function cargaFecha(fecha: string) {
  if (!escena.value) return
  limpiaGrupo()
  const mallas = escena.value.fechas[fecha].mallas
  let radioNuevo = radio
  await Promise.all(Object.entries(mallas).map(async ([nombre, fichero]) => {
    const g = await geo(props.base + fecha + '/' + fichero)
    const mat = MAT[nombre as keyof typeof MAT]?.() ?? MAT.medido()
    const mesh = new THREE.Mesh(g, mat)
    mesh.renderOrder = nombre === 'hueso' || nombre === 'traquea' ? 1 : 2
    grupo.add(mesh)
    if (nombre === 'medido' && g.boundingSphere) radioNuevo = Math.max(radioNuevo, g.boundingSphere.radius * 3)
  }))
  radio = radioNuevo
  controls.minDistance = radio * 0.6; controls.maxDistance = radio * 10
  fechaActual.value = fecha
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
  const d = (radio * 1.1) / Math.sin(fov) / ajuste
  const incl = THREE.MathUtils.degToRad(12)
  camera.position.set(0, Math.sin(incl) * d, Math.cos(incl) * d)
  controls.target.set(0, 0, 0); controls.update()
}

// Rotación de teclado DE VERDAD: OrbitControls solo trae PAN de fábrica en las flechas.
// Gira la cámara alrededor del objetivo a mano (coordenadas esféricas) y respeta los mismos
// límites de polar que el arrastre.
const PASO_AZIMUT = 0.12
const PASO_POLAR = 0.08
function gira(deltaAzimut: number, deltaPolar: number) {
  const offset = camera.position.clone().sub(controls.target)
  const esf = new THREE.Spherical().setFromVector3(offset)
  esf.theta += deltaAzimut
  esf.phi = THREE.MathUtils.clamp(esf.phi + deltaPolar, controls.minPolarAngle + 0.05, controls.maxPolarAngle - 0.05)
  offset.setFromSpherical(esf)
  camera.position.copy(controls.target).add(offset)
  camera.lookAt(controls.target)
  controls.update()
}
function onKeydown(e: KeyboardEvent) {
  const paso = { ArrowLeft: () => gira(-PASO_AZIMUT, 0), ArrowRight: () => gira(PASO_AZIMUT, 0),
                ArrowUp: () => gira(0, -PASO_POLAR), ArrowDown: () => gira(0, PASO_POLAR) }[e.key]
  if (!paso) return
  e.preventDefault(); paso()
}

async function init() {
  const el = host.value!
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1c1126)   // el mismo fondo que el hígado/hueso: sin brillo
  scene.add(grupo)
  camera = new THREE.PerspectiveCamera(30, 1, 1, 5000)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture
  scene.environmentIntensity = 0.9
  const luz = (c: number, i: number, x: number, y: number, z: number) => {
    const l = new THREE.DirectionalLight(c, i); l.position.set(x, y, z); camera.add(l)
  }
  luz(0xfff0dc, 1.6, 2.5, 3, 4); luz(0xb8c8ff, 0.5, -4, 0.5, 2)
  scene.add(camera)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.12
  controls.minPolarAngle = 0.15; controls.maxPolarAngle = Math.PI - 0.15

  escena.value = await (await fetch(props.base + 'escena.json')).json()
  const lista = Object.keys(escena.value!.fechas).sort()
  await cargaFecha(lista[lista.length - 1])   // la más reciente, por defecto

  resize(); reencuadra()
  ro = new ResizeObserver(() => resize()); ro.observe(el)
  io = new IntersectionObserver((e) => { enVista = e.some((x) => x.isIntersecting) }); io.observe(el)
  el.addEventListener('keydown', onKeydown)
  loading.value = false
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!enVista) return
    controls.update()
    renderer!.render(scene, camera)
  }
  tick()
}

onMounted(() => {
  let intentos = 0
  const arranca = () => {
    if (!host.value) {
      if (intentos++ < 30) { requestAnimationFrame(arranca); return }
      console.error('[ReservoirView] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    init().catch((e) => { console.error('[ReservoirView]', e); failed.value = true; loading.value = false })
  }
  arranca()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect()
  host.value?.removeEventListener('keydown', onKeydown)
  limpiaGrupo()
  controls?.dispose(); pmrem?.dispose(); renderer?.dispose()
})

function fechaLegible(f: string) {
  const [y, m] = f.split('-')
  const meses = L('ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec').split(',')
  return `${meses[Number(m) - 1]} ${y}`
}
</script>

<template>
  <div class="w-full">
    <div class="relative w-full rv-caja">
      <p v-if="failed" class="absolute inset-0 flex items-center justify-center text-center text-[13px] p-4" style="color:#d9dee6">
        {{ L('El visor 3D no ha podido cargar en este dispositivo. Los datos siguen debajo, en texto.', 'The 3D viewer could not load on this device. The figures are still below, in text.') }}
      </p>
      <div
        v-else
        ref="host"
        role="img"
        tabindex="0"
        :aria-label="L('Catéter del reservorio en 3D: trayecto continuo en los dos extremos leídos en el TC (el portal y la punta) y discontinuo en el tramo intermedio, reconstruido entre ambos. Hueso y tráquea, en gris, solo de contexto. Arrastra, usa la rueda o las flechas del teclado para girar.', 'Reservoir catheter in 3D: continuous path at the two ends read on the CT scan (the port and the tip) and discontinuous in the middle stretch, reconstructed between them. Bone and trachea, in grey, for context only. Drag, scroll, or use the arrow keys to rotate.')"
        class="absolute inset-0 cursor-grab active:cursor-grabbing rv-host"
      />
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-[12px]" style="color:#aeb6c2">
        {{ L('reconstruyendo 3D…', 'rebuilding 3D…') }}
      </div>
      <button
        v-if="!loading && !failed"
        type="button"
        class="rv-reencuadre"
        :aria-label="L('Reencuadrar la vista', 'Reset the view')"
        :title="L('Reencuadrar', 'Reset view')"
        @click="reencuadra"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
          <path d="M19 12a7 7 0 0 1-11.95 4.95M5 12a7 7 0 0 1 11.95-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M17 3.2V7.2H13M7 20.8V16.8H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
    <p v-if="!failed" class="text-[11px] text-tinta mt-1.5">
      {{ L('Arrastra o usa las flechas del teclado para girar · rueda para acercar', 'Drag or use the arrow keys to rotate · scroll to zoom') }}
    </p>

    <!-- selector de fecha: 3 TC separados por meses, la misma reconstrucción cada vez -->
    <div v-if="!loading && !failed && fechas.length > 1" class="mt-2.5 flex flex-wrap items-center gap-1" role="group" :aria-label="L('Elegir fecha del TC', 'Choose CT date')">
      <button v-for="f in fechas" :key="f"
        type="button"
        class="rv-fecha border transition-colors"
        :class="fechaActual === f
          ? 'bg-berenjena/10 border-berenjena/40 text-berenjena font-semibold'
          : 'bg-transparent border-berenjena/20 text-tinta hover:border-berenjena/40'"
        :aria-pressed="fechaActual === f" @click="cargaFecha(f)">{{ fechaLegible(f) }}</button>
    </div>

    <!-- leyenda: DOS píldoras, forma + color, reusando .badge-genomic -->
    <div v-if="!loading && !failed" class="mt-2.5 flex flex-wrap items-center gap-2">
      <span class="badge-genomic" style="color:#ff6b47;background:rgba(255,107,71,0.14)">● {{ L('medido', 'measured') }}</span>
      <span class="badge-genomic" style="color:#ff6b47;background:rgba(255,107,71,0.14)">╌ {{ L('interpolado', 'interpolated') }}</span>
    </div>
    <p v-if="!loading && !failed" class="mt-2 text-[11px] text-tinta leading-snug">
      {{ L('Medido: los dos puntos leídos directamente en el corte del TC — el portal y la punta. Interpolado: la ruta más probable entre ambos sobre el propio TC, no una medida punto a punto; por eso se dibuja discontinua. Hueso y tráquea, en gris, son solo referencia anatómica.', 'Measured: the two points read directly on the CT slice — the port and the tip. Interpolated: the most likely route between them on the CT itself, not a point-by-point measurement; that is why it is drawn discontinuous. Bone and trachea, in grey, are anatomical reference only.') }}
    </p>
    <p v-if="!loading && !failed && escena" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L(`Longitud del catéter, portal→punta: ${escena.fechas[fechaActual]?.longitud_mm} mm (± ${escena.error_medida_mm} mm; ± ${escena.error_diferencia_mm} mm en la diferencia entre fechas).`,
           `Catheter length, port→tip: ${escena.fechas[fechaActual]?.longitud_mm} mm (± ${escena.error_medida_mm} mm; ± ${escena.error_diferencia_mm} mm on the difference between dates).`) }}
    </p>
  </div>
</template>

<style scoped>
.rv-caja { aspect-ratio: 1 / 1; background: #1c1126; border-radius: 0.75rem; overflow: hidden; }
.rv-host:focus-visible { outline: 2px solid #1c969e; outline-offset: -2px; }
.rv-fecha, .rv-reencuadre { }
.rv-fecha {
  font-size: 11px; line-height: 1; padding: 7px 11px; min-height: 32px; border-radius: 999px;
}
@media (pointer: coarse) { .rv-fecha { min-height: 44px; padding: 0 14px; } }
.rv-reencuadre {
  position: absolute; bottom: 10px; right: 10px; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 10px;
  color: #d9dee6; background: rgba(20, 24, 32, 0.78); border: 1px solid rgba(174, 182, 194, 0.3);
}
.rv-reencuadre:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.rv-reencuadre:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }
</style>
