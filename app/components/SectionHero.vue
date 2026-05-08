<template>
  <section class="relative overflow-hidden" :aria-label="$t('hero.section_label')">
    <!-- Background: subtle gradient + molecular pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-ink-50 via-gold-50/30 to-ocean-50/20" />
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0); background-size: 40px 40px;" />

    <!-- Decorative accent line -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-gold-400 to-transparent" />

    <div class="relative section-container pt-28 pb-20 sm:pt-36 sm:pb-28">
      <!-- Tagline -->
      <div class="animate-fade-up">
        <span class="tag-gold mb-6 inline-flex">
          {{ $t('hero.tagline') }}
        </span>
      </div>

      <!-- Main heading -->
      <h1
        class="heading-display text-4xl sm:text-5xl lg:text-6xl text-ink-950 max-w-3xl mb-6 animate-fade-up"
        style="animation-delay: 0.1s"
      >
        {{ $t('hero.title') }}
      </h1>

      <!-- Subtitle -->
      <p
        class="text-lg sm:text-xl text-ink-700 max-w-2xl leading-relaxed mb-10 animate-fade-up"
        style="animation-delay: 0.2s"
      >
        {{ $t('hero.subtitle') }}
      </p>

      <!-- CTAs -->
      <div
        class="flex flex-col sm:flex-row gap-4 animate-fade-up"
        style="animation-delay: 0.3s"
      >
        <a
          href="https://gofund.me/3e25cae99"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Icon name="ph:heart-fill" class="w-4 h-4" aria-hidden="true" />
          {{ $t('hero.cta_donate') }}
        </a>
        <NuxtLink
          :to="localePath({ name: 'ciencia' })"
          class="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/80 hover:bg-white border border-ink-200 text-ink-800 font-semibold rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Icon name="ph:flask-fill" class="w-4 h-4 text-ocean-600" />
          {{ $t('hero.cta_science') }}
        </NuxtLink>
      </div>

      <!-- Key stats -->
      <div
        class="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 animate-fade-up"
        style="animation-delay: 0.4s"
      >
        <div v-for="stat in stats" :key="stat.label" class="text-center sm:text-left">
          <p class="font-display font-bold text-2xl sm:text-3xl text-ink-900">{{ stat.value }}</p>
          <p class="text-xs text-ink-700 mt-0.5">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale } = useI18n()

const stats = computed(() =>
  locale.value === 'es'
    ? [
        { value: '80%', label: 'Del tumor tiene diferenciación neuroendocrina — el componente que hace que su biología no se parezca a ningún cáncer de mama convencional' },
        { value: '×13', label: 'Veces amplificado el gen que hace resistentes los tratamientos estándar' },
        { value: '2', label: 'Líneas de tratamiento completadas con respuesta limitada — ninguna sostenible a largo plazo' },
        { value: '5+', label: 'Especialistas de 4 países trabajando en su caso' },
      ]
    : [
        { value: '80%', label: 'Of the tumor shows neuroendocrine differentiation — the component that makes its biology unlike any conventional breast cancer' },
        { value: '×13', label: 'Times amplified the gene that makes standard treatments ineffective' },
        { value: '2', label: 'Treatment lines completed with limited response — none sustainable long-term' },
        { value: '5+', label: 'Specialists from 4 countries working on her case' },
      ]
)
</script>
