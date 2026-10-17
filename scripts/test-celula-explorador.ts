// Test del explorador de /celula-a-celula/explorar (contrato de datos, puerta, muro en la forma y léxico).
//
// Por qué existe (17-oct-2026): public/ se sirve tal cual y la preview de Netlify también es pública. En
// esta fase SOLO puede haber datos sintéticos (`ejemplo: true`); el export real vive en la zona clínica
// de Polaris y entra aquí únicamente con `sello: "verificado"`, `ok_miriam: true` y `fecha_ok`. Frenos:
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
import { join } from 'node:path'
import {
  RE_BARCODE, VEREDICTOS, coexpresion, densidad, estadoPuerta, motivosLesion, pct, porGrupo, tablaCoexp,
  type LesionDatos, type Manifiesto,
} from '../app/utils/celulaExplorador'

const RAIZ = join(import.meta.dirname, '..')
const DIR = join(RAIZ, 'public', 'celula', 'explorador')
let fallos = 0, hechos = 0
const ok = (nombre: string, cond: boolean, det = '') => { hechos++; if (!cond) { fallos++; console.log(`✘ ${nombre}${det ? `\n    ${det}` : ''}`) } }
const clon = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const lee = (p: string) => readFileSync(p, 'utf8')

/* ── 1 · contrato de lo publicado ── */
const man = JSON.parse(lee(join(DIR, 'manifiesto.json'))) as Manifiesto
const enDisco = readdirSync(DIR).filter((f) => f !== 'manifiesto.json').sort()
ok('todo fichero de la carpeta está en el manifiesto (nada suelto: public/ es público aunque no se pinte)',
  JSON.stringify(enDisco) === JSON.stringify(man.ficheros.map((f) => f.ruta).sort()), `disco ${enDisco} / manifiesto ${man.ficheros.map((f) => f.ruta)}`)
for (const f of man.ficheros) {
  const sha = createHash('sha256').update(readFileSync(join(DIR, f.ruta))).digest('hex')
  ok(`${f.ruta}: sha256 del manifiesto`, sha === f.sha256)
}
ok('el manifiesto declara hígado y hueso', JSON.stringify(man.lesiones) === '["higado","hueso"]')
const esEjemplo = man.ejemplo === true
if (esEjemplo) {
  ok('ejemplo: no lleva sello verificado ni OK (no puede pasar por real)', man.sello !== 'verificado' && man.ok_miriam === false && !('fecha_ok' in man))
}
else {
  ok('real: verificado, con OK de Miriam y su fecha', man.sello === 'verificado' && man.ok_miriam === true && /^\d{4}-\d{2}-\d{2}$/.test(man.fecha_ok ?? ''))
}
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
  ok(`${l}: solo las claves del contrato`, JSON.stringify(Object.keys(d).sort()) === JSON.stringify(['celulas', 'cnv', 'ejemplo', 'expr', 'genes', 'grupos', 'lesion', 'n_celulas', 'referencia', 'suelo', 'tipos', 'veredicto', 'version'].filter((k) => esEjemplo || k !== 'ejemplo').sort()), Object.keys(d).join(','))
  if (esEjemplo) ok(`${l}: el ejemplo no lleva ninguna lectura de la revisión (todo «sin_veredicto»)`, Object.values(d.veredicto).every((v) => v === 'sin_veredicto'))
}

/* ── 2 · la puerta ── */
const base: Manifiesto = { version: 1, ejemplo: true, sello: 'sin_verificar', ok_miriam: false, lesiones: ['higado', 'hueso'], ficheros: [] }
const real = (cambios: Partial<Manifiesto>) => ({ ...clon(base), ejemplo: undefined, sello: 'verificado', ok_miriam: true, fecha_ok: '2026-10-20', ...cambios }) as Manifiesto
ok('ejemplo sin demo: cerrada', estadoPuerta(base) === 'cerrada')
ok('ejemplo con demo: ejemplo', estadoPuerta(base, { demo: true }) === 'ejemplo')
ok('real verificado + OK + fecha: real', estadoPuerta(real({})) === 'real')
ok('real sin OK: cerrada (también con demo)', estadoPuerta(real({ ok_miriam: false })) === 'cerrada' && estadoPuerta(real({ ok_miriam: false }), { demo: true }) === 'cerrada')
ok('OK sin verificado: cerrada', estadoPuerta(real({ sello: 'inferido' })) === 'cerrada')
ok('ok_miriam como texto «true»: cerrada', estadoPuerta(real({ ok_miriam: 'true' as never })) === 'cerrada')
ok('sin fecha del OK: cerrada', estadoPuerta(real({ fecha_ok: undefined })) === 'cerrada')
ok('ejemplo con sello verificado y OK: sigue sin pasar por real', estadoPuerta({ ...clon(base), sello: 'verificado', ok_miriam: true, fecha_ok: '2026-10-20' }) === 'cerrada')
ok('sin manifiesto: cerrada', estadoPuerta(null) === 'cerrada' && estadoPuerta(undefined) === 'cerrada')
ok('manifiesto roto: cerrada', estadoPuerta({ version: 1 } as never, { demo: true }) === 'cerrada')

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
ok('el vocabulario de lecturas no tiene «diana»', !VEREDICTOS.some((v) => /diana/i.test(v)))

/* ── 4 · léxico y copy obligatorio ── */
const FICHEROS_COPY = [
  'app/pages/celula-a-celula-explorar.vue', 'app/utils/celulaExploradorTexto.ts', 'app/components/celula/CelulaExplorarTarjeta.vue',
  ...readdirSync(join(RAIZ, 'app/components/celula/explorar')).map((f) => `app/components/celula/explorar/${f}`),
]
const copy = FICHEROS_COPY.map((f) => lee(join(RAIZ, f))).join('\n')
ok('sin «diana(s)» en el explorador', !/\bdianas?\b/i.test(copy))
ok('sin «perfil molecular» en el explorador', !/perfil molecular|molecular profile/i.test(copy))
ok('muro de léxico: nada de científica/scientist/Olune', !/cient[ií]fica|scientist|olune/i.test(copy))
ok('sin guion largo (tell de IA en español)', !/—/.test(copy))
for (const [qué, re] of [
  ['banner del hígado «tumor frente a hepatocito no está resuelto célula a célula»', /tumor frente a hepatocito no está resuelto célula a célula/],
  ['«ARN ≠ proteína; manda la IHQ»', /ARN ≠ proteína; manda la IHQ/],
  ['«n=1, FFPE, exploratorio»', /n=1, FFPE, exploratorio/],
  ['«IHQ de HER2: 0»', /IHQ de HER2: 0/],
  ['aviso de vista reducida en el móvil', /versión reducida/],
  ['rótulo de datos de ejemplo', /DATOS DE EJEMPLO/],
  ['suelo ambiental en los violines', /Suelo ambiental: el porcentaje de células/],
] as const) ok(`copy obligatorio: ${qué}`, re.test(copy))
const pagina = lee(join(RAIZ, 'app/pages/celula-a-celula-explorar.vue'))
ok('la página es noindex sin datos reales', /robots: \(\) => \(hayReal\.value \? 'index, follow' : 'noindex, follow'\)/.test(pagina))
ok('con la puerta cerrada no se monta el explorador (v-if sobre el estado)', /<ClientOnly v-if="estado !== 'cerrada'">/.test(pagina))
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

console.log(fallos ? `\n${fallos} de ${hechos} comprobaciones fallan` : `${hechos} de ${hechos} comprobaciones en verde`)
process.exit(fallos ? 1 : 0)
