<template>
  <div>
    <section class="section-spacing ci-zona-a" :aria-label="$t('science.title')">
      <div class="section-wide">
        <!-- Sin conmutador (tanda 2, T2c, 24-oct-2026). El conmutador «para mentes curiosas / para profesionales» salió: la capa
             llana vive en la home (y desde la fase «llano» de la tanda 3, 25-oct-2026, también aquí arriba, como bloque propio y no como modo), y aquí quedan la lectura profesional, lo que se busca y el acceso a las herramientas. ?nivel= ya no hace nada
             (los enlaces antiguos siguen abriendo la página, y el #ancla de cada uno recibe el foco). Índice pegajoso a la izquierda (lg+) y
             desplegable «Saltar a…» en móvil. Sistema v3 (P1): la cabecera va ENCIMA de la rejilla, a todo el ancho del shell, porque el borde
             izquierdo del H1 cae siempre bajo el logo (regla del sistema; T2c la había metido en la columna de contenido para alinear el
             título con el cuerpo y a 1280 px el H1 empezaba 270 px a la derecha del logo). El índice y el cuerpo empiezan debajo. -->
        <!-- Tres zonas (rediseño tanda 3, fase «llano», 25-oct-2026): A cabecera, A2 «Explicado sin tecnicismos» (Banda tarjeta, con la ruta
             dentro) y B la hoja profesional con el índice pegajoso. B NO va dentro de Banda: su overflow:hidden anularía el sticky. -->
        <!-- 1 · Cabecera: H1, «En corto», la fecha de caso.json e Imprimir -->
        <PageHeader
          :eyebrow="L('BC-NED · FGFR1/CCND1 amp · RE− en hígado', 'BC-NED · FGFR1/CCND1 amp · ER− in liver')"
          :title="$t('science.title')"
          :lede="$t('science.en_corto')"
          variante="pagina"
        >
          <div class="ci-cabecera__meta">
            <ActualizadoEl :fecha="caso?.actualizado" />
            <button type="button" class="btn-ghost" data-print-hide @click="printPage">
              <Icon name="ph:printer" class="w-4 h-4" aria-hidden="true" />
              {{ $t('ciencia.print_btn') }}
            </button>
          </div>
        </PageHeader>
      </div>
    </section>

    <!-- Zona A2 · Explicado sin tecnicismos. Es la capa llana de /ciencia: cuatro preguntas y la ruta. El enlace al detalle profesional va ARRIBA, bajo
         el titular, para que quien viene a la parte clínica no tenga que cruzar el bloque. Sin conmutador y sin glosario en línea (un botón de
         glosario mide ~24 px y el sistema pide 44). Los literales son los de voz-miriam; la cuarta respuesta nombra el tratamiento de hoy y solo
         se pinta con su fecha de caso.json: si el caso deja de estar en cuarta línea, sale la versión sin tratamiento. -->
    <Banda tono="tarjeta" titular="ciencia-llano">
      <CabeceraSeccion id="ciencia-llano" :eyebrow="$t('ciencia.level_simple')" :titulo="$t('ciencia.llano.titulo')">
        <NuxtLink :to="irDetalle" class="link-action group ci-llano__ir">
          {{ $t('ciencia.llano.ir_detalle') }}
          <Icon name="ph:arrow-down" class="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
        </NuxtLink>
      </CabeceraSeccion>
      <ul class="ci-llano" role="list">
        <li v-for="p in llano" :key="p.id" class="ci-llano__item">
          <h3 class="h3-seccion">{{ p.q }}</h3>
          <p class="prosa">{{ p.a }}</p>
        </li>
      </ul>
      <!-- El esquema del tumor (fase «esquema» de la tanda 3, 25-oct-2026): la cuarta respuesta acaba en «Ya hay primeros resultados» y la figura es
           esa frase en dibujo. Va aquí, sin tocar la rejilla de las cuatro respuestas. Se pinta solo si los bloques R4, R5 y R6 de /celula-a-celula
           pasan su puerta (fail-closed). -->
      <TumorEsquema class="ci-llano__esquema" />
      <!-- 10 · La ruta, con el objetivo N-of-1 dentro (E5). Antes cerraba la hoja profesional (al 81 % de la página); aquí es lo primero que ve quien
           lee en llano. SIN la línea «Ahora»: la cuarta respuesta de arriba ya cuenta el tratamiento de hoy en llano (Dato-DXd) y la hoja profesional lo
           dice con su dosis en `notaEjes`; repetirlo aquí, con otro nombre y con jerga, era lo más pesado de la banda. #ruta-title se conserva: el botón
           de la home aterriza ahí. -->
      <div class="ci-llano__ruta">
        <RutaPersonalizada :objetivo="$t('ciencia.thesis_goal')" />
      </div>
    </Banda>

    <!-- Zona B · la hoja profesional: lo que se busca, las herramientas, la ficha, la anomalía, la patología, el perfil, los ejes y el panel. -->
    <section id="detalle-profesional" class="section-spacing" :aria-label="$t('ciencia.level_pro')">
      <div class="section-wide">
        <!-- T3-LOTE1 (A11 y A17, 25-oct-2026): el índice lateral y su rejilla empiezan en `xl` (1280), no en `lg`. A 1024 el raíl se comía 220 +
             48 px y la columna de lectura quedaba en 660, más estrecha que las tablas de dentro (679 y 687 px); con el desplegable «Saltar a…» en
             su lugar la columna mide 928. Y el pegajoso del raíl va con `.sticky-bajo-cabecera`: `lg:top-24` (96 px) lo dejaba bajo la cabecera de 112. -->
        <div class="xl:grid xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-16 xl:items-start">
          <CienciaSectionNav variant="rail" class="hidden xl:block xl:sticky xl:sticky-bajo-cabecera xl:self-start" />
          <div class="min-w-0">
            <CienciaSectionNav variant="mobile" class="xl:hidden mb-8" />

            <!-- 2 · Qué buscamos: lo que pueden mover los científicos que llegan aquí (laboratorio, HLA, IHQ). El resto, en /datos#que-buscamos. -->
            <section v-if="peticiones.length" class="ci-sec" aria-labelledby="ciencia-busca">
              <CabeceraSeccion id="ciencia-busca" :titulo="L('Qué buscamos', 'What we’re looking for')" />
              <QueBuscamos :fuente="peticiones" :filtro="TEMAS_CIENCIA" :ver-todas="false" :acciones="false" :sellos="false" />
              <div class="ci-acciones">
                <NuxtLink :to="localePath({ name: 'contacto', query: { role: 'researcher' } })" class="btn-secondary">{{ $t('home.buscamos_escribir') }}</NuxtLink>
                <NuxtLink :to="localePath({ name: 'datos', hash: '#que-buscamos' })" class="link-action group">
                  {{ $t('home.buscamos_todas') }}
                  <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </NuxtLink>
              </div>
            </section>

            <!-- 3 · Herramientas para profesionales. El id #mapa-acceso se conserva (es el ancla del enlace antiguo de /caso y de los tests). -->
            <section class="ci-sec" aria-labelledby="mapa-acceso">
              <CabeceraSeccion id="mapa-acceso" :eyebrow="$t('ciencia.level_pro')" :titulo="$t('nav.tools')" />
              <ul class="ci-herr" :class="`ci-herr--${herramientas.length}`" role="list">
                <li v-for="h in herramientas" :key="h.key">
                  <TarjetaEnlace
                    :to="localePath({ name: h.name })"
                    :icono="ICONO_HERRAMIENTA[h.key]"
                    :titulo="copyHerramienta(h.key, locale)[0]"
                    :meta="PARA_HERRAMIENTA[h.key] ? $t(PARA_HERRAMIENTA[h.key]!) : undefined"
                    @click="trackHerramienta(h.key, 'ciencia_acceso')"
                  />
                </li>
              </ul>
              <p class="ci-compartir measure">
                {{ L('Compártelo con tu médico o equipo de tumores:', 'Share it with your doctor or tumor board:') }}
                <span class="font-mono font-semibold">helpmiriam.com/caso</span>
                {{ L('· apoyo a la decisión, no consejo médico.', '· decision support, not medical advice.') }}
              </p>
              <NuxtLink :to="localePath({ name: 'herramientas' })" class="link-action group">
                {{ $t('nav.all_tools') }}
                <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </NuxtLink>
            </section>

            <!-- 4 · Ficha: sale de caso.json, sin estado escrito a mano. #snapshot-title se conserva (ancla del botón de clínica de la home). -->
            <section v-if="caso" class="ci-sec" aria-labelledby="snapshot-title">
              <CabeceraSeccion
                id="snapshot-title"
                :eyebrow="$t('ciencia.snapshot_eyebrow')"
                :titulo="$t('ciencia.snapshot_title')"
                :lede="$t('ciencia.snapshot_intro')"
              />
              <div class="card-base">
                <dl class="ci-ficha">
                  <div v-for="f in caso.filas" :key="f.clave" class="ci-ficha__fila">
                    <dt class="eyebrow">{{ f.clave === 'diagnostico' ? $t('ciencia.snapshot_diagnosis_label') : $t(`ciencia.ficha_${f.clave}`) }}</dt>
                    <dd>{{ f.valor }} <DatosSello v-if="f.sello" :s="f.sello" :lang="lang" /></dd>
                  </div>
                  <div v-if="caso.receptores.length" class="ci-ficha__fila">
                    <dt class="eyebrow">{{ $t('ciencia.ficha_receptores') }}</dt>
                    <dd>
                      <ul class="ci-lista" role="list">
                        <li v-for="r in caso.receptores" :key="r.marcador"><span class="font-semibold">{{ r.marcador }}</span> · {{ r.valor }} <DatosSello v-if="r.sello" :s="r.sello" :lang="lang" /></li>
                      </ul>
                    </dd>
                  </div>
                  <div class="ci-ficha__fila">
                    <dt class="eyebrow">{{ $t('ciencia.snapshot_target_label') }}</dt>
                    <dd>{{ $t('ciencia.snapshot_target') }}</dd>
                  </div>
                  <div v-if="caso.material.length" class="ci-ficha__fila">
                    <dt class="eyebrow">{{ $t('ciencia.ficha_material') }}</dt>
                    <dd>
                      <ul class="ci-lista" role="list">
                        <li v-for="m in caso.material" :key="m.muestra"><span class="font-semibold">{{ m.muestra }}</span> · {{ m.donde }} <DatosSello v-if="m.sello" :s="m.sello" :lang="lang" /></li>
                      </ul>
                    </dd>
                  </div>
                </dl>
              </div>
              <div class="ci-acciones">
                <NuxtLink :to="localePath({ name: 'datos', hash: '#s-hoy' })" class="link-action group">
                  {{ $t('ciencia.ficha_hoy') }}
                  <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </NuxtLink>
                <NuxtLink :to="localePath({ name: 'datos', hash: '#s-tejido' })" class="link-action group">
                  {{ $t('ciencia.ficha_tejido') }}
                  <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </NuxtLink>
              </div>
            </section>

            <!-- 5 · Por qué no encaja. Textos clínicos: los literales del comité médico (C1 y C2, 24-oct-2026). -->
            <section class="ci-sec" aria-labelledby="por-que-no-encaja">
              <CabeceraSeccion id="por-que-no-encaja" :eyebrow="L('La anomalía', 'The anomaly')" :titulo="$t('ciencia.why_no_fit_guidelines')" />
              <div class="card-base ci-prosa">
                <!-- Sin glosario en la prosa: un botón en línea mide ~24 px y el sistema pide 44 (R10). Los términos con definición están en los ejes. -->
                <i18n-t keypath="ciencia.why_no_fit_guidelines_text" tag="p">
                  <template #luminal>luminal</template>
                </i18n-t>
                <i18n-t keypath="ciencia.why_no_fit_protocols_text" tag="p">
                  <template #fgfr1>FGFR1</template>
                  <template #ccnd1>CCND1</template>
                  <template #neuroendocrino>{{ L('neuroendocrino', 'neuroendocrine') }}</template>
                </i18n-t>
                <i18n-t keypath="ciencia.why_no_fit_oms_text" tag="p">
                  <template #bcned>BC-NED</template>
                </i18n-t>
                <p class="font-semibold">{{ $t('ciencia.thesis') }}</p>
              </div>
            </section>

            <!-- 6 · Anatomía patológica en UNA tabla: las tres lecturas del primario y los otros dos sitios (hueso e hígado), lado a lado. -->
            <section class="ci-sec" aria-labelledby="tejido-3veces">
              <CabeceraSeccion
                id="tejido-3veces"
                :eyebrow="L('Anatomía patológica', 'Pathology')"
                :titulo="L('El mismo tumor, leído en tres sitios', 'The same tumour, read at three sites')"
                :lede="L(
                  'Hay tejido de tres localizaciones y momentos: la mama, leída tres veces en tres centros, el hueso y el hígado. Las diferencias entre lecturas son parte de la información, no un error: la columna más reciente de la mama (Vall d’Hebron, 2026) es la más completa, no necesariamente la «correcta». El componente neuroendocrino aparece en las tres localizaciones. El receptor de estrógeno, que en el primario era alto, es negativo en la metástasis del hígado, la lesión que creció durante el último tratamiento hormonal.',
                  'There is tissue from three sites and time points: the breast, read three times at three centres, the bone and the liver. The differences between reads are themselves information, not an error: the most recent breast column (Vall d’Hebron, 2026) is the most complete, not necessarily the “correct” one. The neuroendocrine component appears at all three sites. The estrogen receptor, high in the primary, is negative in the liver metastasis, the lesion that grew during the last hormonal treatment.')"
              />
              <div class="tabla-scroll" tabindex="0" role="region" :aria-label="L('Anatomía patológica: mama, hueso e hígado', 'Pathology: breast, bone and liver')">
                <table class="data-table data-table--dense data-table--cards">
                  <caption class="sr-only">{{ L('El mismo tumor, leído en tres sitios: mama (tres lecturas), hueso e hígado', 'The same tumour, read at three sites: breast (three reads), bone and liver') }}</caption>
                  <thead>
                    <tr>
                      <th scope="col"></th>
                      <th v-for="(c, i) in columnasPat" :key="c" scope="col" :class="{ 'reads-vh': i === 2 }">{{ c }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="fila in filasPat" :key="fila.k">
                      <td class="font-semibold cell-head">{{ fila.k }}</td>
                      <td
                        v-for="(celda, i) in fila.c"
                        :key="i"
                        :class="[claseCelda(celda), { 'reads-vh': i === 2 }]"
                        :data-label="columnasPat[i]"
                      >{{ celda }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="ci-fuentes">{{ L(pieEs, pieEn) }}</p>
              <Aviso tipo="limites" :titulo="$t('ciencia.patologia_limites_titulo')">
                <p>{{ L(
                  'Estas lecturas describen el tejido; no son un diagnóstico de consenso. Armonizar las discordancias está pendiente de valoración por el comité de tumores. Las variantes de RB1 y la ESR1 D538G se vieron en sangre y no en el hueso; el hígado aún no tiene perfil genómico. El patólogo del hueso advierte de que la gradación neuroendocrina no está establecida en biopsias pequeñas. Que la pérdida del receptor de estrógeno explique la progresión es una hipótesis, no un hallazgo.',
                  'These reads describe the tissue; they are not a consensus diagnosis. Reconciling the discordances is pending tumour-board review. The RB1 variants and ESR1 D538G were seen in blood and not in bone; the liver has no genomic profile yet. The bone pathologist notes that neuroendocrine grading is not established on small biopsies. That the loss of the estrogen receptor explains the progression is a hypothesis, not a finding.') }}</p>
              </Aviso>
            </section>

            <!-- 7 · Perfil molecular: una fila por alteración, con su método. La nota de unidades de FGFR1 y CCND1 sale UNA vez (C3). -->
            <section class="ci-sec" aria-labelledby="molecular-profile-title">
              <CabeceraSeccion
                id="molecular-profile-title"
                :eyebrow="L('Perfil molecular', 'Molecular profile')"
                :titulo="$t('ciencia.molecular_profile_title')"
                :lede="L(
                  'El perfil cruza cuatro fuentes: el tejido primario (NGS, 2024), la biopsia ósea de julio de 2026 (FoundationOne CDx), la inmunohistoquímica de la metástasis hepática (agosto de 2026) y la biopsia líquida (ctDNA, 2026). En todo el tejido se repite el mismo motor: amplificación de FGFR1 (8p11) y del clúster 11q13 (CCND1, FGF3/FGF4/FGF19). Lo que cambia es el receptor de estrógeno, que desaparece en el hígado. Cada fila indica con qué prueba se midió.',
                  'The profile crosses four sources: the primary tissue (NGS, 2024), the July 2026 bone biopsy (FoundationOne CDx), immunohistochemistry of the liver metastasis (August 2026) and the liquid biopsy (ctDNA, 2026). The same engine recurs across all tissue: amplification of FGFR1 (8p11) and of the 11q13 cluster (CCND1, FGF3/FGF4/FGF19). What changes is the estrogen receptor, which is gone in the liver. Each row notes how it was measured.')"
              />
              <MolecularProfileDetailed :cuarta-linea="caso?.cuartaLinea ?? null" />
              <Aviso tipo="limites" :titulo="$t('ciencia.nota_copias_titulo')" class="mt-4">
                <p>{{ $t('ciencia.nota_copias') }}</p>
              </Aviso>
            </section>

            <!-- 8 · Ejes terapéuticos: cada uno enlaza a su sección de /ciencia/evidencia -->
            <section class="ci-sec" aria-labelledby="axes-title">
              <CabeceraSeccion
                id="axes-title"
                :eyebrow="L('Ejes terapéuticos', 'Therapeutic axes')"
                :titulo="L('Hacia dónde apuntar', 'Where to aim')"
                :lede="L(
                  'De todo lo anterior se desprenden varias dianas. Estos son los ejes terapéuticos candidatos que sugiere el perfil molecular, cada uno con su propia lógica de tratamiento.',
                  'Several candidate targets follow from all of the above. These are the therapeutic axes the molecular profile points to, each with its own treatment rationale.')"
              />
              <ul class="ci-ejes" role="list" translate="no">
                <li v-for="(eje, i) in ejes" :key="eje.label" class="ci-eje">
                  <Term v-if="axisTerms[i]" :id="axisTerms[i]!" :label="eje.label" variant="badge" />
                  <span v-else class="badge-genomic">{{ eje.label }}</span>
                  <NuxtLink :to="`${localePath({ name: 'ciencia-evidencia' })}#${eje.ancla}`" class="link-action group">
                    {{ $t('ciencia.axes_evidencia') }}<span class="sr-only">: {{ eje.label }}</span>
                    <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </NuxtLink>
                </li>
              </ul>
              <Nota icon="tap" class="mt-4">{{ $t('glossary.hint') }}</Nota>
              <p class="ci-nota-eje">{{ notaEjes }}</p>
            </section>

            <!-- 9 · Panel prueba a prueba: solo la pregunta que responde cada análisis. El estado y el material, en /datos (caso.json). -->
            <section v-if="panelRows.length" class="ci-sec" aria-labelledby="panel-title">
              <CabeceraSeccion id="panel-title" :eyebrow="L('Análisis molecular', 'Molecular workup')" :titulo="$t('ciencia.proposed_panel')" :lede="$t('ciencia.panel_lede')" />
              <div class="tabla-scroll" tabindex="0" role="region" :aria-label="$t('ciencia.proposed_panel_caption')">
                <table class="data-table data-table--dense data-table--cards">
                  <caption class="sr-only">{{ $t('ciencia.proposed_panel_caption') }}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{{ $t('ciencia.panel_col_prueba') }}</th>
                      <th scope="col" class="col-note">{{ $t('ciencia.panel_col_responde') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in panelRows" :key="i">
                      <td class="cell-head font-semibold">{{ row.component }}</td>
                      <td class="col-note cell-block" :data-label="$t('ciencia.panel_col_responde')">
                        {{ row.implication }}<span v-if="row.linkTo" class="block mt-2"><NuxtLink :to="localePath(row.linkTo)" class="link-action group">{{ row.linkText }}<Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></NuxtLink></span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="ci-acciones">
                <NuxtLink :to="localePath({ name: 'datos', hash: '#s-tejido' })" class="link-action group">
                  {{ $t('ciencia.panel_tejido') }}
                  <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </NuxtLink>
              </div>
              <Aviso tipo="apoyo" :titulo="$t('ciencia.panel_nota_titulo')" class="mt-4">
                <p>{{ $t('ciencia.panel_nota') }}</p>
              </Aviso>
            </section>

            <!-- 11 · Evidencia, cierre profesional y «Sigue el caso» -->
            <div class="ci-sec">
              <TarjetaEnlace
                :to="localePath({ name: 'ciencia-evidencia' })"
                tono="destacada"
                icono="ph:books-fill"
                :titulo="$t('ciencia.key_evidence')"
              >{{ $t('ciencia.evidence_hook_body') }}</TarjetaEnlace>
            </div>

            <section class="ci-sec" aria-labelledby="ciencia-pro-help-title">
              <CabeceraSeccion id="ciencia-pro-help-title" :eyebrow="$t('ciencia.pro_help_eyebrow')" :titulo="$t('ciencia.pro_help_title')" />
              <ul class="ci-pro" role="list">
                <li>
                  <Icon name="ph:chat-circle-text-fill" class="ci-pro__icono" aria-hidden="true" />
                  <NuxtLink :to="localePath({ name: 'contacto', query: { role: 'oncologist' } })" class="link-inline">{{ $t('ciencia.pro_help_contribute') }}</NuxtLink>
                </li>
                <li>
                  <Icon name="ph:share-network-fill" class="ci-pro__icono" aria-hidden="true" />
                  <NuxtLink :to="localePath({ name: 'colabora' })" class="link-inline">{{ $t('ciencia.pro_help_share') }}</NuxtLink>
                </li>
              </ul>
              <!-- El botón de donar de /ciencia profesional (Miriam, 24-oct-2026; Umami: «Donar» fue el 2,8 % de /lesiones frente al 11,3 % de la
                   home). Es el único coral de la zona. -->
              <p class="ci-apoyo">{{ $t('ciencia.pro_help_fund') }}</p>
              <a
                :href="GOFUNDME_URL"
                target="_blank"
                rel="noopener noreferrer"
                data-support-cta
                class="btn-cta"
                @click="trackSupport('ciencia_pro')"
              >
                <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
                {{ $t('nav.donate') }}<span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
              </a>
            </section>

            <CaseFollowSignup class="mt-4" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * /ciencia: la capa profesional del caso (tanda 2 del rediseño, T2c, 24-oct-2026). Una sola capa, sin conmutador.
 * Fase «llano» de la tanda 3 (25-oct-2026): arriba va «Explicado sin tecnicismos» (cuatro preguntas, con la ruta debajo) y el índice pegajoso
 * queda en la hoja profesional, que NO cuelga de una Banda (su overflow:hidden anularía el sticky).
 *
 * Qué hay y de dónde sale:
 *   · El ESTADO clínico (la ficha, el material, la fecha de actualización y «en cuarta línea desde…») se LEE de app/data/caso.json
 *     (utils/casoCiencia.ts): no se escribe a mano aquí. Sin dato, la línea no se pinta.
 *   · Los textos clínicos corregidos (C1 a C6 y E1 a E7) son los LITERALES del comité médico del 24-oct-2026; el inglés es una
 *     traducción de ese literal y espera a `verificacion`.
 *   · La historia de tratamientos y el PET con Galio-68 salieron a /datos (#s-historia, #s-pet); el vídeo del ADC, al hito del 7-oct
 *     de /timeline; TwoFaces, el FAQ y el JSON-LD escritos a mano se borraron.
 *   · `?nivel=` ya no hace nada: se ignora. Pero los enlaces antiguos llevan #ancla (#snapshot-title del botón de clínica de la home,
 *     #mapa-acceso del enlace antiguo de /caso) y el FOCO sigue llegando a esa ancla (la lectura de pantalla empieza ahí).
 */
import type { Collections, ScienceEnCollectionItem } from '@nuxt/content'
import { TEMAS_CIENCIA } from '~/utils/peticiones'

// «verificado» es lo normal: solo se marcan las excepciones (como en /datos y en la home).
provide('ocultarVerificado', true)

const { locale, t, tm, rt } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (locale.value === 'es' ? es : en)
const { GOFUNDME_URL, trackSupport, trackHerramienta } = useSupport()
const { herramientas } = useHerramientas()

const { data: caso } = await useCasoCiencia()
const peticiones = computed(() => caso.value?.peticiones ?? [])

function printPage() {
  if (!import.meta.client) return
  window.print()
}

// Al imprimir (el botón y Ctrl+P, que se salta printPage), los dos desplegables del esquema del tumor salen ABIERTOS: cerrados, el papel trae sus títulos
// huecos y se pierde el marco de honestidad de la figura («El ARN no es la proteína», «Nada de esta página recomienda tratamiento»). `beforeprint` los abre y
// `afterprint` los deja como estaban (el que el lector ya tenía abierto sigue abierto). Se buscan al disparar el evento y no al montar: la figura es
// fail-closed (`v-if`) y puede no estar, y entonces no hay nada que hacer.
const abiertoAntesDeImprimir = new Map<HTMLDetailsElement, boolean>()
function abreParaImprimir() {
  for (const d of document.querySelectorAll<HTMLDetailsElement>('.te details')) {
    if (!abiertoAntesDeImprimir.has(d)) abiertoAntesDeImprimir.set(d, d.open) // un segundo `beforeprint` sin `afterprint` no pisa el estado guardado
    d.open = true
  }
}
function restauraTrasImprimir() {
  for (const [d, estabaAbierto] of abiertoAntesDeImprimir) d.open = estabaAbierto
  abiertoAntesDeImprimir.clear()
}
onMounted(() => {
  window.addEventListener('beforeprint', abreParaImprimir)
  window.addEventListener('afterprint', restauraTrasImprimir)
})
onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', abreParaImprimir)
  window.removeEventListener('afterprint', restauraTrasImprimir)
  abiertoAntesDeImprimir.clear()
})

// El foco llega a la ancla de la URL (una vez por ancla). Hay que VIGILAR route.hash y no leerlo al montar: en la carga directa de la página
// prerenderizada Nuxt hidrata en la ruta del payload (`/ciencia`, sin hash) y solo al terminar la hidratación pone la URL real; en `setup` y en
// `onMounted` el hash llega VACÍO (verificado en producción el 11-sep-2026 con ?nivel=pro; el mismo mecanismo). Solo foco, sin mover la página:
// el scroll lo hace el router (router.options.ts) y un segundo scroll suave a la vez se pisaba en el CI.
let anclaHecha = ''
function enfocarAncla() {
  const id = route.hash.slice(1)
  if (!id || id === anclaHecha) return
  nextTick(() => {
    const el = document.getElementById(id)
    if (!el) return
    anclaHecha = id
    el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  })
}
onMounted(enfocarAncla)
watch(() => route.hash, enfocarAncla)

// ── Ejes terapéuticos: mapa eje → término del glosario y → sección de /ciencia/evidencia (anchor de science.yml), mismo orden que ciencia.axes
const axisTerms = ['axis_trop2', 'axis_fgfr', 'axis_sstr', 'axis_esr1', 'axis_ne']
const ANCLAS_EJE = ['adc-trop2', 'fgfr1-ccnd1', 'sstr2-prrt', 'conversion-receptores', 'transformacion-ne']
const ejes = computed(() => {
  const etiquetas = (tm('ciencia.axes') as unknown[]).map((x) => String(rt(x as never)))
  // E7: el primer eje lleva «en curso desde el <día>» solo si el caso ESTÁ en cuarta línea (caso.json); si no, sin estado.
  if (caso.value?.cuartaLinea) etiquetas[0] = t('ciencia.axis_trop2_fecha', { fecha: caso.value.cuartaLinea.corta })
  return etiquetas.map((label, i) => ({ label, ancla: ANCLAS_EJE[i]! }))
})

// La nota de los ejes: «Solo el eje TROP-2 está en uso» es estado, así que solo se dice si el caso ESTÁ en cuarta línea (caso.json); si no, la nota se queda sin él.
const notaEjes = computed(() => [t('ciencia.axes_note'), caso.value?.cuartaLinea ? t('ciencia.axes_note_uso') : '', t('ciencia.axes_note_cierre')].filter(Boolean).join(' '))

// ── Explicado sin tecnicismos (zona A2). Cuatro preguntas con sus respuestas literales de voz-miriam (`ciencia.llano.*`). La cuarta lleva «Desde
// el <día> recibe Dato-DXd…» y solo se pinta con la fecha de caso.json; sin cuarta línea, la versión sin tratamiento.
const llano = computed(() => {
  const desde = caso.value?.cuartaLinea?.larga
  return (['q1', 'q2', 'q3', 'q4'] as const).map((id) => ({
    id,
    q: t(`ciencia.llano.${id}_q`),
    a: id === 'q4' ? (desde ? t('ciencia.llano.q4_a', { desde }) : t('ciencia.llano.q4_a_sin_linea')) : t(`ciencia.llano.${id}_a`),
  }))
})
// «Ir al detalle profesional»: al primer capítulo de la hoja profesional que exista («Qué buscamos» solo se pinta si hay peticiones públicas).
const irDetalle = computed(() => localePath({ name: 'ciencia', hash: peticiones.value.length ? '#ciencia-busca' : '#mapa-acceso' }))

// ── Anatomía patológica en una tabla (mama ×3 lecturas · hueso · hígado). Las celdas son las de las dos tablas de antes, con C1, C4 y E6.
const columnasPat = computed(() => [
  'Murcia · 2024',
  'MD Anderson · DIPCAN · 2024',
  L('Vall d’Hebron · 2026 (mama)', 'Vall d’Hebron · 2026 (breast)'),
  L('Hueso · ilion derecho · jul 2026', 'Bone · right ilium · Jul 2026'),
  L('Hígado · ago 2026', 'Liver · Aug 2026'),
])
const NA = L('no determinado', 'not tested')
const ND = L('sin dato', 'no data')
const filasPat = computed<{ k: string; c: string[] }[]>(() => [
  { k: L('RE (estrógeno)', 'ER (estrogen)'), c: ['95%', '100%', L('85% · alta · H 225', '85% · high · H 225'), NA, '0%'] },
  { k: L('RP (progesterona)', 'PR (progesterone)'), c: ['5%', '100%', L('20% · baja · H 25', '20% · low · H 25'), NA, '5% (2+)'] },
  { k: 'HER2', c: [
    '0',
    L('0 · tinción de membrana incompleta y casi imperceptible en menos del 10 % de las células', '0 · incomplete, barely perceptible membrane staining in fewer than 10% of cells'),
    L('0 (sin tinción de membrana)', '0 (no membrane staining)'),
    L('IHQ no determinada · ERBB2 sin alteración', 'IHC not tested · ERBB2 unaltered'),
    '0',
  ] },
  { k: 'Ki-67', c: ['60%', ND, '40%', '~15%', L('no informado', 'not reported')] },
  { k: L('Grado (Nottingham)', 'Grade (Nottingham)'), c: ['II (3+2+2)', '2 (2+2+2)', '2 (3+2+1)', ND, ND] },
  { k: L('Subtipo (IHQ)', 'Subtype (IHC)'), c: [ND, ND, 'Luminal B · HER2−', ND, ND] },
  { k: L('Diferenciación neuroendocrina', 'Neuroendocrine differentiation'), c: [
    L('Cromogranina y sinaptofisina en el 80 % de las células neoplásicas · CD56 −', 'Chromogranin and synaptophysin in 80% of the neoplastic cells · CD56 −'),
    L('sin marcadores NE en el informe', 'no NE markers in the report'),
    L('Sinaptofisina heterogénea · Cromogranina focal+ · INSM1 en mosaico', 'Heterogeneous synaptophysin · focal+ chromogranin · mosaic INSM1'),
    L('Sinaptofisina +', 'Synaptophysin +'),
    L('Cromogranina A + · Sinaptofisina +', 'Chromogranin A + · Synaptophysin +'),
  ] },
  { k: L('Otros marcadores', 'Other markers'), c: [
    L('CK19 + · GATA-3 + · carcinoma in situ 20 %', 'CK19 + · GATA-3 + · in situ carcinoma 20%'),
    L('PD-L1 CPS 0 %', 'PD-L1 CPS 0%'),
    L('TILs menos del 5 % · E-cadherina + · CK19 en mosaico · sin invasión vascular', 'TILs under 5% · E-cadherin + · mosaic CK19 · no vascular invasion'),
    ND,
    ND,
  ] },
  { k: L('Genómica', 'Genomics'), c: [
    ND,
    L('TSO500: FGFR1 13 copias · CCND1 20 copias · FGF3/4/19 18 copias', 'TSO500: FGFR1 13 copies · CCND1 20 copies · FGF3/4/19 18 copies'),
    ND,
    L('FoundationOne CDx: FGFR1 amplificado (33 copias en el fichero de investigación) · CCND1/FGF3/4/19 amplificados (37 en el fichero de investigación) · TMB 4 · MSS · sin ESR1, RB1, TP53 ni PIK3CA',
      'FoundationOne CDx: FGFR1 amplified (33 copies in the research file) · CCND1/FGF3/4/19 amplified (37 in the research file) · TMB 4 · MSS · no ESR1, RB1, TP53 or PIK3CA'),
    L('pendiente (Dana-Farber)', 'pending (Dana-Farber)'),
  ] },
])
// Una celda corta y numérica va en mono; el texto, en sans.
const claseCelda = (celda: string) => (celda.length <= 22 && /^[\d~<]/.test(celda) ? 'font-mono' : 'text-sm')
// Pie de la tabla. C4 (literal del comité médico): la revisión de la laminilla es «dicha», sin informe escrito. C5: sin el paréntesis del RECIST.
const pieEs = 'Murcia 2024 (biopsia local) · MD Anderson · DIPCAN 2024 (perfil ampliado) · Vall d’Hebron · Anatomía Patológica · informe firmado el 10/06/2026 (firma previa 19/05/2026). Ese informe recoge la sinaptofisina dos veces («heterogénea» y «negativa»). La laminilla se revisó en una reunión del 29 de septiembre de 2026 y, según lo dicho en ella, confirma la expresión; no hay informe escrito de esa revisión ni petición de aclaración al hospital. Aquí se usa «heterogénea», con esa reserva. Hueso: biopsia del ilion derecho en Zúrich, 8/07/2026, y FoundationOne CDx sobre ella. Hígado: biopsia con aguja gruesa del 18/08/2026 de una lesión de unos 2,2 cm del segmento IVa; el informe de Vall d’Hebron, firmado el 21/09/2026, es una revisión con inmunohistoquímica y no incluye Ki-67 ni SSTR2.'
const pieEn = 'Murcia 2024 (local biopsy) · MD Anderson · DIPCAN 2024 (extended profile) · Vall d’Hebron · Pathology · report signed 10/06/2026 (earlier signature 19/05/2026). That report lists synaptophysin twice (“heterogeneous” and “negative”). The slide was reviewed in a meeting on 29 September 2026 and, according to what was said there, confirms the expression; there is no written report of that review and no request for clarification to the hospital. Here “heterogeneous” is used, with that reservation. Bone: right-ilium biopsy in Zurich, 8/07/2026, and FoundationOne CDx on it. Liver: core needle biopsy of 18/08/2026 of a ~2.2 cm lesion in segment IVa; the Vall d’Hebron report, signed 21/09/2026, is an immunohistochemistry review and includes neither Ki-67 nor SSTR2.'

// ── Panel prueba a prueba (content/<lang>/science.yml)
const { data: scienceData } = await useAsyncData(
  `science-data-${locale.value}`,
  () => queryCollection(`science_${locale.value || 'en'}` as keyof Collections).first() as Promise<ScienceEnCollectionItem | null>,
  { watch: [locale] },
)
const panelRows = computed(() => scienceData.value?.panelRows ?? [])

// ── SEO. Sin fecha ni estado escritos a mano (E3, E1): la fecha de la página es `caso.actualizado` y sale en «Actualizado el».
useSeoMeta({
  title: () => L('Perfil molecular del tumor: BC-NED, FGFR1/CCND1 y RE− en hígado', 'Tumor molecular profile: BC-NED, FGFR1/CCND1, ER− in the liver'),
  description: () =>
    L(
      'El perfil molecular del tumor de Miriam: cáncer de mama con diferenciación neuroendocrina, amplificación de FGFR1 y CCND1, y una metástasis hepática RE−. Documentación clínica abierta.',
      "Miriam's tumor molecular profile: breast cancer with neuroendocrine differentiation, FGFR1 and CCND1 amplification, and an ER− liver metastasis. Open clinical documentation.",
    ),
  ogTitle: () => L('Perfil molecular BC-NED · FGFR1/CCND1 · RE− en hígado', 'Molecular profile BC-NED · FGFR1/CCND1 · ER− in the liver'),
  ogDescription: () =>
    L(
      'Análisis científico del caso: BC-NED, HER2 0, amplificación de FGFR1 y CCND1, SSTR+ en hueso (PET Ga-68). Metástasis óseas y hepáticas; el hígado es RE 0 %.',
      'Scientific case analysis: BC-NED, HER2 0, FGFR1 and CCND1 amplification, SSTR+ in bone (Ga-68 PET). Bone and liver metastases; the liver is ER 0%.',
    ),
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => L('Perfil molecular BC-NED · FGFR1/CCND1 · RE− en hígado', 'Molecular profile BC-NED · FGFR1/CCND1 · ER− in the liver'),
  twitterDescription: () =>
    L(
      'BC-NED, FGFR1 y CCND1 amplificados, metástasis hepática RE−. El perfil molecular del tumor de Miriam.',
      "BC-NED, amplified FGFR1 and CCND1, ER− liver metastasis. Miriam's tumor molecular profile.",
    ),
})

defineOgImage('Default.takumi', {
  title: () => t('science.title'),
  description: () => L('El perfil molecular completo del tumor, explicado.', "The tumor's full molecular profile, explained."),
})

// Datos estructurados: la página médica y, si hay caso.json, una MedicalCondition con su diagnóstico y su histología (verificados, de la ficha).
// El FAQ y el JSON-LD escritos a mano se borraron (repetían «~80 %», «×13» y «cribado»); este se genera y no declara tratamientos.
useSchemaOrg([defineWebPage({ '@type': ['WebPage', 'MedicalWebPage'], name: () => t('science.title') })])
const condicion = computed(() => {
  const f = caso.value?.filas
  const dx = f?.find((x) => x.clave === 'diagnostico')?.valor
  if (!dx) return ''
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name: dx,
    description: f?.find((x) => x.clave === 'histologia')?.valor ?? dx,
  })
})
useHead({ script: [{ type: 'application/ld+json', innerHTML: condicion }] })
</script>

<style scoped>
/* Salto por anclas del índice: el objetivo es el <h2>, pero encima lleva un rótulo (eyebrow). El margen despeja la cabecera pegajosa (~73 px)
   Y ese rótulo, para que no quede medio tapado. */
#ciencia-busca,
#mapa-acceso,
#snapshot-title,
#por-que-no-encaja,
#tejido-3veces,
#molecular-profile-title,
#axes-title,
#panel-title {
  scroll-margin-top: 7.5rem;
}
/* Zona A: la cabecera se queda sin relleno inferior, el aire hasta la banda lo da el margen del PageHeader (si no, se sumaba el de dos secciones). */
.ci-zona-a { padding-bottom: 0; }

/* Zona A2 · Explicado sin tecnicismos: cuatro preguntas en dos columnas desde 768 px (una columna debajo), cada una con su filete, y la ruta debajo. */
.ci-llano__ir { margin-top: var(--sp-16); }
.ci-llano { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-32) var(--sp-48); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 768px) { .ci-llano { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.ci-llano__item { border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.ci-llano__item .h3-seccion { margin: 0 0 var(--sp-8); }
.ci-llano__item .prosa { margin: 0; }
.ci-llano__esquema { margin-top: var(--sp-48); }
.ci-llano__ruta { margin-top: var(--sp-64); padding-top: var(--sp-64); border-top: 1px solid var(--trazo-medio); }

.ci-sec { margin-bottom: var(--sp-64); }
.ci-cabecera__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-24); margin-top: var(--sp-16); }
.ci-acciones { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-8) var(--sp-24); margin-top: var(--sp-16); }

/* Herramientas: rejilla compacta de tarjetas-enlace */
.ci-herr { list-style: none; margin: 0 0 var(--sp-16); padding: 0; display: grid; gap: var(--sp-12); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 640px) { .ci-herr { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
/* T3-LOTE2 (A28): sin hueco (regla de retícula 2). Desde `lg`, tres columnas con 3 o 6 tarjetas y, con 5, seis columnas con spans de 2, 2, 2, 3 y 3; con 4,
   las dos columnas de siempre ya cuadran. El número sale de la lista real (el explorador entra solo si su puerta está abierta). */
@media (min-width: 1024px) {
  .ci-herr--3, .ci-herr--6 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .ci-herr--5 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .ci-herr--5 > li { grid-column: span 2; }
  .ci-herr--5 > li:nth-child(n + 4) { grid-column: span 3; }
}
.ci-herr > li { display: flex; }
.ci-herr > li > :deep(a) { width: 100%; }
.ci-compartir { margin: 0 0 var(--sp-8); font: var(--tipo-body-sm); color: var(--texto-2); }

/* Ficha */
.ci-ficha { display: grid; gap: var(--sp-16); margin: 0; }
.ci-ficha__fila { display: grid; gap: var(--sp-4); }
@media (min-width: 700px) { .ci-ficha__fila { grid-template-columns: minmax(10rem, 14rem) minmax(0, 1fr); gap: var(--sp-16); } }
.ci-ficha__fila dd { margin: 0; font: var(--tipo-ui); color: var(--texto-1); }
.ci-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-8); }

/* Por qué no encaja */
.ci-prosa { display: grid; gap: var(--sp-16); max-width: var(--measure); }
.ci-prosa p { margin: 0; font: var(--tipo-ui); color: var(--texto-1); }

/* Anatomía patológica: la columna de la revisión más reciente de la mama (referencia), resaltada */
.reads-vh { background: rgb(var(--color-miriam-rgb) / 0.07); }
.ci-fuentes { margin: var(--sp-12) 0 var(--sp-16); font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }

/* Ejes */
.ci-ejes { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); }
.ci-eje { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-4) var(--sp-16); }
/* el término con su definición es un botón: 44 px de alto como cualquier control (R10) */
.ci-eje :deep(.term--badge) { min-height: var(--control-min); }
.ci-nota-eje { margin: var(--sp-16) 0 0; font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }

/* Cierre profesional */
.ci-pro { list-style: none; margin: 0 0 var(--sp-16); padding: 0; display: grid; gap: var(--sp-8); }
.ci-pro li { display: flex; align-items: center; gap: var(--sp-12); font: var(--tipo-ui); }
.ci-pro a { display: inline-flex; align-items: center; min-height: var(--control-min); }
.ci-pro__icono { flex: none; width: 1rem; height: 1rem; color: var(--identidad); }
.ci-apoyo { margin: 0 0 var(--sp-12); font: var(--tipo-body-sm); color: var(--texto-2); }
</style>
