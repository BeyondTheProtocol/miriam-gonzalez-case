<script setup lang="ts">
withDefaults(defineProps<{ card?: boolean }>(), { card: false })

const { locale } = useI18n()
const { data } = useGoFundMe(
  'biopsia-molecular-que-puede-cambiar-su-tratamiento'
)

const elapsed = computed(() =>
  getCampaignElapsed(data.value?.launchDate, locale.value)
)

const pct = computed(() => {
  if (!data.value) return 0
  return Math.round(
    (data.value.currentAmount.amount * 100) / data.value.goalAmount.amount
  )
})
</script>

<template>
  <!-- Card variant — dark editorial progress block -->
  <div
    v-if="card && data"
    class="rounded-[24px] p-8 sm:p-10"
    style="background: #2d1b3d; color: #faf6f0"
    role="progressbar"
    :aria-valuenow="data.currentAmount.amount"
    aria-valuemin="0"
    :aria-valuemax="data.goalAmount.amount"
    :aria-label="$t('gofundme.progress_label')"
  >
    <p
      class="font-display font-semibold leading-none text-coral"
      style="font-size: clamp(48px, 6vw, 72px); letter-spacing: -0.04em"
    >
      {{ formatCurrency(data.currentAmount.amount, data.currentAmount.currencyCode, locale) }}
    </p>
    <p class="mt-2.5 font-mono text-[13px] tracking-[0.06em]" style="color: rgba(250,246,240,0.65)">
      {{ formatCurrency(data.goalAmount.amount, data.goalAmount.currencyCode, locale) }} · {{ $t('gofundme.goal_total') }}
    </p>

    <div class="mt-6 h-2 w-full rounded-full overflow-hidden" style="background: rgba(250,246,240,0.12)">
      <div class="h-full rounded-full bg-coral" :style="{ width: `${pct}%` }" />
    </div>

    <div
      class="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 font-mono text-[12px] tracking-[0.04em]"
      style="color: rgba(250,246,240,0.65)"
    >
      <span style="color: #faf6f0">{{ pct }}% {{ $t('gofundme.pct_raised') }}</span>
      <span class="inline-flex items-center gap-1.5">
        <Icon name="ph:users-three" class="size-3.5" aria-hidden="true" />
        {{ data.donationCount }} {{ $t('gofundme.donators') }}
      </span>
      <span class="inline-flex items-center gap-1.5">
        <Icon name="ph:clock" class="size-3.5" aria-hidden="true" />
        {{ elapsed }} {{ $t('gofundme.active_for') }}
      </span>
    </div>

    <a
      href="https://gofund.me/3e25cae99"
      target="_blank"
      rel="noopener noreferrer"
      class="btn-cta mt-7 w-full sm:w-auto"
    >
      <Icon name="ph:heart-fill" class="w-4 h-4" aria-hidden="true" />
      {{ $t('gofundme.donate_now') }}
    </a>
  </div>

  <!-- Default variant — inline bar -->
  <div
    v-else-if="data"
    class="mt-5 space-y-2 text-sm text-berenjena"
    role="progressbar"
    :aria-valuenow="data.currentAmount.amount"
    aria-valuemin="0"
    :aria-valuemax="data.goalAmount.amount"
    :aria-label="$t('gofundme.progress_label')"
  >
    <div class="h-2 w-full rounded-full" style="background: rgba(45,27,61,0.10)">
      <div
        class="h-full rounded-full bg-coral"
        :style="{
          width: `${(data.currentAmount.amount * 100) / data.goalAmount.amount}%`,
        }"
      ></div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p>
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
      <p class="inline-flex items-center gap-2 text-tinta">
        <Icon name="ph:users-three" class="size-4" aria-hidden="true" />
        {{ data.donationCount }} {{ $t('gofundme.donators') }}
      </p>
      <p class="inline-flex items-center gap-2 text-tinta">
        <Icon name="ph:clock" class="size-4" aria-hidden="true" />
        {{ elapsed }} {{ $t('gofundme.active_for') }}
      </p>
    </div>
  </div>
</template>
