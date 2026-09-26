<script setup>
// Edad desde la fuente única (app/utils/caseData) en vez de a mano, para que la
// share-card no se desincronice del resto del sitio. Import explícito: el runtime
// aislado del og:image (takumi) no garantiza el auto-import de utils.
import { caseData } from '~/utils/caseData'

defineProps({
  colorMode: { type: String, required: false, default: 'light' },
  title: { type: String, required: false, default: 'title' },
  description: { type: String, required: false },
  width: { type: Number, required: false, default: 1200 },
  height: { type: Number, required: false, default: 630 },
})
</script>

<template>
  <div
    class="w-full h-full flex flex-row items-center relative"
    style="background-color: #faf6f0; color: #2d1b3d; font-family: 'Fraunces', serif;"
  >
    <!-- Portrait column -->
    <div
      class="flex items-center justify-center h-full shrink-0"
      style="width: 420px; background-color: #e8d4ed;"
    >
      <img
        src="/design-system/assets/miriam-avatar.png"
        alt=""
        width="320"
        height="320"
        style="width: 320px; height: 320px; border-radius: 9999px; object-fit: cover; border: 6px solid #faf6f0;"
      />
    </div>

    <!-- Text column -->
    <div class="flex flex-col justify-center h-full" style="padding: 60px; gap: 24px; flex: 1;">
      <div class="flex items-center" style="gap: 12px;">
        <div style="width: 32px; height: 4px; background-color: #9d44ab;" />
        <span
          style="font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b5a78;"
        >
          helpmiriam.com
        </span>
      </div>

      <h1
        style="font-size: 60px; font-weight: 600; line-height: 1.05; letter-spacing: -0.03em; margin: 0; color: #2d1b3d;"
      >
        {{ title }}
      </h1>

      <p
        v-if="description"
        style="font-family: 'Source Sans 3', sans-serif; font-size: 26px; line-height: 1.45; color: #5a4a68; margin: 0;"
      >
        {{ description }}
      </p>

      <div
        class="flex items-center"
        style="gap: 14px; margin-top: 12px; padding-top: 20px; border-top: 1px solid rgba(45,27,61,0.12);"
      >
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #2d1b3d;">
          Miriam González · {{ caseData.currentAge }}
        </span>
        <span style="color: #9d44ab;">·</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #5a4a68;">
          BC-NED · FGFR1 ×13 · SSTR+ (PET Ga-DOTATOC)
        </span>
      </div>
    </div>
  </div>
</template>
