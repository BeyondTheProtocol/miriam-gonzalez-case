<template>
  <div
    v-if="v3"
    class="cabecera-pagina"
    :class="[`cabecera-pagina--${variante ?? 'pagina'}`, { 'cabecera-pagina--centrada': align === 'center' }]"
  >
    <!-- Cabecera v3 (sistema v3, S4): se activa al pasar `variante`, `eyebrow`, `lede` o `align`. El H1 es SIEMPRE visible
         (nunca sr-only) y sale de la clase de rol .h1-pagina, que lleva dentro su tamaño y su tracking. El resto de props
         (title, subtitle, parent, el slot `fila`…) valen igual. Las páginas migran en las fases P2 a P11. -->
    <NuxtLink v-if="parent" :to="parent.to" class="link-action cabecera-pagina__miga text-miriam">
      <Icon name="ph:caret-left-bold" class="w-3.5 h-3.5" aria-hidden="true" />
      {{ parent.label }}
    </NuxtLink>
    <slot name="emblema" />
    <p v-if="eyebrow" class="eyebrow cabecera-pagina__eyebrow">{{ eyebrow }}</p>
    <h1 class="h1-pagina cabecera-pagina__titulo">
      <slot name="title">{{ title }}</slot>
    </h1>
    <div v-if="$slots.fila" class="cabecera-pagina__fila">
      <slot name="fila" />
    </div>
    <p v-if="lede || subtitle" class="lede cabecera-pagina__lede">{{ lede ?? subtitle }}</p>
    <slot />
  </div>

  <div v-else :class="compact ? 'mb-6 lg:flex lg:flex-wrap lg:items-center lg:gap-x-6' : 'mb-12'">
    <!-- Cabecera heredada (tag + subtitle + compact). Se borra en P13, cuando ninguna página la use. -->
    <!-- Miga hacia el índice de la sección (dictamen `diseno`, 14-oct-2026): cada
         herramienta lleva de vuelta a la franja de visores de /datos (#visores; antes, al índice /herramientas). Opcional; solo enlace + icono SVG.
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
const props = defineProps<{
  title?: string
  subtitle?: string
  tag?: string
  parent?: { to: string; label: string }
  /** cabecera corta (opt-in, heredada): ver el comentario de la plantilla heredada */
  compact?: boolean
  /** v3 · línea mono en mayúsculas encima del H1 (sustituye a la píldora `tag`) */
  eyebrow?: string
  /** v3 · entradilla bajo el H1 (si falta, se usa `subtitle`) */
  lede?: string
  /** v3 · `center` para las páginas de columna centrada a propósito (/gracias, /links) */
  align?: 'start' | 'center'
  /** v3 · `pagina` (por defecto), `herramienta` (corta: el visor tiene que asomar al entrar) u `oscura` (dentro de una Banda oscura) */
  variante?: 'pagina' | 'herramienta' | 'oscura'
}>()

const v3 = computed(() => !!(props.variante || props.eyebrow || props.lede || props.align))
</script>

<style scoped>
.cabecera-pagina { margin-bottom: var(--sp-48); }
.cabecera-pagina--herramienta { margin-bottom: var(--sp-24); }
.cabecera-pagina--centrada { text-align: center; }
.cabecera-pagina--centrada .cabecera-pagina__lede { margin-inline: auto; }
.cabecera-pagina__miga { margin: 0 0 var(--sp-8) calc(-1 * var(--sp-4)); padding-right: var(--sp-8); font-size: var(--texto-sm); }
.cabecera-pagina__eyebrow { margin: 0 0 var(--sp-12); }
.cabecera-pagina__titulo { margin: 0; }
.cabecera-pagina__fila { margin-top: var(--sp-16); }
.cabecera-pagina__lede { margin: var(--sp-12) 0 0; }
.cabecera-pagina--oscura { color: var(--texto-1); }
/* Herramienta: el contenido tiene que asomar al entrar, así que la entradilla solo aparece desde 640 px. */
@media (max-width: 639px) { .cabecera-pagina--herramienta .cabecera-pagina__lede { display: none; } }
</style>
