<script setup lang="ts">
/**
 * «Han contado su caso»: la tira de medios justo debajo del hero (rediseño de arquitectura, F5, 23-oct-2026): credibilidad antes
 * de pedir nada. Desde el 24-oct-2026 pesa poco: una o dos líneas en letra pequeña, no nombres grandes, y solo CUATRO medios.
 * Cuáles, en qué orden y con qué enlace sale de content/<idioma>/press.yml (campo `home: N` de cada pieza; usePrensaMedios), la
 * misma fuente que la sala de prensa; los demás medios siguen en /prensa. Aquí no se escribe ningún medio ni URL.
 *
 * Medición (Umami, sin cookies): cada medio lleva `data-umami-event="Clic-prensa"` y `data-umami-event-medio="<medio>"`, que
 * el propio script de Umami cuenta al clic; por eso el enlace NO llama al emisor manual de ese mismo evento (contaría doble).
 * «Prensa-visible» se envía UNA vez por vista, cuando la tira entra en pantalla: es el denominador de «Clic-prensa» (clics ÷
 * veces que se vio la tira).
 *
 * Móvil (< 640 px): etiqueta + los medios en rejilla 2×2 (dos líneas) y sin el enlace «Sala de prensa», que en pantallas anchas va a la
 * derecha. Así la tira mide unos 115 px a 375 px y no cuatro filas; /prensa sigue a un toque en la puerta «Prensa» y en el pie.
 *
 * Accesibilidad: cada medio es un enlace de ≥ 44 px (también con la letra pequeña) que se abre en pestaña nueva y lo avisa. Lleva
 * el nombre del medio, que es el texto; el gris malva de `link-logo` (≥ 5:1 sobre la tarjeta) pasa a violeta al enfocar o pasar el
 * cursor. La etiqueta es visible y nombra la región, así que el lector de pantalla oye lo mismo que se ve.
 */
const localePath = useLocalePath()
const { trackPrensaVisible } = useSupport()
const { data: medios } = await usePrensaMedios()

// «Prensa-visible»: una sola vez por vista de la home (el observador se desconecta al primer aviso). Al menos la mitad de la
// tira en pantalla, para que no cuente un roce de un píxel al hacer scroll rápido.
const tira = ref<HTMLElement | null>(null)
let observador: IntersectionObserver | null = null
onMounted(() => {
  if (!tira.value || typeof IntersectionObserver === 'undefined') return
  observador = new IntersectionObserver(
    (entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return
      observador?.disconnect()
      trackPrensaVisible()
    },
    { threshold: 0.5 },
  )
  observador.observe(tira.value)
})
onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <section v-if="medios?.length" ref="tira" class="prensa-tira bg-cream-card" :aria-label="$t('home.prensa_tira_etiqueta')">
    <div class="section-wide prensa-tira__interior">
      <p class="prensa-tira__etiqueta font-mono uppercase text-[11px] tracking-[0.12em] text-tinta">{{ $t('home.prensa_tira_etiqueta') }}</p>
      <ul class="prensa-tira__lista" role="list">
        <li v-for="m in medios" :key="m.medio">
          <a
            :href="m.url"
            target="_blank"
            rel="noopener"
            class="link-logo prensa-tira__medio text-[15px]"
            data-umami-event="Clic-prensa"
            :data-umami-event-medio="m.medio"
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
/* Poco aire a propósito: los enlaces ya miden 44 px, así que la tira no necesita colchón vertical propio. */
.prensa-tira__interior { display: flex; flex-wrap: wrap; align-items: center; gap: 0 20px; padding-block: 4px; }
.prensa-tira__etiqueta { margin: 0; }
.prensa-tira__lista { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 0 20px; }
/* 44 px de alto como mínimo: son destinos táctiles, aunque la letra sea pequeña */
.prensa-tira__medio { display: inline-flex; align-items: center; min-height: 44px; }
@media (min-width: 640px) { .prensa-tira__sala { margin-left: auto; } }
/* Por debajo de 640 px (24-oct-2026, revisión de diseño): la tira es etiqueta + dos líneas, no cuatro filas. Los medios van en una
   rejilla de 2 columnas (2×2, sin un medio huérfano en la segunda fila) y «Sala de prensa» se oculta (display: none: también sale del
   tabulador y del lector de pantalla), porque la puerta «Prensa» de «Cómo ayudar» y el pie llevan a /prensa una pantalla más abajo. */
@media (max-width: 639.98px) {
  .prensa-tira__lista { display: grid; grid-template-columns: repeat(2, max-content); gap: 0 24px; }
  .prensa-tira__sala { display: none; }
}
</style>
