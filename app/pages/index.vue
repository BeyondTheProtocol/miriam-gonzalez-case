<template>
  <div>
    <!-- Rediseño de arquitectura, F5 (23-oct-2026): la home pasa de 8 bloques a 7, en este orden (DOM = orden visual):
         1 hero · 2 prensa · 3 el caso en 3 frases · 4 cita de Miriam · 5 dónde estamos y qué falta · 6 a qué va el dinero ·
         7 cómo ayudar. Un solo <h1> (el del hero) y un <h2> por bloque. La cita sube justo detrás de «El caso en 3 frases»
         (24-oct-2026): es su voz y la primera cara humana antes de pasar a lo que falta. Lo que se fue: resumen de 2 minutos,
         siete tarjetas con minutos, párrafo de historia y su «(pronto)», «5+ especialistas», «23.100 células», los euros del hero
         y el microcopy de relleno.
         Tanda 2 (T2a, 24-oct-2026): vuelve la banda de herramientas, como bloque 3 justo tras la prensa (la home pasa a 8 bloques).
         Umami la había medido: su teaser fue el 8,7 % de los visitantes de la home. -->

    <!-- 1 · Hero: en cinco segundos, quién es, qué busca y qué puedes hacer -->
    <SectionHero />

    <!-- 2 · Prensa, justo debajo: credibilidad antes de pedir (medios leídos de content/<idioma>/press.yml) -->
    <PrensaTira />

    <!-- 3 · Herramientas (T2a): lo que Miriam ha construido con Polaris, justo tras la prensa que lo cuenta -->
    <SectionHerramientasTeaser />

    <!-- 4 · El caso en 3 frases (#caso: a él baja «Entender el caso» del hero). La única capa llana del sitio, compuesta SOLO
         con frases que la home ya publicaba (verbatim o recortadas, sin afirmaciones nuevas): qué tiene, por qué no encaja,
         qué se hace. Sin «dos biologías» como hecho: eso espera a su gate (G1). -->
    <section
      id="caso"
      v-reveal
      class="scroll-mt-24 bg-cream section-spacing--compacta"
      aria-labelledby="h-caso"
    >
      <div class="section-wide">
        <h2 id="h-caso" class="h2-seccion mb-8">
          {{ $t('home.caso_heading') }}
        </h2>
        <ol class="caso__frases" role="list">
          <li v-for="n in 3" :key="n">
            <span class="caso__num" aria-hidden="true">{{ n }}</span>
            <span class="caso__texto">{{ $t(`home.caso_${n}`) }}</span>
          </li>
        </ol>
        <NuxtLink
          :to="localePath('ciencia')"
          class="link-action group mt-8 min-h-[44px] text-miriam"
          @click="trackScience('home_caso')"
        >
          {{ $t('hero.cta_science') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </div>
    </section>

    <!-- 5 · En sus propias palabras (sube tras «El caso en 3 frases», 24-oct-2026). Las comillas en dos tonos —coral y violeta— son el guiño a las «dos caras» de las que
         habla la cita; es su voz y su firma, no una afirmación de la web. -->
    <!-- Sistema v3 (P1): la banda oscura de la cita es <Banda tono="oscura">. Los colores salen de los roles (ya no hay hex): el
         berenjena es --fondo, la crema --texto-1, la comilla de apertura en coral (--cta-texto, que en una banda oscura es el coral)
         y la de cierre en el violeta claro (--identidad). Banda lleva el v-reveal, la retícula de puntos y el relleno. -->
    <Banda tono="oscura" compacta titular="h-cita">
      <h2 id="h-cita" class="eyebrow mb-8 block cita__rotulo">{{ $t('home.s6_eyebrow') }}</h2>
      <blockquote class="cita__texto font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.2] max-w-3xl">
        <span class="cita__comilla cita__comilla--abre" aria-hidden="true">«</span>{{ $t('home.s6_quote') }}<span class="cita__comilla cita__comilla--cierra" aria-hidden="true">»</span>
      </blockquote>
      <p class="cita__firma mt-8 font-display italic text-xl">
        — {{ $t('home.s6_signature') }}
      </p>
    </Banda>

    <!-- 6 · Dónde estamos y qué falta: la ruta, lo que se hace hoy y la petición concreta a quien puede moverla.
         «Ahora» sale de caso.json (el mismo cálculo que la cifra «Tratamiento» de /datos); sin línea en curso, no se pinta. -->
    <!-- Fondo crema (no «card»): las peticiones de «Qué buscamos» son tarjetas de papel y necesitan un fondo distinto del suyo.
         Sin línea de arriba: desde que la cita (oscura) va delante, el bloque anterior ya no es crema y no hace falta separarlos. -->
    <section v-reveal class="section-spacing bg-cream" aria-labelledby="h-donde">
      <div class="section-wide">
        <h2 id="h-donde" class="h2-declaracion mb-6">
          {{ $t('home.donde_heading') }}
        </h2>
        <p v-if="ahora" class="home-ahora">
          <strong class="font-semibold text-berenjena">{{ $t('home.ahora') }}</strong>
          {{ ahora.detalle }} · {{ ahora.fecha }}
          <DatosSello v-if="ahora.sello" :s="ahora.sello" :lang="lang" />
        </p>

        <HomeProximosPasos />

        <div v-if="peticiones.length" class="mt-12">
          <h3 id="h-buscamos" class="h3-seccion mb-4">
            {{ $t('home.buscamos_heading') }}
          </h3>
          <div class="max-w-3xl">
            <QueBuscamos :fuente="peticiones" :limite="LIMITE_PETICIONES" :acciones="false" />
          </div>
        </div>

        <!-- La fila de acciones es de la home: el botón de contacto profesional (con su rol ya marcado) y «ver todas» solo si
             quedan peticiones sin enseñar. El evento de Umami de las dos primeras lo emite el plugin por el href (VerPeticion,
             Contacto-clic). El acceso «Míralo en 3D» salió en T2a (24-oct-2026): ahora «Mama, hígado y hueso» es una fila de la banda
             de herramientas, dos bloques más arriba, y dos enlaces a /lesiones seguidos eran la clase de ruido que F5 quiso evitar. -->
        <div class="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-6 gap-y-3">
          <NuxtLink
            v-if="peticiones.length"
            :to="localePath({ name: 'contacto', query: { role: 'researcher' } })"
            class="btn-secondary justify-center"
          >
            {{ $t('home.buscamos_escribir') }}
          </NuxtLink>
          <NuxtLink
            v-if="hayMas"
            :to="localePath({ name: 'datos', hash: '#que-buscamos' })"
            class="link-action group min-h-[44px] text-sm text-miriam"
          >
            {{ $t('home.buscamos_todas') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 7 · A qué va el dinero. UNA frase de destino, la canónica (`money.destino`; criterio de legal-burocracia del 23-oct-2026: ni
         «cada euro» ni «100 %»). Desde el 24-oct-2026 los euros pueden estar en el hero y en la tarjeta de la campaña (importe y
         donantes en vivo, de GoFundMe), nunca con objetivo, porcentaje, barra ni «Faltan». El único botón coral de la zona es el de la
         propia tarjeta; si la tarjeta no está (la campaña no respondió), el botón de siempre ocupa su lugar. -->
    <section v-reveal id="campaign" class="section-spacing bg-cream-card" aria-labelledby="h-dinero">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">{{ $t('home.dinero_eyebrow') }}</p>
        <h2 id="h-dinero" class="h2-seccion mb-4">
          {{ $t('home.dinero_heading') }}
        </h2>
        <p class="text-base text-tinta leading-relaxed max-w-2xl">{{ $t('money.destino') }}</p>
        <NuxtLink :to="localePath('gastos')" class="link-action group mt-1 mb-8 min-h-[44px] text-sm text-miriam">
          {{ $t('home.dinero_informe') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>

        <GoFundMeProgress card />
        <div v-if="!gofundme">
          <a
            :href="GOFUNDME_URL"
            target="_blank"
            rel="noopener noreferrer"
            data-support-cta
            class="btn-cta w-full sm:w-auto"
            @click="trackSupport('home_dinero')"
          >
            <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
            {{ $t('home.s4_cta_button') }}
            <span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
          </a>
        </div>
        <CampanaOficial location="home" />
      </div>
    </section>

    <!-- 8 · Cómo ayudar: las cinco puertas (taxonomía única de utils/caminos.ts), sin minutos ni pasos -->
    <section v-reveal class="section-spacing bg-cream" aria-labelledby="h-puertas">
      <div class="section-wide">
        <h2 id="h-puertas" class="h2-seccion mb-8">
          {{ $t('home.puertas_heading') }}
        </h2>
        <Puertas />

        <!-- Para quien no encaja en ninguna puerta (paciente o familiar): sin pedirle nada. Va a la tarjeta «Apoyo entre pacientes»
             de /colabora (#apoyo-mutuo), cuyo texto ya está publicado allí; esta línea lo recoge literal. Fuera de la lista de
             puertas a propósito: son cuatro y test-home-caminos las cuenta. -->
        <p class="puertas-pares">
          <span>{{ $t('home.puertas_pares') }}</span>
          <NuxtLink :to="localePath({ name: 'colabora', hash: '#apoyo-mutuo' })" class="link-action group min-h-[44px] text-miriam">
            {{ $t('home.puertas_pares_cta') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// «verificado» es lo normal: aquí no se pinta en cada dato; solo se marcan las excepciones (Miriam, 24-oct).
provide('ocultarVerificado', true)
const { locale } = useI18n()
const localePath = useLocalePath()
const { GOFUNDME_URL, trackSupport, trackScience } = useSupport()

const lang = computed(() => (locale.value === 'en' ? 'en' : 'es'))

// Lo que la home lee de caso.json: las peticiones públicas y el tratamiento de hoy (ver useCasoHome).
const { data: caso } = await useCasoHome()
const peticiones = computed(() => caso.value?.peticiones ?? [])
const ahora = computed(() => caso.value?.ahora ?? null)
// «Qué buscamos» enseña las 3 de mayor prioridad; el enlace a todas sale solo si quedan más (regla de utils/peticiones.ts).
const LIMITE_PETICIONES = 3
const hayMas = computed(() =>
  peticiones.value.length > 0 && hayEnlaceTodas(undefined, Math.min(LIMITE_PETICIONES, peticiones.value.length), peticiones.value.length),
)

// La campaña (la misma petición que comparten el hero y la tarjeta): sin ella, el bloque del dinero conserva su botón.
const gofundme = await useFundraiser()

// SEO (rediseño F5): sin «ultra-raro» (contradecía la cifra de rareza de la propia web) ni promesas de destino del dinero.
// La identidad de cabecera es «ingeniera de software», no «paciente» + perfil molecular (test-afirmaciones-clinicas).
const TITULO = {
  es: 'Miriam González · Busca un tratamiento hecho a partir de su propio tumor',
  en: 'Miriam González · Looking for a treatment made from her own tumor',
}
const DESCRIPCION = {
  es: 'Miriam González, ingeniera de software, tiene un cáncer de mama metastásico que no encaja en los protocolos habituales. Lo estudia en abierto, con médicos y laboratorios de varios países.',
  en: "Miriam González, a software engineer, has a metastatic breast cancer that doesn't fit the usual protocols. She studies it in the open, with doctors and labs in several countries.",
}
const DESCRIPCION_CORTA = {
  es: 'Ingeniera de software. Su cáncer de mama metastásico no encaja en los protocolos habituales y ella lo estudia en abierto.',
  en: "Software engineer. Her metastatic breast cancer doesn't fit the usual protocols, and she studies it in the open.",
}

defineOgImage('Default.takumi', {
  title: lang.value === 'es' ? 'Busca un tratamiento hecho a partir de su propio tumor' : 'Looking for a treatment made from her own tumor',
  description: DESCRIPCION_CORTA[lang.value],
  role: lang.value === 'es' ? 'Ingeniera de software y divulgadora tech' : 'Software engineer and tech communicator',
  colorMode: 'light',
})

useSeoMeta({
  title: () => TITULO[lang.value],
  description: () => DESCRIPCION[lang.value],
  ogTitle: () => TITULO[lang.value],
  ogDescription: () => DESCRIPCION_CORTA[lang.value],
  ogType: 'website',
  ogUrl: () => (lang.value === 'es' ? 'https://helpmiriam.com' : 'https://helpmiriam.com/en'),
  twitterCard: 'summary_large_image',
  twitterTitle: () => TITULO[lang.value],
  twitterDescription: () => DESCRIPCION_CORTA[lang.value],
})

// DonateAction JSON-LD: declara la vía canónica de donación (GoFundMe) para
// buscadores y agentes de IA que responden «cómo donar / cómo ayudar a Miriam».
// Raw JSON-LD vía useHead (mismo patrón que el FAQPage de gastos.vue), porque
// schema-org no expone un helper dedicado para DonateAction.
const donateJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: locale.value === 'es' ? 'Donar para el caso de Miriam González' : "Donate to Miriam González's case",
    recipient: {
      '@type': 'Person',
      name: 'Miriam González',
      url: 'https://helpmiriam.com',
    },
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://gofund.me/3e25cae99',
      inLanguage: locale.value === 'es' ? 'es-ES' : 'en-US',
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: donateJsonLd }],
})
</script>

<style scoped>
/* Línea de debajo de las puertas: el texto y el enlace en la misma línea si caben; si no, el enlace baja (siempre de 44 px). */
.puertas-pares { margin: 1.25rem 0 0; max-width: 42rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0 0.5rem; font-size: 1rem; line-height: 1.55; color: var(--color-text); }

/* «Ahora»: una línea, la primera del bloque (lo que se hace hoy), antes de la ruta. */
.home-ahora { margin: 0 0 1.5rem; max-width: 42rem; font-size: 1.0625rem; line-height: 1.55; color: var(--color-text); }

/* El caso en tres frases: grandes y con aire, una por línea. El número es decoración (la lista ya lo dice). */
.caso__frases { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.25rem; max-width: 46rem; }
.caso__frases li { display: flex; align-items: baseline; gap: 1rem; }
.caso__num {
  flex: none; width: 2rem; height: 2rem; display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--radius-pill); background: rgb(var(--color-text-rgb) / 0.06); color: var(--color-text);
  font: 600 0.8125rem/1 var(--font-mono, ui-monospace, monospace); transform: translateY(-0.15rem);
}
.caso__texto { font: 600 clamp(1.25rem, 1rem + 1.2vw, 1.75rem)/1.3 var(--font-display, 'Fraunces', serif); letter-spacing: -0.015em; color: var(--color-text); }

/* La cita (sistema v3, P1): antes escrita con hex y con el tracking en línea. El rótulo y la firma van en el violeta suave de la paleta;
   las comillas, en coral (--cta-texto: coral sobre berenjena) y en el violeta claro de la banda (--identidad). */
.cita__rotulo { color: var(--color-miriam-soft); }
.cita__texto { letter-spacing: var(--track-titular); }
.cita__comilla--abre { color: var(--cta-texto); }
.cita__comilla--cierra { color: var(--identidad); }
.cita__firma { color: var(--color-miriam-soft); }
</style>
