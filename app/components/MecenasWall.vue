<template>
  <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'mecenas-title'">
    <div class="section-container">
      <p class="eyebrow mb-3 block">{{ l.title }}</p>
      <h2
        id="mecenas-title"
        class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
        style="letter-spacing: -0.02em"
      >
        {{ l.title }}
      </h2>
      <p class="text-tinta leading-relaxed mb-8 max-w-2xl">{{ l.subtitle }}</p>

      <!-- 1 columna en móvil, 2 en sm+. Sin importes por persona (RGPD). -->
      <ul class="grid gap-3 sm:grid-cols-2">
        <li
          v-for="(e, i) in entries"
          :key="i"
          class="card-base bg-cream flex flex-col"
        >
          <div class="flex items-baseline justify-between gap-3">
            <span class="font-display font-semibold text-berenjena">
              {{ e.anonymous ? l.anon : e.name }}
            </span>
            <span class="eyebrow text-miriam shrink-0">{{ l.tiers[e.tier] ?? '' }}</span>
          </div>
          <p v-if="e.message" class="text-sm text-tinta italic leading-relaxed mt-2">
            «{{ e.message }}»
          </p>
          <a
            v-if="e.url && !e.anonymous"
            :href="e.url"
            target="_blank"
            rel="noopener"
            class="link-inline text-xs mt-2 inline-flex items-center gap-1"
          >
            {{ e.name }}
            <Icon name="ph:arrow-up-right" class="w-3 h-3" aria-hidden="true" />
            <span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * P6 · Módulo 1 — Muro de gracias (inclusivo, sin importes).
 * Lee app/data/mecenas.json (bilingüe en el propio fichero). Más recientes
 * primero. Respeta anónimos. Para actualizar el muro se edita el JSON.
 */
import data from '../data/mecenas.json'

const { locale } = useI18n()

const l = computed(() => (locale.value === 'es' ? data.labels.es : data.labels.en))

const entries = computed(() =>
  [...data.entries].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
)
</script>
