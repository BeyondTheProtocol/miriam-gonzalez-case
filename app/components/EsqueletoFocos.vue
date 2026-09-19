<template>
  <!-- Esquema del esqueleto con los focos del mapa de metástasis: el MISMO dibujo y los
       MISMOS marcadores que /mapa-metastasis (copia de sus datos en utils/mapaFocos.ts), sin filtros ni
       línea de tiempo. Vista anterior: la derecha del cuerpo queda a la izquierda. -->
  <div>
    <p class="text-[10px] text-tinta leading-snug px-1 mb-1.5">
      {{ L('Vista de frente · la derecha del cuerpo queda a tu izquierda', 'Front view · the body’s right is on your left') }}
    </p>
    <div class="flex justify-between text-[11px] font-semibold text-berenjena px-1 mb-1">
      <span>{{ L('Dcha. del cuerpo', 'Body’s right') }}</span>
      <span>{{ L('Izq. del cuerpo', 'Body’s left') }}</span>
    </div>
    <svg viewBox="0 0 440 700" class="w-full" role="listbox"
      :aria-label="L('Esquema del esqueleto con las lesiones (flechas para recorrer)', 'Skeleton schematic with the lesions (arrows to step)')"
      :aria-activedescendant="'pk-opt-' + selected"
      @keydown="onKey">
      <defs>
        <linearGradient id="pkBone" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="#efe8da" /><stop offset="48%" stop-color="#e3dac8" /><stop offset="100%" stop-color="#d2c7b1" />
        </linearGradient>
        <linearGradient id="pkBoneV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f1ebde" /><stop offset="50%" stop-color="#e6ddcc" /><stop offset="100%" stop-color="#d6ccb7" />
        </linearGradient>
        <radialGradient id="pkBoneHi" cx="36%" cy="20%" r="75%">
          <stop offset="0%" stop-color="#fffdf8" stop-opacity="0.7" /><stop offset="55%" stop-color="#fffdf8" stop-opacity="0" />
        </radialGradient>
        <filter id="pkBoneShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="3.2" flood-color="#2d1b3d" flood-opacity="0.10" />
        </filter>
        <radialGradient id="pkPanel" cx="50%" cy="38%" r="80%">
          <stop offset="0%" stop-color="#f7f2ea" /><stop offset="100%" stop-color="#efe8dc" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="440" height="700" rx="18" fill="url(#pkPanel)" />
      <g filter="url(#pkBoneShadow)">
        <path d="M192,44 Q192,10 220,10 Q248,10 248,44 Q248,66 233,72 Q220,77 207,72 Q192,66 192,44 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M192,44 Q192,10 220,10 Q248,10 248,44 Q248,66 233,72 Q220,77 207,72 Q192,66 192,44 Z" fill="url(#pkBoneHi)" />
        <path d="M210,66 Q220,75 230,66 L228,76 Q220,82 212,76 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path v-for="(rb, i) in SK_COSTILLAS" :key="'rib' + i" :d="rb.d" fill="none" stroke="#d9d0bd" stroke-width="2.2" opacity="0.5" stroke-linecap="round" />
        <g v-for="(v, i) in SK_VERTEBRAS" :key="'v' + i">
          <rect :x="v.x" :y="v.y" :width="v.w" :height="v.h" :rx="Math.min(v.h / 2, 7)" fill="url(#pkBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
          <rect :x="v.x + 1.5" :y="v.y + 1" :width="v.w - 3" :height="v.h * 0.4" :rx="Math.min(v.h / 2, 7) * 0.7" fill="#fffdf8" opacity="0.35" />
        </g>
        <path d="M202,485 Q220,483 238,485 L231,538 Q220,547 209,538 Z" fill="url(#pkBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M201,487 C152,485 122,520 130,560 C135,588 168,596 187,574 C200,558 203,520 201,487 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M239,487 C288,485 318,520 310,560 C305,588 272,596 253,574 C240,558 237,520 239,487 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M201,487 C152,485 122,520 130,560 C135,588 168,596 187,574 C200,558 203,520 201,487 Z" fill="url(#pkBoneHi)" />
        <circle cx="151" cy="600" r="12.5" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <rect x="150" y="606" width="13" height="92" rx="6.5" fill="url(#pkBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <circle cx="289" cy="600" r="12.5" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <rect x="277" y="606" width="13" height="92" rx="6.5" fill="url(#pkBoneV)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M114,182 Q146,188 146,192 L141,242 Q138,246 134,240 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
        <path d="M326,182 Q294,188 294,192 L299,242 Q302,246 306,240 Z" fill="url(#pkBone)" stroke="#c8bda6" stroke-width="0.6" stroke-opacity="0.7" />
      </g>
      <g font-family="JetBrains Mono, monospace" font-size="9" fill="#5a5550" font-weight="600">
        <text v-for="tk in SK_TICKS" :key="tk.t" x="358" :y="tk.y + 3" text-anchor="start">{{ tk.t }}</text>
        <line v-for="tk in SK_TICKS" :key="'l' + tk.t" x1="346" :y1="tk.y" x2="354" :y2="tk.y" stroke="#9b8f7c" stroke-width="1" />
      </g>
      <g v-for="g in GROUPS" :key="g.key">
        <circle :cx="g.x" :cy="g.y" :r="SK_HIT" fill="transparent" class="cursor-pointer" aria-hidden="true" @click="emit('pick', g.primary.id)" />
        <circle
          :id="'pk-opt-' + g.primary.id"
          :cx="g.x" :cy="g.y"
          :r="SK_R + (esSel(g) ? 2.5 : 0)"
          :fill="PHENO[g.primary.pheno].c"
          :stroke="esSel(g) ? '#2d1b3d' : '#ffffff'"
          :stroke-width="esSel(g) ? 2.5 : 1.4"
          :stroke-dasharray="(g.primary.source ?? 'informe') === 'ia-david' ? '2 1.6' : undefined"
          class="cursor-pointer"
          :tabindex="esSel(g) ? 0 : -1" role="option" :aria-selected="esSel(g)"
          :aria-label="g.multi ? `${g.foci[0].level[lang]} — ${g.foci.length} ${L('focos', 'foci')}` : `${g.primary.level[lang]} — ${L(PHENO[g.primary.pheno].es, PHENO[g.primary.pheno].en)}`"
          @click="emit('pick', g.primary.id)" />
        <g v-if="g.multi" class="pointer-events-none select-none">
          <circle :cx="g.x + SK_R + 1.5" :cy="g.y - SK_R - 1.5" r="6.5" fill="#2d1b3d" stroke="#fff" stroke-width="1.2" />
          <text :x="g.x + SK_R + 1.5" :y="g.y - SK_R - 1.5" text-anchor="middle" dominant-baseline="central"
            font-family="Source Sans 3, sans-serif" font-size="9" font-weight="700" fill="#fff">{{ g.foci.length }}</text>
        </g>
      </g>
    </svg>
    <div class="mt-3 px-1">
      <div class="h-2.5 rounded-full" :style="{ background: PHENO_RAMP_CSS }" />
      <div class="flex justify-between text-[10px] text-tinta mt-1">
        <span>{{ L('SSTR-dominante (⁶⁸Ga⁺/FDG⁻)', 'SSTR-dominant (⁶⁸Ga⁺/FDG⁻)') }}</span>
        <span>{{ L('Glucolítico-dom. (FDG⁺/SSTR⁻)', 'Glycolytic-dom. (FDG⁺/SSTR⁻)') }}</span>
      </div>
      <p class="mt-1.5 text-[10.5px] text-tinta leading-snug">
        {{ L('Color = trazador · insignia = nº de focos en esa vértebra · contorno punteado = detectado por IA (por confirmar).', 'Color = tracer · badge = nº of foci in that vertebra · dashed outline = AI-detected (to confirm).') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHENO, PHENO_RAMP_CSS, GROUPS, SK_R, SK_HIT, SK_VERTEBRAS, SK_COSTILLAS, SK_TICKS } from '~/utils/mapaFocos'
import type { LesGroup } from '~/utils/mapaFocos'

const props = defineProps<{ selected: number }>()
const emit = defineEmits<{ pick: [id: number] }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

function esSel(g: LesGroup) { return g.foci.some((l) => l.id === props.selected) }
/* flechas: recorre los grupos en orden del esqueleto (arriba → abajo) */
function onKey(e: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return
  e.preventDefault()
  const i = GROUPS.findIndex(esSel)
  const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
  const g = GROUPS[(i + d + GROUPS.length) % GROUPS.length]
  emit('pick', g.primary.id)
  nextTick(() => (document.getElementById('pk-opt-' + g.primary.id) as unknown as SVGElement | null)?.focus())
}
</script>
