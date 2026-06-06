<template>
  <div class="min-h-screen flex flex-col bg-cream text-berenjena">
    <!-- Cabecera mínima -->
    <header class="section-wide flex items-center justify-between h-16 sm:h-18" style="border-bottom: 1px solid rgba(45,27,61,0.08)">
      <button type="button" class="flex items-center gap-2.5" style="text-decoration: none" @click="goHome">
        <svg class="w-9 h-9 shrink-0" viewBox="0 0 240 240" aria-hidden="true">
          <path d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
          <path d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
          <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
          <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
        </svg>
        <span class="font-mono text-[11px] tracking-[0.04em] text-miriam" translate="no">helpmiriam.com</span>
      </button>
      <button type="button" class="font-mono text-xs text-tinta hover:text-miriam transition-colors" @click="goHome">
        ← {{ $t('nav.home') }}
      </button>
    </header>

    <!-- Contenido -->
    <main class="flex-1 grid place-items-center section-container py-16 text-center">
      <div class="max-w-xl mx-auto">
        <!-- Monograma con constelación titilante -->
        <svg class="mx-auto mb-9 w-24 h-24 sm:w-28 sm:h-28" viewBox="0 0 240 240" :aria-label="label">
          <path class="star" d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
          <path class="star s2" d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
          <path class="star s3" d="M55.05 44.24 L57.94 49.85 L63.55 52.74 L57.94 55.63 L55.05 61.24 L52.16 55.63 L46.55 52.74 L52.16 49.85 Z" fill="#9d44ab" opacity="0.5" />
          <circle class="dot" cx="182.5" cy="184.7" r="3.4" fill="#9d44ab" />
          <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
          <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
        </svg>

        <p class="eyebrow mb-4 block">
          <span class="font-semibold text-coral-deep">{{ code }}</span> · {{ label }}
        </p>

        <i18n-t :keypath="titleKey" tag="h1" class="heading-display text-3xl sm:text-4xl" style="letter-spacing: -0.03em">
          <template #firma><span class="firma">{{ $t(firmaKey) }}</span></template>
        </i18n-t>

        <p class="mt-5 text-tinta leading-relaxed max-w-md mx-auto">
          {{ $t(ledeKey) }}
        </p>

        <div class="mt-9 flex flex-wrap gap-3 justify-center">
          <template v-if="is404">
            <button type="button" class="btn-dark" @click="goHome">
              {{ $t('error.home') }}
              <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
            </button>
            <button type="button" class="btn-secondary" @click="goCase">
              {{ $t('error.case') }}
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn-dark" @click="retry">
              {{ $t('error.retry') }}
              <Icon name="ph:arrow-clockwise" class="w-4 h-4" aria-hidden="true" />
            </button>
            <button type="button" class="btn-secondary" @click="goHome">
              {{ $t('error.home') }}
            </button>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number } }>()
const { t } = useI18n()
const localePath = useLocalePath()

const is404 = computed(() => props.error?.statusCode === 404)
const code = computed(() => t(is404.value ? 'error.e404_code' : 'error.e500_code'))
const label = computed(() => t(is404.value ? 'error.e404_label' : 'error.e500_label'))
const titleKey = computed(() => (is404.value ? 'error.e404_title' : 'error.e500_title'))
const firmaKey = computed(() => (is404.value ? 'error.e404_firma' : 'error.e500_firma'))
const ledeKey = computed(() => (is404.value ? 'error.e404_lede' : 'error.e500_lede'))

// Las páginas de error no deben indexarse.
useHead({ meta: [{ name: 'robots', content: 'noindex' }] })

function goHome() {
  clearError({ redirect: localePath('/') })
}
function goCase() {
  clearError({ redirect: localePath({ name: 'ciencia' }) })
}
function retry() {
  if (import.meta.client) window.location.reload()
}
</script>

<style scoped>
/* Constelación titilante — solo si el usuario no pide menos movimiento. */
@media (prefers-reduced-motion: no-preference) {
  .star,
  .dot {
    transform-box: fill-box;
    transform-origin: center;
    animation: twinkle 2.6s ease-in-out infinite;
  }
  .star.s2 { animation-delay: 0.5s; }
  .star.s3 { animation-delay: 1.1s; }
  .dot { animation: twinkle 3.2s ease-in-out infinite 0.8s; }
}
@keyframes twinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.12); }
}
</style>
