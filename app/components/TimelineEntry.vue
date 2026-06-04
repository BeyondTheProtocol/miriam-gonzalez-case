<template>
  <li class="relative pl-8 pb-10 last:pb-0 group">
    <!-- Dot -->
    <div
      class="absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full flex items-center justify-center"
      :class="{ 'tl-dot-live': live }"
      :style="live
        ? 'background: #faf6f0; border: 2px solid #ff6b47'
        : entry.highlight
          ? 'background: #e8d4ed; border: 2px solid #a44db2'
          : 'background: #faf6f0; border: 2px solid rgba(45,27,61,0.20)'"
    >
      <div
        class="w-2 h-2 rounded-full"
        :style="live
          ? 'background: #ff6b47'
          : entry.highlight ? 'background: #a44db2' : 'background: rgba(45,27,61,0.30)'"
      />
    </div>

    <!-- Content -->
    <div>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <time class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta">
          {{ entry.date }}
        </time>
        <template v-if="entry.tag">
          <span class="text-tinta/40" aria-hidden="true">·</span>
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] font-semibold text-miriam">
            {{ entry.tag }}
          </span>
        </template>
        <span
          v-if="live"
          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
          style="background: rgba(255,107,71,0.12); color: #c2452a"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-coral" aria-hidden="true" />
          {{ $t('timeline.latest_badge') }}
        </span>
      </div>
      <h3 class="font-display font-semibold text-berenjena mt-1 mb-1.5 text-base">
        {{ entry.title }}
      </h3>
      <p class="text-sm text-tinta leading-relaxed">
        {{ entry.description }}
      </p>
      <img v-if="entry.image" :src="entry.image" :alt="entry.imageAlt || ''"
        class="mt-4 rounded-card w-full max-w-sm object-cover" />
      <a v-if="entry.link" :href="entry.link" target="_blank" rel="noopener"
        class="inline-flex items-center gap-1 mt-2 text-xs font-medium text-miriam hover:text-berenjena transition-colors"
        style="text-decoration: none">
        <Icon name="ph:arrow-up-right-bold" class="w-3 h-3" aria-hidden="true" />
        {{ entry.linkLabel || $t('timeline.read_more') }}
      </a>
    </div>
  </li>
</template>

<script setup lang="ts">
defineProps<{
  live?: boolean
  entry: {
    date: string
    tag?: string
    title: string
    description: string
    highlight?: boolean
    link?: string
    linkLabel?: string
    image?: string
    imageAlt?: string
  }
}>()
</script>

<style scoped>
.tl-dot-live {
  animation: tl-pulse 2s ease-in-out infinite;
}
@keyframes tl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 71, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(255, 107, 71, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .tl-dot-live { animation: none; }
}
</style>
