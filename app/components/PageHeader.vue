<template>
  <div :class="compact ? 'mb-6 lg:flex lg:flex-wrap lg:items-center lg:gap-x-6' : 'mb-12'">
    <!-- Miga hacia el índice de la sección (dictamen `diseno`, 14-oct-2026): cada
         herramienta lleva de vuelta a /herramientas. Opcional; solo enlace + icono SVG.
         `compact` (opt-in, simuladores donde el contenido tiene que asomar al entrar): miga y etiqueta
         en una línea, H1 más pequeño y el subtítulo solo desde sm. -->
    <!-- compacto en escritorio: miga y etiqueta a la derecha del título, en la misma fila (el contenido sube una fila) -->
    <div v-if="parent || (compact && tag)" :class="compact ? 'mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 lg:order-2 lg:mb-0' : 'mb-2'">
      <NuxtLink v-if="parent" :to="parent.to" class="link-action -ml-1 min-h-[44px] pr-2 text-sm text-miriam">
        <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" aria-hidden="true" />
        {{ parent.label }}
      </NuxtLink>
      <span v-if="compact && tag" class="badge-genomic inline-flex">{{ tag }}</span>
    </div>
    <!-- Emblema opcional entre la miga y la etiqueta: así la miga queda siempre arriba,
         a la misma altura en todas las herramientas. -->
    <slot name="emblema" />
    <span v-if="tag && !compact" class="badge-genomic mb-4 inline-flex">{{ tag }}</span>
    <h1
      class="heading-display text-berenjena"
      :class="compact ? 'text-2xl sm:text-3xl lg:text-4xl mb-2 lg:order-1 lg:mb-0' : 'text-3xl sm:text-4xl lg:text-5xl mb-3'"
      style="letter-spacing: -0.03em"
    >
      <slot name="title">{{ title }}</slot>
    </h1>
    <!-- `fila` (opt-in): justo bajo el H1 en móvil y, en la cabecera compacta de escritorio, en la misma fila que la
         miga (p. ej. el divisor de público del explorador; diseno, 19-oct). -->
    <div v-if="$slots.fila" :class="compact ? 'mb-2 lg:order-2 lg:mb-0' : 'mb-4'">
      <slot name="fila" />
    </div>
    <p v-if="subtitle" class="text-tinta max-w-2xl leading-relaxed" :class="compact ? 'hidden sm:block text-base lg:order-3 lg:basis-full' : 'text-lg'">
      {{ subtitle }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  tag?: string
  parent?: { to: string; label: string }
  /** cabecera corta (opt-in): ver el comentario de la plantilla */
  compact?: boolean
}>()
</script>
