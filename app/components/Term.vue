<script setup lang="ts">
/**
 * Glosario en línea (DS §13): término con subrayado punteado que revela su
 * definición en hover/focus/tap, sin sacar al usuario de la página. El
 * `aria-label` lleva término + definición para lectores de pantalla.
 */
const props = defineProps<{ id: string }>()
const { locale } = useI18n()

type Entry = { es: { label: string; def: string }; en: { label: string; def: string } }

const GLOSSARY: Record<string, Entry> = {
  luminal: {
    es: {
      label: 'luminal',
      def: 'Subtipo de cáncer de mama que crece con hormonas (estrógeno/progesterona). Es la parte «estándar» del tumor.',
    },
    en: {
      label: 'luminal',
      def: 'Breast cancer subtype driven by hormones (estrogen/progesterone). The “standard” part of the tumor.',
    },
  },
  neuroendocrino: {
    es: {
      label: 'neuroendocrino',
      def: 'Células con comportamiento neuroendocrino dentro del tumor: la «segunda biología» que el protocolo estándar no trata.',
    },
    en: {
      label: 'neuroendocrine',
      def: 'Cells with neuroendocrine-like behavior within the tumor: the “second biology” the standard protocol doesn’t treat.',
    },
  },
  nof1: {
    es: {
      label: 'N-of-1',
      def: 'Ensayo clínico diseñado para una sola paciente, basado en el perfil real de su tumor.',
    },
    en: {
      label: 'N-of-1',
      def: 'A clinical trial designed for a single patient, based on her tumor’s actual profile.',
    },
  },
  fgfr1: {
    es: {
      label: 'FGFR1 ×13',
      def: 'FGFR1 amplificado 13 veces: un gen que impulsa el crecimiento del tumor y abre posibles dianas de tratamiento.',
    },
    en: {
      label: 'FGFR1 ×13',
      def: 'FGFR1 amplified 13 times: a gene driving tumor growth and a potential treatment target.',
    },
  },
  bcned: {
    es: {
      label: 'BC-NED',
      def: 'Cáncer de mama con diferenciación neuroendocrina: el subtipo poco frecuente del tumor de Miriam.',
    },
    en: {
      label: 'BC-NED',
      def: 'Breast cancer with neuroendocrine differentiation: the rare subtype of Miriam’s tumor.',
    },
  },
  sstr: {
    es: {
      label: 'SSTR+',
      def: 'Receptor de somatostatina presente en el tumor. Abre la vía de las terapias con radioligandos.',
    },
    en: {
      label: 'SSTR+',
      def: 'Somatostatin receptor present in the tumor. Opens the radioligand-therapy path.',
    },
  },
}

const entry = computed(() => {
  const g = GLOSSARY[props.id]
  if (!g) return { label: props.id, def: '' }
  return locale.value === 'es' ? g.es : g.en
})

const open = ref(false)
</script>

<template>
  <span
    class="term-wrap"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <button
      type="button"
      class="term"
      :aria-label="`${entry.label}. ${entry.def}`"
      :aria-expanded="open"
      @click="open = !open"
      @focus="open = true"
      @blur="open = false"
      @keydown.escape="open = false"
    >{{ entry.label }}</button>
    <span v-if="open && entry.def" role="tooltip" class="term-pop">{{ entry.def }}</span>
  </span>
</template>

<style scoped>
.term-wrap {
  position: relative;
  white-space: nowrap;
}
/* Anotación, no enlace: subrayado sólido en violeta pero el texto mantiene
   el color del cuerpo (berenjena) — los enlaces son violeta —, con cursor de
   ayuda y tooltip. Así se lee como «palabra con definición», no como navegación.
   El subrayado se refuerza al pasar/enfocar/abrir, en sintonía con el tooltip. */
.term {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: help;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(157, 68, 171, 0.55);
  transition: text-decoration-color 0.2s ease;
  white-space: normal;
}
.term:hover,
.term:focus-visible,
.term[aria-expanded='true'] {
  text-decoration-color: #9d44ab;
}
.term:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .term {
    transition: none;
  }
}
.term-pop {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  z-index: 30;
  width: max-content;
  max-width: min(300px, 80vw);
  padding: 10px 12px;
  border-radius: 10px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  white-space: normal;
  box-shadow: 0 12px 30px -12px rgba(45, 27, 61, 0.5);
}
@media (prefers-reduced-motion: reduce) {
  .term-pop {
    transition: none;
  }
}
</style>
