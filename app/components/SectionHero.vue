<template>
  <section
    class="relative overflow-hidden bg-cream"
    :aria-label="$t('hero.section_label')"
  >
    <div class="relative section-wide pt-7 pb-12 sm:pt-16 sm:pb-20 lg:pt-20">
      <!-- Editorial hero. Mobile-first: el orden del DOM crea el ritmo narrativo
           en móvil (título → cara → brecha → acción → en vivo). En desktop, las
           clases md: recolocan en dos columnas (texto izq · retrato dcha centrado),
           con el retrato ocupando ambas filas de la columna derecha. -->
      <div class="grid items-center gap-5 sm:gap-10 md:gap-x-16 md:gap-y-7 md:grid-cols-[1.1fr_0.9fr]">
        <!-- Beat 1 · Marco + gancho -->
        <div class="md:col-start-1 md:row-start-1">
          <!-- Eyebrow -->
          <div class="animate-fade-up">
            <span class="eyebrow block whitespace-normal text-[10px] tracking-[0.06em] sm:text-[12px] sm:tracking-[0.12em]">{{ $t('home.hero_eyebrow') }}</span>
          </div>

          <!-- Titular con "una oportunidad" resaltado en magenta cursiva (acento de marca). -->
          <i18n-t
            keypath="hero.title"
            tag="h1"
            class="heading-display text-[clamp(29px,4.4vw,52px)] text-berenjena max-w-[20ch] mt-5 sm:mt-6 animate-fade-up"
            style="animation-delay: 0.1s; letter-spacing: -0.03em; line-height: 1.08"
          >
            <template #op><span class="italic text-miriam">{{ $t('hero.title_emphasis') }}</span></template>
          </i18n-t>
        </div>

        <!-- Beat 2 · La cara (en móvil entre título y subtítulo; en desktop, columna dcha) -->
        <div
          class="animate-fade-up md:col-start-2 md:row-start-1 md:row-span-2 md:self-center"
          style="animation-delay: 0.15s"
        >
          <figure class="relative mx-auto md:ml-auto md:mr-0 max-w-[200px] sm:max-w-[420px]">
            <!-- Marco limpio: la ilustración llena el frame a sangre, con borde
                 fino y sombra (DS). Sin fondo beige ni blend que la tiñan. -->
            <div
              class="relative overflow-hidden rounded-[20px]"
              style="box-shadow: 0 18px 44px -22px rgba(45, 27, 61, 0.45);"
            >
              <img
                src="/design-system/assets/miriam-avatar.png"
                :alt="$t('home.s6_photo_alt')"
                class="block w-full object-cover aspect-square"
                width="640"
                height="640"
                fetchpriority="high"
                decoding="async"
              />
            </div>

            <!-- Floating handle (top-right) — asoma del borde con ligera rotación -->
            <span
              class="absolute right-2 -top-3 sm:-right-2 sm:top-7 z-10 px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-full bg-miriam text-cream font-mono text-[10px] sm:text-[11px] tracking-[0.04em] shadow-lg rotate-2"
              aria-hidden="true"
              translate="no"
            >
              @miriamgonp
            </span>

            <!-- Rol cabalgando el borde inferior de la foto (mitad dentro, mitad
                 fuera), como el handle de arriba: flotante pero legible, porque
                 la pastilla es sólida y va con sombra. -->
            <figcaption class="relative z-10 -mt-3.5 sm:-mt-4 flex justify-center">
              <span class="inline-block rounded-full bg-berenjena text-cream font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] px-3.5 py-1.5 shadow-xl">
                {{ $t('hero.photo_tag') }}
              </span>
            </figcaption>
          </figure>
        </div>

        <!-- Beat 3 · La brecha + la acción + en vivo -->
        <div class="md:col-start-1 md:row-start-2">
          <!-- Subtitle -->
          <i18n-t
            keypath="hero.subtitle"
            tag="p"
            class="text-base sm:text-xl text-tinta max-w-2xl leading-relaxed mb-5 sm:mb-9 animate-fade-up"
            style="animation-delay: 0.2s"
          >
            <template #lead>
              <strong class="font-semibold text-berenjena">{{ $t('hero.subtitle_lead') }}</strong>
            </template>
            <template #twofaces>
              <!-- «dos caras»: un trazo a mano (como las anotaciones de la
                   ilustración) se PINTA bajo la frase al entrar — primero la
                   mitad magenta (luminal), luego la coral (neuroendocrina). -->
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

          <!-- CTAs -->
          <div
            class="flex flex-col sm:flex-row gap-4 animate-fade-up"
            style="animation-delay: 0.3s"
          >
            <div class="flex flex-col gap-2.5">
              <a
                href="https://gofund.me/3e25cae99"
                target="_blank"
                rel="noopener noreferrer"
                @click="trackSupport('home_hero')"
                data-support-cta
                class="btn-cta w-full sm:w-auto whitespace-nowrap"
              >
                <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
                {{ $t('hero.cta_donate') }}
              </a>
              <p class="text-xs leading-relaxed text-tinta sm:max-w-[15rem] px-0.5">
                {{ $t('home.hero_cta_donate_caption') }}
              </p>
            </div>
            <div class="flex flex-col gap-2.5">
              <NuxtLink
                :to="localePath({ name: 'ciencia' })"
                class="btn-secondary w-full sm:w-auto whitespace-nowrap"
                @click="trackScience('home_hero')"
              >
                <Icon name="ph:flask-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('hero.cta_science') }}
              </NuxtLink>
              <p class="text-xs leading-relaxed text-tinta sm:max-w-[15rem] px-0.5">
                {{ $t('home.hero_cta_science_caption') }}
              </p>
            </div>
          </div>

          <!-- P2 · prueba social junto al CTA: nº de donantes EN VIVO + prensa,
               para que también lo vea quien no baja al panel de cifras. -->
          <p
            v-if="gofundme?.donationCount"
            class="mt-4 flex items-center gap-2 text-sm text-tinta animate-fade-up"
            style="animation-delay: 0.34s"
          >
            <Icon name="ph:heart-fill" class="w-3.5 h-3.5 shrink-0 text-coral" aria-hidden="true" />
            <i18n-t keypath="home.hero_social_proof" tag="span">
              <template #n><strong class="text-berenjena nums">{{ donorsFormatted }}</strong></template>
            </i18n-t>
          </p>

          <!-- Lo último de la cronología (dinámico, lo que pasa ahora mismo).
               Título subrayado + flecha → señala que es un enlace a la cronología. -->
          <!-- El hash #lo-ultimo hace que el hito de destino "salude" (eco) al aterrizar. -->
          <NuxtLink
            v-if="latest"
            :to="localePath({ name: 'timeline' }) + '#lo-ultimo'"
            class="group mt-8 sm:mt-10 block no-underline animate-fade-up"
            style="animation-delay: 0.35s"
          >
            <span class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
              <span class="hero-live-dot h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
              <span class="font-mono uppercase text-[11px] tracking-[0.16em] font-semibold text-coral-deep">
                {{ $t('hero.latest_label') }}
              </span>
              <span v-if="latestAgo" class="font-mono text-[11px] text-tinta">· {{ latestAgo }}</span>
            </span>
            <span class="block font-mono text-sm text-miriam underline decoration-1 decoration-miriam/50 underline-offset-[3px] transition-colors group-hover:decoration-miriam"
              >{{ latest.title }}<Icon
                name="ph:arrow-right"
                class="ml-1.5 inline-block w-3.5 h-3.5 align-[-2px] transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              /></span>
          </NuxtLink>
        </div>
      </div>

      <!-- Key stats strip -->
      <!-- Cifras como panel de datos: en desktop, filete vertical entre columnas
           (lectura de "sistema"); en móvil se quita y basta el filete superior. -->
      <div
        class="mt-16 sm:mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0 border-t border-berenjena/10 pt-10 animate-fade-up"
        style="animation-delay: 0.4s"
      >
        <div
          v-for="(stat, i) in stats"
          :key="stat.label"
          class="text-left sm:px-7 sm:border-l sm:border-berenjena/[0.14] sm:first:border-l-0 sm:first:pl-0"
        >
          <p
            class="font-display font-semibold leading-none nums"
            :class="i === 3 ? 'firma' : 'text-berenjena'"
            style="font-size: clamp(36px, 4.4vw, 60px); letter-spacing: -0.04em"
          >
            {{ stat.value }}
          </p>
          <p class="text-[11px] text-tinta mt-2.5 uppercase tracking-[0.08em] font-mono leading-snug">
            {{ stat.label }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale, t } = useI18n()
const { trackSupport, trackScience } = useSupport()

// Datos de campaña. En PRERENDER leemos la semilla del disco
// (public/fundraiser.json, generada por update-fundraiser antes del build) para
// hornear la cifra real en el HTML y que NUNCA salga "—". En cliente refrescamos
// al dato EN VIVO que sirve la función Netlify (mismo endpoint /fundraiser.json,
// vía redirect de netlify.toml). $fetch del JSON en SSR no es fiable (lo resuelve
// el router), por eso en servidor vamos a disco. Si algo falla, queda null.
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

// Lo más reciente de la cronología: las entradas están ordenadas de más
// antigua a más nueva, así que la última del array es el hito actual.
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

// A3 · "actualizado hace N días" (texto real). Las fechas del timeline van en
// español ("30 may 2026", "11 ene 2024", "2021", "ene–feb 2024"), que new Date()
// no parsea de forma fiable → parser propio de meses ES, con fallback ISO/inglés.
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
  {
    value: raisedFormatted.value,
    label: t('hero.stat_raised_label'),
  },
  {
    value: donorsFormatted.value,
    label: t('hero.stat_donors_label'),
  },
  {
    value: t('hero.stat_specialists_value'),
    label: t('hero.stat_specialists_label'),
  },
  {
    value: t('hero.stat_ne_value'),
    label: t('hero.stat_ne_label'),
  },
])
</script>

<style scoped>
/* «dos caras»: anotación del cuaderno — subrayado a mano alzada en UN solo
   color (magenta = concepto), que se traza una vez al entrar, como si la
   frase la hubiera subrayado Miriam a boli. La dualidad del tumor ya la
   cuenta /ciencia; aquí basta el gesto. Con reduced-motion (o sin soporte)
   el trazo aparece ya dibujado. */
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
    to {
      stroke-dashoffset: 0;
    }
  }
}

/* «Vivo»: late 3 veces al entrar y se queda quieto (regla del cuaderno:
   se dibuja una vez, no en bucle — amable con la neurodivergencia). */
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
