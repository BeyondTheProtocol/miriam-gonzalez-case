<script setup lang="ts">
/**
 * Bloque 6 · Glosario. Las definiciones viven en app/utils/celulaGlosario.ts (la misma fuente
 * que alimenta a Term.vue). Aquí se pintan VISIBLES, sin depender del hover, y cada término es
 * además un <Term> en el texto de arriba.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
const items = computed(() => ORDEN_GLOSARIO_CELULA.map((k) => ({ k, ...GLOSARIO_CELULA[k]![lang.value] })))
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Glosario', 'Glossary') }}</h2>
    <dl class="cel-gl">
      <div v-for="x in items" :key="x.k" class="cel-gl__it">
        <dt>{{ x.label }}</dt>
        <dd>{{ x.def }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.cel-gl { margin: var(--sp-16) 0 0; display: grid; gap: 0; }
@media (min-width: 768px) { .cel-gl { grid-template-columns: 1fr 1fr; column-gap: var(--sp-32); } }
@media (min-width: 1100px) { .cel-gl { grid-template-columns: repeat(3, 1fr); } }
.cel-gl__it { padding: var(--sp-12) 0; border-top: 1px solid rgb(var(--color-text-rgb) / 0.12); }
.cel-gl dt { font: 700 var(--texto-sm)/1.4 var(--font-body); color: var(--color-text); }
.cel-gl dd { margin: var(--sp-4) 0 0; color: var(--color-text-soft); font: var(--tipo-body-sm); }
</style>
