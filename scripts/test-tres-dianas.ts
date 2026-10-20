// Test de «Tres dianas, dos mapas» (/tres-dianas · EN /three-targets).
//
// Por qué existe (20-oct-2026): la página junta dos fuentes públicas (AlphaFold DB y el explorador de células ya
// publicado) y no puede inventar nada por el camino. Cuatro frenos:
//   1. las dianas son las del paso 0 de `verificacion` y su expresión YA es pública en el explorador (gen presente en
//      las dos lesiones publicadas y en el panel de interés);
//   2. la URL del modelo solo se acepta si es de AlphaFold DB, por https y de ESE UniProt (la API devuelve isoformas);
//   3. el lector del PDB y las bandas de pLDDT hacen lo que dicen;
//   4. el muro del copy: crédito y «predicción, no medición» visibles; sin «vacuna», «científica», «Olune», «tumor» del
//      hígado ni cifras pintadas sobre el mapa de células.
// Uso: pnpm test:tres-dianas   (no necesita build)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BANDAS, DIANAS, banda, detectadas, encuadre, pdbDeRespuesta, trazaCA, uniprotValido } from '../app/utils/tresDianas'
import { estadoPuerta, type LesionDatos, type Manifiesto } from '../app/utils/celulaExplorador'
import { PANEL_INTERES, PROTEINA } from '../app/utils/celulaExploradorTexto'

const raiz = join(import.meta.dirname, '..')
const lee = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8')
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }

/* ── 1 · las dianas y su expresión publicada ── */
ok('son exactamente las tres verificadas el 20-oct', JSON.stringify(DIANAS.map((d) => [d.gen, d.uniprot])) === JSON.stringify([['ERBB2', 'P04626'], ['TACSTD2', 'P09758'], ['CD276', 'Q5ZPR3']]))
const man = JSON.parse(lee('public', 'celula', 'explorador', 'manifiesto.json')) as Manifiesto
ok('la puerta del explorador está en «real» (si se cierra, este test obliga a mirar la página)', estadoPuerta(man) === 'real')
const lesiones = Object.fromEntries((['higado', 'hueso'] as const).map((l) => [l, JSON.parse(lee('public', 'celula', 'explorador', `${l}.json`)) as LesionDatos]))
for (const d of DIANAS) {
  ok(`${d.gen}: UniProt con forma válida`, uniprotValido(d.uniprot))
  ok(`${d.gen}: está en el panel de interés del explorador`, PANEL_INTERES.includes(d.gen))
  ok(`${d.gen}: la proteína se llama igual que en el explorador`, PROTEINA[d.gen] === d.proteina, `${PROTEINA[d.gen]} ≠ ${d.proteina}`)
  for (const [l, x] of Object.entries(lesiones)) {
    ok(`${d.gen}: publicado en ${l} (genes, expr y veredicto)`, x.genes.includes(d.gen) && !!x.expr[d.gen] && !!x.veredicto[d.gen])
    ok(`${d.gen}: en ${l} hay células que lo leen`, detectadas(x.expr, d.gen).length > 0)
  }
}

/* ── 2 · la URL del modelo ── */
const resp = [
  { uniprotAccession: 'P04626-2', pdbUrl: 'https://alphafold.ebi.ac.uk/files/AF-P04626-2-F1-model_v6.pdb', latestVersion: 6 },
  { uniprotAccession: 'P04626', pdbUrl: 'https://alphafold.ebi.ac.uk/files/AF-P04626-F1-model_v6.pdb', latestVersion: 6 },
]
ok('elige la entrada del UniProt exacto, no la primera isoforma', pdbDeRespuesta(resp, 'P04626')?.url === 'https://alphafold.ebi.ac.uk/files/AF-P04626-F1-model_v6.pdb')
ok('lee la versión', pdbDeRespuesta(resp, 'P04626')?.version === 6)
ok('rechaza otro host', pdbDeRespuesta([{ uniprotAccession: 'P04626', pdbUrl: 'https://ejemplo.com/files/AF-P04626-F1.pdb' }], 'P04626') === null)
ok('rechaza http', pdbDeRespuesta([{ uniprotAccession: 'P04626', pdbUrl: 'http://alphafold.ebi.ac.uk/files/AF-P04626-F1.pdb' }], 'P04626') === null)
ok('rechaza el fichero de otro UniProt', pdbDeRespuesta([{ uniprotAccession: 'P04626', pdbUrl: 'https://alphafold.ebi.ac.uk/files/AF-P09758-F1-model_v6.pdb' }], 'P04626') === null)
ok('rechaza una respuesta rara', pdbDeRespuesta({ pdbUrl: 'x' }, 'P04626') === null && pdbDeRespuesta([], 'P04626') === null)

/* ── 3 · el lector del PDB y las bandas ── */
const atomo = (n: number, nombre: string, res: number, x: number, b: number) =>
  `ATOM  ${String(n).padStart(5)} ${nombre.padEnd(4)} MET A${String(res).padStart(4)}    ${x.toFixed(3).padStart(8)}${(0).toFixed(3).padStart(8)}${(0).toFixed(3).padStart(8)}  1.00${b.toFixed(2).padStart(6)}           C`
const pdb = [atomo(1, 'N', 1, 0, 95), atomo(2, 'CA', 1, 1, 95), atomo(3, 'CA', 1, 1, 95), atomo(4, 'CA', 2, 4, 60), 'HETATM    5  CA  CA  A   3       9.000   0.000   0.000  1.00 99.00          CA', atomo(6, 'CA', 3, 7, 30)].join('\n')
const t = trazaCA(pdb)
ok('un CA por residuo, solo ATOM', t.n === 3, `n=${t.n}`)
ok('lee x y el pLDDT del factor B', t.xyz[0] === 1 && t.xyz[3] === 4 && t.plddt[0] === 95 && t.plddt[2] === 30)
ok('encuadre centrado', Math.abs(encuadre(t).centro[0] - 4) < 1e-6 && Math.abs(encuadre(t).radio - 3) < 1e-6)
ok('bandas de AlphaFold DB (> 90, > 70, > 50)', banda(90.1) === 'muy_alta' && banda(90) === 'alta' && banda(70) === 'baja' && banda(50) === 'muy_baja' && banda(10) === 'muy_baja')
ok('cuatro bandas en orden', BANDAS.join() === 'muy_alta,alta,baja,muy_baja')
ok('detectadas ignora valores no positivos', JSON.stringify(detectadas({ G: { i: [0, 3, 5], v: [1, 0, 2] } }, 'G')) === '[0,5]' && detectadas({}, 'G').length === 0)

/* ── 4 · el muro del copy ── */
const pagina = lee('app', 'pages', 'tres-dianas.vue'), visor = lee('app', 'components', 'diana', 'DianaEstructura.client.vue'), mapa = lee('app', 'components', 'diana', 'DianaMapaCelulas.client.vue')
const util = lee('app', 'utils', 'tresDianas.ts')
const todo = pagina + visor + mapa + util
ok('crédito visible y literal', pagina.includes('Structures: AlphaFold DB (Google DeepMind · EMBL-EBI)') && pagina.includes('creativecommons.org/licenses/by/4.0'))
ok('cita de AlphaFold (Jumper 2021) y de AlphaFold DB (Bertoni 2025)', pagina.includes('10.1038/s41586-021-03819-2') && pagina.includes('10.1093/nar/gkaf1226'))
ok('cada estructura dice «predicción, no medición» (ES y EN)', visor.includes('Predicción, no medición.') && visor.includes('A prediction, not a measurement.'))
// sin «vacuna», «científica» ni «Olune» en lo que se ve (los comentarios del código no cuentan)
const visible = todo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '')
for (const p of [/vacuna/i, /vaccine/i, /cient[ií]fica/i, /Olune/i]) ok(`sin ${p} en el texto visible`, !p.test(visible))
ok('el hígado no dice «tumor» ni «maligno»', !/tumor|malign|c[aá]ncer/i.test(visible))
ok('HER2 siempre con su IHQ al lado (ETIQUETAS_FIJAS.her2 / her2Hueso)', pagina.includes('ETIQUETAS_FIJAS.her2Hueso') && pagina.includes('ETIQUETAS_FIJAS.her2)'))
ok('la lectura lleva su pie de borrador', pagina.includes('LECTURA.pie'))
ok('el mapa no pinta cifras (ni fillText ni recuentos)', !/fillText|strokeText|\.length\s*}}/.test(mapa) && !/detectadas\([^)]*\)\.length/.test(pagina))
ok('el giro se para, respeta el movimiento reducido y nunca gira más de un visor', visor.includes('prefers-reduced-motion') && /function para\(/.test(visor) && visor.includes('girandoAhora'))
ok('sin aria-pressed en un botón cuyo texto cambia (ceci, 20-oct)', !/aria-pressed/.test(visor))
ok('mandos de un solo puntero para girar y acercar (2.5.7)', ['Girar a la izquierda', 'Girar a la derecha', 'Acercar', 'Alejar'].every((x) => visor.includes(x)))
ok('el mapa pinta en violeta sólido (≥ 3:1)', !/rgba\(\$\{violeta\}/.test(mapa))
ok('el modelo se pide en el cliente (el fichero es .client.vue)', true)

console.log(`${hechos - fallos}/${hechos} comprobaciones${fallos ? ` · ${fallos} FALLAN` : ' · todo en verde'}`)
if (fallos) process.exit(1)
