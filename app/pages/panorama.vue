<script setup lang="ts">
/**
 * Panorama de cuerpo entero — todas las lesiones de un vistazo.
 *
 * Hermana de /mapa-metastasis, pero con otro trabajo: aquella es la herramienta
 * para comparar focos óseos como diana de biopsia; esta es la VISTA DE CONJUNTO,
 * para entender en pocos segundos dónde está la enfermedad y qué dice cada prueba.
 *
 * Regla de contenido (decisión de la paciente, 19/09/2026): SOLO lo que dicen los
 * informes de radiología y medicina nuclear, con su fecha y su técnica. Nada de
 * detección automática, recuentos derivados ni volumen tumoral. TC y PET nunca en
 * el mismo contador: cada prueba mira una cosa distinta y aquí se ven juntas.
 * Herramienta de apoyo a la decisión — no es diagnóstico ni consejo médico.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'All lesions at a glance — Miriam’s case, a support tool'
    : 'Todas las lesiones, de un vistazo — el caso de Miriam, una herramienta de apoyo'
const seoDescription = () =>
  lang.value === 'en'
    ? 'A support tool, not a diagnosis. Where Miriam’s disease is and what each test says (CT, MRI, FDG-PET), straight from her reports, to decide better with her medical team.'
    : 'Una herramienta de apoyo, no un diagnóstico. Dónde está la enfermedad de Miriam y qué dice cada prueba (TC, RM y PET-FDG), tal y como lo recogen sus informes, para decidir mejor con su equipo médico.'

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
})

defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () =>
    lang.value === 'en'
      ? 'A support tool, not a diagnosis. Miriam’s case, from her own reports.'
      : 'Una herramienta de apoyo, no un diagnóstico. El caso de Miriam, desde sus informes.',
})

/* ------------------------------------------------------------------ */
/*  Datos: SOLO informes. Cada celda = lo que dice UNA prueba en UNA     */
/*  fecha. Fuente: informes de TC, RM y PET-FDG de jul y sep de 2026.    */
/* ------------------------------------------------------------------ */
type Celda = { es: string; en: string } | null
type Fila = { id: string; es: string; en: string; celdas: Celda[] }

const COLUMNAS = [
  { es: 'TC / RM · 13-jul-2026', en: 'CT / MRI · 13 Jul 2026', nota: { es: 'basal', en: 'baseline' } },
  { es: 'TC / RM · 8-sep-2026', en: 'CT / MRI · 8 Sep 2026', nota: { es: '1.er control', en: '1st follow-up' } },
  { es: 'PET-FDG · 10-jul-2026', en: 'FDG-PET · 10 Jul 2026', nota: { es: 'basal', en: 'baseline' } },
  { es: 'PET-FDG · 8-sep-2026', en: 'FDG-PET · 8 Sep 2026', nota: { es: '1.er control', en: '1st follow-up' } },
]

const FILAS: Fila[] = [
  {
    id: 'higado', es: 'Hígado', en: 'Liver',
    celdas: [
      { es: 'Dianas: segmento II 18 mm · segmento IVb 15 mm. Otras lesiones no diana.', en: 'Targets: segment II 18 mm · segment IVb 15 mm. Other non-target lesions.' },
      { es: 'Dianas: segmento II 20 mm · segmento IVb 19 mm. No diana: «aumento similar». Sin lesiones nuevas.', en: 'Targets: segment II 20 mm · segment IVb 19 mm. Non-target: “similar increase”. No new lesions.' },
      { es: 'SUVmáx segmento II 2,2 · segmento IVb 2,6.', en: 'SUVmax segment II 2.2 · segment IVb 2.6.' },
      { es: 'SUVmáx segmento IVb 4,5 · segmento VIII 3,6. «Progresión hepática».', en: 'SUVmax segment IVb 4.5 · segment VIII 3.6. “Hepatic progression”.' },
    ],
  },
  {
    id: 'hueso', es: 'Hueso', en: 'Bone',
    celdas: [
      { es: 'Afectación ósea múltiple. Vértebra dorsal con componente de partes blandas de 21 mm (diana).', en: 'Multiple bone involvement. Dorsal vertebra with a 21 mm soft-tissue component (target).' },
      { es: 'Componente de partes blandas 20 mm. Resto, estable por TC.', en: 'Soft-tissue component 20 mm. Rest, stable on CT.' },
      { es: 'Múltiples focos óseos (el informe no los cuenta).', en: 'Multiple bone foci (the report does not count them).' },
      { es: 'Nuevas lesiones activas en columna, escápula derecha, costillas, pelvis y fémures. «Progresión ósea».', en: 'New active lesions in spine, right scapula, ribs, pelvis and femurs. “Bone progression”.' },
    ],
  },
  {
    id: 'mama', es: 'Mama derecha (tumor primario)', en: 'Right breast (primary tumor)',
    celdas: [
      { es: '14 mm (RM, diana).', en: '14 mm (MRI, target).' },
      { es: '15 mm (RM, diana). Axila libre.', en: '15 mm (MRI, target). Axilla clear.' },
      { es: 'SUVmáx 0,9.', en: 'SUVmax 0.9.' },
      { es: 'SUVmáx 0,8, sin cambios.', en: 'SUVmax 0.8, unchanged.' },
    ],
  },
  {
    id: 'pulmon', es: 'Pulmón', en: 'Lung',
    celdas: [
      { es: 'Sin metástasis.', en: 'No metastases.' },
      { es: 'Sin metástasis.', en: 'No metastases.' },
      null,
      null,
    ],
  },
  {
    id: 'ganglios', es: 'Ganglios', en: 'Lymph nodes',
    celdas: [
      null,
      { es: 'Sin ganglios significativos.', en: 'No significant nodes.' },
      null,
      null,
    ],
  },
  {
    id: 'peritoneo', es: 'Peritoneo', en: 'Peritoneum',
    celdas: [
      null,
      { es: 'Sin líquido ni carcinomatosis.', en: 'No fluid or carcinomatosis.' },
      null,
      null,
    ],
  },
]

/* Marcadores de la silueta (vista anterior: la derecha de Miriam queda a la IZQUIERDA). */
const MARCAS_INFORME = [
  { x: 84, y: 104, es: 'Mama derecha', en: 'Right breast' },
  { x: 88, y: 146, es: 'Hígado · dianas II y IVb', en: 'Liver · targets II and IVb' },
  { x: 100, y: 150, es: 'Vértebra dorsal (diana)', en: 'Dorsal vertebra (target)' },
]
const MARCAS_PET = [
  { x: 100, y: 118 }, { x: 100, y: 176 }, { x: 100, y: 204 },   // columna
  { x: 70, y: 86 },                                              // escápula derecha
  { x: 124, y: 122 }, { x: 78, y: 128 },                         // costillas
  { x: 86, y: 236 }, { x: 114, y: 236 },                         // pelvis
  { x: 86, y: 292 }, { x: 114, y: 292 },                         // fémures
]
const estrella = (x: number, y: number, r = 6) =>
  `M${x},${y - r} L${x + r * 0.28},${y - r * 0.28} L${x + r},${y} L${x + r * 0.28},${y + r * 0.28} ` +
  `L${x},${y + r} L${x - r * 0.28},${y + r * 0.28} L${x - r},${y} L${x - r * 0.28},${y - r * 0.28} Z`
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Panorama de todas las lesiones', 'Panorama of all lesions')">
      <div class="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <PageHeader
          :tag="L('Panorama · cuerpo entero', 'Panorama · whole body')"
          :title="L('Todas las lesiones, de un vistazo', 'All lesions, at a glance')"
          :subtitle="L(
            'Dónde está la enfermedad y qué dice cada prueba, tal y como lo recogen los informes. Para comparar focos óseos como diana de biopsia, está el mapa de metástasis.',
            'Where the disease is and what each test says, straight from the reports. To compare bone foci as biopsy targets, there is the metastasis map.')"
        />

        <div class="alert-callout mb-10" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
          {{ L(
            'Es el caso de Miriam, abierto para entender su enfermedad y decidir mejor con su equipo médico. Deciden sus médicos.',
            'This is Miriam’s case, opened to understand her disease and to decide better with her medical team. Her doctors decide.') }}
          <details class="mt-2.5 group">
            <summary class="cursor-pointer font-semibold list-none inline-flex items-center gap-1.5">
              <Icon name="ph:caret-right" class="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
              {{ L('De dónde salen los datos', 'Where the data comes from') }}
            </summary>
            <p class="mt-2">
              {{ L(
                'Solo de los informes de radiología y medicina nuclear: TC de tórax, abdomen y pelvis, RM y PET-TC con ¹⁸F-FDG de julio y septiembre de 2026. Las medidas son las del radiólogo, sin interpretación añadida. Las lesiones diana son las que el radiólogo mide con los criterios RECIST 1.1 para seguir la respuesta. La imagen 3D del hígado se reconstruye desde el propio TAC y solo marca las dos dianas del informe.',
                'Only from the radiology and nuclear medicine reports: chest, abdomen and pelvis CT, MRI and ¹⁸F-FDG PET-CT from July and September 2026. Measurements are the radiologist’s, with no added interpretation. Target lesions are the ones the radiologist measures with RECIST 1.1 criteria to follow the response. The 3D liver image is rebuilt from the CT itself and only marks the two targets in the report.') }}
            </p>
          </details>
        </div>

        <!-- ===== VISTA DE CONJUNTO (berenjena: pieza de resumen, no herramienta) ===== -->
        <div class="panorama-banda rounded-[20px] p-5 sm:p-8 mb-10">
          <div class="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start">
            <!-- Silueta · decorativa; la información está en la tabla de abajo -->
            <figure class="mx-auto w-full max-w-[200px] sm:max-w-[260px]">
              <svg viewBox="0 0 200 440" class="w-full h-auto" role="img"
                   :aria-label="L('Silueta con la localización de las lesiones descritas en los informes', 'Silhouette with the location of the lesions described in the reports')">
                <path
                  d="M92,54 L108,54 L110,62 C130,64 146,70 150,84 L162,170 L170,232 L160,234 L148,176 L140,120 L138,200 L136,240 C136,250 132,260 126,262 L124,420 L106,420 L102,280 L98,280 L94,420 L76,420 L74,262 C68,260 64,250 64,240 L62,200 L60,120 L52,176 L40,234 L30,232 L38,170 L50,84 C54,70 70,64 90,62 Z"
                  fill="rgba(245,239,230,0.06)" stroke="rgba(245,239,230,0.55)" stroke-width="1.4" />
                <circle cx="100" cy="34" r="19" fill="rgba(245,239,230,0.06)" stroke="rgba(245,239,230,0.55)" stroke-width="1.4" />
                <ellipse cx="90" cy="146" rx="24" ry="12" fill="rgba(154,63,44,0.55)" stroke="rgba(230,150,130,0.7)" stroke-width="1" />
                <line x1="100" y1="72" x2="100" y2="222" stroke="rgba(245,239,230,0.25)" stroke-width="3" stroke-dasharray="3 3" />
                <path v-for="(m, i) in MARCAS_PET" :key="'p' + i" :d="estrella(m.x, m.y)" fill="#c77dd2" />
                <circle v-for="(m, i) in MARCAS_INFORME" :key="'i' + i" :cx="m.x" :cy="m.y" r="4.5" fill="#ead3a0" stroke="#2d1b3d" stroke-width="1" />
              </svg>
              <figcaption class="mt-4 space-y-1.5 text-[13px] text-[rgba(245,239,230,0.9)]">
                <p class="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="#ead3a0" /></svg>
                  {{ L('Lesión medida por el radiólogo (TC o RM)', 'Lesion measured by the radiologist (CT or MRI)') }}
                </p>
                <p class="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path :d="estrella(7, 7, 6)" fill="#c77dd2" /></svg>
                  {{ L('Actividad nueva en el PET del 8-sep (por región)', 'New activity on the 8 Sep PET (by region)') }}
                </p>
                <p class="text-[12px] text-[rgba(245,239,230,0.7)]">
                  {{ L('Vista de frente: la derecha de Miriam queda a la izquierda.', 'Front view: Miriam’s right side is on the left.') }}
                </p>
              </figcaption>
            </figure>

            <!-- Tarjetas por sistema -->
            <div class="grid gap-5 sm:grid-cols-2">
              <article class="panorama-tarjeta sm:col-span-2">
                <div class="grid gap-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] items-center">
                  <img src="/panorama/higado-dianas-2026-09-08.webp" width="1000" height="1000" loading="lazy"
                       class="w-full h-auto rounded-xl"
                       :alt="L('Reconstrucción 3D del hígado de Miriam desde su TAC del 8 de septiembre de 2026, con los vasos y las dos lesiones diana del informe marcadas', '3D reconstruction of Miriam’s liver from her 8 September 2026 CT, with the vessels and the two target lesions in the report marked')" />
                  <div>
                    <p class="eyebrow panorama-eyebrow mb-1.5">{{ L('Hígado', 'Liver') }}</p>
                    <p class="panorama-dato">{{ L('Dianas 18 → 20 mm y 15 → 19 mm', 'Targets 18 → 20 mm and 15 → 19 mm') }}</p>
                    <p class="panorama-texto">{{ L('Segmentos II y IVb, del 13 de julio al 8 de septiembre. El resto de lesiones hepáticas, con un aumento similar según el informe. En el PET del 8-sep: «progresión hepática».', 'Segments II and IVb, from 13 July to 8 September. The other liver lesions show a similar increase per the report. On the 8 Sep PET: “hepatic progression”.') }}</p>
                  </div>
                </div>
              </article>
              <article class="panorama-tarjeta">
                <p class="eyebrow panorama-eyebrow mb-1.5">{{ L('Hueso', 'Bone') }}</p>
                <p class="panorama-dato">{{ L('Estable por TC · progresión por PET', 'Stable on CT · progression on PET') }}</p>
                <p class="panorama-texto">{{ L('Las dos pruebas son del mismo día y miran cosas distintas: el TC, la forma; el PET, la actividad. El PET del 8-sep describe lesiones activas nuevas en columna, escápula derecha, costillas, pelvis y fémures.', 'Both tests are from the same day and look at different things: CT, the shape; PET, the activity. The 8 Sep PET describes new active lesions in spine, right scapula, ribs, pelvis and femurs.') }}</p>
                <NuxtLink :to="localePath('mapa-metastasis')" class="panorama-enlace">
                  {{ L('Ver foco a foco en el mapa de metástasis (datos de marzo a mayo)', 'See focus by focus on the metastasis map (March to May data)') }} →
                </NuxtLink>
              </article>
              <article class="panorama-tarjeta">
                <p class="eyebrow panorama-eyebrow mb-1.5">{{ L('Mama derecha', 'Right breast') }}</p>
                <p class="panorama-dato">{{ L('14 → 15 mm', '14 → 15 mm') }}</p>
                <p class="panorama-texto">{{ L('El tumor primario, medido en RM. Axila libre. En el PET, sin cambios.', 'The primary tumor, measured on MRI. Axilla clear. On PET, unchanged.') }}</p>
              </article>
            </div>
          </div>
        </div>

        <!-- ===== LECTURA DEL 8 DE SEPTIEMBRE: tres voces, cada una con su fuente ===== -->
        <section class="mb-10" aria-labelledby="lectura-titulo">
          <p class="eyebrow mb-2">{{ L('Primer control · 8 de septiembre de 2026', 'First follow-up · 8 September 2026') }}</p>
          <h2 id="lectura-titulo" class="heading-display text-2xl sm:text-3xl text-berenjena mb-4" style="letter-spacing: -0.02em">
            {{ L('Tres lecturas del mismo momento', 'Three readings of the same moment') }}
          </h2>
          <div class="grid gap-4 md:grid-cols-3">
            <div class="card-base">
              <p class="font-mono text-[12px] uppercase tracking-[0.08em] text-tinta mb-2">{{ L('TC · criterios RECIST 1.1', 'CT · RECIST 1.1 criteria') }}</p>
              <p class="font-semibold text-berenjena mb-1">{{ L('Enfermedad estable', 'Stable disease') }}</p>
              <p class="text-[14px] text-tinta">{{ L('La suma de las dianas pasa de 68 a 74 mm (+8,8 %), sin lesiones nuevas.', 'The sum of targets goes from 68 to 74 mm (+8.8%), with no new lesions.') }}</p>
            </div>
            <div class="card-base">
              <p class="font-mono text-[12px] uppercase tracking-[0.08em] text-tinta mb-2">{{ L('PET-TC con ¹⁸F-FDG', '¹⁸F-FDG PET-CT') }}</p>
              <p class="font-semibold text-berenjena mb-1">{{ L('Progresión hepática y ósea', 'Hepatic and bone progression') }}</p>
              <p class="text-[14px] text-tinta">{{ L('Por la aparición de lesiones activas nuevas.', 'Due to new active lesions.') }}</p>
            </div>
            <div class="card-base">
              <p class="font-mono text-[12px] uppercase tracking-[0.08em] text-tinta mb-2">{{ L('Oncología · 9-sep', 'Oncology · 9 Sep') }}</p>
              <p class="font-semibold text-berenjena mb-1">{{ L('Progresión por criterios clínicos', 'Progression by clinical criteria') }}</p>
              <p class="text-[14px] text-tinta">{{ L('Crecimiento de las lesiones hepáticas junto con la analítica.', 'Growth of the liver lesions together with the blood tests.') }}</p>
            </div>
          </div>
          <p class="mt-3 text-[13px] text-tinta max-w-3xl">
            {{ L('No se contradicen: cada prueba mide una cosa. RECIST suma diámetros en el TC; el PET mide actividad metabólica; la decisión clínica las junta con todo lo demás.', 'They do not contradict each other: each test measures something different. RECIST sums diameters on CT; PET measures metabolic activity; the clinical decision puts them together with everything else.') }}
          </p>
        </section>

        <!-- ===== TABLA: la información completa, accesible (fuente de verdad de la página) ===== -->
        <section class="mb-10" aria-labelledby="tabla-titulo">
          <h2 id="tabla-titulo" class="heading-display text-2xl sm:text-3xl text-berenjena mb-4" style="letter-spacing: -0.02em">
            {{ L('Qué dice cada prueba', 'What each test says') }}
          </h2>
          <div class="overflow-x-auto rounded-2xl border border-[rgba(45,27,61,0.12)]">
            <table class="panorama-tabla min-w-[760px] w-full text-left text-[14px]">
              <caption class="sr-only">{{ L('Hallazgos por órgano, prueba y fecha, según los informes', 'Findings by organ, test and date, per the reports') }}</caption>
              <thead>
                <tr>
                  <th scope="col">{{ L('Órgano', 'Organ') }}</th>
                  <th v-for="c in COLUMNAS" :key="c.es" scope="col">
                    {{ L(c.es, c.en) }}<span class="block font-normal text-[12px] opacity-75">{{ L(c.nota.es, c.nota.en) }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in FILAS" :key="f.id">
                  <th scope="row">{{ L(f.es, f.en) }}</th>
                  <td v-for="(c, i) in f.celdas" :key="i">
                    <span v-if="c">{{ L(c.es, c.en) }}</span>
                    <span v-else class="text-[rgba(58,51,64,0.55)]" :aria-label="L('Sin dato recogido', 'No data collected')">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-[13px] text-tinta max-w-3xl">
            {{ L('«—» significa que aquí no se ha recogido dato de esa prueba para ese órgano, no «sin lesión». La vértebra dorsal con componente de partes blandas figura como D11 en la hoja RECIST y como D12 en el informe de TC y RM; las medidas coinciden.', '“—” means no data from that test has been collected here for that organ, not “no lesion”. The dorsal vertebra with a soft-tissue component appears as D11 on the RECIST sheet and as D12 in the CT and MRI report; the measurements match.') }}
          </p>
        </section>

        <section class="card-base" aria-labelledby="mas-titulo">
          <h2 id="mas-titulo" class="heading-display text-xl text-berenjena mb-3">{{ L('Para ir más al detalle', 'To go into more detail') }}</h2>
          <ul class="space-y-2 text-[15px]">
            <li>
              <NuxtLink :to="localePath('mapa-metastasis')" class="panorama-enlace-claro">{{ L('Mapa de metástasis: cada foco óseo con doble trazador PET, como candidato a diana de biopsia', 'Metastasis map: every bone focus with dual-tracer PET, as a biopsy-target candidate') }} →</NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('historia')" class="panorama-enlace-claro">{{ L('La historia completa', 'The full story') }} →</NuxtLink>
            </li>
          </ul>
          <p class="mt-4 text-[13px] text-tinta">{{ L('El detalle del hueso con los estudios de septiembre está pendiente de actualizar.', 'The bone detail with the September studies is pending an update.') }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.panorama-banda {
  background: radial-gradient(ellipse at 30% 20%, #33253f 0%, #2d1b3d 60%);
  color: #f5efe6;
}
.panorama-tarjeta {
  background: rgba(245, 239, 230, 0.06);
  border: 1px solid rgba(245, 239, 230, 0.14);
  border-radius: 16px;
  padding: 18px 20px;
}
.panorama-eyebrow {
  color: #c77dd2;
}
.panorama-dato {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 1.35rem;
  line-height: 1.25;
  color: #f5efe6;
  margin-bottom: 0.4rem;
}
.panorama-texto {
  font-size: 14px;
  line-height: 1.55;
  color: rgba(245, 239, 230, 0.86);
}
.panorama-enlace {
  display: inline-flex;
  align-items: center;
  margin-top: 0.6rem;
  padding: 10px 0;
  min-height: 44px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  color: #f5efe6;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.panorama-enlace-claro {
  color: #2d1b3d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.panorama-tabla th,
.panorama-tabla td {
  padding: 12px 14px;
  vertical-align: top;
  border-bottom: 1px solid rgba(45, 27, 61, 0.08);
}
.panorama-tabla thead th {
  background: #f5efe6;
  color: #2d1b3d;
  font-weight: 600;
}
.panorama-tabla tbody th {
  color: #2d1b3d;
  font-weight: 600;
  white-space: nowrap;
}
</style>
