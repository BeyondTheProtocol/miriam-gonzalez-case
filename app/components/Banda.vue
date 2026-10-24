<script setup lang="ts">
/**
 * Banda de página (sistema v3, S4): el bloque de ancho completo con el que se construye una página por capítulos.
 * Sustituye a las cuatro bandas oscuras que había escritas a mano (la cita de la home, /equipo, /prensa, /marcas), tres
 * de ellas con hex en línea.
 *
 * · tono="crema"   fondo --color-bg, el de siempre.
 * · tono="tarjeta" fondo --color-bg-card (crema profunda). Alterna con la crema para marcar capítulos.
 * · tono="oscura"  berenjena a sangre con data-tema="oscuro". Se invierten solos las piezas que pintan con los roles
 *                  (--texto-1, --identidad, --marcador, --anillo-foco…): texto, enlaces, botones, tarjetas, campos, tablas,
 *                  píldoras y los componentes base. NO todo lo que hay en main.css lo hace: la lista de lo que sí y de lo que
 *                  no está en DESIGN-SYSTEM.md §3 (medida en render; lo que tiene ejemplo en la banda oscura de la guía
 *                  viva lo vigila `pnpm test:diseno-render`). Antes de poner en una banda oscura algo que no esté en esa
 *                  lista, añade su ejemplo a la guía. Un enlace en línea dentro de una TARJETA oscura da 3,9:1: fuera de ella.
 *
 * Reglas (están en DESIGN-SYSTEM.md §3):
 *   1. Una oscura por página, y siempre a sangre: no hay versión «caja redondeada».
 *   2. Nunca pegada a la banda de logos del pie.
 *   3. `titular` es el id del h2 de dentro (lo pinta CabeceraSeccion): la banda lo usa como aria-labelledby.
 *   4. Lleva `v-reveal` y `.section-spacing` dentro; no se vuelven a escribir en la página.
 *
 * Esto no migra ninguna página: la usan la guía viva y, en las fases P1 a P11, las páginas.
 */
withDefaults(defineProps<{
  tono?: 'crema' | 'tarjeta' | 'oscura'
  /** id del titular de la banda (aria-labelledby) */
  titular?: string
  /** relleno vertical corto (py-14 sm:py-20) en vez del de capítulo */
  compacta?: boolean
  /** retícula de puntos de fondo: solo en la oscura, la misma de la cita de la home */
  reticula?: boolean
}>(), { tono: 'crema', titular: undefined, compacta: false, reticula: true })
</script>

<template>
  <section
    v-reveal
    class="banda section-spacing"
    :class="[`banda--${tono}`, { 'section-spacing--compacta': compacta }]"
    :data-tema="tono === 'oscura' ? 'oscuro' : undefined"
    :aria-labelledby="titular"
  >
    <div v-if="tono === 'oscura' && reticula" class="banda__reticula" aria-hidden="true" />
    <div class="banda__contenido section-wide"><slot /></div>
  </section>
</template>

<style scoped>
.banda { position: relative; overflow: hidden; }
.banda--crema { background-color: var(--color-bg); color: var(--color-text); }
.banda--tarjeta { background-color: var(--color-bg-card); color: var(--color-text); }
.banda--oscura { background-color: var(--fondo); color: var(--texto-1); }
.banda__contenido { position: relative; }
.banda__reticula {
  position: absolute; inset: 0; opacity: 0.04; pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, var(--texto-1) 1px, transparent 0);
  background-size: 32px 32px;
}
</style>
