<template>
  <!-- Miniatura estática del mapa de metástasis para el teaser de la home.
       NO carga el visor 3D: es un SVG dibujado a mano (trazo a lápiz, como el
       subrayado «dos caras» del hero), no un icono de stock. Los puntos usan los
       colores canónicos de los dos trazadores del mapa real (teal ⁶⁸Ga, ámbar
       FDG). Es decorativo → aria-hidden; el significado vive en el texto y la
       leyenda del componente que lo envuelve. Cero JS de cliente. -->
  <svg
    class="mapa-mini"
    viewBox="0 0 130 250"
    aria-hidden="true"
    focusable="false"
  >
    <g
      class="mapa-mini__bones"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- cráneo + mandíbula -->
      <path d="M65 14 C74 14 79 21 79 29 C79 37 74 43 65 43 C56 43 51 37 51 29 C51 21 56 14 65 14 Z" />
      <path d="M60 44 L60 51 M70 44 L70 51" />
      <!-- columna -->
      <path d="M65 51 C64 70 66 92 65 116" />
      <!-- costillas (pares, trazo suelto) -->
      <path d="M52 58 C40 60 33 64 28 69 M78 58 C90 60 97 64 102 69" />
      <path d="M56 64 C46 66 40 70 37 74 M74 64 C84 66 90 70 93 74" />
      <path d="M55 76 C46 78 41 82 39 86 M75 76 C84 78 89 82 91 86" />
      <path d="M56 88 C48 90 44 93 42 97 M74 88 C82 90 86 93 88 97" />
      <path d="M58 100 C51 102 47 105 46 108 M72 100 C79 102 83 105 84 108" />
      <!-- pelvis -->
      <path d="M55 118 C50 128 50 136 54 146 L76 146 C80 136 80 128 75 118 Z" />
      <!-- piernas + pies -->
      <path d="M56 146 C48 168 44 196 42 232 M74 146 C82 168 86 196 88 232" />
      <path d="M40 232 L46 234 M88 232 L82 234" />
      <!-- brazos -->
      <path d="M30 70 C22 92 20 116 22 138 M100 70 C108 92 110 116 108 138" />
      <path d="M22 138 L20 150 M108 138 L110 150" />
    </g>
    <!-- lesiones · teal = ⁶⁸Ga-DOTATOC, ámbar = ¹⁸F-FDG (colores del mapa real) -->
    <g class="mapa-mini__lesions">
      <circle cx="65" cy="72" r="6.5" fill="#1c969e" />
      <circle cx="65" cy="98" r="5.5" fill="#1c969e" />
      <circle cx="42" cy="82" r="4.5" fill="#d66e1c" />
      <circle cx="61" cy="130" r="6" fill="#1c969e" />
      <circle cx="79" cy="122" r="4.5" fill="#d66e1c" />
      <circle cx="58" cy="180" r="5" fill="#d66e1c" />
    </g>
  </svg>
</template>

<style scoped>
.mapa-mini {
  display: block;
  width: 100%;
  height: auto;
  /* El hueso hereda el color del texto berenjena vía currentColor, atenuado
     para que sea una silueta y no compita con las lesiones. */
  color: var(--color-text);
}
.mapa-mini__bones {
  opacity: 0.72;
}
.mapa-mini__lesions circle {
  opacity: 0.92;
}
</style>
