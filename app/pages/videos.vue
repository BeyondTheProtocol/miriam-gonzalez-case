<template>
  <div>
    <section class="section-spacing" :aria-labelledby="tituloId">
      <div class="section-wide">
        <PageHeader :subtitle="$t('videos.intro')">
          <template #title><span :id="tituloId">{{ $t('videos.title') }}</span></template>
        </PageHeader>

        <!-- Vídeos públicos. Sin autoplay y sin descargar nada antes de pulsar play
             (preload="none": solo carga el póster). Los subtítulos van grabados en la imagen;
             la transcripción da el mismo texto a quien usa lector de pantalla. Tarjetas del
             sistema (card-base) y el plegable de notas (notes-disclosure); sin animación de
             entrada. -->
        <ul class="grid gap-6 lg:grid-cols-2 lg:gap-8" :aria-label="$t('videos.list_label')">
          <li v-for="v in videos" :key="v.id" class="flex">
            <article class="card-base flex flex-1 flex-col gap-4 p-4 sm:p-6" :aria-labelledby="`vid-${v.id}-t`">
              <video
                class="video-web w-full rounded-xl bg-berenjena"
                controls
                preload="none"
                playsinline
                :poster="v.poster"
                :aria-labelledby="`vid-${v.id}-t`"
                :aria-describedby="`vid-${v.id}-d`"
                @play.once="trackVideo(v.id)"
              >
                <source :src="v.src" type="video/mp4" />
                {{ $t('videos.fallback') }}
              </video>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="eyebrow block">
                  <span class="sr-only">{{ $t('videos.duration') }}: </span>
                  <time :datetime="duracionIso(v.segundos)">{{ duracionVideo(v.segundos) }}</time>
                </span>
                <span v-if="v.voz !== idioma" class="eyebrow block">{{ $t('videos.voice_other') }}</span>
              </div>

              <h2 :id="`vid-${v.id}-t`" class="font-display font-semibold text-berenjena text-xl leading-snug" style="letter-spacing: -0.01em" :lang="v.voz">
                {{ v.titulo }}
              </h2>
              <p :id="`vid-${v.id}-d`" class="text-sm text-tinta leading-relaxed" :lang="v.voz">
                {{ v.descripcion }}
              </p>

              <details class="notes-disclosure video-transcripcion">
                <summary>{{ $t('videos.transcript') }}</summary>
                <div class="mt-3 space-y-3 text-sm text-tinta leading-relaxed max-w-prose" :lang="v.voz">
                  <p v-for="(parrafo, i) in v.transcripcion" :key="i">{{ parrafo }}</p>
                </div>
              </details>
            </article>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const { trackVideo } = useSupport()
const tituloId = useId()

const idioma = computed(() => (locale.value === 'en' ? 'en' : 'es'))
const videos = computed(() => VIDEOS[idioma.value])

useSeoMeta({
  title: () => t('videos.title'),
  description: () => t('videos.intro'),
  ogTitle: () => t('videos.title'),
  ogDescription: () => t('videos.intro'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('videos.title'),
  twitterDescription: () => t('videos.intro'),
})

defineOgImage('Default.takumi', {
  title: () => t('videos.title'),
  description: () => t('videos.intro'),
})
</script>

<style scoped>
/* 16:9 reservado antes de cargar el póster: la página no salta. */
.video-web {
  aspect-ratio: 16 / 9;
}
/* Objetivo táctil de 44 px en el resumen del plegable (la vara de la casa). */
.video-transcripcion > summary {
  min-height: 44px;
  padding-top: 0;
}
</style>
