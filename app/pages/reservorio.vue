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
    ? 'Her port stopped giving blood return. Before acting on it, its path was rebuilt on three CT scans, months apart — the tip lands in the same place every time.'
    : 'Su puerto de acceso venoso dejó de dar retorno. Antes de intervenir, se reconstruyó su trayecto en tres TC separados por meses: la punta sale en el mismo sitio las tres veces.'
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
            'Su puerto de acceso venoso dejó de dar retorno. Antes de intervenir, se reconstruyó el trayecto del catéter en tres TC separados por meses: la punta aparece en el mismo sitio las tres veces, y eso descarta el desplazamiento como causa.',
            'Her venous access port stopped giving blood return. Before acting on it, the catheter’s path was rebuilt on three CT scans, months apart: the tip lands in the same place all three times, which rules out displacement as the cause.')"
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
                'El modelo sale de sus propios TC. El trayecto está medido en los dos extremos —el portal y la punta, leídos directamente en el corte— y el tramo intermedio es la ruta más probable entre ambos, interpolada y marcada como tal: por eso se dibuja discontinua. El gris de fondo es hueso y tráquea, solo para orientarse; no es el protagonista.',
                'The model comes from her own CT scans. The path is measured at both ends —the port and the tip, read directly on the slice— and the middle stretch is the most likely route between them, interpolated and marked as such: that is why it is drawn discontinuous. The grey in the background is bone and trachea, there to orient, not to take the lead.') }}
            </p>
            <p class="text-[15px] text-tinta leading-relaxed mb-4">
              {{ L(
                'Longitud del catéter, portal→punta, en las tres fechas: 150,8 mm · 152,2 mm · 151,7 mm (± 5 mm cada medida; ± 10 mm en la diferencia entre fechas). Dentro de ese margen, es la misma medida las tres veces.',
                'Catheter length, port→tip, across the three dates: 150.8 mm · 152.2 mm · 151.7 mm (± 5 mm per measurement; ± 10 mm on the difference between dates). Within that margin, it is the same measurement all three times.') }}
            </p>
            <p class="text-[13px] text-tinta leading-relaxed">
              {{ L(
                'RECIST no aplica aquí: esto no es una lesión, es un catéter. La reconstrucción es semiautomática y no ha sido validada por radiología.',
                'RECIST does not apply here: this is not a lesion, it is a catheter. The reconstruction is semi-automatic and has not been validated by radiology.') }}
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
