<template>
  <div>
    <section class="section-spacing" :aria-label="$t('science.title')">
      <div :class="level === 'pro' ? 'section-wide' : 'section-container'">
        <!-- Layout pro: índice pegajoso (izq, lg+) + contenido en grid; la
             cabecera va DENTRO de la columna de contenido para que el título
             alinee con el cuerpo, no con el índice. En simple, sin grid. -->
        <div
          :class="level === 'pro' ? 'lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:gap-16 lg:items-start' : ''"
        >
          <CienciaSectionNav
            v-if="level === 'pro'"
            variant="rail"
            class="hidden lg:block lg:sticky lg:top-24 lg:self-start"
          />
          <div class="min-w-0">
        <PageHeader
          :title="$t('science.title')"
          :subtitle="headerSubtitle"
          :tag="level === 'simple' ? '' : 'BC-NED + FGFR1 ×13 + SSTR2+'"
        />

        <!-- Ciencia en 3 capas (auditoría 3.4): la página es densa; cada lector
             elige profundidad. 'Para médicos' es el nivel por defecto y muestra
             todo (la página completa). Las capas usan v-show (display) sobre
             contenedores `display:contents`, así el HTML estático no cambia y el
             SEO/hidratación siguen intactos. -->
        <p class="pathway-comfort mb-6 max-w-2xl" role="note">
          <Icon name="ph:leaf" class="pathway-comfort__icon" aria-hidden="true" />
          {{ $t('pathways.comfort') }}
        </p>

        <!-- AI SEO: bloque extractable de 40–60 palabras para agentes y buscadores. -->
        <aside class="card-base mb-6" :aria-label="$t('ciencia.ai_summary_aria')">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.ai_summary_eyebrow') }}</p>
          <p class="text-sm text-berenjena leading-relaxed max-w-3xl">
            {{ $t('ciencia.ai_summary_text', { age: caseData.currentAge }) }}
          </p>
        </aside>

        <div class="flex flex-wrap items-center gap-3 mb-6" data-print-hide>
          <button
            type="button"
            class="btn-ghost text-sm"
            @click="printPage"
          >
            <Icon name="ph:printer" class="w-4 h-4" aria-hidden="true" />
            {{ $t('ciencia.print_btn') }}
          </button>
        </div>

        <div class="reading-level mb-10" role="group" :aria-label="$t('ciencia.level_aria')">
          <span class="reading-level__hint">{{ $t('ciencia.level_hint') }}</span>
          <div class="reading-level__seg">
            <button
              v-for="opt in levelOptions"
              :key="opt.id"
              type="button"
              class="reading-level__btn"
              :class="{ 'is-active': level === opt.id }"
              :aria-pressed="level === opt.id"
              @click="level = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- A11y: anuncia el cambio de modo a lectores de pantalla (el comité
             marcó «nada de cambios de contenido silenciosos» como prioridad). -->
        <div aria-live="polite" class="sr-only">{{ levelAnnounce }}</div>

        <!-- Retorno claro al resumen desde el modo clínico (orientación ·
             neurodivergencia: salida obvia, siempre en el mismo sitio). -->
        <button
          v-show="level === 'pro'"
          type="button"
          @click="level = 'simple'"
          class="inline-flex items-center gap-1.5 mb-8 -mt-4 text-sm text-tinta hover:text-miriam transition-colors group"
          style="text-decoration: none"
        >
          <Icon name="ph:arrow-left" class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {{ $t('ciencia.back_to_summary') }}
        </button>

        <EcgDivider class="mb-12" />

        <!-- Índice móvil: desplegable «Saltar a…» en el flujo, tras la cabecera
             (solo pro, <lg). El rail de escritorio va arriba, junto al título. -->
        <CienciaSectionNav v-if="level === 'pro'" variant="mobile" class="lg:hidden mb-8" />

        <!-- Case snapshot (médicos + tabla completa; técnico, fuera del resumen simple) -->
        <section v-show="showData" aria-labelledby="snapshot-title" class="mb-12">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.snapshot_eyebrow') }}</p>
          <h2
            id="snapshot-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ $t('ciencia.snapshot_title') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ $t('ciencia.snapshot_intro') }}
          </p>
          <div class="card-base">
            <dl class="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <div
                v-for="row in snapshotRows"
                :key="row.label"
                :class="row.wide ? 'sm:col-span-2' : ''"
              >
                <dt class="flex items-center gap-2 mb-1.5">
                  <span class="eyebrow">{{ row.label }}</span>
                  <span
                    v-if="row.tag"
                    :class="['pill-data', `pill-data--${row.tone}`]"
                    style="font-size: 10px; padding: 2px 8px"
                  >{{ row.tag }}</span>
                </dt>
                <dd
                  class="text-sm text-berenjena leading-relaxed"
                  :class="{ 'font-mono': row.mono }"
                  translate="no"
                >
                  <span class="font-semibold">{{ row.lead }}</span><span v-if="row.rest"> · {{ row.rest }}</span>
                </dd>
              </div>
            </dl>
            <p
              class="mt-6 pt-5 text-sm text-berenjena leading-relaxed font-medium"
              style="border-top: 1px solid rgba(45,27,61,0.10)"
            >
              {{ $t('ciencia.thesis') }}
            </p>
          </div>
        </section>

        <!-- El mismo tejido, leído tres veces (anatomía patológica · 3 lecturas) -->
        <section v-show="showData" class="mb-12" aria-labelledby="tejido-3veces">
          <p class="eyebrow mb-2 block">{{ L('Anatomía patológica', 'Pathology') }}</p>
          <h2 id="tejido-3veces" class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
            {{ L('El mismo tejido, leído tres veces', 'The same tissue, read three times') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-3 max-w-2xl">
            {{ L('El mismo tumor se ha analizado tres veces, en tres centros y momentos distintos. Las diferencias entre lecturas son parte de la información, no un error: la columna más reciente (VHIO, 2026) es la más completa, no necesariamente la «correcta».',
                  'The same tumour has been analysed three times, at three centres and time points. The differences between reads are themselves information, not an error: the most recent column (VHIO, 2026) is the most complete, not necessarily the “correct” one.') }}
          </p>
          <div class="data-card overflow-x-auto">
            <table class="data-table data-table--dense data-table--cards">
              <caption class="sr-only">{{ L('El mismo tejido, leído tres veces', 'The same tissue, read three times') }}</caption>
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">{{ L('Local · Murcia · 2024', 'Local · Murcia · 2024') }}</th>
                  <th scope="col">MD Anderson · DIPCAN · 2024</th>
                  <th scope="col" class="reads-vh">VHIO · Vall d’Hebron · 2026</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="font-semibold text-berenjena cell-head">{{ L('RE (estrógeno)', 'ER (estrogen)') }}</td><td class="font-mono" data-label="Local · Murcia · 2024">95%</td><td class="font-mono" data-label="MD Anderson · DIPCAN · 2024">100%</td><td class="font-mono reads-vh" data-label="VHIO · Vall d’Hebron · 2026">{{ L('85% · alta · H 225', '85% · high · H 225') }}</td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">{{ L('RP (progesterona)', 'PR (progesterone)') }}</td><td class="font-mono" data-label="Local · Murcia · 2024">5%</td><td class="font-mono" data-label="MD Anderson · DIPCAN · 2024">100%</td><td class="font-mono reads-vh" data-label="VHIO · Vall d’Hebron · 2026">{{ L('20% · baja · H 25', '20% · low · H 25') }}</td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">HER2</td><td class="font-mono" data-label="Local · Murcia · 2024">0</td><td class="font-mono" data-label="MD Anderson · DIPCAN · 2024">0</td><td class="text-sm reads-vh" data-label="VHIO · Vall d’Hebron · 2026">{{ L('0 (sin tinción de membrana)', '0 (no membrane staining)') }}</td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">Ki-67</td><td class="font-mono" data-label="Local · Murcia · 2024">60%</td><td class="font-mono" data-label="MD Anderson · DIPCAN · 2024">—</td><td class="font-mono reads-vh" data-label="VHIO · Vall d’Hebron · 2026">40%</td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">{{ L('Grado (Nottingham)', 'Grade (Nottingham)') }}</td><td class="font-mono" data-label="Local · Murcia · 2024">II (3+2+2)</td><td class="font-mono" data-label="MD Anderson · DIPCAN · 2024">—</td><td class="font-mono reads-vh" data-label="VHIO · Vall d’Hebron · 2026">2 (3+2+1)</td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">{{ L('Subtipo (IHQ)', 'Subtype (IHC)') }}</td><td data-label="Local · Murcia · 2024">—</td><td data-label="MD Anderson · DIPCAN · 2024">—</td><td class="reads-vh" data-label="VHIO · Vall d’Hebron · 2026"><span class="pill-data pill-data--violet">Luminal B · HER2−</span></td></tr>
                <tr><td class="font-semibold text-berenjena cell-head">{{ L('Diferenciación neuroendocrina', 'Neuroendocrine differentiation') }}</td><td data-label="Local · Murcia · 2024">{{ L('confirmada', 'confirmed') }}</td><td data-label="MD Anderson · DIPCAN · 2024">—</td><td class="text-sm reads-vh" data-label="VHIO · Vall d’Hebron · 2026">{{ L('Sinaptofisina heterogénea · Cromogranina focal+ · INSM1 en mosaico', 'Heterogeneous synaptophysin · focal+ chromogranin · mosaic INSM1') }}</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-tinta mt-2 font-mono leading-relaxed">
            {{ L('Murcia 2024 (biopsia local) · MD Anderson · DIPCAN 2024 (perfil ampliado) · Vall d\'Hebron · Anatomía Patológica VH-26-B-17664 · VHIO · 19/05/2026.',
                  'Murcia 2024 (local biopsy) · MD Anderson · DIPCAN 2024 (extended profile) · Vall d\'Hebron · Pathology VH-26-B-17664 · VHIO · 19/05/2026.') }}
          </p>
          <Nota class="mt-3">
            {{ L('Estas lecturas describen el tejido; no son un diagnóstico de consenso. Armonizar las discordancias está pendiente de valoración por el comité de tumores —y es, en buena parte, lo que la rebiopsia molecular y esa revisión vienen a aclarar.',
                  'These reads describe the tissue; they are not a consensus diagnosis. Reconciling the discordances is pending tumour-board review —and is, in good part, what the molecular rebiopsy and that review are there to clarify.') }}
          </Nota>
        </section>

        <!-- Capa «Resumen simple»: VERSIÓN propia en lenguaje llano (no es la
             página médica con secciones ocultas: es un texto escrito para quien
             no es del campo). Solo se muestra en el nivel simple. -->
        <section v-show="level === 'simple'" class="mb-12" aria-labelledby="simple-summary-title">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.simple_eyebrow') }}</p>
          <h2 id="simple-summary-title" class="heading-display text-2xl text-berenjena mb-3" style="letter-spacing: -0.02em">
            {{ $t('ciencia.simple_title') }}
          </h2>
          <p class="text-[15px] text-berenjena leading-relaxed mb-6 max-w-2xl">
            {{ $t('ciencia.simple_body') }}
          </p>
          <div class="space-y-4">
            <div v-for="(p, i) in simplePoints" :key="i" class="card-base">
              <h3 class="font-display font-semibold text-berenjena text-base mb-1.5">{{ p.q }}</h3>
              <p class="text-sm text-tinta leading-relaxed">{{ p.a }}</p>
            </div>
          </div>
          <p class="mt-6 text-sm text-tinta leading-relaxed max-w-2xl">
            {{ $t('ciencia.simple_more') }}
          </p>
          <!-- Puerta-invitación al detalle clínico (plain-first → pro). NO es coral
               (el coral se reserva al CTA de campaña): es una invitación, no un muro.
               Dice qué hay dentro y el tiempo de lectura. -->
          <button
            type="button"
            @click="goPro()"
            class="ciencia-door card-base w-full text-left flex items-start gap-4 hover:shadow-md transition-shadow group mt-8 max-w-2xl"
            style="text-decoration: none"
          >
            <span class="w-10 h-10 rounded-xl bg-miriam-soft flex items-center justify-center shrink-0" aria-hidden="true">
              <Icon name="ph:dna" class="w-5 h-5 text-berenjena" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="eyebrow mb-1 block">{{ $t('ciencia.door_eyebrow') }}</span>
              <span class="block font-display font-semibold text-berenjena group-hover:text-miriam transition-colors">
                {{ $t('ciencia.door_title') }}
              </span>
              <span class="block text-sm text-tinta leading-relaxed mt-0.5">{{ $t('ciencia.door_body') }}</span>
            </span>
            <Icon name="ph:arrow-right" class="w-4 h-4 text-tinta mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </section>

        <!-- Solo «Para médicos»: el marco técnico de por qué no encaja en guías
             (usa términos como FGFR1/CCND1, por eso no va en el resumen simple). -->
        <div style="display: contents" v-show="showMedicoOnly">
        <!-- Thesis framing: why this tumor doesn't fit the protocols -->
        <section class="alert-callout mb-12">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'La anomalía' : 'The anomaly' }}</p>
          <h2 class="alert-callout__title heading-display text-xl text-berenjena mb-3">
            {{ $t('ciencia.why_no_fit_guidelines') }}
          </h2>
          <i18n-t
            keypath="ciencia.why_no_fit_guidelines_text"
            tag="p"
            class="text-sm text-tinta leading-relaxed mb-4"
          >
            <template #luminal><Term id="luminal" /></template>
            <template #fgfr1><Term id="fgfr1" /></template>
            <template #ccnd1><Term id="ccnd1" /></template>
            <template #neuroendocrino><Term id="neuroendocrino" /></template>
            <template #bcned><Term id="bcned" /></template>
          </i18n-t>
          <Nota icon="tap" class="mb-4">{{ $t('glossary.hint') }}</Nota>
          <p class="text-sm text-berenjena leading-relaxed font-medium">
            {{ $t('ciencia.thesis_goal') }}
          </p>
        </section>
        </div>
        <!-- /solo médicos (marco técnico) -->

        <!-- Capa narrativa (simple + médicos): el esquema visual de las dos caras. -->
        <div style="display: contents" v-show="showNarrative">
        <!-- El esquema de las dos caras: puente visual entre la anomalía y el
             perfil molecular. Movido desde la home; con la leyenda completa, el
             detalle vive mejor aquí. -->
        <TwoFaces class="mb-12" />
        </div>
        <!-- /capa narrativa -->

        <!-- Capa de datos (médicos + tabla completa): perfil molecular → panel. -->
        <div style="display: contents" v-show="showData">
        <!-- Molecular profile: single canonical source of alterations -->
        <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Perfil molecular' : 'Molecular profile' }}</p>
        <h2
          id="molecular-profile-title"
          class="heading-display text-2xl text-berenjena mb-2"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.molecular_profile_title') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
          {{ locale === 'es'
            ? 'El perfil combina el tejido primario (NGS, 2024) con la biopsia líquida de ctDNA en plasma (2026). Sobre un fondo luminal HR+/HER2− destacan la amplificación focal de FGFR1 en 11q13, CCND1 y el clúster FGF3/FGF4/FGF19; cada fila indica con qué prueba se midió.'
            : 'The profile combines primary tissue (NGS, 2024) with plasma ctDNA liquid biopsy (2026). Against a luminal HR+/HER2− background, the standouts are focal amplification of FGFR1 at 11q13, CCND1 and the FGF3/FGF4/FGF19 cluster; each row notes how it was measured.' }}
        </p>
        <MolecularProfileDetailed class="mb-12" />

        <section v-if="imaging" class="mb-14" aria-labelledby="imaging-tissue-title">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Imagen funcional' : 'Functional imaging' }}</p>
          <h2
            id="imaging-tissue-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ locale === 'es' ? 'Lo que muestra el PET de Galio-68' : 'What the Gallium-68 PET shows' }}
          </h2>
          <i18n-t
            keypath="ciencia.imaging_intro"
            tag="p"
            class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl"
          >
            <template #sstr><Term id="sstr" /></template>
            <template #prrt><Term id="prrt" /></template>
          </i18n-t>

          <div class="card-base">
            <div class="flex items-start gap-3 mb-3">
              <span
                class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center"
              >
                <Icon name="ph:scan" class="w-5 h-5 text-berenjena" aria-hidden="true" />
              </span>
              <div>
                <p class="eyebrow mb-1 block">{{ $t('ciencia.imaging_title') }}</p>
                <h3 class="heading-display text-lg text-berenjena">
                  {{ imaging.title }}
                </h3>
              </div>
            </div>
            <dl class="text-xs text-tinta grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4 font-mono">
              <div>
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.date_label') }}: </dt>
                <dd class="inline">{{ imaging.date }}</dd>
              </div>
              <div v-if="imaging.center">
                <dt class="inline font-semibold text-berenjena">{{ $t('ciencia.center_label') }}: </dt>
                <dd class="inline">{{ imaging.center }}</dd>
              </div>
            </dl>
            <p class="text-sm text-tinta leading-relaxed mb-3">
              {{ $t('ciencia.imaging_what') }}
            </p>
            <blockquote
              v-if="imaging.quote"
              class="pl-3 text-xs italic text-tinta mb-3"
              style="border-left: 2px solid rgba(45,27,61,0.20)"
            >
              «{{ imaging.quote }}»
            </blockquote>
            <p class="text-sm text-berenjena leading-relaxed">
              <span class="font-semibold">{{ $t('ciencia.meaning_label') }}:</span>
              {{ imaging.meaning }}
            </p>
          </div>

          <!-- Acceso al mapa interactivo de metástasis (doble trazador, lesión a lesión) -->
          <NuxtLink
            :to="localePath('/mapa-metastasis')"
            class="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 rounded-2xl px-4 sm:px-5 py-4 mt-5 transition-all active:scale-[0.99] sm:hover:-translate-y-0.5"
            style="background:rgba(232,212,237,0.30);text-decoration:none"
          >
            <div class="flex items-start gap-3.5 flex-1">
              <span class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center">
                <Icon name="ph:map-pin-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
              </span>
              <p class="flex-1 text-sm text-tinta leading-relaxed">
                {{ locale === 'es'
                  ? 'Mapa interactivo de las metástasis óseas con doble trazador (Galio-68 y FDG): cada lesión, una a una, con su localización en 3D, sus SUV y la lectura de la RM de columna.'
                  : 'Interactive bone-metastasis map with dual tracers (Gallium-68 and FDG): every lesion, one by one, with its 3D location, SUVs and the spine-MRI reading.' }}
              </p>
            </div>
            <span class="inline-flex w-full sm:w-auto shrink-0 items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-berenjena group-hover:text-miriam transition-colors rounded-xl bg-miriam-soft sm:bg-transparent px-4 sm:px-0 py-2.5 sm:py-0">
              {{ locale === 'es' ? 'Abrir el mapa de metástasis' : 'Open the metastasis map' }}
              <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </NuxtLink>
        </section>

        <!-- Ejes terapéuticos → panel de rebiopsia, subidos por encima de la
             historia clínica (es la «petición» del caso; no debe quedar al fondo).
             Siguen dentro de la capa de datos (showData) abierta más arriba. -->
        <DnaDivider class="mb-10" />
        <section class="mb-14" aria-labelledby="axes-title">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Ejes terapéuticos' : 'Therapeutic axes' }}</p>
          <h2
            id="axes-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ locale === 'es' ? 'Hacia dónde apuntar' : 'Where to aim' }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'De todo lo anterior se desprenden varias dianas. Estos son los ejes terapéuticos candidatos que sugiere el perfil molecular, cada uno con su propia lógica de tratamiento.'
              : 'Several candidate targets follow from all of the above. These are the therapeutic axes the molecular profile points to, each with its own treatment rationale.' }}
          </p>
          <!-- Cada eje, con tooltip que explica qué hace esa opción de tratamiento. -->
          <div class="flex flex-wrap gap-2" translate="no">
            <template v-for="(axis, ai) in $tm('ciencia.axes')" :key="ai">
              <Term
                v-if="axisTerms[ai]"
                :id="axisTerms[ai]"
                :label="String($rt(axis))"
                variant="badge"
              />
              <span v-else class="badge-genomic">{{ $rt(axis) }}</span>
            </template>
          </div>
          <details class="notes-disclosure mt-4">
            <summary>
              {{ locale === 'es' ? 'Cómo interpretar estos ejes' : 'How to read these axes' }}
            </summary>
            <p class="text-xs text-tinta leading-relaxed max-w-2xl">
              {{ $t('ciencia.axes_note') }}
            </p>
          </details>
        </section>

        <section v-if="panelRows.length">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'El siguiente paso' : 'The next step' }}</p>
          <h2
            id="panel-title"
            class="heading-display text-2xl text-berenjena mb-2"
            style="letter-spacing: -0.02em"
          >
            {{ $t('ciencia.proposed_panel') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Una sola biopsia de la que sacar la caracterización del tumor más completa que la ciencia permite hoy —genómica, inmunogenómica y epigenética—, para no tener que repetirla. Es lo que financia la campaña.'
              : 'A single biopsy from which to obtain the most complete tumour characterisation that science currently allows —genomic, immunogenomic and epigenetic—, so it doesn’t have to be repeated. This is what the campaign funds.' }}
          </p>
          <p class="text-sm text-berenjena leading-relaxed font-medium mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Próximo paso (junio 2026): una rebiopsia ósea extendida, guiada por PET. La primera (abril 2026) no obtuvo tumor viable; esta busca asegurarlo para completar el perfil molecular y ver cómo evoluciona.'
              : 'Next step (June 2026): an extended, PET-guided bone rebiopsy. The first one (April 2026) did not yield viable tumour; this one aims to secure it, to complete the molecular profile and track how it evolves.' }}
          </p>
          <div class="data-card mb-14">
            <div class="overflow-x-auto">
              <table
                class="data-table data-table--dense data-table--cards"
                :aria-labelledby="locale === 'es' ? 'panel-title' : undefined"
              >
                <caption class="sr-only">
                  {{ $t('ciencia.proposed_panel_caption') }}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{{ $t('ciencia.component') }}</th>
                    <th scope="col" class="col-marker">{{ $t('ciencia.method') }}</th>
                    <th scope="col">{{ $t('ciencia.targets') }}</th>
                    <th scope="col" class="col-note">{{ $t('ciencia.implication') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in panelRows" :key="i">
                    <td class="cell-head font-semibold text-berenjena">{{ row.component }}</td>
                    <td class="col-marker" :data-label="$t('ciencia.method')">{{ row.method }}</td>
                    <td :data-label="$t('ciencia.targets')">{{ row.targets }}</td>
                    <td class="col-note cell-block" :data-label="$t('ciencia.implication')">{{ row.implication }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <details class="notes-disclosure px-4 sm:px-5 pb-4">
              <summary>
                {{ locale === 'es' ? 'Especificaciones técnicas de la biopsia' : 'Biopsy technical specifications' }}
              </summary>
              <p class="text-xs text-tinta leading-relaxed">
                {{ locale === 'es'
                  ? 'Aguja coaxial 14G sobre partes blandas perilesionales, sin descalcificar (el ácido degrada el ADN ~10×; si hay que descalcificar hueso, solo EDTA, nunca ácido). Touch-prep/ROSE para confirmar ≥30 % de celularidad tumoral antes de repartir nada. La referencia germinal (sangre/saliva) va aparte, cualquier día. No se comprometen WES+WGS+RNA-seq a un único core: se reservan 1–2 cores congelados para genómica y transcriptómica. Las biopsias líquidas seriadas cierran el bucle con las decisiones en tiempo real.'
                  : '14G coaxial needle into peri-lesional soft tissue, without decalcification (acid degrades DNA ~10×; if bone must be decalcified, EDTA only, never acid). Touch-prep/ROSE to confirm ≥30% tumour cellularity before allocating anything. The germline reference (blood/saliva) goes separately, any day. WES+WGS+RNA-seq are not committed to a single core: 1–2 frozen cores are reserved for genomics and transcriptomics. Serial liquid biopsies close the loop with real-time decisions.' }}
              </p>
            </details>
          </div>
          <Nota class="mt-4">
            {{ locale === 'es'
              ? 'Material de apoyo a la consulta: describe lo que una sola biopsia podría extraer; no es una indicación de tratamiento. Las decisiones —dónde pinchar, cuántos cores son seguros, qué ensayos son viables— las toma el equipo médico tratante.'
              : 'Consultation support material: it describes what a single biopsy could extract; it is not a treatment indication. The decisions —where to sample, how many cores are safe, which assays are feasible— are made by the treating medical team.' }}
          </Nota>
        </section>

        <hr class="chapter-rule" aria-hidden="true" />
        <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Historia clínica' : 'Clinical history' }}</p>
        <h2
          id="treatment-title"
          class="heading-display text-2xl text-berenjena mb-2"
          style="letter-spacing: -0.02em"
        >
          {{ $t('ciencia.treatment_history') }}
        </h2>
        <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
          {{ locale === 'es'
            ? 'Cada línea de tratamiento ha controlado la enfermedad durante un tiempo antes de que el tumor escape: el patrón esperable cuando se ataca solo el eje hormonal y se deja fuera el componente neuroendocrino.'
            : 'Each treatment line has held the disease for a while before the tumour escapes again: the pattern to expect when only the hormonal axis is targeted and the neuroendocrine component is left out.' }}
        </p>
        <ul class="space-y-3 mb-14" aria-labelledby="treatment-title">
          <li v-for="tx in treatments" :key="tx.line" class="card-base flex items-start gap-4">
            <span
              class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
              :class="tx.active ? 'bg-miriam-soft text-berenjena' : 'bg-cream text-tinta'"
              :style="tx.active ? '' : 'border: 1px solid rgba(45,27,61,0.10)'"
            >
              {{ tx.line }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <h4 class="font-semibold text-berenjena text-sm">{{ tx.regimen }}</h4>
                <span :class="['status-badge', tx.active ? 'status-badge--active' : 'status-badge--complete']">
                  {{ tx.active ? (locale === 'es' ? 'Activo' : 'Active') : (locale === 'es' ? 'Completado' : 'Completed') }}
                </span>
              </div>
              <p class="text-xs text-tinta mt-1 leading-relaxed">{{ tx.outcome }}</p>
            </div>
          </li>
        </ul>
        </div>
        <!-- /capa de datos (parte 1) -->

        <!-- Solo «Para médicos»: enlace a la capa longitudinal de la app. -->
        <div style="display: contents" v-show="showMedicoOnly">
        <!-- App entry: the longitudinal layer (treatment response + ctDNA over time) lives in the app.
             Mobile-first: en móvil el CTA baja a una píldora a ancho completo, claramente pulsable;
             en sm+ vuelve a la fila con el CTA alineado a la derecha. -->
        <NuxtLink
          :to="localePath('/contacto') + '?role=oncologist'"
          class="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 rounded-2xl px-4 sm:px-5 py-4 mb-14 transition-all active:scale-[0.99] sm:hover:-translate-y-0.5"
          style="background:rgba(232,212,237,0.30);text-decoration:none"
        >
          <div class="flex items-start gap-3.5 flex-1">
            <span
              class="shrink-0 w-9 h-9 rounded-xl bg-miriam-soft flex items-center justify-center"
            >
              <Icon name="ph:squares-four-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
            </span>
            <p class="flex-1 text-sm text-tinta leading-relaxed">
              {{ $t('ciencia.app_inline_text') }}
            </p>
          </div>
          <span
            class="inline-flex w-full sm:w-auto shrink-0 items-center justify-center sm:justify-start gap-2 text-sm font-semibold text-berenjena group-hover:text-miriam transition-colors rounded-xl bg-miriam-soft sm:bg-transparent px-4 sm:px-0 py-2.5 sm:py-0"
          >
            {{ $t('ciencia.app_inline_cta') }}
            <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </NuxtLink>
        </div>
        <!-- /solo médicos -->

        <!-- Capa narrativa (simple + médicos): el objetivo N-of-1. -->
        <div v-show="showNarrative" class="card-base mb-16" style="background:#2d1b3d;color:#faf6f0;border:none">
          <div class="flex items-center gap-2.5 mb-4">
            <span
              class="w-9 h-9 rounded-xl flex items-center justify-center"
              style="background:rgba(232,212,237,0.18)"
            >
              <Icon name="ph:target-fill" class="w-5 h-5" style="color:#e8d4ed" aria-hidden="true" />
            </span>
            <div>
              <p class="eyebrow" style="color:#e8d4ed;opacity:0.85">{{ locale === 'es' ? 'Objetivo' : 'Goal' }}</p>
              <h3 class="heading-display text-lg" style="color:#faf6f0">
                {{ $t('ciencia.goal_n_of_1') }}
              </h3>
            </div>
          </div>
          <p class="text-sm leading-relaxed mb-3" style="color:rgba(250,246,240,0.85)">
            {{ $t('ciencia.goal_n_of_1_desc') }}
          </p>
          <p class="text-sm leading-relaxed mb-3" style="color:rgba(250,246,240,0.70)">
            {{ $t('ciencia.win_consortium_desc') }}
          </p>
          <p class="text-sm font-medium" style="color:#e8d4ed">
            {{ $t('ciencia.win_consortium_precedent') }}
          </p>
        </div>

        <!-- Solo «Para médicos»: dossier de evidencia + análisis detallados. -->
        <div style="display: contents" v-show="showMedicoOnly">
        <!-- Deeper dive: full evidence dossier (its own page) -->
        <div class="mb-16">
          <!-- Teaser: full evidence dossier (moved to its own page) -->
          <NuxtLink
            :to="localePath('/ciencia/evidencia')"
            class="card-base flex flex-col h-full transition-all group hover:-translate-y-0.5"
            style="text-decoration:none"
          >
            <span
              class="shrink-0 w-11 h-11 rounded-2xl bg-miriam-soft flex items-center justify-center mb-4"
            >
              <Icon name="ph:books-fill" class="w-5 h-5 text-berenjena" aria-hidden="true" />
            </span>
            <p class="eyebrow mb-1.5 block">{{ $t('ciencia.evidence_hook_eyebrow') }}</p>
            <h3 class="heading-display text-lg text-berenjena mb-1.5 group-hover:text-miriam transition-colors">
              {{ $t('ciencia.key_evidence') }}
            </h3>
            <p class="text-sm text-tinta leading-relaxed mb-4">
              {{ $t('ciencia.evidence_hook_body') }}
            </p>
            <span
              class="mt-auto inline-flex items-center gap-2 text-sm font-medium text-berenjena group-hover:text-miriam transition-colors"
            >
              {{ $t('ciencia.evidence_hook_cta') }}
              <Icon name="ph:arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </NuxtLink>
        </div>

        <div v-if="articles && articles.length > 0">
          <p class="eyebrow mb-2 block">{{ locale === 'es' ? 'Profundizar' : 'Go deeper' }}</p>
          <h2 class="heading-display text-2xl text-berenjena mb-2" style="letter-spacing: -0.02em">
            {{ $t('ciencia.detailed_analyses') }}
          </h2>
          <p class="text-sm text-tinta leading-relaxed mb-6 max-w-2xl">
            {{ locale === 'es'
              ? 'Cada hallazgo, desarrollado en su propio artículo con la evidencia que lo respalda.'
              : 'Each finding, developed in its own article with the evidence behind it.' }}
          </p>
          <div class="space-y-4">
            <NuxtLink
              v-for="article in articles"
              :key="article.path"
              :to="localePath(`/ciencia/${article.stem?.split('/').pop()}`)"
              class="card-base flex items-start justify-between gap-4 transition-all group hover:-translate-y-0.5"
              style="text-decoration:none"
            >
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  <span
                    v-for="tag in article.tags"
                    :key="tag"
                    class="status-badge status-badge--reference"
                    >{{ tag }}</span
                  >
                </div>
                <h3
                  class="font-display font-semibold text-berenjena text-base mb-1 group-hover:text-miriam transition-colors"
                >
                  {{ article.title }}
                </h3>
                <p class="text-xs text-tinta leading-relaxed line-clamp-2">
                  {{ article.excerpt }}
                </p>
              </div>
              <Icon
                name="ph:arrow-right"
                class="shrink-0 w-4 h-4 text-tinta group-hover:text-miriam transition-colors mt-0.5"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>
        </div>
        <!-- /solo médicos -->

        <!-- Cierre mode-aware (comité · conversión + psico-onco): en llano la
             donación es la resolución; en pro, acción profesional con la
             financiación como nota al pie (no como venta). Coral = solo
             campaña; el resto, navegación. -->
        <section v-show="level === 'simple'" class="card-base mt-4" aria-labelledby="ciencia-help-title">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.help_eyebrow') }}</p>
          <h2 id="ciencia-help-title" class="heading-display text-xl text-berenjena mb-2">{{ $t('ciencia.help_title') }}</h2>
          <p class="text-sm text-tinta leading-relaxed mb-5 max-w-2xl">{{ $t('ciencia.help_body') }}</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <a
              :href="GOFUNDME_URL"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackSupport('ciencia_simple')"
              data-support-cta
              class="btn-cta justify-center"
            >
              <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
              {{ $t('ciencia.help_cta') }}
            </a>
            <NuxtLink :to="localePath('colabora')" class="btn-secondary justify-center">
              {{ $t('ciencia.help_share') }}
            </NuxtLink>
          </div>
        </section>

        <section v-show="showData" class="card-base mt-4" aria-labelledby="ciencia-pro-help-title">
          <p class="eyebrow mb-2 block">{{ $t('ciencia.pro_help_eyebrow') }}</p>
          <h2 id="ciencia-pro-help-title" class="heading-display text-xl text-berenjena mb-3">{{ $t('ciencia.pro_help_title') }}</h2>
          <ul class="space-y-2.5 mb-4">
            <li class="flex items-start gap-3 text-sm text-tinta leading-relaxed">
              <Icon name="ph:chat-circle-text-fill" class="w-4 h-4 mt-0.5 shrink-0 text-miriam" aria-hidden="true" />
              <NuxtLink :to="localePath('/contacto') + '?role=oncologist'" class="link-inline">{{ $t('ciencia.pro_help_contribute') }}</NuxtLink>
            </li>
            <li class="flex items-start gap-3 text-sm text-tinta leading-relaxed">
              <Icon name="ph:share-network-fill" class="w-4 h-4 mt-0.5 shrink-0 text-miriam" aria-hidden="true" />
              <NuxtLink :to="localePath('colabora')" class="link-inline">{{ $t('ciencia.pro_help_share') }}</NuxtLink>
            </li>
          </ul>
          <p class="text-xs text-tinta leading-relaxed">
            {{ $t('ciencia.pro_help_fund') }}
            <a :href="GOFUNDME_URL" target="_blank" rel="noopener noreferrer" @click="trackSupport('ciencia_pro')" class="link-inline">{{ $t('ciencia.pro_help_fund_cta') }}</a>.
          </p>
        </section>

        <!-- Captura de audiencia (retención): sigue el caso por email. Visible
             en ambos modos. RGPD-compliant (ver componente). -->
        <CaseFollowSignup class="mt-4" />

        <Nota class="mt-12 pt-6" style="border-top: 1px solid rgba(45,27,61,0.08)">
          {{ locale === 'es' ? 'Última actualización: 14 de junio de 2026' : 'Last updated: 14 June 2026' }}
        </Nota>
          </div>
          <!-- /columna de contenido del dossier -->
        </div>
        <!-- /grid índice + contenido (pro) -->
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()
const L = (es: string, en: string) => (locale.value === 'es' ? es : en)
// Cierre de conversión: donación (llano) y financiación como nota (pro). Mismo
// patrón que el resto del sitio; dispara el goal de apoyo con su ubicación.
const { GOFUNDME_URL, trackSupport, trackScience } = useSupport()

function printPage() {
  if (!import.meta.client) return
  window.print()
}

// Mapa eje terapéutico → id de glosario (Term), mismo orden que ciencia.axes.
const axisTerms = ['axis_fgfr', 'axis_sstr', 'axis_esr1', 'axis_ne']

// Ciencia en 2 versiones por audiencia (auditoría 3.4). 'pro' por defecto =
// página clínica completa. Las versiones controlan visibilidad con v-show (no
// v-if) sobre contenedores `display:contents`, así no cambian el HTML estático
// ni la hidratación.
// Dos versiones por tipo de lector (la doble audiencia del sitio): «Para todos»
// (sin tecnicismos, POR DEFECTO) y «Para profesionales» (la página clínica
// completa). Plain-first: todos entran en el resumen llano; el modo clínico se
// abre con un tap o llega directo vía ?nivel=pro (botón «Medicina/investigación»
// del home). Todo el contenido pro sigue en el HTML vía v-show → SEO y agentes
// de IA lo ven igual aunque entres en simple.
type ReadingLevel = 'simple' | 'pro'
const route = useRoute()
const level = ref<ReadingLevel>(route.query.nivel === 'pro' ? 'pro' : 'simple')
onMounted(() => {
  // La URL manda sobre lo recordado; sin ?nivel, recupera la última elección.
  if (route.query.nivel === 'pro' || route.query.nivel === 'simple') return
  try {
    const saved = localStorage.getItem('hm_ciencia_nivel')
    if (saved === 'pro' || saved === 'simple') level.value = saved as ReadingLevel
  } catch {
    /* sin localStorage */
  }
})
watch(level, (v, prev) => {
  try {
    localStorage.setItem('hm_ciencia_nivel', v)
  } catch {
    /* noop */
  }
  if (prev && v === 'pro' && prev !== 'pro') trackScience('ciencia_nivel_pro')
})
// A11y: texto que un lector de pantalla anuncia al cambiar de modo (región
// aria-live) — para que el cambio de contenido nunca sea silencioso.
const levelAnnounce = computed(() =>
  level.value === 'pro' ? t('ciencia.announce_pro') : t('ciencia.announce_simple')
)
// Abre el detalle clínico desde la puerta-invitación y lleva al inicio de la capa
// pro, gestionando el foco (a11y: el cambio de contenido no debe ser silencioso).
function goPro() {
  level.value = 'pro'
  nextTick(() => {
    const el = document.getElementById('snapshot-title')
    if (el) {
      el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}
const levelOptions = computed(() => [
  { id: 'simple' as const, label: t('ciencia.level_simple') },
  { id: 'pro' as const, label: t('ciencia.level_pro') },
])
// Todo el contenido técnico (snapshot, anomalía, perfil, imagen, tratamientos,
// ejes, panel, dossier, artículos) solo en «Para profesionales». showData y
// showMedicoOnly coinciden ahora que hay dos versiones; se mantienen ambos
// nombres para no tocar las plantillas.
const showData = computed(() => level.value === 'pro')
const showMedicoOnly = computed(() => level.value === 'pro')
// El esquema visual «dos caras» y el objetivo se muestran en ambas versiones.
const showNarrative = true

// Subtítulo de cabecera según el nivel: en simple, sin tecnicismos.
const headerSubtitle = computed(() =>
  level.value === 'simple' ? t('science.subtitle_simple') : t('science.subtitle')
)

// Contenido propio del «Resumen simple»: preguntas en lenguaje llano.
const simplePoints = computed(() =>
  [1, 2, 3, 4].map((n) => ({
    q: t(`ciencia.simple_q${n}`),
    a: t(`ciencia.simple_a${n}`),
  }))
)

useSeoMeta({
  title: () =>
    locale.value === 'es'
      ? 'Perfil molecular del tumor: BC-NED, FGFR1 ×13 y SSTR2+'
      : 'Tumor molecular profile: BC-NED, FGFR1 ×13, SSTR2+',
  description: () =>
    locale.value === 'es'
      ? 'El perfil molecular del tumor de Miriam: cáncer de mama con diferenciación neuroendocrina, FGFR1 ×13 y SSTR2+. Documentación clínica abierta.'
      : "Miriam's tumor molecular profile: breast cancer with neuroendocrine differentiation, FGFR1 ×13 and SSTR2+. Open clinical documentation.",
  ogTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR2+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR2+',
  ogDescription: () =>
    locale.value === 'es'
      ? 'Análisis científico del caso: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (PET Ga-68). Metástasis óseas, ECOG 1, sin crisis visceral. Rebiopsia molecular avanzada como siguiente paso.'
      : 'Scientific case analysis: BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (Ga-68 PET). Bone metastases, ECOG 1, no visceral crisis. Advanced molecular rebiopsy as the next step.',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () =>
    locale.value === 'es'
      ? 'Perfil molecular BC-NED + FGFR1 ×13 + SSTR2+'
      : 'Molecular profile BC-NED + FGFR1 ×13 + SSTR2+',
  twitterDescription: () =>
    locale.value === 'es'
      ? 'BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (PET Ga-68). El perfil molecular completo del tumor de Miriam.'
      : "BC-NED, FGFR1 ×13, CCND1 ×20, SSTR2+ (Ga-68 PET). Miriam's full tumor molecular profile.",
})

defineOgImage('Default.takumi', {
  title: () => t('science.title'),
  description: () =>
    locale.value === 'es'
      ? 'El perfil molecular completo del tumor, explicado.'
      : "The tumor's full molecular profile, explained.",
})

const faq =
  locale.value === 'es'
    ? [
        {
          q: '¿Por qué este cáncer de mama no encaja en los protocolos estándar?',
          a: 'Sobre el papel es un tumor luminal (HR+/HER2−), pero ~80% muestra diferenciación neuroendocrina, con amplificación FGFR1 ×13 y CCND1 ×20. Este subtipo híbrido (BC-NED) tiene peor pronóstico y suele necesitar estrategias distintas a las del cáncer de mama luminal estándar.',
        },
        {
          q: '¿Qué dianas accionables tiene el tumor?',
          a: 'El PET con Galio-68 demuestra expresión de receptores de somatostatina de subtipo 2 (SSTR2), diana de la terapia con radioligandos (PRRT). El perfil molecular añade la amplificación FGFR1 ×13 como diana candidata frente a inhibidores de FGFR.',
        },
        {
          q: '¿Cuál es el siguiente paso del caso?',
          a: 'Una rebiopsia ósea con panel molecular avanzado, revisada por un tumor board internacional (WIN Consortium), para diseñar un tratamiento N-of-1 dirigido a la biología real del tumor.',
        },
      ]
    : [
        {
          q: 'Why doesn’t this breast cancer fit the standard protocols?',
          a: 'On paper it is a luminal tumor (HR+/HER2−), but ~80% shows neuroendocrine differentiation, with FGFR1 ×13 and CCND1 ×20 amplification. This hybrid subtype (BC-NED) has a worse prognosis and usually needs strategies different from standard luminal breast cancer.',
        },
        {
          q: 'What actionable targets does the tumor have?',
          a: 'The Gallium-68 PET shows somatostatin-receptor subtype 2 (SSTR2) expression, the target of radioligand therapy (PRRT). The molecular profile adds FGFR1 ×13 amplification as a candidate target for FGFR inhibitors.',
        },
        {
          q: 'What is the next step in the case?',
          a: 'A bone rebiopsy with an advanced molecular panel, reviewed by an international tumor board (WIN Consortium), to design an N-of-1 treatment directed at the tumor’s actual biology.',
        },
      ]

useSchemaOrg([
  defineWebPage({
    '@type': ['WebPage', 'MedicalWebPage'],
    name: () => t('science.title'),
  }),
  ...faq.map((item) =>
    defineQuestion({ name: item.q, acceptedAnswer: item.a })
  ),
])

// MedicalCondition JSON-LD: describe la entidad clínica de forma estructurada
// para buscadores médicos y agentes de IA. Datos verificados (ver CLAUDE.md);
// deliberadamente NO declara tratamientos (mantener el principio de no prometer
// terapias). Raw JSON-LD vía useHead, ya que schema-org no expone el helper.
const conditionJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name:
      locale.value === 'es'
        ? 'Cáncer de mama metastásico HR+/HER2− con diferenciación neuroendocrina (BC-NED)'
        : 'Metastatic HR+/HER2− breast cancer with neuroendocrine differentiation (BC-NED)',
    alternateName: ['BC-NED', 'Breast carcinoma with neuroendocrine differentiation'],
    description:
      locale.value === 'es'
        ? 'Carcinoma de mama luminal (HR+/HER2−) con ~80% de diferenciación neuroendocrina y amplificación FGFR1 ×13, CCND1 ×20 (clúster 11q13); expresión de SSTR2 en PET Ga-68. Metástasis exclusivamente óseas.'
        : 'Luminal breast carcinoma (HR+/HER2−) with ~80% neuroendocrine differentiation and FGFR1 ×13, CCND1 ×20 amplification (11q13 cluster); SSTR2 expression on Ga-68 PET. Bone-only metastases.',
    associatedAnatomy: [
      { '@type': 'AnatomicalStructure', name: locale.value === 'es' ? 'Mama' : 'Breast' },
      { '@type': 'AnatomicalStructure', name: locale.value === 'es' ? 'Hueso (metástasis)' : 'Bone (metastases)' },
    ],
  })
)

useHead({
  script: [{ type: 'application/ld+json', innerHTML: conditionJsonLd }],
})

const { data: articles } = await useAsyncData(
  `ciencia-index-${locale.value}`,
  async () => {
    if (locale.value === 'en') {
      const enArticles = await queryCollection('science_articles')
        .order('date', 'DESC')
        .all()
      if (enArticles.length) return enArticles
    }
    return queryCollection('ciencia_articles').order('date', 'DESC').all()
  },
  { watch: [locale] }
)

import type { Collections, ScienceEnCollectionItem } from '@nuxt/content'

const { data: scienceData } = await useAsyncData(
  `science-data-${locale.value}`,
  () => {
    const collection = `science_${locale.value || 'en'}` as keyof Collections
    return queryCollection(
      collection
    ).first() as Promise<ScienceEnCollectionItem | null>
  },
  { watch: [locale] }
)

const treatments = computed(() => scienceData.value?.treatments ?? [])
const panelRows = computed(() => scienceData.value?.panelRows ?? [])
const imaging = computed(() => scienceData.value?.imaging ?? null)

const snapshotRows = computed(() =>
  [
    { label: t('ciencia.snapshot_diagnosis_label'), value: t('ciencia.snapshot_diagnosis'), wide: true, mono: false, tag: t('ciencia.snapshot_diagnosis_tag'), tone: 'warn' },
    { label: t('ciencia.snapshot_grade_label'), value: t('ciencia.snapshot_grade'), wide: true, mono: true, tag: t('ciencia.snapshot_grade_tag'), tone: 'info' },
    { label: t('ciencia.snapshot_status_label'), value: t('ciencia.snapshot_status'), wide: true, mono: false, tag: t('ciencia.snapshot_status_tag'), tone: 'positive' },
    { label: t('ciencia.snapshot_drivers_label'), value: t('ciencia.snapshot_drivers'), wide: false, mono: true, tag: t('ciencia.snapshot_drivers_tag'), tone: 'violet' },
    { label: t('ciencia.snapshot_target_label'), value: t('ciencia.snapshot_target'), wide: false, mono: false, tag: t('ciencia.snapshot_target_tag'), tone: 'positive' },
    { label: t('ciencia.snapshot_resistance_label'), value: t('ciencia.snapshot_resistance'), wide: true, mono: false, tag: t('ciencia.snapshot_resistance_tag'), tone: 'warn' },
  ].map((row) => {
    const parts = row.value.split(' · ')
    return {
      ...row,
      lead: parts[0],
      rest: parts.slice(1).join(' · '),
    }
  })
)
</script>

<style scoped>
/* Salto por anclas del índice: el objetivo es el <h2>, pero encima lleva un
   rótulo (eyebrow). El margen debe despejar la cabecera pegajosa (~73px) Y ese
   rótulo, para que no quede medio tapado («no se ve Perfil molecular»). */
#snapshot-title,
#tejido-3veces,
#molecular-profile-title,
#imaging-tissue-title,
#panel-title,
#treatment-title {
  scroll-margin-top: 7.5rem;
}
/* Columna de referencia (VHIO) resaltada en la tabla de patología "3 lecturas". */
.reads-vh { background: rgba(157, 68, 171, 0.07); }

/* Conmutador de nivel de lectura (ciencia en 3 capas). Sigue la paleta del
   sistema: berenjena para el activo, mono para las etiquetas. Tap target ≥40px. */
.reading-level {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
}
.reading-level__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(45, 27, 61, 0.55);
}
.reading-level__seg {
  /* Móvil: ocupa el ancho y las pastillas se reparten la fila (etiquetas largas
     como «Para mentes curiosas» no se salen). En sm+ vuelve a tamaño automático. */
  display: flex;
  width: 100%;
  max-width: 440px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(45, 27, 61, 0.05);
  border: 1px solid rgba(45, 27, 61, 0.1);
}
.reading-level__btn {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.02em;
  line-height: 1.15;
  color: rgba(45, 27, 61, 0.62);
  padding: 8px 12px;
  min-height: 40px;
  border-radius: 999px;
  transition: background 0.18s ease, color 0.18s ease;
}
@media (min-width: 640px) {
  .reading-level__seg {
    width: auto;
    max-width: none;
  }
  .reading-level__btn {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 9px 16px;
  }
}
.reading-level__btn:hover {
  color: #2d1b3d;
}
.reading-level__btn.is-active {
  background: #2d1b3d;
  color: #faf6f0;
  font-weight: 600;
}
.reading-level__btn:focus-visible {
  outline: 2px solid #ff6b47;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .reading-level__btn {
    transition: none;
  }
}
</style>
