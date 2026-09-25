<template>
  <section
    ref="root"
    class="ruta"
    :class="{ 'ruta-in': inView }"
    aria-labelledby="ruta-title"
  >
    <p class="eyebrow mb-2 block">{{ $t('ciencia.ruta.eyebrow') }}</p>
    <h2
      id="ruta-title"
      class="heading-display text-2xl text-berenjena mb-2 scroll-mt-[5.5rem]"
      style="letter-spacing: -0.02em"
    >
      {{ $t('ciencia.ruta.title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed mb-8 max-w-2xl">
      {{ $t('ciencia.ruta.intro') }}
    </p>

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
            <span class="font-mono text-xs text-tinta opacity-70">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="font-semibold text-berenjena text-base">{{ $t(`ciencia.ruta.pasos.${paso.key}.titulo`) }}</h3>
            <span :class="['status-badge', badge[paso.estado]]">
              {{ $t(`ciencia.ruta.estados.${paso.estado}`) }}
            </span>
          </div>
          <p class="text-sm text-tinta leading-relaxed">{{ $t(`ciencia.ruta.pasos.${paso.key}.texto`) }}</p>
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
 * late suave. Con reduced-motion todo se ve completo y quieto. Los estados viven aquí, no en el
 * copy: cambiar un estado = cambiar una línea (y cotejarlo con la fuente de verdad del caso).
 */
type Estado = 'hecho' | 'curso' | 'pendiente' | 'abierto'
const pasos: { key: string; estado: Estado; icono: string }[] = [
  { key: 'tejido', estado: 'hecho', icono: 'ph:flask-fill' },
  { key: 'leer', estado: 'curso', icono: 'ph:dna-fill' },
  { key: 'dianas', estado: 'pendiente', icono: 'ph:crosshair-fill' },
  { key: 'disenar', estado: 'pendiente', icono: 'ph:syringe-fill' },
  { key: 'llegar', estado: 'abierto', icono: 'ph:globe-hemisphere-west-fill' },
]
const badge: Record<Estado, string> = {
  hecho: 'status-badge--active',
  curso: 'status-badge--firma',
  pendiente: 'status-badge--complete',
  abierto: 'status-badge--candidate',
}

const root = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null

onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    inView.value = true
    return
  }
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
.ruta-paso--pendiente .ruta-icono,
.ruta-paso--abierto .ruta-icono { color: var(--color-bg); opacity: 0.9; }
.ruta-paso--hecho .ruta-tramo line { stroke: var(--color-text); }

@media (prefers-reduced-motion: no-preference) {
  /* Antes de entrar: pasos apagados y líneas sin trazar */
  .ruta:not(.ruta-in) .ruta-paso { opacity: 0; transform: translateY(6px); }
  .ruta:not(.ruta-in) .ruta-tramo line { stroke-dashoffset: 100; }

  .ruta-in .ruta-paso {
    animation: paso-in 0.5s ease both;
    animation-delay: calc(var(--i) * 0.35s);
  }
  .ruta-in .ruta-tramo line {
    animation: tramo-in 0.4s ease both;
    animation-delay: calc(var(--i) * 0.35s + 0.3s);
  }
  /* El paso en curso late: es donde está el caso hoy */
  .ruta-in .ruta-paso--curso .ruta-halo {
    transform-origin: 22px 22px;
    animation: latido 2.4s ease-in-out calc(var(--i) * 0.35s + 0.6s) infinite;
  }
  @keyframes paso-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
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
