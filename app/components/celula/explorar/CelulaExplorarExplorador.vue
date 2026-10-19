<script setup lang="ts">
/**
 * El explorador con la puerta ABIERTA (datos reales con OK, o el ejemplo con ?demo=1 fuera de
 * producción). Solo existe en el navegador: lo monta la página cuando la puerta lo permite.
 *
 * Qué enseña (plan del 17-oct-2026): mapa por lesión (Vitessce), un gen de la lista con n y suelo
 * ambiental por grupo (violines propios), la tabla de genes de interés con referencia emparejada y
 * lectura de Polaris (borrador), co-expresión de dos genes y número de copias (por célula SOLO en el hueso,
 * inferido de la expresión frente a la referencia; no es lectura de ADN).
 * Qué NO enseña: «% de células tumorales» del hígado, re-clustering ni comparación tumor/hepatocito.
 * SIMULADOR (18-oct, Miriam: «el mismo simulador que en local [Loupe], el buscador de marcadores y que se vea en el
 * mapa»; y después: «fácil para gente médica, lo útil, navegación intuitiva»). Panel de expertos (comité médico,
 * diseño, verificación y comparativa de visores): UNA puerta al gen y tres estados.
 *  1. Llegada: mapa por grupo + lista corta de genes de interés (gen, % en el grupo, referencia, suelo).
 *  2. Gen activo (buscador, lista o marcadores): el mapa se pinta y el panel abre el gen grupo a grupo, con «‹ Volver»
 *     y una ✕ junto al buscador para quitarlo.
 *  3. A un clic: marcadores, «Más análisis» (tabla completa, dos genes) y «Calidad de los datos».
 * En táctil el mapa se ve y se mueve tras pulsar «Mover el mapa».
 * NAVEGACIÓN (19-oct): el gen y la biopsia van en la URL (Atrás, recargar y compartir el enlace); en el detalle, la cifra
 * del grupo de interés de la otra biopsia; con un gen, el mapa sigue rotulando los grupos (discretos).
 * Claro/oscuro: el tema del sistema es manual (data-tema), no prefers-color-scheme; el icono de
 * sol/luna sobre el mapa pone data-tema="oscuro" en este bloque, el tema oscuro de Vitessce y su paleta de tokens.
 * Violeta = grupo de interés, selección, foco y enlaces; los avisos van en tinta (auditoría `diseno`).
 */
import type { Coexp, Lesion, LesionDatos, Manifiesto } from '~/utils/celulaExplorador'
import { coexpresion, columna, fmtParSuelo, fmtPct, nivelMatriz, porGrupo } from '~/utils/celulaExplorador'
import { abreZarr, storeWeb, type ZarrLesion } from '~/utils/celulaExploradorZarr'
import { cssRgb, paleta, type RGB } from '~/utils/celulaExploradorColor'
import { ALIAS_BUSCA, ETIQUETA_GRUPO, ETIQUETA_LESION, ETIQUETA_VEREDICTO, ETIQUETAS_FIJAS, NOMBRE_CLINICO, PANEL_INTERES, PROTEINA, etiqueta, nombreGen } from '~/utils/celulaExploradorTexto'

const props = defineProps<{ man: Manifiesto; ejemplo: boolean; lang: 'es' | 'en' }>()
const L = (es: string, en: string) => (props.lang === 'en' ? en : es)

/* ── el estado en la URL (navegación, 19-oct): ?gen=ERBB2&biopsia=hueso. Así funcionan Atrás, recargar y compartir el
 * enlace; antes Atrás sacaba de la página y se perdía el gen. La URL manda: abrir un gen añade un paso al historial;
 * cambiar de biopsia, quitar el gen o corregir la URL (HER2 → ERBB2, un gen que no existe) lo reemplazan. Atrás a una
 * URL sin gen deja el explorador sin gen, como estaba. Lo demás de la URL se conserva (sin ?demo=1 la puerta del
 * ejemplo se cierra y el explorador desaparece). ── */
// la ruta del router y no useRoute(): la de la página se pone al día más tarde y, al montar, aún llegaba sin la query
const router = useRouter()
const ruta = () => router.currentRoute.value
type Query = ReturnType<typeof ruta>['query']
const LESION_0: Lesion = props.man.lesiones.includes('higado') ? 'higado' : props.man.lesiones[0]!
const lesionDe = (q: Query): Lesion => { const b = q.biopsia; return typeof b === 'string' && (props.man.lesiones as string[]).includes(b) ? (b as Lesion) : LESION_0 }
const genDe = (q: Query): string | null => { const g = q.gen; return typeof g === 'string' && /^[\w.-]{1,40}$/.test(g) ? g : null }
/** gen pedido por la URL al cargar o al cambiar de biopsia desde la URL: lo abre el watch(d) cuando hay datos (y matriz) */
let genPendiente: string | null = genDe(ruta().query)

// táctil o estrecho: el mapa va encima del panel y queda quieto hasta pedir moverlo (Vitessce lleva touch-action:none)
const movil = useMediaQuery('(max-width: 1023px)')
const gruesa = useMediaQuery('(pointer: coarse)')
const tactil = computed(() => movil.value || gruesa.value)
const { height: altoVentana } = useWindowSize()
/** el mapa ocupa lo que queda libre de la pantalla bajo la cabecera del sitio y el aviso fijo (diseño, 18-oct: con un
 * porcentaje fijo del alto se cortaba por abajo), con topes */
const altoMapa = computed(() => {
  const libre = (altoVentana.value || 900) - altoCabecera.value - altoBanner.value - 180
  return movil.value ? Math.round(Math.min(560, Math.max(340, libre))) : Math.round(Math.min(820, Math.max(480, libre)))
})
/** pestaña del panel; `detalle` = el gen activo abierto grupo a grupo encima de la pestaña */
const panel = ref<'interes' | 'marcadores'>('interes')
/** gen activo (pintado en el mapa); null al llegar: el mapa va por grupo y el panel enseña la lista */
const activo = ref<string | null>(null)
const detalle = ref(false)
const masHigado = ref(false)
const masAnalisis = ref<HTMLDetailsElement | null>(null)
const lesion = ref<Lesion>(lesionDe(ruta().query))
const cache = shallowReactive<Partial<Record<Lesion, LesionDatos>>>({})
/** carga y error POR biopsia (revisión del PR #294: con hígado → hueso → hígado rápido, el hígado enseñaba «Cargando…» o
 * el error del hueso); una carga en curso no se repite */
const errores = shallowReactive<Partial<Record<Lesion, string>>>({})
const cargandoL = shallowReactive<Partial<Record<Lesion, boolean>>>({})
const error = computed(() => errores[lesion.value] ?? '')
const cargando = computed(() => !!cargandoL[lesion.value])
const d = computed(() => cache[lesion.value] ?? null)
const gen = ref('ANKRD30A')
const genB = ref('TPBG')
const modo = ref<'grupo' | 'gen' | 'coexp'>('grupo')
const tema = ref<'claro' | 'oscuro'>('claro')
const errorMapa = ref('')
const aviso = ref('')
/** anuncio de la lista de reserva: al elegir en ella el foco se queda en el <select> (WCAG 3.2.2) y nada decía qué
 * había cambiado en el mapa y el panel (revisión del PR #294) */
const avisoLista = ref('')

async function asegura(l: Lesion) {
  if (cache[l] || cargandoL[l]) return
  cargandoL[l] = true
  delete errores[l]
  try { cache[l] = await cargaLesion(props.man, l, props.ejemplo) }
  catch (e) { errores[l] = String((e as Error)?.message ?? e) }
  finally { delete cargandoL[l] }
}
watch(lesion, (l) => asegura(l), { immediate: true })
watch(d, (x) => {
  if (!x) return
  // el gen activo, si ya está leído en esta biopsia, es el que se ve; si no, uno de reserva mientras se reabre (`listo`
  // es false hasta entonces). Un gen ya leído aquí (JSON o Zarr) se queda.
  const a = activo.value
  if (a && x.expr[a]) gen.value = a
  else if (!x.expr[gen.value]) gen.value = PANEL_INTERES.find((g) => x.genes.includes(g)) ?? x.genes[0]!
  // «Dos genes»: el segundo se compara con el gen pedido, no con la reserva (si no, se perdía la elección del usuario)
  const primero = a ?? gen.value
  if (!x.genes.includes(genB.value) || genB.value === primero) genB.value = x.genes.find((g) => g !== primero)!
})

const genesInteres = computed(() => (d.value ? PANEL_INTERES.filter((g) => d.value!.genes.includes(g)) : []))
const genesOtros = computed(() => (d.value ? d.value.genes.filter((g) => !PANEL_INTERES.includes(g)).sort() : []))
/** el gen activo ya está leído en ESTA biopsia. Al cambiar de biopsia, mientras se reabre, no: `gen` es entonces uno de
 * reserva, y el mapa y el detalle enseñaban ese con el chip nombrando el pedido (revisión del PR #294). Mientras tanto
 * el mapa va por grupo y el detalle dice que se está leyendo. */
const listo = computed(() => !activo.value || gen.value === activo.value)
const modoVista = computed(() => (listo.value ? modo.value : 'grupo'))
// Dos genes: el segundo gen nunca es el primero (al abrir TPBG salía «5T4 y 5T4»; revisión final, 18-oct). Con la
// reserva puesta mientras se reabre el gen activo, no: `gen` no es entonces el primer gen de verdad. Vigila también
// `listo`: puede pasar a true sin que `gen` cambie (✕ o reapertura fallida durante la lectura) y dejar «X y X». Va
// después de `listo`: un watch evalúa su fuente al crearse (antes de declararlo, el setup reventaba).
watch([gen, () => listo.value], ([g, ok]) => { if (ok && genB.value === g && d.value) genB.value = [...PANEL_INTERES.filter((x) => d.value!.genes.includes(x)), ...d.value.genes].find((x) => x !== g)! })
const filas = computed(() => (d.value ? porGrupo(d.value, gen.value) : []))
const etiquetasCx = computed(() => (d.value && listo.value ? coexpresion(d.value, gen.value, genB.value) : null))
const nombresCx = computed<Record<Coexp, string>>(() => ({
  ambos: L('Los dos', 'Both'), solo_a: L(`Solo ${PROT(gen.value)}`, `${PROT(gen.value)} only`), solo_b: L(`Solo ${PROT(genB.value)}`, `${PROT(genB.value)} only`), ninguno: L('Ninguno', 'Neither'),
}))
const PROT = (g: string) => nombreGen(g).split(' (')[0]!
const nTotal = computed(() => (d.value ? fmtN(d.value.n_celulas, props.lang) : ''))
/** células leídas antes del control de calidad (del fichero), si difieren de las que quedan */
const nLeidas = computed(() => { const n = (d.value?.qc as { n_inicial?: number } | undefined)?.n_inicial; return d.value && typeof n === 'number' && n > d.value.n_celulas ? fmtN(n, props.lang) : '' })
/** «Colorear por» en un desplegable: Gen y Dos genes solo con un gen activo */
const MODOS = computed(() => [
  { k: 'grupo', t: L('Grupo', 'Group'), off: false },
  { k: 'gen', t: activo.value ? L(`Gen: ${PROT(activo.value)}`, `Gene: ${PROT(activo.value)}`) : L('Gen (elige uno)', 'Gene (pick one)'), off: !activo.value },
  { k: 'coexp', t: L('Dos genes', 'Two genes'), off: !activo.value },
] as const)
const idCtl = useId()
const ej = computed(() => (props.ejemplo ? L(' · ejemplo', ' · example') : ''))

/* ── colores del mapa y su leyenda (paleta derivada de los tokens) ── */
const montado = ref(false)
onMounted(() => { montado.value = true })
const pal = computed(() => {
  void montado.value
  if (typeof window === 'undefined') return null
  const css = getComputedStyle(document.documentElement)
  return paleta(tema.value === 'oscuro' ? 'dark' : 'light', (v) => css.getPropertyValue(v))
})
const nombreSet = computed(() => ({ grupo: L('Grupo', 'Group'), coexp: L('Co-expresión', 'Co-expression'), gen: L(`Nivel de ${PROT(gen.value)}`, `${PROT(gen.value)} level`) }))
/** Gen elegido, como en Loupe: lo no detectado en gris y lo detectado por tramos de nivel, de claro a intenso.
 * Cortes = cuartiles del CP10k de las células donde se detecta (del fichero, nada a mano); la leyenda da el
 * rango y el n de cada tramo. Orden de dibujo: lo detectado encima de lo no detectado. */
const nivelGen = computed(() => {
  const x = d.value
  if (!x || modoVista.value !== 'gen') return null
  const col = columna(x, gen.value)
  const det = Array.from(col).filter((v) => v > 0).sort((a, b) => a - b)
  const q = (p: number) => det[Math.min(det.length - 1, Math.floor(p * det.length))]!
  const cortes = det.length >= 8 ? [...new Set([q(0.25), q(0.5), q(0.75)])].filter((c) => c < det[det.length - 1]!) : []
  const clase = (v: number) => (v <= 0 ? 0 : 1 + cortes.filter((c) => v > c).length)
  const clases = Array.from(col, clase)
  const lims = det.length ? [det[0]!, ...cortes, det[det.length - 1]!] : []
  // dos cifras significativas; si dos límites distintos redondean igual, se sube la precisión (dos tramos no pueden llamarse igual)
  let cifras = 2
  while (cifras < 6 && new Set(lims.map((v) => Number(v.toPrecision(cifras)))).size < new Set(lims).size) cifras++
  const f = (v: number) => { const t = String(Number(v.toPrecision(cifras))); return props.lang === 'en' ? t : t.replace('.', ',') }
  const nombres = [L('No detectado', 'Not detected'), ...lims.slice(0, -1).map((a, k) => (a === lims[k + 1] ? `${f(a)} CP10k` : `${f(a)}–${f(lims[k + 1]!)} CP10k`))]
  const orden = Array.from(col.keys()).sort((a, b) => clases[a]! - clases[b]! || a - b)
  return { clases, nombres, orden }
})
const conjuntos = computed(() => {
  const x = d.value
  if (!x) return []
  const c = [
    { nombre: nombreSet.value.grupo, columna: 'grupo', valores: x.celulas.grupo.map((k) => etiqueta(ETIQUETA_GRUPO, x.grupos[k]!.id, props.lang)) },
  ]
  if (modoVista.value === 'coexp' && etiquetasCx.value) c.push({ nombre: nombreSet.value.coexp, columna: 'coexp', valores: etiquetasCx.value.map((k) => nombresCx.value[k]) })
  const ng = nivelGen.value
  if (ng) c.push({ nombre: nombreSet.value.gen, columna: 'nivel', valores: ng.clases.map((k) => ng.nombres[k]!) })
  return c
})
/** Leyenda del modo activo: [etiqueta, color, n]. Es también la alternativa en texto de los colores. */
const leyenda = computed<{ etiqueta: string; rgb: RGB; n: number }[]>(() => {
  const x = d.value, p = pal.value
  if (!x || !p) return []
  if (modoVista.value === 'grupo') {
    // un tono propio por grupo de referencia: ninguna fila de la leyenda comparte color (diseño, 18-oct)
    const tonos = p.refs(x.grupos.filter((g) => g.rol !== 'interes' && g.rol !== 'otras').length)
    let r = 0
    return x.grupos.map((g) => ({ etiqueta: etiqueta(ETIQUETA_GRUPO, g.id, props.lang), n: g.n, rgb: g.rol === 'interes' ? p.interes : g.rol === 'otras' ? p.otras : tonos[r++]! }))
  }
  if (modoVista.value === 'coexp' && etiquetasCx.value) {
    const cx = etiquetasCx.value
    return (['ambos', 'solo_a', 'solo_b', 'ninguno'] as Coexp[]).map((c) => ({ etiqueta: nombresCx.value[c], n: cx.filter((v) => v === c).length, rgb: p.coexp[c] }))
  }
  const ng = nivelGen.value
  if (ng) {
    const m = ng.nombres.length - 1, tonos = p.nivel.slice(p.nivel.length - m)
    return ng.nombres.map((nm, k) => ({ etiqueta: nm, n: ng.clases.filter((c) => c === k).length, rgb: k === 0 ? p.cero : tonos[k - 1]! }))
  }
  return []
})
const colores = computed(() => {
  const set = colorearPor.value
  return leyenda.value.map((l) => ({ ruta: [set, l.etiqueta] as [string, string], rgb: l.rgb }))
})
const colorearPor = computed(() => (modoVista.value === 'coexp' ? nombreSet.value.coexp : modoVista.value === 'gen' ? nombreSet.value.gen : nombreSet.value.grupo))

/* ── nivel «todos los genes» (Zarr): solo si el manifiesto lo permite (publicar la matriz completa) ── */
const nivel = computed(() => nivelMatriz(props.man, props.ejemplo ? 'ejemplo' : 'real'))
const zcache = shallowReactive<Partial<Record<Lesion, ZarrLesion>>>({})
const z = computed(() => zcache[lesion.value] ?? null)
const busca = ref('')
const avisoBusca = ref('')
/** la matriz completa no abrió en ESA biopsia: el aviso queda fijo (abreGen no lo borra) y aparece la lista de reserva;
 * se reintenta al volver a la biopsia */
const avisosZarr = shallowReactive<Partial<Record<Lesion, string>>>({})
const avisoZarr = computed(() => avisosZarr[lesion.value] ?? '')
/** Cada apertura de gen lleva su turno, y gana la última que de verdad sustituye a la anterior (revisión del PR #294:
 * con una columna aún en camino, la ✕ se deshacía sola al llegar). El turno sube al quitar el gen, al cambiar de
 * biopsia y cuando una apertura pasa sus comprobaciones (va a leer su columna o se confirma); un intento que se rechaza
 * antes (gen que no existe o sin sonda) no deja obsoleta a la que estaba a medias. Una apertura obsoleta ya no toca la
 * selección, el foco ni los avisos. `leyendo` = turno que está leyendo una columna del Zarr (0, ninguno). */
const turno = ref(0)
const leyendo = ref(0)
const leyendoGen = computed(() => leyendo.value !== 0 && leyendo.value === turno.value)
watch(lesion, () => { turno.value++; avisoLista.value = '' }, { flush: 'sync' })
/** una apertura del Zarr en curso por biopsia: dos vigilancias a la vez no abren dos veces la misma matriz */
const abriendoZarr: Partial<Record<Lesion, Promise<void>>> = {}
function aseguraZarr(l: Lesion): Promise<void> {
  const x = cache[l]
  if (nivel.value !== 'todos' || zcache[l] || !x) return Promise.resolve()
  return (abriendoZarr[l] ??= (async () => {
    try { zcache[l] = await abreZarr(storeWeb(l), x.n_celulas, x.grupos.map((g) => g.id)); delete avisosZarr[l] }
    catch { avisosZarr[l] = L('No se ha podido abrir la matriz de todos los genes, así que el buscador no funciona. El resto de la página, sí.', 'The all-genes matrix could not be opened, so gene search is unavailable. The rest of the page works as usual.') }
    finally { delete abriendoZarr[l] }
  })())
}
/** Al cambiar de biopsia, el gen activo se vuelve a abrir en la otra (comparar hígado y hueso es tarea del médico), en
 * silencio: solo vuelve a poner el gen. El detalle, la pestaña, el color, el scroll y el foco quedan como el usuario los
 * tenga (revisión del PR #294: al llegar la columna, el detalle se reabría solo y se llevaba el foco). Si el gen no se
 * puede abrir en esta biopsia, se quita y se dice por qué (antes quedaba el del hígado con otro nombre en el chip). */
async function reabreActivo(abreDetalle = false) {
  const x = d.value, a = activo.value, l = lesion.value
  if (!x || !a) return
  // como antes, el detalle del gen activo se abre en la otra biopsia, pero YA, al cambiar, y sin mover el foco: lo que el
  // usuario haga mientras se lee («Volver», otra pestaña) se respeta al llegar la columna
  if (abreDetalle && !detalle.value) {
    const p = panelConScroll()
    if (p) scrollLista = p.scrollTop
    origenDetalle = panel.value
    detalle.value = true
    void nextTick(() => { if (p) p.scrollTop = 0 })
  }
  if (x.expr[a]) { gen.value = a; return }              // su columna ya está aquí (una lectura anterior la dejó)
  const t0 = turno.value
  await aseguraZarr(l)
  // otra acción por medio (biopsia, ✕ u otro gen): se encarga ella
  if (lesion.value !== l || turno.value !== t0 || activo.value !== a || d.value !== x) return
  // y fuera también de la URL: si no, cada recarga lo volvería a intentar
  if ((await abreGen(a, 'busca', { reabre: true })) === false) quitaPorUrl()
}
/** El gen que pide la URL (al cargar, con Atrás o Adelante, o un enlace): después de la matriz, que un gen buscado puede
 * no estar en el JSON. Con otra acción por medio, se encarga ella; si no se abre, fuera de la URL con su aviso. */
async function abreDeUrl(g: string) {
  const x = d.value, l = lesion.value, t0 = turno.value
  await aseguraZarr(l)
  if (lesion.value !== l || d.value !== x || turno.value !== t0) return
  if ((await abreGen(g, panel.value, { historial: 'replace' })) === false) quitaPorUrl()
}
watch(d, (x) => {
  if (x) void aseguraZarr(lesion.value)
  // al cargar (o al cambiar de biopsia desde la URL) se abre el gen de la URL; si no, el activo se reabre en la nueva biopsia
  if (x && genPendiente) { const g = genPendiente; genPendiente = null; void abreDeUrl(g); return }
  void reabreActivo(true)
}, { immediate: true })
/** nombre de proteína → símbolo (HER2 → ERBB2): la página usa los nombres de proteína y un oncólogo buscará por ellos */
/** sin guiones, puntos ni espacios: «Ki-67» y «KI67» buscan lo mismo (diseño, 18-oct) */
const norm = (t: string) => t.toUpperCase().replace(/[-\s.]/g, '')
const ALIAS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ALIAS_BUSCA).map(([p, g]) => [norm(p), g])),
  ...Object.fromEntries(Object.entries(PROTEINA).map(([g, p]) => [norm(p), g])),
}
const sugerencias = computed(() => {
  const q = norm(busca.value.trim())
  const zl = z.value
  if (!zl || q.length < 2) return []
  const porAlias = Object.entries(ALIAS).filter(([p]) => p.startsWith(q)).map(([, g]) => g).filter((g) => zl.tiene(g))
  const porPrefijo = zl.genes.filter((g) => norm(g).startsWith(q))
  // sin coincidencias por el principio, por «contiene» (KI67 → MKI67)
  const porContiene = porAlias.length || porPrefijo.length ? [] : zl.genes.filter((g) => norm(g).includes(q))
  return [...new Set([...porAlias, ...porPrefijo, ...porContiene])].slice(0, 12)
})
/** ¿Se puede abrir este gen en el mapa y los violines? Los del JSON siempre; con el Zarr, cualquiera con sonda. */
const abrible = (g: string) => !!d.value?.expr[g] || (!!z.value && z.value.tiene(g) && !z.value.sinSonda.has(g))
/** Abre cualquier gen: si no está en el JSON, lee su columna del Zarr y la añade a los datos de la lesión. */
/** de dónde se abrió el gen: «Volver» devuelve el foco a ese gen en esa lista, o al buscador (WCAG 2.4.3; revisión final,
 * 18-oct: caía en <body>). Por el origen y no por el foco previo: Safari no enfoca un botón al pulsarlo. */
let origenDetalle: 'busca' | 'lista' | 'marcadores' | 'interes' = 'busca'
type Origen = 'busca' | 'lista' | 'marcadores' | 'interes' | 'tabla'
/** Abre un gen. true: abierto · false: no se pudo (con su aviso) · null: obsoleta (otra acción la adelantó), sin tocar nada.
 * `reabre`: la reapertura silenciosa al cambiar de biopsia (solo pone el gen). `revela`: abierto desde la lista del panel;
 * si el principio del detalle quedó por encima de la pantalla, se sube hasta él. Desde la tabla de «Más análisis» ni la
 * página ni el foco se mueven: su aviso dice «más arriba» y ofrece «Ver el mapa». `historial`: «push» si lo abre el lector
 * (Atrás vuelve a donde estaba); «replace» si lo abre la URL (navegación, 19-oct). */
async function abreGen(g: string, origen: Origen = 'busca', { reabre = false, revela = false, historial = 'push' as 'push' | 'replace' } = {}): Promise<boolean | null> {
  g = ALIAS[norm(g)] ?? z.value?.genes.find((x) => norm(x) === norm(g)) ?? g
  const x = d.value
  if (!reabre) avisoBusca.value = ''
  if (!x) return false
  let yo = 0
  const vigente = () => yo === turno.value && d.value === x
  if (!x.expr[g]) {
    const zl = z.value
    if (!zl && avisoZarr.value) {
      avisoBusca.value = L(`${g} no se puede abrir en esta biopsia: su lista de genes no ha cargado.`, `${g} cannot be opened in this biopsy: its gene list did not load.`)
      return false
    }
    if (!zl || !zl.tiene(g)) {
      avisoBusca.value = L(`No hay ningún gen «${g}» en estos datos. Prueba con el símbolo oficial del gen (como MKI67). Si es correcto, el panel no lo mide o lo lista con otro nombre; que no se mida no quiere decir que no se exprese.`, `There is no gene “${g}” in these data. Try the official gene symbol (such as MKI67). If it is right, the panel does not measure it or lists it under another name; not being measured does not mean it is not expressed.`)
      return false
    }
    if (zl.sinSonda.has(g)) {
      avisoBusca.value = L(`${g} no está en el panel, así que no se mide. Eso no quiere decir que no se exprese.`, `${g} is not in this panel, so it is not measured. That does not mean it is not expressed.`)
      return false
    }
    yo = ++turno.value                                 // pasa las comprobaciones: ahora sí sustituye a la de antes
    leyendo.value = yo
    try {
      // la columna es de ESTA biopsia (x y zl son suyos): se guarda aunque la apertura quede obsoleta, como caché
      const col = await zl.columna(g)
      const i: number[] = [], v: number[] = []
      col.forEach((val, k) => { if (val > 0) { i.push(k); v.push(val) } })
      x.expr[g] = { i, v }
      x.suelo[g] = zl.sueloDe(g)
      x.referencia[g] = zl.refDe(g)
      x.sondas[g] = zl.sondasDe(g)
      if (!x.veredicto[g]) x.veredicto[g] = 'sin_veredicto'
    }
    catch {
      if (!vigente()) return null
      avisoBusca.value = L(`No se ha podido leer ${g}. Vuelve a intentarlo.`, `${g} could not be read. Try again.`)
      // esta apertura dejó obsoleta la reapertura del gen activo: que vuelva a intentarse (si no, «Leyendo…» para siempre)
      if (!reabre) void reabreActivo()
      return false
    }
    finally { if (leyendo.value === yo) leyendo.value = 0 }
    if (!vigente()) return null
  }
  else yo = ++turno.value
  // la tabla como ancla: se mide antes del cambio y se compensa después; mientras, sin el anclaje del navegador (Chrome)
  // para que no se compense dos veces
  const ancla = origen === 'tabla' && !reabre ? document.getElementById('exp-genes') : null
  const y0 = ancla?.getBoundingClientRect().top ?? 0
  const sinAnclaje = ancla ? [document.documentElement, document.body] : []
  sinAnclaje.forEach((e) => { e.style.overflowAnchor = 'none' })
  const compensa = () => {
    try {
      const dy = (ancla?.getBoundingClientRect().top ?? y0) - y0
      if (ancla && Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: 'instant' as ScrollBehavior })
    }
    finally { requestAnimationFrame(() => sinAnclaje.forEach((e) => { e.style.overflowAnchor = '' })) }
  }
  gen.value = g
  activo.value = g
  if (reabre) return true
  busca.value = ''
  aviso.value = ''
  avisoLista.value = origen === 'lista'
    ? (errorMapa.value ? L(`Mostrando ${nombreGen(g)} en el panel, grupo a grupo.`, `Showing ${nombreGen(g)} in the panel, group by group.`)
      : L(`Mostrando ${nombreGen(g)} en el mapa y en el panel, grupo a grupo.`, `Showing ${nombreGen(g)} on the map and in the panel, group by group.`))
    : ''
  if (origen === 'marcadores' || origen === 'interes' || origen === 'tabla') panel.value = origen === 'tabla' ? 'interes' : origen   // «Volver» regresa a esa pestaña
  origenDetalle = origen === 'tabla' ? 'interes' : origen
  // el panel de escritorio tiene scroll propio: se guarda dónde estaba la lista para devolverla ahí al volver
  const p = panelConScroll()
  if (p && !detalle.value) scrollLista = p.scrollTop
  detalle.value = true
  pintaGen()
  escribeUrl(historial)
  void nextTick(() => {
    // el detalle empieza arriba del panel (abierto desde abajo de una lista larga, «Volver» y el título quedaban fuera)
    if (p) p.scrollTop = 0
    // desde la tabla, la página no se mueve: lo que cambia encima (leyenda del mapa, panel) se compensa aquí, también en
    // los navegadores sin anclaje del scroll (Safari); desde la lista de reserva el foco se queda en ella: cada cambio
    // del <select> abre un gen y, con el foco fuera, con teclado no se podía recorrer (WCAG 3.2.2)
    if (origen === 'tabla') { compensa(); return }
    if (origen === 'lista') return
    const v = document.getElementById('exp-violines')
    // en estrecho no hay scroll propio: si el principio del detalle quedó por encima de la pantalla, se sube hasta él
    if (revela) aLaVista(v?.querySelector<HTMLElement>('.exp__dcab'), true)
    v?.focus({ preventScroll: true })
  })
  return true
}
/** el estado a la URL: el gen activo con su biopsia; sin gen, la biopsia solo si no es la de llegada. Si ya coincide, nada. */
function escribeUrl(modo: 'push' | 'replace') {
  const ahora = ruta().query, q = { ...ahora }
  delete q.gen; delete q.biopsia
  if (activo.value) Object.assign(q, { gen: activo.value, biopsia: lesion.value })
  else if (lesion.value !== LESION_0) q.biopsia = lesion.value
  if (q.gen === ahora.gen && q.biopsia === ahora.biopsia) return
  void (modo === 'push' ? router.push({ query: q }) : router.replace({ query: q })).catch(() => {})
}
/** la URL pedía un gen que aquí no se abre: fuera el gen (con su aviso) y fuera de la URL */
function quitaPorUrl() {
  const aviso = avisoBusca.value
  quitaGen(false)
  avisoBusca.value = aviso
  escribeUrl('replace')
}
/** URL → estado: Atrás, Adelante o un enlace dentro de la misma página. Lo que escribe escribeUrl ya coincide y no hace nada. */
watch(() => [ruta().query.gen, ruta().query.biopsia], () => {
  const l = lesionDe(ruta().query), g = genDe(ruta().query)
  if (l !== lesion.value) {
    // el watch(d) abre el gen en la nueva biopsia; sin gen en la URL, se quita antes
    genPendiente = g
    if (!g) quitaGen(false)
    lesion.value = l
    return
  }
  if (g === activo.value || (g && g === genPendiente)) return
  genPendiente = null
  if (!g) { quitaGen(false); return }
  // sin datos todavía, lo abre el watch(d) al llegar; con datos, después de la matriz (un gen buscado puede no estar en el JSON)
  if (!d.value) { genPendiente = g; return }
  void abreDeUrl(g)
})
function ponLesion(l: Lesion) {
  if (l === lesion.value) return
  lesion.value = l
  escribeUrl('replace')
}
function cierraDetalle() {
  detalle.value = false
  void nextTick(() => {
    const p = panelConScroll()
    const g = activo.value ?? gen.value
    const enLista = origenDetalle === 'marcadores' || origenDetalle === 'interes'
    const fila = enLista ? raiz.value?.querySelector<HTMLElement>(origenDetalle === 'marcadores' ? `.mk__gen[data-gen="${g}"]` : `.gin__gen[data-gen="${g}"]`) : null
    const control = enLista ? null : controlDeVuelta()
    const el = fila ?? control ?? document.getElementById(`${idCtl}-tab-${panel.value}`)
    // la lista vuelve a donde estaba si su fila sigue ahí; si no (p. ej. tras cambiar de biopsia), arriba
    if (p) p.scrollTop = fila ? scrollLista : 0
    // primero a la vista y luego el foco: con el foco antes, `sinTapar` movía la página entera por un elemento que solo
    // tapaba el scroll del panel (revisión del PR #294, «Volver» con teclado)
    if (!control) aLaVista(el)
    el?.focus({ preventScroll: true })
  })
}
/** El buscador (o la lista de reserva) para devolverle el foco al volver: habilitado, a la vista y, el buscador, fuera de
 * táctil (le saldría el teclado). Si no, null y el foco va a la pestaña del panel (revisión del PR #294). */
function controlDeVuelta(): HTMLElement | null {
  const c = document.getElementById(origenDetalle === 'lista' ? `${idCtl}-gen` : `${idCtl}-busca`) as HTMLInputElement | HTMLSelectElement | null
  if (!c || c.disabled || (origenDetalle === 'busca' && tactil.value)) return null
  const r = c.getBoundingClientRect()
  return r.height > 0 && r.top >= altoCabecera.value + altoBanner.value && r.bottom <= window.innerHeight ? c : null
}
/* ── scroll del panel (revisión del PR #294) ── */
const panelEl = ref<HTMLElement | null>(null)
let scrollLista = 0
/** el panel, si hace scroll por su cuenta (escritorio: sticky con overflow); en estrecho, null */
function panelConScroll(): HTMLElement | null {
  const p = panelEl.value
  return p && getComputedStyle(p).overflowY !== 'visible' ? p : null
}
/** Lleva `el` a la vista lo justo: primero dentro del panel con scroll propio, luego en la ventana, bajo la cabecera y el
 * aviso fijos. `soloArriba`: solo si quedó por encima (no se baja la página a buscarlo). */
function aLaVista(el: HTMLElement | null | undefined, soloArriba = false) {
  if (!el) return
  const p = panelConScroll()
  if (p?.contains(el)) {
    const pr = p.getBoundingClientRect(), r = el.getBoundingClientRect()
    if (r.top < pr.top) p.scrollTop -= pr.top - r.top + 8
    else if (!soloArriba && r.bottom > pr.bottom) p.scrollTop += r.bottom - pr.bottom + 8
  }
  const tope = altoCabecera.value + altoBanner.value + 16
  const r = el.getBoundingClientRect()
  if (r.top < tope) window.scrollBy({ top: r.top - tope, behavior: 'instant' as ScrollBehavior })
  else if (!soloArriba && r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 16, behavior: 'instant' as ScrollBehavior })
}
/** pestañas del panel (patrón tablist: flechas para moverse; diseño, 18-oct: parecían chips) */
const PESTANAS = computed(() => [{ k: 'interes' as const, t: L('Genes de interés', 'Genes of interest') }, { k: 'marcadores' as const, t: L('Marcadores', 'Markers') }])
function ponPestana(k: 'interes' | 'marcadores') { panel.value = k; detalle.value = false }
function teclaPestana(ev: KeyboardEvent) {
  if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'Home' && ev.key !== 'End') return
  ev.preventDefault()
  const k = ev.key === 'Home' ? 'interes' : ev.key === 'End' ? 'marcadores' : panel.value === 'interes' ? 'marcadores' : 'interes'
  ponPestana(k)
  void nextTick(() => document.getElementById(`${idCtl}-tab-${k}`)?.focus())
}
/** ✕ del gen activo: el mapa vuelve a los grupos y el panel a su lista */
function quitaGen(enfocar = true) {
  turno.value++                                        // una apertura a medias ya no vuelve a poner el gen
  activo.value = null
  aviso.value = ''
  avisoLista.value = ''
  detalle.value = false
  if (modo.value === 'gen' || modo.value === 'coexp') modo.value = 'grupo'
  if (enfocar) void nextTick(() => document.getElementById(`${idCtl}-busca`)?.focus({ preventScroll: true }))
}
/** ✕ del chip: si el paso anterior del historial es esta misma página sin gen (el gen se abrió aquí), se vuelve a él;
 * reemplazar dejaría dos pasos iguales y el siguiente Atrás no haría nada */
function quitaDesdeChip() {
  quitaGen()
  const atras = (window.history.state as { back?: string | null } | null)?.back
  const prev = atras ? router.resolve(atras) : null
  if (prev && prev.path === ruta().path && !prev.query.gen && lesionDe(prev.query) === lesion.value && prev.query.demo === ruta().query.demo) router.back()
  else escribeUrl('replace')
}
/** lectura del gen abierto: la de la revisión si está en ella; si llegó por el buscador y no está, se dice (comité
 * médico, 18-oct: por el buscador se veían las cifras de TROP2 sin su «No se sostiene») */
/** gen al que se llega por un nombre clínico (ER, Ki-67, PD-L1…): su % se confunde con el índice de IHQ (comité médico) */
const aliasClinico = computed(() => NOMBRE_CLINICO[gen.value]?.[props.lang] ?? '')
const lecturaDetalle = computed(() => {
  const x = d.value
  if (!x) return ''
  if (!x.genes.includes(gen.value)) return L('Este gen no está en la revisión: no tiene lectura.', 'This gene is not in the review: it has no reading.')
  return (ETIQUETA_VEREDICTO[x.veredicto[gen.value] ?? 'sin_veredicto'] ?? ETIQUETA_VEREDICTO.sin_veredicto!)[props.lang]
})
/** La otra biopsia en el detalle del gen (19-oct): comparar hígado y hueso sin memorizar cifras. La cifra del grupo de
 * interés de la otra biopsia, con su suelo, su referencia y su lectura: las mismas funciones y el mismo fichero que su
 * lista de llegada (CelulaExplorarInteres), nada escrito a mano. Solo genes de la revisión que están en los dos ficheros
 * (un gen buscado fuera de ella no tiene lectura). Viaja sin el aviso de su biopsia, así que lleva lo que ese aviso
 * decía: el grupo y su n, «un subconjunto» en el hígado, la cifra sin circularidad primero (loo, FGFR1 y ESR1 del hígado),
 * la circularidad de grupo y el ADN del suelo en el hueso, y las etiquetas de su lista (IHQ de HER2 de esa biopsia, nota
 * de HER3 del hígado; diseño, 19-oct). Se pide aparte: asegura() pondría el «Cargando…» de toda la página. Si no carga, no hay línea. */
const otraLesion = computed(() => props.man.lesiones.find((l) => l !== lesion.value) ?? null)
watch([() => !!(detalle.value && activo.value), otraLesion], ([abierto, l]) => { if (abierto && l && !cache[l]) void asegura(l) }, { immediate: true })
const otra = computed(() => {
  const l = otraLesion.value, o = l ? cache[l] : undefined, g = gen.value
  // mientras el gen activo se reabre en esta biopsia, `gen` es uno de reserva: sin línea (no hay detalle con cifras)
  if (!listo.value || !l || !o || !d.value?.genes.includes(g) || !o.genes.includes(g)) return null
  const gi = o.grupos.find((x) => x.rol === 'interes')
  const f = porGrupo(o, g).find((x) => x.rol === 'interes')
  if (!gi || !f) return null
  const [det, suelo] = fmtParSuelo(f.frac, f.suelo, props.lang)
  const marca = f.frac >= 0.9 && f.suelo >= 0.9 ? L('en casi todas las células: cuenta el nivel', 'in almost every cell: the level is what counts') : f.frac <= f.suelo ? L('no supera el suelo', 'does not clear the floor') : ''
  return {
    l, det, suelo, marca, ref: fmtPct(o.referencia[g] ?? 0, props.lang), circular: !!o.seleccion[g], loo: o.seleccion[g] ? (o.loo?.[g] ?? null) : null,
    grupo: etiqueta(ETIQUETA_GRUPO, gi.id, props.lang), n: fmtN(gi.n, props.lang),
    lec: (ETIQUETA_VEREDICTO[o.veredicto[g] ?? 'sin_veredicto'] ?? ETIQUETA_VEREDICTO.sin_veredicto!)[props.lang],
  }
})
/** abre «Más análisis» y lleva la tabla completa de genes de interés a la vista */
function abreTabla() {
  if (masAnalisis.value) masAnalisis.value.open = true
  void nextTick(() => {
    const b = document.getElementById('exp-genes')
    b?.scrollIntoView({ block: 'start' })
    // el foco va con la tabla: se quedaba en el enlace del panel, que se va de la pantalla (revisión del PR #294)
    b?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  })
}

/** Elegir un gen (buscador, marcadores o tabla) lo pinta también en el mapa: sin esto el mapa seguía coloreado por
 * grupo y el aviso «está ahora en el mapa» era falso (pase de voz, 18-oct). En co-expresión el gen ya es el gen A. */
function pintaGen() { if (modo.value !== 'coexp') modo.value = 'gen' }
/** «Ver el mapa»: lleva el mapa a la vista (en estrecho queda encima del panel). Sin salto automático: lo pide el lector. */
function irAlMapa() {
  const quieto = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  raiz.value?.querySelector('.exp__mapacol')?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' })
}

/** Elegir un gen desde la tabla: los violines y el mapa cambian arriba, y se anuncia. */
async function elegirDesdeTabla(g: string) {
  if ((await abreGen(g, 'tabla')) !== true) return     // no abierto u obsoleto: no se anuncia nada falso
  aviso.value = errorMapa.value
    ? L(`Mostrando ${nombreGen(g)} en los violines, más arriba.`, `Showing ${nombreGen(g)} in the violins, further up.`)
    : L(`Mostrando ${nombreGen(g)} en el mapa y en los violines, más arriba.`, `Showing ${nombreGen(g)} on the map and in the violins, further up.`)
}

/** Hueso: células de «Otras» sin GEM limpio (sin número de copias), y cuántas son de un tipo con grupo propio
 * (verificacion, 18-oct: 137 de tipos de referencia están en «Otras» solo por el GEM). Calculado del fichero. */
const otrasGem = computed(() => {
  const x = d.value
  if (!x || x.lesion !== 'hueso' || !('valores' in x.cnv) || !x.cnv.valores.length) return null
  const v0 = x.cnv.valores[0]!, ids = new Set(x.grupos.map((g) => g.id))
  let cuenta = 0, deTipo = 0
  v0.forEach((v, i) => {
    if (v != null || x.grupos[x.celulas.grupo[i]!]?.id !== 'otras') return
    cuenta++
    if (ids.has(x.tipos[x.celulas.tipo[i]!]!)) deTipo++
  })
  return cuenta ? { n: cuenta, deTipo } : null
})

/* ── el aviso del hígado queda fijo bajo la cabecera del sitio (sticky y de alto variable) ── */
const raiz = ref<HTMLElement | null>(null)
const altoCabecera = ref(0)
let ro: ResizeObserver | null = null
/** el aviso del hígado (sticky) también ocupa arriba: el panel pegado se coloca DEBAJO de él (diseño, 18-oct: lo tapaba) */
const bannerEl = ref<HTMLElement | null>(null)
const altoBanner = ref(0)
let roB: ResizeObserver | null = null
watch(bannerEl, (el) => {
  roB?.disconnect(); roB = null
  if (!el) { altoBanner.value = 0; return }
  const mide = () => { altoBanner.value = Math.ceil(el.getBoundingClientRect().height) }
  mide()
  roB = new ResizeObserver(mide)
  roB.observe(el)
})
onMounted(() => {
  const cab = document.querySelector<HTMLElement>('[data-cabecera-fija]')
  if (!cab) return
  const mide = () => { altoCabecera.value = Math.ceil(cab.getBoundingClientRect().height) }
  mide()
  ro = new ResizeObserver(mide)
  ro.observe(cab)
})
onBeforeUnmount(() => { ro?.disconnect(); roB?.disconnect() })
/** WCAG 2.4.11: el foco no puede quedar tapado por la cabecera ni por el aviso fijo. */
function sinTapar(ev: FocusEvent) {
  const el = ev.target as HTMLElement
  if (!el?.matches?.(':focus-visible')) return
  // dentro del panel con scroll propio, primero el panel; el tope es el del panel pegado (revisión del PR #294)
  aLaVista(el, true)
}
</script>

<template>
  <section ref="raiz" class="exp" :data-tema="tema === 'oscuro' ? 'oscuro' : undefined" :style="{ '--exp-top': `${altoCabecera + 8}px`, '--exp-banner': `${altoBanner}px` }"
           :aria-label="L('Explorador de datos', 'Data explorer')" @focusin="sinTapar">
    <div v-if="ejemplo" class="exp__demo" role="note">
      <strong>{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</strong>
      {{ L('Todo lo que ves aquí es sintético y solo sirve para enseñar cómo funciona la página. No son datos de Miriam.', 'Everything here is synthetic and only shows how the page works. None of it is Miriam’s data.') }}
    </div>

    <!-- arriba solo dos cosas: la biopsia y el gen (una sola puerta) -->
    <div class="exp__ctl" role="group" :aria-label="L('Controles del explorador', 'Explorer controls')">
      <div class="exp__campo">
        <span :id="`${idCtl}-les`" class="exp__eti">{{ L('Biopsia', 'Biopsy') }}</span>
        <div class="exp__seg" role="group" :aria-labelledby="`${idCtl}-les`">
          <button v-for="l in man.lesiones" :key="l" type="button" class="exp__btn" :aria-pressed="lesion === l" @click="ponLesion(l)">{{ etiqueta(ETIQUETA_LESION, l, lang) }}</button>
        </div>
      </div>
      <div v-if="d && nivel === 'todos'" class="exp__campo exp__busca">
        <label :for="`${idCtl}-busca`" class="exp__eti">{{ z ? L(`Buscar un gen entre los ${fmtN(z.genes.length, lang)}`, `Search a gene among the ${fmtN(z.genes.length, lang)}`) : L('Buscar un gen', 'Search for a gene') }}</label>
        <div class="exp__buscafila">
          <input :id="`${idCtl}-busca`" v-model="busca" class="exp__sel exp__sel--busca" type="search" autocomplete="off" spellcheck="false" :disabled="!z"
                 :placeholder="z ? L('Gen, p. ej. MKI67 o HER2', 'Gene, e.g. MKI67 or HER2') : avisoZarr ? L('Buscador no disponible', 'Search unavailable') : L('Cargando la lista de genes…', 'Loading the gene list…')" @keydown.enter.prevent="busca.trim() && abreGen(sugerencias[0] ?? busca.trim().toUpperCase())" />
          <span v-if="activo" class="exp__chip">
            <span class="exp__chipt">{{ nombreGen(activo) }}</span>
            <button type="button" class="exp__chipx" :aria-label="errorMapa ? L(`Quitar ${nombreGen(activo)}`, `Remove ${nombreGen(activo)}`) : L(`Quitar ${nombreGen(activo)} del mapa`, `Remove ${nombreGen(activo)} from the map`)" @click="quitaDesdeChip">
              <svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z" /></svg>
            </button>
          </span>
        </div>
        <p class="sr-only" aria-live="polite">{{ busca.trim().length >= 2 && z ? (sugerencias.length === 0 ? L('Ningún gen coincide', 'No matching genes') : sugerencias.length === 1 ? L('1 gen coincide', '1 matching gene') : L(`Se muestran ${sugerencias.length} genes que coinciden`, `Showing ${sugerencias.length} matching genes`)) : '' }}</p>
        <ul v-if="sugerencias.length" class="exp__sug" :aria-label="L('Genes que coinciden', 'Matching genes')">
          <li v-for="g in sugerencias" :key="g"><button type="button" class="exp__btn exp__btn--sm" :data-gen="g" @click="abreGen(g)">{{ PROTEINA[g] ? nombreGen(g) : g }}</button></li>
        </ul>
        <p v-if="leyendoGen" class="exp__nota" role="status">{{ L('Leyendo el gen…', 'Reading the gene…') }}</p>
        <p class="exp__nota exp__nota--busca" role="status"><template v-if="avisoBusca">{{ avisoBusca }}</template></p>
        <p v-if="avisoZarr" class="exp__nota" role="alert">{{ avisoZarr }}</p>
      </div>
      <!-- sin la matriz completa (o si no abre), el único selector de gen es esta lista -->
      <div v-if="d && (nivel !== 'todos' || avisoZarr)" class="exp__campo">
        <label :for="`${idCtl}-gen`" class="exp__eti">{{ L('Lista de genes', 'Gene list') }}</label>
        <select :id="`${idCtl}-gen`" class="exp__sel" :value="activo ?? ''" @change="abreGen(($event.target as HTMLSelectElement).value, 'lista')">
          <option value="" disabled>{{ L('Elige un gen', 'Pick a gene') }}</option>
          <optgroup :label="L('Genes de interés', 'Genes of interest')">
            <option v-for="g in genesInteres" :key="g" :value="g">{{ nombreGen(g) }}</option>
          </optgroup>
          <optgroup :label="L('Otros genes', 'Other genes')">
            <option v-for="g in genesOtros" :key="g" :value="g">{{ g }}</option>
          </optgroup>
        </select>
        <p class="sr-only" role="status">{{ avisoLista }}</p>
      </div>
    </div>

    <template v-if="lesion === 'higado'">
      <div class="exp__bannerfijo">
        <div ref="bannerEl" class="exp__banner" role="note">
          <svg class="exp__ico" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M240.26 186.1 152.81 34.23a28.74 28.74 0 0 0-49.62 0L15.74 186.1a27.45 27.45 0 0 0 0 27.71A28.31 28.31 0 0 0 40.55 228h174.9a28.31 28.31 0 0 0 24.79-14.19 27.45 27.45 0 0 0 .02-27.71ZM120 104a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0Zm8 88a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z" /></svg>
          <p><strong>{{ L('Hígado: tumor frente a hepatocito no está resuelto célula a célula.', 'Liver: tumor versus hepatocyte is not resolved cell by cell.') }}</strong>
            <span class="exp__banner-2">{{ ' ' + L('«Luminal de alta confianza» es un subconjunto, no el tumor entero; «Hepatocitos» y «Otras» también pueden incluir células tumorales.', '“High-confidence luminal” is a subset, not the whole tumor; “Hepatocytes” and “Other” may also include tumor cells.') }}</span>
            <button type="button" class="exp__mas" :aria-expanded="masHigado" @click="masHigado = !masHigado">{{ masHigado ? L('Menos', 'Less') : L('Más', 'More') }}</button></p>
        </div>
      </div>
      <!-- estrecho (diseño, 18-oct): fijo, solo el titular (con la frase dentro tapaba filas y «Volver»); la frase va aquí, a
           la vista al llegar y antes de cualquier cifra -->
      <p class="exp__banner-sig">{{ L('«Luminal de alta confianza» es un subconjunto, no el tumor entero; «Hepatocitos» y «Otras» también pueden incluir células tumorales.', '“High-confidence luminal” is a subset, not the whole tumor; “Hepatocytes” and “Other” may also include tumor cells.') }}</p>
      <p v-if="masHigado" class="exp__nota exp__nota--banner">
        {{ L('Las cifras del grupo «Luminal de alta confianza» no son «% de células tumorales». El tipo se asigna por clúster: una célula tumoral caída en un clúster de hepatocitos cuenta como hepatocito y queda fuera del grupo de interés, y «Otras, sin asignar a un grupo» también puede incluir células tumorales.',
          'The figures of the “High-confidence luminal” group are not “% of tumor cells”. Type is assigned per cluster: a tumor cell falling in a hepatocyte cluster counts as hepatocyte and stays out of the group of interest, and “Other, not assigned to a group” may also include tumor cells.') }}
      </p>
    </template>

    <p v-if="cargando" class="exp__estado" role="status">{{ L('Cargando los datos…', 'Loading the data…') }}</p>
    <div v-else-if="error" class="exp__estado exp__estado--error" role="alert">
      <p>{{ L('No se han podido cargar los datos de esta biopsia. Para no enseñar datos a medias, no se muestra nada.', 'The data for this biopsy could not be loaded. To avoid showing partial data, nothing is shown.') }}</p>
      <p class="exp__det">{{ L('Detalle técnico:', 'Technical detail:') }} {{ error }}</p>
    </div>

    <template v-else-if="d">
      <!-- el simulador: mapa grande y, al lado (debajo en estrecho), el panel -->
      <div class="exp__sim" :class="{ 'exp__sim--sinmapa': errorMapa }">
        <div class="exp__mapacol">
          <h2 class="sr-only">{{ L('Mapa de células', 'Cell map') }}{{ ej }}</h2>
          <div v-if="!errorMapa" class="exp__mapabar" :class="{ 'exp__mapabar--dos': modoVista === 'coexp' }">
            <div class="exp__campo exp__campo--fila">
              <label :for="`${idCtl}-modo`" class="exp__eti">{{ L('Colorear por', 'Color by') }}</label>
              <select :id="`${idCtl}-modo`" v-model="modo" class="exp__sel exp__sel--sm">
                <option v-for="m in MODOS" :key="m.k" :value="m.k" :disabled="m.off">{{ m.t }}</option>
              </select>
            </div>
            <div v-if="modoVista === 'coexp'" class="exp__campo exp__campo--fila">
              <label :for="`${idCtl}-genb-mapa`" class="exp__eti">{{ L(`${PROT(gen)} con`, `${PROT(gen)} with`) }}</label>
              <select :id="`${idCtl}-genb-mapa`" v-model="genB" class="exp__sel exp__sel--sm">
                <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
              </select>
            </div>
            <button type="button" class="exp__tema" :aria-label="tema === 'oscuro' ? L('Fondo claro', 'Light background') : L('Fondo oscuro', 'Dark background')" :title="tema === 'oscuro' ? L('Fondo claro', 'Light background') : L('Fondo oscuro', 'Dark background')" @click="tema = tema === 'oscuro' ? 'claro' : 'oscuro'">
              <svg v-if="tema === 'oscuro'" viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M120 40V16a8 8 0 0 1 16 0v24a8 8 0 0 1-16 0Zm72 88a64 64 0 1 1-64-64 64.07 64.07 0 0 1 64 64Zm-16 0a48 48 0 1 0-48 48 48.05 48.05 0 0 0 48-48ZM58.34 69.66a8 8 0 0 0 11.32-11.32l-16-16a8 8 0 0 0-11.32 11.32Zm0 116.68-16 16a8 8 0 0 0 11.32 11.32l16-16a8 8 0 0 0-11.32-11.32ZM192 72a8 8 0 0 0 5.66-2.34l16-16a8 8 0 0 0-11.32-11.32l-16 16A8 8 0 0 0 192 72Zm5.66 114.34a8 8 0 0 0-11.32 11.32l16 16a8 8 0 0 0 11.32-11.32ZM48 128a8 8 0 0 0-8-8H16a8 8 0 0 0 0 16h24a8 8 0 0 0 8-8Zm80 80a8 8 0 0 0-8 8v24a8 8 0 0 0 16 0v-24a8 8 0 0 0-8-8Zm112-88h-24a8 8 0 0 0 0 16h24a8 8 0 0 0 0-16Z" /></svg>
              <svg v-else viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M233.54 142.23a8 8 0 0 0-8-2 88.08 88.08 0 0 1-109.8-109.8 8 8 0 0 0-10-10 104.84 104.84 0 0 0-52.91 37A104 104 0 0 0 136 224a103.09 103.09 0 0 0 62.52-20.88 104.84 104.84 0 0 0 37-52.91 8 8 0 0 0-1.98-7.98Zm-44.64 48.11A88 88 0 0 1 65.66 67.11a89 89 0 0 1 31.4-26A106 106 0 0 0 96 56a104.11 104.11 0 0 0 104 104 106 106 0 0 0 14.92-1.06 89 89 0 0 1-26.02 31.4Z" /></svg>
            </button>
          </div>
          <p v-if="!errorMapa && !listo && activo" class="exp__nota exp__leyendo" role="status">{{ L(`Leyendo ${nombreGen(activo)} en esta biopsia; mientras, el mapa va por grupo.`, `Reading ${nombreGen(activo)} in this biopsy; meanwhile the map is colored by group.`) }}</p>
          <a v-if="!errorMapa" class="sr-only focus:not-sr-only exp__salto" href="#exp-panel">{{ L('Saltar el mapa', 'Skip the map') }}</a>
          <CelulaExplorarMapa v-if="!errorMapa" :d="d" :modo="modoVista" :gen="gen" :gen-b="genB" :conjuntos="conjuntos" :colores="colores" :colorear-por="colorearPor"
                              :tema="tema === 'oscuro' ? 'dark' : 'light'" :lang="lang" :alto="altoMapa" :movil="movil" :tactil="tactil" :orden="nivelGen?.orden" @error="errorMapa = $event" />
          <p v-if="errorMapa" class="exp__estado exp__estado--error exp__sinmapa" role="alert">{{ L('El mapa no se ha podido dibujar en este navegador (recarga la página, o prueba con otro navegador o con la aceleración gráfica activada). El panel y los datos de abajo no dependen de él.', 'The map could not be drawn in this browser (reload the page, or try another browser or turn on graphics acceleration). The panel and the data below do not depend on it.') }}</p>
          <template v-if="!errorMapa">
          <p v-if="modoVista === 'gen'" class="exp__leyt">{{ L(`Nivel de ${nombreGen(gen)} en cada célula, en CP10k (moléculas del gen por cada 10.000 de la célula): no detectado o el tramo en que cae. Los tramos son de esta biopsia: el mismo color no es el mismo nivel en el hígado y en el hueso.`, `${nombreGen(gen)} level in each cell, in CP10k (molecules of the gene per 10,000 in the cell): not detected, or the band it falls in. The bands belong to this biopsy: the same color is not the same level in the liver and in the bone.`) }}</p>
          <ul v-if="leyenda.length" class="exp__leyenda" :aria-label="L('Leyenda del mapa', 'Map legend')">
            <li v-for="l in leyenda" :key="l.etiqueta"><span class="exp__muestra" :style="{ background: cssRgb(l.rgb) }" aria-hidden="true" />{{ l.etiqueta }} <span class="nums">{{ fmtN(l.n, lang) }}</span></li>
          </ul>
          <p v-if="modoVista === 'gen' || modoVista === 'coexp'" class="exp__avisos">
            {{ L('El color es ARN, no proteína. El mapa pinta toda célula donde se detecta el gen, aunque esa señal pueda venir del fondo; si un grupo supera su suelo ambiental, se ve en sus cifras por grupo.',
              'Color is RNA, not protein. The map paints every cell where the gene is detected, even if that signal may come from the background; whether a group clears its ambient floor shows in its figures by group.') }}
          </p>
          </template>
          <p v-if="otrasGem" class="exp__nota">{{ L(`En el hueso, «Otras» incluye ${fmtN(otrasGem.n, 'es')} células sin GEM limpio: comparten gota con una célula del hígado y pueden llevar su ARN. ${fmtN(otrasGem.deTipo, 'es')} de ellas son de tipos que tienen grupo propio y están en «Otras» solo por eso.`, `In the bone, “Other” includes ${fmtN(otrasGem.n, 'en')} cells without a clean GEM: they share a droplet with a liver cell and may carry its RNA. ${fmtN(otrasGem.deTipo, 'en')} of them are of types that have their own group and sit in “Other” only for that reason.`) }}</p>
          <p v-if="!errorMapa" class="exp__nota">{{ L(`${nTotal} células de la biopsia${nLeidas ? ` (de ${nLeidas} leídas; el resto no pasó el control de calidad de este análisis)` : ''}, colocadas según lo que se parecen (UMAP): dos puntos cercanos son células parecidas; la distancia entre grupos alejados no se interpreta.`, `${nTotal} cells from the biopsy${nLeidas ? ` (of ${nLeidas} read; the rest did not pass this analysis’s quality control)` : ''}, placed by similarity (UMAP): nearby dots are similar cells; distances between far-apart groups are not meaningful.`) }}</p>
          <p v-else class="exp__nota">{{ L(`${nTotal} células de la biopsia${nLeidas ? ` (de ${nLeidas} leídas; el resto no pasó el control de calidad de este análisis)` : ''}.`, `${nTotal} cells from the biopsy${nLeidas ? ` (of ${nLeidas} read; the rest did not pass this analysis’s quality control)` : ''}.`) }}</p>
          <details v-if="modoVista === 'gen' && !errorMapa" class="exp__porque">
            <summary>{{ L('Cómo se cortan los tramos de color', 'How the color bands are cut') }}</summary>
            <p class="exp__nota">{{ L('Con un gen, hasta cuatro tramos de nivel, cortados en los cuartiles de las células donde se detecta; cada tramo incluye su límite superior. Si se detecta en menos de 8 células, un solo tramo.', 'With a gene, up to four level bands, cut at the quartiles of the cells where it is detected; each band includes its upper limit. If it is detected in fewer than 8 cells, a single band.') }}</p>
          </details>
        </div>

        <aside id="exp-panel" ref="panelEl" class="exp__panel" :aria-label="L('Panel de genes', 'Genes panel')">
          <div class="exp__pestanas" role="tablist" :aria-label="L('Qué ver en el panel', 'What to show in the panel')" @keydown="teclaPestana">
            <button v-for="t in PESTANAS" :id="`${idCtl}-tab-${t.k}`" :key="t.k" type="button" role="tab" class="exp__tab" :aria-selected="panel === t.k"
                    :aria-controls="`${idCtl}-tp`" :tabindex="panel === t.k ? 0 : -1" @click="ponPestana(t.k)">{{ t.t }}</button>
          </div>
          <div :id="`${idCtl}-tp`" role="tabpanel" :aria-labelledby="`${idCtl}-tab-${panel}`">
          <!-- el gen activo, grupo a grupo -->
          <div v-if="detalle && activo" id="exp-violines" class="exp__pcuerpo" tabindex="-1" role="region" aria-labelledby="exp-dh2">
            <div class="exp__dcab">
              <button type="button" class="exp__volver" @click="cierraDetalle">
                <svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="M165.66 202.34a8 8 0 0 1-11.32 11.32l-80-80a8 8 0 0 1 0-11.32l80-80a8 8 0 0 1 11.32 11.32L91.31 128Z" /></svg>
                {{ L('Volver', 'Back') }}<span class="sr-only">{{ panel === 'marcadores' ? L(' a los marcadores', ' to the markers') : L(' a los genes de interés', ' to the genes of interest') }}</span>
              </button>
              <button v-if="!errorMapa" type="button" class="exp__vermapa exp__solo-estrecho" @click="irAlMapa">{{ L('Ver el mapa', 'See the map') }}</button>
            </div>
            <p class="exp__dbiop" aria-hidden="true">{{ etiqueta(ETIQUETA_LESION, lesion, lang) }}</p>
            <h2 id="exp-dh2" class="exp__h2">{{ L(`${nombreGen(activo)}, grupo a grupo`, `${nombreGen(activo)}, group by group`) }}<span class="sr-only"> · {{ etiqueta(ETIQUETA_LESION, lesion, lang) }}</span>{{ ej }}</h2>
            <!-- recién cambiada la biopsia: el gen activo aún se está leyendo en ella (nada de cifras de otro gen mientras) -->
            <p v-if="!listo" class="exp__estado exp__leyendo" role="status">{{ L(`Leyendo ${nombreGen(activo)} en esta biopsia…`, `Reading ${nombreGen(activo)} in this biopsy…`) }}</p>
            <template v-else>
            <p class="exp__dlec"><span v-if="gen === 'ERBB2'" class="exp__dihq">{{ (lesion === 'higado' ? ETIQUETAS_FIJAS.her2 : ETIQUETAS_FIJAS.her2Hueso)[lang] }}</span><span v-if="gen === 'ERBB3' && lesion === 'higado'" class="exp__dihq">{{ ETIQUETAS_FIJAS.her3Higado[lang] }}</span><template v-if="d.genes.includes(gen)">{{ ETIQUETAS_FIJAS.lectura[lang] }} <strong>{{ lecturaDetalle }}</strong></template><template v-else>{{ lecturaDetalle }}</template></p>
            <p v-if="aliasClinico" class="exp__dlec">{{ L(`${aliasClinico} aquí es ARN, no proteína: cuenta las células con al menos una molécula del gen; la proteína la mide la IHQ.`, `${aliasClinico} here is RNA, not protein: it counts cells with at least one molecule of the gene; protein is measured by IHC.`) }}</p>
            <!-- la otra biopsia (19-oct): la cifra de su grupo de interés, para comparar sin memorizar; ver `otra` -->
            <p v-if="otra" class="exp__otra">
              <span class="exp__otrab">{{ L('La otra biopsia', 'The other biopsy') }} · {{ etiqueta(ETIQUETA_LESION, otra.l, lang) }}</span>
              <!-- las mismas etiquetas que su lista de llegada (CelulaExplorarInteres): IHQ de HER2 de cada biopsia y la nota de HER3 del hígado -->
              <span v-if="gen === 'ERBB2'" class="exp__dihq">{{ (otra.l === 'higado' ? ETIQUETAS_FIJAS.her2 : ETIQUETAS_FIJAS.her2Hueso)[lang] }}</span>
              <span v-if="gen === 'ERBB3' && otra.l === 'higado'" class="exp__dihq">{{ ETIQUETAS_FIJAS.her3Higado[lang] }}</span>
              <span class="exp__otral">{{ otra.grupo }}{{ otra.l === 'higado' ? L(', un subconjunto y no el tumor entero', ', a subset and not the whole tumor') : '' }} (n&nbsp;=&nbsp;{{ otra.n }}):</span>
              <!-- circular con cifra medida sin esa circularidad (loo): esa es la primera cifra, como en los violines (revisión del 17-oct); el grupo se nombra antes (diseño, 19-oct) -->
              <span v-if="otra.loo" class="exp__otral"><strong>{{ L('Sin esa circularidad', 'Without that circularity') }}</strong>
                {{ L(`(grupo construido sin ese criterio, n\u00a0=\u00a0${fmtN(otra.loo.n, lang)}):`, `(group built without that criterion, n\u00a0=\u00a0${fmtN(otra.loo.n, lang)}):`) }}<template v-if="otra.loo.frac != null">{{ ' ' }}<span class="exp__par">{{ L('detectado', 'detected') }}&nbsp;{{ fmtPct(otra.loo.frac, lang) }}</span></template><template v-if="otra.loo.ref != null">, <span class="exp__par">{{ L('referencia', 'reference') }}&nbsp;{{ fmtPct(otra.loo.ref, lang) }}</span></template>.</span>
              <!-- cada etiqueta con su cifra, sin partirse al final de línea (diseño, 19-oct: a 375 «detectado» quedaba solo) -->
              <span class="nums"><template v-if="otra.loo">{{ L('Cifra circular. ', 'Circular figure. ') }}</template><span class="exp__par">{{ L('detectado', 'detected') }}&nbsp;{{ otra.det }}</span>{{ otra.circular && !otra.loo ? L(' (circular)', ' (circular)') : '' }}&nbsp;· <span class="exp__par">{{ L('suelo', 'floor') }}&nbsp;{{ otra.suelo }}</span>{{ otra.marca ? ` (${otra.marca})` : '' }}&nbsp;· <span class="exp__par">{{ L('referencia', 'reference') }}&nbsp;{{ otra.ref }}</span>.</span>
              <span class="exp__otral">{{ ETIQUETAS_FIJAS.lecturaCorta[lang] }} <strong>{{ otra.lec }}</strong>.</span>
              <!-- en la vista del hígado no está la nota del hueso: su circularidad de grupo y el ADN de su suelo viajan con la cifra -->
              <span v-if="otra.l === 'hueso'" class="exp__otral">{{ L('Ese grupo se eligió en parte por número de copias inferido: su cifra no es del todo independiente de esa elección. En el hueso, el suelo incluye además el ADN genómico del tejido.', 'That group was chosen partly by inferred copy number: its figure is not fully independent of that choice. In the bone, the floor also includes the tissue’s genomic DNA.') }}</span>
            </p>
            <CelulaExplorarViolines :filas="filas" :gen="gen" :lang="lang" :lesion="lesion" :adn="d.adn" :papel="d.seleccion[gen]" :loo="d.loo[gen]" :referencia="d.referencia[gen]" />
            </template>
          </div>
          <div v-show="!(detalle && activo) && panel === 'interes'" class="exp__pcuerpo">
            <h2 class="sr-only">{{ L('Genes de interés', 'Genes of interest') }}{{ ej }}</h2>
            <CelulaExplorarInteres :d="d" :lang="lang" :activo="activo" :sin-mapa="!!errorMapa" @elegir="(g: string) => abreGen(g, 'interes', { revela: true })" @tabla="abreTabla" />
          </div>
          <div v-show="!(detalle && activo) && panel === 'marcadores'" class="exp__pcuerpo">
            <h2 class="sr-only">{{ L('Marcadores por grupo', 'Markers per group') }}{{ ej }}</h2>
            <CelulaExplorarMarcadores :d="d" :lang="lang" :abribles="abrible" :elegido="activo ?? ''" @elegir="(g: string) => abreGen(g, 'marcadores', { revela: true })" />
          </div>
          </div>
        </aside>
      </div>

      <!-- a un clic: lo que busca un clínico con calma, y la calidad de los datos para quien analiza -->
      <details ref="masAnalisis" class="exp__tecnico exp__masan">
        <summary>
          <span class="exp__tsum">{{ L('Más análisis', 'More analysis') }}</span>
          <span class="exp__tsub">{{ L('Tabla completa de genes de interés (con sondas y lectura) y dos genes a la vez', 'Full genes-of-interest table (with probes and reading) and two genes at once') }}</span>
        </summary>
        <div id="exp-genes" class="exp__bloque">
          <h2 class="exp__h2" tabindex="-1">{{ L('Genes de interés: tabla completa', 'Genes of interest: full table') }}{{ ej }}</h2>
          <CelulaExplorarGenes :d="d" :lang="lang" :elegido="activo ?? ''" @elegir="elegirDesdeTabla" />
          <p class="exp__estado" role="status">{{ aviso }}<button v-if="aviso && !errorMapa" type="button" class="exp__salto exp__salto--boton" @click="irAlMapa">{{ L('Ver el mapa', 'See the map') }}</button></p>
        </div>
        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Dos genes a la vez', 'Two genes at once') }}{{ ej }}</h2>
          <!-- mientras el gen activo se reabre en esta biopsia, ni el gen de reserva ni el selector escondido del mapa -->
          <p v-if="!listo && activo" class="exp__nota exp__leyendo" role="status">{{ L(`Leyendo ${nombreGen(activo)} en esta biopsia…`, `Reading ${nombreGen(activo)} in this biopsy…`) }}</p>
          <div v-else-if="modo !== 'coexp'" class="exp__campo exp__campo--fila">
            <label :for="`${idCtl}-genb`" class="exp__eti">{{ L(`${nombreGen(gen)} con`, `${nombreGen(gen)} with`) }}</label>
            <select :id="`${idCtl}-genb`" v-model="genB" class="exp__sel">
              <option v-for="g in [...genesInteres, ...genesOtros].filter((x) => x !== gen)" :key="g" :value="g">{{ nombreGen(g) }}</option>
            </select>
          </div>
          <p v-else class="exp__nota">{{ L('El segundo gen se elige encima del mapa, junto a «Colorear por».', 'The second gene is chosen above the map, next to “Color by”.') }}</p>
          <CelulaExplorarCoexp v-if="etiquetasCx" :d="d" :etiquetas="etiquetasCx" :gen-a="gen" :gen-b="genB" :lang="lang" />
        </div>
      </details>
      <details class="exp__tecnico exp__calidad">
        <summary>
          <span class="exp__tsum">{{ L('Calidad de los datos', 'Data quality') }}</span>
          <span class="exp__tsub">{{ L('Número de copias (inferido), expresión por regiones del genoma, ADN genómico por grupo y control de calidad', 'Copy number (inferred), expression by genome region, genomic DNA per group and quality control') }}</span>
        </summary>
        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Número de copias (inferido)', 'Copy number (inferred)') }}{{ ej }}</h2>
          <CelulaExplorarCnv :d="d" :lang="lang" />
        </div>
        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Expresión por regiones del genoma', 'Expression by genome region') }}{{ ej }}</h2>
          <CelulaExplorarPerfil :d="d" :lang="lang" />
        </div>
        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('ADN genómico por grupo', 'Genomic DNA per group') }}{{ ej }}</h2>
          <CelulaExplorarAdn :d="d" :lang="lang" />
        </div>
        <div class="exp__bloque">
          <h2 class="exp__h2">{{ L('Control de calidad', 'Quality control') }}{{ ej }}</h2>
          <CelulaExplorarQc :d="d" :lang="lang" />
        </div>
      </details>
    </template>
  </section>
</template>

<style scoped>
.exp { min-width: 0; background: var(--fondo); color: var(--texto-1); border-radius: var(--radius-card); padding: var(--sp-16); border: 1px solid var(--trazo-medio); }
@media (min-width: 640px) { .exp { padding: var(--sp-24); } }
.exp__demo { margin: 0 0 var(--sp-16); padding: var(--sp-12) var(--sp-16); border: 2px dashed var(--texto-1); border-radius: var(--radius-btn); font: 600 var(--texto-sm)/1.45 var(--font-body); }
.exp__demo strong { display: block; font: 700 var(--texto-sm)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); color: var(--texto-1); }
.exp__ctl { display: flex; flex-wrap: wrap; gap: var(--sp-16) var(--sp-24); align-items: flex-start; padding-bottom: var(--sp-16); border-bottom: 1px solid var(--trazo-medio); }
.exp__campo { display: grid; gap: var(--sp-4); }
.exp__campo--fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); margin-bottom: var(--sp-12); }
.exp__eti { font: 600 var(--texto-xs)/1.3 var(--font-body); color: var(--texto-2); }
.exp__seg { display: inline-flex; flex-wrap: wrap; gap: var(--sp-4); }
.exp__btn {
  min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); color: var(--texto-1);
  font: 600 var(--texto-sm)/1 var(--font-body); background: transparent;
  transition: background-color var(--dur-micro) var(--curva-salida), color var(--dur-micro) var(--curva-salida), transform var(--dur-micro) var(--curva-salida);
  -webkit-tap-highlight-color: transparent;
}
.exp__btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) { .exp__btn { transition: none; } .exp__btn:active { transform: none; } }
.exp__btn--sm { font-size: var(--texto-xs); padding: 0 var(--sp-12); }
.exp__btn[aria-pressed='true'] { background: var(--texto-1); color: var(--fondo); border-color: var(--texto-1); }
.exp__btn:focus-visible, .exp__sel:focus-visible, .exp__salto:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__sel { min-height: 44px; min-width: 14rem; max-width: 100%; padding: 0 var(--sp-12); border-radius: var(--radius-btn); border: 1px solid var(--trazo-interactivo); background: var(--fondo); color: var(--texto-1); font: 500 var(--texto-base)/1 var(--font-body); }
.exp__banner { display: flex; gap: var(--sp-8); align-items: flex-start; padding: var(--sp-8) var(--sp-12); border-radius: var(--radius-btn); font: var(--tipo-body-sm); }
.exp__banner { margin: 0; background: var(--fondo); border: 2px solid var(--texto-1); color: var(--texto-1); }
/* lo fijo es el envoltorio rectangular, con fondo y 9 px por encima: tapa la franja bajo la cabecera y las esquinas */
.exp__bannerfijo { position: sticky; top: calc(var(--exp-top, 8px) - 9px); z-index: 5; margin-top: 7px; padding-top: 9px; background: var(--fondo); }
@media (max-width: 1023px) { .exp__banner { font-size: var(--texto-xs); } }
.exp__banner p { margin: 0; }
.exp__banner-sig { display: none; }
@media (max-width: 1023px) {
  .exp__banner-2 { display: none; }
  .exp__banner-sig { display: block; margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); }
}
.exp__ico { width: 20px; height: 20px; flex: none; margin-top: 1px; color: var(--texto-1); }
.exp__estado { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); }
.exp__estado:empty { margin: 0; }
.exp__estado--error { color: var(--texto-1); font-weight: 600; }
.exp__estado--error p { margin: 0; }
.exp__det { margin-top: var(--sp-4) !important; font: 400 var(--texto-xs) var(--font-mono); color: var(--texto-2); }
/* simulador: el mapa manda (≈60 %), el panel al lado; en estrecho, uno encima del otro */
.exp__sim { display: grid; gap: var(--sp-24); margin-top: var(--sp-16); }
@media (min-width: 1024px) { .exp__sim { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: start; } }
.exp__mapacol, .exp__panel { min-width: 0; }
/* el panel pegado va DEBAJO del aviso fijo del hígado y nunca pasa del alto de la pantalla (diseño, 18-oct) */
@media (min-width: 1024px) { .exp__panel { position: sticky; top: calc(var(--exp-top, 8px) + var(--exp-banner, 0px) + var(--sp-8)); max-height: calc(100dvh - var(--exp-top, 8px) - var(--exp-banner, 0px) - var(--sp-24)); overflow: auto; padding-inline: var(--sp-8); margin-inline: calc(-1 * var(--sp-8)); } }
/* pestañas como pestañas: subrayado, no píldora (la píldora rellena es la biopsia y el grupo de marcadores) */
.exp__pestanas { display: flex; gap: var(--sp-16); margin-bottom: var(--sp-12); border-bottom: 1px solid var(--trazo-medio); }
.exp__tab { min-height: 44px; padding: 0 var(--sp-4); border: 0; border-bottom: 3px solid transparent; margin-bottom: -1px; border-radius: 0; background: none; color: var(--texto-2); font: 600 var(--texto-sm)/1 var(--font-body); cursor: pointer; }
.exp__tab[aria-selected='true'] { color: var(--texto-1); border-bottom-color: var(--identidad); }
@media (hover: hover) { .exp__tab:hover { color: var(--texto-1); } }
.exp__tab:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__pcuerpo:focus { outline: none; }
#exp-violines, #exp-panel, #exp-genes, .exp__mapacol { scroll-margin-top: calc(var(--exp-top, 8px) + var(--exp-banner, 0px) + var(--sp-16)); }   /* que el salto no lo tape la cabecera ni el aviso fijo */
.exp__avisos { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: none; }
.exp__porque { margin-top: var(--sp-4); }
.exp__porque summary, .exp__tecnico summary { cursor: pointer; list-style-position: inside; }
.exp__porque summary { min-height: 44px; display: flex; align-items: center; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--identidad); }
/* con display flex/grid el triángulo nativo desaparece: marca explícita para que se lea como control (voz y diseño) */
.exp__porque summary::-webkit-details-marker { display: none; }
/* chevron del sistema (main.css .notes-disclosure): CSS, no glifos */
.exp__porque summary::before, .exp__tsum::before { content: ''; display: inline-block; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 0.2s ease; flex-shrink: 0; margin-right: var(--sp-8); }
.exp__porque[open] summary::before, .exp__tecnico[open] .exp__tsum::before { transform: rotate(45deg); }
@media (prefers-reduced-motion: reduce) { .exp__porque summary::before, .exp__tsum::before { transition: none; } }
/* en el título grande de un plegado, la flecha a media altura de la letra (se quedaba en la línea base) */
.exp__tsum::before { vertical-align: 0.22em; margin-right: var(--sp-12); }
.exp__tecnico summary::-webkit-details-marker { display: none; }
.exp__porque summary:focus-visible, .exp__tecnico summary:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__tecnico { margin-top: var(--sp-24); border: 1px solid var(--trazo-medio); border-radius: var(--radius-btn); padding: 0 var(--sp-16); }
.exp__tecnico summary { display: grid; gap: var(--sp-4); min-height: 44px; padding: var(--sp-8) 0; }
.exp__tsum { font: 600 var(--texto-base)/1.3 var(--font-body); color: var(--texto-1); }
.exp__tsub { font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); }
.exp__tecnico > .exp__bloque:first-of-type { border-top: 0; margin-top: var(--sp-16); padding-top: 0; }
.exp__sel--busca { min-width: min(22rem, 100%); }
.exp__mapabar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-24); margin-bottom: var(--sp-8); }
.exp__mapabar .exp__campo--fila { margin-bottom: 0; }
.exp__leyt { margin: var(--sp-12) 0 0; font: 600 var(--texto-xs)/1.4 var(--font-body); color: var(--texto-1); max-width: var(--measure); }
.exp__salto--boton { margin: 0 0 0 var(--sp-8); }
.exp__solo-estrecho { display: none; }
@media (max-width: 1023px) { .exp__solo-estrecho { display: inline-block; } }
.exp__h2 { font: var(--tipo-h3); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.exp__sim--sinmapa { grid-template-columns: minmax(0, 1fr) !important; }
/* sin mapa el panel es la página: sin caja con scroll propio (escondía genes sin avisar) y a un ancho de lectura */
.exp__sim--sinmapa .exp__panel { position: static !important; max-height: none !important; overflow: visible !important; max-width: 46rem; }
.exp__sinmapa { margin: 0; padding: var(--sp-8) var(--sp-12); border: 2px solid var(--texto-1); border-radius: var(--radius-btn); }
.exp__dlec { margin: 0 0 var(--sp-12); font: 500 var(--texto-sm)/1.4 var(--font-body); color: var(--texto-2); max-width: var(--measure); }
.exp__dlec strong { color: var(--texto-1); font-weight: 600; }
.exp__dihq { display: block; text-wrap: balance; font: 600 var(--texto-xs)/1.4 var(--font-mono); color: var(--texto-1); }
/* la otra biopsia: aparte de las cifras de esta (filete a la izquierda), en tinta segunda; la cifra, en tinta */
.exp__otra { margin: 0 0 var(--sp-12); padding: var(--sp-4) 0 var(--sp-4) var(--sp-12); border-left: 2px solid var(--trazo-medio); font: 500 var(--texto-xs)/1.45 var(--font-body); color: var(--texto-2); max-width: var(--measure); }
.exp__otra strong, .exp__otra .nums { color: var(--texto-1); font-weight: 600; }
.exp__otral, .exp__otra .nums { display: block; }
.exp__par { white-space: nowrap; }
.exp__otra .exp__dihq { margin: var(--sp-4) 0; }
.exp__otrab { display: block; font: 700 var(--texto-xs)/1.3 var(--font-mono); letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--texto-2); }
.exp__dbiop { margin: 0; font: 700 var(--texto-xs)/1.3 var(--font-mono); letter-spacing: var(--track-eyebrow); text-transform: uppercase; color: var(--texto-2); }
.exp__nota { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-2); max-width: var(--measure); }
.exp__nota--busca:empty { display: none; }
.exp__nota--banner { margin-top: var(--sp-8); }
.exp__salto { display: inline-block; margin-bottom: var(--sp-8); padding: 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-sm) var(--font-body); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.exp__leyenda { list-style: none; margin: var(--sp-12) 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-4) var(--sp-16); font: var(--tipo-body-sm); font-size: var(--texto-xs); color: var(--texto-1); }
.exp__leyenda li { display: inline-flex; align-items: center; gap: var(--sp-8); }
.exp__leyenda .nums { font-family: var(--font-mono); color: var(--texto-2); }
.exp__muestra { width: 12px; height: 12px; border-radius: 999px; flex: none; box-shadow: 0 0 0 1px var(--trazo-fuerte); }
.exp__bloque { margin-top: var(--sp-32); padding-top: var(--sp-24); border-top: 1px solid var(--trazo-medio); }
.exp__busca { position: relative; flex: 1 1 18rem; }
.exp__sug { position: absolute; top: calc(100% + var(--sp-4)); left: 0; right: 0; z-index: 10; list-style: none; margin: 0; padding: var(--sp-8); display: flex; flex-wrap: wrap; gap: var(--sp-4); max-width: 28rem; background: var(--fondo); border: 1px solid var(--trazo-fuerte); border-radius: var(--radius-btn); box-shadow: 0 6px 18px color-mix(in srgb, var(--texto-1) 12%, transparent); }
/* buscador + chip del gen activo (la ✕ lo quita del mapa) */
.exp__buscafila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8); }
.exp__buscafila .exp__sel--busca { flex: 1 1 14rem; min-width: 0; }
.exp__chip { display: inline-flex; align-items: center; max-width: 100%; min-height: 44px; padding-left: var(--sp-12); border-radius: var(--radius-pill); border: 1px solid var(--identidad); background: color-mix(in srgb, var(--identidad) 10%, transparent); color: var(--texto-1); font: 600 var(--texto-sm)/1.2 var(--font-body); }
.exp__chipt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.exp__chipx, .exp__tema { display: inline-grid; place-items: center; flex: none; width: 44px; height: 44px; padding: 0; border-radius: var(--radius-pill); background: transparent; color: var(--texto-1); cursor: pointer; }
.exp__chipx { border: 0; }
.exp__chipx svg { width: 16px; height: 16px; }
.exp__tema { border: 1px solid var(--trazo-interactivo); }
.exp__tema svg { width: 20px; height: 20px; }
@media (hover: hover) { .exp__chipx:hover, .exp__tema:hover { background: var(--trazo-sutil); } }
.exp__chipx:focus-visible, .exp__tema:focus-visible, .exp__volver:focus-visible, .exp__mas:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__mas { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; margin: -12px -8px -12px var(--sp-4); padding: 0 8px; vertical-align: middle; border: 0; background: none; color: var(--identidad); font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.exp__sel--sm { min-width: 11rem; font-size: var(--texto-sm); }
@media (max-width: 639px) {
  .exp__mapabar:not(.exp__mapabar--dos) { flex-wrap: nowrap; gap: var(--sp-8); }
  .exp__mapabar:not(.exp__mapabar--dos) .exp__campo--fila { flex: 1 1 auto; min-width: 0; flex-wrap: nowrap; }
  .exp__mapabar:not(.exp__mapabar--dos) .exp__sel--sm { min-width: 0; flex: 1 1 auto; }
}
/* detalle del gen: «‹ Volver» a la lista de la que se vino */
.exp__dcab { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sp-8); margin-bottom: var(--sp-4); }
/* en estrecho el mapa queda encima del panel: el detalle trae un botón para volver a verlo (sin salto automático) */
.exp__vermapa { min-height: 44px; padding: 0 var(--sp-16); border-radius: var(--radius-pill); border: 1px solid var(--trazo-interactivo); background: transparent; color: var(--texto-1); font: 600 var(--texto-sm)/1 var(--font-body); cursor: pointer; }
.exp__vermapa:focus-visible { outline: 2px solid var(--anillo-foco); outline-offset: 2px; }
.exp__volver { display: inline-flex; align-items: center; gap: var(--sp-4); min-height: 44px; padding: 0 var(--sp-8) 0 0; border: 0; background: none; color: var(--identidad); font: 600 var(--texto-sm)/1.2 var(--font-body); cursor: pointer; }
.exp__volver svg { width: 16px; height: 16px; }
.exp__tecnico + .exp__tecnico { margin-top: var(--sp-8); }
.exp__tecnico[open] { padding-bottom: var(--sp-16); }
/* escritorio: rótulos a la izquierda de su control y menos aire, para que al entrar se vean 400 px de mapa a 1440×900 */
@media (min-width: 1024px) {
  .exp { padding-top: var(--sp-16); }
  .exp__ctl { padding-bottom: var(--sp-12); align-items: center; }
  .exp__ctl > .exp__campo:not(.exp__busca) { display: flex; align-items: center; gap: var(--sp-8); }
  .exp__busca { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: var(--sp-8); }
  .exp__busca > :not(label) { grid-column: 2; }
  .exp__bannerfijo { margin-top: 1px; }
  .exp__sim { margin-top: var(--sp-8); }
}
.exp__sel::placeholder { color: var(--texto-2); opacity: 1; }
</style>
