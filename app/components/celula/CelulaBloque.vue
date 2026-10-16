<script setup lang="ts">
/**
 * Envoltorio común de un bloque de resultados: etiqueta, pregunta (h3), sello y, si es ejemplo, la
 * marca «DATOS DE EJEMPLO». Pensado para vivir dentro del cielo oscuro (data-tema="oscuro"): pinta
 * con los ROLES del sistema (--superficie, --texto-1…), no con colores sueltos.
 */
const props = defineProps<{ etiqueta: string; titulo: string; sello: string; ejemplo?: boolean }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
</script>

<template>
  <article class="blq" :aria-labelledby="id">
    <header class="blq__cab">
      <p class="eyebrow--sm blq__eti">{{ etiqueta }}</p>
      <span class="blq__sello"><DatosSello :s="sello" :lang="lang" /></span>
    </header>
    <h3 :id="id" class="blq__t">{{ titulo }}</h3>
    <p v-if="ejemplo" class="blq__ejemplo">{{ L('DATOS DE EJEMPLO', 'EXAMPLE DATA') }}</p>
    <slot />
    <div v-if="$slots.pie" class="blq__pie"><slot name="pie" /></div>
  </article>
</template>

<style scoped>
.blq { background: var(--superficie); border: 1px solid var(--trazo-medio); border-radius: var(--radius-card); padding: var(--sp-16); color: var(--texto-1); }
@media (min-width: 640px) { .blq { padding: var(--sp-24); } }
.blq__cab { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sp-8); margin-bottom: var(--sp-8); }
.blq__eti { margin: 0; color: var(--texto-2); }
/* el sello lleva su propio fondo claro: sobre el cielo oscuro se lee igual que sobre crema */
.blq__sello { display: inline-flex; background: var(--color-bg); color: var(--color-text); border-radius: var(--radius-pill); padding: 2px; }
.blq__t { font: var(--tipo-h3); color: var(--texto-1); margin: 0 0 var(--sp-8); }
.blq__ejemplo { display: inline-block; margin: 0 0 var(--sp-12); padding: 2px var(--sp-8); border: 1.5px dashed var(--cta-texto); border-radius: var(--radius-sm); color: var(--cta-texto); font: 700 var(--texto-xs)/1.4 var(--font-mono); letter-spacing: var(--track-eyebrow); }
.blq__pie { margin-top: var(--sp-16); padding-top: var(--sp-12); border-top: 1px solid var(--trazo-medio); font: var(--tipo-body-sm); color: var(--texto-2); }
.blq :deep(.blq__intro) { font: var(--tipo-body); color: var(--texto-2); max-width: var(--measure); margin: 0 0 var(--sp-16); }
.blq :deep(.blq__par) { display: grid; gap: var(--sp-24); }
@media (min-width: 900px) { .blq :deep(.blq__par) { grid-template-columns: 1fr 1fr; gap: var(--sp-32); } }
.blq :deep(.blq__muestra) { min-width: 0; }
.blq :deep(.blq__mt) { display: flex; align-items: center; gap: var(--sp-8); font: 600 var(--texto-lg)/1.25 var(--font-display); color: var(--texto-1); margin: 0 0 var(--sp-12); }
.blq :deep(.blq__mt svg) { width: 20px; height: 20px; flex: none; color: var(--identidad); }
.blq :deep(.blq__lista) { margin: 0; padding: 0; list-style: none; }
</style>
