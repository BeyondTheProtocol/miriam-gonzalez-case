<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <div
      v-if="visible"
      ref="panel"
      class="mcp"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-title"
      aria-describedby="mcp-text"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <Icon name="ph:handshake" class="w-5 h-5 shrink-0 text-miriam-claro mt-0.5" aria-hidden="true" />
      <div class="min-w-0">
        <p id="mcp-title" class="text-sm font-semibold text-cream leading-snug">{{ $t('marcas.popup_title') }}</p>
        <p id="mcp-text" class="text-xs text-cream/75 leading-snug mt-0.5">{{ $t('marcas.popup_text') }}</p>
        <NuxtLink :to="localePath('contacto')" class="mcp__cta" @click="dismiss">
          {{ $t('marcas.popup_cta') }}
          <Icon name="ph:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
        </NuxtLink>
      </div>
      <button ref="closeBtn" type="button" class="mcp__close" :aria-label="$t('marcas.popup_dismiss')" @click="dismiss">
        <Icon name="ph:x-bold" class="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Pop-up de contacto SOLO para /marcas (· /en/brands).
 * Sustituye, en esta ruta, el aviso de donación (DonationReturnPrompt): aquí se
 * negocia una colaboración, no se pide donativo. Apunta a /contacto, nunca a
 * GoFundMe.
 *
 * Disparo EXIT-INTENT (decisión Miriam, "lo más accesible y marketiniano"), no
 * por tiempo:
 *  · Desktop: aparece SOLO al intuir salida — el cursor abandona el viewport por
 *    arriba/fuera (mouseleave con clientY ≤ 0). Sin temporizador.
 *  · Móvil/táctil: no hay exit-intent fiable → disparo discreto tras scroll
 *    profundo (≈70 % de la página), una sola vez.
 * Una vez por sesión y descartable (✕ o Esc). Si ya se cerró, no vuelve.
 * Accesible: role=dialog + aria-modal, foco al abrir, focus-trap con Tab,
 * Esc cierra, se restaura el foco al elemento previo, respeta reduced-motion.
 * Solo se monta en /marcas (ver v-if en la página).
 */
const localePath = useLocalePath()
const visible = ref(false)

const panel = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

const SESSION_KEY = 'hm_marcas_prompt_done'

function alreadyDone(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    // Sin sessionStorage (modo privado estricto) tratamos como "ya hecho":
    // mejor no insistir que arriesgar repetir el pop-up.
    return true
  }
}

function markDone() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* noop */
  }
}

function open() {
  if (visible.value || alreadyDone()) return
  // Marcamos "hecho" en cuanto se abre: cuenta como su única aparición de la
  // sesión aunque el visitante lo ignore (no solo al cerrarlo).
  markDone()
  teardownTriggers()
  if (typeof document !== 'undefined') {
    lastFocused = document.activeElement as HTMLElement | null
  }
  visible.value = true
  // Tras pintar, llevamos el foco al panel para que Esc y el focus-trap operen.
  nextTick(() => panel.value?.focus())
}

function dismiss() {
  if (!visible.value) return
  visible.value = false
  markDone()
  // Devuelve el foco a donde estaba (p. ej. el enlace que el visitante miraba),
  // salvo que ese elemento ya no exista en el DOM.
  if (lastFocused && document.contains(lastFocused)) {
    lastFocused.focus()
  }
  lastFocused = null
}

// ── Accesibilidad: Esc cierra + focus-trap con Tab dentro del panel ──────────
function focusables(): HTMLElement[] {
  if (!panel.value) return []
  return Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    dismiss()
    return
  }
  if (e.key !== 'Tab') return
  const items = focusables()
  if (items.length === 0) {
    e.preventDefault()
    panel.value?.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  // Ciclo cerrado: Shift+Tab desde el primero → último; Tab desde el último →
  // primero; y si el foco escapó del panel (estaba en el contenedor), lo reatamos.
  if (e.shiftKey) {
    if (active === first || active === panel.value) {
      e.preventDefault()
      last.focus()
    }
  } else if (active === last) {
    e.preventDefault()
    first.focus()
  }
}

// ── Disparadores: exit-intent (desktop) · scroll profundo (táctil) ───────────
let scrollHandler: (() => void) | null = null

function onMouseOut(e: MouseEvent) {
  // El cursor sale del viewport por la parte superior (zona de pestañas/cerrar).
  // relatedTarget/toElement nulos ⇒ salió de la ventana, no a otro elemento.
  const to = e.relatedTarget as Node | null
  if (!to && e.clientY <= 0) open()
}

function onDeepScroll() {
  if (typeof window === 'undefined') return
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  if (max <= 0) return
  if (window.scrollY / max >= 0.7) open()
}

function setupTriggers() {
  if (typeof window === 'undefined' || alreadyDone()) return
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches
  if (coarse) {
    // Táctil: sin exit-intent fiable → scroll profundo, pasivo, una vez.
    scrollHandler = onDeepScroll
    window.addEventListener('scroll', scrollHandler, { passive: true })
    onDeepScroll()
  } else {
    // Desktop: intención de salida por la parte superior del viewport.
    document.addEventListener('mouseout', onMouseOut)
  }
}

function teardownTriggers() {
  if (typeof window === 'undefined') return
  document.removeEventListener('mouseout', onMouseOut)
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
}

onMounted(setupTriggers)
onBeforeUnmount(teardownTriggers)
</script>

<style scoped>
/* Misma familia visual que DonationReturnPrompt (tarjeta berenjena flotante),
   pero acento violeta (identidad) en vez de coral (acción/donación). */
.mcp {
  position: fixed;
  z-index: 60;
  left: 1rem;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 23rem;
  margin-left: auto;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  background: #2d1b3d;
  box-shadow: 0 16px 40px -12px rgba(45, 27, 61, 0.5);
}
/* Foco programático del contenedor al abrir: sin anillo (el aro accesible vive en
   los controles internos vía :focus-visible). El trap necesita un tabindex=-1
   enfocable, pero no debe dibujar outline en la tarjeta. */
.mcp:focus {
  outline: none;
}

/* Móvil (<lg): en /marcas la barra de apoyo de donación NO se monta (ahí no hay
   donación), pero SÍ está MarcasActionBar —barra de acción del embudo de marca,
   fija abajo a lo ancho (~6rem de alto)—. Elevamos el pop-up por encima de ella
   para que nunca se solapen. En desktop, abajo a la derecha (bottom: 1rem base). */
@media (max-width: 1023px) {
  .mcp {
    bottom: calc(8.75rem + env(safe-area-inset-bottom, 0px));
  }
}
.mcp__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.45rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: #c77dd2; /* miriam-claro — identidad sobre oscuro */
  text-decoration: none;
}
.mcp__cta:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.mcp__close {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(250, 246, 240, 0.6);
  padding: 2px;
}
.mcp__close:hover {
  color: #faf6f0;
}
.mcp__cta:focus-visible,
.mcp__close:focus-visible {
  outline: 2px solid #c77dd2;
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
