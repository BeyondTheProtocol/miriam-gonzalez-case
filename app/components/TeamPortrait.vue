<template>
  <figure class="team-portrait">
    <div class="team-portrait__frame">
      <NuxtImg
        v-if="member.photo"
        :src="member.photo"
        :alt="member.name"
        class="team-portrait__img"
        width="400"
        height="400"
        sizes="165px md:230px lg:380px"
        format="webp"
        loading="lazy"
        decoding="async"
      />
      <span v-else class="team-portrait__placeholder" aria-hidden="true">{{
        initial
      }}</span>
    </div>
    <figcaption class="team-portrait__caption">
      <p class="team-portrait__role" :class="roleColor">{{ member.role }}</p>
      <h3 class="team-portrait__name">{{ member.name }}</h3>
      <p v-if="member.description" class="team-portrait__desc">
        {{ member.description }}
      </p>
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
const props = defineProps<{
  member: {
    name?: string
    role: string
    description?: string
    photo?: string
    color?: 'gold' | 'ocean' | 'ink'
  }
}>()

const roleColor = computed(() =>
  props.member.color === 'ink' ? 'text-tinta' : 'text-miriam'
)

const initial = computed(
  () => props.member.name?.trim().charAt(0).toUpperCase() ?? ''
)
</script>

<style scoped>
.team-portrait {
  display: flex;
  flex-direction: column;
}

.team-portrait__frame {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 16px;
  background: var(--color-bg-card); /* cream-card: el papel del retrato se funde con este tono */
  border: 1px solid rgb(var(--color-text-rgb) / 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.team-portrait:hover .team-portrait__frame {
  transform: translateY(-4px);
  box-shadow: 0 16px 30px -18px rgb(var(--color-text-rgb) / 0.45);
}

.team-portrait__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Los retratos van sobre papel crema; multiply funde el papel con el marco
     y deja respirar la tinta sin recortes duros. */
  mix-blend-mode: multiply;
}

.team-portrait__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, 'Fraunces', serif);
  font-style: italic;
  font-weight: 500;
  font-size: 3.5rem;
  letter-spacing: -0.04em;
  color: var(--color-miriam); /* miriam */
  background: linear-gradient(
    180deg,
    rgb(var(--color-miriam-rgb) / 0.08),
    rgb(var(--color-miriam-rgb) / 0.02)
  );
}

.team-portrait__caption {
  margin-top: 14px;
}

.team-portrait__role {
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  line-height: 1.3;
  /* Los roles ocupan 1 o 2 líneas. Reservamos siempre el alto de 2 para que
     el nombre y la descripción arranquen a la misma altura entre columnas:
     sin esto, en tablet/desktop (grid de 2–3 columnas) un rol de 1 línea
     junto a otro de 2 descuadra la fila. En móvil ya respiraba; esto no le
     resta nada. */
  min-height: 2.6em; /* 2 × line-height a 11px */
}

.team-portrait__name {
  font-family: var(--font-display, 'Fraunces', serif);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: var(--color-text); /* berenjena */
  margin-top: 4px;
}

.team-portrait__desc {
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-soft); /* tinta */
  margin-top: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .team-portrait__frame {
    transition: none;
  }
  .team-portrait:hover .team-portrait__frame {
    transform: none;
  }
}
</style>
