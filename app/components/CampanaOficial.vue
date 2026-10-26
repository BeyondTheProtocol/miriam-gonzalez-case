<template>
  <div
    v-if="!(footer && yaLoPinta)"
    :id="footer ? 'campana-oficial' : undefined"
    role="note"
    :aria-label="$t('campanaOficial.titulo')"
    class="campana-oficial"
    :class="footer ? 'mt-10 pt-8 scroll-mt-24' : 'mt-8 pt-6'"
  >
    <div>
      <p class="text-sm font-semibold text-berenjena measure">
        <Icon name="ph:asterisk-bold" class="campana-oficial__mark" aria-hidden="true" />
        {{ $t('campanaOficial.titulo') }}
      </p>
      <p class="mt-1 text-sm text-tinta leading-relaxed measure">
        {{ $t('campanaOficial.intro') }}
      </p>
      <a
        :href="GOFUNDME_CANONICAL_URL"
        target="_blank"
        rel="noopener noreferrer"
        translate="no"
        lang="es"
        class="campana-oficial__slug link-inline font-mono"
        @click="trackOfficialCampaign(location)"
      >
        {{ slug }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
      </a>
      <p class="text-sm text-tinta leading-relaxed measure">
        {{ $t('campanaOficial.otras') }}
      </p>
      <p
        class="mt-2 font-mono text-xs leading-relaxed campana-oficial__meta measure"
      >
        {{ $t('campanaOficial.actualizado') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Aviso «Campaña oficial» (23-oct-2026): dice cuál es su campaña de donación y
 * que cualquier otra a su nombre no la ha creado ella. Nota al margen sin caja
 * (comité de diseño): ni alarma, ni coral, ni sticky, para no competir con el
 * botón de donar. El enlace muestra el slug largo para que se pueda comprobar a
 * ojo, y no lleva data-support-cta ni trackSupport (no es un clic de «Apoyar»).
 *
 * Tres instancias: pie (todas las páginas salvo la home y /gastos, con ancla
 * #campana-oficial), home bajo la barra de la campaña y /gastos. El texto va a la
 * medida de lectura (`.measure`, 68ch) y no a un `max-w-2xl` suelto. La medida va en cada `<p>` y no en el contenedor: `ch` se resuelve con la letra
 * del elemento que lleva la regla, y el contenedor es de 17 px mientras los párrafos son de 15 (609 px frente a 563: 81 caracteres por línea en español y
 * 93 en inglés, T3-BARRIDO).
 */
withDefaults(defineProps<{ footer?: boolean; location: string }>(), {
  footer: false,
})

const route = useRoute()
const routeBaseName = useRouteBaseName()
const { GOFUNDME_CANONICAL_URL, trackOfficialCampaign } = useSupport()

const slug = GOFUNDME_CANONICAL_URL.replace(/^https:\/\/www\./, '')

// La home lo lleva bajo la barra de la campaña y /gastos lo pinta en su propia tarjeta: el del pie se calla en las dos, porque
// dos avisos iguales en la misma página son ruido (en /gastos salían los dos). Por nombre de ruta, igual en ES y EN.
const yaLoPinta = computed(() => ['index', 'gastos'].includes(routeBaseName(route) ?? ''))
</script>

<style scoped>
.campana-oficial {
  border-top: 1px solid var(--trazo-sutil);
}
.campana-oficial__mark {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  vertical-align: -0.1em;
  color: var(--identidad);
  margin-right: 0.35rem;
}
.campana-oficial__slug {
  display: inline-flex;
  align-items: center;
  min-height: var(--control-min);
  font-size: var(--texto-xs);
  overflow-wrap: anywhere;
  word-break: break-word;
}
.campana-oficial__meta {
  color: rgb(var(--color-text-soft-rgb) / 0.78);
}
/* T3-BARRIDO: la línea «Actualizado el…» es prosa y el mono es para datos tabulares (DS sección 1). Desde `lg` pasa al cuerpo pequeño del sistema; por
   debajo conserva su mono de 13 px (el móvil no se toca en esta tanda: queda como excepción pendiente). */
@media (min-width: 1024px) {
  .campana-oficial__meta { font: var(--tipo-body-sm); }
}
</style>
