<script setup lang="ts">
/**
 * Lesiones — mama, hígado y hueso de un vistazo.
 *
 * Traslada el visor del mapa de metástasis (mismo esquema del esqueleto, mismos focos,
 * mismo visor 3D BoneTriView; datos leídos del propio mapa en cada build vía #mapa-focos) y le suma el
 * hígado (visor 3D girable con todas sus lesiones: las dianas con la medida del radiólogo y el
 * resto como detección automática sin validar, igual que el vídeo) y la mama (medida del informe).
 * Sin interpretación añadida.
 * Herramienta de apoyo a la decisión — no es diagnóstico ni consejo médico.
 */
import { LES, PHENO, PHENO_TEXT, BONE3D_KEY } from '#mapa-focos'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'Breast, liver and bone at a glance — Miriam’s case, a support tool'
    : 'Mama, hígado y hueso, de un vistazo — el caso de Miriam, una herramienta de apoyo'
const seoDescription = () =>
  lang.value === 'en'
    ? 'A support tool, not a diagnosis. Miriam’s breast, liver and bone lesions, on a single page.'
    : 'Una herramienta de apoyo, no un diagnóstico. La mama, el hígado y las lesiones óseas de Miriam, en una sola página.'
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
    <section class="section-spacing" :aria-label="L('Mama, hígado y hueso', 'Breast, liver and bone')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :title="L('Mama, hígado y hueso, de un vistazo', 'Breast, liver and bone, at a glance')"
          :subtitle="L('La mama, el hígado y las lesiones óseas.', 'The breast, the liver and the bone lesions.')"
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

        <!-- ===== MAMA E HÍGADO · medidas del informe; en el hígado, además, la detección automática ===== -->
        <div class="grid gap-6 md:grid-cols-2 items-start mb-10">
          <section class="card-base" aria-labelledby="mama-titulo">
            <h2 id="mama-titulo" class="heading-display text-2xl text-berenjena mb-3" style="letter-spacing: -0.02em">{{ L('Mama derecha', 'Right breast') }}</h2>
            <div class="mb-3">
              <ClientOnly>
                <BreastView base="/lesiones/mama/" fallback="/lesiones/mama-2026-09-08.webp"
                  :fallback-alt="L('Reconstrucción 3D del tumor primario de mama de Miriam desde su resonancia del 8 de septiembre de 2026, dentro del tejido fibroglandular de la mama derecha', '3D reconstruction of Miriam’s primary breast tumour from her 8 September 2026 MRI, inside the fibroglandular tissue of the right breast')" />
                <template #fallback>
                  <div class="rounded-xl flex items-center justify-center text-[12px]" style="aspect-ratio:1/1;background:#1c1126;color:#aeb6c2">
                    {{ L('cargando visor…', 'loading viewer…') }}
                  </div>
                </template>
              </ClientOnly>
            </div>
            <p class="text-[14px] text-tinta leading-relaxed">
              {{ L('Tumor primario, medido en RM (13-jul → 8-sep-2026): 14 → 15 mm.', 'Primary tumor, measured on MRI (13 Jul → 8 Sep 2026): 14 → 15 mm.') }}
            </p>
          </section>
          <section class="card-base" aria-labelledby="higado-titulo">
            <h2 id="higado-titulo" class="heading-display text-2xl text-berenjena mb-3" style="letter-spacing: -0.02em">{{ L('Hígado', 'Liver') }}</h2>
            <div class="mb-3">
              <ClientOnly>
                <LiverView base="/lesiones/higado/" fallback="/lesiones/higado-2026-09-08.webp"
                  :fallback-alt="L('Reconstrucción 3D del hígado de Miriam desde su TC del 8 de septiembre de 2026, con los vasos y las lesiones: dos lesiones diana con anillo y la medida del radiólogo (segmento II, 20 mm; segmento IVb, 19 mm) y el resto, lesiones candidatas por detección automática, sin validar', '3D reconstruction of Miriam’s liver from her 8 September 2026 CT, with the vessels and the lesions: two ringed target lesions with the radiologist’s measurement (segment II, 20 mm; segment IVb, 19 mm) and the rest, candidate lesions from automatic detection, not validated')" />
                <template #fallback>
                  <div class="rounded-xl flex items-center justify-center text-[12px]" style="aspect-ratio:1/1;background:#1c1126;color:#aeb6c2">
                    {{ L('cargando visor…', 'loading viewer…') }}
                  </div>
                </template>
              </ClientOnly>
            </div>
            <p class="text-[14px] text-tinta leading-relaxed">
              {{ L('Lesiones diana del informe de TC (13-jul → 8-sep-2026): segmento II 18 → 20 mm · segmento IVb 15 → 19 mm.', 'Target lesions in the CT report (13 Jul → 8 Sep 2026): segment II 18 → 20 mm · segment IVb 15 → 19 mm.') }}
            </p>
            <!-- Frase sellada (24-sep-26): revisión informal del TC del 8-sep por un radiólogo. No
                 decir «55 metástasis» ni que «todas han aparecido o crecido». -->
            <p class="text-[14px] text-tinta leading-relaxed mt-2">
              {{ L('Un radiólogo, en una lectura informal y sin informe firmado, marcó 55 medidas en este TC y las considera 55 lesiones distintas, muy sugestivas de metástasis. Las 20 que ves aquí están entre ellas. El informe oficial describe «múltiples imágenes nodulares hepáticas compatibles con M1» (M1: metástasis a distancia).', 'A radiologist, in an informal read without a signed report, marked 55 measurements on this CT and considers them 55 distinct lesions, highly suggestive of metastases. The 20 you see here are among them. The official report describes multiple nodular images in the liver compatible with M1 (M1: distant metastasis).') }}
            </p>
          </section>
        </div>

        <!-- ===== HUESO · el visor del mapa de metástasis, trasladado ===== -->
        <section class="mb-10" aria-labelledby="hueso-titulo">
          <h2 id="hueso-titulo" class="heading-display text-2xl sm:text-3xl text-berenjena mb-2" style="letter-spacing: -0.02em">
            {{ L('Hueso', 'Bone') }}
          </h2>
          <!-- Fechas de los estudios del mapa (su propia cabecera): sin esto, «de un vistazo»
               se leía como «al día», y el PET del 8-sep aún no está en el mapa (verificacion, 19-sep).
               20-sep: decir «aún no incorporado» se quedaba corto. Ese PET no solo falta, CAMBIA el
               cuadro: concluye «progresión ósea por aparición de nuevas lesiones activas», con más
               lesiones activas en columna, escápula derecha, costillas, pelvis y ambos fémures. Con
               tráfico de campaña, un aviso neutro se lee como el estado de hoy. -->
          <p class="text-[13px] text-tinta leading-relaxed mb-4">
            {{ L('PET de marzo y mayo y RM de junio de 2026. El PET del 8 de septiembre, aún no incorporado, describe más lesiones óseas activas que las que se ven aquí.', 'PET scans from March and May and MRI from June 2026. The 8 September PET, not yet included, describes more active bone lesions than the ones shown here.') }}
          </p>
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
                    <div class="rounded-lg flex items-center justify-center text-[12px]" style="aspect-ratio:12/5;background:#1c1126;color:#aeb6c2">
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
      </div>
    </section>
  </div>
</template>
