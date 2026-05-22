<script setup lang="ts">
const { locale } = useI18n()
const { data } = useGoFundMe(
  'biopsia-molecular-que-puede-cambiar-su-tratamiento'
)
</script>

<template>
  <div
    v-if="data"
    class="mt-5 space-y-2 text-sm text-ink-900"
    role="progressbar"
    :aria-valuenow="data.currentAmount.amount"
    aria-valuemin="0"
    :aria-valuemax="data.goalAmount.amount"
  >
    <div class="h-2 w-full rounded-full bg-ink-200/50">
      <div
        class="h-full rounded-full bg-gold-600"
        :style="{
          width: `${(data.currentAmount.amount * 100) / data.goalAmount.amount}%`,
        }"
      ></div>
    </div>
    <div class="flex items-center justify-between">
      <p>
        {{ $t('gofundme.raised') }}
        <strong>{{
          formatCurrency(
            data.currentAmount.amount,
            data.currentAmount.currencyCode,
            locale
          )
        }}</strong>
        /
        {{
          formatCurrency(
            data.goalAmount.amount,
            data.goalAmount.currencyCode,
            locale
          )
        }}
      </p>
      <p class="inline-flex items-center gap-2">
        <Icon name="ph:users-three" class="size-4" aria-hidden="true" />
        {{ data.donationCount }} {{ $t('gofundme.donators') }}
      </p>
    </div>
  </div>
</template>
