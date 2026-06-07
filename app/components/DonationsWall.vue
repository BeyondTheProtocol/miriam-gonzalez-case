<template>
  <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'gracias-title'">
    <div class="section-container">
      <p class="eyebrow mb-3 block">{{ $t('thanksWall.eyebrow') }}</p>
      <h2
        id="gracias-title"
        class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
        style="letter-spacing: -0.02em"
      >
        {{ $t('thanksWall.title') }}
      </h2>
      <p class="text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('thanksWall.subtitle') }}</p>

      <!-- Vistas Recientes / Top, como GoFundMe -->
      <div
        v-if="donations.length"
        role="tablist"
        :aria-label="$t('thanksWall.views_label')"
        class="flex gap-2 mb-6"
      >
        <button
          v-for="opt in ['recent', 'top']"
          :key="opt"
          type="button"
          role="tab"
          :aria-selected="view === opt"
          class="rounded-full px-4 min-h-[40px] font-mono text-[12px] font-semibold tracking-[0.04em] border transition-colors"
          :class="view === opt ? 'bg-berenjena text-cream border-berenjena' : 'bg-cream text-tinta border-berenjena/20 hover:border-berenjena/50'"
          @click="view = (opt as 'recent' | 'top')"
        >
          {{ opt === 'recent' ? $t('thanksWall.recent') : $t('thanksWall.top') }}
        </button>
      </div>

      <ul v-if="donations.length" class="grid gap-3 sm:grid-cols-2">
        <li
          v-for="d in shown"
          :key="d.id"
          class="card-base bg-cream flex items-center justify-between gap-3"
        >
          <span class="flex items-center gap-3 min-w-0">
            <span
              class="w-9 h-9 rounded-full bg-miriam-soft flex items-center justify-center shrink-0 font-display font-semibold text-berenjena"
              aria-hidden="true"
            >{{ initial(d) }}</span>
            <span class="font-display font-semibold text-berenjena truncate">{{ d.name }}</span>
          </span>
          <span class="font-mono text-sm font-semibold text-coral-deep shrink-0 nums">{{ money(d) }}</span>
        </li>
      </ul>
      <p v-else-if="loaded" class="text-tinta text-sm">{{ $t('thanksWall.empty') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * P6 · Muro de gracias con donaciones reales de GoFundMe (paridad con su web:
 * nombre + importe, vistas Recientes/Top, anónimos como "Anónimo"). Los datos
 * salen de /donations.json, regenerado cada hora por la función de Netlify
 * (utils/fundraiser.ts → saveDonations). El opt-out vive en esa lista.
 */
import type { PublicDonation } from '../../utils/fundraiser'

const { locale } = useI18n()

const donations = ref<PublicDonation[]>([])
const loaded = ref(false)
onMounted(async () => {
  try {
    donations.value = await $fetch<PublicDonation[]>('/donations.json')
  } catch {
    /* sin datos (dev sin fetch) → muro vacío con su mensaje */
  } finally {
    loaded.value = true
  }
})

const view = ref<'recent' | 'top'>('recent')

const shown = computed(() => {
  const arr = [...donations.value]
  if (view.value === 'top') arr.sort((a, b) => b.amount - a.amount)
  else arr.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return arr.slice(0, 24)
})

function initial(d: PublicDonation) {
  return (d.name || '?').trim().charAt(0).toUpperCase()
}
function money(d: PublicDonation) {
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: d.currencyCode || 'EUR',
    maximumFractionDigits: 0,
  }).format(d.amount)
}
</script>
