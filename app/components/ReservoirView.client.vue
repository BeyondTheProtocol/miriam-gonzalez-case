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
 *     de ancla — tubo LISO.
 *   - interpolado: el tramo intermedio, reconstruido por coste de brillo entre esos dos puntos
 *     (no medido punto a punto) — tubo A RAYAS: dos piezas alternas (interpolado /
 *     interpolado_b) que casan cara con cara. Hasta el 8-oct-2026 eran huecos reales en la malla
 *     y se veían como esquirlas sueltas; ahora el catéter es un tubo continuo y la diferencia la
 *     sigue diciendo la forma, no solo el color.
 * Capa opcional «dispositivo» (8-oct-2026, la pidió Miriam): un modelo de catálogo del port,
 * en lila (el coral queda para lo que sale de su TC), colocado sobre el portal medido. Es una ILUSTRACIÓN (dibujada a partir de fotos,
 * escala 1:1, sin ajustar a su TC), apagada al abrir, y es la única pieza de esta página que
 * nombra el dispositivo: su licencia (CC BY) obliga a citar la obra. No entra en el encuadre ni
 * en ninguna cifra.
 * Hueso y tráquea van de contexto anatómico, en gris apagado, sin protagonismo.
 *
 * Interacción: arrastrar gira, Ctrl/⌘ + rueda o pellizco acerca, clic derecho o dos dedos
 * desplaza (OrbitControls). Además, para quien no quiere pelearse con el ratón: botones + / −,
 * vistas rápidas (todo, reservorio, punta) que mueven el punto de giro al sitio que se mira, y
 * pantalla completa. Las flechas del teclado giran la cámara de verdad (OrbitControls solo
 * desplaza con ellas). Sin autorrotación: no hay movimiento que prefers-reduced-motion tenga
 * que frenar.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const props = defineProps<{ base: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

interface Fecha { mallas: Record<string, string>; longitud_mm: number; modelo?: string; modelo_ajuste_mm?: number }
interface Credito { obra: string; autor: string; fuente: string; licencia: string; licencia_url: string }
interface Escena { fechas: Record<string, Fecha>; error_medida_mm: number; error_diferencia_mm: number; modelo?: Credito }

const host = ref<HTMLDivElement | null>(null)
const caja = ref<HTMLDivElement | null>(null)
type Vista = 'todo' | 'reservorio' | 'punta'
const vista = ref<Vista>('todo')
const completa = ref(false)
const puedeCompleta = ref(false)
const loading = ref(true)
const failed = ref(false)
const escena = ref<Escena | null>(null)
const fechas = computed(() => (escena.value ? Object.keys(escena.value.fechas).sort() : []))
const fechaActual = ref('')
// capa ilustrativa del dispositivo: apagada al abrir, se carga solo si se pide
const verModelo = ref(false)
const hayModelo = computed(() => !!escena.value?.modelo && !!escena.value.fechas[fechaActual.value]?.modelo)
let mallaModelo: THREE.Mesh | null = null

// RAS (mm) → ejes de three, igual que LiverView/BreastView.
const RAS_A_THREE = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1)

let sueltaRueda: () => void = () => {}
let renderer: THREE.WebGLRenderer | null = null
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let scene: THREE.Scene
let pmrem: THREE.PMREMGenerator | null = null
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let sueltaCarga: () => void = () => {}
let raf = 0
let enVista = true
let radio = 60
let grupo = new THREE.Group()
// puntos de giro de las vistas rápidas, en ejes de three (se recalculan en cada fecha)
const centroPortal = new THREE.Vector3()
const centroPunta = new THREE.Vector3()
const RADIO_DETALLE = 26   // mm que caben alrededor del punto en las vistas «reservorio» y «punta»

/* Contexto en «rayos X» (render, 27-sep-26, el mismo recurso que la cápsula del hígado): el hueso
   y la tráquea eran un gris plano al 28 %, y las costillas se confundían entre sí. Con fresnel,
   lo que se ve de canto se enciende y lo que mira a cámara casi desaparece: se dibuja la silueta
   de cada costilla y el catéter, opaco y coral, queda claro delante. */
function rayosX(mat: THREE.Material, min: number, max: number, halo: number) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
      'float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2);\n'
      + 'outgoingLight += vec3(0.86, 0.90, 0.96) * pow(fr, 2.5) * ' + halo.toFixed(2) + ';\n'
      + 'diffuseColor.a = mix(' + min.toFixed(2) + ', ' + max.toFixed(2) + ', fr);\n#include <opaque_fragment>')
  }
  return mat
}
const MAT = {
  // medido e interpolado: la MISMA familia de color (coral, acción/énfasis del sitio) — lo que
  // los distingue es la FORMA: tubo liso frente a tubo a rayas (coral / coral muy claro).
  medido: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  interpolado: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.12 }),
  interpolado_b: () => new THREE.MeshPhysicalMaterial({ color: 0xffe3d9, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
  portal: () => new THREE.MeshPhysicalMaterial({ color: 0xff6b47, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
  hueso: () => rayosX(new THREE.MeshPhysicalMaterial({ color: 0x9aa4b2, roughness: 0.9, transparent: true, depthWrite: false }), 0.05, 0.55, 0.40),
  // ilustración: morado, nunca coral (coral = lo que sale de su TC). Morado porque el dispositivo
  // real lo es («unique purple coloring», resumen 510(k) K072549 de la FDA). Al 34 % en gris no se veía
  // (Miriam, 8-oct-26): ahora tiene cuerpo, y el fresnel le dibuja el borde; de frente deja ver
  // el portal medido que lleva dentro.
  modelo: () => rayosX(new THREE.MeshPhysicalMaterial({ color: 0xa883f5, roughness: 0.4, clearcoat: 0.5, transparent: true, depthWrite: false }), 0.5, 0.96, 0.3),
  traquea: () => rayosX(new THREE.MeshPhysicalMaterial({ color: 0x9aa4b2, roughness: 0.9, transparent: true, depthWrite: false }), 0.04, 0.42, 0.25),
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
  // radio de encuadre: SOLO del cateter (medido+interpolado+portal), no del hueso/traquea de
  // contexto — si se deja que el hueso decida el radio, la camara se aleja tanto que el
  // cateter (unos pocos mm de grosor) se ve como un punto perdido en medio del torax.
  const CATETER = new Set(['medido', 'interpolado', 'interpolado_b', 'portal'])
  const caja = new THREE.Box3()
  let posMedido: THREE.BufferAttribute | null = null
  await Promise.all(Object.entries(mallas).map(async ([nombre, fichero]) => {
    const g = await geo(props.base + fecha + '/' + fichero)
    const mat = MAT[nombre as keyof typeof MAT]?.() ?? MAT.medido()
    const mesh = new THREE.Mesh(g, mat)
    mesh.renderOrder = nombre === 'hueso' || nombre === 'traquea' ? 1 : 2
    grupo.add(mesh)
    const pos = g.attributes.position as THREE.BufferAttribute
    if (CATETER.has(nombre)) caja.union(new THREE.Box3().setFromBufferAttribute(pos))
    if (nombre === 'portal') new THREE.Box3().setFromBufferAttribute(pos).getCenter(centroPortal)
    if (nombre === 'medido') posMedido = pos
  }))
  // la punta: el vértice del tramo medido más alejado del portal (el otro extremo leído)
  centroPunta.copy(centroPortal)
  if (posMedido) {
    const p = posMedido as THREE.BufferAttribute
    const v = new THREE.Vector3()
    let lejos = -1
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      const d = v.distanceToSquared(centroPortal)
      if (d > lejos) { lejos = d; centroPunta.copy(v) }
    }
  }
  const esfera = new THREE.Sphere()
  caja.getBoundingSphere(esfera)
  radio = Math.max(15, esfera.radius * 1.6)
  controls.minDistance = 12; controls.maxDistance = radio * 25
  mallaModelo = null   // limpiaGrupo() ya lo ha soltado con el resto
  fechaActual.value = fecha
  if (verModelo.value) await ponModelo()
  // al cambiar de fecha se conserva lo que se estaba mirando: el punto de giro va al mismo sitio
  if (vista.value !== 'todo') controls.target.copy(vista.value === 'reservorio' ? centroPortal : centroPunta)
}

async function ponModelo() {
  const f = escena.value?.fechas[fechaActual.value]
  if (!f?.modelo || mallaModelo) return
  const fecha = fechaActual.value
  const g = await geo(props.base + fecha + '/' + f.modelo)
  if (fecha !== fechaActual.value || !verModelo.value) { g.dispose(); return }
  mallaModelo = new THREE.Mesh(g, MAT.modelo())
  mallaModelo.renderOrder = 3
  grupo.add(mallaModelo)
}
function quitaModelo() {
  if (!mallaModelo) return
  mallaModelo.geometry.dispose(); (mallaModelo.material as THREE.Material).dispose()
  grupo.remove(mallaModelo); mallaModelo = null
}
async function alternaModelo() {
  verModelo.value = !verModelo.value
  if (verModelo.value) await ponModelo().catch((e) => { console.error('[ReservoirView] modelo', e); verModelo.value = false })
  else quitaModelo()
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
function distanciaPara(r: number) {
  const fov = THREE.MathUtils.degToRad(camera.fov / 2)
  return (r * 1.1) / Math.sin(fov) / Math.min(1, camera.aspect)
}
function reencuadra() {
  const d = distanciaPara(radio)
  const incl = THREE.MathUtils.degToRad(12)
  camera.position.set(0, Math.sin(incl) * d, Math.cos(incl) * d)
  controls.target.set(0, 0, 0); controls.update()
  vista.value = 'todo'
}
// Vistas rápidas: mueven el PUNTO DE GIRO al sitio que se mira. Sin esto, al acercar se iba
// hacia el centro del catéter y el reservorio se salía por el borde del visor.
function enfoca(cual: Vista) {
  if (cual === 'todo') { reencuadra(); return }
  const centro = cual === 'reservorio' ? centroPortal : centroPunta
  const dir = camera.position.clone().sub(controls.target).normalize()
  controls.target.copy(centro)
  camera.position.copy(centro).add(dir.multiplyScalar(distanciaPara(RADIO_DETALLE)))
  controls.update()
  vista.value = cual
}
function acerca(factor: number) {
  const offset = camera.position.clone().sub(controls.target)
  const d = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
  camera.position.copy(controls.target).add(offset.setLength(d))
  controls.update()
}
function alternaCompleta() {
  const el = caja.value
  if (!el) return
  if (document.fullscreenElement) document.exitFullscreen()
  else el.requestFullscreen().catch(() => { /* el navegador lo ha negado: el visor sigue igual */ })
}
function alCambiarCompleta() { completa.value = document.fullscreenElement === caja.value }

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
  if (e.key === '+' || e.key === '=') { e.preventDefault(); acerca(0.8); return }
  if (e.key === '-') { e.preventDefault(); acerca(1.25); return }
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
  // la rueda sola hace scroll de la página; Ctrl/⌘ + rueda (o pellizco) acerca (ver useAlVer.ts)
  sueltaRueda = ruedaConModificador(renderer.domElement.parentElement!, () => L('Ctrl o ⌘ + rueda para acercar', 'Ctrl or ⌘ + scroll to zoom'))
  controls.enableDamping = true; controls.dampingFactor = 0.12
  controls.minPolarAngle = 0.15; controls.maxPolarAngle = Math.PI - 0.15

  escena.value = await (await fetch(props.base + 'escena.json')).json()
  const lista = Object.keys(escena.value!.fechas).sort()
  await cargaFecha(lista[lista.length - 1])   // la más reciente, por defecto

  resize(); reencuadra()
  ro = new ResizeObserver(() => resize()); ro.observe(el)
  io = new IntersectionObserver((e) => { enVista = e.some((x) => x.isIntersecting) }); io.observe(el)
  el.addEventListener('keydown', onKeydown)
  puedeCompleta.value = !!document.fullscreenEnabled && typeof el.requestFullscreen === 'function'
  document.addEventListener('fullscreenchange', alCambiarCompleta)
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
    // las mallas se piden al acercarse a la pantalla, no al montar (ver cargaCercana en useAlVer.ts)
    sueltaCarga = cargaCercana(host.value, () => {
      init().catch((e) => { console.error('[ReservoirView]', e); failed.value = true; loading.value = false })
    })
  }
  arranca()
})
onBeforeUnmount(() => {
  sueltaRueda()
  sueltaCarga(); cancelAnimationFrame(raf); ro?.disconnect(); io?.disconnect()
  host.value?.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', alCambiarCompleta)
  limpiaGrupo()
  controls?.dispose(); pmrem?.dispose(); renderer?.dispose()
})

// coma decimal en es, punto en en — el resto del texto de la página usa coma y el
// template literal de abajo sacaba el punto de JS por defecto (150.8 en vez de 150,8).
function mm(n: number | undefined) {
  if (n == null) return ''
  return lang.value === 'en' ? String(n) : String(n).replace('.', ',')
}
function fechaLegible(f: string) {
  const [y, m] = f.split('-')
  const meses = L('ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic', 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec').split(',')
  return `${meses[Number(m) - 1]} ${y}`
}
</script>

<template>
  <div class="w-full">
    <div ref="caja" class="relative w-full rv-caja">
      <p v-if="failed" class="absolute inset-0 flex items-center justify-center text-center text-[13px] p-4" style="color:#d9dee6">
        {{ L('El visor 3D no ha podido cargar en este dispositivo. Los datos siguen debajo, en texto.', 'The 3D viewer could not load on this device. The figures are still below, in text.') }}
      </p>
      <div
        v-else
        ref="host"
        role="img"
        tabindex="0"
        :aria-label="L('Catéter del reservorio en 3D: tubo liso en los dos extremos leídos en el TC (el portal y la punta) y a rayas en el tramo intermedio, interpolado entre ambos. Hueso y tráquea, en gris, solo de contexto. Arrastra o usa las flechas del teclado para girar, y los botones o las teclas + y − para acercar.', 'Reservoir catheter in 3D: a plain tube at the two ends read on the CT scan (the port and the tip) and a striped one in the middle stretch, interpolated between them. Bone and trachea, in grey, for context only. Drag or use the arrow keys to rotate, and the buttons or the + and − keys to zoom.')"
        class="absolute inset-0 cursor-grab active:cursor-grabbing rv-host"
      />
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center text-[12px]" style="color:#aeb6c2">
        {{ L('reconstruyendo 3D…', 'rebuilding 3D…') }}
      </div>
      <div v-if="!loading && !failed" class="rv-mandos" role="group" :aria-label="L('Mandos del visor', 'Viewer controls')">
        <button type="button" class="rv-mando" :aria-label="L('Acercar', 'Zoom in')" :title="L('Acercar', 'Zoom in')" @click="acerca(0.8)">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
        </button>
        <button type="button" class="rv-mando" :aria-label="L('Alejar', 'Zoom out')" :title="L('Alejar', 'Zoom out')" @click="acerca(1.25)">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
        </button>
        <button type="button" class="rv-mando" :aria-label="L('Reencuadrar la vista', 'Reset the view')" :title="L('Reencuadrar', 'Reset view')" @click="reencuadra">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
            <path d="M19 12a7 7 0 0 1-11.95 4.95M5 12a7 7 0 0 1 11.95-4.95" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M17 3.2V7.2H13M7 20.8V16.8H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button v-if="puedeCompleta" type="button" class="rv-mando" :aria-pressed="completa"
          :aria-label="completa ? L('Salir de pantalla completa', 'Exit full screen') : L('Pantalla completa', 'Full screen')"
          :title="completa ? L('Salir de pantalla completa', 'Exit full screen') : L('Pantalla completa', 'Full screen')" @click="alternaCompleta">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false" aria-hidden="true">
            <path v-if="!completa" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path v-else d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
    <p v-if="!failed" class="text-[11px] text-tinta mt-1.5">
      {{ L('Arrastra para girar · botones + y −, o Ctrl o ⌘ + rueda, para acercar · clic derecho o dos dedos para desplazar', 'Drag to rotate · + and − buttons, or Ctrl or ⌘ + scroll, to zoom · right-click or two fingers to pan') }}
    </p>

    <!-- vistas rápidas: llevan el punto de giro a lo que se quiere mirar -->
    <div v-if="!loading && !failed" class="mt-2.5 flex flex-wrap items-center gap-1" role="group" :aria-label="L('Qué mirar', 'What to look at')">
      <button v-for="v in ([['todo', L('Todo el trayecto', 'Whole path')], ['reservorio', L('El reservorio', 'The port')], ['punta', L('La punta', 'The tip')]] as [Vista, string][])" :key="v[0]"
        type="button"
        class="rv-fecha border transition-colors"
        :class="vista === v[0]
          ? 'bg-berenjena/10 border-berenjena/40 text-berenjena font-semibold'
          : 'bg-transparent border-berenjena/20 text-tinta hover:border-berenjena/40'"
        :aria-pressed="vista === v[0]" @click="enfoca(v[0])">{{ v[1] }}</button>
    </div>

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

    <!-- capa ilustrativa: un botón con estado, igual que los de fecha -->
    <div v-if="!loading && !failed && hayModelo" class="mt-2.5">
      <button
        type="button"
        class="rv-fecha border transition-colors"
        :class="verModelo
          ? 'bg-berenjena/10 border-berenjena/40 text-berenjena font-semibold'
          : 'bg-transparent border-berenjena/20 text-tinta hover:border-berenjena/40'"
        :aria-pressed="verModelo" @click="alternaModelo">{{ L('Ver el dispositivo (ilustración)', 'Show the device (illustration)') }}</button>
    </div>

    <!-- leyenda: píldoras, forma + color, reusando .badge-genomic -->
    <div v-if="!loading && !failed" class="mt-2.5 flex flex-wrap items-center gap-2">
      <span class="badge-genomic" style="color:#c2410c;background:rgba(255,107,71,0.14)"><span class="rv-muestra rv-muestra--lisa" aria-hidden="true" />{{ L('medido', 'measured') }}</span>
      <span class="badge-genomic" style="color:#c2410c;background:rgba(255,107,71,0.14)"><span class="rv-muestra rv-muestra--rayas" aria-hidden="true" />{{ L('interpolado', 'interpolated') }}</span>
      <span v-if="verModelo" class="badge-genomic" style="color:#5b3fa8;background:rgba(168,131,245,0.22)"><span class="rv-muestra rv-muestra--lila" aria-hidden="true" />{{ L('ilustración', 'illustration') }}</span>
    </div>
    <p v-if="!loading && !failed" class="mt-2 text-[11px] text-tinta leading-snug">
      {{ L('Medido: los dos puntos leídos directamente en el corte del TC: el portal y la punta. Interpolado: la ruta más probable entre ambos sobre el propio TC, no una medida punto a punto; por eso se dibuja a rayas. Hueso y tráquea, en gris, son solo referencia anatómica.', 'Measured: the two points read directly on the CT slice: the port and the tip. Interpolated: the most likely route between them on the CT itself, not a point-by-point measurement; that is why it is drawn striped. Bone and trachea, in grey, are anatomical reference only.') }}
    </p>
    <p v-if="!loading && !failed && verModelo && escena?.modelo" class="mt-2 text-[11px] text-tinta leading-snug">
      {{ L(`Ilustración, no medida: un modelo de catálogo del dispositivo, dibujado a partir de fotos y colocado a escala 1:1 sobre el portal medido. Coincide con él con un error medio de ${mm(escena.fechas[fechaActual]?.modelo_ajuste_mm)} mm.`,
           `Illustration, not a measurement: a catalogue model of the device, drawn from photos and placed at 1:1 scale over the measured port. It matches it with a mean error of ${escena.fechas[fechaActual]?.modelo_ajuste_mm} mm.`) }}
      {{ L('Modelo:', 'Model:') }}
      <a :href="escena.modelo.fuente" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">«{{ escena.modelo.obra }}»</a>,
      {{ escena.modelo.autor }},
      <a :href="escena.modelo.licencia_url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ escena.modelo.licencia }}</a>.
    </p>
    <p v-if="!loading && !failed && escena" class="mt-1.5 text-[11px] text-tinta leading-snug">
      {{ L(`Longitud del catéter, portal→punta: ${mm(escena.fechas[fechaActual]?.longitud_mm)} mm (± ${escena.error_medida_mm} mm; ± ${escena.error_diferencia_mm} mm en la diferencia entre fechas).`,
           `Catheter length, port→tip: ${escena.fechas[fechaActual]?.longitud_mm} mm (± ${escena.error_medida_mm} mm; ± ${escena.error_diferencia_mm} mm on the difference between dates).`) }}
    </p>
  </div>
</template>

<style scoped>
.rv-caja { aspect-ratio: 1 / 1; background: #1c1126; border-radius: 0.75rem; overflow: hidden; }
.rv-host:focus-visible { outline: 2px solid #1c969e; outline-offset: -2px; }
.rv-fecha {
  font-size: 11px; line-height: 1; padding: 7px 11px; min-height: 32px; border-radius: 999px;
}
@media (pointer: coarse) { .rv-fecha { min-height: 44px; padding: 0 14px; } }
.rv-caja:fullscreen { aspect-ratio: auto; width: 100vw; height: 100vh; border-radius: 0; }
.rv-mandos { position: absolute; bottom: 10px; right: 10px; display: flex; flex-direction: column; gap: 6px; }
.rv-mando {
  width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center; border-radius: 10px;
  color: #d9dee6; background: rgba(20, 24, 32, 0.78); border: 1px solid rgba(174, 182, 194, 0.3);
}
.rv-mando:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(174, 182, 194, 0.5); }
.rv-mando:focus-visible { outline: 2px solid #1c969e; outline-offset: 2px; }
.rv-mando[aria-pressed='true'] { border-color: #1c969e; }
.rv-muestra { display: inline-block; width: 22px; height: 7px; border-radius: 4px; margin-right: 6px; vertical-align: middle; }
.rv-muestra--lisa { background: #ff6b47; }
.rv-muestra--rayas { background: repeating-linear-gradient(90deg, #ff6b47 0 5px, #ffe3d9 5px 8px); }
.rv-muestra--lila { background: #a883f5; }
</style>
