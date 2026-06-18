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
        · Dos bandas oscuras (hero · cierre) llevan un cielo decorativo
          (.band-fx): resplandor violeta centrado + estrellas tenues hacia
          los bordes → no pisan el texto (zona tranquila).
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
      <div class="band-fx" aria-hidden="true">
        <div class="band-fx__stars"></div>
        <div class="band-fx__glow"></div>
      </div>
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
              <a href="/dossier-marcas-deck.pdf" download class="link-inline link-inline--invert font-mono text-sm">
                {{ t('marcas.hero_cta_dossier') }}
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

        <div class="grid sm:grid-cols-2 gap-4 mb-10">
          <article v-for="(card, ci) in pilaresCards" :key="ci" class="card-base bg-cream-card pillar-card">
            <span class="pillar-num font-mono text-xs text-miriam" aria-hidden="true">0{{ ci + 1 }}</span>
            <h3 class="heading-display text-xl text-berenjena mb-2">{{ rt(card.title) }}</h3>
            <p class="text-sm text-tinta leading-relaxed mb-3">{{ rt(card.what) }}</p>
            <p class="text-sm text-berenjena leading-relaxed font-medium pillar-gain">{{ rt(card.gain) }}</p>
          </article>
        </div>

        <!-- Encajes naturales — dónde el producto se cruza con la vida real,
             en tags agrupados por categoría. Idea de Adri: aunque ya haya una
             marca del sector, sigue habiendo sitio (menciones). -->
        <div class="encajes mb-10">
          <h3 class="heading-display text-xl text-berenjena mb-2">{{ t('marcas.encajes_title') }}</h3>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-3xl">{{ t('marcas.encajes_intro') }}</p>
          <div class="encajes-grid">
            <div v-for="(g, gi) in encajesGroups" :key="gi" class="encajes-group">
              <p class="encajes-group__label">{{ rt(g.label) }}</p>
              <ul class="encajes-tags">
                <li v-for="(tag, ti) in (g.tags as string[])" :key="ti" class="encaje-tag">{{ tag }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Dossier en primer plano + CTA de contacto -->
        <div class="rounded-2xl p-6 sm:p-7 bg-cream-card flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
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
      <div class="band-fx" aria-hidden="true">
        <div class="band-fx__stars"></div>
        <div class="band-fx__glow"></div>
      </div>
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
            <a href="/dossier-marcas-deck.pdf" download class="link-inline link-inline--invert font-mono text-sm">
              {{ t('marcas.cta_dossier') }}
            </a>
          </div>
          <p class="text-sm text-cream/85 leading-relaxed mb-6 max-w-xl mx-auto">{{ t('marcas.cta_podcast') }}</p>
          <p class="font-mono text-xs text-cream/65 max-w-md mx-auto leading-relaxed">{{ t('marcas.cta_microcopy') }}</p>
        </div>
      </div>
    </section>

    <!-- Botón flotante · descarga el dossier en PDF (oculto en impresión) -->
    <a href="/dossier-marcas-deck.pdf" download class="m-print-btn no-print" style="text-decoration: none" :aria-label="t('marcas.print_aria')">
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

/* Tarjetas de los 4 pilares — numeradas y con borde violeta de identidad a la
   izquierda; el "qué te llevas" (.pillar-gain) se separa con una fina regla. */
.pillar-card {
  position: relative;
  border-left: 4px solid #9d44ab;
}
.pillar-num {
  position: absolute;
  top: 1rem;
  right: 1.1rem;
  letter-spacing: 0.08em;
}
.pillar-gain {
  padding-top: 0.65rem;
  border-top: 1px solid rgba(45, 27, 61, 0.1);
}

/* Pills de marcas partner — identidad violeta; se «encienden» a violeta sólido
   al pasar/enfocar (señal clara de enlace). */
.partner-pill {
  display: inline-flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: #e8d4ed;
  color: #2d1b3d;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.partner-pill:hover,
.partner-pill:focus-visible {
  background: #9d44ab;
  color: #faf6f0;
  transform: translateY(-1px);
}

/* Teaser tras la tira de partners — "…y más por venir". Atenuado y en cursiva:
   sugiere, no compite con las pills. */
.partners-more {
  font-style: italic;
  opacity: 0.85;
}

/* ── Encajes naturales ───────────────────────────────────────────────────────
   Tags estáticos (no enlaces) agrupados por categoría. Mismos tokens que las
   pills de partner pero en versión "neutra" (sin acción): no se encienden a
   violeta sólido para no leerse como enlace. El borde violeta del título de
   grupo ata el bloque a la identidad de la página. */
.encajes-grid {
  display: grid;
  gap: 1.5rem 2rem;
}
@media (min-width: 640px) {
  .encajes-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.encajes-group__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2d1b3d;
  padding-left: 0.6rem;
  border-left: 3px solid #9d44ab;
  margin-bottom: 0.75rem;
}
.encajes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.encaje-tag {
  display: inline-flex;
  align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(232, 212, 237, 0.55);
  color: #2d1b3d;
  border: 1px solid rgba(157, 68, 171, 0.18);
}

/* ── Cielo decorativo de las bandas oscuras ──────────────────────────────────
   Resplandor violeta centrado (zona tranquila tras el texto) + estrellas tenues
   repartidas hacia los bordes. Estático (sin animación) → seguro siempre y sin
   coste de contraste sobre el texto crema. */
.band-fx {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.band-fx__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(58% 64% at 50% 42%, rgba(157, 68, 171, 0.22), transparent 72%);
}
.band-fx__stars {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-image:
    radial-gradient(1.6px 1.6px at 8% 18%, rgba(232, 212, 237, 0.55), transparent 60%),
    radial-gradient(1.2px 1.2px at 16% 72%, rgba(250, 246, 240, 0.4), transparent 60%),
    radial-gradient(1.4px 1.4px at 24% 30%, rgba(232, 212, 237, 0.45), transparent 60%),
    radial-gradient(1px 1px at 33% 86%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.5px 1.5px at 45% 10%, rgba(250, 246, 240, 0.45), transparent 60%),
    radial-gradient(1px 1px at 57% 90%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.6px 1.6px at 68% 14%, rgba(232, 212, 237, 0.5), transparent 60%),
    radial-gradient(1.2px 1.2px at 78% 78%, rgba(250, 246, 240, 0.4), transparent 60%),
    radial-gradient(1.4px 1.4px at 86% 34%, rgba(232, 212, 237, 0.48), transparent 60%),
    radial-gradient(1px 1px at 93% 64%, rgba(232, 212, 237, 0.42), transparent 60%),
    radial-gradient(1.3px 1.3px at 11% 48%, rgba(232, 212, 237, 0.4), transparent 60%),
    radial-gradient(1.1px 1.1px at 90% 12%, rgba(250, 246, 240, 0.4), transparent 60%);
}

/* Botón flotante de descarga del dossier — sobre la barra de apoyo móvil (<lg). */
.m-print-btn {
  position: fixed;
  right: 1rem;
  bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.95rem;
  border-radius: 999px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.04em;
  box-shadow: 0 12px 28px -10px rgba(45, 27, 61, 0.6);
  transition: transform 0.15s ease, background 0.2s ease;
}
.m-print-btn:hover {
  background: #3d2752;
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
