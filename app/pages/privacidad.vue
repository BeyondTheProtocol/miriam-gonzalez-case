<template>
  <main class="section-container max-w-3xl py-16 sm:py-20">
    <p class="eyebrow mb-3 block">Información legal</p>
    <h1 class="heading-display text-3xl sm:text-4xl text-berenjena mb-2" style="letter-spacing: -0.03em">
      Política de privacidad
    </h1>
    <p class="font-mono text-xs text-tinta mb-8">
      Última actualización · 14 de junio de 2026
    </p>

    <div class="alert-callout mb-10">
      <p class="alert-callout__title">
        <Icon name="ph:warning-circle-fill" class="w-4 h-4" aria-hidden="true" />
        Pendiente: NIF
      </p>
      Estructura conforme al RGPD (UE 2016/679) y la LOPDGDD. El NIF se añadirá al constituirse Beyond the Protocol; recomendamos revisión jurídica antes de publicar.
    </div>

    <article class="prose prose-ink max-w-none">
      <h2>1 · Responsable del tratamiento</h2>
      <ul>
        <li><strong>Responsable:</strong> Beyond the Protocol (iniciativa sin ánimo de lucro)</li>
        <li><strong>NIF:</strong> <span class="text-coral-deep">[pendiente — en proceso de constitución]</span></li>
        <li><strong>Contacto:</strong> beyondtheprotocolteam@gmail.com</li>
      </ul>

      <h2>2 · Datos que tratamos y con qué finalidad</h2>
      <p>Solo tratamos los datos que nos facilitas voluntariamente a través del formulario de contacto (nombre, email, perfil y mensaje), con la finalidad de <strong>responder a tu consulta</strong> y, en su caso, valorar una posible colaboración con el caso.</p>
      <p>Las donaciones se gestionan en plataformas de terceros (p. ej. GoFundMe); sus datos de pago se rigen por la política de privacidad de dichas plataformas, no por esta.</p>

      <h2>3 · Base jurídica</h2>
      <p>El tratamiento se basa en tu <strong>consentimiento</strong> (art. 6.1.a RGPD), que otorgas al enviar el formulario, y en el interés legítimo de atender tu comunicación.</p>

      <h2>4 · Conservación</h2>
      <p>Conservamos tus datos el tiempo necesario para atender tu solicitud y, después, durante los plazos legalmente exigibles. Cuando dejen de ser necesarios, se suprimen.</p>

      <h2>5 · Destinatarios y encargados del tratamiento</h2>
      <p>No vendemos ni cedemos tus datos, salvo obligación legal. Empleamos proveedores que actúan como encargados del tratamiento (art. 28 RGPD):</p>
      <ul>
        <li><strong>Netlify, Inc.</strong> (EE. UU., con cláusulas contractuales tipo) — alojamiento del sitio y gestión del formulario de contacto (Netlify Forms).</li>
        <li><strong>Plausible Analytics</strong> (UE) y <strong>Umami Cloud</strong> (UE) — analítica de visitas agregada, <strong>sin cookies</strong> y sin rastreo individual.</li>
        <li><strong>GoFundMe</strong> — plataforma de donación; los datos de pago se rigen por su propia política.</li>
      </ul>
      <p>Las tipografías se sirven <strong>desde nuestro propio dominio</strong> (auto-alojadas): no se cargan desde servidores de terceros ni se transfiere tu dirección IP a Google.</p>

      <h2>6 · Tus derechos</h2>
      <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a beyondtheprotocolteam@gmail.com. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>

      <h2>7 · Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no autorizados, pérdida o alteración.</p>

      <p>Para el uso de cookies, consulta la <NuxtLink :to="localePath('cookies')" class="link-inline">Política de cookies</NuxtLink>.</p>
    </article>
  </main>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
useSeoMeta({ title: 'Política de privacidad · helpmiriam.com', robots: 'noindex, nofollow' })
</script>
