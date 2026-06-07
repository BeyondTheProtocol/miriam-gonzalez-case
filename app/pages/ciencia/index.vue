<template>
  <div>
    <section class="section-spacing" :aria-label="$t('science.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('science.title')"
          :subtitle="$t('science.subtitle')"
          tag="BC-NED + FGFR1 ×13 + SSTR2+"
        />

        <EcgDivider class="mb-12" />

        <!-- Case snapshot: orient an oncologist in ~10s -->
        <section aria-labelledby="snapshot-title" class="mb-12">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.snapshot_eyebrow') }}</p>
          <h2
            id="snapshot-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ $t('ciencia.snapshot_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ $t('ciencia.snapshot_intro') }}
          </p>
          <div class="card-base">
            <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <div
                v-for="row in snapshotRows"
                :key="row.label"
                :class="row.wide ? 'sm:col-span-2' : ''"
              >
                <dt class="flex items-center gap-2 mb-1.5">
                  <span class="eyebrow">{{ row.label }}</span>
                  <span
                    v-if="row.tag"
                    :class="['pill-data', `pill-data--${row.tone}`]"
                    style="font-size: 10px; padding: 2px 8px"
                  >{{ row.tag }}</span>
                </dt>
                <dd
                  class="text-sm text-berenjena leading-relaxed"
                  :class="{ 'font-mono': row.mono }"
                  translate="no"
                >
                  <span class="font-semibold">{{ row.lead }}</span><span v-if="row.rest"> · {{ row.rest }}</span>
                </dd>
              </div>
            </dl>
            <p
              class="mt-6 pt-5 text-sm text-berenjena leading-relaxed font-medium"
              style="border-top: 1px solid rgba(45,27,61,0.10)"
            >
              {{ $t('ciencia.thesis') }}
            </p>
          </div>
        </section>

        <!-- Thesis framing: why this tumor doesn't fit the protocols -->
        <section class="alert-callout mb-12">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'La anomalía' : 'The anomaly' }}</p>
          <h2 class="alert-callout__title heading-display text-xl text-berenjena mb-3">
            {{ $t('ciencia.why_no_fit_guidelines') }}
          </h2>
          <i18n-t
            keypath="ciencia.why_no_fit_guidelines_text"
            tag="p"
            class="text-sm text-tinta leading-relaxed mb-4"
          >
            <template #luminal><Term id="luminal" /></template>
            <template #fgfr1><Term id="fgfr1" /></template>
            <template #ccnd1><Term id="ccnd1" /></template>
            <template #neuroendocrino><Term id="neuroendocrino" /></template>
            <template #bcned><Term id="bcned" /></template>
          </i18n-t>
          <Nota icon="tap" class="mb-4">{{ $t('glossary.hint') }}</Nota>
          <p class="text-sm text-berenjena leading-relaxed font-medium">
            {{ $t('ciencia.thesis_goal') }}
          </p>
        </section>

        <!-- El esquema de las dos caras: puente visual entre la anomalía y el
             perfil molecular. Movido desde la home; con la leyenda completa, el
             detalle vive mejor aquí. -->
        <TwoFaces class="mb-12" />

        <!-- Molecular profile: single canonical source of alterations -->
        <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Perfil molecular' : 'Molecular profile' }}</p>
        <h2
          id="molecular-profile-title"
          class="heading-display text-2xl text-berenjena mb-2"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.molecular_profile_title') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
          {{ locale === 'es'
            ? 'El perfil combina el tejido primario (NGS, 2024) con la biopsia líquida de ctDNA en plasma (2026). Sobre un fondo luminal HR+/HER2− destacan la amplificación focal de FGFR1 en 11q13, CCND1 y el clúster FGF3/FGF4/FGF19; cada fila indica con qué prueba se midió.'
            : 'The profile combines primary tissue (NGS, 2024) with plasma ctDNA liquid biopsy (2026). Against a luminal HR+/HER2− background, the standouts are focal amplification of FGFR1 at 11q13, CCND1 and the FGF3/FGF4/FGF19 cluster; each row notes how it was measured.' }}
        </p>
        <MolecularProfileDetailed class="mb-12" />

        <!-- ctDNA seriado (3 extracciones) + sparkline B2 de la dinámica. -->
        <LiquidBiopsyPivot v-if="liquidBiopsyPivot" :data="liquidBiopsyPivot" class="mb-12" />

        <section v-if="imaging" class="mb-14" aria-labelledby="imaging-tissue-title">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Imagen funcional' : 'Functional imaging' }}</p>
          <h2
            id="imaging-tissue-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ locale === 'es' ? 'Lo que muestra el PET de Galio-68' : 'What the Gallium-68 PET shows' }}
          </h2>
          <i18n-t
            keypath="ciencia.imaging_intro"
            tag="p"
            class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl"
          >
            <template #sstr><Term id="sstr" /></template>
            <template #prrt><Term id="prrt" /></template>
          </i18n-t>

          <div class="card-base">
            <div class="flex items-start gap-3 mb-3">
              <span
                class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center"
              >
                <Icon name="ph:scan" class="w-5 h-5 text-berenjena" aria-hidden="true" />
              </span>
              <div>
                <p class="eyebrow mb-1 block">{{ $t('ciencia.imaging_title') }}</p>
                <h3 class="heading-display text-lg text-berenjena">
                  {{ imaging.title }}
                </h3>
              </div>
            </div>
            <dl class="text-xs text-tinta grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 font-mono">
              <div>
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.date_label') }}: </dt>
                <dd class="inline">{{ imaging.date }}</dd>
              </div>
              <div v-if="imaging.center">
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.center_label') }}: </dt>
                <dd class="inline">{{ imaging.center }}</dd>
              </div>
            </dl>
            <p class="text-sm text-tinta leading-relaxed mb-3">
              {{ $t('ciencia.imaging_what') }}
            </p>
            <blockquote
              v-if="imaging.quote"
              class="pl-3 text-xs italic text-tinta mb-3"
              style="border-left: 2px solid rgba(45,27,61,0.20)"
            >
              «{{ imaging.quote }}»
            </blockquote>
            <p class="text-sm text-berenjena leading-relaxed">
              <span class="font-semibold">{{ $t('ciencia.meaning_label') }}:</span>
              {{ imaging.meaning }}
            </p>
          </div>
        </section>

        <hr class="chapter-rule" aria-hidden="true" />
        <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Historia clínica' : 'Clinical history' }}</p>
        <h2
          id="treatment-title"
          class="heading-display text-2xl text-berenjena mb-2"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.treatment_history') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
          {{ locale === 'es'
            ? 'Cada línea de tratamiento ha controlado la enfermedad durante un tiempo antes de que el tumor escape: el patrón esperable cuando se ataca solo el eje hormonal y se deja fuera el componente neuroendocrino.'
            : 'Each treatment line has held the disease for a while before the tumour escapes again: the pattern to expect when only the hormonal axis is targeted and the neuroendocrine component is left out.' }}
        </p>
        <ul class="space-y-3 mb-14" aria-labelledby="treatment-title">
          <li v-for="tx in treatments" :key="tx.line" class="card-base flex items-center gap-4">
            <span
              class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
              :class="tx.active ? 'bg-miriam-soft text-berenjena' : 'bg-cream text-tinta'"
              :style="tx.active ? '' : 'border: 1px solid rgba(45,27,61,0.10)'"
            >
              {{ tx.line }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h4 class="font-semibold text-berenjena text-sm">{{ tx.regimen }}</h4>
                <span :class="['status-badge', tx.active ? 'status-badge--active' : 'status-badge--complete']">
                  {{ tx.active ? (locale === 'es' ? 'Activo' : 'Active') : (locale === 'es' ? 'Completado' : 'Completed') }}
                </span>
              </div>
              <p class="text-xs text-tinta mt-1 leading-relaxed">{{ tx.outcome }}</p>
            </div>
          </li>
        </ul>

        <!-- App entry: the longitudinal layer (treatment response + ctDNA over time) lives in the app.
             Mobile-first: en móvil el CTA baja a una píldora a ancho completo, claramente pulsable;
             en sm+ vuelve a la fila con el CTA alineado a la derecha. -->
        <NuxtLink
          :to="localePath('/contacto')"
          class="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 rounded-2xl px-4 sm:px-5 py-4 mb-14 transition-all active:scale-[0.99] sm:hover:-translate-y-0.5"
          style="background:rgba(232,212,237,0.30);text-decoration:none"
        >
          <div class="flex items-start gap-3.5 flex-1">
            <span
              class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center"
            >
              <Icon name="ph:squares-four-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
            </span>
            <p class="flex-1 text-sm text-tinta leading-relaxed">
              {{ $t('ciencia.app_inline_text') }}
            </p>
          </div>
          <span
            class="inline-flex w-full sm:w-auto shrink-0 items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-berenjena group-hover:text-miriam transition-colors rounded-xl bg-miriam-soft sm:bg-transparent px-4 sm:px-0 py-2.5 sm:py-0"
          >
            {{ $t('ciencia.app_inline_cta') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </NuxtLink>

        <!-- Candidate therapeutic axes: one-line synthesis (confirmed by the panel, detailed in the papers).
             El capítulo genómico se abre con la doble hélice (en vez del chapter-rule). -->
        <DnaDivider class="mb-10" />
        <section class="mb-14" aria-labelledby="axes-title">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Ejes terapéuticos' : 'Therapeutic axes' }}</p>
          <h2
            id="axes-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ locale === 'es' ? 'Hacia dónde apuntar' : 'Where to aim' }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'De todo lo anterior se desprenden varias dianas. Estos son los ejes terapéuticos candidatos que sugiere el perfil molecular, cada uno con su propia lógica de tratamiento.'
              : 'Several candidate targets follow from all of the above. These are the therapeutic axes the molecular profile points to, each with its own treatment rationale.' }}
          </p>
          <!-- Cada eje, con tooltip que explica qué hace esa opción de tratamiento. -->
          <div class="flex flex-wrap gap-2" translate="no">
            <template v-for="(axis, ai) in $tm('ciencia.axes')" :key="ai">
              <Term
                v-if="axisTerms[ai]"
                :id="axisTerms[ai]"
                :label="String($rt(axis))"
                variant="badge"
              />
              <span v-else class="badge-genomic">{{ $rt(axis) }}</span>
            </template>
          </div>
          <details class="notes-disclosure mt-4">
            <summary>
              {{ locale === 'es' ? 'Cómo interpretar estos ejes' : 'How to read these axes' }}
            </summary>
            <p class="text-xs text-tinta leading-relaxed max-w-2xl">
              {{ $t('ciencia.axes_note') }}
            </p>
          </details>
        </section>

        <section v-if="panelRows.length">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'El siguiente paso' : 'The next step' }}</p>
          <h2
            id="panel-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ $t('ciencia.proposed_panel') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Una sola biopsia ósea de la que extraer todo lo que la ciencia permite hoy: 13 cores en 6 formatos de preservación (FFPE, congelado, lisado, OCT, fresco y tejido vivo). Lo que no se procesa ahora se banca para analizarlo durante más de 10 años sin volver a biopsiar. Es lo que financia la campaña.'
              : 'A single bone biopsy from which to extract everything current science allows: 13 cores across 6 preservation formats (FFPE, frozen, lysate, OCT, fresh and live tissue). Whatever isn’t processed now is banked to be analysed for 10+ years without re-biopsying. This is what the campaign funds.' }}
          </p>
          <p class="text-sm text-berenjena leading-relaxed font-medium mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Próximo paso (junio 2026): rebiopsia ósea y nueva ctDNA para confirmar cómo evoluciona el perfil y priorizar las dianas terapéuticas.'
              : 'Next step (June 2026): bone rebiopsy and fresh ctDNA to confirm how the profile is evolving and prioritise the therapeutic targets.' }}
          </p>
          <div class="data-card mb-14">
            <div class="overflow-x-auto">
              <table
                class="data-table data-table--dense data-table--cards"
                :aria-labelledby="locale === 'es' ? 'panel-title' : undefined"
              >
                <caption class="sr-only">
                  {{ $t('ciencia.proposed_panel_caption') }}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{{ $t('ciencia.component') }}</th>
                    <th scope="col" class="col-marker">{{ $t('ciencia.method') }}</th>
                    <th scope="col">{{ $t('ciencia.targets') }}</th>
                    <th scope="col" class="col-note">{{ $t('ciencia.implication') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in panelRows" :key="i">
                    <td class="cell-head font-semibold text-berenjena">{{ row.component }}</td>
                    <td class="col-marker" :data-label="$t('ciencia.method')">{{ row.method }}</td>
                    <td :data-label="$t('ciencia.targets')">{{ row.targets }}</td>
                    <td class="col-note cell-block" :data-label="$t('ciencia.implication')">{{ row.implication }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <details class="notes-disclosure px-4 sm:px-5 pb-4">
              <summary>
                {{ locale === 'es' ? 'Especificaciones técnicas de la biopsia' : 'Biopsy technical specifications' }}
              </summary>
              <p class="text-xs text-tinta leading-relaxed">
                {{ locale === 'es'
                  ? 'Aguja coaxial 14G sobre el componente de tejido blando perilesional (la NGS falla en el 36% del hueso puro frente al 2,3% en tejido blando), ≥20 mm de tejido y ≥20% de celularidad tumoral confirmada por touch-prep. Las biopsias líquidas seriadas cierran el bucle entre el tejido y las decisiones terapéuticas en tiempo real.'
                  : '14G coaxial needle into the peri-lesional soft-tissue component (NGS fails in 36% of pure bone vs 2.3% in soft tissue), ≥20 mm of tissue and ≥20% tumour cellularity confirmed by touch-prep. Serial liquid biopsies close the loop between tissue and real-time therapeutic decisions.' }}
              </p>
            </details>
          </div>
        </section>

        <div class="card-base mb-16" style="background:#2d1b3d;color:#faf6f0;border:none">
          <div class="flex items-center gap-2.5 mb-4">
            <span
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style="background:rgba(232,212,237,0.18)"
            >
              <Icon name="ph:target-fill" class="w-5 h-5" style="color:#e8d4ed" aria-hidden="true" />
            </span>
            <div>
              <p class="eyebrow" style="color:#e8d4ed;opacity:0.85">{{ locale === 'es' ? 'Objetivo' : 'Goal' }}</p>
              <h3 class="heading-display text-lg" style="color:#faf6f0">
                {{ $t('ciencia.goal_n_of_1') }}
              </h3>
            </div>
          </div>
          <p class="text-sm leading-relaxed mb-3" style="color:rgba(250,246,240,0.85)">
            {{ $t('ciencia.goal_n_of_1_desc') }}
          </p>
          <p class="text-sm leading-relaxed mb-3" style="color:rgba(250,246,240,0.70)">
            {{ $t('ciencia.win_consortium_desc') }}
          </p>
          <p class="text-sm font-medium" style="color:#e8d4ed">
            {{ $t('ciencia.win_consortium_precedent') }}
          </p>
        </div>

        <!-- Deeper dive: full evidence dossier (its own page) -->
        <div class="mb-16">
          <!-- Teaser: full evidence dossier (moved to its own page) -->
          <NuxtLink
            :to="localePath('/ciencia/evidencia')"
            class="card-base flex flex-col h-full transition-all group hover:-translate-y-0.5"
            style="text-decoration:none"
          >
            <span
              class="shrink-0 w-11 h-11 rounded-2xl bg-miriam-soft flex items-center justify-center mb-4"
            >
              <Icon name="ph:books-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
            </span>
            <p class="eyebrow mb-1.5 block">{{ $t('ciencia.evidence_hook_eyebrow') }}</p>
            <h3 class="heading-display text-lg text-berenjena mb-1.5 group-hover:text-miriam transition-colors">
              {{ $t('ciencia.key_evidence') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-4">
              {{ $t('ciencia.evidence_hook_body') }}
            </p>
            <span
              class="mt-auto inline-flex items-center gap-2 text-sm font-medium text-berenjena group-hover:text-miriam transition-colors"
            >
              {{ $t('ciencia.evidence_hook_cta') }}
              <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </NuxtLink>
        </div>

        <div v-if="articles && articles.length > 0">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Profundizar' : 'Go deeper' }}</p>
          <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
            {{ $t('ciencia.detailed_analyses') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Cada hallazgo, desarrollado en su propio artículo con la evidencia que lo respalda.'
              : 'Each finding, developed in its own article with the evidence behind it.' }}
          </p>
          <div class="space-y-4">
            <NuxtLink
              v-for="article in articles"
              :key="article.path"
              :to="localePath(`/ciencia/${article.stem?.split('/').pop()}`)"
              class="card-base flex items-start justify-between gap-4 transition-all group hover:-translate-y-0.5"
              style="text-decoration:none"
            >
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  <span
                    v-for="tag in article.tags"
                    :key="tag"
                    class="status-badge status-badge--reference"
                    >{{ tag }}</span
                  >
                </div>
                <h3
                  class="font-display font-semibold text-berenjena text-base mb-1 group-hover:text-miriam transition-colors"
                >
                  {{ article.title }}
                </h3>
                <p class="text-xs text-tinta leading-relaxed line-clamp-2">
                  {{ article.excerpt }}
                </p>
              </div>
              <Icon
                name="ph:arrow-right"
                class="shrink-0 w-4 h-4 text-tinta group-hover:text-miriam transition-colors mt-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>

        <Nota class="mt-12 pt-6" style="border-top: 1px solid rgba(45,27,61,0.08)">
          {{ locale === 'es' ? 'Última actualización: 6 de junio de 2026' : 'Last updated: 6 June 2026' }}
        </Nota>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()

// Mapa eje terapéutico → id de glosario (Term), mismo orden que ciencia.axes.
const axisTerms = ['axis_fgfr', 'axis_sstr', 'axis_esr1', 'axis_ne']

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Perfil molecular del tumor: BC-NED, FGFR1 ×13 y SSTR2+'
      : 'Tumor molecular profile: BC-NED, FGFR1 ×13, SSTR2+',
  description: () =>
    locale.value === 'es'
      ? 'El perfil molecular del tumor de Miriam: cáncer de mama con diferenciación neuroendocrina, FGFR1 ×13 y SSTR2+. Documentación clínica abierta.'
      : "Miriam's tumor molecular profile: breast cancer with neuroendocrine differentiation, FGFR1 ×13 and SSTR2+. Open clinical documentation.",
  ogTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR2+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR2+',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Análisis científico del caso: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (PET Ga-68). Metástasis óseas, ECOG 1, sin crisis visceral. Rebiopsia molecular avanzada como siguiente paso.'
      : 'Scientific case analysis: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (Ga-68 PET). Bone metastases, ECOG 1, no visceral crisis. Advanced molecular rebiopsy as the next step.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR2+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR2+',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (PET Ga-68). El perfil molecular completo del tumor de Miriam.'
      : "BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (Ga-68 PET). Miriam's full tumor molecular profile.",
})

defineOgImage('Default.takumi', {
  title: () => t('science.title'),
  description: () =>
    locale.value === 'es'
      ? 'El perfil molecular completo del tumor, explicado.'
      : "The tumor's full molecular profile, explained.",
})

const faq =
  locale.value === 'es'
    ? [
        {
          q: '¿Por qué este cáncer de mama no encaja en los protocolos estándar?',
          a: 'Sobre el papel es un tumor luminal (HR+/HER2−), pero ~80% muestra diferenciación neuroendocrina, con amplificación FGFR1 ×13 y CCND1 ×20. Este subtipo híbrido (BC-NED) tiene peor pronóstico y suele necesitar estrategias distintas a las del cáncer de mama luminal estándar.',
        },
        {
          q: '¿Qué dianas accionables tiene el tumor?',
          a: 'El PET con Galio-68 demuestra expresión de receptores de somatostatina de subtipo 2 (SSTR2), diana de la terapia con radioligandos (PRRT). El perfil molecular añade la amplificación FGFR1 ×13 como diana candidata frente a inhibidores de FGFR.',
        },
        {
          q: '¿Cuál es el siguiente paso del caso?',
          a: 'Una rebiopsia ósea con panel molecular avanzado, revisada por un tumor board internacional (WIN Consortium), para diseñar un tratamiento N-of-1 dirigido a la biología real del tumor.',
        },
      ]
    : [
        {
          q: 'Why doesn’t this breast cancer fit the standard protocols?',
          a: 'On paper it is a luminal tumor (HR+/HER2−), but ~80% shows neuroendocrine differentiation, with FGFR1 ×13 and CCND1 ×20 amplification. This hybrid subtype (BC-NED) has a worse prognosis and usually needs strategies different from standard luminal breast cancer.',
        },
        {
          q: 'What actionable targets does the tumor have?',
          a: 'The Gallium-68 PET shows somatostatin-receptor subtype 2 (SSTR2) expression, the target of radioligand therapy (PRRT). The molecular profile adds FGFR1 ×13 amplification as a candidate target for FGFR inhibitors.',
        },
        {
          q: 'What is the next step in the case?',
          a: 'A bone rebiopsy with an advanced molecular panel, reviewed by an international tumor board (WIN Consortium), to design an N-of-1 treatment directed at the tumor’s actual biology.',
        },
      ]

useSchemaOrg([
  defineWebPage({
    '@type': ['WebPage', 'MedicalWebPage'],
    name: () => t('science.title'),
  }),
  ...faq.map((item) =>
    defineQuestion({ name: item.q, acceptedAnswer: item.a })
  ),
])

const { data: articles } = await useAsyncData(
  `ciencia-index-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enArticles = await queryCollection('science_articles')
        .order('date', 'DESC')
        .all()
      if (enArticles.length) return enArticles
    }
    return queryCollection('ciencia_articles').order('date', 'DESC').all()
  },
  { watch: [locale] }
)

import type { Collections, ScienceEnCollectionItem } from '@nuxt/content'

const { data: scienceData } = await useAsyncData(
  `science-data-${locale.value}`,
  () => {
    const collection = `science_${locale.value || 'en'}` as keyof Collections
    return queryCollection(
      collection
    ).first() as Promise<ScienceEnCollectionItem | null>
  },
  { watch: [locale] }
)

const treatments = computed(() => scienceData.value?.treatments ?? [])
const panelRows = computed(() => scienceData.value?.panelRows ?? [])
const imaging = computed(() => scienceData.value?.imaging ?? null)
const liquidBiopsyPivot = computed(
  () => (scienceData.value as Record<string, unknown> | null)?.liquidBiopsyPivot ?? null
)

const snapshotRows = computed(() =>
  [
    { label: t('ciencia.snapshot_diagnosis_label'), value: t('ciencia.snapshot_diagnosis'), wide: true, mono: false, tag: t('ciencia.snapshot_diagnosis_tag'), tone: 'warn' },
    { label: t('ciencia.snapshot_drivers_label'), value: t('ciencia.snapshot_drivers'), wide: false, mono: true, tag: t('ciencia.snapshot_drivers_tag'), tone: 'violet' },
    { label: t('ciencia.snapshot_target_label'), value: t('ciencia.snapshot_target'), wide: false, mono: false, tag: t('ciencia.snapshot_target_tag'), tone: 'positive' },
    { label: t('ciencia.snapshot_resistance_label'), value: t('ciencia.snapshot_resistance'), wide: true, mono: false, tag: t('ciencia.snapshot_resistance_tag'), tone: 'warn' },
    { label: t('ciencia.snapshot_status_label'), value: t('ciencia.snapshot_status'), wide: true, mono: false, tag: t('ciencia.snapshot_status_tag'), tone: 'positive' },
    { label: t('ciencia.snapshot_grade_label'), value: t('ciencia.snapshot_grade'), wide: true, mono: true, tag: t('ciencia.snapshot_grade_tag'), tone: 'info' },
  ].map((row) => {
    const parts = row.value.split(' · ')
    return {
      ...row,
      lead: parts[0],
      rest: parts.slice(1).join(' · '),
    }
  })
)
</script>
