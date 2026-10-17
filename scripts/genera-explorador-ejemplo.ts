// Genera los datos SINTÉTICOS del explorador (/celula-a-celula/explorar): public/celula/explorador/.
//
// Por qué existe (17-oct-2026): la página se construye y se revisa en la preview de Netlify, que es
// pública. Hasta que Miriam dé el OK al export real (que vive en la zona clínica de Polaris), aquí solo
// puede haber datos INVENTADOS, marcados `ejemplo: true`. Son aleatorios con semilla fija: no copian
// ninguna cifra, grupo ni veredicto del análisis real (todos los veredictos son «sin_veredicto»; las
// sondas, el ADN genómico, la selección y la cifra sin circularidad también son inventados).
// Determinista: dos ejecuciones dan los mismos bytes (y el mismo sha256 del manifiesto).
// Uso: pnpm exec tsx scripts/genera-explorador-ejemplo.ts
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { GRUPOS, type LesionDatos, type Lesion, type Manifiesto, type PapelSeleccion } from '../app/utils/celulaExplorador'

const DIR = join(import.meta.dirname, '..', 'public', 'celula', 'explorador')

function prng(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r = prng(424242)
const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
const sig3 = (x: number) => Number(x.toPrecision(3))
const dos = (x: number) => Math.round(x * 100) / 100

const PANEL = ['ANKRD30A', 'TPBG', 'ERBB3', 'SLC39A6', 'ERBB2', 'TACSTD2', 'CD276', 'NECTIN4', 'MUC1', 'FGFR1']
const OTROS = ['CCND1', 'ESR1', 'PRAME', 'MAGEA4', 'CHGA', 'SYP', 'B2M', 'MKI67']
const MARCADORES: Record<string, string[]> = {
  luminal: ['KRT19', 'EPCAM'], hepatocito: ['ALB', 'APOA1'], nk: ['NKG7'], linfocito_t: ['CD3E'], mieloide: ['CD68', 'C1QA'],
  endotelio: ['PECAM1', 'VWF'], fibroblasto: ['COL1A1', 'DCN'], epitelial: ['KRT19', 'EPCAM'], linfocito_b: ['MS4A1'],
  plasmatica: ['MZB1'], neutrofilo: ['S100A8'], mastocito: ['TPSAB1'], osteoclasto: ['ACP5', 'CTSK'], eritroide: ['HBB'], estroma: ['COL1A1', 'DCN'],
}
const GENES = [...PANEL, ...OTROS, ...new Set(Object.values(MARCADORES).flat()), 'PTPRC', 'ACTB']

// grupo → [n, tipo]; «otras» se reparte entre varios tipos
const DISENO: Record<Lesion, { grupos: [string, number, string][]; otras: [string, number][]; tipos: string[] }> = {
  higado: {
    grupos: [['luminal_alta_confianza', 380, 'luminal'], ['hepatocito', 260, 'hepatocito'], ['NK', 90, 'nk'], ['mieloide', 160, 'mieloide'], ['endotelio', 110, 'endotelio'], ['fibroblasto_estelar', 70, 'fibroblasto']],
    otras: [['luminal', 240], ['linfocito_t', 30], ['hepatocito', 40], ['mieloide', 20]],
    tipos: ['luminal', 'hepatocito', 'nk', 'linfocito_t', 'mieloide', 'endotelio', 'fibroblasto'],
  },
  hueso: {
    grupos: [['malignas_limpias', 110, 'epitelial'], ['T', 40, 'linfocito_t'], ['NK', 25, 'nk'], ['B', 20, 'linfocito_b'], ['plasmatica', 30, 'plasmatica'], ['mieloide', 90, 'mieloide'], ['neutrofilo', 80, 'neutrofilo'], ['mastocito', 10, 'mastocito'], ['endotelio', 35, 'endotelio']],
    otras: [['epitelial', 30], ['osteoclasto', 22], ['eritroide', 18], ['estroma', 10]],
    tipos: ['epitelial', 'linfocito_t', 'nk', 'linfocito_b', 'plasmatica', 'mieloide', 'neutrofilo', 'mastocito', 'endotelio', 'osteoclasto', 'eritroide', 'estroma'],
  },
}

function lesion(l: Lesion): LesionDatos {
  const dz = DISENO[l]
  const voc = GRUPOS[l]
  const grupos = [...dz.grupos.map(([id, n]) => ({ id, rol: id === voc.interes ? 'interes' as const : 'referencia' as const, n })), { id: 'otras', rol: 'otras' as const, n: dz.otras.reduce((s, [, n]) => s + n, 0) }]
  const centros = new Map(dz.tipos.map((t) => [t, [r() * 16 - 8, r() * 16 - 8] as [number, number]]))
  const celulas: { g: number; t: string }[] = []
  dz.grupos.forEach(([, n, t], k) => { for (let i = 0; i < n; i++) celulas.push({ g: k, t }) })
  for (const [t, n] of dz.otras) for (let i = 0; i < n; i++) celulas.push({ g: grupos.length - 1, t })
  const n = celulas.length
  const umap: number[] = []
  for (const c of celulas) {
    const [cx, cy] = centros.get(c.t)!
    const disp = c.g === grupos.length - 1 ? 1.6 : 1.1
    umap.push(dos(Math.max(-10, Math.min(10, cx + normal() * disp))), dos(Math.max(-10, Math.min(10, cy + normal() * disp))))
  }
  // probabilidad de detección por gen y tipo: marcadores altos en su tipo; panel aleatorio en el epitelio
  const pDet = (gen: string, tipo: string): number => {
    if (MARCADORES[tipo]?.includes(gen)) return 0.55 + 0.35 * r()
    if (gen === 'ACTB') return 0.3 + 0.2 * r()
    if (gen === 'PTPRC') return ['nk', 'linfocito_t', 'linfocito_b', 'mieloide', 'neutrofilo', 'plasmatica', 'mastocito'].includes(tipo) ? 0.5 : 0.02
    if (['PRAME', 'MAGEA4'].includes(gen)) return 0.003
    const epi = tipo === 'luminal' || tipo === 'epitelial'
    return epi ? 0.08 + 0.55 * r() : 0.02 + 0.12 * r()
  }
  const expr: LesionDatos['expr'] = {}
  const suelo: LesionDatos['suelo'] = {}
  const referencia: LesionDatos['referencia'] = {}
  const veredicto: LesionDatos['veredicto'] = {}
  for (const gen of GENES) {
    const p = new Map(dz.tipos.map((t) => [t, pDet(gen, t)]))
    const nivel = 0.4 + 2.2 * r()
    const i: number[] = [], v: number[] = []
    celulas.forEach((c, k) => { if (r() < p.get(c.t)!) { i.push(k); v.push(sig3(10 ** (nivel + 0.35 * normal()))) } })
    expr[gen] = { i, v }
    const base = 0.01 + 0.08 * r()
    suelo[gen] = Object.fromEntries(grupos.map((g) => [g.id, Number((base * (0.6 + 0.8 * r())).toFixed(3))]))
    referencia[gen] = Number((0.02 + 0.3 * r()).toFixed(3))
    veredicto[gen] = 'sin_veredicto'
  }
  // sondas [unión, total] por gen, inventadas
  const sondas: LesionDatos['sondas'] = Object.fromEntries(GENES.map((g) => { const tot = 1 + Math.floor(r() * 5); return [g, [Math.floor(r() * (tot + 1) * 0.5), tot]] }))
  // selección del grupo de interés (circularidad) y una cifra sin circularidad, inventadas
  const papeles: [string, PapelSeleccion][] = l === 'higado'
    ? [['ESR1', 'identidad'], ['KRT19', 'identidad'], ['FGFR1', 'fgfr1_alto'], ['ALB', 'exclusion'], ['PTPRC', 'exclusion'], ['CCND1', 'ligado_er']]
    : [['KRT19', 'identidad'], ['EPCAM', 'identidad']]
  const seleccion: LesionDatos['seleccion'] = Object.fromEntries(papeles.filter(([g]) => GENES.includes(g)))
  const loo: LesionDatos['loo'] = l === 'higado'
    ? { ESR1: { n: 300 + Math.floor(r() * 100), frac: Number((0.2 + 0.4 * r()).toFixed(4)), ref: Number((0.1 + 0.3 * r()).toFixed(4)), cp10k_pseudobulk: Number((1 + 5 * r()).toFixed(1)) } }
    : {}
  const adnEst = Number((l === 'higado' ? 0.001 + 0.004 * r() : 0.05 + 0.2 * r()).toFixed(5))
  const adn: LesionDatos['adn'] = { sondas_dentro_de_exon: 40000 + Math.floor(r() * 5000), sondas_panel: 50000 + Math.floor(r() * 5000),
    frac_lecturas_estimada: adnEst, frac_lecturas_cell_ranger: Number(Math.min(1, adnEst * (1.2 + r())).toFixed(5)), frac_lecturas_interes: Number((adnEst * r()).toFixed(5)) }
  // CNV del hueso: puntuación log2 (observado / esperado), con negativos, como el fichero real
  const cnv: LesionDatos['cnv'] = l === 'higado'
    ? { pseudobulk: { ventana: '8p11', percentil_genoma: 87 } }
    : { ventanas: ['8p11', '11q13'], metodo: 'ejemplo', valores: [0, 1].map(() => celulas.map((c) => (r() < 0.05 ? null : dos(c.g === 0 ? 1.8 + 0.9 * normal() : -0.8 + 0.7 * normal())))) }
  return { version: 1, lesion: l, ejemplo: true, n_celulas: n, grupos, tipos: dz.tipos, celulas: { umap, grupo: celulas.map((c) => c.g), tipo: celulas.map((c) => dz.tipos.indexOf(c.t)) }, genes: GENES, expr, suelo, referencia, veredicto, sondas, seleccion, loo, adn, cnv }
}

mkdirSync(DIR, { recursive: true })
const ficheros: Manifiesto['ficheros'] = []
for (const l of ['higado', 'hueso'] as Lesion[]) {
  const txt = JSON.stringify(lesion(l))
  writeFileSync(join(DIR, `${l}.json`), txt)
  ficheros.push({ ruta: `${l}.json`, sha256: createHash('sha256').update(txt).digest('hex') })
}
const man: Manifiesto = { version: 1, ejemplo: true, sello: 'sin_verificar', ok_titular: false, modo_sondas: 'todas_incluidas', lesiones: ['higado', 'hueso'], ficheros }
writeFileSync(join(DIR, 'manifiesto.json'), `${JSON.stringify(man, null, 2)}\n`)
console.log(`ejemplo escrito en ${DIR}: ${ficheros.map((f) => `${f.ruta} ${f.sha256.slice(0, 12)}`).join(', ')}`)
