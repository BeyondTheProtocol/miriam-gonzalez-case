<template>
  <li class="relative pl-8 pb-10 last:pb-0 group">
    <!-- Vertical line -->
    <div class="absolute left-[11px] top-3 bottom-0 w-px bg-ink-200 group-last:hidden" />

    <!-- Dot -->
    <div
      class="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center"
      :class="entry.highlight
        ? 'border-gold-400 bg-gold-100'
        : 'border-ink-300 bg-white'"
    >
      <div
        class="w-2 h-2 rounded-full"
        :class="entry.highlight ? 'bg-gold-500' : 'bg-ink-300'"
      />
    </div>

    <!-- Content -->
    <div>
      <time class="text-2xs font-mono text-ink-400 uppercase tracking-wider">
        {{ entry.date }}
      </time>
      <h3 class="font-display font-semibold text-ink-900 mt-1 mb-1.5 text-base">
        {{ entry.title }}
      </h3>
      <p class="text-sm text-ink-600 leading-relaxed">
        {{ entry.description }}
      </p>
      <img
        v-if="entry.image"
        :src="entry.image"
        alt=""
        class="mt-4 rounded-xl w-full max-w-sm object-cover"
      />
      <a
        v-if="entry.link"
        :href="entry.link"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1 mt-2 text-xs font-medium text-ocean-600 hover:text-ocean-800 transition-colors"
      >
        <Icon name="ph:arrow-up-right-bold" class="w-3 h-3" />
        {{ entry.linkLabel || 'Ver más' }}
      </a>
    </div>
  </li>
</template>

<script setup lang="ts">
defineProps<{
  entry: {
    date: string
    title: string
    description: string
    highlight?: boolean
    link?: string
    linkLabel?: string
    image?: string
  }
}>()
</script>
