/**
 * #mapa-focos — los datos del mapa de metástasis, leídos del PROPIO mapa en cada build.
 *
 * Fuente única: app/pages/mapa-metastasis.vue (la página publicada, que no se toca).
 * /panorama importa de '#mapa-focos' y este módulo saca del <script setup> del mapa las
 * declaraciones que necesita, tal cual, y las exporta. No hay copia guardada: si cambia un
 * foco en el mapa, el panorama lo recoge en el siguiente build (y en dev, al guardar).
 *
 * Fail-closed: si el mapa deja de declarar alguno de estos nombres, el build se para con
 * un error que dice cuál. Mejor un build roto que un panorama con datos viejos.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineNuxtModule, addTemplate, updateTemplates } from 'nuxt/kit'
import { parse, babelParse } from 'vue/compiler-sfc'

/* nombre en el mapa → cómo se exporta. 'tal-cual' copia la declaración con `export`;
   las de computed() del dibujo del esqueleto se evalúan una vez (en el panorama no cambian). */
const COPIAR = ['TRACER', 'GA_FILL', 'FDG_FILL', 'Pheno', 'PHENO', 'PHENO_RAMP_CSS', 'Lesion', 'LES',
  'LesGroup', 'vertLevelKey', 'groupKey', 'GROUPS', 'SK_R', 'SK_HIT', 'BONE3D_KEY'] as const
const COMPUTED = { vertebrae: 'SK_VERTEBRAS', ribs: 'SK_COSTILLAS' } as const
const RENOMBRAR = { ticks: 'SK_TICKS' } as const

const MAPA = 'app/pages/mapa-metastasis.vue'

/* eslint-disable @typescript-eslint/no-explicit-any */
function nombres(n: any): string[] {
  if (n.type === 'VariableDeclaration') return n.declarations.map((d: any) => d.id?.name).filter(Boolean)
  if (['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'FunctionDeclaration'].includes(n.type)) return [n.id?.name]
  return []
}

export function extraeFocos(vueSrc: string): string {
  const { descriptor } = parse(vueSrc)
  const js = descriptor.scriptSetup?.content
  if (!js) throw new Error(`[mapa-focos] ${MAPA} no tiene <script setup>`)
  const ast: any = babelParse(js, { sourceType: 'module', plugins: ['typescript'] })
  const trozo = (n: any) => js.slice(n.start, n.end)
  const fuera: string[] = []
  const vistos = new Set<string>()
  for (const n of ast.program.body) {
    const ns = nombres(n)
    const k = ns.find((x) => (COPIAR as readonly string[]).includes(x) || x in COMPUTED || x in RENOMBRAR)
    if (!k) continue
    vistos.add(k)
    if ((COPIAR as readonly string[]).includes(k)) { fuera.push('export ' + trozo(n)); continue }
    const d = n.declarations[0]
    if (k in COMPUTED) {
      const arg = d.init?.type === 'CallExpression' && d.init.callee?.name === 'computed' ? d.init.arguments[0] : null
      if (!arg) throw new Error(`[mapa-focos] ${MAPA}: «${k}» ya no es computed(() => …)`)
      fuera.push(`export const ${COMPUTED[k as keyof typeof COMPUTED]} = (${trozo(arg)})()`)
    } else {
      fuera.push(`export const ${RENOMBRAR[k as keyof typeof RENOMBRAR]} = ${trozo(d.init)}`)
    }
  }
  const faltan = [...COPIAR, ...Object.keys(COMPUTED), ...Object.keys(RENOMBRAR)].filter((x) => !vistos.has(x))
  if (faltan.length) throw new Error(`[mapa-focos] ${MAPA} ya no declara: ${faltan.join(', ')}. Ajusta modules/mapa-focos.ts.`)
  return `// GENERADO desde ${MAPA} por modules/mapa-focos.ts. No editar: se rehace en cada build.\n`
    + fuera.join('\n\n') + '\n'
}

export default defineNuxtModule({
  meta: { name: 'mapa-focos' },
  setup(_opts, nuxt) {
    const ruta = resolve(nuxt.options.rootDir, MAPA)
    const tpl = addTemplate({
      filename: 'mapa-focos.ts',
      write: true,
      getContents: () => extraeFocos(readFileSync(ruta, 'utf-8')),
    })
    nuxt.options.alias['#mapa-focos'] = tpl.dst
    nuxt.hook('builder:watch', async (_evt, p) => {
      if (resolve(nuxt.options.rootDir, p) === ruta || p.endsWith('mapa-metastasis.vue'))
        await updateTemplates({ filter: (t) => t.filename === 'mapa-focos.ts' })
    })
  },
})
