<script setup lang="ts">
/**
 * Visor de RMN sagital de columna (datos reales de la paciente).
 * Cortes exportados de los DICOM de RM (cervical + dorsal, secuencias STIR y T1)
 * a /public/metastasis/mri/{region}-{seq}-{NN}.jpg.
 * Es un visor para MIRAR la imagen real; no añade interpretación: la lectura
 * radiológica de esta RMN corresponde al equipo médico.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const N = 17
const region = ref<'cervical' | 'dorsal'>('dorsal')
const seq = ref<'stir' | 't1'>('stir')
const slice = ref(Math.ceil(N / 2))

const src = computed(
  () => `/metastasis/mri/${region.value}-${seq.value}-${String(slice.value).padStart(2, '0')}.jpg`
)
const regionLabel = computed(() => (region.value === 'cervical' ? L('Cervical', 'Cervical') : L('Dorsal', 'Thoracic')))
const seqInfo = computed(() =>
  seq.value === 'stir'
    ? L('STIR — el agua, el edema y la infiltración de la médula ósea se ven BRILLANTES. Es la secuencia más sensible para metástasis óseas.',
        'STIR — water, edema and bone-marrow infiltration appear BRIGHT. It is the most sensitive sequence for bone metastases.')
    : L('T1 — la médula ósea grasa normal se ve BRILLANTE; donde una metástasis la reemplaza, se ve OSCURA.',
        'T1 — normal fatty bone marrow appears BRIGHT; where a metastasis replaces it, it looks DARK.')
)
function step(d: number) { slice.value = Math.min(N, Math.max(1, slice.value + d)) }
watch(region, () => { slice.value = Math.ceil(N / 2) })

const regions = computed(() => [
  { k: 'cervical', label: L('Cervical', 'Cervical') },
  { k: 'dorsal', label: L('Dorsal', 'Thoracic') },
])
const seqs = [
  { k: 'stir', label: 'STIR' },
  { k: 't1', label: 'T1' },
]
</script>

<template>
  <div>
    <!-- controles -->
    <div class="flex flex-wrap items-center gap-2 mb-3">
      <div class="inline-flex rounded-full border border-[rgba(45,27,61,0.2)] overflow-hidden text-xs font-semibold">
        <button v-for="r in regions" :key="r.k" type="button" @click="region = r.k as any"
          class="px-3 py-1.5 transition-colors"
          :class="region === r.k ? 'bg-berenjena text-cream' : 'text-tinta hover:text-berenjena'">{{ r.label }}</button>
      </div>
      <div class="inline-flex rounded-full border border-[rgba(45,27,61,0.2)] overflow-hidden text-xs font-semibold">
        <button v-for="s in seqs" :key="s.k" type="button" @click="seq = s.k as any"
          class="px-3 py-1.5 transition-colors"
          :class="seq === s.k ? 'bg-miriam text-cream' : 'text-tinta hover:text-berenjena'">{{ s.label }}</button>
      </div>
    </div>

    <!-- visor -->
    <div class="relative rounded-xl overflow-hidden bg-black mx-auto" style="max-width:520px">
      <img :src="src" :alt="L('RMN sagital de columna ' + regionLabel + ' — ' + seq.toUpperCase(), 'Sagittal spine MRI ' + regionLabel + ' — ' + seq.toUpperCase())"
        class="w-full block select-none" draggable="false" />
      <!-- overlay tipo PACS -->
      <div class="absolute top-2 left-2.5 text-[11px] font-mono leading-tight pointer-events-none" style="color:#8fe3c8;text-shadow:0 1px 2px #000">
        <div>RMN · {{ L('columna', 'spine') }} {{ regionLabel }}</div>
        <div>{{ seq.toUpperCase() }} · {{ L('sagital', 'sagittal') }}</div>
      </div>
      <div class="absolute top-2 right-2.5 text-[11px] font-mono pointer-events-none" style="color:#8fe3c8;text-shadow:0 1px 2px #000">
        {{ L('corte', 'slice') }} {{ slice }}/{{ N }}
      </div>
    </div>

    <!-- slider de corte -->
    <div class="flex items-center gap-3 mt-3 mx-auto" style="max-width:520px">
      <button type="button" @click="step(-1)" class="shrink-0 w-8 h-8 rounded-full border border-[rgba(45,27,61,0.2)] text-tinta hover:border-berenjena transition-colors" :aria-label="L('Corte anterior', 'Previous slice')">‹</button>
      <input type="range" min="1" :max="N" step="1" :value="slice"
        @input="slice = +($event.target as HTMLInputElement).value"
        class="flex-1 accent-miriam" :aria-label="L('Deslizar entre cortes sagitales', 'Scroll through sagittal slices')" />
      <button type="button" @click="step(1)" class="shrink-0 w-8 h-8 rounded-full border border-[rgba(45,27,61,0.2)] text-tinta hover:border-berenjena transition-colors" :aria-label="L('Corte siguiente', 'Next slice')">›</button>
    </div>

    <p class="text-[12px] text-tinta leading-relaxed mt-3 max-w-xl mx-auto text-center">{{ seqInfo }}</p>
  </div>
</template>
