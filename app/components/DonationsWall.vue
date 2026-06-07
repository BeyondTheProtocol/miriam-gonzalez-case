<template>
  <section
    id="gracias"
    v-reveal
    class="section-spacing bg-cream-card relative overflow-hidden scroll-mt-24"
    :aria-labelledby="'gracias-title'"
  >
    <div class="section-container relative z-10">
      <div class="mb-6">
        <p class="eyebrow mb-3 block">{{ $t('thanksWall.eyebrow') }}</p>
        <h2
          id="gracias-title"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
          style="letter-spacing: -0.02em"
        >
          {{ $t('thanksWall.title') }}
        </h2>
        <p class="text-tinta leading-relaxed max-w-2xl">{{ $t('thanksWall.subtitle') }}</p>
        <!-- La metáfora, explícita: cada aportación es una estrella (conteo real). -->
        <i18n-t
          v-if="loaded && sorted.length"
          keypath="thanksWall.stars_line"
          tag="p"
          class="mt-4 flex items-center gap-2 font-display italic text-lg text-berenjena"
        >
          <template #star>
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill="#ff6b47"
                d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z"
              />
            </svg>
          </template>
          <template #n>
            <strong class="font-semibold not-italic text-coral-deep nums">{{ sorted.length }}</strong>
          </template>
          <template #total>
            <strong class="font-semibold not-italic text-coral-deep nums whitespace-nowrap">{{ totalRaised }}</strong>
          </template>
        </i18n-t>
        <!-- La ciencia de la metáfora, en nota al margen: magnitud logarítmica. -->
        <Nota v-if="loaded && sorted.length" class="mt-2">
          {{ $t('thanksWall.magnitude_note') }}
        </Nota>
      </div>

      <!-- La carta celeste interactiva: 1 estrella = 1 aportación, tocable.
           En su propio panel — nada de cielo detrás del texto (legibilidad). -->
      <StarMap v-if="loaded && donations.length" :donations="donations" class="mb-8" />

      <!-- Pestañas estilo GoFundMe: Recientes · Top -->
      <div
        class="inline-flex items-center rounded-full mb-5 overflow-hidden font-mono text-[12px] font-semibold tracking-wide"
        style="border: 1px solid rgba(45, 27, 61, 0.14)"
        role="group"
        :aria-label="$t('thanksWall.sort_label')"
      >
        <button
          type="button"
          class="px-4 py-2 min-h-[40px] transition-colors"
          :class="sort === 'recent' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          :aria-pressed="sort === 'recent'"
          @click="setSort('recent')"
        >
          {{ $t('thanksWall.recent') }}
        </button>
        <button
          type="button"
          class="px-4 py-2 min-h-[40px] transition-colors"
          :class="sort === 'top' ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'"
          :aria-pressed="sort === 'top'"
          @click="setSort('top')"
        >
          {{ $t('thanksWall.top') }}
        </button>
      </div>

      <!-- El catálogo: la versión accesible y ordenable del mismo cielo. -->
      <div
        v-if="pageRows.length"
        class="rounded-2xl border border-berenjena/10 bg-cream overflow-hidden"
      >
        <table class="w-full">
          <caption class="sr-only">{{ $t('thanksWall.title') }}</caption>
          <tbody>
            <tr
              v-for="(d, i) in pageRows"
              :key="d.id"
              class="border-b border-berenjena/[0.07] last:border-b-0"
            >
              <td
                v-if="sort === 'top'"
                class="py-2.5 pl-4 pr-1 w-8 text-right font-mono text-xs text-tinta/60 nums tabular-nums"
              >
                {{ rankStart + i + 1 }}
              </td>
              <td class="py-2.5 px-4">
                <span class="block font-display font-semibold text-berenjena leading-tight">{{ d.name }}</span>
                <span class="block mt-0.5 text-xs text-tinta">{{ timeAgo(d.createdAt) }}</span>
              </td>
              <td class="py-2.5 pr-4 pl-2 text-right font-mono text-sm font-semibold text-coral-deep nums whitespace-nowrap">
                {{ money(d) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="loaded" class="text-tinta text-sm">{{ $t('thanksWall.empty') }}</p>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center gap-4">
        <button type="button" class="dw-page-btn" :disabled="page === 0" @click="page--">
          ← {{ $t('thanksWall.prev') }}
        </button>
        <span class="font-mono text-xs text-tinta nums">
          {{ $t('thanksWall.page', { c: page + 1, t: totalPages }) }}
        </span>
        <button
          type="button"
          class="dw-page-btn"
          :disabled="page >= totalPages - 1"
          @click="page++"
        >
          {{ $t('thanksWall.next') }} →
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Muro de gracias estilo GoFundMe: pestañas Recientes/Top, fecha relativa
 * («hace 3 días»), tabla nombre + importe paginada y constelación de fondo.
 * Vive como sección #gracias en /colabora, justo después de la card de apoyar:
 * la prueba social respalda a la petición. Aquí enlaza el widget de la home.
 * Datos reales de /donations.json (función Netlify horaria). Anónimos = "Anónimo".
 */
import type { GoFundMeFundraiser, PublicDonation } from '../../utils/fundraiser'

const { locale } = useI18n()

const PAGE_SIZE = 12
const donations = ref<PublicDonation[]>([])
const loaded = ref(false)
const page = ref(0)
const sort = ref<'recent' | 'top'>('recent')

function setSort(s: 'recent' | 'top') {
  sort.value = s
  page.value = 0
}

const campaign = ref<GoFundMeFundraiser | null>(null)

onMounted(async () => {
  try {
    donations.value = await $fetch<PublicDonation[]>('/donations.json')
  } catch {
    /* sin datos */
  } finally {
    loaded.value = true
  }
  try {
    campaign.value = await $fetch<GoFundMeFundraiser>('/fundraiser.json')
  } catch {
    /* el total cae al sumatorio de donaciones */
  }
})

// Total recaudado: el oficial de la campaña; si no llega, suma de donaciones.
const totalRaised = computed(() => {
  const official = campaign.value?.currentAmount
  const amount = official?.amount ?? donations.value.reduce((acc, d) => acc + d.amount, 0)
  const currency = official?.currencyCode || donations.value[0]?.currencyCode || 'EUR'
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
})

const sorted = computed(() => {
  const arr = [...donations.value]
  if (sort.value === 'top') {
    return arr.sort(
      (a, b) => b.amount - a.amount || (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    )
  }
  return arr.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))
const rankStart = computed(() => page.value * PAGE_SIZE)

const pageRows = computed(() => {
  const start = page.value * PAGE_SIZE
  return sorted.value.slice(start, start + PAGE_SIZE)
})

function money(d: PublicDonation) {
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: d.currencyCode || 'EUR',
    maximumFractionDigits: 0,
  }).format(d.amount)
}

// Fecha relativa estilo GoFundMe («hace 3 días», «hace 1 mes»).
function timeAgo(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const rtf = new Intl.RelativeTimeFormat(locale.value === 'es' ? 'es' : 'en', {
    numeric: 'auto',
  })
  const mins = Math.round((then - Date.now()) / 60000)
  const hours = Math.round(mins / 60)
  const days = Math.round(hours / 24)
  const months = Math.round(days / 30)
  if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  if (Math.abs(days) < 31) return rtf.format(days, 'day')
  return rtf.format(months, 'month')
}
</script>

<style scoped>
.dw-page-btn {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  background: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #2d1b3d;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.dw-page-btn:hover:not(:disabled) {
  border-color: rgba(45, 27, 61, 0.32);
  background: #f5efe6;
}
.dw-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.dw-page-btn:focus-visible,
button:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
</style>
