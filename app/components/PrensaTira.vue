<script setup lang="ts">
/**
 * «Caso en prensa»: la tira de medios justo debajo del hero (rediseño de arquitectura, F5, 23-oct-2026): credibilidad antes
 * de pedir nada. Los medios, su orden y el enlace de cada uno salen de content/<idioma>/press.yml (usePrensaMedios), la
 * misma fuente que la sala de prensa; ya no son siete enlaces escritos a mano que se quedaban atrás.
 *
 * Accesibilidad: cada medio es un enlace de ≥ 44 px que se abre en pestaña nueva y lo avisa. Lleva el nombre del medio, que es
 * el texto; la tipografía en gris malva de `link-logo` pasa a violeta al enfocar o pasar el cursor.
 */
const localePath = useLocalePath()
const { trackPress } = useSupport()
const { data: medios } = await usePrensaMedios()
</script>

<template>
  <section v-if="medios?.length" class="prensa-tira bg-cream-card" :aria-label="$t('home.s9_strip_label')">
    <div class="section-wide prensa-tira__interior">
      <p class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta">{{ $t('home.s9_strip_label') }}</p>
      <ul class="prensa-tira__lista" role="list">
        <li v-for="m in medios" :key="m.medio">
          <a
            :href="m.url"
            target="_blank"
            rel="noopener"
            class="link-logo prensa-tira__medio text-lg sm:text-2xl"
            @click="trackPress(m.medio)"
          >{{ m.medio }}<span class="sr-only"> {{ $t('a11y.new_tab') }}</span></a>
        </li>
      </ul>
      <NuxtLink :to="localePath('prensa')" class="link-action group prensa-tira__sala min-h-[44px] font-mono text-[12px] text-miriam">
        {{ $t('home.s9_press_contact') }}
        <Icon name="ph:arrow-right" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.prensa-tira { border-top: 1px solid rgb(var(--color-text-rgb) / 0.08); border-bottom: 1px solid rgb(var(--color-text-rgb) / 0.08); }
.prensa-tira__interior { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 28px; padding-block: 20px; }
.prensa-tira__lista { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0 24px; }
/* 44 px de alto como mínimo: son destinos táctiles, no palabras sueltas de un párrafo */
.prensa-tira__medio { display: inline-flex; align-items: center; min-height: 44px; }
@media (min-width: 640px) { .prensa-tira__sala { margin-left: auto; } }
</style>
