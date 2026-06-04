<template>
  <div>
    <PageHeader :title="$t('expenses.title')" :subtitle="$t('expenses.subtitle')" />

    <section class="section-spacing bg-cream" :aria-label="$t('expenses.title')">
      <div class="section-container max-w-3xl">
        <p class="text-base text-tinta leading-relaxed mb-8 max-w-2xl">
          {{ $t('expenses.intro') }}
        </p>

        <!-- Desglose completo (12 partidas) · cuenta itemizada -->
        <div class="card-base">
          <p class="font-display font-semibold text-berenjena text-lg mb-4">
            {{ $t('home.s4_list_intro') }}
          </p>
          <ul class="grid sm:grid-cols-2 gap-x-10">
            <li
              v-for="(item, i) in $tm('home.s4_list')"
              :key="i"
              class="flex items-start gap-3 py-2.5 border-t border-berenjena/[0.07]"
            >
              <span
                class="mt-[7px] w-1.5 h-1.5 rounded-full bg-miriam shrink-0"
                aria-hidden="true"
              />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
        </div>

        <p class="mt-6 text-sm text-tinta italic max-w-2xl">
          {{ $t('expenses.note') }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <a
            href="https://gofund.me/3e25cae99"
            target="_blank"
            rel="noopener"
            class="btn-cta w-full sm:w-auto"
          >
            <Icon name="ph:heart-fill" class="w-4 h-4" aria-hidden="true" />
            {{ $t('home.s4_cta_button') }}
          </a>
          <p class="text-xs text-tinta">{{ $t('home.s4_cta_caption') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('expenses.title'),
  description: () => t('expenses.intro'),
  ogTitle: () => t('expenses.title'),
  ogDescription: () => t('expenses.subtitle'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('expenses.title'),
  twitterDescription: () => t('expenses.subtitle'),
})

defineOgImage('Default.takumi', {
  title: () => t('expenses.title'),
  description: () => t('expenses.subtitle'),
})
</script>
