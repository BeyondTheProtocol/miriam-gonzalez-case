<script setup lang="ts">
/**
 * La campaña de GoFundMe en la web: lo recaudado y quién lo hace posible (rediseño T2b, 24-oct-2026).
 *
 * Norma de Miriam: la tarjeta enseña el importe y los donantes EN VIVO, y las fases de la campaña con su estado en texto. NO lleva
 * objetivo, ni porcentaje, ni barra de progreso, ni «Faltan X €», ni importes en las fases: una barra contra una meta que se va a
 * mover es justo lo que se quitó. Lo vigilan scripts/test-dinero-fuente.ts (el fuente) y test-salud-estatica §6 (el HTML).
 *
 * · `card` (home): bloque oscuro con el importe grande, los donantes, las tres fases con su estado y el botón de donar.
 * · por defecto (/gastos y /colabora): una línea con el importe y los donantes, sin fases (las fases de /gastos ya son su bloque
 *   «Financiación por fases»).
 *
 * El estado de cada fase se DECLARA en app/data/dinero.json (`fases`); no se calcula desde el dinero. Se pinta con las insignias
 * del sistema (`.status-badge`, utils/estadoInsignia.ts), que dicen el estado con icono y palabra, no solo con color.
 *
 * La cifra del HTML prerenderizado es la semilla del build; el cliente la sustituye por la viva al montar (ver useFundraiser). Si
 * la cifra es de la semilla se dice con su fecha («cifra a 24 oct 2026»): una cifra horneada no pasa por una cifra de hoy.
 */
withDefaults(defineProps<{ card?: boolean }>(), { card: false })

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { trackSupport } = useSupport()

const data = await useFundraiser()

const importe = computed(() =>
  data.value ? formatCurrency(data.value.currentAmount.amount, data.value.currentAmount.currencyCode, locale.value) : ''
)
// Los donantes, con el mismo formato que el hero (en inglés, «2,335»): dos formatos para el mismo número en la misma página no.
const donantes = computed(() =>
  data.value ? new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US').format(data.value.donationCount) : ''
)
// La fecha solo si la cifra es de la semilla Y sabemos de cuándo es (nunca una inventada).
const cifraDe = computed(() => {
  const v = data.value
  if (!v || v.origen !== 'semilla' || !v.actualizado) return null
  return { iso: v.actualizado, texto: fechaDeCifra(v.actualizado, locale.value) }
})

// Estado de proceso de la campaña (hecha, en curso…) → estado del sistema (hecho, curso…): una sola paleta de estados en el sitio.
const A_SISTEMA = { hecha: 'hecho', hecho: 'hecho', en_curso: 'curso', presupuesto: 'curso' } as const
const fases = computed(() =>
  DINERO.fases.map((f) => ({
    clave: f.clave,
    insignia: insigniaDe(A_SISTEMA[f.estado]),
    estado: t(`gofundme.estado.${f.estado}`),
  }))
)
</script>

<template>
  <!-- Variante tarjeta · bloque oscuro. `data-tema="oscuro"` remapea los roles (texto, identidad, insignias) sin hex en línea. -->
  <div v-if="card && data" class="gfm gfm--card" data-tema="oscuro">
    <p
      class="gfm__importe nums"
      :data-gofundme-importe="data.currentAmount.amount"
      :data-gofundme-origen="data.origen ?? 'semilla'"
    >{{ importe }}</p>
    <p class="gfm__rotulo">
      {{ $t('gofundme.raised_on') }}<template v-if="cifraDe"> · <time :datetime="cifraDe.iso">{{ $t('gofundme.cifra_a', { fecha: cifraDe.texto }) }}</time></template>
    </p>
    <p class="gfm__donantes">
      <NuxtLink :to="localePath('colabora') + '#gracias'" class="gfm__enlace nums">
        <Icon name="ph:users-three" class="size-4" aria-hidden="true" />
        {{ donantes }} {{ $t('gofundme.donators') }}
        <Icon name="ph:arrow-right" class="size-3 gfm__flecha" aria-hidden="true" />
      </NuxtLink>
    </p>

    <!-- Las fases del caso, cada una con su estado en texto. Sin importes ni barra. -->
    <p class="gfm__fases-titulo">{{ $t('gofundme.fases_titulo') }}</p>
    <ol class="gfm__fases">
      <li v-for="f in fases" :key="f.clave" class="gfm__fase">
        <p class="gfm__fase-titulo">
          {{ $t(`gofundme.phases.${f.clave}.label`) }}
          <!-- «Terapia personalizada · presupuesto en curso»: el punto lo dice el lector de pantalla; a la vista, la insignia ya separa (a 375 px
               la insignia baja de línea y un punto suelto al final de la primera quedaba huérfano). -->
          <span class="sr-only"> · </span>
          <span class="status-badge" :class="f.insignia">{{ f.estado }}</span>
        </p>
        <p class="gfm__fase-desc">{{ $t(`gofundme.phases.${f.clave}.desc`) }}</p>
      </li>
    </ol>

    <!-- Prueba social (auditoría 4.3): «únete a quienes ya lo hacen». El número de donantes ya aparece arriba, así que aquí
         solo va el encuadre. -->
    <p class="gfm__prueba">{{ $t('gofundme.social_proof') }}</p>
    <a
      href="https://gofund.me/3e25cae99"
      target="_blank"
      rel="noopener noreferrer"
      @click="trackSupport('gofundme_widget')"
      data-support-cta
      class="btn-cta mt-3 w-full sm:w-auto"
    >
      <Icon name="ph:heart-fill" class="heart-beat w-4 h-4" aria-hidden="true" />
      {{ $t('gofundme.donate_now') }}
      <span class="sr-only">{{ ' ' + $t('a11y.new_tab') }}</span>
    </a>
  </div>

  <!-- Variante por defecto · una línea -->
  <div v-else-if="data" class="gfm gfm--linea">
    <div class="gfm__fila">
      <p class="nums">
        {{ $t('gofundme.raised') }}
        <strong
          class="gfm__cifra"
          :data-gofundme-importe="data.currentAmount.amount"
          :data-gofundme-origen="data.origen ?? 'semilla'"
        >{{ importe }}</strong>
        {{ $t('gofundme.on_gofundme') }}
      </p>
      <NuxtLink :to="localePath('colabora') + '#gracias'" class="gfm__enlace nums">
        <Icon name="ph:users-three" class="size-4" aria-hidden="true" />
        {{ donantes }} {{ $t('gofundme.donators') }}
        <Icon name="ph:arrow-right" class="size-3 gfm__flecha" aria-hidden="true" />
      </NuxtLink>
    </div>
    <p v-if="cifraDe" class="gfm__fecha">
      <time :datetime="cifraDe.iso">{{ $t('gofundme.cifra_a', { fecha: cifraDe.texto }) }}</time>
    </p>
  </div>
</template>

<style scoped>
.gfm__enlace {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 44px;
  text-decoration: none;
  cursor: pointer;
}
.gfm__enlace:focus-visible {
  outline: 2px solid var(--anillo-foco, var(--color-cta));
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
/* hover solo donde hay hover: en el móvil el primer toque lo dejaría pegado */
@media (hover: hover) and (pointer: fine) {
  .gfm__enlace:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .gfm__enlace:hover .gfm__flecha {
    transform: translateX(2px);
  }
}
.gfm__flecha {
  transition: transform var(--dur-micro) var(--curva-salida);
}
@media (prefers-reduced-motion: reduce) {
  .gfm__flecha {
    transition: none;
  }
}

/* ── Tarjeta oscura ────────────────────────────────────────────────────────── */
.gfm--card {
  border-radius: var(--radius-card);
  padding: 1.5rem;
  background: var(--fondo);
  color: var(--texto-1);
}
@media (min-width: 640px) {
  .gfm--card {
    padding: 2rem;
  }
}
@media (min-width: 1024px) {
  .gfm--card {
    padding: 2.5rem;
  }
}
.gfm__importe {
  margin: 0;
  font-family: var(--font-display, 'Fraunces', serif);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
  font-size: clamp(48px, 6vw, 72px);
  color: var(--cta-texto);
}
.gfm__rotulo {
  margin: 0.625rem 0 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  line-height: 1.5;
  letter-spacing: 0.04em;
  color: var(--texto-2);
}
.gfm__donantes {
  margin: 0.5rem 0 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--texto-1);
}
.gfm__fases-titulo {
  margin: 1.5rem 0 0.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--texto-3);
}
.gfm__fases {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}
.gfm__fase {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-btn);
  background: color-mix(in srgb, var(--texto-1) 5%, transparent);
}
.gfm__fase-titulo {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--texto-1);
}
.gfm__fase-desc {
  margin: 0.375rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--texto-2);
}
.gfm__prueba {
  margin: 1.5rem 0 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8125rem;
  letter-spacing: 0.03em;
  color: var(--texto-2);
}

/* ── Línea (/gastos, /colabora) ────────────────────────────────────────────── */
.gfm--linea {
  margin-top: 1.25rem;
  font-size: 0.9375rem;
  color: var(--color-text);
}
.gfm__fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem 1rem;
}
.gfm__cifra {
  font-family: var(--font-display, 'Fraunces', serif);
  font-weight: 600;
  color: var(--color-text);
}
.gfm--linea .gfm__enlace {
  color: var(--color-text-soft);
}
.gfm__fecha {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-soft);
}
</style>
