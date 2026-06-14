<template>
  <div>
    <section class="section-spacing" aria-label="Herramientas">
      <div class="section-wide">
        <p class="eyebrow mb-3 block">Acceso interno</p>
        <h1
          class="heading-display text-3xl sm:text-4xl text-berenjena mb-3"
          style="letter-spacing: -0.02em"
        >
          Herramientas
        </h1>
        <p class="text-tinta leading-relaxed mb-10 max-w-2xl">
          Accesos directos a las herramientas del caso. Página discreta (no indexada y fuera del
          menú) — guárdala en marcadores.
        </p>

        <div class="grid sm:grid-cols-2 gap-4">
          <a
            v-for="t in tools"
            :key="t.name"
            :href="t.href"
            class="card-base bg-cream flex items-start gap-4 hover:shadow-md transition-shadow group"
            style="text-decoration: none"
          >
            <span
              class="w-10 h-10 rounded-xl bg-berenjena flex items-center justify-center shrink-0"
            >
              <Icon :name="t.icon" class="w-5 h-5 text-cream" aria-hidden="true" />
            </span>
            <div>
              <p class="font-semibold text-berenjena group-hover:text-miriam transition-colors">
                {{ t.name }}
              </p>
              <p class="text-sm text-tinta leading-relaxed mt-0.5">{{ t.desc }}</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Hub interno de herramientas del caso. Discreto: noindex y fuera del menú
// público; se accede por marcador. Enlaza las tools que viven como páginas o
// estáticos del sitio.
const tools = [
  {
    name: 'Mapa de metástasis',
    desc: 'Visor 3D de las lesiones óseas: PET doble trazador, morfología del TC y RM.',
    href: '/mapa-metastasis',
    icon: 'ph:cube-fill',
  },
  {
    name: 'Análisis de lesiones',
    desc: 'Informe interactivo de las lesiones (PET).',
    href: '/analisis-de-lesiones/',
    icon: 'ph:crosshair-simple-fill',
  },
  {
    name: 'Informe clínico',
    desc: 'Informe completo del caso.',
    href: '/informe/',
    icon: 'ph:file-text-fill',
  },
  {
    name: 'Design system',
    desc: 'Tokens, componentes y guía de marca.',
    href: '/design-system/',
    icon: 'ph:palette-fill',
  },
]

useSeoMeta({
  title: 'Herramientas',
  robots: 'noindex, nofollow',
})
</script>
