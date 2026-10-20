<template>
  <!-- Herramientas en la home (Miriam, 17-oct-2026): sustituye al teaser de /lesiones, que ya
       está entre las herramientas. Arriba, en grande, la MÁS NUEVA (primera de HERRAMIENTAS);
       debajo, el resto en el mismo orden (de la más nueva a la más antigua) y el índice.
       Título y texto de cada una: los ya publicados de su página (COPY_HERRAMIENTAS); el único
       copy nuevo es la etiqueta «Lo último» (no «Nueva»: la primera de la lista
       siempre es la última en llegar, pero no siempre es nueva; diseno, 17-oct). Sin animación de entrada propia más allá de v-reveal. -->
  <!-- Segunda mitad de «El objetivo» (mismo crema, diseno 17-oct): sin padding superior ni filete. -->
  <section
    v-reveal
    class="bg-cream pt-0 pb-14 sm:pb-16"
    :aria-labelledby="titleId"
  >
    <div class="section-wide">
      <!-- h2 con aspecto de eyebrow (diseno, 17-oct): la banda necesita su sitio en el esquema de encabezados. -->
      <h2 :id="titleId" class="eyebrow mb-2 block">{{ $t('herramientas.title') }}</h2>
      <p class="text-base text-tinta leading-relaxed max-w-2xl mb-6">{{ $t('herramientas.intro') }}</p>

      <NuxtLink
        :to="localePath({ name: destacada.name })"
        class="card-base flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        style="text-decoration: none"
        @click="medir(destacada.key)"
      >
        <span class="shrink-0 w-12 h-12 rounded-2xl bg-miriam-soft flex items-center justify-center" aria-hidden="true">
          <Icon :name="destacada.icono" class="w-6 h-6 text-berenjena" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="status-badge status-badge--firma mb-2">{{ $t('home.tools_new') }}</span>
          <span class="block heading-display text-2xl sm:text-3xl text-berenjena mt-2" style="letter-spacing: -0.02em">
            {{ destacada.titulo }}
          </span>
          <span class="block mt-2 text-base text-tinta leading-relaxed max-w-2xl">{{ destacada.descripcion }}</span>
        </span>
        <Icon name="ph:arrow-right" class="shrink-0 w-6 h-6 text-miriam" aria-hidden="true" />
      </NuxtLink>

      <ul class="mt-4 grid gap-3 sm:grid-cols-2">
        <li v-for="h in resto" :key="h.key" class="flex">
          <NuxtLink
            :to="localePath({ name: h.name })"
            class="card-base flex flex-1 items-center gap-3.5 min-h-[44px] py-3"
            style="text-decoration: none"
            @click="medir(h.key)"
          >
            <span class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center" aria-hidden="true">
              <Icon :name="h.icono" class="w-5 h-5 text-berenjena" />
            </span>
            <span class="min-w-0 flex-1">
              <!-- el explorador dice para quién es (diseno, 19-oct): la etiqueta ya publicada de /ciencia -->
              <span v-if="h.key === 'cell_explorer' || h.key === 'slides'" class="eyebrow--sm block leading-none mb-0.5">{{ $t('ciencia.level_pro') }}</span>
              <span class="block font-display font-semibold text-berenjena text-base leading-snug">{{ h.titulo }}</span>
            </span>
            <Icon name="ph:arrow-right" class="shrink-0 w-5 h-5 text-miriam" aria-hidden="true" />
          </NuxtLink>
        </li>
      </ul>

      <NuxtLink
        :to="localePath({ name: 'herramientas' })"
        class="mt-4 inline-flex items-center min-h-[44px] font-semibold text-berenjena underline underline-offset-4"
      >
        {{ $t('nav.all_tools') }} →
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const { trackMapa, trackLesiones, trackDatos, trackCelula, trackExplorador, trackLaminillas } = useSupport()
const { herramientas } = useHerramientas()
const titleId = useId()

const tarjetas = computed(() =>
  herramientas.value.map((h) => {
    const [titulo, descripcion] = copyHerramienta(h.key, locale.value)
    return { ...h, titulo, descripcion, icono: ICONO_HERRAMIENTA[h.key] ?? 'ph:wrench-fill' }
  })
)
const destacada = computed(() => tarjetas.value[0]!)
const resto = computed(() => tarjetas.value.slice(1))

// Los mismos eventos que medía el teaser anterior, con el mismo origen (home_teaser).
function medir(key: string) {
  if (key === 'map') trackMapa('home_teaser')
  else if (key === 'lesions') trackLesiones('home_teaser')
  else if (key === 'data') trackDatos('home_teaser')
  else if (key === 'cell_by_cell') trackCelula('home_teaser')
  else if (key === 'cell_explorer') trackExplorador('home_teaser')
  else if (key === 'slides') trackLaminillas('home_teaser')
}
</script>
