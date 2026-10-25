<script setup lang="ts">
/** El sello de evidencia de cada dato del panel, dicho en palabras y no solo en color.
 * En las páginas que lo piden con provide('ocultarVerificado', true) (/datos y la home), «verificado» no se
 * pinta: es lo normal y la leyenda de la página lo dice una vez (Miriam, 24-oct). Solo se marcan las
 * excepciones. En el resto (célula a célula) se sigue pintando, porque allí el sello completa la frase.
 *
 * Tamaño (lote 0 del repaso de escritorio, 25-oct-2026): en esas mismas páginas del panel el sello sube a 13 px (`sello--panel`, el
 * suelo tipográfico); dentro de `Dato` y de `QueBuscamos` también (override `:deep(.sello)` en cada uno: `/herramientas` pinta
 * `QueBuscamos` sin hacer el provide, así que `sello--panel` no le llega). La ÚNICA excepción de 11 px es célula a célula (los
 * componentes `celula/*` y sus páginas), hasta el PR #290, que es quien toca esas páginas: subirlo allí movería sus recuentos de R10
 * desde una capa compartida. Cuando #290 entre, `sello--panel` y los overrides desaparecen y el 13 px pasa a ser el único tamaño. */
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
  <span v-if="!(ocultarVerificado && s === 'verificado')" class="sello" :class="[`sello--${s}`, { 'sello--panel': ocultarVerificado }]"><span aria-hidden="true">{{ t[0] }}</span> {{ lang === 'en' ? t[2] : t[1] }}</span>
</template>

<style scoped>
.sello { display: inline-flex; align-items: center; gap: 3px; font: 600 11px/1.4 var(--font-mono); padding: 1px 7px;
  border-radius: 999px; white-space: nowrap; background: color-mix(in srgb, var(--texto-1) 6%, transparent); color: var(--texto-2); }
/* «verificado» lleva su propio par (violeta suave con berenjena): se lee igual en cualquier fondo. */
.sello--verificado { background: var(--color-miriam-soft); color: var(--color-text); }
.sello--sin_verificar { background: transparent; border: 1px dashed color-mix(in srgb, var(--texto-1) 45%, transparent); }
.sello--dicho { font-style: italic; }
/* En las páginas del panel (las que piden ocultarVerificado): 13 px, el suelo. Va después de `.sello` para ganarle el tamaño. */
.sello--panel { font-size: var(--texto-xs); }
</style>
