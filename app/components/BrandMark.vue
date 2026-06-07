<template>
  <!-- Marca: monograma «m» (Fraunces) + constelación de destellos (violeta miriam).
       El tamaño lo controla la clase que se pase (p. ej. w-11 h-11). Una sola
       fuente de verdad para cabecera y pie. -->
  <svg viewBox="0 0 240 240" aria-hidden="true" role="img">
    <path d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
    <path d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
    <path d="M55.05 44.24 L57.94 49.85 L63.55 52.74 L57.94 55.63 L55.05 61.24 L52.16 55.63 L46.55 52.74 L52.16 49.85 Z" fill="#9d44ab" opacity="0.5" />
    <circle cx="182.5" cy="184.7" r="3.4" fill="#9d44ab" />
    <circle cx="212.8" cy="134.7" r="2.3" fill="#9d44ab" opacity="0.5" />
    <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
    <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
  </svg>
</template>

<script lang="ts">
export default { name: 'BrandMark' }
</script>
