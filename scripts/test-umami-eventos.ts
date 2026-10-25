// Medición de Umami del rediseño: los eventos que emite el plugin app/plugins/umami-delegado.client.ts (F0, 23-oct-2026), los que miden lo que
// se VE (fase M de main, #331, 24-oct-2026: app/utils/umamiVistas.ts + composables/useUmamiVisto.ts) y la propiedad `entrada`.
//
//   plugins/umami-delegado.client.ts (clics y scroll)
//     Clic-gofundme { pagina, origen }   VerPeticion { origen }
//     Contacto-clic { rol, pagina }      Scroll { pct, pagina }
//   utils/umamiVistas.ts + composables/useUmamiVisto.ts (lo que se VE)
//     Hero-visto { pagina, conEuros }    Campana-visible { pagina, conEuros }    Prensa-visible { pagina }
//   y la propiedad `entrada` (primera página de la sesión) en los eventos de EVENTOS_CON_ENTRADA.
//   T2d (24-oct-2026, decisión 4 de Miriam): `entrada` también en «Puerta»; «Idioma» { de, a, pagina } (el selector de la cabecera);
//   «Visor» { herramienta, accion } (utils/umamiVisor.ts + plugins/umami-visor.client.ts: la primera vez que se toca un visor en la
//   visita; /lesiones hoy, el explorador de célula a célula cuando se fusione #290); y UN vocabulario de roles (utils/rolesContacto.ts)
//   para «Contacto», «Contacto-enviado» y «Contacto-clic».
//   «Clic-prensa» de la tira de prensa de la home lo cuenta el atributo data-umami-event de cada medio; no se manda a mano.
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
// (Lo añadió a package.json y a e2e.yml la revisión de diseño del 24-oct-2026: su bloque C3d es la única comprobación en navegador de que
// la tira de prensa no cuenta doble «Clic-prensa».)
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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
import { ROLES_CONTACTO, SIN_ROL, esRolContacto, rolDeContacto } from '../app/utils/rolesContacto'
import {
  CLAVE_VISOR,
  EVENTO_VISOR,
  SELECTOR_TOCABLE,
  accionDeVisor,
  esTeclaDeUso,
  nombreDeVisor,
  olvidarVisores,
  registrarVisor,
} from '../app/utils/umamiVisor'

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
igual(conEntrada('Puerta', { puerta: 'apoyar' }, a1), { puerta: 'apoyar', entrada: 'colabora' }, '«Puerta» lleva la entrada (T2d): se ve por qué página llegó quien elige cada puerta')
igual([...EVENTOS_CON_ENTRADA].sort(), ['Clic-gofundme', 'Contacto-enviado', 'Donar', 'Puerta'], 'esos cuatro llevan entrada y ningún otro')

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

// ── A3. roles de contacto y «Visor» (T2d) ───────────────────────────────────────────────────
console.log('\nA3 · roles de contacto y «Visor»')
igual([...ROLES_CONTACTO], ['oncologist', 'researcher', 'journalist', 'patient', 'tech', 'other'], 'los seis roles del selector del formulario, en un solo sitio')
igual(SIN_ROL, 'sin_rol', 'y «sin_rol» cuando no hay ninguno')
for (const r of ROLES_CONTACTO) igual(rolDeContacto(r), r, `«${r}» es un rol`)
for (const malo of ['press', 'otro', 'brand', '', '<script>', 'Tech', 'oncologist ', null, undefined, ['tech'], 3]) igual(rolDeContacto(malo), 'sin_rol', `${JSON.stringify(malo)} no es un rol: sin_rol (el «press» y el «otro» de antes también)`)
ok(esRolContacto('tech') && !esRolContacto('brand') && !esRolContacto(undefined), 'esRolContacto distingue un rol de lo que no lo es')
igual(clasificarClic(`${SITIO}/contacto?role=journalist`, SITIO, 'prensa', null)?.datos.rol, 'journalist', 'Contacto-clic: «journalist» es el rol de prensa')
igual(clasificarClic(`${SITIO}/contacto?role=press`, SITIO, 'colabora', null)?.datos.rol, 'sin_rol', 'Contacto-clic: «press» ya no es un rol (el vocabulario es el del formulario)')
igual(clasificarClic(`${SITIO}/contacto?role=brand`, SITIO, 'colabora', null)?.datos.rol, 'sin_rol', 'Contacto-clic: una palabra cualquiera en minúsculas ya no pasa, solo las del vocabulario')
igual(clasificarClic(`${SITIO}/en/contact?role=other`, SITIO, 'gracias', null)?.datos.rol, 'other', 'Contacto-clic: «other» (el perfil «Otro» elegido) pasa tal cual')

ok(esTeclaDeUso('Enter') && esTeclaDeUso(' ') && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].every(esTeclaDeUso), 'Intro, Espacio y las flechas son usar un control')
ok(!esTeclaDeUso('Tab') && !esTeclaDeUso('a') && !esTeclaDeUso('Shift') && !esTeclaDeUso('Escape'), 'tabular, escribir una letra, una modificadora o Escape no lo son')
igual(nombreDeVisor('lesiones'), 'lesiones', 'un nombre de herramienta vale')
for (const malo of ['', 'a', 'Lesiones', 'les iones', '<script>', 'x'.repeat(31), null, undefined, 7]) igual(nombreDeVisor(malo), null, `${JSON.stringify(malo)} no es un nombre: no viaja a Umami`)
igual(accionDeVisor('mama', 'CANVAS'), 'mama', 'la acción que declara el contenedor manda')
igual(accionDeVisor(undefined, 'CANVAS'), 'mover', 'sin acción declarada, un lienzo es «mover»')
igual(accionDeVisor(null, 'BUTTON'), 'control', 'y un botón, «control»')
igual(accionDeVisor('<b>', 'BUTTON'), 'control', 'una acción declarada que no vale se ignora')
ok(['canvas', 'button', 'select', '[role="option"]', '[role="tab"]', '[role="slider"]'].every((t) => SELECTOR_TOCABLE.split(', ').includes(t)), 'un lienzo, un botón, un selector, una opción, una pestaña y un deslizador se pueden tocar')
ok(!SELECTOR_TOCABLE.split(', ').some((t) => ['a', 'img', 'p', 'div', 'svg', '[role="img"]'].includes(t)), 'un enlace, una imagen, un párrafo o un dibujo no cuentan como «usar el visor»')

olvidarVisores()
const v1 = almacen()
ok(registrarVisor('lesiones', v1), 'la primera vez que se toca una herramienta en la visita: se manda')
ok(!registrarVisor('lesiones', v1), 'la segunda: no')
ok(registrarVisor('explorador', v1) && !registrarVisor('explorador', v1), 'otra herramienta cuenta aparte, también una sola vez')
igual(v1.datos.get(CLAVE_VISOR), 'lesiones,explorador', 'se apunta en sessionStorage')
olvidarVisores()
ok(!registrarVisor('lesiones', v1), 'tras una recarga (la memoria vacía) sessionStorage lo recuerda: sigue sin repetirse en la misma visita')
olvidarVisores()
ok(registrarVisor('lesiones', almacen()), 'una sesión nueva (almacén vacío) vuelve a contar')
olvidarVisores()
ok(registrarVisor('lesiones', null) && !registrarVisor('lesiones', null), 'sin sessionStorage (null) queda en memoria: UNA vez')
olvidarVisores()
const bloqueadoV = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('SecurityError')
  },
}
let revientoV = false
try {
  ok(registrarVisor('lesiones', bloqueadoV) && !registrarVisor('lesiones', bloqueadoV), 'con el almacenamiento bloqueado (lanza) no revienta y cuenta UNA vez, en memoria')
} catch {
  revientoV = true
}
ok(!revientoV, 'el almacenamiento que lanza no rompe la página')
olvidarVisores()
ok(!registrarVisor('<script>', almacen()) && !registrarVisor('x', almacen()), 'un nombre que no vale no manda nada')
const v2 = almacen()
v2.datos.set(CLAVE_VISOR, '<script>,lesiones')
olvidarVisores()
ok(!registrarVisor('lesiones', v2), 'de lo guardado se leen solo los nombres válidos («lesiones» sigue contando como hecho)')
olvidarVisores()

// ── B. los nombres de siempre no se han tocado ───────────────────────────────────────────────
console.log('\nB · los eventos que ya existían')
const soporte = readFileSync('app/composables/useSupport.ts', 'utf-8')
const contacto = readFileSync('app/pages/contacto.vue', 'utf-8')
// F5 (23-oct-2026): «PathwayCurioso» se fue de esta lista porque su única emisora, la tarjeta «Acabo de llegar» de las siete de la home,
// desapareció con ellas (la home pinta ahora cuatro puertas). Sigue «Pathway»: lo emiten los chips «por perfil» de /colabora hasta F10.
const ANTIGUOS = ['Donar', 'VerCiencia', 'Clic-prensa', 'Contacto', 'Pathway', 'VerMapa', 'VerLesiones', 'VerDatos', 'VerCelula', 'VerExplorador', 'VerLaminillas', 'VerUltimo', 'Navegar', 'Error404', 'Compartir', 'Bio-link', 'VerVideo']
for (const nombre of ANTIGUOS) ok(soporte.includes(`trackUmami('${nombre}'`), `useSupport.ts sigue emitiendo «${nombre}»`)
ok(/trackUmami\('Contacto-enviado',\s*\{\s*rol:/.test(contacto), 'contacto.vue sigue emitiendo «Contacto-enviado» con su rol')
const NUEVOS = [EVENTO_GOFUNDME, EVENTO_PETICION, EVENTO_CONTACTO_CLIC, EVENTO_SCROLL, EVENTO_HERO_VISTO, EVENTO_CAMPANA_VISIBLE, EVENTO_PRENSA_VISIBLE]
ok(NUEVOS.every((n) => ![...ANTIGUOS, 'Contacto-enviado'].includes(n)), `los siete nombres nuevos (${NUEVOS.join(', ')}) no pisan ninguno de los de siempre`)
ok(new Set(NUEVOS).size === NUEVOS.length, 'y no se repiten entre sí')
igual([EVENTO_HERO_VISTO, EVENTO_CAMPANA_VISIBLE, EVENTO_PRENSA_VISIBLE], ['Hero-visto', 'Campana-visible', 'Prensa-visible'], 'los nombres de lo que se ve son el contrato de la fase M: no se renombran')
ok(/recordarApoyo\(location\)/.test(soporte), 'trackSupport deja la etiqueta de origen para «Clic-gofundme»')
ok(/recordarApoyo\(`campana_oficial_\$\{location\}`\)/.test(soporte), 'y el enlace del aviso «Campaña oficial» deja la suya (no llega a «Clic-gofundme» como sin_etiqueta)')
const umamiTs = readFileSync('app/utils/umami.ts', 'utf-8')
ok(/\.track\(event,\s*conEntrada\(event,\s*data\)\)/.test(umamiTs), 'trackUmami pasa los datos por conEntrada: la entrada viaja en TODA emisión de esos eventos, la haga quien la haga')
// F5: las cuatro puertas de la home miden «Puerta» con la puerta como propiedad (sustituye a «Pathway»/«PathwayCurioso» de las siete tarjetas)
ok(/trackUmami\('Puerta',\s*\{\s*puerta:/.test(soporte), 'useSupport.ts emite «Puerta» con la puerta como propiedad')
ok(![...ANTIGUOS, 'Contacto-enviado', ...NUEVOS].includes('Puerta'), 'el nombre «Puerta» no pisa ninguno de los demás')
ok(!soporte.includes("trackUmami('PathwayCurioso'"), '«PathwayCurioso» ya no se emite: su tarjeta se fue de la home (F5)')
// T2a (24-oct-2026): los orígenes de lo que vuelve. Se miden con los eventos de siempre de cada herramienta (VerLesiones, VerCelula…), cada uno con SU origen:
// `herramientas` (el índice, como antes de F4), `home_teaser` (la banda de la home: el mismo origen del teaser que F5 borró, para que las series se
// puedan comparar) y `herramienta_<ruta>` en el «Donar» de la salida común. `datos_visores` (el origen de la franja de F4) ya no existe.
const indice = readFileSync('app/pages/herramientas.vue', 'utf-8'), banda = readFileSync('app/components/SectionHerramientasTeaser.vue', 'utf-8'), salida = readFileSync('app/components/SalidaHerramienta.vue', 'utf-8')
ok(/trackHerramienta\(key, 'herramientas'\)/.test(indice) && /trackSupport\('herramientas'\)/.test(indice), "el índice mide sus aperturas con origen «herramientas» y su «Apoyar» con «herramientas»")
ok(/trackHerramienta\(key, 'home_teaser'\)/.test(banda), "la banda de la home mide con origen «home_teaser»")
ok(/trackSupport\(origen\)/.test(salida) && /`herramienta_\$\{routeBaseName\(route\)/.test(salida), "la salida común mide «Donar» con origen «herramienta_<ruta>» (se ve cuál convierte)")
ok(!readFileSync('app/pages/datos.vue', 'utf-8').includes('datos_visores'), 'el origen «datos_visores» (la franja que salió de /datos) ya no se emite')
ok(/'tecnologia'/.test(readFileSync('app/utils/caminos.ts', 'utf-8')) && /trackPuerta\(id\)/.test(readFileSync('app/components/Puertas.vue', 'utf-8')), 'la puerta «Tecnología, IA y marcas» mide «Puerta» con su id (tecnologia), como las demás')
ok(soporte.includes("if (key === 'map') trackMapa(origen)") && soporte.includes("else if (key === 'lesions') trackLesiones(origen)") && soporte.includes("else if (key === 'slides') trackLaminillas(origen)"), 'trackHerramienta sigue enrutando cada clave a su evento (el reservorio no tiene el suyo)')
// y la medición no se duplica: VerPeticion, Contacto-clic y Clic-gofundme los emite el plugin por el href; la home no los llama a mano
const homeVue = readFileSync('app/pages/index.vue', 'utf-8') + readFileSync('app/components/SectionHero.vue', 'utf-8') + readFileSync('app/components/Puertas.vue', 'utf-8')
ok(!/trackUmami\('(VerPeticion|Contacto-clic|Clic-gofundme)'/.test(homeVue) && !/track(Peticion|ContactoClic)/.test(homeVue), 'la home no llama a mano a VerPeticion / Contacto-clic / Clic-gofundme (los emite el plugin: contarían doble)')
// la medición de lo que se ve está enganchada a los tres bloques, con el nombre del contrato
const hero = readFileSync('app/components/SectionHero.vue', 'utf-8')
const progreso = readFileSync('app/components/GoFundMeProgress.vue', 'utf-8')
const tiraPrensa = readFileSync('app/components/PrensaTira.vue', 'utf-8')
ok(/useUmamiVisto\(heroEl,\s*EVENTO_HERO_VISTO,\s*\(\)\s*=>\s*\(\{\s*conEuros:/.test(hero) && /<section\s+ref="heroEl"/.test(hero), 'el hero se mide entero (<section ref="heroEl">) con conEuros')
ok(/useUmamiVisto\(raiz,\s*EVENTO_CAMPANA_VISIBLE,\s*\(\)\s*=>\s*\(\{\s*conEuros:/.test(progreso) && (progreso.match(/\bref="raiz"/g) ?? []).length === 2, 'las dos variantes de la tarjeta (tarjeta e inline) llevan ref="raiz" y miden con conEuros')
ok(/useUmamiVisto\(tira,\s*EVENTO_PRENSA_VISIBLE\)/.test(tiraPrensa) && /ref="tira"/.test(tiraPrensa), 'la tira de prensa de la home se mide')
ok(/data-umami-event="Clic-prensa"/.test(tiraPrensa) && !/trackPress/.test(tiraPrensa), 'y sus clics los cuenta el atributo data-umami-event de cada medio, no una llamada a mano (contaría doble)')
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

// ── B2. T2d (24-oct-2026): Idioma, Visor y un solo vocabulario de roles ──────────────────────────
const raizApp = 'app'
const ficheros = (extensiones: string[]): string[] =>
  (readdirSync(raizApp, { recursive: true }) as string[]).filter((f) => extensiones.some((e) => f.endsWith(e))).map((f) => `${raizApp}/${f}`)
const sinComentarios = (src: string) => src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')

// Idioma { de, a, pagina }
const siteNav = readFileSync('app/components/SiteNav.vue', 'utf-8')
ok(/trackUmami\('Idioma',\s*\{\s*de,\s*a,\s*pagina\s*\}\)/.test(soporte), 'useSupport.ts emite «Idioma» { de, a, pagina }')
const iMide = siteNav.indexOf('trackIdioma(locale.value, code, paginaBase(route.name))')
const iNavega = siteNav.indexOf('await setLocale(code)')
ok(iMide > 0 && iNavega > iMide, '«Idioma» se mide ANTES de setLocale: después, la ruta y el idioma ya son los de llegada')
ok(/if \(code !== locale\.value\) \{(\s*\/\/[^\n]*)*\s*trackIdioma\(/.test(siteNav), 'y solo cuando el idioma cambia de verdad (pulsar el que ya está activo no manda nada)')
ok(![...ANTIGUOS, 'Contacto-enviado', 'Puerta', ...NUEVOS].includes('Idioma'), 'el nombre «Idioma» no pisa ninguno de los de siempre')

// Visor { herramienta, accion }
const lesionesVue = readFileSync('app/pages/lesiones.vue', 'utf-8')
const marcados = [...lesionesVue.matchAll(/data-visor="([a-z0-9_]+)" data-visor-accion="([a-z0-9_]+)"/g)].map((m) => `${m[1]}:${m[2]}`).sort()
igual(marcados, ['lesiones:foco', 'lesiones:higado', 'lesiones:hueso', 'lesiones:mama'], '/lesiones marca sus cuatro partes (mama, hígado, hueso y el esqueleto de focos) con data-visor / data-visor-accion')
const pluginVisor = readFileSync('app/plugins/umami-visor.client.ts', 'utf-8')
ok(/addEventListener\('pointerdown'[\s\S]*capture: true/.test(pluginVisor) && /addEventListener\('keydown'/.test(pluginVisor), 'el plugin del visor mira clics/toques y teclas de todo el documento, en captura (el visor puede parar sus propios gestos)')
ok(/registrarVisor\(herramienta\)/.test(pluginVisor) && /enviarCuandoHaya\(/.test(pluginVisor) && /trackUmami\(EVENTO_VISOR,\s*\{\s*herramienta,\s*accion\s*\}\)/.test(pluginVisor), 'una vez por visita (registrarVisor), esperando al script de Umami (defer)')
ok(EVENTO_VISOR === 'Visor' && ![...ANTIGUOS, 'Contacto-enviado', 'Idioma', ...NUEVOS].includes(EVENTO_VISOR), 'el nombre «Visor» no pisa ninguno de los demás')

// Una llamada a trackX(…) en un componente sin haberla sacado de useSupport() revienta al hacer clic (T2a dejó así a /lesiones con trackMapa)
const sinSacar: string[] = []
for (const f of ficheros(['.vue'])) {
  const src = sinComentarios(readFileSync(f, 'utf-8'))
  const usados = new Set([...src.matchAll(/\b(track[A-Z][A-Za-z0-9]*)\s*\(/g)].map((m) => m[1]!))
  usados.delete('trackUmami') // es una utilidad de auto-importación, no de useSupport()
  const sacados = new Set([...src.matchAll(/const\s*\{([^}]*)\}\s*=\s*useSupport\(\)/g)].flatMap((m) => m[1]!.split(',').map((x) => x.trim().split(':')[0]!.trim())))
  const locales = new Set([...src.matchAll(/(?:function|const)\s+(track[A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]!))
  const faltan = [...usados].filter((u) => !sacados.has(u) && !locales.has(u))
  if (faltan.length) sinSacar.push(`${f}: ${faltan.join(', ')}`)
}
ok(sinSacar.length === 0, `todo trackX(…) que usa un componente sale de useSupport() o está definido en él${sinSacar.length ? ` (faltan: ${sinSacar.join('; ')})` : ''}`)

// Un solo vocabulario de roles
const enUso: string[] = []
for (const f of ficheros(['.vue', '.ts'])) {
  const src = sinComentarios(readFileSync(f, 'utf-8'))
  for (const m of src.matchAll(/trackContact\('([^']*)'\)/g)) enUso.push(`${f}: trackContact('${m[1]}')`)
  for (const m of src.matchAll(/[?&]role=([A-Za-z_]+)/g)) enUso.push(`${f}: ?role=${m[1]}`)
  for (const m of src.matchAll(/query:\s*\{\s*role:\s*'([^']*)'/g)) enUso.push(`${f}: role '${m[1]}'`)
}
const fueraDeLista = enUso.filter((u) => !esRolContacto(/(?:trackContact\('|role=|role '|\?role=)([A-Za-z_]+)/.exec(u)?.[1]))
ok(enUso.length >= 8 && fueraDeLista.length === 0, `los ${enUso.length} roles que escriben los enlaces y las tarjetas del código son del vocabulario único${fueraDeLista.length ? ` (fuera: ${fueraDeLista.join('; ')})` : ''}`)
const rolesHerramienta = [...(/ROL_HERRAMIENTA[^{]*\{([\s\S]*?)\n\}/.exec(readFileSync('app/utils/navegacion.ts', 'utf-8'))?.[1] ?? '').matchAll(/:\s*'([a-z_]+)'/g)].map((m) => m[1])
ok(rolesHerramienta.length >= 5 && rolesHerramienta.every(esRolContacto), `y los de ROL_HERRAMIENTA (${rolesHerramienta.join(', ')})`)
const opcionesRol = [...(/<select id="role"[\s\S]*?<\/select>/.exec(contacto)?.[0] ?? '').matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]).sort()
igual(opcionesRol, [...ROLES_CONTACTO].sort(), 'el selector del formulario ofrece justo esos seis roles')
ok(/esRolContacto\(r\)/.test(contacto) && /rolDeContacto\(role\.value\)/.test(contacto) && !/\|\| 'otro'/.test(contacto), 'el formulario lee el ?role= y manda «Contacto-enviado» por el vocabulario único (sin «otro»)')
ok(/function trackContact\(role: RolContacto\)/.test(soporte), 'trackContact solo acepta un rol del vocabulario')

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
      // `importeHero`: si el hero llevaba el importe EN EL MOMENTO del aviso, para comprobar `conEuros` contra lo que se veía.
      source: `window.__umami = []; window.__umamiReal = { track: (e, d) => window.__umami.push({ e, d, importeHero: !!document.querySelector('.hero__support [data-gofundme-importe]') }) };
        window.umami = window.__umamiReal;
        window.addEventListener('click', (ev) => { if (ev.target && ev.target.closest && ev.target.closest('a')) ev.preventDefault() }, true);`,
    })
    type Ev = { e: string; d?: Record<string, unknown>; importeHero?: boolean }
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
    // C2b · Idioma { de, a, pagina } (T2d): el selector de la cabecera. `pagina` es donde se cambió; pulsar el idioma activo no manda nada
    {
      const selectorIdioma = (nombre: string) => `[data-cabecera-fija] [role=group] button[aria-label="${nombre}"]`
      await nav.cargar('/ciencia')
      await vaciar()
      ok(await nav.evaluate(`!!document.querySelector('${selectorIdioma('English')}')`), '/ciencia tiene el selector de idioma en la cabecera')
      await nav.evaluate(`document.querySelector('${selectorIdioma('Español')}').click()`)
      await nav.sleep(300)
      ok((await de('Idioma')).length === 0, 'pulsar el idioma que ya está activo (ES en /ciencia) no manda «Idioma»')
      await nav.evaluate(`document.querySelector('${selectorIdioma('English')}').click()`)
      for (let i = 0; i < 25 && !(await nav.evaluate(`location.pathname.startsWith('/en')`)); i++) await nav.sleep(200)
      const alEn = await de('Idioma')
      ok(alEn.length === 1 && alEn[0]?.d?.de === 'es' && alEn[0]?.d?.a === 'en' && alEn[0]?.d?.pagina === 'ciencia', `ES → EN desde /ciencia: UN «Idioma» {de: es, a: en, pagina: ciencia} (${JSON.stringify(alEn.map((x) => x.d))})`)
      ok((await nav.evaluate('location.pathname')) === '/en/science', `y navega a la página en inglés (${await nav.evaluate('location.pathname')})`)
      await nav.sleep(600)
      await nav.evaluate(`document.querySelector('${selectorIdioma('Español')}').click()`)
      for (let i = 0; i < 25 && (await nav.evaluate(`location.pathname.startsWith('/en')`)); i++) await nav.sleep(200)
      const todos = await de('Idioma')
      ok(todos.length === 2 && todos[1]?.d?.de === 'en' && todos[1]?.d?.a === 'es' && todos[1]?.d?.pagina === 'ciencia', `EN → ES desde /en/science: otro «Idioma» {de: en, a: es, pagina: ciencia}, la misma página base (${JSON.stringify(todos.map((x) => x.d))})`)
      ok(todos.every((x) => x.d !== undefined && !('entrada' in x.d)), '«Idioma» no lleva entrada (solo Donar, Clic-gofundme, Contacto-enviado y Puerta)')
    }

    // C3 · la petición, cuando exista un enlace al ancla
    await nav.cargar('/')
    await vaciar()
    await nav.evaluate(`(() => { const a = document.createElement('a'); a.href = '/datos#que-buscamos'; document.body.appendChild(a); a.click() })()`)
    await nav.sleep(150)
    const pet = await de(EVENTO_PETICION)
    ok(pet.length === 1 && pet[0]?.d?.origen === 'index', `un enlace a /datos#que-buscamos manda «${EVENTO_PETICION}» desde «index» (${JSON.stringify(pet[0]?.d)})`)

    // C3b · la home (F5): sus enlaces REALES miden una vez, sin llamadas a mano
    await nav.cargar('/')
    await vaciar()
    await nav.evaluate(`document.querySelector('.hero__pro').click()`)
    await nav.sleep(150)
    ok((await de(EVENTO_PETICION)).length === 1 && (await de(EVENTO_PETICION))[0]?.d?.origen === 'index', `el enlace «¿Eres clínico o laboratorio?» del hero manda UN «${EVENTO_PETICION}» desde «index» (${JSON.stringify((await de(EVENTO_PETICION)).map((x) => x.d))})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('.puertas a[href="/datos#que-buscamos"]').click()`)
    await nav.sleep(150)
    ok((await de(EVENTO_PETICION)).length === 1, `la puerta «Clínico o laboratorio» manda UN «${EVENTO_PETICION}» (${(await de(EVENTO_PETICION)).length})`)
    ok((await de('Puerta')).length === 1 && (await de('Puerta'))[0]?.d?.puerta === 'clinico', `y UN «Puerta» con puerta «clinico» (${JSON.stringify((await de('Puerta')).map((x) => x.d))})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('.puertas a[href^="https://gofund.me/"]').click()`)
    await nav.sleep(150)
    ok((await de('Puerta'))[0]?.d?.puerta === 'apoyar' && (await de('Donar'))[0]?.d?.location === 'home_puertas', `la puerta «Apoyar» manda «Puerta» (apoyar) y «Donar» desde home_puertas (${JSON.stringify([...(await de('Puerta')), ...(await de('Donar'))].map((x) => x.d))})`)
    ok((await de(EVENTO_GOFUNDME)).length === 1 && (await de(EVENTO_GOFUNDME))[0]?.d?.origen === 'home_puertas', `y UN «${EVENTO_GOFUNDME}» con ese origen (${JSON.stringify((await de(EVENTO_GOFUNDME)).map((x) => x.d))})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('a[data-support-cta][href^="https://gofund.me/"]').click()`)
    await nav.sleep(150)
    ok((await de('Donar'))[0]?.d?.location === 'home_hero', `el botón del hero sigue midiendo «Donar» desde home_hero (${JSON.stringify((await de('Donar')).map((x) => x.d))})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('a[href="/contacto?role=researcher"]').click()`)
    await nav.sleep(150)
    const cc = await de(EVENTO_CONTACTO_CLIC)
    ok(cc.length === 1 && cc[0]?.d?.rol === 'researcher' && cc[0]?.d?.pagina === 'index', `«Escribir al equipo» manda UN «${EVENTO_CONTACTO_CLIC}» con rol researcher desde «index» (${JSON.stringify(cc.map((x) => x.d))})`)

    // C3d · la tira de prensa de la home (24-oct-2026): «Prensa-visible» UNA vez por vista, al entrar en pantalla, y el clic en un medio lo
    // cuenta Umami por su atributo data-umami-event: el sitio no manda «Clic-prensa» a mano desde la tira (contaría doble). El stub de aquí no
    // procesa atributos, así que un «Clic-prensa» recibido en este punto sería justo la doble cuenta.
    await nav.cargar('/')
    await vaciar()
    await nav.evaluate(`window.scrollTo(0, 0)`)
    await nav.sleep(400)
    const tiraAbajo = await nav.evaluate(`document.querySelector('.prensa-tira').getBoundingClientRect().top > innerHeight`)
    if (tiraAbajo) ok((await de('Prensa-visible')).length === 0, 'la tira de prensa está bajo el pliegue: sin verla no hay «Prensa-visible»')
    await nav.evaluate(`document.querySelector('.prensa-tira').scrollIntoView({ block: 'center' })`)
    await nav.sleep(600)
    ok((await de('Prensa-visible')).length === 1 && (await de('Prensa-visible'))[0]?.d?.pagina === 'index', `al ver la tira de prensa manda UN «Prensa-visible» {pagina: index} (${JSON.stringify((await de('Prensa-visible')).map((x) => x.d))})`)
    await nav.evaluate(`window.scrollTo(0, 0)`)
    await nav.sleep(400)
    await nav.evaluate(`document.querySelector('.prensa-tira').scrollIntoView({ block: 'center' })`)
    await nav.sleep(600)
    ok((await de('Prensa-visible')).length === 1, `y no se repite al volver a verla en la misma vista (${(await de('Prensa-visible')).length})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('.prensa-tira__medio').click()`)
    await nav.sleep(150)
    ok((await de('Clic-prensa')).length === 0, 'un clic en un medio de la tira no manda «Clic-prensa» a mano (lo cuenta Umami por data-umami-event; si no, contaría doble)')

    // C3c · las puertas sociales (F6, 23-oct-2026): lo que mide el apoyo de /links y de /lesiones, y lo que mide /gracias. Un clic = un «Donar»
    // con SU origen y un «Clic-gofundme» que lo hereda; /links, además, un «Bio-link» (apoyar). Sin llamadas dobles: el plugin cuenta el href y
    // la página, el botón.
    for (const [ruta, origenEsperado, pagina] of [['/links', 'links', 'links'], ['/lesiones', 'lesiones_cierre', 'lesiones']] as const) {
      await nav.cargar(ruta)
      await vaciar()
      const hay = await nav.evaluate(`!!document.querySelector('main a[data-support-cta][href^="https://gofund.me/"]')`)
      ok(hay, `${ruta} tiene su enlace de apoyo a GoFundMe con data-support-cta`)
      await nav.evaluate(`document.querySelector('main a[data-support-cta][href^="https://gofund.me/"]').click()`)
      await nav.sleep(150)
      const d = await de('Donar'), g = await de(EVENTO_GOFUNDME)
      ok(d.length === 1 && d[0]?.d?.location === origenEsperado, `${ruta}: un clic de apoyo manda UN «Donar» desde «${origenEsperado}» (${JSON.stringify(d.map((x) => x.d))})`)
      ok(g.length === 1 && g[0]?.d?.origen === origenEsperado && g[0]?.d?.pagina === pagina, `${ruta}: y UN «${EVENTO_GOFUNDME}» con ese origen, desde la página «${pagina}» (${JSON.stringify(g.map((x) => x.d))})`)
      if (ruta === '/links') {
        const b = await de('Bio-link')
        ok(b.length === 1 && b[0]?.d?.destino === 'apoyar', `/links: y UN «Bio-link» con destino «apoyar» (${JSON.stringify(b.map((x) => x.d))})`)
      }
    }
    await nav.cargar('/gracias')
    await vaciar()
    await nav.evaluate(`document.querySelector('main a[href="/contacto?role=other"]').click()`)
    await nav.sleep(150)
    const recibo = await de(EVENTO_CONTACTO_CLIC)
    ok(recibo.length === 1 && recibo[0]?.d?.rol === 'other' && recibo[0]?.d?.pagina === 'gracias', `/gracias: «Escríbenos» manda UN «${EVENTO_CONTACTO_CLIC}» con rol other desde «gracias» (${JSON.stringify(recibo.map((x) => x.d))})`)
    await vaciar()
    await nav.evaluate(`document.querySelector('main a[href="/timeline#lo-ultimo"]').click()`)
    await nav.sleep(150)
    const ultimo = await de('VerUltimo')
    ok(ultimo.length === 1 && ultimo[0]?.d?.origen === 'gracias', `/gracias: «Ver lo último del caso» manda UN «VerUltimo» desde «gracias» (${JSON.stringify(ultimo.map((x) => x.d))})`)

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
    // ── Lo que se VE: Hero-visto, Campana-visible (y Prensa-visible, arriba, en C3d) ───────────────
    // /fundraiser.json no existe en el build estático (en producción lo sirve una función): se simula con un fetch de mentira, que llega
    // ANTES que cualquier script de la página (como en test-salud-estatica). Con seed/fundraiser.json el HTML ya trae la cifra; sin ella
    // (el CI corre `nuxt generate` a secas) la trae la petición: los tests esperan a que el importe esté en pantalla, no a un tiempo fijo.
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
    const conScript = async (source: string, fn: () => Promise<void>) => {
      const { identifier } = await nav.cdp('Page.addScriptToEvaluateOnNewDocument', { source })
      try {
        await fn()
      } finally {
        await nav.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier })
      }
    }
    const CIFRAS = JSON.stringify({ currentAmount: { amount: 12345, currencyCode: 'EUR' }, donationCount: 321, donationsEnabled: true, origen: 'vivo', actualizado: '2026-10-24T12:00:00.000Z' })
    const FUNDRAISER_OK = `(() => { const orig = window.fetch.bind(window); window.fetch = (u, o) => /fundraiser\\.json/.test(String((u && u.url) || u)) ? Promise.resolve(new Response(${JSON.stringify(CIFRAS)}, { status: 200, headers: { 'content-type': 'application/json' } })) : orig(u, o) })();`
    const FUNDRAISER_FALLA = `(() => { const orig = window.fetch.bind(window); window.fetch = (u, o) => /fundraiser\\.json/.test(String((u && u.url) || u)) ? Promise.reject(new TypeError('sin red')) : orig(u, o) })();`
    // la página entera desplazada fuera de la ventana: nada se ve hasta que el test quita la hoja de estilo. Este script corre
    // antes de que exista <head>, así que espera a que el documento lo cree.
    const FUERA = `(() => { const poner = () => { if (!document.head) return false; const st = document.createElement('style'); st.id = '__fuera'; st.textContent = '#__nuxt { transform: translateY(150vh) }'; document.head.appendChild(st); return true }; if (!poner()) { const mo = new MutationObserver(() => { if (poner()) mo.disconnect() }); mo.observe(document, { childList: true, subtree: true }) } })();`
    const aVista = (selector: string) => nav.evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', behavior: 'instant' })`)
    const irA = (ruta: string) => nav.evaluate(`document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$nuxt.$router.push(${JSON.stringify(ruta)})`)
    // La tarjeta de la campaña es `.gfm` (la de la home, `.gfm--card`; la de /gastos y /colabora, `.gfm--linea`). Ya no hay barra de progreso.
    const CAMPANA = '.gfm'
    const HERO_IMPORTE = '.hero__support [data-gofundme-importe]'
    // espera (hasta 10 s) a que `selector` exista; la máquina puede ir cargada
    const hasta = async (selector: string) => {
      for (let i = 0; i < 50; i++) {
        if (await nav.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) return true
        await nav.sleep(200)
      }
      return false
    }

    // C6 · Hero-visto
    await conScript(FUNDRAISER_OK + FUERA, async () => {
      await nav.cargar('/')
      ok(await hasta(HERO_IMPORTE), 'con la campaña respondiendo, el hero pinta el importe (de la semilla del build o de la petición)')
      ok((await de(EVENTO_HERO_VISTO)).length === 0, 'con el hero fuera de pantalla no hay «Hero-visto»')
      await nav.evaluate(`document.getElementById('__fuera').remove()`)
      await nav.sleep(600)
      const h = await de(EVENTO_HERO_VISTO)
      ok(h.length === 1 && h[0]?.d?.pagina === 'index' && h[0]?.d?.conEuros === true, `al verse el hero con el importe: UN «${EVENTO_HERO_VISTO}» {pagina: index, conEuros: true} (${JSON.stringify(h.map((x) => x.d))})`)
      await nav.evaluate(`window.scrollTo({ top: 3000, behavior: 'instant' })`)
      await nav.sleep(300)
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(500)
      ok((await de(EVENTO_HERO_VISTO)).length === 1, 'y no se repite al volver a verlo en la misma vista')
    })
    await conScript(FUNDRAISER_FALLA + FUERA, async () => {
      await nav.cargar('/')
      await nav.sleep(500)
      await nav.evaluate(`document.getElementById('__fuera').remove()`)
      await nav.sleep(600)
      const h = await de(EVENTO_HERO_VISTO)
      // «conEuros» dice lo que había en el hero al verse: con semilla en el build, el importe; sin ella (CI), nada
      ok(h.length === 1 && h[0]?.d?.conEuros === h[0]?.importeHero, `si la campaña no responde, «conEuros» coincide con lo que pintaba el hero (${JSON.stringify(h.map((x) => ({ ...x.d, importeHero: x.importeHero })))})`)
    })
    // el hero mide más de una pantalla en el móvil: se cuenta como visto con la mitad de la PANTALLA, no con la mitad del hero
    // (en una ventana baja, la mitad del hero no cabría jamás y el denominador saldría vacío)
    await nav.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 400, deviceScaleFactor: 1, mobile: false })
    await conScript(FUNDRAISER_OK, async () => {
      await nav.cargar('/')
      await nav.sleep(500)
      const alto = (await nav.evaluate(`Math.round(document.querySelector('.hero').getBoundingClientRect().height)`)) as number
      ok(alto > 2 * 400, `el hero mide más del doble de una ventana de 400 px (${alto} px de alto)`)
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
      // /gastos: la tarjeta (variante en línea) puede NO existir al montar (sin semilla en el build aparece cuando llegan las cifras).
      // Si el observador no se engancha entonces, no sale nada.
      await nav.cargar('/gastos')
      ok(await hasta(CAMPANA), '/gastos pinta la tarjeta de la campaña')
      await aVista(CAMPANA)
      await nav.sleep(600)
      const g = await de(EVENTO_CAMPANA_VISIBLE)
      ok(g.length === 1 && g[0]?.d?.pagina === 'gastos' && g[0]?.d?.conEuros === true, `/gastos: UN «${EVENTO_CAMPANA_VISIBLE}» {pagina: gastos, conEuros: true} (${JSON.stringify(g.map((x) => x.d))})`)

      // el mismo bloque, otra página, sin recargar: una vista nueva empieza de cero
      await irA('/colabora')
      await nav.sleep(900)
      const tarjetas = (await nav.evaluate(`document.querySelectorAll(${JSON.stringify(CAMPANA)}).length`)) as number
      ok(tarjetas >= 2, `/colabora lleva dos tarjetas de campaña (${tarjetas})`)
      await aVista(CAMPANA)
      await nav.sleep(600)
      const tras = await de(EVENTO_CAMPANA_VISIBLE)
      ok(tras.length === 2 && tras[1]?.d?.pagina === 'colabora', `al navegar a /colabora sin recargar, la vista nueva vuelve a contar: ${tras.length} en total, el 2.º de «colabora» (${JSON.stringify(tras.map((x) => x.d?.pagina))})`)
      await nav.evaluate(`(() => { const b = document.querySelectorAll(${JSON.stringify(CAMPANA)}); b[b.length - 1].scrollIntoView({ block: 'center', behavior: 'instant' }) })()`)
      await nav.sleep(600)
      ok((await de(EVENTO_CAMPANA_VISIBLE)).length === 2, 'y ver la SEGUNDA tarjeta de /colabora no cuenta otra vez (una vez por vista, no por tarjeta)')
    })
    await conScript(FUNDRAISER_FALLA, async () => {
      await nav.cargar('/gastos')
      await nav.sleep(800)
      const hay = (await nav.evaluate(`document.querySelectorAll(${JSON.stringify(CAMPANA)}).length`)) as number
      if (hay > 0) await aVista(CAMPANA)
      await nav.sleep(600)
      // con semilla en el build la tarjeta existe aunque la campaña no responda (una cifra horneada vale más que un bloque en blanco);
      // sin ella no hay tarjeta y, entonces, tampoco aviso: no se cuenta una tarjeta que nadie vio
      ok((await de(EVENTO_CAMPANA_VISIBLE)).length === (hay > 0 ? 1 : 0), `si la campaña no responde, «${EVENTO_CAMPANA_VISIBLE}» sale solo si la tarjeta existe (${hay} tarjeta/s, ${(await de(EVENTO_CAMPANA_VISIBLE)).length} aviso/s)`)
    })
    await conScript(FUNDRAISER_OK, async () => {
      // la home: la tarjeta grande (variante `card`) está abajo, en el bloque del dinero
      await nav.cargar('/')
      ok(await hasta('.gfm--card'), 'la home pinta la tarjeta grande de la campaña')
      await nav.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`)
      await nav.sleep(300)
      const abajo = await nav.evaluate(`document.querySelector('.gfm--card').getBoundingClientRect().top > innerHeight`)
      if (abajo) ok((await de(EVENTO_CAMPANA_VISIBLE)).length === 0, 'la tarjeta de la home está bajo el pliegue: sin verla no hay «Campana-visible»')
      await aVista('.gfm--card')
      await nav.sleep(600)
      const c = await de(EVENTO_CAMPANA_VISIBLE)
      ok(c.length === 1 && c[0]?.d?.pagina === 'index' && c[0]?.d?.conEuros === true, `home: al verla, UN «${EVENTO_CAMPANA_VISIBLE}» {pagina: index, conEuros: true} (${JSON.stringify(c.map((x) => x.d))})`)
    })

    // C9 · el script de Umami es `defer`: lo que se ve ANTES de que cargue no se pierde
    // «Sin cargar» = `window.umami` ausente Y que el script real (que la página sí pide) no pueda ocuparlo antes de tiempo.
    const UMAMI_AUSENTE = `(() => { const real = window.__umamiReal; Object.defineProperty(window, 'umami', { configurable: true, get() { return undefined }, set() {} }); window.__restaurarUmami = () => { Object.defineProperty(window, 'umami', { configurable: true, writable: true, value: real }) } })();`
    await conScript(FUNDRAISER_OK + UMAMI_AUSENTE, async () => {
      await nav.cargar('/gastos')
      ok(await hasta(CAMPANA), 'con el script de Umami sin cargar, /gastos pinta igualmente la tarjeta')
      await aVista(CAMPANA)
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

    // «Puerta» (las puertas de la home) lleva la entrada de la sesión (T2d): entró por /ciencia y eligió «Clínico o laboratorio» en la home
    await nav.cargar('/ciencia') // `cargar` parte de un almacenamiento vacío: la entrada de esta sesión es /ciencia
    await irA('/')
    await nav.sleep(900)
    await vaciar()
    await nav.evaluate(`document.querySelector('.puertas a[href="/datos#que-buscamos"]').click()`)
    await nav.sleep(150)
    const pu = (await de('Puerta'))[0]
    ok(pu?.d?.puerta === 'clinico' && pu?.d?.entrada === 'ciencia', `«Puerta» lleva entrada «ciencia» aunque la elija ya en la home, y conserva su puerta (${JSON.stringify(pu?.d)})`)
    ok((await de(EVENTO_PETICION))[0]?.d !== undefined && !('entrada' in ((await de(EVENTO_PETICION))[0]?.d ?? {})), 'y «VerPeticion», que sale del mismo clic, no la lleva')

    // C11 · Visor { herramienta, accion } (T2d): la primera vez que se toca un visor en la visita; /lesiones marca sus cuatro partes.
    // Este Chrome va sin GPU: los visores 3D caen a su imagen y no tienen lienzo, así que se pone uno en el contenedor para tocarlo
    // (con WebGL el lienzo ya está). El esqueleto de focos es SVG y está siempre.
    const toque = (parte: string, tipo: 'pointerdown' | 'keydown', init = '{}', objetivo = 'canvas') =>
      nav.evaluate(`(() => {
        const w = document.querySelector('[data-visor-accion="${parte}"]');
        let t = '${objetivo}' === 'canvas' ? w.querySelector('canvas') : w.querySelector('${objetivo}');
        if (!t && '${objetivo}' === 'canvas') { t = document.createElement('canvas'); w.appendChild(t) }
        const init = Object.assign({ bubbles: true, cancelable: true }, ${init});
        t.dispatchEvent('${tipo}' === 'pointerdown' ? new PointerEvent('pointerdown', Object.assign({ isPrimary: true, pointerType: 'mouse', button: 0 }, init)) : new KeyboardEvent('keydown', init));
      })()`)
    await nav.cargar('/lesiones') // (`cargar` parte de un almacenamiento vacío: es una sesión nueva)
    await vaciar()
    const visores = () => de(EVENTO_VISOR)
    ok((await nav.evaluate(`document.querySelectorAll('[data-visor="lesiones"]').length`)) === 4, '/lesiones lleva sus cuatro partes marcadas en el HTML')
    await nav.evaluate(`document.querySelector('[data-visor-accion="mama"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerType: 'mouse', button: 0 }))`)
    ok((await visores()).length === 0, 'un toque en el contenedor mismo (algo que no se puede tocar, como un párrafo) no cuenta')
    await toque('mama', 'pointerdown', '{ button: 2 }')
    ok((await visores()).length === 0, 'el botón derecho del ratón no cuenta')
    await toque('mama', 'keydown', "{ key: 'Tab' }", 'canvas')
    ok((await visores()).length === 0, 'tabular hasta el visor no cuenta')
    await toque('mama', 'pointerdown')
    const v0 = await visores()
    ok(v0.length === 1 && v0[0]?.d?.herramienta === 'lesiones' && v0[0]?.d?.accion === 'mama', `el primer toque (la mama): UN «${EVENTO_VISOR}» {herramienta: lesiones, accion: mama} (${JSON.stringify(v0.map((x) => x.d))})`)
    ok(v0[0]?.d !== undefined && !('entrada' in v0[0].d), '«Visor» no lleva entrada')
    await toque('higado', 'pointerdown')
    await nav.evaluate(`document.querySelector('[data-visor-accion="foco"] [role=option]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerType: 'mouse', button: 0 }))`)
    ok((await visores()).length === 1, 'tocar después el hígado o un foco, en la misma visita, no manda otro: UNA vez por visita')
    await nav.cargar('/lesiones', { conservar: true })
    await vaciar()
    await toque('higado', 'pointerdown')
    ok((await visores()).length === 0, 'recargar /lesiones en la misma sesión tampoco: la visita es la sesión, no la vista de página')
    await nav.cargar('/lesiones')
    await vaciar()
    await nav.evaluate(`document.querySelector('[data-visor-accion="foco"] [role=option]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
    const vf = await visores()
    ok(vf.length === 1 && vf[0]?.d?.accion === 'foco', `una sesión nueva vuelve a contar, y con el teclado (Intro en un foco del esqueleto): accion «foco» (${JSON.stringify(vf.map((x) => x.d))})`)
    await nav.cargar('/lesiones')
    await vaciar()
    await nav.evaluate(`document.querySelector('[data-visor-accion="hueso"]').appendChild(Object.assign(document.createElement('button'), { id: 'boton-hueso' }))`)
    await nav.evaluate(`document.getElementById('boton-hueso').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerType: 'touch' }))`)
    const vh = await visores()
    ok(vh.length === 1 && vh[0]?.d?.accion === 'hueso', `con el dedo y sobre un botón del visor del hueso: accion «hueso» (${JSON.stringify(vh.map((x) => x.d))})`)
    // otra página sin visor: nada
    await nav.cargar('/')
    await vaciar()
    await nav.evaluate(`document.body.appendChild(Object.assign(document.createElement('button'), { id: 'suelto' })); document.getElementById('suelto').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerType: 'mouse', button: 0 }))`)
    ok((await visores()).length === 0, 'fuera de un contenedor con data-visor no se manda nada')
    // sin almacenamiento: en memoria, también UNA vez
    await conScript(`Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('bloqueado', 'SecurityError') } });`, async () => {
      await nav.cargar('/lesiones')
      await vaciar()
      await toque('mama', 'pointerdown')
      await toque('higado', 'pointerdown')
      ok((await visores()).length === 1, `con sessionStorage bloqueado, «${EVENTO_VISOR}» llega y se queda en UNA vez (en memoria; ${(await visores()).length})`)
    })
    // con el script de Umami sin cargar: el aviso espera y llega cuando carga
    await conScript(UMAMI_AUSENTE, async () => {
      await nav.cargar('/lesiones')
      await vaciar()
      await toque('mama', 'pointerdown')
      await nav.sleep(500)
      ok((await nav.evaluate('typeof window.umami')) === 'undefined' && (await visores()).length === 0, 'con el script de Umami sin cargar todavía no sale nada...')
      await nav.evaluate(`window.__restaurarUmami()`)
      await nav.sleep(900)
      ok((await visores()).length === 1, `...y cuando carga, el aviso que esperaba llega UNA vez (${(await visores()).length})`)
    })
  } finally {
    await nav.cerrar()
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ eventos de Umami en verde')
process.exit(fallos ? 1 : 0)
