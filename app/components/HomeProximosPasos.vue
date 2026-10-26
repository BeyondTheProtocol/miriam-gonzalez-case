<script setup lang="ts">
/**
 * Home · la ruta, en corto. Consejo de Javi (17-oct-2026): a la gente le gusta saber qué viene después. Miriam aclaró ese
 * mismo día que lo decía por la HOME, no por /celula-a-celula.
 *
 * Es la ruta de /ciencia (5 pasos) en corto: el objetivo, la barra de pasos dados y el título y estado de cada paso, con
 * enlace a la ruta completa. Los estados salen de utils/rutaPasos.ts, la misma fuente que /ciencia, y los títulos de
 * `ciencia.ruta.pasos`: no hay una segunda copia que pueda quedarse atrás. Describe el camino; no promete resultados ni plazos.
 *
 * Rediseño F5 (23-oct-2026): ya no es una sección con su encabezado; es una pieza del bloque «Dónde estamos y qué falta»
 * (index.vue), que pone el H2, la línea «Ahora» y, debajo, «Qué buscamos». Sale el enlace al análisis célula a célula: la
 * petición que lo enlaza va justo debajo (QueBuscamos) y la herramienta está en el menú «Datos».
 *
 * Accesibilidad: barra con role=progressbar y el mismo texto a la vista; el estado va con icono y palabra, no solo con
 * color; sin animaciones.
 */
import { BADGE_RUTA, RUTA_PASOS, resumenRuta } from '~/utils/rutaPasos'

const { t } = useI18n()
const localePath = useLocalePath()
const resumen = resumenRuta()
const progreso = computed(() =>
  resumen.curso
    ? t('home.pasos_progreso_curso', { hechos: resumen.hechos, total: resumen.total, curso: resumen.curso })
    : t('home.pasos_progreso', { hechos: resumen.hechos, total: resumen.total }))
const idBarra = useId()
</script>

<template>
  <div>
    <p class="text-base text-tinta leading-relaxed mb-6 measure">{{ $t('home.pasos_intro') }}</p>

    <div class="card-base max-w-3xl hpp">
      <p :id="idBarra" class="font-display font-semibold text-berenjena text-lg">{{ progreso }}</p>
      <div
        class="hpp__barra"
        role="progressbar"
        :aria-labelledby="idBarra"
        aria-valuemin="0"
        :aria-valuemax="resumen.total"
        :aria-valuenow="resumen.hechos"
        :aria-valuetext="progreso"
      >
        <span v-for="p in RUTA_PASOS" :key="p.key" class="hpp__seg" :class="`hpp__seg--${p.estado}`" aria-hidden="true" />
      </div>
      <p class="text-xs text-tinta mt-3">{{ $t('home.pasos_nota_barra') }}</p>

      <ol class="hpp__lista">
        <li v-for="(p, i) in RUTA_PASOS" :key="p.key" class="hpp__paso">
          <span class="hpp__num" aria-hidden="true">{{ i + 1 }}</span>
          <Icon :name="p.icono" class="w-4 h-4 text-berenjena shrink-0" aria-hidden="true" />
          <span class="text-sm text-tinta leading-snug flex-1">{{ $t(`ciencia.ruta.pasos.${p.key}.titulo`) }}</span>
          <span class="status-badge" :class="BADGE_RUTA[p.estado]">{{ $t(`ciencia.ruta.estados.${p.estado}`) }}</span>
        </li>
      </ol>
    </div>

    <div class="mt-6">
      <NuxtLink :to="localePath({ name: 'ciencia', hash: '#ruta-title' })" class="btn-secondary w-full sm:w-auto">
        <Icon name="ph:path-bold" class="w-4 h-4" aria-hidden="true" />
        {{ $t('home.pasos_cta_ruta') }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.hpp__barra { display: flex; gap: 4px; margin-top: 12px; }
.hpp__seg {
  flex: 1 1 0; height: 12px; border-radius: var(--radius-sm); box-sizing: border-box;
  border: 2px solid rgb(var(--color-text-rgb) / 0.55); /* >= 3:1 sobre el fondo (WCAG 1.4.11) */
}
.hpp__seg--hecho { background: var(--color-miriam); border-color: var(--color-miriam); }
.hpp__seg--curso { background: linear-gradient(90deg, var(--color-miriam) 50%, transparent 50%); border-color: var(--color-miriam); }
.hpp__seg--pendiente, .hpp__seg--abierto { background: transparent; }
@media (forced-colors: active) {
  .hpp__seg { border-color: CanvasText; }
  .hpp__seg--hecho { background: CanvasText; }
  .hpp__seg--curso { background: linear-gradient(90deg, CanvasText 50%, transparent 50%); }
}
.hpp__lista { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 10px; }
.hpp__paso { display: flex; align-items: center; gap: 10px; min-height: 32px; }
.hpp__num {
  flex: none; width: 24px; height: 24px; border-radius: var(--radius-pill); display: inline-flex; align-items: center;
  justify-content: center; font: 600 var(--texto-xs)/1 var(--font-mono);
  color: var(--color-text); background: rgb(var(--color-text-rgb) / 0.06);
}
</style>
