<template>
  <section
    ref="root"
    class="ruta"
    :class="{ 'ruta-armada': armada, 'ruta-in': inView }"
    aria-labelledby="ruta-title"
  >
    <!-- Sistema v3 (P1): el titular es CabeceraSeccion (eyebrow + H2 por rol); el texto de cada paso se ve desde el principio y solo se
         anima el trazo. -->
    <CabeceraSeccion id="ruta-title" class="ruta-cabecera" :eyebrow="$t('ciencia.ruta.eyebrow')" :titulo="$t('ciencia.ruta.title')" />
    <!-- El objetivo (N-of-1) va aquí, una sola vez (E5; antes, también en una tarjeta oscura aparte). La frase de la que parte la ruta y el paso
         de hoy: el número sale de rutaPasos.ts (el primer paso que no está hecho), no de la prosa. -->
    <p v-if="objetivo" class="text-sm text-berenjena leading-relaxed font-medium mb-3 measure">
      {{ objetivo }}
    </p>
    <p class="text-sm text-tinta leading-relaxed mb-4 measure">
      {{ $t('ciencia.ruta.intro', { paso: pasoActual }) }}
    </p>
    <p v-if="ahora" class="text-sm text-berenjena leading-relaxed mb-8 measure">
      <span class="font-semibold">{{ $t('ciencia.ruta.ahora', { estado: ahora }) }}</span>
    </p>
    <div v-else class="mb-8" />

    <ol class="ruta-lista">
      <li
        v-for="(paso, i) in pasos"
        :key="paso.key"
        class="ruta-paso"
        :class="`ruta-paso--${paso.estado}`"
        :style="{ '--i': i }"
      >
        <!-- Columna del trazo: nodo + tramo de línea hasta el siguiente paso -->
        <div class="ruta-traza" aria-hidden="true">
          <svg class="ruta-nodo" viewBox="0 0 44 44" width="44" height="44" fill="none">
            <circle class="ruta-halo" cx="22" cy="22" r="20" />
            <circle class="ruta-aro" cx="22" cy="22" r="17" stroke-width="2" />
            <circle class="ruta-punto" cx="22" cy="22" r="11" />
          </svg>
          <Icon :name="paso.icono" class="ruta-icono" />
          <svg
            v-if="i < pasos.length - 1"
            class="ruta-tramo"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <line x1="1" y1="0" x2="1" y2="100" stroke-width="2" />
          </svg>
        </div>

        <div class="ruta-texto">
          <div class="flex items-center gap-2.5 flex-wrap mb-1">
            <span class="font-mono text-xs text-tinta">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="h4-tarjeta">{{ $t(`ciencia.ruta.pasos.${paso.key}.titulo`) }}</h3>
            <span :class="['status-badge', badge[paso.estado]]">
              {{ $t(`ciencia.ruta.estados.${paso.estado}`) }}
            </span>
          </div>
          <p class="text-sm text-tinta leading-relaxed measure">{{ $t(`ciencia.ruta.pasos.${paso.key}.texto`) }}</p>
        </div>
      </li>
    </ol>

    <Nota class="mt-6">{{ $t('ciencia.ruta.nota') }}</Nota>
  </section>
</template>

<script setup lang="ts">
/**
 * La ruta a una terapia personalizada, en 5 pasos, con el ESTADO real de cada uno.
 * Idea sacada del vídeo de DotCSV sobre Opus 5.5 (explicadores animados en HTML) y validada por
 * el comité de diseño (26-sep-2026). Sin librerías ni recursos externos: SVG + CSS.
 * Al entrar en viewport la línea se traza y los pasos se encienden en orden; el paso EN CURSO
 * late suave. Con reduced-motion todo se ve completo y quieto. Los estados viven en utils/rutaPasos.ts, no en el
 * copy: cambiar un estado = cambiar una línea (y cotejarlo con la fuente de verdad del caso).
 */
// Los estados viven en app/utils/rutaPasos.ts (17-oct-2026): la home los enseña también.
import { BADGE_RUTA, RUTA_PASOS } from '~/utils/rutaPasos'
const pasos = RUTA_PASOS

// `objetivo`: la frase del objetivo (la pone la página que usa la ruta). `ahora`: la frase del tratamiento de hoy, leída de caso.json; sin ella
// no se pinta nada (sin dato no hay línea).
defineProps<{ objetivo?: string | null; ahora?: string | null }>()

// El paso en el que está el caso: el primero que no está hecho (los estados viven en rutaPasos.ts).
const pasoActual = Math.min(Math.max(pasos.findIndex((p) => p.estado !== 'hecho'), 0) + 1, pasos.length)
const badge = BADGE_RUTA

const root = ref<HTMLElement | null>(null)
const inView = ref(false)
// `armada`: la animación se prepara (los tramos de línea sin trazar) SOLO cuando hay JS, IntersectionObserver y movimiento permitido, y
// solo si la ruta está bajo el pliegue. Sin eso, todo queda visible y completo desde el HTML.
const armada = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    inView.value = true
    return
  }
  if (root.value && root.value.getBoundingClientRect().top < window.innerHeight * 0.9) {
    inView.value = true
    return
  }
  armada.value = true
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true
        io?.disconnect()
      }
    },
    { threshold: 0.25 }
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.ruta-lista {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ruta-paso {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 1rem;
  min-height: 5.5rem; /* alto estable: sin CLS al animar */
}
.ruta-traza {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ruta-nodo {
  display: block;
  flex: none;
}
.ruta-icono {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 20px;
  height: 20px;
  color: var(--color-bg);
}
.ruta-tramo {
  flex: 1;
  width: 2px;
  min-height: 2.5rem;
  margin: 4px 0;
  overflow: visible;
}
.ruta-tramo line {
  stroke: color-mix(in srgb, var(--color-text) 22%, transparent);
  stroke-dasharray: 100;
  stroke-dashoffset: 0; /* estático / reduced-motion: línea completa */
}
.ruta-texto {
  padding: 0.35rem 0 1.5rem;
}

/* Colores por estado (solo tokens de la web) */
.ruta-halo { fill: transparent; }
.ruta-aro { stroke: color-mix(in srgb, var(--color-text) 25%, transparent); }
.ruta-punto { fill: color-mix(in srgb, var(--color-text) 35%, var(--color-bg)); }
.ruta-paso--hecho .ruta-aro { stroke: var(--color-text); }
.ruta-paso--hecho .ruta-punto { fill: var(--color-text); }
.ruta-paso--curso .ruta-aro { stroke: var(--color-miriam); }
.ruta-paso--curso .ruta-punto { fill: var(--color-miriam); }
.ruta-paso--curso .ruta-halo { fill: color-mix(in srgb, var(--color-miriam) 18%, transparent); }
.ruta-paso--abierto .ruta-aro { stroke: var(--color-miriam); stroke-dasharray: 4 4; }
/* Pendiente y abierto: nodo claro → icono oscuro (el par de máximo contraste del sistema).
   Con el icono en crema salía ~2:1, por debajo del 3:1 de WCAG 1.4.11 (comité diseño, 26-sep). */
.ruta-paso--pendiente .ruta-punto,
.ruta-paso--abierto .ruta-punto { fill: color-mix(in srgb, var(--color-text) 12%, var(--color-bg)); }
.ruta-paso--pendiente .ruta-icono,
.ruta-paso--abierto .ruta-icono { color: var(--color-text); }
.ruta-paso--hecho .ruta-tramo line { stroke: var(--color-text); }

/* Movimiento (sistema v3, P1): el TEXTO de cada paso no se anima nunca (lo que se lee no se mueve por estilo). Al entrar la ruta en pantalla
   solo se trazan las líneas y se enciende el nodo, con las duraciones y las curvas del sistema y un escalonado total de 240 ms. El paso
   en curso late 3 veces y se para. Sin JS o con movimiento reducido no se arma nada: todo se ve completo. */
@media (prefers-reduced-motion: no-preference) {
  .ruta-armada:not(.ruta-in) .ruta-tramo line { stroke-dashoffset: 100; }
  .ruta-armada:not(.ruta-in) .ruta-nodo,
  .ruta-armada:not(.ruta-in) .ruta-icono { opacity: 0; }

  .ruta-in .ruta-nodo,
  .ruta-in .ruta-icono {
    animation: nodo-in var(--dur-transicion) var(--curva-salida) both;
    animation-delay: calc(var(--i) * 60ms);
  }
  .ruta-in .ruta-tramo line {
    animation: tramo-in var(--dur-transicion) var(--curva-salida) both;
    animation-delay: calc(var(--i) * 60ms + 60ms);
  }
  /* El paso en curso late: es donde está el caso hoy. Tres latidos y se queda quieto. */
  .ruta-in .ruta-paso--curso .ruta-halo {
    transform-origin: 22px 22px;
    animation: latido 2.4s var(--curva-salida) calc(var(--i) * 60ms + 300ms) 3;
  }
  @keyframes nodo-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes tramo-in {
    from { stroke-dashoffset: 100; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes latido {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.55; }
  }
}
</style>
