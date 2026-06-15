import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { AI_EXPORT_BLOCKLIST } from '../utils/aiExportBlocklist'

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

const roots = ['dist', join('.output', 'public')]
let patched = 0

for (const root of roots) {
  const path = join(process.cwd(), root, 'llms.txt')
  if (!existsSync(path)) continue
  const content = readFileSync(path, 'utf-8')
  const filtered = filterLlmsTxt(content)
  if (filtered !== content) {
    writeFileSync(path, filtered)
    patched++
  }
}

if (patched > 0) {
  console.log(`✔ llms.txt: excluded ${AI_EXPORT_BLOCKLIST.length} clinical route(s) from AI index`)
}