<script setup lang="ts">
/**
 * Bloque 1 · Qué es. La metáfora (batido frente a frutero) va ETIQUETADA como metáfora y
 * dibujada en SVG estático. Los trozos del frutero se distinguen por FORMA y relleno, no solo
 * por color. Cero hex: solo los tokens del sistema. Sin animación.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()

// Trozos del frutero: [forma, cx, cy]. 0 círculo, 1 cuadrado, 2 triángulo, 3 rombo.
// Se dibujan ANTES que el cuenco, que tapa su parte baja: así quedan amontonados dentro.
const trozos: [number, number, number][] = [
  [3, 58, 90], [0, 96, 92], [2, 136, 90], [1, 176, 92], [0, 214, 90],
  [1, 78, 66], [3, 118, 68], [0, 156, 66], [2, 196, 68],
]
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Qué es «célula a célula»', 'What “cell by cell” means') }}</h2>
    <p class="cel-p">
      {{ L('Un tumor no es una masa igual en todas partes. Tiene células tumorales de varios tipos, células del sistema inmune, vasos y tejido de sostén. Las pruebas habituales trituran un trozo y miden la media.',
           'A tumor is not the same mass everywhere. It has tumor cells of several kinds, immune cells, blood vessels and supporting tissue. The usual tests grind up a piece and measure the average.') }}
    </p>
    <p class="cel-p">
      <Term id="sc_celula_unica" :label="L('El análisis de célula única', 'Single-cell analysis')" />
      {{ L('mide cada célula por separado. Lo que lee es', 'measures each cell on its own. What it reads is') }}
      <Term id="sc_expresion" :label="L('qué genes están encendidos', 'which genes are switched on')" />
      {{ L('en cada una, y eso dice de qué tipo es y qué está haciendo.', 'in each one, and that says what type it is and what it is doing.') }}
    </p>

    <figure class="cel-fig">
      <p class="eyebrow--sm cel-fig__marca">{{ L('Metáfora', 'Metaphor') }}</p>
      <div class="cel-fig__par">
        <div class="cel-fig__col">
          <svg viewBox="0 0 260 150" class="cel-svg" role="img" :aria-label="L('Un vaso de batido: todo mezclado en un solo color.', 'A smoothie glass: everything blended into one color.')">
            <path d="M70 24 H190 L176 128 Q175 134 168 134 H92 Q85 134 84 128 Z" fill="var(--color-miriam-soft)" stroke="var(--color-text)" stroke-width="2.5" stroke-linejoin="round" />
            <path d="M76 52 Q103 44 130 52 T184 52" fill="none" stroke="var(--color-text)" stroke-width="2" stroke-opacity="0.45" />
            <line x1="148" y1="6" x2="168" y2="46" stroke="var(--color-text)" stroke-width="3" stroke-linecap="round" />
          </svg>
          <p class="cel-fig__pie"><strong>{{ L('El batido:', 'The smoothie:') }}</strong> {{ L('sabes que lleva fresa, pero no cuántas fresas había ni si alguna estaba pasada.', 'you know it has strawberry, but not how many strawberries went in or whether one was off.') }}</p>
        </div>
        <div class="cel-fig__col">
          <svg viewBox="0 0 260 150" class="cel-svg" role="img" :aria-label="L('Un frutero con piezas separadas de cuatro formas distintas: círculos, cuadrados, triángulos y rombos.', 'A fruit bowl with separate pieces of four different shapes: circles, squares, triangles and diamonds.')">
            <g stroke="var(--color-text)" stroke-width="2" stroke-linejoin="round">
              <template v-for="(t, i) in trozos" :key="i">
                <circle v-if="t[0] === 0" :cx="t[1]" :cy="t[2]" r="10" fill="var(--color-miriam)" />
                <rect v-else-if="t[0] === 1" :x="t[1] - 9" :y="t[2] - 9" width="18" height="18" rx="3" fill="var(--color-text)" />
                <path v-else-if="t[0] === 2" :d="`M${t[1]} ${t[2] - 11} L${t[1] + 11} ${t[2] + 9} L${t[1] - 11} ${t[2] + 9} Z`" fill="var(--color-miriam-soft)" />
                <path v-else :d="`M${t[1]} ${t[2] - 11} L${t[1] + 10} ${t[2]} L${t[1]} ${t[2] + 11} L${t[1] - 10} ${t[2]} Z`" fill="var(--color-bg)" />
              </template>
            </g>
            <path d="M28 98 H232 Q228 142 130 146 Q32 142 28 98 Z" fill="var(--color-bg-card)" stroke="var(--color-text)" stroke-width="2.5" stroke-linejoin="round" />
          </svg>
          <p class="cel-fig__pie"><strong>{{ L('El frutero:', 'The fruit bowl:') }}</strong> {{ L('ves cada pieza, de qué tipo es y cuántas hay de cada una.', 'you see each piece, what type it is and how many of each there are.') }}</p>
        </div>
      </div>
      <figcaption class="cel-fig__nota">{{ L('Es solo una imagen para entenderlo. El batido son las pruebas habituales, con todo mezclado. El frutero es el análisis célula a célula.', 'This is only a picture to help. The smoothie is the usual tests, with everything mixed together. The fruit bowl is the cell-by-cell analysis.') }}</figcaption>
    </figure>
  </section>
</template>

<style scoped>
.cel-fig { margin: var(--sp-24) 0 0; background: var(--color-bg-card); border: 1px solid rgb(var(--color-text-rgb) / 0.08); border-radius: var(--radius-card); padding: var(--sp-16); }
@media (min-width: 640px) { .cel-fig { padding: var(--sp-24); } }
.cel-fig__marca { margin: 0 0 var(--sp-12); }
.cel-fig__par { display: grid; gap: var(--sp-24); grid-template-columns: 1fr; }
@media (min-width: 640px) { .cel-fig__par { grid-template-columns: 1fr 1fr; } }
.cel-svg { display: block; width: 100%; max-width: 300px; height: auto; margin: 0 auto; color: var(--color-text); }
.cel-fig__pie { margin: var(--sp-8) 0 0; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.cel-fig__nota { margin-top: var(--sp-16); font-size: var(--texto-xs); line-height: 1.5; color: var(--color-text-soft); }
</style>
