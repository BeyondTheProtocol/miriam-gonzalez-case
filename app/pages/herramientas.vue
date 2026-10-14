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
              :aria-labelledby="`herr-${h.key}-t`"
              :aria-describedby="`herr-${h.key}-d`"
              @click="medir(h.key)"
            >
              <span class="eyebrow block">{{ $t(`nav.${h.key}`) }}</span>
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

// Copia LITERAL del H1 y de la meta-description de cada página (el fichero va al lado).
// Si una de esas páginas cambia su título o su descripción, se cambia también aquí.
const COPY: Record<string, { es: [string, string]; en: [string, string] }> = {
  // app/pages/datos.vue
  data: {
    es: ['El caso en datos', 'El caso de Miriam para quien pueda moverlo: su evolución clínica de un vistazo, las analíticas desde 2021 y qué tejido existe y dónde. Cada cifra con su fuente.'],
    en: ['The case in data', 'Miriam’s case for whoever can move it forward: her clinical course at a glance, labs since 2021 and what tissue exists and where. Every number with its source.'],
  },
  // app/pages/lesiones.vue
  lesions: {
    es: ['Mama, hígado y hueso, de un vistazo', 'Una herramienta de apoyo, no un diagnóstico. La mama, el hígado y las lesiones óseas de Miriam, en una sola página.'],
    en: ['Breast, liver and bone, at a glance', 'A support tool, not a diagnosis. Miriam’s breast, liver and bone lesions, on a single page.'],
  },
  // app/pages/mapa-metastasis.vue
  map: {
    es: ['Mapa de metástasis', 'Una herramienta de apoyo, no un diagnóstico. Las lesiones óseas de Miriam vistas con PET doble trazador (Galio-68 DOTATOC y FDG) sobre sus propios informes, para ayudarle a decidir con su equipo médico.'],
    en: ['Metastasis map', 'A support tool, not a diagnosis. Miriam’s bone lesions seen with dual-tracer PET (Gallium-68 DOTATOC and FDG) over her own reports, to help her decide the next steps with her medical team.'],
  },
  // app/pages/reservorio.vue
  port: {
    es: ['El catéter no se ha movido.', 'Su reservorio dejó de dar retorno. Antes de dar por hecho que el catéter se había movido, se reconstruyó su trayecto en tres TC separados por meses: la punta sale en el mismo sitio las tres veces.'],
    en: ['The catheter has not moved.', 'Her reservoir stopped giving blood return. Before assuming the catheter had moved, its path was rebuilt on three CT scans, months apart: the tip lands in the same place every time.'],
  },
  // app/pages/biopsia-osea.vue
  bone_biopsy: {
    es: ['Lo que se puede medir en mi biopsia ósea', 'Lo que un corte de histología puede decir y lo que no. La biopsia ósea de Miriam, calibrada con su propia barra de 100 µm, con los límites de la imagen dichos tan claro como las medidas.'],
    en: ['What can be measured in my bone biopsy', 'What a histology slide can and cannot tell you. Miriam’s own bone biopsy, calibrated against its 100 µm scale bar, with the limits of the image stated as plainly as the measurements.'],
  },
}

const tarjetas = computed(() =>
  HERRAMIENTAS.map((h) => {
    const [titulo, descripcion] = COPY[h.key]![locale.value === 'en' ? 'en' : 'es']
    return { ...h, titulo, descripcion }
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
