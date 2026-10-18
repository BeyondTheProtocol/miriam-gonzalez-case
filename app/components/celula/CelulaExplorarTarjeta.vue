<script setup lang="ts">
/**
 * Tarjeta sobria hacia el explorador (/celula-a-celula/explorar), al final de «Próximos pasos».
 * Misma puerta que el explorador: sin datos reales con el OK de Miriam NO existe (ni hueco). Con
 * `?demo=1` fuera de producción aparece y lleva el demo al explorador, avisando de que es un ejemplo.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const { estado } = useCelulaExplorador()
const destino = computed(() => localePath({ name: 'celula-a-celula-explorar', query: estado.value === 'ejemplo' ? { demo: '1' } : undefined }))
</script>

<template>
  <aside v-if="estado !== 'cerrada'" class="card-base cel-card xt" :aria-label="L('Explorador para profesionales', 'Explorer for professionals')">
    <p class="eyebrow--sm xt__eti">{{ L('Para profesionales', 'For professionals') }}</p>
    <h3 class="cel-h3">{{ L('Explorar los datos célula a célula', 'Explore the cell-by-cell data') }}</h3>
    <p class="cel-card__p">
      {{ L('El mapa de células de las dos biopsias, gen a gen, con el n, el suelo ambiental y la referencia de cada medida.',
        'The cell map of both biopsies, gene by gene, with the n, the ambient floor and the reference for every measure.') }}
      <template v-if="estado === 'ejemplo'"> {{ L('De momento, con datos de ejemplo.', 'For now, with example data.') }}</template>
    </p>
    <NuxtLink :to="destino" class="link-action xt__enlace">
      {{ L('Abrir el explorador', 'Open the explorer') }}
      <Icon name="ph:arrow-right-bold" class="w-4 h-4" aria-hidden="true" />
    </NuxtLink>
  </aside>
</template>

<style scoped>
.xt { margin-top: var(--sp-24); }
.xt__eti { margin: 0 0 var(--sp-4); color: var(--color-text-soft); }
.xt__enlace { display: inline-flex; align-items: center; gap: var(--sp-8); min-height: 44px; margin-top: var(--sp-8); color: var(--color-miriam); font-weight: 600; }
</style>
