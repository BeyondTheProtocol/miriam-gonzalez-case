<script setup lang="ts">
/**
 * Las cinco puertas (rediseño de arquitectura, F5, 23-oct-2026; la quinta, T2a, 24-oct-2026): «qué quiere hacer quien llega», con la taxonomía ÚNICA de
 * utils/caminos.ts (PUERTAS). Sustituye a las siete tarjetas con minutos y pasos de «Elige tu camino»: una puerta es un
 * nombre y un destino, nada más (ni minutos, ni pasos, ni subtítulo). La pintará también /colabora (F10).
 *
 * · Apoyar → la campaña (GoFundMe, pestaña nueva, mide `Donar`).
 * · Clínico o laboratorio → /datos#que-buscamos. El evento `VerPeticion` lo emite el plugin umami-delegado al ver el
 *   ancla en el href: no se llama aquí, o contaría doble.
 * · Tecnología, IA y marcas → la tarjeta «Tech & IA» de /colabora (#tech-ia).
 * · Prensa y Otras formas → su página.
 * Todas miden `Puerta` con la puerta como propiedad (el evento `Pathway` de las tarjetas viejas se acaba aquí; la serie
 * se corta, se anota en el commit de F5).
 *
 * Accesibilidad: lista real (`role="list"` para que Safari no la pierda sin viñetas), cada puerta un enlace de ≥ 56 px, el
 * icono es decorativo y la flecha también; la externa avisa de la pestaña nueva a los lectores de pantalla.
 */
import { PUERTAS } from '~/utils/caminos'

const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport, trackPuerta } = useSupport()

// Decorativos (aria-hidden): los de siempre en la web para cada cosa. Viven aquí y no en PUERTAS porque una puerta es un
// nombre y un destino (test-caminos §9).
const ICONOS: Record<string, string> = {
  apoyar: 'ph:heart-fill',
  clinico: 'ph:stethoscope',
  tecnologia: 'ph:cpu',
  prensa: 'ph:megaphone-simple-fill',
  otras: 'ph:hands-praying-fill',
}

const puertas = computed(() =>
  PUERTAS.map((p) =>
    p.destino.tipo === 'apoyo'
      ? { id: p.id, etiqueta: p.etiqueta, externa: true as const, href: GOFUNDME_URL }
      : { id: p.id, etiqueta: p.etiqueta, externa: false as const, to: localePath({ name: p.destino.name, hash: p.destino.hash }) },
  ),
)

function alPulsar(id: string) {
  trackPuerta(id)
  if (id === 'apoyar') trackSupport('home_puertas')
}
</script>

<template>
  <ul class="puertas" role="list">
    <li v-for="p in puertas" :key="p.id">
      <a
        v-if="p.externa"
        :href="p.href"
        target="_blank"
        rel="noopener noreferrer"
        class="puerta"
        @click="alPulsar(p.id)"
      >
        <Icon :name="ICONOS[p.id]!" class="puerta__icono" aria-hidden="true" />
        <span class="puerta__etiqueta">{{ $t(p.etiqueta) }}</span>
        <span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
        <Icon name="ph:arrow-up-right" class="puerta__flecha" aria-hidden="true" />
      </a>
      <NuxtLink v-else :to="p.to" class="puerta" @click="alPulsar(p.id)">
        <Icon :name="ICONOS[p.id]!" class="puerta__icono" aria-hidden="true" />
        <span class="puerta__etiqueta">{{ $t(p.etiqueta) }}</span>
        <Icon name="ph:arrow-right" class="puerta__flecha" aria-hidden="true" />
      </NuxtLink>
    </li>
  </ul>
</template>

<style scoped>
/* Una columna en móvil (se lee en el orden del DOM, sin esquinas), dos en tableta, tres desde 1024 (3 + 2) y las cinco en una fila
   desde 1280, donde cada puerta aún mide ~220 px. Con cinco, cuatro columnas dejaban una puerta sola en la segunda fila. */
.puertas { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) { .puertas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .puertas { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (min-width: 1280px) { .puertas { grid-template-columns: repeat(5, minmax(0, 1fr)); } }

.puerta {
  display: flex; align-items: center; gap: 12px; min-height: 64px; height: 100%;
  padding: 12px 16px; box-sizing: border-box;
  border-radius: 16px; background: var(--color-bg-card); color: var(--color-text); text-decoration: none;
  border: 1px solid rgb(var(--color-text-rgb) / 0.14);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.puerta__icono { flex: none; width: 22px; height: 22px; color: var(--color-miriam); }
.puerta__etiqueta { flex: 1 1 auto; min-width: 0; font: 600 16px/1.3 var(--font-body); }
.puerta__flecha { flex: none; width: 16px; height: 16px; transition: transform 0.15s ease; }
@media (hover: hover) and (pointer: fine) {
  .puerta:hover { border-color: var(--color-text); }
  .puerta:hover .puerta__flecha { transform: translateX(2px); }
}
@media (prefers-reduced-motion: reduce) {
  .puerta, .puerta__flecha { transition: none; }
  .puerta:hover .puerta__flecha { transform: none; }
}
/* Colores forzados / contraste alto: el borde pasa a ser el del texto y se ve siempre. */
@media (forced-colors: active) { .puerta { border-color: CanvasText; } }
@media (prefers-contrast: more) { .puerta { border-color: var(--color-text); } }
</style>
