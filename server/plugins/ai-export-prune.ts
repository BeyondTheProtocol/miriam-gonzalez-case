import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  AI_EXPORT_BLOCKLIST,
  isAiExportBlocked,
  normalizeAiRoute,
} from '../../utils/aiExportBlocklist'

function filterLlmsTxt(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed.startsWith('- ')) return true
      return !AI_EXPORT_BLOCKLIST.some(
        (blocked) =>
          trimmed.includes(`](${blocked})`) ||
          trimmed.includes(`](${blocked}/`) ||
          trimmed.includes(` ${blocked}:`)
      )
    })
    .join('\n')
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response, { event }) => {
    if (event?.path !== '/llms.txt') return
    const body = response.body
    if (typeof body === 'string') {
      response.body = filterLlmsTxt(body)
    }
  })

  // Bloquea la indexación markdown en build (antes de que nuxt-ai-ready procese el .md).
  nitroApp.hooks.hook('prerender:generate', async (route) => {
    if (route.fileName?.endsWith('.md')) {
      let pageRoute = route.route.replace(/\.md$/, '')
      if (pageRoute === '/index') pageRoute = '/'
      if (isAiExportBlocked(normalizeAiRoute(pageRoute))) {
        route.error = new Error('AI export blocked for clinical route')
      }
    }

  })

  async function patchLlmsTxtFile() {
    const candidates = [
      nitroApp.options?.output?.publicDir,
      join(process.cwd(), '.output/public'),
      join(process.cwd(), 'dist'),
    ].filter(Boolean) as string[]

    for (const dir of candidates) {
      const llmsPath = join(dir, 'llms.txt')
      try {
        const content = await readFile(llmsPath, 'utf-8')
        const filtered = filterLlmsTxt(content)
        if (filtered !== content) await writeFile(llmsPath, filtered)
        return
      } catch {
        /* probar siguiente ruta */
      }
    }
  }

  // Tras ai-ready (prerender:done) y de nuevo al cerrar nitro por si el orden varía.
  nitroApp.hooks.hook('prerender:done', patchLlmsTxtFile)
  nitroApp.hooks.hook('close', patchLlmsTxtFile)
})