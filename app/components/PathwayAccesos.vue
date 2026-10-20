<template>
  <!-- Accesos directos de un camino de la home (plan del 20-oct-2026). Una lista, un tipo: no se mezcla con
       los pasos de texto (diseno). <NuxtLink> literal, que se compila al componente real y siempre emite un
       <a href> (el bug de iOS Chrome era el <component :is> por cadena); lo frena test-home-caminos. -->
  <ul class="pathway-accesos" :aria-label="$t('pathways.accesos_aria')">
    <li v-for="(a, i) in accesos" :key="i">
      <a
        v-if="a.tipo === 'externo'"
        :href="a.href"
        target="_blank"
        rel="noopener noreferrer"
        class="pathway-acceso"
        @click="medir(a)"
      >
        <Icon :name="iconoExterno ?? 'ph:link-simple'" class="pathway-acceso__icono" aria-hidden="true" />
        <span class="pathway-acceso__label">{{ $t(a.etiqueta) }}</span>
        <span class="sr-only"> {{ $t('a11y.new_tab') }}</span>
        <Icon name="ph:arrow-up-right" class="pathway-acceso__flecha" aria-hidden="true" />
      </a>
      <NuxtLink
        v-else
        :to="destino(a)"
        class="pathway-acceso"
        @click="medir(a)"
      >
        <Icon :name="icono(a)" class="pathway-acceso__icono" aria-hidden="true" />
        <span class="pathway-acceso__label">{{ etiqueta(a) }}</span>
        <Icon name="ph:arrow-right" class="pathway-acceso__flecha" aria-hidden="true" />
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Acceso } from '~/utils/caminos'

const props = defineProps<{
  accesos: Acceso[]
  /** id del camino (clinician, research…): da el origen de los eventos, `home_camino_<camino>`. */
  camino: string
  iconoExterno?: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { trackHerramienta, trackPathway } = useSupport()

function destino(a: Acceso) {
  if (a.tipo === 'herramienta') return localePath({ name: a.enlace.name })
  if (a.tipo === 'contacto') return localePath({ name: 'contacto', query: { role: a.rol } })
  return a.href
}
function etiqueta(a: Acceso) {
  if (a.tipo === 'herramienta') return t(`nav.${a.enlace.key}`)
  return t(a.etiqueta)
}
function icono(a: Acceso) {
  if (a.tipo === 'herramienta') return ICONO_HERRAMIENTA[a.enlace.key] ?? 'ph:wrench-fill'
  return 'ph:envelope-simple-fill'
}
function medir(a: Acceso) {
  if (a.tipo === 'herramienta') trackHerramienta(a.enlace.key, `home_camino_${props.camino}`)
  else if (a.tipo === 'contacto') trackPathway(`${props.camino}_contacto`)
  else trackPathway(`${props.camino}_externo`)
}
</script>
