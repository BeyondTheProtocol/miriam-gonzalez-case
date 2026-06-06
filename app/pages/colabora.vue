<template>
  <div>
    <!--
      ════════════════════════════════════════════════════════════
        Página /colabora · estrictamente las 6 recetas DS
        Una card = una historia = un acento.
        Sin border-lefts inventados, sin emoji-circles, sin
        miriam sobre cream-card. Solo lo que el design-system
        canon documenta.
      ════════════════════════════════════════════════════════════
    -->

    <!-- ░░ HERO ░░ bg-cream · receta cita = card 5 (violet-soft) -->
    <section class="section-spacing bg-cream" :aria-label="$t('collaborate.title')">
      <div class="section-container max-w-4xl">
        <p class="eyebrow mb-4 block">{{ $t('collaborate.eyebrow') }}</p>
        <h1
          class="heading-display text-4xl sm:text-5xl text-berenjena mb-5 max-w-3xl"
          style="letter-spacing: -0.03em; font-weight: 500"
        >
          {{ $t('collaborate.hero_title') }}
        </h1>
        <p class="text-lg text-tinta leading-relaxed mb-10 max-w-2xl">
          {{ $t('collaborate.hero_intro') }}
        </p>

        <!-- Receta canon nº5: violet-soft + berenjena italic (cita / principio) -->
        <aside
          class="rounded-card max-w-2xl"
          style="background: #e8d4ed; padding: 28px"
        >
          <p
            class="font-mono uppercase mb-2"
            style="font-size: 11px; letter-spacing: 0.08em; color: #2d1b3d"
          >
            {{ $t('collaborate.hero_claim_label') }}
          </p>
          <p
            class="font-display italic text-berenjena"
            style="font-size: 24px; line-height: 1.25; font-weight: 500"
          >
            {{ $t('collaborate.hero_principle') }}
          </p>
        </aside>

        <p class="text-sm text-tinta leading-relaxed mt-10 max-w-2xl">
          {{ $t('collaborate.hero_context') }}
          <NuxtLink :to="localePath('index')" class="link-inline">
            helpmiriam.com
          </NuxtLink>.
        </p>
      </div>
    </section>

    <!-- ░░ 5 PERFILES ░░ bg-cream-card · cards unificadas sobre crema -->
    <section class="bg-cream-card section-spacing" :aria-labelledby="'profiles-title'">
      <div class="section-container max-w-6xl">
        <p class="eyebrow mb-3 block">{{ $t('collaborate.profiles_eyebrow') }}</p>
        <h2
          id="profiles-title"
          class="heading-display text-berenjena mb-3"
          style="font-size: clamp(28px, 4vw, 40px); letter-spacing: -0.02em; font-weight: 500"
        >
          {{ $t('collaborate.profiles_title') }}
        </h2>
        <p class="text-tinta leading-relaxed mb-10 max-w-2xl">
          {{ $t('collaborate.profiles_sub') }}
        </p>

        <div class="grid md:grid-cols-2 gap-4">
          <!-- ─ Card 1 (canon #1) — crema + berenjena · clínica ─ -->
          <article
            class="flex flex-col rounded-card"
            style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
          >
            <p class="profile-eyebrow">{{ $t('collaborate.profile1_tag') }}</p>
            <h3 class="profile-title">{{ $t('collaborate.profile1_title') }}</h3>
            <ul class="profile-list">
              <li v-for="(item, i) in arr('collaborate.profile1_list')" :key="i">{{ item }}</li>
            </ul>
            <div class="mt-auto pt-2">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile1_cta_label') }}
              </NuxtLink>
            </div>
          </article>

          <!-- ─ Card 2 (canon #4) — crema + berenjena + coral CTA · financiación (único coral) ─ -->
          <article
            class="flex flex-col rounded-card"
            style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
          >
            <p class="profile-eyebrow">{{ $t('collaborate.profile2_tag') }}</p>
            <h3 class="profile-title">{{ $t('collaborate.profile2_title') }}</h3>
            <p class="profile-body">{{ $t('collaborate.profile2_text') }}</p>
            <div class="mt-auto pt-2">
              <a
                :href="GOFUNDME"
                target="_blank"
                rel="noopener"
                class="btn-cta w-full justify-center"
                style="text-decoration: none"
              >
                <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile2_cta_label') }}
              </a>
            </div>
          </article>

          <!-- ─ Card 3 — difusión ─ -->
          <article
            class="flex flex-col rounded-card"
            style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
          >
            <p class="profile-eyebrow">{{ $t('collaborate.profile3_tag') }}</p>
            <h3 class="profile-title">{{ $t('collaborate.profile3_title') }}</h3>
            <p class="profile-body">{{ $t('collaborate.profile3_text') }}</p>
            <div class="mt-auto pt-2">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile3_cta_label') }}
              </NuxtLink>
            </div>
          </article>

          <!-- ─ Card 4 — tech & IA ─ -->
          <article
            class="flex flex-col rounded-card"
            style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
          >
            <p class="profile-eyebrow">{{ $t('collaborate.profile4_tag') }}</p>
            <h3 class="profile-title">{{ $t('collaborate.profile4_title') }}</h3>
            <p class="profile-body">{{ $t('collaborate.profile4_text') }}</p>
            <ul class="space-y-1.5 mb-5">
              <li v-for="(lnk, i) in arrObj('collaborate.profile4_links')" :key="i">
                <a
                  :href="lnk.url"
                  target="_blank"
                  rel="noopener"
                  class="font-mono text-berenjena"
                  style="font-size: 13px; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(45,27,61,0.3)"
                >
                  → {{ lnk.label }}
                </a>
              </li>
            </ul>
            <div class="mt-auto pt-2">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary w-full justify-center">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile4_cta_label') }}
              </NuxtLink>
            </div>
          </article>

          <!-- ─ Card 5 — apoyo mutuo (full-width) ─ -->
          <article
            class="md:col-span-2 flex flex-col rounded-card"
            style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
          >
            <p class="profile-eyebrow">{{ $t('collaborate.profile5_tag') }}</p>
            <h3 class="profile-title">{{ $t('collaborate.profile5_title') }}</h3>
            <p class="profile-body max-w-3xl">{{ $t('collaborate.profile5_text') }}</p>
            <div class="mt-auto pt-2">
              <NuxtLink :to="localePath('contacto')" class="btn-secondary">
                <Icon name="ph:envelope-simple-fill" class="w-4 h-4" aria-hidden="true" />
                {{ $t('collaborate.profile5_cta_label') }}
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ░░ LO QUE NO SOMOS ░░ bg-cream · receta canon nº2 invertida (berenjena oscura) -->
    <section class="section-spacing bg-cream" :aria-labelledby="'notus-title'">
      <div class="section-container max-w-4xl">
        <div
          class="rounded-card"
          style="background: #2d1b3d; padding: 32px sm:40px; padding: 40px"
        >
          <p
            class="font-mono uppercase mb-3"
            style="font-size: 11px; letter-spacing: 0.08em; color: #e8d4ed"
          >
            {{ $t('collaborate.notus_eyebrow') }}
          </p>
          <h2
            id="notus-title"
            class="font-display mb-8"
            style="font-size: clamp(28px, 4vw, 36px); line-height: 1.15; font-weight: 500; color: #faf6f0; letter-spacing: -0.02em"
          >
            {{ $t('collaborate.notus_title') }}
          </h2>

          <ul class="space-y-4">
            <li
              v-for="(item, i) in notUsList"
              :key="i"
              class="flex items-start gap-4"
              style="color: rgba(250,246,240,0.92); font-size: 15px; line-height: 1.6"
            >
              <span
                class="shrink-0 mt-0.5 inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px]"
                style="background: rgba(255,107,71,0.18)"
                aria-hidden="true"
              >
                <Icon name="ph:x-bold" class="w-3.5 h-3.5 text-coral" />
              </span>
              <span>{{ item }}</span>
            </li>
          </ul>

          <p
            class="font-mono mt-8 pt-6"
            style="font-size: 10px; color: rgba(250,246,240,0.6); border-top: 1px solid rgba(250,246,240,0.15)"
          >
            berenjena + crema · 14.6:1 · AAA
          </p>
        </div>
      </div>
    </section>

    <!-- ░░ ENLACES RÁPIDOS ░░ bg-cream-card · receta canon nº6 (panel neutro) -->
    <section class="section-spacing bg-cream-card" :aria-labelledby="'links-title'">
      <div class="section-container max-w-4xl">
        <p class="eyebrow mb-3 block">{{ $t('collaborate.links_eyebrow') }}</p>
        <h2
          id="links-title"
          class="heading-display text-berenjena mb-3"
          style="font-size: clamp(28px, 4vw, 36px); letter-spacing: -0.02em; font-weight: 500"
        >
          {{ $t('collaborate.links_title') }}
        </h2>
        <p class="text-tinta leading-relaxed mb-8 max-w-2xl">
          {{ $t('collaborate.links_sub') }}
        </p>

        <div
          class="rounded-card"
          style="background: #faf6f0; padding: 28px; border: 1px solid rgba(45,27,61,0.08)"
        >
          <ul class="grid sm:grid-cols-2 gap-x-10 gap-y-3">
            <li v-for="lnk in quickLinks" :key="lnk.url" class="flex items-baseline gap-3">
              <span
                class="font-mono shrink-0"
                style="font-size: 11px; color: #3a3340; min-width: 18px"
                aria-hidden="true"
              >→</span>
              <NuxtLink
                v-if="!lnk.external"
                :to="lnk.url"
                class="link-underline"
                style="font-size: 14px"
              >
                {{ lnk.label }}
              </NuxtLink>
              <a
                v-else
                :href="lnk.url"
                target="_blank"
                rel="noopener"
                class="link-underline"
                style="font-size: 14px"
              >
                {{ lnk.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- firma: solo permitida sobre bg-cream-card en mono tinta; firma miriam queda fuera de la card -->
        <p
          class="font-mono mt-6 text-center"
          style="font-size: 12px; color: #3a3340; letter-spacing: 0.04em"
        >
          {{ $t('collaborate.links_signature') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()

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

const notUsList = computed(() => arr('collaborate.notus_list'))

interface QuickLink { label: string; url: string; external: boolean }
const quickLinks = computed<QuickLink[]>(() => {
  const sciencePath = locale.value === 'es' ? '/ciencia' : '/en/science'
  const timelinePath = locale.value === 'es' ? '/timeline' : '/en/timeline'
  const homePath = locale.value === 'es' ? '/' : '/en'
  return [
    { label: 'helpmiriam.com', url: homePath, external: false },
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

<style scoped>
.profile-eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #3a3340;
  margin: 0 0 14px;
}
.profile-eyebrow--violet {
  color: #2d1b3d;
}
.profile-title {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 24px;
  line-height: 1.15;
  letter-spacing: -0.01em;
  color: #2d1b3d;
  margin: 0 0 14px;
}
.profile-body {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(45, 27, 61, 0.85);
  margin: 0 0 18px;
}
.profile-list {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(45, 27, 61, 0.85);
}
.profile-list li {
  position: relative;
  padding-left: 18px;
  margin-bottom: 8px;
}
.profile-list li::before {
  content: '·';
  position: absolute;
  left: 4px;
  top: -2px;
  color: #2d1b3d;
  font-weight: 700;
  font-size: 18px;
  line-height: 1;
}
</style>
