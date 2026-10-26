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
 * Accesibilidad: lista real (`role="list"` para que Safari no la pierda sin viñetas), cada puerta un enlace de ≥ 64 px (TarjetaEnlace, sistema
 * v3), el icono es decorativo y la flecha también; la externa avisa de la pestaña nueva a los lectores de pantalla.
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
      <!-- Sistema v3 (P1): cada puerta es una TarjetaEnlace de tono «suave» (también «Apoyar»: el único coral de la zona es el botón de la
           tarjeta de la campaña). `puerta` queda como gancho para los tests y el CSS de la lista, sin estilos propios. -->
      <TarjetaEnlace
        v-if="p.externa"
        class="puerta"
        :href="p.href"
        :icono="ICONOS[p.id]"
        :titulo="$t(p.etiqueta)"
        @click="alPulsar(p.id)"
      />
      <TarjetaEnlace
        v-else
        class="puerta"
        :to="p.to"
        :icono="ICONOS[p.id]"
        :titulo="$t(p.etiqueta)"
        @click="alPulsar(p.id)"
      />
    </li>
  </ul>
</template>

<style scoped>
/* Una columna en móvil (se lee en el orden del DOM, sin esquinas), dos en tableta, seis columnas desde 1024 con spans 2, 2, 2, 3 y 3 (tres
   puertas arriba y dos más anchas debajo: sin hueco) y las cinco en una fila desde 1280, donde cada puerta aún mide ~220 px. Antes, de 1024 a
   1279 eran tres columnas y la segunda fila dejaba un hueco (3 + 2). Con cinco, cuatro columnas dejaban una puerta sola en la segunda fila.
   (Regla de retícula 2 del DS, §3. Entre 640 y 1023 son dos columnas y la última puerta queda sola: eso es debajo de `lg` y no se toca en
   este lote.) */
.puertas { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) { .puertas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) {
  .puertas { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .puertas > li { grid-column: span 2; }
  .puertas > li:nth-child(n + 4) { grid-column: span 3; }
}
@media (min-width: 1280px) {
  .puertas { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .puertas > li, .puertas > li:nth-child(n + 4) { grid-column: auto; }
}
</style>
