// Medición de Umami del rediseño (F0, 23-oct-2026): los cuatro eventos nuevos que emite el plugin
// app/plugins/umami-delegado.client.ts, y que los de siempre siguen llamándose igual.
//
//   Clic-gofundme { pagina, origen }   VerPeticion { origen }
//   Contacto-clic { rol, pagina }      Scroll { pct, pagina }
//   (24-oct-2026, la tira de prensa de la home: «Prensa-visible», una vez por vista, y «Clic-prensa» por atributos data-umami-event)
//
// Tres niveles:
// A. La lógica pura de app/utils/umami.ts (qué enlace es qué evento, qué umbral de scroll toca).
// B. Que los nombres de evento que ya existían siguen en su sitio: renombrar uno parte su serie en
//    Umami, y ningún test lo vería.
// C. En Chrome, sobre el build ESTÁTICO (.output/public) y con un `window.umami` de mentira (el script
//    real solo envía desde helpmiriam.com): los clics y el scroll llegan de verdad al plugin.
//    Si no hay build (o con SIN_NAVEGADOR=1, para una pasada rápida), A y B corren igual y C se omite con un aviso.
//
// OJO: este test NO está en package.json ni en e2e.yml (F0 no podía tocar ninguno de los dos: los
// editan los PR abiertos de célula a célula). Se ejecuta a mano:
//   pnpm exec nuxt generate && pnpm exec tsx scripts/test-umami-eventos.ts
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

// ── B. los nombres de siempre no se han tocado ───────────────────────────────────────────────
console.log('\nB · los eventos que ya existían')
const soporte = readFileSync('app/composables/useSupport.ts', 'utf-8')
const contacto = readFileSync('app/pages/contacto.vue', 'utf-8')
// F5 (23-oct-2026): «PathwayCurioso» se fue de esta lista porque su única emisora, la tarjeta «Acabo de llegar» de las siete de la home,
// desapareció con ellas (la home pinta ahora cuatro puertas). Sigue «Pathway»: lo emiten los chips «por perfil» de /colabora hasta F10.
const ANTIGUOS = ['Donar', 'VerCiencia', 'Clic-prensa', 'Contacto', 'Pathway', 'VerMapa', 'VerLesiones', 'VerDatos', 'VerCelula', 'VerExplorador', 'VerLaminillas', 'VerUltimo', 'Navegar', 'Error404', 'Compartir', 'Bio-link', 'VerVideo']
for (const nombre of ANTIGUOS) ok(soporte.includes(`trackUmami('${nombre}'`), `useSupport.ts sigue emitiendo «${nombre}»`)
ok(/trackUmami\('Contacto-enviado',\s*\{\s*rol:/.test(contacto), 'contacto.vue sigue emitiendo «Contacto-enviado» con su rol')
const NUEVOS = [EVENTO_GOFUNDME, EVENTO_PETICION, EVENTO_CONTACTO_CLIC, EVENTO_SCROLL]
ok(NUEVOS.every((n) => ![...ANTIGUOS, 'Contacto-enviado'].includes(n)), `los cuatro nombres nuevos (${NUEVOS.join(', ')}) no pisan ninguno de los de siempre`)
ok(/recordarApoyo\(location\)/.test(soporte), 'trackSupport deja la etiqueta de origen para «Clic-gofundme»')
// F5: las cuatro puertas de la home miden «Puerta» con la puerta como propiedad (sustituye a «Pathway»/«PathwayCurioso» de las siete tarjetas)
ok(/trackUmami\('Puerta',\s*\{\s*puerta:/.test(soporte), 'useSupport.ts emite «Puerta» con la puerta como propiedad')
ok(![...ANTIGUOS, 'Contacto-enviado', EVENTO_GOFUNDME, EVENTO_PETICION, EVENTO_CONTACTO_CLIC, EVENTO_SCROLL].includes('Puerta'), 'el nombre «Puerta» no pisa ninguno de los demás')
ok(!soporte.includes("trackUmami('PathwayCurioso'"), '«PathwayCurioso» ya no se emite: su tarjeta se fue de la home (F5)')
// y la medición no se duplica: VerPeticion, Contacto-clic y Clic-gofundme los emite el plugin por el href; la home no los llama a mano
const homeVue = readFileSync('app/pages/index.vue', 'utf-8') + readFileSync('app/components/SectionHero.vue', 'utf-8') + readFileSync('app/components/Puertas.vue', 'utf-8')
ok(!/trackUmami\('(VerPeticion|Contacto-clic|Clic-gofundme)'/.test(homeVue) && !/track(Peticion|ContactoClic)/.test(homeVue), 'la home no llama a mano a VerPeticion / Contacto-clic / Clic-gofundme (los emite el plugin: contarían doble)')
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
      source: `window.__umami = []; window.umami = { track: (e, d) => window.__umami.push({ e, d }) };
        window.addEventListener('click', (ev) => { if (ev.target && ev.target.closest && ev.target.closest('a')) ev.preventDefault() }, true);`,
    })
    type Ev = { e: string; d?: Record<string, unknown> }
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
    ok((await de('Prensa-visible')).length === 1, `al ver la tira de prensa manda UN «Prensa-visible» (${(await de('Prensa-visible')).length})`)
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
  } finally {
    await nav.cerrar()
  }
}

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ eventos de Umami en verde')
process.exit(fallos ? 1 : 0)
