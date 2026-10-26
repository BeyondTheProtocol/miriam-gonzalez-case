<template>
  <!-- Cielo a sangre (T3-LOTE3, A35), como /links: la constelación pinta todo el ancho de la página y no solo la columna de 672 px, que la cortaba en
       un rectángulo de estrellas (a 1280 se veía el borde donde acababan). La columna sigue siendo `.section-container` (centrada a propósito). -->
  <div class="relative overflow-hidden">
    <!-- B1 · constelación de quienes apoyan (decorativa, detrás del mensaje) -->
    <Constellation :count="donorCount" :donations="donations" />
    <div class="relative z-10 section-container max-w-2xl py-20 sm:py-28 text-center">
    <!-- Monograma redondo con constelación -->
    <svg class="mx-auto mb-8 w-24 h-24 sm:w-28 sm:h-28" viewBox="0 0 240 240" aria-hidden="true">
      <path d="M192.94 24.47 L199.74 37.67 L212.94 44.47 L199.74 51.27 L192.94 64.47 L186.14 51.27 L172.94 44.47 L186.14 37.67 Z" fill="#9d44ab" />
      <path d="M48.33 173.84 L52.75 182.42 L61.33 186.84 L52.75 191.26 L48.33 199.84 L43.91 191.26 L35.33 186.84 L43.91 182.42 Z" fill="#9d44ab" />
      <path d="M55.05 44.24 L57.94 49.85 L63.55 52.74 L57.94 55.63 L55.05 61.24 L52.16 55.63 L46.55 52.74 L52.16 49.85 Z" fill="#9d44ab" opacity="0.5" />
      <circle cx="182.5" cy="184.7" r="3.4" fill="#9d44ab" />
      <circle cx="120" cy="120" r="76" fill="#2d1b3d" />
      <text x="120" y="147" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="120" fill="#faf6f0">m</text>
    </svg>

    <p class="eyebrow mb-4 block">{{ $t('thanks.eyebrow') }}</p>

    <i18n-t keypath="thanks.title" tag="h1" class="heading-display text-3xl sm:text-5xl text-berenjena" style="letter-spacing: -0.03em">
      <template #firma><span class="firma">{{ $t('thanks.firma') }}</span></template>
    </i18n-t>

    <!-- El recibo: la frase canónica (money.recibo, la de /gastos; criterio de legal-burocracia, 23-oct-2026), sin importes,
         sin «100 %», sin «mensual», sin «sin intermediarios» y sin prometer un correo (quien lo envía, si lo envía, es GoFundMe).
         «Escríbenos» lleva a /contacto con el rol «other» (ya válido; /privacidad §2 no cambia) y el informe de gastos, a /gastos.
         Nada de email directo ni plazos de respuesta. -->
    <p id="gracias-recibo" class="mt-6 text-lg text-tinta leading-relaxed max-w-xl mx-auto">
      {{ $t('money.recibo') }}
    </p>
    <ul class="mt-1 flex flex-wrap justify-center gap-x-6">
      <li>
        <NuxtLink
          :to="localePath({ name: 'contacto', query: { role: 'other' } })"
          class="link-action group min-h-[44px] text-miriam"
          aria-describedby="gracias-recibo"
        >
          {{ $t('expenses.faq_help_link') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </li>
      <li>
        <NuxtLink :to="localePath('gastos')" class="link-action group min-h-[44px] text-miriam">
          {{ $t('home.dinero_informe') }}
          <Icon name="ph:arrow-right" class="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>

    <!-- Dos acciones, de 44 px como mínimo: compartir y el paso siguiente, que lleva a lo último del caso (antes, «Volver al
         inicio»: la cabecera conserva el logo, que va a la home). -->
    <div class="mt-8 flex flex-wrap gap-3 justify-center">
      <button type="button" class="btn-secondary w-full sm:w-auto" @click="share">
        <Icon :name="copied ? 'ph:check-bold' : 'ph:share-network-fill'" class="w-4 h-4" aria-hidden="true" />
        {{ copied ? $t('thanks.copied') : $t('thanks.share') }}
      </button>
      <NuxtLink
        :to="localePath({ name: 'timeline' }) + '#lo-ultimo'"
        class="btn-secondary w-full sm:w-auto"
        @click="trackLatest('gracias')"
      >
        {{ $t('thanks.next') }}
        <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
      </NuxtLink>
    </div>

    <!-- T3-LOTE3 (A35): el usuario es un enlace de 44 px a su Instagram (el texto dice «en Instagram») y, desde `lg`, la frase va en Hanken de 15 px
         y no en mono de 13 (por debajo de `lg` la tipografía no cambia: la regla móvil primero de la tanda no deja tocarla). El texto visible es
         el de siempre: `thanks.follow` lleva ahora el hueco {handle} donde estaba «@miriamgonp». El usuario y la URL salen de REDES y
         REDES_USUARIO (app/utils/navegacion.ts), una sola vez. -->
    <i18n-t keypath="thanks.follow" tag="p" class="mt-10 font-mono text-xs lg:font-body lg:text-sm text-tinta">
      <template #handle>
        <a :href="instagram.url" target="_blank" rel="noopener noreferrer" class="link-inline gracias__handle" translate="no">{{ REDES_USUARIO }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span></a>
      </template>
    </i18n-t>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { trackShare, trackLatest } = useSupport()

// «@miriamgonp en Instagram»: la red y el usuario salen de REDES y REDES_USUARIO (app/utils/navegacion.ts), una sola vez.
const instagram = REDES.find((r) => r.id === 'instagram') ?? REDES[0]!

// Densidad de la constelación ~ donantes (solo para el cielo, no 1:1).
// Datos de campaña: JSON estático de main (función Netlify), carga en cliente.
const campaign = ref<import('../../utils/fundraiser').GoFundMeFundraiser | null>(null)
// Lista de donaciones con importe (para la constelación: magnitud por aportación).
const donations = ref<{ amount: number; createdAt?: string }[]>([])
onMounted(async () => {
  campaign.value = await $fetch('/fundraiser.json')
  try {
    donations.value = await $fetch('/donations.json')
  } catch {
    /* sin lista — la constelación cae a densidad por nº de donantes */
  }
})
const donorCount = computed(() => campaign.value?.donationCount ?? 60)

// Página de cortesía post-donación: no debe indexarse.
useSeoMeta({
  title: () => `${t('thanks.eyebrow')} · helpmiriam.com`,
  robots: 'noindex, nofollow',
})

const copied = ref(false)

async function share() {
  if (!import.meta.client) return
  const url = window.location.origin + localePath('/')
  const data = { title: 'helpmiriam.com', text: t('thanks.share_text'), url }
  if (navigator.share) {
    try {
      await navigator.share(data)
      trackShare('nativo', 'gracias')
    } catch {
      /* usuario canceló — sin acción */
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
      copied.value = true
      trackShare('copiar', 'gracias')
      setTimeout(() => (copied.value = false), 2500)
    } catch {
      /* sin clipboard — sin acción */
    }
  }
}
</script>

<style scoped>
/* El enlace del usuario mide 44 px (como `.link-action`): es un destino, no una palabra suelta. La frase queda centrada y la línea que lo lleva crece. */
.gracias__handle { display: inline-flex; align-items: center; min-height: var(--control-min); }
</style>
