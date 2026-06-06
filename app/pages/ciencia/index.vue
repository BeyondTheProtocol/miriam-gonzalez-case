<template>
  <div>
    <section class="section-spacing" :aria-label="$t('science.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('science.title')"
          :subtitle="$t('science.subtitle')"
          tag="BC-NED + FGFR1 ×13 + SSTR+"
        />

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
                  {{ row.value }}
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
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Por qué no encaja en guías' : 'Why it doesn\u2019t fit the guidelines' }}</p>
          <h2 class="alert-callout__title heading-display text-xl text-berenjena mb-3">
            {{ $t('ciencia.why_no_fit_guidelines') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-4">
            {{ $t('ciencia.why_no_fit_guidelines_text') }}
          </p>
          <p class="text-sm text-berenjena leading-relaxed font-medium">
            {{ $t('ciencia.thesis_goal') }}
          </p>
        </section>

        <!-- Molecular profile: single canonical source of alterations -->
        <h2
          id="molecular-profile-title"
          class="heading-display text-2xl text-berenjena mb-6"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.molecular_profile_title') }}
        </h2>
        <MolecularProfileDetailed class="mb-12" />

        <div v-if="liquidBiopsyPivot" class="mb-12">
          <LiquidBiopsyPivot :data="liquidBiopsyPivot" />
        </div>

        <div v-else-if="liquidBiopsies.length" class="mb-12">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Biopsias líquidas · ctDNA' : 'Liquid biopsies · ctDNA' }}</p>
          <h3 class="heading-display text-xl text-berenjena mb-2">
            {{ $t('ciencia.ctdna_dynamics_title') }}
          </h3>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-2xl">
            {{ $t('ciencia.ctdna_dynamics_intro') }}
          </p>
          <ul class="space-y-3">
            <li
              v-for="lb in liquidBiopsies"
              :key="lb.id"
              class="card-base"
              :style="lb.highlight ? 'border-left: 4px solid #a44db2' : ''"
            >
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="status-badge status-badge--reference">{{ lb.date }}</span>
                <span class="text-xs text-tinta">{{ lb.source }}</span>
              </div>
              <p class="font-mono text-xs text-berenjena leading-relaxed">
                {{ lb.findings }}
              </p>
            </li>
          </ul>
        </div>

        <div v-if="imaging" class="alert-callout mb-6">
            <div class="flex items-start gap-3 mb-3">
              <span
                class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center"
              >
                <Icon name="ph:scan" class="w-5 h-5 text-berenjena" aria-hidden="true" />
              </span>
              <div>
                <p class="eyebrow mb-1 block">{{ $t('ciencia.imaging_title') }}</p>
                <h3 class="alert-callout__title heading-display text-lg text-berenjena">
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

          <div v-if="boneBiopsy" class="card-base">
            <div class="flex items-start gap-3 mb-3">
              <span
                class="shrink-0 w-9 h-9 rounded-xl bg-cream flex items-center justify-center"
                style="border: 1px solid rgba(45,27,61,0.10)"
              >
                <Icon name="ph:bone" class="w-5 h-5 text-tinta" aria-hidden="true" />
              </span>
              <div>
                <p class="eyebrow mb-1 block">{{ $t('ciencia.bone_biopsy_title') }}</p>
                <h3 class="heading-display text-base text-berenjena">
                  {{ boneBiopsy.title }}
                </h3>
              </div>
            </div>
            <dl class="text-xs text-tinta grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-3 font-mono">
              <div>
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.date_label') }}: </dt>
                <dd class="inline">{{ boneBiopsy.date }}</dd>
              </div>
              <div v-if="boneBiopsy.center">
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.center_label') }}: </dt>
                <dd class="inline">{{ boneBiopsy.center }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.site_label') }}: </dt>
                <dd class="inline">{{ boneBiopsy.site }}</dd>
              </div>
            </dl>
            <p class="text-sm text-tinta leading-relaxed">
              <span class="font-semibold text-berenjena">{{ $t('ciencia.result_label') }}:</span>
              {{ boneBiopsy.result }}
            </p>
          </div>

        <p class="eyebrow mb-2 block mt-14">{{ locale === 'es' ? 'Historia clínica' : 'Clinical history' }}</p>
        <h2
          id="treatment-title"
          class="heading-display text-2xl text-berenjena mb-6"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.treatment_history') }}
        </h2>
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

        <!-- Ejes terapéuticos candidatos · síntesis del perfil en una línea (se confirman con el panel, se detallan en los papers) -->
        <div class="mb-14">
          <p class="font-mono uppercase text-[11px] tracking-[0.12em] font-medium text-tinta mb-3">
            {{ $t('ciencia.axes_title') }}
          </p>
          <div class="flex flex-wrap gap-2" translate="no">
            <span
              v-for="axis in $tm('ciencia.axes')"
              :key="String($rt(axis))"
              class="badge-genomic"
            >
              {{ $rt(axis) }}
            </span>
          </div>
          <p class="mt-4 text-xs text-tinta leading-relaxed max-w-2xl">
            {{ $t('ciencia.axes_note') }}
          </p>
        </div>

        <section v-if="panelRows.length">
          <h2
            id="panel-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ $t('ciencia.proposed_panel') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'El siguiente paso: una sola biopsia ósea de la que extraer todo lo que la ciencia permite hoy. Trece cores repartidos en seis formatos de preservación (FFPE, congelado, lisado, OCT, fresco y tejido vivo): cada decisión de fijación es irreversible, así que lo que no se procesa ahora se banca para poder analizarlo durante más de 10 años sin volver a biopsiar. Es lo que financia la campaña.'
              : 'The next step: a single bone biopsy from which to extract everything current science allows. Thirteen cores across six preservation formats (FFPE, frozen, lysate, OCT, fresh and live tissue): every fixation decision is irreversible, so whatever isn’t processed now is banked to be analysed for 10+ years without re-biopsying. This is what the campaign funds.' }}
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
            <p
              class="text-xs text-tinta leading-relaxed px-4 sm:px-5 py-4"
              style="border-top: 1px solid rgba(45,27,61,0.08)"
            >
              {{ locale === 'es'
                ? 'Especificaciones clave: aguja coaxial 14G sobre el componente de tejido blando perilesional (la NGS falla en el 36% del hueso puro frente al 2,3% en tejido blando), ≥20 mm de tejido y ≥20% de celularidad tumoral confirmada por touch-prep. Las biopsias líquidas seriadas cierran el bucle entre el tejido y las decisiones terapéuticas en tiempo real.'
                : 'Key specs: 14G coaxial needle into the peri-lesional soft-tissue component (NGS fails in 36% of pure bone vs 2.3% in soft tissue), ≥20 mm of tissue and ≥20% tumour cellularity confirmed by touch-prep. Serial liquid biopsies close the loop between tissue and real-time therapeutic decisions.' }}
            </p>
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

        <!-- Teaser: full evidence dossier (moved to its own page) -->
        <NuxtLink
          :to="localePath('/ciencia/evidencia')"
          class="card-base mb-6 flex flex-col sm:flex-row sm:items-center gap-5 transition-all group hover:-translate-y-0.5"
          style="text-decoration:none"
        >
          <span
            class="shrink-0 w-12 h-12 rounded-2xl bg-miriam-soft flex items-center justify-center"
          >
            <Icon name="ph:books-fill" class="w-6 h-6 text-berenjena" aria-hidden="true" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="eyebrow mb-1.5 block">{{ $t('ciencia.evidence_hook_eyebrow') }}</p>
            <h3 class="heading-display text-lg text-berenjena mb-1.5 group-hover:text-miriam transition-colors">
              {{ $t('ciencia.key_evidence') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed">
              {{ $t('ciencia.evidence_hook_body') }}
            </p>
          </div>
          <span
            class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-berenjena text-cream text-sm font-medium transition-transform group-hover:-translate-y-0.5"
          >
            {{ $t('ciencia.evidence_hook_cta') }}
            <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
          </span>
        </NuxtLink>

        <!-- Teaser: the future app / clinical dashboard -->
        <div class="card-base mb-16 flex flex-col sm:flex-row sm:items-center gap-5">
          <span
            class="shrink-0 w-12 h-12 rounded-2xl bg-miriam-soft flex items-center justify-center"
          >
            <Icon name="ph:squares-four-fill" class="w-6 h-6 text-berenjena" aria-hidden="true" />
          </span>
          <div class="flex-1 min-w-0">
            <p class="eyebrow mb-1.5 block">{{ $t('ciencia.app_hook_eyebrow') }}</p>
            <h3 class="heading-display text-lg text-berenjena mb-1.5">
              {{ $t('ciencia.app_hook_title') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed">
              {{ $t('ciencia.app_hook_body') }}
            </p>
          </div>
          <NuxtLink
            :to="localePath('/contacto')"
            class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-berenjena text-cream text-sm font-medium transition-transform hover:-translate-y-0.5"
            style="text-decoration:none"
          >
            {{ $t('ciencia.app_hook_cta') }}
            <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
          </NuxtLink>
        </div>

        <div v-if="articles && articles.length > 0">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Análisis detallados' : 'Detailed analyses' }}</p>
          <h2 class="heading-display text-2xl text-berenjena mb-6" style="letter-spacing: -0.02em">
            {{ $t('ciencia.detailed_analyses') }}
          </h2>
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
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Perfil molecular del tumor: BC-NED, FGFR1 ×13 y SSTR+'
      : 'Tumor molecular profile: BC-NED, FGFR1 ×13, SSTR+',
  description: () =>
    locale.value === 'es'
      ? 'Análisis científico completo del caso: cáncer de mama con ~80% diferenciación neuroendocrina, amplificación FGFR1 ×13, CCND1 ×20 y SSTR+ (PET Ga-68). Historia de tratamientos, rebiopsia propuesta y ensayos clínicos relevantes.'
      : 'Full scientific analysis: breast cancer with ~80% neuroendocrine differentiation, FGFR1 ×13 amplification, CCND1 ×20 and SSTR+ (Ga-68 PET). Treatment history, proposed rebiopsy, and relevant clinical trials.',
  ogTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR+',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Análisis científico del caso: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR+ (PET Ga-68). Metástasis óseas, ECOG 0, sin crisis visceral. Rebiopsia molecular avanzada como siguiente paso.'
      : 'Scientific case analysis: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR+ (Ga-68 PET). Bone metastases, ECOG 0, no visceral crisis. Advanced molecular rebiopsy as the next step.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR+',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'BC-NED, FGFR1 ×13, CCND1 ×20, SSTR+ (PET Ga-68). El perfil molecular completo del tumor de Miriam.'
      : "BC-NED, FGFR1 ×13, CCND1 ×20, SSTR+ (Ga-68 PET). Miriam's full tumor molecular profile.",
})

defineOgImage('Default.takumi', {
  title: () => t('science.title'),
  description: () =>
    locale.value === 'es'
      ? 'El perfil molecular completo del tumor, explicado.'
      : "The tumor's full molecular profile, explained.",
})

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
const liquidBiopsies = computed(() => scienceData.value?.liquidBiopsies ?? [])
const liquidBiopsyPivot = computed(() => scienceData.value?.liquidBiopsyPivot ?? null)
const imaging = computed(() => scienceData.value?.imaging ?? null)
const boneBiopsy = computed(() => scienceData.value?.boneBiopsy ?? null)

const snapshotRows = computed(() => [
  { label: t('ciencia.snapshot_diagnosis_label'), value: t('ciencia.snapshot_diagnosis'), wide: true, mono: false, tag: t('ciencia.snapshot_diagnosis_tag'), tone: 'warn' },
  { label: t('ciencia.snapshot_drivers_label'), value: t('ciencia.snapshot_drivers'), wide: false, mono: true, tag: t('ciencia.snapshot_drivers_tag'), tone: 'violet' },
  { label: t('ciencia.snapshot_target_label'), value: t('ciencia.snapshot_target'), wide: false, mono: false, tag: t('ciencia.snapshot_target_tag'), tone: 'positive' },
  { label: t('ciencia.snapshot_resistance_label'), value: t('ciencia.snapshot_resistance'), wide: true, mono: false, tag: t('ciencia.snapshot_resistance_tag'), tone: 'warn' },
  { label: t('ciencia.snapshot_status_label'), value: t('ciencia.snapshot_status'), wide: true, mono: false, tag: t('ciencia.snapshot_status_tag'), tone: 'positive' },
  { label: t('ciencia.snapshot_grade_label'), value: t('ciencia.snapshot_grade'), wide: true, mono: true, tag: t('ciencia.snapshot_grade_tag'), tone: 'info' },
])
</script>
