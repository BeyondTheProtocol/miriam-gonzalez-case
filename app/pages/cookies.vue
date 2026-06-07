<template>
  <main class="section-container max-w-3xl py-16 sm:py-20">
    <p class="eyebrow mb-3 block">Información legal</p>
    <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-2" style="letter-spacing: -0.03em">
      Política de cookies
    </h1>
    <p class="font-mono text-xs text-tinta mb-8">
      Última actualización · 6 de junio de 2026
    </p>

    <article class="prose prose-ink max-w-none">
      <h2>1 · Qué es una cookie</h2>
      <p>Una cookie es un pequeño archivo que un sitio web guarda en tu dispositivo para recordar información sobre tu visita (por ejemplo, tu idioma preferido).</p>

      <h2>2 · Cookies que usamos</h2>
      <ul>
        <li><strong>Técnicas / necesarias:</strong> recordar tu <strong>idioma</strong> (cookie <code>i18n_redirected</code>). Imprescindibles para el funcionamiento; no requieren consentimiento.</li>
        <li><strong>Analítica sin cookies:</strong> usamos Plausible Analytics, que mide visitas de forma agregada y <strong>no instala cookies ni rastrea</strong> a personas individuales.</li>
        <li><strong>De terceros:</strong> al pulsar enlaces externos (GoFundMe, redes sociales) esos sitios pueden instalar sus propias cookies, regidas por sus políticas.</li>
      </ul>

      <h2>3 · Gestión y desactivación</h2>
      <p>Puedes configurar o eliminar las cookies desde los ajustes de tu navegador. Desactivar las cookies técnicas puede afectar a la preferencia de idioma, pero no impide usar el sitio.</p>

      <h2>4 · Cambios</h2>
      <p>Si en el futuro incorporamos cookies adicionales (p. ej. de medición o publicidad), actualizaremos esta política y, cuando proceda, solicitaremos tu consentimiento previo.</p>

      <p>Más información en la <NuxtLink :to="localePath('privacidad')" class="link-inline">Política de privacidad</NuxtLink> y el <NuxtLink :to="localePath('aviso-legal')" class="link-inline">Aviso legal</NuxtLink>.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
useSeoMeta({ title: 'Política de cookies · helpmiriam.com', robots: 'noindex, nofollow' })
</script>
