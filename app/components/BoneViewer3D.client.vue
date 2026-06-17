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
 *  1) «Área» (por defecto) — GRADIENTE HONESTO de captación keyed al SUV REAL. La captación PET es
 *     un GRADIENTE continuo (intensa en el núcleo del foco, se desvanece hacia el fondo, SIN borde
 *     tumoral neto — limitada por la resolución ~4–5 mm). El color del trazador se mezcla con el
 *     marfil con OPACIDAD ∝ SUV: a = smoothstep(GRAD_BG, hi, max(fdg,ga))^γ, con hi anclado al pico
 *     del hueso; por debajo del fondo → marfil neutro. Así se ve la distribución REAL (núcleo intenso
 *     → periferia que se desvanece), sin un corte duro que falsee la extensión. (Una versión previa
 *     CONFINABA el color a membOut = al contorno; eso ocultaba la captación real de bajo nivel y
 *     era MENOS honesto → revertido.) La dominancia del trazador (el HUE) es ESCALA-JUSTA: el canal
 *     Ga es un proxy de rango mayor (~0–13) que el FDG real (~0–8), así que se NORMALIZA cada canal
 *     antes de comparar (gaN = suv_ga/13 vs fdgN = suv_fdg/8); gaN > fdgN → violeta receptor, si no
 *     naranja FDG, y donde ambos normalizados son altos y parecidos se mezclan (mixta).
 *  2) «Mapa de calor» — intensidad continua: t = clamp(max(suv_fdg, suv_ga)/8, 0, 1) →
 *     rampa térmica perceptual (azul→cian→amarillo→naranja→rojo). Referencia ABSOLUTA
 *     (comparable entre huesos).
 *  3) «Morfología» — densidad REAL del CT (HU). t = clamp((density_hu−150)/(850−150), 0, 1)
 *     con gamma ~1.3 → rampa SIN BLANCO ARRIBA: trabecular/normal (t bajo) = tostado/marfil
 *     neutro; denso/blástico (t alto) = AZUL OSCURO SATURADO. El sombreado de las luces
 *     (Lambert/PBR mate) da el volumen encima. Es FORMA, no biología, no trazador.
 *
 * PARCHE + CONTORNO + DIANA (marcan dónde está el área). FOCOS REALES (prop nFoci): el nº de
 * dianas/regiones se LIMITA al nº de focos REPORTADOS en ese hueso (1 en la mayoría; 2 en
 * D11 y L1; 3 en el ilíaco derecho). El campo SUV se SUAVIZA (media por aristas, 2 pasadas) y
 * se umbraliza POR ENCIMA del fondo (SUV suavizado ≥ 3.0, o ≥45% del pico local); las
 * componentes conexas se ordenan por captación total, se FUSIONAN las contiguas y se quedan
 * sólo las nFoci mayores (el resto = ruido, descartado; NO hay diana «de consolación» si ya
 * hay un foco). El CONTORNO es la ISO-LÍNEA membOut=0.5 (cruce interpolado por arista) sobre
 * ese campo suavizado y restringido a esas regiones → curva LIMPIA y cerrada (no espagueti),
 * sólo alrededor de los focos reales. Esa iso-línea NO es el borde del tumor: es un NIVEL DE
 * REFERENCIA de SUV (la captación es un gradiente), dibujado FINO y en GRIS NEUTRO (no cian
 * chillón) para que no se lea como un límite anatómico. NO se rellena con parche plano en ningún
 * modo (el gradiente en «Área» y los mapas de calor/densidad ya hacen el relleno honesto; un
 * parche plano re-impondría un corte duro). La DIANA (disco anillo+punto GRIS, MALLA plana
 * ANCLADA a la superficie del foco, orientada a la NORMAL, lift 0.02·r, depthTest TRUE) marca el
 * PICO (SUVmáx) de cada foco real: ROTA con la pieza y se OCLUYE cuando el foco cae en la cara
 * trasera (no es un HUD). Línea/diana van con depthTest:true + polygonOffset → se asientan en la
 * superficie y el hueso los ocluye al girar. Informa, no concluye: ni bordes ni tamaños tumorales
 * exactos; la captación es un gradiente, aproximado por la resolución (~4–5 mm).
 *
 * LENGUAJE VISUAL DE MARCADORES (A4, unificado): relleno/color = trazador (violeta receptor ·
 * coral azúcar · mixto); punteado = detectado por IA · por confirmar (un solo uso); parpadeo =
 * foco FDG más brillante (lo activa el bloque C; aquí queda el hook coherente); anillo grueso =
 * seleccionado. La mini-leyenda va en el caption del visor.
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
  nFoci?: number                  // nº de focos REPORTADOS en este hueso (limita el nº de dianas)
  /* Foco con biopsia previa (hecho del caso: #13 ilíaco derecho, 26B585). Cuando es true se
     OFRECE el toggle «Ver la biopsia previa» que dibuja una aguja ILUSTRATIVA (no la real).
     La etiqueta opcional permite pasar el código del caso (p.ej. «26B585») al rótulo. */
  biopsied?: boolean
  biopsyLabel?: string            // código de la biopsia (p.ej. «26B585») para el rótulo
}>()
const { locale } = useI18n()
const L = (es: string, en: string) => (locale.value === 'en' ? en : es)
const mode = computed<Mode>(() => props.mode ?? 'area')

/* colores de trazador (vivos, leen sobre marfil y sobre fondo oscuro). VÍVIDOS porque el
   gradiente «lavado» anterior los pintaba a baja opacidad → violeta pálido difuminado; ahora el
   núcleo llega a opacidad alta con estos hue saturados → se ve NÍTIDO de un vistazo. */
const C_REC = '#b53cdb'    // receptor · Galio (violeta saturado, intenso en el núcleo)
const C_FDG = '#ff7a1f'    // azúcar · FDG (naranja saturado)
const C_IVORY = '#dcd3c2'  // hueso mate, uniforme (igual que el look ya aprobado)
/* NIVEL DE REFERENCIA (antes «contorno»): NO es un borde tumoral neto. La captación PET es un
   GRADIENTE continuo (sin límite anatómico); dibujar la iso-línea en cian chillón (#19e3d6) la
   leía como si fuera el borde del tumor — falso. Ahora es una línea FINA y GRIS NEUTRA, sutil,
   que sólo marca un nivel de referencia de SUV (≥X) para orientar la lectura. */
const C_REF = '#c2c6cc'    // nivel de referencia · gris claro neutro (lee sobre marfil, heat y azul, sin chillar)
const C_REF_DK = '#5a5f66' // halo del nivel de referencia · gris oscuro neutro (contraste sutil)
/* AGUJA DE BIOPSIA ILUSTRATIVA (26B585) — gris metálico frío. NO es la trayectoria real: es una
   recreación didáctica del abordaje (posterolateral hacia el ala ilíaca). El cuerpo es metálico
   y el bisel de la punta un pelín más claro; los marcadores de entrada/punta van en ámbar tenue
   para distinguirse de la diana del SUVmáx (gris). */
const C_NEEDLE = '#b9c0c9'     // cuerpo de la aguja · gris metálico claro (lee sobre el hueso marfil y el azul)
const C_NEEDLE_DK = '#7d858f'  // sombra/halo de la aguja · gris metálico oscuro
const C_NEEDLE_TIP = '#e6ebf0' // bisel de la punta · acero más claro
const C_ENTRY = '#d98a2b'      // marcador del punto de ENTRADA (piel/hueso) · ámbar (≠ diana SUVmáx)
const C_TIP_MK = '#c25a2b'     // marcador de la PUNTA (queda en hueso, no en el realce) · ámbar oscuro

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const failed = ref(false)
/* ¿se puede mostrar la aguja de biopsia ILUSTRATIVA? sólo en el foco biopsiado (#13) y con malla
   3D interactiva (no en el fallback estático). Por defecto OCULTA: el toggle la activa. */
const biopsyAvailable = computed(() => !!props.biopsied && !noMesh.value && !failed.value)
const showBiopsy = ref(false)
/* foco sin malla PLY individual (p. ej. #17 costilla, #19): estado honesto */
const noMesh = computed(() => !props.meshKey)
/* kind de fotograma para el fallback sin-WebGL, según el modo */
const fallbackKind = computed<'vertebra' | 'morfo'>(() => (mode.value === 'morpho' ? 'morfo' : 'vertebra'))

let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls
let pmrem: THREE.PMREMGenerator | null = null
let mesh: THREE.Mesh | null = null
let markerGroup: THREE.Group | null = null
let needleGroup: THREE.Group | null = null    // aguja de biopsia ILUSTRATIVA (sólo foco biopsiado, toggle)
let outlineGroup: THREE.Group | null = null   // contorno (línea) de la(s) región(es) de lesión
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
let suvMaxBone = 0                          // SUV-máx de TODO el hueso → base del umbral RELATIVO del realce
/* color del trazador DOMINANTE de la zona (informativo; en «Área» el color ya es el gradiente
   por vértice, no un parche plano): se decide con la dominancia escala-justa (gaN vs fdgN). */
let zoneTracerHex = C_REF

/* ---- contorno de la lesión: campo de pertenencia + segmentos de iso-línea ----
   El CONTORNO (A3) NO usa el mismo umbral suave que el color de «Área». Para que la curva
   se LEA (limpia y cerrada, no espagueti) el campo de pertenencia del contorno se construye
   sobre un SUV SUAVIZADO (media por aristas, 1–2 pasadas) y un umbral MÁS ALTO que el fondo
   (THR_OUTLINE), y se RESTRINGE a las regiones de los focos REALES (regionMask) — así el
   borde sólo encierra esos focos, no cada mota dispersa. */
// membOut[i] = pertenencia 0..1 del vértice i para el CONTORNO (campo suavizado, umbral alto,
// y a 0 fuera de las regiones de los focos reales).
let membOut: Float32Array | null = null
// vértices de los segmentos de contorno (cada arista borde aporta 2 puntos: A,B), en
// coords de geometría (la malla se recentra al origen, así que coinciden con world).
let outlinePos: Float32Array | null = null
// índices de los triángulos INTERIORES al área (los 3 vértices con membOut≥0.5) → el PARCHE
// translúcido que rellena la zona en «Área» y «Mapa de calor» (la «malla por encima»). En
// «Morfología» NO se rellena: sólo el borde, para no tapar la densidad que se ve por dentro.
let patchIndices: Uint32Array | null = null
let patchGroup: THREE.Group | null = null   // parche translúcido del área (mesh sobre el hueso)
// índices de los triángulos FRONTERA (inCount 1–2) → la BANDA del borde (mesh opaca, color del
// trazador). Es un ribete grueso y continuo anclado a la superficie (no una línea de 1px).
let borderIndices: Uint32Array | null = null
let borderGroup: THREE.Group | null = null  // banda del borde (mesh sobre el hueso)
// foco de lesión (clúster conexo de la región) → diana ANCLADA a la superficie. Para cada
// foco guardamos el punto de superficie más próximo al centroide (pos) y la NORMAL de la
// superficie ahí (nrm): la diana se asienta sobre la malla orientada a esa normal, así
// ROTA con el hueso y se OCLUYE cuando el foco cae en la cara trasera (como el contorno).
type LesionFocus = { pos: THREE.Vector3; nrm: THREE.Vector3 }
let lesionFoci: LesionFocus[] = []
/* adyacencia por aristas de la malla (lista por vértice) — la construye precompute UNA vez y
   la reusan el suavizado, las componentes conexas (focos) y la fusión de contiguas. */
let vAdj: number[][] | null = null
/* SUV-máx (max(fdg,ga)) SUAVIZADO por vértice — base del campo del contorno y del ranking. */
let suvSmooth: Float32Array | null = null
/* focos elegidos (pico local) → base de los niveles iso-SUV (curvas de nivel del «Área»). */
let chosenPeaks: number[] = []
/* segmentos de las LÍNEAS ISO-SUV (Opción A): por cada nivel, los cruces de la iso sobre el campo
   suavizado dentro de las regiones de los focos. Float32 (A,B por arista). Sólo modo «Área». */
let isoLinePos: Float32Array | null = null
let isoLineGroup: THREE.Group | null = null

/* umbrales / rangos del color-math (SUV absolutos y banda de HU del CT) */
const THR_SUV = 2.5             // «Área»: pertenencia a la lesión (color), SUV absoluto (FDG o Ga)
/* REALCE DE ZONA (parche+borde) — umbral RELATIVO POR HUESO, no absoluto. El canal Ga es un
   proxy con rango muy variable entre huesos: en D11 está alto en >la mitad de la pieza (un
   umbral absoluto de 3–3.4 marca el 58% del hueso → mancha enorme = «espagueti»); en otros
   huesos el SUV es bajo y concentrado. Para que la ZONA marque SIEMPRE el núcleo del foco y
   sólo el núcleo, el umbral del campo del realce se calcula como FRACCIÓN del SUV-MÁX de ESE
   hueso (THR_ZONE_FRAC·suvMaxBone), con un suelo absoluto por encima del fondo (THR_ZONE_FLOOR)
   para no marcar huesos sin captación. Así la región crece desde el pico y se mantiene compacta
   en cualquier hueso. */
const THR_ZONE_FRAC = 0.62      // umbral del realce = 62% del SUV-máx de ESTE hueso (núcleo del foco)
const THR_ZONE_FLOOR = 3.2      // suelo absoluto (SUV suavizado) — no realza huesos sin captación clara
const SMOOTH_ITERS = 4          // pasadas de media por aristas del campo SUV (suaviza el ruido PET)
const MEMB_SMOOTH_ITERS = 3     // pasadas de media sobre membOut (cierra tendones finos → borde redondeado)
const MEMB_CLOSE_ITERS = 2      // cierre morfológico (dilatar+erosionar) sobre la región → mancha continua
const BORDER_RING = 0           // nivel de referencia FINO: sólo los triángulos frontera, sin dilatar (línea sutil, no ribete grueso)
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
/* «Área» · GRADIENTE HONESTO keyed al SUV real, MÁS CONTRASTADO (Opción A). La captación PET es
   un GRADIENTE continuo: intensa en el núcleo, se desvanece hacia el fondo (no hay borde tumoral
   neto). El COLOR del trazador se mezcla con el marfil con opacidad ∝ SUV. El problema del look
   anterior («lavado»): gamma<1 LEVANTABA la periferia → todo violeta pálido difuminado y tope de
   opacidad 0.92 → el núcleo no se veía vívido. AHORA:
     · GRAD_GAMMA > 1 → curva PRONUNCIADA: la opacidad sube LENTO al principio (la periferia queda
       tenue, casi marfil) y DISPARA cerca del pico → el núcleo destaca nítido, no «lavado».
     · GRAD_MAX_OPACITY ≈ 1 → el núcleo llega a color PLENO/vívido (no violeta pálido).
     · GRAD_FLOOR_A: un suelo de opacidad MÍNIMO (>0) en cuanto se supera el fondo, para que la
       periferia con captación real no desaparezca del todo (sigue siendo honesto: hay color donde
       hay SUV), pero discreta frente al núcleo.
   Sigue SIN corte duro: es la misma curva continua, sólo con más contraste núcleo↔periferia. */
const GRAD_BG = 1.8             // SUV (max fdg/ga) de FONDO → por debajo, marfil (opacidad ~0)
const GRAD_HI_MIN = 4.5         // SUV mínimo que satura el color (suelo, para huesos de baja captación)
const GRAD_HI_FRAC = 0.82       // el color satura a GRAD_HI_FRAC·pico del hueso (el núcleo = color pleno antes del pico exacto → núcleo más ancho y vívido)
const GRAD_GAMMA = 1.9          // gamma>1 → caída MARCADA: periferia tenue, el núcleo dispara y se ve VÍVIDO (antes 0.85 = lavado)
const GRAD_FLOOR_A = 0.10       // opacidad mínima sobre el fondo: la periferia con SUV real no se borra (honesto), pero discreta
const GRAD_MAX_OPACITY = 1.0    // núcleo a color PLENO/vívido (la luz aún sombrea el volumen vía vertexColors)
/* NIVELES ISO-SUV (Opción A · «curvas de nivel»): 2–3 iso-líneas FINAS en gris neutro a fracciones
   del pico local del foco → dan ESTRUCTURA al gradiente (se «aprecia» dónde sube la captación) sin
   inventar un único borde tumoral. Son orientativas; la captación sigue siendo un gradiente. */
const ISO_SUV_FRACS = [0.55, 0.72, 0.88]   // fracciones del pico LOCAL de cada foco → 3 niveles iso

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
   FALLBACK si faltan: se desempaquetan del RGB horneado (R=HU/1500, G=FDG/15, B=GA/15).
   Además construye la ADYACENCIA por aristas (vAdj) UNA vez y el SUV-máx SUAVIZADO (suvSmooth),
   que alimenta el contorno (A3) y el ranking de focos (A2). */
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
  membOut = new Float32Array(n)
  hotIndex = -1; hotSuv = 0; suvMaxBone = 0
  const suvRaw = new Float32Array(n)   // SUV-máx crudo = max(fdg, ga) por vértice
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
    suvRaw[i] = s
    if (s > hotSuv) { hotSuv = s; hotIndex = i }
  }
  // adyacencia por aristas (una vez) → la reusan suavizado, componentes y fusión
  vAdj = buildAdjacency(geo, n)
  // suavizado del campo SUV (media por aristas, SMOOTH_ITERS pasadas) → contorno limpio
  suvSmooth = smoothField(suvRaw, n)
  // SUV-máx del hueso SOBRE EL CAMPO SUAVIZADO (robusto a 1 vértice ruidoso) → base del umbral
  // RELATIVO del realce de zona (cada hueso con su propia referencia).
  for (let i = 0; i < n; i++) if (suvSmooth[i] > suvMaxBone) suvMaxBone = suvSmooth[i]
  // focos (A2: limitados a nFoci, fusionando contiguas) + campo del contorno restringido (A3)
  computeFoci(geo)
  // contorno (iso-línea sobre membOut, ya restringido a los focos reales)
  computeOutline(geo)
  // líneas iso-SUV (curvas de nivel del «Área»): estructura del gradiente, restringidas a los focos
  computeIsoLines(geo)
}

/* adyacencia por aristas: lista de vecinos por vértice (sin duplicar la arista). */
function buildAdjacency(geo: THREE.BufferGeometry, n: number): number[][] {
  const idx = geo.getIndex()
  const adj: number[][] = Array.from({ length: n }, () => [])
  const seen = new Set<number>()
  const link = (a: number, b: number) => {
    const key = a < b ? a * n + b : b * n + a
    if (seen.has(key)) return
    seen.add(key); adj[a].push(b); adj[b].push(a)
  }
  const triCount = idx ? idx.count / 3 : (geo.getAttribute('position') as THREE.BufferAttribute).count / 3
  const gi = (k: number) => (idx ? idx.getX(k) : k)
  for (let t = 0; t < triCount; t++) {
    const a = gi(t * 3), b = gi(t * 3 + 1), c = gi(t * 3 + 2)
    link(a, b); link(b, c); link(c, a)
  }
  return adj
}

/* media por aristas (Laplaciano de difusión simple): cada pasada sustituye el valor por la
   media de (vértice + vecinos). Suaviza el campo SUV antes de extraer el borde → curva limpia
   y cerrada, no líneas sueltas por el ruido del campo crudo. */
function smoothField(src: Float32Array, n: number): Float32Array {
  let cur = src
  for (let it = 0; it < SMOOTH_ITERS; it++) {
    const next = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const nb = vAdj![i]
      let sum = cur[i], cnt = 1
      for (const w of nb) { sum += cur[w]; cnt++ }
      next[i] = sum / cnt
    }
    cur = next
  }
  return cur
}

const ISO = 0.5
/* ---------- FOCOS de la lesión (A2) + máscara de región del contorno (A3) ----------
   1) Candidatos: vértices con SUV SUAVIZADO ≥ umbral RELATIVO del hueso
      (max(THR_ZONE_FLOOR, THR_ZONE_FRAC·suvMaxBone)) → adaptativo por hueso (no absoluto).
   2) Componentes conexas sobre las aristas → cada componente = un blob de captación, con su
      SUV total (suma) y su pico.
   3) FUSIÓN de contiguas: componentes separadas por un hueco pequeño (≤ 2 aristas) se unen en
      el mismo foco (evita partir un foco real en trozos por ruido).
   4) Se ordenan por SUV TOTAL y se QUEDAN las nFoci mayores (nº de focos REPORTADOS en el
      hueso, pasado por prop). El resto se descarta como ruido — NO hay diana «de consolación»
      cuando ya hay al menos un foco.
   Salidas: lesionFoci (anclaje+normal por foco para la diana) y membOut (campo del contorno,
   suave, restringido a las regiones de los focos elegidos → el borde sólo los encierra a ellos). */
function computeFoci(geo: THREE.BufferGeometry) {
  lesionFoci = []
  chosenPeaks = []
  if (!membOut) membOut = new Float32Array((geo.getAttribute('position') as THREE.BufferAttribute).count)
  membOut.fill(0)
  if (!suvSmooth || !vAdj) return
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const nrmAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined
  const n = pos.count
  const normalOf = (v: number, fallback: THREE.Vector3): THREE.Vector3 => {
    if (nrmAttr) {
      const nx = nrmAttr.getX(v), ny = nrmAttr.getY(v), nz = nrmAttr.getZ(v)
      if (nx || ny || nz) return new THREE.Vector3(nx, ny, nz).normalize()
    }
    return fallback.clone().normalize()
  }
  // 1) candidatos por SUV suavizado por encima del umbral RELATIVO de ESTE hueso. El umbral es
  //    max(suelo absoluto, fracción·SUV-máx del hueso): adaptativo, así marca el NÚCLEO del foco
  //    igual en un hueso con Ga alto en todas partes (D11) que en uno con captación baja y
  //    concentrada. Esto es lo que evita el «espagueti»: no marcamos medio hueso, sólo el núcleo.
  const zoneThr = Math.max(THR_ZONE_FLOOR, THR_ZONE_FRAC * suvMaxBone)
  const cand = new Uint8Array(n)
  let candCount = 0
  for (let i = 0; i < n; i++) if (suvSmooth[i] >= zoneThr) { cand[i] = 1; candCount++ }
  // sin captación clara → cae al vértice más caliente (única diana, sólo si hay algo)
  if (candCount === 0) {
    if (hotIndex >= 0 && hotSuv >= THR_SUV) {
      const p = new THREE.Vector3(pos.getX(hotIndex), pos.getY(hotIndex), pos.getZ(hotIndex))
      lesionFoci.push({ pos: p, nrm: normalOf(hotIndex, p) })
      fillMembForFocus(geo, hotIndex, hotSuv)
    }
    return
  }
  // 2) componentes conexas sobre los candidatos
  type Comp = { verts: number[]; total: number; peak: number; peakV: number; cx: number; cy: number; cz: number }
  const compId = new Int32Array(n).fill(-1)
  const comps: Comp[] = []
  const minCluster = Math.max(4, Math.round(candCount * 0.02))   // descarta motas diminutas
  for (let i = 0; i < n; i++) {
    if (!cand[i] || compId[i] >= 0) continue
    const id = comps.length
    const queue = [i]; compId[i] = id
    const verts: number[] = []
    let total = 0, peak = 0, peakV = i, sx = 0, sy = 0, sz = 0
    while (queue.length) {
      const v = queue.pop()!
      verts.push(v)
      const s = suvSmooth[v]; total += s; if (s > peak) { peak = s; peakV = v }
      sx += pos.getX(v); sy += pos.getY(v); sz += pos.getZ(v)
      for (const w of vAdj[v]) if (cand[w] && compId[w] < 0) { compId[w] = id; queue.push(w) }
    }
    comps.push({ verts, total, peak, peakV, cx: sx / verts.length, cy: sy / verts.length, cz: sz / verts.length })
  }
  // 3) FUSIÓN de contiguas: une componentes separadas por un hueco ≤2 aristas (union-find).
  const parent = comps.map((_, i) => i)
  const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a] } return a }
  const union = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb }
  // expande cada componente 2 aristas y, si alcanza otra componente, las funde
  for (let id = 0; id < comps.length; id++) {
    const ring = new Set<number>(comps[id].verts)
    let frontier = comps[id].verts.slice()
    for (let hop = 0; hop < 2; hop++) {
      const nextF: number[] = []
      for (const v of frontier) for (const w of vAdj[v]) {
        if (ring.has(w)) continue
        ring.add(w); nextF.push(w)
        if (compId[w] >= 0) union(id, compId[w])
      }
      frontier = nextF
    }
  }
  // agrupa componentes por raíz union-find → focos fusionados
  const groups = new Map<number, number[]>()
  for (let id = 0; id < comps.length; id++) {
    const r = find(id)
    ;(groups.get(r) ?? groups.set(r, []).get(r)!).push(id)
  }
  type Focus = { verts: number[]; total: number; peak: number; peakV: number; cx: number; cy: number; cz: number }
  const foci: Focus[] = []
  for (const ids of groups.values()) {
    let verts: number[] = [], total = 0, peak = 0, peakV = ids[0] >= 0 ? comps[ids[0]].peakV : 0
    let sx = 0, sy = 0, sz = 0, cnt = 0
    for (const id of ids) {
      const c = comps[id]
      verts = verts.concat(c.verts); total += c.total
      if (c.peak > peak) { peak = c.peak; peakV = c.peakV }
      for (const v of c.verts) { sx += pos.getX(v); sy += pos.getY(v); sz += pos.getZ(v); cnt++ }
    }
    if (cnt < minCluster) continue
    foci.push({ verts, total, peak, peakV, cx: sx / cnt, cy: sy / cnt, cz: sz / cnt })
  }
  if (!foci.length) {
    if (hotIndex >= 0 && hotSuv >= THR_SUV) {
      const p = new THREE.Vector3(pos.getX(hotIndex), pos.getY(hotIndex), pos.getZ(hotIndex))
      lesionFoci.push({ pos: p, nrm: normalOf(hotIndex, p) })
      fillMembForFocus(geo, hotIndex, hotSuv)
    }
    return
  }
  // 4) ordena por SUV TOTAL y queda con las nFoci mayores (1 por defecto: la mayoría de huesos)
  foci.sort((a, b) => b.total - a.total)
  const keep = Math.max(1, props.nFoci ?? 1)
  const chosen = foci.slice(0, keep)
  chosenPeaks = chosen.map((c) => c.peak)   // picos locales → niveles iso-SUV (curvas de nivel)
  // construye anclaje (diana) + campo del realce por cada foco elegido
  let recScore = 0, fdgScore = 0   // dominancia escala-justa acumulada (para teñir el parche)
  for (const fo of chosen) {
    // ANCLA la diana en el VÉRTICE PICO del foco (el más caliente), no en el más cercano al
    // centroide: el pico está en el NÚCLEO sólido de la captación, sobre la superficie del
    // cuerpo del hueso, nunca en la punta de un proceso fino → la diana se posa de verdad sobre
    // el bulto (resuelve el «flota en el aire»: ya no aterriza en un proceso delgado donde el
    // levante la despegaba). Usamos la normal de ESE vértice (winding recalculado → fiable).
    const av = fo.peakV
    const p = new THREE.Vector3(pos.getX(av), pos.getY(av), pos.getZ(av))
    lesionFoci.push({ pos: p, nrm: normalOf(av, p) })
    // contorno de ESTE foco: región COMPACTA crecida desde el pico (no toda la huella branchy
    // → evita el espagueti). Umbral relativo (fracción del pico local) y radio capado.
    fillMembForFocus(geo, fo.peakV, fo.peak)
    // dominancia de trazador en el pico (escala-justa) → suma ponderada por SUV total del foco
    const fN = vFdg![fo.peakV] / FDG_REF, gN = vGa![fo.peakV] / GA_REF
    if (gN >= fN) recScore += fo.total; else fdgScore += fo.total
  }
  // color del trazador DOMINANTE de la zona → tiñe el parche en «Área»/«Calor»
  zoneTracerHex = recScore >= fdgScore ? C_REC : C_FDG
  // suaviza membOut (media por aristas) → cierra tendones finos y redondea el borde, así la
  // iso-línea 0.5 sale como una curva LIMPIA y cerrada en vez de espagueti.
  smoothMembOut(n)
  // cierre morfológico (dilatar + erosionar) sobre la región binaria → tapa los huecos internos
  // y une motas contiguas en una sola MANCHA continua (no fragmentada) antes de extraer el borde.
  closeMembOut(n)
  // descarta islas pequeñas de membOut≥0.5 (motas/triángulos sueltos) → elimina las «líneas
  // sueltas»; deja sólo los blobs compactos (uno por foco) → contorno cerrado y legible.
  pruneMembOutIslands(n)
}

/* poda de islas de membOut: quédate sólo con las componentes conexas (membOut≥0.5) grandes;
   las islas diminutas se ponen a 0 → su iso-línea desaparece (no más segmentos sueltos). */
function pruneMembOutIslands(n: number) {
  if (!membOut || !vAdj) return
  const inside = new Uint8Array(n)
  let insideCount = 0
  for (let i = 0; i < n; i++) if (membOut[i] >= ISO) { inside[i] = 1; insideCount++ }
  if (insideCount === 0) return
  const minIsland = Math.max(8, Math.round(insideCount * 0.06))   // < 6% del área dentro → mota
  const comp = new Int32Array(n).fill(-1)
  for (let i = 0; i < n; i++) {
    if (!inside[i] || comp[i] >= 0) continue
    const q = [i]; comp[i] = i; const verts: number[] = []
    while (q.length) {
      const v = q.pop()!; verts.push(v)
      for (const w of vAdj[v]) if (inside[w] && comp[w] < 0) { comp[w] = i; q.push(w) }
    }
    if (verts.length < minIsland) for (const v of verts) membOut[v] = 0   // isla pequeña → fuera
  }
}

/* media por aristas sobre membOut (in place, MEMB_SMOOTH_ITERS pasadas) — un cierre/redondeo
   morfológico: las protuberancias y tendones finos (pocos vértices) se promedian por debajo de
   0.5 y desaparecen del contorno; el núcleo compacto queda. */
function smoothMembOut(n: number) {
  if (!membOut || !vAdj || MEMB_SMOOTH_ITERS <= 0) return
  let cur = membOut
  for (let it = 0; it < MEMB_SMOOTH_ITERS; it++) {
    const next = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const nb = vAdj[i]
      let sum = cur[i], cnt = 1
      for (const w of nb) { sum += cur[w]; cnt++ }
      next[i] = sum / cnt
    }
    cur = next
  }
  membOut.set(cur)
}

/* CIERRE MORFOLÓGICO sobre la región binaria (membOut≥0.5): una DILATACIÓN (cualquier vecino
   dentro → dentro) seguida de una EROSIÓN (cualquier vecino fuera → fuera), repetido
   MEMB_CLOSE_ITERS veces. Tapa huecos pequeños dentro de la mancha y une trocitos contiguos
   separados por 1–2 aristas → una sola región CONTINUA (no fragmentada) antes de sacar el borde.
   Trabaja sobre 0/1 y reescribe membOut a 0/1 (la iso 0.5 cae limpia en el borde de la región). */
function closeMembOut(n: number) {
  if (!membOut || !vAdj || MEMB_CLOSE_ITERS <= 0) return
  let cur = new Uint8Array(n)
  for (let i = 0; i < n; i++) cur[i] = membOut[i] >= ISO ? 1 : 0
  const dilate = (src: Uint8Array): Uint8Array => {
    const out = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      if (src[i]) { out[i] = 1; continue }
      for (const w of vAdj![i]) if (src[w]) { out[i] = 1; break }
    }
    return out
  }
  const erode = (src: Uint8Array): Uint8Array => {
    const out = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      if (!src[i]) continue
      let keep = 1
      for (const w of vAdj![i]) if (!src[w]) { keep = 0; break }
      out[i] = keep
    }
    return out
  }
  // CIERRE con net positivo (D = E+2): dilatamos 2 pasadas MÁS de las que erosionamos. El cierre
  // simple (D=E) tapa huecos minúsculos, pero entre DOS focos contiguos (p.ej. D11 #7+#8) queda
  // un «collado» ancho bajo el umbral que parte la mancha en ocho → línea interior espuria. La
  // dilatación neta PUENTEA ese collado: las dos regiones se funden en UNA mancha y el contorno
  // sale como una sola curva cerrada. Se redondea con el suavizado posterior.
  for (let it = 0; it < MEMB_CLOSE_ITERS + 2; it++) cur = dilate(cur)
  for (let it = 0; it < MEMB_CLOSE_ITERS; it++) cur = erode(cur)
  for (let i = 0; i < n; i++) membOut[i] = cur[i] ? 1 : 0
  // RELLENO DE HUECOS interiores: tras el cierre puede quedar un «ojo» (componente de FUERA
  // rodeada por dentro) → produce una línea interior. Etiquetamos las componentes conexas de
  // FUERA (membOut<ISO); la componente MÁS GRANDE es el verdadero exterior; cualquier otra
  // componente de fuera es un hueco encerrado → la rellenamos (dentro). Así el contorno queda
  // como UNA sola curva cerrada, sin lazo interior.
  fillMembOutHoles(n)
}

/* RELLENO de huecos encerrados en la región (membOut≥0.5). Componentes conexas de FUERA; la
   mayor = exterior real; las demás (rodeadas por dentro) se rellenan → el contorno queda como
   UNA curva cerrada por foco, sin lazo interior espurio. */
function fillMembOutHoles(n: number) {
  if (!membOut || !vAdj) return
  const out = new Uint8Array(n)   // 1 = FUERA (membOut<ISO)
  let outCount = 0
  for (let i = 0; i < n; i++) if (membOut[i] < ISO) { out[i] = 1; outCount++ }
  if (outCount === 0) return
  const comp = new Int32Array(n).fill(-1)
  const sizes: number[] = []
  for (let i = 0; i < n; i++) {
    if (!out[i] || comp[i] >= 0) continue
    const id = sizes.length
    const q = [i]; comp[i] = id; let sz = 0
    while (q.length) {
      const v = q.pop()!; sz++
      for (const w of vAdj[v]) if (out[w] && comp[w] < 0) { comp[w] = id; q.push(w) }
    }
    sizes.push(sz)
  }
  if (sizes.length <= 1) return                 // sólo el exterior → no hay huecos
  let big = 0; for (let k = 1; k < sizes.length; k++) if (sizes[k] > sizes[big]) big = k
  // toda componente de fuera que NO sea la mayor es un hueco encerrado → rellénalo (dentro)
  for (let i = 0; i < n; i++) if (out[i] && comp[i] !== big) membOut[i] = 1
}

/* campo del REALCE (membOut) de UN FOCO, crecido desde su PICO (la diana). En vez de pintar
   toda la huella (que sobre un hueso complejo serpentea → espagueti), hacemos un BFS desde el
   vértice pico por las aristas y SÓLO entramos a vértices que (a) superan el umbral del foco
   (fracción del pico local, con suelo absoluto) y (b) están dentro de un RADIO euclídeo del
   pico (cap = 0.5·r). Así el realce es UNA mancha compacta centrada en la diana, no la silueta
   ramificada entera. Pertenencia suave 0..1 con borde difuso en [0.8·thr, thr] para que la iso
   0.5 sea nítida. */
const FOCUS_RADIUS_K = 0.5      // radio del realce del foco, fracción de boneRadius
const FOCUS_THR_FRAC = 0.78     // umbral del realce del foco = 78% de su pico local (núcleo denso)
function fillMembForFocus(geo: THREE.BufferGeometry, peakV: number, peak: number) {
  if (!membOut || !suvSmooth || !vAdj) return
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const thr = Math.max(THR_ZONE_FLOOR, FOCUS_THR_FRAC * peak)
  const e0 = 0.8 * thr
  const px = pos.getX(peakV), py = pos.getY(peakV), pz = pos.getZ(peakV)
  const rad2 = (boneRadius * FOCUS_RADIUS_K) ** 2
  // BFS conexo desde el pico: sólo vértices sobre el umbral y dentro del radio del pico
  const seen = new Set<number>([peakV])
  const queue = [peakV]
  while (queue.length) {
    const v = queue.pop()!
    const m = smoothstep(e0, thr, suvSmooth[v])
    if (m > membOut[v]) membOut[v] = m
    for (const w of vAdj[v]) {
      if (seen.has(w)) continue
      if (suvSmooth[w] < e0) continue                       // por debajo del borde difuso → fuera
      const dx = pos.getX(w) - px, dy = pos.getY(w) - py, dz = pos.getZ(w) - pz
      if (dx * dx + dy * dy + dz * dz > rad2) continue       // fuera del radio del foco
      seen.add(w); queue.push(w)
    }
  }
}

/* ---------- CONTORNO de la lesión sobre la malla (iso-línea membOut = 0.5) ----------
   La «línea/bordecito» que señala dónde está el área. Recorremos los TRIÁNGULOS y, en cada
   arista (a,b) cuyos extremos quedan en lados distintos del umbral (membOut_a<0.5 y
   membOut_b≥0.5, o viceversa), interpolamos el PUNTO DE CRUCE exacto sobre la arista:
       p = A + (0.5 − membOut_a)/(membOut_b − membOut_a) · (B − A).
   Uniendo los cruces de las dos aristas que cruza cada triángulo se obtiene un segmento que
   yace SOBRE la superficie → el conjunto es la línea de contorno (THREE.LineSegments). Como
   membOut está SUAVIZADO y restringido a las regiones de los focos reales (A2/A3), la curva
   sale limpia y cerrada (no espagueti) y encierra SÓLO esos focos. */
function computeOutline(geo: THREE.BufferGeometry) {
  outlinePos = null; patchIndices = null; borderIndices = null
  if (!membOut) return
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const idx = geo.getIndex()
  const segs: number[] = []
  const patch: number[] = []    // triángulos enteros dentro → PARCHE (relleno translúcido)
  const border: number[] = []   // triángulos frontera (inCount 1–2) → BANDA del borde (mesh opaca)
  const ax = (i: number) => pos.getX(i), ay = (i: number) => pos.getY(i), az = (i: number) => pos.getZ(i)
  // punto de cruce iso sobre la arista (i,j), empujado un pelín a 'segs'
  const pushCross = (i: number, j: number) => {
    const mi = membOut![i], mj = membOut![j]
    const t = (ISO - mi) / (mj - mi)   // ∈ (0,1) por construcción (lados distintos)
    segs.push(ax(i) + (ax(j) - ax(i)) * t, ay(i) + (ay(j) - ay(i)) * t, az(i) + (az(j) - az(i)) * t)
  }
  const triCount = idx ? idx.count / 3 : pos.count / 3
  const gi = (k: number) => (idx ? idx.getX(k) : k)
  // vértices que tocan la FRONTERA (un triángulo con 1–2 vértices dentro) → semilla de la banda.
  const onBorderV = new Uint8Array(pos.count)
  for (let t = 0; t < triCount; t++) {
    const a = gi(t * 3), b = gi(t * 3 + 1), c = gi(t * 3 + 2)
    const ia = membOut![a] >= ISO, ib = membOut![b] >= ISO, ic = membOut![c] >= ISO
    const inCount = (ia ? 1 : 0) + (ib ? 1 : 0) + (ic ? 1 : 0)
    if (inCount === 3) { patch.push(a, b, c); continue }   // triángulo entero dentro → parche
    if (inCount === 0) continue                             // entero fuera → sin frontera
    onBorderV[a] = 1; onBorderV[b] = 1; onBorderV[c] = 1
    // exactamente DOS de las tres aristas cruzan la iso; añadimos esos dos puntos como un segmento
    const crosses: Array<[number, number]> = []
    if (ia !== ib) crosses.push([a, b])
    if (ib !== ic) crosses.push([b, c])
    if (ic !== ia) crosses.push([c, a])
    if (crosses.length === 2) { pushCross(crosses[0][0], crosses[0][1]); pushCross(crosses[1][0], crosses[1][1]) }
  }
  // DILATA la franja de la banda BORDER_RING aristas → un ribete GRUESO (no 1 triángulo). WebGL
  // ignora linewidth, así que el grosor se consigue ensanchando la MALLA de la banda. Tras
  // dilatar los vértices semilla, la banda son todos los triángulos cuyos 3 vértices están en la
  // franja (así no rellena hacia dentro toda la mancha; sólo un anillo a ambos lados de la iso).
  if (vAdj) {
    for (let r = 0; r < BORDER_RING; r++) {
      const add: number[] = []
      for (let i = 0; i < pos.count; i++) if (onBorderV[i]) for (const w of vAdj[i]) if (!onBorderV[w]) add.push(w)
      for (const w of add) onBorderV[w] = 1
    }
  }
  for (let t = 0; t < triCount; t++) {
    const a = gi(t * 3), b = gi(t * 3 + 1), c = gi(t * 3 + 2)
    if (onBorderV[a] && onBorderV[b] && onBorderV[c]) border.push(a, b, c)
  }
  outlinePos = segs.length ? new Float32Array(segs) : null
  patchIndices = patch.length ? new Uint32Array(patch) : null
  borderIndices = border.length ? new Uint32Array(border) : null
}

/* ---------- LÍNEAS ISO-SUV (curvas de nivel del «Área», Opción A) ----------
   Da ESTRUCTURA al gradiente: 2–3 iso-líneas FINAS a fracciones del pico local (ISO_SUV_FRACS) →
   se «aprecia» dónde sube la captación, como las curvas de nivel de un mapa, SIN imponer un único
   borde tumoral. Cada nivel es un SUV absoluto level = frac·pico; extraemos sus cruces sobre el
   campo SUAVIZADO (suvSmooth) recorriendo los triángulos. Restringimos a las REGIONES de los focos
   (membOut≥ISO en ≥1 vértice del triángulo) para no dibujar curvas por todo el hueso. Son
   orientativas (la captación es un gradiente continuo). */
function computeIsoLines(geo: THREE.BufferGeometry) {
  isoLinePos = null
  if (!suvSmooth || !membOut || !chosenPeaks.length) return
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const idx = geo.getIndex()
  const triCount = idx ? idx.count / 3 : pos.count / 3
  const gi = (k: number) => (idx ? idx.getX(k) : k)
  const ax = (i: number) => pos.getX(i), ay = (i: number) => pos.getY(i), az = (i: number) => pos.getZ(i)
  // niveles iso ABSOLUTOS desde el pico DOMINANTE (el mayor de los focos elegidos) — consistentes
  // como curvas de nivel; el suelo de zona evita niveles por debajo del fondo.
  const peak = Math.max(...chosenPeaks)
  const levels = ISO_SUV_FRACS.map((fr) => Math.max(THR_ZONE_FLOOR, fr * peak))
  const segs: number[] = []
  // cruce de la iso 'lev' sobre la arista (i,j): añade el punto interpolado a 'segs'
  const cross = (i: number, j: number, lev: number) => {
    const si = suvSmooth![i], sj = suvSmooth![j]
    const t = (lev - si) / (sj - si)   // ∈(0,1) por construcción (lados distintos del nivel)
    segs.push(ax(i) + (ax(j) - ax(i)) * t, ay(i) + (ay(j) - ay(i)) * t, az(i) + (az(j) - az(i)) * t)
  }
  for (let t = 0; t < triCount; t++) {
    const a = gi(t * 3), b = gi(t * 3 + 1), c = gi(t * 3 + 2)
    // sólo triángulos que tocan una región de foco (al menos un vértice dentro) → no por todo el hueso
    if (membOut![a] < ISO && membOut![b] < ISO && membOut![c] < ISO) continue
    const sa = suvSmooth[a], sb = suvSmooth[b], sc = suvSmooth[c]
    for (const lev of levels) {
      const ia = sa >= lev, ib = sb >= lev, ic = sc >= lev
      const inCount = (ia ? 1 : 0) + (ib ? 1 : 0) + (ic ? 1 : 0)
      if (inCount === 0 || inCount === 3) continue   // el nivel no cruza este triángulo
      const cr: Array<[number, number]> = []
      if (ia !== ib) cr.push([a, b])
      if (ib !== ic) cr.push([b, c])
      if (ic !== ia) cr.push([c, a])
      if (cr.length === 2) { cross(cr[0][0], cr[0][1], lev); cross(cr[1][0], cr[1][1], lev) }
    }
  }
  isoLinePos = segs.length ? new Float32Array(segs) : null
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
    // GRADIENTE HONESTO keyed al SUV REAL (no un corte duro). La paciente preguntó por qué había
    // color fuera del contorno; al confinarlo (enmascarar por membOut, el núcleo de alta captación)
    // nos dimos cuenta de que ESO OCULTA la captación real de bajo nivel. La verdad clínica: la
    // captación PET es un GRADIENTE continuo —intensa en el núcleo del foco, se desvanece hacia el
    // fondo, sin borde tumoral neto (limitado por la resolución ~4–5 mm)—. Confinar el color =
    // imponer un corte arbitrario y esconder ese gradiente = MENOS honesto.
    //   Aquí la OPACIDAD del trazador sobre el marfil ∝ SUV: a = smoothstep(GRAD_BG, hi, SUV)^γ,
    // con SUV = max(fdg, ga) por vértice. Por debajo del fondo (GRAD_BG) → marfil neutro (a=0);
    // sube suave hasta plena en hi = max(GRAD_HI_MIN, GRAD_HI_FRAC·pico del hueso). Así el NÚCLEO
    // se ve intenso y la PERIFERIA se desvanece de verdad — la distribución REAL, sin cortar.
    //   El HUE sigue la dominancia ESCALA-JUSTA (violeta receptor / naranja azúcar / mixto):
    // gaN = ga/GA_REF vs fdgN = fdg/FDG_REF; gaN≫fdgN → violeta, fdgN≫gaN → naranja, parecidos →
    // mezcla. (Sólo el hue usa los normalizados; la opacidad usa el SUV crudo = captación real.)
    const fInv = 1 / FDG_REF, gInv = 1 / GA_REF
    const hi = Math.max(GRAD_HI_MIN, GRAD_HI_FRAC * suvMaxBone)
    for (let i = 0; i < n; i++) {
      const f = fdgA[i], g = gaA[i]
      const s = f > g ? f : g                       // SUV crudo del vértice = captación real
      // opacidad ∝ SUV con curva CONTRASTADA (gamma>1): el núcleo dispara (vívido) y la periferia
      // queda tenue → se «aprecia bien» sin corte duro. Un suelo de opacidad (GRAD_FLOOR_A) mantiene
      // visible la periferia con SUV real (honesto), discreta frente al núcleo.
      const t = smoothstep(GRAD_BG, hi, s)
      let a = Math.pow(t, GRAD_GAMMA) * GRAD_MAX_OPACITY
      if (t > 0) a = GRAD_FLOOR_A + (1 - GRAD_FLOOR_A) * a   // periferia con captación real no se borra
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
  // NIVEL DE REFERENCIA (no «realce de zona» con corte duro). El RELLENO de la zona ya NO es un
  // parche plano: en «Área» el color es el GRADIENTE por vértice (∝ SUV) y en «Calor»/«Morfología»
  // es el mapa sobre todo el hueso → el parche translúcido se ELIMINA (re-imponía un corte duro que
  // falseaba la extensión). Lo que queda es la iso-línea FINA y GRIS como NIVEL DE REFERENCIA (un
  // SUV≥X), NO un borde tumoral neto, y la DIANA en el pico (SUVmáx). Ambos en los 3 modos: «al
  // cambiar de modo, siempre sé dónde está el foco», pero sin afirmar un límite del tumor.
  buildPatch(false)            // sin parche plano en ningún modo (el gradiente/mapa hace el relleno)
  buildBorder()                // banda gris fina · nivel de referencia (no borde neto)
  buildOutline()               // iso-línea gris de remate · nivel de referencia
  buildIsoLines()              // 2–3 curvas de nivel iso-SUV (sólo «Área») · estructura del gradiente
  buildMarkers()               // diana en el pico (SUVmáx)
}

/* ===================== PARCHE TRANSLÚCIDO DEL ÁREA («malla por encima») =====================
   Mesh de los triángulos INTERIORES al área (membOut≥0.5), translúcido, sobre el hueso. Da el
   relleno claro de la zona en «Área» y «Mapa de calor». En «Morfología» NO se construye (sólo
   el borde). depthTest:true + polygonOffset NEGATIVO → se asienta en la superficie y el hueso
   lo OCLUYE al girar (integrado, no flotando); depthWrite:false para no romper la opacidad. */
let patchGeo: THREE.BufferGeometry | null = null
function disposePatch() {
  if (patchGroup) {
    patchGroup.children.forEach((o) => { ((o as THREE.Mesh).material as THREE.Material)?.dispose() })
    patchGroup.clear()
  }
  patchGeo?.dispose(); patchGeo = null
}
function buildPatch(show: boolean) {
  if (!mesh) return
  if (!patchGroup) { patchGroup = new THREE.Group(); mesh.add(patchGroup); patchGroup.position.set(0, 0, 0) }
  disposePatch()
  if (!show || !patchIndices || patchIndices.length < 3) return
  // copia PROPIA del buffer de posiciones (no compartir el del hueso: patchGeo.dispose()
  // liberaría el buffer del mesh y lo rompería al cambiar de modo). El índice selecciona los
  // triángulos interiores.
  const src = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  patchGeo = new THREE.BufferGeometry()
  patchGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(src.array as Float32Array), 3))
  patchGeo.setIndex(new THREE.BufferAttribute(patchIndices, 1))
  // TEÑIDO DEL TRAZADOR dominante de la zona (violeta receptor / naranja azúcar) — así el parche
  // dice de un vistazo qué trazador domina el foco, además de DÓNDE está. Translúcido sobre el
  // hueso (la captación/densidad se sigue viendo dentro).
  const mtl = new THREE.MeshBasicMaterial({
    color: new THREE.Color(zoneTracerHex), transparent: true, opacity: 0.30,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    toneMapped: false, blending: THREE.NormalBlending,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  })
  const pm = new THREE.Mesh(patchGeo, mtl)
  pm.renderOrder = 2                                  // bajo el borde y la diana
  patchGroup.add(pm)
}

/* ===================== BANDA DEL BORDE (ribete grueso sobre la superficie) =====================
   El indicador PRINCIPAL de «aquí está la zona», en LOS 3 MODOS. Es una MALLA (no una línea de
   1px que WebGL no sabe engrosar): los triángulos FRONTERA de la región (borderIndices) pintados
   opacos en cian/teal → un ribete grueso, liso y CONTINUO que rodea el foco y se asienta SOBRE el
   hueso. depthTest:true + polygonOffset negativo → gira con la pieza y el hueso lo OCLUYE al
   girar (anclado, no flotando). depthWrite:false para no romper la opacidad del hueso. */
let borderGeo: THREE.BufferGeometry | null = null
function disposeBorder() {
  if (borderGroup) {
    borderGroup.children.forEach((o) => { ((o as THREE.Mesh).material as THREE.Material)?.dispose() })
    borderGroup.clear()
  }
  borderGeo?.dispose(); borderGeo = null
}
function buildBorder() {
  if (!mesh) return
  if (!borderGroup) { borderGroup = new THREE.Group(); mesh.add(borderGroup); borderGroup.position.set(0, 0, 0) }
  disposeBorder()
  if (!borderIndices || borderIndices.length < 3) return
  const src = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  borderGeo = new THREE.BufferGeometry()
  borderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(src.array as Float32Array), 3))
  borderGeo.setIndex(new THREE.BufferAttribute(borderIndices, 1))
  const mtl = new THREE.MeshBasicMaterial({
    color: new THREE.Color(C_REF), transparent: true, opacity: 0.50,   // gris claro, más DEFINIDO (antes 0.34 = muy tenue) pero sin chillar
    depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    toneMapped: false, blending: THREE.NormalBlending,
    polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6,
  })
  const bm = new THREE.Mesh(borderGeo, mtl)
  bm.renderOrder = 3                                  // bajo la iso-línea y la diana
  borderGroup.add(bm)
}

/* ===================== CONTORNO DE LA LESIÓN (línea sobre la superficie) =====================
   La «línea/bordecito» que señala SIEMPRE dónde está el área, en LOS 3 MODOS. Se construye
   una sola vez por malla (los segmentos no dependen del modo). Color cian/teal brillante que
   lee sobre marfil, sobre la rampa térmica y sobre el azul del blástico. depthTest:true +
   polygonOffset NEGATIVO → la línea se asienta sobre la superficie y el hueso la OCLUYE al
   girar (queda integrada, no flotando): cuando la lesión cae detrás, su contorno desaparece
   tras el hueso — para eso está la diana siempre-visible. */
function disposeOutline() {
  if (!outlineGroup) return
  outlineGroup.children.forEach((o) => {
    const ln = o as THREE.LineSegments
    ;(ln.material as THREE.Material).dispose(); ln.geometry?.dispose()
  })
  outlineGroup.clear()
}
function buildOutline() {
  if (!mesh || !outlineGroup) return
  disposeOutline()
  if (!outlinePos || outlinePos.length < 6) return
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(outlinePos, 3))
  // NIVEL DE REFERENCIA, NO un borde tumoral neto (A3). La iso-línea marca SÓLO un nivel de SUV de
  // referencia para orientar la lectura; la captación REAL es un gradiente (ver el color «Área»),
  // sin límite anatómico. Por eso la línea es FINA y GRIS NEUTRA (no el cian chillón que se leía
  // como «el borde del tumor»): un halo gris OSCURO sutil para contraste + el core gris CLARO
  // encima, ambos a opacidad moderada. depthTest:true → el hueso la OCLUYE al girar (se asienta
  // sobre la superficie, no flota).
  const halo = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
    color: new THREE.Color(C_REF_DK), transparent: true, opacity: 0.45, linewidth: 1,
    depthTest: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8,
  }))
  halo.renderOrder = 4
  const core = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
    color: new THREE.Color(C_REF), transparent: true, opacity: 0.85, linewidth: 1,
    depthTest: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -10,
  }))
  core.renderOrder = 5
  outlineGroup.add(halo); outlineGroup.add(core)
}

/* ===================== LÍNEAS ISO-SUV (curvas de nivel del «Área») =====================
   2–3 iso-líneas FINAS en GRIS neutro a fracciones del pico → dan estructura «tipo curvas de
   nivel» al gradiente (se aprecia dónde sube la captación) sin inventar un borde tumoral único.
   SÓLO en modo «Área» (en «Calor»/«Morfología» el mapa ya estructura el hueso entero). depthTest
   ON + polygonOffset negativo → se asientan sobre la superficie y el hueso las ocluye al girar. */
function disposeIsoLines() {
  if (!isoLineGroup) return
  isoLineGroup.children.forEach((o) => {
    const ln = o as THREE.LineSegments
    ;(ln.material as THREE.Material).dispose(); ln.geometry?.dispose()
  })
  isoLineGroup.clear()
}
function buildIsoLines() {
  if (!mesh || !isoLineGroup) return
  disposeIsoLines()
  if (mode.value !== 'area') return            // curvas de nivel sólo en «Área»
  if (!isoLinePos || isoLinePos.length < 6) return
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(isoLinePos, 3))
  // halo gris OSCURO sutil + core gris CLARO encima → la curva lee sobre el gradiente
  // violeta/naranja y sobre el marfil, fina y discreta (no un borde duro).
  const halo = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
    color: new THREE.Color(C_REF_DK), transparent: true, opacity: 0.40, linewidth: 1,
    depthTest: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7,
  }))
  halo.renderOrder = 4
  const core = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
    color: new THREE.Color(C_REF), transparent: true, opacity: 0.62, linewidth: 1,
    depthTest: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -9, polygonOffsetUnits: -9,
  }))
  core.renderOrder = 5
  isoLineGroup.add(halo); isoLineGroup.add(core)
}

/* ===================== DIANA SUTIL ANCLADA A LA SUPERFICIE (los 3 modos) =====================
   Marca FÍSICA «pintada» sobre el hueso en el centro de cada foco: un disco plano (anillo
   fino + punto central) posado en el punto de superficie del foco y ORIENTADO a su normal.
   Va como hija del mesh → ROTA con el hueso; con depthTest:true + polygonOffset NEGATIVO se
   asienta en la superficie y el hueso la OCLUYE cuando el foco cae en la cara trasera (igual
   que el contorno) — ya NO es un HUD «siempre visible» (la paciente: que gire con el hueso y
   se oculte detrás). depthWrite:false para no romper la opacidad del hueso ni del contorno.
   Estilo discreto: anillo fino + punto, color del contorno (cian/teal), semitransparente —
   NO la pegatina blanca gruesa que se rechazó. Presente en los 3 modos. Se complementa con el
   contorno: la diana marca el centro, el contorno la frontera. */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
function targetTexture(): THREE.CanvasTexture {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S
  const ctx = cv.getContext('2d')!; const c = S / 2
  ctx.clearRect(0, 0, S, S)
  ctx.lineCap = 'round'
  // DIANA: anillo fino + punto central que marca el PICO (SUVmáx) del foco. Color GRIS NEUTRO,
  // coherente con el nivel de referencia (no el cian chillón). SILUETA de diana (anillo + punto
  // sólido) para distinguirla de la iso-línea. Halo gris OSCURO detrás de cada trazo para que el
  // gris claro lea sobre marfil, sobre el gradiente violeta/naranja y sobre el azul del blástico.
  // Discreta pero legible: anillo fino, punto pequeño; semitransparente vía opacity.
  const R = S * 0.31
  // diana MÁS DEFINIDA (la paciente: «quedó muy tenue»): anillo un pelín más grueso, halo oscuro
  // más marcado y punto central mayor → se lee de un vistazo sobre el gradiente, sin chillar.
  // 1) halo oscuro neutro del anillo (más ancho → contraste sobre marfil/violeta/naranja)
  ctx.strokeStyle = hexA('#1b1e23', 0.75); ctx.lineWidth = S * 0.095
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.stroke()
  // 2) anillo gris claro (más grueso, nítido)
  ctx.strokeStyle = C_REF; ctx.globalAlpha = 1; ctx.lineWidth = S * 0.055
  ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.stroke()
  // 3) punto central: halo oscuro neutro + punto gris claro sólido (la marca del PICO), más visible
  ctx.fillStyle = hexA('#1b1e23', 0.8)
  ctx.beginPath(); ctx.arc(c, c, S * 0.125, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = C_REF
  ctx.beginPath(); ctx.arc(c, c, S * 0.090, 0, Math.PI * 2); ctx.fill()
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}
let markerTex: THREE.CanvasTexture | null = null
let markerGeo: THREE.PlaneGeometry | null = null
function disposeMarkers() {
  if (markerGroup) {
    markerGroup.children.forEach((o) => { ((o as THREE.Mesh).material as THREE.Material)?.dispose() })
    markerGroup.clear()
  }
  markerTex?.dispose(); markerTex = null   // textura compartida → se libera UNA vez
  markerGeo?.dispose(); markerGeo = null   // geometría compartida → idem
}
function buildMarkers() {
  if (!mesh || !markerGroup) return
  disposeMarkers()
  // diana en CADA foco, en los 3 modos. Sólo si hay captación real (focos calculados).
  if (!lesionFoci.length) return
  // markerGroup es HIJO del mesh → hereda EXACTAMENTE su transform (el recentrado y cualquier
  // giro). Las posiciones de foco son coords de geometría CRUDA, así que casan al pelo con la
  // malla y ROTAN con ella, sin sumar offsets a mano (eso evita el desfase del sprite previo).
  markerTex = targetTexture()            // textura compartida por todas las dianas del foco
  // disco PEQUEÑO: marca el CENTRO del foco, no el área (de eso se encargan parche+borde). Al ser
  // pequeño su extensión plana no supera la curvatura local → ya no hace falta el levante grande
  // (0.12·r) que lo DESPEGABA del hueso (la causa del «flota en el aire»). Se posa pegado.
  const size = boneRadius * 0.13
  markerGeo = new THREE.PlaneGeometry(size, size)   // disco plano (con la textura anillo+punto)
  const Z = new THREE.Vector3(0, 0, 1)
  const q = new THREE.Quaternion()
  // LEVANTE MÍNIMO (0.02·r ≈ 0.75 u): sólo lo justo para evitar z-fighting con la superficie; el
  // disco queda PINTADO sobre el hueso, no flotando. Anclado en el VÉRTICE PICO (núcleo sólido,
  // normal fiable), no en una punta de proceso. depthTest:true → gira con la pieza y el hueso lo
  // OCLUYE al caer detrás. polygonOffset MUY negativo lo asienta limpio sin separación visible.
  const lift = boneRadius * 0.02
  for (const f of lesionFoci) {
    const mtl = new THREE.MeshBasicMaterial({
      map: markerTex, transparent: true, opacity: 0.98,
      // ANCLADA: depthTest ON → el hueso la ocluye al girar; depthWrite OFF para no romper
      // hueso/borde; polygonOffset MUY NEGATIVO la asienta sobre la superficie (no z-fight).
      depthTest: true, depthWrite: false, side: THREE.DoubleSide,
      toneMapped: false, blending: THREE.NormalBlending,
      polygonOffset: true, polygonOffsetFactor: -14, polygonOffsetUnits: -14,
    })
    const m = new THREE.Mesh(markerGeo, mtl)
    // orientar el plano (normal +Z) hacia la normal de superficie del foco
    q.setFromUnitVectors(Z, f.nrm)
    m.quaternion.copy(q)
    // posar en la superficie, con un levante MÍNIMO por la normal (pegado, no flotando)
    m.position.copy(f.pos).addScaledVector(f.nrm, lift)
    m.renderOrder = 6                    // por encima del borde/iso-línea, pero ANCLADO (no HUD)
    markerGroup.add(m)
  }
}

/* ===================== AGUJA DE BIOPSIA · SIMULACIÓN ILUSTRATIVA (26B585) =====================
   SÓLO en el foco biopsiado (#13 ilíaco derecho) y con el toggle activado. NO es la trayectoria
   registrada: es una RECREACIÓN DIDÁCTICA del abordaje (posterolateral hacia el ala ilíaca),
   APROXIMADA, para que se entienda la lección del panel: la biopsia 26B585 dio sólo hueso y
   músculo, sin tumor evaluable (el hueso blástico denso rinde poco tejido).

   Modelado (geometría/orientación/entrada):
    · La PUNTA se ancla en hueso DENSO cercano al foco, pero DESPLAZADA del pico de captación (el
      tumor viable): así la punta queda en hueso, NO en el realce → ilustra por qué falló. Se busca
      el vértice de mayor densidad (vDensity) dentro de un radio del centroide del foco; si no hay
      canal de densidad, se cae al propio anclaje del foco empujado hacia dentro del hueso.
    · La DIRECCIÓN del abordaje es posterolateral: parte del lado +X (derecha del paciente) y algo
      posterior (−Z) y craneal, apuntando al ala ilíaca. Se mezcla con la dirección centro→punta
      para que la aguja entre «desde fuera» hacia la zona de la lesión de forma plausible.
    · El punto de ENTRADA está fuera del hueso, a ~1.6·boneRadius del centro a lo largo de esa
      dirección (la aguja cruza/roza el hueso denso para alcanzar la punta).
    · CUERPO: cilindro fino metálico (CylinderGeometry, eje local +Y) reorientado al eje
      entrada→punta. BISEL en la punta: un cono corto coaxial, acero más claro.
    · MARCADORES: una esferita ámbar en la ENTRADA y otra (ámbar oscuro) en la PUNTA (en hueso).
   Anclada al hueso: todo cuelga de needleGroup, hijo del mesh → ROTA con la pieza. depthTest:true
   en los materiales → el hueso ocluye la parte de la aguja que queda detrás (no es un HUD). */
let needleMats: THREE.Material[] = []
let needleGeos: THREE.BufferGeometry[] = []
function disposeBiopsyNeedle() {
  if (needleGroup) needleGroup.clear()
  needleMats.forEach((m) => m.dispose()); needleMats = []
  needleGeos.forEach((g) => g.dispose()); needleGeos = []
}
/* vértice de hueso MÁS DENSO dentro de un radio del punto p (coords de geometría). Devuelve su
   posición; si no hay canal de densidad o no hay candidatos, devuelve null. */
function densestNear(geo: THREE.BufferGeometry, p: THREE.Vector3, radius: number): THREE.Vector3 | null {
  if (!vDensity) return null
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const n = pos.count
  const r2 = radius * radius
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
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: 0.5, metalness: 0.1,
    depthTest: true, depthWrite: true, toneMapped: true,
  })
  needleMats.push(m)
  return new THREE.Mesh(g, m)
}
function buildBiopsyNeedle() {
  if (!mesh || !needleGroup) return
  disposeBiopsyNeedle()
  // sólo dibujar si el foco es biopsiable Y el toggle está activo
  if (!props.biopsied || !showBiopsy.value) return
  // ancla del foco (pico de captación = tumor viable). Sin focos calculados, no dibujamos.
  const focus = lesionFoci[0]
  if (!focus) return
  const geo = mesh.geometry
  const peak = focus.pos.clone()          // pico de captación (el realce / tumor viable)
  const peakNrm = focus.nrm.clone().normalize()
  // PUNTA en HUESO DENSO cerca del foco pero DESPLAZADA del pico (≈0.28·r hacia dentro y a un lado):
  // así la punta NO cae en el realce. Buscamos el vértice más denso en un radio pequeño alrededor de
  // ese punto desplazado → la punta se posa en hueso blástico real (ilustra el fallo).
  const inward = peakNrm.clone().multiplyScalar(-1)            // hacia dentro del hueso desde el pico
  const offset = peak.clone().addScaledVector(inward, boneRadius * 0.18)
  let tip = densestNear(geo, offset, boneRadius * 0.22) ?? offset
  // ASEGURA separación visible del pico (que la punta NO coincida con el realce). Si quedó muy cerca
  // del pico, la empujamos un poco más adentro por la normal.
  if (tip.distanceTo(peak) < boneRadius * 0.12) tip = peak.clone().addScaledVector(inward, boneRadius * 0.22)
  // DIRECCIÓN del abordaje posterolateral hacia el ala ilíaca: lado derecho del paciente (+X),
  // algo posterior (−Z) y ligeramente craneal (+Y). Se mezcla con la normal de la superficie del
  // foco (sale «desde fuera») para que la entrada sea plausible y entre hacia la lesión.
  const approach = new THREE.Vector3(0.78, 0.30, -0.54).normalize()
  const dir = approach.clone().multiplyScalar(0.6).add(peakNrm.clone().multiplyScalar(0.4)).normalize()
  // ENTRADA fuera del hueso: desde la punta, retrocede por 'dir' una distancia que saque el extremo
  // claramente fuera de la pieza (cruza/roza el hueso denso para llegar a la punta).
  const needleLen = boneRadius * 1.85
  const entry = tip.clone().addScaledVector(dir, needleLen)
  const axis = entry.clone().sub(tip)               // de la punta a la entrada
  const len = axis.length()
  const up = axis.clone().normalize()
  // CUERPO de la aguja: cilindro fino metálico (eje local +Y → reorientado a 'up'). Radio fino
  // ∝ boneRadius para que sea proporcional al hueso.
  const rad = Math.max(0.5, boneRadius * 0.018)
  const bodyLen = len * 0.93                         // deja sitio al cono del bisel en la punta
  const bodyGeo = new THREE.CylinderGeometry(rad, rad, bodyLen, 20, 1, true); needleGeos.push(bodyGeo)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(C_NEEDLE), roughness: 0.32, metalness: 0.85,
    side: THREE.DoubleSide, depthTest: true, depthWrite: true, toneMapped: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  })
  needleMats.push(bodyMat)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  // centro del cuerpo: a media longitud del cuerpo desde la punta, a lo largo de 'up'
  const bodyCenter = tip.clone().addScaledVector(up, len - bodyLen / 2)
  body.position.copy(bodyCenter)
  body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)
  // BISEL de la punta: cono corto coaxial (radio en la base = rad, vértice en la punta), acero claro.
  const bevelLen = Math.min(rad * 6, len * 0.07)
  const bevelGeo = new THREE.ConeGeometry(rad, bevelLen, 20); needleGeos.push(bevelGeo)
  const bevelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(C_NEEDLE_TIP), roughness: 0.28, metalness: 0.9,
    depthTest: true, depthWrite: true, toneMapped: true,
  })
  needleMats.push(bevelMat)
  const bevel = new THREE.Mesh(bevelGeo, bevelMat)
  // el cono apunta -Y por defecto (vértice abajo): orientamos su +Y a 'up' y lo colocamos con el
  // VÉRTICE en la punta (a bevelLen/2 desde la punta a lo largo de 'up').
  bevel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up.clone().multiplyScalar(-1))
  bevel.position.copy(tip.clone().addScaledVector(up, bevelLen / 2))
  // MARCADORES: entrada (ámbar) y punta (ámbar oscuro, queda en hueso, no en el realce)
  const entryMk = smallSphere(C_ENTRY, Math.max(1.0, boneRadius * 0.035))
  entryMk.position.copy(entry)
  const tipMk = smallSphere(C_TIP_MK, Math.max(0.9, boneRadius * 0.03))
  tipMk.position.copy(tip)
  // orden de pintado por encima del hueso pero respetando depthTest (el hueso ocluye lo de detrás)
  body.renderOrder = 7; bevel.renderOrder = 8; entryMk.renderOrder = 8; tipMk.renderOrder = 8
  needleGroup.add(body); needleGroup.add(bevel); needleGroup.add(entryMk); needleGroup.add(tipMk)
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
      disposeMarkers(); disposeOutline(); disposePatch(); disposeBorder(); disposeIsoLines(); disposeBiopsyNeedle()
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
      // markerGroup, patchGroup, borderGroup y outlineGroup TODOS HIJOS del mesh → heredan su
      // transform (recentrado al origen + cualquier giro) y van EXACTAMENTE pegados a la malla,
      // sin desfases a mano. (El parche/borde usan coords de geometría cruda como el mesh; al ser
      // hijos del mesh recentrado quedan perfectamente alineados con la iso-línea, también hija.)
      // Re-parentamos los grupos al mesh NUEVO en cada recarga.
      if (!markerGroup) markerGroup = new THREE.Group()
      mesh.add(markerGroup); markerGroup.position.set(0, 0, 0)
      if (!patchGroup) patchGroup = new THREE.Group()
      mesh.add(patchGroup); patchGroup.position.set(0, 0, 0)
      if (!borderGroup) borderGroup = new THREE.Group()
      mesh.add(borderGroup); borderGroup.position.set(0, 0, 0)
      if (!outlineGroup) outlineGroup = new THREE.Group()
      mesh.add(outlineGroup); outlineGroup.position.set(0, 0, 0)
      if (!isoLineGroup) isoLineGroup = new THREE.Group()
      mesh.add(isoLineGroup); isoLineGroup.position.set(0, 0, 0)
      if (!needleGroup) needleGroup = new THREE.Group()
      mesh.add(needleGroup); needleGroup.position.set(0, 0, 0)
      frameObject()
      applyMode()
      buildBiopsyNeedle()    // aguja ILUSTRATIVA (sólo foco biopsiado + toggle activo)
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
/* cambia el hueso → recarga la malla. Reseteamos el toggle de biopsia (por defecto OCULTA: la
   aguja no debe estorbar al cambiar de foco; el usuario la reactiva donde proceda). */
watch(() => props.meshKey, (k) => {
  showBiopsy.value = false
  if (!k || !renderer) return
  try { load(k) } catch (e) { console.error('[BoneViewer3D] load', e); failed.value = true; loading.value = false }
})
/* foco no biopsiable o se desactiva el dato → apaga la aguja (no se queda colgada) */
watch(() => props.biopsied, (b) => { if (!b) { showBiopsy.value = false; buildBiopsyNeedle() } })
/* cambia el MODO → sólo se reescribe el color por vértice (sin recargar la malla). La aguja
   ILUSTRATIVA no depende del modo: se reconstruye para re-anclarla tras el applyMode (que
   reconstruye los grupos de marcadores). */
watch(mode, () => {
  if (mesh && !loading.value && !failed.value) { applyMode(); buildBiopsyNeedle() }
})
/* toggle de la aguja → construir/limpiar sin recargar la malla */
watch(showBiopsy, () => {
  if (mesh && !loading.value && !failed.value) buildBiopsyNeedle()
})
function toggleBiopsy() { if (biopsyAvailable.value) showBiopsy.value = !showBiopsy.value }
onBeforeUnmount(() => {
  cancelAnimationFrame(raf); ro?.disconnect()
  disposeMarkers(); disposeOutline(); disposePatch(); disposeBorder(); disposeIsoLines(); disposeBiopsyNeedle()
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

        <!-- TOGGLE de la aguja de biopsia ILUSTRATIVA (sólo foco biopsiado #13). Por defecto OCULTA;
             el botón la activa/desactiva. Honesto en el propio rótulo del botón. -->
        <button
          v-if="biopsyAvailable"
          type="button"
          class="bv-biopsy-toggle"
          :class="{ 'is-on': showBiopsy }"
          :aria-pressed="showBiopsy"
          @click="toggleBiopsy"
        >
          <span class="bv-biopsy-dot" aria-hidden="true" />
          {{ showBiopsy
            ? L('Ocultar la biopsia previa', 'Hide prior biopsy')
            : L('Ver la biopsia previa (' + (biopsyLabel || '26B585') + ')', 'Show prior biopsy (' + (biopsyLabel || '26B585') + ')') }}
        </button>

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
          {{ failed ? L('Reconstrucción del CT · vista estática', 'Reconstruction from the CT · static view') : L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span :style="{ color: C_REC }">●</span> {{ L('violeta · receptor (Galio)', 'violet · receptor (gallium)') }} ·
          <span :style="{ color: C_FDG }">●</span> {{ L('naranja · azúcar (FDG)', 'orange · sugar (FDG)') }} ·
          <span :style="{ color: C_REF }">≈</span> {{ L('niveles de captación (iso-SUV), orientativos · la captación es un gradiente, no un borde neto', 'uptake levels (iso-SUV), indicative · uptake is a gradient, not a sharp border') }} ·
          <span :style="{ color: C_REF }">◎</span> {{ L('pico (SUVmáx)', 'peak (SUVmax)') }}
          <span style="color:#7c8694"> · {{ L('La intensidad del color sigue al SUV REAL por punto: VÍVIDO en el núcleo (donde más capta) y se DESVANECE hacia el fondo — porque la captación PET es un GRADIENTE continuo, sin un borde tumoral neto (limitado por la resolución ~4–5 mm). Las líneas grises finas son NIVELES de captación (iso-SUV), como curvas de nivel: orientan dónde sube, NO son el límite del tumor. La diana marca el pico (SUVmáx). El Galio es un proxy aproximado por ahora.', 'Colour intensity follows the REAL per-point SUV: VIVID at the core (highest uptake) and FADING toward background — because PET uptake is a continuous GRADIENT, with no sharp tumour border (limited by ~4–5 mm resolution). The thin grey lines are uptake LEVELS (iso-SUV), like contour lines: they show where uptake rises, NOT the tumour boundary. The marker shows the peak (SUVmax). Gallium is an approximate proxy for now.') }}</span>
        </template>

        <template v-else-if="mode === 'heat'">
          {{ failed ? L('Reconstrucción del CT · vista estática', 'Reconstruction from the CT · static view') : L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#1f6ed6">●</span> {{ L('frío', 'cool') }} →
          <span style="color:#0db9c8">●</span> <span style="color:#e8e030">●</span>
          <span style="color:#f58a1a">●</span> <span style="color:#de1c1c">●</span> {{ L('caliente', 'hot') }} ·
          <span :style="{ color: C_REF }">▢</span> {{ L('nivel de referencia (SUV≥X), no un borde neto', 'reference level (SUV≥X), not a sharp border') }} ·
          <span :style="{ color: C_REF }">◎</span> {{ L('pico (SUVmáx)', 'peak (SUVmax)') }}
          <span style="color:#7c8694"> · {{ L('TODO el hueso muestra la intensidad de captación (SUV real), rampa fría→caliente — es un mapa continuo sobre el hueso entero. La captación es un GRADIENTE, no un borde: la línea gris marca sólo un nivel de referencia de SUV dentro del mapa y la diana el pico (SUVmáx). El Galio es un proxy aproximado por ahora.', 'The WHOLE bone shows uptake intensity (real SUV), cool→hot ramp — a continuous map over the entire bone. Uptake is a GRADIENT, not a border: the grey line marks only a reference SUV level within the map and the marker the peak (SUVmax). Gallium is an approximate proxy for now.') }}</span>
        </template>

        <template v-else>
          {{ failed ? L('Reconstrucción del CT · vista estática', 'Reconstruction from the CT · static view') : L('Reconstrucción del CT · arrastra para girar · rueda para acercar', 'Reconstruction from the CT · drag to rotate · scroll to zoom') }}<br>
          <span style="color:#9c794a">●</span> {{ L('tostado · hueso normal', 'tan · normal bone') }} →
          <span style="color:#2c5cb2">●</span> {{ L('azul oscuro · blástico (denso)', 'dark blue · blastic (dense)') }} ·
          <span :style="{ color: C_REF }">▭</span> {{ L('nivel de referencia (SUV≥X), no un borde neto', 'reference level (SUV≥X), not a sharp border') }} ·
          <span :style="{ color: C_REF }">◎</span> {{ L('pico (SUVmáx)', 'peak (SUVmax)') }}
          <span style="color:#7c8694"> · {{ L('TODO el hueso muestra la densidad real del CT (HU): el hueso denso/blástico resalta en azul oscuro — un mapa sobre el hueso entero. La línea gris marca sólo un nivel de referencia de SUV (captación PET) dentro del mapa, no un borde tumoral neto —la captación es un gradiente—; SIN relleno, para ver la densidad por dentro. Orientativo para la factibilidad de biopsia (el blástico denso rinde menos tejido).', 'The WHOLE bone shows real CT density (HU): dense/blastic bone stands out in dark blue — a map over the entire bone. The grey line marks only a reference SUV level (PET uptake) within the map, not a sharp tumour border —uptake is a gradient—; WITHOUT fill, so the density inside is visible. Indicative of biopsy feasibility (dense blastic bone yields less tissue).') }}</span>
        </template>
      </p>

      <!-- RÓTULO HONESTO de la aguja ILUSTRATIVA (sólo con el toggle activo). Inequívoco: es una
           recreación didáctica, NO la trayectoria registrada. -->
      <p v-if="biopsyAvailable && showBiopsy" class="bv-biopsy-cap">
        <span class="bv-biopsy-cap-head">
          <span class="bv-biopsy-swatch" :style="{ background: C_NEEDLE }" aria-hidden="true" />
          {{ L('Simulación ILUSTRATIVA de la biopsia previa (' + (biopsyLabel || '26B585') + ')', 'ILLUSTRATIVE simulation of the prior biopsy (' + (biopsyLabel || '26B585') + ')') }}
        </span>
        {{ L('Trayectoria APROXIMADA, no la real — es una recreación didáctica, no la trayectoria registrada. La punta queda en hueso (no en el realce de captación, el tumor viable): dio solo hueso/músculo, sin tumor evaluable — el hueso blástico denso rinde poco tejido tumoral.',
             'APPROXIMATE trajectory, not the actual one — a teaching recreation, not the recorded path. The tip lands in bone (not in the uptake highlight, the viable tumour): it yielded only bone/muscle, no evaluable tumour — dense blastic bone yields little tumour tissue.') }}
        <span class="bv-biopsy-key">
          <span class="bv-biopsy-mk" :style="{ background: C_ENTRY }" aria-hidden="true" /> {{ L('entrada', 'entry') }} ·
          <span class="bv-biopsy-mk" :style="{ background: C_TIP_MK }" aria-hidden="true" /> {{ L('punta (en hueso)', 'tip (in bone)') }}
        </span>
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
/* toggle de la aguja de biopsia ILUSTRATIVA — abajo-izquierda, fuera del camino del reframe */
.bv-biopsy-toggle {
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
.bv-biopsy-toggle:hover { background: rgba(30, 37, 48, 0.92); border-color: rgba(217, 138, 43, 0.85); }
.bv-biopsy-toggle:focus-visible { outline: 2px solid #d98a2b; outline-offset: 2px; }
.bv-biopsy-toggle.is-on { background: rgba(217, 138, 43, 0.18); border-color: rgba(217, 138, 43, 0.95); color: #f3d8ad; }
.bv-biopsy-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d98a2b;
  box-shadow: 0 0 0 2px rgba(217, 138, 43, 0.25);
}
/* rótulo honesto de la aguja ILUSTRATIVA */
.bv-biopsy-cap {
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
.bv-biopsy-cap-head {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.bv-biopsy-swatch {
  display: inline-block;
  width: 14px;
  height: 4px;
  border-radius: 2px;
  border: 1px solid rgba(125, 133, 143, 0.7);
}
.bv-biopsy-key { display: inline-flex; align-items: center; gap: 5px; margin-left: 2px; }
.bv-biopsy-mk {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.bv-cap {
  font-size: 10px;
  text-align: center;
  margin-top: 6px;
  font-family: ui-monospace, monospace;
  line-height: 1.4;
  color: #aeb6c2;
}
</style>
