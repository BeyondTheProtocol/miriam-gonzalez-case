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
 */
const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () =>
  lang.value === 'en'
    ? 'The port: what it is and what is wrong with it — Miriam’s case'
    : 'El reservorio: qué es y qué le pasa — el caso de Miriam'
const seoDescription = () =>
  lang.value === 'en'
    ? 'What a port-a-cath is, why hers, a PowerPort, can take contrast injected under pressure, and why it now lets medication in but no blood out. With the catheter path in 3D.'
    : 'Qué es un port-a-cath, por qué el suyo, un PowerPort, admite contraste inyectado a presión, y por qué ahora deja meter medicación pero no sacar sangre. Con el trayecto del catéter en 3D.'
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})
// Los tres bloques del nuevo enfoque (17-oct-2026). Hechos cotejados con las notas del caso:
// modelo por la etiqueta del implante (24-sep); «power injectable» y forma triangular, web de BD;
// oclusión de retirada y vaina de fibrina, dossier del 24-sep (el equipo habló de vaina; no
// confirmada). Sin cifras de la literatura, sin hospital ni fechas de intervención.
const bloques = computed(() => [
  {
    id: 'que-es', icono: 'ph:heartbeat-fill',
    titulo: L('Qué es un port-a-cath', 'What a port-a-cath is'),
    texto: L(
      'Es una cámara pequeña que se implanta bajo la piel del pecho, unida a un catéter fino que llega hasta una vena grande, cerca del corazón. Se pincha a través de una membrana con una aguja especial, y la membrana se cierra al sacarla. No asoma nada fuera del cuerpo. Miriam lo lleva porque las venas de sus brazos son difíciles de pinchar.',
      'It is a small chamber implanted under the skin of the chest, joined to a thin catheter that runs to a large vein near the heart. It is accessed through a membrane with a special needle, and the membrane seals again when the needle comes out. Nothing sticks out of the body. Miriam has one because the veins in her arms are hard to access.'),
  },
  {
    id: 'el-suyo', icono: 'ph:lightning-fill',
    titulo: L('El suyo: un PowerPort de titanio', 'Hers: a titanium PowerPort'),
    texto: L(
      'A diferencia de muchos reservorios convencionales, admite inyección a presión: por él puede entrar el contraste de un TAC, que se inyecta muy rápido, y así se ahorra otra vía en el brazo. Tiene forma triangular y unos bultos que se notan al tacto, para que quien lo pincha sepa de qué tipo es y dónde está la membrana. Es de titanio y se puede hacer una resonancia con él, en ciertas condiciones.',
      'Unlike many conventional ports, it can take injection under pressure: the contrast for a CT scan, which goes in very fast, can be given through it, which spares another line in the arm. It has a triangular shape and small bumps you can feel, so whoever accesses it knows what type it is and where the membrane is. It is made of titanium and MRI scans are possible with it, under certain conditions.'),
  },
  {
    id: 'que-le-pasa', icono: 'ph:warning-circle-fill',
    titulo: L('Qué le pasa ahora', 'What is wrong with it now'),
    texto: L(
      'Deja meter medicación, pero no sacar sangre, ni siquiera después de un fármaco para disolver coágulos. Tiene nombre: oclusión de retirada. La causa más habitual es una capa fina de fibrina en la punta del catéter, que hace de válvula: deja salir el líquido y se pega al orificio cuando se aspira. Su equipo médico lo está valorando. Mientras tanto, cada analítica va por una vena del brazo.',
      'Medication goes in, but blood will not come out, not even after a drug to dissolve clots. It has a name: withdrawal occlusion. The most common cause is a thin layer of fibrin at the catheter tip that acts like a valve: it lets fluid out and sticks to the opening when you pull back. Her medical team is looking into it. In the meantime, every blood test goes through a vein in her arm.'),
  },
])

defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => lang.value === 'en'
    ? 'A port-a-cath, from the inside: what it is and what is wrong with it.'
    : 'Un port-a-cath por dentro: qué es y qué le pasa.',
})
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('El catéter del reservorio, en 3D', 'The reservoir catheter, in 3D')">
      <div class="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <PageHeader
          :parent="{ to: localePath({ name: 'herramientas' }), label: $t('nav.tools') }"
          :tag="L('Infraestructura del tratamiento', 'Treatment infrastructure')"
          :title="L('El reservorio: qué es y qué le pasa', 'The port: what it is and what is wrong with it')"
          :subtitle="L(
            'Miriam lleva un port-a-cath desde 2024: un reservorio bajo la piel que da acceso a una vena grande sin tener que pinchar cada vez las del brazo. Ahora deja meter medicación, pero no sacar sangre.',
            'Miriam has had a port-a-cath since 2024: a small reservoir under the skin that gives access to a large vein without needling the arm every time. Right now it lets medication in, but no blood out.')"
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

        <h2 class="font-display font-semibold text-berenjena text-2xl mb-2">
          {{ L('Lo primero: descartar que el catéter se hubiera movido', 'First: ruling out that the catheter had moved') }}
        </h2>
        <p class="text-[15px] text-tinta leading-relaxed mb-6 max-w-3xl">
          {{ L(
            'Cuando un reservorio deja de dar sangre, lo primero que se piensa es que el catéter se ha desplazado. Antes de darlo por hecho se reconstruyó su trayecto en tres TC separados por meses. La punta sale en el mismo sitio las tres veces, y eso no cuadra con un catéter desplazado.',
            'When a port stops giving blood, the first suspicion is that the catheter has shifted. Before assuming that, its path was rebuilt on three CT scans, months apart. The tip lands in the same place all three times, which does not fit a displaced catheter.') }}
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
