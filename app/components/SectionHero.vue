<template>
  <section
    class="hero relative overflow-hidden bg-cream"
    :aria-label="$t('hero.section_label')"
    :aria-describedby="'hero-sr-summary'"
  >
    <p id="hero-sr-summary" class="sr-only">{{ $t('pathways.hero_sr_summary') }}</p>

    <div class="hero__shell section-wide">
      <div class="hero__grid">
        <div class="hero__main">
          <p class="hero__eyebrow eyebrow animate-fade-up">{{ $t('home.hero_eyebrow') }}</p>

          <i18n-t
            keypath="hero.title"
            tag="h1"
            class="hero__title heading-display text-berenjena animate-fade-up"
            style="animation-delay: 0.08s"
          >
            <template #op><span class="italic text-miriam">{{ $t('hero.title_emphasis') }}</span></template>
          </i18n-t>

          <p class="hero__lede text-tinta animate-fade-up" style="animation-delay: 0.14s">
            {{ $t('hero.subtitle') }}
          </p>

          <div class="hero__actions animate-fade-up" style="animation-delay: 0.2s">
            <a
              href="https://gofund.me/3e25cae99"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-cta hero__cta-primary"
              @click="trackSupport('home_hero')"
              data-support-cta
            >
              <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4 shrink-0" aria-hidden="true" />
              {{ $t('hero.cta_donate') }}
            </a>
            <p class="hero__cta-note">{{ $t('home.hero_cta_donate_caption') }}</p>
            <DaysWaitingCounter class="hero__counter" />
            <NuxtLink
              :to="localePath({ name: 'ciencia' })"
              class="hero__science-link link-action group"
              @click="trackScience('home_hero')"
            >
              {{ $t('hero.cta_science_link') }}
              <Icon
                name="ph:arrow-right"
                class="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>

          <p v-if="gofundme?.donationCount" class="hero__trust animate-fade-up" style="animation-delay: 0.26s">
            <i18n-t keypath="home.hero_trust_line" tag="span">
              <template #raised><strong class="text-berenjena nums">{{ raisedFormatted }}</strong></template>
              <template #n><strong class="text-berenjena nums">{{ donorsFormatted }}</strong></template>
            </i18n-t>
          </p>
        </div>

        <figure class="hero__portrait animate-fade-up" style="animation-delay: 0.12s">
          <div class="hero__portrait-frame">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              :alt="$t('home.s6_photo_alt')"
              class="hero__portrait-img"
              width="640"
              height="640"
              sizes="(max-width: 767px) 168px, (max-width: 1023px) 240px, 320px"
              format="webp"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale } = useI18n()
const { trackSupport, trackScience } = useSupport()

type GoFundMeFundraiser = import('../../utils/fundraiser').GoFundMeFundraiser
const { data: gofundme, refresh: refreshFundraiser } = await useAsyncData<GoFundMeFundraiser | null>(
  'hero-fundraiser',
  async () => {
    if (import.meta.server) {
      try {
        const { readFile } = await import('node:fs/promises')
        return JSON.parse(await readFile('public/fundraiser.json', 'utf-8'))
      } catch {
        return null
      }
    }
    return $fetch<GoFundMeFundraiser>('/fundraiser.json')
  }
)
onMounted(() => {
  refreshFundraiser()
})

const raisedFormatted = computed(() => {
  if (!gofundme.value) return '—'
  return formatCurrency(
    gofundme.value.currentAmount.amount,
    gofundme.value.currentAmount.currencyCode,
    locale.value
  )
})

const donorsFormatted = computed(() => {
  if (!gofundme.value) return '—'
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US').format(
    gofundme.value.donationCount
  )
})
</script>

<style scoped>
/* Shell */
.hero__shell {
  padding-top: 1.75rem;
  padding-bottom: 2.5rem;
}
@media (min-width: 640px) {
  .hero__shell {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }
}
@media (min-width: 1024px) {
  .hero__shell {
    padding-top: 4.5rem;
    padding-bottom: 4rem;
  }
}

/* Grid: una fila en desktop — sin span 2 que deja hueco bajo el retrato */
.hero__grid {
  display: grid;
  gap: 1.5rem;
  align-items: start;
}
@media (min-width: 768px) {
  .hero__grid {
    grid-template-columns: minmax(0, 1fr) clamp(200px, 30vw, 320px);
    column-gap: clamp(2rem, 4vw, 3.25rem);
    row-gap: 0;
  }
  .hero__main {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
  }
  .hero__portrait {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    width: 100%;
    max-width: 320px;
  }
}

.hero__main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 640px) {
  .hero__main {
    gap: 1.25rem;
  }
}

.hero__eyebrow {
  margin: 0;
  max-width: 36rem;
}

.hero__title {
  margin: 0;
  font-size: clamp(1.8125rem, 4.2vw, 3.25rem);
  letter-spacing: -0.03em;
  line-height: 1.08;
  max-width: 20ch;
  text-wrap: balance;
}
@media (min-width: 768px) {
  .hero__title {
    max-width: 14ch;
  }
}
@media (min-width: 1024px) {
  .hero__title {
    max-width: 16ch;
  }
}

.hero__lede {
  margin: 0;
  font-size: 1rem;
  line-height: 1.55;
  max-width: 36rem;
}
@media (min-width: 640px) {
  .hero__lede {
    font-size: 1.125rem;
    line-height: 1.5;
  }
}

.hero__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
  max-width: 22rem;
  width: 100%;
}
@media (min-width: 480px) {
  .hero__actions {
    max-width: 24rem;
  }
}

.hero__cta-primary {
  width: 100%;
  justify-content: center;
}

.hero__cta-note {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #3a3340;
}

.hero__counter {
  margin-top: 0.125rem;
}

.hero__science-link {
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.hero__trust {
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
  font-size: 0.875rem;
  line-height: 1.45;
  color: #3a3340;
  max-width: 36rem;
}
@media (min-width: 768px) {
  .hero__trust {
    margin-top: 0.25rem;
  }
}

/* Retrato limpio — sin pills que desbordan la rejilla */
.hero__portrait {
  margin: 0;
  width: 100%;
  max-width: 168px;
  justify-self: center;
}
@media (min-width: 640px) {
  .hero__portrait {
    max-width: 220px;
  }
}
@media (min-width: 768px) {
  .hero__portrait {
    justify-self: end;
    align-self: start;
    max-width: 100%;
  }
}

.hero__portrait-frame {
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 18px 44px -22px rgba(45, 27, 61, 0.45);
  aspect-ratio: 1;
}

.hero__portrait-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Móvil: texto primero, foto después del bloque de acción (menos interrupción) */
@media (max-width: 767px) {
  .hero__grid {
    grid-template-areas:
      'main'
      'portrait';
  }
  .hero__main {
    grid-area: main;
  }
  .hero__portrait {
    grid-area: portrait;
    max-width: 140px;
    margin-inline: auto;
    order: 2;
  }
  .hero__main {
    order: 1;
  }
}
</style>