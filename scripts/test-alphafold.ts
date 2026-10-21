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
//      modelo, con iconos Phosphor cotejados; el aviso de la rueda sale una vez por visor (diseno, 20-oct; el
//      comportamiento en navegador lo prueba test:alphafold-visor);
//   6. el muro del copy: crédito, citas y «predicción, no medición» visibles; sin «vacuna», «científica», «Olune» ni
//      «tumor» en el texto visible;
//   7. la vista previa al pasar el ratón por «3D» (Miriam, 21-oct-2026): una sola, solo con ratón, sin abrirse al enfocar,
//      con el visor compacto (sin mandos, vuelta de 5 s, ids propios), los avisos y la regla de confianza muy baja (> 50 %,
//      cotejada con la API de AlphaFold DB el 21-oct). El comportamiento en navegador lo prueba test:alphafold-visor.
// Uso: pnpm test:alphafold   (no necesita build)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BANDAS, UMBRAL_AVISO, UNIPROT, avisoConfianza, banda, encuadre, fraccionMuyBaja, pdbDeRespuesta, trazaCA, uniprotDe, uniprotValido } from '../app/utils/alphafold'
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
ok('fracción de confianza muy baja (< 50, como la banda)', fraccionMuyBaja([95, 60, 30, 50]) === 0.5 && fraccionMuyBaja([]) === 0 && fraccionMuyBaja(t.plddt) === 1 / 3)
// fractionPlddtVeryLow de la API de AlphaFold DB (v6), cotejada el 21-oct-2026 con curl (verificacion: en MUC1 la traza del PDB
// da 891/1255 = 0,71, lo mismo). Si AlphaFold DB publica otra versión, se vuelve a cotejar
const MUY_BAJA_V6: Record<string, number> = {
  MUC1: 0.71, ANKRD30A: 0.523, SLC39A6: 0.461, ERBB3: 0.297, ERBB2: 0.245, FGFR1: 0.234, NECTIN4: 0.157, TPBG: 0.14, CD276: 0.107, TACSTD2: 0.087,
}
ok('el umbral del aviso es «más de la mitad»', UMBRAL_AVISO === 0.5 && !avisoConfianza(0.5) && avisoConfianza(0.501))
const conAviso = Object.keys(MUY_BAJA_V6).filter((g) => avisoConfianza(MUY_BAJA_V6[g]!)).sort().join()
ok('con la v6, el aviso fuerte sale en MUC1 y ANKRD30A, no en LIV-1 (0,461) ni en las demás', conAviso === 'ANKRD30A,MUC1', conAviso)
ok('las cifras cotejadas son de las diez', JSON.stringify(Object.keys(MUY_BAJA_V6).sort()) === JSON.stringify(Object.keys(UNIPROT).sort()))

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
ok('plegado por defecto (<details> sin «open»)', /<details[^>]*\sclass="fo"/.test(tplForma) && !/<details[^>]*\sopen[\s>=:]/.test(tplForma))
ok('el visor solo se monta al desplegar (Lazy + v-if)', /<LazyCelulaExplorarEstructura v-if="abierta"/.test(tplForma))
// diseno, 20-oct: con el estado en el explorador, «Volver» y reabrir montaba el visor plegado; el estado vive en el bloque
ok('el estado «abierto» vive en el bloque, no en el explorador', /const abierta = ref\(false\)/.test(forma) && !/formaAbierta/.test(explorador))
ok('al montarse, el visor y sus mandos se ponen a la vista', /@montado="formaALaVista"/.test(explorador) && /emit\('montado', visorEl\.value\)/.test(visor) && /\.de__mandos-caja \{ min-height: 44px; \}/.test(visor))
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
// diseno, 20-oct: los mandos eran glifos de texto (↶ ↷ + −) que salían de una fuente de reserva y bajaban 1–2 px; ahora son
// los iconos de Phosphor (regular) que usa .exp__volver. Paths cotejados el 20-oct contra @phosphor-icons/core 2.1.1
// (assets/regular/*.svg); si se cambia de icono, se vuelve a cotejar contra la fuente, no se dibuja de memoria
const PHOSPHOR: Record<string, string> = {
  'arrow-arc-left': 'M232,184a8,8,0,0,1-16,0A88,88,0,0,0,65.78,121.78L43.4,144H88a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v44.77l22.48-22.33A104,104,0,0,1,232,184Z',
  'arrow-arc-right': 'M240,88v64a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h44.6l-22.36-22.21A88,88,0,0,0,40,184a8,8,0,0,1-16,0,104,104,0,0,1,177.54-73.54L224,132.77V88a8,8,0,0,1,16,0Z',
  plus: 'M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z',
  minus: 'M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z',
}
const pasos = visor.match(/<div class="de__pasos"[\s\S]*?\n {6}<\/div>/)?.[0] ?? ''
const iconos = [...pasos.matchAll(/<svg viewBox="0 0 256 256" aria-hidden="true"><path fill="currentColor" d="([^"]+)" \/><\/svg>/g)].map((m) => m[1])
ok('los cuatro mandos llevan su icono Phosphor, en orden (girar ←, girar →, acercar, alejar)', JSON.stringify(iconos) === JSON.stringify(Object.values(PHOSPHOR)), `${iconos.length} iconos`)
ok('sin glifos de texto en los mandos', !/[↶↷−]|>\+</.test(pasos))
ok('iconos de 20 px centrados por la caja del botón', /\.de__paso \{[^}]*display: grid; place-items: center;/.test(visor) && /\.de__paso svg \{ display: block; width: 20px; height: 20px; \}/.test(visor))
// diseno, 20-oct: en el panel con scroll el aviso «Ctrl o ⌘ + rueda» reaparecía en cada gesto. Sale una vez por visor; lo que
// NO se puede cortar es el stopPropagation de cada gesto (si el «ya avisado» va antes, la rueda sola acerca en los cinco visores)
const rueda = lee('app', 'composables', 'useAlVer.ts').match(/export function ruedaConModificador[\s\S]*?\n\}/)?.[0] ?? ''
ok('aviso de rueda: una vez por visor, y la rueda sola sigue sin llegar al canvas', /e\.stopPropagation\(\)\s*\n\s*if \(avisado\) return/.test(rueda) && /setTimeout\(\(\) => \{ avisado = true;/.test(rueda))

/* ── 7 · la vista previa al pasar el ratón (21-oct-2026) ── */
const vista = lee(...dir, 'CelulaExplorarVistaForma.vue')
const interes = lee(...dir, 'CelulaExplorarInteres.vue')
const tplVista = vista.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
const boton3d = interes.match(/<button v-if="uniprotDe\(f\.gen\)"[\s\S]*?<\/button>/)?.[0] ?? ''
const CUBE = 'M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z'
ok('«3D» solo en las proteínas con modelo, hermano del botón del gen (nunca dentro)', !!boton3d && /<\/button>\s*<!--[\s\S]*?-->\s*<button v-if="uniprotDe\(f\.gen\)"/.test(interes))
ok('«3D» con texto visible y nombre accesible que lo contiene (2.5.3)', />3D<\/span>/.test(boton3d) && /`Forma 3D de \$\{nombre\(f\.gen\)\}`/.test(boton3d) && /`3D shape of /.test(boton3d))
ok('«3D» dice que abre un diálogo y si está abierto', /aria-haspopup="dialog"/.test(boton3d) && /:aria-expanded="formaAbierta === f\.gen"/.test(boton3d))
// diseno, 21-oct: abrir al enfocar abriría diez vistas al recorrer la lista con Tab; con teclado, Enter/Espacio (el clic)
ok('no se abre al enfocar', !/@focus(in)?=/.test(boton3d))
ok('el hover solo cuenta con ratón (el toque emula un mouseenter)', /pointerType === 'mouse'/.test(interes) && /@pointerenter="forma3d\(\$event, 'entra'/.test(boton3d))
ok('icono «cube» de Phosphor cotejado (lista y detalle)', boton3d.includes(CUBE) && explorador.includes(CUBE))
ok('una sola vista previa en el explorador, dentro de .exp', (explorador.match(/<CelulaExplorarVistaForma /g) ?? []).length === 1 && explorador.indexOf('<CelulaExplorarVistaForma') < explorador.lastIndexOf('</section>'))
ok('esperas de abrir y cerrar (400 / 400 ms: del botón a la flotante hay ~80 px; diseno)', /ESPERA_ABRE = 400/.test(vista) && /ESPERA_CIERRA = 400/.test(vista))
ok('Tab fuera de la fija devuelve el foco al «3D» (2.4.3)', /!ancla\?\.contains\(t\)\) cierra\(true\)/.test(vista))
ok('la flotante no tapa la cabecera ni el aviso fijo, y su alto se acota (desplaza por dentro)', /--exp-top/.test(vista) && /--exp-banner/.test(vista) && /maxHeight: pos\.alto/.test(tplVista))
ok('al crecer el contenido no se recentra (no salta)', /coloca\(false\)/.test(vista))
ok('hoja: «Ver la forma completa» en un pie fuera del scroll', /<div class="pv__pie">\s*<button type="button" class="pv__completa"/.test(tplVista) && /\.pv__dentro \{ flex: 1; min-height: 0; overflow-y: auto;/.test(vista))
ok('contraste: en hover y abierto, el texto de «3D», «Forma 3D» y «Ver la forma completa» pasa a tinta', /\.gin__3d:hover \{[^}]*color: var\(--texto-1\)/.test(interes) && /\.gin__3d\[aria-expanded='true'\] \{[^}]*color: var\(--texto-1\)/.test(interes) && /\.exp__dforma:hover \{[^}]*color: var\(--texto-1\)/.test(explorador) && /\.pv__completa:hover \{[^}]*color: var\(--texto-1\)/.test(vista))
ok('los «3D» en columna (rejilla) y, a 320 px, bajo el símbolo', /\.gin__genfila \{ display: grid; grid-template-columns: 1fr auto;/.test(interes) && /@container \(max-width: 300px\)/.test(interes))
ok('Esc la cierra y el foco vuelve al «3D» (fija y hoja)', /e\.key !== 'Escape'/.test(vista) && /ancla\.focus\(/.test(vista) && /@close="alCerrarHoja"/.test(tplVista))
ok('capa superior: popover manual en escritorio y <dialog> modal en la hoja', /popover="manual"/.test(tplVista) && /showPopover\(\)/.test(vista) && /<dialog ref="hoja"/.test(tplVista) && /showModal\(\)/.test(vista))
ok('sin Teleport (heredaría el tema de :root, no el de .exp)', !/Teleport/i.test(tplVista))
ok('el visor de la vista previa es el mismo, en compacto, montado solo al abrir', (tplVista.match(/<LazyCelulaExplorarEstructura [^>]*compacto/g) ?? []).length === 2 && /v-if="abierta && abierta\.modo !== 'hoja'"/.test(tplVista) && /v-if="abierta && abierta\.modo === 'hoja'"/.test(tplVista))
ok('«Ver la forma completa» abre el bloque desde fuera, sin guardar su estado en el explorador', /defineExpose\(\{ abre \}\)/.test(forma) && /formaRef\.value\?\.abre\(\)/.test(explorador) && /formaRef\?\.abre\(\)/.test(explorador) && !/formaAbierta/.test(explorador))
ok('compacto: ids y giro propios (sufijo -pv)', /const uid = `de-\$\{props\.uniprot\}\$\{props\.compacto \? '-pv' : ''\}`/.test(visor))
ok('compacto: sin arrastre ni rueda, sin foco, role="img"', /if \(!props\.compacto\) \{\s*\n\s*controles = new OrbitControls/.test(visor) && /compacto \? 'img' : 'application'/.test(visor) && /:tabindex="estado === 'listo' && !compacto \? 0 : undefined"/.test(visor) && /<div v-if="!compacto" class="de__mandos-caja">/.test(visor))
ok('compacto: una vuelta de 5 s (2.2.2), y quieta con movimiento reducido', /const SEG_VUELTA = props\.compacto \? 5 : 14/.test(visor) && /if \(!reduce && props\.compacto\) unaVuelta\(\)/.test(visor))
ok('compacto: no mueve la página al montarse', /if \(visorEl\.value && !props\.compacto\) emit\('montado'/.test(visor))
const pieCompacto = visor.match(/<figcaption v-if="compacto"[\s\S]*?<\/figcaption>/)?.[0] ?? ''
ok('la vista previa lleva sello, «sin datos de la biopsia», leyenda, la línea de % y el crédito CC BY', pieCompacto.includes('Predicción, no medición.') && pieCompacto.includes('sin datos de la biopsia de Miriam') && pieCompacto.includes('with no data from Miriam’s biopsy') && pieCompacto.includes('class="de__leyenda"') && pieCompacto.includes('Confianza muy baja (pLDDT < 50) en el') && pieCompacto.includes('(Google DeepMind · EMBL-EBI)') && pieCompacto.includes('creativecommons.org/licenses/by/4.0'))
ok('el aviso fuerte sale de la regla, no de una lista de genes, y lleva dentro la línea del %', /<p v-if="estado !== 'listo' \|\| !avisoConfianza\(fMuyBaja\)" class="de__linea">[\s\S]*?<p v-else class="de__alerta">\s*\{\{ L\(`Confianza muy baja \(pLDDT < 50\) en el \$\{pctMuyBaja\}/.test(pieCompacto) && !/MUC1|ANKRD30A/.test(pieCompacto))
ok('mientras carga, leyenda y línea guardan su sitio sin verse', /class="de__pvdatos" :style="estado === 'listo' \? undefined : \{ visibility: 'hidden' \}"/.test(pieCompacto))
ok('el aviso dice lo de la FAQ (no se interpretan; sin forma fija o dentro de un complejo)', pieCompacto.includes('esas zonas no deben interpretarse') && pieCompacto.includes('dentro de un complejo') && pieCompacto.includes('should not be interpreted'))

/* ── 6 · el muro del copy ── */
ok('crédito y licencia visibles', visor.includes('(Google DeepMind · EMBL-EBI)') && visor.includes('creativecommons.org/licenses/by/4.0'))
ok('cita de AlphaFold (Jumper 2021) y de AlphaFold DB (Bertoni 2025)', visor.includes('10.1038/s41586-021-03819-2') && visor.includes('10.1093/nar/gkaf1226'))
ok('enlace a UniProt de la proteína', visor.includes('urlUniprot(uniprot)'))
// Adri y verificacion (20-oct): el bloque va bajo las cifras de la biopsia; que nadie lea «la proteína de Miriam»
ok('dice, arriba, que parte de la secuencia de referencia y no de la biopsia (ES y EN)', visor.includes('Se calcula a partir de la secuencia de referencia de la proteína humana (UniProt), sin datos de la biopsia de Miriam.') && visor.includes('Built from the reference sequence of the human protein (UniProt), with no data from Miriam’s biopsy.'))
ok('la regla de lectura de < 50 de la FAQ de AlphaFold DB (ES y EN)', visor.includes('(< 50) no se interpretan') && visor.includes('(< 50) should not be interpreted'))
ok('la leyenda va antes del crédito y las referencias', visor.indexOf('class="de__leyenda"') < visor.indexOf('class="de__fuente"') && visor.indexOf('class="de__fuente"') < visor.indexOf("L('Referencias:'"))
ok('cada estructura dice «predicción, no medición» (ES y EN)', visor.includes('Predicción, no medición.') && visor.includes('A prediction, not a measurement.'))
const visible = (tplForma + visor + util + tplVista + boton3d).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '')
for (const p of [/vacuna/i, /vaccine/i, /cient[ií]fica/i, /Olune/i]) ok(`sin ${p} en el texto visible`, !p.test(visible))
ok('no dice «tumor» ni «maligno»', !/tumor|malign|c[aá]ncer/i.test(visible))
ok('nada sobre fármacos ni dianas terapéuticas', !/f[aá]rmaco|drug|druggab|ep[ií]topo|epitope|tratamiento|treatment/i.test(visible))
ok('el giro se para, respeta el movimiento reducido y nunca gira más de un visor', visor.includes('prefers-reduced-motion') && /function para\(/.test(visor) && visor.includes('girandoAhora'))
ok('sin aria-pressed en un botón cuyo texto cambia (ceci, 20-oct)', !/aria-pressed/.test(visor))
ok('mandos de un solo puntero para girar y acercar (2.5.7)', ['Girar a la izquierda', 'Girar a la derecha', 'Acercar', 'Alejar'].every((x) => visor.includes(x)))

console.log(`${hechos - fallos}/${hechos} comprobaciones${fallos ? ` · ${fallos} FALLAN` : ' · todo en verde'}`)
if (fallos) process.exit(1)
