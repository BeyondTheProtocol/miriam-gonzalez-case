<template>
  <!-- Un vídeo público de la web (el ADC del hito del 7-oct de la Cronología, el promo de /prensa). Viene de la antigua /videos (fusionada en F4,
       23-oct-2026): sin autoplay y sin descargar nada antes de pulsar play (preload="none": solo carga el póster). Los
       subtítulos van grabados en la imagen; la transcripción da el mismo texto a quien usa lector de pantalla. Tarjeta del
       sistema (card-base) y plegable de notas (notes-disclosure); sin animación de entrada. El nivel del título lo pone la
       página (`nivel`), para no saltarse un escalón de encabezados. -->
  <article class="card-base flex flex-col gap-4 p-4 sm:p-6" :aria-labelledby="idTitulo">
    <video
      class="video-web w-full rounded-xl bg-berenjena"
      controls
      preload="none"
      playsinline
      :poster="video.poster"
      :aria-labelledby="idTitulo"
      :aria-describedby="idDescripcion"
      @play.once="trackVideo(video.id)"
    >
      <source :src="video.src" type="video/mp4" />
      {{ $t('videos.fallback') }}
    </video>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span class="eyebrow block">
        <span class="sr-only">{{ $t('videos.duration') }}: </span>
        <time :datetime="duracionIso(video.segundos)">{{ duracionVideo(video.segundos) }}</time>
      </span>
      <span v-if="video.voz !== idioma" class="eyebrow block">{{ $t('videos.voice_other') }}</span>
    </div>

    <component :is="nivel" :id="idTitulo" class="font-display font-semibold text-berenjena text-xl leading-snug" style="letter-spacing: -0.01em" :lang="video.voz">
      {{ video.titulo }}
    </component>
    <p :id="idDescripcion" class="text-sm text-tinta leading-relaxed" :lang="video.voz">
      {{ video.descripcion }}
    </p>
    <p v-if="video.voz !== idioma && video.resumenEn" class="text-sm text-tinta leading-relaxed" lang="en">
      {{ video.resumenEn }}
    </p>

    <details class="notes-disclosure video-transcripcion">
      <summary>{{ $t('videos.transcript') }}</summary>
      <div class="mt-3 space-y-3 text-sm text-tinta leading-relaxed max-w-prose" :lang="video.voz">
        <p v-for="(parrafo, i) in video.transcripcion" :key="i">{{ parrafo }}</p>
      </div>
    </details>
  </article>
</template>

<script setup lang="ts">
import type { VideoWeb } from '~/utils/videos'

withDefaults(defineProps<{ video: VideoWeb; nivel?: 'h2' | 'h3' | 'h4' }>(), { nivel: 'h2' })

const { locale } = useI18n()
const { trackVideo } = useSupport()
const idTitulo = useId()
const idDescripcion = useId()
const idioma = computed(() => (locale.value === 'en' ? 'en' : 'es'))
</script>

<style scoped>
/* 16:9 reservado antes de cargar el póster: la página no salta. */
.video-web {
  aspect-ratio: 16 / 9;
  /* El texto alternativo del <video> (navegador sin soporte) iba berenjena sobre berenjena (1:1): ahora, crema sobre berenjena. */
  color: var(--color-bg);
}
/* Objetivo táctil de 44 px en el resumen del plegable (la vara de la casa). */
.video-transcripcion > summary {
  min-height: 44px;
  padding-top: 0;
}
/* El patrón notes-disclosure quita el contorno del foco y deja solo un cambio de color
   (≈2,2:1 entre estados, por debajo de 3:1). Aquí se devuelve el anillo. */
.video-transcripcion > summary:focus-visible {
  outline: 2px solid var(--color-miriam);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
