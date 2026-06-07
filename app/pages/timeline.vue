<template>
  <div>
    <section class="section-spacing" :aria-label="$t('timeline.title')">
      <div class="section-container">
        <PageHeader
          :title="$t('timeline.title')"
          :subtitle="$t('timeline.subtitle')"
        >
          <!-- Recorrido de un vistazo: da escala emocional (de un email a una red
               internacional) antes de entrar al detalle. -->
          <p class="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-tinta flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span class="inline-flex items-center gap-1.5">
              <span class="hero-live-dot h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
              {{ $t('timeline.meta_milestones', { count: counts.all }) }}
            </span>
            <span class="text-tinta/35" aria-hidden="true">·</span>
            <span>{{ $t('timeline.meta_span') }}</span>
            <span class="text-tinta/35" aria-hidden="true">·</span>
            <span>{{ $t('timeline.meta_network') }}</span>
          </p>
        </PageHeader>

        <!-- Filtro por tipo de hito: doble público — quien busca la ciencia salta a
             «Perfil molecular»; quien sigue la historia, a «Equipo y difusión». -->
        <div
          class="flex flex-wrap gap-2 mb-10 -mt-2"
          role="group"
          :aria-label="$t('timeline.filter_aria')"
        >
          <button
            v-for="opt in chipOptions"
            :key="opt.key"
            type="button"
            class="tl-chip"
            :class="{ 'tl-chip--active': selected === opt.key }"
            :style="selected === opt.key && opt.accent ? { borderColor: opt.accent, color: opt.accent } : null"
            :aria-pressed="selected === opt.key"
            @click="selected = opt.key"
          >
            <span
              v-if="opt.accent"
              class="tl-chip__dot"
              :style="{ background: opt.accent }"
              aria-hidden="true"
            />
            {{ opt.label }}
            <span class="tl-chip__count">{{ opt.count }}</span>
          </button>
        </div>

        <!-- Cronología con raíl continuo + estaciones por año -->
        <div class="relative max-w-2xl">
          <span
            aria-hidden="true"
            class="absolute left-[11px] top-2 bottom-3 w-[2px] rounded-full"
            style="background: linear-gradient(180deg, #a44db2 0%, rgba(164,77,178,0.15) 100%)"
          />
          <!-- key=selected → al filtrar, el bloque se remonta y reproduce un fundido
               CSS limpio (evita el estado atascado de <Transition mode="out-in">
               cuando convive con la directiva v-reveal). -->
          <div :key="selected" class="tl-list">
            <div
              v-for="group in groups"
              :key="group.year"
              v-reveal
              class="tl-group"
            >
              <!-- Estación de año (capítulo) -->
              <div class="relative pl-8 pt-1 pb-5">
                <span
                  aria-hidden="true"
                  class="absolute left-[2px] top-[3px] w-[19px] h-[19px] rounded-full flex items-center justify-center"
                  style="background:#faf6f0;border:2px solid rgba(45,27,61,0.32)"
                >
                  <span class="w-[7px] h-[7px] rounded-full" style="background:#2d1b3d" />
                </span>
                <h2 class="font-mono text-[15px] font-semibold text-berenjena tracking-[0.04em] nums">
                  {{ group.year }}
                </h2>
              </div>
              <ul>
                <TimelineEntry
                  v-for="entry in group.entries"
                  :key="entry.date"
                  :entry="entry"
                  :live="entry.date === liveDate"
                />
              </ul>
            </div>
          </div>

          <!-- Nodo terminal · el raíl se cierra en un punto sereno tras recorrer
               toda la historia: cierre visual sin cortar en seco. -->
          <div class="relative pl-8 h-6">
            <span
              aria-hidden="true"
              class="absolute left-[2px] top-0 w-[19px] h-[19px] rounded-full flex items-center justify-center"
              style="background:#faf6f0;border:2px solid rgba(45,27,61,0.32)"
            >
              <span class="w-[7px] h-[7px] rounded-full" style="background:#2d1b3d" />
            </span>
          </div>
        </div>

        <!-- Conclusión · alineada bajo el nodo terminal, lee como cierre del recorrido -->
        <div class="max-w-2xl pl-8">
          <div class="card-base">
            <p class="text-sm text-tinta leading-relaxed">
              {{ $t('timeline.notice') }}
            </p>
            <div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href="https://x.com/miriamgonp"
                target="_blank"
                rel="noopener"
                class="link-action text-sm text-miriam"
              >
                <Icon name="ph:x-logo-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('timeline.follow_twitter') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
              </a>
              <NuxtLink
                :to="localePath({ name: 'ciencia' })"
                class="link-action text-sm text-berenjena"
              >
                <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('timeline.cta_science') }}
              </NuxtLink>
            </div>
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
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  description: () =>
    locale.value === 'es'
      ? 'La cronología del caso de Miriam, hito a hito: del diagnóstico a la búsqueda activa de un tratamiento de precisión con una red internacional.'
      : "Miriam's case timeline, milestone by milestone: from diagnosis to the active search for a precision treatment with an international network.",
  ogTitle: () =>
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Diagnóstico, tratamientos, progresión y avances, hito a hito.'
      : 'Diagnosis, treatments, progression and advances, milestone by milestone.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es' ? 'Cronología del caso' : 'Case timeline',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Diagnóstico, tratamientos, progresión y avances, hito a hito.'
      : 'Diagnosis, treatments, progression and advances, milestone by milestone.',
})

defineOgImage('Default.takumi', {
  title: () => t('timeline.title'),
  description: () => t('timeline.subtitle'),
})

const { data: timelineEntries } = await useAsyncData(
  `timeline-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enData = await queryCollection('timeline_en').first()
      if (enData?.entries?.length) return enData.entries
    }
    const esData = await queryCollection('timeline_es').first()
    return esData?.entries ?? []
  },
  { watch: [locale] }
)

// Reverse chronological order: most recent first (matches the design direction).
// Source data stays oldest→newest; we flip only the presentation.
const orderedEntries = computed(() => [...(timelineEntries.value ?? [])].reverse())

type FilterKey = 'all' | TimelineCategory

const selected = ref<FilterKey>('all')

// Conteo por categoría (para las píldoras de filtro).
const counts = computed(() => {
  const c = { all: 0, clinical: 0, molecular: 0, network: 0 }
  for (const e of orderedEntries.value) {
    c.all++
    c[categoryForTag(e.tag)]++
  }
  return c
})

const chipOptions = computed(() => [
  { key: 'all' as FilterKey, label: t('timeline.filter_all'), count: counts.value.all, accent: '' },
  { key: 'clinical' as FilterKey, label: t('timeline.filter_clinical'), count: counts.value.clinical, accent: CATEGORY_META.clinical.accent },
  { key: 'molecular' as FilterKey, label: t('timeline.filter_molecular'), count: counts.value.molecular, accent: CATEGORY_META.molecular.accent },
  { key: 'network' as FilterKey, label: t('timeline.filter_network'), count: counts.value.network, accent: CATEGORY_META.network.accent },
])

const filtered = computed(() =>
  selected.value === 'all'
    ? orderedEntries.value
    : orderedEntries.value.filter((e) => categoryForTag(e.tag) === selected.value)
)

// El hito más reciente (arriba del todo) late en vivo si es destacado.
const liveDate = computed(() => {
  const first = orderedEntries.value[0]
  return first?.highlight ? first.date : null
})

// Agrupar por año en orden de presentación (más reciente primero).
const groups = computed(() => {
  const out: { year: string; entries: typeof filtered.value }[] = []
  for (const e of filtered.value) {
    const year = e.date.match(/\d{4}/)?.[0] ?? ''
    const last = out[out.length - 1]
    if (last && last.year === year) last.entries.push(e)
    else out.push({ year, entries: [e] })
  }
  return out
})
</script>

<style scoped>
/* Píldoras de filtro: toque cómodo (>=40px alto), acento de categoría al activar. */
.tl-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  background: #faf6f0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #3a3340;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.tl-chip:hover {
  border-color: rgba(45, 27, 61, 0.32);
  background: #f5efe6;
}
.tl-chip:active {
  transform: scale(0.97);
}
.tl-chip:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
.tl-chip--active {
  background: #f5efe6;
  border-color: #2d1b3d;
  color: #2d1b3d;
}
.tl-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}
.tl-chip__count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #6b5d75;
  font-variant-numeric: tabular-nums;
}
.tl-chip--active .tl-chip__count {
  color: inherit;
  opacity: 0.7;
}

/* Cambio de filtro: el bloque (key=selected) se remonta y reproduce este fundido. */
.tl-list {
  animation: tl-list-in 0.28s ease both;
}
@keyframes tl-list-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .tl-chip {
    transition: none;
  }
  .tl-list {
    animation: none;
  }
}
</style>
