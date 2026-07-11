<script setup lang="ts">
import type { GoFundMeFundraiser } from '../../utils/fundraiser'

withDefaults(defineProps<{ card?: boolean }>(), { card: false })

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackSupport } = useSupport()

// Datos de la campaña: JSON estático regenerado por la función de Netlify
// (arquitectura de main). Se carga en cliente; las cifras tienen fallback.
const data = ref<GoFundMeFundraiser | null>(null)
onMounted(async () => {
  data.value = await $fetch('/fundraiser.json')
})

const pct = computed(() => {
  if (!data.value) return 0
  return Math.round(
    (data.value.currentAmount.amount * 100) / data.value.goalAmount.amount
  )
})

// Hitos del caso: la barra se segmenta en fases para que NUNCA «parezca
// terminada» — siempre hay un hito por delante. Los importes intermedios salen
// de la página de gastos (rebiopsia ≈ 40k; +banco de tejido ≈ 60k). El último
// hito es SIEMPRE el objetivo vivo de GoFundMe (goalAmount): si la meta sube en
// GoFundMe, el tramo final sube con ella sin tocar código.
const INTERMEDIATE_MILESTONES = [
  { amount: 40000, key: 'rebiopsy' },
  { amount: 60000, key: 'bank' },
]

const milestones = computed(() => {
  if (!data.value) return []
  const goal = data.value.goalAmount.amount
  const current = data.value.currentAmount.amount
  const stops = [
    ...INTERMEDIATE_MILESTONES.filter((m) => m.amount < goal),
    { amount: goal, key: 'treatment' },
  ]
  return stops.map((m) => ({
    key: m.key,
    amount: m.amount,
    pct: Math.min(100, Math.round((m.amount / goal) * 100)),
    reached: current >= m.amount,
  }))
})

// Hito activo = primero no alcanzado (o el último si ya están todos).
const activeIndex = computed(() => {
  const i = milestones.value.findIndex((m) => !m.reached)
  return i === -1 ? Math.max(0, milestones.value.length - 1) : i
})
const remainingToNext = computed(() => {
  const next = milestones.value[activeIndex.value]
  if (!data.value || !next) return 0
  return Math.max(0, next.amount - data.value.currentAmount.amount)
})

// Progreso hacia el hito activo → anillo «casi lleno» en la leyenda. Una bandera
// o un check en el hito en curso daban sensación de «ya logrado»; el anillo
// parcial deja claro que está EN CURSO (en el hito 1 va ≈ 97 %). RING_C = perímetro
// del círculo (r=6.4) para el stroke-dasharray.
const RING_C = 2 * Math.PI * 6.4
const activeProgress = computed(() => {
  const m = milestones.value[activeIndex.value]
  if (!data.value || !m || m.amount <= 0) return 0
  return Math.max(0, Math.min(1, data.value.currentAmount.amount / m.amount))
})

// Vista previa de hito: al pinchar una fila del listado, la barra proyecta en
// translúcido desde lo recaudado hasta ese hito («ver cuánto faltaría»). Volver
// a pinchar lo quita. Solo aplica a la variante con listado (card).
const preview = ref<number | null>(null)
function togglePreview(i: number) {
  preview.value = preview.value === i ? null : i
}
const previewPct = computed(() => {
  if (preview.value === null) return null
  return milestones.value[preview.value]?.pct ?? null
})
const previewRemaining = computed(() => {
  if (preview.value === null || !data.value) return 0
  const m = milestones.value[preview.value]
  return m ? Math.max(0, m.amount - data.value.currentAmount.amount) : 0
})
function rowBg(i: number) {
  if (preview.value === i) return 'background: rgba(255,107,71,0.18)'
  if (i === activeIndex.value) return 'background: rgba(255,107,71,0.10)'
  return 'background: rgba(250,246,240,0.04)'
}
</script>

<template>
  <!-- Card variant — dark editorial progress block -->
  <div
    v-if="card && data"
    class="rounded-[24px] p-6 sm:p-8 lg:p-10"
    style="background: #2d1b3d; color: #faf6f0"
  >
    <p
      class="font-display font-semibold leading-none text-coral nums"
      style="font-size: clamp(48px, 6vw, 72px); letter-spacing: -0.04em"
    >
      {{ formatCurrency(data.currentAmount.amount, data.currentAmount.currencyCode, locale) }}
    </p>
    <p class="mt-2.5 font-mono text-[13px] tracking-[0.06em] nums" style="color: rgba(250,246,240,0.65)">
      {{ formatCurrency(data.goalAmount.amount, data.goalAmount.currencyCode, locale) }} · {{ $t('gofundme.goal_total') }}
    </p>

    <div class="mt-6 relative pb-7">
      <div
        class="relative h-2.5 w-full overflow-hidden rounded-full"
        style="background: rgba(250,246,240,0.12)"
        role="progressbar"
        :aria-valuenow="data.currentAmount.amount"
        aria-valuemin="0"
        :aria-valuemax="data.goalAmount.amount"
        :aria-label="$t('gofundme.progress_label')"
      >
        <!-- Proyección translúcida hasta el hito pinchado en el listado. -->
        <div
          v-if="previewPct !== null && previewPct > pct"
          class="ms-ghost absolute inset-y-0"
          :style="{ left: `${pct}%`, width: `${previewPct - pct}%` }"
          aria-hidden="true"
        />
        <div class="progress-fill h-full rounded-full bg-coral relative" :style="{ width: `${pct}%` }">
          <span class="progress-pulse" aria-hidden="true" />
        </div>
      </div>
      <!-- Marcas de hito por enmedio con el IMPORTE siempre visible bajo cada
           tick: de un vistazo se ve qué objetivo hay en cada punto y cuál es
           cuál, sin tener que pasar el cursor. Alcanzado → coral con ✓. -->
      <template v-for="m in milestones" :key="m.key">
        <span v-if="m.pct < 100" class="ms-marker" :style="{ left: `${m.pct}%` }">
          <span class="ms-tick ms-tick--light" aria-hidden="true" />
          <span
            class="ms-amt font-mono nums"
            :style="{ color: m.reached ? '#ff6b47' : 'rgba(250,246,240,0.72)' }"
          >
            <span v-if="m.reached" aria-hidden="true">✓ </span>{{ formatCurrency(m.amount, data.goalAmount.currencyCode, locale) }}
          </span>
        </span>
      </template>
    </div>

    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 font-mono text-[12px] tracking-[0.04em]"
      style="color: rgba(250,246,240,0.65)"
    >
      <span class="nums" style="color: #faf6f0">{{ pct }}% {{ $t('gofundme.pct_raised') }}</span>
      <NuxtLink
        :to="localePath('colabora') + '#gracias'"
        class="dw-donors-link inline-flex items-center gap-1.5 nums"
      >
        <Icon name="ph:users-three" class="size-3.5" aria-hidden="true" />
        {{ data.donationCount }} {{ $t('gofundme.donators') }}
        <Icon name="ph:arrow-right" class="size-3 transition-transform" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- Hitos del caso: cada fase con su estado (✓ alcanzado · ▸ activo · ○
         próximo). El activo muestra cuánto falta. La barra nunca «parece
         terminada» porque siempre queda un hito por delante. -->
    <p
      v-if="milestones.length"
      class="mt-6 font-mono text-[11px] uppercase tracking-[0.12em]"
      style="color: rgba(250,246,240,0.5)"
    >
      {{ t('gofundme.phase_count', { current: activeIndex + 1, total: milestones.length }) }}
    </p>
    <ol v-if="milestones.length" class="mt-2 space-y-px overflow-hidden rounded-xl">
      <li v-for="(m, i) in milestones" :key="m.key">
        <!-- Fila clicable: proyecta en la barra cuánto faltaría para este hito. -->
        <button
          type="button"
          class="ms-row flex w-full items-start gap-3 px-4 py-3 text-left"
          :style="rowBg(i)"
          :aria-pressed="preview === i"
          @click="togglePreview(i)"
        >
          <!-- Estado del hito: ○ pendiente → anillo en curso → ✓ cumplido. -->
          <Icon
            v-if="m.reached"
            name="ph:check-circle-fill"
            class="size-4 shrink-0 mt-0.5"
            style="color: #ff6b47"
            aria-hidden="true"
          />
          <svg
            v-else-if="i === activeIndex"
            viewBox="0 0 16 16"
            class="size-4 shrink-0 mt-0.5 -rotate-90"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.4" fill="none" stroke="rgba(255,107,71,0.28)" stroke-width="2.3" />
            <circle
              cx="8"
              cy="8"
              r="6.4"
              fill="none"
              stroke="#ff6b47"
              stroke-width="2.3"
              stroke-linecap="round"
              :stroke-dasharray="RING_C"
              :stroke-dashoffset="RING_C * (1 - activeProgress)"
            />
          </svg>
          <Icon
            v-else
            name="ph:circle"
            class="size-4 shrink-0 mt-0.5"
            style="color: rgba(250,246,240,0.3)"
            aria-hidden="true"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-3">
              <p
                class="font-mono text-[13px] nums"
                :style="{ color: m.reached || i === activeIndex || preview === i ? '#faf6f0' : 'rgba(250,246,240,0.55)' }"
              >
                {{ t(`gofundme.milestones.${m.key}.label`) }}
              </p>
              <span
                class="shrink-0 font-mono text-[12px] nums"
                :style="{ color: m.reached || preview === i ? '#ff6b47' : 'rgba(250,246,240,0.55)' }"
              >{{ formatCurrency(m.amount, data.goalAmount.currencyCode, locale) }}</span>
            </div>
            <i18n-t
              v-if="preview === i && previewRemaining > 0"
              keypath="gofundme.remaining_here"
              tag="p"
              class="mt-0.5 font-mono text-[11.5px] leading-snug nums"
              style="color: rgba(250,246,240,0.72)"
            >
              <template #amount>
                <span class="font-semibold text-coral">{{
                  formatCurrency(previewRemaining, data.goalAmount.currencyCode, locale)
                }}</span>
              </template>
            </i18n-t>
            <i18n-t
              v-else-if="preview === null && i === activeIndex && remainingToNext > 0"
              keypath="gofundme.remaining"
              tag="p"
              class="mt-0.5 font-mono text-[11.5px] leading-snug nums"
              style="color: rgba(250,246,240,0.72)"
            >
              <template #amount>
                <span class="font-semibold text-coral">{{
                  formatCurrency(remainingToNext, data.goalAmount.currencyCode, locale)
                }}</span>
              </template>
            </i18n-t>
            <p
              v-else
              class="mt-0.5 font-mono text-[11px] leading-snug"
              style="color: rgba(250,246,240,0.5)"
            >
              {{ t(`gofundme.milestones.${m.key}.desc`) }}
            </p>
          </div>
        </button>
      </li>
    </ol>
    <p
      v-if="milestones.length"
      class="mt-2 px-1 font-mono text-[10.5px] tracking-[0.04em]"
      style="color: rgba(250,246,240,0.4)"
    >
      {{ $t('gofundme.tap_hint') }}
    </p>

    <!-- Prueba social (auditoría 4.3): «únete a quienes ya lo hacen». El número
         de donantes ya aparece arriba, así que aquí solo va el encuadre. -->
    <p class="mt-6 font-mono text-[12px] tracking-[0.03em]" style="color: rgba(250,246,240,0.7)">
      {{ $t('gofundme.social_proof') }}
    </p>
    <a
      href="https://gofund.me/3e25cae99"
      target="_blank"
      rel="noopener noreferrer"
      @click="trackSupport('gofundme_widget')"
      data-support-cta
      class="btn-cta mt-3 w-full sm:w-auto"
    >
      <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
      {{ $t('gofundme.donate_now') }}
    </a>
  </div>

  <!-- Default variant — inline bar -->
  <div
    v-else-if="data"
    class="mt-5 space-y-2 text-sm text-berenjena"
  >
    <div class="relative pb-6">
      <div
        class="h-2 w-full rounded-full"
        style="background: rgba(45,27,61,0.10)"
        role="progressbar"
        :aria-valuenow="data.currentAmount.amount"
        aria-valuemin="0"
        :aria-valuemax="data.goalAmount.amount"
        :aria-label="$t('gofundme.progress_label')"
      >
        <div
          class="progress-fill h-full rounded-full bg-coral relative"
          :style="{ width: `${pct}%` }"
        >
          <!-- A2 · latido en el borde de avance (decorativo). El % sigue como texto. -->
          <span class="progress-pulse" aria-hidden="true" />
        </div>
      </div>
      <!-- Importe del hito siempre visible bajo cada tick (mismo patrón que la
           tarjeta; tono berenjena sobre fondo claro). -->
      <template v-for="m in milestones" :key="m.key">
        <span v-if="m.pct < 100" class="ms-marker" :style="{ left: `${m.pct}%` }">
          <span class="ms-tick ms-tick--dark" aria-hidden="true" />
          <span
            class="ms-amt font-mono nums"
            :style="{ color: m.reached ? '#ff6b47' : 'rgba(45,27,61,0.6)' }"
          >
            <span v-if="m.reached" aria-hidden="true">✓ </span>{{ formatCurrency(m.amount, data.goalAmount.currencyCode, locale) }}
          </span>
        </span>
      </template>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p class="nums">
        {{ $t('gofundme.raised') }}
        <strong class="font-display text-berenjena">{{
          formatCurrency(
            data.currentAmount.amount,
            data.currentAmount.currencyCode,
            locale
          )
        }}</strong>
        <span class="text-tinta">/</span>
        <span class="text-tinta">{{
          formatCurrency(
            data.goalAmount.amount,
            data.goalAmount.currencyCode,
            locale
          )
        }}</span>
      </p>
      <NuxtLink
        :to="localePath('colabora') + '#gracias'"
        class="dw-donors-link inline-flex items-center gap-2 text-tinta nums"
      >
        <Icon name="ph:users-three" class="size-4" aria-hidden="true" />
        {{ data.donationCount }} {{ $t('gofundme.donators') }}
        <Icon name="ph:arrow-right" class="size-3 transition-transform" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.dw-donors-link {
  text-decoration: none;
  transition: opacity 0.2s ease;
  cursor: pointer;
}
.dw-donors-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dw-donors-link:hover svg:last-child {
  transform: translateX(2px);
}
.dw-donors-link:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── Marcas de hito con el importe SIEMPRE visible bajo cada tick ───────────
   Tick fino sobre la barra + el importe del objetivo justo debajo, alineado a
   su posición (left = % del hito), para ver de un vistazo qué objetivo hay en
   cada punto. Alcanzado → coral con ✓ (color desde el template por variante). */
.ms-marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.ms-tick {
  width: 2px;
  border-radius: 9999px;
}
.ms-tick--light {
  height: 10px;
  background: rgba(250, 246, 240, 0.6);
}
.ms-tick--dark {
  height: 8px;
  background: rgb(var(--color-text-rgb) / 0.45);
}
.ms-amt {
  margin-top: 7px;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Proyección «cuánto faltaría» al pinchar un hito del listado. Translúcida →
   se distingue del recaudado real (coral sólido) y no falsea la cifra. */
.ms-ghost {
  background: rgb(var(--color-cta-rgb) / 0.32);
  transition: width 0.35s ease, left 0.35s ease;
}
/* Filas del listado clicables (vista previa). */
.ms-row {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.ms-row:hover {
  background: rgb(var(--color-cta-rgb) / 0.14) !important;
}
.ms-row:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: -2px;
}
@media (prefers-reduced-motion: reduce) {
  .ms-ghost { transition: none; }
}
</style>
