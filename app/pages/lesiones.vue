<script setup lang="ts">
/**
 * Lesiones — todas las lesiones de un vistazo.
 *
 * Traslada el visor del mapa de metástasis (mismo esquema del esqueleto, mismos focos,
 * mismo visor 3D BoneTriView; datos leídos del propio mapa en cada build vía #mapa-focos) y le suma el
 * hígado y la mama con SOLO las medidas del informe de radiología (dianas RECIST).
 * Nada nuevo inventado: sin interpretación añadida, sin detección automática.
 * Herramienta de apoyo a la decisión — no es diagnóstico ni consejo médico.
 */
import { LES, PHENO, PHENO_TEXT, BONE3D_KEY } from '#mapa-focos'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'All lesions at a glance — Miriam’s case, a support tool'
    : 'Todas las lesiones, de un vistazo — el caso de Miriam, una herramienta de apoyo'
const seoDescription = () =>
  lang.value === 'en'
    ? 'A support tool, not a diagnosis. Miriam’s bone lesions from the metastasis map, together with her liver and breast, on a single page.'
    : 'Una herramienta de apoyo, no un diagnóstico. Las lesiones óseas del mapa de metástasis de Miriam, junto con el hígado y la mama, en una sola página.'
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => lang.value === 'en'
    ? 'A support tool, not a diagnosis. Miriam’s case, to decide better with her team.'
    : 'Una herramienta de apoyo, no un diagnóstico. El caso de Miriam, para decidir mejor con su equipo.',
})

/* foco seleccionado en el esqueleto (arranca en el mismo que el mapa: #7, D11) */
const selected = ref<number>(7)
const sel = computed(() => LES.find((l) => l.id === selected.value) ?? LES[0])
const meshKey = computed(() => BONE3D_KEY[sel.value.id])
/* biopsia previa en el hueso en pantalla (hecho del caso, igual que en el mapa) */
const biopsia = computed(() =>
  LES.some((l) => BONE3D_KEY[l.id] === meshKey.value && l.priorBiopsy) ? '26B585' : null)
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Todas las lesiones', 'All lesions')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :title="L('Todas las lesiones, de un vistazo', 'All lesions, at a glance')"
          :subtitle="L('Las lesiones óseas del mapa de metástasis, junto con el hígado y la mama.', 'The bone lesions from the metastasis map, together with the liver and the breast.')"
        />

        <div class="alert-callout mb-6" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
          {{ L(
            'Es el caso de Miriam, abierto para entender su enfermedad y decidir mejor con su equipo médico — no sustituye su criterio. Deciden sus médicos.',
            'This is Miriam’s case, opened to understand her disease and to decide better with her medical team — it does not replace their judgment. Her doctors decide.') }}
        </div>

        <!-- ===== HUESO · el visor del mapa de metástasis, trasladado ===== -->
        <section class="mb-10" aria-labelledby="hueso-titulo">
          <h2 id="hueso-titulo" class="heading-display text-2xl sm:text-3xl text-berenjena mb-4" style="letter-spacing: -0.02em">
            {{ L('Hueso', 'Bone') }}
          </h2>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start">
            <div class="card-base !p-4">
              <EsqueletoFocos :selected="selected" @pick="selected = $event" />
            </div>
            <div class="min-w-0">
              <p class="eyebrow mb-1">#{{ sel.id }} · {{ sel.region[lang] }}</p>
              <p class="heading-display text-xl text-berenjena mb-1">{{ sel.level[lang] }}</p>
              <p class="text-[13px] font-semibold mb-2" :style="{ color: PHENO_TEXT[sel.pheno] }">{{ L(PHENO[sel.pheno].es, PHENO[sel.pheno].en) }}</p>
              <p class="text-[14px] text-tinta leading-relaxed mb-4">{{ sel.what[lang] }}</p>
              <div role="group" :aria-label="L('Visor 3D del foco seleccionado', '3D viewer of the selected focus')">
                <ClientOnly v-if="meshKey">
                  <BoneTriView :mesh-key="meshKey" :biopsied="biopsia != null" :no-target="sel.source === 'ia-david'" :biopsy-label="biopsia ?? undefined" />
                  <template #fallback>
                    <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:12/5;background:#0d1117;color:#aeb6c2">
                      {{ L('cargando visor…', 'loading viewer…') }}
                    </div>
                  </template>
                </ClientOnly>
              </div>
              <NuxtLink :to="localePath('mapa-metastasis')" class="inline-flex items-center min-h-[44px] mt-2 font-semibold text-berenjena underline underline-offset-4">
                {{ L('Ver este foco con todo el detalle en el mapa de metástasis', 'See this focus in full detail on the metastasis map') }} →
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- ===== HÍGADO Y MAMA · solo las medidas del informe de radiología ===== -->
        <div class="grid gap-6 md:grid-cols-2 items-start mb-10">
          <section class="card-base" aria-labelledby="higado-titulo">
            <h2 id="higado-titulo" class="heading-display text-2xl text-berenjena mb-3" style="letter-spacing: -0.02em">{{ L('Hígado', 'Liver') }}</h2>
            <img src="/lesiones/higado-dianas-2026-09-08.webp" width="1000" height="1000" loading="lazy" class="w-full h-auto rounded-xl mb-3"
              :alt="L('Reconstrucción 3D del hígado de Miriam desde su TC del 8 de septiembre de 2026, con los vasos y las dos lesiones diana del informe', '3D reconstruction of Miriam’s liver from her 8 September 2026 CT, with the vessels and the two target lesions in the report')" />
            <p class="text-[14px] text-tinta leading-relaxed">
              {{ L('Lesiones diana del informe de TC (13-jul → 8-sep-2026): segmento II 18 → 20 mm · segmento IVb 15 → 19 mm.', 'Target lesions in the CT report (13 Jul → 8 Sep 2026): segment II 18 → 20 mm · segment IVb 15 → 19 mm.') }}
            </p>
          </section>
          <section class="card-base" aria-labelledby="mama-titulo">
            <h2 id="mama-titulo" class="heading-display text-2xl text-berenjena mb-3" style="letter-spacing: -0.02em">{{ L('Mama derecha', 'Right breast') }}</h2>
            <p class="text-[14px] text-tinta leading-relaxed">
              {{ L('Tumor primario, medido en RM (13-jul → 8-sep-2026): 14 → 15 mm.', 'Primary tumor, measured on MRI (13 Jul → 8 Sep 2026): 14 → 15 mm.') }}
            </p>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
