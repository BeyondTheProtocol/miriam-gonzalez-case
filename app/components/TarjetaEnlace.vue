<script setup lang="ts">
/**
 * Tarjeta-enlace (sistema v3, S4): icono + título + meta + flecha, interna o externa. Sustituye a cinco recetas del mismo
 * patrón: `.puerta` (Puertas), las tarjetas de prensa (fork, mención, recurso), las de contacto, `.bio-link` de /links,
 * las tres de /ciencia y la tarjeta de herramienta de /datos#visores.
 *
 * · Interna (`to`) o externa (`href`). La externa abre en pestaña nueva y avisa de ello a los lectores de pantalla
 *   (a11y.new_tab); la flecha cambia a la de salida.
 * · `tono`: `suave` (la de siempre: papel y filete), `destacada` (la protagonista del grupo: sombra dura, UNA por
 *   grupo) y `apoyo` (coral, solo para donar).
 * · Tarjeta de herramienta: `verbo` (lo que hace el botón: «Explorar»), `esfuerzo` («1 min, sin registro») y `nivel`
 *   («Para profesionales») salen como etiquetas mono debajo; el slot `preview` pinta una vista previa real encima.
 *   Los microtextos son copy: los pone quien usa la tarjeta, y pasan por voz-miriam y el muro.
 * · Hover (solo donde hay hover de verdad): el borde se oscurece y la flecha avanza 2 px. No se eleva: la elevación es
 *   de .card-base cuando la tarjeta es un enlace de bloque, aquí la fila entera es el objetivo.
 * · Objetivo táctil: 64 px de alto mínimo, la fila entera es el enlace. El icono y la flecha son decorativos.
 *
 * No usa @container: el soporte está sin comprobar (web.dev) y la rejilla se resuelve con media queries.
 */
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  titulo: string
  to?: RouteLocationRaw
  href?: string
  /** nombre del icono de Phosphor (decorativo) */
  icono?: string
  /** línea de apoyo bajo el título */
  meta?: string
  tono?: 'suave' | 'destacada' | 'apoyo'
  verbo?: string
  esfuerzo?: string
  nivel?: string
}>(), { to: undefined, href: undefined, icono: undefined, meta: undefined, tono: 'suave', verbo: undefined, esfuerzo: undefined, nivel: undefined })

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
const externa = computed(() => !!props.href)
const alPulsar = (ev: MouseEvent) => emit('click', ev)
</script>

<template>
  <a
    v-if="externa"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="tarjeta-enlace"
    :class="[`tarjeta-enlace--${tono}`, { 'card-marked': tono === 'destacada' }]"
    @click="alPulsar"
  >
    <slot name="preview" />
    <span class="tarjeta-enlace__fila">
      <Icon v-if="icono" :name="icono" class="tarjeta-enlace__icono" aria-hidden="true" />
      <span class="tarjeta-enlace__texto">
        <span class="h4-tarjeta tarjeta-enlace__titulo">{{ titulo }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></span>
        <span v-if="meta || $slots.default" class="tarjeta-enlace__meta"><slot>{{ meta }}</slot></span>
      </span>
      <Icon name="ph:arrow-up-right" class="tarjeta-enlace__flecha" aria-hidden="true" />
    </span>
    <span v-if="verbo || esfuerzo || nivel" class="tarjeta-enlace__etiquetas">
      <span v-if="verbo" class="etiqueta">{{ verbo }}</span>
      <span v-if="esfuerzo" class="etiqueta">{{ esfuerzo }}</span>
      <span v-if="nivel" class="etiqueta">{{ nivel }}</span>
    </span>
  </a>
  <NuxtLink
    v-else
    :to="to!"
    class="tarjeta-enlace"
    :class="[`tarjeta-enlace--${tono}`, { 'card-marked': tono === 'destacada' }]"
    @click="alPulsar"
  >
    <slot name="preview" />
    <span class="tarjeta-enlace__fila">
      <Icon v-if="icono" :name="icono" class="tarjeta-enlace__icono" aria-hidden="true" />
      <span class="tarjeta-enlace__texto">
        <span class="h4-tarjeta tarjeta-enlace__titulo">{{ titulo }}</span>
        <span v-if="meta || $slots.default" class="tarjeta-enlace__meta"><slot>{{ meta }}</slot></span>
      </span>
      <Icon name="ph:arrow-right" class="tarjeta-enlace__flecha" aria-hidden="true" />
    </span>
    <span v-if="verbo || esfuerzo || nivel" class="tarjeta-enlace__etiquetas">
      <span v-if="verbo" class="etiqueta">{{ verbo }}</span>
      <span v-if="esfuerzo" class="etiqueta">{{ esfuerzo }}</span>
      <span v-if="nivel" class="etiqueta">{{ nivel }}</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.tarjeta-enlace {
  display: flex; flex-direction: column; gap: var(--sp-12); box-sizing: border-box; height: 100%; min-height: 4rem;
  padding: var(--sp-12) var(--sp-16);
  background: var(--superficie); color: var(--texto-1); text-decoration: none;
  transition: border-color var(--dur-micro) var(--curva-salida), background-color var(--dur-micro) var(--curva-salida);
}
/* La destacada toma borde, radio y sombra de .card-marked (main.css); las demás, los de aquí. */
.tarjeta-enlace:not(.card-marked) { border: 1px solid var(--trazo-medio); border-radius: var(--radius-card); }
.tarjeta-enlace--destacada { padding: var(--sp-16) var(--sp-24); }
.tarjeta-enlace--apoyo { background: var(--color-cta); border-color: var(--color-cta); color: var(--color-text); }
.tarjeta-enlace__fila { display: flex; align-items: center; gap: var(--sp-12); }
.tarjeta-enlace__icono { flex: none; width: 1.375rem; height: 1.375rem; color: var(--identidad); }
.tarjeta-enlace--apoyo .tarjeta-enlace__icono { color: var(--color-text); }
.tarjeta-enlace__texto { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--sp-4); }
.tarjeta-enlace__titulo { display: block; }
.tarjeta-enlace__meta { font: var(--tipo-body-sm); color: var(--texto-2); }
.tarjeta-enlace--apoyo .tarjeta-enlace__meta { color: var(--color-text); }
.tarjeta-enlace__flecha { flex: none; width: 1rem; height: 1rem; transition: transform var(--dur-micro) var(--curva-salida); }
.tarjeta-enlace__etiquetas { display: flex; flex-wrap: wrap; gap: var(--sp-4) var(--sp-12); }
@media (hover: hover) and (pointer: fine) {
  .tarjeta-enlace:hover { border-color: var(--texto-1); }
  .tarjeta-enlace--apoyo:hover { background: var(--color-cta-hover); border-color: var(--color-cta-hover); }
  .tarjeta-enlace:hover .tarjeta-enlace__flecha { transform: translateX(2px); }
}
@media (prefers-reduced-motion: reduce) {
  .tarjeta-enlace, .tarjeta-enlace__flecha { transition: none; }
  .tarjeta-enlace:hover .tarjeta-enlace__flecha { transform: none; }
}
/* Colores forzados y contraste alto: el borde pasa a ser el del texto y se ve siempre. */
@media (forced-colors: active) { .tarjeta-enlace { border-color: CanvasText; } }
@media (prefers-contrast: more) { .tarjeta-enlace { border-color: var(--texto-1); } }
</style>
