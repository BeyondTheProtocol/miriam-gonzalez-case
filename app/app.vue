<template>
  <NuxtLoadingIndicator color="#9d44ab" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

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
</script>
