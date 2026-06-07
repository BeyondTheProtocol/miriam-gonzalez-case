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

      <!-- Tablita sencilla: nombre + importe, anónimos como "Anónimo". -->
      <div
        v-if="shown.length"
        class="rounded-2xl border border-berenjena/10 bg-cream overflow-hidden"
      >
        <table class="w-full">
          <caption class="sr-only">{{ $t('thanksWall.title') }}</caption>
          <tbody>
            <tr
              v-for="d in shown"
              :key="d.id"
              class="border-b border-berenjena/[0.07] last:border-b-0"
            >
              <td class="py-2.5 px-4 font-display font-semibold text-berenjena">{{ d.name }}</td>
              <td class="py-2.5 px-4 text-right font-mono text-sm font-semibold text-coral-deep nums whitespace-nowrap">
                {{ money(d) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="loaded" class="text-tinta text-sm">{{ $t('thanksWall.empty') }}</p>

      <p v-if="limit && donations.length > limit" class="mt-4">
        <NuxtLink :to="localePath('donantes')" class="link-inline">
          {{ $t('thanksWall.see_all', { n: donations.length }) }} →
        </NuxtLink>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Muro de gracias — tablita sencilla con las donaciones reales de GoFundMe
 * (nombre + importe; anónimos como "Anónimo"). Datos de /donations.json
 * (función Netlify horaria). `limit` recorta para el avance en /colabora;
 * sin limit (en /donantes) se ven todas.
 */
import type { PublicDonation } from '../../utils/fundraiser'

const props = defineProps<{ limit?: number }>()
const localePath = useLocalePath()
const { locale } = useI18n()

const donations = ref<PublicDonation[]>([])
const loaded = ref(false)
onMounted(async () => {
  try {
    donations.value = await $fetch<PublicDonation[]>('/donations.json')
  } catch {
    /* sin datos */
  } finally {
    loaded.value = true
  }
})

const shown = computed(() => {
  const arr = [...donations.value].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  )
  return props.limit ? arr.slice(0, props.limit) : arr
})

function money(d: PublicDonation) {
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: d.currencyCode || 'EUR',
    maximumFractionDigits: 0,
  }).format(d.amount)
}
</script>
