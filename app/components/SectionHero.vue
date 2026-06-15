<template>
  <section
    class="hero relative overflow-hidden bg-cream"
    :aria-label="$t('hero.section_label')"
    :aria-describedby="'hero-sr-summary'"
  >
    <p id="hero-sr-summary" class="sr-only">{{ $t('pathways.hero_sr_summary') }}</p>

    <div class="hero__shell section-wide">
      <div class="hero__grid">
        <!-- Beat 1 · meta + titular -->
        <div class="hero__head">
          <div class="hero__meta animate-fade-up">
            <span class="hero__eyebrow eyebrow">{{ $t('home.hero_eyebrow') }}</span>
            <DaysWaitingCounter />
          </div>

          <i18n-t
            keypath="hero.title"
            tag="h1"
            class="hero__title heading-display text-berenjena animate-fade-up"
            style="animation-delay: 0.1s"
          >
            <template #op><span class="italic text-miriam">{{ $t('hero.title_emphasis') }}</span></template>
          </i18n-t>
        </div>

        <!-- Beat 2 · retrato -->
        <figure class="hero__portrait animate-fade-up" style="animation-delay: 0.15s">
          <div class="hero__portrait-frame">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              :alt="$t('home.s6_photo_alt')"
              class="hero__portrait-img"
              width="640"
              height="640"
              sizes="(max-width: 639px) 168px, (max-width: 1023px) 200px, 240px"
              format="webp"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          <span
            class="hero__handle hero__handle--top"
            aria-hidden="true"
            translate="no"
          >
            @miriamgonp
          </span>

          <figcaption class="hero__portrait-tag">
            <span>{{ $t('hero.photo_tag') }}</span>
          </figcaption>
        </figure>

        <!-- Beat 3 · brecha, acción, estado -->
        <div class="hero__body">
          <i18n-t
            keypath="hero.subtitle"
            tag="p"
            class="hero__lede text-tinta animate-fade-up"
            style="animation-delay: 0.2s"
          >
            <template #lead>
              <strong class="font-semibold text-berenjena">{{ $t('hero.subtitle_lead', { age: caseData.currentAge }) }}</strong>
            </template>
            <template #twofaces>
              <span class="two-faces">{{ $t('hero.twofaces') }}<svg
                class="two-faces__stroke"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path class="tf-line" pathLength="1" d="M2 5.4 C 16 3.4, 38 7, 58 4.8 C 74 3.2, 90 6, 98 4.6" />
              </svg></span>
            </template>
          </i18n-t>

          <div class="hero__cta animate-fade-up" style="animation-delay: 0.3s">
            <div class="hero__cta-cell">
              <a
                href="https://gofund.me/3e25cae99"
                target="_blank"
                rel="noopener noreferrer"
                @click="trackSupport('home_hero')"
                data-support-cta
                class="btn-cta w-full justify-center"
              >
                <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
                {{ $t('hero.cta_donate') }}
              </a>
              <p class="hero__cta-caption">{{ $t('home.hero_cta_donate_caption') }}</p>
            </div>
            <div class="hero__cta-cell">
              <NuxtLink
                :to="localePath({ name: 'ciencia' })"
                class="btn-secondary w-full justify-center"
                @click="trackScience('home_hero')"
              >
                <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('hero.cta_science') }}
              </NuxtLink>
              <p class="hero__cta-caption">{{ $t('home.hero_cta_science_caption') }}</p>
            </div>
          </div>

          <div class="hero__status animate-fade-up" style="animation-delay: 0.34s">
            <p
              v-if="gofundme?.donationCount"
              class="hero__social"
            >
              <Icon name="ph:heart-fill" class="w-3.5 h-3.5 shrink-0 text-coral" aria-hidden="true" />
              <i18n-t keypath="home.hero_social_proof" tag="span">
                <template #n><strong class="text-berenjena nums">{{ donorsFormatted }}</strong></template>
              </i18n-t>
            </p>

            <NuxtLink
              v-if="latest"
              :to="localePath({ name: 'timeline' }) + '#lo-ultimo'"
              class="hero__latest group"
            >
              <span class="hero__latest-meta">
                <span class="hero-live-dot h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                <span class="font-mono uppercase text-[11px] tracking-[0.16em] font-semibold text-coral-deep">
                  {{ $t('hero.latest_label') }}
                </span>
                <span v-if="latestAgo" class="font-mono text-[11px] text-tinta">· {{ latestAgo }}</span>
              </span>
              <span class="hero__latest-title">
                {{ latest.title }}
                <Icon
                  name="ph:arrow-right"
                  class="ml-1.5 inline-block w-3.5 h-3.5 align-[-2px] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Cifras · panel alineado al shell -->
      <div class="hero__stats animate-fade-up" style="animation-delay: 0.4s">
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          class="hero__stat"
          :class="{ 'hero__stat--firma': i === 3 }"
        >
          <p class="hero__stat-value nums" :class="i === 3 ? 'firma' : 'text-berenjena'">
            {{ stat.value }}
          </p>
          <p class="hero__stat-label">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale, t } = useI18n()
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

const { data: latest } = await useAsyncData(
  `hero-latest-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const en = await queryCollection('timeline_en').first()
      if (en?.entries?.length) return en.entries[en.entries.length - 1]
    }
    const es = await queryCollection('timeline_es').first()
    const entries = es?.entries ?? []
    return entries.length ? entries[entries.length - 1] : null
  },
  { watch: [locale] }
)

const ES_MONTHS: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
}
function parseTimelineDate(s?: string): Date | null {
  if (!s) return null
  const m = s.toLowerCase().match(/(\d{1,2})?\s*([a-zñ]{3,})\.?\s*(\d{4})/)
  if (m) {
    const mon = ES_MONTHS[(m[2] ?? '').slice(0, 3)]
    if (mon !== undefined) return new Date(Number(m[3]), mon, m[1] ? Number(m[1]) : 1)
  }
  const y = s.match(/^\s*(\d{4})\s*$/)
  if (y) return new Date(Number(y[1]), 0, 1)
  const d = new Date(s)
  return isNaN(+d) ? null : d
}
const latestAgo = computed(() => {
  const d = parseTimelineDate((latest.value as { date?: string } | null)?.date)
  if (!d) return null
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days < 0) return null
  if (days === 0) return t('hero.updated_today')
  if (days === 1) return t('hero.updated_ago_one')
  return t('hero.updated_ago', { n: days })
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

const stats = computed(() => [
  { value: raisedFormatted.value, label: t('hero.stat_raised_label') },
  { value: donorsFormatted.value, label: t('hero.stat_donors_label') },
  { value: caseData.specialists, label: t('hero.stat_specialists_label', { countries: caseData.countries }) },
  { value: t('hero.stat_ne_value'), label: t('hero.stat_ne_label') },
])
</script>

<style scoped>
/* ── Shell & rejilla ───────────────────────────────────────────────────────
   Una sola escala vertical (8px base). Columna izq = flujo narrativo;
   columna dcha = retrato anclado arriba, sin huecos flotantes en desktop. */
.hero__shell {
  padding-top: 1.75rem;
  padding-bottom: 3rem;
}
@media (min-width: 640px) {
  .hero__shell {
    padding-top: 4rem;
    padding-bottom: 4.5rem;
  }
}
@media (min-width: 1024px) {
  .hero__shell {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
}

.hero__grid {
  display: grid;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 767px) {
  /* Narrativa continua: titular → texto/CTA → retrato (evita hueco entre H1 y lede). */
  .hero__head {
    order: 1;
  }
  .hero__body {
    order: 2;
  }
  .hero__portrait {
    order: 3;
    margin-top: 0.25rem;
  }
}
@media (min-width: 640px) {
  .hero__grid {
    gap: 1.5rem;
  }
}
/* Tablet / ventana estrecha en laptop: una columna, foto contenida */
@media (min-width: 768px) and (max-width: 1023px) {
  .hero__head {
    order: 1;
  }
  .hero__body {
    order: 2;
  }
  .hero__portrait {
    order: 3;
    max-width: 200px;
    margin-inline: auto;
    margin-top: 0.5rem;
  }
}

/* Desktop (≥1024): foto solo junto al titular; cuerpo a ancho completo (sin hueco lateral). */
@media (min-width: 1024px) {
  .hero__grid {
    grid-template-columns: minmax(0, 1fr) clamp(180px, 20vw, 240px);
    column-gap: clamp(1.75rem, 3vw, 2.5rem);
    row-gap: 1.5rem;
  }
  .hero__head {
    grid-column: 1;
    grid-row: 1;
  }
  .hero__portrait {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    align-self: start;
    width: 100%;
    max-width: 240px;
  }
  .hero__body {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: 42rem;
  }
}

/* Meta: eyebrow + contador en la misma línea que cronología */
.hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.625rem;
}
.hero__eyebrow {
  margin: 0;
  line-height: 1.35;
  max-width: 28rem;
}

.hero__title {
  margin-top: 1.25rem;
  font-size: clamp(1.8125rem, 4.2vw, 3.25rem);
  letter-spacing: -0.03em;
  line-height: 1.08;
  max-width: 14ch;
  text-wrap: balance;
}
@media (min-width: 640px) {
  .hero__title {
    margin-top: 1.5rem;
    max-width: 16ch;
  }
}
@media (min-width: 1024px) {
  /* Misma medida que lede/CTA: el titular no «estrecha» la columna en desktop. */
  .hero__title {
    max-width: 36rem;
  }
}

/* Retrato */
.hero__portrait {
  position: relative;
  margin: 0;
  width: 100%;
  max-width: 168px;
  margin-inline: auto;
}
@media (min-width: 640px) {
  .hero__portrait {
    max-width: 240px;
  }
}
@media (min-width: 1024px) {
  .hero__portrait {
    margin-inline: 0;
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

.hero__handle {
  position: absolute;
  z-index: 2;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #9d44ab;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  box-shadow: 0 8px 20px -8px rgba(45, 27, 61, 0.45);
  transform: rotate(2deg);
}
@media (min-width: 640px) {
  .hero__handle {
    font-size: 11px;
    padding: 0.45rem 0.85rem;
  }
}
.hero__handle--top {
  right: 0.5rem;
  top: -0.65rem;
}
@media (min-width: 640px) {
  .hero__handle--top {
    right: -0.35rem;
    top: 1.5rem;
  }
}

.hero__portrait-tag {
  display: flex;
  justify-content: center;
  margin-top: -0.85rem;
  position: relative;
  z-index: 2;
}
.hero__portrait-tag span {
  display: inline-block;
  border-radius: 999px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.4rem 0.9rem;
  box-shadow: 0 10px 24px -12px rgba(45, 27, 61, 0.55);
}
@media (min-width: 640px) {
  .hero__portrait-tag span {
    font-size: 11px;
  }
}

/* Cuerpo textual */
.hero__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}
@media (min-width: 640px) {
  .hero__body {
    gap: 1.5rem;
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
    font-size: 1.25rem;
    line-height: 1.5;
  }
}

/* CTAs · misma anchura y captions alineadas */
.hero__cta {
  display: grid;
  gap: 1rem;
  max-width: 36rem;
}
@media (min-width: 480px) {
  .hero__cta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.25rem;
  }
}

.hero__cta-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.hero__cta-caption {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #3a3340;
  min-height: 2.25rem;
}

/* Estado · bloque encuadrado, sin zona muerta */
.hero__status {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  max-width: 36rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
}
@media (min-width: 640px) {
  .hero__status {
    padding-top: 1.5rem;
    gap: 1rem;
  }
}

.hero__social {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #3a3340;
}

.hero__latest {
  display: block;
  text-decoration: none;
  color: inherit;
}

.hero__latest-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.35rem;
}

.hero__latest-title {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.45;
  color: #9d44ab;
  text-decoration: underline;
  text-decoration-color: rgba(157, 68, 171, 0.5);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.15s ease;
}
.hero__latest:hover .hero__latest-title {
  text-decoration-color: #9d44ab;
}

/* Stats · rejilla cerrada, alturas iguales */
.hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 1rem;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(45, 27, 61, 0.1);
}
@media (min-width: 640px) {
  .hero__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    margin-top: 3rem;
    padding-top: 2.25rem;
  }
}

.hero__stat {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 4.5rem;
}
@media (min-width: 640px) {
  .hero__stat {
    padding-inline: 1.75rem;
    border-left: 1px solid rgba(45, 27, 61, 0.14);
    min-height: 5rem;
  }
  .hero__stat:first-child {
    padding-left: 0;
    border-left: 0;
  }
}

.hero__stat-value {
  margin: 0;
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: clamp(1.875rem, 5vw, 3.75rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.hero__stat-label {
  margin: 0.625rem 0 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.35;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3a3340;
}

/* «dos caras» */
.two-faces {
  position: relative;
  font-style: italic;
  font-weight: 700;
  white-space: nowrap;
}
.two-faces__stroke {
  position: absolute;
  left: -1.5%;
  bottom: -0.22em;
  width: 103%;
  height: 0.34em;
  overflow: visible;
  pointer-events: none;
}
.tf-line {
  fill: none;
  stroke: #9d44ab;
  stroke-width: 2.6;
  stroke-linecap: round;
}
@media (prefers-reduced-motion: no-preference) {
  .tf-line {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: tf-draw 0.55s ease-out 0.8s forwards;
  }
  @keyframes tf-draw {
    to { stroke-dashoffset: 0; }
  }
}

.hero-live-dot {
  animation: hero-pulse 2s ease-in-out 3;
}
@keyframes hero-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 71, 0.4); }
  50% { box-shadow: 0 0 0 7px rgba(255, 107, 71, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-live-dot { animation: none; }
}
</style>