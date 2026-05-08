<template>
  <div class="mb-12">
    <span v-if="tag" class="tag-gold mb-4 inline-flex">{{ tag }}</span>
    <h1 class="heading-display text-3xl sm:text-4xl lg:text-5xl text-ink-950 mb-3">
      <slot name="title">{{ title }}</slot>
    </h1>
    <p v-if="subtitle" class="text-lg text-ink-700 max-w-2xl leading-relaxed">
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
}>()
</script>
