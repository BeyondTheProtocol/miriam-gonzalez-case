<template>
  <section :aria-label="$t('twofaces.title')">
    <p class="eyebrow mb-2 block">{{ $t('twofaces.eyebrow') }}</p>
    <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
      {{ $t('twofaces.title') }}
    </h2>
    <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">{{ $t('twofaces.intro') }}</p>

    <!-- Una sola célula (un tumor), dividida en dos caras. Mobile: apiladas con
         una costura horizontal; ≥md: lado a lado con costura vertical. -->
    <div ref="root" class="tf" :class="{ 'tf-in': inView }">
      <!-- Cara luminal / mama: la conocemos, está iluminada al completo -->
      <div class="tf__face">
        <div class="tf__head">
          <span class="tf__dot tf__dot--lum" aria-hidden="true" />
          <div>
            <p class="tf__label" style="color: #9d44ab">{{ $t('twofaces.lum_label') }}</p>
            <p class="tf__status">{{ $t('twofaces.lum_status') }}</p>
          </div>
        </div>
        <ul class="tf__chips">
          <li
            v-for="(m, i) in arr('twofaces.lum_markers')"
            :key="i"
            class="tf-chip tf-chip--lum"
            :style="{ '--d': 0.06 * i + 's' }"
            translate="no"
          >
            {{ m }}
          </li>
        </ul>
      </div>

      <!-- Costura: la misma célula. Aquí se lee «se tratan juntas». -->
      <div class="tf__seam" aria-hidden="true">
        <span class="tf__seam-badge">{{ $t('twofaces.join') }}</span>
      </div>

      <!-- Cara neuroendocrina: apenas conocida. Dos certezas + lo desconocido. -->
      <div class="tf__face">
        <div class="tf__head">
          <span class="tf__dot tf__dot--ne" aria-hidden="true" />
          <div>
            <p class="tf__label" style="color: #bb4128">{{ $t('twofaces.ne_label') }}</p>
            <p class="tf__status">{{ $t('twofaces.ne_status') }}</p>
          </div>
        </div>
        <ul class="tf__known">
          <li
            v-for="(k, i) in known"
            :key="i"
            class="tf-known"
            :style="{ '--d': 0.5 + 0.25 * i + 's' }"
          >
            <span class="tf-chip tf-chip--ne" translate="no">{{ k.m }}</span>
            <span class="tf-known__desc">{{ k.d }}</span>
          </li>
        </ul>
        <div class="tf__unknown">
          <p class="tf__unknown-label">{{ $t('twofaces.ne_unknown') }}</p>
          <ul class="tf__chips" aria-hidden="true">
            <li v-for="i in 4" :key="i" class="tf-chip tf-chip--q">?</li>
          </ul>
        </div>
      </div>
    </div>

    <p class="tf__together">
      <svg class="tf__together-mark" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 0 L13.4 6.6 L20 10 L13.4 13.4 L10 20 L6.6 13.4 L0 10 L6.6 6.6 Z"
        />
      </svg>
      {{ $t('twofaces.together') }}
    </p>
  </section>
</template>

<script setup lang="ts">
/**
 * «Las dos caras» — explicador conceptual del tumor: una misma célula con dos
 * biologías que hay que tratar a la vez. Cara luminal (magenta): conocida y
 * tratable, muchos marcadores. Cara neuroendocrina (coral): apenas conocida —
 * dos certezas reales (RB1, SSTR2, ambas documentadas en /ciencia y ganadas a
 * pulso vía biopsia líquida + PET-Galio) y mucho por descubrir.
 * Contenido vía i18n (editable/traducible). Las animaciones respetan
 * prefers-reduced-motion; el texto es legible siempre (no aria-hidden).
 */
const { tm, rt } = useI18n()

function arr(key: string): string[] {
  const raw = tm(key) as unknown
  const list = Array.isArray(raw) ? raw : Object.values((raw ?? {}) as Record<string, unknown>)
  return list.map((item) => rt(item as never))
}

interface Known {
  m: string
  d: string
}
const known = computed<Known[]>(() => {
  const raw = tm('twofaces.ne_known') as unknown
  if (!Array.isArray(raw)) return []
  return raw.map((e) => ({
    m: rt((e as Record<string, unknown>).m as never),
    d: rt((e as Record<string, unknown>).d as never),
  }))
})

const root = ref<HTMLElement | null>(null)
const inView = ref(false)
let io: IntersectionObserver | null = null
onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    inView.value = true
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          inView.value = true
          io?.disconnect()
          break
        }
      }
    },
    { threshold: 0.3 }
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style scoped>
.tf {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(45, 27, 61, 0.12);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(157, 68, 171, 0.05) 0%, rgba(255, 107, 71, 0.06) 100%);
}
@media (min-width: 768px) {
  .tf {
    flex-direction: row;
    align-items: stretch;
    background:
      linear-gradient(100deg, rgba(157, 68, 171, 0.05) 0%, rgba(255, 107, 71, 0.06) 100%);
  }
}
.tf__face {
  flex: 1;
  padding: 1.25rem;
  min-width: 0;
}
@media (min-width: 768px) {
  .tf__face {
    padding: 1.5rem;
  }
}
.tf__head {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1rem;
}
.tf__dot {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  margin-top: 3px;
  flex-shrink: 0;
}
.tf__dot--lum {
  background: #9d44ab;
  box-shadow: 0 0 0 4px rgba(157, 68, 171, 0.16);
}
.tf__dot--ne {
  background: #ff6b47;
  box-shadow: 0 0 0 4px rgba(255, 107, 71, 0.16);
}
.tf__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.tf__status {
  font-size: 13px;
  line-height: 1.45;
  color: #3a3340;
  margin-top: 2px;
}
.tf__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.tf-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}
.tf-chip--lum {
  background: #e8d4ed;
  color: #6a2475;
}
.tf-chip--ne {
  background: #ffd9cd;
  color: #bb4128;
}
.tf-chip--q {
  background: transparent;
  border: 1px dashed rgba(58, 51, 64, 0.3);
  color: rgba(58, 51, 64, 0.45);
}
.tf__known {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.tf-known {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}
.tf-known__desc {
  font-size: 13px;
  line-height: 1.4;
  color: #3a3340;
}
.tf__unknown-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(58, 51, 64, 0.5);
  margin-bottom: 0.5rem;
}
/* La costura: borde entre las dos caras (horizontal en móvil, vertical ≥md). */
.tf__seam {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #9d44ab, #ff6b47);
}
.tf__seam {
  min-height: 1px;
  height: 1px;
}
@media (min-width: 768px) {
  .tf__seam {
    width: 1px;
    height: auto;
    min-height: 0;
    background: linear-gradient(180deg, #9d44ab, #ff6b47);
  }
}
.tf__seam-badge {
  position: absolute;
  white-space: nowrap;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #2d1b3d;
  color: #faf6f0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.tf__together {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 600;
  font-size: 1.05rem;
  color: #2d1b3d;
}
.tf__together-mark {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #ff6b47;
}

/* ── Animación: las caras se llenan al entrar en viewport ───────────── */
@media (prefers-reduced-motion: no-preference) {
  .tf .tf-chip--lum,
  .tf .tf-known,
  .tf .tf-chip--q {
    opacity: 0;
    transform: translateY(4px);
  }
  .tf-in .tf-chip--lum {
    animation: tf-pop 0.4s ease-out var(--d, 0s) forwards;
  }
  .tf-in .tf-known {
    animation: tf-pop 0.5s ease-out var(--d, 0s) forwards;
  }
  /* Las certezas NE, además, encienden un halo al aparecer. */
  .tf-in .tf-known .tf-chip--ne {
    animation: tf-ignite 0.9s ease-out var(--d, 0s) backwards;
  }
  .tf-in .tf-chip--q {
    animation: tf-fade-q 0.5s ease-out 1.1s forwards;
  }
  @keyframes tf-pop {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes tf-fade-q {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes tf-ignite {
    0% {
      box-shadow: 0 0 0 0 rgba(255, 107, 71, 0);
    }
    55% {
      box-shadow: 0 0 0 6px rgba(255, 107, 71, 0.35);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(255, 107, 71, 0);
    }
  }
}
</style>
