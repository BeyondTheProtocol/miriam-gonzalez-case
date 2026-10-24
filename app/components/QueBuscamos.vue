<script setup lang="ts">
/**
 * «Qué buscamos»: lo que la web le pide a quien puede mover el caso (un laboratorio, un equipo de
 * ensayos, radiología…). Sale de `se_busca` de caso.json con sus sellos, sin una frase propia, y es la
 * palanca más directa de la web hacia NED: por eso tiene un componente que pueden reutilizar las demás
 * páginas (rediseño F1, 23-oct-2026; antes era un bloque escondido al final de «Tejido» en /datos).
 *
 * Casa canónica: /datos#que-buscamos. La página que lo use pone su encabezado y el id; aquí no van, para
 * que el nivel de encabezado encaje en cada sitio y el id no se duplique.
 *
 * Qué peticiones se publican y en qué orden lo decide utils/peticiones.ts (lista blanca; la prioridad es
 * provisional hasta que la confirme el comité médico).
 *
 *   fuente     `se_busca` de caso.json, tal cual. Se pasa por prop y no se importa aquí: caso.json pesa
 *              ~230 KB y una página que solo quiere tres peticiones no debe cargarlo entero por defecto.
 *   limite     cuántas enseñar (las de mayor prioridad)
 *   filtro     solo las de estos temas (se aplica antes del límite)
 *   verTodas   enlace a /datos#que-buscamos. Sin valor, aparece solo si se enseñan menos de las publicadas
 *              (en /datos no sale: ya están todas); con true o false manda lo que diga la página. La regla vive
 *              en utils/peticiones.ts (hayEnlaceTodas).
 *   acciones   la fila de «Escríbenos» y «Ver todo lo que buscamos». Por defecto sí; la home (F5) la quita y pinta la
 *              suya, con el botón «Escribir al equipo» y el enlace al 3D en la misma fila, para no tener dos enlaces
 *              seguidos al mismo sitio. Con `acciones` en false `verTodas` no hace nada.
 *   sellos     el sello de evidencia de cada petición. Por defecto sí; /ciencia (T2c) lo quita para no sumar texto de 11 px a una página
 *              que ya se mide en R10; el enlace «Ver todo lo que buscamos» lleva a /datos, donde cada petición sale con su sello.
 *
 * El enlace a /datos#que-buscamos lo mide el plugin de Umami (VerPeticion), igual que cualquier otro.
 */
import type { Lang } from '~/utils/datosCaso'
import { txtCaso } from '~/utils/datosCaso'
import type { PeticionFuente, TemaPeticion } from '~/utils/peticiones'
import { hayEnlaceTodas, peticionesPublicas, seleccionarPeticiones } from '~/utils/peticiones'

// `verTodas: undefined` NO es adorno: sin un `default`, Vue convierte una prop booleana ausente en `false`, y entonces
// «sin valor → solo si se enseñan menos de las publicadas» nunca se cumpliría (la home y /ciencia, con limite, se
// quedarían sin «Ver todo lo que buscamos»). Lo vigila scripts/test-salud-estatica.ts.
const props = withDefaults(defineProps<{
  fuente: readonly PeticionFuente[]
  limite?: number
  filtro?: readonly TemaPeticion[]
  verTodas?: boolean
  acciones?: boolean
  /** el sello de evidencia de cada petición (11 px, mono). Por defecto sí; /ciencia lo quita (sus peticiones, con su sello, en /datos#que-buscamos) */
  sellos?: boolean
}>(), { verTodas: undefined, acciones: true, sellos: true })

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<Lang>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const publicas = computed(() => peticionesPublicas(props.fuente))
const mostradas = computed(() => seleccionarPeticiones(publicas.value, { filtro: props.filtro, limite: props.limite }))
const enlaceTodas = computed(() => hayEnlaceTodas(props.verTodas, mostradas.value.length, publicas.value.length))
</script>

<template>
  <div v-if="mostradas.length" class="qb">
    <ul class="qb__lista">
      <li v-for="p in mostradas" :key="p.clave">
        {{ txtCaso(p.valor, lang) }}<template v-if="sellos">{{ ' ' }}<DatosSello :s="p.sello" :lang="lang" /></template>
        <NuxtLink v-if="p.enlace === 'celula-a-celula'" :to="localePath('/celula-a-celula')" class="link-inline qb__resultados">{{ L('Los primeros resultados están en Célula a célula', 'The first results are in Cell by cell') }}</NuxtLink>
      </li>
    </ul>
    <div v-if="acciones" class="qb__acciones">
      <!-- el contacto profesional va por el formulario con su rol, sin correo directo ni plazo prometido -->
      <NuxtLink :to="localePath({ name: 'contacto', query: { role: 'researcher' } })" class="link-action group min-h-[44px] text-sm text-miriam">
        {{ L('Escríbenos', 'Write to us') }}
        <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
      <NuxtLink v-if="enlaceTodas" :to="localePath({ name: 'datos', hash: '#que-buscamos' })" class="link-action group min-h-[44px] text-sm text-miriam">
        {{ L('Ver todo lo que buscamos', 'See everything we’re looking for') }}
        <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.qb__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font: 400 14px/1.5 var(--font-body); color: var(--color-text); }
.qb__lista li { padding: 8px 12px; border-radius: 10px; background: var(--color-bg-card); }
/* el enlace va en su propia línea y con 44 px de alto: es un destino, no una palabra suelta del párrafo */
.qb__resultados { display: flex; align-items: center; width: fit-content; min-height: 44px; }
.qb__acciones { display: flex; flex-wrap: wrap; gap: 0 24px; margin-top: 6px; }
</style>
