<template>
  <main class="section-container max-w-2xl py-20 sm:py-28 text-center">
    <!-- Monograma redondo con constelación -->
    <svg class="mx-auto mb-8 w-24 h-24 sm:w-28 sm:h-28" viewBox="0 0 240 240" aria-hidden="true">
      <path d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
      <path d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
      <path d="M55.05 44.24 L57.94 49.85 L63.55 52.74 L57.94 55.63 L55.05 61.24 L52.16 55.63 L46.55 52.74 L52.16 49.85 Z" fill="#9d44ab" opacity="0.5" />
      <circle cx="182.5" cy="184.7" r="3.4" fill="#9d44ab" />
      <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
      <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
    </svg>

    <p class="eyebrow mb-4 block">{{ $t('thanks.eyebrow') }}</p>

    <i18n-t keypath="thanks.title" tag="h1" class="heading-display text-3xl sm:text-5xl text-berenjena" style="letter-spacing: -0.03em">
      <template #firma><span class="firma">{{ $t('thanks.firma') }}</span></template>
    </i18n-t>

    <p class="mt-6 text-lg text-tinta leading-relaxed max-w-xl mx-auto">
      {{ $t('thanks.lede') }}
    </p>

    <div class="mt-9 flex flex-wrap gap-3 justify-center">
      <button type="button" class="btn-dark" @click="share">
        <Icon :name="copied ? 'ph:check-bold' : 'ph:share-network-fill'" class="w-4 h-4" aria-hidden="true" />
        {{ copied ? $t('thanks.copied') : $t('thanks.share') }}
      </button>
      <NuxtLink :to="localePath('/')" class="btn-secondary">
        {{ $t('thanks.home') }}
      </NuxtLink>
    </div>

    <p class="mt-10 font-mono text-xs text-tinta">
      {{ $t('thanks.follow') }}
    </p>
  </main>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

// Página de cortesía post-donación: no debe indexarse.
useSeoMeta({
  title: () => `${t('thanks.eyebrow')} · helpmiriam.com`,
  robots: 'noindex, nofollow',
})

const copied = ref(false)

async function share() {
  if (!import.meta.client) return
  const url = window.location.origin + localePath('/')
  const data = { title: 'helpmiriam.com', text: t('thanks.share_text'), url }
  if (navigator.share) {
    try {
      await navigator.share(data)
    } catch {
      /* usuario canceló — sin acción */
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
      copied.value = true
      setTimeout(() => (copied.value = false), 2500)
    } catch {
      /* sin clipboard — sin acción */
    }
  }
}
</script>
