<template>
  <div class="[--measure:58ch]">
    <!-- `[--measure:58ch]` en la raíz: la medida de lectura de esta página es de 58ch (T3-CIERRE, decisión E del DS sección 8); el token global sigue en 68ch hasta el PR #290. -->
    <!-- Sala de prensa en cuatro bandas (comité de prensa, 25-oct-2026): crema · tarjeta · crema · tarjeta, sin banda oscura. Con ella
         desaparecen el botón berenjena sobre berenjena (1,00:1) y la caja pegada al pie. Las tarjetas (`TarjetaEnlace`) van en la banda
         crema: sobre una banda tarjeta tienen el mismo color que el fondo. Los id de ancla van en un `div` de dentro de la banda, con
         scroll-mt-24 (los lee test-salud-estatica y el 301 de /videos). -->

    <!-- 1 · Cabecera con el ÚNICO contacto, hechos clave y biografía. Quien invita y quien escribe una pieza necesitan lo mismo al
         principio: una etiqueta y un destino (de 7 peticiones recientes, 6 eran invitaciones; la lista de qué contar va comprimida en
         `contact_hint`). #colaboracion se conserva por si hay enlaces entrantes. -->
    <Banda tono="crema">
      <PageHeader
        :eyebrow="$t('press.tag')"
        :title="$t('press.title')"
        :lede="$t('press.subtitle')"
        variante="pagina"
      >
        <div id="colaboracion" class="scroll-mt-24 pr-contacto">
          <div>
            <NuxtLink :to="localePath('contacto') + '?role=journalist'" class="btn-secondary">
              <Icon name="ph:envelope-simple" class="w-4 h-4" aria-hidden="true" />
              {{ $t('press.contact_cta') }}
            </NuxtLink>
          </div>
          <p class="pr-nota">{{ $t('press.contact_hint') }}</p>
        </div>
      </PageHeader>

      <div id="hechos" class="scroll-mt-24">
        <CabeceraSeccion id="press-facts" :titulo="$t('press.facts_title')" />
        <dl aria-labelledby="press-facts" class="pr-ficha">
          <div v-for="fact in facts" :key="fact.label" class="pr-ficha__fila">
            <dt class="etiqueta">{{ fact.label }}</dt>
            <dd v-if="!fact.partes">{{ fact.value }}</dd>
            <dd v-else class="pr-ficha__partes">
              <!-- Una entrada por línea (comité de diseño, 27-oct-2026): el NO es la barrera del muro hacia el periodista y en un solo párrafo
                   con «·» no se escaneaba. Las cadenas son las de siempre; la página solo las parte por « · ». -->
              <div v-for="p in fact.partes" :key="p.rotulo">
                <strong>{{ p.rotulo }}:</strong>
                <ul class="pr-ficha__lista" role="list">
                  <li v-for="item in p.texto.split(' · ')" :key="item">{{ item }}</li>
                </ul>
              </div>
            </dd>
          </div>
        </dl>
        <NuxtLink :to="localePath('timeline')" class="link-action group">
          {{ $t('press.timeline_link') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
        <ActualizadoEl class="pr-actualizado" :fecha="caseData.pressAsOf" clave="press.updated_label" />
      </div>

      <!-- Biografía fusionada: la corta (la de siempre, en tercera persona) a la vista y la larga plegada. -->
      <div class="pr-bloque">
        <CabeceraSeccion id="press-bio" :titulo="$t('press.bio_title')" />
        <div class="pr-bio">
          <h3 class="etiqueta">{{ $t('press.bio_short_label') }}</h3>
          <p id="press-bio-corta">{{ bioShort }}</p>
          <CopyButton v-bind="copyProps(bioShort)" />
        </div>
        <details class="desplegable pr-bio-larga">
          <summary>{{ $t('press.bio_long_label') }}</summary>
          <div class="pr-bio">
            <p>{{ bioLong }}</p>
            <CopyButton v-bind="copyProps(bioLong)" />
          </div>
        </details>
      </div>
    </Banda>

    <!-- 2 · Material para tu pieza: cuatro citas aprobadas (27-jun-2026), dos fotos y el vídeo. Citas planas, sin raya lateral ni
         tarjeta. En inglés, las citas 1 a 3 llevan su nota de traducción. -->
    <Banda tono="tarjeta" titular="press-material">
      <CabeceraSeccion id="press-material" :titulo="$t('press.material_title')" />

      <h3 id="press-quotes" class="h3-seccion pr-h3">{{ $t('press.quotes_title') }}</h3>
      <p class="pr-nota pr-nota--arriba">{{ $t('press.quotes_note') }}</p>
      <ul aria-labelledby="press-quotes" class="pr-citas" role="list">
        <li v-for="(quote, i) in quotes" :key="i" class="pr-cita">
          <blockquote
            class="m-0"
            :aria-label="$t('press.quote_aria', { n: i + 1, total: quotes.length, source: quote.source })"
          >
            <p class="h3-seccion">{{ quote.text }}</p>
            <footer class="etiqueta pr-cita__fuente">{{ quote.source }}</footer>
          </blockquote>
          <p v-if="quote.note" class="pr-cita__nota">{{ quote.note }}</p>
        </li>
      </ul>

      <div class="pr-bloque">
        <h3 id="press-photos" class="h3-seccion pr-h3">{{ $t('press.photos_title') }}</h3>
        <!-- T3-LOTE1 (A10, 25-oct-2026): desde `lg` las dos fotos se recortan a 4/5, con el encuadre puesto a mano para no cortar la cara ni las
             manos del retrato «ingeniera»; hasta `lg` conservan su proporción de siempre (2/3). `sizes` pide 540 px: holgura para pantallas de 1,33x. -->
        <div class="pr-fotos" role="group" aria-labelledby="press-photos">
          <figure class="m-0">
            <NuxtImg
              src="/img/miriam-prensa-retrato.jpg"
              :alt="$t('press.photo_retrato_alt')"
              width="800"
              height="1200"
              sizes="sm:100vw md:540px"
              class="w-full h-auto rounded-card aspect-[2/3] lg:aspect-[4/5] object-cover lg:object-[50%_25%]"
              loading="lazy"
            />
          </figure>
          <figure class="m-0">
            <NuxtImg
              src="/img/miriam-prensa-ingeniera.jpg"
              :alt="$t('press.photo_ingeniera_alt')"
              width="800"
              height="1200"
              sizes="sm:100vw md:540px"
              class="w-full h-auto rounded-card aspect-[2/3] lg:aspect-[4/5] object-cover lg:object-[50%_65%]"
              loading="lazy"
            />
          </figure>
        </div>
        <p class="pr-nota">{{ $t('press.photo_download_note') }}</p>
      </div>

      <!-- Vídeo: el promo de Polaris, con su transcripción. Venía de /videos, fusionada aquí en el rediseño (F4,
           23-oct-2026); desde T2c (24-oct-2026) /videos redirige a esta ancla (#video) y el explicativo del ADC vive en el hito
           del 7-oct de /timeline. Mismo vídeo y mismas palabras. -->
      <div id="video" class="scroll-mt-24 pr-bloque">
        <h3 id="press-video" class="h3-seccion pr-h3">{{ $t('press.video_title') }}</h3>
        <VideoCaso :video="VIDEO_PROMO[locale === 'en' ? 'en' : 'es']" nivel="h4" class="max-w-2xl" />
        <!-- T2a (24-oct-2026): lo que cuenta el vídeo, abierto. El índice de herramientas vuelve a ser una página. -->
        <NuxtLink :to="localePath('herramientas')" class="link-action group mt-4">
          {{ $t('nav.all_tools') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </div>
    </Banda>

    <!-- 3 · El caso en los medios. #cobertura: el destino de «Mi caso en la prensa» de /links (F6). Las diez piezas de press.yml, sin filtro
         por `home`. La meta se construye en el script: un `<template> · {{ }}` perdería el espacio (R11). -->
    <Banda tono="crema" titular="press-mentions">
      <div id="cobertura" class="scroll-mt-24">
        <CabeceraSeccion id="press-mentions" :titulo="$t('press.mentions_title')" />
        <ul aria-labelledby="press-mentions" class="pr-lista pr-lista--cobertura" role="list">
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
    </Banda>

    <!-- 4 · Tres preguntas frecuentes, abiertas (sin clics). La 5.ª cierra con la frase canónica de transparencia. -->
    <Banda tono="tarjeta" titular="press-faq">
      <CabeceraSeccion id="press-faq" :titulo="$t('press.faq_title')" />
      <dl class="pr-faq">
        <div v-for="item in faq" :key="item.q">
          <dt class="h4-tarjeta">{{ item.q }}</dt>
          <!-- La respuesta es un párrafo y el enlace va DEBAJO, fuera de la frase: `link-action` es el enlace con flecha «fuera de un
               párrafo» (DESIGN-SYSTEM §4); dentro de una frase iría `link-inline`. -->
          <dd>
            <p class="m-0">{{ item.a }}</p>
            <NuxtLink v-if="item.to" :to="item.to" class="link-action group pr-faq__enlace">
              {{ item.toLabel }}
              <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </NuxtLink>
          </dd>
        </div>
      </dl>
    </Banda>
  </div>
</template>

<script setup lang="ts">
import type { Collections, PressEnCollectionItem } from '@nuxt/content'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackPress } = useSupport()

// Biografía corta: el antiguo texto listo para copiar (tercera persona), que pasa a ser LA corta. Sale la corta en primera persona.
const bioShort = computed(() =>
  t('press.bio_short_text', {
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

// Los originales en español de las citas 1 a 3 (el set aprobado el 27-jun-2026), para la nota de la versión inglesa. No se piden a
// vue-i18n con la opción de idioma «es»: en /en/press los mensajes en español no están cargados (carga perezosa) y la nota decía «Original: «press.quote_1»»
// (así estaba en producción el 25-oct-2026). test-sala-prensa los compara con el set aprobado y mira el HTML generado.
const ORIGINALES_ES = [
  'No pido garantías, pido oportunidades.',
  'Que los casos raros dejen de ser notas a pie de página y pasen a ser datos, estudios, opciones reales.',
  'Uso la IA para amplificar mi conocimiento.',
] as const

// En inglés, las citas 1 a 3 son traducciones: se dice, y se enseña el original en español.
const quotes = computed(() => {
  const en = locale.value === 'en'
  const original = (n: number) => ORIGINALES_ES[n - 1]
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

// Hechos clave · las cifras que pueden desincronizarse (edad) vienen de la fuente única (caseData), no del texto i18n.
// «Cómo nombrarla» es el subconjunto literal de la guía editorial y la única barrera del muro hacia el periodista: si hay que recortar, se
// recorta del SÍ. En el NO no salen nunca «lazo rosa» y morbo (la dignidad) ni una traducción presentada como cita literal (en /en/press,
// 3 de las 4 citas son traducciones).
type Hecho = { label: string; value: string; partes?: { rotulo: string; texto: string }[] }
const facts = computed<Hecho[]>(() => [
  { label: t('press.fact_who_label'), value: t('press.fact_who_value', { age: caseData.currentAge }) },
  { label: t('press.fact_case_label'), value: t('press.fact_case_value') },
  { label: t('press.fact_done_label'), value: t('press.fact_done_value') },
  { label: t('press.fact_need_label'), value: t('press.fact_need_value') },
  {
    label: t('press.fact_name_label'),
    value: '',
    partes: [
      { rotulo: t('press.guide_yes_label'), texto: t('press.guide_yes', { age: caseData.currentAge }) },
      { rotulo: t('press.guide_no_label'), texto: t('press.guide_no') },
    ],
  },
])

const faq = computed(() => {
  const links: Record<number, { to: string; toLabel: string }> = {
    5: { to: localePath('gastos'), toLabel: t('expenses.title') },
    9: { to: localePath('timeline'), toLabel: t('press.timeline_link') },
  }
  return [3, 5, 9].map((i) => ({
    q: t(`press.faq_q${i}`),
    // La 5.ª (de dónde sale el dinero) cierra con la frase canónica de transparencia, por referencia: no se copia en la clave.
    a: t(`press.faq_a${i}`, { age: caseData.currentAge }) + (i === 5 ? ` ${t('money.transparencia')}` : ''),
    ...links[i],
  }))
})

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

// Sin «perfil molecular» en la descripción ni en la vista previa (Boilerplate-Prensa.md lo prohíbe en esos huecos).
useSeoMeta({
  title: () => (locale.value === 'es' ? 'Sala de prensa' : 'Press room'),
  description: () =>
    locale.value === 'es'
      ? 'Kit de prensa del caso de Miriam González: hechos verificados, citas, fotografías, cobertura en medios y contacto para periodistas.'
      : "Press kit for Miriam González's case: verified facts, quotes, photographs, media coverage and a contact for journalists.",
  ogTitle: () => (locale.value === 'es' ? 'Sala de prensa · Miriam González' : 'Press room · Miriam González'),
  ogDescription: () =>
    locale.value === 'es'
      ? 'Hechos verificados, citas, fotografías y contacto para medios.'
      : 'Verified facts, quotes, photographs and a media contact.',
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

/* Contacto único, bajo la entradilla: el botón y, debajo, lo que conviene contar en el primer mensaje. */
.pr-contacto { margin-top: var(--sp-24); display: grid; gap: var(--sp-12); justify-items: start; }
.pr-contacto .pr-nota { margin: 0; }

/* Bloque dentro de una banda (después del primero): el aire de un capítulo corto. */
.pr-bloque { margin-top: var(--sp-64); }
.pr-nota { margin: var(--sp-16) 0 0; max-width: var(--measure); font: var(--tipo-body-sm); color: var(--texto-2); }
.pr-nota--arriba { margin: 0 0 var(--sp-24); }
.pr-h3 { margin: 0 0 var(--sp-16); }
/* Texto explicativo de 15 a 16 px desde `lg` (A19): el móvil conserva los 15 px. */
@media (min-width: 1024px) {
  .pr-nota { font: var(--tipo-ui); }
}

/* Hechos clave: la ficha (filas con filete) */
.pr-ficha { margin: 0 0 var(--sp-16); }
.pr-ficha__fila { display: grid; gap: var(--sp-4); padding: var(--sp-16) 0; }
.pr-ficha__fila + .pr-ficha__fila { border-top: 1px solid var(--trazo-sutil); }
@media (min-width: 640px) { .pr-ficha__fila { grid-template-columns: 10rem minmax(0, 1fr); gap: var(--sp-24); } }
.pr-ficha dt { padding-top: var(--sp-4); }
.pr-ficha dd { margin: 0; max-width: var(--measure); font: var(--tipo-ui); color: var(--texto-1); }
.pr-ficha__partes { display: grid; gap: var(--sp-16); }
.pr-ficha__lista { list-style: disc; margin: var(--sp-4) 0 0; padding-left: var(--sp-24); display: grid; gap: var(--sp-4); }
.pr-actualizado { margin-top: var(--sp-24); }

/* Biografía: la corta a la vista, la larga plegada */
.pr-bio { display: grid; gap: var(--sp-12); justify-items: start; max-width: var(--measure); }
.pr-bio h3, .pr-bio p { margin: 0; }
.pr-bio p { font: var(--tipo-ui); color: var(--texto-1); }
.pr-bio-larga { margin-top: var(--sp-24); }
.pr-bio-larga .pr-bio { padding: var(--sp-8) 0 var(--sp-16); }

/* Citas: dos columnas desde 768 px, planas, cada una con su filete */
.pr-citas { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-32) var(--sp-48); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .pr-citas { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.pr-cita { border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.pr-cita .h3-seccion { margin: 0; max-width: var(--measure); text-wrap: balance; }
.pr-cita__fuente { margin-top: var(--sp-12); max-width: var(--measure); }
.pr-cita__nota { margin: var(--sp-8) 0 0; max-width: var(--measure); font-size: var(--texto-xs); line-height: 1.5; color: var(--texto-2); }

/* Fotografías */
/* Dos columnas desde el móvil (comité de diseño, 27-oct-2026): apiladas, las dos fotos sumaban ~1000 px de scroll a 375. Desde 768 px, la misma
   retícula y el mismo hueco que las citas de encima: con 52rem de tope terminaban 270 px antes que ellas a 1280. */
.pr-fotos { display: grid; gap: var(--sp-12); grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 768px) { .pr-fotos { gap: var(--sp-32) var(--sp-48); } }

/* Cobertura: lista de tarjetas-enlace, una columna */
.pr-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); grid-template-columns: minmax(0, 1fr); }
.pr-lista > li { display: flex; }
.pr-lista > li > :deep(*) { width: 100%; }
/* Titulares de medios (T3-LOTE2, A19): desde `lg`, dos columnas; si el número es impar, la última ocupa la fila entera (regla de retícula 2: sin
   hueco) y su título se queda en la medida (la flecha sigue en el raíl de las demás). */
@media (min-width: 1024px) {
  .pr-lista--cobertura { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pr-lista--cobertura > li:last-child:nth-child(odd) { grid-column: 1 / -1; }
  .pr-lista--cobertura > li:last-child:nth-child(odd) :deep(.tarjeta-enlace__titulo) { max-width: var(--measure); }
}

/* Preguntas frecuentes, abiertas */
.pr-faq { margin: 0; }
.pr-faq > div { padding: var(--sp-16) 0; }
.pr-faq > div + div { border-top: 1px solid var(--trazo-sutil); }
.pr-faq dt { margin: 0; }
.pr-faq dd { margin: var(--sp-4) 0 0; max-width: var(--measure); font: var(--tipo-ui); color: var(--texto-1); }
.pr-faq__enlace { display: flex; width: fit-content; margin: var(--sp-4) 0 0; }
</style>
