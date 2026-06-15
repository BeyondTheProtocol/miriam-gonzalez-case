<template>
  <section
    id="gracias"
    v-reveal
    class="section-spacing bg-cream-card relative overflow-hidden scroll-mt-24"
    :aria-labelledby="'gracias-title'"
  >
    <div class="section-wide relative z-10">
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

      <!-- Panel de navegación: búsqueda + filtros + paginación (design system) -->
      <div v-if="loaded && donations.length" class="dw-panel card-base bg-cream mb-5">
        <form class="dw-panel__search" role="search" @submit.prevent="submitFind">
          <label for="find-star-input" class="dw-panel__label">
            <Icon name="ph:star-four-fill" class="w-4 h-4 text-coral shrink-0" aria-hidden="true" />
            {{ $t('thanksWall.find_star_label') }}
          </label>
          <div class="dw-panel__search-row">
            <div class="dw-search-field">
              <Icon name="ph:magnifying-glass" class="dw-search-field__icon" aria-hidden="true" />
              <input
                id="find-star-input"
                v-model="findQuery"
                type="search"
                autocomplete="name"
                class="dw-search-field__input"
                :placeholder="$t('thanksWall.find_star_placeholder')"
              />
            </div>
            <button type="submit" class="btn-dark dw-panel__submit">
              {{ $t('thanksWall.find_star_btn') }}
            </button>
          </div>
          <p v-if="findError" class="dw-panel__error" role="status">{{ findError }}</p>
        </form>

        <div class="dw-panel__toolbar">
          <div class="dw-segment" role="group" :aria-label="$t('thanksWall.sort_label')">
            <button
              type="button"
              class="dw-segment__btn"
              :class="{ 'dw-segment__btn--on': sort === 'recent' }"
              :aria-pressed="sort === 'recent'"
              @click="setSort('recent')"
            >
              {{ $t('thanksWall.recent') }}
            </button>
            <button
              type="button"
              class="dw-segment__btn"
              :class="{ 'dw-segment__btn--on': sort === 'top' }"
              :aria-pressed="sort === 'top'"
              @click="setSort('top')"
            >
              {{ $t('thanksWall.top') }}
            </button>
          </div>
          <div v-if="totalPages > 1" class="dw-pager">
            <button type="button" class="dw-pager__btn" :disabled="page === 0" :aria-label="$t('thanksWall.prev')" @click="page--">
              <Icon name="ph:caret-left-bold" class="w-4 h-4" aria-hidden="true" />
            </button>
            <span class="dw-pager__label nums">{{ $t('thanksWall.page', { c: page + 1, t: totalPages }) }}</span>
            <button type="button" class="dw-pager__btn" :disabled="page >= totalPages - 1" :aria-label="$t('thanksWall.next')" @click="page++">
              <Icon name="ph:caret-right-bold" class="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
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
                <span class="flex items-center gap-2 font-display font-semibold text-berenjena leading-tight">
                  <Icon
                    v-if="isPatron(d.id)"
                    name="ph:star-four-fill"
                    class="w-3.5 h-3.5 shrink-0"
                    :class="patronRank(d.id) === 1 ? 'text-coral' : 'text-miriam'"
                    aria-hidden="true"
                  />
                  {{ d.name }}
                </span>
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
import type { GoFundMeFundraiser } from '../../utils/fundraiser'
import type { PublicDonationSafe } from '../../utils/donationsPublic'
import type StarMap from './StarMap.vue'

const { locale, t } = useI18n()
const route = useRoute()

const PAGE_SIZE = 12
const donations = ref<PublicDonationSafe[]>([])
const loaded = ref(false)
const page = ref(0)
const sort = ref<'recent' | 'top'>('recent')
const starMapRef = ref<InstanceType<typeof StarMap> | null>(null)
const findQuery = ref('')
const findError = ref('')
const activeDonorId = ref<string | null>(null)

const patronIdRanks = computed(() => {
  const sorted = [...donations.value]
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 5)
  return new Map(sorted.map((d, i) => [d.id, i + 1]))
})

function isPatron(id: string) {
  return patronIdRanks.value.has(id)
}

function patronRank(id: string) {
  return patronIdRanks.value.get(id) ?? 0
}

function setSort(s: 'recent' | 'top') {
  sort.value = s
  page.value = 0
}

const campaign = ref<GoFundMeFundraiser | null>(null)

function focusDonor(d: PublicDonationSafe) {
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
    donations.value = await $fetch<PublicDonationSafe[]>('/donations.json')
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

function money(d: PublicDonationSafe) {
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
.dw-panel {
  padding: 1.25rem 1.25rem 1rem;
}
@media (min-width: 640px) {
  .dw-panel {
    padding: 1.5rem 1.5rem 1.125rem;
  }
}
.dw-panel__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-family: 'Fraunces', serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #2d1b3d;
}
.dw-panel__search-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
@media (min-width: 640px) {
  .dw-panel__search-row {
    flex-direction: row;
    align-items: stretch;
  }
}
.dw-search-field {
  position: relative;
  flex: 1;
}
.dw-search-field__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 1.125rem;
  height: 1.125rem;
  color: rgba(58, 51, 64, 0.45);
  pointer-events: none;
}
.dw-search-field__input {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px 10px 42px;
  border-radius: 12px;
  border: 1px solid rgba(45, 27, 61, 0.14);
  background: #faf6f0;
  font-size: 15px;
  color: #2d1b3d;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dw-search-field__input:focus-visible {
  outline: none;
  border-color: rgba(157, 68, 171, 0.45);
  box-shadow: 0 0 0 3px rgba(157, 68, 171, 0.14);
}
.dw-panel__submit {
  min-height: 44px;
  white-space: nowrap;
}
@media (min-width: 640px) {
  .dw-panel__submit {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
}
.dw-panel__error {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #bb4128;
}
.dw-panel__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.125rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
}
.dw-segment {
  display: inline-flex;
  padding: 3px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.12);
  background: rgba(250, 246, 240, 0.8);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
}
.dw-segment__btn {
  min-height: 36px;
  padding: 0 1rem;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #3a3340;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.dw-segment__btn--on {
  background: #2d1b3d;
  color: #faf6f0;
}
.dw-segment__btn:hover:not(.dw-segment__btn--on) {
  color: #2d1b3d;
}
.dw-pager {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.dw-pager__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 1px solid rgba(45, 27, 61, 0.14);
  background: #faf6f0;
  color: #2d1b3d;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dw-pager__btn:hover:not(:disabled) {
  border-color: rgba(45, 27, 61, 0.28);
  background: #f5efe6;
}
.dw-pager__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.dw-pager__label {
  min-width: 4.5rem;
  text-align: center;
  font-size: 12px;
  color: #3a3340;
}
.dw-segment__btn:focus-visible,
.dw-pager__btn:focus-visible,
.dw-row:focus-visible,
button:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
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
