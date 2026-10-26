<script setup lang="ts">
/**
 * Lesiones — mama, hígado y hueso de un vistazo.
 *
 * Traslada el visor del mapa de metástasis (mismo esquema del esqueleto, mismos focos,
 * mismo visor 3D BoneTriView; datos leídos del propio mapa en cada build vía #mapa-focos) y le suma el
 * hígado (visor 3D girable con todas sus lesiones: las dianas con la medida del radiólogo y el
 * resto como detección automática revisada por un radiólogo, sin informe firmado, igual que el vídeo) y la mama (medida del informe).
 * Sin interpretación añadida.
 * Herramienta de apoyo a la decisión — no es diagnóstico ni consejo médico.
 */
import { LES, PHENO, PHENO_TEXT, BONE3D_KEY } from '#mapa-focos'

const { locale } = useI18n()
const localePath = useLocalePath()
const { trackDatos, trackMapa, trackSupport, GOFUNDME_URL } = useSupport()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
/* Frase sellada del hígado (26-sep-26): una sola fuente para sus dos sitios. Texto sin tocar. */
const fraseRadiologo = computed(() => L('Un radiólogo, en lectura informal por DM y sin informe firmado, marcó 55 medidas en el hígado de este TC y las considera 55 lesiones distintas, muy sugestivas de metástasis, con dos salvedades suyas: en la imagen 127 hay tres lesiones que se tocan entre sí y él las cuenta como tres, y en la imagen 123 hay una pegada a la cápsula del hígado, que limita su crecimiento y la hace más difícil de valorar. Las 20 lesiones automáticas de Polaris están entre sus marcas; las otras 35 se ven abajo como puntos. El informe oficial dice M1 múltiples.', 'A radiologist, in an informal DM read and without a signed report, marked 55 measurements on the liver in this CT and considers them 55 distinct lesions, highly suggestive of metastases, with two caveats of his own: in image 127 there are three lesions touching each other, which he counts as three, and in image 123 there is one right against the liver capsule, which limits its growth and makes it harder to assess. Polaris’s 20 automatic lesions are among his marks; the other 35 are shown below as points. The official report says multiple M1.'))

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
  LES.some((l) => BONE3D_KEY[l.id] === meshKey.value && l.priorBiopsy) ? 'biopsia-previa' : null)
</script>

<template>
  <div class="overflow-x-clip">
    <section class="section-spacing" :aria-label="L('Mama, hígado y hueso', 'Breast, liver and bone')">
      <div class="section-wide">
        <!-- Sistema v3 (P1): shell .section-wide (el H1 cae bajo el logo; antes era un contenedor de 1280 con otro relleno), cabecera v3
             (H1 por rol, entradilla en .lede) y avisos con <Aviso>. -->
        <PageHeader
          variante="pagina"
          :parent="{ to: localePath({ name: 'herramientas' }), label: $t('nav.tools') }"
          :title="L('Mama, hígado y hueso, de un vistazo', 'Breast, liver and bone, at a glance')"
          :lede="L('La mama, el hígado y las lesiones óseas.', 'The breast, the liver and the bone lesions.')"
        >
          <!-- «En corto» (rediseño de arquitectura, F6, 23-oct-2026): lo primero que lee quien llega de una red, ≤ 40 palabras y con la
               FECHA DE LA FOTO. Se compone de frases que esta misma página ya publica: la fecha de las pruebas de mama e hígado
               (8-sep-2026, la de los pies y las descripciones de los visores; es la única frase que COMPONE), la de las pruebas del
               hueso y la del PET del 8-sep que aún no está incorporado, las dos ENTERAS y tal cual (sin ella, «de un vistazo» se lee como «al día»; ver
               el comentario de la sección Hueso). Sin cifras, sin el «55» del radiólogo (va con sus dos salvedades, abajo) y sin
               interpretación. No sustituye ni mueve nada de lo ya publicado: el aviso y el texto sellado de debajo siguen igual. -->
          <section class="mt-6 max-w-2xl" aria-labelledby="en-corto-titulo">
            <h2 id="en-corto-titulo" class="eyebrow mb-1 block">{{ L('En corto', 'In short') }}</h2>
            <p class="prosa">
              {{ L(
                'Mama e hígado: 8 de septiembre de 2026. Hueso: PET de marzo y mayo y RM de junio de 2026. El PET del 8 de septiembre, aún no incorporado, describe más lesiones óseas activas que las que se ven aquí.',
                'Breast and liver: 8 September 2026. Bone: PET scans from March and May and MRI from June 2026. The 8 September PET, not yet included, describes more active bone lesions than the ones shown here.') }}
            </p>
          </section>
        </PageHeader>

        <Aviso
          tipo="apoyo"
          class="mb-6"
          :aria-label="L('Aviso: herramienta de apoyo, no diagnóstico', 'Notice: support tool, not a diagnosis')"
          :titulo="L('Herramienta de APOYO a la decisión. No es diagnóstico ni consejo médico.', 'A decision-SUPPORT tool. Not a diagnosis or medical advice.')"
        >
          <p>{{ L(
            'Es el caso de Miriam, abierto para entender su enfermedad y decidir mejor con su equipo médico — no sustituye su criterio. Deciden sus médicos.',
            'This is Miriam’s case, opened to understand her disease and to decide better with her medical team — it does not replace their judgment. Her doctors decide.') }}</p>
        </Aviso>

        <!-- ===== MAMA E HÍGADO · medidas del informe; en el hígado, además, la detección automática ===== -->
        <div class="grid gap-6 md:grid-cols-2 items-start mb-10 lg:mb-6">
          <section class="card-base" aria-labelledby="mama-titulo">
            <h2 id="mama-titulo" class="h2-seccion mb-3">{{ L('Mama derecha', 'Right breast') }}</h2>
            <!-- data-visor / data-visor-accion: medición «Visor» (T2d; plugins/umami-visor.client.ts): la primera vez que alguien toca un visor. Solo atributos. -->
            <div class="mb-3" data-visor="lesiones" data-visor-accion="mama">
              <ClientOnly>
                <BreastView base="/lesiones/mama/" fallback="/lesiones/mama-2026-09-08.webp"
                  :fallback-alt="L('Reconstrucción 3D del tumor primario de mama de Miriam desde su resonancia del 8 de septiembre de 2026, dentro del tejido fibroglandular de la mama derecha', '3D reconstruction of Miriam’s primary breast tumour from her 8 September 2026 MRI, inside the fibroglandular tissue of the right breast')" />
                <template #fallback>
                  <div class="visor rounded-btn flex flex-col items-center justify-center gap-2 text-xs" data-tema="oscuro" style="aspect-ratio:1/1">
                    <span class="visor__carga anima-esencial" aria-hidden="true" />
                    {{ L('cargando visor…', 'loading viewer…') }}
                  </div>
                </template>
              </ClientOnly>
            </div>
            <p class="text-sm text-tinta leading-relaxed">
              {{ L('Tumor primario, medido en RM (13-jul → 8-sep-2026): 14 → 15 mm.', 'Primary tumor, measured on MRI (13 Jul → 8 Sep 2026): 14 → 15 mm.') }}
            </p>
          </section>
          <section class="card-base" aria-labelledby="higado-titulo">
            <h2 id="higado-titulo" class="h2-seccion mb-3">{{ L('Hígado', 'Liver') }}</h2>
            <div class="mb-3" data-visor="lesiones" data-visor-accion="higado">
              <ClientOnly>
                <LiverView base="/lesiones/higado/" fallback="/lesiones/higado-2026-09-08.webp"
                  :fallback-alt="L('Reconstrucción 3D del hígado de Miriam desde su TC del 8 de septiembre de 2026, con los vasos y las lesiones: dos lesiones diana con anillo y la medida del radiólogo (segmento II, 20 mm; segmento IVb, 19 mm) y el resto, lesiones detectadas automáticamente y revisadas por un radiólogo, que las ha confirmado (no constan en el informe oficial firmado)', '3D reconstruction of Miriam’s liver from her 8 September 2026 CT, with the vessels and the lesions: two ringed target lesions with the radiologist’s measurement (segment II, 20 mm; segment IVb, 19 mm) and the rest, lesions detected automatically and reviewed by a radiologist, who confirmed them (not in the signed official report)')" />
                <template #fallback>
                  <div class="visor rounded-btn flex flex-col items-center justify-center gap-2 text-xs" data-tema="oscuro" style="aspect-ratio:1/1">
                    <span class="visor__carga anima-esencial" aria-hidden="true" />
                    {{ L('cargando visor…', 'loading viewer…') }}
                  </div>
                </template>
              </ClientOnly>
            </div>
            <p class="text-sm text-tinta leading-relaxed">
              {{ L('Lesiones diana del informe de TC (13-jul → 8-sep-2026): segmento II 18 → 20 mm · segmento IVb 15 → 19 mm.', 'Target lesions in the CT report (13 Jul → 8 Sep 2026): segment II 18 → 20 mm · segment IVb 15 → 19 mm.') }}
            </p>
            <!-- Frase sellada (26-sep-26): revisión informal del TC del 8-sep por un radiólogo,
                 con sus dos salvedades (imagen 127: tres lesiones que se tocan, las cuenta como
                 tres; imagen 123: subcapsular, más difícil de valorar). No decir «55 metástasis»
                 ni que «todas han aparecido o crecido». Copy ya publicado — cambia con el gate de
                 salida (Miriam entiende y mergea el PR). -->
            <p class="text-sm text-tinta leading-relaxed mt-2 lg:hidden">
              {{ fraseRadiologo }}
            </p>
          </section>
        </div>
        <!-- T3-BARRIDO (L290): desde `lg`, la frase sellada del hígado va bajo las dos tarjetas: dentro de la del hígado la dejaba 249 px más alta que la de la mama y
             abría un hueco bajo «Mama derecha». Por debajo de `lg` sigue dentro de su tarjeta (copia de arriba, `lg:hidden`); `hidden` saca del árbol de
             accesibilidad la que no se ve, así que no se lee dos veces. -->
        <p class="hidden lg:block measure text-sm text-tinta leading-relaxed mb-10">
          {{ fraseRadiologo }}
        </p>

        <!-- ===== HUESO · el visor del mapa de metástasis, trasladado ===== -->
        <section class="mb-10" aria-labelledby="hueso-titulo">
          <h2 id="hueso-titulo" class="h2-seccion mb-2">
            {{ L('Hueso', 'Bone') }}
          </h2>
          <!-- Fechas de los estudios del mapa (su propia cabecera): sin esto, «de un vistazo»
               se leía como «al día», y el PET del 8-sep aún no está en el mapa (verificacion, 19-sep).
               20-sep: decir «aún no incorporado» se quedaba corto. Ese PET no solo falta, CAMBIA el
               cuadro: concluye «progresión ósea por aparición de nuevas lesiones activas», con más
               lesiones activas en columna, escápula derecha, costillas, pelvis y ambos fémures. Con
               tráfico de campaña, un aviso neutro se lee como el estado de hoy. -->
          <p class="text-sm text-tinta leading-relaxed measure mb-4">
            {{ L('PET de marzo y mayo y RM de junio de 2026. El PET del 8 de septiembre, aún no incorporado, describe más lesiones óseas activas que las que se ven aquí.', 'PET scans from March and May and MRI from June 2026. The 8 September PET, not yet included, describes more active bone lesions than the ones shown here.') }}
          </p>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start">
            <div class="card-base !p-4" data-visor="lesiones" data-visor-accion="foco">
              <EsqueletoFocos :selected="selected" @pick="selected = $event" />
            </div>
            <div class="min-w-0 lg:sticky lg:sticky-bajo-cabecera lg:self-start">
              <p class="eyebrow mb-1">#{{ sel.id }} · {{ sel.region[lang] }}</p>
              <p class="h3-seccion mb-1">{{ sel.level[lang] }}</p>
              <p class="text-sm font-semibold mb-2" :style="{ color: PHENO_TEXT[sel.pheno] }">{{ L(PHENO[sel.pheno].es, PHENO[sel.pheno].en) }}</p>
              <p class="text-sm text-tinta leading-relaxed measure mb-4">{{ sel.what[lang] }}</p>
              <div role="group" :aria-label="L('Visor 3D del foco seleccionado', '3D viewer of the selected focus')" data-visor="lesiones" data-visor-accion="hueso">
                <ClientOnly v-if="meshKey">
                  <BoneTriView :mesh-key="meshKey" :biopsied="biopsia != null" :no-target="sel.source === 'ia-david'" :biopsy-label="biopsia ?? undefined" />
                  <template #fallback>
                    <div class="visor rounded-btn flex flex-col items-center justify-center gap-2 text-xs" data-tema="oscuro" style="aspect-ratio:12/5">
                      <span class="visor__carga anima-esencial" aria-hidden="true" />
                      {{ L('cargando visor…', 'loading viewer…') }}
                    </div>
                  </template>
                </ClientOnly>
              </div>
              <!-- T2a (24-oct-2026): el mapa vuelve a ser una página viva, y vuelve el enlace que F4 quitó de aquí porque el mapa
                   se había quedado sin enlaces internos. Mismo texto de siempre; la flecha es un icono y no el glifo «→». -->
              <NuxtLink :to="localePath('mapa-metastasis')" class="link-action group mt-2 text-miriam" @click="trackMapa('lesiones')">
                {{ L('Ver este foco con todo el detalle en el mapa de metástasis', 'See this focus in full detail on the metastasis map') }}
                <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </section>

        <!-- ===== CIERRE DE APOYO (F6, 23-oct-2026) · estático (sin JS ni ClientOnly): en móvil es el ÚNICO «Apoyar» de la
             página, porque la barra «Donar» está silenciada aquí (useSupportBarRoute: /lesiones es herramienta de inmersión) y la
             cabecera lo guarda tras el menú. Los dos botones son los del hero de la home: «Apoyar a Miriam» (coral, GoFundMe) y
             «Entender el caso» (a #caso, en la home). Es un bloque NUEVO: el cierre de enlaces de debajo no se toca. ===== -->
        <section class="card-base mb-10" aria-labelledby="cierre-apoyo-titulo">
          <h2 id="cierre-apoyo-titulo" class="h2-seccion mb-4">{{ L('Qué puedes hacer', 'What you can do') }}</h2>
          <div class="flex flex-col sm:flex-row gap-3">
            <a
              :href="GOFUNDME_URL"
              target="_blank"
              rel="noopener noreferrer"
              data-support-cta
              class="btn-cta justify-center"
              @click="trackSupport('lesiones_cierre')"
            >
              <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
              {{ $t('nav.donate') }}
              <span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
            </a>
            <NuxtLink :to="localePath({ name: 'index', hash: '#caso' })" class="btn-secondary justify-center">
              {{ $t('hero.cta_understand') }}
              <Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>

        <!-- ===== CIERRE · el reservorio no es enfermedad, es infraestructura del tratamiento: eje propio, página propia (/reservorio;
             F4 la plegó en /datos el 23-oct-2026 y T2a la devolvió a su página el 24-oct). Solo el enlace, aquí. El texto del enlace
             es el que dejó F4 (el H1 de la página): la frase sellada de antes («…en 3D: medido en tres TC…») no se restaura, queda
             a la gate G4 de Miriam. ===== -->
        <section class="mt-2 pt-6 border-t flex flex-col items-start">
          <NuxtLink :to="localePath('datos')" class="link-action group text-miriam" @click="trackDatos('lesiones')">
            {{ L('El caso en datos: analíticas desde 2021, tratamientos y tejido disponible', 'The case in data: labs since 2021, treatments and available tissue') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink :to="localePath('reservorio')" class="link-action group text-miriam">
            {{ L('El reservorio: qué es y por qué se cambió', 'The port: what it is and why it was replaced') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </NuxtLink>
        </section>
      </div>
    </section>
  </div>
</template>
