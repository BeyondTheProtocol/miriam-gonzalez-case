<template>
  <!-- Sistema v3 (T3-LOTE2, A20): una sola receta de tarjeta (.card-base, sin sombra dura alterna por paridad: el protagonista de un grupo lo decide
       Miriam, y mientras no lo decida no hay ninguno), una sola baldosa de icono y la descripción a 15 px desde `lg` (13 px antes; el móvil no cambia). -->
  <div class="card-base flex items-start gap-4 w-full h-full">
    <div class="shrink-0 w-11 h-11 rounded-btn flex items-center justify-center bg-miriam-soft text-berenjena">
      <Icon :name="member.icon" class="w-5 h-5" />
    </div>
    <div class="min-w-0">
      <h3 class="font-display font-semibold text-berenjena text-sm">
        {{ member.role }}
      </h3>
      <p class="text-xs lg:text-sm text-tinta mt-1 leading-relaxed"><template v-for="(part, i) in descParts" :key="i"><Term v-if="part.term" :id="part.value" /><template v-else>{{ part.value }}</template></template></p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  member: {
    role: string
    description: string
    icon: string
    // Los YAML traen un color por miembro (gold, ocean, ink): la baldosa es una sola desde el lote 2 y ya no lo lee.
    color?: 'gold' | 'ocean' | 'ink'
  }
}>()

// Trocea la descripción en texto y términos de glosario {id}, para poder
// insertar tooltips (p. ej. {ecog}) dentro del texto plano del YAML.
interface DescPart { term: boolean; value: string }
const descParts = computed<DescPart[]>(() => {
  const out: DescPart[] = []
  const re = /\{([a-z0-9-]+)\}/gi
  const s = props.member.description ?? ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push({ term: false, value: s.slice(last, m.index) })
    out.push({ term: true, value: m[1] ?? '' })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ term: false, value: s.slice(last) })
  return out
})
</script>
