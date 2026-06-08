import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Lee el JSON «semilla» generado en build (`public/<file>`) e incluido en el
 * bundle de las funciones vía `included_files` (netlify.toml). Es el fallback
 * cuando GoFundMe no responde: así el total y las estrellas nunca se quedan en
 * blanco. Best-effort: prueba varias rutas y devuelve null si no encuentra nada.
 */
export async function readSeed<T>(file: string): Promise<T | null> {
  const candidates = [
    path.resolve(process.cwd(), 'public', file),
    path.resolve(process.cwd(), file),
  ]
  for (const p of candidates) {
    try {
      return JSON.parse(await fs.readFile(p, 'utf8')) as T
    } catch {
      /* siguiente candidato */
    }
  }
  return null
}
