<template>
  <div>
    <!--
      ════════════════════════════════════════════════════════════
        Página /marcas (· /en/brands) — «dossier para marcas» B2B.
        UNLISTED: no vive en SiteNav, se reparte por enlace directo.
        · Compuesta solo con tokens del design-system (cream/berenjena/
          tinta/miriam/coral) + dos extensiones de marca (miriam-claro
          y berenjena-2) para el énfasis e/o las tarjetas SOBRE oscuro.
        · UN ACENTO POR BLOQUE: violeta = identidad (miriam / miriam-claro
          en oscuro), coral = SOLO acción (botón «Hablemos» y la cifra
          «38.897 €»). Crema, nunca blanco; texto berenjena, nunca negro.
        · Tres bandas oscuras (hero · la prueba · cierre) llevan un cielo
          decorativo (.band-fx): resplandor violeta centrado + estrellas
          tenues hacia los bordes → no pisan el texto (zona tranquila).
        · ?marca=Nombre personaliza el hero (cliente, sin romper SSR).
        · Botón flotante → descarga el deck (public/dossier-marcas-deck.pdf); estilos @media print mínimos.
      ════════════════════════════════════════════════════════════
    -->

    <!-- ░░ 1 · HERO ░░ banda oscura -->
    <section
      v-reveal
      class="relative overflow-hidden section-spacing bg-berenjena"
      :aria-labelledby="'m-hero'"
    >
      <div class="band-fx" aria-hidden="true">
        <div class="band-fx__stars"></div>
        <div class="band-fx__glow"></div>
      </div>
      <div class="section-wide relative z-10">
        <div class="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
          <div>
            <p class="dark-eyebrow mb-5">{{ t('marcas.hero_eyebrow') }}</p>
            <i18n-t
              keypath="marcas.hero_title"
              tag="h1"
              id="m-hero"
              class="heading-display text-cream text-4xl sm:text-5xl"
              style="letter-spacing: -0.03em; line-height: 1.08"
            >
              <template #br><br /></template>
              <template #em>
                <em class="italic text-miriam-claro">{{ t('marcas.hero_title_em') }}</em>
              </template>
            </i18n-t>
            <p class="mt-6 text-lg text-cream/85 leading-relaxed max-w-2xl">
              {{ t('marcas.hero_subtitle') }}
            </p>
            <p class="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-miriam-claro">
              {{ t('marcas.hero_tagline') }}
            </p>
            <ClientOnly>
              <p
                v-if="marca"
                class="mt-6 font-mono text-xs uppercase tracking-[0.12em] text-cream/70"
              >
                {{ t('marcas.hero_edition_label') }}
                <b class="ml-1 font-semibold text-cream marca-name">{{ marca }}</b>
              </p>
            </ClientOnly>
          </div>

          <figure class="justify-self-center lg:justify-self-end m-0">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              alt=""
              width="336"
              height="336"
              format="webp"
              decoding="async"
              class="w-[168px] h-[168px] rounded-full object-cover avatar-ring"
            />
          </figure>
        </div>
      </div>
    </section>

    <!-- ░░ 2 · LA HISTORIA ░░ crema -->
    <section v-reveal class="section-spacing bg-cream" :aria-labelledby="'m-historia'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.historia_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.historia_title"
          tag="h2"
          id="m-historia"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-6 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.historia_title_em') }}</em></template>
        </i18n-t>

        <i18n-t keypath="marcas.historia_p1" tag="p" class="text-lg text-tinta leading-relaxed mb-4 max-w-3xl">
          <template #age>{{ caseData.currentAge }}</template>
          <template #b1><strong class="font-semibold text-berenjena">{{ t('marcas.historia_p1_b1') }}</strong></template>
          <template #b2><strong class="font-semibold text-berenjena">{{ t('marcas.historia_p1_b2') }}</strong></template>
        </i18n-t>

        <i18n-t keypath="marcas.historia_p2" tag="p" class="text-tinta leading-relaxed mb-6 max-w-3xl">
          <template #b1><strong class="font-semibold text-berenjena">{{ t('marcas.historia_p2_b1') }}</strong></template>
          <template #b2><strong class="font-semibold text-berenjena">{{ t('marcas.historia_p2_b2') }}</strong></template>
          <template #b3><strong class="font-semibold text-berenjena">{{ t('marcas.historia_p2_b3') }}</strong></template>
        </i18n-t>

        <div class="flex flex-wrap gap-2 mb-6">
          <span v-for="(b, i) in badges" :key="i" class="badge-genomic">{{ rt(b) }}</span>
        </div>

        <i18n-t keypath="marcas.historia_foot" tag="p" class="text-sm text-tinta">
          <template #link>
            <NuxtLink :to="localePath({ name: 'ciencia' })" class="link-inline">{{ t('marcas.historia_foot_link') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>

    <!-- ░░ 3 · LOS NÚMEROS ░░ crema-card -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'m-numeros'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.numeros_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.numeros_title"
          tag="h2"
          id="m-numeros"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.numeros_title_em') }}</em></template>
        </i18n-t>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-9 mb-10">
          <div v-for="(s, i) in numerosStats" :key="i">
            <p
              class="font-display font-semibold tracking-tight nums"
              :class="i === 1 ? 'text-miriam' : 'text-berenjena'"
              style="font-size: clamp(2.5rem, 6vw, 3.75rem); line-height: 0.95"
            >
              {{ rt(s.value) }}
            </p>
            <p class="mt-2 font-mono uppercase text-[11px] tracking-[0.06em] text-tinta leading-snug">
              {{ rt(s.caption) }}
            </p>
          </div>
        </div>

        <i18n-t keypath="marcas.numeros_growth" tag="p" class="text-tinta leading-relaxed mb-9 max-w-3xl">
          <template #b1><strong class="font-semibold text-berenjena">{{ t('marcas.numeros_growth_b1') }}</strong></template>
          <template #b2><strong class="font-semibold text-berenjena">{{ t('marcas.numeros_growth_b2') }}</strong></template>
        </i18n-t>

        <div class="data-card">
          <table class="data-table data-table--cards">
            <thead>
              <tr>
                <th scope="col">{{ t('marcas.numeros_th_canal') }}</th>
                <th scope="col">{{ t('marcas.numeros_th_audiencia') }}</th>
                <th scope="col">{{ t('marcas.numeros_th_senal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in channels" :key="i">
                <td class="cell-head col-marker" :data-label="t('marcas.numeros_th_canal')">{{ rt(c.canal) }}</td>
                <td class="nums" :data-label="t('marcas.numeros_th_audiencia')">{{ rt(c.audiencia) }}</td>
                <td class="col-note cell-block" :data-label="t('marcas.numeros_th_senal')">{{ rt(c.senal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-4 text-xs text-tinta leading-relaxed">{{ t('marcas.numeros_foot') }}</p>
      </div>
    </section>

    <!-- ░░ 4 · QUIÉN TE ESCUCHA ░░ crema -->
    <section v-reveal class="section-spacing bg-cream" :aria-labelledby="'m-demo'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.demo_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.demo_title"
          tag="h2"
          id="m-demo"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.demo_title_em') }}</em></template>
        </i18n-t>

        <div class="grid md:grid-cols-3 gap-4 mb-8">
          <article v-for="(card, ci) in demoCards" :key="ci" class="card-base bg-cream-card">
            <h3 class="heading-display text-xl text-berenjena mb-4">{{ rt(card.title) }}</h3>
            <ul class="space-y-2.5">
              <li
                v-for="(line, li) in card.lines"
                :key="li"
                class="flex gap-2.5 text-sm text-tinta leading-relaxed"
              >
                <span class="font-mono text-miriam text-xs mt-0.5 shrink-0" aria-hidden="true">·</span>
                <span>{{ rt(line) }}</span>
              </li>
            </ul>
          </article>
        </div>

        <i18n-t keypath="marcas.demo_eco" tag="p" class="text-tinta leading-relaxed max-w-3xl">
          <template #b1><strong class="font-semibold text-berenjena">{{ t('marcas.demo_eco_b1') }}</strong></template>
        </i18n-t>
      </div>
    </section>

    <!-- ░░ 5 · LA PRUEBA DE QUE MI GENTE ACTÚA ░░ banda oscura -->
    <section
      v-reveal
      class="relative overflow-hidden section-spacing bg-berenjena"
      :aria-labelledby="'m-prueba'"
    >
      <div class="band-fx" aria-hidden="true">
        <div class="band-fx__stars"></div>
        <div class="band-fx__glow"></div>
      </div>
      <div class="section-wide relative z-10">
        <p class="dark-eyebrow mb-3">{{ t('marcas.prueba_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.prueba_title"
          tag="h2"
          id="m-prueba"
          class="heading-display text-3xl sm:text-4xl text-cream mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-coral">{{ t('marcas.prueba_title_em') }}</em></template>
        </i18n-t>

        <div class="grid sm:grid-cols-3 gap-7 mb-10">
          <div v-for="(s, i) in pruebaStats" :key="i">
            <p
              class="font-display font-semibold tracking-tight nums"
              :class="i === 0 ? 'text-coral' : 'text-cream'"
              style="font-size: clamp(2.25rem, 5.5vw, 3.25rem); line-height: 0.95"
            >
              {{ rt(s.value) }}
            </p>
            <p class="mt-2 font-mono uppercase text-[11px] tracking-[0.06em] text-cream/70 leading-snug">
              {{ rt(s.caption) }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl p-6 sm:p-7 mb-8 bg-berenjena-2 dark-card">
          <h3 class="font-display font-semibold text-cream text-lg mb-3">{{ t('marcas.prueba_carlos_title') }}</h3>
          <i18n-t keypath="marcas.prueba_carlos_p" tag="p" class="text-cream/85 leading-relaxed">
            <template #b1><strong class="font-semibold text-cream">{{ t('marcas.prueba_carlos_p_b1') }}</strong></template>
            <template #b2><strong class="font-semibold text-cream">{{ t('marcas.prueba_carlos_p_b2') }}</strong></template>
          </i18n-t>
        </div>

        <h3 class="font-display font-semibold text-cream text-lg mb-4">{{ t('marcas.prueba_virals_title') }}</h3>
        <div class="data-card mb-8">
          <table class="data-table data-table--cards">
            <thead>
              <tr>
                <th scope="col">{{ t('marcas.prueba_th_post') }}</th>
                <th scope="col" class="th-right">{{ t('marcas.prueba_th_plays') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, i) in virals" :key="i">
                <td class="cell-head col-note" :data-label="t('marcas.prueba_th_post')">
                  {{ rt(v.post) }}
                  <span
                    v-if="i === 0"
                    class="ml-2 inline-block align-middle font-mono uppercase text-[9px] tracking-[0.06em] px-1.5 py-0.5 rounded bg-miriam-soft text-berenjena"
                  >{{ t('marcas.prueba_origen_tag') }}</span>
                </td>
                <td class="nums td-right" :data-label="t('marcas.prueba_th_plays')">{{ rt(v.plays) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rounded-2xl p-6 sm:p-7 bg-berenjena-2 dark-card">
          <h3 class="font-display font-semibold text-cream text-lg mb-3">{{ t('marcas.prueba_linkedin_title') }}</h3>
          <blockquote class="font-display italic text-cream/90 text-lg leading-relaxed mb-3">
            {{ t('marcas.prueba_linkedin_quote') }}
          </blockquote>
          <p class="font-mono text-xs text-cream/70 tracking-wide nums">{{ t('marcas.prueba_linkedin_stats') }}</p>
        </div>
      </div>
    </section>

    <!-- ░░ 6 · QUÉ GANAS TÚ ░░ crema-card -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'m-ganas'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.ganas_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.ganas_title"
          tag="h2"
          id="m-ganas"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.ganas_title_em') }}</em></template>
        </i18n-t>

        <div class="grid sm:grid-cols-2 gap-4 mb-8">
          <article v-for="(card, ci) in ganasCards" :key="ci" class="card-base bg-cream">
            <h3 class="heading-display text-xl text-berenjena mb-2">{{ rt(card.title) }}</h3>
            <p class="text-sm text-tinta leading-relaxed">{{ rt(card.desc) }}</p>
          </article>
        </div>

        <i18n-t keypath="marcas.ganas_fit" tag="p" class="text-tinta leading-relaxed mb-8 max-w-3xl">
          <template #b1><strong class="font-semibold text-berenjena">{{ t('marcas.ganas_fit_b1') }}</strong></template>
          <template #b2><strong class="font-semibold text-berenjena">{{ t('marcas.ganas_fit_b2') }}</strong></template>
          <template #b3><strong class="font-semibold text-berenjena">{{ t('marcas.ganas_fit_b3') }}</strong></template>
          <template #b4><strong class="font-semibold text-berenjena">{{ t('marcas.ganas_fit_b4') }}</strong></template>
        </i18n-t>

        <div class="rounded-2xl p-6 sm:p-8 bg-berenjena">
          <i18n-t keypath="marcas.ganas_model" tag="p" class="text-cream/90 leading-relaxed max-w-3xl">
            <template #b1><strong class="font-semibold text-miriam-claro">{{ t('marcas.ganas_model_b1') }}</strong></template>
            <template #b2><strong class="font-semibold text-cream">{{ t('marcas.ganas_model_b2') }}</strong></template>
            <template #em><em class="italic text-cream">{{ t('marcas.ganas_model_em') }}</em></template>
          </i18n-t>
        </div>
      </div>
    </section>

    <!-- ░░ 7 · MARCAS QUE YA SE ATREVIERON ░░ crema -->
    <section v-reveal class="section-spacing bg-cream" :aria-labelledby="'m-partners'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.partners_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.partners_title"
          tag="h2"
          id="m-partners"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.partners_title_em') }}</em></template>
        </i18n-t>

        <div class="flex flex-wrap gap-3 mb-8">
          <a
            v-for="(p, i) in partners"
            :key="i"
            :href="rt(p.url)"
            target="_blank"
            rel="noopener"
            class="partner-pill"
          >{{ rt(p.label) }} →</a>
        </div>

        <div class="grid sm:grid-cols-2 gap-4 mb-8">
          <figure
            v-for="(q, i) in quotes"
            :key="i"
            class="card-base bg-cream-card m-0 quote-card"
          >
            <blockquote class="font-display italic text-berenjena text-lg leading-relaxed mb-3">{{ rt(q.quote) }}</blockquote>
            <figcaption class="font-mono text-xs text-tinta tracking-wide">{{ rt(q.author) }}</figcaption>
          </figure>
        </div>

        <!-- Caso en prensa · tira de medios (mismo componente y enlaces que la home) -->
        <div class="flex flex-wrap items-baseline gap-x-7 gap-y-3">
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta self-center">
            {{ t('home.s9_strip_label') }}
          </span>
          <a :href="pressElPais" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">El País<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
          <a :href="pressMurcia" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">La Opinión de Murcia<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
          <a :href="pressLa7" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">La 7<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
        </div>
      </div>
    </section>

    <!-- ░░ 8 · CIERRE / CTA ░░ banda oscura, centrada -->
    <section
      v-reveal
      class="relative overflow-hidden section-spacing bg-berenjena"
      :aria-labelledby="'m-cta'"
    >
      <div class="band-fx" aria-hidden="true">
        <div class="band-fx__stars"></div>
        <div class="band-fx__glow"></div>
      </div>
      <div class="section-wide relative z-10">
        <div class="max-w-2xl mx-auto text-center">
          <p class="dark-eyebrow mb-3">{{ t('marcas.cta_eyebrow') }}</p>
          <i18n-t
            keypath="marcas.cta_title"
            tag="h2"
            id="m-cta"
            class="heading-display text-3xl sm:text-4xl text-cream mb-4"
            style="letter-spacing: -0.02em"
          >
            <template #em><em class="italic text-coral">{{ t('marcas.cta_title_em') }}</em></template>
          </i18n-t>
          <p class="text-lg text-cream/85 leading-relaxed mb-8">{{ t('marcas.cta_p') }}</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <NuxtLink :to="localePath('contacto')" class="btn-cta" style="text-decoration: none">
              {{ t('marcas.cta_button') }}
            </NuxtLink>
            <a
              href="https://instagram.com/miriamgonp"
              target="_blank"
              rel="noopener"
              translate="no"
              class="font-mono text-sm text-cream/80 hover:text-cream underline underline-offset-4 decoration-cream/40 hover:decoration-cream transition-colors"
            >{{ t('marcas.cta_secondary') }}</a>
          </div>
          <p class="font-display italic text-cream/80 text-lg">{{ t('marcas.cta_tagline') }}</p>
        </div>
      </div>
    </section>

    <!-- Botón flotante · descarga el deck en PDF (oculto en impresión) -->
    <a href="/dossier-marcas-deck.pdf" download class="m-print-btn no-print" style="text-decoration: none" :aria-label="t('marcas.print_aria')">
      {{ t('marcas.print') }}
    </a>
  </div>
</template>

<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// ?marca=Nombre → edición personalizada en el hero. Se lee en cliente (la página
// es estática); se sanea (trim) y se acota a ~40 caracteres.
const marca = computed(() => {
  const raw = route.query.marca
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return ''
  return String(value).trim().slice(0, 40)
})

// Listas i18n (arrays en el JSON) — se resuelven hoja a hoja con rt() en el template.
const badges = computed(() => tm('marcas.historia_badges') as unknown[])
const numerosStats = computed(() => tm('marcas.numeros_stats') as Record<string, unknown>[])
const channels = computed(() => tm('marcas.numeros_channels') as Record<string, unknown>[])
const demoCards = computed(() => tm('marcas.demo_cards') as Record<string, unknown>[])
const pruebaStats = computed(() => tm('marcas.prueba_stats') as Record<string, unknown>[])
const virals = computed(() => tm('marcas.prueba_virals') as Record<string, unknown>[])
const ganasCards = computed(() => tm('marcas.ganas_cards') as Record<string, unknown>[])
const partners = computed(() => tm('marcas.partners') as Record<string, unknown>[])
const quotes = computed(() => tm('marcas.partners_quotes') as Record<string, unknown>[])

// Cobertura de prensa real — mismos enlaces que la tira de medios de la home (index.vue)
const pressElPais = 'https://elpais.com/tecnologia/2026-04-23/asi-usa-una-paciente-con-cancer-metastasico-la-ia-para-entender-su-enfermedad-cual-es-el-mejor-metodo-para-hablar-de-salud-con-chatbots.html'
const pressMurcia = 'https://www.laopiniondemurcia.es/comunidad/2026/05/30/paciente-murciana-aguarda-nuevo-tratamiento-130816775.html'
const pressLa7 = 'https://www.instagram.com/p/DZDT2hIAMPU/?hl=es'

useSeoMeta({
  title: () => t('marcas.meta_title'),
  description: () => t('marcas.meta_description'),
  ogTitle: () => t('marcas.meta_title'),
  ogDescription: () => t('marcas.og_description'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('marcas.meta_title'),
  twitterDescription: () => t('marcas.og_description'),
})

defineOgImage('Default.takumi', {
  title: () => t('marcas.meta_title'),
  description: () =>
    locale.value === 'es'
      ? 'Co-creación real para marcas. Una comunidad de ~248K que actúa.'
      : 'Real co-creation for brands. A ~248K community that acts.',
})
</script>

<script lang="ts">
export default { name: 'MarcasPage' }
</script>

<style scoped>
/* Eyebrow sobre banda oscura: el .eyebrow del DS es text-tinta (oscuro) e
   invisible aquí; usamos crema atenuada (≈6:1 sobre berenjena). */
.dark-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(250, 246, 240, 0.7);
  display: block;
}

/* Anillo decorativo del avatar (violeta-soft translúcido). */
.avatar-ring {
  border: 3px solid rgba(232, 212, 237, 0.5);
  box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.6);
}

/* Nombre de la edición personalizada — subrayado discontinuo. */
.marca-name {
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgba(199, 125, 210, 0.8);
  text-underline-offset: 4px;
}

/* Tarjetas elevadas sobre las bandas oscuras (cajas Carlos Roca / LinkedIn). */
.dark-card {
  border: 1px solid rgba(232, 212, 237, 0.14);
}

/* Pills de marcas partner — identidad violeta; se «encienden» a violeta sólido
   al pasar/enfocar (señal clara de enlace). */
.partner-pill {
  display: inline-flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: #e8d4ed;
  color: #2d1b3d;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.partner-pill:hover,
.partner-pill:focus-visible {
  background: #9d44ab;
  color: #faf6f0;
  transform: translateY(-1px);
}

.quote-card {
  border-left: 4px solid #9d44ab;
}

/* Alineación a la derecha de la columna de reproducciones (solo ≥sm; en móvil
   la tabla colapsa a tarjetas etiqueta/valor y manda el layout de cards). */
@media (min-width: 640px) {
  .th-right,
  .td-right {
    text-align: right;
  }
}

/* ── Cielo decorativo de las bandas oscuras ──────────────────────────────────
   Resplandor violeta centrado (zona tranquila tras el texto) + estrellas tenues
   repartidas hacia los bordes. Estático (sin animación) → seguro siempre y sin
   coste de contraste sobre el texto crema. */
.band-fx {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.band-fx__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(58% 64% at 50% 42%, rgba(157, 68, 171, 0.22), transparent 72%);
}
.band-fx__stars {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-image:
    radial-gradient(1.6px 1.6px at 8% 18%, rgba(232, 212, 237, 0.55), transparent 60%),
    radial-gradient(1.2px 1.2px at 16% 72%, rgba(250, 246, 240, 0.4), transparent 60%),
    radial-gradient(1.4px 1.4px at 24% 30%, rgba(232, 212, 237, 0.45), transparent 60%),
    radial-gradient(1px 1px at 33% 86%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.5px 1.5px at 45% 10%, rgba(250, 246, 240, 0.45), transparent 60%),
    radial-gradient(1px 1px at 57% 90%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.6px 1.6px at 68% 14%, rgba(232, 212, 237, 0.5), transparent 60%),
    radial-gradient(1.2px 1.2px at 78% 78%, rgba(250, 246, 240, 0.4), transparent 60%),
    radial-gradient(1.4px 1.4px at 86% 34%, rgba(232, 212, 237, 0.48), transparent 60%),
    radial-gradient(1px 1px at 93% 64%, rgba(232, 212, 237, 0.42), transparent 60%),
    radial-gradient(1.3px 1.3px at 11% 48%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.1px 1.1px at 90% 12%, rgba(250, 246, 240, 0.4), transparent 60%);
}

/* Botón flotante de impresión — sobre la barra de apoyo móvil (<lg). */
.m-print-btn {
  position: fixed;
  right: 1rem;
  bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.95rem;
  border-radius: 999px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 28px -10px rgba(45, 27, 61, 0.6);
  transition: transform 0.15s ease, background 0.2s ease;
}
.m-print-btn:hover {
  background: #3d2752;
  transform: translateY(-2px);
}
@media (min-width: 1024px) {
  .m-print-btn {
    right: 1.5rem;
    bottom: 1.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .m-print-btn:hover {
    transform: none;
  }
}

/* Impresión: fuera el cielo decorativo y el botón; secciones sin cortarse.
   (El cromo global —nav/footer/barra— ya lo oculta app/assets/css/main.css.) */
@media print {
  .no-print {
    display: none !important;
  }
  .band-fx {
    display: none !important;
  }
  section {
    break-inside: avoid;
  }
}
</style>
