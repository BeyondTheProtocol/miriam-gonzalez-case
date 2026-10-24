<template>
  <div lang="es">
    <!-- Guía viva del sistema de diseño v3. Pinta los componentes REALES (no HTML a mano): si un componente cambia, esta
         página cambia sola. Es una página de trabajo, no de contenido: noindex, fuera del sitemap y sin enlaces internos
         (la alcanza /design-system/, que redirige aquí). Está en español en las dos rutas (/guia-de-estilo y /en/style-guide):
         lang="es" lo dice. Todos los valores de las muestras son de ejemplo: ninguna cifra ni cita es real.
         Reglas completas: app/assets/css/design-system-v2/DESIGN-SYSTEM.md -->

    <Banda tono="crema" compacta>
      <PageHeader
        eyebrow="Guía viva"
        title="Sistema de diseño v3"
        lede="Los componentes reales, con los tokens reales. Si algo de aquí no coincide con DESIGN-SYSTEM.md, manda el código y se corrige el documento."
        variante="pagina"
      />
      <Aviso tipo="apoyo" titulo="Valores de ejemplo">
        <p>Todo lo que se ve en esta página es de muestra. Ninguna cifra, referencia o estado describe el caso de nadie.</p>
      </Aviso>
    </Banda>

    <!-- Paleta y roles -->
    <Banda tono="tarjeta" titular="g-paleta">
      <CabeceraSeccion id="g-paleta" eyebrow="Tokens" titulo="Cinco colores y los roles que los usan" lede="Los componentes pintan con roles; el tema los remapea. Sin hex nuevos." />
      <ul class="g-muestras" role="list">
        <li v-for="m in PALETA" :key="m.token" class="g-muestra">
          <span class="g-muestra__color" :style="{ background: `var(${m.token})` }" aria-hidden="true" />
          <span class="g-muestra__token">{{ m.token }}</span>
          <span class="g-muestra__uso">{{ m.uso }}</span>
        </li>
      </ul>
    </Banda>

    <!-- Tipografía -->
    <Banda tono="crema" titular="g-tipo">
      <CabeceraSeccion id="g-tipo" eyebrow="Tipografía" titulo="Un rol por clase" lede="Tamaño, peso, interlineado y tracking van dentro de la clase. El suelo es de 13 px." />
      <div class="g-roles">
        <div v-for="r in ROLES" :key="r.clase" class="g-rol">
          <p class="etiqueta">{{ r.clase }} · {{ r.medida }}</p>
          <p :class="r.clase">{{ r.muestra }}</p>
        </div>
      </div>
    </Banda>

    <!-- Botones y enlaces -->
    <Banda tono="tarjeta" titular="g-botones">
      <CabeceraSeccion id="g-botones" eyebrow="Acciones" titulo="Cuatro botones, cada uno con su papel" lede="El coral es solo para apoyar. Todos miden 44 px y tienen estado deshabilitado y de envío." />
      <div class="g-fila">
        <button type="button" class="btn-cta">Apoyar</button>
        <button type="button" class="btn-dark">Explorar</button>
        <button type="button" class="btn-secondary">Contactar</button>
        <button type="button" class="btn-ghost">Más tarde</button>
      </div>
      <div class="g-fila">
        <button type="button" class="btn-cta" disabled>Deshabilitado</button>
        <button type="button" class="btn-dark" aria-busy="true">Enviando</button>
      </div>
      <p class="prosa g-parrafo">
        Un enlace dentro de una frase lleva <a href="#g-botones" class="link-inline">subrayado siempre visible</a>.
        Fuera de una frase, <a href="#g-botones" class="link-action">un enlace de acción<Icon name="ph:arrow-right" class="w-4 h-4" aria-hidden="true" /></a>
      </p>
    </Banda>

    <!-- Tarjetas -->
    <Banda tono="crema" titular="g-tarjetas">
      <CabeceraSeccion id="g-tarjetas" eyebrow="Tarjetas" titulo="Una tarjeta, con tres tonos" lede="La destacada es la protagonista y hay una por grupo. El coral es solo para donar." />
      <div class="g-rejilla">
        <TarjetaEnlace titulo="Interna, tono suave" meta="Lleva a otra página del sitio." icono="ph:compass" :to="'/'" />
        <TarjetaEnlace titulo="Destacada" meta="La protagonista del grupo." icono="ph:star-four" tono="destacada" :to="'/'" />
        <TarjetaEnlace titulo="Externa" meta="Abre en pestaña nueva y lo avisa." icono="ph:globe" href="https://example.org/" />
        <TarjetaEnlace titulo="Apoyo" meta="Solo para donar." icono="ph:heart" tono="apoyo" href="https://example.org/" />
        <TarjetaEnlace titulo="Herramienta de ejemplo" meta="Con verbo, esfuerzo y nivel." icono="ph:flask" :to="'/'" verbo="Explorar" esfuerzo="1 minuto, sin registro" nivel="Para profesionales" />
      </div>
      <div class="g-rejilla g-separado">
        <div class="card-base"><p class="h4-tarjeta">card-base</p><p class="g-parrafo">Papel y filete. Una tarjeta que no se pulsa.</p></div>
        <div class="card-base card-marked"><p class="h4-tarjeta">card-marked</p><p class="g-parrafo">La protagonista: borde y sombra dura.</p></div>
      </div>
    </Banda>

    <!-- Estados -->
    <Banda tono="tarjeta" titular="g-estados">
      <CabeceraSeccion id="g-estados" eyebrow="Estados" titulo="Cinco estados, siempre con icono y palabra" lede="El color nunca es la única señal." />
      <div class="g-fila">
        <span class="status-badge status-badge--hecho">Hecho</span>
        <span class="status-badge status-badge--curso">En curso</span>
        <span class="status-badge status-badge--pendiente">Pendiente</span>
        <span class="status-badge status-badge--nopuede">No puede</span>
        <span class="status-badge status-badge--atencion">Atención</span>
      </div>
      <div class="g-fila">
        <span class="pill-data pill-data--positive">positive</span>
        <span class="pill-data pill-data--info">info</span>
        <span class="pill-data pill-data--warn">warn</span>
        <span class="pill-data pill-data--neutral">neutral</span>
        <span class="pill-data pill-data--violet">violet</span>
      </div>
      <div class="card-base g-ruta">
        <RutaPasos :pasos="PASOS" progreso="1 de 4 pasos dados" :etiquetas="ETIQUETAS" />
      </div>
    </Banda>

    <!-- Datos, avisos y referencias -->
    <Banda tono="crema" titular="g-datos">
      <CabeceraSeccion id="g-datos" eyebrow="Datos" titulo="Un valor, con su fuente a la vista" lede="El dato lleva su fecha, su sello y su fuente. Sin fuente, no hay dato." />
      <div class="g-rejilla">
        <Dato etiqueta="Muestra grande" valor="1.234" unidad="unidades" fecha="2026-10-01" sello="inferido" :fuente="{ texto: 'Fuente de ejemplo' }" tam="lg" />
        <Dato etiqueta="Muestra mediana" valor="56" unidad="unidades" fecha="2026-09" sello="dicho" tam="md" />
        <Dato etiqueta="Muestra pequeña" valor="7,8" unidad="unidades" tam="sm" />
      </div>
      <div class="g-columna g-separado">
        <Aviso tipo="apoyo" titulo="Apoyo a la decisión"><p>Texto de ejemplo de un aviso de apoyo.</p></Aviso>
        <Aviso tipo="legal" titulo="Aviso legal"><p>Texto de ejemplo de un aviso legal.</p></Aviso>
        <Aviso tipo="limites" titulo="Lo que esto no dice" plegable><p>Texto de ejemplo de un aviso de límites, plegado.</p></Aviso>
      </div>
      <div class="g-separado">
        <Referencia autoria="Apellido A, Apellido B" :anio="2000" titulo="Título de un artículo de ejemplo" revista="Revista de ejemplo" doi="10.0000/ejemplo" nivel="Escalón de la evidencia, dicho con palabras" />
      </div>
    </Banda>

    <!-- Controles -->
    <Banda tono="tarjeta" titular="g-controles">
      <CabeceraSeccion id="g-controles" eyebrow="Controles" titulo="Controles equivalentes, comportamiento equivalente" lede="44 px, foco visible, teclado completo y el estado activo con algo más que color." />
      <div class="g-columna">
        <Segmentado v-model="radios" :opciones="OPCIONES" etiqueta="Radios de ejemplo" />
        <Segmentado v-model="pestana" :opciones="OPCIONES" modo="pestanas" etiqueta="Pestañas de ejemplo" />
        <Segmentado v-model="filtros" :opciones="OPCIONES" modo="toggle" etiqueta="Filtros de ejemplo" desplazable />
        <div>
          <label class="form-label" for="g-campo">Campo de formulario</label>
          <input id="g-campo" class="form-input" type="text" placeholder="Texto de ejemplo" autocomplete="off">
        </div>
        <details class="desplegable">
          <summary>Desplegable de sección</summary>
          <p class="prosa g-parrafo">Contenido plegado, legible, con un resumen de 44 px.</p>
        </details>
        <div class="tabla-scroll" tabindex="0" role="region" aria-label="Tabla de ejemplo, desplazable">
          <table class="data-table">
            <thead><tr><th>Columna A</th><th>Columna B</th><th>Columna C</th><th>Columna D</th><th>Columna E</th><th>Columna F</th></tr></thead>
            <tbody>
              <tr><td>Valor 1</td><td>Valor 2</td><td>Valor 3</td><td>Valor 4</td><td>Valor 5</td><td>Valor 6</td></tr>
              <tr><td>Valor 7</td><td>Valor 8</td><td>Valor 9</td><td>Valor 10</td><td>Valor 11</td><td>Valor 12</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </Banda>

    <!-- Banda oscura y visor (la única oscura de la página) -->
    <Banda tono="oscura" titular="g-oscura">
      <CabeceraSeccion id="g-oscura" eyebrow="Banda oscura" titulo="Una por página, siempre a sangre" lede="El texto, el enlace, el foco y los botones se invierten solos porque pintan con roles." />
      <div class="g-fila">
        <button type="button" class="btn-cta">Apoyar</button>
        <button type="button" class="btn-dark">Explorar</button>
        <button type="button" class="btn-secondary">Contactar</button>
      </div>
      <p class="prosa g-parrafo">Un enlace dentro de una <a href="#g-oscura" class="link-inline">frase en banda oscura</a> sigue siendo legible.</p>
      <div class="visor g-visor" data-tema="oscuro" role="img" aria-label="Escenario de ejemplo de un visor en estado de carga">
        <div class="visor__velo"><span class="visor__carga anima-esencial" aria-hidden="true" /></div>
      </div>
    </Banda>
  </div>
</template>

<script setup lang="ts">
import type { PasoRuta } from '~/utils/estadoInsignia'

useSeoMeta({
  title: 'Guía de estilo',
  description: 'Guía viva del sistema de diseño de helpmiriam.com: los componentes reales con los tokens reales.',
  robots: 'noindex, nofollow',
})

const PALETA = [
  { token: '--color-bg', uso: 'Crema: fondo claro' },
  { token: '--color-bg-card', uso: 'Crema profunda: superficies' },
  { token: '--color-text', uso: 'Berenjena: texto y fondo oscuro' },
  { token: '--color-text-soft', uso: 'Tinta: texto secundario' },
  { token: '--color-miriam', uso: 'Violeta de firma: identidad' },
  { token: '--color-miriam-soft', uso: 'Violeta suave: fondo de insignias' },
  { token: '--color-cta', uso: 'Coral: solo acción de apoyar' },
]

const ROLES = [
  { clase: 'h1-pagina', medida: '30 a 48 px', muestra: 'Titular de página' },
  { clase: 'h2-seccion', medida: '30 a 36 px', muestra: 'Titular de sección' },
  { clase: 'h3-seccion', medida: '20 a 24 px', muestra: 'Subtítulo dentro de una sección' },
  { clase: 'h4-tarjeta', medida: '17 px', muestra: 'Título de tarjeta' },
  { clase: 'lede', medida: '19 a 21 px', muestra: 'Entradilla bajo un titular, para presentar lo que viene.' },
  { clase: 'prosa', medida: '17/1,6', muestra: 'Lectura larga. Una frase de ejemplo para ver el interlineado y la medida de línea del cuerpo de texto del sitio.' },
  { clase: 'eyebrow', medida: 'mono 12 px', muestra: 'Línea sobre un titular' },
  { clase: 'etiqueta', medida: 'mono 12 px', muestra: 'Kicker de tarjeta' },
]

const OPCIONES = [
  { valor: 'a', etiqueta: 'Opción A' },
  { valor: 'b', etiqueta: 'Opción B' },
  { valor: 'c', etiqueta: 'Opción C' },
]
const radios = ref<string | string[]>('a')
const pestana = ref<string | string[]>('a')
const filtros = ref<string | string[]>(['b'])

const PASOS: PasoRuta[] = [
  { id: 'p1', titulo: 'Paso de ejemplo ya dado', estado: 'hecho' },
  { id: 'p2', titulo: 'Paso que se hace hoy', estado: 'curso' },
  { id: 'p3', titulo: 'Paso que viene', estado: 'pendiente' },
  { id: 'p4', titulo: 'Paso que pide una decisión', estado: 'abierto' },
]
const ETIQUETAS = { hecho: 'Hecho', curso: 'En curso', pendiente: 'Pendiente', abierto: 'Abierto' }
</script>

<style scoped>
.g-muestras { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-16); grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }
.g-muestra { display: flex; flex-direction: column; gap: var(--sp-4); }
.g-muestra__color { display: block; height: 3.5rem; border-radius: var(--radius-btn); border: 1px solid var(--trazo-medio); }
.g-muestra__token { font: 600 var(--texto-xs) / 1.3 var(--font-mono); color: var(--texto-1); }
.g-muestra__uso { font: var(--tipo-body-sm); color: var(--texto-2); }
.g-roles { display: grid; gap: var(--sp-24); }
.g-rol > p { margin: 0 0 var(--sp-4); }
.g-fila { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-12); margin-bottom: var(--sp-16); }
.g-parrafo { margin: var(--sp-8) 0 0; }
.g-rejilla { display: grid; gap: var(--sp-16); grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
.g-columna { display: grid; gap: var(--sp-16); }
.g-separado { margin-top: var(--sp-24); }
.g-ruta { max-width: 40rem; margin-top: var(--sp-24); }
.g-visor { margin-top: var(--sp-24); aspect-ratio: 16 / 7; }
</style>
