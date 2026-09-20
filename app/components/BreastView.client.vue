<script setup lang="ts">
/**
 * BreastView — el tumor primario de mama en 3D, girable, dentro de su tejido fibroglandular.
 *
 * Por qué NO se dibuja la mama entera: la mama como ÓRGANO es el tejido fibroglandular, que es
 * lo que mira el radiólogo y lo que se cuantifica como densidad mamaria. La piel, la areola y
 * el pezón no están en el dato: se erosionan 4 mm ANTES de mallar (visor3d.py, con test que lo
 * comprueba), así que aquí no hay nada que ocultar con opacidad. Lo que se ve es un árbol
 * glandular, el mismo lenguaje visual que el hígado o el hueso.
 *
 * Copia la escena de LiverView: mismos materiales de lesión, mismas luces, mismo anillo con
 * rótulo, misma interacción (arrastrar = girar, rueda = acercar, botón de reencuadre, gira solo
 * hasta que se toca y nunca con prefers-reduced-motion). Si WebGL falla, queda la imagen fija.
 *
 * Diferencia de encuadre: un tumor de 15 mm es un punto al lado de un hígado, así que la cámara
 * arranca MIRANDO HACIA ÉL (azimut calculado desde el centro del tejido hacia la lesión), no en
 * una posición fija. Así se ve desde el primer fotograma, sin esperar a que gire.
 *
 * Mallas: public/lesiones/mama/ (visor3d.py web --organo mama: centradas, sin coordenadas del
 * escáner ni metadatos) + escena.json. La medida que se enseña es SIEMPRE la del informe.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ base: string; fallback: string; fallbackAlt: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

interface Lesion { malla: string; diametro_auto_mm: number | null; diana: string | null; mm_informe: number | null }
interface Escena { mallas: Record<string, string>; lesiones: Lesion[]; referencias?: Record<string, number[]> }

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const rotulos = ref<{ texto: string; x: number; y: number; r: number; tx: number; ty: number; visible: boolean }[]>([])
let pezon3: THREE.Vector3 | null = null
const autoMm = ref<number | null>(null)
const hayVasos = ref(false)

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
let haciaLesion: THREE.Vector3 | null = null
const dianas: { malla: THREE.Mesh; texto: string }[] = []

/* ── materiales ───────────────────────────────────────────────────────────────────── */
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
// Pergamino, nunca un tono piel: el translúcido tiene que leerse como tejido en una imagen
// médica, no como carne. Y más transparente que el hígado (0,10-0,92): aquí el tejido es
// contexto de densidad, la lesión es la protagonista y se mira a través de él casi siempre.
const tejidoMat = (lado: THREE.Side) => fresnel(new THREE.MeshPhysicalMaterial({
  color: 0xe8dcc8, roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.3,
  sheen: 0.25, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xfff6e4),
  transparent: true, depthWrite: false, side: lado }), 0.05, 0.38, 2.4)
// La ENVOLTURA de la mama: la superficie del pecho. Miriam, 20-sep: «a mí no me importa que se
// vea la mama». Así que se ve — es la pieza, y una pieza que no se distingue no informa de nada.
// Lo que se cuida no es taparla, es que se lea como una reconstrucción médica y no como una
// fotografía: mate, sin brillo especular de piel, y traslúcida para que el tumor de dentro no
// quede escondido detrás de ella.
const envolturaMat = (lado: THREE.Side) => fresnel(new THREE.MeshPhysicalMaterial({
  color: 0xdccfc0, roughness: 0.78, clearcoat: 0.1, clearcoatRoughness: 0.7,
  transparent: true, depthWrite: false, side: lado }), 0.11, 0.62, 2.0)
// Los vasos de la mama, en el mismo azul que los del hígado: una sola gramática de color en
// toda la página. Salen del mismo realce que el tumor y son justo lo que estorbaba al buscarlo
// (finos y brillantísimos); aquí dejan de ser ruido y pasan a ser anatomía.
const vasoMat = () => new THREE.MeshPhysicalMaterial({
  color: 0x2d63d6, roughness: 0.28, clearcoat: 0.9, clearcoatRoughness: 0.15 })
// El mismo dorado brillante de las lesiones del hígado: una sola gramática de color en la página.
const lesionMat = () => new THREE.MeshPhysicalMaterial({
  color: 0xf2b23c, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.1,
  emissive: 0x7a4a08, emissiveIntensity: 0.35 })

/* RAS (mm) → ejes de three, igual que en el hígado: x = izquierda del paciente a la derecha de
   la pantalla (vista anterior), y = arriba, z = hacia quien mira. */
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
  // Mirando hacia la lesión, no desde una posición fija: con 15 mm dentro de un bloque de
  // tejido, empezar por el lado contrario sería empezar sin nada que ver.
  // Vista LATERAL con algo de frente: mirando de cara, una mama es un óvalo y no se reconoce;
  // de perfil aparece la forma. Se mira desde el lado de la lesión (el signo lo da su propia
  // posición), así que además queda delante y no escondida detrás del tejido.
  const lat = Math.sign(haciaLesion?.x ?? -1) || -1
  const dir = new THREE.Vector3(lat * 0.74, 0.14, 0.66).normalize()
  camera.position.copy(dir.multiplyScalar(d))
  controls.target.set(0, 0, 0); controls.update()
}

const p3 = new THREE.Vector3()
function actualizaRotulos() {
  const { w, h } = tamano()
  rotulos.value = dianas.map((D) => {
    const bs = D.malla.geometry.boundingSphere!
    p3.copy(bs.center).project(camera)
    const x = (p3.x + 1) / 2 * w, y = (1 - p3.y) / 2 * h
    const dist = camera.position.distanceTo(bs.center)
    const r = Math.max(14, (bs.radius / (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * h / 2 * 1.25)
    const medio = (D.texto.length * 7.3 + 12) / 2 + 6
    const tx = Math.min(Math.max(x, medio), w - medio)
    const ty = Math.max(y - r - 6, 26)
    return { texto: D.texto, x, y, r, tx, ty, visible: p3.z < 1 }
  })
}

async function init() {
  const el = host.value!
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1c1126)   // el mismo fondo que el hígado y el hueso
  camera = new THREE.PerspectiveCamera(26, 1, 0.5, 5000)
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
  luz(0xfff0dc, 1.7, 2.5, 3, 4); luz(0xb8c8ff, 0.6, -4, 0.5, 2); luz(0xffd9f0, 2.2, -1, 2, -5)
  scene.add(camera)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
  controls.rotateSpeed = 0.9
  controls.autoRotate = !reduce; controls.autoRotateSpeed = 1.6
  controls.addEventListener('start', () => { controls.autoRotate = false })

  const esc: Escena = await (await fetch(props.base + 'escena.json')).json()
  const tareas: Promise<unknown>[] = []
  for (const les of esc.lesiones) {
    tareas.push(geo(props.base + les.malla).then((g) => {
      const m = malla(g, lesionMat(), 1)
      haciaLesion = g.boundingSphere!.center.clone()
      if (les.mm_informe) {
        dianas.push({ malla: m, texto: L('Informe', 'Report') + ' · ' + les.mm_informe + ' mm' })
      }
      if (les.diametro_auto_mm) autoMm.value = les.diametro_auto_mm
    }))
  }
  const rp = esc.referencias?.pezon
  if (rp && rp.length === 3) {
    pezon3 = new THREE.Vector3(rp[0]!, rp[1]!, rp[2]!).applyMatrix4(RAS_A_THREE)
  }
  hayVasos.value = !!esc.mallas.vasos
  if (esc.mallas.vasos) {
    tareas.push(geo(props.base + esc.mallas.vasos).then((g) => malla(g, vasoMat(), 2)))
  }
  const gt = await geo(props.base + esc.mallas.fgt!)
  const marcaPezon = () => {
    // La areola, marcada SOBRE la superficie: un aro fino pegado al contorno, orientado por la
    // normal de la mama en ese punto. Gira con la pieza, así que se lee como parte de la
    // anatomía y no como una chincheta encima de la pantalla. Es un marcador de atlas: dice
    // dónde está el pezón sin dibujar relieve ninguno.
    if (!pezon3) return
    const fuera = pezon3.clone().multiplyScalar(2)
    // Una CRUZ, no un círculo ni un aro: la lesión está a 22 mm y ya lleva su anillo, así que
    // cualquier cosa redonda aquí se confunde con ella (Miriam lo vio antes que yo). La cruz es
    // una marca distinta a simple vista, y va SOBRE la superficie, orientada por la normal de la
    // mama en ese punto, de modo que gira con la pieza en vez de flotar pegada a la pantalla.
    // El color NO es el blanco del anillo de la lesión, y eso importa: el comité lo giró en vivo
    // y con el tumor cerca del pezón (que es el caso) la cruz y el anillo acababan leyéndose
    // como una sola cosa, que es justo el problema que hizo descartar el círculo. Va en el
    // turquesa del sistema, que en esta página solo se usa para señalar, nunca para anatomía, y
    // con un reborde oscuro para que se despegue también del contorno claro de la mama.
    const grupo = new THREE.Group()
    const borde = new THREE.MeshBasicMaterial({ color: 0x1c1126, transparent: true,
      opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    const tinta = new THREE.MeshBasicMaterial({ color: 0x1c969e, transparent: true,
      opacity: 0.95, side: THREE.DoubleSide, depthWrite: false })
    for (const giro of [0, Math.PI / 2]) {
      const sombra = new THREE.Mesh(new THREE.PlaneGeometry(18.6, 3.2), borde)
      sombra.rotation.z = giro
      grupo.add(sombra)
      const barra = new THREE.Mesh(new THREE.PlaneGeometry(17, 1.6), tinta)
      barra.rotation.z = giro
      barra.position.z = 0.01
      grupo.add(barra)
    }
    grupo.position.copy(pezon3); grupo.lookAt(fuera); grupo.renderOrder = 7
    grupo.traverse((o) => { (o as THREE.Mesh).renderOrder = 7 })
    scene.add(grupo)
  }
  malla(gt, tejidoMat(THREE.BackSide), 3)   // caras de detrás primero…
  malla(gt, tejidoMat(THREE.FrontSide), 4)  // …y las de delante encima
  let ge: THREE.BufferGeometry | null = null
  if (esc.mallas.mama) {
    ge = await geo(props.base + esc.mallas.mama)
    malla(ge, envolturaMat(THREE.BackSide), 5)
    malla(ge, envolturaMat(THREE.FrontSide), 6)
  }
  marcaPezon()
  await Promise.all(tareas)
  // Se encuadra con la pieza MÁS GRANDE que haya: con envoltura se ve la mama entera y la
  // lesión situada dentro; sin ella, el árbol glandular llena el cuadro.
  radio = (ge ?? gt).boundingSphere!.radius
  controls.minDistance = radio * 1.2; controls.maxDistance = radio * 12

  resize(); reencuadra()
  ro = new ResizeObserver(() => { resize() }); ro.observe(el)
  io = new IntersectionObserver((e) => { enVista = e.some((x) => x.isIntersecting) }); io.observe(el)
  loading.value = false
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!enVista) return   // fuera de pantalla no se pinta (batería)
    controls.update(); renderer!.render(scene, camera); actualizaRotulos()
  }
  tick()
}

onMounted(() => {
  // Igual que LiverView: dentro de <ClientOnly> el contenedor puede no estar aún en el DOM.
  let intentos = 0
  const arranca = () => {
    if (!host.value) {
      if (intentos++ < 30) { requestAnimationFrame(arranca); return }
      console.error('[BreastView] host nunca disponible'); failed.value = true; loading.value = false; return
    }
    init().catch((e) => { console.error('[BreastView]', e); failed.value = true; loading.value = false })
  }
  arranca()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect()
  scene?.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose() }
  })
  controls?.dispose(); pmrem?.dispose(); renderer?.dispose()
})
</script>

<template>
  <div class="w-full">
    <div class="relative w-full bv-caja">
      <img v-if="failed" :src="fallback" :alt="fallbackAlt" width="1000" height="1000" class="absolute inset-0 w-full h-full object-cover">
      <div
        v-else
        ref="host"
        role="img"
        :aria-label="L('Reconstrucción en 3D de la mama derecha de Miriam, girable. Se ve el contorno de la mama en translúcido; dentro, el tejido fibroglandular como un árbol; y el tumor primario en dorado, rodeado por un anillo con la medida del informe, 15 milímetros, en el cuadrante superoexterno. Una cruz sobre la superficie marca dónde está el pezón. Arrástralo para girar; todas las cifras están escritas debajo.', 'Rotatable 3D reconstruction of Miriam’s right breast. You can see the outline of the breast in translucent form; inside it, the fibroglandular tissue like a tree; and the primary tumour in gold, ringed and labelled with the figure from the report, 15 millimetres, in the upper outer quadrant. A cross on the surface marks where the nipple is. Drag to rotate; all the figures are written below.')"
        class="absolute inset-0 cursor-grab active:cursor-grabbing"
      />
      <div v-if="!loading && !failed" class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <template v-for="(r, i) in rotulos" :key="i">
          <span v-if="r.visible" class="bv-anillo" :style="{ left: r.x + 'px', top: r.y + 'px', width: 2 * r.r + 'px', height: 2 * r.r + 'px' }" />
          <span v-if="r.visible" class="bv-rotulo" :style="{ left: r.tx + 'px', top: r.ty + 'px' }">{{ r.texto }}</span>
        </template>
      </div>
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-[12px]" style="color:#aeb6c2">
        {{ L('reconstruyendo 3D…', 'rebuilding 3D…') }}
      </div>
      <button
        v-if="!loading && !failed"
        type="button"
        class="bv-reencuadre"
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
      {{ L('Arrastra para girar · rueda para acercar', 'Drag to rotate · scroll to zoom') }}
    </p>
    <ul v-if="!loading && !failed" class="mt-2 space-y-1 text-[11px] text-tinta">
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena" style="background:#f2b23c" aria-hidden="true" />
        {{ L('Tumor primario, con anillo: la medida es la del radiólogo', 'Primary tumour, ringed: the measurement is the radiologist’s') }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#e8dcc8" aria-hidden="true" />
        {{ L('Tejido fibroglandular de la mama derecha (lo que en radiología se llama densidad mamaria)', 'Fibroglandular tissue of the right breast (what radiology calls breast density)') }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#d8cfc4;opacity:0.55" aria-hidden="true" />
        {{ L('Contorno de la mama, para situar el tumor dentro de ella', 'Outline of the breast, to place the tumour inside it') }}
      </li>
      <li v-if="hayVasos" class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#2d63d6" aria-hidden="true" />
        {{ L('Vasos de la mama, los que le llevan la sangre (y el contraste) al tumor', 'Vessels of the breast, the ones carrying blood (and contrast) to the tumour') }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[2px] shrink-0 text-[13px] leading-none text-center" style="color:#1c969e" aria-hidden="true">+</span>
        {{ L('La cruz marca el pezón, que es la referencia para orientarse en una mama; su relieve no está en el modelo', 'The cross marks the nipple, the reference point for orienting yourself on a breast; its relief is not in the model') }}
      </li>
    </ul>
    <p v-if="!loading && !failed" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L(
        `La forma sale de una segmentación automática (IA, 100 % local) de su resonancia de mama, sin validación radiológica${autoMm ? `: el contorno automático da ${autoMm} mm` : ''}. La cifra buena es la del informe. El contorno es la superficie real de su mama; del tejido de dentro se quitan los 4 mm más externos, y el pezón se suaviza.`,
        `The shape comes from an automatic segmentation (AI, 100% local) of her breast MRI, not validated by a radiologist${autoMm ? `: the automatic outline gives ${autoMm} mm` : ''}. The figure that counts is the one in the report. The outline is the real surface of her breast; the outermost 4 mm are removed from the tissue inside, and the nipple is smoothed out.`) }}
    </p>
  </div>
</template>

<style scoped>
.bv-caja { aspect-ratio: 1 / 1; background: #1c1126; border-radius: 0.75rem; overflow: hidden; }
.bv-anillo {
  position: absolute; transform: translate(-50%, -50%); border-radius: 9999px;
  border: 2px solid rgba(245, 239, 230, 0.92);
}
.bv-rotulo {
  position: absolute; transform: translate(-50%, -100%); white-space: nowrap;
  font: 600 12px/1.2 'JetBrains Mono', ui-monospace, monospace; color: #F5EFE6;
  background: rgba(28, 17, 38, 0.72); padding: 2px 6px; border-radius: 4px;
}
.bv-reencuadre {
  position: absolute; bottom: 10px; right: 10px; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 10px;
  color: #d9dee6; background: rgba(20, 24, 32, 0.78); border: 1px solid rgba(174, 182, 194, 0.3);
}
.bv-reencuadre:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.bv-reencuadre:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }
</style>
