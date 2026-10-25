<script setup lang="ts">
/**
 * Salida de una herramienta (tanda 2 del rediseño de arquitectura, T2a, 24-oct-2026): al final de cada herramienta, dos salidas claras
 * y siempre las mismas: «Apoyar a Miriam» (coral, GoFundMe) y «Volver al inicio».
 *
 * Por qué: en los 60 días medidos, «Donar» fue el 2,8 % de los visitantes de /lesiones frente al 11,3 % de la home. Quien usa una
 * herramienta llega por curiosidad (2.758 de sus 4.158 visitas vienen de t.co) y la barra «Donar» del móvil está silenciada en todas
 * ellas (useSupportBarRoute: son herramientas de inmersión), así que al terminar no había ningún sitio al que ir. Medido: Umami,
 * `metrics event path=` entre `metrics path`, 60 d.
 *
 * Quién lo pinta: el layout (layouts/default.vue), por nombre de ruta, no cada página. Dos razones. Las páginas de célula a célula y su
 * explorador las comparte el PR #290 y no se tocan; y una pieza común garantiza que la salida es igual en todas (neurodivergencia:
 * lo previsible no se aprende dos veces). Se pinta dentro de <main>, tras el contenido de la página.
 *
 * Qué herramientas la llevan: SALIDA_HERRAMIENTA (utils/navegacion.ts). No la llevan el índice /herramientas (sus tres puertas ya
 * son esto) ni /lesiones (F6 le puso su propio cierre de apoyo: dos botones coral en el mismo cierre serían uno de más).
 *
 * Sin copy nuevo salvo el nombre accesible de la región y «Volver al inicio»; «Apoyar a Miriam» es nav.donate. El botón coral es el
 * único de la zona (DS: btn-cta solo para apoyar, uno por pantalla).
 */
const route = useRoute()
const localePath = useLocalePath()
const routeBaseName = useRouteBaseName()
const { GOFUNDME_URL, trackSupport } = useSupport()

// El origen del evento «Donar» lleva la herramienta: así se ve cuál convierte.
const origen = computed(() => `herramienta_${routeBaseName(route) ?? 'otra'}`)
</script>

<template>
  <Banda tono="tarjeta" compacta :aria-label="$t('herramientas.salida')">
    <div class="salida">
      <a
        :href="GOFUNDME_URL"
        target="_blank"
        rel="noopener noreferrer"
        data-support-cta
        class="btn-cta"
        @click="trackSupport(origen)"
      >
        <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
        {{ $t('nav.donate') }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
      </a>
      <NuxtLink :to="localePath('/')" class="btn-secondary">{{ $t('herramientas.salida_inicio') }}</NuxtLink>
    </div>
  </Banda>
</template>

<style scoped>
.salida { display: flex; flex-wrap: wrap; gap: var(--sp-12); }
.salida > * { flex: 1 1 14rem; justify-content: center; text-align: center; }
@media (min-width: 640px) { .salida > * { flex: 0 1 auto; } }
</style>
