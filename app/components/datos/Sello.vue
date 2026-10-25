<script setup lang="ts">
/** El sello de evidencia de cada dato del panel, dicho en palabras y no solo en color.
 * En las páginas que lo piden con provide('ocultarVerificado', true) (/datos y la home), «verificado» no se
 * pinta: es lo normal y la leyenda de la página lo dice una vez (Miriam, 24-oct). Solo se marcan las
 * excepciones. En el resto (célula a célula) se sigue pintando, porque allí el sello completa la frase. */
const props = defineProps<{ s: string; lang: 'es' | 'en' }>()
const TXT: Record<string, [string, string, string]> = {
  verificado: ['✓', 'verificado', 'verified'],
  inferido: ['~', 'inferido', 'inferred'],
  dicho: ['“', 'lo dice Miriam', 'per Miriam'],
  sin_verificar: ['?', 'sin verificar', 'unverified'],
  extraido: ['↧', 'extraído del informe', 'extracted from report'],
}
const t = computed(() => TXT[props.s] ?? ['?', props.s, props.s])
const ocultarVerificado = inject<boolean>('ocultarVerificado', false)
</script>

<template>
  <span v-if="!(ocultarVerificado && s === 'verificado')" class="sello" :class="`sello--${s}`"><span aria-hidden="true">{{ t[0] }}</span> {{ lang === 'en' ? t[2] : t[1] }}</span>
</template>

<style scoped>
.sello { display: inline-flex; align-items: center; gap: 3px; font: 600 11px/1.4 var(--font-mono); padding: 1px 7px;
  border-radius: 999px; white-space: nowrap; background: color-mix(in srgb, var(--texto-1) 6%, transparent); color: var(--texto-2); }
/* «verificado» lleva su propio par (violeta suave con berenjena): se lee igual en cualquier fondo. */
.sello--verificado { background: var(--color-miriam-soft); color: var(--color-text); }
.sello--sin_verificar { background: transparent; border: 1px dashed color-mix(in srgb, var(--texto-1) 45%, transparent); }
.sello--dicho { font-style: italic; }
</style>
