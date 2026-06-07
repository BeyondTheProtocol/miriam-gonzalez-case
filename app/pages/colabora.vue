<template>
  <div>
    <!--
      ════════════════════════════════════════════════════════════
        Página /colabora · compuesta SOLO con clases del design-system
        (mismas que equipo/contacto/ciencia): .section-container,
        .section-wide, .card-base, .eyebrow, .heading-display, tokens
        de color (berenjena/tinta/cream/miriam/coral). Cero hex sueltos,
        cero font-size inline, cero tipografía propia.

        · v-reveal en cada sección (despliegue al scroll, respeta
          prefers-reduced-motion) — igual que home/timeline.
        · Cabecera de card con cuadradito de icono sólido + icono crema,
          el mismo patrón que las tarjetas de /contacto.
        · Financiación (único coral) es featured a ancho completo arriba:
          el camino principal destaca con cuadradito y filete coral.
      ════════════════════════════════════════════════════════════
    -->

    <!-- ░░ HERO ░░ bg-cream -->
    <section v-reveal class="section-spacing bg-cream" :aria-label="$t('collaborate.title')">
      <div class="section-container">
        <p class="eyebrow mb-4 block">{{ $t('collaborate.eyebrow') }}</p>
        <h1
          class="heading-display text-3xl sm:text-4xl lg:text-5xl text-berenjena mb-4 max-w-3xl"
          style="letter-spacing: -0.03em"
        >
          {{ $t('collaborate.hero_title') }}
        </h1>
        <p class="text-lg text-tinta leading-relaxed mb-10 max-w-2xl">
          {{ $t('collaborate.hero_intro') }}
        </p>

        <!-- Decisión 3·B: el hero NO lleva botón de donar; solo el espíritu.
             El bloque de financiación es el remate, al final de la página.
             Cita / principio: card-base en violet-soft (badge genómico del DS) -->
        <aside class="max-w-2xl pl-4" style="border-left: 2px solid #9d44ab">
          <p class="eyebrow mb-2 block">{{ $t('collaborate.hero_claim_label') }}</p>
          <p class="font-display italic font-medium text-berenjena text-xl leading-snug">
            {{ $t('collaborate.hero_principle') }}
          </p>
        </aside>

        <i18n-t
          keypath="collaborate.hero_context"
          tag="p"
          class="text-sm text-tinta leading-relaxed mt-10 max-w-2xl"
        >
          <template #science>
            <NuxtLink :to="localePath({ name: 'ciencia' })" class="link-inline">{{ $t('nav.science') }}</NuxtLink>
          </template>
          <template #timeline>
            <NuxtLink :to="localePath({ name: 'timeline' })" class="link-inline">{{ $t('nav.timeline') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>

    <!-- ░░ 5 PERFILES ░░ bg-cream-card · cards bg-cream para contraste -->
    <section v-reveal class="bg-cream-card section-spacing" :aria-labelledby="'profiles-title'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ $t('collaborate.profiles_eyebrow') }}</p>
        <h2
          id="profiles-title"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
          style="letter-spacing: -0.02em"
        >
          {{ $t('collaborate.profiles_title') }}
        </h2>
        <p class="text-tinta leading-relaxed mb-10 max-w-2xl">
          {{ $t('collaborate.profiles_sub') }}
        </p>

        <div class="grid md:grid-cols-2 gap-4">
          <!-- ─ Card 1 — revisión clínica ─ -->
          <article id="revision-clinica" class="card-base bg-cream flex flex-col scroll-mt-24">
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0" aria-hidden="true">
                <Icon name="ph:stethoscope" class="w-5 h-5 text-cream" />
              </span>
              <p class="eyebrow">{{ $t('collaborate.profile1_tag') }}</p>
            </div>
            <h3 class="heading-display text-xl text-berenjena mb-3">
              {{ $t('collaborate.profile1_title') }}
            </h3>
            <ul class="text-sm text-tinta leading-relaxed list-disc pl-5 space-y-1.5 mb-5 marker:text-berenjena">
              <li v-for="(item, i) in arr('collaborate.profile1_list')" :key="i">{{ item }}</li>
            </ul>
            <div class="mt-auto">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full h-12 justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile1_cta_label') }}
              </NuxtLink>
              <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('collaborate.profile1_cta_caption') }}</p>
            </div>
          </article>

          <!-- ─ Card 3 — difusión ─ -->
          <article id="alcance" class="card-base bg-cream flex flex-col scroll-mt-24">
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0" aria-hidden="true">
                <Icon name="ph:megaphone-simple-fill" class="w-5 h-5 text-cream" />
              </span>
              <p class="eyebrow">{{ $t('collaborate.profile3_tag') }}</p>
            </div>
            <h3 class="heading-display text-xl text-berenjena mb-3">
              {{ $t('collaborate.profile3_title') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-5">{{ $t('collaborate.profile3_text') }}</p>
            <div class="mt-auto">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full h-12 justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile3_cta_label') }}
              </NuxtLink>
              <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('collaborate.profile3_cta_caption') }}</p>
            </div>
          </article>

          <!-- ─ Card 4 — tech & IA ─ -->
          <article class="card-base bg-cream flex flex-col">
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0" aria-hidden="true">
                <Icon name="ph:flask-fill" class="w-5 h-5 text-cream" />
              </span>
              <p class="eyebrow">{{ $t('collaborate.profile4_tag') }}</p>
            </div>
            <h3 class="heading-display text-xl text-berenjena mb-3">
              {{ $t('collaborate.profile4_title') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-4">{{ $t('collaborate.profile4_text') }}</p>
            <ul class="space-y-1.5 mb-5">
              <li v-for="(lnk, i) in arrObj('collaborate.profile4_links')" :key="i">
                <a
                  :href="lnk.url"
                  target="_blank"
                  rel="noopener"
                  class="link-underline font-mono text-[13px]"
                >
                  → {{ lnk.label }}
                </a>
              </li>
            </ul>
            <div class="mt-auto">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full h-12 justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile4_cta_label') }}
              </NuxtLink>
              <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('collaborate.profile4_cta_caption') }}</p>
            </div>
          </article>

          <!-- ─ Card 5 — apoyo mutuo ─ -->
          <article class="card-base bg-cream flex flex-col">
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0" aria-hidden="true">
                <Icon name="ph:hands-praying-fill" class="w-5 h-5 text-cream" />
              </span>
              <p class="eyebrow">{{ $t('collaborate.profile5_tag') }}</p>
            </div>
            <h3 class="heading-display text-xl text-berenjena mb-3">
              {{ $t('collaborate.profile5_title') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-5">{{ $t('collaborate.profile5_text') }}</p>
            <div class="mt-auto">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full h-12 justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile5_cta_label') }}
              </NuxtLink>
              <p class="mt-2 text-xs text-tinta sm:min-h-[2.25rem]">{{ $t('collaborate.profile5_cta_caption') }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ░░ FINANCIAR ░░ bg-cream · remate destacado (Decisión 3·B: el dinero, al
         final). Único primario coral de la página. -->
    <section v-reveal class="section-spacing bg-cream" :aria-labelledby="'fund-title'">
      <div class="section-container">
        <div class="card-base bg-cream border-coral/40">
          <div class="flex items-center gap-4 mb-4">
            <span class="w-10 h-10 rounded-xl bg-coral flex items-center justify-center shrink-0" aria-hidden="true">
              <Icon name="ph:hand-heart-fill" class="w-5 h-5 text-berenjena" />
            </span>
            <p class="eyebrow">{{ $t('collaborate.profile2_tag') }}</p>
          </div>
          <h2
            id="fund-title"
            class="heading-display text-2xl sm:text-3xl text-berenjena mb-3"
            style="letter-spacing: -0.02em"
          >
            {{ $t('collaborate.profile2_title') }}
          </h2>
          <p class="text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ $t('collaborate.profile2_text') }}
          </p>
          <a
            :href="GOFUNDME"
            target="_blank"
            rel="noopener"
            @click="trackSupport('colabora_cierre')"
            data-support-cta
            class="btn-cta"
            style="text-decoration: none"
          >
            <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
            {{ $t('collaborate.profile2_cta_label') }}
          </a>
          <p class="mt-3 text-xs text-tinta">{{ $t('collaborate.profile2_cta_caption') }}</p>
        </div>
      </div>
    </section>

    <!-- ░░ ENLACES RÁPIDOS ░░ bg-cream-card · panel neutro -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'links-title'">
      <div class="section-container">
        <p class="eyebrow mb-3 block">{{ $t('collaborate.links_eyebrow') }}</p>
        <h2
          id="links-title"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
          style="letter-spacing: -0.02em"
        >
          {{ $t('collaborate.links_title') }}
        </h2>
        <p class="text-tinta leading-relaxed mb-8 max-w-2xl">
          {{ $t('collaborate.links_sub') }}
        </p>

        <div class="card-base bg-cream">
          <ul class="grid sm:grid-cols-2 gap-x-10 gap-y-3">
            <li v-for="lnk in quickLinks" :key="lnk.url" class="flex items-baseline gap-3">
              <span class="font-mono text-tinta text-[11px] shrink-0 min-w-[18px]" aria-hidden="true">→</span>
              <NuxtLink
                v-if="!lnk.external"
                :to="lnk.url"
                class="link-underline text-sm"
              >
                {{ lnk.label }}
              </NuxtLink>
              <a
                v-else
                :href="lnk.url"
                target="_blank"
                rel="noopener"
                class="link-underline text-sm"
              >
                {{ lnk.label }}
              </a>
            </li>
          </ul>
        </div>

        <p class="font-mono text-xs text-tinta tracking-wide mt-6 text-center">
          {{ $t('collaborate.links_signature') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const { trackSupport } = useSupport()

const GOFUNDME = 'https://gofund.me/3e25cae99'

function arr(key: string): string[] {
  const raw = tm(key) as unknown
  const list = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as Record<string, unknown>)
  return list.map((item) => rt(item as never))
}

function arrObj<T extends Record<string, string>>(key: string): T[] {
  const raw = tm(key) as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => {
    const out = {} as Record<string, string>
    for (const k of Object.keys(entry as Record<string, unknown>)) {
      out[k] = rt((entry as Record<string, unknown>)[k] as never)
    }
    return out as T
  })
}

interface QuickLink { label: string; url: string; external: boolean }
const quickLinks = computed<QuickLink[]>(() => {
  const sciencePath = locale.value === 'es' ? '/ciencia' : '/en/science'
  const timelinePath = locale.value === 'es' ? '/timeline' : '/en/timeline'
  const homePath = locale.value === 'es' ? '/' : '/en'
  return [
    { label: locale.value === 'es' ? 'Inicio' : 'Home', url: homePath, external: false },
    { label: locale.value === 'es' ? 'La ciencia' : 'The science', url: sciencePath, external: false },
    { label: 'Timeline', url: timelinePath, external: false },
    { label: 'Repo · GitHub', url: 'https://github.com/beyondtheprotocol/miriam-gonzalez-case', external: true },
    { label: 'GoFundMe · ' + GOFUNDME.replace('https://', ''), url: GOFUNDME, external: true },
    { label: '@miriamgonp · Instagram', url: 'https://instagram.com/miriamgonp', external: true },
    { label: '@miriamgonp · X', url: 'https://x.com/miriamgonp', external: true },
    { label: '@miriamgonp · TikTok', url: 'https://tiktok.com/@miriamgonp', external: true },
    { label: '@miriamgonp · YouTube', url: 'https://youtube.com/@miriamgonp', external: true },
    { label: '@miriamgonp · LinkedIn', url: 'https://linkedin.com/in/miriamgonp', external: true },
    { label: locale.value === 'es' ? 'Contacto' : 'Contact', url: localePath('contacto'), external: false },
  ]
})

useSeoMeta({
  title: () => t('collaborate.meta_title'),
  description: () => t('collaborate.meta_description'),
  ogTitle: () => t('collaborate.meta_title'),
  ogDescription: () => t('collaborate.meta_description'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('collaborate.meta_title'),
  twitterDescription: () => t('collaborate.meta_description'),
})

defineOgImage('Default.takumi', {
  title: () => t('collaborate.hero_title'),
  description: () =>
    locale.value === 'es'
      ? '5 formas concretas de mover el caso.'
      : '5 concrete ways to move the case forward.',
})
</script>

<script lang="ts">
export default { name: 'CollaboratePage' }
</script>
