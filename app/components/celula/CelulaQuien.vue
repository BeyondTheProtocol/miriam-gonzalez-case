<script setup lang="ts">
/**
 * Bloque «Quién lo ha hecho» (17-oct-2026). Da crédito al laboratorio de Paloma Cejas (Dana-Farber),
 * que ya es público en /ciencia, y cita una frase de su comentario público en LinkedIn (octubre de 2026).
 * Es un comentario suyo en el post de LinkedIn de Miriam; la fuente enlaza a él (`urlPost`).
 *
 * Reglas del bloque:
 *  - Solo lo público. Nada de lo que Paloma haya dicho en privado sobre los resultados: lo que la
 *    página cuenta de ellos no se le atribuye, y la última línea lo deja escrito.
 *  - No promete más que el post. La cita elegida es la prudente («better our chances»).
 *  - Describe y equipa; no concluye ni recomienda tratamiento.
 * Va entre «Sobre qué tejido» y «Qué preguntas», lejos de los resultados a propósito: la cita
 * nunca queda pegada a un resultado concreto.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
// Enlace directo al comentario de Paloma en el post de LinkedIn de Miriam (dado el 17-oct-2026).
const urlPost = 'https://www.linkedin.com/feed/update/urn:li:activity:7516775760523599874/?dashCommentUrn=urn%3Ali%3Afsd_comment%3A%287517029428342988800%2Curn%3Ali%3Aactivity%3A7516775760523599874%29'
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Quién lo ha hecho', 'Who did it') }}</h2>
    <p class="cel-p">
      {{ L('El análisis lo hace el laboratorio de Paloma Cejas en el Dana-Farber Cancer Institute, donde es codirectora del Center for Functional Cancer Epigenetics.',
        'The analysis is done by Paloma Cejas’s lab at the Dana-Farber Cancer Institute, where she is co-director of the Center for Functional Cancer Epigenetics.') }}
    </p>
    <p class="cel-p">
      {{ L('Lo que lo hace especial es el tejido. Hasta hace poco, leer célula a célula pedía tejido fresco. Con', 'What makes it special is the tissue. Until recently, reading cell by cell needed fresh tissue. With') }}
      <Term id="sc_flex" :label="L('10x Genomics Flex', '10x Genomics Flex')" />{{ L(', el laboratorio lo hace sobre', ', the lab does it on') }}
      <Term id="sc_ffpe" :label="L('parafina', 'paraffin')" />{{ L(', que es como se guardan las biopsias de los hospitales. Eso permite estudiar muestras reales de pacientes, como estas.', ', the way hospitals store biopsies. That makes it possible to study real patient samples, like these.') }}
    </p>
    <p class="cel-p">
      {{ L('Es investigación traslacional: llevar una técnica de laboratorio a muestras de pacientes, para que lo que se aprenda pueda servir algún día en la consulta.',
        'This is translational research: taking a lab technique to patient samples, so that what is learned can one day help in the clinic.') }}
    </p>

    <figure class="cel-cita card-base card-marked">
      <blockquote class="cel-cita__q" lang="en">
        <p>“The more we analyze real patient samples, the better our chances of identifying robust biomarkers that can ultimately benefit more patients.”</p>
      </blockquote>
      <p v-if="lang === 'es'" class="cel-cita__tr">
        <span class="cel-cita__trl">Traducción al español</span>
        «Cuantas más muestras reales de pacientes analizamos, más posibilidades tenemos de identificar biomarcadores sólidos que acaben beneficiando a más pacientes.»
      </p>
      <figcaption class="cel-cita__f">
        Paloma Cejas, Dana-Farber,
        <a v-if="urlPost" :href="urlPost" target="_blank" rel="noopener noreferrer">{{ L('en un comentario en LinkedIn', 'in a LinkedIn comment') }}</a>
        <template v-else>{{ L('en un comentario en LinkedIn', 'in a LinkedIn comment') }}</template>
        · {{ L('octubre de 2026', 'October 2026') }}
      </figcaption>
    </figure>

    <p class="cel-p cel-p--sm">
      {{ L('El laboratorio hace la prueba y su propio análisis. Las cifras de «Resultados» salen de un análisis aparte que hace Polaris, el sistema de Miriam, sobre esos mismos datos: no son cifras del laboratorio. Ni esas cifras ni las explicaciones de esta página hablan en nombre del laboratorio.',
        'The lab runs the test and its own analysis. The figures in “Results” come from a separate analysis that Polaris, Miriam’s system, runs on those same data: they are not the lab’s figures. Neither those figures nor the explanations on this page speak for the lab.') }}
    </p>
  </section>
</template>

<style scoped>
.cel-cita { margin: var(--sp-24) 0 var(--sp-24); max-width: var(--measure); }
.cel-cita__q { margin: 0; padding: 0; }
.cel-cita__q p { margin: 0; font: 500 var(--texto-lg)/1.45 var(--font-display); color: var(--color-text); }
.cel-cita__tr { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.cel-cita__trl { display: block; margin-bottom: 2px; font: 500 var(--texto-xs)/1.5 var(--font-mono); letter-spacing: 0.04em; text-transform: uppercase; }
.cel-cita__f { margin-top: var(--sp-16); padding-top: var(--sp-12); border-top: 1px solid rgb(var(--color-text-rgb) / 0.12); font: var(--tipo-body-sm); color: var(--color-text-soft); }
.cel-cita__f a { color: var(--color-text); text-decoration: underline; text-underline-offset: 3px; }
</style>
