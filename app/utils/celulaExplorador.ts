/**
 * Explorador de /celula-a-celula/explorar: contrato de datos, puerta y cálculos. Funciones puras con
 * test (scripts/test-celula-explorador.ts). La página no inventa ni redondea nada que no salga de aquí.
 *
 * CONTRATO PARA QUIEN ESCRIBA public/celula/explorador/ (Polaris):
 *  · public/ se sirve tal cual y la preview de Netlify también es pública. Mientras Miriam no dé el
 *    OK, en esa carpeta SOLO hay datos SINTÉTICOS (`ejemplo: true` en el manifiesto y en cada lesión).
 *    Los genera Polaris (tools/flex_analisis/explorador/ejemplo.py) con los MISMOS constructores y el MISMO
 *    validador que el export real: un solo formato, con los Zarr de todos los genes.
 *    El export real vive en la zona clínica de Polaris y entra aquí solo con `sello: "verificado"`,
 *    `ok_titular: true` y `fecha_ok` (AAAA-MM-DD de calendario). El test falla si se incumple, y si hay un fichero que
 *    no está en el manifiesto con su sha256. Es el mismo contrato que valida Polaris
 *    (tools/flex_analisis/explorador/_contrato.py): la clave no lleva el nombre de la titular.
 *  · La puerta es la de /celula-a-celula (puertaAbierta, hostPermiteDemo): con la puerta cerrada la
 *    página no pide los datos ni monta el motor; con `?demo=1` (nunca en producción) abre SOLO lo
 *    marcado como ejemplo, con su rótulo.
 *  · El muro va en la FORMA: el hígado no tiene CNV por célula (solo el pseudobulk de 8p11); ningún
 *    grupo ni tipo del hígado dice «tumor» ni «malign»; cada grupo trae su n y cada gen su suelo
 *    ambiental por grupo. Un fichero que no cumple no se pinta (mejor nada que algo roto).
 *  · Las cifras que acompañan a los avisos (ADN genómico, sondas por gen, la cifra sin circularidad de
 *    un gen que participa en la selección del grupo) viajan en el fichero de datos, nunca en el texto de
 *    la página: con datos de ejemplo, el ejemplo trae las suyas, inventadas.
 */

export type Lesion = 'higado' | 'hueso'
export const LESIONES: Lesion[] = ['higado', 'hueso']
export type Rol = 'interes' | 'referencia' | 'otras'

/** Vocabulario CERRADO de grupos por lesión: lo que no está aquí no se pinta. */
export const GRUPOS: Record<Lesion, { interes: string; referencias: string[] }> = {
  higado: { interes: 'luminal_alta_confianza', referencias: ['hepatocito', 'NK', 'mieloide', 'endotelio', 'fibroblasto_estelar'] },
  hueso: { interes: 'malignas_limpias', referencias: ['T', 'NK', 'B', 'plasmatica', 'mieloide', 'neutrofilo', 'mastocito', 'endotelio'] },
}
/** «sostenido_con_matiz» (HER3 del hígado en la revisión) y «con_matiz» (se matiza, no se da por sostenido) son
 *  lecturas distintas: no se funden (revisión de cifras del 17-oct-2026). */
export const VEREDICTOS = ['sostenido', 'sostenido_con_matiz', 'con_matiz', 'en_el_limite', 'no_sostenido', 'no_resoluble', 'referencia_igual_o_mas', 'solo_nivel', 'marcador_ne', 'no', 'cerrado_por_arn', 'sin_veredicto'] as const
export type Veredicto = typeof VEREDICTOS[number]
/** Papel de un gen en la SELECCIÓN del grupo de interés: su cifra en ese grupo es circular. */
export const PAPELES_SELECCION = ['identidad', 'fgfr1_alto', 'exclusion', 'ligado_er'] as const
export type PapelSeleccion = typeof PAPELES_SELECCION[number]
/** Cifra medida sin la circularidad (el grupo construido sin ese gen o sin ese criterio). */
export interface Loo { n: number; frac: number | null; ref: number | null; cp10k_pseudobulk: number | null }
/** ADN genómico de la muestra (las sondas dentro de un exón también lo captan). Las fracciones son de UMI
 *  (moléculas contadas), no de lecturas; las claves conservan el nombre del contrato que comparte con Polaris. */
export interface Adn { sondas_dentro_de_exon: number; sondas_panel: number; frac_lecturas_estimada: number; frac_lecturas_cell_ranger: number; frac_lecturas_interes: number }

/** QC agregado (el del analista A, que fija las células): allow-list del contrato de Polaris (`QC_KEYS`). */
export interface Qc {
  fuente: string; n_inicial: number; n_final: number; umbral_UMI: [number, number]; umbral_genes: [number, number]
  umbral_pct_MT?: number | string; excluidas_UMI_genes?: number; excluidas_MT_adicionales?: number
  scrublet_dobletes: number; scrublet_umbral?: number | null
  mediana_UMI_inicial?: number; mediana_UMI_final?: number; mediana_genes_inicial?: number; mediana_genes_final?: number; n_sondas_MT?: number
}
/** Marcadores de un grupo del contrato frente al resto de la lesión (Wilcoxon, FDR), con el suelo del gen al lado. */
export interface Marcadores { gen: string[]; logfc: number[]; fdr: number[]; frac_grupo: number[]; frac_resto: number[]; suelo: number[] }
/** Perfil de expresión por regiones de 10 Mb (grupo de interés frente a la referencia emparejada). Expresión, no ADN. */
export interface PerfilBins { cromosoma: string[]; inicio_mb: number[]; log2_rel: number[] }
export const MARCADORES_N = 50
const RE_CROMOSOMA = /^chr([1-9]|1\d|2[0-2])$/
const RE_SIMBOLO = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

export interface Grupo { id: string; rol: Rol; n: number }
export interface LesionDatos {
  version: number
  lesion: Lesion
  ejemplo?: boolean
  n_celulas: number
  grupos: Grupo[]
  tipos: string[]
  celulas: { umap: number[]; grupo: number[]; tipo: number[] }
  genes: string[]
  expr: Record<string, { i: number[]; v: number[] }>
  suelo: Record<string, Record<string, number>>
  referencia: Record<string, number>
  veredicto: Record<string, Veredicto>
  /** [sondas que cruzan una unión exón-exón, sondas totales] por gen */
  sondas: Record<string, [number, number]>
  seleccion: Record<string, PapelSeleccion>
  loo: Record<string, Loo>
  adn: Adn
  cnv: { ventanas: string[]; metodo: string; valores: (number | null)[][] } | { pseudobulk: { ventana: string; percentil_genoma: number } }
  qc: Qc
  marcadores: Record<string, Marcadores>
  perfil_bins: PerfilBins
  /** fracción de UMI de ADN genómico por grupo (cociente de medias del tribunal; por célula no es fiable) */
  adn_por_grupo: Record<string, number>
}
export interface Manifiesto {
  version: number
  ejemplo?: boolean
  sello: string
  ok_titular: boolean
  fecha_ok?: string
  modo_sondas?: string
  lesiones: Lesion[]
  ficheros: { ruta: string; sha256: string }[]
  /** AnnData-Zarr por lesión (todos los genes): huella del árbol entero (sha256 del listado «ruta sha256») */
  zarr?: { ruta: string; sha256_arbol: string }[]
  /** «ejemplo» en los datos inventados; con datos reales, solo con la fecha de la decisión de publicar la matriz completa */
  matriz_completa?: 'ejemplo' | { fecha_decision: string }
}

/* ── la puerta ─────────────────────────────────────────────────────────── */

/**
 * fecha_ok: AAAA-MM-DD con cifras ASCII y fecha de calendario real (ni «2026-13-45» ni «2026-02-30» ni
 * «0000-01-01», nada pegado delante o detrás). La misma regla que fecha_ok_valida de Polaris
 * (_contrato.py, datetime.date.fromisoformat). setUTCFullYear y no Date.UTC: Date.UTC lleva los años 0-99 a 1900+.
 */
export function fechaOkValida(v: unknown): boolean {
  if (typeof v !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number) as [number, number, number]
  if (y < 1 || m < 1 || m > 12 || d < 1) return false
  const f = new Date(0)
  f.setUTCFullYear(y, m - 1, d)
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d
}

/** ¿Qué se puede pintar? `real`: verificado + OK. `ejemplo`: solo con demo, y solo si TODO es ejemplo. */
export function estadoPuerta(m: Manifiesto | null | undefined, opt: { demo?: boolean } = {}): 'real' | 'ejemplo' | 'cerrada' {
  if (!m || !Array.isArray(m.ficheros) || !Array.isArray(m.lesiones)) return 'cerrada'
  // la misma regla que puertaAbierta() de /celula-a-celula (verificado Y OK === true, booleano), más la fecha del OK
  // (AAAA-MM-DD de calendario, como fecha_ok_valida de Polaris); y solo la versión de todas las sondas (la que se decidió publicar)
  if (m.ejemplo !== true && m.sello === 'verificado' && m.ok_titular === true && fechaOkValida(m.fecha_ok) && m.modo_sondas === 'todas_incluidas') return 'real'
  if (opt.demo === true && m.ejemplo === true) return 'ejemplo'
  return 'cerrada'
}

/**
 * ¿Se monta el nivel de TODOS los genes (Zarr)? Publicar todos los genes equivale a publicar la matriz completa
 * (dato genético, irreversible): con datos reales solo con la fecha de esa decisión de la titular; con el ejemplo,
 * solo si el manifiesto entero es ejemplo. Si no, la página se queda en el panel de genes del JSON.
 */
export function nivelMatriz(m: Manifiesto | null | undefined, estado: 'real' | 'ejemplo' | 'cerrada'): 'todos' | 'panel' {
  if (!m || estado === 'cerrada' || !Array.isArray(m.zarr) || !Array.isArray(m.lesiones)
    || JSON.stringify(m.zarr.map((z) => z?.ruta)) !== JSON.stringify(m.lesiones.map((l) => `zarr/${l}.zarr`))) return 'panel'
  if (estado === 'ejemplo') return m.ejemplo === true && m.matriz_completa === 'ejemplo' ? 'todos' : 'panel'
  const mc = m.matriz_completa
  return typeof mc === 'object' && mc !== null && fechaOkValida((mc as { fecha_decision?: unknown }).fecha_decision) ? 'todos' : 'panel'
}

/* ── la forma (y el muro que va en ella) ───────────────────────────────── */

const ent = (v: unknown, min = 0) => typeof v === 'number' && Number.isInteger(v) && v >= min
const frac = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1
const PROHIBIDO_HIGADO = /tumor|malign|cancer|cáncer/i
/** Patrón de barcode de 10x: nunca puede aparecer en lo que se publica (ni en un ejemplo). */
export const RE_BARCODE = /[ACGTN]{12,}/

/** Lista de motivos por los que una lesión NO se puede pintar ([] = válida). */
export function motivosLesion(d: LesionDatos, esperado: { lesion: Lesion; ejemplo: boolean }): string[] {
  const m: string[] = []
  try {
    if (d.version !== 1) m.push('versión desconocida')
    if (d.lesion !== esperado.lesion) m.push('lesión cambiada')
    if ((d.ejemplo === true) !== esperado.ejemplo) m.push('ejemplo y real mezclados')
    const n = d.n_celulas
    if (!ent(n, 1)) m.push('n_celulas')
    const voc = GRUPOS[d.lesion]
    const ids = d.grupos.map((g) => g.id)
    if (new Set(ids).size !== ids.length) m.push('grupo repetido')
    for (const g of d.grupos) {
      const ok = (g.rol === 'interes' && g.id === voc.interes) || (g.rol === 'referencia' && voc.referencias.includes(g.id)) || (g.rol === 'otras' && g.id === 'otras')
      if (!ok) m.push(`grupo fuera de vocabulario: ${g.id}`)
      if (!ent(g.n, 0)) m.push(`n de ${g.id}`)
    }
    if (!d.grupos.some((g) => g.rol === 'interes')) m.push('falta el grupo de interés')
    if (d.celulas.umap.length !== 2 * n || d.celulas.grupo.length !== n || d.celulas.tipo.length !== n) m.push('longitudes de células')
    if (!d.celulas.umap.every((x) => typeof x === 'number' && Number.isFinite(x))) m.push('umap no numérico')
    const cuenta: number[] = Array.from({ length: d.grupos.length }, () => 0)
    for (const gi of d.celulas.grupo) { if (!ent(gi) || gi >= d.grupos.length) { m.push('índice de grupo'); break } cuenta[gi]++ }
    d.grupos.forEach((g, k) => { if (cuenta[k] !== g.n) m.push(`n de ${g.id} no cuadra con las células`) })
    if (!d.celulas.tipo.every((t) => ent(t) && t < d.tipos.length)) m.push('índice de tipo')
    if (!d.tipos.every((t) => /^[a-z_]+$/i.test(t))) m.push('tipo con caracteres raros')
    if (d.lesion === 'higado' && [...ids, ...d.tipos].some((x) => PROHIBIDO_HIGADO.test(x))) m.push('el hígado no tiene grupo ni tipo «tumor»')
    if (!d.genes.length || new Set(d.genes).size !== d.genes.length) m.push('genes')
    for (const gen of d.genes) {
      const e = d.expr[gen]
      if (!e || e.i.length !== e.v.length) { m.push(`expresión de ${gen}`); continue }
      for (let k = 0; k < e.i.length; k++) {
        if (!ent(e.i[k]) || e.i[k]! >= n || (k > 0 && e.i[k]! <= e.i[k - 1]!) || !(e.v[k]! > 0)) { m.push(`expresión de ${gen} mal formada`); break }
      }
      const s = d.suelo[gen]
      if (!s || !d.grupos.every((g) => frac(s[g.id]))) m.push(`suelo de ${gen} (todos los grupos)`)
      if (!frac(d.referencia[gen])) m.push(`referencia de ${gen}`)
      if (!(VEREDICTOS as readonly string[]).includes(d.veredicto[gen] as string)) m.push(`veredicto de ${gen}`)
      const so = d.sondas?.[gen]
      if (!Array.isArray(so) || so.length !== 2 || !ent(so[0]) || !ent(so[1], 1) || so[0] > so[1]) m.push(`sondas de ${gen}`)
    }
    if (!d.sondas || Object.keys(d.sondas).length !== d.genes.length) m.push('sondas: un gen de más o de menos')
    const sel = d.seleccion
    // la selección cubre TODO el panel desde el 18-oct (la página abre cualquier gen): genes fuera de la lista valen; que
    // existan en el Zarr lo coteja el test del contrato
    if (!sel || typeof sel !== 'object' || !Object.entries(sel).every(([g, p]) => typeof g === 'string' && g.length > 0 && (PAPELES_SELECCION as readonly string[]).includes(p))) m.push('selección fuera de vocabulario')
    else if (d.lesion === 'hueso' && Object.values(sel).some((p) => p !== 'identidad')) m.push('selección del hueso fuera de vocabulario')
    const loo = d.loo
    if (!loo || typeof loo !== 'object' || (d.lesion === 'hueso' && Object.keys(loo).length)) m.push('loo')
    else for (const [g, v] of Object.entries(loo)) {
      if (!sel?.[g] || !ent(v?.n, 1) || !(v.frac === null || frac(v.frac)) || !(v.ref === null || frac(v.ref)) || !(v.cp10k_pseudobulk === null || (typeof v.cp10k_pseudobulk === 'number' && v.cp10k_pseudobulk >= 0))) m.push(`loo de ${g}`)
    }
    const a = d.adn
    if (!a || !ent(a.sondas_dentro_de_exon, 1) || !ent(a.sondas_panel, 1) || a.sondas_dentro_de_exon > a.sondas_panel
      || !frac(a.frac_lecturas_estimada) || !frac(a.frac_lecturas_cell_ranger) || !frac(a.frac_lecturas_interes)) m.push('adn')
    if (d.lesion === 'higado') {
      if (!('pseudobulk' in d.cnv) || 'valores' in d.cnv) m.push('el hígado no lleva CNV por célula')
      else if (!ent(d.cnv.pseudobulk.percentil_genoma) || d.cnv.pseudobulk.percentil_genoma > 100) m.push('pseudobulk')
    }
    else {
      if (!('valores' in d.cnv)) m.push('el hueso lleva CNV por célula')
      else if (d.cnv.valores.length !== d.cnv.ventanas.length || !d.cnv.valores.every((v) => v.length === n)) m.push('CNV mal formado')
    }
    // QC agregado (el que fija las células): n_final = células del explorador
    const q = d.qc
    const par = (u: unknown) => Array.isArray(u) && u.length === 2 && u.every((x) => typeof x === 'number' && Number.isFinite(x) && x >= 0) && (u[0] as number) <= (u[1] as number)
    if (!q || typeof q.fuente !== 'string' || q.n_final !== n || !ent(q.n_inicial, n) || !par(q.umbral_UMI) || !par(q.umbral_genes) || !ent(q.scrublet_dobletes)) m.push('qc')
    // marcadores: solo grupos del contrato presentes, como mucho MARCADORES_N, valores en rango
    const idsSet = new Set(ids)
    const mk = d.marcadores
    if (!mk || typeof mk !== 'object') m.push('marcadores')
    else for (const [gid, x] of Object.entries(mk)) {
      if (!idsSet.has(gid)) { m.push(`marcadores de un grupo fuera del contrato: ${gid}`); continue }
      const L = x?.gen?.length ?? -1
      const cols = [x?.logfc, x?.fdr, x?.frac_grupo, x?.frac_resto, x?.suelo]
      if (L < 0 || L > MARCADORES_N || new Set(x.gen).size !== L || !x.gen.every((g) => typeof g === 'string' && RE_SIMBOLO.test(g))
        || cols.some((c) => !Array.isArray(c) || c.length !== L)) { m.push(`marcadores de ${gid}: forma`); continue }
      if (!x.logfc.every((v) => typeof v === 'number' && Number.isFinite(v)) || ![x.fdr, x.frac_grupo, x.frac_resto, x.suelo].every((c) => c.every(frac))) m.push(`marcadores de ${gid}: valores fuera de rango`)
    }
    // perfil por regiones: listas paralelas, solo chr1-chr22
    const pb = d.perfil_bins
    if (!pb || !Array.isArray(pb.cromosoma) || !pb.cromosoma.length || pb.inicio_mb?.length !== pb.cromosoma.length || pb.log2_rel?.length !== pb.cromosoma.length
      || !pb.cromosoma.every((c) => RE_CROMOSOMA.test(c)) || !pb.inicio_mb.every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0)
      || !pb.log2_rel.every((v) => typeof v === 'number' && Number.isFinite(v))) m.push('perfil_bins')
    // ADN por grupo: un valor en [0, 1) por grupo con células; el del grupo de interés es el de `adn`
    const ag = d.adn_por_grupo
    const conCelulas = d.grupos.filter((g) => g.n > 0).map((g) => g.id).sort()
    const interes = d.grupos.find((g) => g.rol === 'interes')?.id
    if (!ag || typeof ag !== 'object' || JSON.stringify(Object.keys(ag).sort()) !== JSON.stringify(conCelulas)
      || !Object.values(ag).every((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1)
      || !interes || Math.abs((ag[interes] ?? -1) - (d.adn?.frac_lecturas_interes ?? -2)) > 1e-9) m.push('adn_por_grupo')
    if (RE_BARCODE.test(JSON.stringify({ g: d.grupos, t: d.tipos, ge: d.genes, mk: d.marcadores }))) m.push('cadena con forma de barcode')
  }
  catch { m.push('fichero roto') }
  return m
}

/* ── cálculos que pinta la página ──────────────────────────────────────── */

/** Columna densa (n) de un gen: CP10k, 0 donde no se detecta. */
export function columna(d: LesionDatos, gen: string): Float32Array {
  const out = new Float32Array(d.n_celulas)
  const e = d.expr[gen]
  if (e) for (let k = 0; k < e.i.length; k++) out[e.i[k]!] = e.v[k]!
  return out
}

export interface FilaGrupo { id: string; rol: Rol; n: number; detectadas: number; frac: number; suelo: number; niveles: number[] }
/** Por grupo: n, células con ≥1 UMI, fracción, suelo ambiental y niveles (log10 CP10k) de las detectadas. */
export function porGrupo(d: LesionDatos, gen: string): FilaGrupo[] {
  const col = columna(d, gen)
  return d.grupos.map((g, k) => {
    const niveles: number[] = []
    for (let i = 0; i < d.n_celulas; i++) if (d.celulas.grupo[i] === k && col[i]! > 0) niveles.push(Math.log10(col[i]!))
    return { id: g.id, rol: g.rol, n: g.n, detectadas: niveles.length, frac: g.n ? niveles.length / g.n : 0, suelo: d.suelo[gen]?.[g.id] ?? 0, niveles }
  })
}

/** Densidad (KDE gaussiana, Silverman) en `m` puntos de [a, b], normalizada a máximo 1. */
export function densidad(xs: number[], a: number, b: number, m = 48): number[] {
  if (xs.length < 2) return Array.from({ length: m }, () => 0)
  const media = xs.reduce((s, x) => s + x, 0) / xs.length
  const sd = Math.sqrt(xs.reduce((s, x) => s + (x - media) ** 2, 0) / (xs.length - 1)) || 0.1
  const h = 1.06 * sd * xs.length ** -0.2
  const ys = Array.from({ length: m }, (_, j) => {
    const x = a + ((b - a) * j) / (m - 1)
    let s = 0
    for (const v of xs) s += Math.exp(-0.5 * ((x - v) / h) ** 2)
    return s
  })
  const max = Math.max(...ys)
  return max > 0 ? ys.map((y) => y / max) : ys
}

export type Coexp = 'ambos' | 'solo_a' | 'solo_b' | 'ninguno'
/** Etiqueta de co-expresión por célula (≥1 UMI = detectado). */
export function coexpresion(d: LesionDatos, a: string, b: string): Coexp[] {
  const ca = columna(d, a), cb = columna(d, b)
  return Array.from({ length: d.n_celulas }, (_, i) => (ca[i]! > 0 ? (cb[i]! > 0 ? 'ambos' : 'solo_a') : cb[i]! > 0 ? 'solo_b' : 'ninguno'))
}
/** Recuento 2×2 por grupo. */
export function tablaCoexp(d: LesionDatos, etiquetas: Coexp[]): { id: string; n: number; c: Record<Coexp, number> }[] {
  return d.grupos.map((g, k) => {
    const c: Record<Coexp, number> = { ambos: 0, solo_a: 0, solo_b: 0, ninguno: 0 }
    for (let i = 0; i < d.n_celulas; i++) if (d.celulas.grupo[i] === k) c[etiquetas[i]!]++
    return { id: g.id, n: g.n, c }
  })
}

/** Porcentaje fino (fracción de UMI de ADN) con la precisión que tiene sentido: dos decimales por debajo del 1 %
 * (con uno, una barra visible salía «0,0 %»: pase de voz, 18-oct), uno por debajo del 10 %, entero por encima. */
export function fmtPctFino(x: number, lang: 'es' | 'en'): string {
  const v = 100 * x
  const t = v < 1 ? (Math.round(v * 100) / 100).toFixed(2) : v < 10 ? (Math.round(v * 10) / 10).toFixed(1) : String(Math.round(v))
  const n = lang === 'en' ? t : t.replace('.', ',')
  return lang === 'en' ? `${n}%` : `${n}\u00a0%`
}
/** Porcentaje con las cifras significativas que trae el dato (0.002 → «0,2 %», 0.271 → «27,1 %»): la referencia de
 * Cell Ranger llega redondeada y fmtPctFino le inventaba precisión («0,20 %», verificacion 18-oct). */
export function fmtPctSig(x: number, lang: 'es' | 'en'): string {
  const cifras = String(x).replace('-', '').replace(/e.*$/, '').replace('.', '').replace(/^0+/, '').length || 1
  const t = String(Number((100 * x).toPrecision(Math.min(cifras, 3))))
  const n = lang === 'en' ? t : t.replace('.', ',')
  return lang === 'en' ? `${n}%` : `${n}\u00a0%`
}

/** Porcentaje entero para mostrar (la misma regla en toda la página). */
export const pct = (x: number) => Math.round(100 * x)
/** «28 %» en ES, «28%» en EN: la misma forma en tablas y violines. */
export const fmtPct = (x: number, lang: 'es' | 'en') => (lang === 'en' ? `${pct(x)}%` : `${pct(x)}\u00a0%`)   // espacio duro: el «%» no se separa de su cifra
/** Detectado y suelo, uno junto al otro: si redondeados a entero salen iguales, los dos con un decimal (comité médico,
 * 18-oct: «10 % · suelo 10 %» era 10,3 frente a 9,6 y no se podía comparar). */
export function fmtParSuelo(frac: number, suelo: number, lang: 'es' | 'en'): [string, string] {
  if (pct(frac) !== pct(suelo)) return [fmtPct(frac, lang), fmtPct(suelo, lang)]
  if ((100 * frac).toFixed(2) === (100 * suelo).toFixed(2)) return [fmtPct(frac, lang), fmtPct(suelo, lang)]   // iguales de verdad: enteros
  const d = (100 * frac).toFixed(1) === (100 * suelo).toFixed(1) ? 2 : 1   // a un decimal aún iguales: dos
  const f = (x: number) => { const t = (100 * x).toFixed(d); return lang === 'en' ? `${t}%` : `${t.replace('.', ',')}\u00a0%` }
  return [f(frac), f(suelo)]
}

/** sha256 hex de un texto (SubtleCrypto). */
export async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
