// Test del explorador de /celula-a-celula/explorar (contrato de datos, puerta, muro en la forma y léxico).
//
// Por qué existe (17-oct-2026): public/ se sirve tal cual y la preview de Netlify también es pública. En
// esta fase SOLO puede haber datos sintéticos (`ejemplo: true`); el export real vive en la zona clínica
// de Polaris y entra aquí únicamente con `sello: "verificado"`, `ok_titular: true`, `fecha_ok` y
// `modo_sondas: "todas_incluidas"` (la única versión que se decidió publicar). Frenos:
//   1. el CONTRATO de public/celula/explorador/: cada fichero está en el manifiesto con su sha256 (nada
//      suelto), ejemplo y real no se mezclan, y el ejemplo no lleva ninguna lectura de la revisión;
//   2. la PUERTA (función pura), con un fixture propio y mutantes;
//   3. el MURO en la forma: el hígado no tiene CNV por célula ni grupo «tumor»; cada grupo trae su n y
//      cada gen su suelo por grupo; nada con forma de barcode, de ID de bloque ni de fecha;
//   4. el LÉXICO y el copy obligatorio de la página (sin «diana» ni «perfil molecular»);
//   5. los cálculos que pinta la página (porGrupo, coexpresión, densidad).
// Uso: pnpm test:celula-explorador   (no necesita build)
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import {
  MARCADORES_N, PAPELES_SELECCION, RE_BARCODE, VEREDICTOS, columna, coexpresion, densidad, estadoPuerta, fechaOkValida, motivosLesion, nivelMatriz, pct, porGrupo, tablaCoexp,
  type LesionDatos, type Manifiesto,
} from '../app/utils/celulaExplorador'
import { ETIQUETA_GRUPO, ETIQUETA_TIPO, ETIQUETA_VEREDICTO, PAPEL_SELECCION } from '../app/utils/celulaExploradorTexto'
import { abreZarr } from '../app/utils/celulaExploradorZarr'
import FileSystemStore from '@zarrita/storage/fs'

const RAIZ = join(import.meta.dirname, '..')
const DIR = join(RAIZ, 'public', 'celula', 'explorador')
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }
const clon = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const lee = (p: string) => readFileSync(p, 'utf8')

/* ── 1 · contrato de lo publicado ── */
const man = JSON.parse(lee(join(DIR, 'manifiesto.json'))) as Manifiesto
const enDisco = readdirSync(DIR).filter((f) => f !== 'manifiesto.json' && f !== 'zarr').sort()
ok('todo fichero de la carpeta está en el manifiesto (nada suelto: public/ es público aunque no se pinte)',
  JSON.stringify(enDisco) === JSON.stringify(man.ficheros.map((f) => f.ruta).sort()), `disco ${enDisco} / manifiesto ${man.ficheros.map((f) => f.ruta)}`)
/** Huella del árbol de un Zarr: sha256 del listado «ruta sha256» de todos sus ficheros, ordenado (la misma que ejemplo.py de Polaris). */
const shaArbol = (dir: string) => {
  const filas: string[] = []
  const anda = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) anda(p); else filas.push(`${relative(dir, p).split(sep).join('/')} ${createHash('sha256').update(readFileSync(p)).digest('hex')}`) } }
  anda(dir)
  return createHash('sha256').update(filas.sort().join('\n')).digest('hex')
}
const zarrEnDisco = readdirSync(DIR).includes('zarr') ? readdirSync(join(DIR, 'zarr')).sort().map((z) => `zarr/${z}`) : []
ok('todo Zarr de la carpeta está en el manifiesto (y solo esos)', JSON.stringify(zarrEnDisco) === JSON.stringify((man.zarr ?? []).map((z) => z.ruta).sort()), `disco ${zarrEnDisco}`)
for (const z of man.zarr ?? []) ok(`${z.ruta}: huella del árbol del manifiesto`, shaArbol(join(DIR, z.ruta)) === z.sha256_arbol)
// FAIL-CLOSED (revisión de verificación, 18-oct): un Zarr real en public/ se descarga por su URL aunque la interfaz lo
// esconda. Con datos reales, ningún Zarr en la carpeta sin la fecha de la decisión de publicar la matriz completa.
if (man.ejemplo !== true && (zarrEnDisco.length || man.zarr?.length)) {
  const mcR = man.matriz_completa
  ok('real con Zarr en la carpeta: solo con la fecha de la decisión de publicar la matriz completa',
    typeof mcR === 'object' && mcR !== null && fechaOkValida((mcR as { fecha_decision?: unknown }).fecha_decision))
}
if (man.ejemplo === true) ok('el ejemplo no puede declarar una decisión real de la matriz completa', man.matriz_completa === undefined || man.matriz_completa === 'ejemplo')
for (const f of man.ficheros) {
  const sha = createHash('sha256').update(readFileSync(join(DIR, f.ruta))).digest('hex')
  ok(`${f.ruta}: sha256 del manifiesto`, sha === f.sha256)
}
ok('el manifiesto declara hígado y hueso', JSON.stringify(man.lesiones) === '["higado","hueso"]')
const esEjemplo = man.ejemplo === true
if (esEjemplo) {
  ok('ejemplo: no lleva sello verificado ni OK (no puede pasar por real)', man.sello !== 'verificado' && man.ok_titular === false && !('fecha_ok' in man))
}
else {
  ok('real: verificado, con OK de la titular, su fecha y la versión de todas las sondas', man.sello === 'verificado' && man.ok_titular === true
    && fechaOkValida(man.fecha_ok) && man.modo_sondas === 'todas_incluidas')
}
ok('el manifiesto no lleva el nombre de la titular en ninguna clave', !Object.keys(man).some((k) => /miriam/i.test(k)))
const lesiones: Record<string, LesionDatos> = {}
for (const l of man.lesiones) {
  const crudo = lee(join(DIR, `${l}.json`))
  const d = JSON.parse(crudo) as LesionDatos
  lesiones[l] = d
  const m = motivosLesion(d, { lesion: l, ejemplo: esEjemplo })
  ok(`${l}: forma y muro (motivosLesion vacío)`, m.length === 0, m.join('; '))
  ok(`${l}: nada con forma de barcode 10x`, !RE_BARCODE.test(crudo))
  ok(`${l}: nada con forma de ID de bloque ni de probe barcode`, !/\b[A-Z]?\d{2}-\d{4,6}\b|\b[A-H]-[A-H]\d{1,2}\b/.test(crudo))
  ok(`${l}: ninguna fecha`, !/\b(19|20)\d\d-\d\d-\d\d\b/.test(crudo))
  ok(`${l}: solo las claves del contrato`, JSON.stringify(Object.keys(d).sort()) === JSON.stringify(['adn', 'adn_por_grupo', 'celulas', 'cnv', 'ejemplo', 'expr', 'genes', 'grupos', 'lesion', 'loo', 'marcadores', 'n_celulas', 'perfil_bins', 'qc', 'referencia', 'seleccion', 'sondas', 'suelo', 'tipos', 'veredicto', 'version'].filter((k) => esEjemplo || k !== 'ejemplo').sort()), Object.keys(d).join(','))
  if (esEjemplo) ok(`${l}: el ejemplo no lleva ninguna lectura de la revisión (todo «sin_veredicto»)`, Object.values(d.veredicto).every((v) => v === 'sin_veredicto'))
}

/* ── 2 · la puerta ── */
const base: Manifiesto = { version: 1, ejemplo: true, sello: 'sin_verificar', ok_titular: false, modo_sondas: 'todas_incluidas', lesiones: ['higado', 'hueso'], ficheros: [] }
const real = (cambios: Partial<Manifiesto>) => ({ ...clon(base), ejemplo: undefined, sello: 'verificado', ok_titular: true, fecha_ok: '2026-10-20', ...cambios }) as Manifiesto
ok('ejemplo sin demo: cerrada', estadoPuerta(base) === 'cerrada')
ok('ejemplo con demo: ejemplo', estadoPuerta(base, { demo: true }) === 'ejemplo')
ok('real verificado + OK + fecha: real', estadoPuerta(real({})) === 'real')
ok('real sin OK: cerrada (también con demo)', estadoPuerta(real({ ok_titular: false })) === 'cerrada' && estadoPuerta(real({ ok_titular: false }), { demo: true }) === 'cerrada')
ok('OK sin verificado: cerrada', estadoPuerta(real({ sello: 'inferido' })) === 'cerrada')
ok('ok_titular como texto «true»: cerrada', estadoPuerta(real({ ok_titular: 'true' as never })) === 'cerrada')
ok('la clave vieja (con el nombre) ya no abre: cerrada', estadoPuerta({ ...real({}), ok_titular: undefined, ['ok_' + 'miriam']: true } as never) === 'cerrada')
ok('la versión solo spliced nunca abre: cerrada', estadoPuerta(real({ modo_sondas: 'solo_spliced' })) === 'cerrada')
ok('sin modo_sondas: cerrada', estadoPuerta(real({ modo_sondas: undefined })) === 'cerrada')
ok('sin fecha del OK: cerrada', estadoPuerta(real({ fecha_ok: undefined })) === 'cerrada')
// fecha_ok de calendario, como fecha_ok_valida de Polaris (revisión del muro, 17-oct-2026: «2026-13-45» abría la puerta)
for (const [qué, f] of [
  ['mes 13 y día 45', '2026-13-45'], ['30 de febrero', '2026-02-30'], ['29 de febrero de un año no bisiesto', '2026-02-29'], ['año 0', '0000-01-01'],
  ['mes 0', '2026-00-10'], ['día 0', '2026-10-00'], ['salto de línea detrás', '2026-10-20\n'], ['espacio delante', ' 2026-10-20'],
  ['cifras árabes orientales', '٢٠٢٦-١٠-٢٠'], ['con hora', '2026-10-20T10:00'], ['día-mes-año', '20-10-2026'], ['texto', 'hoy'], ['número', 20261020 as never],
] as const) ok(`fecha_ok «${qué}»: cerrada`, estadoPuerta(real({ fecha_ok: f as string })) === 'cerrada')
ok('fecha_ok 29 de febrero de un bisiesto: real', estadoPuerta(real({ fecha_ok: '2028-02-29' })) === 'real')
ok('fechaOkValida: los años 0-99 no se cuelan como 1900+', !fechaOkValida('0099-02-29') && fechaOkValida('0096-02-29'))
ok('ejemplo con sello verificado y OK: sigue sin pasar por real', estadoPuerta({ ...clon(base), sello: 'verificado', ok_titular: true, fecha_ok: '2026-10-20' }) === 'cerrada')
ok('sin manifiesto: cerrada', estadoPuerta(null) === 'cerrada' && estadoPuerta(undefined) === 'cerrada')
ok('manifiesto roto: cerrada', estadoPuerta({ version: 1 } as never, { demo: true }) === 'cerrada')
// nivel de TODOS los genes (Zarr) = publicar la matriz completa: con datos reales, solo con la fecha de esa decisión
const zs = { zarr: [{ ruta: 'zarr/higado.zarr', sha256_arbol: 'x' }, { ruta: 'zarr/hueso.zarr', sha256_arbol: 'x' }] }
ok('ejemplo con demo y matriz_completa «ejemplo»: todos los genes', nivelMatriz({ ...clon(base), ...zs, matriz_completa: 'ejemplo' }, 'ejemplo') === 'todos')
ok('ejemplo sin matriz_completa: solo el panel', nivelMatriz({ ...clon(base), ...zs }, 'ejemplo') === 'panel')
ok('real sin la decisión de la matriz completa: solo el panel', nivelMatriz(real(zs), 'real') === 'panel')
ok('real con matriz_completa «ejemplo»: solo el panel (no abre lo real)', nivelMatriz(real({ ...zs, matriz_completa: 'ejemplo' }), 'real') === 'panel')
ok('real con la fecha de la decisión: todos los genes', nivelMatriz(real({ ...zs, matriz_completa: { fecha_decision: '2026-10-25' } }), 'real') === 'todos')
ok('real con una fecha de decisión que no es de calendario: solo el panel', nivelMatriz(real({ ...zs, matriz_completa: { fecha_decision: '2026-02-30' } }), 'real') === 'panel')
ok('puerta cerrada: solo el panel aunque haya decisión', nivelMatriz(real({ ...zs, matriz_completa: { fecha_decision: '2026-10-25' } }), 'cerrada') === 'panel')
ok('sin los Zarr declarados: solo el panel', nivelMatriz(real({ matriz_completa: { fecha_decision: '2026-10-25' } }), 'real') === 'panel')

/* ── 3 · el muro en la forma (mutantes sobre el hígado y el hueso publicados) ── */
const H = lesiones.higado!, B = lesiones.hueso!
const mut = (d: LesionDatos, f: (x: LesionDatos) => void, l: 'higado' | 'hueso') => { const x = clon(d); f(x); return motivosLesion(x, { lesion: l, ejemplo: esEjemplo }) }
const caza = (nombre: string, m: string[]) => ok(`mutante cazado: ${nombre}`, m.length > 0)
caza('CNV por célula en el hígado', mut(H, (x) => { (x as any).cnv = { ventanas: ['8p11'], metodo: 'x', valores: [Array.from({ length: x.n_celulas }, () => 1)] } }, 'higado'))
caza('grupo «tumor» en el hígado', mut(H, (x) => { x.grupos[0]!.id = 'tumor' }, 'higado'))
caza('tipo «tumoral» en el hígado', mut(H, (x) => { x.tipos[0] = 'tumoral' }, 'higado'))
caza('tipo «maligna» en el hígado', mut(H, (x) => { x.tipos[0] = 'maligna' }, 'higado'))
caza('grupo fuera de vocabulario', mut(H, (x) => { x.grupos[1]!.id = 'macrofago_m2' }, 'higado'))
caza('n de un grupo que no cuadra con sus células', mut(H, (x) => { x.grupos[0]!.n += 1 }, 'higado'))
caza('un gen sin suelo para un grupo', mut(H, (x) => { delete x.suelo[x.genes[0]!]![x.grupos[1]!.id] }, 'higado'))
caza('suelo fuera de [0, 1]', mut(H, (x) => { x.suelo[x.genes[0]!]![x.grupos[0]!.id] = 1.5 }, 'higado'))
caza('veredicto fuera de vocabulario', mut(H, (x) => { (x.veredicto as any)[x.genes[0]!] = 'diana_validada' }, 'higado'))
caza('ejemplo y real mezclados', mut(H, (x) => { if (x.ejemplo) delete x.ejemplo; else x.ejemplo = true }, 'higado'))
caza('cadena con forma de barcode en los tipos', mut(H, (x) => { x.tipos[0] = 'AAACCCAAGTTGCATC' }, 'higado'))
caza('índice de expresión fuera de rango', mut(H, (x) => { const e = x.expr[x.genes[0]!]!; e.i[e.i.length - 1] = x.n_celulas + 5 }, 'higado'))
caza('índices de expresión desordenados', mut(H, (x) => { const e = x.expr[x.genes[0]!]!; [e.i[0], e.i[1]] = [e.i[1]!, e.i[0]!] }, 'higado'))
caza('lesión cambiada', mut(H, (x) => { x.lesion = 'hueso' }, 'higado'))
caza('hueso sin CNV por célula', mut(B, (x) => { (x as any).cnv = { pseudobulk: { ventana: '8p11', percentil_genoma: 90 } } }, 'hueso'))
caza('CNV del hueso con longitud equivocada', mut(B, (x) => { (x.cnv as any).valores[0].pop() }, 'hueso'))
caza('hueso sin su grupo de interés', mut(B, (x) => { x.grupos = x.grupos.filter((g) => g.rol !== 'interes') }, 'hueso'))
caza('sondas con unión > total', mut(H, (x) => { x.sondas[x.genes[0]!] = [5, 3] }, 'higado'))
caza('un gen sin sondas', mut(H, (x) => { delete x.sondas[x.genes[0]!] }, 'higado'))
caza('papel de selección fuera de vocabulario', mut(H, (x) => { (x.seleccion as any)[x.genes[0]!] = 'favorito' }, 'higado'))
caza('el hueso con un papel distinto de «identidad»', mut(B, (x) => { (x.seleccion as any)[x.genes[0]!] = 'exclusion' }, 'hueso'))
caza('cifra sin circularidad de un gen que no está en la selección', mut(H, (x) => { x.loo[x.genes.find((g) => !x.seleccion[g])!] = { n: 10, frac: 0.1, ref: 0.1, cp10k_pseudobulk: null } }, 'higado'))
caza('cifra sin circularidad en el hueso', mut(B, (x) => { x.seleccion[x.genes[0]!] = 'identidad'; x.loo[x.genes[0]!] = { n: 10, frac: 0.1, ref: 0.1, cp10k_pseudobulk: null } }, 'hueso'))
caza('ADN con una fracción > 1', mut(B, (x) => { x.adn.frac_lecturas_cell_ranger = 1.5 }, 'hueso'))
caza('sin bloque de ADN', mut(H, (x) => { delete (x as any).adn }, 'higado'))
const g0 = (x: LesionDatos) => Object.keys(x.marcadores)[0]!
caza('marcadores de un grupo fuera del contrato', mut(H, (x) => { x.marcadores.tumor = x.marcadores[g0(x)]! }, 'higado'))
caza(`más de ${MARCADORES_N} marcadores en un grupo`, mut(H, (x) => { const m = x.marcadores[g0(x)]!; for (const k of ['gen', 'logfc', 'fdr', 'frac_grupo', 'frac_resto', 'suelo'] as const) (m[k] as unknown[]).push(...Array.from({ length: MARCADORES_N }, (_, i) => (k === 'gen' ? `EXTRA${i}` : 0.1))) }, 'higado'))
caza('un FDR > 1', mut(H, (x) => { x.marcadores[g0(x)]!.fdr[0] = 1.2 }, 'higado'))
caza('marcadores con columnas de distinta longitud', mut(B, (x) => { x.marcadores[g0(x)]!.suelo.pop() }, 'hueso'))
caza('perfil con un cromosoma fuera de chr1-chr22', mut(H, (x) => { x.perfil_bins.cromosoma[0] = 'chrX' }, 'higado'))
caza('ADN de un grupo >= 1', mut(B, (x) => { x.adn_por_grupo[Object.keys(x.adn_por_grupo)[0]!] = 1 }, 'hueso'))
caza('ADN del grupo de interés distinto del de la lesión', mut(H, (x) => { const i = x.grupos.find((g) => g.rol === 'interes')!.id; x.adn_por_grupo[i] = x.adn_por_grupo[i]! + 0.001 }, 'higado'))
caza('un grupo con células sin ADN', mut(B, (x) => { delete x.adn_por_grupo[Object.keys(x.adn_por_grupo)[0]!] }, 'hueso'))
caza('QC con n_final distinto de las células', mut(H, (x) => { x.qc.n_final += 1 }, 'higado'))
caza('QC con un umbral al revés', mut(B, (x) => { x.qc.umbral_UMI = [9000, 100] }, 'hueso'))
caza('barcode en un marcador', mut(H, (x) => { x.marcadores[g0(x)]!.gen[0] = 'AAACCCAAGTTGCATC' }, 'higado'))
ok('el vocabulario de lecturas no tiene «diana»', !VEREDICTOS.some((v) => /diana/i.test(v)))
ok('todo tipo celular del fichero tiene su rótulo ES/EN (ninguno sale con el nombre interno)', [...H.tipos, ...B.tipos].every((t) => !!ETIQUETA_TIPO[t]?.es && !!ETIQUETA_TIPO[t]?.en), [...H.tipos, ...B.tipos].filter((t) => !ETIQUETA_TIPO[t]).join(','))
ok('todo grupo del fichero tiene su rótulo ES/EN', [...H.grupos, ...B.grupos].every((g) => !!ETIQUETA_GRUPO[g.id]?.es && !!ETIQUETA_GRUPO[g.id]?.en))
ok('el vocabulario de lecturas tiene «cerrado_por_arn» (PRAME/MAGE-A4 del hueso)', (VEREDICTOS as readonly string[]).includes('cerrado_por_arn'))
ok('cada lectura del vocabulario tiene su etiqueta ES/EN', VEREDICTOS.every((v) => !!ETIQUETA_VEREDICTO[v]?.es && !!ETIQUETA_VEREDICTO[v]?.en))
ok('cada papel de selección tiene su texto ES/EN', PAPELES_SELECCION.every((p) => !!PAPEL_SELECCION[p]?.es && !!PAPEL_SELECCION[p]?.en))
// revisión de cifras (17-oct-2026): «SOSTENIDO con matiz» (HER3 del hígado) y «Con matiz» (HER2, Nectin-4, LIV-1, ESR1) no se funden
ok('«sostenido_con_matiz» existe y dice que se sostiene', (VEREDICTOS as readonly string[]).includes('sostenido_con_matiz') && /se sostiene/i.test(ETIQUETA_VEREDICTO.sostenido_con_matiz!.es) && /holds/i.test(ETIQUETA_VEREDICTO.sostenido_con_matiz!.en))
ok('«con_matiz» NUNCA dice que se sostiene', !/se sostiene|holds/i.test(`${ETIQUETA_VEREDICTO.con_matiz!.es} ${ETIQUETA_VEREDICTO.con_matiz!.en}`) && /no se da por sostenido/.test(ETIQUETA_VEREDICTO.con_matiz!.es))
ok('«con_matiz» y «sostenido_con_matiz» no comparten etiqueta', ETIQUETA_VEREDICTO.con_matiz!.es !== ETIQUETA_VEREDICTO.sostenido_con_matiz!.es && ETIQUETA_VEREDICTO.con_matiz!.en !== ETIQUETA_VEREDICTO.sostenido_con_matiz!.en)

/* ── 4 · léxico y copy obligatorio ── */
const FICHEROS_COPY = [
  'app/pages/celula-a-celula-explorar.vue', 'app/utils/celulaExploradorTexto.ts', 'app/components/celula/CelulaExplorarTarjeta.vue', 'app/components/celula/CelulaAviso.vue',
  ...readdirSync(join(RAIZ, 'app/components/celula/explorar')).map((f) => `app/components/celula/explorar/${f}`),
]
const copy = FICHEROS_COPY.map((f) => lee(join(RAIZ, f))).join('\n')
ok('sin «diana(s)» en el explorador', !/\bdianas?\b/i.test(copy))
ok('sin «perfil molecular» en el explorador', !/perfil molecular|molecular profile/i.test(copy))
ok('muro de léxico: nada de científica/scientist/Olune', !/cient[ií]fica|scientist|olune/i.test(copy))
ok('el método de CNV no se pinta literal (era un nombre interno con «_spliced»)', !/cnv\.metodo|_spliced/.test(copy))
// Las cifras del caso (ADN genómico, sondas, la cifra sin circularidad) viajan en el fichero de datos, nunca en
// el texto: fuera los bloques de estilo (CSS lleva %), ningún porcentaje ni «n =» escrito a mano en el copy.
const sinEstilo = copy.replace(/<style[\s\S]*?<\/style>/g, '')
ok('ningún porcentaje escrito a mano en el texto del explorador (las cifras salen del fichero)', !/\d\s?%/.test(sinEstilo), (sinEstilo.match(/.{0,30}\d\s?%/g) ?? []).join(' | '))
ok('ningún «n = <cifra>» escrito a mano en el texto del explorador', !/n = \d/.test(sinEstilo))
ok('sin guion largo (tell de IA en español)', !/—/.test(copy))
// revisión de cifras (17-oct-2026): las fracciones de ADN y la detección son de UMI (moléculas), no de lecturas
ok('ninguna fracción «de las lecturas» ni «of the reads» (son UMI)', !/de las lecturas|of the reads/i.test(sinEstilo))
ok('el 0 del CNV ya no se explica como «como la referencia»', !/0 = como la referencia|0 = like the reference/.test(sinEstilo))
for (const [qué, re] of [
  ['banner del hígado «tumor frente a hepatocito no está resuelto célula a célula»', /tumor frente a hepatocito no está resuelto célula a célula/],
  ['«ARN ≠ proteína; manda la IHQ»', /ARN ≠ proteína; manda la IHQ/],
  ['«n=1, FFPE, exploratorio»', /n=1, FFPE, exploratorio/],
  ['«IHQ de HER2: 0»', /IHQ de HER2: 0/],
  ['aviso de vista reducida en el móvil', /versión reducida/],
  ['rótulo de datos de ejemplo', /DATOS DE EJEMPLO/],
  ['suelo ambiental en los violines', /Suelo ambiental: el porcentaje de células/],
  ['rótulo de la matriz (todas las sondas; ADN genómico en el hueso)', /Matriz estándar de Cell Ranger, todas las sondas; en el hueso incluye ADN genómico/],
  ['aviso de ADN genómico en el bloque del suelo ambiental', /sondas del panel caen dentro de un exón y también hibridan con el ADN genómico/],
  ['CNV inferido de la expresión, no lectura de ADN', /Inferido de la expresión \(ARN\) frente a la referencia; no es lectura de ADN/],
  ['mediana por célula frente al pseudobulk de la revisión', /Mediana por célula detectada; la revisión da pseudobulk/],
  ['lectura de Polaris en borrador, pendiente del laboratorio', /Lectura de Polaris, borrador, pendiente de la lectura humana del laboratorio/],
  ['rótulo de cifra circular', /Cifra circular\./],
  ['sin cifra fuera de la circularidad, se dice', /No hay cifra medida sin esa circularidad\./],
  ['CNV: el 0 no es «como la referencia» y se compara con las rayas de la referencia', /El 0 no es «como la referencia»\.[\s\S]*Compare cada grupo con las rayas de los grupos de referencia, no con el 0/],
  ['ADN genómico como fracción de UMI, no de lecturas', /de las UMI, las moléculas contadas/],
  ['columna de sondas en la tabla de genes', /unión \/ total/],
  ['aviso «Apoyo a la decisión» (avisos fijos del export)', /Apoyo a la decisión/],
] as const) ok(`copy obligatorio: ${qué}`, re.test(copy))
const pagina = lee(join(RAIZ, 'app/pages/celula-a-celula-explorar.vue'))
ok('la página es noindex sin datos reales', /robots: \(\) => \(hayReal\.value \? 'index, follow' : 'noindex, follow'\)/.test(pagina))
ok('con la puerta cerrada no se monta el explorador (v-if sobre el estado)', /<ClientOnly v-if="estado !== 'cerrada'">/.test(pagina))
ok('la matriz a petición solo se ofrece con datos reales', /<section v-if="hayReal" class="card-base cel-card" aria-labelledby="xp-pide-t">/.test(pagina))
const tarjeta = lee(join(RAIZ, 'app/components/celula/CelulaExplorarTarjeta.vue'))
ok('la tarjeta de «Próximos pasos» usa la misma puerta', /v-if="estado !== 'cerrada'"/.test(tarjeta))
ok('«Próximos pasos» enseña la tarjeta', /<CelulaExplorarTarjeta \/>/.test(lee(join(RAIZ, 'app/components/celula/CelulaProximosPasos.vue'))))

/* ── 5 · cálculos ── */
const filas = porGrupo(H, H.genes[0]!)
ok('porGrupo: una fila por grupo con su n', filas.length === H.grupos.length && filas.every((f, k) => f.n === H.grupos[k]!.n))
const e0 = H.expr[H.genes[0]!]!
ok('porGrupo: las detectadas suman las células con el gen', filas.reduce((s, f) => s + f.detectadas, 0) === e0.i.length)
ok('porGrupo: el suelo es el del fichero', filas.every((f) => f.suelo === H.suelo[H.genes[0]!]![f.id]))
const cx = coexpresion(H, H.genes[0]!, H.genes[1]!)
const tcx = tablaCoexp(H, cx)
ok('coexpresión: las cuatro clases suman el n de cada grupo', tcx.every((t) => t.c.ambos + t.c.solo_a + t.c.solo_b + t.c.ninguno === t.n))
ok('coexpresión de un gen consigo mismo: nunca «solo uno»', coexpresion(H, H.genes[0]!, H.genes[0]!).every((c) => c === 'ambos' || c === 'ninguno'))
const dn = densidad([1, 1.2, 1.4, 2], 0, 3)
ok('densidad: máximo 1 y no negativa', Math.abs(Math.max(...dn) - 1) < 1e-9 && dn.every((y) => y >= 0))
ok('densidad: con menos de 2 valores no inventa forma', densidad([1], 0, 2).every((y) => y === 0))
ok('pct redondea a entero', pct(0.344) === 34 && pct(0.345) === 35 && pct(0) === 0)

/* ── 6 · nivel «todos los genes»: el Zarr se lee gen a gen y dice LO MISMO que el JSON en los genes del panel ── */
if (man.zarr?.length) {
  const mc = man.matriz_completa
  const conDecision = typeof mc === 'object' && mc !== null && fechaOkValida((mc as { fecha_decision?: unknown }).fecha_decision)
  ok('el nivel de todos los genes se abre solo con el ejemplo o con la fecha de la decisión', nivelMatriz(man, esEjemplo ? 'ejemplo' : 'real') === (esEjemplo ? (mc === 'ejemplo' ? 'todos' : 'panel') : (conDecision ? 'todos' : 'panel')))
  for (const l of man.lesiones) {
    const d = lesiones[l]!
    const z = await abreZarr(new FileSystemStore(join(DIR, 'zarr', `${l}.zarr`)), d.n_celulas, d.grupos.map((g) => g.id))
    ok(`${l}: el Zarr trae más genes que el panel del JSON`, z.genes.length > d.genes.length && d.genes.every((g) => z.tiene(g)))
    let igualCol = true, igualSuelo = true, igualRef = true
    for (const g of d.genes) {
      const a = columna(d, g), b = await z.columna(g)
      for (let i = 0; i < a.length; i++) if (Math.abs(a[i]! - b[i]!) > 1e-3 * Math.max(1, a[i]!)) { igualCol = false; break }
      const su = z.sueloDe(g)
      if (!d.grupos.every((x) => su[x.id] === d.suelo[g]![x.id])) igualSuelo = false
      if (z.refDe(g) !== d.referencia[g]) igualRef = false
    }
    ok(`${l}: la columna de cada gen del panel, igual en el Zarr y en el JSON`, igualCol)
    ok(`${l}: el suelo de cada gen del panel, igual en el Zarr y en el JSON`, igualSuelo)
    ok(`${l}: la referencia emparejada de cada gen del panel, igual en el Zarr y en el JSON`, igualRef)
    const fuera = z.genes.find((g) => !d.genes.includes(g) && !z.sinSonda.has(g))!
    const cf = await z.columna(fuera)
    ok(`${l}: un gen fuera del panel se lee (columna de n células con valores >= 0)`, cf.length === d.n_celulas && cf.every((v) => v >= 0))
  }
}

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
