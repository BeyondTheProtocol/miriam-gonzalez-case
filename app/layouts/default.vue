<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main-content" class="skip-link">{{ $t('nav.skip_to_content') }}</a>
    <SiteNav />
    <main id="main-content" class="flex-1" tabindex="-1" :aria-label="$t('nav.main_content_label')">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
const head = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(head)
</script>
