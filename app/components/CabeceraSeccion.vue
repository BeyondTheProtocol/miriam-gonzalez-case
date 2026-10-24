<script setup lang="ts">
/**
 * Cabecera de sección (sistema v3, S4): eyebrow opcional + H2 + entradilla opcional. La home la escribía a mano en cada
 * bloque (`heading-display text-3xl sm:text-4xl` con `style="letter-spacing:-0.03em"`), y /equipo y /prensa pintaban
 * un H2 con aspecto de eyebrow porque no había pieza a la que acudir.
 *
 * · `id` es obligatorio: es el id del <h2>, y la Banda (o el <section>) lo usa como aria-labelledby.
 * · `nivel="declaracion"` es el H2 grande de «Dónde estamos» (30 a 48 px). Máximo uno por página.
 * · El color lo da el fondo (--texto-1 / --texto-2), así que en una banda oscura funciona sin tocar nada.
 *
 * El titular va por prop o por el slot `titulo` (cuando lleva marcado, p. ej. una cursiva de firma). El tracking
 * (-0,03em) lo lleva la clase de rol, no un style en línea.
 */
withDefaults(defineProps<{
  id: string
  titulo?: string
  eyebrow?: string
  lede?: string
  nivel?: 'seccion' | 'declaracion'
}>(), { titulo: undefined, eyebrow: undefined, lede: undefined, nivel: 'seccion' })
</script>

<template>
  <header class="cabecera-seccion">
    <p v-if="eyebrow" class="eyebrow cabecera-seccion__eyebrow">{{ eyebrow }}</p>
    <h2 :id="id" :class="nivel === 'declaracion' ? 'h2-declaracion' : 'h2-seccion'">
      <slot name="titulo">{{ titulo }}</slot>
    </h2>
    <p v-if="lede" class="lede cabecera-seccion__lede">{{ lede }}</p>
    <slot />
  </header>
</template>

<style scoped>
.cabecera-seccion { margin-bottom: var(--sp-32); }
.cabecera-seccion__eyebrow { margin: 0 0 var(--sp-12); }
.cabecera-seccion__lede { margin: var(--sp-16) 0 0; }
</style>
