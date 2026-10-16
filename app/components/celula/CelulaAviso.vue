<script setup lang="ts">
/**
 * Aviso de «apoyo a la decisión»: el mismo que lleva /datos (.dt-aviso), con tokens. Va bajo la
 * cabecera de cada herramienta del caso; aquí no se inventa otro.
 */
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
</script>

<template>
  <p class="cel-aviso" role="note">
    <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
    {{ L('Apoyo a la decisión de su equipo médico. No es diagnóstico ni consejo médico.', 'Support for her medical team’s decisions. Not a diagnosis or medical advice.') }}
  </p>
</template>

<style scoped>
.cel-aviso {
  display: flex; gap: var(--sp-8); align-items: flex-start; margin: 0;
  font: 500 13.5px/1.45 var(--font-body); color: var(--color-text);
  background: var(--color-bg-card); border-radius: var(--radius-btn); padding: 10px var(--sp-12);
}
</style>
