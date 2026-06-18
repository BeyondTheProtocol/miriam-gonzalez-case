<template>
  <div>
    <!--
      ════════════════════════════════════════════════════════════
        Página /marcas (· /en/brands) — landing B2B para marcas.
        UNLISTED: no vive en SiteNav, se reparte por enlace directo.
        · Compuesta solo con tokens del design-system (cream/berenjena/
          tinta/miriam/coral) + dos extensiones de marca (miriam-claro
          y berenjena-2) para el énfasis e/o las tarjetas SOBRE oscuro.
        · UN ACENTO POR BLOQUE: violeta = identidad (miriam / miriam-claro
          en oscuro), coral = SOLO acción (botones CTA). Crema, nunca
          blanco; texto berenjena, nunca negro.
        · Dos bandas oscuras (hero · cierre) = berenjena plano (bg-berenjena) +
          la MISMA retícula de puntos crema al 4 % que las bandas oscuras del
          resto del sitio (index.vue / equipo.vue). Sin tinte violeta: el fondo
          es exactamente el del resto de la web (.band-fx).
        · ?marca=Nombre personaliza el hero (cliente, sin romper SSR).
        · Botón flotante → descarga el dossier (public/dossier-marcas-deck.pdf).
        · Pop-up de contacto propio (MarcasContactPrompt): SOLO aquí, apunta a
          /contacto, NO a donación (el aviso global de donación se mantiene en
          el resto del sitio).

        ── ESTRUCTURA (4 bloques, plan de marketing 18-jun-2026) ──
          1 · Por qué colaborar / la atención que voy a tener  (hero, banda oscura)
          2 · Formas de colaborar — 4 pilares (lo más rápido de pillar → ARRIBA)
          3 · Mi tipo de audiencia (ligero: tira macro + prueba social + prensa)
          4 · Ponte en contacto  (cierre, banda oscura)
      ════════════════════════════════════════════════════════════
    -->

    <!-- ░░ 1 · POR QUÉ COLABORAR / LA ATENCIÓN ░░ banda oscura -->
    <!--
      Header — opción A elegida (plan §3.1, "todas las miradas"). Lidera con
      atención/escaparate + dignidad. Alternativas conservadas para que Miriam
      pueda cambiarlas sin volver al plan:

      · Alternativa B — "escaparate que va a volar" (idea directa de Adri):
          H1:  Un escaparate que va a volar. ¿Subes tu marca?
          Sub: Relanzo mi podcast con Carlos Roca y mi historia va a tener mucha
               atención. Convierte esa atención en ojos para tu marca —y ayúdame
               a sostener mi tratamiento— con una colaboración que se nota.
          CTA: Quiero colaborar →

      · Alternativa C — "trato honesto" (partnership-forward):
          H1:  Te propongo un trato honesto: tú me acompañas, yo te doy una
               plataforma que va a volar.
          Sub: Perfil único (ingeniera + tumor ultra-raro), una narrativa que ya
               está cogiendo altura y una comunidad que actúa. Busco partners a
               largo plazo, no patrocinios de usar y tirar.
          CTA: Contáctame →
    -->
    <section
      v-reveal
      class="relative overflow-hidden section-spacing bg-berenjena"
      :aria-labelledby="'m-hero'"
    >
      <div class="band-fx" aria-hidden="true"></div>
      <div class="section-wide relative z-10">
        <div class="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
          <div>
            <p class="dark-eyebrow mb-5">{{ t('marcas.hero_eyebrow') }}</p>
            <i18n-t
              keypath="marcas.hero_title"
              tag="h1"
              id="m-hero"
              class="heading-display text-cream text-4xl sm:text-5xl"
              style="letter-spacing: -0.03em; line-height: 1.08"
            >
              <template #em>
                <em class="italic text-miriam-claro">{{ t('marcas.hero_title_em') }}</em>
              </template>
            </i18n-t>
            <p class="mt-6 text-lg text-cream/85 leading-relaxed max-w-2xl">
              {{ t('marcas.hero_subtitle') }}
            </p>
            <p class="mt-5 text-sm text-cream/70 leading-relaxed max-w-2xl">
              {{ t('marcas.hero_context') }}
            </p>

            <div class="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
              <NuxtLink :to="localePath('contacto')" class="btn-cta" style="text-decoration: none">
                {{ t('marcas.hero_cta') }}
              </NuxtLink>
              <a href="/dossier-marcas-deck.pdf" download class="link-action group font-mono text-sm text-cream">
                {{ t('marcas.hero_cta_dossier') }}
                <Icon name="ph:download-simple" class="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              </a>
            </div>

            <p class="mt-7 font-mono text-xs uppercase tracking-[0.16em] text-miriam-claro">
              {{ t('marcas.hero_tagline') }}
            </p>
            <ClientOnly>
              <p
                v-if="marca"
                class="mt-5 font-mono text-xs uppercase tracking-[0.12em] text-cream/70"
              >
                {{ t('marcas.hero_edition_label') }}
                <b class="ml-1 font-semibold text-cream marca-name">{{ marca }}</b>
              </p>
            </ClientOnly>
          </div>

          <figure class="justify-self-center lg:justify-self-end m-0">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              alt=""
              width="336"
              height="336"
              format="webp"
              decoding="async"
              class="w-[168px] h-[168px] rounded-full object-cover avatar-ring"
            />
          </figure>
        </div>
      </div>
    </section>

    <!-- ░░ 2 · FORMAS DE COLABORAR — 4 PILARES ░░ crema · el bloque clave, arriba -->
    <section v-reveal class="section-spacing bg-cream" :aria-labelledby="'m-pilares'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.pilares_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.pilares_title"
          tag="h2"
          id="m-pilares"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-4 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.pilares_title_em') }}</em></template>
        </i18n-t>
        <p class="text-lg text-tinta leading-relaxed mb-9 max-w-3xl">{{ t('marcas.pilares_intro') }}</p>

        <!-- 4 pilares — tarjeta del sistema (mismo patrón que la "escalera de CTAs"
             de la home: .card-base sobre crema, número mono de índice, titular
             Fraunces, cuerpo en tinta). El "qué te llevas" cierra la tarjeta tras
             un filete fino, precedido de una flecha violeta de acento, para que se
             lea como el beneficio y no como otro párrafo. Cuerpo de tarjeta
             on-brand, sin el borde grueso del round-2 que rompía el vibe. -->
        <div class="pilares grid sm:grid-cols-2 gap-5 mb-12">
          <article v-for="(card, ci) in pilaresCards" :key="ci" class="pilar card-base flex flex-col" style="background: #faf6f0">
            <p class="pilar-num font-mono uppercase text-[11px] tracking-[0.12em] text-tinta mb-2" aria-hidden="true">0{{ ci + 1 }}</p>
            <h3 class="heading-display text-xl text-berenjena mb-3">{{ rt(card.title) }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-4 flex-1">{{ rt(card.what) }}</p>
            <p class="pilar-gain text-sm text-berenjena leading-relaxed font-medium">
              <Icon name="ph:arrow-right" class="pilar-gain__icon w-3.5 h-3.5 text-miriam shrink-0" aria-hidden="true" />
              <span>{{ rt(card.gain) }}</span>
            </p>
          </article>
        </div>

        <!-- Encajes naturales — dónde el producto se cruza con la vida real,
             agrupados por categoría. Cada grupo es una tarjeta del sistema
             (.card-base sobre crema, rótulo mono con el filete violeta de
             identidad), y cada encaje vuelve a ser un tag con el mismo lenguaje
             que los badges genómicos de la home (mono, miriam-soft, píldora que
             "respira" al pasar). Con cuerpo y personalidad, pero de esta web —ni
             lista plana (round-4) ni chips genéricos con borde (round-2). Idea de
             Adri: aunque ya haya una marca del sector, sigue habiendo sitio. -->
        <div class="encajes mb-12">
          <h3 class="heading-display text-xl text-berenjena mb-2">{{ t('marcas.encajes_title') }}</h3>
          <p class="text-sm text-tinta leading-relaxed mb-7 max-w-3xl">{{ t('marcas.encajes_intro') }}</p>
          <div class="encajes-grid">
            <div v-for="(g, gi) in encajesGroups" :key="gi" class="encajes-group card-base" style="background: #faf6f0">
              <p class="encajes-group__label">{{ rt(g.label) }}</p>
              <ul class="encajes-tags">
                <li v-for="(tag, ti) in (g.tags as unknown[])" :key="ti">
                  <span class="encaje-tag">{{ rt(tag) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Dossier en primer plano + CTA de contacto. Filete fino superior en vez
             de caja rellena: separa el cierre del bloque sin añadir otro recuadro
             (mismo divisor editorial que la tira de prensa de la home). -->
        <div class="dossier-row flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <p class="text-base text-berenjena leading-relaxed flex-1 m-0">
            {{ t('marcas.pilares_dossier_line') }}
            <a href="/dossier-marcas-deck.pdf" download class="link-inline font-medium">{{ t('marcas.pilares_dossier_cta') }}</a>
          </p>
          <NuxtLink :to="localePath('contacto')" class="btn-cta shrink-0" style="text-decoration: none">
            {{ t('marcas.pilares_cta') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ░░ 3 · MI TIPO DE AUDIENCIA (ligero) ░░ crema-card · tira macro + prueba + prensa -->
    <section v-reveal class="section-spacing bg-cream-card" :aria-labelledby="'m-audiencia'">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ t('marcas.audiencia_eyebrow') }}</p>
        <i18n-t
          keypath="marcas.audiencia_title"
          tag="h2"
          id="m-audiencia"
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-8 max-w-3xl"
          style="letter-spacing: -0.02em"
        >
          <template #em><em class="italic text-miriam">{{ t('marcas.audiencia_title_em') }}</em></template>
        </i18n-t>

        <!-- Tira macro: 3 cifras, sin tablas (el desglose fino vive en el dossier) -->
        <div class="grid grid-cols-3 gap-x-6 gap-y-8 mb-8">
          <div v-for="(s, i) in audienciaStats" :key="i">
            <p
              class="font-display font-semibold tracking-tight nums text-berenjena"
              style="font-size: clamp(2rem, 5.5vw, 3.25rem); line-height: 0.95"
            >
              {{ rt(s.value) }}
            </p>
            <p class="mt-2 font-mono uppercase text-[11px] tracking-[0.06em] text-tinta leading-snug">
              {{ rt(s.caption) }}
            </p>
          </div>
        </div>

        <p class="text-tinta leading-relaxed mb-9 max-w-3xl">{{ t('marcas.audiencia_frame') }}</p>

        <!-- Se movilizan a la orden — la comunidad empuja un objetivo concreto cuando
             se lo pido. Prueba = magnitud de movilización (~335K acciones) de una
             campaña reciente. NO se detalla el resultado del concurso (confidencial). -->
        <div class="movilizan card-base bg-cream mb-9">
          <h3 class="heading-display text-xl text-berenjena mb-3">{{ t('marcas.movilizan_title') }}</h3>
          <p class="text-base text-tinta leading-relaxed mb-4 max-w-3xl">
            <i18n-t keypath="marcas.movilizan_p" tag="span">
              <template #b><strong class="font-semibold text-berenjena">{{ t('marcas.movilizan_proof') }}</strong></template>
            </i18n-t>
          </p>
          <p
            class="font-display font-semibold tracking-tight nums text-miriam"
            style="font-size: clamp(2rem, 5.5vw, 3rem); line-height: 0.95"
          >
            {{ t('marcas.movilizan_proof') }}
          </p>
          <p class="mt-2 font-mono uppercase text-[11px] tracking-[0.06em] text-tinta leading-snug">
            {{ t('marcas.movilizan_caption') }}
          </p>
        </div>

        <!-- Prueba social ligera: marcas que ya se atrevieron (+ teaser) + prensa -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-3 mb-7">
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta self-center mr-1">
            {{ t('marcas.audiencia_partners_label') }}
          </span>
          <a
            v-for="(p, i) in partners"
            :key="i"
            :href="rt(p.url)"
            target="_blank"
            rel="noopener"
            class="partner-pill"
          >{{ rt(p.label) }} →</a>
          <span class="partners-more font-mono text-[13px] text-tinta self-center">{{ t('marcas.partners_more') }}</span>
        </div>

        <div class="flex flex-wrap items-baseline gap-x-7 gap-y-3 mb-9">
          <span class="font-mono uppercase text-[11px] tracking-[0.12em] text-tinta self-center">
            {{ t('home.s9_strip_label') }}
          </span>
          <a :href="pressElPais" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">El País<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
          <a :href="pressMurcia" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">La Opinión de Murcia<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
          <a :href="pressLa7" target="_blank" rel="noopener" class="link-logo text-2xl sm:text-3xl">La 7<span class="sr-only"> {{ t('a11y.new_tab') }}</span></a>
        </div>

        <NuxtLink :to="localePath('contacto')" class="btn-cta" style="text-decoration: none">
          {{ t('marcas.audiencia_cta') }}
        </NuxtLink>
      </div>
    </section>

    <!-- ░░ 4 · PONTE EN CONTACTO ░░ banda oscura, centrada -->
    <section
      v-reveal
      class="cta-band relative overflow-hidden bg-berenjena"
      :aria-labelledby="'m-cta'"
    >
      <div class="band-fx" aria-hidden="true"></div>
      <div class="section-wide relative z-10">
        <div class="max-w-2xl mx-auto text-center">
          <p class="dark-eyebrow mb-4">{{ t('marcas.cta_eyebrow') }}</p>
          <i18n-t
            keypath="marcas.cta_title"
            tag="h2"
            id="m-cta"
            class="heading-display text-3xl sm:text-4xl text-cream mb-5"
            style="letter-spacing: -0.02em"
          >
            <template #em><em class="italic text-coral">{{ t('marcas.cta_title_em') }}</em></template>
          </i18n-t>
          <p class="text-lg text-cream/85 leading-relaxed mb-8 max-w-xl mx-auto">{{ t('marcas.cta_p') }}</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <NuxtLink :to="localePath('contacto')" class="btn-cta" style="text-decoration: none">
              {{ t('marcas.cta_button') }}
            </NuxtLink>
            <a href="/dossier-marcas-deck.pdf" download class="link-action group font-mono text-sm text-cream">
              {{ t('marcas.cta_dossier') }}
              <Icon name="ph:download-simple" class="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
          <p class="text-sm text-cream/85 leading-relaxed mb-6 max-w-xl mx-auto">{{ t('marcas.cta_podcast') }}</p>
          <p class="font-mono text-xs text-cream/65 max-w-md mx-auto leading-relaxed">{{ t('marcas.cta_microcopy') }}</p>
        </div>
      </div>
    </section>

    <!-- Botón flotante · descarga el dossier en PDF (oculto en impresión).
         Icono de descarga = misma señal que los enlaces de dossier del cuerpo. -->
    <a href="/dossier-marcas-deck.pdf" download class="m-print-btn no-print" style="text-decoration: none" :aria-label="t('marcas.print_aria')">
      <Icon name="ph:download-simple" class="w-4 h-4 shrink-0" aria-hidden="true" />
      {{ t('marcas.print') }}
    </a>

    <!-- Pop-up de contacto SOLO en /marcas (sustituye aquí al aviso de donación) -->
    <MarcasContactPrompt />
  </div>
</template>

<script setup lang="ts">
const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

// ?marca=Nombre → edición personalizada en el hero. Se lee en cliente (la página
// es estática); se sanea (trim) y se acota a ~40 caracteres.
const marca = computed(() => {
  const raw = route.query.marca
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return ''
  return String(value).trim().slice(0, 40)
})

// Listas i18n (arrays en el JSON) — se resuelven hoja a hoja con rt() en el template.
const pilaresCards = computed(() => tm('marcas.pilares_cards') as Record<string, unknown>[])
const encajesGroups = computed(() => tm('marcas.encajes_groups') as Record<string, unknown>[])
const audienciaStats = computed(() => tm('marcas.audiencia_stats') as Record<string, unknown>[])
const partners = computed(() => tm('marcas.partners') as Record<string, unknown>[])

// Cobertura de prensa real — mismos enlaces que la tira de medios de la home (index.vue)
const pressElPais = 'https://elpais.com/tecnologia/2026-04-23/asi-usa-una-paciente-con-cancer-metastasico-la-ia-para-entender-su-enfermedad-cual-es-el-mejor-metodo-para-hablar-de-salud-con-chatbots.html'
const pressMurcia = 'https://www.laopiniondemurcia.es/comunidad/2026/05/30/paciente-murciana-aguarda-nuevo-tratamiento-130816775.html'
const pressLa7 = 'https://www.instagram.com/p/DZDT2hIAMPU/?hl=es'

useSeoMeta({
  title: () => t('marcas.meta_title'),
  description: () => t('marcas.meta_description'),
  ogTitle: () => t('marcas.meta_title'),
  ogDescription: () => t('marcas.og_description'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('marcas.meta_title'),
  twitterDescription: () => t('marcas.og_description'),
})

defineOgImage('Default.takumi', {
  title: () => t('marcas.meta_title'),
  description: () =>
    locale.value === 'es'
      ? 'Un escaparate único para tu marca, con dignidad. Cuatro formas reales de colaborar.'
      : 'A unique showcase for your brand, with dignity. Four real ways to collaborate.',
})
</script>

<script lang="ts">
export default { name: 'MarcasPage' }
</script>

<style scoped>
/* Eyebrow sobre banda oscura: el .eyebrow del DS es text-tinta (oscuro) e
   invisible aquí; usamos crema atenuada (≈6:1 sobre berenjena). */
.dark-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(250, 246, 240, 0.7);
  display: block;
}

/* Banda de cierre/CTA: ritmo equilibrado. El contenido es corto (eyebrow → h2 →
   subtítulo → botones → microcopy), así que en vez del py-28 simétrico del DS, que
   dejaba un hueco muerto, usamos un padding inferior algo menor que el superior:
   la composición queda centrada y la banda "abraza" el muro de logos del footer.

   Flush con el footer: la banda CTA y el muro de logos del footer son ambos
   berenjena y deben tocarse sin costura. El borde compartido cae en un píxel
   fraccionario (la altura de la página no es entera) y dejaba asomar 1px del
   fondo crema del <footer> → fina línea clara antiestética. Sangramos la banda
   2px hacia el footer (margin-bottom negativo) y extendemos su fondo berenjena
   esos 2px (padding-bottom) para que la costura quede siempre cubierta. */
.cta-band {
  padding-top: 5rem;    /* 80px */
  padding-bottom: calc(4.25rem + 2px); /* 68px + 2px de sangrado */
  margin-bottom: -2px;  /* tapa la costura sub-píxel con el muro de logos */
}
@media (min-width: 640px) {
  .cta-band {
    padding-top: 7rem;    /* 112px, = section-spacing sm */
    padding-bottom: calc(5.5rem + 2px); /* 88px + 2px de sangrado (ver .cta-band) */
  }
}

/* Anillo decorativo del avatar (violeta-soft translúcido). */
.avatar-ring {
  border: 3px solid rgba(232, 212, 237, 0.5);
  box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.6);
}

/* Nombre de la edición personalizada — subrayado discontinuo. */
.marca-name {
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgba(199, 125, 210, 0.8);
  text-underline-offset: 4px;
}

/* 4 pilares — tarjeta del sistema (.card-base sobre crema), mismo patrón que la
   "escalera de CTAs" de la home: número mono de índice arriba, titular Fraunces,
   cuerpo en tinta, y un cierre con el beneficio. flex-col + flex-1 en el cuerpo
   para que las cuatro tarjetas se alineen aunque el texto varíe de alto.
   El acento es el número y la flecha violeta — sin el borde grueso del round-2. */
.pilar {
  /* hereda .card-base (padding, radio, hairline, bg crema). */
}
.pilar-num {
  flex-shrink: 0;
}
/* "Qué te llevas" — cierre de la tarjeta tras un filete fino, con flecha violeta
   de acento (la misma señal de avance que usan las pathway-cards de la home).
   Se lee como el beneficio, no como otro párrafo. */
.pilar-gain {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin-top: 0.2rem;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(45, 27, 61, 0.08);
}
.pilar-gain__icon {
  transform: translateY(0.18em);
}

/* Pills de marcas partner — misma base que el badge genómico del DS
   (bg-miriam-soft + text-berenjena, vía @apply: sin hex a mano); identidad
   violeta que se «enciende» a violeta sólido (bg-miriam + crema) al pasar/
   enfocar → señal clara de enlace. */
.partner-pill {
  @apply bg-miriam-soft text-berenjena;
  display: inline-flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.partner-pill:hover,
.partner-pill:focus-visible {
  @apply bg-miriam text-cream;
  transform: translateY(-1px);
}

/* Teaser tras la tira de partners — "…y más por venir". Atenuado y en cursiva:
   sugiere, no compite con las pills. */
.partners-more {
  font-style: italic;
  opacity: 0.85;
}

/* ── Encajes naturales ───────────────────────────────────────────────────────
   Tarjetas del sistema (.card-base sobre crema) agrupadas por categoría: el
   rótulo de grupo conserva el filete violeta de identidad y dentro vuelven los
   tags. Cada tag (.encaje-tag) es el MISMO badge que el perfil genómico de la
   home (mono, fondo miriam-soft, sin borde) y "respira" igual al pasar/enfocar
   (halo violeta, como .badge-genomic) — píldoras estáticas, no enlaces, pero con
   el lenguaje real del sitio: ni lista plana (round-4) ni chip con borde (round-2). */
.encajes-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 640px) {
  .encajes-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }
}
.encajes-group {
  /* hereda .card-base (padding, radio, hairline, bg crema). */
}
.encajes-group__label {
  @apply text-berenjena border-l-[3px] border-miriam;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-left: 0.6rem;
  margin-bottom: 1rem;
}
.encajes-tags {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
/* Tag = badge genómico del DS (bg-miriam-soft + text-berenjena, vía @apply, sin
   hex a mano). Mismo halo sutil al pasar/enfocar que .badge-genomic — "hasta los
   detalles respiran" — pero sin pasar a violeta sólido: no es un enlace. */
.encaje-tag {
  @apply inline-block bg-miriam-soft text-berenjena rounded-full;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0.3rem 0.7rem;
  transition: box-shadow 0.2s ease;
}
@media (hover: hover) {
  .encaje-tag:hover {
    box-shadow: 0 0 0 3px rgba(157, 68, 171, 0.18);
  }
}

/* Fila del dossier — cierre del bloque con filete fino superior (sin caja). */
.dossier-row {
  padding-top: 1.75rem;
  border-top: 1px solid rgba(45, 27, 61, 0.1);
}

/* ── Textura de las bandas oscuras ───────────────────────────────────────────
   MISMA que el resto del sitio: las bandas berenjena de la home (index.vue, banda
   "la historia") y del equipo (equipo.vue, panel "lo que NO somos") llevan una
   retícula de puntos crema tenue al 4 % sobre berenjena plano —sin tinte violeta—.
   Antes esta página añadía un resplandor lila + estrellas que teñían la banda y
   la hacían distinta al resto (feedback de Miriam: "el fondo/el lila no coincide").
   Ahora el fondo es EXACTAMENTE el del resto del sitio: berenjena (bg-berenjena)
   + esta retícula. Estático → seguro siempre y sin coste de contraste. */
.band-fx {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.04;
  background-image: radial-gradient(circle at 1px 1px, #faf6f0 1px, transparent 0);
  background-size: 32px 32px;
}

/* Botón flotante de descarga del dossier — sobre la barra de apoyo móvil (<lg).
   Color = tokens del DS (berenjena/crema, vía @apply); el hover reutiliza el
   mismo valor que .btn-dark:hover del DS (no hay utilidad Tailwind para ese
   tono concreto). Layout fijo/pill: bespoke por necesidad (FAB). */
.m-print-btn {
  @apply bg-berenjena text-cream;
  position: fixed;
  right: 1rem;
  bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.95rem;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 28px -10px rgba(45, 27, 61, 0.6);
  transition: transform 0.15s ease, background 0.2s ease;
}
.m-print-btn:hover {
  background: #3d2752; /* = .btn-dark:hover (DS, main.css) */
  transform: translateY(-2px);
}
@media (min-width: 1024px) {
  .m-print-btn {
    right: 1.5rem;
    bottom: 1.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .m-print-btn:hover {
    transform: none;
  }
}

/* Impresión: fuera el cielo decorativo y el botón; secciones sin cortarse.
   (El cromo global —nav/footer/barra— ya lo oculta app/assets/css/main.css.) */
@media print {
  .no-print {
    display: none !important;
  }
  .band-fx {
    display: none !important;
  }
  section {
    break-inside: avoid;
  }
}
</style>
