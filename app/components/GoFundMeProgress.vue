<script setup lang="ts">
import type { GoFundMeFundraiser } from '../../utils/fundraiser'

withDefaults(defineProps<{ card?: boolean }>(), { card: false })

const { locale } = useI18n()
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

// «Mejora medida» (decisión de producto): evitar que la campaña «parezca
// terminada» mostrando cuánto falta para el primer objetivo y qué desbloquea —
// sin convertir la barra única en un tablero de hitos. Lenguaje prudente.
const remaining = computed(() => {
  if (!data.value) return 0
  return Math.max(
    0,
    data.value.goalAmount.amount - data.value.currentAmount.amount
  )
})
</script>

<template>
  <!-- Card variant — dark editorial progress block -->
  <div
    v-if="card && data"
    class="rounded-[24px] p-8 sm:p-10"
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

    <div
      class="mt-6 h-2 w-full rounded-full"
      style="background: rgba(250,246,240,0.12)"
      role="progressbar"
      :aria-valuenow="data.currentAmount.amount"
      aria-valuemin="0"
      :aria-valuemax="data.goalAmount.amount"
      :aria-label="$t('gofundme.progress_label')"
    >
      <div class="progress-fill h-full rounded-full bg-coral relative" :style="{ width: `${pct}%` }">
        <span class="progress-pulse" aria-hidden="true" />
      </div>
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

    <!-- «Faltan X €» + qué desbloquea el objetivo: la campaña no «parece
         terminada». Tira con acento coral (el único acento de la tarjeta) para
         darle jerarquía. Solo si aún falta para la meta. -->
    <div
      v-if="remaining > 0"
      class="mt-5 flex items-start gap-3 rounded-xl px-4 py-3.5"
      style="background: rgba(255,107,71,0.10)"
    >
      <Icon name="ph:flag-pennant-fill" class="size-4 shrink-0 mt-0.5 text-coral" aria-hidden="true" />
      <div>
        <i18n-t
          keypath="gofundme.remaining"
          tag="p"
          class="font-mono text-[13px] leading-snug nums"
          style="color: #faf6f0"
        >
          <template #amount>
            <span class="text-coral font-semibold">{{
              formatCurrency(remaining, data.currentAmount.currencyCode, locale)
            }}</span>
          </template>
        </i18n-t>
        <p class="mt-1 font-mono text-[11.5px] leading-relaxed" style="color: rgba(250,246,240,0.62)">
          {{ $t('gofundme.goal_unlocks') }}
        </p>
      </div>
    </div>

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
        :style="{
          width: `${(data.currentAmount.amount * 100) / data.goalAmount.amount}%`,
        }"
      >
        <!-- A2 · latido en el borde de avance (decorativo). El % sigue como texto. -->
        <span class="progress-pulse" aria-hidden="true" />
      </div>
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
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
