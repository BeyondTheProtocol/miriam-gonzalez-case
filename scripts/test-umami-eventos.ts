// Medición de Umami (PR «Medición: eventos de Umami antes del rediseño», 24-oct-2026). Nada visible cambia: estos
// eventos miden la web tal como está, para tener la línea base ANTES de rediseñarla.
//
//   plugins/umami-delegado.client.ts (clics y scroll, de la fase F0 del rediseño)
//     Clic-gofundme { pagina, origen }   VerPeticion { origen }
//     Contacto-clic { rol, pagina }      Scroll { pct, pagina }
//   utils/umamiVistas.ts + composables/useUmamiVisto.ts (lo que se VE)
//     Hero-visto { pagina, conEuros }    Campana-visible { pagina, conEuros }    Prensa-visible { pagina }
//   y la propiedad `entrada` (primera página de la sesión) en Donar, Clic-gofundme y Contacto-enviado.
//
// Cuatro niveles:
// A. La lógica pura (qué enlace es qué evento, qué umbral de scroll toca, cuándo un bloque «se ve», la entrada).
// B. Que los nombres de evento que ya existían siguen en su sitio: renombrar uno parte su serie en
//    Umami, y ningún test lo vería. Y que los componentes enganchan la medición.
// C. En Chrome, sobre el build ESTÁTICO (.output/public) y con un `window.umami` de mentira (el script
//    real solo envía desde helpmiriam.com): los clics, el scroll y lo que se ve llegan de verdad.
//    Si no hay build (o con SIN_NAVEGADOR=1, para una pasada rápida), A y B corren igual y C se omite con un aviso.
//
// Se ejecuta con `pnpm test:umami-eventos`:  pnpm exec nuxt generate && pnpm test:umami-eventos
import { existsSync, readFileSync } from 'node:fs'
import {
  EVENTO_CONTACTO_CLIC,
  EVENTO_GOFUNDME,
  EVENTO_PETICION,
  EVENTO_SCROLL,
  GESTO_VALE_MS,
  apoyoReciente,
  clasificarClic,
  esEnlaceGoFundMe,
  profundidadScroll,
  recordarApoyo,
  scrollDeUsuario,
  umbralesNuevos,
} from '../app/utils/umami'
import {
  CLAVE_ENTRADA,
  ESPERA_UMAMI_MS,
  EVENTOS_CON_ENTRADA,
  EVENTO_CAMPANA_VISIBLE,
  EVENTO_HERO_VISTO,
  EVENTO_PRENSA_VISIBLE,
  REINTENTOS_UMAMI,
  UMBRALES_VISTO,
  avisarUnaVezPorVista,
  conEntrada,
  enviarCuandoHaya,
  entradaDeSesion,
  esVisto,
  fijarEntrada,
  olvidarEntrada,
  paginaBase,
  reiniciarVistas,
} from '../app/utils/umamiVistas'

let fallos = 0
const ok = (cond: boolean, msg: string) => {
  console.log(`  ${cond ? '✅' : '❌'} ${msg}`)
  if (!cond) fallos++
}
const igual = (a: unknown, b: unknown, msg: string) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — salió ${JSON.stringify(a)}, debía ser ${JSON.stringify(b)}`}`)

// ── A. lógica pura ───────────────────────────────────────────────────────────────────────────
console.log('A · lógica pura')
const SITIO = 'https://helpmiriam.com'
ok(esEnlaceGoFundMe('https://gofund.me/3e25cae99'), 'gofund.me es GoFundMe')
ok(esEnlaceGoFundMe('https://www.gofundme.com/f/biopsia-molecular'), 'www.gofundme.com es GoFundMe')
ok(esEnlaceGoFundMe('https://gofundme.com/f/x'), 'gofundme.com es GoFundMe')
ok(!esEnlaceGoFundMe('https://gofund.me.otro.example/x'), 'un dominio que solo EMPIEZA por gofund.me no es GoFundMe')
ok(!esEnlaceGoFundMe('https://notgofundme.com/x'), 'notgofundme.com no es GoFundMe')
ok(!esEnlaceGoFundMe('https://helpmiriam.com/donar'), '/donar (redirección interna) no se cuenta aquí')
ok(!esEnlaceGoFundMe('no es una url'), 'una cadena que no es URL no revienta ni cuenta')

igual(clasificarClic('https://gofund.me/3e25cae99', SITIO, 'index', 'home_hero'), { evento: EVENTO_GOFUNDME, datos: { pagina: 'index', origen: 'home_hero' } }, 'clic a GoFundMe con etiqueta de trackSupport')
igual(clasificarClic('https://gofund.me/3e25cae99', SITIO, 'datos', null), { evento: EVENTO_GOFUNDME, datos: { pagina: 'datos', origen: 'sin_etiqueta' } }, 'clic a GoFundMe sin etiqueta: «sin_etiqueta», no la de otro clic')
igual(clasificarClic(`${SITIO}/contacto?role=oncologist`, SITIO, 'ciencia', null), { evento: EVENTO_CONTACTO_CLIC, datos: { rol: 'oncologist', pagina: 'ciencia' } }, 'contacto ES con rol')
igual(clasificarClic(`${SITIO}/en/contact?role=researcher`, SITIO, 'ciencia', null), { evento: EVENTO_CONTACTO_CLIC, datos: { rol: 'researcher', pagina: 'ciencia' } }, 'contacto EN con rol (misma página base que en ES)')
igual(clasificarClic(`${SITIO}/contacto`, SITIO, 'equipo', null), { evento: EVENTO_CONTACTO_CLIC, datos: { rol: 'sin_rol', pagina: 'equipo' } }, 'contacto sin rol → sin_rol')
igual(clasificarClic(`${SITIO}/contacto/?role=tech`, SITIO, 'prensa', null)?.datos.rol, 'tech', 'barra final en /contacto/')
igual(clasificarClic(`${SITIO}/contacto?role=<script>`, SITIO, 'prensa', null)?.datos.rol, 'sin_rol', 'un rol que no es una palabra corta en minúsculas no viaja a Umami')
ok(clasificarClic('https://otra.example/contacto?role=tech', SITIO, 'prensa', null) === null, 'un /contacto de OTRO sitio no cuenta')
igual(clasificarClic(`${SITIO}/datos#que-buscamos`, SITIO, 'index', null), { evento: EVENTO_PETICION, datos: { origen: 'index' } }, 'enlace a /datos#que-buscamos')
igual(clasificarClic(`${SITIO}/en/data#que-buscamos`, SITIO, 'ciencia', null)?.evento, EVENTO_PETICION, 'ídem en inglés')
igual(clasificarClic(`${SITIO}/datos#visores`, SITIO, 'index', null), null, 'otra ancla de /datos no es la petición')
igual(clasificarClic(`${SITIO}/ciencia`, SITIO, 'index', null), null, 'un enlace interno cualquiera no genera evento')
igual(clasificarClic('mailto:alguien@example.com', SITIO, 'index', null), null, 'mailto: no genera evento')

recordarApoyo('cabecera', 1_000)
igual(apoyoReciente(2_500), 'cabecera', 'la etiqueta de apoyo vale 1,5 s después')
igual(apoyoReciente(3_500), null, 'y caduca a los 2 s: el siguiente clic sin etiqueta no hereda la anterior')

igual(profundidadScroll(0, 800, 800), null, 'una página que cabe en pantalla no se mide')
igual(profundidadScroll(0, 800, 900), null, 'ni la que casi cabe (100 px de recorrido): regalaría el 100')
igual(profundidadScroll(0, 800, 4000), 0, 'arriba del todo: 0, la primera pantalla no cuenta como 25')
igual(profundidadScroll(800, 800, 4000), 25, 'una cuarta parte del recorrido (3200 px): 25')
igual(profundidadScroll(3200, 800, 4000), 100, 'en el pie: 100')
igual(profundidadScroll(3195, 800, 4000), 100, 'a 5 px del pie (móvil con barras que se mueven): 100')
igual(profundidadScroll(3140, 800, 4000), 100, 'a 60 px del pie en una página de 3200 px de recorrido (menos del 2 %): 100')
igual(Math.round(profundidadScroll(3130, 800, 4000) ?? 0), 98, 'a 70 px (más del 2 %): todavía no es el 100')
igual(profundidadScroll(7253, 844, 8168), 100, 'el caso medido en /ciencia: la página crece 71 px al llegar abajo y la tecla Fin se queda a 71 de 7.324')
igual(profundidadScroll(-40, 800, 4000), 0, 'rebote de iOS por encima del todo: 0')
igual(profundidadScroll(9999, 800, 4000), 100, 'por debajo del pie: 100, no más')
igual(umbralesNuevos(0, new Set()), [], 'en 0, ningún umbral')
igual(umbralesNuevos(30, new Set()), [25], 'en 30: el 25')
igual(umbralesNuevos(55, new Set([25])), [50], 'en 55 con el 25 ya enviado: solo el 50')
igual(umbralesNuevos(100, new Set()), [25, 50, 75, 100], 'un salto al final cruza los cuatro de golpe, una vez')
igual(umbralesNuevos(100, new Set([25, 50, 75, 100])), [], 'todo enviado: nada más')
igual(umbralesNuevos(null, new Set()), [], 'sin recorrido (null): nada')

ok(!scrollDeUsuario(5_000, 0, false), 'sin ningún gesto, el scroll no es del usuario (lo mueve el sitio)')
ok(scrollDeUsuario(5_000, 4_500, false), 'medio segundo después de una rueda, sí')
ok(scrollDeUsuario(5_000, 5_000 - GESTO_VALE_MS, false), `justo al límite (${GESTO_VALE_MS} ms), sí: la inercia del dedo no emite eventos`)
ok(!scrollDeUsuario(5_000, 5_000 - GESTO_VALE_MS - 1, false), 'un milisegundo más, no')
ok(scrollDeUsuario(60_000, 1, true), 'arrastrando la barra de scroll vale aunque el último gesto sea viejo')

// ── A2. lo que se ve, la entrada de la sesión y el envío con espera (utils/umamiVistas.ts) ──
console.log('\nA2 · lo que se ve, la entrada de la sesión y el envío con espera')
igual(paginaBase('ciencia___es'), 'ciencia', 'nombre de ruta en español sin el sufijo de idioma')
igual(paginaBase('ciencia___en'), 'ciencia', 'y en inglés: ES y EN suman en la misma página base')
igual(paginaBase('index___es'), 'index', 'la home es «index»')
igual(paginaBase(undefined), 'desconocida', 'ruta sin nombre: «desconocida»')
igual(paginaBase(''), 'desconocida', 'ruta vacía: «desconocida»')

ok(esVisto(400, 800, 900), 'la mitad de un bloque que cabe en pantalla: visto')
ok(!esVisto(300, 800, 900), 'un tercio de un bloque que cabe en pantalla: no')
ok(esVisto(450, 3000, 900), 'un bloque más alto que la pantalla (el hero en el móvil) se ve con la mitad de la PANTALLA')
ok(!esVisto(400, 3000, 900), 'menos de media pantalla de un bloque alto: no')
ok(esVisto(399.5, 800, 900), 'medio píxel por redondeo no impide verlo')
ok(!esVisto(0, 800, 900), 'nada visible: no')
ok(!esVisto(100, 0, 900) && !esVisto(100, 800, 0), 'un bloque o una ventana de alto 0 no se ven nunca')
ok(UMBRALES_VISTO.length === 21 && UMBRALES_VISTO[0] === 0 && UMBRALES_VISTO[20] === 1, 'el observador avisa cada 5 % (de 0 a 1)')

reiniciarVistas()
ok(avisarUnaVezPorVista('Campana-visible'), 'la primera vez que se pide un evento en una vista: sí')
ok(!avisarUnaVezPorVista('Campana-visible'), 'la segunda (otra tarjeta de la misma página): no')
ok(avisarUnaVezPorVista('Hero-visto'), 'otro evento en la misma vista: sí')
reiniciarVistas()
ok(avisarUnaVezPorVista('Campana-visible'), 'tras reiniciar (otra página), vuelve a valer')

type AlmacenFalso = { getItem(k: string): string | null; setItem(k: string, v: string): void; datos: Map<string, string> }
const almacen = (): AlmacenFalso => {
  const datos = new Map<string, string>()
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v), datos }
}
olvidarEntrada()
const a1 = almacen()
igual(entradaDeSesion(a1), null, 'sin entrada fijada, no se sabe')
igual(conEntrada('Donar', { location: 'cabecera' }, a1), { location: 'cabecera' }, 'y entonces «Donar» viaja sin la propiedad (no inventa una)')
igual(fijarEntrada('colabora', a1), 'colabora', 'la primera página fija la entrada')
igual(a1.datos.get(CLAVE_ENTRADA), 'colabora', 'y la deja en sessionStorage')
igual(fijarEntrada('ciencia', a1), 'colabora', 'la segunda no la cambia: es la PRIMERA de la sesión')
igual(conEntrada('Donar', { location: 'cabecera' }, a1), { location: 'cabecera', entrada: 'colabora' }, '«Donar» lleva la entrada')
igual(conEntrada('Clic-gofundme', { pagina: 'contacto', origen: 'x' }, a1), { pagina: 'contacto', origen: 'x', entrada: 'colabora' }, '«Clic-gofundme» lleva la entrada')
igual(conEntrada('Contacto-enviado', { rol: 'tech' }, a1), { rol: 'tech', entrada: 'colabora' }, '«Contacto-enviado» lleva la entrada')
igual(conEntrada('Donar', undefined, a1), { entrada: 'colabora' }, 'aun sin datos propios')
igual(conEntrada('Scroll', { pct: 25, pagina: 'ciencia' }, a1), { pct: 25, pagina: 'ciencia' }, 'los demás eventos pasan intactos («Scroll»)')
igual(conEntrada('Contacto-clic', { rol: 'tech', pagina: 'ciencia' }, a1), { rol: 'tech', pagina: 'ciencia' }, 'ídem «Contacto-clic»')
igual([...EVENTOS_CON_ENTRADA].sort(), ['Clic-gofundme', 'Contacto-enviado', 'Donar'], 'solo esos tres llevan entrada (Puerta no existe todavía en esta rama)')

olvidarEntrada()
const sinAlmacen: null = null
igual(fijarEntrada('ciencia', sinAlmacen), 'ciencia', 'sin sessionStorage (null) la entrada queda en memoria')
igual(entradaDeSesion(sinAlmacen), 'ciencia', 'y se lee de ahí')
olvidarEntrada()
const bloqueado = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('SecurityError')
  },
}
let revento = false
try {
  igual(fijarEntrada('contacto', bloqueado), 'contacto', 'con el almacenamiento bloqueado (lanza) no revienta y queda en memoria')
  igual(entradaDeSesion(bloqueado), 'contacto', 'y se lee de memoria')
} catch {
  revento = true
}
ok(!revento, 'el almacenamiento que lanza no rompe la página')
olvidarEntrada()
const a2 = almacen()
a2.datos.set(CLAVE_ENTRADA, '<script>alert(1)</script>')
igual(entradaDeSesion(a2), null, 'un valor guardado que no es un nombre de página se ignora')
igual(fijarEntrada('<script>', a2), 'desconocida', 'y un nombre de página raro se guarda como «desconocida»')
olvidarEntrada()

{
  // enviarCuandoHaya: el script de Umami es `defer` y lo de arriba del todo se ve antes de que cargue
  const cola: Array<() => void> = []
  const programar = (f: () => void, ms: number) => {
    cola.push(f)
    return ms
  }
  let enviados = 0
  let hay = false
  enviarCuandoHaya(() => enviados++, () => hay, programar)
  ok(enviados === 0 && cola.length === 1, 'sin Umami todavía: no envía y se reprograma')
  hay = true
  cola.shift()?.()
  ok(enviados === 1 && cola.length === 0, 'cuando Umami aparece, envía UNA vez y deja de reintentar')

  cola.length = 0
  let consultas = 0
  enviados = 0
  enviarCuandoHaya(() => enviados++, () => (consultas++, false), programar)
  while (cola.length) cola.shift()?.()
  ok(enviados === 0 && consultas === REINTENTOS_UMAMI, `si Umami no llega, se rinde tras ${REINTENTOS_UMAMI} intentos (${consultas})`)
  ok(REINTENTOS_UMAMI * ESPERA_UMAMI_MS >= 4000, `y espera como mínimo 4 s en total (${REINTENTOS_UMAMI * ESPERA_UMAMI_MS} ms)`)
}

// ── B. los nombres de siempre no se han tocado ───────────────────────────────────────────────
console.log('\nB · los eventos que ya existían')
const soporte = readFileSync('app/composables/useSupport.ts', 'utf-8')
const contacto = readFileSync('app/pages/contacto.vue', 'utf-8')
const ANTIGUOS = ['Donar', 'VerCiencia', 'Clic-prensa', 'Contacto', 'Pathway', 'VerMapa', 'VerLesiones', 'VerDatos', 'VerCelula', 'VerExplorador', 'VerLaminillas', 'VerUltimo', 'Navegar', 'PathwayCurioso', 'Error404', 'Compartir', 'Bio-link', 'VerVideo']
for (const nombre of ANTIGUOS) ok(soporte.includes(`trackUmami('${nombre}'`), `useSupport.ts sigue emitiendo «${nombre}»`)
ok(/trackUmami\('Contacto-enviado',\s*\{\s*rol:/.test(contacto), 'contacto.vue sigue emitiendo «Contacto-enviado» con su rol')
const NUEVOS = [EVENTO_GOFUNDME, EVENTO_PETICION, EVENTO_CONTACTO_CLIC, EVENTO_SCROLL, EVENTO_HERO_VISTO, EVENTO_CAMPANA_VISIBLE, EVENTO_PRENSA_VISIBLE]
ok(NUEVOS.every((n) => ![...ANTIGUOS, 'Contacto-enviado'].includes(n)), `los siete nombres nuevos (${NUEVOS.join(', ')}) no pisan ninguno de los de siempre`)
ok(new Set(NUEVOS).size === NUEVOS.length, 'y no se repiten entre sí')
igual([EVENTO_HERO_VISTO, EVENTO_CAMPANA_VISIBLE, EVENTO_PRENSA_VISIBLE], ['Hero-visto', 'Campana-visible', 'Prensa-visible'], 'los nombres de lo que se ve son el contrato que reutilizará el rediseño')
ok(/recordarApoyo\(location\)/.test(soporte), 'trackSupport deja la etiqueta de origen para «Clic-gofundme»')
ok(/recordarApoyo\(`campana_oficial_\$\{location\}`\)/.test(soporte), 'y el enlace del aviso «Campaña oficial» deja la suya (no llega a «Clic-gofundme» como sin_etiqueta)')
const umamiTs = readFileSync('app/utils/umami.ts', 'utf-8')
ok(/\.track\(event,\s*conEntrada\(event,\s*data\)\)/.test(umamiTs), 'trackUmami pasa los datos por conEntrada: la entrada viaja en TODA emisión de esos eventos, la haga quien la haga')
// la medición de lo que se ve está enganchada a los tres bloques, con el nombre del contrato
const hero = readFileSync('app/components/SectionHero.vue', 'utf-8')
const progreso = readFileSync('app/components/GoFundMeProgress.vue', 'utf-8')
const home = readFileSync('app/pages/index.vue', 'utf-8')
ok(/useUmamiVisto\(heroEl,\s*EVENTO_HERO_VISTO,\s*\(\)\s*=>\s*\(\{\s*conEuros:/.test(hero) && /<section\s+ref="heroEl"/.test(hero), 'el hero se mide entero (<section ref="heroEl">) con conEuros')
ok(/useUmamiVisto\(raiz,\s*EVENTO_CAMPANA_VISIBLE,\s*\(\)\s*=>\s*\(\{\s*conEuros:/.test(progreso) && (progreso.match(/\bref="raiz"/g) ?? []).length === 2, 'las dos variantes de la tarjeta (tarjeta e inline) llevan ref="raiz" y miden con conEuros')
ok(/useUmamiVisto\(prensaTira,\s*EVENTO_PRENSA_VISIBLE\)/.test(home) && /ref="prensaTira"/.test(home), 'la tira de prensa de la home se mide')
ok(/@click="trackPress\('El País'\)"/.test(home), 'y sus clics siguen contándose a mano («Clic-prensa»): nada de data-umami-event en esta rama')
const visto = readFileSync('app/composables/useUmamiVisto.ts', 'utf-8')
ok(/watch\(\s*el,[\s\S]*flush:\s*'post'/.test(visto), 'useUmamiVisto engancha el observador al aparecer el elemento (watch del ref), porque la tarjeta solo existe cuando llegan las cifras')
ok(visto.includes('avisarUnaVezPorVista(') && visto.includes('enviarCuandoHaya('), 'useUmamiVisto envía una vez por vista y espera al script de Umami')
const vistas = readFileSync('app/plugins/umami-vistas.client.ts', 'utf-8')
ok(/hook\('page:start',[\s\S]*reiniciarVistas/.test(vistas) && vistas.includes('isReady()') && vistas.includes('fijarEntrada('), 'el plugin reinicia las vistas en page:start y fija la entrada cuando el router resuelve la ruta inicial')
const plugin = readFileSync('app/plugins/umami-delegado.client.ts', 'utf-8')
ok(/addEventListener\(\s*'scroll'[\s\S]*?\{ passive: true \}/.test(plugin), 'el listener de scroll es pasivo')
ok(plugin.includes("addEventListener('auxclick'"), 'el botón central (auxclick) también cuenta')
ok(['wheel', 'touchmove', 'keydown', 'pointerdown'].every((t) => plugin.includes(`'${t}'`)), 'el plugin anota los gestos de scroll del usuario (rueda, dedo, teclado, barra)')
ok(/hook\('page:start'/.test(plugin), 'y empieza de cero en cada página nueva (page:start)')

// ── C. en Chrome, sobre el build estático ────────────────────────────────────────────────────
console.log('\nC · en Chrome, sobre .output/public')
if (process.env.SIN_NAVEGADOR) {
  console.log('  ⚠️  SIN_NAVEGADOR=1: se omite la parte de Chrome')
} else if (!existsSync('.output/public')) {
  console.log('  ⚠️  no hay .output/public: se omite (ejecuta antes `pnpm exec nuxt generate`)')
} else {
  const { abrirNavegador } = await import('./lib/navegador-cdp.mjs')
  const nav = await abrirNavegador({ ancho: 390, alto: 844, escala: 1 })
  try {
    // El script real de Umami solo envía desde helpmiriam.com. Un stub registra lo que el sitio le manda.
    await nav.cdp('Page.addScriptToEvaluateOnNewDocument', {
      // `hero`: el texto de la primera cifra del hero EN EL MOMENTO del aviso, para comprobar `conEuros` contra lo que se veía.
      source: `window.__umami = []; window.__umamiReal = { track: (e, d) => window.__umami.push({ e, d, hero: (document.querySelector('.hero__stat-value') || {}).textContent }) };
        window.umami = window.__umamiReal;
        window.addEventListener('click', (ev) => { if (ev.target && ev.target.closest && ev.target.closest('a')) ev.preventDefault() }, true);`,
    })
    type Ev = { e: string; d?: Record<string, unknown>; hero?: string }
    const eventos = async (): Promise<Ev[]> => nav.evaluate('window.__umami')
    const vaciar = () => nav.evaluate('window.__umami.length = 0')
    const de = async (nombre: string) => (await eventos()).filter((x) => x.e === nombre)

    // C1 · GoFundMe: un enlace con trackSupport y uno sin él
    await nav.cargar('/colabora')
    const hayEnlace = await nav.evaluate(`!!document.querySelector('a[href^="https://gofund.me/"][data-support-cta]')`)
    ok(hayEnlace, '/colabora tiene un enlace a GoFundMe con data-support-cta')
    await nav.evaluate(`document.querySelector('a[href^="https://gofund.me/"][data-support-cta]').click()`)
    await nav.sleep(150)
    const donar = (await de('Donar'))[0]
    const clic = await de(EVENTO_GOFUNDME)
    ok(clic.length === 1, `un clic a GoFundMe = un «${EVENTO_GOFUNDME}» (${clic.length})`)
    ok(!!donar && clic[0]?.d?.origen === donar.d?.location, `«${EVENTO_GOFUNDME}» hereda el botón de «Donar» (${clic[0]?.d?.origen} / ${donar?.d?.location})`)
    ok(clic[0]?.d?.pagina === 'colabora', `y la página es «colabora» (${clic[0]?.d?.pagina})`)
    await vaciar()
    await nav.sleep(2200) // que caduque la etiqueta
    await nav.evaluate(`(() => { const a = document.createElement('a'); a.href = 'https://www.gofundme.com/f/otra'; a.id = 'sin-etiqueta'; document.body.appendChild(a); a.click() })()`)
    await nav.sleep(150)
    const sinEtiqueta = await de(EVENTO_GOFUNDME)
    ok(sinEtiqueta.length === 1 && sinEtiqueta[0]?.d?.origen === 'sin_etiqueta', `un enlace a GoFundMe SIN trackSupport también cuenta, con origen «sin_etiqueta» (${JSON.stringify(sinEtiqueta[0]?.d)})`)
    ok((await de('Donar')).length === 0, 'y no dispara «Donar» (ese sigue siendo solo de los botones de apoyo)')
    await vaciar()
    await nav.evaluate(`document.getElementById('sin-etiqueta').dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }))`)
    await nav.sleep(100)
    ok((await de(EVENTO_GOFUNDME)).length === 1, 'el botón central (auxclick) también cuenta')
    await vaciar()
    await nav.evaluate(`document.getElementById('sin-etiqueta').dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 2 }))`)
    await nav.sleep(100)
    ok((await de(EVENTO_GOFUNDME)).length === 0, 'el botón derecho no cuenta')

    // C2 · contacto por rol, en ES y EN, sumando en la misma página base
    for (const [ruta, href, base] of [['/ciencia', '/contacto?role=oncologist', 'ciencia'], ['/en/science', '/en/contact?role=oncologist', 'ciencia']] as const) {
      await nav.cargar(ruta)
      await vaciar()
      const hay = await nav.evaluate(`!!document.querySelector('a[href="${href}"]')`)
      ok(hay, `${ruta} tiene un enlace a ${href}`)
      await nav.evaluate(`document.querySelector('a[href="${href}"]').click()`)
      await nav.sleep(150)
      const c = await de(EVENTO_CONTACTO_CLIC)
      ok(c.length === 1 && c[0]?.d?.rol === 'oncologist' && c[0]?.d?.pagina === base, `${ruta}: «${EVENTO_CONTACTO_CLIC}» con rol oncologist y página «${base}» (${JSON.stringify(c[0]?.d)})`)
      ok(c[0]?.d !== undefined && !('entrada' in c[0].d), `${ruta}: «${EVENTO_CONTACTO_CLIC}» NO lleva entrada (solo Donar, Clic-gofundme y Contacto-enviado)`)
    }

    // C3 · la petición, cuando exista un enlace al ancla
    await nav.cargar('/')
    await vaciar()
    await nav.evaluate(`(() => { const a = document.createElement('a'); a.href = '/datos#que-buscamos'; document.body.appendChild(a); a.click() })()`)
    await nav.sleep(150)
    const pet = await de(EVENTO_PETICION)
    ok(pet.length === 1 && pet[0]?.d?.origen === 'index', `un enlace a /datos#que-buscamos manda «${EVENTO_PETICION}» desde «index» (${JSON.stringify(pet[0]?.d)})`)

    // C4 · scroll: una vez por umbral, en orden, solo el que mueve el usuario, y de cero en la página siguiente
    const recorridoActual = async (): Promise<number> => nav.evaluate('document.documentElement.scrollHeight - window.innerHeight')
    const yActual = async (): Promise<number> => nav.evaluate('Math.round(window.scrollY)')
    const rueda = (dy: number) => nav.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 200, y: 400, deltaX: 0, deltaY: dy })
    // rueda de verdad (la que mueve un usuario) hasta la fracción `f` del recorrido, arriba o abajo
    const conRueda = async (f: number) => {
      for (let i = 0; i < 80; i++) {
        const objetivo = Math.round((await recorridoActual()) * f)
        const actual = await yActual()
        if (Math.abs(actual - objetivo) <= 8 || (f === 1 && actual >= objetivo - 8)) return
        await rueda(Math.max(-800, Math.min(800, objetivo - actual)))
        await nav.sleep(320)
      }
    }
    const pcts = async () => (await de(EVENTO_SCROLL)).map((x) => x.d?.pct)

    await nav.cargar('/ciencia')
    await vaciar()
    const recorrido = await recorridoActual()
    ok(recorrido > 2000, `/ciencia tiene recorrido de sobra para medir (${recorrido} px)`)
    igual(await pcts(), [], 'recién cargada la página, sin scroll: ningún evento')
    await nav.evaluate(`window.scrollTo({ top: ${Math.round(recorrido * 0.9)}, behavior: 'instant' })`)
    await nav.sleep(400)
    igual(await pcts(), [], 'scroll que mueve el propio sitio (scrollTo, sin gesto) al 90 %: ninguno')
    await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
    await nav.sleep(300)
    await conRueda(0.1)
    igual(await pcts(), [], 'con rueda, al 10 % del recorrido: ninguno')
    await conRueda(0.3)
    igual(await pcts(), [25], 'al 30 %: el 25')
    await conRueda(0.1)
    await conRueda(0.3)
    igual(await pcts(), [25], 'subir y volver a bajar no repite el 25')
    await conRueda(0.8)
    igual(await pcts(), [25, 50, 75], 'al 80 %: el 50 y el 75')
    await conRueda(1)
    igual(await pcts(), [25, 50, 75, 100], 'en el pie: el 100')
    const deCiencia = await de(EVENTO_SCROLL)
    ok(deCiencia.length > 0 && deCiencia.every((x) => x.d?.pagina === 'ciencia'), 'todos con página «ciencia»')
    ok(deCiencia.every((x) => x.d !== undefined && !('entrada' in x.d)), '«Scroll» no lleva entrada')

    // navegar dentro del sitio (otra vista): el sitio recoloca la página y eso no es lectura
    await vaciar()
    await nav.evaluate(`document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.push('/datos')`)
    await nav.sleep(2200)
    igual(await pcts(), [], 'tras navegar a /datos desde el pie de /ciencia, la recolocación del navegador no manda umbrales')
    await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
    await nav.sleep(300)
    await conRueda(1)
    igual(await pcts(), [25, 50, 75, 100], 'leyendo /datos con la rueda, los cuatro umbrales vuelven a contar')
    const deDatos = await de(EVENTO_SCROLL)
    ok(deDatos.length > 0 && deDatos.every((x) => x.d?.pagina === 'datos'), 'y con página «datos»')

    // el teclado también es leer: End salta al pie de golpe y cruza los cuatro a la vez
    await nav.cargar('/ciencia')
    // la página crece un poco al cargar cosas en cliente: se espera a que el alto se quede quieto
    for (let quieto = 0, antes = -1; quieto < 3; ) {
      const h: number = await nav.evaluate('document.documentElement.scrollHeight')
      quieto = h === antes ? quieto + 1 : 0
      antes = h
      await nav.sleep(300)
    }
    await vaciar()
    await nav.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 })
    await nav.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 })
    await nav.sleep(1500)
    igual(await pcts(), [25, 50, 75, 100], 'la tecla Fin lleva al pie y manda los cuatro umbrales, una vez')

    // un toque sin arrastre (pulsar un enlace) no es un gesto de scroll
    await nav.cargar('/ciencia')
    await vaciar()
    await nav.cdp('Emulation.setTouchEmulationEnabled', { enabled: true })
    await nav.cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 400 }] })
    await nav.cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await nav.evaluate(`window.scrollTo({ top: ${Math.round(recorrido * 0.9)}, behavior: 'instant' })`)
    await nav.sleep(400)
    igual(await pcts(), [], 'un toque sin arrastre seguido de un scroll del sitio: ninguno')
    await nav.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })

    // C5 · una página que cabe en pantalla no manda nada
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 4000, deviceScaleFactor: 1, mobile: false })
    await nav.cargar('/gracias')
    await vaciar()
    const sobrante = await recorridoActual()
    await rueda(3000)
    await nav.sleep(500)
    ok(sobrante < 200 && (await de(EVENTO_SCROLL)).length === 0, `/gracias en una ventana que la contiene entera (recorrido ${sobrante} px) no manda «Scroll»`)

    // ── Lo que se VE: Hero-visto, Campana-visible, Prensa-visible ─────────────────────────────────
    // /fundraiser.json no existe en el build estático (en producción lo sirve una función): se simula con un
    // fetch de mentira, que llega ANTES que cualquier script de la página.
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
    const conScript = async (source: string, fn: () => Promise<void>) => {
      const { identifier } = await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source })
      try {
        await fn()
      } finally {
        await nav.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier })
      }
    }
    const CIFRAS = JSON.stringify({ currentAmount: { amount: 12345, currencyCode: 'EUR' }, goalAmount: { amount: 100000, currencyCode: 'EUR' }, donationCount: 321, donationsEnabled: true })
    const FUNDRAISER_OK = `(() => { const orig = window.fetch.bind(window); window.fetch = (u, o) => /fundraiser\\.json/.test(String((u && u.url) || u)) ? Promise.resolve(new Response(${JSON.stringify(CIFRAS)}, { status: 200, headers: { 'content-type': 'application/json' } })) : orig(u, o) })();`
    const FUNDRAISER_FALLA = `(() => { const orig = window.fetch.bind(window); window.fetch = (u, o) => /fundraiser\\.json/.test(String((u && u.url) || u)) ? Promise.reject(new TypeError('sin red')) : orig(u, o) })();`
    // la página entera desplazada fuera de la ventana: nada se ve hasta que el test quita la hoja de estilo. Este script corre
    // antes de que exista <head>, así que espera a que el documento lo cree.
    const FUERA = `(() => { const poner = () => { if (!document.head) return false; const st = document.createElement('style'); st.id = '__fuera'; st.textContent = '#__nuxt { transform: translateY(150vh) }'; document.head.appendChild(st); return true }; if (!poner()) { const mo = new MutationObserver(() => { if (poner()) mo.disconnect() }); mo.observe(document, { childList: true, subtree: true }) } })();`
    // En este build el hero NO vuelve a pedir la cifra al hidratar (solo la pinta si venía en el HTML, es decir, si el build tuvo
    // seed/fundraiser.json): se la damos como si hubiera venido en el HTML, por el dato que usa el propio hero.
    const ponerCifraEnHero = () => nav.evaluate(`(() => { const a = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt._asyncData['hero-fundraiser']; a.data.value = ${CIFRAS}; return true })()`)
    const aVista = (selector: string) => nav.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', behavior: 'instant' })`)
    const irA = (ruta: string) => nav.evaluate(`document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.push(${JSON.stringify(ruta)})`)
    // Solo las barras de GoFundMeProgress (por su aria-label): la home tiene además otras barras de progreso.
    const etiquetaBarra = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')).gofundme.progress_label as string
    const BARRA = `[role="progressbar"][aria-label=${JSON.stringify(etiquetaBarra)}]`

    // C6 · Hero-visto
    await conScript(FUNDRAISER_OK + FUERA, async () => {
      await nav.cargar('/')
      await nav.sleep(500)
      ok((await de(EVENTO_HERO_VISTO)).length === 0, 'con el hero fuera de pantalla no hay «Hero-visto»')
      await ponerCifraEnHero()
      await nav.sleep(200)
      const cifra = (await nav.evaluate(`document.querySelector('.hero__stat-value').textContent.trim()`)) as string
      ok(cifra !== '—', `con la cifra de la campaña, el hero la pinta (${cifra})`)
      await nav.evaluate(`document.getElementById('__fuera').remove()`)
      await nav.sleep(600)
      const h = await de(EVENTO_HERO_VISTO)
      ok(h.length === 1 && h[0]?.d?.pagina === 'index' && h[0]?.d?.conEuros === true, `al verse el hero con la cifra: UN «${EVENTO_HERO_VISTO}» {pagina: index, conEuros: true} (${JSON.stringify(h.map((x) => x.d))})`)
      await nav.evaluate(`window.scrollTo({ top: 3000, behavior: 'instant' })`)
      await nav.sleep(300)
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(500)
      ok((await de(EVENTO_HERO_VISTO)).length === 1, 'y no se repite al volver a verlo en la misma vista')
    })
    await conScript(FUNDRAISER_FALLA + FUERA, async () => {
      await nav.cargar('/')
      await nav.sleep(300)
      await nav.evaluate(`document.getElementById('__fuera').remove()`)
      await nav.sleep(600)
      const h = await de(EVENTO_HERO_VISTO)
      // «conEuros» dice lo que había en el hero al verse: la raya «—» es que no había cifra (con semilla en el build, sí la habría)
      ok(h.length === 1 && h[0]?.d?.conEuros === (h[0]?.hero?.trim() !== '—'), `sin cifras de la campaña, «conEuros» coincide con lo que pintaba el hero (${JSON.stringify(h.map((x) => ({ ...x.d, hero: x.hero?.trim() })))})`)
    })
    // el hero mide más de una pantalla: se cuenta como visto con la mitad de la PANTALLA, no con la mitad del hero
    // (con 500 px de ventana, la mitad del hero no cabría jamás y el denominador saldría vacío)
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 500, deviceScaleFactor: 1, mobile: false })
    await conScript(FUNDRAISER_OK, async () => {
      await nav.cargar('/')
      await nav.sleep(500)
      const alto = (await nav.evaluate(`Math.round(document.querySelector('.hero').getBoundingClientRect().height)`)) as number
      ok(alto > 1000, `el hero mide más de una pantalla en el móvil (${alto} px de alto en una ventana de 500)`)
      ok((await de(EVENTO_HERO_VISTO)).length === 1, 'y se cuenta como visto al abrir la home aunque no quepa entero')
      ok((await de(EVENTO_HERO_VISTO))[0]?.d?.pagina === 'index', 'desde la página «index»')
    })
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
    await conScript(FUNDRAISER_OK, async () => {
      await nav.cargar('/en')
      await nav.sleep(500)
      ok((await de(EVENTO_HERO_VISTO)).length === 1 && (await de(EVENTO_HERO_VISTO))[0]?.d?.pagina === 'index', '/en suma en la misma página base «index»')
    })

    // C7 · Campana-visible
    await conScript(FUNDRAISER_OK, async () => {
      // /gastos: la tarjeta (variante inline) NO existe al montar: aparece cuando llegan las cifras. Si el observador
      // no se engancha entonces, no sale nada.
      await nav.cargar('/gastos')
      await aVista(BARRA)
      await nav.sleep(600)
      const g = await de(EVENTO_CAMPANA_VISIBLE)
      ok(g.length === 1 && g[0]?.d?.pagina === 'gastos' && g[0]?.d?.conEuros === true, `/gastos: UN «${EVENTO_CAMPANA_VISIBLE}» {pagina: gastos, conEuros: true} aunque la tarjeta aparezca tras montar (${JSON.stringify(g.map((x) => x.d))})`)

      // el mismo bloque, otra página, sin recargar: una vista nueva empieza de cero
      await irA('/colabora')
      await nav.sleep(900)
      const barras = (await nav.evaluate(`document.querySelectorAll(${JSON.stringify(BARRA)}).length`)) as number
      ok(barras >= 2, `/colabora lleva dos tarjetas de campaña (${barras})`)
      await aVista(BARRA)
      await nav.sleep(600)
      const tras = await de(EVENTO_CAMPANA_VISIBLE)
      ok(tras.length === 2 && tras[1]?.d?.pagina === 'colabora', `al navegar a /colabora sin recargar, la vista nueva vuelve a contar: ${tras.length} en total, el 2.º de «colabora» (${JSON.stringify(tras.map((x) => x.d?.pagina))})`)
      await nav.evaluate(`(() => { const b = document.querySelectorAll(${JSON.stringify(BARRA)}); b[b.length - 1].scrollIntoView({ block: 'center', behavior: 'instant' }) })()`)
      await nav.sleep(600)
      ok((await de(EVENTO_CAMPANA_VISIBLE)).length === 2, 'y ver la SEGUNDA tarjeta de /colabora no cuenta otra vez (una vez por vista, no por tarjeta)')
    })
    await conScript(FUNDRAISER_FALLA, async () => {
      await nav.cargar('/gastos')
      await nav.sleep(800)
      ok((await nav.evaluate(`document.querySelectorAll(${JSON.stringify(BARRA)}).length`)) === 0, 'sin cifras de la campaña /gastos no pinta la tarjeta')
      ok((await de(EVENTO_CAMPANA_VISIBLE)).length === 0, `y entonces no hay «${EVENTO_CAMPANA_VISIBLE}»: no se cuenta una tarjeta que nadie vio`)
    })
    await conScript(FUNDRAISER_OK, async () => {
      // la home: la tarjeta grande (variante card) está abajo, en el cierre
      await nav.cargar('/')
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(300)
      const abajo = await nav.evaluate(`document.querySelector(${JSON.stringify(BARRA)}).getBoundingClientRect().top > innerHeight`)
      if (abajo) ok((await de(EVENTO_CAMPANA_VISIBLE)).length === 0, 'la tarjeta de la home está bajo el pliegue: sin verla no hay «Campana-visible»')
      await aVista(BARRA)
      await nav.sleep(600)
      const c = await de(EVENTO_CAMPANA_VISIBLE)
      ok(c.length === 1 && c[0]?.d?.pagina === 'index' && c[0]?.d?.conEuros === true, `home: al verla, UN «${EVENTO_CAMPANA_VISIBLE}» {pagina: index, conEuros: true} (${JSON.stringify(c.map((x) => x.d))})`)

      // C8 · Prensa-visible, en la misma página
      const PRENSA = `[...document.querySelectorAll('a')].find((a) => /elpais\\.com/.test(a.href)).parentElement`
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(300)
      const prensaAbajo = await nav.evaluate(`(${PRENSA}).getBoundingClientRect().top > innerHeight`)
      if (prensaAbajo) ok((await de(EVENTO_PRENSA_VISIBLE)).length === 0, 'la tira de prensa está bajo el pliegue: sin verla no hay «Prensa-visible»')
      await nav.evaluate(`(${PRENSA}).scrollIntoView({ block: 'center', behavior: 'instant' })`)
      await nav.sleep(600)
      const pr = await de(EVENTO_PRENSA_VISIBLE)
      ok(pr.length === 1 && pr[0]?.d?.pagina === 'index', `al ver la tira de prensa: UN «${EVENTO_PRENSA_VISIBLE}» {pagina: index} (${JSON.stringify(pr.map((x) => x.d))})`)
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(300)
      await nav.evaluate(`(${PRENSA}).scrollIntoView({ block: 'center', behavior: 'instant' })`)
      await nav.sleep(600)
      ok((await de(EVENTO_PRENSA_VISIBLE)).length === 1, 'y no se repite al volver a verla en la misma vista')
      await vaciar()
      await nav.evaluate(`[...document.querySelectorAll('a')].find((a) => /elpais\\.com/.test(a.href)).click()`)
      await nav.sleep(150)
      const cp = await de('Clic-prensa')
      ok(cp.length === 1 && cp[0]?.d?.medio === 'El País', `el clic en un medio sigue mandando su «Clic-prensa» (${JSON.stringify(cp.map((x) => x.d))})`)
    })

    // C9 · el script de Umami es `defer`: lo que se ve ANTES de que cargue no se pierde
    // «Sin cargar» = `window.umami` ausente Y que el script real (que la página sí pide) no pueda ocuparlo antes de tiempo.
    const UMAMI_AUSENTE = `(() => { const real = window.__umamiReal; Object.defineProperty(window, 'umami', { configurable: true, get() { return undefined }, set() {} }); window.__restaurarUmami = () => { Object.defineProperty(window, 'umami', { configurable: true, writable: true, value: real }) } })();`
    await conScript(FUNDRAISER_OK + UMAMI_AUSENTE, async () => {
      await nav.cargar('/gastos')
      await aVista(BARRA)
      await nav.sleep(700)
      ok((await nav.evaluate(`typeof window.umami`)) === 'undefined' && (await de(EVENTO_CAMPANA_VISIBLE)).length === 0, 'con el script de Umami sin cargar todavía no sale nada...')
      await nav.evaluate(`window.__restaurarUmami()`)
      await nav.sleep(900)
      const tarde = await de(EVENTO_CAMPANA_VISIBLE)
      ok(tarde.length === 1 && tarde[0]?.d?.pagina === 'gastos', `...y cuando carga, el aviso que esperaba llega UNA vez (${JSON.stringify(tarde.map((x) => x.d))})`)
    })

    // C10 · entrada: la primera página de la sesión, en Donar, Clic-gofundme y (por trackUmami) Contacto-enviado
    const olvidarSesion = () => nav.evaluate(`sessionStorage.clear()`)
    const clicGoFundMe = (id: string) => nav.evaluate(`(() => { const a = document.createElement('a'); a.href = 'https://www.gofundme.com/f/otra'; a.id = '${id}'; document.body.appendChild(a); a.click() })()`)
    await olvidarSesion()
    await nav.cargar('/colabora')
    await vaciar()
    ok((await nav.evaluate(`sessionStorage.getItem('${CLAVE_ENTRADA}')`)) === 'colabora', 'empezar en /colabora deja entrada = «colabora» en sessionStorage')
    await nav.evaluate(`document.querySelector('a[href^="https://gofund.me/"][data-support-cta]').click()`)
    await nav.sleep(150)
    const dEnt = (await de('Donar'))[0]
    const gEnt = (await de(EVENTO_GOFUNDME))[0]
    ok(dEnt?.d?.entrada === 'colabora' && dEnt?.d?.location !== undefined, `«Donar» lleva entrada «colabora» y conserva su location (${JSON.stringify(dEnt?.d)})`)
    ok(gEnt?.d?.entrada === 'colabora' && gEnt?.d?.origen === dEnt?.d?.location, `«${EVENTO_GOFUNDME}» lleva entrada «colabora» y conserva su origen (${JSON.stringify(gEnt?.d)})`)
    await irA('/contacto')
    await nav.sleep(700)
    await vaciar()
    await clicGoFundMe('desde-contacto')
    await nav.sleep(150)
    const gDesde = (await de(EVENTO_GOFUNDME))[0]
    ok(gDesde?.d?.pagina === 'contacto' && gDesde?.d?.entrada === 'colabora', `navegando después a /contacto, la página cambia pero la entrada sigue siendo «colabora» (${JSON.stringify(gDesde?.d)})`)

    await olvidarSesion()
    await nav.cargar('/en/science')
    await vaciar()
    await clicGoFundMe('desde-en')
    await nav.sleep(150)
    ok((await de(EVENTO_GOFUNDME))[0]?.d?.entrada === 'ciencia', `empezar en /en/science: entrada «ciencia», la misma que en español (${JSON.stringify((await de(EVENTO_GOFUNDME))[0]?.d)})`)

    // con el almacenamiento bloqueado (modo privado, ajustes del navegador) la entrada se guarda en memoria y la página no se rompe
    await conScript(`Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('bloqueado', 'SecurityError') } });`, async () => {
      await nav.cargar('/ciencia')
      await vaciar()
      await clicGoFundMe('sin-almacen')
      await nav.sleep(150)
      const g = (await de(EVENTO_GOFUNDME))[0]
      ok(g?.d?.entrada === 'ciencia', `con sessionStorage bloqueado, la entrada se guarda en memoria y viaja igual (${JSON.stringify(g?.d)})`)
    })
  } finally {
    await nav.cerrar()
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ eventos de Umami en verde')
process.exit(fallos ? 1 : 0)
