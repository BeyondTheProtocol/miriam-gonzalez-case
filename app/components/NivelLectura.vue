<template>
  <!-- Divisor de público («Versión: para mentes curiosas · para profesionales»), uno para toda la web
       (dictamen `diseno`, 19-oct-2026). Dos modos:
       · `botones`: cambia el nivel dentro de la misma página (/ciencia, con su ?nivel). aria-pressed.
       · `enlaces`: cada versión es su propia página (/celula-a-celula y su explorador). <nav> con
         aria-current="page": la URL es la versión, así se comparte y «Atrás» funciona.
       Mismas clases .reading-level* de siempre: las usan test-ciencia-nivel.mjs y la regla de
       impresión de main.css. -->
  <nav v-if="modo === 'enlaces'" class="reading-level" :aria-label="aria">
    <span class="reading-level__hint" aria-hidden="true">{{ hint }}</span>
    <div class="reading-level__seg">
      <NuxtLink
        v-for="o in opciones"
        :key="o.id"
        :to="o.to!"
        class="reading-level__btn"
        :class="{ 'is-active': o.id === activo }"
        :aria-current="o.id === activo ? 'page' : undefined"
        @click="o.id !== activo && emit('cambia', o.id)"
      >
        {{ o.label }}
      </NuxtLink>
    </div>
  </nav>
  <div v-else class="reading-level" role="group" :aria-label="aria">
    <span class="reading-level__hint">{{ hint }}</span>
    <div class="reading-level__seg">
      <button
        v-for="o in opciones"
        :key="o.id"
        type="button"
        class="reading-level__btn"
        :class="{ 'is-active': o.id === activo }"
        :aria-pressed="o.id === activo"
        @click="emit('update:activo', o.id)"
      >
        {{ o.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  activo: string
  opciones: { id: string; label: string; to?: string }[]
  hint: string
  aria: string
  modo?: 'botones' | 'enlaces'
}>(), { modo: 'botones' })
const emit = defineEmits<{ 'update:activo': [id: string]; cambia: [id: string] }>()
</script>

<style scoped>
/* Paleta del sistema: berenjena para el activo, mono para las etiquetas. Diana de 44 px y contraste AA
   (diseno, 19-oct: el de /ciencia medía 40 px, el inactivo daba 4,03:1 y el borde 1,21:1). */
.reading-level {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
}
.reading-level__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--texto-3);
}
.reading-level__seg {
  /* Móvil: ocupa el ancho y las pastillas se reparten la fila (etiquetas largas como «Para mentes
     curiosas» no se salen: pasan a dos líneas dentro de su diana). En sm+ vuelve a tamaño automático. */
  display: flex;
  width: 100%;
  max-width: 440px;
  padding: 3px;
  border-radius: 999px;
  background: rgb(var(--color-text-rgb) / 0.05);
  border: 1px solid var(--trazo-interactivo);
}
.reading-level__btn {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.02em;
  line-height: 1.15;
  color: var(--texto-2);
  padding: 8px 12px;
  min-height: 44px;
  border-radius: 999px;
  transition: background 0.18s ease, color 0.18s ease;
}
@media (min-width: 640px) {
  .reading-level__seg {
    width: auto;
    max-width: none;
  }
  .reading-level__btn {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 9px 16px;
  }
}
.reading-level__btn:hover {
  color: var(--color-text);
}
.reading-level__btn.is-active {
  background: var(--color-text);
  color: var(--color-bg);
  font-weight: 600;
}
.reading-level__btn:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .reading-level__seg {
    border-color: CanvasText;
  }
  .reading-level__btn.is-active {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .reading-level__btn {
    transition: none;
  }
}
</style>
