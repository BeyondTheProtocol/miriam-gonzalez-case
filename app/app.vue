<template>
  <NuxtLoadingIndicator color="#a44db2" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Splash de bienvenida — solo cliente y una vez por sesión; el contenido
       va SSR debajo (no bloquea SEO ni navegación). Con reduced-motion no sale. -->
  <ClientOnly>
    <div v-if="showSplash" class="app-splash" :data-hide="hideSplash" aria-hidden="true">
      <svg class="app-splash__mark" viewBox="0 0 240 240">
        <path class="app-splash__star" d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
        <path class="app-splash__star s2" d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
        <path class="app-splash__star s3" d="M55.05 44.24 L57.94 49.85 L63.55 52.74 L57.94 55.63 L55.05 61.24 L52.16 55.63 L46.55 52.74 L52.16 49.85 Z" fill="#9d44ab" opacity="0.5" />
        <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
        <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
      </svg>
      <span class="app-splash__word" translate="no">help<span class="firma">miriam</span><span class="tld">.com</span></span>
      <span class="app-splash__bar" />
    </div>
  </ClientOnly>

  <!-- Filtro duotono berenjena→crema para fotos (.pic.duotone). Global y oculto. -->
  <svg width="0" height="0" style="position: absolute" aria-hidden="true" focusable="false">
    <defs>
      <filter id="duotone-berenjena">
        <feColorMatrix
          type="matrix"
          values="0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0.299 0.587 0.114 0 0
                  0     0     0     1 0"
        />
        <feComponentTransfer>
          <feFuncR tableValues="0.176 0.980" />
          <feFuncG tableValues="0.106 0.965" />
          <feFuncB tableValues="0.239 0.941" />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
</template>

<script setup lang="ts">
// El idioma lo gestiona @nuxtjs/i18n: detección del navegador en la 1ª visita
// (detectBrowserLanguage + cookie) y cambio manual vía setLocale (SiteNav).
// Sin redirects manuales aquí — pisaban la elección del usuario.

// Splash: solo en cliente, una vez por sesión, y nunca con reduced-motion.
const showSplash = ref(false)
const hideSplash = ref(false)

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce || sessionStorage.getItem('splash-seen')) return
  sessionStorage.setItem('splash-seen', '1')
  showSplash.value = true
  // Se mantiene un instante (animación de marca) y se desvanece.
  setTimeout(() => (hideSplash.value = true), 1200)
  setTimeout(() => (showSplash.value = false), 1750)
})
</script>
