<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

onMounted(() => {
  const browserLang = navigator.language
  const hasLangParam = route.query.lang !== undefined
  
  if (browserLang.startsWith('en') && !hasLangParam && locale.value === 'es') {
    const newPath = switchLocalePath('en')
    if (newPath && window.location.pathname !== newPath) {
      window.location.href = newPath
    }
  }
})
</script>
