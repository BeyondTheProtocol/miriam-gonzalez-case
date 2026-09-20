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

interface Lesion { malla: string; diametro_auto_mm: number; diana: string | null; mm_informe: number | null; suvmax?: number | null; pet?: string }
interface Pet { fecha: string; fondo_suvmean: number; fondo_suvsd: number; umbral_percist: number; dice_registro: number; focos_higado?: number; focos_sobre_lesion?: number; focos_sin_lesion?: number }
interface Escena { mallas: Record<string, string>; lesiones: Lesion[]; pet?: Pet }

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
const rotulos = ref<{ texto: string; x: number; y: number; r: number; tx: number; ty: number; visible: boolean }[]>([])
const cuenta = ref({ dianas: 0, medibles: 0, pequenas: 0 })
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
  controls.addEventListener('start', () => { controls.autoRotate = false })

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
    }))
  }
  cuenta.value = {
    dianas: esc.lesiones.filter((x) => x.diana).length,
    medibles: esc.lesiones.filter((x) => !x.diana && x.diametro_auto_mm >= 10).length,
    pequenas: esc.lesiones.filter((x) => !x.diana && x.diametro_auto_mm < 10).length,
  }
  pet.value = esc.pet ?? null
  if (esc.pet) {
    const n = (e: string) => esc.lesiones.filter((x) => x.pet === e).length
    petCuenta.value = { sobre_umbral: n('sobre_umbral'), sobre_fondo: n('sobre_fondo'),
                        en_fondo: n('en_fondo'), no_evaluable: n('no_evaluable') }
  }
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
    controls.update(); renderer!.render(scene, camera); actualizaRotulos()
  }
  tick()
}

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
    <div class="relative w-full lv-caja">
      <img v-if="failed" :src="fallback" :alt="fallbackAlt" width="1000" height="1000" class="absolute inset-0 w-full h-full object-cover">
      <div
        v-else
        ref="host"
        role="img"
        :aria-label="L('Hígado en 3D con los vasos, la vesícula y todas las lesiones: las dos diana del informe de radiología rotuladas con su medida y su SUV, y el resto detectadas automáticamente. Debajo, lo que dice de cada una el PET del mismo día. Arrástralo para girar; todas las cifras están escritas debajo.', 'Liver in 3D with the vessels, the gallbladder and all the lesions: the two targets from the radiology report labelled with their size and SUV, and the rest detected automatically. Below, what the same-day PET says about each one. Drag to rotate; all the figures are written below.')"
        class="absolute inset-0 cursor-grab active:cursor-grabbing"
      />
      <!-- anillo + rótulo de cada diana, como en el vídeo -->
      <div v-if="!loading && !failed" class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <template v-for="(r, i) in rotulos" :key="i">
          <span v-if="r.visible" class="lv-anillo" :style="{ left: r.x + 'px', top: r.y + 'px', width: 2 * r.r + 'px', height: 2 * r.r + 'px' }" />
          <span v-if="r.visible" class="lv-rotulo" :style="{ left: r.tx + 'px', top: r.ty + 'px' }">{{ r.texto }}</span>
        </template>
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

    <!-- leyenda de la lente de TAMAÑO; los recuentos salen de escena.json -->
    <ul v-if="!loading && !failed && lente === 'tamano'" class="mt-2 space-y-1 text-[11px] text-tinta">
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full border border-berenjena" style="background:#f2b23c" aria-hidden="true" />
        {{ L(`${cuenta.dianas} lesiones diana, con anillo: medida del radiólogo`, `${cuenta.dianas} target lesions, ringed: radiologist's measurement`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#f2b23c" aria-hidden="true" />
        {{ L(`Otras ${cuenta.medibles} lesiones de 10 mm o más (detección automática)`, `${cuenta.medibles} other lesions of 10 mm or more (automatic detection)`) }}
      </li>
      <li class="flex items-start gap-1.5">
        <span class="inline-block w-2.5 h-2.5 mt-[3px] shrink-0 rounded-full" style="background:#7c5cf0" aria-hidden="true" />
        {{ L(`${cuenta.pequenas} lesiones de menos de 10 mm (detección automática)`, `${cuenta.pequenas} lesions under 10 mm (automatic detection)`) }}
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
    </ul>
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
      {{ L('RECIST 1.1 solo mide lesiones de 10 mm o más. Segmentación automática (IA, 100 % local), sin validación radiológica: puede haber de más o de menos, y mide 2-6 mm por debajo del radiólogo en las dianas. Las venas más finas pueden salir incompletas.', 'RECIST 1.1 only measures lesions of 10 mm or more. Automatic segmentation (AI, 100% local), not validated by a radiologist: there may be more or fewer, and it measures 2-6 mm below the radiologist on the targets. The thinnest veins may come out incomplete.') }}
    </p>
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
</style>
