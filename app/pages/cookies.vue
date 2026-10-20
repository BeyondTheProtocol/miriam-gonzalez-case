<template>
  <main class="section-container max-w-3xl py-16 sm:py-20">
    <p class="eyebrow mb-3 block">Información legal</p>
    <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-2" style="letter-spacing: -0.03em">
      Política de cookies
    </h1>
    <p class="font-mono text-xs text-tinta mb-8">
      Última actualización · 20 de octubre de 2026
    </p>

    <article class="prose prose-ink max-w-none">
      <h2>1 · Qué es una cookie</h2>
      <p>Las cookies son archivos con pequeñas cantidades de información que se descargan en el dispositivo del usuario cuando visita una página web o una aplicación. Sirven para recordar información sobre la visita (por ejemplo, el idioma preferido). Puedes configurar tu navegador para modificar o bloquear las cookies que envía este sitio sin que ello te impida acceder a sus contenidos.</p>
      <p>Las cookies se pueden clasificar según varios criterios:</p>
      <ul>
        <li><strong>Según quién las envía:</strong> <em>propias</em>, si se envían desde un dominio gestionado por Beyond the Protocol; <em>de terceros</em>, si las envía un dominio gestionado por otra entidad, que trata los datos obtenidos a través de ellas.</li>
        <li><strong>Según cuánto duran:</strong> <em>de sesión</em>, que desaparecen al cerrar la sesión y abandonar el sitio; <em>permanentes</em>, que se conservan en el dispositivo durante un periodo definido por su responsable.</li>
        <li><strong>Según su finalidad:</strong> <em>técnicas o necesarias</em>, imprescindibles para el funcionamiento del sitio; <em>de preferencias</em>, que recuerdan opciones como el idioma; <em>de análisis</em>, que miden el uso del sitio; y <em>publicitarias</em>, que analizan hábitos de navegación para mostrar publicidad. Este sitio solo usa una cookie técnica de idioma (ver apartado 2).</li>
      </ul>

      <h2>2 · Cookies que usamos</h2>
      <ul>
        <li><strong>Técnicas / necesarias:</strong> recordar tu <strong>idioma</strong>. Imprescindible para el funcionamiento; no requiere consentimiento. Detalle:
          <ul>
            <li><strong>Nombre:</strong> <code>i18n_redirected</code></li>
            <li><strong>Propietario:</strong> propia (la genera el módulo nuxt-i18n del sitio)</li>
            <li><strong>Finalidad:</strong> recordar tu preferencia de idioma o redirigirte automáticamente a la versión del idioma detectado en tu navegador</li>
            <li><strong>Dato que guarda:</strong> el idioma de tu navegador</li>
            <li><strong>Caducidad:</strong> 1 año</li>
          </ul>
        </li>
        <li><strong>Analítica sin cookies:</strong> usamos Plausible Analytics y Umami, que miden visitas de forma agregada y <strong>no instalan cookies ni rastrean</strong> a personas individuales.</li>
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
