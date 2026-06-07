<script setup lang="ts">
/**
 * Glosario en línea (DS §13): término con subrayado punteado que revela su
 * definición en hover/focus/tap, sin sacar al usuario de la página. El
 * `aria-label` lleva término + definición para lectores de pantalla.
 */
const props = defineProps<{ id: string; label?: string; variant?: 'inline' | 'badge' }>()
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
      label: 'SSTR2+',
      def: 'Sobreexpresión de receptores de somatostatina confirmada por PET-68Ga-DOTATOC (26/05/2026). Es un hallazgo funcional (por imagen); la confirmación en tejido (IHQ SSTR2) está pendiente de la rebiopsia. Abre la vía de terapia con radioligandos (PRRT).',
    },
    en: {
      label: 'SSTR2+',
      def: 'Somatostatin-receptor overexpression confirmed by 68Ga-DOTATOC PET (26 May 2026). This is a functional (imaging) finding; tissue confirmation (SSTR2 IHC) is pending the rebiopsy. It opens the radioligand therapy (PRRT) route.',
    },
  },
  ccnd1: {
    es: {
      label: 'CCND1 ×20',
      def: 'Gen de la ciclina D1 amplificado 20 veces. Acelera la división celular y se asocia a resistencia a ciertas terapias hormonales.',
    },
    en: {
      label: 'CCND1 ×20',
      def: 'Cyclin D1 gene amplified 20 times. It speeds up cell division and is linked to resistance to some hormone therapies.',
    },
  },
  esr1: {
    es: {
      label: 'ESR1 D538G',
      def: 'Mutación en el receptor de estrógeno que aparece tras el tratamiento hormonal y vuelve al tumor resistente a él.',
    },
    en: {
      label: 'ESR1 D538G',
      def: 'Estrogen-receptor mutation that emerges after hormone therapy and makes the tumor resistant to it.',
    },
  },
  rb1: {
    es: {
      label: 'pérdida de RB1',
      def: 'Pérdida de un gen «freno» del ciclo celular. Suele indicar un tumor más agresivo y resistencia a los inhibidores de CDK4/6.',
    },
    en: {
      label: 'RB1 loss',
      def: 'Loss of a cell-cycle “brake” gene. It usually signals a more aggressive tumor and resistance to CDK4/6 inhibitors.',
    },
  },
  cdk46i: {
    es: {
      label: 'inhibidores de CDK4/6',
      def: 'Fármacos (como abemaciclib o palbociclib) que frenan la división de las células tumorales en el cáncer de mama hormonal.',
    },
    en: {
      label: 'CDK4/6 inhibitors',
      def: 'Drugs (such as abemaciclib or palbociclib) that slow tumor-cell division in hormone-driven breast cancer.',
    },
  },
  prrt: {
    es: {
      label: 'PRRT',
      def: 'Terapia con radioligandos: un fármaco radiactivo se une a los receptores de somatostatina del tumor y lo irradia desde dentro.',
    },
    en: {
      label: 'PRRT',
      def: 'Radioligand therapy: a radioactive drug binds the tumor’s somatostatin receptors and irradiates it from within.',
    },
  },
  ctdna: {
    es: {
      label: 'ctDNA',
      def: 'ADN tumoral circulante: fragmentos del tumor que flotan en la sangre y permiten seguir su evolución con un análisis, sin biopsia.',
    },
    en: {
      label: 'ctDNA',
      def: 'Circulating tumor DNA: tumor fragments floating in the blood that let you track its evolution with a blood test, no biopsy.',
    },
  },
  ecog: {
    es: {
      label: 'ECOG 1',
      def: 'Escala ECOG: 0 desde el diagnóstico (enero 2024) hasta el 01/04/2026; 1 desde el 30/04/2026 (aumento del dolor óseo en cadera, capacidad funcional conservada).',
    },
    en: {
      label: 'ECOG 1',
      def: 'ECOG scale: 0 from diagnosis (January 2024) until 01 Apr 2026; 1 since 30 Apr 2026 (increased hip bone pain, preserved functional capacity).',
    },
  },
  ki67: {
    es: {
      label: 'Ki67 60%',
      def: 'Marca cuántas células del tumor se están dividiendo; un valor alto indica un tumor más proliferativo.',
    },
    en: {
      label: 'Ki67 60%',
      def: 'Shows how many tumor cells are dividing; a high value means a more proliferative tumor.',
    },
  },
  nec: {
    es: {
      label: 'NEC G3',
      def: 'Carcinoma neuroendocrino de alto grado: una hipótesis del caso, aún pendiente de confirmar.',
    },
    en: {
      label: 'NEC G3',
      def: 'High-grade neuroendocrine carcinoma: a hypothesis in this case, still to be confirmed.',
    },
  },
  her2: {
    es: {
      label: 'HER2−',
      def: 'Proteína que en otros cánceres de mama guía el tratamiento; en este tumor es negativa.',
    },
    en: {
      label: 'HER2−',
      def: 'A protein that guides treatment in other breast cancers; in this tumor it is negative.',
    },
  },
  hr: {
    es: {
      label: 'HR+',
      def: 'El tumor crece con hormonas (receptores de estrógeno y progesterona positivos).',
    },
    en: {
      label: 'HR+',
      def: 'The tumor grows with hormones (estrogen and progesterone receptor positive).',
    },
  },
  metastasico: {
    es: {
      label: 'metastásico',
      def: 'El cáncer se ha extendido más allá de la mama; en su caso, al hueso.',
    },
    en: {
      label: 'metastatic',
      def: 'The cancer has spread beyond the breast; in her case, to the bone.',
    },
  },
  radioligandos: {
    es: {
      label: 'radioligandos (PRRT)',
      def: 'Tratamiento que lleva una partícula radiactiva directa a las células que expresan la diana SSTR2.',
    },
    en: {
      label: 'radioligands (PRRT)',
      def: 'A therapy that delivers a radioactive particle straight to cells expressing the SSTR2 target.',
    },
  },
}

const entry = computed(() => {
  const g = GLOSSARY[props.id]
  if (!g) return { label: props.id, def: '' }
  return locale.value === 'es' ? g.es : g.en
})

const open = ref(false)
const positioned = ref(false)
const placement = ref<'top' | 'bottom'>('top')
const caretLeft = ref(16)
const triggerRef = ref<HTMLElement | null>(null)
const popRef = ref<HTMLElement | null>(null)
const popStyle = reactive({ top: '0px', left: '0px', width: 'auto' })

/** Solo abrimos en hover cuando el dispositivo tiene puntero fino (escritorio).
 *  En táctil el tooltip se gobierna íntegramente con el tap (toggle). */
const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

/** Posicionamiento fijo respecto al viewport: el popover se teletransporta a
 *  <body>, así nunca lo recorta un ancestro con overflow, y se ajusta (clamp)
 *  a los bordes de la pantalla — clave en móvil cuando el término va a la derecha. */
function position() {
  const trigger = triggerRef.value
  const pop = popRef.value
  if (!trigger || !pop) return
  const margin = 8
  const r = trigger.getBoundingClientRect()
  const popW = Math.min(300, window.innerWidth - margin * 2)
  popStyle.width = `${popW}px`
  const left = Math.max(margin, Math.min(r.left, window.innerWidth - popW - margin))
  const popH = pop.offsetHeight
  let top = r.top - popH - 10
  placement.value = 'top'
  if (top < margin) {
    top = r.bottom + 10
    placement.value = 'bottom'
  }
  popStyle.top = `${top}px`
  popStyle.left = `${left}px`
  caretLeft.value = Math.max(14, Math.min(r.left + r.width / 2 - left, popW - 14))
  positioned.value = true
}

async function show() {
  if (!entry.value.def) return
  open.value = true
  positioned.value = false
  await nextTick()
  position()
}
function hide() {
  open.value = false
}
function toggle() {
  if (open.value) hide()
  else show()
}

watch(open, (isOpen) => {
  if (typeof window === 'undefined') return
  if (isOpen) {
    window.addEventListener('scroll', position, true)
    window.addEventListener('resize', position)
  } else {
    window.removeEventListener('scroll', position, true)
    window.removeEventListener('resize', position)
  }
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', position, true)
  window.removeEventListener('resize', position)
})

onClickOutside(triggerRef, () => hide(), { ignore: [popRef] })
</script>

<template>
  <span class="term-wrap">
    <button
      ref="triggerRef"
      type="button"
      :class="['term', variant === 'badge' && 'term--badge']"
      :aria-label="`${entry.label}. ${entry.def}`"
      :aria-expanded="open"
      @click="toggle"
      @mouseenter="canHover() && show()"
      @mouseleave="canHover() && hide()"
      @keydown.escape="hide"
      @blur="hide"
    >{{ label ?? entry.label }}</button>
    <Teleport to="body">
      <span
        v-if="open && entry.def"
        ref="popRef"
        role="tooltip"
        class="term-pop"
        :class="[`term-pop--${placement}`, { 'is-positioned': positioned }]"
        :style="popStyle"
      >
        {{ entry.def }}
        <span class="term-caret" :style="{ left: `${caretLeft}px` }" aria-hidden="true" />
      </span>
    </Teleport>
  </span>
</template>

<style scoped>
.term-wrap {
  position: relative;
}
/* Anotación, no enlace: subrayado punteado en violeta pero el texto mantiene
   el color del cuerpo (berenjena) — los enlaces son violeta —, con cursor de
   ayuda y tooltip. Así se lee como «palabra con definición», no como navegación.
   El punteado señala «tócame/pásame» también en móvil; se refuerza a sólido al
   pasar/enfocar/abrir, en sintonía con el tooltip. */
.term {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(157, 68, 171, 0.6);
  transition: text-decoration-color 0.2s ease;
  white-space: normal;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.term:hover,
.term:focus-visible,
.term[aria-expanded='true'] {
  text-decoration-style: solid;
  text-decoration-color: #9d44ab;
}
.term:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
  border-radius: 2px;
}
/* Variante "badge": mantiene el pill genómico (miriam-soft) pero es disparador
   de tooltip. Anula los resets de .term (sin subrayado, con fondo y padding). */
.term--badge {
  display: inline-block;
  background: #e8d4ed; /* miriam-soft */
  color: #2d1b3d; /* berenjena */
  border-radius: 9999px;
  padding: 4px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.2;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: help;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
/* A4 · brillo sutil al pasar/enfocar: refuerza que el badge abre tooltip. */
.term--badge:hover,
.term--badge:focus-visible,
.term--badge[aria-expanded='true'] {
  text-decoration: none;
  border-color: #9d44ab; /* miriam */
  box-shadow: 0 0 0 3px rgba(157, 68, 171, 0.18);
}
.term--badge:focus-visible {
  border-radius: 9999px;
}
@media (prefers-reduced-motion: reduce) {
  .term {
    transition: none;
  }
}
.term-pop {
  position: fixed;
  z-index: 60;
  padding: 11px 13px;
  border-radius: 11px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: normal;
  box-shadow: 0 14px 34px -12px rgba(45, 27, 61, 0.55);
  opacity: 0;
  transform: translateY(3px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.term-pop.is-positioned {
  opacity: 1;
  transform: none;
}
.term-caret {
  position: absolute;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  background: #2d1b3d;
  transform: rotate(45deg);
}
.term-pop--top .term-caret {
  bottom: -5px;
}
.term-pop--bottom .term-caret {
  top: -5px;
}
@media (prefers-reduced-motion: reduce) {
  .term-pop {
    transition: none;
    transform: none;
  }
}
</style>
