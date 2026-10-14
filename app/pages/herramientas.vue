<template>
  <div>
    <section class="section-spacing" :aria-labelledby="tituloId">
      <div class="section-wide">
        <PageHeader :subtitle="$t('herramientas.intro')">
          <template #title><span :id="tituloId">{{ $t('herramientas.title') }}</span></template>
        </PageHeader>

        <!-- Índice de herramientas (dictamen `diseno`, 14-oct-2026). Cada tarjeta repite el
             H1 y la meta-description YA PUBLICADOS de su página: aquí no se escribe copy nuevo
             ni se añade ninguna cifra. Sin animación de entrada: es una página de paso que se
             ve a menudo. -->
        <ul class="grid gap-4 sm:gap-6 sm:grid-cols-2">
          <li v-for="h in tarjetas" :key="h.key" class="flex">
            <NuxtLink
              :to="localePath({ name: h.name })"
              class="card-base flex flex-1 flex-col gap-2 min-h-[44px]"
              style="text-decoration: none"
              :aria-labelledby="h.repite ? `herr-${h.key}-t` : `herr-${h.key}-e herr-${h.key}-t`"
              :aria-describedby="`herr-${h.key}-d`"
              @click="medir(h.key)"
            >
              <!-- La etiqueta solo si dice algo que el título no dice (diseno, 14-oct): «El caso en
                   datos» sobre «El caso en datos» se leía dos veces. -->
              <span v-if="!h.repite" :id="`herr-${h.key}-e`" class="eyebrow block">{{ h.etiqueta }}</span>
              <h2 :id="`herr-${h.key}-t`" class="font-display font-semibold text-berenjena text-xl leading-snug" style="letter-spacing: -0.01em">
                {{ h.titulo }}
              </h2>
              <p :id="`herr-${h.key}-d`" class="text-sm text-tinta leading-relaxed flex-1">
                {{ h.descripcion }}
              </p>
              <Icon name="ph:arrow-right" class="mt-2 w-5 h-5 text-miriam" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackMapa, trackLesiones, trackDatos } = useSupport()
const tituloId = useId()

const tarjetas = computed(() =>
  HERRAMIENTAS.map((h) => {
    const [titulo, descripcion] = copyHerramienta(h.key, locale.value)
    const etiqueta = t(`nav.${h.key}`)
    const repite = titulo.trim().toLowerCase().startsWith(etiqueta.trim().toLowerCase())
    return { ...h, titulo, descripcion, etiqueta, repite }
  })
)

// Mismos eventos que ya miden la entrada a cada herramienta, con este índice como origen.
function medir(key: string) {
  if (key === 'map') trackMapa('herramientas')
  else if (key === 'lesions') trackLesiones('herramientas')
  else if (key === 'data') trackDatos('herramientas')
}

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
