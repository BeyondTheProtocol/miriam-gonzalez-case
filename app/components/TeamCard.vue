<template>
  <div class="card-base flex items-start gap-4 hover:shadow-md transition-shadow">
    <div
      class="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
      :class="colorClasses"
    >
      <Icon :name="member.icon" class="w-5 h-5" />
    </div>
    <div>
      <h3 class="font-display font-semibold text-ink-900 text-sm">
        {{ member.role }}
      </h3>
      <p class="text-xs text-ink-600 mt-1 leading-relaxed">
        {{ member.description }}
      </p>
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
    case 'ocean': return 'bg-ocean-50 text-ocean-700'
    case 'ink': return 'bg-ink-100 text-ink-600'
    default: return 'bg-gold-100 text-gold-700'
  }
})
</script>
