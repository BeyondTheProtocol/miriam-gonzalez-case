<script setup lang="ts">
/**
 * /datos — el caso de Miriam en datos, para quien puede moverlo. Versión 2 (24-sep-2026, a
 * petición de Miriam): SOLO clínica (el perfil molecular ya está en /ciencia), móvil primero y
 * con el dato por delante. Orden de lectura, de arriba abajo en un móvil de 375 px:
 *   1. hoy, en cuatro cifras · 2. línea de tiempo · 3. analíticas en pequeños múltiplos con la
 *   misma ventana y la misma fecha marcada · 4. carga tumoral · 5. tejido y reservorio ·
 *   6-9. lo demás, plegado.
 * Todo sale de app/data/caso.json (Polaris, `tools/caso_publico.py`): cada cifra con su fuente y
 * su sello, fail-closed. Esta página ordena y dibuja; no interpreta.
 */
import caso from '~/data/caso.json'
import type { Analito, Contexto, Evento, Lang, Texto, Ventana } from '~/utils/datosCaso'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<Lang>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const T = (v: Texto | null | undefined) => txtCaso(v as Texto, lang.value)

// El JSON lo valida Polaris antes de escribirlo; aquí se tipa lo justo para leerlo.
const c = caso as any
const hoy = String(c.generado).slice(0, 10)
const hoyMs = msFecha(hoy)
const fuentes: Record<string, { publico: Texto }> = c.fuentes
const fuenteTxt = (id: string) => T(fuentes[id]?.publico) || id
const lineas: any[] = c.lineas ?? []
const em = c.enfermedad_medible ?? {}
const material: any[] = c.material ?? []
const reservorio: any[] = c.reservorio ?? []
const seBusca: any[] = c.se_busca ?? []
const eventos: Evento[] = c.eventos ?? []
const grupos: Record<string, { analitos: Analito[] }> = c.analiticas.grupos
const an = (k: string) => buscarAnalito(grupos, k)
const fechaDx: string | null = (() => { const v = c.ficha?.fecha_diagnostico?.valor; const s = typeof v === 'string' ? v : v?.es; return /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') ? s : null })()

const seoTitle = () => L('El caso en datos: evolución clínica, analíticas y tejido disponible', 'The case in data: clinical course, labs and available tissue')
const seoDescription = () => L(
  'El caso de Miriam para quien pueda moverlo: su evolución clínica de un vistazo, las analíticas desde 2021 y qué tejido existe y dónde. Cada cifra con su fuente.',
  'Miriam’s case for whoever can move it forward: her clinical course at a glance, labs since 2021 and what tissue exists and where. Every number with its source.')
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', { title: () => L('El caso en datos', 'The case in data'), description: seoDescription })

/* ── 1. hoy, en cuatro cifras ─────────────────────────────────────────────────── */
const sistemicas = lineas.filter((l) => /^\d+L$/i.test(l.id))
const actual = sistemicas.find((l) => { const i = rangoParcial(l.inicio); const f = l.fin ? rangoParcial(l.fin) : null; return i && i[0] <= hoyMs && (!f || f[1] >= hoyMs) })
const proxima = sistemicas.find((l) => { const i = rangoParcial(l.inicio); return i && i[0] > hoyMs })
const ultimaTerminada = [...sistemicas].filter((l) => l.fin && rangoParcial(l.fin)![1] < hoyMs).pop()
const corto = (v: Texto) => T(v).split(' (')[0]
const cifraTrat = computed(() => {
  if (actual) return { valor: actual.id, detalle: corto(actual.tratamiento), fecha: L(`desde ${fechaCorta(actual.inicio, 'es')}`, `since ${fechaCorta(actual.inicio, 'en')}`), sello: actual.sello }
  // «sin línea sistémica», no «sin tratamiento»: la supresión ovárica sigue (lo vio comite-medico)
  const fondo = lineas.some((l) => l.id === 'LHRHa' && !l.fin) ? L('Goserelina en curso. ', 'Goserelin ongoing. ') : ''
  const prox = proxima ? L(`Próximo: ${corto(proxima.tratamiento)}, previsto el ${fechaCorta(proxima.inicio, 'es')}.`, `Next: ${corto(proxima.tratamiento)}, planned for ${fechaCorta(proxima.inicio, 'en')}.`) : ''
  return { valor: L('Sin línea sistémica', 'No systemic line'), detalle: fondo + prox,
    fecha: ultimaTerminada ? L(`desde ${fechaCorta(ultimaTerminada.fin, 'es')} (fin de la ${ultimaTerminada.id})`, `since ${fechaCorta(ultimaTerminada.fin, 'en')} (end of ${ultimaTerminada.id})`) : '',
    // el hecho (fin de la línea) lleva su sello; el plan futuro va aparte, marcado como «lo dice Miriam»
    sello: ultimaTerminada?.sello, notaSello: proxima?.sello }
})
/** últimos 90 días: ¿había una línea sistémica en curso? (solo días seguros; un mes aproximado cuenta como no) */
const franja90 = Array.from({ length: 90 }, (_, i) => {
  const t = hoyMs - (89 - i) * 86400000
  return sistemicas.some((l) => { const a = rangoParcial(l.inicio); const z = l.fin ? rangoParcial(l.fin) : null; return a && t >= a[1] && (!z || t <= z[0]) })
})
/* fila de elegibilidad: lo que un oncólogo mira primero, todo ya en caso.json con su sello */
const ecog = c.ficha?.ecog
const nLineas = sistemicas.filter((l) => { const i = rangoParcial(l.inicio); return i && i[0] <= hoyMs }).length
const nunca = c.nunca_recibido
const snc = (c.ficha?.sitios ?? []).find((x: any) => /^SNC|^CNS/.test(T(x.valor)))
const cribado = proxima
/* anterior de cada analítica, para decir cuánto cambió */
const previoTxt = (a: Analito | null) => {
  if (!a || a.puntos.length < 2) return ''
  const p = a.puntos[a.puntos.length - 2]
  return L(`antes: ${numCaso(p.v, 'es')} · ${fechaCorta(p.f, 'es')}`, `before: ${numCaso(p.v, 'en')} · ${fechaCorta(p.f, 'en')}`)
}
const ultimo = (a: Analito | null) => (a ? a.puntos[a.puntos.length - 1] : null)
const serie12 = (a: Analito | null, lsn = false) => (a ? a.puntos.slice(-12).map((p) => (lsn ? (xlsn(p) ?? p.v) : p.v)) : [])
const r1 = (v: number) => numCaso(Math.round(v * 10) / 10, lang.value)
const ca = an('ca153'); const hb = an('hemoglobina'); const ast = an('got'); const alt = an('gpt')
const pCa = ultimo(ca); const pHb = ultimo(hb); const pAst = ultimo(ast); const pAlt = ultimo(alt)

/* ── 2-3. ventana, contexto y fecha compartidas ───────────────────────────────── */
const ventana = ref<Ventana>('anio')
const rango = computed(() => rangoVentana(ventana.value, hoyMs))
const cursor = ref<string | null>(null)
const contexto: Contexto = {
  progresiones: eventos.filter((e) => e.clase === 'progresion' && e.precision === 'dia').map((e) => msFecha(e.desde)),
  bandas: sistemicas.map((l) => {
    const i = rangoParcial(l.inicio); const f = l.fin ? rangoParcial(l.fin) : null
    return i && i[0] <= hoyMs ? { id: l.id, ini: i[0], fin: f ? f[1] : hoyMs } : null
  }).filter((b): b is { id: string; ini: number; fin: number } => !!b),
}
type Mini = [string, 'real' | 'lsn', string, string]
const PESTANAS: { k: string; es: string; en: string; minis: Mini[] }[] = [
  { k: 'marcadores', es: 'Marcadores', en: 'Markers', minis: [
    ['ca153', 'lsn', 'CA 15-3', 'CA 15-3'], ['cea', 'lsn', 'CEA', 'CEA'], ['ldh', 'lsn', 'LDH', 'LDH']] },
  { k: 'higado', es: 'Hígado', en: 'Liver', minis: [
    ['got', 'lsn', 'AST (GOT)', 'AST'], ['gpt', 'lsn', 'ALT (GPT)', 'ALT'], ['fosfatasa_alcalina', 'lsn', 'Fosfatasa alcalina', 'Alkaline phosphatase'],
    ['ggt', 'lsn', 'GGT', 'GGT'], ['bilirrubina_total', 'lsn', 'Bilirrubina total', 'Total bilirubin']] },
  { k: 'sangre', es: 'Sangre', en: 'Blood count', minis: [
    ['hemoglobina', 'real', 'Hemoglobina', 'Hemoglobin'], ['neutrofilos_abs', 'real', 'Neutrófilos', 'Neutrophils'],
    ['linfocitos_abs', 'real', 'Linfocitos', 'Lymphocytes'], ['plaquetas', 'real', 'Plaquetas', 'Platelets']] },
  { k: 'otros', es: 'Riñón y más', en: 'Kidney and more', minis: [
    ['creatinina', 'real', 'Creatinina', 'Creatinine'], ['urea', 'real', 'Urea', 'Urea'], ['albumina', 'real', 'Albúmina', 'Albumin'],
    ['calcio', 'real', 'Calcio', 'Calcium'], ['sodio', 'real', 'Sodio', 'Sodium'], ['potasio', 'real', 'Potasio', 'Potassium'],
    ['magnesio', 'real', 'Magnesio', 'Magnesium'], ['pcr', 'real', 'Proteína C reactiva', 'C-reactive protein'], ['glucosa', 'real', 'Glucosa', 'Glucose']] },
]
const pestana = ref('marcadores')
const ver3d = ref(false)
// enlace directo a una pestaña (/datos?pestana=higado): para compartir justo esa vista
// OJO (mismo fallo que /ciencia con ?nivel=pro): en la página prerenderizada Nuxt hidrata con la
// ruta del payload, SIN query; en setup y onMounted `route.query` llega vacía y la query aparece
// después. Por eso se vigila, no se lee una vez.
const ruta = useRoute()
const aplicarPestana = () => {
  const q = String(ruta.query.pestana ?? ''); if (PESTANAS.some((p) => p.k === q)) pestana.value = q
  if (ruta.query.ver3d === '1') ver3d.value = true // enlace directo al catéter en 3D
}
onMounted(aplicarPestana)
watch(() => ruta.query.pestana, aplicarPestana)
const minis = computed(() => (PESTANAS.find((p) => p.k === pestana.value)?.minis ?? [])
  .map(([k, modo, es, en]) => ({ a: an(k), modo, nombre: L(es, en) })).filter((m) => m.a))
const VENTANAS: [Ventana, string, string][] = [['anio', 'Último año', 'Last year'], ['dx', 'Desde el diagnóstico', 'Since diagnosis'], ['todo', 'Todo', 'All']]

/* ── reproducir la evolución: un cabezal recorre del diagnóstico a hoy y todo se dibuja a su paso ── */
const DURACION = 16000 // ms para ~2 años y medio: lo bastante lento para leer cada evento
const cabezal = ref<number | null>(null)
const pausado = ref(false)
let raf = 0
let t0 = 0
let acumulado = 0 // ms de reproducción ya consumidos antes de la última pausa
/* sonido (opcional): cada valor de CA 15-3 y cada progresión por los que pasa el cabezal */
const sonido = useSonido()
const puntosCa = computed(() => (ca?.puntos ?? []).map((p) => ({ t: msFecha(p.f), r: xlsn(p), fuera: p.fuera === 'alto' || p.fuera === 'bajo' })))
function sonar(de: number, a: number) {
  if (!sonido.activo.value || a <= de) return
  for (const p of puntosCa.value) if (p.t > de && p.t <= a && p.r != null) sonido.valor(p.r, p.fuera)
  for (const t of contexto.progresiones) if (t > de && t <= a) sonido.progresion()
}
function paso(ahora: number) {
  if (pausado.value) return
  const frac = Math.min(1, Math.max(0, (acumulado + ahora - t0) / DURACION))
  const antes = cabezal.value ?? rango.value[0]
  cabezal.value = rango.value[0] + (hoyMs - rango.value[0]) * frac
  sonar(antes, cabezal.value)
  if (frac < 1) raf = requestAnimationFrame(paso)
  else setTimeout(() => { if (!pausado.value) cabezal.value = null }, 2500)
}
function reproducir() {
  if (cabezal.value != null && !pausado.value) { // pausa
    pausado.value = true
    acumulado += performance.now() - t0
    cancelAnimationFrame(raf)
    return
  }
  if (cabezal.value == null) { ventana.value = 'dx'; cursor.value = null; acumulado = 0 } // desde el principio
  pausado.value = false
  t0 = performance.now()
  raf = requestAnimationFrame(paso)
}
function parar() { cancelAnimationFrame(raf); pausado.value = false; acumulado = 0; cabezal.value = null }
onBeforeUnmount(() => cancelAnimationFrame(raf))
const reproduciendo = computed(() => cabezal.value != null && !pausado.value)

const sinFresco = material.find((m) => /fresco|fresh/i.test(T(m.muestra)) && /ningun|none|no existe/i.test(`${T(m.donde)} ${T(m.estado)}`))
/* tarjeta de muestra: título corto («Hígado, segmento IVa») y el resto del texto, entero, debajo */
const tituloMuestra = (m: any) => T(m.muestra).split(/\s*[(:.]/)[0]
const detalleMuestra = (m: any) => {
  let r = T(m.muestra).slice(tituloMuestra(m).length).replace(/^[\s:.]+/, '')
  // «(biopsia 8-jul-2026, Zúrich): 6 cilindros…» → «biopsia 8-jul-2026, Zúrich. 6 cilindros…»
  if (r.startsWith('(')) { const i = r.indexOf(')'); if (i > 0) r = `${r.slice(1, i)}${r.slice(i + 1).replace(/^[\s:.]*/, '. ')}` }
  return r.replace(/\.\s*$/, '').replace(/^\.\s*/, '')
}

/** desde el cielo: esa fecha en toda la página (ventana que la contenga, cursor, y bajar a Evolución) */
function irAFecha(iso: string) {
  parar()
  const t = msFecha(iso)
  if (t < rangoVentana('anio', hoyMs)[0]) ventana.value = t < rangoVentana('dx', hoyMs)[0] ? 'todo' : 'dx'
  cursor.value = iso
  nextTick(() => document.getElementById('s-evo')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
}

/* barra de secciones: la activa es la última cuyo inicio ya pasó bajo la cabecera */
const SECCIONES: [string, string, string][] = [['s-hoy', 'Hoy', 'Today'], ['s-dias', 'Días', 'Days'], ['s-evo', 'Evolución', 'Course'],
  ['s-higado', 'Hígado', 'Liver'], ['s-tejido', 'Tejido y reservorio', 'Tissue & port']]
const activa = ref('s-hoy')
let chipActivo: HTMLElement | null = null
let ioSec: IntersectionObserver | null = null
onMounted(() => {
  const vistos = new Map<string, boolean>()
  ioSec = new IntersectionObserver((es) => {
    for (const e of es) vistos.set(e.target.id, e.isIntersecting)
    const primera = SECCIONES.find(([id]) => vistos.get(id))
    if (primera) activa.value = primera[0]
  }, { rootMargin: '-120px 0px -55% 0px' })
  for (const [id] of SECCIONES) { const el = document.getElementById(id); if (el) ioSec.observe(el) }
})
watch(activa, () => nextTick(() => chipActivo?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })))
onBeforeUnmount(() => ioSec?.disconnect())

const hayReservorio = computed(() => useRouter().getRoutes().some((r) => r.path === '/reservorio'))
const n = (v: number) => numCaso(v, lang.value)
</script>

<template>
  <div class="overflow-x-clip">
    <div class="dt-progreso" aria-hidden="true" />
    <section class="section-spacing !pt-8 sm:!pt-12" :aria-label="L('El caso en datos', 'The case in data')">
      <div class="mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :title="L('El caso en datos', 'The case in data')"
          :subtitle="L('La evolución clínica de Miriam de un vistazo, con la fuente de cada cifra.', 'Miriam’s clinical course at a glance, and where every number comes from.')"
        >
          <p class="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-tinta">
            {{ L('Actualizado', 'Updated') }} {{ fechaCorta(hoy, lang) }} ·
            <a href="/datos/caso.json" download class="text-miriam underline underline-offset-2">{{ L('Descargar los datos', 'Download the data') }}</a>
          </p>
        </PageHeader>
        <p class="dt-aviso">
          <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
          {{ L('Resumen de sus informes, como apoyo a la decisión. No es diagnóstico ni consejo médico.', 'A summary of her reports, as decision support. Not a diagnosis or medical advice.') }}
        </p>

        <!-- 0 · el caso en píxeles: impresión visual primero (Miriam, 24-sep) -->
        <DatosCielo :grupos="grupos" :contexto="contexto" :hoy="hoy" :lang="lang" @fecha="irAFecha" />

        <!-- barra de secciones fija con la sección activa (scroll-spy): en el móvil, saltar sin perderse -->
        <nav class="dt-barra" :aria-label="L('Secciones', 'Sections')">
          <a v-for="[id, es, en] in SECCIONES" :key="id" :href="`#${id}`" class="dt-chip" :aria-current="activa === id ? 'true' : undefined"
             :ref="(el) => { if (el && activa === id) chipActivo = el as HTMLElement }">{{ L(es, en) }}</a>
        </nav>

        <!-- 1 · Hoy -->
        <section id="s-hoy" class="dt-sec" aria-labelledby="h-hoy">
          <h2 id="h-hoy" class="dt-h2">{{ L('Hoy', 'Today') }}</h2>
          <ul class="dt-eleg" :aria-label="L('Datos que suelen decidir un ensayo', 'Data that usually decide a trial')">
            <li v-if="ecog"><span class="dt-eleg__k">ECOG</span><span class="dt-eleg__v nums">{{ T(ecog.valor) }}</span><span class="dt-eleg__f">{{ fechaCorta(ecog.fecha, lang) }}</span><DatosSello :s="ecog.sello" :lang="lang" /></li>
            <li><span class="dt-eleg__k">{{ L('Líneas sistémicas', 'Systemic lines') }}</span><span class="dt-eleg__v nums">{{ nLineas }}</span><span class="dt-eleg__f">{{ sistemicas.filter((l) => rangoParcial(l.inicio)![0] <= hoyMs).map((l) => l.id).join(' · ') }}</span></li>
            <li v-if="nunca" class="dt-eleg--ancha"><span class="dt-eleg__k">{{ L('Nunca ha recibido', 'Never received') }}</span><span class="dt-eleg__lista">{{ (nunca.valor as Texto[]).map((x) => T(x).split(' (')[0]).join(' · ') }}</span><DatosSello :s="nunca.sello" :lang="lang" /></li>
            <li v-if="snc" class="dt-eleg--ancha"><span class="dt-eleg__k">{{ L('Sistema nervioso central', 'Central nervous system') }}</span><span class="dt-eleg__lista">{{ L('no estudiado (no es un negativo)', 'not studied (not a negative)') }}</span><DatosSello :s="snc.sello" :lang="lang" /></li>
          </ul>
          <div class="dt-cifras">
            <a href="#s-evo" class="dt-cifra-link" :aria-label="L('Ver la línea de tiempo de tratamientos', 'See the treatment timeline')">
            <DatosCifraClave :etiqueta="L('Tratamiento', 'Treatment')" :valor="cifraTrat.valor" :detalle="cifraTrat.detalle"
                             :fecha="cifraTrat.fecha" :sello="cifraTrat.sello" :franja="franja90"
                             :nota="cribado ? L('En cribado de TROPION-Breast06.', 'In screening for TROPION-Breast06.') : ''" :nota-sello="cifraTrat.notaSello" :lang="lang" />
            </a>
            <a v-if="pCa" href="#s-evo" class="dt-cifra-link" @click="pestana = 'marcadores'">
            <DatosCifraClave etiqueta="CA 15-3" :valor="n(pCa.v)" :unidad="ca!.unidad" :fuera="pCa.fuera"
                             :detalle="xlsn(pCa) ? L(`${r1(xlsn(pCa)!)} veces el límite normal`, `${r1(xlsn(pCa)!)} times the upper limit`) : ''"
                             :fecha="fechaCorta(pCa.f, lang)" sello="extraido" :serie="serie12(ca)" :previo="previoTxt(ca)" :lang="lang" />
            </a>
            <a v-if="pHb" href="#s-evo" class="dt-cifra-link" @click="pestana = 'sangre'">
            <DatosCifraClave :etiqueta="L('Hemoglobina', 'Hemoglobin')" :valor="n(pHb.v)" :unidad="hb!.unidad" :fuera="pHb.fuera"
                             :fecha="fechaCorta(pHb.f, lang)" sello="extraido" :serie="serie12(hb)" :previo="previoTxt(hb)"
                             :nota="L('Entre las dos, una transfusión en urgencias el 9-sep.', 'In between, a transfusion in the emergency room on 9 Sep.')"
                             :nota-sello="c.ficha?.estado_actual?.sello" :lang="lang" />
            </a>
            <a v-if="pAst" href="#s-evo" class="dt-cifra-link" @click="pestana = 'higado'">
            <DatosCifraClave :etiqueta="L('Hígado (AST)', 'Liver (AST)')" :valor="`${r1(xlsn(pAst) ?? 0)}×`" :unidad="L('límite normal', 'upper limit')"
                             :fuera="pAst.fuera" :detalle="`AST ${n(pAst.v)} · ALT ${pAlt ? n(pAlt.v) : '—'} U/L`"
                             :fecha="fechaCorta(pAst.f, lang)" sello="extraido" :serie="serie12(ast, true)" :previo="previoTxt(ast)"
                             :nota="pAst.ref_de === 'banda' ? L('Límite: el habitual del laboratorio; este informe no lo trae.', 'Limit: the lab’s usual one; this report does not print it.') : ''" :lang="lang" />
            </a>
          </div>
        </section>

        <!-- 1b · un cuadrado por día desde el diagnóstico -->
        <section v-if="fechaDx" id="s-dias" class="dt-sec" aria-labelledby="h-dias">
          <h2 id="h-dias" class="dt-h2">{{ L('Cada día desde el diagnóstico', 'Every day since diagnosis') }}</h2>
          <DatosDias :lineas="lineas" :eventos="eventos" :diagnostico="fechaDx" :hoy="hoy" :lang="lang" />
        </section>

        <!-- 2-3 · Evolución: línea de tiempo + analíticas con la misma ventana -->
        <section id="s-evo" class="dt-sec" aria-labelledby="h-evo">
          <h2 id="h-evo" class="dt-h2">{{ L('Evolución', 'Clinical course') }}</h2>
          <div class="dt-controles">
            <div class="dt-vistas" role="group" :aria-label="L('Ventana de tiempo', 'Time window')">
              <button v-for="[k, es, en] in VENTANAS" :key="k" type="button" class="dt-vista" :aria-pressed="ventana === k" @click="parar(); ventana = k">{{ L(es, en) }}</button>
            </div>
            <button type="button" class="dt-play" :aria-pressed="reproduciendo" @click="reproducir">
              <Icon :name="reproduciendo ? 'ph:pause-fill' : 'ph:play-fill'" class="w-4 h-4" aria-hidden="true" />
              {{ reproduciendo ? L('Pausa', 'Pause') : cabezal != null ? L('Seguir', 'Resume') : L('Reproducir la evolución', 'Play the course') }}
            </button>
            <button type="button" class="dt-sonido" :aria-pressed="sonido.activo.value" @click="sonido.alternar()">
              <Icon :name="sonido.activo.value ? 'ph:speaker-high-fill' : 'ph:speaker-slash'" class="w-4 h-4" aria-hidden="true" />
              {{ sonido.activo.value ? L('Con sonido', 'Sound on') : L('Escuchar el CA 15-3', 'Hear CA 15-3') }}
            </button>
          </div>
          <p v-if="sonido.activo.value" class="dt-nota">{{ L('Al reproducir, cada valor de CA 15-3 suena: más agudo cuantas más veces supera el límite normal; timbre más brillante si está fuera de rango; golpe grave en cada progresión.', 'While playing, each CA 15-3 value sounds: higher the more times it exceeds the upper limit; brighter timbre when out of range; a low thud at each progression.') }}</p>
          <p v-if="cabezal != null" class="dt-reloj nums" aria-live="off">{{ fechaCorta(new Date(cabezal).toISOString().slice(0, 10), lang) }}</p>
          <DatosLineaTiempo :eventos="eventos" :lineas="lineas" :desde="rango[0]" :hasta="rango[1]" :hoy="hoy" :lang="lang" :cabezal="cabezal" />

          <h3 class="dt-h3">{{ L('Analíticas', 'Labs') }}</h3>
          <p class="dt-nota">{{ L('Mismo eje que la línea de arriba. ▲▼ fuera de rango; ◆ marcado en el informe sin salirse del rango; 1× es el límite normal. Toca un gráfico y verás esa fecha en todos.',
                                  'Same axis as the timeline above. ▲▼ out of range; ◆ flagged on the report without leaving the range; 1× is the upper limit of normal. Tap a chart to see that date on all of them.') }}</p>
          <div class="dt-pestanas" role="group" :aria-label="L('Grupo de pruebas', 'Test group')">
            <button v-for="p in PESTANAS" :key="p.k" type="button" class="dt-pestana" :aria-pressed="pestana === p.k" aria-controls="dt-minis" @click="pestana = p.k">{{ L(p.es, p.en) }}</button>
          </div>
          <!-- hígado: cinta de calor (forma nueva); los cinco gráficos, a un toque -->
          <template v-if="pestana === 'higado'">
            <DatosCintaHigado :filas="minis.map((m) => ({ a: m.a!, nombre: m.nombre.split(' (')[0].replace('Fosfatasa alcalina', 'FA').replace('Alkaline phosphatase', 'ALP').replace('Bilirrubina total', 'Bili').replace('Total bilirubin', 'Bili') }))"
                              :desde="rango[0]" :hasta="rango[1]" :contexto="contexto" :cursor="cursor" :cabezal="cabezal" :lang="lang"
                              @cursor="parar(); cursor = $event" />
            <details class="dt-det">
              <summary>{{ L('Cada prueba en su gráfico', 'Each test on its own chart') }}</summary>
              <div class="dt-minis">
                <DatosMiniSerie v-for="m in minis" :key="m.a!.key" :a="m.a!" :nombre="m.nombre" :modo="m.modo"
                                :desde="rango[0]" :hasta="rango[1]" :contexto="contexto" :cursor="cursor" :cabezal="cabezal" :lang="lang"
                                @cursor="parar(); cursor = $event" />
              </div>
            </details>
          </template>
          <div v-else id="dt-minis" class="dt-minis" aria-live="polite">
            <DatosMiniSerie v-for="m in minis" :key="m.a!.key" :a="m.a!" :nombre="m.nombre" :modo="m.modo"
                            :desde="rango[0]" :hasta="rango[1]" :contexto="contexto" :cursor="cursor" :cabezal="cabezal" :lang="lang"
                            @cursor="parar(); cursor = $event" />
          </div>
          <p class="dt-pie"><DatosSello :s="c.analiticas.sello" :lang="lang" /> {{ L('Cómo se leen y fechan: en «Fuentes y método».', 'How they are read and dated: under “Sources and method”.') }}</p>
        </section>

        <!-- 4 · Carga tumoral -->
        <section v-if="(em.recist ?? []).length" id="s-higado" class="dt-sec" aria-labelledby="h-carga">
          <h2 id="h-carga" class="dt-h2">{{ L('Enfermedad en el hígado', 'Disease in the liver') }}</h2>
          <DatosCargaTumoral :recist="em.recist" :volumen="em.volumen ?? []" :lang="lang" />
          <p class="dt-pie">{{ L('RECIST: informe del radiólogo', 'RECIST: radiologist’s report') }} <DatosSello :s="em.recist[0].sello" :lang="lang" /> · {{ L('Volumen: modelo de segmentación sobre los mismos TC, sin validar por radiología.', 'Volume: segmentation model on the same CT scans, not validated by radiology.') }}</p>
          <details class="dt-det">
            <summary>{{ L('Lesión a lesión', 'Lesion by lesion') }}</summary>
            <div class="dt-tabla-wrap">
              <table class="data-table dt-compacta">
                <thead><tr><th>{{ L('Lesión', 'Lesion') }}</th><th>{{ L('Fecha', 'Date') }}</th><th>{{ L('Diám. mm', 'Diam. mm') }}</th><th>{{ L('Vol. ml', 'Vol. ml') }}</th><th>SUVmax</th></tr></thead>
                <tbody>
                  <template v-for="les in em.lesiones ?? []" :key="T(les.id)">
                    <tr v-for="(e, j) in les.estudios" :key="j">
                      <td v-if="j === 0" :rowspan="les.estudios.length" class="col-marker">{{ T(les.id) }}</td>
                      <td class="nums whitespace-nowrap">{{ e.fecha }}</td>
                      <td class="nums">{{ e.diametro_mm != null ? n(e.diametro_mm) : '—' }}</td>
                      <td class="nums">{{ e.volumen_ml != null ? n(e.volumen_ml) : '—' }}</td>
                      <td class="nums">{{ e.suvmax != null ? n(e.suvmax) : '—' }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <p class="dt-pie">{{ L('En 3D, con las medidas del radiólogo:', 'In 3D, with the radiologist’s measurements:') }} <NuxtLink :to="localePath('/lesiones')" class="dt-link">{{ L('mama, hígado y hueso', 'breast, liver and bone') }}</NuxtLink></p>
          </details>
        </section>

        <!-- 5 · Tejido y reservorio -->
        <section id="s-tejido" class="dt-sec" aria-labelledby="h-tejido">
          <h2 id="h-tejido" class="dt-h2">{{ L('Tejido, muestras y reservorio', 'Tissue, samples and port') }}</h2>
          <p v-if="sinFresco" class="dt-resumen-tejido">
            <strong>{{ L('Todo el material disponible está en parafina.', 'All available material is in paraffin.') }}</strong>
            {{ L('No hay tejido fresco, congelado ni PBMC.', 'There is no fresh or frozen tissue and no PBMC.') }}
            <DatosSello :s="sinFresco.sello" :lang="lang" />
          </p>
          <div class="dt-tarjetas">
            <article v-for="(m, i) in material.slice(0, 3)" :key="i" class="dt-tarjeta">
              <p class="dt-tarjeta__t">{{ tituloMuestra(m) }}</p>
              <p v-if="detalleMuestra(m)" class="dt-tarjeta__det">{{ detalleMuestra(m) }}</p>
              <p v-if="m.codigo" class="dt-tarjeta__cod">{{ m.codigo }}</p>
              <p class="dt-tarjeta__l"><span>{{ L('Dónde', 'Where') }}</span> {{ T(m.donde) }}</p>
              <p class="dt-tarjeta__l"><span>{{ L('Estado', 'Status') }}</span> {{ T(m.estado) }}</p>
              <p class="dt-tarjeta__pie"><span class="nums">{{ m.fecha }}</span> <DatosSello :s="m.sello" :lang="lang" /></p>
            </article>
            <details v-if="material.length > 3" class="dt-det dt-tarjeta--ancha">
              <summary>{{ L(`Otras ${material.length - 3} muestras`, `${material.length - 3} more samples`) }}</summary>
              <div class="dt-tarjetas">
                <article v-for="(m, i) in material.slice(3)" :key="i" class="dt-tarjeta">
                  <p class="dt-tarjeta__t">{{ tituloMuestra(m) }}</p>
              <p v-if="detalleMuestra(m)" class="dt-tarjeta__det">{{ detalleMuestra(m) }}</p>
                  <p v-if="m.codigo" class="dt-tarjeta__cod">{{ m.codigo }}</p>
                  <p class="dt-tarjeta__l"><span>{{ L('Dónde', 'Where') }}</span> {{ T(m.donde) }}</p>
                  <p class="dt-tarjeta__l"><span>{{ L('Estado', 'Status') }}</span> {{ T(m.estado) }}</p>
                  <p class="dt-tarjeta__pie"><span class="nums">{{ m.fecha }}</span> <DatosSello :s="m.sello" :lang="lang" /></p>
                </article>
              </div>
            </details>
            <article v-if="reservorio.length" class="dt-tarjeta dt-tarjeta--ancha">
              <p class="dt-tarjeta__t">{{ L('Reservorio venoso: el catéter mide lo mismo en los tres TC', 'Venous port: the catheter measures the same length on all three CT scans') }}</p>
              <p class="dt-tarjeta__l">{{ L('El reservorio dejó de dar retorno de sangre. Longitud del catéter, del portal a la punta, en tres TC:', 'The port stopped giving blood return. Catheter length, port to tip, on three CT scans:') }}</p>
              <DatosReservorio :medidas="reservorio" :lang="lang" />
              <!-- el 3D (mallas de ~4 MB) solo se descarga si se pide: el móvil no lo paga por defecto -->
              <button v-if="!ver3d" type="button" class="dt-3d" @click="ver3d = true">
                <Icon name="ph:cube-duotone" class="w-5 h-5" aria-hidden="true" />
                {{ L('Girar el catéter en 3D', 'Rotate the catheter in 3D') }}
              </button>
              <div v-else class="dt-visor3d">
                <ClientOnly>
                  <ReservoirView base="/reservorio/" />
                  <template #fallback>
                    <div class="dt-visor3d__carga">{{ L('cargando el 3D…', 'loading 3D…') }}</div>
                  </template>
                </ClientOnly>
              </div>
              <p class="dt-pie">{{ L('Medida semiautomática sobre sus TC, sin validar por radiología.', 'Semi-automatic measurement on her CT scans, not validated by radiology.') }} <DatosSello :s="reservorio[0].sello" :lang="lang" /></p>
              <NuxtLink v-if="hayReservorio" :to="localePath('/reservorio')" class="dt-boton">{{ L('La historia completa del reservorio', 'The full port story') }} →</NuxtLink>
            </article>
          </div>
        </section>

        <!-- 6-9 · lo demás, plegado -->
        <section class="dt-sec dt-plegados" :aria-label="L('Más detalle', 'More detail')">
          <p class="dt-molecular">
            {{ L('El diagnóstico completo, los receptores, la historia de tratamientos y el perfil molecular los tienes en', 'You’ll find the full diagnosis, receptors, treatment history and molecular profile on') }}
            <NuxtLink :to="localePath('/ciencia')" class="dt-link">{{ L('La ciencia', 'The science page') }}</NuxtLink>.
          </p>
          <details class="dt-det">
            <summary>{{ L('Cómo ayudar', 'How to help') }}</summary>
            <ul class="dt-lista"><li v-for="(b, i) in seBusca.slice(0, 5)" :key="i">{{ T(b.valor) }}</li></ul>
            <NuxtLink :to="localePath('/contacto')" class="dt-link mt-3 inline-flex min-h-[44px] items-center">{{ L('Escríbenos', 'Write to us') }} →</NuxtLink>
          </details>
          <details class="dt-det">
            <summary>{{ L('Fuentes y método', 'Sources and method') }}</summary>
            <p class="dt-nota">{{ L('Generamos esta página a partir de un perfil que revisamos a mano sobre los informes de Miriam, de las analíticas leídas de sus informes de laboratorio y de la cronología de esta web. Si un dato no tiene fuente, no lo publicamos. Sellos: verificado (cotejado con el informe original), extraído del informe (lectura automática), inferido, lo dice Miriam (sin documento detrás) o sin verificar.',
                                   'We build this page from a profile we review by hand against Miriam’s reports, from lab values read off her lab reports and from this site’s timeline. If something has no source, we don’t publish it. Labels: verified (checked against the original report), extracted from report (read automatically), inferred, per Miriam (no document behind it) or unverified.') }}</p>
            <p class="dt-nota">{{ T(c.analiticas.fuente) }}</p>
            <ul class="dt-lista dt-nota"><li v-for="(f, k) in fuentes" :key="k">{{ T(f.publico) }}</li></ul>
          </details>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dt-aviso { display: flex; gap: 8px; align-items: flex-start; font: 500 13.5px/1.45 var(--font-body); color: var(--color-text);
  background: var(--color-bg-card); border-radius: 12px; padding: 10px 12px; margin: 0 0 8px; }
.dt-progreso { display: none; }
/* barra de progreso de lectura (animation-timeline: scroll()); sin soporte, no aparece */
@supports (animation-timeline: scroll()) {
  .dt-progreso { display: block; position: fixed; left: 0; right: 0; top: 0; height: 3px; z-index: 60;
    background: var(--color-miriam); transform-origin: 0 50%; animation: dt-avanza linear both; animation-timeline: scroll(root); }
  @keyframes dt-avanza { from { transform: scaleX(0); } to { transform: scaleX(1); } }
}
.dt-barra { position: sticky; top: 64px; z-index: 40; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
  margin: 16px -16px 0; padding: 8px 16px; background: rgb(var(--color-bg-rgb) / 0.92); backdrop-filter: saturate(1.4) blur(8px);
  border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.08); }
.dt-barra::-webkit-scrollbar { display: none; }
@media (min-width: 640px) { .dt-barra { top: 72px; margin: 16px 0 0; padding: 8px 0; } }
.dt-chip { flex: none; display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 999px; white-space: nowrap;
  font: 600 13px var(--font-body); color: var(--color-text-soft); border: 1px solid rgb(var(--color-text-rgb) / 0.12);
  transition: background var(--dur-micro), color var(--dur-micro), border-color var(--dur-micro); }
.dt-chip[aria-current='true'] { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.dt-chip:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dt-cifra-link { display: block; border-radius: 14px; color: inherit; text-decoration: none; transition: transform var(--dur-micro) var(--curva-salida); }
.dt-cifra-link:active { transform: scale(0.98); }
.dt-cifra-link:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 3px; }
.dt-cifra-link > * { height: 100%; }
.dt-sec { padding-top: 32px; scroll-margin-top: 124px; }
/* Entrada al hacer scroll con CSS nativo (animation-timeline: view(); WebKit, jun-2025). Mejora
   progresiva: sin soporte o con «movimiento reducido», la sección simplemente está. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .dt-sec { animation: dt-entra linear both; animation-timeline: view(); animation-range: entry 0% cover 22%; }
    @keyframes dt-entra { from { opacity: 0.001; transform: translateY(28px) scale(0.985); } to { opacity: 1; transform: none; } }
  }
}
.dt-h2 { font: var(--tipo-h2); color: var(--color-text); margin: 0 0 12px; }
.dt-h3 { font: 700 17px/1.3 var(--font-body); color: var(--color-text); margin: 26px 0 6px; }
.dt-nota { font: 400 13px/1.5 var(--font-body); color: var(--color-text-soft); margin: 0 0 10px; max-width: 70ch; }
.dt-pie { font: 400 12px/1.5 var(--font-body); color: var(--color-text-soft); margin: 10px 0 0; }
.dt-link { color: var(--color-miriam); text-decoration: underline; text-underline-offset: 2px; }
.dt-eleg { list-style: none; margin: 0 0 12px; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
@media (min-width: 900px) { .dt-eleg { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.dt-eleg li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgb(var(--color-text-rgb) / 0.1); background: var(--color-bg); min-width: 0; }
.dt-eleg--ancha { grid-column: span 2; }
@media (min-width: 900px) { .dt-eleg--ancha { grid-column: span 1; } }
.dt-eleg__k { width: 100%; font: 600 11.5px var(--font-body); color: var(--color-text-soft); }
.dt-eleg__v { font: 700 22px/1.1 var(--font-display); color: var(--color-text); }
.dt-eleg__f { font: 500 11px var(--font-mono); color: var(--color-text-soft); }
.dt-eleg__lista { font: 500 13px/1.35 var(--font-body); color: var(--color-text); }
.dt-resumen-tejido { font: 400 14px/1.45 var(--font-body); color: var(--color-text); margin: 0 0 12px; padding: 10px 12px; border-radius: 12px; background: var(--color-miriam-soft); }
.dt-cifras { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
@media (min-width: 900px) { .dt-cifras { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; } }
.dt-controles { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
.dt-vistas { display: inline-flex; gap: 4px; padding: 3px; border-radius: 999px; background: rgb(var(--color-text-rgb) / 0.05); }
.dt-play { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 999px;
  background: var(--color-miriam); color: #fff; font: 700 14px var(--font-body); }
.dt-sonido { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border-radius: 999px;
  border: 1px solid rgb(var(--color-text-rgb) / 0.2); color: var(--color-text); font: 600 13.5px var(--font-body); }
.dt-sonido[aria-pressed='true'] { background: var(--color-miriam-soft); border-color: var(--color-miriam); }
.dt-sonido:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dt-play:focus-visible { outline: 2px solid var(--color-text); outline-offset: 2px; }
.dt-reloj { font: var(--tipo-cifra); font-size: clamp(28px, 8vw, 44px); letter-spacing: var(--track-cifra); color: var(--color-miriam); margin: 0 0 4px; }
.dt-vista { font: 600 13px/1 var(--font-body); padding: 0 12px; min-height: 44px; border-radius: 999px; color: var(--color-text-soft); }
.dt-vista[aria-pressed='true'] { background: var(--color-text); color: var(--color-bg); }
.dt-pestanas { display: flex; gap: 6px; overflow-x: auto; margin: 4px 0 6px; padding-bottom: 2px; }
.dt-pestana { font: 600 14px/1 var(--font-body); padding: 0 14px; min-height: 44px; border-radius: 999px; white-space: nowrap;
  border: 1px solid rgb(var(--color-text-rgb) / 0.15); color: var(--color-text); }
.dt-pestana[aria-pressed='true'] { background: var(--color-miriam-soft); border-color: var(--color-miriam); }
.dt-vista:focus-visible, .dt-pestana:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dt-minis { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 28px; }
@media (min-width: 900px) { .dt-minis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dt-det { margin-top: 12px; border-top: 1px solid rgb(var(--color-text-rgb) / 0.1); padding-top: 4px; }
.dt-det > summary { font: 700 16px/1.3 var(--font-body); color: var(--color-text); cursor: pointer; min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 12px; list-style: none; }
/* flex quita el marcador nativo: sin esto un desplegable parece un título (lo vio `diseno`) */
.dt-det > summary::-webkit-details-marker { display: none; }
.dt-det > summary::after { content: ''; flex: none; width: 9px; height: 9px; margin-right: 6px; border-right: 2px solid var(--color-miriam);
  border-bottom: 2px solid var(--color-miriam); transform: rotate(45deg) translateY(-3px); transition: transform var(--dur-micro) var(--curva-salida); }
.dt-det[open] > summary::after { transform: rotate(-135deg) translateY(-3px); }
.dt-tabla-wrap { overflow-x: auto; border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 12px; }
.dt-compacta :deep(td), .dt-compacta :deep(th) { padding: 6px 10px !important; }
.dt-tarjetas { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
@media (min-width: 700px) { .dt-tarjetas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1000px) { .dt-tarjetas { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.dt-tarjeta { background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 14px; padding: 12px 14px; min-width: 0; }
.dt-tarjeta--ancha { grid-column: 1 / -1; }
.dt-tarjeta__t { font: 700 14.5px/1.35 var(--font-body); color: var(--color-text); margin: 0 0 4px; }
.dt-tarjeta__det { font: 400 12.5px/1.4 var(--font-body); color: var(--color-text-soft); margin: 0 0 6px; }
.dt-tarjeta__cod { font: 600 12.5px var(--font-mono); color: var(--color-text); margin: 0 0 6px; overflow-wrap: anywhere; }
.dt-tarjeta__l { font: 400 13px/1.45 var(--font-body); color: var(--color-text); margin: 0 0 4px; }
.dt-tarjeta__l span { font-weight: 600; color: var(--color-text-soft); margin-right: 4px; }
.dt-tarjeta__pie { display: flex; gap: 8px; align-items: center; font: 500 11.5px var(--font-mono); color: var(--color-text-soft); margin: 8px 0 0; }
.dt-3d { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; margin-top: 10px; padding: 0 16px; border-radius: 999px;
  background: var(--color-text); color: var(--color-bg); font: 700 14px var(--font-body); }
.dt-3d:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dt-visor3d { margin-top: 12px; max-width: 520px; }
.dt-visor3d__carga { aspect-ratio: 1 / 1; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  background: var(--color-text); color: rgb(var(--color-bg-rgb) / 0.7); font: 500 12px var(--font-mono); }
.dt-boton { display: inline-flex; align-items: center; min-height: 44px; margin-top: 6px; font: 700 14px var(--font-body); color: var(--color-miriam); text-decoration: underline; text-underline-offset: 3px; }
.dt-lista { margin: 0; padding-left: 18px; display: grid; gap: 6px; font: 400 14.5px/1.5 var(--font-body); color: var(--color-text); }
.dt-lista-trat { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; font: 400 14px/1.45 var(--font-body); color: var(--color-text); }
.dt-lista-trat p { margin: 0; }
.dt-ficha { margin: 0; }
.dt-ficha__fila { display: grid; grid-template-columns: 1fr; gap: 2px; padding: 8px 0; border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.07); }
@media (min-width: 700px) { .dt-ficha__fila { grid-template-columns: minmax(150px, 220px) 1fr; gap: 12px; } }
.dt-ficha__fila dt { font: 600 13px/1.45 var(--font-body); color: var(--color-text-soft); }
.dt-ficha__fila dd { font: 400 14px/1.5 var(--font-body); color: var(--color-text); margin: 0; }
.dt-molecular { font: 400 14px/1.5 var(--font-body); color: var(--color-text); margin: 18px 0 0; }
.dt-ayuda { margin: 28px 0 8px; }
</style>
