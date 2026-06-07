<template>
  <li :id="live ? 'lo-ultimo' : undefined" class="relative pl-8 pb-9 last:pb-0 group scroll-mt-24">
    <!-- Dot · color por categoría (clinical/molecular/network); el más reciente
         destacado late en coral. `echo` = doble pulso de saludo al aterrizar
         desde "Lo último" del hero. -->
    <div
      class="tl-dot absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
      :class="{ 'tl-dot-live': live, 'tl-dot-echo': echo }"
      :style="dotStyle"
    >
      <div class="w-2 h-2 rounded-full transition-colors" :style="innerStyle" />
    </div>

    <!-- Content -->
    <div>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <time class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta">
          {{ entry.date }}
        </time>
        <template v-if="entry.tag">
          <span class="text-tinta/40" aria-hidden="true">·</span>
          <span
            class="font-mono uppercase text-[11px] tracking-[0.12em] font-semibold"
            :style="{ color: meta.accent }"
          >
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
        class="mt-4 rounded-card w-full max-w-sm object-cover" loading="lazy" decoding="async" />
      <a v-if="entry.link" :href="entry.link" target="_blank" rel="noopener"
        class="tl-link mt-3 inline-flex items-center gap-1.5 rounded-lg py-1.5 pr-2 text-xs font-medium text-miriam transition-colors">
        <Icon name="ph:arrow-up-right-bold" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        {{ entry.linkLabel || $t('timeline.read_more') }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
      </a>
    </div>
  </li>
</template>

<script setup lang="ts">
const props = defineProps<{
  live?: boolean
  echo?: boolean
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

const meta = computed(() => CATEGORY_META[categoryForTag(props.entry.tag)])

// El dot: vivo → coral; destacado → relleno suave + aro de su categoría;
// normal → crema con aro tenue. El interior lleva el acento de la categoría.
const dotStyle = computed(() => {
  if (props.live) return 'background:#faf6f0;border:2px solid #ff6b47'
  if (props.entry.highlight) return `background:${meta.value.soft};border:2px solid ${meta.value.accent}`
  return `background:#faf6f0;border:2px solid ${meta.value.ring}`
})
const innerStyle = computed(() => {
  if (props.live) return 'background:#ff6b47'
  if (props.entry.highlight) return `background:${meta.value.accent}`
  return `background:${meta.value.ring}`
})
</script>

<style scoped>
.tl-dot-live {
  animation: tl-pulse 2s ease-in-out infinite;
}
@keyframes tl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 71, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(255, 107, 71, 0); }
}
/* Eco de llegada: doble pulso más amplio, una sola vez, y vuelve a la calma. */
.tl-dot-echo {
  animation: tl-echo 1.2s ease-in-out 2;
}
@keyframes tl-echo {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 71, 0.5); }
  50% { box-shadow: 0 0 0 14px rgba(255, 107, 71, 0); }
}
/* Afordancia del enlace: leve realce de fondo al pasar/enfocar (toque cómodo). */
.tl-link:hover,
.tl-link:focus-visible {
  color: #2d1b3d;
  background: rgba(157, 68, 171, 0.08);
  outline: none;
}
.tl-link:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .tl-dot-live { animation: none; }
  .tl-dot-echo { animation: none; }
  .tl-dot { transition: none; }
}
</style>
