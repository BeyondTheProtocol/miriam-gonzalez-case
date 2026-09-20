<template>
  <!-- Esquema del esqueleto con los focos del mapa de metástasis. ÚNICO: lo usan /lesiones y
       /mapa-metastasis. Estuvo duplicado (el mismo SVG copiado en las dos páginas) y las copias
       divergieron, que es exactamente lo que se ve cuando repintas una y no la otra. Lo que
       cambia entre páginas va por props: opacidad por grupo (filtros y línea de tiempo del
       mapa), ticks, textos de accesibilidad y si el componente gestiona el teclado o lo hace la
       página. Vista anterior: la derecha del cuerpo queda a la izquierda. -->
  <div>
    <p class="text-[10px] text-tinta leading-snug px-1 mb-1.5">
      {{ L('Vista de frente · la derecha del cuerpo queda a tu izquierda', 'Front view · the body’s right is on your left') }}
    </p>
    <div class="flex justify-between text-[11px] font-semibold text-berenjena px-1 mb-1">
      <span>{{ L('Dcha. del cuerpo', 'Body’s right') }}</span>
      <span>{{ L('Izq. del cuerpo', 'Body’s left') }}</span>
    </div>
    <!-- (a11y) el conjunto de marcadores es un LISTBOX de focos: role=listbox + cada marcador
         role=option + roving tabindex (solo el seleccionado entra en el orden de tabulación; las
         flechas mueven la selección Y el foco del DOM). aria-activedescendant apunta al activo. -->
    <svg :viewBox="`0 0 ${VB_W} ${VB_H}`" class="w-full" role="listbox"
      :aria-label="ariaLabel ?? L('Esquema del esqueleto con las lesiones (flechas para recorrer)', 'Skeleton schematic with the lesions (arrows to step)')"
      :aria-activedescendant="idPrefix + selected"
      :aria-describedby="describedby"
      @keydown="onKey">
      <defs>
        <!-- Negativoscopio de marca: el mismo #1c1126 que los visores 3D (BreastView, LiverView,
             BoneTriView). El hueso va en gris pálido y NUNCA en dorado: el dorado está reservado
             a «lesión» en las tarjetas de la mama y el hígado, y competiría con ese código. -->
        <linearGradient :id="pfx + 'Bone'" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="#d7dbe2" /><stop offset="48%" stop-color="#bcc2cc" /><stop offset="100%" stop-color="#959daa" />
        </linearGradient>
        <linearGradient :id="pfx + 'BoneV'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dde1e8" /><stop offset="50%" stop-color="#c3c9d3" /><stop offset="100%" stop-color="#9aa2af" />
        </linearGradient>
        <radialGradient :id="pfx + 'BoneHi'" cx="36%" cy="20%" r="75%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" /><stop offset="55%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <filter :id="pfx + 'BoneShadow'" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="3.2" flood-color="#000000" flood-opacity="0.45" />
        </filter>
        <radialGradient :id="pfx + 'Panel'" cx="50%" cy="38%" r="80%">
          <stop offset="0%" stop-color="#241733" /><stop offset="100%" stop-color="#160e20" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" :width="VB_W" :height="VB_H" rx="18" :fill="`url(#${pfx}Panel)`" />
      <!-- SU esqueleto, de su TC de hueso del 26-may-2026 (tools/visor3d.py esqueleto).
           Sustituye a los trazados que había aquí dibujados a mano. Lo que se ve es hueso suyo
           salvo lo que el pie declara reconstruido: los tramos que el modelo no segmentó, las
           costillas copiadas de su pareja y los agujeros interiores. -->
      <image href="/esqueleto/esqueleto-anterior.png" x="0" y="0" :width="VB_W" :height="VB_H"
        preserveAspectRatio="xMidYMid meet" :aria-hidden="true" />
      <g font-family="JetBrains Mono, monospace" font-size="9" fill="#aeb6c2" font-weight="600">
        <text v-for="tk in ticksUsados" :key="tk.t" x="362" :y="(tk.ty ?? tk.y) + 3" text-anchor="start">{{ tk.t }}</text>
        <!-- la marca va en la altura REAL y el texto donde se lea; el codo une las dos -->
        <path v-for="tk in ticksUsados" :key="'l' + tk.t"
          :d="`M344,${tk.y} L352,${tk.y} L358,${tk.ty ?? tk.y}`"
          fill="none" stroke="#7d8593" stroke-width="1" />
      </g>
      <g v-for="{ g, p } in CONPOS" :key="g.key" class="sk-foco"
        :style="opacidad ? { opacity: opacidad(g) } : undefined">
        <!-- Diana táctil. Ojo al error que hubo aquí: el radio va en unidades de VIEWBOX (440
             de ancho) pero el contenedor real mide ~309-326 px, así que todo se encoge un 30 %.
             Con `hit: 22` la diana medía 30,9 px en móvil, no los 44 que decía el comentario
             anterior. A 32 salen 42,6 px en móvil y 44,8 en escritorio. -->
        <circle :cx="p.x" :cy="p.y" :r="hit" fill="transparent" class="cursor-pointer" aria-hidden="true" @click="emit('pick', g.primary.id)" />
        <!-- Anillo de selección de DOBLE trazo. El claro solo no vale: sobre hueso plano daba
             1,9-3,0 : 1 de contraste (medido sobre los píxeles del PNG en las 19 posiciones) y
             el foco seleccionado se perdía justo en L1, L5, sacro, ilíacos y fémur. Un trazo
             oscuro por fuera y uno claro por dentro se ven sobre CUALQUIER fondo, como la
             línea de un mapa. Solo aparece al seleccionar, así que no ensucia el resto. -->
        <circle v-if="esSel(g)" :cx="p.x" :cy="p.y" :r="SK_R + 4.6"
          fill="none" stroke="#120b1a" stroke-width="3" aria-hidden="true" />
        <circle
          :id="idPrefix + g.primary.id"
          :cx="p.x" :cy="p.y"
          :r="SK_R + (esSel(g) ? 2.5 : 0)"
          :fill="PHENO[g.primary.pheno].c"
          :stroke="esSel(g) ? '#F5EFE6' : '#1c1126'"
          :stroke-width="esSel(g) ? 4 : 1.4"
          :stroke-dasharray="(g.primary.source ?? 'informe') === 'ia-david' ? '2 1.6' : undefined"
          class="cursor-pointer sk-marker"
          :tabindex="esSel(g) ? 0 : -1" role="option" :aria-selected="esSel(g)"
          :aria-label="g.multi ? `${g.foci[0].level[lang]} — ${g.foci.length} ${L('focos', 'foci')}` : `${g.primary.level[lang]} — ${L(PHENO[g.primary.pheno].es, PHENO[g.primary.pheno].en)}`"
          @click="emit('pick', g.primary.id)"
          @mouseenter="emit('hover', $event, g)" @mouseleave="emit('leave')"
          @focus="emit('hover', $event, g)" @blur="emit('leave')" />
        <g v-if="g.multi" class="pointer-events-none select-none">
          <circle :cx="p.x + SK_R + 1.5" :cy="p.y - SK_R - 1.5" r="6.5" fill="#F5EFE6" stroke="#1c1126" stroke-width="1.2" />
          <text :x="p.x + SK_R + 1.5" :y="p.y - SK_R - 1.5" text-anchor="middle" dominant-baseline="central"
            font-family="Source Sans 3, sans-serif" font-size="9" font-weight="700" fill="#1c1126">{{ g.foci.length }}</text>
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
      <p class="mt-1 text-[10.5px] text-tinta leading-snug">
        {{ L('El esqueleto es el suyo, segmentado de su TC de hueso. Donde el TC no llegó está reconstruido: algún tramo de columna, cuatro costillas copiadas de su pareja y los huecos interiores. El nivel vertebral de cada foco es el del informe; su altura en el dibujo, estimada.', 'The skeleton is her own, segmented from her bone CT. Where the CT fell short it is reconstructed: a stretch of spine, four ribs copied from their pair, and interior gaps. Each focus’s vertebral level is the one in the report; its height in the drawing is estimated.') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHENO, PHENO_RAMP_CSS, GROUPS, SK_R } from '#mapa-focos'
import ESQ from '~/data/esqueleto.json'
import { HUESO_DE_FOCO, DESPLAZA } from '~/data/focos-huesos'
import type { LesGroup } from '#mapa-focos'

const props = withDefaults(defineProps<{
  selected: number
  /** prefijo de los id de cada opción: dos instancias en una misma página no pueden chocar */
  idPrefix?: string
  ariaLabel?: string
  describedby?: string
  /** false cuando la PÁGINA ya gobierna el teclado (el mapa lo hace a nivel de sección) */
  teclado?: boolean
  /** opacidad por grupo: así el mapa aplica sus filtros y su línea de tiempo sin duplicar el SVG */
  opacidad?: (g: LesGroup) => number
  ticks?: { y: number; t: string }[]
  hit?: number
}>(), { idPrefix: 'pk-opt-', teclado: true, hit: 32 })

const emit = defineEmits<{ pick: [id: number]; hover: [e: Event, g: LesGroup]; leave: [] }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

/* Los id de los degradados van con el mismo prefijo que las opciones: si las dos instancias
   coincidieran en una página, un `url(#skBone)` duplicado haría que una se pintara con los
   degradados de la otra. */
const pfx = computed(() => props.idPrefix.replace(/[^a-zA-Z0-9]/g, ''))
/* El lienzo toma la proporción de la imagen real, para que el esqueleto no salga estirado. */
const VB_W = 440
const VB_H = Math.round(VB_W * ESQ.tamano[1] / ESQ.tamano[0])

type UV = { u: number; v: number }
const HUESOS = ESQ.huesos as Record<string, UV>

/* Dónde cae cada foco: el centroide de SU hueso, más el desplazamiento que separa a los que
   comparten uno. Si un hueso faltara, el foco no se dibuja en vez de aparecer en otro sitio. */
function posDe(id: number): { x: number; y: number } | null {
  const c = HUESOS[HUESO_DE_FOCO[id]]
  if (!c) return null
  const [dx, dy] = DESPLAZA[id] ?? [0, 0]
  return { x: (c.u + dx) * VB_W, y: (c.v + dy) * VB_H }
}
const CONPOS = GROUPS.map((g) => ({ g, p: posDe(g.primary.id) })).filter((r) => r.p) as
  { g: LesGroup; p: { x: number; y: number } }[]

/* Los ticks de nivel dejan de estar puestos a ojo: salen de la vértebra que nombran. */
const NIVELES = [['C1', 'vertebrae_C1'], ['C7', 'vertebrae_C7'], ['T1', 'vertebrae_T1'],
  ['T6', 'vertebrae_T6'], ['T12', 'vertebrae_T12'], ['L1', 'vertebrae_L1'],
  ['L5', 'vertebrae_L5'], ['S', 'sacrum']] as const
/* Separados si se pisan: C7 y T1 son vecinos de verdad, y L5 y el sacro casi se tocan, así que
   con la altura real las etiquetas caen una encima de otra. Se empujan lo justo para leerlas;
   la marca sigue en su sitio, solo se mueve el texto. */
const ticksUsados = computed(() => {
  if (props.ticks) return props.ticks
  const t = NIVELES.filter(([, h]) => HUESOS[h])
    .map(([t, h]) => ({ t, y: HUESOS[h].v * VB_H, ty: HUESOS[h].v * VB_H }))
  const MIN = 11
  for (let i = 1; i < t.length; i++) {
    if (t[i].ty - t[i - 1].ty < MIN) t[i].ty = t[i - 1].ty + MIN
  }
  return t
})

function esSel(g: LesGroup) { return g.foci.some((l) => l.id === props.selected) }
/* flechas: recorre los grupos en orden del esqueleto (arriba → abajo) */
function onKey(e: KeyboardEvent) {
  if (!props.teclado) return
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return
  e.preventDefault()
  const i = CONPOS.findIndex((r) => esSel(r.g))
  const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
  const g = CONPOS[(i + d + CONPOS.length) % CONPOS.length].g
  emit('pick', g.primary.id)
  nextTick(() => (document.getElementById(props.idPrefix + g.primary.id) as unknown as SVGElement | null)?.focus())
}
</script>

<style scoped>
/* Foco de teclado propio: sobre el panel oscuro, el outline automático del navegador (azul de
   sistema) queda pobre. Blanco cálido, el mismo de los rótulos de los visores 3D. */
circle[role='option']:focus-visible {
  outline: 3px solid #F5EFE6;
  outline-offset: 2px;
  border-radius: 9999px;
}
/* las mismas curvas que el mapa: esqueleto, scatter y tabla se modulan al unísono */
.sk-foco { transition: opacity var(--ease-salida); }
.sk-marker { transition: r var(--ease-entrada), stroke var(--ease-entrada), stroke-width var(--ease-entrada); }
</style>
