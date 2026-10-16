<script setup lang="ts">
/**
 * Bloque 2 · Sobre qué tejido. Solo lo que ya es público en /datos: una metástasis de
 * hígado y una de hueso, ambas en parafina. Sin centro, sin siglas de muestra, sin número de
 * células. El hueso va sin fecha a propósito (hay más de una biopsia ósea en el caso).
 * Un icono por lesión (gota partida = hígado, hueso = hueso): el mismo en las dos no decía nada.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Sobre qué tejido', 'On which tissue') }}</h2>
    <p class="cel-p">
      {{ L('Dos muestras que ya existían, guardadas en', 'Two samples that already existed, stored in') }}
      <Term id="sc_ffpe" :label="L('bloques de parafina', 'paraffin blocks')" />{{ L(', que es como se conserva una biopsia.', ', which is how a biopsy is kept.') }}
    </p>
    <ul class="cel-tej">
      <li class="cel-card card-base">
        <Icon name="ph:drop-half-fill" class="cel-tej__ico" aria-hidden="true" />
        <div>
          <h3 class="cel-h3">{{ L('Metástasis de hígado', 'Liver metastasis') }}</h3>
          <p class="cel-card__p">{{ L('De la biopsia hepática de agosto de 2026, la única que se ha hecho en el hígado hasta hoy.', 'From the liver biopsy of August 2026, the only one done on the liver so far.') }}</p>
        </div>
      </li>
      <li class="cel-card card-base">
        <Icon name="ph:bone-fill" class="cel-tej__ico" aria-hidden="true" />
        <div>
          <h3 class="cel-h3">{{ L('Metástasis de hueso', 'Bone metastasis') }}</h3>
          <p class="cel-card__p">{{ L('De una biopsia ósea con tumor.', 'From a bone biopsy that contained tumor.') }}</p>
        </div>
      </li>
    </ul>
    <p class="cel-p cel-p--sm">
      {{ L('Cada una es un trozo pequeño de una lesión. Lo que salga describe ese trozo, y las dos lesiones pueden no parecerse entre sí.', 'Each one is a small piece of one lesion. Whatever comes out describes that piece, and the two lesions may not resemble each other.') }}
    </p>
  </section>
</template>

<style scoped>
.cel-tej { display: grid; gap: var(--sp-12); margin: var(--sp-16) 0; padding: 0; list-style: none; }
@media (min-width: 640px) { .cel-tej { grid-template-columns: 1fr 1fr; } }
.cel-tej li { display: flex; gap: var(--sp-12); align-items: flex-start; }
.cel-tej__ico { width: 24px; height: 24px; flex: none; color: var(--color-miriam); margin-top: 2px; }
</style>
