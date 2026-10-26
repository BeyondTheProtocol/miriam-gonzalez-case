// Test del aviso «Campaña oficial» (23-oct-2026).
//
// Lo que no puede romperse sin que nadie lo note:
// 1. Las tres instancias siguen montadas (pie, home, /gastos).
// 2. El enlace del aviso apunta a la URL larga de la campaña y lo visible es
//    ese mismo slug (que se pueda comprobar a ojo).
// 3. El aviso no se hace pasar por un CTA de donar: ni data-support-cta (la
//    barra móvil se esconde con él) ni trackSupport (armaría el «¿Has donado?»).
// 4. ES y EN tienen las mismas claves y el texto no dice nada que legal vetó:
//    «única/only», importes, «estafa/fraude/scam», ni cripto/tokens. Una frase
//    de cripto no puede ir «apagada» en las locales: el fichero de idioma viaja
//    entero en el bundle público, se pinte o no.
//
// Uso:  pnpm test:campana-oficial
import { readFileSync } from 'node:fs'

let fallos = 0
const ok = (cond: boolean, msg: string) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fallos++ }

const comp = readFileSync('app/components/CampanaOficial.vue', 'utf-8')
const support = readFileSync('app/composables/useSupport.ts', 'utf-8')

// 1
ok(/<CampanaOficial\s+footer\b/.test(readFileSync('app/components/SiteFooter.vue', 'utf-8')), 'el pie monta el aviso (footer)')
ok(/<CampanaOficial\b/.test(readFileSync('app/pages/index.vue', 'utf-8')), 'la home monta el aviso')
ok(/<CampanaOficial\b/.test(readFileSync('app/pages/gastos.vue', 'utf-8')), '/gastos monta el aviso')
// el pie se calla donde la página ya lo pinta (la home y /gastos), por nombre de ruta: vale igual en /gastos y en /en/expenses
ok(/\['index', 'gastos'\]\.includes\(routeBaseName\(route\)/.test(comp) && /v-if="!\(footer && yaLoPinta\)"/.test(comp), 'el aviso del pie se calla en la home y en /gastos (por nombre de ruta)')

// 2
const canonica = support.match(/GOFUNDME_CANONICAL_URL\s*=\s*'([^']+)'/)?.[1] ?? ''
ok(/^https:\/\/www\.gofundme\.com\/f\/[a-z0-9-]+$/.test(canonica), `URL larga con forma de campaña (${canonica || 'no encontrada'})`)
ok(comp.includes(':href="GOFUNDME_CANONICAL_URL"'), 'el enlace del aviso usa la URL larga, no el corto')
ok(/replace\(\/\^https:\\\/\\\/www\\\.\/, ''\)/.test(comp), 'lo visible es el mismo slug sin esquema')

// 3 — solo la plantilla y el código: el comentario del componente los nombra para explicar por qué no
const plantilla = comp.match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
const codigo = (comp.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
ok(plantilla.length > 0, 'se lee la plantilla del componente')
ok(!plantilla.includes('data-support-cta'), 'el aviso no lleva data-support-cta')
ok(!/trackSupport/.test(plantilla + codigo), 'el aviso no llama a trackSupport')

// 4
const es = JSON.parse(readFileSync('i18n/locales/es.json', 'utf-8')).campanaOficial ?? {}
const en = JSON.parse(readFileSync('i18n/locales/en.json', 'utf-8')).campanaOficial ?? {}
const claves = ['titulo', 'intro', 'otras', 'actualizado']
for (const k of claves) ok(Boolean(es[k]) && Boolean(en[k]), `campanaOficial.${k} existe en ES y EN`)
ok(Object.keys(es).length === claves.length && Object.keys(en).length === claves.length, 'no hay claves de más (nada «apagado» que viaje en el bundle)')
const texto = JSON.stringify([es, en]).toLowerCase()
for (const vetada of ['única', 'unica', '"only', ' only ', 'estafa', 'fraude', 'scam', 'fraud', 'pump', 'token', 'cripto', 'crypto', '€', '$'])
  ok(!texto.includes(vetada), `el aviso no dice «${vetada.trim()}»`)

console.log(fallos ? `\n❌ ${fallos} fallo(s)` : '\n✅ aviso «Campaña oficial» en orden')
process.exit(fallos ? 1 : 0)
