<template>
  <!--
    Rediseño de arquitectura, F5 (23-oct-2026): la variante «home» (las siete tarjetas con minutos y pasos, los accesos
    directos y el resumen de 2 minutos) se fue con la nueva home, que pinta las cuatro puertas (Puertas.vue, utils/caminos.ts).
    Queda solo la de /colabora: el h2 `sr-only` que da nombre al landmark, el aviso de calma y los chips «por perfil». F10
    rehace /colabora con las cuatro puertas y este componente (y ProfileChips) se va con ella.

    La sección que envuelve este componente en /colabora (collaborate.profiles_*) ya aporta eyebrow + h2 + subtítulo; para
    no romper el landmark se conserva un h2 `sr-only` con el mismo id que referencia `aria-labelledby` de la <section>.
  -->
  <section class="pathways" :aria-labelledby="titleId">
    <h2 :id="titleId" class="sr-only">{{ $t('pathways.colabora_title') }}</h2>
    <p class="pathway-comfort measure" role="note">
      <Icon name="ph:leaf" class="pathway-comfort__icon" aria-hidden="true" />
      {{ $t('pathways.comfort') }}
    </p>

    <!-- Chips de salto a cada perfil (componente compartido con el footer global, ver ProfileChips.vue) -->
    <ProfileChips class="mt-6" />
  </section>
</template>

<script setup lang="ts">
// `variant` se conserva solo porque /colabora lo pasa (variant="colabora"); no hay otra.
withDefaults(defineProps<{ variant?: 'colabora' }>(), { variant: 'colabora' })

const titleId = 'pathways-title-colabora'
</script>
