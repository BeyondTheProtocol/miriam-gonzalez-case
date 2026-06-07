<template>
  <figure class="team-portrait">
    <div class="team-portrait__frame">
      <img
        v-if="member.photo"
        :src="member.photo"
        :alt="member.name"
        class="team-portrait__img"
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
      <!-- Divulgación progresiva (móvil): la descripción se revela al tocar;
           en sm+ se ve siempre. CSS para el breakpoint (sin mismatch de hidratación). -->
      <p
        v-if="member.description"
        :id="descId"
        class="team-portrait__desc"
        :class="expanded ? 'block' : 'hidden sm:block'"
      >
        {{ member.description }}
      </p>
      <button
        v-if="member.description"
        type="button"
        class="sm:hidden mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] font-medium text-miriam py-1.5"
        :aria-expanded="expanded"
        :aria-controls="descId"
        @click="expanded = !expanded"
      >
        {{ expanded ? $t('team.less') : $t('team.more') }}
        <Icon
          name="ph:caret-down-bold"
          class="w-3 h-3 transition-transform"
          :class="{ 'rotate-180': expanded }"
          aria-hidden="true"
        />
      </button>
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

// Acordeón móvil (revelar descripción al tocar). id estable para aria-controls.
const expanded = ref(false)
const descId = useId()
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
  color: #9d44ab; /* miriam */
  background: linear-gradient(
    180deg,
    rgba(157, 68, 171, 0.08),
    rgba(157, 68, 171, 0.02)
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
