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
          es exactamente el del resto de la web (.band-fx). En el hero, además,
          una constelación CELULAR (.cluster) ANCLADA junto al avatar —el racimo de
          células del dibujo, hecho con el GLYPH CANÓNICO de estrella de 4 puntas de
          la marca (BrandMark/Constellation, STAR_D), no bolitas de química—: 3-4
          estrellas «núcleo» (una en miriam-claro, el resto crema) + satélites,
          unidos por líneas finas curvas; VISIBLE sobre la berenjena, sin color
          fuera de marca.
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
      Header — opción B ELEGIDA (decisión con Adri, 18-jun): lidera con la
      atención/escaparate ya existente y la marca DENTRO de la historia; encuadre
      partnership (no donativo) debajo. Alternativas conservadas para que Miriam
      pueda cambiarlas sin volver al plan:

      · Alternativa A — "todas las miradas" (plan §3.1, atención + dignidad):
          H1:  En los próximos meses, mucha gente va a seguir esta historia.
          Sub: Perfil único (ingeniera + tumor ultra-raro), contado con rigor y
               sin postureo. Te propongo acompañar tu marca dentro de esa historia.
          CTA: Hablemos de colaborar →

      · Alternativa B2 — "escaparate que va a volar" (idea directa de Adri):
          H1:  Un escaparate que va a volar. ¿Subes tu marca?
          Sub: Relanzo mi podcast y mi historia va a tener mucha atención.
               Convierte esa atención en ojos para tu marca —y ayúdame a sostener
               mi tratamiento— con una colaboración que se nota.
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
              <a
                href="https://pillar.io/miriamgonp/mediakit"
                target="_blank"
                rel="noopener"
                class="link-action group font-mono text-sm text-cream"
              >
                {{ t('marcas.hero_cta_mediakit') }}
                <Icon name="ph:arrow-square-out" class="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
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

          <figure class="avatar-stage justify-self-center lg:justify-self-end m-0">
            <!-- Constelación celular del hero (opción A, aprobada por Miriam) —
                 la identidad científica del avatar (racimo de células neuroendo-
                 crinas) dibujada con el GLYPH CANÓNICO de estrella de 4 puntas de
                 la marca (el de BrandMark/Constellation, STAR_D), NO con bolitas de
                 química. Racimo = 3-4 estrellas «núcleo» grandes/brillantes +
                 satélites pequeños alrededor, unidos por líneas finas CURVAS (estilo
                 penLine de Constellation.vue). Anclado junto al lado del avatar.
                 VISIBILIDAD (lo que antes fallaba): estrellas op. 0.5–0.85 (núcleos
                 casi opacos), enlaces op. 0.22–0.30; UN núcleo en miriam-claro
                 (#c77dd2), el resto crema (#faf6f0) → se ve claro sobre la berenjena.
                 Estático salvo un único parpadeo sutil al entrar (off con reduced-
                 motion). aria-hidden: pura decoración. -->
            <svg
              class="cluster"
              viewBox="0 0 360 360"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <!-- Glyph canónico de estrella de 4 puntas (= STAR_D de
                     Constellation.vue / BrandMark.vue), en su caja 20×20. -->
                <path
                  id="m-star"
                  d="M10 1.6 C10.8 5,11.4 6.2,12.6 7.4 C14 8.8,16.4 9.4,18.4 10 C16.2 10.8,14.2 11.4,12.8 12.7 C11.5 13.9,10.9 15.7,10 18.4 C9.3 15.9,8.5 14.2,7.2 12.9 C5.8 11.6,3.4 10.7,1.6 10 C3.8 9.1,5.8 8.4,7.2 7.1 C8.4 6,9.2 4.2,10 1.6 Z"
                />
              </defs>

              <!-- Enlaces del racimo: líneas finas CURVAS (Q) entre núcleos y
                   satélites, estilo penLine. Crema, op. 0.22–0.30 → visibles. -->
              <g stroke="#faf6f0" stroke-width="1.1" stroke-linecap="round" fill="none" class="cluster-links">
                <!-- lóbulo derecho (junto al avatar) -->
                <path d="M300 84 Q322 108 318 150" opacity="0.30" />
                <path d="M318 150 Q300 176 262 178" opacity="0.26" />
                <path d="M300 84 Q282 60 248 70" opacity="0.24" />
                <path d="M318 150 Q344 130 340 100" opacity="0.22" />
                <path d="M262 178 Q258 218 286 250" opacity="0.26" />
                <path d="M300 84 Q272 120 262 178" opacity="0.24" />
                <!-- lóbulo izquierdo -->
                <path d="M70 132 Q44 156 52 196" opacity="0.30" />
                <path d="M70 132 Q104 120 122 92" opacity="0.26" />
                <path d="M52 196 Q86 214 118 200" opacity="0.24" />
                <path d="M70 132 Q98 168 118 200" opacity="0.22" />
                <!-- puente sutil entre lóbulos -->
                <path d="M262 178 Q190 158 118 200" opacity="0.22" />
              </g>

              <!-- Satélites: estrellas pequeñas alrededor de los núcleos
                   (op. 0.5–0.65). Crema. scale ~0.18–0.26 sobre la caja de 20. -->
              <g fill="#faf6f0" class="cluster-sats">
                <use href="#m-star" opacity="0.58" transform="translate(340 100) scale(0.24) translate(-10 -10)" />
                <use href="#m-star" opacity="0.5"  transform="translate(248 70)  scale(0.20) translate(-10 -10)" />
                <use href="#m-star" opacity="0.6"  transform="translate(286 250) scale(0.24) translate(-10 -10)" />
                <use href="#m-star" opacity="0.5"  transform="translate(332 196) scale(0.18) translate(-10 -10)" />
                <use href="#m-star" opacity="0.55" transform="translate(122 92)  scale(0.22) translate(-10 -10)" />
                <use href="#m-star" opacity="0.5"  transform="translate(36 168)  scale(0.18) translate(-10 -10)" />
                <use href="#m-star" opacity="0.6"  transform="translate(118 200) scale(0.24) translate(-10 -10)" />
                <use href="#m-star" opacity="0.5"  transform="translate(96 250)  scale(0.18) translate(-10 -10)" />
              </g>

              <!-- Núcleos: 3-4 estrellas grandes y casi opacas (op. 0.78–0.85),
                   el racimo del avatar. UNO en miriam-claro (#c77dd2), el resto
                   crema. El violeta es el núcleo guía (lóbulo derecho, junto al
                   avatar). scale ~0.42–0.5. -->
              <g class="cluster-cores">
                <use href="#m-star" fill="#c77dd2" opacity="0.85" transform="translate(300 84)  scale(0.50) translate(-10 -10)" />
                <use href="#m-star" fill="#faf6f0" opacity="0.82" transform="translate(318 150) scale(0.44) translate(-10 -10)" />
                <use href="#m-star" fill="#faf6f0" opacity="0.8"  transform="translate(262 178) scale(0.42) translate(-10 -10)" />
                <use href="#m-star" fill="#faf6f0" opacity="0.8"  transform="translate(70 132)  scale(0.44) translate(-10 -10)" />
              </g>
            </svg>
            <!-- El marco (no la imagen) posee la geometría: aspect-ratio 1 +
                 overflow hidden → círculo perfecto e inmune al estiramiento del
                 grid, igual que TeamPortrait y el retrato del hero de la home.
                 sizes da a @nuxt/image un srcset con candidato 2x para que se
                 vea nítido en pantallas Retina (MacBook Air), no pixelado. -->
            <div class="avatar-frame avatar-ring">
              <NuxtImg
                src="/img/miriam-avatar.webp"
                alt=""
                width="512"
                height="512"
                sizes="168px"
                format="webp"
                decoding="async"
                class="avatar-img"
              />
            </div>
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

        <!-- Dossier en primer plano. Filete fino superior en vez de caja rellena:
             separa el cierre del bloque sin añadir otro recuadro (mismo divisor
             editorial que la tira de prensa de la home). Aquí solo el ENLACE al PDF:
             el CTA de contacto duplicado se retiró para no apilar acciones (la
             llamada a contactar vive en hero, audiencia y cierre). -->
        <div class="dossier-row">
          <p class="text-base text-berenjena leading-relaxed m-0">
            {{ t('marcas.pilares_dossier_line') }}
            <a href="/dossier-marcas-deck.pdf" download class="link-inline font-medium">{{ t('marcas.pilares_dossier_cta') }}</a>
          </p>
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

        <!-- Cierre de la sección de audiencia: el CTA dejaba de flotar suelto tras
             la tira de prensa. Ahora va ANCLADO en una fila con filete fino superior
             (mismo patrón editorial que .dossier-row del bloque de pilares): una
             línea de remate a la izquierda + el botón a la derecha, leídos como el
             cierre natural de la sección, no como un CTA perdido. -->
        <div class="audiencia-cta-row">
          <p class="text-base text-berenjena leading-relaxed m-0 max-w-md">{{ t('marcas.audiencia_cta_line') }}</p>
          <NuxtLink :to="localePath('contacto')" class="btn-cta shrink-0" style="text-decoration: none">
            {{ t('marcas.audiencia_cta') }}
          </NuxtLink>
        </div>
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
          <!-- Cierre con UN solo CTA: contactar. El enlace de dossier se retiró
               aquí (redundante con el del hero, el de la dossier-row y el botón
               flotante) para que el cierre empuje una única acción. El
               cta_microcopy («benéfico/profesional») se retiró: ya vive en el
               hero (hero_context) y repetirlo re-justificaba el cierre. -->
          <div class="flex justify-center mb-6">
            <NuxtLink :to="localePath('contacto')" class="btn-cta" style="text-decoration: none">
              {{ t('marcas.cta_button') }}
            </NuxtLink>
          </div>
          <!-- Teaser final (abre boca, sin desvelar): el detalle va al dossier. -->
          <p class="text-sm text-cream/85 leading-relaxed max-w-xl mx-auto">{{ t('marcas.cta_podcast') }}</p>
          <!-- Remate personal y poético — cierra la página con la firma de Miriam.
               Usa la .firma del DS (Fraunces italic, la rúbrica de la marca) en
               miriam-claro para que contraste sobre la berenjena. NO es escasez:
               es un guiño íntimo a que ella es única/irrepetible, en el mismo tono
               win-win del resto. Hairline superior = el divisor editorial del sitio. -->
          <p class="m-signoff firma heading-display text-lg text-miriam-claro">{{ t('marcas.cta_tagline') }}</p>
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

/* Remate personal del cierre — la firma íntima de Miriam ("Única. Como yo.").
   Filete fino superior centrado (mismo divisor editorial que .dossier-row, pero
   estrecho y centrado bajo el teaser) + margen que la separa del párrafo anterior
   sin pegarse. Hereda .firma (Fraunces italic) del DS; el color miriam-claro se
   fija con utilidad Tailwind en el template para contraste sobre berenjena
   (gana al text-miriam de .firma por orden de capas). Puro remate, no CTA. */
.m-signoff {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(var(--color-miriam-soft-rgb) / 0.22);
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  letter-spacing: -0.01em;
}

/* Avatar del hero — mismo patrón que TeamPortrait y el retrato del hero de la
   home: el MARCO posee la geometría (tamaño + círculo + recorte) y la imagen
   solo lo rellena. Así el círculo es perfecto e inmune a que el grid estire el
   elemento reemplazado, y object-fit encuadra el 1024² original sin deformarlo. */
.avatar-frame {
  width: 168px;
  height: 168px;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 9999px;
}
.avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Anillo decorativo del avatar (violeta-soft translúcido). */
.avatar-ring {
  border: 3px solid rgb(var(--color-miriam-soft-rgb) / 0.5);
  box-shadow: 0 16px 40px -16px rgba(0, 0, 0, 0.6);
}

/* Nombre de la edición personalizada — subrayado discontinuo. */
.marca-name {
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: rgb(var(--color-miriam-claro-rgb) / 0.8);
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
  border-top: 1px solid rgb(var(--color-text-rgb) / 0.08);
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
    box-shadow: 0 0 0 3px rgb(var(--color-miriam-rgb) / 0.18);
  }
}

/* Fila del dossier — cierre del bloque con filete fino superior (sin caja). */
.dossier-row {
  padding-top: 1.75rem;
  border-top: 1px solid rgb(var(--color-text-rgb) / 0.1);
}

/* Fila de cierre de la sección de audiencia — MISMO filete fino superior que
   .dossier-row, para que el CTA "¿Encajamos?" quede anclado al bloque (no suelto):
   línea de remate + botón en una fila. Apilado en móvil; en fila, con el botón a la
   derecha, desde sm. */
.audiencia-cta-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgb(var(--color-text-rgb) / 0.1);
}
@media (min-width: 640px) {
  .audiencia-cta-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }
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
  background-image: radial-gradient(circle at 1px 1px, var(--color-bg) 1px, transparent 0);
  background-size: 32px 32px;
}

/* ── Constelación celular del hero (.avatar-stage > .cluster) ─────────────────
   Opción A, aprobada por Miriam. El racimo de células del avatar dibujado con el
   GLYPH CANÓNICO de estrella de 4 puntas de la marca (#m-star = STAR_D de
   Constellation.vue / BrandMark.vue), NO con bolitas de química. Anclada junto al
   avatar (no detrás del H1) para no competir con el titular. Sustituye a la
   antigua .band-life/.molecule (puntos invisibles + nodos químicos, feedback de
   Miriam: «no se ve» / «no es química»).
   Decisiones de marca + VISIBILIDAD (lo que antes fallaba):
     · Estrellas VISIBLES: núcleos op. 0.78–0.85 (casi opacos), satélites
       0.5–0.65; enlaces op. 0.22–0.30 (NO 0.16). Se ve claro sobre berenjena.
     · UN núcleo en miriam-claro (var(--color-miriam-claro), énfasis sobre oscuro, único color
       fuera del crema y dentro de marca); el resto crema (var(--color-bg)).
     · Líneas CURVAS finas (Q de Bézier, estilo penLine) → racimo, no malla rígida.
     · Estático salvo un único parpadeo sutil al entrar (off con reduced-motion).
   El <figure> es el lienzo: posición relativa para que el SVG se ancle al avatar. */
.avatar-stage {
  position: relative;
}
/* El SVG envuelve el avatar (más grande que el marco de 168px) y se centra en él.
   Detrás del avatar (z-index 0) y sin capturar el ratón. */
.cluster {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 360px;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  overflow: visible;
}
/* El avatar va por encima del racimo. */
.avatar-stage .avatar-frame {
  position: relative;
  z-index: 1;
}
/* Bienvenida: un único parpadeo sutil de las estrellas al entrar (como
   BrandMark/Constellation), luego quietas. OFF con prefers-reduced-motion. */
@media (prefers-reduced-motion: no-preference) {
  .cluster-cores use,
  .cluster-sats use {
    animation: m-cluster-in 1.6s ease-out 1 both;
  }
  .cluster-sats use {
    animation-delay: 0.25s;
  }
  @keyframes m-cluster-in {
    0% {
      opacity: 0;
    }
    60% {
      opacity: 1;
    }
  }
}
/* Móvil: el racimo se atenúa (no compite con el contenido en pantalla estrecha)
   y encoge un poco para no desbordar de más. */
@media (max-width: 640px) {
  .cluster {
    width: 300px;
    height: 300px;
    opacity: 0.85;
  }
}

/* Botón flotante de descarga del dossier — solo en desktop (≥ lg).
   En móvil se oculta: el enlace de descarga ya existe en el hero y en la
   dossier-row, y el pop-up de contacto ocupa el espacio flotante.
   Color = tokens del DS (berenjena/crema, vía @apply); el hover reutiliza el
   mismo valor que .btn-dark:hover del DS. Layout fijo/pill: bespoke (FAB). */
.m-print-btn {
  display: none; /* oculto en móvil; se activa desde lg */
}
@media (min-width: 1024px) {
  .m-print-btn {
    @apply bg-berenjena text-cream;
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 0.95rem;
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.04em;
    box-shadow: 0 12px 28px -10px rgb(var(--color-text-rgb) / 0.6);
    transition: transform 0.15s ease, background 0.2s ease;
  }
  .m-print-btn:hover {
    background: #3d2752; /* = .btn-dark:hover (DS, main.css) */
    transform: translateY(-2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .m-print-btn:hover {
    transform: none;
  }
}

/* Impresión: fuera la textura y la constelación decorativa y el botón; secciones
   sin cortarse. (El cromo global —nav/footer/barra— ya lo oculta main.css.) */
@media print {
  .no-print {
    display: none !important;
  }
  .band-fx,
  .cluster {
    display: none !important;
  }
  section {
    break-inside: avoid;
  }
}
</style>
