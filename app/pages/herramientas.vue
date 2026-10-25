<script setup lang="ts">
/**
 * Índice de herramientas (tanda 2 del rediseño de arquitectura, T2a, 24-oct-2026). La página vuelve a ser viva: F4 la había fusionado
 * en /datos#visores con un 301 (23-oct), y Miriam decidió el 24-oct que «Herramientas» vuelve al menú, que esta página
 * vive y que las herramientas se enseñan en DOS grupos:
 *   · «Las de ahora»: célula a célula, su explorador, mama-hígado-hueso, el caso en datos y las laminillas (HERRAMIENTAS).
 *   · «Sirvieron en un momento concreto»: el mapa de metástasis y el reservorio (HERRAMIENTAS_PASADAS).
 * Cada tarjeta dice para qué sirve y para quién es; las dos pasadas, además, cuándo y para qué se hicieron (la línea de Miriam, la
 * misma que lleva arriba cada una de sus páginas).
 *
 * Qué es copy publicado y qué es nuevo:
 *   · Título y descripción de cada herramienta: LITERALES, los de su página (COPY_HERRAMIENTAS). Nada de cifras nuevas.
 *   · Nuevo, para voz-miriam: la frase de apertura, las etiquetas «Para…» y los rótulos de los dos grupos.
 *   · «Qué buscamos» sale de caso.json por su `tema` (TEMAS_HERRAMIENTA), con el mismo componente que /datos.
 *
 * Una tarjeta es un <article>, no un enlace envolvente: lleva un <details> dentro, y un <details> no cabe en un enlace.
 * El título no es un enlace (el botón «Abrir» ya lo es): dos enlaces seguidos al mismo sitio dentro de una tarjeta es ruido.
 * Todas las tarjetas del grupo siguen el mismo orden: icono · «Para…» · título · descripción · «Qué buscamos» · botones.
 */
import { VIDEO_PROMO, duracionVideo } from '~/utils/videos'
import { TEMAS_HERRAMIENTA, type TemaPeticion } from '~/utils/peticiones'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const { GOFUNDME_URL, trackSupport, trackHerramienta } = useSupport()
const { herramientas } = useHerramientas()

// Las peticiones públicas (lista blanca de utils/peticiones.ts), con el mismo import dinámico que usa la home: caso.json pesa ~230 KB.
const { data: caso } = await useCasoHome()
const peticiones = computed(() => caso.value?.peticiones ?? [])

const promo = computed(() => VIDEO_PROMO[lang.value])

type Tarjeta = {
  key: string
  name: string
  titulo: string
  descripcion: string
  icono: string
  etiqueta: string
  ultimo: boolean
  temas: readonly TemaPeticion[]
  rol?: 'oncologist' | 'researcher'
}

function tarjeta(h: { key: string; name: string }): Tarjeta {
  const [titulo, descripcion] = copyHerramienta(h.key, locale.value)
  return {
    key: h.key,
    name: h.name,
    titulo,
    descripcion,
    icono: ICONO_HERRAMIENTA[h.key] ?? 'ph:wrench-fill',
    etiqueta: PARA_HERRAMIENTA[h.key] ? t(PARA_HERRAMIENTA[h.key]!) : '',
    ultimo: h.key === LO_ULTIMO.key,
    temas: TEMAS_HERRAMIENTA[h.key] ?? [],
    rol: ROL_HERRAMIENTA[h.key],
  }
}

const ahora = computed(() => herramientas.value.map(tarjeta))

// Rejilla sin hueco (T3-LOTE2, A27; regla de retícula 2 del lote 0). Desde `lg` la destacada ocupa dos celdas si el número de tarjetas es impar, y
// el grupo pasa a tres columnas desde `xl` solo si las celdas cuadran (con cinco tarjetas y la destacada a span 2, son seis: dos filas de tres).
// Con cuatro (el explorador oculto), dos filas de dos, sin span. Se calcula del número real: el explorador sale solo si su puerta está abierta.
const ahoraImpar = computed(() => ahora.value.length % 2 === 1)
const ahoraCeldas = computed(() => ahora.value.length + (ahora.value.some((h) => h.ultimo) && ahoraImpar.value ? 1 : 0))
const ahoraTres = computed(() => ahoraCeldas.value % 3 === 0)

// Las dos pasadas: su descripción es la línea de Miriam (cuándo y para qué se hicieron), no la meta-description de su página.
const pasadas = computed(() =>
  HERRAMIENTAS_PASADAS.map((h) => ({
    ...tarjeta(h),
    etiqueta: t(h.key === 'map' ? 'herramientas.historico_mapa' : 'herramientas.historico_port'),
    descripcion: t(h.key === 'map' ? 'herramientas.linea_mapa' : 'herramientas.linea_port'),
  })),
)

// Mismos eventos que ya miden la entrada a cada herramienta, con este índice como origen. El reservorio no tiene evento propio.
function abrir(key: string) {
  trackHerramienta(key, 'herramientas')
}

const lede = computed(() => `${t('herramientas.apertura')} ${t('herramientas.apertura_cada_una')}`)

useSeoMeta({
  title: () => t('herramientas.title'),
  description: () => t('herramientas.intro'),
  ogTitle: () => t('herramientas.title'),
  ogDescription: () => t('herramientas.intro'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('herramientas.title'),
  twitterDescription: () => t('herramientas.intro'),
})

defineOgImage('Default.takumi', {
  title: () => t('herramientas.title'),
  description: () => t('herramientas.intro'),
})
</script>

<template>
  <div>
    <Banda tono="tarjeta" compacta>
      <PageHeader :eyebrow="$t('herramientas.eyebrow')" :title="$t('herramientas.title')" :lede="lede" variante="pagina">
        <!-- El promo de Polaris vive en /prensa#video (una casa por cosa): aquí solo se enlaza. Título y duración, sin copy nuevo. -->
        <NuxtLink :to="localePath({ name: 'prensa', hash: '#video' })" class="link-action group herr-promo">
          <Icon name="ph:play-circle" class="w-5 h-5" aria-hidden="true" />
          <span :lang="promo.voz">{{ promo.titulo }}</span>
          <span class="herr-promo__duracion nums">{{ duracionVideo(promo.segundos) }}</span>
          <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </PageHeader>
    </Banda>

    <Banda tono="crema" titular="h-ahora">
      <CabeceraSeccion id="h-ahora" :titulo="$t('herramientas.grupo_ahora')" />
      <ul class="herr-rejilla" :class="{ 'herr-rejilla--tres': ahoraTres }" role="list">
        <li v-for="h in ahora" :key="h.key" :class="{ 'herr-dest': h.ultimo && ahoraImpar }">
          <article class="card-base herr" :class="{ 'card-marked': h.ultimo }" :aria-labelledby="`herr-${h.key}-t`">
            <div class="herr__cab">
              <Icon :name="h.icono" class="herr__icono" aria-hidden="true" />
              <p class="etiqueta">{{ h.etiqueta }}</p>
              <p v-if="h.ultimo" class="etiqueta herr__ultimo">{{ $t('home.tools_new') }}</p>
            </div>
            <h3 :id="`herr-${h.key}-t`" class="h4-tarjeta">{{ h.titulo }}</h3>
            <p class="herr__desc">{{ h.descripcion }}</p>

            <!-- Qué se pide para ESTA herramienta (por tema). Sin temas (las laminillas), el enlace a la lista entera. -->
            <details v-if="h.temas.length && peticiones.length" class="desplegable herr__busca">
              <summary>{{ $t('home.buscamos_heading') }}<span class="sr-only">{{ ': ' + h.titulo }}</span></summary>
              <div class="herr__peticiones">
                <QueBuscamos :fuente="peticiones" :filtro="h.temas" :acciones="false" />
              </div>
            </details>
            <p v-else class="herr__busca herr__busca--todas">
              <NuxtLink :to="localePath({ name: 'datos', hash: '#que-buscamos' })" class="link-action group">
                {{ $t('home.buscamos_todas') }}
                <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </p>

            <div class="herr__acciones">
              <NuxtLink :to="localePath({ name: h.name })" class="btn-dark" @click="abrir(h.key)">
                {{ $t('herramientas.abrir') }}<span class="sr-only">: {{ h.titulo }}</span>
              </NuxtLink>
              <NuxtLink v-if="h.rol" :to="localePath({ name: 'contacto', query: { role: h.rol } })" class="btn-secondary">
                {{ $t('home.buscamos_escribir') }}<span class="sr-only">: {{ h.titulo }}</span>
              </NuxtLink>
            </div>
          </article>
        </li>
      </ul>

      <CabeceraSeccion id="h-pasadas" :titulo="$t('herramientas.grupo_pasadas')" class="herr-grupo2" />
      <ul class="herr-rejilla" role="list">
        <li v-for="h in pasadas" :key="h.key">
          <article class="card-base herr" :aria-labelledby="`herr-${h.key}-t`">
            <div class="herr__cab">
              <Icon :name="h.icono" class="herr__icono" aria-hidden="true" />
              <p class="etiqueta">{{ h.etiqueta }}</p>
            </div>
            <h3 :id="`herr-${h.key}-t`" class="h4-tarjeta">{{ h.titulo }}</h3>
            <p class="herr__desc">{{ h.descripcion }}</p>
            <div class="herr__acciones">
              <NuxtLink :to="localePath({ name: h.name })" class="btn-secondary" @click="abrir(h.key)">
                {{ $t('herramientas.abrir') }}<span class="sr-only">: {{ h.titulo }}</span>
              </NuxtLink>
            </div>
          </article>
        </li>
      </ul>
    </Banda>

    <!-- Tres puertas, sin copy nuevo: escribir al equipo, la prensa y apoyar. El coral es solo el de apoyar. -->
    <Banda tono="tarjeta" titular="h-puertas" compacta>
      <CabeceraSeccion id="h-puertas" :titulo="$t('home.puertas_heading')" />
      <div class="herr-puertas">
        <NuxtLink :to="localePath({ name: 'contacto', query: { role: 'researcher' } })" class="btn-secondary">
          {{ $t('home.buscamos_escribir') }}
        </NuxtLink>
        <NuxtLink :to="localePath('prensa')" class="btn-secondary">{{ $t('nav.press') }}</NuxtLink>
        <a
          :href="GOFUNDME_URL"
          target="_blank"
          rel="noopener noreferrer"
          data-support-cta
          class="btn-cta"
          @click="trackSupport('herramientas')"
        >
          <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
          {{ $t('nav.donate') }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
        </a>
      </div>
    </Banda>
  </div>
</template>

<style scoped>
.herr-promo { margin-top: var(--sp-16); gap: var(--sp-8); }
.herr-promo__duracion { color: var(--texto-2); font: var(--tipo-body-sm); }

.herr-grupo2 { margin-top: var(--sp-64); }
.herr-rejilla { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-24); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) { .herr-rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
/* A27: la destacada a span 2 desde `lg`, y las tres columnas de `xl` solo para el grupo al que le cuadran (antes, siempre: cinco tarjetas dejaban un hueco y las dos
   «pasadas» también). */
@media (min-width: 1024px) { .herr-dest { grid-column: span 2; } }
@media (min-width: 1280px) { .herr-rejilla--tres { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.herr-rejilla > li { display: flex; }

.herr { display: flex; flex-direction: column; gap: var(--sp-12); width: 100%; padding: var(--sp-24); }
.herr__cab { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-4) var(--sp-12); }
.herr__icono { flex: none; width: 1.5rem; height: 1.5rem; color: var(--identidad); }
.herr__ultimo { color: var(--identidad); }
.herr__desc { margin: 0; max-width: var(--measure); font: var(--tipo-body-sm); color: var(--texto-2); }
.herr__busca { margin-top: auto; }
.herr__busca--todas { margin-bottom: 0; }
.herr__peticiones { padding-bottom: var(--sp-8); }
/* Ninguna etiqueta de botón se parte en dos líneas (revisión de T2a): cada botón mide lo que su texto (`flex: 1 1 auto`) y crece para repartir la
   fila; si los dos no caben juntos, el segundo baja y cada uno ocupa su fila entera. Solo si un botón suelto no cupiera en la tarjeta (letra muy
   ampliada en un móvil de 320 px) su etiqueta envuelve: mejor dos líneas que un botón fuera de la tarjeta, por eso no lleva `nowrap`. Con
   `flex: 1 1 9rem`, en la rejilla de 3 columnas (1280 y 1440 px) «Escribir al equipo» se partía y «Abrir» se estiraba hasta los 78 px del vecino. */
.herr__acciones { display: flex; flex-wrap: wrap; gap: var(--sp-12); }
.herr__acciones > * { flex: 1 1 auto; justify-content: center; text-align: center; }

.herr-puertas { display: flex; flex-wrap: wrap; gap: var(--sp-12); }
.herr-puertas > * { flex: 1 1 14rem; justify-content: center; text-align: center; }
@media (min-width: 640px) { .herr-puertas > * { flex: 0 1 auto; } }
</style>
