<script setup lang="ts">
/**
 * El esquema del tumor de /ciencia (fase «esquema» de la tanda 3, 25-oct-2026). Va en el bloque «Explicado sin tecnicismos», entre las cuatro
 * respuestas y la ruta. NO es un componente del sistema: es una figura de contenido (no entra en la guía viva ni en DESIGN-SYSTEM.md §4).
 * Sustituye al TwoFaces de antes, que contaba «dos caras» con una costura entre dos mitades: lo que dicen hoy los informes y la lectura célula a
 * célula es UN tumor luminal con rasgos neuroendocrinos repartidos, y la posición en el dibujo es una afirmación (dentro o fuera de la
 * membrana se lee como «está en el tumor»).
 *
 * Reglas de la figura (las vigila `pnpm test:ciencia-pro`):
 *  · CERO texto dentro de los SVG: todas las palabras van en HTML (suelo de 13 px, i18n y lector de pantalla sin trabajo extra).
 *  · RB1 y ESR1 solo en la gota de sangre: se vieron solo en plasma, por debajo del 2 %, y en ningún tejido. Dentro de la célula serían falsos.
 *  · Ninguna cifra ni palabra clínica escrita aquí: todo sale de `esquemaTumor.*` (cotejado contra los informes) y la geometría, de utils/esquemaTumor.
 *  · Fail-closed (como `q4_a_sin_linea`): la figura se pinta SOLO si los bloques R4, R5 y R6 de /celula-a-celula pasan su puerta, porque de
 *    ellos sale lo que dice (tumor frío, hígado y hueso el mismo tumor, rasgos neuroendocrinos repartidos). Sin ellos, no hay figura.
 *  · Una sola fuente por glifo: la leyenda y el dibujo usan el MISMO <symbol>, así no pueden divergir.
 *  · Sin movimiento propio, sin botones (<details> y <summary> no lo son) y sin colores propios: roles del sistema.
 *  · Glifos: ninguno puede leerse como una letra o un signo pegado a la leyenda. El de «cambios» (`fragmento`) es un aro partido en DOS arcos con
 *    DOS huecos (la forma la fija `pnpm test:ciencia-pro`): con un solo hueco se leía «C'» a 20 px y «C)» pegado a «Cambios».
 *  · Altura en móvil (criterio de aceptación 6, re-fijado el 25-oct-2026): a 375 px la figura mide 1466 px y la sección 1972 (CDP). El criterio del
 *    dibujo era ≤1200 px sin desplegables (estimación). No se llega sin plegar los paneles B y C o sin encoger los dibujos hasta que pierdan
 *    legibilidad (recortar tamaños deja unos 1265-1316 px). Se dejan los tres paneles visibles (el HER2 y los cambios en RB1 y ESR1 son lo más afilado) y el
 *    criterio queda en ≤1500 px a 375. Alternativa si Miriam la ve larga: plegar B y C por debajo de lg en un solo <details> (pide DOM doble o
 *    ::details-content, y tocar el canario de «3 dibujos»).
 *
 * La lesión del panel A es CelulaLesion (el esquema ya publicado en /celula-a-celula). Sobre crema, su óvalo por defecto deja el punto violeta a
 * 1,22:1; aquí se aclara con un override local (`:deep`), porque `celula/` no se toca en esta tanda (es zona del PR #290).
 */
import { fechaEstado } from '~/utils/celulaResultados'
import { CELULA, EN_NUCLEO, GOTA_PATH, NUCLEO, SANGRE, VERTICE_ARRIBA, gota, membranaPath, partirCifra, receptorDeMembrana } from '~/utils/esquemaTumor'

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))

// La puerta: sin R4, R5 y R6 verificados y con OK de Miriam, la figura entera no se pinta.
const { reales } = useCelulaResultados()
const abierta = computed(() => (['R4', 'R5', 'R6'] as const).every((k) => reales.value.includes(k)))

// Ids del sprite prefijados con useId(): únicos en la página y estables entre el HTML estático y el cliente.
const uid = useId()
const sym = (nombre: string) => `#${uid}-${nombre}`

const membrana = membranaPath()
const her2 = receptorDeMembrana(VERTICE_ARRIBA, 1.4)
const { puntos: fragmentos, arcos: conCambio } = gota()

// Las filas del desplegable: texto literal de `esquemaTumor.cifras`, con la cabeza en negrita (utils/esquemaTumor.partirCifra).
const cifras = computed(() => (tm('esquemaTumor.cifras') as unknown[]).map((x) => partirCifra(String(rt(x as never)))))
const CLAVES_LIMITES = ['limite_2', 'limite_3', 'limite_4', 'limite_5', 'limite_6', 'limite_7', 'limite_8'] as const
const limites = computed(() => CLAVES_LIMITES.map((k) => t(`esquemaTumor.${k}`, { fecha: fechaEstado(lang.value) })))
</script>

<template>
  <section v-if="abierta" class="te" aria-labelledby="te-titulo">
    <!-- Sprite: un <symbol> por glifo, compartido por la leyenda (20 px) y el dibujo. Caja de 24 unidades; el trazo escala con ella. -->
    <svg class="te__sprite" aria-hidden="true" focusable="false">
      <defs>
        <symbol :id="`${uid}-luminal`" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" class="te__g-luminal" /></symbol>
        <symbol :id="`${uid}-ne`" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9.5" class="te__g-aro" />
          <path d="M12 6.4 L17.6 12 L12 17.6 L6.4 12 Z" class="te__g-ne" />
        </symbol>
        <symbol :id="`${uid}-er`" viewBox="0 0 24 24"><path d="M12 21 V12 M12 12 L5.5 3.5 M12 12 L18.5 3.5" class="te__g-er" /></symbol>
        <symbol :id="`${uid}-her2`" viewBox="0 0 24 24">
          <path d="M12 21 V12 M12 12 L5.5 3.5 M12 12 L18.5 3.5" class="te__g-ausente" />
          <path d="M3 20 L21 4" class="te__g-tachado" />
        </symbol>
        <symbol :id="`${uid}-copias`" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" class="te__g-copias-aro" />
          <circle cx="12" cy="12" r="3" class="te__g-copias-punto" />
        </symbol>
        <!-- Un fragmento con cambios: un aro partido en DOS arcos de 135° con DOS huecos, girado. Un arco con un solo hueco (con o sin trozo suelto)
             se lee como la letra «C» o como «C)» pegado a «Cambios» (lo vieron las revisiones de 161deac y la siguiente). Dos huecos no cierran ninguna letra. -->
        <symbol :id="`${uid}-fragmento`" viewBox="0 0 24 24">
          <path d="M16.82 17.75 A7.5 7.5 0 0 1 4.53 11.35" class="te__g-fragmento" />
          <path d="M7.18 6.25 A7.5 7.5 0 0 1 19.47 12.65" class="te__g-fragmento" />
        </symbol>
      </defs>
    </svg>

    <p class="eyebrow te__eyebrow">{{ $t('esquemaTumor.eyebrow') }}</p>
    <h3 id="te-titulo" class="h3-seccion te__titulo">{{ $t('esquemaTumor.titulo') }}</h3>
    <div class="te__intro"><p class="lede">{{ $t('esquemaTumor.lede') }}</p></div>

    <figure class="card-base te__figura">
      <p class="te__rotulos">
        <span class="pill-data pill-data--neutral">{{ $t('esquemaTumor.rotulo_esquema') }}</span>
        <span class="pill-data pill-data--neutral">{{ $t('esquemaTumor.rotulo_resultados') }}</span>
      </p>

      <div class="te__rejilla">
        <!-- A · el tumor: una lesión luminal con puntos de rasgos neuroendocrinos repartidos, sin grupo aparte -->
        <div class="te__panel" data-panel="tumor">
          <h4 class="h4-tarjeta">{{ $t('esquemaTumor.panel_tumor') }}</h4>
          <div class="te__dibujo te__dibujo--lesion"><CelulaLesion ne :alt="$t('esquemaTumor.alt_tumor')" /></div>
          <ul class="te__clave" role="list">
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('luminal')" /></svg>
              <span>{{ $t('esquemaTumor.clave_luminal') }}</span>
            </li>
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('ne')" /></svg>
              <span>{{ $t('esquemaTumor.clave_ne') }}</span>
            </li>
          </ul>
        </div>

        <!-- B · una célula, de cerca: lo que se ve en tejido (receptor de estrógeno, copias de más del ADN, HER2 ausente) -->
        <div class="te__panel" data-panel="celula">
          <h4 class="h4-tarjeta">{{ $t('esquemaTumor.panel_celula') }}</h4>
          <div class="te__dibujo">
            <svg class="te__svg" :viewBox="`0 0 ${CELULA.ancho} ${CELULA.alto}`" role="img" :aria-label="$t('esquemaTumor.alt_celula')" focusable="false">
              <path :d="membrana" class="te__membrana" />
              <ellipse :cx="NUCLEO.cx" :cy="NUCLEO.cy" :rx="NUCLEO.rx" :ry="NUCLEO.ry" class="te__nucleo" />
              <use :href="sym('er')" :x="EN_NUCLEO.receptor.x - 15" :y="EN_NUCLEO.receptor.y - 15" width="30" height="30" />
              <use v-for="(c, i) in EN_NUCLEO.copias" :key="i" :href="sym('copias')" :x="c.x - 13" :y="c.y - 13" width="26" height="26" />
              <g :transform="her2.transform"><use :href="sym('her2')" :x="her2.caja.x" :y="her2.caja.y" :width="her2.caja.lado" :height="her2.caja.lado" /></g>
            </svg>
          </div>
          <ul class="te__clave" role="list">
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('er')" /></svg>
              <span>{{ $t('esquemaTumor.clave_er') }}</span>
            </li>
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('her2')" /></svg>
              <span>{{ $t('esquemaTumor.clave_her2') }}</span>
            </li>
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('copias')" /></svg>
              <span>{{ $t('esquemaTumor.clave_copias') }}</span>
            </li>
          </ul>
        </div>

        <!-- C · en la sangre: fuera del tejido. Aquí, y solo aquí, los dos cambios que se vieron únicamente en plasma -->
        <div class="te__panel" data-panel="sangre">
          <h4 class="h4-tarjeta">{{ $t('esquemaTumor.panel_sangre') }}</h4>
          <div class="te__dibujo te__dibujo--gota">
            <svg class="te__svg" :viewBox="`0 0 ${SANGRE.ancho} ${SANGRE.alto}`" role="img" :aria-label="$t('esquemaTumor.alt_sangre')" focusable="false">
              <path :d="GOTA_PATH" class="te__gota" />
              <circle v-for="(p, i) in fragmentos" :key="i" :cx="p.x" :cy="p.y" r="2.2" class="te__fragmento" />
              <use v-for="(a, i) in conCambio" :key="`c${i}`" :href="sym('fragmento')" :x="a.x - 10" :y="a.y - 10" width="20" height="20" />
            </svg>
          </div>
          <ul class="te__clave" role="list">
            <li>
              <svg class="te__glifo" aria-hidden="true" focusable="false"><use :href="sym('fragmento')" /></svg>
              <span>{{ $t('esquemaTumor.clave_sangre') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <figcaption class="te__pie">
        <p class="te__nota">{{ $t('esquemaTumor.nota') }}</p>
        <p class="te__nota">{{ $t('esquemaTumor.nota_procedencia') }}</p>
      </figcaption>
    </figure>

    <!-- Las cifras, una a una: plegado, para quien las quiere (el detalle opcional no se fuerza). El resumen mide 44 px (.desplegable). -->
    <details class="desplegable te__cifras">
      <summary>{{ $t('esquemaTumor.cifras_titulo') }}</summary>
      <div class="te__cifras-cuerpo">
        <p class="te__nota">{{ $t('esquemaTumor.cifras_lead') }}</p>
        <div class="te__enlaces">
          <NuxtLink :to="localePath({ name: 'ciencia', hash: '#tejido-3veces' })" class="link-action">
            {{ $t('sectionNav.ciencia.pathology') }}
            <Icon name="ph:arrow-down" class="w-4 h-4" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink :to="localePath({ name: 'ciencia', hash: '#molecular-profile-title' })" class="link-action">
            {{ $t('sectionNav.ciencia.molecular') }}
            <Icon name="ph:arrow-down" class="w-4 h-4" aria-hidden="true" />
          </NuxtLink>
        </div>
        <ul class="te__lista" role="list">
          <li v-for="(c, i) in cifras" :key="i"><strong>{{ c.cabeza }}</strong>{{ c.sep }}{{ c.resto }}</li>
        </ul>
      </div>
    </details>

    <Aviso tipo="limites" plegable :titulo="$t('esquemaTumor.limites_titulo')" class="te__limites">
      <ul class="te__lista te__lista--limites" role="list">
        <li v-for="(l, i) in limites" :key="i">{{ l }}</li>
      </ul>
    </Aviso>
  </section>
</template>

<style scoped>
.te__sprite { position: absolute; width: 0; height: 0; overflow: hidden; }
.te__eyebrow { margin: 0 0 var(--sp-12); }
.te__titulo { margin: 0; }
.te__intro { margin: var(--sp-8) 0 var(--sp-24); }
.te__intro .lede { margin: 0; }

/* La figura: una tarjeta del sistema (.card-base) con los tres paneles. Móvil: una columna; desde lg, tres. */
.te__figura { margin: 0; }
.te__rotulos { display: flex; flex-wrap: wrap; gap: var(--sp-8); margin: 0 0 var(--sp-16); }
.te__rejilla { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-24); }
@media (min-width: 1024px) { .te__rejilla { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.15fr) minmax(0, 0.7fr); gap: var(--sp-32); } }
.te__panel { min-width: 0; border-top: 1px solid var(--trazo-medio); padding-top: var(--sp-16); }
.te__panel > h4 { margin: 0; }

.te__dibujo { margin: var(--sp-12) 0 var(--sp-16); max-width: 420px; }
.te__dibujo--gota { max-width: 240px; }
.te__svg { display: block; width: 100%; height: auto; }
/* Aclara el óvalo de la lesión sobre crema (si no, el punto violeta queda a 1,22:1). El valor por defecto de CelulaLesion no cambia. */
.te__dibujo--lesion :deep(.les__borde) { fill: color-mix(in srgb, var(--identidad) 8%, var(--fondo)); }

/* Dibujo: solo roles. La membrana y la gota, en el color del texto; el núcleo, un tinte del violeta de identidad. */
.te__membrana { fill: var(--fondo); stroke: var(--texto-1); stroke-width: 2; vector-effect: non-scaling-stroke; }
.te__nucleo { fill: color-mix(in srgb, var(--identidad) 10%, var(--fondo)); stroke: var(--texto-2); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.te__gota { fill: var(--fondo); stroke: var(--texto-1); stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.te__fragmento { fill: var(--texto-3); }

/* Glifos (dentro de los <symbol>): forma y trazo distintos, nunca solo color. */
.te__g-luminal { fill: var(--identidad); }
.te__g-aro { fill: none; stroke: var(--cta-texto); stroke-width: 2; }
.te__g-ne { fill: var(--cta-texto); }
.te__g-er { fill: none; stroke: var(--identidad); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.te__g-ausente { fill: none; stroke: var(--texto-3); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.te__g-tachado { fill: none; stroke: var(--texto-3); stroke-width: 2.2; stroke-linecap: round; }
.te__g-copias-aro { fill: none; stroke: var(--identidad); stroke-width: 2.2; }
.te__g-copias-punto { fill: var(--identidad); }
.te__g-fragmento { fill: none; stroke: var(--texto-1); stroke-width: 2.6; stroke-linecap: round; }

/* Leyenda: el glifo de 20 px y el texto de 15 px, uno al lado del otro. */
.te__clave { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-8); }
.te__clave li { display: flex; align-items: flex-start; gap: var(--sp-8); font: var(--tipo-body-sm); color: var(--texto-1); }
.te__glifo { flex: none; width: 20px; height: 20px; margin-top: 2px; }

.te__pie { margin-top: var(--sp-24); display: grid; gap: var(--sp-8); }
.te__nota { margin: 0; font: var(--tipo-body-sm); color: var(--texto-2); max-width: var(--measure); }

.te__cifras { margin-top: var(--sp-24); }
.te__cifras-cuerpo { padding: var(--sp-8) 0 var(--sp-16); }
.te__enlaces { display: flex; flex-wrap: wrap; gap: 0 var(--sp-24); margin-bottom: var(--sp-8); }
.te__lista { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-12); }
.te__lista li { padding-top: var(--sp-12); border-top: 1px solid var(--trazo-sutil); font: var(--tipo-body-sm); color: var(--texto-1); max-width: var(--measure); }
.te__lista--limites li { border-top: 0; padding-top: 0; }
.te__limites { margin-top: var(--sp-16); }
</style>
