<script setup lang="ts">
/**
 * Bloque 3 · Cuatro preguntas. Son PREGUNTAS, no hallazgos: cada tarjeta dice qué se mira y
 * qué no resolvería. Las dianas nombradas son las ya públicas del caso (TROP2, Nectin-4, DLL3,
 * SSTR2, B7-H3, CEA) y van como ejemplo de pregunta: ninguna se afirma del tumor.
 * La 2 es una respuesta parcial a propósito: HLA-A/B/C no tienen sonda (ver «Lo que no puede decir»).
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Cuatro preguntas', 'Four questions') }}</h2>
    <p class="cel-p">{{ L('Esto es lo que el análisis puede llegar a contestar. Son preguntas, no hallazgos.', 'This is what the analysis may be able to answer. These are questions, not findings.') }}</p>

    <ol class="cel-preg">
      <li class="cel-card card-base">
        <p class="cel-preg__n" aria-hidden="true">1</p>
        <div>
          <h3 class="cel-h3">{{ L('¿Qué células hay?', 'Which cells are there?') }}</h3>
          <p class="cel-card__p">{{ L('Se agrupan las células por parecido en lo que tienen encendido. Sale algo parecido a un censo: células tumorales (y si hay más de un tipo), células inmunes, células de sostén.', 'Cells are grouped by how similar their switched-on genes are. The result is something like a census: tumor cells (and whether there is more than one type), immune cells, supporting cells.') }}</p>
        </div>
      </li>
      <li class="cel-card card-base">
        <p class="cel-preg__n" aria-hidden="true">2</p>
        <div>
          <h3 class="cel-h3">{{ L('¿Puede verlo el sistema inmune?', 'Can the immune system see it?') }}</h3>
          <p class="cel-card__p">{{ L('Respuesta parcial. Se puede ver qué células inmunes hay dentro de la muestra y qué señales de activación llevan. Algunas moléculas por las que el tumor se muestra al sistema inmune, como las', 'A partial answer. It shows which immune cells are inside the sample and which activation signals they carry. Some of the molecules through which a tumor shows itself to the immune system, like the') }}
            <Term id="sc_hla" :label="L('HLA-\u2060A, -\u2060B y -\u2060C', 'HLA-\u2060A, -\u2060B and -\u2060C')" />{{ L(', no tienen sonda y esta prueba no las lee.', ', have no probe and this test does not read them.') }}</p>
        </div>
      </li>
      <li class="cel-card card-base">
        <p class="cel-preg__n" aria-hidden="true">3</p>
        <div>
          <h3 class="cel-h3">{{ L('¿Qué dianas de superficie hay y en cuántas células?', 'Which surface targets are there, and in how many cells?') }}</h3>
          <p class="cel-card__p">{{ L('Entre lo que se buscó: HER3, 5T4, LIV-1, TROP2, Nectin-\u20604, B7-\u2060H3, DLL3 y SSTR2. La pregunta es si su gen está encendido y en qué fracción de las células tumorales (en el hígado, de momento, esa fracción no se puede contar), un detalle que una prueba sobre el tejido entero no da. Si un gen no está en el panel de sondas, no se podrá mirar. Se nombran como posibles',
              'Among what was looked for: HER3, 5T4, LIV-1, TROP2, Nectin-\u20604, B7-\u2060H3, DLL3 and SSTR2. The question is whether their gene is switched on and in what fraction of the tumor cells (in the liver that fraction cannot be counted yet), a detail that a test on the whole tissue does not give. If a gene is not in the probe panel, it cannot be looked at. They are named as possible') }}
            <Term id="sc_diana" :label="L('dianas de superficie', 'surface targets')" />{{ L(' por las que preguntar.', ' to ask about.') }}</p>
        </div>
      </li>
      <li class="cel-card card-base">
        <p class="cel-preg__n" aria-hidden="true">4</p>
        <div>
          <h3 class="cel-h3">{{ L('¿Qué puede servir para una terapia personalizada?', 'What could be useful for a personalized therapy?') }}</h3>
          <p class="cel-card__p">{{ L('Esta prueba mide qué genes se expresan. No lee mutaciones. Los', 'This test measures which genes are expressed; it does not read mutations. The') }}
            <Term id="sc_neoantigeno" :label="L('neoantígenos', 'neoantigens')" /> {{ L('salen de otra prueba, la secuenciación del', 'come from another test, the sequencing of the') }}
            <Term id="sc_wes" :label="L('exoma (WES)', 'exome (WES)')" />{{ L('. Lo que puede aportar el análisis célula a célula es el contexto: en qué células está encendido el gen de cada candidato, si es que lo está.', '. What the cell-by-cell analysis can add is context: in which cells each candidate’s gene is switched on, if it is.') }}
            <DatosSello s="inferido" :lang="lang" /></p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.cel-preg { display: grid; gap: var(--sp-12); margin: var(--sp-16) 0 0; padding: 0; list-style: none; }
@media (min-width: 900px) { .cel-preg { grid-template-columns: 1fr 1fr; gap: var(--sp-16); } }
.cel-preg li { display: flex; gap: var(--sp-12); align-items: flex-start; }
.cel-preg__n {
  flex: none; width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center;
  background: var(--color-miriam-soft); color: var(--color-text); font: 600 var(--texto-sm)/1 var(--font-mono);
}
</style>
