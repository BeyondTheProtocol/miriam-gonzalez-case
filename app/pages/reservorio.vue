<script setup lang="ts">
/**
 * Reservorio — «medir para descartar», no gravedad. El puerto de acceso venoso dejó de dar
 * retorno; en vez de asumir que el catéter se había movido, su trayecto se reconstruyó sobre
 * el TC de tres fechas separadas por meses. La punta sale en el mismo sitio las tres veces.
 *
 * Página PROPIA, no una cuarta tarjeta en /lesiones: esa página tiene un solo eje (dónde está
 * la enfermedad) y el reservorio es infraestructura del tratamiento, con su propio arco.
 * /lesiones la enlaza al final; no la contiene (decisión del comité de diseño, 24-sep-2026).
 *
 * Qué NO se enseña aquí, a propósito: marca ni modelo del dispositivo, hospital o
 * profesionales, número de intentos de desobstrucción ni fechas de intervención — detalle
 * procedimental que no aporta a esta historia. Solo mallas (visor3d.py `web-reservorio`):
 * cero DICOM, cero cabeceras, cero metadatos del estudio.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'The catheter has not moved — Miriam’s case, a support tool'
    : 'El catéter no se ha movido — el caso de Miriam, una herramienta de apoyo'
const seoDescription = () =>
  lang.value === 'en'
    ? 'Her reservoir stopped giving blood return. Before assuming the catheter had moved, its path was rebuilt on three CT scans, months apart: the tip lands in the same place every time.'
    : 'Su reservorio dejó de dar retorno. Antes de dar por hecho que el catéter se había movido, se reconstruyó su trayecto en tres TC separados por meses: la punta sale en el mismo sitio las tres veces.'
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => lang.value === 'en'
    ? 'Three CT scans, months apart, say the same thing about the same catheter.'
    : 'Tres TC, separados por meses, dicen lo mismo del mismo catéter.',
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('El catéter del reservorio, en 3D', 'The reservoir catheter, in 3D')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :tag="L('Infraestructura del tratamiento', 'Treatment infrastructure')"
          :title="L('El catéter no se ha movido.', 'The catheter has not moved.')"
          :subtitle="L(
            'Su reservorio (el puerto de acceso venoso) dejó de dar retorno. Lo primero que se piensa es que el catéter se ha movido, así que antes de darlo por hecho se reconstruyó su trayecto en tres TC separados por meses. La punta sale en el mismo sitio las tres veces, y eso no cuadra con un catéter desplazado.',
            'Her reservoir (the venous access port) stopped giving blood return. The first thing to suspect is that the catheter has moved, so before assuming that, its path was rebuilt on three CT scans, months apart. The tip lands in the same place all three times, which does not fit a displaced catheter.')"
        />

        <div class="alert-callout mb-6" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
          <div class="max-w-[420px] mx-auto lg:mx-0 w-full">
            <ClientOnly>
              <ReservoirView base="/reservorio/" />
              <template #fallback>
                <div class="rounded-xl flex items-center justify-center text-[12px]" style="aspect-ratio:1/1;background:#1c1126;color:#aeb6c2">
                  {{ L('cargando visor…', 'loading viewer…') }}
                </div>
              </template>
            </ClientOnly>
          </div>

          <div class="min-w-0">
            <p class="text-[15px] text-tinta leading-relaxed mb-4">
              {{ L(
                'El modelo sale de sus propios TC. El portal y la punta están medidos directamente en el corte; el tramo de en medio es la ruta más probable entre los dos, interpolada.',
                'The model comes from her own CT scans. The port and the tip are measured directly on the slice; the stretch between them is the most likely route, interpolated.') }}
            </p>
            <p class="text-[15px] text-tinta leading-relaxed mb-4">
              {{ L(
                'Longitud del catéter, portal→punta, en las tres fechas: 150,8 mm · 152,2 mm · 151,7 mm (± 5 mm cada medida; ± 10 mm en la diferencia entre fechas). Dentro de ese margen, es la misma medida las tres veces.',
                'Catheter length, port→tip, across the three dates: 150.8 mm · 152.2 mm · 151.7 mm (± 5 mm per measurement; ± 10 mm on the difference between dates). Within that margin, it is the same measurement all three times.') }}
            </p>
            <p class="text-[13px] text-tinta leading-relaxed">
              {{ L(
                'RECIST no aplica aquí, porque mide lesiones y esto es un catéter. La reconstrucción es semiautomática y radiología no la ha validado.',
                'RECIST does not apply here, since it measures lesions and this is a catheter. The reconstruction is semi-automatic and radiology has not validated it.') }}
            </p>
            <NuxtLink :to="localePath('lesiones')" class="inline-flex items-center min-h-[44px] mt-6 font-semibold text-berenjena underline underline-offset-4">
              ← {{ L('Volver a mama, hígado y hueso', 'Back to breast, liver and bone') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
