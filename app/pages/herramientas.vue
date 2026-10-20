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
              <span class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center" aria-hidden="true">
                <Icon :name="h.icono" class="herr-icono w-5 h-5 text-berenjena" />
              </span>
              <!-- La etiqueta solo si dice algo que el título no dice (diseno, 14-oct): «El caso en
                   datos» sobre «El caso en datos» se leía dos veces. -->
              <span v-if="!h.repite" :id="`herr-${h.key}-e`" class="eyebrow block">{{ h.etiqueta }}</span>
              <!-- sin etiqueta, su línea se reserva: así los títulos de una misma fila quedan alineados (diseno, 19-oct) -->
              <span v-else class="eyebrow block" aria-hidden="true">&nbsp;</span>
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
const { trackMapa, trackLesiones, trackDatos, trackCelula, trackExplorador, trackLaminillas } = useSupport()
const { herramientas } = useHerramientas()
const tituloId = useId()

const tarjetas = computed(() =>
  herramientas.value.map((h) => {
    const [titulo, descripcion] = copyHerramienta(h.key, locale.value)
    // El explorador lleva por etiqueta su público, «Para profesionales» (ya publicada en /ciencia y en su tarjeta;
    // diseno, 19-oct): avisa al público general de que esa tarjeta es la técnica.
    const etiqueta = h.key === 'cell_explorer' || h.key === 'slides' ? t('ciencia.level_pro') : t(`nav.${h.key}`)
    const repite = titulo.trim().toLowerCase().startsWith(etiqueta.trim().toLowerCase())
    return { ...h, titulo, descripcion, etiqueta, repite, icono: ICONO_HERRAMIENTA[h.key] }
  })
)

// Mismos eventos que ya miden la entrada a cada herramienta, con este índice como origen.
function medir(key: string) {
  if (key === 'map') trackMapa('herramientas')
  else if (key === 'lesions') trackLesiones('herramientas')
  else if (key === 'data') trackDatos('herramientas')
  else if (key === 'cell_by_cell') trackCelula('herramientas')
  else if (key === 'cell_explorer') trackExplorador('herramientas')
  else if (key === 'slides') trackLaminillas('herramientas')
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
