<script setup lang="ts">
/**
 * Reservorio — «medir para descartar», no gravedad. El puerto de acceso venoso dejó de dar retorno; en vez de asumir que el
 * catéter se había movido, su trayecto se reconstruyó sobre el TC de tres fechas separadas por meses. La punta sale en el
 * mismo sitio las tres veces.
 *
 * Página PROPIA, no una cuarta tarjeta en /lesiones: esa página tiene un solo eje (dónde está la enfermedad) y el reservorio es
 * infraestructura del tratamiento, con su propio arco. /lesiones la enlaza al final; no la contiene (comité de diseño, 24-sep-2026).
 *
 * 17-oct-2026, nuevo enfoque pedido por Miriam: la página explica QUÉ ES un port-a-cath, cuál lleva ella (PowerPort isp de titanio,
 * confirmado por la etiqueta del implante el 24-sep-2026), qué lo hace distinto de un reservorio convencional (admite inyección a
 * presión) y QUÉ LE PASA (oclusión de retirada). «No se ha movido» pasa a ser la comprobación que se hizo primero, no el titular.
 * El modelo se nombra porque ella lo pidió; la marca es del fabricante, no un tercero.
 *
 * 22-oct-2026, recambio: el reservorio se cambió por otro en octubre de 2026 (informe de radiología cotejado contra el original:
 * retirada, uno nuevo «mismo tamaño» en el bolsillo previo, colocación y funcionamiento comprobados con fluoroscopia). El 3D queda
 * como HISTÓRICO del catéter anterior. Del nuevo no se afirma modelo, ni que dé sangre, ni por dónde van las analíticas: el informe
 * no lo dice. Sin calibre, ni hospital, ni día.
 *
 * 24-oct-2026 (tanda 2 del rediseño, T2a): F4 había fusionado esta página en un bloque plegado de /datos (sin 3D, con un 302);
 * Miriam decidió que vuelve a ser una página viva e indexable, con el 3D, y que el bloque de /datos pasa a ser un enlace.
 *   · Una línea arriba, la suya, con cuándo y para qué se usó.
 *   · El motivo del recambio que da el informe de radiología intervencionista del 21-oct (cotejado el 24-oct contra el original), que
 *     F4 había dejado solo en /datos: «PAC acortado a tronco innominado», citado literal en español. En inglés se glosa como lo que
 *     es, un catéter corto que terminaba a la altura de la vena innominada (braquiocefálica); NO «innominate trunk» (decisión 6).
 *   · Las medidas ya no están escritas a mano: salen de caso.json, con la misma comprobación fail-closed que tenía el bloque de
 *     /datos (solo con las tres fechas de siempre y, para decir «es la misma medida», si la diferencia cabe en el margen).
 */
import { numCaso } from '~/utils/datosCaso'

const { locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const seoTitle = () => L('El reservorio: qué es y por qué se cambió — el caso de Miriam', 'The port: what it is and why it was replaced — Miriam’s case')
const seoDescription = () => copyHerramienta('port', locale.value)[1]
useSeoMeta({
  title: seoTitle, description: seoDescription, ogTitle: seoTitle, ogDescription: seoDescription,
  ogType: 'website', twitterCard: 'summary_large_image', twitterTitle: seoTitle, twitterDescription: seoDescription,
})

// Las medidas del catéter, de caso.json (sin copiar números a mano: un solo reloj). Import dinámico dentro de useAsyncData, como la
// home: el JSON pesa ~230 KB y aquí solo viaja en el payload la frase. Fail-closed: sin las tres fechas, o con una cifra que no es un
// número, no se dice nada; y «es la misma medida las tres veces» solo si la diferencia cabe en el margen de la medida.
interface Medida { longitud_mm: number; margen_mm: number }
const { data: medidas } = await useAsyncData(
  `reservorio-medidas-${locale.value}`,
  async () => {
    const caso = (await import('~/data/caso.json')).default as unknown as { reservorio?: Medida[] }
    const r = caso.reservorio ?? []
    if (r.length !== 3) return ''
    const margen = Math.max(...r.map((x) => Number(x.margen_mm)))
    const valores = r.map((x) => Number(x.longitud_mm))
    if (!Number.isFinite(margen) || valores.some((v) => !Number.isFinite(v))) return ''
    const redondeo = (v: number) => numCaso(v, lang.value)
    const lista = valores.map((v) => `${redondeo(v)} mm`).join(' · ')
    const igual = Math.max(...valores) - Math.min(...valores) <= 2 * margen
    return lang.value === 'en'
      ? `Catheter length, port→tip, across the three dates: ${lista} (± ${redondeo(margen)} mm per measurement; ± ${redondeo(2 * margen)} mm on the difference between dates).${igual ? ' Within that margin, it is the same measurement all three times.' : ''}`
      : `Longitud del catéter, portal→punta, en las tres fechas: ${lista} (± ${redondeo(margen)} mm cada medida; ± ${redondeo(2 * margen)} mm en la diferencia entre fechas).${igual ? ' Dentro de ese margen, es la misma medida las tres veces.' : ''}`
  },
  { watch: [locale], default: () => '' },
)

// Los tres bloques del nuevo enfoque (17-oct-2026). Hechos cotejados con las notas del caso: modelo por la etiqueta del implante
// (24-sep); «power injectable» y forma triangular, web de BD; oclusión de retirada y vaina de fibrina, dossier del 24-sep (el equipo
// habló de vaina; no confirmada). Sin cifras de la literatura, sin hospital ni fechas de intervención.
// verificacion (17-oct): el contraste por el port no se vende como ventaja vigente (el comité del 24-sep desaconsejó inyectar sin
// retorno); «funda de tejido», no «fibrina» (a las semanas ya no lo es).
const bloques = computed(() => [
  {
    id: 'que-es',
    titulo: L('Qué es un port-a-cath', 'What a port-a-cath is'),
    texto: L(
      'Es una cámara pequeña que se implanta bajo la piel del pecho, unida a un catéter fino que llega hasta una vena grande, cerca del corazón. Se pincha a través de una membrana con una aguja especial, y la membrana se cierra al sacarla. No asoma nada fuera del cuerpo. Miriam lo lleva porque las venas de sus brazos son difíciles de pinchar.',
      'It’s a small chamber implanted under the skin of the chest, joined to a thin catheter that runs to a large vein near the heart. A special needle goes in through a membrane, and the membrane seals again when the needle comes out. Nothing sticks out of the body. Miriam has one because the veins in her arms are hard to get a needle into.'),
  },
  {
    id: 'el-suyo',
    titulo: L('El primero: un PowerPort de titanio', 'The first one: a titanium PowerPort'),
    texto: L(
      'Estaba diseñado para admitir inyección a presión, como la del contraste de un TC, que entra muy rápido. No todos los reservorios lo admiten. Tenía forma triangular y unos bultitos que se notaban al tacto, para que quien lo pinchaba supiera de qué tipo era y dónde estaba la membrana. Del nuevo se sabe que su catéter es del mismo grosor que el anterior; el modelo no consta.',
      'It was built to take injection under pressure, like the contrast for a CT scan, which goes in very fast. Not every port can. It was triangular, with small bumps you could feel, so whoever accessed it knew what type it was and where the membrane was. The new one’s catheter is the same gauge as the old one; the model isn’t on record.'),
  },
  {
    id: 'que-le-paso',
    titulo: L('Qué le pasó y qué se hizo', 'What went wrong and what was done'),
    texto: L(
      'Por él entraba la medicación, pero no salía sangre, ni siquiera después de un fármaco para disolver coágulos. Eso se llama oclusión de retirada. En octubre de 2026 se lo quitaron y le pusieron otro en el mismo sitio, bajo la piel. Con rayos X se comprobó la colocación y que funcionaba al terminar.',
      'Medication went in, but blood wouldn’t come out, not even after a drug to dissolve clots. That’s called a withdrawal occlusion. In October 2026 it was taken out and a new one was put in the same place, under the skin. An X-ray check confirmed its position and that it was working when they finished.'),
    // El motivo, tal como lo recoge el informe de radiología del recambio (cotejado el 24-oct contra el original).
    motivo: L(
      'El informe de radiología del recambio da como motivo «PAC acortado a tronco innominado»: el catéter se quedaba corto.',
      'The radiology report of the replacement gives as its reason «PAC acortado a tronco innominado» (in Spanish in the report): a short catheter that ended at the level of the innominate (brachiocephalic) vein.'),
  },
])

defineOgImage('Default.takumi', {
  title: seoTitle,
  description: () => L('Un port-a-cath por dentro: qué es, qué le pasó al suyo y cómo se cambió.', 'A port-a-cath, from the inside: what it is, what went wrong with hers and how it was replaced.'),
})
</script>

<template>
  <div class="overflow-x-clip">
    <!-- Bandas alternas (DS §3): crema, tarjeta, crema; la salida común que pinta el layout detrás va en tarjeta. -->
    <Banda tono="crema" compacta>
      <PageHeader
        :parent="{ to: localePath({ name: 'herramientas' }), label: $t('nav.tools') }"
        :eyebrow="L('Infraestructura del tratamiento', 'Treatment infrastructure')"
        :title="L('El reservorio: qué es y por qué se cambió', 'The port: what it is and why it was replaced')"
        :lede="L(
          'Miriam lleva un port-a-cath desde 2024: un reservorio bajo la piel que da acceso a una vena grande sin tener que pinchar cada vez las del brazo. El primero dejó de dar sangre y en octubre de 2026 se lo cambiaron por otro.',
          'Miriam has had a port-a-cath since 2024: a small reservoir under the skin that gives direct access to a large vein, so her arm doesn’t need a new needle every time. The first one stopped giving blood back, and in October 2026 it was replaced.')"
        variante="pagina"
      />
      <!-- La línea de Miriam (24-oct-2026): cuándo se usó y para qué. La misma que lleva su tarjeta en /herramientas. -->
      <Aviso tipo="limites" :titulo="$t('herramientas.pasada_titulo')">
        <p>{{ $t('herramientas.linea_port') }}</p>
      </Aviso>
    </Banda>

    <Banda tono="tarjeta" titular="res-que-es">
      <div class="res-tres">
        <section v-for="b in bloques" :key="b.id" :aria-labelledby="`res-${b.id}`">
          <CabeceraSeccion :id="`res-${b.id}`" :titulo="b.titulo" />
          <div class="res-cuerpo">
            <p class="prosa">{{ b.texto }}</p>
            <p v-if="b.motivo" class="prosa res-motivo">{{ b.motivo }}</p>
          </div>
        </section>
      </div>
    </Banda>

    <Banda tono="crema" titular="res-medido">
      <p class="etiqueta res-historico">{{ L('Histórico', 'Archive') }}</p>
      <CabeceraSeccion id="res-medido" :titulo="L('El catéter anterior, medido en tres TC', 'The previous catheter, measured on three CT scans')" />
      <p class="prosa res-parrafo">
        {{ L(
          'Cuando un reservorio deja de dar sangre, lo primero que se piensa es que el catéter se ha desplazado. Antes de darlo por hecho, se reconstruyó el trayecto del primero en tres TC separados por meses. La punta sale en el mismo sitio las tres veces: entre esas fechas no se desplazó, dentro del margen de la medida. Eso solo dice que no cambió de sitio; no dice si ese sitio era el mejor, y el 3D no responde a eso. Este modelo es del reservorio anterior; el nuevo todavía no tiene reconstrucción.',
          'When a port stops giving blood back, the first suspect is a catheter that has shifted. Before assuming that, the first one’s path was rebuilt on three CT scans taken months apart. The tip lands in the same spot all three times: it didn’t shift between those dates, within the measurement margin. That only says it stayed put; it doesn’t say whether that spot was the best one, and the 3D can’t answer that. This model shows the previous port; the new one hasn’t been reconstructed yet.') }}
      </p>

      <Aviso tipo="apoyo" :titulo="L('Herramienta de apoyo a la decisión', 'A decision-support tool')">
        <p>{{ L('No es diagnóstico ni consejo médico.', 'Not a diagnosis or medical advice.') }}</p>
      </Aviso>

      <div class="res-visor-fila">
        <div class="res-visor-caja">
          <ClientOnly>
            <ReservoirView base="/reservorio/" />
            <template #fallback>
              <div class="visor res-visor-espera" data-tema="oscuro" role="status">
                <div class="visor__velo">
                  <span class="visor__carga" aria-hidden="true" />
                  <span class="sr-only">{{ L('cargando visor…', 'loading viewer…') }}</span>
                </div>
              </div>
            </template>
          </ClientOnly>
        </div>

        <div class="res-texto">
          <p class="prosa">
            {{ L(
              'El modelo sale de sus propios TC. El portal y la punta están medidos directamente en el corte; el tramo de en medio es la ruta más probable entre los dos, interpolada.',
              'The model comes from her own CT scans. The port and the tip are measured directly on the slice; the stretch between them is the most likely route, interpolated.') }}
          </p>
          <p v-if="medidas" class="prosa">{{ medidas }}</p>
          <p class="res-nota">
            {{ L(
              'RECIST no aplica aquí, porque mide lesiones y esto es un catéter. La reconstrucción es semiautomática y radiología no la ha validado.',
              'RECIST does not apply here, since it measures lesions and this is a catheter. The reconstruction is semi-automatic and radiology has not validated it.') }}
          </p>
          <NuxtLink :to="localePath('lesiones')" class="link-action group">
            <Icon name="ph:arrow-left" class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            {{ L('Volver a mama, hígado y hueso', 'Back to breast, liver and bone') }}
          </NuxtLink>
        </div>
      </div>
    </Banda>
  </div>
</template>

<style scoped>
/* Tres bloques: una columna en móvil y en tableta, tres desde 1024. Cada uno con su H2 de capítulo. */
.res-tres { display: grid; gap: var(--sp-48) var(--sp-32); grid-template-columns: minmax(0, 1fr); }
.res-tres .prosa { margin: 0; }
/* T3-BARRIDO (L291): tres columnas desde `xl` (1280), no desde `lg`: a 1024 cada columna medía unos 285 px (33 caracteres) y «PowerPort de titanio» salía en tres líneas.
   Entre 1024 y 1279 los tres bloques van en una columna, como por debajo de `lg`. Desde `xl` cada bloque es un subgrid de dos filas (titular y cuerpo), así que el
   primer párrafo de las tres columnas arranca a la misma altura aunque un titular ocupe una línea y otro dos o tres; sin subgrid, quedan como estaban. */
@media (min-width: 1280px) {
  .res-tres { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto auto; row-gap: 0; }
  .res-tres > section { display: grid; grid-template-rows: subgrid; grid-row: span 2; }
}
.res-cuerpo { min-width: 0; }
/* El margen de `.res-motivo` (12 px) lo anulaba `.res-tres .prosa { margin: 0 }`, que tiene más especificidad: el párrafo del motivo pegaba sin aire al anterior.
   Se restituye desde `lg`; por debajo queda como estaba (el móvil no se toca en esta tanda: excepción pendiente). */
@media (min-width: 1024px) { .res-tres .res-motivo { margin-top: var(--sp-12); } }

.res-historico { margin: 0 0 var(--sp-12); color: var(--identidad); }
.res-parrafo { margin: 0 0 var(--sp-24); max-width: var(--measure); }

.res-visor-fila { display: grid; gap: var(--sp-32); margin-top: var(--sp-32); grid-template-columns: minmax(0, 1fr); align-items: start; }
@media (min-width: 1024px) { .res-visor-fila { grid-template-columns: minmax(0, 560px) minmax(0, 1fr); } }
.res-visor-caja { width: 100%; max-width: 560px; margin-inline: auto; }
@media (min-width: 1024px) { .res-visor-caja { margin-inline: 0; } }
.res-visor-espera { aspect-ratio: 1 / 1; }
.res-texto { min-width: 0; display: flex; flex-direction: column; gap: var(--sp-16); align-items: flex-start; }
.res-texto .prosa { margin: 0; }
.res-nota { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); }
</style>
