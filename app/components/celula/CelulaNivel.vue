<template>
  <!-- Divisor de célula a célula (Miriam, 19-oct-2026: «el divisor igual que en ciencia… para gente normal y
       profesionales»; dictamen `diseno`): dos páginas, cada una es su versión. /celula-a-celula es la versión para
       mentes curiosas; su explorador, la de profesionales. Solo con la puerta del explorador abierta: sin ella, el
       lado «profesionales» llevaría a una página que dice «todavía no está abierto». -->
  <NivelLectura
    v-if="hayReal"
    modo="enlaces"
    :activo="activo"
    :opciones="opciones"
    :hint="t('ciencia.level_hint')"
    :aria="t('ciencia.level_aria')"
    @cambia="medir"
  />
</template>

<script setup lang="ts">
defineProps<{ activo: 'simple' | 'pro' }>()
const { t } = useI18n()
const localePath = useLocalePath()
const { hayReal } = useCelulaExplorador()
const { trackCelula, trackExplorador } = useSupport()
const opciones = computed(() => [
  { id: 'simple', label: t('ciencia.level_simple'), to: localePath({ name: 'celula-a-celula' }) },
  { id: 'pro', label: t('ciencia.level_pro'), to: localePath({ name: 'celula-a-celula-explorar' }) },
])
function medir(id: string) {
  if (id === 'pro') trackExplorador('divisor')
  else trackCelula('divisor')
}
</script>
