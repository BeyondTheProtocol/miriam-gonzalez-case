<template>
  <div class="mb-12">
    <!-- Miga hacia el índice de la sección (dictamen `diseno`, 14-oct-2026): cada
         herramienta lleva de vuelta a /herramientas. Opcional; solo enlace + icono SVG. -->
    <div v-if="parent" class="mb-2">
      <NuxtLink :to="parent.to" class="link-action -ml-1 min-h-[44px] pr-2 text-sm text-miriam">
        <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" aria-hidden="true" />
        {{ parent.label }}
      </NuxtLink>
    </div>
    <!-- Emblema opcional entre la miga y la etiqueta: así la miga queda siempre arriba,
         a la misma altura en todas las herramientas. -->
    <slot name="emblema" />
    <span v-if="tag" class="badge-genomic mb-4 inline-flex">{{ tag }}</span>
    <h1
      class="heading-display text-3xl sm:text-4xl lg:text-5xl text-berenjena mb-3"
      style="letter-spacing: -0.03em"
    >
      <slot name="title">{{ title }}</slot>
    </h1>
    <p v-if="subtitle" class="text-lg text-tinta max-w-2xl leading-relaxed">
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
}>()
</script>
