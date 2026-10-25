<template>
  <div>
    <!-- Sistema v3 (rediseño tanda 3, fase «prensa», 25-oct-2026). Solo estilo: cada cadena, cada id y cada ancla son los de antes
         (el copy publicado no se toca aquí). Ocho bloques que alternan tono como la home: crema · tarjeta · crema · tarjeta · oscura ·
         tarjeta · crema · tarjeta. Una sola banda oscura (las citas), en medio y nunca al final: el panel oscuro de contacto, en caja y
         pegado al pie, llevaba un botón berenjena sobre berenjena (1,00:1). Las tarjetas (`card-base`, `TarjetaEnlace`) van en bandas
         crema: sobre una banda tarjeta tienen el mismo color que el fondo y solo las separa un filete. Los id de ancla van en un `div`
         de dentro de la banda, con scroll-mt-24 (los lee test-salud-estatica y el 301 de /videos). -->

    <!-- 1 · Cabecera y bifurcador. Quien escribe una pieza y quien invita necesitan cosas distintas (de 7 peticiones recientes, 6 eran
         invitaciones). Dos enlaces de 64 px de alto. -->
    <Banda tono="crema" class="pr-cabecera">
      <PageHeader
        :eyebrow="$t('press.tag')"
        :title="$t('press.title')"
        :lede="$t('press.subtitle')"
        variante="pagina"
      >
        <nav aria-labelledby="press-fork" class="pr-fork">
          <p id="press-fork" class="eyebrow">{{ $t('press.fork_title') }}</p>
          <ul class="pr-lista pr-lista--dos" role="list">
            <li v-for="f in fork" :key="f.href">
              <TarjetaEnlace :to="f.href" :titulo="f.title" :meta="f.desc" :icono="f.icon" />
            </li>
          </ul>
        </nav>
      </PageHeader>
    </Banda>

    <!-- 2 · Cómo trabajo con medios (primera persona): lo que piden quienes invitan -->
    <Banda tono="tarjeta" titular="press-collab">
      <div id="colaboracion" class="scroll-mt-24">
        <CabeceraSeccion id="press-collab" :titulo="$t('press.collab_title')" />
        <div class="pr-colab">
          <p class="prosa">{{ $t('press.collab_intro') }}</p>
          <p id="press-collab-lista" class="h4-tarjeta">{{ $t('press.collab_list_title') }}</p>
          <ol class="prosa pr-numerada" aria-labelledby="press-collab-lista">
            <li v-for="n in 7" :key="n">{{ $t(`press.collab_item_${n}`) }}</li>
          </ol>
          <p class="prosa">{{ $t('press.collab_reply') }}</p>
          <div>
            <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-secondary">
              <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
              {{ $t('press.collab_cta') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </Banda>

    <!-- 3 · Ficha del caso · hechos clave (izq) + retrato (der), y el texto listo para copiar (kit prensa) -->
    <Banda tono="crema" titular="press-facts">
      <div id="hechos" class="scroll-mt-24 pr-hechos">
        <div>
          <CabeceraSeccion id="press-facts" :titulo="$t('press.facts_title')" />
          <dl aria-labelledby="press-facts" class="pr-ficha">
            <div v-for="fact in facts" :key="fact.label" class="pr-ficha__fila">
              <dt class="etiqueta">{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
        </div>

        <!-- Retrato (el contador de campaña ya no vive aquí: la sala no lleva importes) -->
        <aside class="card-base">
          <figure class="m-0">
            <NuxtImg
              src="/img/miriam-avatar.webp"
              alt="Miriam González"
              width="480"
              height="480"
              sizes="sm:100vw md:360px"
              class="w-full h-auto rounded-card aspect-square object-cover"
              loading="lazy"
            />
            <figcaption class="pr-pie">{{ $t('press.photo_caption') }}</figcaption>
          </figure>
        </aside>
      </div>

      <div class="pr-bloque">
        <CabeceraSeccion id="press-boilerplate" :titulo="$t('press.boilerplate_title')">
          <p class="pr-nota">{{ $t('press.boilerplate_note') }}</p>
        </CabeceraSeccion>
        <div class="card-base">
          <p id="press-boilerplate-text" class="prosa whitespace-pre-line">{{ boilerplateText }}</p>
          <CopyButton class="mt-5" v-bind="copyProps(boilerplateText)" />
        </div>
      </div>
    </Banda>

    <!-- 4 · Fotografías de prensa y vídeo -->
    <Banda tono="tarjeta">
      <CabeceraSeccion id="press-photos" :titulo="$t('press.photos_title')" />
      <div class="pr-fotos" role="group" aria-labelledby="press-photos">
        <figure class="m-0">
          <NuxtImg
            src="/img/miriam-prensa-retrato.jpg"
            :alt="$t('press.photo_retrato_alt')"
            width="800"
            height="1200"
            sizes="sm:100vw md:400px"
            class="w-full h-auto rounded-card aspect-[2/3] object-cover"
            loading="lazy"
          />
          <figcaption class="pr-pie">{{ $t('press.photo_retrato_caption') }}</figcaption>
        </figure>
        <figure class="m-0">
          <NuxtImg
            src="/img/miriam-prensa-ingeniera.jpg"
            :alt="$t('press.photo_ingeniera_alt')"
            width="800"
            height="1200"
            sizes="sm:100vw md:400px"
            class="w-full h-auto rounded-card aspect-[2/3] object-cover"
            loading="lazy"
          />
          <figcaption class="pr-pie">{{ $t('press.photo_ingeniera_caption') }}</figcaption>
        </figure>
      </div>
      <p class="pr-nota">{{ $t('press.photo_download_note') }}</p>

      <!-- Vídeo: el promo de Polaris, con su transcripción. Venía de /videos, fusionada aquí en el rediseño (F4,
           23-oct-2026); desde T2c (24-oct-2026) /videos redirige a esta ancla (#video) y el explicativo del ADC vive en el hito
           del 7-oct de /timeline. Mismo vídeo y mismas palabras. -->
      <div id="video" class="scroll-mt-24 pr-bloque">
        <CabeceraSeccion id="press-video" :titulo="$t('videos.title')" />
        <VideoCaso :video="VIDEO_PROMO[locale === 'en' ? 'en' : 'es']" nivel="h3" class="max-w-2xl" />
        <!-- T2a (24-oct-2026): lo que cuenta el vídeo, abierto. El índice de herramientas vuelve a ser una página. -->
        <NuxtLink :to="localePath('herramientas')" class="link-action group mt-4">
          {{ $t('nav.all_tools') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </div>
    </Banda>

    <!-- 5 · Citas citables. La única banda oscura. El set de cuatro es el aprobado por Miriam (27-jun-2026); sin raya lateral ni tarjeta,
         con el texto en el rol de H3 y la fuente debajo. En inglés, las citas 1 a 3 llevan su nota de traducción a 13 px. -->
    <Banda tono="oscura" titular="press-quotes">
      <CabeceraSeccion id="press-quotes" :titulo="$t('press.quotes_title')">
        <p class="pr-nota">{{ $t('press.quotes_note') }}</p>
      </CabeceraSeccion>
      <ul aria-labelledby="press-quotes" class="pr-citas" role="list">
        <li v-for="(quote, i) in quotes" :key="i" class="pr-cita">
          <blockquote
            class="m-0"
            :aria-label="$t('press.quote_aria', { n: i + 1, total: quotes.length, source: quote.source })"
          >
            <p class="pr-cita__texto">{{ quote.text }}</p>
            <footer class="pr-cita__fuente">{{ quote.source }}</footer>
          </blockquote>
          <p v-if="quote.note" class="pr-cita__nota">{{ quote.note }}</p>
        </li>
      </ul>
    </Banda>

    <!-- 6 · Plegados (biografía, preguntas frecuentes y cronología: nunca bloquean lo principal) y guía editorial SÍ/NO. La guía NO se
         pliega: es la única barrera del muro hacia el periodista. Sin tarjetas aquí: sobre una banda tarjeta no se ven. -->
    <Banda tono="tarjeta">
      <div class="pr-plegados">
        <details class="desplegable">
          <summary>{{ $t('press.bio_title') }}</summary>
          <div class="pr-plegado pr-bio">
            <div>
              <h3 class="etiqueta">{{ $t('press.bio_short_label') }}</h3>
              <p>{{ $t('press.bio_short_text') }}</p>
              <CopyButton class="mt-5" v-bind="copyProps($t('press.bio_short_text'))" />
            </div>
            <div>
              <h3 class="etiqueta">{{ $t('press.bio_long_label') }}</h3>
              <p>{{ bioLong }}</p>
              <CopyButton class="mt-5" v-bind="copyProps(bioLong)" />
            </div>
          </div>
        </details>

        <details class="desplegable">
          <summary>{{ $t('press.faq_title') }}</summary>
          <dl class="pr-plegado pr-faq">
            <div v-for="item in faq" :key="item.q">
              <dt class="h4-tarjeta">{{ item.q }}</dt>
              <dd>
                {{ item.a }}
                <NuxtLink v-if="item.to && !item.to.startsWith('#')" :to="item.to" class="link-action pr-faq__enlace">
                  {{ item.toLabel }}
                </NuxtLink>
                <a v-else-if="item.to" :href="item.to" class="link-action pr-faq__enlace">
                  {{ item.toLabel }}
                </a>
              </dd>
            </div>
          </dl>
        </details>

        <details class="desplegable">
          <summary>{{ $t('press.timeline_title') }}</summary>
          <div class="pr-plegado">
            <p class="pr-nota pr-nota--sin-margen">{{ $t('press.timeline_intro') }}</p>
            <ol class="pr-cronologia">
              <li v-for="item in timeline" :key="item.date">
                <span class="etiqueta">{{ item.date }}</span>
                <span>{{ item.text }}</span>
              </li>
            </ol>
            <NuxtLink :to="localePath('timeline')" class="link-action group">
              {{ $t('press.timeline_link') }}
              <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </NuxtLink>
          </div>
        </details>
      </div>

      <div class="pr-bloque">
        <CabeceraSeccion id="press-guide" :titulo="$t('press.guide_title')" />
        <div class="pr-guia" role="group" aria-labelledby="press-guide">
          <div class="pr-guia__col">
            <p class="pr-guia__rotulo">
              <Icon name="ph:check-circle" class="pr-guia__icono pr-guia__icono--si" aria-hidden="true" />
              <span class="etiqueta">{{ $t('press.guide_yes_label') }}</span>
            </p>
            <p class="pr-guia__texto">{{ $t('press.guide_yes', { age: caseData.currentAge }) }}</p>
          </div>
          <div class="pr-guia__col">
            <p class="pr-guia__rotulo">
              <Icon name="ph:x-circle" class="pr-guia__icono pr-guia__icono--no" aria-hidden="true" />
              <span class="etiqueta">{{ $t('press.guide_no_label') }}</span>
            </p>
            <p class="pr-guia__texto">{{ $t('press.guide_no') }}</p>
          </div>
        </div>
      </div>
    </Banda>

    <!-- 7 · El caso en los medios (#cobertura: el destino de «Mi caso en la prensa» de /links, F6) y material descargable.
         Cada pieza es una TarjetaEnlace externa (avisa de la pestaña nueva sola). La meta se construye en el script: un
         `<template> · {{ }}` perdería el espacio (R11). -->
    <Banda tono="crema" titular="press-mentions">
      <div id="cobertura" class="scroll-mt-24">
        <CabeceraSeccion id="press-mentions" :titulo="$t('press.mentions_title')">
          <p class="pr-nota">{{ $t('press.mentions_note') }}</p>
        </CabeceraSeccion>
        <ul aria-labelledby="press-mentions" class="pr-lista" role="list">
          <li v-for="item in mentions" :key="item.url">
            <TarjetaEnlace
              :href="item.url"
              :titulo="item.title"
              :meta="metaMencion(item)"
              icono="ph:newspaper-clipping"
              @click="trackPress(item.outlet)"
            />
          </li>
        </ul>
      </div>

      <div class="pr-bloque">
        <CabeceraSeccion id="press-resources" :titulo="$t('press.resources_title')" />
        <ul aria-labelledby="press-resources" class="pr-lista pr-lista--dos pr-recursos" role="list">
          <li>
            <TarjetaEnlace
              href="/press-kit-miriam-gonzalez.pdf"
              download
              :titulo="$t('press.kit_download_label')"
              :meta="$t('press.kit_download_note')"
              icono="ph:file-pdf"
            />
          </li>
          <li>
            <TarjetaEnlace
              :to="localePath('ciencia')"
              :titulo="$t('press.resource_science')"
              :meta="$t('press.resource_science_desc')"
              icono="ph:flask"
            />
          </li>
          <li>
            <TarjetaEnlace
              href="/llms.txt"
              :titulo="$t('press.resource_llms')"
              :meta="$t('press.resource_llms_desc')"
              icono="ph:robot"
            />
          </li>
          <li>
            <TarjetaEnlace
              :to="localePath('gastos')"
              :titulo="$t('press.resource_expenses')"
              :meta="$t('press.resource_expenses_desc')"
              icono="ph:receipt"
            />
          </li>
          <li>
            <TarjetaEnlace
              :to="localePath('colabora')"
              :titulo="$t('press.resource_collaborate')"
              :meta="$t('press.resource_collaborate_desc')"
              icono="ph:hand-heart"
            />
          </li>
        </ul>
      </div>
    </Banda>

    <!-- 8 · Contacto de prensa. Banda tarjeta, no oscura: el pie empieza con su banda berenjena de logos y dos oscuras seguidas se leen
         como una. El botón pasa de btn-dark a btn-secondary («navegar o contactar»). -->
    <Banda tono="tarjeta" titular="press-contact-title">
      <CabeceraSeccion id="press-contact-title" :titulo="$t('press.contact_title')" />
      <div class="pr-contacto">
        <p class="prosa">{{ $t('press.contact_body') }}</p>
        <div>
          <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-secondary">
            <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
            {{ $t('press.contact_cta') }}
          </NuxtLink>
        </div>
      </div>
      <ActualizadoEl class="pr-actualizado" :fecha="caseData.pressAsOf" clave="press.updated_label" />
    </Banda>
  </div>
</template>

<script setup lang="ts">
import type { Collections, PressEnCollectionItem } from '@nuxt/content'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackPress } = useSupport()

const boilerplateText = computed(() =>
  t('press.boilerplate_text', {
    age: caseData.currentAge,
    countries: caseData.countries,
  })
)

// Las props que comparten todos los botones «copiar» de la página.
const copyProps = (text: string) => ({
  text,
  label: t('press.boilerplate_copy'),
  copiedLabel: t('press.boilerplate_copied'),
  failedLabel: t('press.copy_failed'),
})

const bioLong = computed(() =>
  t('press.bio_long_text', { age: caseData.currentAge, countries: caseData.countries })
)

const fork = computed(() => [
  { href: '#hechos', icon: 'ph:newspaper', title: t('press.fork_piece_title'), desc: t('press.fork_piece_desc') },
  { href: '#colaboracion', icon: 'ph:microphone', title: t('press.fork_invite_title'), desc: t('press.fork_invite_desc') },
])

// Hechos clave · las cifras que pueden desincronizarse (edad, nº de países)
// vienen de la fuente única (caseData), no del texto i18n.
// En inglés, las citas 1 a 3 son traducciones: se dice, y se enseña el original en español.
const quotes = computed(() => {
  const en = locale.value === 'en'
  const original = (n: number) => t(`press.quote_${n}`, {}, { locale: 'es' })
  return [1, 2, 3, 4].map((n) => ({
    text: t(`press.quote_${n}`),
    source: t(`press.quote_${n}_source`),
    note: !en
      ? ''
      : n < 4
        ? `Translated from Spanish · Original: «${original(n)}»`
        : 'Original in English',
  }))
})

const facts = computed(() => [
  { label: t('press.fact_who_label'), value: t('press.fact_who_value', { age: caseData.currentAge }) },
  { label: t('press.fact_diagnosis_label'), value: t('press.fact_diagnosis_value') },
  { label: t('press.fact_why_label'), value: t('press.fact_why_value') },
  { label: t('press.fact_need_label'), value: t('press.fact_need_value') },
  { label: t('press.fact_network_label'), value: t('press.fact_network_value', { countries: caseData.countries }) },
  { label: t('press.fact_lang_label'), value: t('press.fact_lang_value') },
])

const faq = computed(() => {
  const links: Record<number, { to: string; toLabel: string }> = {
    4: { to: localePath('colabora'), toLabel: t('press.resource_collaborate') },
    5: { to: localePath('gastos'), toLabel: t('press.resource_expenses') },
    8: { to: '#colaboracion', toLabel: t('press.collab_title') },
    9: { to: localePath('timeline'), toLabel: t('press.timeline_title') },
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
    q: t(`press.faq_q${i}`),
    // La 5.ª (de dónde sale el dinero) cierra con la frase canónica de transparencia, por referencia: no se copia en la clave.
    a: t(`press.faq_a${i}`, { age: caseData.currentAge }) + (i === 5 ? ` ${t('money.transparencia')}` : ''),
    ...links[i],
  }))
})

const timeline = computed(() =>
  [1, 2, 3, 4, 5, 6, 7].map((i) => ({ date: t(`press.tl_${i}_date`), text: t(`press.tl_${i}_text`) }))
)

// Apariciones en prensa (content/<locale>/press.yml).
const { data: pressData } = await useAsyncData(
  `press-${locale.value}`,
  () => {
    const collection = `press_${locale.value || 'en'}` as keyof Collections
    return queryCollection(collection).first() as Promise<PressEnCollectionItem | null>
  },
  { watch: [locale] }
)
const mentions = computed(() => pressData.value?.articles ?? [])

// 'YYYY-MM-DD' / 'YYYY-MM' → mes y año legibles según idioma.
const fmtDate = (d?: string) => {
  if (!d) return ''
  const [y, m] = d.split('-')
  if (!m) return y
  const date = new Date(Number(y), Number(m) - 1, 1)
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

// «Medio · mes año», armado aquí y no en la plantilla (R11: el espacio de `<template> · {{ }}` se pierde).
const metaMencion = (item: { outlet: string; date?: string }) =>
  item.date ? `${item.outlet} · ${fmtDate(item.date)}` : item.outlet

useSeoMeta({
  title: () => (locale.value === 'es' ? 'Sala de prensa' : 'Press room'),
  description: () =>
    locale.value === 'es'
      ? 'Kit de prensa del caso de Miriam González: hechos verificados, perfil molecular, cobertura en medios y contacto para periodistas.'
      : "Press kit for Miriam González's case: verified facts, molecular profile, media coverage and a contact for journalists.",
  ogTitle: () => (locale.value === 'es' ? 'Sala de prensa · Miriam González' : 'Press room · Miriam González'),
  ogDescription: () =>
    locale.value === 'es'
      ? 'Hechos verificados, perfil molecular y contacto para medios.'
      : 'Verified facts, molecular profile and a media contact.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

defineOgImage('Default.takumi', {
  title: () => t('press.title'),
  description: () =>
    locale.value === 'es'
      ? 'Hechos verificados y contacto para periodistas.'
      : 'Verified facts and a contact for journalists.',
})

const pressJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: locale.value === 'es' ? 'Sala de prensa · Miriam González' : 'Press room · Miriam González',
    description: t('press.subtitle'),
    url: locale.value === 'es' ? 'https://helpmiriam.com/prensa' : 'https://helpmiriam.com/en/press',
    inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
    about: {
      '@type': 'Person',
      name: 'Miriam González',
      url: 'https://helpmiriam.com',
      jobTitle: locale.value === 'es' ? 'Ingeniera de software y divulgadora tech' : 'Software engineer and tech communicator',
    },
    audience: {
      '@type': 'Audience',
      audienceType: locale.value === 'es' ? 'Periodistas y medios' : 'Journalists and media',
    },
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: pressJsonLd }],
})
</script>

<style scoped>
/* Sistema v3: solo tokens (cero hex, cero tamaños sueltos). Cada bloque ya tiene su relleno por la Banda; aquí solo el aire de dentro. */

/* Cabecera: el bifurcador va dentro del PageHeader; el aire hasta la banda siguiente lo pone el relleno de la Banda. */
.pr-cabecera :deep(.cabecera-pagina) { margin-bottom: 0; }
.pr-fork { margin-top: var(--sp-32); }
.pr-fork .eyebrow { margin: 0 0 var(--sp-12); }

/* Lista de tarjetas-enlace: una columna y dos desde 640 px. La tarjeta se estira a la altura de su fila. */
.pr-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); grid-template-columns: minmax(0, 1fr); }
.pr-lista--dos { gap: var(--sp-16); }
@media (min-width: 640px) {
  .pr-lista--dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* Cinco recursos en dos columnas: el último ocupa el ancho entero, como antes. */
  .pr-recursos > li:last-child { grid-column: 1 / -1; }
}
.pr-lista > li { display: flex; }
.pr-lista > li > :deep(*) { width: 100%; }

/* Bloque dentro de una banda (después del primero): el aire de un capítulo corto. */
.pr-bloque { margin-top: var(--sp-64); }
.pr-nota { margin: var(--sp-16) 0 0; max-width: var(--measure); font: var(--tipo-body-sm); color: var(--texto-2); }
.pr-nota--sin-margen { margin-top: 0; }

/* Cómo trabajo con medios */
.pr-colab { display: grid; gap: var(--sp-16); justify-items: start; max-width: var(--measure); }
.pr-colab > p { margin: 0; }
.pr-numerada { margin: 0; padding-left: var(--sp-24); list-style: decimal; display: grid; gap: var(--sp-8); }

/* Hechos clave: la ficha (filas con filete) y el retrato */
.pr-hechos { display: grid; gap: var(--sp-32); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 1024px) { .pr-hechos { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: var(--sp-48); } }
.pr-ficha { margin: 0; }
.pr-ficha__fila { display: grid; gap: var(--sp-4); padding: var(--sp-16) 0; }
.pr-ficha__fila + .pr-ficha__fila { border-top: 1px solid var(--trazo-sutil); }
@media (min-width: 640px) { .pr-ficha__fila { grid-template-columns: 10rem minmax(0, 1fr); gap: var(--sp-24); } }
.pr-ficha dt { padding-top: var(--sp-4); }
.pr-ficha dd { margin: 0; font: var(--tipo-ui); color: var(--texto-1); }
.pr-pie { margin-top: var(--sp-12); font-size: var(--texto-xs); line-height: 1.5; color: var(--texto-2); }

/* Fotografías */
.pr-fotos { display: grid; gap: var(--sp-24); grid-template-columns: minmax(0, 1fr); max-width: 52rem; }
@media (min-width: 640px) { .pr-fotos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

/* Citas (banda oscura): dos columnas desde 768 px, cada una con su filete */
.pr-citas { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-32) var(--sp-48); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .pr-citas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pr-cita { border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.pr-cita__texto { margin: 0; font: var(--tipo-h3); letter-spacing: var(--track-cifra); color: var(--texto-1); text-wrap: balance; }
.pr-cita__fuente { margin-top: var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); }
.pr-cita__nota { margin: var(--sp-8) 0 0; font-size: var(--texto-xs); line-height: 1.5; color: var(--texto-2); }

/* Plegados: biografía, preguntas frecuentes, cronología */
.pr-plegados { border-bottom: 1px solid var(--trazo-medio); }
.pr-plegado { padding: var(--sp-8) 0 var(--sp-32); }
.pr-bio { display: grid; gap: var(--sp-32) var(--sp-48); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .pr-bio { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pr-bio h3 { margin: 0 0 var(--sp-8); }
.pr-bio p { margin: 0; font: var(--tipo-ui); color: var(--texto-1); }
.pr-faq { margin: 0; }
.pr-faq > div { padding: var(--sp-16) 0; }
.pr-faq > div + div { border-top: 1px solid var(--trazo-sutil); }
.pr-faq dt { margin: 0; }
.pr-faq dd { margin: var(--sp-4) 0 0; max-width: var(--measure); font: var(--tipo-ui); color: var(--texto-1); }
.pr-faq__enlace { margin-left: var(--sp-4); }
.pr-cronologia { list-style: none; margin: var(--sp-12) 0 var(--sp-8); padding: 0; }
.pr-cronologia > li { display: grid; gap: var(--sp-4) var(--sp-24); padding: var(--sp-12) 0; font: var(--tipo-ui); color: var(--texto-1); }
.pr-cronologia > li + li { border-top: 1px solid var(--trazo-sutil); }
@media (min-width: 640px) { .pr-cronologia > li { grid-template-columns: 11rem minmax(0, 1fr); } }

/* Guía editorial Sí / No: dos columnas con filete. El icono no es la única señal: lleva su palabra. */
.pr-guia { display: grid; gap: var(--sp-32) var(--sp-48); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .pr-guia { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pr-guia__col { border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.pr-guia__rotulo { display: flex; align-items: center; gap: var(--sp-8); margin: 0 0 var(--sp-12); }
.pr-guia__icono { flex: none; width: 1.25rem; height: 1.25rem; }
.pr-guia__icono--si { color: var(--identidad); }
.pr-guia__icono--no { color: var(--texto-1); }
.pr-guia__texto { margin: 0; font: var(--tipo-body-sm); color: var(--texto-1); }

/* Contacto */
.pr-contacto { display: grid; gap: var(--sp-24); justify-items: start; max-width: var(--measure); }
.pr-contacto > p { margin: 0; }
.pr-actualizado { margin-top: var(--sp-48); padding-top: var(--sp-24); border-top: 1px solid var(--trazo-sutil); }
</style>
