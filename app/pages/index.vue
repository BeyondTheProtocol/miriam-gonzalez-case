<template>
  <div>
    <SectionHero />

    <!-- «Elige tu camino» justo bajo el hero (dictamen `diseno`, 14-oct-2026): el
         enrutador por perfil pasa antes que las herramientas. -->
    <VisitorPathways variant="home" />

    <!-- Hacia dónde va (17-oct-2026, repaso de la home): el objetivo único y la ruta de 5 pasos.
         Sustituye al antiguo «Hacia dónde va» del ensayo N-of-1 y a la línea de marcadores.
         Los pasos, consejo de Javi; estados en utils/rutaPasos.ts (fuente única). -->
    <HomeProximosPasos />

    <!-- Herramientas «al primer vistazo»: banda-teaser en el flujo crema (no un
         tercer botón en el hero, que leería a SaaS). Desde el 17-oct-2026 es el acceso a
         TODAS las herramientas, la más nueva primero (antes era el teaser de /lesiones). -->
    <SectionHerramientasTeaser />

    <!-- La historia + en sus propias palabras (beat humano: persona antes que problema) -->
    <section v-reveal class="py-20 sm:py-28 relative overflow-hidden" :aria-label="$t('home.story_eyebrow')" style="background: #2d1b3d; color: #faf6f0">
      <div class="absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0); background-size: 32px 32px;" />
      <div class="relative section-wide">
        <p class="eyebrow block" style="color: #e8d4ed">
          {{ $t('home.story_eyebrow') }}
        </p>
        <h2 class="heading-display text-3xl sm:text-4xl mt-4 mb-6" style="color: #faf6f0; letter-spacing: -0.03em">
          {{ $t('home.story_heading') }}
        </h2>
        <p class="text-base sm:text-lg leading-relaxed max-w-2xl" style="color: rgba(250,246,240,0.92)">
          {{ $t('home.story_p1')
          }}<strong class="font-semibold text-cream">{{ $t('home.story_p1_rarity') }}</strong>{{ $t('home.story_p1_tail') }}
        </p>
        <!-- Cita verificable de la rareza: que nadie pueda decir que es inventada. -->
        <p class="mt-2.5 font-mono text-xs" style="color: rgba(250,246,240,0.5)">
          <a
            href="https://doi.org/10.3389/fendo.2020.610230"
            target="_blank"
            rel="noopener"
            class="underline underline-offset-2 decoration-cream/25 transition-colors hover:text-cream/85"
          >
            {{ $t('home.story_p1_source') }}
          </a>
        </p>
        <!-- Atenuado mientras /historia esté en preparación: no manda tráfico
             "fuerte" a una página aún provisional (la nota ya enlaza redes + La ciencia). -->
        <NuxtLink
          :to="localePath({ name: 'historia' })"
          class="link-action group mt-7 min-h-[44px] text-sm text-cream/55"
        >
          {{ $t('home.story_link') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>

        <!-- En sus propias palabras -->
        <div class="mt-14 pt-12" style="border-top: 1px solid rgba(250,246,240,0.15)">
          <p class="eyebrow mb-8 block" style="color: #e8d4ed">
            {{ $t('home.s6_eyebrow') }}
          </p>
          <!-- Las comillas en dos tonos —coral y violeta— son el guiño a las
               «dos caras» del tumor de las que habla la cita. Decorativo. -->
          <blockquote class="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.2] max-w-3xl" style="letter-spacing: -0.025em">
            <span style="color: #ff6b47">«</span>{{ $t('home.s6_quote') }}<span style="color: #b870c3">»</span>
          </blockquote>
          <p class="mt-8 font-display italic text-xl" style="color: #e8d4ed">
            — {{ $t('home.s6_signature') }}
          </p>
        </div>
      </div>
    </section>


    <!-- S4 · ¿Por qué necesitamos tu ayuda? · Destino del dinero
         (aquí el separador es el propio cambio de color de sección) -->
    <section v-reveal class="section-spacing bg-cream-card" id="campaign" :aria-label="$t('home.s4_eyebrow')">
      <div class="section-wide">
        <p class="eyebrow mb-4 block">{{ $t('home.s4_eyebrow') }}</p>
        <h2 class="heading-display text-3xl sm:text-5xl text-berenjena mb-6" style="letter-spacing: -0.03em">
          {{ $t('home.s4_heading') }}
        </h2>
        <div class="space-y-4 text-base text-tinta leading-relaxed mb-8 max-w-2xl">
          <p>
            {{ $t('home.s4_p1')
            }}<strong class="font-semibold text-berenjena">{{ $t('home.s4_p1_blind') }}</strong>.
          </p>
          <p>
            {{ $t('home.s4_p2') }}
          </p>
        </div>

        <!-- Resumen de 4 categorías; el desglose completo (12 partidas) vive en
             /gastos para no sobrecargar el home (DS §13: resúmenes al inicio). -->
        <div class="card-base">
          <p class="font-display font-semibold text-berenjena text-lg mb-4">{{ $t('home.s4_buckets_title') }}</p>
          <ul class="grid sm:grid-cols-2 gap-x-10">
            <li
              v-for="(item, i) in $tm('home.s4_buckets')"
              :key="i"
              class="flex items-start gap-3 py-2.5 border-t border-berenjena/[0.07]"
            >
              <Icon
                name="ph:check-circle-fill"
                class="mt-[3px] w-4 h-4 text-miriam shrink-0"
                aria-hidden="true"
              />
              <span class="text-sm text-tinta leading-relaxed">{{ $rt(item) }}</span>
            </li>
          </ul>
          <NuxtLink
            :to="localePath('gastos')"
            class="link-action group mt-5 text-sm text-miriam"
          >
            {{ $t('home.s4_full_breakdown') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Cierre · estado de la campaña + caso en prensa (lo último de todo) -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-label="$t('home.s5_eyebrow')" style="border-top: 1px solid rgba(45,27,61,0.08)">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ $t('home.s5_eyebrow') }}</p>
        <h2 class="font-display font-semibold text-berenjena text-2xl sm:text-3xl mb-6" style="letter-spacing: -0.02em">
          {{ $t('home.s5_heading') }}
        </h2>
        <GoFundMeProgress card />

        <!-- Caso en prensa · tira de medios + contacto de prensa (estilo prototipo) -->
        <div
          class="mt-10 pt-6 flex flex-wrap items-baseline gap-x-7 gap-y-3"
          style="border-top: 1px solid rgba(45,27,61,0.08)"
        >
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta self-center">
            {{ $t('home.s9_strip_label') }}
          </span>
          <a
            :href="elPaisUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('El País')"
          >El País<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="laVanguardiaUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('La Vanguardia')"
          >La Vanguardia<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="elEspanolUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('El Español')"
          >El Español<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="murciaUrl"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('La Opinión de Murcia')"
          >La Opinión de Murcia<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <a
            :href="la7Url"
            target="_blank"
            rel="noopener"
            class="link-logo text-2xl sm:text-3xl"
            @click="trackPress('La 7')"
          >La 7<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
          <NuxtLink
            :to="localePath('prensa')"
            class="link-action group sm:ml-auto self-center font-mono text-[12px] text-miriam"
          >
            {{ $t('home.s9_press_contact') }}
            <Icon name="ph:arrow-right" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const { trackPress } = useSupport()

// Cobertura de prensa real (verificada). ORDEN CURADO (más importante primero),
// el mismo que la Sala de prensa (content/<locale>/press.yml): nacionales de
// mayor alcance/prestigio antes que regionales → credibilidad → confianza.
const elPaisUrl =
  'https://elpais.com/tecnologia/2026-04-23/asi-usa-una-paciente-con-cancer-metastasico-la-ia-para-entender-su-enfermedad-cual-es-el-mejor-metodo-para-hablar-de-salud-con-chatbots.html'
const laVanguardiaUrl =
  'https://www.lavanguardia.com/clic/20260816/11613280/miriam-gonzalez-paciente-cancer-mama-raro-me-siento-desventaja-frente-paciente-tenga-cancer-mama-metastasico.html'
const elEspanolUrl =
  'https://www.elespanol.com/alicante/vivir/salud/20260619/miren-ingeniera-anos-usa-ia-luchar-cancer-mama-unico-contactan-oncologos-mundo/1003744290903_0.html'
const murciaUrl =
  'https://www.laopiniondemurcia.es/comunidad/2026/05/30/paciente-murciana-aguarda-nuevo-tratamiento-130816775.html'
const la7Url = 'https://www.instagram.com/p/DZDT2hIAMPU/?hl=es'

defineOgImage('Default.takumi', {
  title:
    locale.value === 'es'
      ? 'Oncología de precisión para un tumor ultra-raro'
      : 'Precision Oncology for an Ultra-Rare Tumor',
  description:
    locale.value === 'es'
      ? 'Investiga su propio cáncer de mama metastásico con IA y un equipo internacional, en abierto. Apoya el siguiente análisis.'
      : 'She investigates her own metastatic breast cancer with AI and an international team, in the open. Support the next analysis.',
  role: locale.value === 'es' ? 'Ingeniera de software y divulgadora tech' : 'Software engineer and tech communicator',
  colorMode: 'light',
})

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  description: () =>
    locale.value === 'es'
      ? 'Miriam González, ingeniera de software y divulgadora tech, investiga con IA y un equipo internacional su propio cáncer de mama metastásico ultra-raro. Apoya las pruebas de precisión que pueden cambiar su tratamiento.'
      : 'Miriam González, software engineer and tech communicator, investigates her own ultra-rare metastatic breast cancer with AI and an international team. Support the precision tests that could change her treatment.',
  ogTitle: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Ingeniera de software y divulgadora tech. Investiga su propio cáncer de mama metastásico con IA y un equipo internacional, en abierto. Apoya el siguiente análisis.'
      : 'Software engineer and tech communicator. She investigates her own metastatic breast cancer with AI and an international team, in the open. Support the next analysis.',
  ogType: 'website',
  ogUrl: () =>
    locale.value === 'es'
      ? 'https://helpmiriam.com'
      : 'https://helpmiriam.com/en',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es'
      ? 'Miriam González — Oncología de precisión para un tumor ultra-raro'
      : 'Miriam González — Precision Oncology for an Ultra-Rare Tumor',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'Ingeniera de software y divulgadora tech. Investiga su propio cáncer de mama metastásico con IA, en abierto.'
      : 'Software engineer and tech communicator. She investigates her own metastatic breast cancer with AI, in the open.',
})

// DonateAction JSON-LD: declara la vía canónica de donación (GoFundMe) para
// buscadores y agentes de IA que responden «cómo donar / cómo ayudar a Miriam».
// Raw JSON-LD vía useHead (mismo patrón que el FAQPage de gastos.vue), porque
// schema-org no expone un helper dedicado para DonateAction.
const donateJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: locale.value === 'es' ? 'Donar para el caso de Miriam González' : "Donate to Miriam González's case",
    recipient: {
      '@type': 'Person',
      name: 'Miriam González',
      url: 'https://helpmiriam.com',
    },
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://gofund.me/3e25cae99',
      inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: donateJsonLd }],
})
</script>
