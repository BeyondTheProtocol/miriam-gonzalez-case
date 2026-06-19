<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div v-if="visible" class="marcas-action-bar lg:hidden">
      <!-- Acción PRIMARIA = CONTACTAR (coral). Es el final del embudo de la marca
           y lo que escaseaba a mano (review de Adri: el dossier ya está a un toque
           en el hero y en la dossier-row; el contacto es lo que faltaba en los ~5
           pantallazos centrales). NuxtLink real (no <component :is="'NuxtLink'"> por
           cadena) → emite un <a href> nativo de respaldo, así navega aunque la
           hidratación falle en iOS Chrome (lección de #126). -->
      <NuxtLink
        :to="localePath('contacto')"
        class="btn-cta w-full justify-center"
        style="text-decoration: none"
      >
        <Icon name="ph:handshake" class="w-4 h-4" aria-hidden="true" />
        {{ $t('marcas.bar_contact') }}
      </NuxtLink>
      <!-- Acción SECUNDARIA = dossier (enlace mono discreto, un solo acento por
           pieza: nunca un segundo coral ni violeta aquí). <a download> nativo. -->
      <a
        href="/dossier-marcas-deck.pdf"
        download
        class="marcas-action-bar__dossier"
      >
        {{ $t('marcas.bar_dossier') }}
        <Icon name="ph:download-simple" class="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Barra de acción móvil de /marcas (· /en/brands). Mismo chasis que
 * MobileSupportBar (fija abajo, berenjena, lg:hidden, safe-area, reduced-motion),
 * pero al servicio del EMBUDO DE LA MARCA, no de la donación.
 *
 * Por qué existe (Comité Web · review de Adri prevalece): /marcas mide ~7250px en
 * móvil (≈9 pantallas) y entre el CTA del hero y el siguiente "contáctame" había
 * ~4500px (5+ pantallas) sin contacto a mano. La marca se convence leyendo "formas
 * de colaborar" y justo ahí no tenía dónde tocar. Esta barra pone el CONTACTO a un
 * toque a cualquier altura, con el dossier como secundario.
 *
 * Decisiones (Adri):
 *  · Primaria = CONTACTAR (coral); secundaria = dossier (mono). NO al revés: el
 *    dossier es munición ("para tu jefe"), el contacto es la conversión.
 *  · Microcopy primario = "Hablemos de colaborar" (partnership, no "logo de un día").
 *  · Aparece al ENTRAR en "formas de colaborar" (donde se convence la marca), no
 *    solo tras el hero; se oculta cerca del cierre para no duplicar los 3 CTA del
 *    cuerpo ni el CTA de contacto cuando ya está en pantalla (sin doble coral).
 *  · Coral persistente es correcto en una landing B2B de venta (a diferencia de las
 *    lecturas técnicas de /ciencia): da servicio, no persigue. La barra es chasis de
 *    acción y nunca toca el relato de la enfermedad.
 *
 * A11y: NuxtLink/`<a download>` nativos (href real de respaldo, lección de #126),
 * objetivos ≥44px, respeta safe-area-inset-bottom y prefers-reduced-motion.
 * Solo se monta en /marcas (ver la página). lg:hidden → en escritorio no aparece
 * (el hero y los CTA del cuerpo ya cubren; allí el cursor llega a todo).
 */
const { y } = useWindowScroll()
const localePath = useLocalePath()

const visible = ref(false)

const DESKTOP_MIN = 1024

// La barra se "gana" su sitio: aparece cuando el lector ENTRA en el bloque de
// "formas de colaborar" (#m-pilares) — el momento en que la marca se enciende
// (review de Adri) — y se retira cerca del cierre para no competir con los CTA
// reales del cuerpo. Si un CTA de contacto del cuerpo ya está en pantalla, se
// oculta para no mostrar dos corales idénticos a la vez.
function pilaresReached(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.getElementById('m-pilares')
  if (!el) return y.value > 480 // respaldo: tras el hero, si aún no hay id
  // Se enciende cuando el inicio de "formas de colaborar" cruza ~70% del viewport.
  return el.getBoundingClientRect().top <= window.innerHeight * 0.7
}

// ¿Hay un CTA de contacto (coral) del cuerpo dentro del viewport? Si lo hay,
// ocultamos la barra para no duplicar el coral (mismo criterio que MobileSupportBar
// con [data-support-cta]).
function anyContactCtaVisible(): boolean {
  if (typeof document === 'undefined') return false
  const els = document.querySelectorAll<HTMLElement>('[data-marcas-contact]')
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.bottom > 0 && r.top < window.innerHeight) return true
  }
  return false
}

function update() {
  if (typeof window === 'undefined') return
  if (window.innerWidth >= DESKTOP_MIN) {
    visible.value = false
    return
  }
  const docH = document.documentElement.scrollHeight
  const nearBottom = y.value + window.innerHeight >= docH - 220
  visible.value = pilaresReached() && !nearBottom && !anyContactCtaVisible()
}

watch(y, update)
onMounted(() => {
  update()
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', update)
})
</script>

<style scoped>
/* Mismo chasis que MobileSupportBar (homogeneidad): fija abajo, berenjena, filete
   crema tenue, columna con la acción primaria arriba y el enlace secundario debajo,
   safe-area abajo. Solo móvil/tablet estrecha (<lg). */
@media (min-width: 1024px) {
  .marcas-action-bar {
    display: none !important;
  }
}
.marcas-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #2d1b3d; /* berenjena */
  padding: 10px 16px 8px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(250, 246, 240, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
/* Enlace secundario del dossier: mono discreto sobre berenjena (mismo lenguaje que
   .mobile-support-bar__more). Sin color de acción: un solo acento por pieza. */
.marcas-action-bar__dossier {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(250, 246, 240, 0.72);
  text-decoration: none;
  padding-bottom: 2px;
}
.marcas-action-bar__dossier:hover {
  color: #faf6f0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
