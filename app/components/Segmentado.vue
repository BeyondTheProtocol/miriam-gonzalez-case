<script setup lang="ts">
/**
 * Control segmentado (sistema v3, S4): radios, pestañas o interruptores en una fila de píldoras. Sustituye a nueve
 * recetas del mismo control (`dt-chip`, `dt-vista`, `dt-pestana`, `exp__btn/tab/chip`, `gal__zona`, `lv-lente`,
 * `seg__btn`, `tl-chip`, `pathway-chip`), que no se comportaban igual ni medían lo mismo.
 *
 * · modo="radios"   una opción elegida entre varias (role=radiogroup). Flechas mueven y eligen; Tab entra y sale.
 * · modo="pestanas" pestañas de verdad (role=tablist/tab, aria-selected, aria-controls si pasas `idPanel`). Las flechas,
 *                   Inicio y Fin mueven y activan.
 * · modo="toggle"   filtros que se encienden y apagan (aria-pressed); `modelValue` es un array de valores.
 * · Activo = --seleccionado-bg y --seleccionado-text MÁS un borde de 2 px del color del texto: el estado no depende solo
 *   del color. Borde de reposo --trazo-interactivo (≥ 3:1), mínimo 44 px, píldora. El foco usa el anillo de los roles.
 * · `desplazable`: en móvil la fila se desliza en horizontal en vez de partirse en varias líneas.
 *
 * Los estilos viven en main.css (.segmentado, .segmentado__btn): nacen copiando el kit de CelulaExplorarExplorador sin
 * tocar ese fichero, que es del PR #290.
 */
interface Opcion { valor: string; etiqueta: string; icono?: string }

const props = withDefaults(defineProps<{
  modelValue: string | string[]
  opciones: Opcion[]
  modo?: 'radios' | 'pestanas' | 'toggle'
  /** nombre accesible del grupo (obligatorio: sin él, un lector de pantalla no sabe qué se elige) */
  etiqueta: string
  desplazable?: boolean
  /** pestañas: función que da el id del panel de cada valor, para aria-controls */
  idPanel?: (valor: string) => string
}>(), { modo: 'radios', desplazable: false, idPanel: undefined })

const emit = defineEmits<{ (e: 'update:modelValue', v: string | string[]): void }>()

const uid = useId()
const botones = ref<HTMLButtonElement[]>([])

const activa = (v: string) => (Array.isArray(props.modelValue) ? props.modelValue.includes(v) : props.modelValue === v)
const rol = computed(() => ({ radios: 'radiogroup', pestanas: 'tablist', toggle: 'group' })[props.modo])
const rolBoton = computed(() => ({ radios: 'radio', pestanas: 'tab', toggle: undefined })[props.modo])

function elige(v: string) {
  if (props.modo === 'toggle') {
    const actual = Array.isArray(props.modelValue) ? props.modelValue : []
    emit('update:modelValue', actual.includes(v) ? actual.filter((x) => x !== v) : [...actual, v])
  } else {
    emit('update:modelValue', v)
  }
}

/** Roving tabindex: solo la elegida (o la primera) entra por Tab; las flechas recorren el grupo. */
function tabindex(v: string, i: number) {
  if (props.modo === 'toggle') return 0
  const hayActiva = props.opciones.some((o) => activa(o.valor))
  return activa(v) || (!hayActiva && i === 0) ? 0 : -1
}

function alTeclear(ev: KeyboardEvent, i: number) {
  if (props.modo === 'toggle') return
  const n = props.opciones.length
  const destinos: Record<string, number> = {
    ArrowRight: (i + 1) % n,
    ArrowDown: (i + 1) % n,
    ArrowLeft: (i - 1 + n) % n,
    ArrowUp: (i - 1 + n) % n,
    Home: 0,
    End: n - 1,
  }
  const destino = destinos[ev.key]
  if (destino === undefined) return
  ev.preventDefault()
  botones.value[destino]?.focus()
  elige(props.opciones[destino].valor)
}
</script>

<template>
  <div class="segmentado" :class="{ 'segmentado--desplazable': desplazable }" :role="rol" :aria-label="etiqueta">
    <button
      v-for="(o, i) in opciones"
      :id="modo === 'pestanas' ? `${uid}-${o.valor}` : undefined"
      :key="o.valor"
      :ref="(el) => { if (el) botones[i] = el as HTMLButtonElement }"
      type="button"
      class="segmentado__btn"
      :role="rolBoton"
      :aria-checked="modo === 'radios' ? activa(o.valor) : undefined"
      :aria-selected="modo === 'pestanas' ? activa(o.valor) : undefined"
      :aria-pressed="modo === 'toggle' ? activa(o.valor) : undefined"
      :aria-controls="modo === 'pestanas' && idPanel ? idPanel(o.valor) : undefined"
      :tabindex="tabindex(o.valor, i)"
      @click="elige(o.valor)"
      @keydown="alTeclear($event, i)"
    >
      <Icon v-if="o.icono" :name="o.icono" class="segmentado__icono" aria-hidden="true" />
      {{ o.etiqueta }}
    </button>
  </div>
</template>
