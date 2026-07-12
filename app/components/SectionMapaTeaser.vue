<template>
  <!-- Teaser del mapa de metástasis «al primer vistazo»: vive justo bajo el hero,
       en el flujo crema, separado por el mismo filete fino que ya usa el hero.
       No compite con los CTA del hero (Donar > entender): es un módulo propio,
       más discreto que Donar y más protagonista que un enlace de pie. La
       miniatura es un SVG dibujado a mano (MapaMiniPreview), sin cargar el 3D. -->
  <section
    v-reveal
    class="bg-cream py-14 sm:py-16"
    style="border-top: 1px solid rgba(45,27,61,0.08)"
    :aria-labelledby="titleId"
  >
    <div class="section-wide">
      <NuxtLink
        :to="localePath('mapa-metastasis')"
        class="card-base mapa-teaser flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8"
        style="text-decoration: none"
        @click="trackMapa('home_teaser')"
      >
        <!-- Miniatura · columna estrecha, centrada en móvil -->
        <div class="mapa-teaser__preview shrink-0 self-center sm:self-start">
          <MapaMiniPreview />
        </div>

        <!-- Texto -->
        <div class="min-w-0 flex-1">
          <p class="eyebrow mb-2 block">{{ $t('mapaTeaser.eyebrow') }}</p>
          <h2
            :id="titleId"
            class="heading-display text-2xl sm:text-3xl text-berenjena mb-3"
            style="letter-spacing: -0.02em"
          >
            {{ $t('mapaTeaser.title') }}
          </h2>
          <p class="text-base text-tinta leading-relaxed max-w-2xl mb-4">
            {{ $t('mapaTeaser.lede') }}
          </p>

          <!-- Leyenda de trazadores · el color no es el único canal (texto al lado) -->
          <ul class="mapa-teaser__legend" :aria-label="$t('mapaTeaser.legend_aria')">
            <li>
              <span class="mapa-teaser__dot" style="background: #1c969e" aria-hidden="true" />
              {{ $t('mapaTeaser.tracer_ga') }}
            </li>
            <li>
              <span class="mapa-teaser__dot" style="background: #d66e1c" aria-hidden="true" />
              {{ $t('mapaTeaser.tracer_fdg') }}
            </li>
          </ul>

          <span class="btn-dark mapa-teaser__cta mt-5">
            <Icon name="ph:map-pin-fill" class="w-4 h-4" aria-hidden="true" />
            {{ $t('mapaTeaser.cta') }}
          </span>
          <p class="mt-3 font-mono text-[11px] text-tinta">{{ $t('mapaTeaser.disclaimer') }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { trackMapa } = useSupport()

// id único (no hardcodeado) por si el componente se montara más de una vez:
// evita colisión de id entre el aria-labelledby de la sección y el h2.
const titleId = useId()
</script>

<style scoped>
/* Lift sutil en desktop (mismo patrón que a.card-base del DS; el hover global ya
   lo aplica, aquí solo fijamos el ancho de la miniatura y la leyenda). */
.mapa-teaser__preview {
  width: 88px;
}
@media (min-width: 640px) {
  .mapa-teaser__preview {
    width: 104px;
  }
}

.mapa-teaser__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.mapa-teaser__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--color-text-soft);
}
.mapa-teaser__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

/* El CTA es visual (todo el card es el enlace real); en móvil ocupa el ancho. */
.mapa-teaser__cta {
  width: 100%;
}
@media (min-width: 640px) {
  .mapa-teaser__cta {
    width: auto;
  }
}
</style>
