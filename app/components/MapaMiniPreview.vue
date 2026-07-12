<template>
  <!-- Miniatura del mapa de metástasis para el teaser de la home. NO carga el
       visor 3D: es un dibujo a mano (mismo lenguaje que TwoFaces — cuadrícula de
       cuaderno, trazo que se dibuja solo). El esqueleto queda TENUE de fondo (el
       cuerpo = el cielo) y las metástasis se dibujan como una CONSTELACIÓN:
       estrellas teal (⁶⁸Ga) / ámbar (FDG) unidas por una línea fina. Es
       decorativa (aria-hidden); el significado vive en la leyenda de texto del
       teaser. Revelado narrativo una sola vez al entrar en viewport; en SSR / sin
       JS / con reduce-motion todo se ve estático (nada se esconde). -->
  <figure ref="figEl" class="mmp">
    <svg
      class="mmp__svg"
      viewBox="0 0 130 250"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="mmp-grid" width="15" height="15" patternUnits="userSpaceOnUse">
          <path d="M15 0 H0 V15" fill="none" stroke="rgba(45,27,61,0.06)" stroke-width="1" />
        </pattern>
      </defs>

      <rect x="1" y="1" width="128" height="248" rx="12" fill="#faf6f0" stroke="rgba(45,27,61,0.14)" />
      <rect x="1" y="1" width="128" height="248" rx="12" fill="url(#mmp-grid)" />

      <!-- Esqueleto tenue (se dibuja solo). Trazo variable, opacidades bajas para
           que quede de fondo y la constelación pese por encima. -->
      <g fill="none" stroke="#2d1b3d" stroke-linecap="round" stroke-linejoin="round">
        <path class="mmp-dw" style="--d: 0" pathLength="1" opacity="0.5" stroke-width="1.6" d="M65 20 C74 20 79 27 79 35 C79 43 74 49 65 49 C56 49 51 43 51 35 C51 27 56 20 65 20 Z" />
        <path class="mmp-dw" style="--d: 0.4" pathLength="1" opacity="0.4" stroke-width="1.0" d="M60 50 L60 57 M70 50 L70 57" />
        <path class="mmp-dw" style="--d: 0.55" pathLength="1" opacity="0.48" stroke-width="1.6" d="M65 57 C64 76 66 98 65 122" />
        <g class="mmp-dw" style="--d: 0.8" opacity="0.4" stroke-width="1.0">
          <path pathLength="1" d="M52 64 C40 66 33 70 28 75 M78 64 C90 66 97 70 102 75" />
          <path pathLength="1" d="M56 70 C46 72 40 76 37 80 M74 70 C84 72 90 76 93 80" />
          <path pathLength="1" d="M55 82 C46 84 41 88 39 92 M75 82 C84 84 89 88 91 92" />
          <path pathLength="1" d="M56 94 C48 96 44 99 42 103 M74 94 C82 96 86 99 88 103" />
          <path pathLength="1" d="M58 106 C51 108 47 111 46 114 M72 106 C79 108 83 111 84 114" />
        </g>
        <path class="mmp-dw" style="--d: 1.1" pathLength="1" opacity="0.44" stroke-width="1.6" d="M55 124 C50 134 50 142 54 152 L76 152 C80 142 80 134 75 124 Z" />
        <path class="mmp-dw" style="--d: 1.35" pathLength="1" opacity="0.36" stroke-width="1.5" d="M56 152 C48 174 44 202 42 238 M74 152 C82 174 86 202 88 238" />
        <path class="mmp-dw" style="--d: 0.95" pathLength="1" opacity="0.34" stroke-width="1.3" d="M30 76 C22 98 20 122 22 144 M100 76 C108 98 110 122 108 144" />
      </g>

      <!-- Constelación: línea fina que une las lesiones (se traza), luego las
           estrellas encienden. -->
      <path class="mmp-conline" d="M52 84 L65 78 L78 96 L64 104 L61 136 L55 182" fill="none" stroke="rgba(45,27,61,0.32)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1.6 4" />

      <g class="mmp-stars">
        <path class="mmp-st" style="--s: 0" d="M65 71 Q66.75 76.25 72 78 Q66.75 79.75 65 85 Q63.25 79.75 58 78 Q63.25 76.25 65 71 Z" fill="#1c969e" />
        <path class="mmp-st" style="--s: 1" d="M52 78 Q53.5 82.5 58 84 Q53.5 85.5 52 90 Q50.5 85.5 46 84 Q50.5 82.5 52 78 Z" fill="#d66e1c" />
        <path class="mmp-st" style="--s: 2" d="M55 176 Q56.5 180.5 61 182 Q56.5 183.5 55 188 Q53.5 183.5 49 182 Q53.5 180.5 55 176 Z" fill="#d66e1c" />
        <circle class="mmp-st" style="--s: 3" cx="64" cy="104" r="4.6" fill="#1c969e" />
        <circle class="mmp-st" style="--s: 4" cx="61" cy="136" r="4.8" fill="#1c969e" />
        <circle class="mmp-st" style="--s: 5" cx="78" cy="96" r="3.8" fill="#d66e1c" />
      </g>
    </svg>
  </figure>
</template>

<script setup lang="ts">
/**
 * Revelado una sola vez al entrar en viewport (mismo patrón que TwoFaces):
 * onMounted marca «ready» SOLO si se permite movimiento; el IntersectionObserver
 * añade «is-in» para disparar la animación. Sin JS / SSR / reduce-motion → el
 * estado base es visible y nada se anima.
 */
const figEl = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = figEl.value
  if (!el) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  el.classList.add('mmp--ready')
  if (!('IntersectionObserver' in window)) {
    el.classList.add('is-in')
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
          break
        }
      }
    },
    { threshold: 0.3 }
  )
  io.observe(el)
  onBeforeUnmount(() => io.disconnect())
})
</script>

<style scoped>
.mmp {
  margin: 0;
}
.mmp__svg {
  display: block;
  width: 100%;
  height: auto;
}

/* Revelado narrativo. Estado base (SSR / sin JS / reduce-motion): TODO visible.
   El ocultado inicial solo se aplica cuando el JS añade .mmp--ready Y se permite
   movimiento — así nadie se queda sin ver la miniatura. */
@media (prefers-reduced-motion: no-preference) {
  .mmp--ready .mmp-dw {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
  }
  .mmp--ready .mmp-conline {
    opacity: 0;
  }
  .mmp--ready .mmp-st {
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
  }

  .mmp--ready.is-in .mmp-dw {
    animation: mmp-draw 0.65s ease forwards;
    animation-delay: calc(var(--d, 0) * 0.24s);
  }
  .mmp--ready.is-in .mmp-conline {
    animation: mmp-fade 0.8s ease forwards;
    animation-delay: 1.7s;
  }
  .mmp--ready.is-in .mmp-st {
    animation: mmp-pop 0.42s cubic-bezier(0.34, 1.7, 0.64, 1) forwards;
    animation-delay: calc(2.5s + var(--s, 0) * 0.18s);
  }
}

@keyframes mmp-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes mmp-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes mmp-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
