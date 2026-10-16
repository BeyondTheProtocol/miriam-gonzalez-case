<script setup lang="ts">
/** R4 · ¿Se deja ver? La maquinaria de presentación: de cada 100 células tumorales, cuántas la llevan encendida. */
import { MUESTRAS, type Bloque, type R4 } from '~/utils/celulaResultados'
const props = defineProps<{ b: Bloque; base: number; nivel: number }>()
const d = computed(() => props.b.datos as R4)
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const nombre = (m: string) => (m === 'higado' ? L('Hígado', 'Liver') : L('Hueso', 'Bone'))
const icono = (m: string) => (m === 'higado' ? 'ph:drop-half-fill' : 'ph:bone-fill')
const sinSonda = computed(() => d.value.sin_sonda.join(', '))
</script>

<template>
  <CelulaBloque :etiqueta="L('Presentación', 'Presentation')" :titulo="L('¿Puede verlo el sistema inmune?', 'Can the immune system see it?')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__intro">{{ L(`Esta prueba lee la maquinaria con la que una célula enseña trozos de lo que lleva dentro. Cada fila dice, de cada ${base} células tumorales, cuántas tienen encendido ese gen.`,
      `This test reads the machinery a cell uses to show pieces of what it carries inside. Each row says, out of every ${base} tumor cells, how many have that gene switched on.`) }}</p>
    <div class="blq__par">
      <section v-for="m in MUESTRAS" :key="m" class="blq__muestra" :aria-label="nombre(m)">
        <h4 class="blq__mt"><Icon :name="icono(m)" aria-hidden="true" />{{ nombre(m) }}</h4>
        <ul class="blq__lista">
          <CelulaFila v-for="g in d.muestras[m].genes" :key="g.gen" :nombre="g.gen" :g="g" :base="base" :nivel="nivel" />
        </ul>
      </section>
    </div>
    <p v-if="d.sin_sonda.length" class="r4__sin">{{ L(`Sin sonda, no se pueden leer: ${sinSonda}.`, `Without a probe they cannot be read: ${sinSonda}.`) }}</p>
    <template #pie>
      {{ L('Que la maquinaria esté encendida no dice si el tumor se ve de verdad. Falta la proteína y falta saber qué reconoce cada linfocito, y esta prueba no mide ninguna de las dos cosas.',
        'The machinery being switched on does not say whether the tumor is really visible. The protein is missing, and so is what each lymphocyte recognizes; this test measures neither.') }}
    </template>
  </CelulaBloque>
</template>

<style scoped>
.r4__sin { margin: var(--sp-16) 0 0; font: 600 var(--texto-sm)/1.4 var(--font-body); color: var(--texto-1); }
</style>
