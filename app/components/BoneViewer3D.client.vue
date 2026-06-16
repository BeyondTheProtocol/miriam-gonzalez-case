<script setup lang="ts">
/**
 * Visor 3D real (WebGL) del hueso reconstruido del CT, en color HUESO uniforme mate
 * (marfil): la forma se lee por iluminación, sin tinte de captación por vértice (se
 * quitó: las "manchitas" de color disperso por el hueso confundían y competían con el
 * marcador). La captación se señala SOLO con un marcador por foco (ver abajo). Rotación
 * libre 360° (todos los ejes) con arrastre; rueda para acercar. Malla PLY en
 * /public/metastasis/mesh.
 *
 * Encuadre: el hueso ENTERO llena el marco (boundingSphere → distancia de cámara
 * con margen pequeño, sensible al aspecto). Material MATE y OPACO (roughness ~0.95,
 * sin metal, casi sin entorno) → se lee la forma como en los fotogramas del CT, sin
 * aspecto de cristal/cera. Las aberturas anatómicas (canal medular / foramen) se
 * respetan, no se rellenan.
 *
 * SIN TEXTURA DE CAPTACIÓN: el PLY trae la captación horneada como tinte por vértice,
 * pero NO la pintamos (vertexColors:false + color hueso uniforme) → el hueso queda mate
 * y limpio, sin manchas de color dispersas que compitan con el marcador. El tinte por
 * vértice se sigue LEYENDO (no se pinta) sólo para calcular el centroide de captación y
 * colocar ahí el marcador. La captación como textura difusa se conserva en la vista
 * «Captación · CT» (fotogramas), no aquí.
 *
 * MARCADOR (único indicador de captación en esta vista 3D): un DISCO plano pequeño INTEGRADO
 * en la superficie del hueso (feedback de la paciente: "menos invasivo, más integrado
 * en la pieza", ya no una pegatina/HUD flotante). Se coloca en el punto de superficie
 * que cubre la lesión —raycast desde la cámara hacia el centroide de captación, primer
 * impacto = cara visible sobre la zona (con respaldo radial desde el centro si fallara)—
 * y se ORIENTA a la normal de la superficie (su cara mira hacia fuera, siguiendo la
 * inclinación de la pieza), pegado con un offset mínimo. (Probé THREE.DecalGeometry,
 * la opción preferente, pero sobre la curvatura alta de las vértebras el decal se
 * RASGABA en barras inconexas → descartado por robustez; el disco orientado no rasga.)
 * El trazo es contenido: mancha radial suave + anillo finísimo + punto central, en el
 * color del trazador. depthTest:true (la profundidad la escribe el HUESO, no el
 * marcador) → cuando la lesión queda en la cara TRASERA al girar, el hueso OCLUYE el
 * marcador: se comporta como parte del 3D (prima la INTEGRACIÓN sobre el "nunca
 * perdido"). Una sola marca, en el trazador dominante; color = trazador (violeta
 * receptor / naranja FDG), tamaño ∝ SUVmáx. Marca la ZONA (aprox.).
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping       // filmic roll-off → el hueso blanco no se "quema"
  renderer.toneMappingExposure = 0.95                      // <1: evita el glaseado a blanco
  el.appendChild(renderer.domElement)
  // ambiente tenue (room) SOLO como relleno difuso — sin reflejos especulares: con
  // roughness ~0.95 + envMapIntensity ~0.08 el entorno no crea brillos de cristal,
  // solo aporta un poco de luz indirecta para que el volumen no quede plano.
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  // luz difusa/hemisférica protagonista → look de HUESO MACIZO mate (como los fotogramas)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1d26, 0.95))
  const key = new THREE.DirectionalLight(0xfff4ea, 0.85); key.position.set(-0.6, 0.9, 1.0); scene.add(key)
  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.38); fill.position.set(0.7, -0.2, -0.7); scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.28); rim.position.set(0.2, 0.4, -1.0); scene.add(rim) // contraluz suave para separar del fondo (no especular)
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

/* ---------- marcador = DISCO plano integrado en la superficie ----------
   Decisión de experto (feedback: "menos invasivo, más integrado en la pieza"): NO un
   sprite/HUD que siempre mira a cámara y nunca se ocluye, sino un DISCO plano pequeño
   colocado en el punto de superficie sobre la lesión y ORIENTADO a la normal (su cara
   mira hacia fuera siguiendo la inclinación de la pieza), pegado con un offset mínimo.
   Trazo TENUE del color del trazador con bordes suaves; depthTest:true → el hueso lo
   OCLUYE al girar detrás (parte del 3D, no overlay). Preferí THREE.DecalGeometry, pero
   sobre la curvatura alta de las vértebras el decal se RASGABA en barras inconexas; el
   disco orientado es robusto y no rasga. */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
/* trazo: mancha radial suave (energía concentrada en el centro, se desvanece antes del
   borde) + anillo finísimo a media distancia + punto central diminuto, todo tenue y
   del color del trazador. Bordes por degradado → "pintado", no pegatina de borde duro. */
function markerTexture(hex: string): THREE.CanvasTexture {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S
  const ctx = cv.getContext('2d')!
  const c = S / 2
  ctx.clearRect(0, 0, S, S)
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0, hexA(hex, 0.50))
  g.addColorStop(0.40, hexA(hex, 0.24))
  g.addColorStop(0.72, hexA(hex, 0.05))
  g.addColorStop(1, hexA(hex, 0))
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill()
  // anillo finísimo a media distancia → "región de interés" identificable sin dominar
  ctx.strokeStyle = hex; ctx.globalAlpha = 0.5; ctx.lineWidth = S * 0.016; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(c, c, S * 0.34, 0, Math.PI * 2); ctx.stroke()
  // punto central diminuto → fija el centroide
  ctx.globalAlpha = 0.66; ctx.fillStyle = hex
  ctx.beginPath(); ctx.arc(c, c, S * 0.03, 0, Math.PI * 2); ctx.fill()
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
/* material del marcador: unlit (color del trazador fiel), transparente y tenue.
   depthTest:true → el hueso lo OCLUYE al girar detrás. depthWrite:false → no perturba
   la profundidad del hueso. polygonOffset negativo → lo levanta un pelo sobre la
   superficie y evita z-fighting. DoubleSide → nunca se cula sobre la cara visible. */
function markerMaterial(hex: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: markerTexture(hex),
    transparent: true,
    opacity: 0.85,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    toneMapped: false,
  })
}
/* normal hacia el observador (lado `from`) a partir de un impacto del raycaster. */
function hitNormal(h: THREE.Intersection, from: THREE.Vector3, fallbackDir: THREE.Vector3): THREE.Vector3 {
  const n = new THREE.Vector3()
  if (h.face && mesh) {
    n.copy(h.face.normal).applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)).normalize()
    if (n.dot(from.clone().sub(h.point)) < 0) n.negate()   // que mire hacia el observador
  } else { n.copy(fallbackDir).normalize() }
  return n
}
/* punto de superficie que CUBRE la lesión + su normal. El centroide de captación está
   DENTRO del hueso; lo proyectamos a la superficie así: (1) raycast desde la CÁMARA
   hacia el centroide → primer impacto = la cara VISIBLE sobre la zona (queda integrado
   en la vista por defecto y se ocluye al girar detrás); (2) respaldo: raycast radial
   desde fuera, en la dirección del centroide, por si el rayo de cámara no impacta. */
function surfaceHit(inner: THREE.Vector3): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  if (!mesh || !camera) return null
  mesh.updateMatrixWorld(true); camera.updateMatrixWorld(true)
  const camPos = camera.position.clone()
  const toLesion = inner.clone().sub(camPos)
  if (toLesion.lengthSq() > 1e-8) {
    const dir = toLesion.clone().normalize()
    const hits = new THREE.Raycaster(camPos, dir, 0.01, boneRadius * 12).intersectObject(mesh, false)
    if (hits.length) return { point: hits[0].point.clone(), normal: hitNormal(hits[0], camPos, dir.clone().negate()) }
  }
  // respaldo radial desde el centro (boneCenter ya es el origen)
  const rad = inner.clone().sub(boneCenter)
  if (rad.lengthSq() < 1e-8) rad.set(0, 0, 1)
  rad.normalize()
  const origin = boneCenter.clone().add(rad.clone().multiplyScalar(boneRadius * 2.2))
  const hits = new THREE.Raycaster(origin, rad.clone().negate(), 0.01, boneRadius * 4.5).intersectObject(mesh, false)
  if (!hits.length) return null
  return { point: hits[0].point.clone(), normal: hitNormal(hits[0], origin, rad) }
}
/* DISCO plano pequeño en el punto de superficie, orientado a la normal (robusto: a
   diferencia del decal, no se rasga sobre curvatura alta). */
function makeOrientedDisc(point: THREE.Vector3, normal: THREE.Vector3, diameter: number, hex: string): THREE.Mesh {
  const geo = new THREE.CircleGeometry(diameter / 2, 48)
  const d = new THREE.Mesh(geo, markerMaterial(hex))
  d.position.copy(point).add(normal.clone().multiplyScalar(boneRadius * 0.004))   // pegado, offset mínimo
  d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize())  // +Z → normal (mira afuera)
  d.renderOrder = 5
  return d
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
/* diámetro del disco ∝ SUVmáx (acotado). El degradado concentra el trazo visible en el
   centro (~70% del disco) → la mancha visible queda pequeña y discreta, y el disco es
   lo bastante pequeño para abrazar la superficie sin separarse en la curvatura. */
function markerSize(suv: number | null | undefined): number {
  const s = Math.min(Math.max(suv || 0, 0), 14) / 14
  return boneRadius * (0.20 + 0.14 * s)
}
function buildMarkers() {
  if (!mesh || !markerGroup) return
  disposeMarkers()
  markerGroup.position.set(0, 0, 0)   // recPos/warmPos ya están en coords. de escena (mesh recentrado)
  const hasRec = props.dota != null
  const hasFdg = props.fdg != null
  if (!hasRec && !hasFdg) return
  // UNA sola marca, en el color del trazador DOMINANTE (mayor SUVmáx): la textura por
  // vértice ya distingue receptor (violeta) y azúcar (naranja); la marca sólo remata la
  // zona dominante, sin saturar. Marca la ZONA (aprox.); el caption lo dice.
  const useRec = hasRec && (!hasFdg || (props.dota ?? 0) >= (props.fdg ?? 0))
  const hex = useRec ? C_REC : C_FDG
  const inner = useRec ? recPos : warmPos
  const suv = useRec ? props.dota : props.fdg
  const hit = surfaceHit(inner)
  if (!hit) return                                  // sin intersección → sin marca (la textura ya indica la zona)
  markerGroup.add(makeOrientedDisc(hit.point, hit.normal, markerSize(suv), hex))
}

function load(key: string) {
  loading.value = true; failed.value = false; curKey = key
  new PLYLoader().load(`/metastasis/mesh/${key}.ply`, (geo) => {
    try {
      if (curKey !== key) return                  // llegó tarde: hay una carga más reciente
      // Normales SIEMPRE recalculadas del winding de la malla. La reconstrucción
      // (marching cubes / TotalSegmentator) trae triángulos con winding invertido/
      // inconsistente; con FrontSide se culaban las caras frontales y se veía la
      // pared INTERIOR del fondo → el hueso parecía translúcido. Recalcular las
      // normales del propio winding las deja coherentes con DoubleSide (gl_FrontFacing
      // voltea la normal en la cara visible) → la cara que mira a cámara se ilumina
      // bien, sin importar el sentido de los triángulos.
      geo.deleteAttribute('normal'); geo.computeVertexNormals()
      // Descartar alfa por vértice si el PLY trae color RGBA: una alfa <1 podría
      // translucir el hueso ("zonas transparentes"). Forzamos color RGB opaco.
      const colAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined
      if (colAttr && colAttr.itemSize === 4) {
        const n = colAttr.count, rgb = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) { rgb[i * 3] = colAttr.getX(i); rgb[i * 3 + 1] = colAttr.getY(i); rgb[i * 3 + 2] = colAttr.getZ(i) }
        geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
      }
      // NO pintamos el tinte de captación por vértice: el color se conserva en la
      // geometría sólo para leer el centroide (uptakeCentroids); el hueso se renderiza
      // en color uniforme (vertexColors:false) → limpio, sin manchitas que confundan.
      if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose() }
      disposeMarkers()
      // HUESO MACIZO MATE (como los fotogramas): muy rugoso, sin metal, casi sin
      // entorno → sin reflejos de cristal ni cera. Opaco, con escritura y test de
      // profundidad → la forma se lee, sin zonas transparentes. DoubleSide (NO se
      // culan caras): robusto frente al winding invertido/inconsistente de la malla
      // reconstruida → nunca se ve "a través" del hueso hacia el interior, gire como
      // gire. Sin transparencia ni alfa: 100% opaco y escribe profundidad.
      // vertexColors:false + color marfil uniforme → SIN manchitas de captación: el
      // hueso queda limpio y la forma se lee por iluminación; la captación la marca
      // sólo el disco (un foco = un marcador claro).
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xdcd3c2),   // marfil/hueso mate, uniforme
        vertexColors: false,
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

      <!-- leyenda / caption (voz neutral): en esta vista el hueso va MATE y limpio (sin
           tinte de captación por vértice); la captación la indica SÓLO el marcador. -->
      <p class="bv-cap">
        {{ L('Reconstrucción del CT · hueso mate · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · matte bone · drag to rotate · scroll to zoom') }}<br>
        <span :style="{ color: C_REC }">●</span> {{ L('marcador receptor · Galio', 'receptor marker · gallium') }} ·
        <span :style="{ color: C_FDG }">●</span> {{ L('marcador azúcar · FDG', 'sugar marker · FDG') }}
        <span style="color:#7c8694"> · {{ L('color del marcador = trazador dominante · tamaño ∝ SUVmáx · señala la zona de captación (aprox.)', 'marker colour = dominant tracer · size ∝ SUVmax · marks the uptake zone (approx.)') }}</span>
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
