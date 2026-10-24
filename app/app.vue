<template>
  <NuxtLoadingIndicator color="var(--color-miriam)" :height="3" />
  <!-- Anuncia el título de la página nueva al navegar (diseno, 19-oct): el divisor de célula a célula cambia de
       página, y sin esto el cambio era mudo para un lector de pantalla. -->
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// El idioma lo gestiona @nuxtjs/i18n por la URL (/ o /en), sin detección del
// navegador ni cookie; el cambio manual va por setLocale (SiteNav).
// Sin redirects manuales aquí — pisaban la elección del usuario.
</script>
