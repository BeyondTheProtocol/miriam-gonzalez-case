<template>
  <section ref="heroEl" class="hero relative overflow-hidden bg-cream" :aria-label="$t('hero.section_label')">
    <div class="hero__shell section-wide">
      <div class="hero__grid">
        <div class="hero__head">
          <div class="hero__meta animate-fade-up">
            <span class="hero__eyebrow eyebrow">{{ $t('home.hero_eyebrow') }}</span>
          </div>

          <i18n-t
            keypath="hero.h1"
            tag="h1"
            class="hero__title heading-display text-berenjena animate-fade-up"
            style="animation-delay: 0.1s"
          >
            <template #age>{{ caseData.currentAge }}</template>
            <template #op><span class="italic text-miriam">{{ $t('hero.h1_emphasis') }}</span></template>
          </i18n-t>
        </div>

        <figure class="hero__portrait animate-fade-up" style="animation-delay: 0.15s">
          <div class="hero__portrait-frame">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              :alt="$t('home.s6_photo_alt')"
              class="hero__portrait-img"
              width="640"
              height="640"
              sizes="(max-width: 639px) 224px, (max-width: 767px) 280px, 400px"
              format="webp"
              fetchpriority="high"
              decoding="async"
            />
          </div>

          <span
            class="hero__handle hero__handle--top"
            aria-hidden="true"
            translate="no"
          >
            @miriamgonp
          </span>

          <figcaption class="hero__portrait-tag">
            <span>{{ $t('hero.photo_tag') }}</span>
          </figcaption>
        </figure>

        <div class="hero__body">
          <p class="hero__lede text-tinta animate-fade-up" style="animation-delay: 0.2s">{{ $t('hero.lede') }}</p>

          <!-- Dos acciones, apiladas en móvil y de 44 px como mínimo. «Entender el caso» baja a #caso en la misma
               página (enlace nativo: funciona sin JS; #caso lleva scroll-margin para no quedar bajo la cabecera). -->
          <div class="hero__cta animate-fade-up" style="animation-delay: 0.3s">
            <a
              href="https://gofund.me/3e25cae99"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackSupport('home_hero')"
              data-support-cta
              class="btn-cta justify-center"
            >
              <Icon name="ph:heart-fill" class="heart-beat heart-beat--alive w-4 h-4" aria-hidden="true" />
              {{ $t('hero.cta_donate') }}
              <span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
            </a>
            <a href="#caso" class="btn-secondary justify-center">
              <Icon name="ph:arrow-down" class="w-4 h-4" aria-hidden="true" />
              {{ $t('hero.cta_understand') }}
            </a>
          </div>

          <!-- Para quien llega por trabajo: va a la petición concreta (el plugin de Umami mide el ancla como VerPeticion). -->
          <NuxtLink
            :to="localePath({ name: 'datos', hash: '#que-buscamos' })"
            class="hero__pro link-action group text-miriam animate-fade-up"
            style="animation-delay: 0.35s"
          >
            {{ $t('hero.pro_link') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <!-- Prueba: lo recaudado y cuánta gente lo hace posible, en vivo y con el rótulo «en GoFundMe» (decisión de Miriam, 24-oct-2026:
           importe y donantes sí; objetivo, porcentaje y barra no), y la señal viva de recencia. Si la cifra es la del build se dice con
           su fecha (`cifraDe`): el HTML prerenderizado lleva la semilla y el cliente la cambia por la viva al montar. -->
      <div class="hero__proof animate-fade-up" style="animation-delay: 0.4s">
        <p v-if="gofundme && importe" class="hero__support">
          <Icon name="ph:users-three" class="w-5 h-5 shrink-0 text-miriam" aria-hidden="true" />
          <span class="nums">
            <i18n-t keypath="hero.proof_money" tag="span">
              <template #importe>
                <strong
                  :data-gofundme-importe="gofundme.currentAmount.amount"
                  :data-gofundme-origen="gofundme.origen ?? 'semilla'"
                >{{ importe }}</strong>
              </template>
              <template #n>{{ donantes }}</template>
            </i18n-t>
            <!-- La fecha, en su línea y sin «·»: ella no se parte (espacios duros en fechaDeCifra) ni deja un punto colgando. La «·» de
                 hero.proof_money va unida a sus dos vecinos con espacios duros: nunca queda sola al final ni al principio de una línea. -->
            <time v-if="cifraDe" class="hero__cifra" :datetime="cifraDe.iso">{{ $t('gofundme.cifra_a', { fecha: cifraDe.texto }) }}</time>
          </span>
        </p>
        <NuxtLink
          v-if="latest"
          :to="localePath({ name: 'timeline' }) + '#lo-ultimo'"
          class="hero__latest group"
          @click="trackLatest('hero')"
        >
          <span class="hero__latest-meta">
            <span class="hero-live-dot h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
            <span class="etiqueta">{{ $t('hero.latest_label') }}</span>
            <span v-if="latestAgo" class="font-mono text-xs text-tinta">· {{ latestAgo }}</span>
          </span>
          <span class="hero__latest-title">
            {{ latest.title }}
            <Icon
              name="ph:arrow-right"
              class="ml-1.5 inline-block w-3.5 h-3.5 align-[-2px] transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale } = useI18n()
const { trackSupport, trackLatest } = useSupport()

// Lo recaudado y el nº de donantes: semilla del build en el HTML y cifra viva al montar (useFundraiser lo comparte con la tarjeta
// de la campaña: una sola petición por página). Sin objetivo ni porcentaje. Sin dato, la línea no se pinta (antes salía «—»: un
// guion donde debía ir una cifra).
const gofundme = await useFundraiser()
const donantes = computed(() =>
  gofundme.value
    ? new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US').format(gofundme.value.donationCount)
    : null,
)
const importe = computed(() =>
  gofundme.value ? formatCurrency(gofundme.value.currentAmount.amount, gofundme.value.currentAmount.currencyCode, locale.value) : null,
)
// La fecha solo si la cifra es de la semilla Y sabemos de cuándo es (nunca una inventada).
const cifraDe = computed(() => {
  const v = gofundme.value
  if (!v || v.origen !== 'semilla' || !v.actualizado) return null
  return { iso: v.actualizado, texto: fechaDeCifra(v.actualizado, locale.value) }
})

// Medición («Hero-visto», utils/umamiVistas.ts): se observa el hero ENTERO y no la línea de cifras, para que el denominador sea
// quien pudo ver el botón de donar y no solo quien bajó hasta las cifras. `conEuros`: ¿había importe en el hero al verse? (sin
// dato, la línea no se pinta).
const heroEl = ref<HTMLElement | null>(null)
useUmamiVisto(heroEl, EVENTO_HERO_VISTO, () => ({ conEuros: !!importe.value }))

const { latest, latestAgo } = useLatestUpdate()
</script>

<style scoped>
/* ── Shell & rejilla ───────────────────────────────────────────────────────
   Una sola escala vertical (8px base). Columna izq = flujo narrativo;
   columna dcha = retrato anclado arriba, sin huecos flotantes en desktop. */
.hero__shell {
  padding-top: 1.75rem;
  padding-bottom: 3rem;
}
@media (min-width: 640px) {
  .hero__shell {
    padding-top: 4rem;
    padding-bottom: 4.5rem;
  }
}
@media (min-width: 1024px) {
  .hero__shell {
    padding-top: 5rem;
    padding-bottom: 5rem;
  }
}

.hero__grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.hero__head,
.hero__body,
.hero__portrait {
  min-width: 0;
}

@media (max-width: 767px) {
  /* En móvil la foto sube justo bajo el titular (gancho emocional antes del
     lede y los CTAs). El donar siempre está accesible vía la barra fija inferior. */
  .hero__head {
    order: 1;
  }
  .hero__portrait {
    order: 2;
    margin-top: 0.875rem;
  }
  .hero__body {
    order: 3;
  }
}

@media (min-width: 768px) {
  .hero__grid {
    display: grid;
    /* Pista de la foto más estrecha (~320–400px) + gutter normal → cierra el
       «valle» central que dejaba el texto (36rem) frente a la foto anclada. */
    grid-template-columns: minmax(0, 1fr) clamp(20rem, 26vw, 25rem);
    column-gap: clamp(2rem, 3.5vw, 3.25rem);
    row-gap: 1.25rem;
    align-items: start;
  }
  .hero__head {
    grid-column: 1;
    grid-row: 1;
  }
  .hero__portrait {
    grid-column: 2;
    grid-row: 1 / span 2;
    /* La pista gobierna el ancho (mata el bug de cascada 280px) y la foto se
       ancla arriba, junto al titular, en vez de flotar centrada. */
    justify-self: stretch;
    align-self: start;
    width: 100%;
    max-width: none;
    margin-top: 0.5rem;
  }
  .hero__body {
    grid-column: 1;
    grid-row: 2;
  }
}

/* Meta: eyebrow + contador en la misma línea que cronología */
.hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.625rem;
}
.hero__eyebrow {
  margin: 0;
  line-height: 1.35;
  max-width: 28rem;
}
/* T3-LOTE3 (A32): el DS pide un eyebrow sin salto de línea. Los 28rem (448 px) lo partían en dos líneas en escritorio aunque la columna del
   titular mide ~570 px a 1024 y el texto unos 500. Desde `lg` el tope se va (sin `nowrap`: con la letra ampliada tiene que poder partir). Por
   debajo de `lg` se queda como estaba (regla móvil primero de la tanda): a 375 px el texto sigue en dos líneas, porque mide ~500 px en una
   columna de 327; quitarlo ahí es cambiar el texto o el tamaño. */
@media (min-width: 1024px) {
  .hero__eyebrow { max-width: none; }
}

.hero__title {
  margin-top: 1.25rem;
  /* El H1 es una frase entera (≈70 caracteres), no un lema: tamaño más contenido que el del antiguo «Un cáncer raro, una
     oportunidad real.» para que en 375 px ocupe 4 líneas y no 6. */
  font-size: clamp(1.75rem, 1.1rem + 2.6vw, 2.875rem);
  letter-spacing: var(--track-titular);
  line-height: 1.1;
  text-wrap: balance;
}
@media (min-width: 640px) {
  .hero__title {
    margin-top: 1.5rem;
  }
}
@media (min-width: 1024px) {
  /* Misma medida que lede/CTA: el titular no «estrecha» la columna en desktop. */
  .hero__title {
    max-width: 36rem;
  }
}

/* Retrato — el tamaño SOLO se fija en móvil/tablet (apilado). En desktop (≥768)
   lo gobierna la pista del grid; sin max-width aquí para no pisar (bug de cascada). */
.hero__portrait {
  position: relative;
  margin: 0;
  width: 100%;
}
@media (max-width: 767px) {
  .hero__portrait {
    max-width: 224px;
    margin-inline: auto;
  }
}
@media (min-width: 640px) and (max-width: 767px) {
  .hero__portrait {
    max-width: 280px;
  }
}

.hero__portrait-frame {
  overflow: hidden;
  border-radius: var(--radius-card);
  box-shadow: 0 18px 44px -22px rgb(var(--color-text-rgb) / 0.45);
  aspect-ratio: 1;
}

.hero__portrait-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__handle {
  position: absolute;
  z-index: 2;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-pill);
  background: var(--color-miriam);
  color: var(--color-bg);
  font-family: var(--font-mono);
  font-size: var(--texto-xs);
  letter-spacing: 0.04em;
  box-shadow: 0 8px 20px -8px rgb(var(--color-text-rgb) / 0.45);
  transform: rotate(2deg);
}
@media (min-width: 640px) {
  .hero__handle {
    padding: 0.45rem 0.85rem;
  }
}
.hero__handle--top {
  right: 0.5rem;
  top: -0.65rem;
}
@media (min-width: 640px) {
  .hero__handle--top {
    right: -0.35rem;
    top: 1.5rem;
  }
}

.hero__portrait-tag {
  display: flex;
  justify-content: center;
  margin-top: -0.85rem;
  position: relative;
  z-index: 2;
}
.hero__portrait-tag span {
  display: inline-block;
  border-radius: var(--radius-pill);
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-mono);
  font-size: var(--texto-2xs);
  letter-spacing: 0.08em;
  white-space: nowrap; /* a 12 px el rótulo mide casi lo que el retrato (224 px): no parte en dos líneas */
  text-transform: uppercase;
  padding: 0.4rem 0.9rem;
  box-shadow: 0 10px 24px -12px rgb(var(--color-text-rgb) / 0.55);
}

/* Cuerpo textual */
.hero__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}
@media (min-width: 640px) {
  .hero__body {
    gap: 1.5rem;
  }
}

.hero__lede {
  margin: 0;
  font-size: 1rem;
  line-height: 1.55;
  max-width: 36rem;
}
@media (min-width: 640px) {
  .hero__lede {
    font-size: 1.25rem;
    line-height: 1.5;
  }
}

/* CTAs · dos acciones del mismo ancho. Lado a lado cuando caben sin partir su texto: de 640 a 767 px (el hero va a todo el
   ancho) y desde 1024 px; apiladas en móvil y en 768-1023 px, donde la foto le quita media columna al texto. */
.hero__cta {
  display: grid;
  gap: 0.75rem;
  max-width: 36rem;
}
@media (min-width: 640px) and (max-width: 767px), (min-width: 1024px) {
  .hero__cta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

/* Enlace de texto para quien llega por trabajo (clínico o laboratorio): 44 px de alto, a la izquierda de la columna. */
.hero__pro {
  width: fit-content;
  min-height: 44px;
  font-size: 0.9375rem;
  line-height: 1.35;
}

/* Zona de prueba · una sola banda a ancho del shell con un único divisor: lo recaudado y cuánta gente lo hace posible, y la
   señal viva de recencia («Lo último»). Sin objetivo ni porcentaje. */
.hero__proof {
  margin-top: 2.5rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgb(var(--color-text-rgb) / 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
@media (min-width: 768px) {
  .hero__proof {
    margin-top: 3rem;
    padding-top: 2rem;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem 3rem;
  }
  /* la frase del importe y los donantes no se parte a media línea: el que cede el ancho es «Lo último» */
  .hero__support {
    flex: none;
  }
}

/* El texto de la cifra puede encogerse con la caja (min-width: 0) y, si una palabra no cabe, partirse: con la letra al 200 % a 375 px en Linux
   la línea «recaudados en GoFundMe · N» sobresalía 10 px de su bloque (test-salud-estatica, CI del 25-oct-2026). */
.hero__support .nums {
  min-width: 0;
  overflow-wrap: anywhere;
}
.hero__support {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--color-text);
}

/* La fecha de la cifra: bajo la frase, en su línea. 13 px, el suelo del sistema (R2). Sin `white-space: nowrap`: con la letra
   ampliada (WCAG 1.4.4 y 1.4.10) el texto se salía de su caja. La fecha lleva espacios duros (fechaDeCifra) y no se parte; lo que
   no cabe salta de línea entre «cifra a» y la fecha. */
.hero__cifra {
  display: block;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--color-text-soft);
}

.hero__latest {
  display: block;
  min-height: var(--control-min);
  text-decoration: none;
  color: inherit;
}
@media (min-width: 768px) {
  .hero__latest {
    max-width: 34rem;
  }
}

.hero__latest-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.35rem;
}

.hero__latest-title {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--color-miriam);
  text-decoration: underline;
  text-decoration-color: rgb(var(--color-miriam-rgb) / 0.5);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.15s ease;
}
@media (hover: hover) and (pointer: fine) {
  .hero__latest:hover .hero__latest-title {
    text-decoration-color: var(--color-miriam);
  }
}

.hero-live-dot {
  animation: hero-pulse 2s ease-in-out 3;
}
@keyframes hero-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(var(--color-cta-rgb) / 0.4); }
  50% { box-shadow: 0 0 0 7px rgb(var(--color-cta-rgb) / 0); }
}
@media (prefers-reduced-motion: reduce) {
  .hero-live-dot { animation: none; }
}
</style>