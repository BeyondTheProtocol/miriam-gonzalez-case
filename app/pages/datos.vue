<script setup lang="ts">
/**
 * /datos — el caso de Miriam en datos, para quien puede moverlo (oncólogos, laboratorios, gente
 * que ya está ayudando). Todo sale de app/data/caso.json, que genera Polaris
 * (`tools/caso_publico.py`): cada cifra con su fuente y su sello, fail-closed. Esta página no
 * calcula ni interpreta nada; ordena y dibuja.
 *
 * Arriba, la figura de primer vistazo (consejo de un médico, 24-sep-2026): el curso clínico
 * entero sobre un eje de tiempo compartido. Debajo, cada bloque con su tabla.
 * Resumen de informes, no diagnóstico ni consejo médico.
 */
import caso from '~/data/caso.json'
import type { Analito, Evento, Lang, Texto } from '~/utils/datosCaso'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<Lang>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const T = (v: Texto | null | undefined) => txtCaso(v as Texto, lang.value)

// El JSON lo valida Polaris antes de escribirlo; aquí se tipa lo justo para leerlo.
const c = caso as any
const hoy = String(c.generado).slice(0, 10)
const fuentes: Record<string, { publico: Texto }> = c.fuentes
const fuenteTxt = (id: string) => T(fuentes[id]?.publico) || id
const ficha = c.ficha ?? {}
const lineas: any[] = c.lineas ?? []
const em = c.enfermedad_medible ?? {}
const mol = c.molecular ?? {}
const material: any[] = c.material ?? []
const seBusca: any[] = c.se_busca ?? []
const eventos: Evento[] = c.eventos ?? []
const grupos: Record<string, { nombre: string; analitos: Analito[] }> = c.analiticas.grupos
const avisos: { tipo: string; detalle: string }[] = c.avisos ?? []

const seoTitle = () => L('El caso en datos: curso clínico, analíticas, perfil molecular y tejido disponible', 'The case in data: clinical course, labs, molecular profile and available tissue')
const seoDescription = () => L(
  'El caso de Miriam para quien pueda ayudar: su evolución desde 2021 en una figura, las analíticas, el perfil molecular por muestra y qué tejido existe y dónde. Cada cifra con su fuente.',
  'Miriam’s case for anyone who can help: her course since 2021 in one figure, labs, the molecular profile by sample and what tissue exists and where. Every figure with its source.')
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', { title: () => L('El caso en datos', 'The case in data'), description: seoDescription })

/* eventos numerados igual que en la figura (orden cronológico de los dibujables) */
const eventosNum = computed(() => eventos.filter((e) => e.dibujar)
  .slice().sort((a, b) => a.desde.localeCompare(b.desde)).map((e, i) => ({ ...e, n: i + 1 })))

/* analíticas de detalle: pestaña por grupo, misma ventana de tiempo para todos los minis */
const grupoSel = ref(Object.keys(grupos).includes('marcadores') ? 'marcadores' : Object.keys(grupos)[0])
const ventana = ref<'dx' | 'todo' | 'anio'>('dx')
const DIA = 86400000
const hoyMs = msFecha(hoy)
const vent = computed<[number, number]>(() => {
  if (ventana.value === 'anio') return [hoyMs - 365 * DIA, hoyMs + 20 * DIA]
  if (ventana.value === 'dx') return [Date.UTC(2023, 9, 1), hoyMs + 20 * DIA]
  return [Date.UTC(2021, 0, 1), hoyMs + 20 * DIA]
})
const NOMBRE_GRUPO: Record<string, [string, string]> = {
  marcadores: ['Marcadores tumorales', 'Tumour markers'], hematologia: ['Hemograma', 'Blood count'],
  renal_hepatico: ['Hígado, riñón y metabolismo', 'Liver, kidney and metabolism'], electrolitos: ['Electrolitos y calcio', 'Electrolytes and calcium'],
}

/* molecular: columnas por muestra en el orden en que vienen */
const muestras: any[] = mol.muestras ?? []
const celda = (v: string | undefined) => (v == null || v === '' ? '' : v)

const hayReservorio = computed(() => useRouter().getRoutes().some((r) => r.path === '/reservorio'))
const secciones = computed(() => [
  ['vistazo', L('De un vistazo', 'At a glance')], ['ficha', L('Ficha', 'Summary')],
  ['tratamientos', L('Tratamientos', 'Treatments')], ['enfermedad', L('Enfermedad medible', 'Measurable disease')],
  ['molecular', L('Molecular', 'Molecular')], ['analiticas', L('Analíticas', 'Labs')],
  ['material', L('Tejido disponible', 'Available tissue')], ['falta', L('Qué falta', 'What’s missing')],
  ['fuentes', L('Fuentes', 'Sources')],
])
const nAnaliticas = c.analiticas.n_analiticas
const n = (v: number) => numCaso(v, lang.value)
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('El caso en datos', 'The case in data')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :title="L('El caso en datos', 'The case in data')"
          :subtitle="L('Lo que un oncólogo o un laboratorio necesita para evaluar mi caso, con la fuente de cada cifra.',
                       'What an oncologist or a lab needs to assess my case, with the source of every figure.')"
        >
          <div class="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-tinta">
            <span>{{ L('Actualizado', 'Updated') }} {{ fechaCorta(hoy, lang) }}</span>
            <span class="text-tinta/35" aria-hidden="true">·</span>
            <span>{{ nAnaliticas }} {{ L('analíticas desde 2021', 'lab reports since 2021') }}</span>
            <span class="text-tinta/35" aria-hidden="true">·</span>
            <a href="/datos/caso.json" download class="text-miriam underline underline-offset-2">{{ L('Descargar los datos (JSON)', 'Download the data (JSON)') }}</a>
          </div>
        </PageHeader>

        <div class="alert-callout mb-6" role="note">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Un resumen de mis informes. No es un diagnóstico ni consejo médico.', 'A summary of my reports. Not a diagnosis or medical advice.') }}
          </p>
          {{ L('Cada dato lleva un sello: verificado (cotejado contra el informe original), inferido, lo dice Miriam (sin documento detrás) o sin verificar. Las analíticas se extraen de los informes de laboratorio de forma automática.',
               'Every item carries a label: verified (checked against the original report), inferred, per Miriam (no document behind it) or unverified. Lab values are extracted automatically from the lab reports.') }}
        </div>

        <nav class="dt-indice" :aria-label="L('Secciones', 'Sections')">
          <a v-for="[id, txt] in secciones" :key="id" :href="`#${id}`">{{ txt }}</a>
        </nav>

        <!-- ── De un vistazo ── -->
        <section id="vistazo" class="dt-sec">
          <h2 class="dt-h2">{{ L('De un vistazo', 'At a glance') }}</h2>
          <p class="dt-intro">{{ L('Todo el curso clínico sobre el mismo eje de tiempo: eventos, tratamientos, marcadores, hígado, hemograma y carga tumoral. Los marcadores y el hígado van en veces el límite superior normal del informe de cada día, para poder comparar pruebas con unidades distintas.',
                                  'The whole clinical course on one time axis: events, treatments, markers, liver, blood count and tumour burden. Markers and liver are shown as multiples of the upper limit of normal from each day’s report, so tests in different units can be compared.') }}</p>
          <!-- escritorio: eje horizontal · móvil: el tiempo baja (la horizontal en un teléfono no se lee) -->
          <div class="hidden md:block">
            <DatosCursoClinico
              :eventos="eventos" :lineas="lineas" :grupos="grupos"
              :recist="em.recist ?? []" :volumen="em.volumen ?? []" :hoy="hoy" :lang="lang"
            />
          </div>
          <div class="md:hidden">
            <DatosCursoVertical :eventos="eventos" :lineas="lineas" :grupos="grupos" :hoy="hoy" :lang="lang" />
          </div>
          <details class="dt-det">
            <summary>{{ L(`Los ${eventosNum.length} eventos numerados de la figura`, `The ${eventosNum.length} numbered events in the figure`) }}</summary>
            <ol class="dt-eventos">
              <li v-for="e in eventosNum" :key="e.id">
                <span class="dt-eventos__n nums">{{ e.n }}</span>
                <span class="dt-eventos__f nums">{{ e.fecha_texto }}</span>
                <span>{{ T(e.titulo) }}<a v-if="e.enlace" :href="e.enlace" target="_blank" rel="noopener" class="dt-link"> ↗</a></span>
              </li>
            </ol>
            <p class="dt-pie">{{ L('Salen de la cronología pública de esta web. Si una fecha solo se conoce al mes, se dibuja como franja.', 'Taken from this site’s public timeline. When a date is only known to the month, it is drawn as a band.') }}
              <NuxtLink :to="localePath('/timeline')" class="dt-link">{{ L('Ver la cronología completa', 'See the full timeline') }}</NuxtLink></p>
          </details>
        </section>

        <!-- ── Ficha ── -->
        <section id="ficha" class="dt-sec">
          <h2 class="dt-h2">{{ L('Ficha', 'Summary') }}</h2>
          <dl class="dt-ficha">
            <template v-for="[k, es, en] in [['diagnostico','Diagnóstico','Diagnosis'],['fecha_diagnostico','Fecha del diagnóstico','Date of diagnosis'],['edad_diagnostico','Edad al diagnóstico','Age at diagnosis'],['estadio','Estadio','Stage'],['histologia','Histología','Histology'],['ecog','ECOG','ECOG'],['estado_actual','Hoy','Today']]" :key="k">
              <div v-if="ficha[k]" class="dt-ficha__fila">
                <dt>{{ L(es, en) }}</dt>
                <dd>{{ T(ficha[k].valor) }}<span v-if="ficha[k].fecha" class="dt-fecha"> · {{ ficha[k].fecha }}</span> <DatosSello :s="ficha[k].sello" :lang="lang" /></dd>
              </div>
            </template>
          </dl>

          <h3 class="dt-h3">{{ L('Receptores e inmunohistoquímica', 'Receptors and immunohistochemistry') }}</h3>
          <div class="dt-tabla-wrap">
            <table class="data-table">
              <thead><tr><th>{{ L('Marcador', 'Marker') }}</th><th>{{ L('Resultado', 'Result') }}</th><th>{{ L('Detalle', 'Detail') }}</th><th>{{ L('Sello', 'Label') }}</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in ficha.receptores ?? []" :key="i">
                  <td class="col-marker">{{ T(r.marcador) }}</td><td class="nums">{{ T(r.valor) }}</td>
                  <td class="dt-td-det">{{ T(r.detalle) }}</td><td><DatosSello :s="r.sello" :lang="lang" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="dt-h3">{{ L('Dónde está la enfermedad', 'Where the disease is') }}</h3>
          <ul class="dt-lista">
            <li v-for="(s, i) in ficha.sitios ?? []" :key="i">{{ T(s.valor) }} <DatosSello :s="s.sello" :lang="lang" /></li>
          </ul>

          <template v-if="c.nunca_recibido">
            <h3 class="dt-h3">{{ L('Nunca ha recibido', 'Never received') }}</h3>
            <p class="dt-pills">
              <span v-for="(x, i) in c.nunca_recibido.valor" :key="i" class="pill-data pill-data--neutral">{{ T(x) }}</span>
              <DatosSello :s="c.nunca_recibido.sello" :lang="lang" />
            </p>
          </template>
        </section>

        <!-- ── Tratamientos ── -->
        <section id="tratamientos" class="dt-sec">
          <h2 class="dt-h2">{{ L('Tratamientos', 'Treatments') }}</h2>
          <div class="dt-tabla-wrap">
            <table class="data-table">
              <thead><tr><th></th><th>{{ L('Tratamiento', 'Treatment') }}</th><th>{{ L('Desde', 'From') }}</th><th>{{ L('Hasta', 'To') }}</th><th>{{ L('Por qué terminó', 'Why it ended') }}</th><th>{{ L('Sello', 'Label') }}</th></tr></thead>
              <tbody>
                <tr v-for="l in lineas" :key="l.id">
                  <td class="col-marker">{{ l.id }}</td>
                  <td>{{ T(l.tratamiento) }}<p v-if="l.nota" class="dt-nota">{{ T(l.nota) }}</p></td>
                  <td class="nums whitespace-nowrap">{{ l.inicio }}</td>
                  <td class="nums whitespace-nowrap">{{ l.fin ?? L('en curso / prevista', 'ongoing / planned') }}</td>
                  <td>{{ T(l.motivo_fin) }}</td>
                  <td><DatosSello :s="l.sello" :lang="lang" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Enfermedad medible ── -->
        <section id="enfermedad" class="dt-sec">
          <h2 class="dt-h2">{{ L('Enfermedad medible', 'Measurable disease') }}</h2>
          <div class="dt-dos">
            <div>
              <h3 class="dt-h3">{{ L('RECIST 1.1 (radiólogo)', 'RECIST 1.1 (radiologist)') }}</h3>
              <div v-for="m in em.recist ?? []" :key="m.fecha" class="dt-recist">
                <p class="dt-recist__cab"><span class="nums">{{ m.fecha }}</span> · <strong class="nums">{{ m.suma_mm }} mm</strong> · {{ T(m.rol) }} <DatosSello :s="m.sello" :lang="lang" /></p>
                <ul class="dt-lista dt-lista--compacta"><li v-for="d in m.dianas ?? []" :key="T(d.lesion)">{{ T(d.lesion) }}: <span class="nums">{{ d.mm }} mm</span></li></ul>
              </div>
            </div>
            <div>
              <h3 class="dt-h3">{{ L('Volumen tumoral hepático (modelo)', 'Liver tumour volume (model)') }}</h3>
              <p v-for="m in em.volumen ?? []" :key="m.fecha" class="dt-recist__cab">
                <span class="nums">{{ m.fecha }}</span> · <strong class="nums">{{ n(m.ml) }} ml</strong> · {{ m.n_lesiones }} {{ L('lesiones', 'lesions') }} <DatosSello :s="m.sello" :lang="lang" />
              </p>
              <p class="dt-pie">{{ fuenteTxt((em.volumen ?? [])[0]?.fuente) }}</p>
            </div>
          </div>

          <template v-if="(em.lesiones ?? []).length">
            <h3 class="dt-h3">{{ L('Lesión a lesión (hígado)', 'Lesion by lesion (liver)') }}</h3>
            <p class="dt-pie">{{ fuenteTxt(em.lesiones[0].fuente) }}</p>
            <div class="dt-tabla-wrap">
              <table class="data-table dt-compacta">
                <thead><tr><th>{{ L('Lesión', 'Lesion') }}</th><th>{{ L('Segmento', 'Segment') }}</th><th>{{ L('Fecha', 'Date') }}</th><th>{{ L('Diámetro (mm)', 'Diameter (mm)') }}</th><th>{{ L('Volumen (ml)', 'Volume (ml)') }}</th><th>{{ L('Densidad (UH)', 'Density (HU)') }}</th><th>SUVmax</th></tr></thead>
                <tbody>
                  <template v-for="les in em.lesiones" :key="T(les.id)">
                    <tr v-for="(e, j) in les.estudios" :key="j">
                      <td v-if="j === 0" :rowspan="les.estudios.length" class="col-marker">{{ T(les.id) }}</td>
                      <td v-if="j === 0" :rowspan="les.estudios.length">{{ les.segmento }}</td>
                      <td class="nums whitespace-nowrap">{{ e.fecha }}</td>
                      <td class="nums">{{ e.diametro_mm != null ? n(e.diametro_mm) : '—' }}</td>
                      <td class="nums">{{ e.volumen_ml != null ? n(e.volumen_ml) : '—' }}</td>
                      <td class="nums">{{ e.densidad_uh ?? '—' }}</td>
                      <td class="nums">{{ e.suvmax != null ? n(e.suvmax) : '—' }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </template>

          <template v-if="(em.pet ?? []).length">
            <h3 class="dt-h3">PET</h3>
            <ul class="dt-lista">
              <li v-for="p in em.pet" :key="p.fecha"><strong class="nums">{{ p.fecha }}</strong> · {{ T(p.resumen) }} <DatosSello :s="p.sello" :lang="lang" /></li>
            </ul>
          </template>
          <p class="dt-pie">
            {{ L('Las lesiones en 3D, con las medidas del radiólogo:', 'The lesions in 3D, with the radiologist’s measurements:') }}
            <NuxtLink :to="localePath('/lesiones')" class="dt-link">{{ L('mama, hígado y hueso', 'breast, liver and bone') }}</NuxtLink><template v-if="hayReservorio"> · <NuxtLink :to="localePath('/reservorio')" class="dt-link">{{ L('el reservorio en 3D', 'the port in 3D') }}</NuxtLink></template>
          </p>
        </section>

        <!-- ── Molecular ── -->
        <section id="molecular" class="dt-sec">
          <h2 class="dt-h2">{{ L('Perfil molecular por muestra', 'Molecular profile by sample') }}</h2>
          <div class="dt-tabla-wrap">
            <table class="data-table">
              <thead><tr><th></th><th>{{ L('Muestra', 'Sample') }}</th><th>{{ L('Técnica', 'Assay') }}</th><th>{{ L('Informe', 'Report') }}</th></tr></thead>
              <tbody>
                <tr v-for="m in muestras" :key="m.id"><td class="col-marker">{{ m.id }}</td><td>{{ T(m.nombre) }}</td><td>{{ T(m.tecnica) }}</td><td class="nums whitespace-nowrap">{{ m.fecha }}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="dt-tabla-wrap mt-4">
            <table class="data-table">
              <thead><tr><th>{{ L('Gen', 'Gene') }}</th><th>{{ L('Alteración', 'Alteration') }}</th><th v-for="m in muestras.filter((x) => x.id !== 'E')" :key="m.id" class="text-center">{{ m.id }}</th></tr></thead>
              <tbody>
                <tr v-for="(a, i) in mol.alteraciones ?? []" :key="i">
                  <td class="col-marker">{{ a.gen }}</td><td>{{ T(a.tipo) }}</td>
                  <td v-for="m in muestras.filter((x) => x.id !== 'E')" :key="m.id" class="nums text-center">{{ celda(a.por_muestra?.[m.id]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="dt-pie">{{ L('«—» = buscado y no detectado. Casilla vacía = ese panel no cubre el gen. Las copias en tejido y la señal en plasma no se comparan entre sí.',
                                 '“—” = tested, not detected. Empty cell = that panel does not cover the gene. Tissue copy numbers and plasma signal are not comparable.') }}</p>
          <h3 class="dt-h3">{{ L('Firmas y expresión', 'Signatures and expression') }}</h3>
          <dl class="dt-ficha">
            <div v-for="(f, i) in mol.firmas ?? []" :key="i" class="dt-ficha__fila"><dt>{{ T(f.nombre) }}</dt><dd>{{ T(f.valor) }} <DatosSello :s="f.sello" :lang="lang" /></dd></div>
          </dl>
        </section>

        <!-- ── Analíticas ── -->
        <section id="analiticas" class="dt-sec">
          <h2 class="dt-h2">{{ L('Analíticas', 'Labs') }}</h2>
          <p class="dt-intro">{{ L('Cada prueba en sus unidades, con su rango habitual sombreado. ▲ o ▼ relleno = fuera del rango de su informe. Un asterisco en la tabla indica que ese informe no traía rango y se usa el habitual.',
                                  'Each test in its own units, with the usual range shaded. Filled ▲ or ▼ = outside the range printed on that report. An asterisk in the table means that report had no range and the usual one is used.') }}</p>
          <div class="dt-controles">
            <div class="cc-vistas" role="group" :aria-label="L('Grupo de pruebas', 'Test group')">
              <button v-for="(g, k) in grupos" :key="k" type="button" class="cc-vista" :aria-pressed="grupoSel === k" @click="grupoSel = String(k)">
                {{ NOMBRE_GRUPO[k] ? L(NOMBRE_GRUPO[k][0], NOMBRE_GRUPO[k][1]) : g.nombre }}
              </button>
            </div>
            <div class="cc-vistas" role="group" :aria-label="L('Ventana de tiempo', 'Time window')">
              <button v-for="[k, es, en] in [['dx','Desde el diagnóstico','Since diagnosis'],['anio','Último año','Last year'],['todo','Todo','All']]" :key="k"
                      type="button" class="cc-vista" :aria-pressed="ventana === k" @click="ventana = k as any">{{ L(es, en) }}</button>
            </div>
          </div>
          <div class="dt-minis">
            <DatosMiniSerie v-for="a in grupos[grupoSel]?.analitos ?? []" :key="a.key" :a="a" :desde="vent[0]" :hasta="vent[1]" :lang="lang" />
          </div>
        </section>

        <!-- ── Material ── -->
        <section id="material" class="dt-sec">
          <h2 class="dt-h2">{{ L('Tejido y muestras: qué hay y dónde', 'Tissue and samples: what exists and where') }}</h2>
          <div class="dt-tabla-wrap">
            <table class="data-table">
              <thead><tr><th>{{ L('Muestra', 'Sample') }}</th><th>{{ L('Código', 'Code') }}</th><th>{{ L('Fecha', 'Date') }}</th><th>{{ L('Dónde está', 'Where it is') }}</th><th>{{ L('Estado', 'Status') }}</th><th>{{ L('Sello', 'Label') }}</th></tr></thead>
              <tbody>
                <tr v-for="(m, i) in material" :key="i">
                  <td>{{ T(m.muestra) }}</td><td class="col-marker">{{ m.codigo || '—' }}</td><td class="nums whitespace-nowrap">{{ m.fecha }}</td>
                  <td>{{ T(m.donde) }}</td><td class="dt-td-det">{{ T(m.estado) }}</td><td><DatosSello :s="m.sello" :lang="lang" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Qué falta / qué buscamos ── -->
        <section id="falta" class="dt-sec">
          <h2 class="dt-h2">{{ L('Qué falta y qué buscamos', 'What’s missing and what we’re looking for') }}</h2>
          <div class="dt-dos">
            <div>
              <h3 class="dt-h3">{{ L('Lo que no se ha medido', 'What hasn’t been measured') }}</h3>
              <ul class="dt-lista"><li v-for="(f, i) in mol.falta ?? []" :key="i">{{ T(f.valor) }}</li></ul>
            </div>
            <div>
              <h3 class="dt-h3">{{ L('Dónde nos puedes ayudar', 'Where you can help') }}</h3>
              <ul class="dt-lista"><li v-for="(b, i) in seBusca" :key="i">{{ T(b.valor) }}</li></ul>
              <NuxtLink :to="localePath('/contacto')" class="btn-primary mt-3 inline-flex">{{ L('Escríbenos', 'Write to us') }}</NuxtLink>
            </div>
          </div>
        </section>

        <!-- ── Fuentes ── -->
        <section id="fuentes" class="dt-sec">
          <h2 class="dt-h2">{{ L('Fuentes y método', 'Sources and method') }}</h2>
          <p class="dt-intro">{{ L('La página se genera a partir de un perfil curado a mano sobre mis informes, de las analíticas extraídas de los informes de laboratorio y de la cronología de esta web. Si un dato no tiene fuente, no se publica. Las cifras clínicas se revisan contra el informe original antes de marcarse como verificadas.',
                                  'This page is generated from a hand-curated profile built on my reports, from lab values extracted from the lab reports and from this site’s timeline. An item without a source is not published. Clinical figures are checked against the original report before being labelled verified.') }}</p>
          <ul class="dt-lista dt-lista--compacta"><li v-for="(f, k) in fuentes" :key="k">{{ T(f.publico) }}</li></ul>
          <p v-if="avisos.length" class="dt-pie">{{ L('Avisos del último build:', 'Notes from the last build:') }} {{ avisos.map((a) => a.detalle).join(' · ') }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dt-indice { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0 0 28px; font: 600 13px var(--font-body); }
.dt-indice a { color: var(--color-miriam); text-decoration: underline; text-underline-offset: 3px; }
.dt-sec { padding-top: 36px; scroll-margin-top: 80px; }
.dt-h2 { font: var(--tipo-h2); color: var(--color-text); margin: 0 0 10px; }
.dt-h3 { font: 700 16px/1.3 var(--font-body); color: var(--color-text); margin: 22px 0 8px; }
.dt-intro { font: var(--tipo-body-sm); color: var(--color-text-soft); max-width: 75ch; margin: 0 0 14px; }
.dt-pie { font: 400 12.5px/1.5 var(--font-body); color: var(--color-text-soft); margin: 8px 0 0; max-width: 90ch; }
.dt-link { color: var(--color-miriam); text-decoration: underline; text-underline-offset: 2px; }
.dt-det { margin-top: 14px; }
.dt-det summary { font: 600 14px var(--font-body); color: var(--color-miriam); cursor: pointer; }
.dt-eventos { list-style: none; padding: 0; margin: 10px 0 0; columns: 2 420px; column-gap: 32px; }
.dt-eventos li { display: grid; grid-template-columns: 26px 110px 1fr; gap: 6px; font: 400 13.5px/1.45 var(--font-body); break-inside: avoid; padding: 3px 0; }
.dt-eventos__n { font: 700 12px var(--font-mono); color: var(--color-text); }
.dt-eventos__f { font: 500 12px var(--font-mono); color: var(--color-text-soft); }
.dt-ficha { margin: 0; display: grid; gap: 0; }
.dt-ficha__fila { display: grid; grid-template-columns: minmax(140px, 220px) 1fr; gap: 12px; padding: 9px 0; border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.07); }
.dt-ficha__fila dt { font: 600 13.5px/1.45 var(--font-body); color: var(--color-text-soft); }
.dt-ficha__fila dd { font: 400 14.5px/1.5 var(--font-body); color: var(--color-text); margin: 0; }
.dt-fecha { font: 500 12px var(--font-mono); color: var(--color-text-soft); }
.dt-tabla-wrap { overflow-x: auto; border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: 12px; }
.dt-compacta :deep(td), .dt-compacta :deep(th) { padding: 6px 10px !important; }
.dt-td-det { font-size: 13px; color: var(--color-text-soft); min-width: 220px; }
.dt-nota { font: 400 12.5px/1.45 var(--font-body); color: var(--color-text-soft); margin: 4px 0 0; }
.dt-lista { margin: 0; padding-left: 18px; display: grid; gap: 6px; font: 400 14.5px/1.5 var(--font-body); color: var(--color-text); }
.dt-lista--compacta { gap: 2px; font-size: 13.5px; }
.dt-pills { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.dt-dos { display: grid; grid-template-columns: 1fr; gap: 12px 40px; }
@media (min-width: 900px) { .dt-dos { grid-template-columns: 1fr 1fr; } }
.dt-recist { margin-bottom: 10px; }
.dt-recist__cab { font: 400 14px/1.5 var(--font-body); margin: 0 0 4px; }
.dt-controles { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-bottom: 14px; }
.cc-vistas { display: inline-flex; flex-wrap: wrap; gap: 4px; padding: 3px; border-radius: 18px; background: rgb(var(--color-text-rgb) / 0.05); }
.cc-vista { font: 600 13px/1 var(--font-body); padding: 8px 12px; border-radius: 999px; color: var(--color-text-soft); min-height: 32px; }
.cc-vista[aria-pressed='true'] { background: var(--color-text); color: var(--color-bg); }
.cc-vista:focus-visible { outline: 2px solid var(--color-miriam); outline-offset: 2px; }
.dt-minis { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
</style>
