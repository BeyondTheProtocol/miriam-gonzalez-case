<template>
  <section v-if="data && data.samples?.length" :aria-labelledby="'liquid-pivot-title'">
    <div class="flex items-baseline justify-between flex-wrap gap-2 mb-3">
      <p class="eyebrow">{{ locale === 'es' ? 'Biopsias líquidas' : 'Liquid biopsies' }}</p>
      <p class="text-[11px] text-tinta font-mono">
        {{ data.samples.length }} {{ locale === 'es' ? 'muestras' : 'samples' }}
      </p>
    </div>
    <h2 id="liquid-pivot-title" class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
      {{ $t('ciencia.ctdna_dynamics_title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed mb-5 max-w-2xl">
      {{ $t('ciencia.ctdna_dynamics_intro') }}
    </p>

    <div class="data-card overflow-x-auto">
      <table class="data-table data-table--dense data-table--cards" aria-labelledby="liquid-pivot-title">
        <caption class="sr-only">
          {{
            locale === 'es'
              ? 'Tabla pivotada de biopsias líquidas: filas son alteraciones, columnas son muestras.'
              : 'Pivoted liquid biopsy table: rows are alterations, columns are samples.'
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col" style="min-width: 180px">{{ locale === 'es' ? 'Alteración' : 'Alteration' }}</th>
            <th
              v-for="sample in data.samples"
              :key="sample.id"
              scope="col"
              class="text-center"
              style="min-width: 140px"
            >
              <div class="flex flex-col items-center gap-0.5">
                <span class="text-berenjena font-semibold" style="font-size:13px">{{ sample.label }}</span>
                <span class="font-mono text-tinta" style="font-size:11px">
                  {{ sample.date }}<template v-if="sample.matrix"> · {{ sample.matrix }}</template>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in data.rows" :key="i">
            <td class="cell-head" translate="no">
              <span class="text-berenjena font-semibold">{{ row.alteration }}</span>
              <span v-if="row.subscript" class="ml-2 font-mono text-tinta" style="font-size:11px">{{ row.subscript }}</span>
            </td>
            <td
              v-for="sample in data.samples"
              :key="sample.id"
              class="text-center"
              :data-label="sample.matrix ? `${sample.label} · ${sample.date} · ${sample.matrix}` : `${sample.label} · ${sample.date}`"
            >
              <template v-if="cell(row, sample.id)?.value">
                <span v-if="cell(row, sample.id)?.plain" class="font-mono text-berenjena" style="font-size:12px">
                  {{ cell(row, sample.id)?.value }}
                </span>
                <span
                  v-else
                  :class="['pill-data', `pill-data--${cell(row, sample.id)?.tone || 'neutral'}`]"
                >{{ cell(row, sample.id)?.value }}</span>
              </template>
              <span v-else class="text-tinta" aria-hidden="true">—</span>
              <span v-if="!cell(row, sample.id)?.value" class="sr-only">{{ locale === 'es' ? 'no detectado' : 'not detected' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- B2 · dinámica del ctDNA: la señal de RB1 a lo largo de las extracciones.
         Los valores siguen en la tabla (accesibles); el sparkline es complemento
         visual decorativo. -->
    <div v-if="rbTrend" class="mt-5 flex items-center gap-4 flex-wrap">
      <Sparkline :points="rbTrend.points" />
      <p class="text-sm text-tinta leading-relaxed">
        <strong class="text-berenjena" translate="no">RB1 {{ rbTrend.sub }}</strong>
        {{ locale === 'es' ? 'en sangre' : 'in blood' }}:
        <span class="font-mono nums text-berenjena">{{ rbTrend.from }} → {{ rbTrend.to }}</span>
      </p>
    </div>

    <p v-if="data.sources" class="mt-4 text-xs text-tinta leading-relaxed font-mono">
      {{ data.sources }}
    </p>
  </section>
</template>

<script setup lang="ts">
interface CellValue {
  value?: string
  tone?: 'violet' | 'info' | 'warn' | 'positive' | 'neutral'
  plain?: boolean
}
interface Sample { id: string; label: string; date: string; matrix?: string }
interface Row { alteration: string; subscript?: string; values: Record<string, CellValue> }
interface Pivot { samples: Sample[]; rows: Row[]; sources?: string }

const props = defineProps<{ data?: Pivot | null }>()
const { locale } = useI18n()

function cell(row: Row, sampleId: string): CellValue | undefined {
  return row.values?.[sampleId]
}

// B2 · serie numérica de RB1 (VAF %) a lo largo de las muestras, para el
// sparkline. Solo si hay ≥2 puntos numéricos; si no, no se muestra.
const rbTrend = computed(() => {
  const row = props.data?.rows?.find((r) => r.alteration === 'RB1')
  if (!row || !props.data) return null
  const seq: { value: string; n: number }[] = []
  for (const s of props.data.samples) {
    const v = row.values?.[s.id]?.value
    const m = typeof v === 'string' ? v.match(/(\d+(?:[.,]\d+)?)\s*%/) : null
    if (m) seq.push({ value: m[0], n: parseFloat((m[1] ?? '').replace(',', '.')) })
  }
  if (seq.length < 2) return null
  return {
    points: seq.map((x) => x.n),
    from: seq[0]?.value ?? '',
    to: seq[seq.length - 1]?.value ?? '',
    sub: row.subscript ?? '',
  }
})
</script>
