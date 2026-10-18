<script setup lang="ts">
/** R6 · La parte neuroendocrina. Texto aprobado (17-oct-2026). Figura: esquema con puntos de rasgos neuroendocrinos repartidos por el tumor; sin porcentajes ni recuentos. */
import type { Bloque } from '~/utils/celulaResultados'
defineProps<{ b: Bloque }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
</script>

<template>
  <CelulaBloque clave="R6" :titulo="L('La parte neuroendocrina', 'The neuroendocrine part')" :sello="b.sello" :ejemplo="b.ejemplo">
    <p class="blq__texto">{{ L('El tumor es sobre todo de tipo luminal de mama. En el ARN, el programa del receptor de estrógeno está activo, aunque en el hígado la tinción de ese receptor salió negativa: un dato llamativo que su equipo médico tiene delante. Una parte de sus células muestra además rasgos neuroendocrinos (CHGA, SYP e INSM1), repartidos dentro del tumor sin formar un grupo aparte. En el hígado, la señal de INSM1 es real; según el laboratorio, no es algo que suelan ver en otros casos de cáncer de mama. Los genes que se buscan en los tumores neuroendocrinos clásicos (SSTR2 y DLL3) apenas aparecen en el ARN, aunque el PET con DOTATOC de mayo sí captó en varias lesiones del hueso.',
      'The tumor is mostly the luminal breast type. In the RNA, the estrogen receptor program is active, although in the liver the stain for that receptor came out negative: a striking finding her medical team has in front of them. Some of its cells also show neuroendocrine features (CHGA, SYP and INSM1), scattered within the tumor without forming a separate group. In the liver, the INSM1 signal is real; according to the lab, it is not something they usually see in other breast cancer cases. The genes sought in classic neuroendocrine tumors (SSTR2 and DLL3) barely appear in the RNA, although the May DOTATOC PET did show uptake in several bone lesions.') }}</p>
    <figure class="r6">
      <div class="r6__les">
        <CelulaLesion ne :alt="L('Esquema de un tumor luminal con puntos de rasgos neuroendocrinos repartidos por todo el tumor, sin formar un grupo aparte.', 'Diagram of a luminal tumor with neuroendocrine-feature dots scattered throughout it, without forming a separate group.')" />
      </div>
      <figcaption class="r6__leyenda">
        <p class="r6__li">
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="3" class="r6__t" /></svg>
          {{ L('Célula tumoral luminal', 'Luminal tumor cell') }}
        </p>
        <p class="r6__li">
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="5" class="r6__aro" /><path d="M6 3.2 L8.8 6 L6 8.8 L3.2 6 Z" class="r6__ne" /></svg>
          {{ L('Con rasgos neuroendocrinos', 'With neuroendocrine features') }}
        </p>
        <p class="blq__nota">{{ L('Esquema ilustrativo: ni el número de puntos ni su posición son datos.', 'Illustrative diagram: neither the number of dots nor their position is data.') }}</p>
      </figcaption>
    </figure>
  </CelulaBloque>
</template>

<style scoped>
.r6 { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-16) var(--sp-32); }
.r6__les { flex: 1 1 260px; max-width: 420px; }
.r6__leyenda { flex: 1 1 220px; display: grid; gap: var(--sp-8); }
.r6__li { display: flex; align-items: center; gap: var(--sp-8); margin: 0; font: 600 var(--texto-sm)/1.3 var(--font-body); color: var(--texto-1); }
.r6__li svg { width: 20px; height: 20px; flex: none; }
.r6__t { fill: var(--identidad); }
.r6__aro { fill: none; stroke: var(--cta-texto); stroke-width: 1.2; }
.r6__ne { fill: var(--cta-texto); }
</style>
