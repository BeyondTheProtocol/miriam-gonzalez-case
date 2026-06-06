<template>
  <figure class="team-portrait">
    <div class="team-portrait__frame">
      <img
        :src="member.photo"
        :alt="member.name"
        class="team-portrait__img"
        loading="lazy"
        decoding="async"
      />
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
  background: #f5efe6; /* cream-card: el papel del retrato se funde con este tono */
  border: 1px solid rgba(45, 27, 61, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.team-portrait:hover .team-portrait__frame {
  transform: translateY(-4px);
  box-shadow: 0 16px 30px -18px rgba(45, 27, 61, 0.45);
}

.team-portrait__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Los retratos van sobre papel crema; multiply funde el papel con el marco
     y deja respirar la tinta sin recortes duros. */
  mix-blend-mode: multiply;
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
}

.team-portrait__name {
  font-family: var(--font-display, 'Fraunces', serif);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.02em;
  color: #2d1b3d; /* berenjena */
  margin-top: 4px;
}

.team-portrait__desc {
  font-size: 13px;
  line-height: 1.55;
  color: #3a3340; /* tinta */
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
