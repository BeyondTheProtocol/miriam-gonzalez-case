/**
 * Glosario de /celula-a-celula. Una sola fuente para dos usos:
 * · `Term.vue` lo mezcla en su GLOSSARY (definición al pasar/enfocar/tocar el término).
 * · `CelulaGlosario.vue` lo pinta entero, con la definición visible (sin depender del hover).
 *
 * `ORDEN_GLOSARIO_CELULA` fija el orden de la lista visible; los ids llevan prefijo `sc_`
 * para no chocar con los de Term.
 */
export interface EntradaGlosario {
  es: { label: string; def: string }
  en: { label: string; def: string }
}

export const GLOSARIO_CELULA: Record<string, EntradaGlosario> = {
  sc_celula_unica: {
    es: {
      label: 'célula única (single-cell)',
      def: 'Análisis que mide cada célula por separado, en lugar de triturar el tejido y medir la media de todas.',
    },
    en: {
      label: 'single-cell',
      def: 'An analysis that measures each cell on its own, instead of grinding up the tissue and measuring the average of all of them.',
    },
  },
  sc_expresion: {
    es: {
      label: 'expresión génica',
      def: 'Qué genes tiene encendidos una célula y con qué fuerza. Se mide leyendo el ARN, la copia de trabajo de cada gen.',
    },
    en: {
      label: 'gene expression',
      def: 'Which genes a cell has switched on, and how strongly. It is measured by reading RNA, the working copy of each gene.',
    },
  },
  sc_arn: {
    es: {
      label: 'ARN',
      def: 'Copia temporal de un gen que la célula fabrica cuando lo usa. Todavía no es la proteína: entre una y otra hay pasos que pueden cambiar la cantidad.',
    },
    en: {
      label: 'RNA',
      def: 'A temporary copy of a gene that the cell makes when it uses it. It is not the protein yet: there are steps in between that can change the amount.',
    },
  },
  sc_sondas: {
    es: {
      label: 'panel de sondas',
      def: 'Fragmentos diseñados de antemano que se pegan a un gen concreto. Solo se mide lo que tiene sonda: un gen fuera del panel no se ve.',
    },
    en: {
      label: 'probe panel',
      def: 'Pre-designed fragments that stick to one specific gene. Only what has a probe gets measured: a gene outside the panel is invisible.',
    },
  },
  sc_flex: {
    es: {
      label: '10x Genomics Flex',
      def: 'Técnica de célula única que lee el ARN con sondas y funciona sobre tejido incluido en parafina, el que se guarda tras una biopsia.',
    },
    en: {
      label: '10x Genomics Flex',
      def: 'A single-cell technique that reads RNA with probes and works on paraffin-embedded tissue, the kind that is stored after a biopsy.',
    },
  },
  sc_ffpe: {
    es: {
      label: 'parafina (FFPE)',
      def: 'Forma habitual de conservar una biopsia: el tejido se fija y se incluye en un bloque de parafina. Dura años, pero parte del ARN se fragmenta.',
    },
    en: {
      label: 'paraffin (FFPE)',
      def: 'The usual way to preserve a biopsy: the tissue is fixed and embedded in a paraffin block. It lasts for years, but part of the RNA breaks into fragments.',
    },
  },
  sc_wes: {
    es: {
      label: 'WES (exoma)',
      def: 'Secuenciación de las partes del ADN que codifican proteínas, en el tumor y en la sangre. Es la prueba que encuentra mutaciones.',
    },
    en: {
      label: 'WES (exome)',
      def: 'Sequencing of the parts of DNA that code for proteins, in the tumor and in blood. It is the test that finds mutations.',
    },
  },
  sc_neoantigeno: {
    es: {
      label: 'neoantígeno',
      def: 'Fragmento de una proteína alterada por una mutación del tumor que el sistema inmune podría reconocer como ajeno. Se predice a partir de las mutaciones.',
    },
    en: {
      label: 'neoantigen',
      def: 'A fragment of a protein altered by a tumor mutation that the immune system might recognize as foreign. It is predicted from the mutations.',
    },
  },
  sc_hla: {
    es: {
      label: 'HLA',
      def: 'Moléculas con las que las células enseñan trozos de sus proteínas a los linfocitos T. Sin ellas, un neoantígeno no llega a mostrarse.',
    },
    en: {
      label: 'HLA',
      def: 'Molecules cells use to show pieces of their proteins to T cells. Without them, a neoantigen never gets displayed.',
    },
  },
  sc_ihq: {
    es: {
      label: 'inmunohistoquímica (IHQ)',
      def: 'Técnica que tiñe proteínas concretas en un corte de tejido. Confirma si la proteína está y en qué células.',
    },
    en: {
      label: 'immunohistochemistry (IHC)',
      def: 'A technique that stains specific proteins on a tissue slice. It confirms whether the protein is there and in which cells.',
    },
  },
  sc_diana: {
    es: {
      label: 'diana de superficie',
      def: 'Molécula en la membrana de la célula tumoral a la que un tratamiento puede unirse.',
    },
    en: {
      label: 'surface target',
      def: 'A molecule on the tumor cell’s membrane that a treatment can bind to.',
    },
  },
}

export const ORDEN_GLOSARIO_CELULA = [
  'sc_celula_unica',
  'sc_expresion',
  'sc_arn',
  'sc_sondas',
  'sc_flex',
  'sc_ffpe',
  'sc_wes',
  'sc_neoantigeno',
  'sc_hla',
  'sc_ihq',
  'sc_diana',
] as const
