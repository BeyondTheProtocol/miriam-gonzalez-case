<template>
  <div class="section-wide py-16 sm:py-20">
    <!-- T3-LOTE1 (A16, 25-oct-2026): shell único (el H1 cae bajo el logo), cabecera v3 y la prosa en `.measure`, a la izquierda. El texto legal
         es el de antes, palabra por palabra: solo cambian el contenedor, los roles de titular y el aviso pendiente (`Aviso`, con su filete en
         vez del salmón con coral). -->
    <PageHeader variante="pagina" eyebrow="Información legal" title="Política de cookies">
      <p class="font-mono text-xs text-tinta mt-2">
        Última actualización · 20 de octubre de 2026
      </p>
    </PageHeader>

    <article class="prose prose-ink measure">
      <h2 class="h2-seccion">1 · Qué es una cookie</h2>
      <p>Las cookies son archivos con pequeñas cantidades de información que se descargan en el dispositivo del usuario cuando visita una página web o una aplicación. Sirven para recordar información sobre la visita (por ejemplo, el idioma preferido). Puedes configurar tu navegador para modificar o bloquear las cookies que envía este sitio sin que ello te impida acceder a sus contenidos.</p>
      <p>Las cookies se pueden clasificar según varios criterios:</p>
      <ul>
        <li><strong>Según quién las envía:</strong> <em>propias</em>, si se envían desde un dominio gestionado por Beyond the Protocol; <em>de terceros</em>, si las envía un dominio gestionado por otra entidad, que trata los datos obtenidos a través de ellas.</li>
        <li><strong>Según cuánto duran:</strong> <em>de sesión</em>, que desaparecen al cerrar la sesión y abandonar el sitio; <em>permanentes</em>, que se conservan en el dispositivo durante un periodo definido por su responsable.</li>
        <li><strong>Según su finalidad:</strong> <em>técnicas o necesarias</em>, imprescindibles para el funcionamiento del sitio; <em>de preferencias</em>, que recuerdan opciones como el idioma; <em>de análisis</em>, que miden el uso del sitio; y <em>publicitarias</em>, que analizan hábitos de navegación para mostrar publicidad. Este sitio no instala ninguna de ellas (ver apartado 2).</li>
      </ul>

      <h2 class="h2-seccion">2 · Cookies que usamos</h2>
      <p><strong>Este sitio no instala cookies propias.</strong> El idioma lo indica la propia dirección de la página (helpmiriam.com en español, helpmiriam.com/en en inglés) y se cambia con el selector ES/EN, sin guardar nada en tu dispositivo.</p>
      <ul>
        <li><strong>Analítica sin cookies:</strong> usamos Plausible Analytics y Umami, que miden visitas de forma agregada y <strong>no instalan cookies ni rastrean</strong> a personas individuales.</li>
        <li><strong>De terceros:</strong> al pulsar enlaces externos (GoFundMe, redes sociales) esos sitios pueden instalar sus propias cookies, regidas por sus políticas.</li>
      </ul>

      <h2 class="h2-seccion">3 · Gestión y desactivación</h2>
      <p>Puedes configurar o eliminar las cookies desde los ajustes de tu navegador. Como este sitio no instala cookies propias, hacerlo no afecta a su funcionamiento.</p>

      <h2 class="h2-seccion">4 · Cambios</h2>
      <p>Si en el futuro incorporamos cookies adicionales (p. ej. de medición o publicidad), actualizaremos esta política y, cuando proceda, solicitaremos tu consentimiento previo.</p>

      <p>Más información en la <NuxtLink :to="localePath('privacidad')" class="link-inline">Política de privacidad</NuxtLink> y el <NuxtLink :to="localePath('aviso-legal')" class="link-inline">Aviso legal</NuxtLink>.</p>
    </article>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
useSeoMeta({ title: 'Política de cookies · helpmiriam.com', robots: 'noindex, nofollow' })
</script>
