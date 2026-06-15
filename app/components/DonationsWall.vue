<template>
  <section
    id="gracias"
    v-reveal
    class="section-spacing bg-cream-card relative overflow-hidden scroll-mt-24"
    :aria-labelledby="'gracias-title'"
  >
    <div class="section-container relative z-10">
      <!-- Encabezado + la pieza: la frase manuscrita va ENCIMA del mapa
           (dentro de StarMap) y la nota de navegación + botón, debajo. -->
      <div class="mb-6">
        <p class="eyebrow mb-3 block">{{ $t('thanksWall.eyebrow') }}</p>
        <h2
          id="gracias-title"
          class="heading-display text-3xl sm:text-4xl text-berenjena"
          style="letter-spacing: -0.02em"
        >
          {{ $t('thanksWall.title') }}
        </h2>
      </div>
      <StarMap
        v-if="loaded && donations.length"
        ref="starMapRef"
        :donations="donations"
        :total="totalRaised"
        class="mb-6"
      />

      <!-- Buscar tu estrella: el mapa es poesía colectiva; el nombre es el GPS. -->
      <form
        v-if="loaded && donations.length"
        class="mb-6 max-w-md"
        role="search"
        @submit.prevent="submitFind"
      >
        <label for="find-star-input" class="block text-sm font-semibold text-berenjena mb-2">
          {{ $t('thanksWall.find_star_label') }}
        </label>
        <div class="flex gap-2">
          <input
            id="find-star-input"
            v-model="findQuery"
            type="search"
            autocomplete="name"
            class="dw-find-input flex-1 min-h-[44px]"
            :placeholder="$t('thanksWall.find_star_placeholder')"
          />
          <button type="submit" class="dw-find-btn min-h-[44px] shrink-0">
            {{ $t('thanksWall.find_star_btn') }}
          </button>
        </div>
        <p v-if="findError" class="mt-2 text-xs text-coral-deep" role="status">{{ findError }}</p>
      </form>

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

      <p v-if="pageRows.length" class="mb-3 text-xs text-tinta/80">{{ $t('thanksWall.find_star_table_hint') }}</p>

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
              class="dw-row border-b border-berenjena/[0.07] last:border-b-0"
              :class="{ 'dw-row--active': activeDonorId === d.id }"
              tabindex="0"
              role="button"
              @click="focusDonor(d)"
              @keydown.enter.prevent="focusDonor(d)"
              @keydown.space.prevent="focusDonor(d)"
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
import type StarMap from './StarMap.vue'

const { locale, t } = useI18n()
const route = useRoute()

const PAGE_SIZE = 12
const donations = ref<PublicDonation[]>([])
const loaded = ref(false)
const page = ref(0)
const sort = ref<'recent' | 'top'>('recent')
const starMapRef = ref<InstanceType<typeof StarMap> | null>(null)
const findQuery = ref('')
const findError = ref('')
const activeDonorId = ref<number | null>(null)

function setSort(s: 'recent' | 'top') {
  sort.value = s
  page.value = 0
}

const campaign = ref<GoFundMeFundraiser | null>(null)

function focusDonor(d: PublicDonation) {
  findError.value = ''
  activeDonorId.value = d.id
  const ok = starMapRef.value?.focusById(d.id)
  if (!ok) findError.value = t('thanksWall.find_star_no_match')
}

function submitFind() {
  findError.value = ''
  const q = findQuery.value.trim()
  if (!q) return
  const ok = starMapRef.value?.focusByName(q)
  if (!ok) {
    findError.value = t('thanksWall.find_star_no_match')
    activeDonorId.value = null
    return
  }
  const hit = donations.value.find((d) =>
    d.name.toLowerCase().includes(q.toLowerCase())
  )
  activeDonorId.value = hit?.id ?? null
}

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

  const q = route.query.find
  if (typeof q === 'string' && q.trim()) {
    findQuery.value = q.trim()
    await nextTick()
    submitFind()
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
.dw-find-input {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  background: #faf6f0;
  font-size: 14px;
  color: #2d1b3d;
}
.dw-find-input:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-color: rgba(45, 27, 61, 0.28);
}
.dw-find-btn {
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(45, 27, 61, 0.16);
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.dw-find-btn:hover {
  background: #3d254f;
}
.dw-row {
  cursor: pointer;
  transition: background 0.15s ease;
}
.dw-row:hover,
.dw-row:focus-visible {
  background: rgba(157, 68, 171, 0.06);
  outline: none;
}
.dw-row--active {
  background: rgba(255, 107, 71, 0.08);
}
.dw-row:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: -2px;
}
</style>
