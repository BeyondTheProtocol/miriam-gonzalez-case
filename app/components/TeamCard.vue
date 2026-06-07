<template>
  <div class="card-base flex items-start gap-4 hover:shadow-md transition-shadow w-full h-full">
    <div class="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" :class="colorClasses">
      <Icon :name="member.icon" class="w-5 h-5" />
    </div>
    <div class="min-w-0">
      <h3 class="font-display font-semibold text-berenjena text-sm">
        {{ member.role }}
      </h3>
      <p class="text-xs text-tinta mt-1 leading-relaxed"><template v-for="(part, i) in descParts" :key="i"><Term v-if="part.term" :id="part.value" /><template v-else>{{ part.value }}</template></template></p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  member: {
    role: string
    description: string
    icon: string
    color?: 'gold' | 'ocean' | 'ink'
  }
}>()

const colorClasses = computed(() => {
  switch (props.member.color) {
    case 'ocean':
      return 'bg-miriam-soft text-berenjena'
    case 'ink':
      return 'bg-cream text-tinta'
    default:
      return 'bg-miriam-soft text-berenjena'
  }
})

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
