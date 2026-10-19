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
  MARCADORES_N, MOTIVO_LECTURAS, MOTIVOS, PAPELES_SELECCION, RE_BARCODE, VEREDICTOS, VEREDICTOS_SIN_MOTIVO, columna, coexpresion, densidad, estadoPuerta, etiquetaIC, fechaOkValida, fmtIC, fmtParSuelo, fmtRangoIC, icLoo, motivoDe, motivosLesion, nivelMatriz, pct, porGrupo, r4, tablaCoexp, tsv, wilson,
  type LesionDatos, type Manifiesto,
} from '../app/utils/celulaExplorador'
import { ALIAS_BUSCA, ETIQUETA_GRUPO, ETIQUETA_MOTIVO, ETIQUETA_TIPO, ETIQUETA_VEREDICTO, ETIQUETA_VEREDICTO_CON_MOTIVO, MARCADORES_ORIENTACION, PANEL_INTERES, PAPEL_SELECCION, PIE_MOTIVO, etiqueta, etiquetaLectura, pieMotivo } from '../app/utils/celulaExploradorTexto'
import { abreZarr } from '../app/utils/celulaExploradorZarr'
import { CASILLAS, CASILLA_DE_TIPO, paleta } from '../app/utils/celulaExploradorColor'
import FileSystemStore from '@zarrita/storage/fs'
import * as zarr from 'zarrita'

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
// Netlify no sirve ficheros que empiezan por punto: nada oculto en lo publicado (por eso el Zarr va en v3)
const ocultos: string[] = []
const busca = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('.')) ocultos.push(join(d, e.name)); else if (e.isDirectory()) busca(join(d, e.name)) } }
busca(DIR)
ok('ningún fichero ni carpeta oculta en la carpeta pública (Netlify no los sirve)', ocultos.length === 0, ocultos.slice(0, 3).join(', '))
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
  ok(`${l}: solo las claves del contrato`, JSON.stringify(Object.keys(d).sort()) === JSON.stringify(['adn', 'adn_por_grupo', 'celulas', 'cnv', 'ejemplo', 'expr', 'genes', 'grupos', 'lesion', 'loo', 'marcadores', 'n_celulas', 'perfil_bins', 'qc', 'referencia', 'seleccion', 'sondas', 'suelo', 'tipos', 'veredicto', 'version'].filter((k) => esEjemplo || k !== 'ejemplo').concat('motivo' in d ? ['motivo'] : []).sort()), Object.keys(d).join(','))
  if (esEjemplo) ok(`${l}: el ejemplo no lleva ninguna lectura de la revisión (todo «sin_veredicto»)`, Object.values(d.veredicto).every((v) => v === 'sin_veredicto'))
  if (esEjemplo && d.motivo) ok(`${l}: el ejemplo no lleva ningún motivo de la revisión (todo null)`, Object.values(d.motivo).every((v) => v === null))
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
// motivo de cada lectura (comité médico, 18-oct-2026): mismo vocabulario que Polaris, con texto ES/EN, sin cifras ni «diana»
ok('cada motivo del vocabulario tiene su texto ES/EN', MOTIVOS.every((m) => !!ETIQUETA_MOTIVO[m]?.es && !!ETIQUETA_MOTIVO[m]?.en) && Object.keys(ETIQUETA_MOTIVO).length === MOTIVOS.length)
ok('cada motivo dice qué lecturas admite, y ninguna es de las que no lo llevan', JSON.stringify(Object.keys(MOTIVO_LECTURAS).sort()) === JSON.stringify([...MOTIVOS].sort())
  && Object.values(MOTIVO_LECTURAS).every((vs) => vs.length > 0 && vs.every((v) => (VEREDICTOS as readonly string[]).includes(v) && !VEREDICTOS_SIN_MOTIVO.includes(v))))
ok('ningún texto de motivo lleva cifras ni «diana»', Object.values(ETIQUETA_MOTIVO).every((x) => !/\d|diana|target/i.test(`${x.es} ${x.en}`.replace(/HER2-low/g, ''))))
// verificacion (18-oct): la etiqueta de «cerrado_por_arn» daba la razón del hueso («los positivos son ADN…») también en el
// hígado, donde no hay positivos; la razón va en el motivo, que cambia por biopsia
ok('«cerrado_por_arn» con motivo en el fichero no da en la etiqueta la razón de una sola biopsia', !/positiv/i.test(`${ETIQUETA_VEREDICTO_CON_MOTIVO.cerrado_por_arn!.es} ${ETIQUETA_VEREDICTO_CON_MOTIVO.cerrado_por_arn!.en}`))
// diseño (revisión del motivo): sin motivo en el fichero se queda la etiqueta publicada, para que el código pueda salir antes que los datos
ok('etiquetaLectura: corta con motivo, la publicada sin él', etiquetaLectura('cerrado_por_arn', true, 'es') === 'Cerrado por ARN'
  && etiquetaLectura('cerrado_por_arn', false, 'es') === ETIQUETA_VEREDICTO.cerrado_por_arn!.es && etiquetaLectura('no_sostenido', true, 'en') === ETIQUETA_VEREDICTO.no_sostenido!.en)
ok('pie del motivo: ES/EN, sin cifras; usa el extremo bajo del margen de error y la revisión se aparta de la regla (las dos biopsias)',
  Object.values(PIE_MOTIVO).every((x) => !!x.es && !!x.en && !/\d/.test(`${x.es} ${x.en}`)) && /usa el extremo bajo del margen de error/.test(PIE_MOTIVO.compara.es)
  && /se aparta de la regla fijada antes del análisis/.test(PIE_MOTIVO.aparta.es) && /^\S.*\. \S/.test(pieMotivo('es')) && /^\S.*\. \S/.test(pieMotivo('en')))
{
  // fixture con motivo: los datos publicados aún no lo traen (pendiente del OK de la titular) y el validador tiene que
  // aceptarlo bien formado y cazar lo mal formado
  const conMotivo = (d: LesionDatos) => {
    const x = clon(d)
    x.motivo = Object.fromEntries(x.genes.map((g) => {
      const v = x.veredicto[g]!
      return [g, VEREDICTOS_SIN_MOTIVO.includes(v) ? null : MOTIVOS.find((m) => MOTIVO_LECTURAS[m].includes(v)) ?? null]
    }))
    return x
  }
  const HM = conMotivo(H), g0 = H.genes[0]!, g1 = H.genes[1]!
  ok('motivo: un fichero con motivo bien formado se pinta', motivosLesion(HM, { lesion: 'higado', ejemplo: esEjemplo }).length === 0, motivosLesion(HM, { lesion: 'higado', ejemplo: esEjemplo }).join('; '))
  ok('motivo: sin motivo en el fichero también se pinta (datos de antes), y la lectura va sin paréntesis', motivosLesion(H, { lesion: 'higado', ejemplo: esEjemplo }).length === 0 && motivoDe(H, g0) === (H.motivo?.[g0] ?? null))
  caza('motivo fuera de vocabulario', mut(HM, (x) => { x.veredicto[g0] = 'no_sostenido'; (x.motivo as any)[g0] = 'diana_debil' }, 'higado'))
  caza('lectura «no_sostenido» sin motivo', mut(HM, (x) => { x.veredicto[g0] = 'no_sostenido'; x.motivo![g0] = null }, 'higado'))
  caza('motivo en una lectura «sostenido», que no lo lleva', mut(HM, (x) => { x.veredicto[g0] = 'sostenido'; x.motivo![g0] = 'minoria' }, 'higado'))
  caza('motivo de otra lectura («casi_no_se_detecta» en un «con_matiz»)', mut(HM, (x) => { x.veredicto[g0] = 'con_matiz'; x.motivo![g0] = 'casi_no_se_detecta' }, 'higado'))
  caza('un gen sin su clave en motivo', mut(HM, (x) => { delete x.motivo![g1] }, 'higado'))
  caza('una clave de motivo que no es un gen', mut(HM, (x) => { x.motivo!.NOESGEN = null }, 'higado'))
  ok('motivoDe: el del fichero, o null', motivoDe({ ...HM, motivo: { ...HM.motivo, [g0]: 'minoria_no_hueso' } }, g0) === 'minoria_no_hueso' && motivoDe(HM, 'NOESGEN') === null)
}
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
// comité médico (19-oct, sugerencias del buscador): nada que se lea como recomendación
ok('sin «recomendado», «candidato» ni «accionable» en el explorador', !/recomend|recommend|candidat|accionable|actionable/i.test(copy))
// el buscador al tocarlo vacío (propuesta de Miriam, 19-oct; lista cerrada del comité médico): marcadores de tipo celular
// de la biopsia, en su fichero, sin genes de fármaco ni biomarcadores de decisión, sin los 10 de interés, uno por tipo y
// por su símbolo (un nombre clínico como «Ki-67» o «ER» se lee como resultado de IHQ y aquí es ARN)
const FUERA_ORIENTA = /^(ESR1|PGR|AR|ERBB2|ERBB3|CD274|PRAME|MAGE\w*|CTAG\w*|CLDN\w*|ROR1|FOLR1|CEACAM5|VTCN1|MSLN|DLL3|SSTR2|NCAM1|GPNMB|CDH17|FAP)$/
for (const l of man.lesiones) {
  const lista = MARCADORES_ORIENTACION[l] ?? []
  ok(`${l}: el buscador tiene marcadores de tipo celular para orientarse`, lista.length >= 6, String(lista.length))
  if (!esEjemplo) ok(`${l}: cada marcador del buscador está en el fichero de esa biopsia`, lista.every((m) => lesiones[l]!.genes.includes(m.gen)), lista.filter((m) => !lesiones[l]!.genes.includes(m.gen)).map((m) => m.gen).join(','))
  ok(`${l}: ningún marcador del buscador es gen de fármaco, biomarcador de decisión ni uno de los 10 de interés`, lista.every((m) => !FUERA_ORIENTA.test(m.gen) && !PANEL_INTERES.includes(m.gen)), lista.filter((m) => FUERA_ORIENTA.test(m.gen) || PANEL_INTERES.includes(m.gen)).map((m) => m.gen).join(','))
  ok(`${l}: un marcador por tipo celular`, new Set(lista.map((m) => m.tipo.es)).size === lista.length)
}
ok('los marcadores del buscador van por su símbolo, sin nombre clínico (Ki-67, HER2, ER, PR, PD-L1)', Object.values(MARCADORES_ORIENTACION).flat().every((m) => !/\bki-?67\b|\bher2\b|\bER\b|\bPR\b|\bpd-?l1\b/i.test(`${m.gen} ${m.tipo.es} ${m.tipo.en}`)))
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
  // simulador (18-oct): el móvil ya no es una vista reducida sin mapa; el mapa está, quieto hasta pedir moverlo
  ['mapa en el móvil, quieto hasta «Mover el mapa»', /Mover el mapa/],
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

// verificacion y un escéptico (19-oct): con datos reales la nota del mapa nombra Cell Ranger y Loupe, y eso solo se
// comprueba contra el Zarr (su uns/version y el UMAP crudo, en el bloque de abajo); un paquete real sin Zarr se saltaría
// ese freno y la frase saldría sin comprobar
if (!esEjemplo) ok('real: el paquete trae el Zarr (sin él no se comprueba que el mapa sea el de Cell Ranger que nombra la nota)', !!man.zarr?.length)

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
    // la selección (circularidad) cubre todo el panel: cada gen existe en el Zarr, y al menos uno está fuera de la lista
    const sel = Object.keys(d.seleccion)
    ok(`${l}: cada gen de la selección (circularidad) está en el panel del Zarr`, sel.every((g) => z.tiene(g)), sel.filter((g) => !z.tiene(g)).join(','))
    ok(`${l}: la selección rotula genes del panel fuera de la lista de la web (los que abre el buscador o marcadores)`, sel.some((g) => !d.genes.includes(g)))
    const fuera = z.genes.find((g) => !d.genes.includes(g) && !z.sinSonda.has(g))!
    const cf = await z.columna(fuera)
    ok(`${l}: un gen fuera del panel se lee (columna de n células con valores >= 0)`, cf.length === d.n_celulas && cf.every((v) => v >= 0))
    // el mapa (19-oct, plan del mapa de Loupe): el JSON es el UMAP crudo del Zarr reescalado con UN factor para los dos
    // ejes. Con un export viejo (cada eje reescalado por separado) esto falla: la nota «UMAP de Cell Ranger» no puede
    // salir con datos que no lo son
    const xu = await zarr.get(await zarr.open(zarr.root(new FileSystemStore(join(DIR, 'zarr', `${l}.zarr`))).resolve('obsm/X_umap'), { kind: 'array' }))
    const zu = Array.from(xu.data as Float32Array, Number), ju = d.celulas.umap
    const caja = (v: number[], k: number) => { let lo = Infinity, hi = -Infinity; for (let i = k; i < v.length; i += 2) { lo = Math.min(lo, v[i]!); hi = Math.max(hi, v[i]!) } return [lo, hi] as const }
    const [zx0, zx1] = caja(zu, 0), [zy0, zy1] = caja(zu, 1), f = Math.max(zx1 - zx0, zy1 - zy0) / 20
    let maxDif = 0
    for (let i = 0; i < ju.length; i += 2) {
      maxDif = Math.max(maxDif, Math.abs(ju[i]! - (zu[i]! - (zx0 + zx1) / 2) / f), Math.abs(ju[i + 1]! - (zu[i + 1]! - (zy0 + zy1) / 2) / f))
    }
    ok(`${l}: el mapa del JSON es el UMAP del Zarr con un solo factor de escala (no deformado)`, zu.length === ju.length && maxDif <= 0.006, `máx. diferencia ${maxDif.toFixed(4)}`)
    // verificacion (19-oct): con datos reales la nota nombra Cell Ranger y Loupe; el Zarr publicado tiene que decir lo mismo
    // de su mapa (uns/version la escribe el export de Polaris), o la frase no sale con esos datos
    if (!esEjemplo) {
      // un array de dimensión 0: zarrita devuelve el valor suelto, no un trozo con .data (si no se lee, falla cerrado)
      const vz: unknown = await zarr.get(await zarr.open(zarr.root(new FileSystemStore(join(DIR, 'zarr', `${l}.zarr`))).resolve('uns/version'), { kind: 'array' }))
      const ver = typeof vz === 'string' ? vz : String((vz as { data?: ArrayLike<unknown> } | null)?.data?.[0] ?? '')
      ok(`${l}: el Zarr dice que el mapa es el UMAP de Cell Ranger del .cloupe (lo que afirma la nota)`, /mapa = UMAP de Cell Ranger \(\.cloupe\)/.test(ver), ver)
    }
  }
}

// verificacion (18-oct, simplificación para médicos): ninguna ETIQUETA visible de un grupo o tipo del hígado dice
// «tumor», «maligno» ni «cáncer». El grupo de interés es un subconjunto (993 = 528 epiteliales + 465 sin asignar; 3.201
// epiteliales están en «Otras»): rotularlo «tumor» sería falso. El muro de los datos solo mira ids; esto mira rótulos.
{
  const vetado = /tumor|tumoral|malign|c[aá]ncer|cancer/i
  const H = lesiones.higado
  if (H) {
    const malos = [
      ...H.grupos.flatMap((g) => [etiqueta(ETIQUETA_GRUPO, g.id, 'es'), etiqueta(ETIQUETA_GRUPO, g.id, 'en')]),
      ...H.tipos.flatMap((t) => [etiqueta(ETIQUETA_TIPO, t, 'es'), etiqueta(ETIQUETA_TIPO, t, 'en')]),
    ].filter((x) => vetado.test(x))
    ok('hígado: ningún rótulo de grupo ni de tipo dice «tumor», «maligno» o «cáncer» (ES y EN)', malos.length === 0, malos.join(' | '))
  }
}

// paleta del gen elegido (simulador, diseño 18-oct): con los tokens reales, en los dos temas, «no detectado» y los
// tramos se distinguen por LUMINOSIDAD (ΔL* ≥ 8 entre pasos contiguos; con puntos de radio 2 el tono solo no basta)
// y el tercer tramo pasa 3:1 con el fondo del mapa
{
  const tokens = readFileSync(join(RAIZ, 'app/assets/css/design-system-v2/btp-tokens.css'), 'utf8')
  const tok = (v: string) => (tokens.match(new RegExp(`${v}:\\s*([\\d\\s]+);`))?.[1] ?? '').trim()
  const lin = (c: number) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  const Y = (c: number[]) => 0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!)
  const Lstar = (c: number[]) => { const y = Y(c); return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y }
  const contraste = (a: number[], b: number[]) => { const [p, q] = [Y(a), Y(b)].sort((x, z) => z - x); return (p! + 0.05) / (q! + 0.05) }
  // medidas del color para los grupos de referencia: OKLCH (matiz y croma), ΔE2000 y simulación de daltonismo (Machado 2009,
  // severidad 1; coincide con la emulación de Chrome a ≤ 1 por canal, medido el 19-oct-2026 sobre 52 muestras)
  const gam = (v: number) => { v = Math.max(0, Math.min(1, v)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) }
  const oklch = (c: number[]) => {
    const [r, g, b] = c.map(lin) as [number, number, number]
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return { C: Math.hypot(a, bb), h: (((Math.atan2(bb, a) * 180) / Math.PI) + 360) % 360 }
  }
  const lab = (c: number[]) => {
    const [r, g, b] = c.map(lin) as [number, number, number]
    const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
    const fx = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047), fy = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b), fz = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883)
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)] as [number, number, number]
  }
  const de00 = (c1: number[], c2: number[]) => {
    const [L1, a1, b1] = lab(c1), [L2, a2, b2] = lab(c2), rad = Math.PI / 180
    const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2)
    const hh = (b: number, a: number) => { const x = Math.atan2(b, a) / rad; return x < 0 ? x + 360 : x }
    const h1p = C1p === 0 ? 0 : hh(b1, a1p), h2p = C2p === 0 ? 0 : hh(b2, a2p)
    let dhp = 0
    if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360 }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2), Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2
    let hbp = h1p + h2p
    if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) <= 180 ? (h1p + h2p) / 2 : h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2
    const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad)
    const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7)), Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2)
    const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T, Rt = -Math.sin(2 * 30 * Math.exp(-(((hbp - 275) / 25) ** 2)) * rad) * Rc
    return Math.sqrt(((L2 - L1) / Sl) ** 2 + ((C2p - C1p) / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * ((C2p - C1p) / Sc) * (dHp / Sh))
  }
  const MACHADO = {
    normal: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    deut: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
    prot: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  } as const
  const cvd = (c: number[], t: keyof typeof MACHADO) => { const l = c.map(lin); return MACHADO[t].map((f) => Math.round(gam(f[0]! * l[0]! + f[1]! * l[1]! + f[2]! * l[2]!))) }
  // lo que se pide a los grupos de referencia (se mide en CADA biopsia publicada y en los dos temas)
  const MIN_DE = { normal: 9.8, deut: 7.1, prot: 6.3 } as const   // lo conseguido: 10,0 / 7,3 / 6,5. Comité médico, 19-oct: croma ≤ 0,07 en TODAS las referencias; es el precio: la ronda 2, con croma hasta 0,10, daba 13,0 / 9,2 / 9,2 (la 1, con verde y amarillo: 17,9 / 12,6 / 12,9)
  // el violeta de interés frente a la referencia más cercana (lo que el comité quería proteger: con deuteranopía y protanopía el violeta se vuelve azul); conseguido 21,3 / 9,2 / 11,1
  const MIN_DE_INTERES = { normal: 20, deut: 9, prot: 10.5 } as const
  const BANDA_FRIA = [212, 264], BANDA_TIERRA = [52, 68]        // matiz OKLCH: fuera quedan amarillo, verde y cian (68–212), violeta y rosa (264–360) y rojo y coral (< 52)
  const CROMA_MAX = 0.07, CROMA_HEPATOCITO = 0.045, CONTRASTE_HEPATOCITO = 3.6   // ninguna referencia por encima de 0,07 (comité médico, 19-oct); la más grande, el hepatocito, no grita
  const RATIO_CROMA = { light: 2.5, dark: 2.0 } as const   // croma del violeta de interés / croma de cada referencia (comité médico, 19-oct: 0,175/0,07 = 2,5 en claro; 0,144/0,07 = 2,06 en oscuro)
  const CROMA_OTRAS_MAX = 0.02   // «Otras» neutra de verdad: teñida de la familia del violeta (0,042 a 311°) se leía como «interés diluido»
  for (const tema of ['light', 'dark'] as const) {
    const p = paleta(tema, tok)
    const fondo = (tema === 'dark' ? tok('--color-text-rgb') : tok('--color-bg-rgb')).split(/\s+/).map(Number)
    const pasos = [p.cero, ...p.nivel].map(Lstar)
    const saltos = pasos.slice(1).map((l, k) => Math.abs(l - pasos[k]!))
    ok(`paleta ${tema}: «no detectado» y los 4 tramos se separan por luminosidad (ΔL* ≥ 8 entre pasos)`, saltos.every((d) => d >= 8), saltos.map((d) => d.toFixed(1)).join(' / '))
    ok(`paleta ${tema}: el tercer tramo pasa 3:1 con el fondo del mapa`, contraste(p.nivel[2]!, fondo) >= 3, contraste(p.nivel[2]!, fondo).toFixed(2))
    // grupos de referencia (excepción acotada del canon, Miriam 19-oct-2026): un color por TIPO celular, el mismo en las dos
    // biopsias, sin verde ni amarillo, dos familias por matiz, apagados y por debajo del violeta de interés. Se mide en los
    // ficheros publicados (hígado y hueso), no en una lista a mano. ΔL* ≥ 8 entre contiguas ya no vale: con ≥ 3:1 y menos que
    // el violeta, las referencias caben en ~11 unidades de L*; la separación la dan el matiz, el croma y el ΔE2000.
    const kInteres = contraste(p.interes, fondo), Lotras = Lstar(p.otras), porId = new Map<string, string>()
    for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json') && x !== 'manifiesto.json').sort()) {
      const ids = (JSON.parse(lee(join(DIR, f))) as { grupos: { id: string; rol: string }[] }).grupos.filter((g) => g.rol !== 'interes' && g.rol !== 'otras').map((g) => g.id)
      const cols = p.refsPorId(ids), nombre = `paleta ${tema} · ${f}`
      // la cobertura solo se exige con los datos REALES: el ejemplo sintético (ejemplo.py de Polaris) puede traer otros ids y entonces toman casilla libre
      if (man.ejemplo !== true) ok(`${nombre}: cada tipo de referencia tiene su casilla (${ids.join(', ')})`, ids.every((id) => id in CASILLA_DE_TIPO), ids.filter((id) => !(id in CASILLA_DE_TIPO)).join(', '))
      ok(`${nombre}: ${ids.length} colores distintos entre sí`, new Set(cols.map(String)).size === ids.length)
      ids.forEach((id, k) => { const prev = porId.get(id), act = String(cols[k]); ok(`${nombre}: «${id}» tiene el mismo color en todas las biopsias`, prev === undefined || prev === act, `${prev} / ${act}`); porId.set(id, act) })
      const peorDe = { normal: 1e9, deut: 1e9, prot: 1e9 }
      const todos = [p.interes, ...cols, p.otras]
      for (const t of ['normal', 'deut', 'prot'] as const) for (let i = 0; i < todos.length; i++) for (let j = i + 1; j < todos.length; j++) peorDe[t] = Math.min(peorDe[t], de00(cvd(todos[i]!, t), cvd(todos[j]!, t)))
      for (const t of ['normal', 'deut', 'prot'] as const) ok(`${nombre}: ΔE2000 mínimo entre interés, referencias y «Otras» ≥ ${MIN_DE[t]} (${t})`, peorDe[t] >= MIN_DE[t], peorDe[t].toFixed(1))
      for (const t of ['normal', 'deut', 'prot'] as const) { const d = Math.min(...cols.map((c) => de00(cvd(p.interes, t), cvd(c, t)))); ok(`${nombre}: ΔE2000 del violeta de interés con la referencia más cercana ≥ ${MIN_DE_INTERES[t]} (${t})`, d >= MIN_DE_INTERES[t], d.toFixed(1)) }
      cols.forEach((c, k) => {
        const id = ids[k]!, o = oklch(c), k31 = contraste(c, fondo), esFria = CASILLA_DE_TIPO[id]?.startsWith('frio') ?? true
        const [h0, h1] = esFria ? BANDA_FRIA : BANDA_TIERRA
        ok(`${nombre} · ${id}: ≥ 3:1 con el fondo y al menos 0,5 por debajo del violeta de interés`, k31 >= 3 && k31 <= kInteres - 0.5, `${k31.toFixed(2)} (violeta ${kInteres.toFixed(2)})`)
        ok(`${nombre} · ${id}: ≥ 10 de ΔL* con «Otras»`, Math.abs(Lstar(c) - Lotras) >= 10, Math.abs(Lstar(c) - Lotras).toFixed(1))
        ok(`${nombre} · ${id}: croma OKLCH ≤ ${CROMA_MAX} (apagado)`, o.C <= CROMA_MAX, o.C.toFixed(3))
        ok(`${nombre} · ${id}: el croma del violeta de interés es ≥ ${RATIO_CROMA[tema]} veces el suyo`, oklch(p.interes).C / o.C >= RATIO_CROMA[tema], (oklch(p.interes).C / o.C).toFixed(2))
        ok(`${nombre} · ${id}: matiz ${o.h.toFixed(0)}° dentro de su familia (${esFria ? 'fría' : 'tierra'} ${h0}–${h1}°): ni verde, ni amarillo, ni rojo, ni violeta`, o.h >= h0! && o.h <= h1!, o.h.toFixed(0))
        if (id === 'hepatocito') ok(`${nombre} · hepatocito (la referencia más grande): croma ≤ ${CROMA_HEPATOCITO} y contraste ≤ ${CONTRASTE_HEPATOCITO}:1`, o.C <= CROMA_HEPATOCITO && k31 <= CONTRASTE_HEPATOCITO, `C ${o.C.toFixed(3)}, ${k31.toFixed(2)}:1`)
      })
    }
    // «Otras» (comité médico, 19-oct): neutra de verdad (croma ≤ 0,02) y visible (≥ 2:1 con el fondo). En oscuro es un gris calculado de los tokens; en claro, la mezcla 0,35.
    // El «Ninguno» de co-expresión NO se toca: sigue siendo la mezcla 0,35 de tinta en los dos temas (el gris de «Otras» es solo de «Por grupo»)
    ok(`paleta ${tema}: «Otras» es neutra (croma OKLCH ≤ ${CROMA_OTRAS_MAX}) y se ve (≥ 2:1 con el fondo)`, oklch(p.otras).C <= CROMA_OTRAS_MAX && contraste(p.otras, fondo) >= 2, `C ${oklch(p.otras).C.toFixed(3)}, ${contraste(p.otras, fondo).toFixed(2)}:1`)
    const tintaTema = (tema === 'dark' ? tok('--color-bg-rgb') : tok('--color-text-rgb')).split(/\s+/).map(Number)
    ok(`paleta ${tema}: el «Ninguno» de co-expresión conserva la mezcla 0,35 de tinta`, String(p.coexp.ninguno) === String(tintaTema.map((x, i) => Math.round(x * 0.35 + fondo[i]! * 0.65))), String(p.coexp.ninguno))
    // sin casilla propia (T, B, mastocito: aún sin datos): toman una casilla libre, sin pisar a los que sí la tienen
    const resto = p.refsPorId(['T', 'B', 'mastocito', 'mieloide', 'endotelio'])
    ok(`paleta ${tema}: tipos sin casilla toman colores libres y distintos, sin pisar los suyos`, new Set(resto.map(String)).size === 5 && String(resto[3]) === String(p.refsPorId(['mieloide'])[0]) && String(resto[4]) === String(p.refsPorId(['endotelio'])[0]))
    // tokens: el hex y su puente RGB dicen lo mismo (si uno cambia y el otro no, el canon miente)
    for (const c of CASILLAS) {
      const hexTok = (v: string) => (tokens.match(new RegExp(`${v}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '').toLowerCase()
      const sufijo = tema === 'dark' ? '-osc' : ''
      const dehex = [1, 3, 5].map((i) => parseInt(hexTok(`--viz-cat-${c}${sufijo}`).slice(i, i + 2), 16)).join(' ')
      ok(`tokens ${tema} · ${c}: --viz-cat-${c}${sufijo} y su puente -rgb coinciden`, tok(`--viz-cat-${c}${sufijo}-rgb`) === dehex, `${dehex} / ${tok(`--viz-cat-${c}${sufijo}-rgb`)}`)
    }
  }
}

// comité médico y verificacion (18-oct): detectado y suelo nunca salen iguales por redondeo si no lo son
{
  const [a1, b1] = fmtParSuelo(0.103, 0.096, 'es'), [a2, b2] = fmtParSuelo(0.8603, 0.86, 'es'), [a3, b3] = fmtParSuelo(0.41, 0.043, 'es')
  const [a4, b4] = fmtParSuelo(1, 1, 'es')
  ok('fmtParSuelo: iguales de verdad (100 frente a 100) salen enteros, no «100,00»', a4 === '100\u00a0%' && b4 === '100\u00a0%', `${a4} | ${b4}`)
  ok('fmtParSuelo: 10,3 frente a 9,6 con un decimal; 86,03 frente a 86,00 con dos; 41 frente a 4 sin decimal', a1 === '10,3 %' && b1 === '9,6 %' && a2 === '86,03 %' && b2 === '86,00 %' && a3 === '41 %' && b3 === '4 %', [a1, b1, a2, b2, a3, b3].join(' | '))
}
// plan «muy útil a científicos» (19-oct): IC95 de Wilson igual al del análisis (tribunal/_comun.py, z = 1,959964), con
// respuestas conocidas calculadas en Python; su formato; y el TSV de «Copiar cifras»
{
  const PY: [number, number, number, number][] = [   // k, n, inferior, superior (Python, 19-oct)
    [0, 10, 0.0, 0.2775328030260577], [10, 10, 0.7224671969739421, 1.0], [3, 10, 0.10779126655639398, 0.6032218546540291],
    [572, 993, 0.5450599803421864, 0.606418470573629], [18, 68, 0.17449740610772085, 0.38007734086569805],
    [1, 68, 0.0026006835473572493, 0.07870973208531903], [0, 13577, 0.0, 0.0002828586794807068],
  ]
  const malos = PY.filter(([k, n, lo, hi]) => { const ic = wilson(k, n); return !ic || Math.abs(ic[0] - lo) > 1e-12 || Math.abs(ic[1] - hi) > 1e-12 })
  ok('wilson: igual que el análisis en Python (7 casos, incluidos k = 0 y k = n)', malos.length === 0, JSON.stringify(malos))
  ok('wilson: sin n o con k fuera de rango, null', wilson(0, 0) === null && wilson(3, 2) === null && wilson(-1, 5) === null)
  ok('wilson: k = 0 da inferior 0 y k = n da superior 1', wilson(0, 50)![0] === 0 && wilson(50, 50)![1] === 1)
  ok('fmtIC: enteros por encima del 10 % y un decimal por debajo', fmtIC([0.545, 0.6064], 'es') === 'IC 95 %: 55–61\u00a0%' && fmtIC([0.0026, 0.0787], 'es') === 'IC 95 %: 0,3–7,9\u00a0%' && fmtIC([0.545, 0.6064], 'en') === '95% CI: 55–61%', [fmtIC([0.545, 0.6064], 'es'), fmtIC([0.0026, 0.0787], 'es')].join(' | '))
  ok('fmtIC: sin IC, cadena vacía', fmtIC(null, 'es') === '')
  ok('fmtRangoIC: solo el rango (la tabla a 390 px cortaba la cifra tras el prefijo) y etiquetaIC aparte', fmtRangoIC([0.2229, 0.2766], 'es') === '22–28\u00a0%' && fmtRangoIC([0.2229, 0.2766], 'en') === '22–28%' && etiquetaIC('es') === 'IC 95 %' && etiquetaIC('en') === '95% CI' && fmtIC([0.2229, 0.2766], 'es') === `${etiquetaIC('es')}: ${fmtRangoIC([0.2229, 0.2766], 'es')}`)
  ok('fmtIC: si los dos extremos redondean igual, un decimal (FGFR1 sin circularidad salía «100–100 %»)', fmtIC(wilson(3323, 3324), 'es') === 'IC 95 %: 99,8–100,0\u00a0%', fmtIC(wilson(3323, 3324), 'es'))
  ok('icLoo: reconstruye k de n y la fracción (628 y 0,5844 → 367)', JSON.stringify(icLoo({ n: 628, frac: 0.5844 })) === JSON.stringify(wilson(367, 628)) && icLoo({ n: 10, frac: null }) === null)
  const filasIc = porGrupo(H, H.genes[0]!)
  ok('porGrupo: cada fila lleva el IC de Wilson de sus detectadas', filasIc.every((f) => JSON.stringify(f.ic) === JSON.stringify(wilson(f.detectadas, f.n))))
  ok('tsv: tabuladores y saltos de línea dentro de un campo se quitan; nulos vacíos; termina en salto', tsv([['a', 'b\tc'], [1, null], ['x\ny', 0.5]]) === 'a\tb c\n1\t\nx y\t0.5\n')
  ok('r4: 4 decimales, vacío si no hay número', r4(0.123456) === 0.1235 && r4(null) === '' && r4(Number.NaN) === '')
}
// D5, «Muestra y contexto» (OK de Miriam al contenido, 19-oct): las cifras son las cotejadas contra los informes originales
// (Polaris y verificacion); el texto no lleva fechas, hospitales, nombres ni el mecanismo del fármaco del ensayo (acotaba el ensayo)
{
  const C = await import('../app/utils/celulaContexto')
  const lecturas = C.PRIMARIO_LECTURAS.map((l) => [l.id, l.re, l.rp, l.ki67, l.her2Debil])
  ok('contexto: tres lecturas del primario cotejadas (95/5/60, 100/100/—, 85/20/40)', JSON.stringify(lecturas) === JSON.stringify([['diagnostico', 95, 5, 60, false], ['segunda', 100, 100, null, true], ['revision', 85, 20, 40, false]]), JSON.stringify(lecturas))
  ok('contexto: hígado RE 0, RP 5 (2+); hueso Ki-67 ~15; HER2 débil en menos del 10; NE 80', C.HIGADO.re === 0 && C.HIGADO.rp === 5 && C.HIGADO.rpIntensidad === '2+' && C.HUESO_KI67_APROX === 15 && C.HER2_DEBIL_MENOS_DE === 10 && C.PRIMARIO_NE_PCT === 80)
  ok('contexto: intervalos cotejados (15 d, 14/6/5 sem, 16 meses, semivida 40 d, ventana 16 sem)', JSON.stringify(C.INTERVALOS) === JSON.stringify({ ribociclibDias: 15, huesoTrasCdk46Semanas: 14, huesoTrasFulvestrantSemanas: 6, higadoEn3lSemanas: 5, fulvestrant2lMeses: 16, semividaFulvestrantDias: 40, ventanaMaxSemanas: 16 }))
  ok('contexto: el rango de RE del primario sale de las tres lecturas (85-100)', JSON.stringify(C.rangoRePrimario()) === '[85,100]')
  const txt = lee(join(RAIZ, 'app/components/celula/explorar/CelulaExplorarContexto.vue'))
  ok('contexto: sin fechas en el texto', !/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b|\b20\d\d\b/.test(txt))
  ok('contexto: sin hospitales, laboratorios ni nombres', !/vall d|hebron|huvh|triemli|z[uü]rich|anderson|dana|dfci|quir[oó]n|miriam|gonz[aá]lez/i.test(txt))
  ok('contexto: sin el mecanismo del fármaco del ensayo (KAT6 acotaba el ensayo)', !/kat6|bg-?75202/i.test(txt))
  ok('contexto: la etiqueta literal del hueso («tumor neuroendocrino (NET)») y la frase del RE sin concluir', /tumor neuroendocrino \(NET\) de la mama/.test(txt) && /no distingue por sí solo/.test(txt) && /no se han encontrado datos equivalentes/.test(txt))
}
// revisión final (18-oct): la página en inglés es en-US; mezclaba «Color by» con «colour», «favoured», «programme»
{
  const fuentes = ['app/components/celula/explorar', 'app/utils/celulaExploradorTexto.ts', 'app/pages/celula-a-celula-explorar.vue'].flatMap((r) => {
    const abs = join(RAIZ, r)
    return r.endsWith('.ts') || r.endsWith('.vue') ? [readFileSync(abs, 'utf8')] : readdirSync(abs).filter((f) => f.endsWith('.vue')).map((f) => readFileSync(join(abs, f), 'utf8'))
  }).join('\n')
  const brit = fuentes.match(/\b(colour\w*|favour\w*|programme\w*|behaviour\w*|centre\w*|grey|tumour\w*|analyse\w*|licence|fibre\w*)\b/gi) ?? []
  ok('inglés de EE. UU. en el explorador (sin colour, favour, programme…)', brit.length === 0, brit.join(', '))
}
// comité médico (18-oct): los datos servidos llevaban dos «se sostiene» que la enmienda del acta retiró, y todo seguía en
// verde. Los veredictos de la enmienda, atados aquí; y ningún «se sostiene con matices» en el hígado tras ella.
{
  if (JSON.parse(readFileSync(join(DIR, 'manifiesto.json'), 'utf8')).ejemplo !== true) {   // solo con los datos reales
    const vh = JSON.parse(readFileSync(join(DIR, 'higado.json'), 'utf8')).veredicto, vb = JSON.parse(readFileSync(join(DIR, 'hueso.json'), 'utf8')).veredicto
    ok('veredictos de la enmienda del 18-oct: HER3 del hígado «con_matiz» y 5T4 del hueso «en_el_limite»', vh.ERBB3 === 'con_matiz' && vb.TPBG === 'en_el_limite', `ERBB3 ${vh.ERBB3} · TPBG ${vb.TPBG}`)
    // con el motivo en el fichero (export del acta con motivo), el caso que lo pidió: TROP2 del hígado lleva su porqué
    const mh = JSON.parse(readFileSync(join(DIR, 'higado.json'), 'utf8')).motivo, mb = JSON.parse(readFileSync(join(DIR, 'hueso.json'), 'utf8')).motivo
    if (mh && mb) ok('motivos del acta (enmienda del 19-oct): TROP2, Nectin-4, MUC1, B7-H3 y HER3 del hígado, LIV-1 sin motivo, PRAME en cada biopsia, 5T4 e INSM1 del hueso', mh.TACSTD2 === 'por_poco_minoria_no_hueso'
      && mh.NECTIN4 === 'minoria_no_hueso' && mh.SLC39A6 === null && mh.MUC1 === 'trazador_no_hueso' && mh.CD276 === 'no_robusto_parecido_no_hueso' && mh.ERBB3 === 'hepatocitos_igual_o_mas'
      && mh.PRAME === 'cero_en_posibles_tumorales' && mb.PRAME === 'adn_de_nucleos_no_tumorales' && mb.TPBG === 'referencia_poco_precisa' && mb.INSM1 === 'casi_no_se_detecta',
    JSON.stringify({ TACSTD2: mh.TACSTD2, NECTIN4: mh.NECTIN4, SLC39A6: mh.SLC39A6, MUC1: mh.MUC1, CD276: mh.CD276, ERBB3: mh.ERBB3, PRAME: [mh.PRAME, mb.PRAME], TPBG: mb.TPBG, INSM1: mb.INSM1 }))
  }
}
// verificacion (18-oct): los alias del buscador llevan a un GEN; una isoforma (CLDN18.2) no se puede leer con sondas del gen entero
ok('alias de búsqueda: ninguno es una isoforma (p. ej. «CLDN18.2»)', !Object.keys(ALIAS_BUSCA).some((k) => /\d\.\d/.test(k)), Object.keys(ALIAS_BUSCA).filter((k) => /\d\.\d/.test(k)).join(', '))

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
