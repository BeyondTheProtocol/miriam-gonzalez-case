<script setup lang="ts">
/**
 * Bloque · Próximos pasos. La ruta del análisis como lista de pasos con estado y una barra de pasos
 * dados. Idea de Javi (17-oct-2026): a la gente le gusta saber qué viene después.
 *
 * Los pasos salen de public/celula/pasos.json (se importa, no se pide en el navegador: así el texto
 * está en el HTML prerenderizado). La barra cuenta pasos HECHOS de ESTA lista; no mide distancia a
 * ninguna meta médica y el texto lo dice. Un paso incierto es «pendiente», nunca «en curso».
 * Describe y equipa; no promete resultados ni plazos, y no lleva fechas de citas ni lugares.
 *
 * Accesibilidad: barra con role=progressbar y el mismo texto «3 de 8 pasos dados» a la vista; el estado
 * de cada paso va con icono y palabra, no solo con color; no es interactiva; sin animaciones (norma de
 * la página), así que prefers-reduced-motion no tiene nada que desactivar.
 */
import pasosJson from '~~/public/celula/pasos.json'
import { fechaActualizado, resumenPasos, textoProgreso, type PasosJson } from '~/utils/celulaPasos'

const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)
const id = useId()
const idBarra = useId()

const datos = pasosJson as unknown as PasosJson
const resumen = computed(() => resumenPasos(datos.pasos))
const progreso = computed(() => textoProgreso(resumen.value, lang.value))
const ESTADO = {
  hecho: { es: 'Hecho', en: 'Done', clase: 'status-badge--active', icono: 'ph:check-circle-fill' },
  en_curso: { es: 'En curso', en: 'In progress', clase: 'status-badge--candidate', icono: 'ph:circle-half-fill' },
  pendiente: { es: 'Pendiente', en: 'Pending', clase: 'status-badge--pending', icono: 'ph:circle-dashed' },
} as const
</script>

<template>
  <section id="proximos-pasos" :aria-labelledby="id" class="pp">
    <h2 :id="id" class="cel-h2">{{ L('Próximos pasos', 'Next steps') }}</h2>
    <p class="cel-p">
      {{ L('Esta es la ruta del análisis, en el orden previsto. Si lo que va saliendo la cambia, la lista cambia con ella.',
        'These are the steps the analysis follows, in the planned order. If the results change the plan, the list will change too.') }}
    </p>

    <div class="pp__resumen card-base">
      <p :id="idBarra" class="pp__cifra">{{ progreso }}</p>
      <div
        class="pp__barra"
        role="progressbar"
        :aria-labelledby="idBarra"
        aria-valuemin="0"
        :aria-valuemax="resumen.total"
        :aria-valuenow="resumen.hechos"
        :aria-valuetext="progreso"
      >
        <span
          v-for="p in datos.pasos"
          :key="p.id"
          class="pp__seg"
          :class="`pp__seg--${p.estado}`"
          aria-hidden="true"
        />
      </div>
      <p class="pp__nota">
        {{ L('La barra cuenta los pasos de esta lista que ya se han dado. No mide cuánto falta para ninguna meta médica.',
          'The bar counts the steps on this list that have already been taken. It does not measure progress toward any medical goal.') }}
      </p>
    </div>

    <ol class="pp__lista">
      <li v-for="p in datos.pasos" :key="p.id" class="pp__paso" :class="`pp__paso--${p.estado}`">
        <span class="pp__marca" aria-hidden="true">
          <Icon :name="ESTADO[p.estado].icono" class="pp__ico" />
        </span>
        <div class="pp__cuerpo">
          <div class="pp__cab">
            <h3 class="cel-h3 pp__t">{{ p.titulo[lang] }}</h3>
            <span class="status-badge pp__badge" :class="ESTADO[p.estado].clase">{{ ESTADO[p.estado][lang] }}</span>
          </div>
          <p class="cel-card__p pp__d">
            {{ p.detalle[lang] }}
            <template v-if="p.termino">
              <span class="pp__glos">{{ L('En el glosario:', 'In the glossary:') }} <Term :id="p.termino" /></span>
            </template>
          </p>
        </div>
      </li>
    </ol>

    <p class="pp__fecha">{{ L(`Estado de los pasos a ${fechaActualizado(datos.actualizado, 'es')}.`, `Status of the steps as of ${fechaActualizado(datos.actualizado, 'en')}.`) }}</p>
  </section>
</template>

<style scoped>
/* Tokens del sistema (btp-tokens.css). Sin animaciones. El estado nunca va solo en color:
   segmento (relleno / medio / contorno) + icono + palabra. */
.pp__resumen { margin-top: var(--sp-16); padding: var(--sp-16) var(--sp-24); }
@media (min-width: 640px) { .pp__resumen { padding: var(--sp-24); } }
.pp__cifra { margin: 0; font: var(--tipo-h3); color: var(--color-text); }
.pp__barra { display: flex; gap: 4px; margin-top: var(--sp-12); }
.pp__seg {
  flex: 1 1 0; height: 12px; border-radius: 4px; box-sizing: border-box;
  border: 2px solid rgb(var(--color-text-rgb) / 0.55); /* >= 3:1 sobre el fondo (WCAG 1.4.11) */
}
.pp__seg--hecho { background: var(--color-miriam); border-color: var(--color-miriam); }
.pp__seg--en_curso { background: linear-gradient(90deg, var(--color-miriam) 50%, transparent 50%); border-color: var(--color-miriam); }
.pp__seg--pendiente { background: transparent; }
@media (forced-colors: active) {
  .pp__seg { border-color: CanvasText; }
  .pp__seg--hecho { background: CanvasText; }
  .pp__seg--en_curso { background: linear-gradient(90deg, CanvasText 50%, transparent 50%); }
}
.pp__nota { margin: var(--sp-12) 0 0; font: var(--tipo-body-sm); color: var(--color-text-soft); max-width: var(--measure); }

.pp__lista { list-style: none; margin: var(--sp-24) 0 0; padding: 0; display: grid; gap: 0; }
.pp__paso { position: relative; display: flex; gap: var(--sp-12); padding-bottom: var(--sp-16); }
.pp__paso:last-child { padding-bottom: 0; }
/* raíl vertical entre marcas */
.pp__paso::before {
  content: ''; position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px;
  background: rgb(var(--color-text-rgb) / 0.18);
}
.pp__paso:last-child::before { display: none; }
.pp__marca {
  flex: none; width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center;
  background: var(--color-bg); color: var(--color-text-soft);
}
.pp__ico { width: 28px; height: 28px; }
.pp__paso--hecho .pp__marca { color: #1f5a3a; }
.pp__paso--en_curso .pp__marca { color: var(--color-miriam); }
.pp__cuerpo { min-width: 0; flex: 1 1 auto; padding-top: 2px; }
.pp__cab { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-4) var(--sp-12); }
.pp__t { font-size: var(--texto-base); }
.pp__badge { font-size: var(--texto-xs); }
.pp__d { margin-top: var(--sp-4); max-width: var(--measure); }
.pp__glos { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--sp-4); margin-top: var(--sp-4); color: var(--color-text-soft); }
/* el término va en su propia línea (no dentro de una frase): objetivo táctil de 44 px */
.pp__glos :deep(.term) { min-height: 44px; display: inline-flex; align-items: center; }
.pp__fecha { margin: var(--sp-16) 0 0; font-size: var(--texto-xs); color: var(--color-text-soft); }
</style>
