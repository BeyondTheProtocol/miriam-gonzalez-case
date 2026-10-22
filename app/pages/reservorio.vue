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
 * 17-oct-2026, nuevo enfoque pedido por Miriam: la página explica QUÉ ES un port-a-cath, cuál
 * lleva ella (PowerPort isp de titanio, confirmado por la etiqueta del implante el 24-sep-2026),
 * qué lo hace distinto de un reservorio convencional (admite inyección a presión) y QUÉ LE PASA
 * (oclusión de retirada). «No se ha movido» pasa a ser la comprobación que se hizo primero, no el
 * titular. El modelo se nombra porque ella lo pidió; la marca es del fabricante, no un tercero.
 *
 * Lo que sigue sin enseñarse, a propósito: hospital o profesionales, número de intentos de
 * desobstrucción ni fechas de intervención. Solo mallas (visor3d.py `web-reservorio`): cero DICOM,
 * cero cabeceras, cero metadatos del estudio.
 *
 * 22-oct-2026, recambio: el reservorio se cambió por otro en octubre de 2026 (informe de
 * radiología cotejado contra el original: retirada, uno nuevo «mismo tamaño» en el bolsillo previo,
 * colocación y funcionamiento comprobados con fluoroscopia). La página pasa a contar el primero en
 * pasado y el 3D queda como HISTÓRICO del catéter anterior (badge status-badge--reference, diseno 22-oct). Del nuevo no se afirma modelo, ni que dé
 * sangre, ni por dónde van las analíticas: el informe no lo dice. Sin calibre, ni hospital, ni día.
 * Fuera también la causa probable (funda de tejido): el informe del recambio no la nombra.
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'The port: what it is and why it was replaced — Miriam’s case'
    : 'El reservorio: qué es y por qué se cambió — el caso de Miriam'
const seoDescription = () =>
  lang.value === 'en'
    ? 'What a port-a-cath is, which one Miriam had (a PowerPort, built to take contrast injected under pressure), why it stopped giving blood back and how it was replaced in October 2026. With the old catheter’s path in 3D.'
    : 'Qué es un port-a-cath, cuál llevaba Miriam (un PowerPort, diseñado para admitir contraste inyectado a presión), por qué dejó de dar sangre y cómo se cambió por otro en octubre de 2026. Con el trayecto del catéter anterior en 3D.'
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
// Los tres bloques del nuevo enfoque (17-oct-2026). Hechos cotejados con las notas del caso:
// modelo por la etiqueta del implante (24-sep); «power injectable» y forma triangular, web de BD;
// oclusión de retirada y vaina de fibrina, dossier del 24-sep (el equipo habló de vaina; no
// confirmada). Sin cifras de la literatura, sin hospital ni fechas de intervención.
// verificacion (17-oct): el contraste por el port no se vende como ventaja vigente (el comité del
// 24-sep desaconsejó inyectar sin retorno); «funda de tejido», no «fibrina» (a las semanas ya no lo es).
const bloques = computed(() => [
  {
    id: 'que-es', icono: 'ph:heartbeat-fill',
    titulo: L('Qué es un port-a-cath', 'What a port-a-cath is'),
    texto: L(
      'Es una cámara pequeña que se implanta bajo la piel del pecho, unida a un catéter fino que llega hasta una vena grande, cerca del corazón. Se pincha a través de una membrana con una aguja especial, y la membrana se cierra al sacarla. No asoma nada fuera del cuerpo. Miriam lo lleva porque las venas de sus brazos son difíciles de pinchar.',
      'It’s a small chamber implanted under the skin of the chest, joined to a thin catheter that runs to a large vein near the heart. A special needle goes in through a membrane, and the membrane seals again when the needle comes out. Nothing sticks out of the body. Miriam has one because the veins in her arms are hard to get a needle into.'),
  },
  {
    id: 'el-suyo', icono: 'ph:lightning-fill',
    titulo: L('El primero: un PowerPort de titanio', 'The first one: a titanium PowerPort'),
    texto: L(
      'Estaba diseñado para admitir inyección a presión, como la del contraste de un TC, que entra muy rápido. No todos los reservorios lo admiten. Tenía forma triangular y unos bultitos que se notaban al tacto, para que quien lo pinchaba supiera de qué tipo era y dónde estaba la membrana. Del nuevo se sabe que su catéter es del mismo grosor que el anterior; el modelo no consta.',
      'It was built to take injection under pressure, like the contrast for a CT scan, which goes in very fast. Not every port can. It was triangular, with small bumps you could feel, so whoever accessed it knew what type it was and where the membrane was. The new one’s catheter is the same gauge as the old one; the model isn’t on record.'),
  },
  {
    id: 'que-le-paso', icono: 'ph:arrows-clockwise-fill',
    titulo: L('Qué le pasó y qué se hizo', 'What went wrong and what was done'),
    texto: L(
      'Por él entraba la medicación, pero no salía sangre, ni siquiera después de un fármaco para disolver coágulos. Eso se llama oclusión de retirada. En octubre de 2026 se lo quitaron y le pusieron otro en el mismo sitio, bajo la piel. Con rayos X se comprobó la colocación y que funcionaba al terminar.',
      'Medication went in, but blood wouldn’t come out, not even after a drug to dissolve clots. That’s called a withdrawal occlusion. In October 2026 it was taken out and a new one was put in the same place, under the skin. An X-ray check confirmed its position and that it was working when they finished.'),
  },
])

defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => lang.value === 'en'
    ? 'A port-a-cath, from the inside: what it is, what went wrong with hers and how it was replaced.'
    : 'Un port-a-cath por dentro: qué es, qué le pasó al suyo y cómo se cambió.',
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('El catéter del reservorio, en 3D', 'The port catheter, in 3D')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :parent="{ to: localePath({ name: 'herramientas' }), label: $t('nav.tools') }"
          :tag="L('Infraestructura del tratamiento', 'Treatment infrastructure')"
          :title="L(
      'El reservorio: qué es y por qué se cambió',
      'The port: what it is and why it was replaced')"
          :subtitle="L(
      'Miriam lleva un port-a-cath desde 2024: un reservorio bajo la piel que da acceso a una vena grande sin tener que pinchar cada vez las del brazo. El primero dejó de dar sangre y en octubre de 2026 se lo cambiaron por otro.',
      'Miriam has had a port-a-cath since 2024: a small reservoir under the skin that gives direct access to a large vein, so her arm doesn’t need a new needle every time. The first one stopped giving blood back, and in October 2026 it was replaced.')"
        />

        <div class="grid gap-4 md:grid-cols-3 mb-10">
          <section v-for="b in bloques" :key="b.id" class="card-base" :aria-labelledby="`res-${b.id}`">
            <span class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center mb-3" aria-hidden="true">
              <Icon :name="b.icono" class="w-5 h-5 text-berenjena" />
            </span>
            <h2 :id="`res-${b.id}`" class="font-display font-semibold text-berenjena text-xl leading-snug mb-2">{{ b.titulo }}</h2>
            <p class="text-[15px] text-tinta leading-relaxed">{{ b.texto }}</p>
          </section>
        </div>

        <span class="status-badge status-badge--reference mb-2">{{ L('Histórico', 'Archive') }}</span>
        <h2 class="font-display font-semibold text-berenjena text-2xl mb-2">
          {{ L(
      'El catéter anterior, medido en tres TC',
      'The previous catheter, measured on three CT scans') }}
        </h2>
        <p class="text-[15px] text-tinta leading-relaxed mb-6 max-w-3xl">
          {{ L(
      'Cuando un reservorio deja de dar sangre, lo primero que se piensa es que el catéter se ha desplazado. Antes de darlo por hecho, se reconstruyó el trayecto del primero en tres TC separados por meses. La punta sale en el mismo sitio las tres veces: entre esas fechas no se desplazó, dentro del margen de la medida. Eso solo dice que no cambió de sitio; no dice si ese sitio era el mejor, y el 3D no responde a eso. Este modelo es del reservorio anterior; el nuevo todavía no tiene reconstrucción.',
      'When a port stops giving blood back, the first suspect is a catheter that has shifted. Before assuming that, the first one’s path was rebuilt on three CT scans taken months apart. The tip lands in the same spot all three times: it didn’t shift between those dates, within the measurement margin. That only says it stayed put; it doesn’t say whether that spot was the best one, and the 3D can’t answer that. This model shows the previous port; the new one hasn’t been reconstructed yet.') }}
        </p>

        <div class="alert-callout mb-6" role="note" :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')">
          <p class="alert-callout__title">
            <Icon name="ph:info-fill" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.') }}
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] items-start">
          <div class="max-w-[560px] mx-auto lg:mx-0 w-full">
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
