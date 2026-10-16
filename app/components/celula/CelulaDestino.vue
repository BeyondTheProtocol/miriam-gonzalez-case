<script setup lang="ts">
/** Bloque 5 · Qué pasa con el resultado. Describe y equipa; no recomienda ningún tratamiento. */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
const { hayReales } = useCelulaResultados()
</script>

<template>
  <section :aria-labelledby="id">
    <h2 :id="id" class="cel-h2">{{ L('Qué pasa con el resultado', 'What happens with the result') }}</h2>
    <p class="cel-p">
      {{ L('El primero en verlo es el equipo médico de Miriam. Para ellos es una pieza más de información. Esta página no recomienda ningún tratamiento, ni lo hará.', 'Miriam’s medical team sees it first. For them it is one more piece of information. This page does not recommend any treatment, and it will not.') }}
    </p>
    <p v-if="hayReales" class="cel-p">
      {{ L('Lo que ya ha salido está más arriba, con su sello: verificado, inferido o sin verificar. Lo demás se irá sumando por bloques.', 'What has already come out is above, with its seal: verified, inferred or unverified. The rest will be added block by block.') }}
    </p>
    <p v-else class="cel-p">
      {{ L('Cuando haya algo que se pueda contar con seguridad, se contará aquí con su sello: verificado, inferido o sin verificar.', 'When there is something that can be said with confidence, it will be said here with its seal: verified, inferred or unverified.') }}
    </p>
    <div class="cel-cta">
      <p class="cel-cta__p">{{ L('Si analizas datos de célula única o trabajas en terapia personalizada y quieres echar una mano, la página «Cómo ayudar» lo explica.', 'If you analyze single-cell data or work on personalized therapy and want to help, the “How to help” page explains how.') }}</p>
      <NuxtLink :to="localePath({ name: 'colabora' })" class="btn-cta cel-cta__btn">
        {{ L('Cómo ayudar', 'How to help') }}
        <Icon name="ph:arrow-right" class="w-5 h-5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.cel-cta { margin-top: var(--sp-24); display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-16) var(--sp-24); }
.cel-cta__p { flex: 1 1 280px; max-width: var(--measure); margin: 0; font: var(--tipo-body-sm); color: var(--color-text-soft); }
.cel-cta__btn { min-height: 44px; text-decoration: none; }
</style>
