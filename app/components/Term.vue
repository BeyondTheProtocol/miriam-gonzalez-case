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
      def: 'FGFR1 (cromosoma 8p11) amplificado: ×13 en el primario de 2024 y unas 33 copias en el hueso de 2026, con otra plataforma. Un gen que impulsa el crecimiento del tumor y una diana de tratamiento posible.',
    },
    en: {
      label: 'FGFR1 ×13',
      def: 'FGFR1 (chromosome 8p11) amplified: ×13 in the 2024 primary and about 33 copies in the 2026 bone sample, on another platform. A gene driving tumor growth and a possible treatment target.',
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
      def: 'Sobreexpresión de receptores de somatostatina en metástasis óseas por PET-68Ga-DOTATOC (26/05/2026), con captación heterogénea. Es un hallazgo por imagen: en tejido (IHQ SSTR2) no se ha medido, y el hígado, que en mayo no tenía lesiones, no se ha estudiado. Abre la vía de terapia con radioligandos (PRRT).',
    },
    en: {
      label: 'SSTR+',
      def: 'Somatostatin-receptor overexpression in bone metastases on 68Ga-DOTATOC PET (26 May 2026), with heterogeneous uptake. It is an imaging finding: it has not been measured in tissue (SSTR2 IHC), and the liver, which had no lesions in May, has not been studied. It opens the radioligand therapy (PRRT) route.',
    },
  },
  ccnd1: {
    es: {
      label: 'CCND1 ×20',
      def: 'Gen de la ciclina D1 (clúster 11q13, con FGF3/4/19) amplificado: ×20 en el primario de 2024 y unas 37 copias en el hueso de 2026. Acelera la división celular y se asocia a resistencia a ciertas terapias hormonales.',
    },
    en: {
      label: 'CCND1 ×20',
      def: 'Cyclin D1 gene (11q13 cluster, with FGF3/4/19) amplified: ×20 in the 2024 primary and about 37 copies in the 2026 bone sample. It speeds up cell division and is linked to resistance to some hormone therapies.',
    },
  },
  esr1: {
    es: {
      label: 'ESR1 D538G',
      def: 'Mutación en el receptor de estrógeno que aparece tras el tratamiento hormonal y vuelve al tumor resistente a él. En este caso se vio en sangre (ctDNA, 2026) y no en el tejido óseo de julio.',
    },
    en: {
      label: 'ESR1 D538G',
      def: 'Estrogen-receptor mutation that emerges after hormone therapy and makes the tumor resistant to it. In this case it was seen in blood (ctDNA, 2026) and not in the July bone tissue.',
    },
  },
  rb1: {
    es: {
      label: 'pérdida de RB1',
      def: 'Pérdida de un gen «freno» del ciclo celular. Suele indicar un tumor más agresivo y resistencia a los inhibidores de CDK4/6. En este caso hay 3 variantes en sangre (ctDNA, 2026) que el tejido óseo de julio no confirma.',
    },
    en: {
      label: 'RB1 loss',
      def: 'Loss of a cell-cycle “brake” gene. It usually signals a more aggressive tumor and resistance to CDK4/6 inhibitors. In this case there are 3 variants in blood (ctDNA, 2026) that the July bone tissue does not confirm.',
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
      label: 'ECOG 0',
      def: 'Escala de estado funcional (0 = actividad normal, sin limitación). Vall d\'Hebron anota ECOG 0 en todas las visitas documentadas de 2026; la última, el 9 de septiembre.',
    },
    en: {
      label: 'ECOG 0',
      def: 'Performance-status scale (0 = fully active, no restriction). Vall d\'Hebron records ECOG 0 at every documented 2026 visit; the latest on 9 September.',
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
      def: 'El cáncer se ha extendido más allá de la mama; en su caso, al hueso desde el diagnóstico y al hígado desde julio de 2026.',
    },
    en: {
      label: 'metastatic',
      def: 'The cancer has spread beyond the breast; in her case, to bone since diagnosis and to the liver since July 2026.',
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
  axis_trop2: {
    es: {
      label: 'TROP-2 → Dato-DXd (ensayo, oct 2026)',
      def: 'Datopotamab deruxtecan: un anticuerpo contra TROP-2 que lleva un fármaco citotóxico (inhibidor de topoisomerasa I) al interior de la célula. Es el tratamiento del ensayo TROPION-Breast06, fase IIIb de un brazo para HR+/HER2 IHQ 0 sin quimioterapia previa; su primera dosis está prevista en octubre de 2026. El ensayo no exige medir TROP-2 y en su tejido no se ha medido.',
    },
    en: {
      label: 'TROP-2 → Dato-DXd (trial, Oct 2026)',
      def: 'Datopotamab deruxtecan: an anti-TROP-2 antibody that carries a cytotoxic drug (a topoisomerase I inhibitor) into the cell. It is the treatment in TROPION-Breast06, a single-arm phase IIIb trial for HR+/HER2 IHC 0 without prior chemotherapy; the first dose is expected in October 2026. The trial does not require TROP-2 testing and it has not been measured in her tissue.',
    },
  },
  axis_fgfr: {
    es: {
      label: 'FGFR1 amplificado → FGFRi',
      def: 'FGFRi: inhibidores de FGFR (erdafitinib, futibatinib, ponatinib) que bloquean la señal de FGFR1, amplificado en todo el tejido estudiado y uno de los motores del tumor. Es una hipótesis: la amplificación sola no garantiza respuesta.',
    },
    en: {
      label: 'Amplified FGFR1 → FGFRi',
      def: 'FGFRi: FGFR inhibitors (erdafitinib, futibatinib, ponatinib) that block signaling from FGFR1, amplified in all tissue studied and one of the tumor’s drivers. A hypothesis: amplification alone does not guarantee response.',
    },
  },
  axis_sstr: {
    es: {
      label: 'SSTR+ en hueso → PRRT',
      def: 'PRRT: terapia con radioligandos. Un fármaco radiactivo se une a los receptores de somatostatina (SSTR) del tumor y lo irradia desde dentro. La captación se vio en hueso en mayo de 2026; las lesiones del hígado no se han estudiado con este trazador.',
    },
    en: {
      label: 'SSTR+ in bone → PRRT',
      def: 'PRRT: radioligand therapy. A radioactive drug binds the tumor’s somatostatin receptors (SSTR) and irradiates it from within. Uptake was seen in bone in May 2026; the liver lesions have not been studied with this tracer.',
    },
  },
  axis_esr1: {
    es: {
      label: 'RE 0 % en hígado → eje endocrino',
      def: 'El eje hormonal pierde peso. Hubo tres líneas hormonales con progresión; la ESR1 D538G se vio en sangre y no en el tejido óseo; y la metástasis del hígado, la lesión que crece, ya no tiene receptor de estrógeno (RE 0 %, RP 5 %).',
    },
    en: {
      label: 'ER 0% in liver → endocrine axis',
      def: 'The hormonal axis loses weight. Three hormonal lines ended in progression; ESR1 D538G was seen in blood and not in bone tissue; and the liver metastasis, the lesion that is growing, no longer has the estrogen receptor (ER 0%, PR 5%).',
    },
  },
  axis_ne: {
    es: {
      label: 'CgA/Syn+ en hígado → eje neuroendocrino',
      def: 'La metástasis del hígado conserva la diferenciación neuroendocrina (cromogranina A y sinaptofisina positivas) mientras pierde el receptor de estrógeno. Las 3 variantes de RB1 que apuntaban a una transformación neuroendocrina se vieron solo en sangre. El eje abre dianas propias (SSTR2, DLL3) que en el hígado no se han medido.',
    },
    en: {
      label: 'CgA/Syn+ in liver → neuroendocrine axis',
      def: 'The liver metastasis keeps its neuroendocrine differentiation (chromogranin A and synaptophysin positive) while losing the estrogen receptor. The 3 RB1 variants that pointed to neuroendocrine transformation were seen only in blood. The axis opens its own targets (SSTR2, DLL3), not yet measured in the liver.',
    },
  },
  /* §13 · ⓘ «Cómo se lee el mapa 3D» (visor de focos) → tooltip al pasar, no clic-para-ver. */
  lectura_mapa3d: {
    es: {
      label: 'Cómo se lee el mapa',
      def: 'Cada vista mapea UNA variable (más oscuro/saturado = más valor). La captación PET es un gradiente continuo, sin borde tumoral neto (~4–5 mm). «Blástico» = densidad del CT (forma), no biología. El Galio es un proxy aproximado por ahora. La diana parpadeante (un foco coral con volumen calcado SOBRE la superficie del hueso, conformando su curvatura) señala la zona de máxima captación (≈ dónde apuntaría la biopsia): un punto orientativo, no un borde tumoral. Informa, no concluye.',
    },
    en: {
      label: 'How to read the map',
      def: 'Each view maps ONE variable (darker/more saturated = higher value). PET uptake is a continuous gradient, with no sharp tumor border (~4–5 mm). “Blastic” = CT density (shape), not biology. Gallium is an approximate proxy for now. The blinking target (a coral focus with volume printed ONTO the bone surface, conforming to its curvature) flags the peak-uptake zone (≈ where the biopsy would aim): an orientative point, not a tumor outline. It informs; it does not conclude.',
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
  text-decoration-color: rgb(var(--color-miriam-rgb) / 0.6);
  transition: text-decoration-color 0.2s ease;
  white-space: normal;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.term:hover,
.term:focus-visible,
.term[aria-expanded='true'] {
  text-decoration-style: solid;
  text-decoration-color: var(--color-miriam);
}
.term:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: 2px;
  border-radius: 2px;
}
/* Variante "badge": mantiene el pill genómico (miriam-soft) pero es disparador
   de tooltip. Anula los resets de .term (sin subrayado, con fondo y padding). */
.term--badge {
  display: inline-block;
  background: var(--color-miriam-soft); /* miriam-soft */
  color: var(--color-text); /* berenjena */
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
  border-color: var(--color-miriam); /* miriam */
  box-shadow: 0 0 0 3px rgb(var(--color-miriam-rgb) / 0.18);
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
  background: var(--color-text);
  color: var(--color-bg);
  font-family: 'Hanken Grotesk', system-ui, sans-serif;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: normal;
  box-shadow: 0 14px 34px -12px rgb(var(--color-text-rgb) / 0.55);
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
  background: var(--color-text);
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
