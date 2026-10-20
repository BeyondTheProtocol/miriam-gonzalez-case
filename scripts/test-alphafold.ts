// Test de AlphaFold en el explorador célula a célula (bloque «Forma predicha de … (AlphaFold)» en el detalle del gen).
//
// Por qué existe (20-oct-2026): la estructura de AlphaFold DB es información de cada proteína del explorador, no una
// página aparte (lo acordado con Miriam; /tres-dianas se retiró con un 301). Este test nació con /tres-dianas y se
// movió, no se tiró. Seis frenos:
//   1. el mapa gen → UniProt cubre EXACTAMENTE las diez de «Genes de interés», con UniProt de forma válida y los
//      cotejados el 20-oct contra UniProt REST;
//   2. la URL del modelo solo se acepta si es de AlphaFold DB, por https y de ESE UniProt (la API devuelve isoformas);
//   3. el lector del PDB y las bandas de pLDDT hacen lo que dicen;
//   4. el bloque va dentro del explorador, plegado, y el visor solo se monta al desplegarlo; la página vieja ya no existe
//      y su ruta redirige con 301;
//   5. el visor suelta su contexto WebGL, cancela y guarda la carga, pinta según el tema y deja los mandos fuera del
//      modelo (diseno, 20-oct; el comportamiento en navegador lo prueba test:alphafold-visor);
//   6. el muro del copy: crédito, citas y «predicción, no medición» visibles; sin «vacuna», «científica», «Olune» ni
//      «tumor» en el texto visible.
// Uso: pnpm test:alphafold   (no necesita build)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BANDAS, UNIPROT, banda, encuadre, pdbDeRespuesta, trazaCA, uniprotDe, uniprotValido } from '../app/utils/alphafold'
import { PANEL_INTERES } from '../app/utils/celulaExploradorTexto'

const raiz = join(import.meta.dirname, '..')
const lee = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8')
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }

/* ── 1 · el mapa gen → UniProt ── */
ok('cubre exactamente las diez de «Genes de interés»', JSON.stringify(Object.keys(UNIPROT).sort()) === JSON.stringify([...PANEL_INTERES].sort()),
  `${Object.keys(UNIPROT).sort().join()} ≠ ${[...PANEL_INTERES].sort().join()}`)
// cotejados el 20-oct-2026 contra UniProt REST (gene_exact, organism_id:9606, reviewed:true); si cambian, hay que volver a cotejar
const COTEJADOS: Record<string, string> = {
  ANKRD30A: 'Q9BXX3', TPBG: 'Q13641', ERBB3: 'P21860', SLC39A6: 'Q13433', ERBB2: 'P04626',
  TACSTD2: 'P09758', CD276: 'Q5ZPR3', NECTIN4: 'Q96NY8', MUC1: 'P15941', FGFR1: 'P11362',
}
for (const [g, u] of Object.entries(UNIPROT)) {
  ok(`${g}: UniProt con forma válida`, uniprotValido(u))
  ok(`${g}: el UniProt cotejado (${COTEJADOS[g]})`, COTEJADOS[g] === u, `${u}`)
}
ok('sin repetidos', new Set(Object.values(UNIPROT)).size === Object.keys(UNIPROT).length)
ok('un gen fuera de la lista no tiene bloque', uniprotDe('ESR1') === null && uniprotDe('') === null && uniprotDe('ERBB2') === 'P04626')

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

/* ── 4 · dentro del explorador, plegado; la página vieja, fuera ── */
const dir = ['app', 'components', 'celula', 'explorar'] as const
const explorador = lee(...dir, 'CelulaExplorarExplorador.vue')
const forma = lee(...dir, 'CelulaExplorarForma.vue')
const visor = lee(...dir, 'CelulaExplorarEstructura.client.vue')
const util = lee('app', 'utils', 'alphafold.ts')
const cfg = lee('nuxt.config.ts')
const tplForma = forma.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
ok('el bloque está en el detalle del gen (CelulaExplorarForma)', /<CelulaExplorarForma v-if="uniprotDetalle"/.test(explorador))
ok('va después de los violines (primero las cifras)', explorador.indexOf('<CelulaExplorarViolines') < explorador.indexOf('<CelulaExplorarForma'))
ok('plegado por defecto (<details> sin «open»)', /<details class="fo"/.test(tplForma) && !/<details[^>]*\sopen[\s>=:]/.test(tplForma))
ok('el visor solo se monta al desplegar (Lazy + v-if)', /<LazyCelulaExplorarEstructura v-if="abierta"/.test(tplForma))
// diseno, 20-oct: con el estado en el explorador, «Volver» y reabrir montaba el visor plegado; el estado vive en el bloque
ok('el estado «abierto» vive en el bloque, no en el explorador', /const abierta = ref\(false\)/.test(forma) && !/formaAbierta/.test(explorador))
ok('al montarse, el visor se pone a la vista', /@montado="formaALaVista"/.test(explorador) && /emit\('montado', lienzo\.value\)/.test(visor))
ok('ya no existe la página /tres-dianas ni su mapa propio', !existsSync(join(raiz, 'app', 'pages', 'tres-dianas.vue')) && !existsSync(join(raiz, 'app', 'components', 'diana')))
for (const ruta of ['/tres-dianas', '/en/three-targets', '/en/tres-dianas'])
  ok(`${ruta} redirige con 301 al explorador`, new RegExp(`'${ruta}': \\{ redirect: \\{ to: '/(en/cell-by-cell/explore|celula-a-celula/explorar)', statusCode: 301 \\} \\}`).test(cfg))
ok('sin ruta i18n de la página vieja', !/'tres-dianas':\s*\{\s*en:/.test(cfg))

/* ── 5 · el visor: recursos, tema y forma (diseno, 20-oct) ── */
ok('suelta el contexto WebGL al desmontarse (forceContextLoss antes de dispose)', /forceContextLoss\(\)\s*\n\s*renderer\?\.dispose\(\)/.test(visor))
ok('cancela la carga al desmontarse y guarda el modelo por UniProt', /corta\?\.abort\(\)/.test(visor) && /CACHE\.set\(props\.uniprot/.test(visor))
ok('colores por tema del explorador y repinta al cambiarlo', /tema: 'claro' \| 'oscuro'/.test(visor) && /watch\(\(\) => props\.tema, pinta\)/.test(visor) && /:tema="tema"/.test(explorador) && /:tema="tema"/.test(tplForma))
ok('los mandos van debajo del lienzo, en flujo', !/\.de__mandos \{[^}]*position:\s*absolute/.test(visor) && visor.indexOf('class="de__mandos"') > visor.indexOf('class="de__aviso"'))
ok('hover solo con puntero fino (sin hover pegado en táctil)', /@media \(hover: hover\) and \(pointer: fine\) \{ \.de__paso:hover/.test(visor))

/* ── 6 · el muro del copy ── */
ok('crédito y licencia visibles', visor.includes('(Google DeepMind · EMBL-EBI)') && visor.includes('creativecommons.org/licenses/by/4.0'))
ok('cita de AlphaFold (Jumper 2021) y de AlphaFold DB (Bertoni 2025)', visor.includes('10.1038/s41586-021-03819-2') && visor.includes('10.1093/nar/gkaf1226'))
ok('enlace a UniProt de la proteína', visor.includes('urlUniprot(uniprot)'))
// Adri y verificacion (20-oct): el bloque va bajo las cifras de la biopsia; que nadie lea «la proteína de Miriam»
ok('dice, arriba, que es la proteína de referencia y no la de la biopsia (ES y EN)', visor.includes('Es la proteína humana de referencia (UniProt), no la de la biopsia de Miriam.') && visor.includes('This is the human reference protein (UniProt)'))
ok('la regla de lectura de < 50 de la FAQ de AlphaFold DB (ES y EN)', visor.includes('(< 50) no se interpretan') && visor.includes('(< 50) should not be interpreted'))
ok('la leyenda va antes del crédito y las referencias', visor.indexOf('class="de__leyenda"') < visor.indexOf('class="de__fuente"') && visor.indexOf('class="de__fuente"') < visor.indexOf("L('Referencias:'"))
ok('cada estructura dice «predicción, no medición» (ES y EN)', visor.includes('Predicción, no medición.') && visor.includes('A prediction, not a measurement.'))
const visible = (tplForma + visor + util).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '')
for (const p of [/vacuna/i, /vaccine/i, /cient[ií]fica/i, /Olune/i]) ok(`sin ${p} en el texto visible`, !p.test(visible))
ok('no dice «tumor» ni «maligno»', !/tumor|malign|c[aá]ncer/i.test(visible))
ok('nada sobre fármacos ni dianas terapéuticas', !/f[aá]rmaco|drug|druggab|ep[ií]topo|epitope|tratamiento|treatment/i.test(visible))
ok('el giro se para, respeta el movimiento reducido y nunca gira más de un visor', visor.includes('prefers-reduced-motion') && /function para\(/.test(visor) && visor.includes('girandoAhora'))
ok('sin aria-pressed en un botón cuyo texto cambia (ceci, 20-oct)', !/aria-pressed/.test(visor))
ok('mandos de un solo puntero para girar y acercar (2.5.7)', ['Girar a la izquierda', 'Girar a la derecha', 'Acercar', 'Alejar'].every((x) => visor.includes(x)))

console.log(`${hechos - fallos}/${hechos} comprobaciones${fallos ? ` · ${fallos} FALLAN` : ' · todo en verde'}`)
if (fallos) process.exit(1)
