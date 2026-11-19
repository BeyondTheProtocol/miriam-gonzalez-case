import fs from 'node:fs/promises'

export interface GoFundMeAmount {
  amount: number
  currencyCode: string
}

export interface GoFundMeFundraiser {
  currentAmount: GoFundMeAmount
  // Sin `goalAmount` a propósito (decisión de Miriam, 24-oct-2026: ni objetivo, ni porcentaje, ni barra). Ya no se pide a GoFundMe:
  // una cifra que no se pide no puede acabar en el HTML, en el payload ni en /fundraiser.json por descuido.
  donationCount: number
  donationsEnabled: boolean
  /**
   * De dónde sale la cifra y cuándo se trajo. Lo ponemos nosotros, no GoFundMe:
   * · `vivo`: la función de Netlify la acaba de pedir a GoFundMe (la CDN la guarda hasta ~15 min).
   * · `semilla`: la del build (`seed/fundraiser.json`) o, si GoFundMe no responde, la copia de seguridad de la función.
   * La web enseña la fecha cuando es `semilla`: una cifra horneada no puede pasar por una cifra de hoy.
   */
  actualizado?: string
  origen?: 'vivo' | 'semilla'
}

// Semilla FUERA de public/: si viviera en public/ se publicaría como
// dist/fundraiser.json y SOMBREARÍA el routeRule que enruta /fundraiser.json a
// la función viva (misma trampa que los enlaces cortos, ver nuxt.config.ts).
const path = 'seed/fundraiser.json'
// Desde el 11-nov-2026 la API GraphQL de GoFundMe solo acepta consultas de su lista blanca («persisted query safelist») y
// nuestra consulta no está. La página pública de la campaña sí trae la cifra: va en el estado de Apollo que Next.js incrusta en
// `__NEXT_DATA__` (comprobado el 19-nov-2026: mismas cifras que la página). Se lee de ahí.
const slug = 'biopsia-molecular-que-puede-cambiar-su-tratamiento'
export const PAGINA_CAMPANA = `https://www.gofundme.com/f/${slug}`

const headers = {
  Accept: 'text/html',
  'Accept-Language': 'es-ES,es;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
}

/** Saca la campaña del HTML de su página pública. Lanza un error que dice qué faltó, nunca un TypeError mudo. */
export function leerCampana(html: string): GoFundMeFundraiser {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) throw new Error('GoFundMe no devolvió la campaña: la página no trae __NEXT_DATA__')
  let estado: Record<string, unknown> | undefined
  try {
    estado = JSON.parse(m[1]!)?.props?.pageProps?.__APOLLO_STATE__
  } catch {
    throw new Error('GoFundMe no devolvió la campaña: __NEXT_DATA__ no es JSON')
  }
  const campana = Object.values(estado ?? {}).find(
    (o) => (o as { __typename?: string; slug?: string })?.__typename === 'Fundraiser' && (o as { slug?: string }).slug === slug
  ) as Partial<GoFundMeFundraiser> | undefined
  if (!campana || typeof campana.donationCount !== 'number' || typeof campana.currentAmount?.amount !== 'number') {
    throw new Error('GoFundMe no devolvió la campaña: la página no trae sus cifras')
  }
  return {
    currentAmount: { amount: campana.currentAmount.amount, currencyCode: campana.currentAmount.currencyCode },
    donationCount: campana.donationCount,
    donationsEnabled: campana.donationsEnabled !== false,
  }
}

/** Marca de dónde y cuándo se trajo la cifra (ver `GoFundMeFundraiser.origen`). */
export const estampar = (
  fundraiser: GoFundMeFundraiser,
  origen: 'vivo' | 'semilla',
  actualizado: string = new Date().toISOString()
): GoFundMeFundraiser => ({ ...fundraiser, origen, actualizado })

export const getFundraiser = async (): Promise<GoFundMeFundraiser> => {
  const res = await fetch(PAGINA_CAMPANA, { headers, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`GoFundMe no devolvió la campaña: la página respondió ${res.status}`)
  return leerCampana(await res.text())
}

/**
 * La última cifra que sirve la web publicada (la función viva o, si GoFundMe falla, su semilla). Es el respaldo del
 * build cuando GoFundMe no responde y no hay semilla en disco (14-nov-2026: los deploy previews de Netlify no tienen
 * caché y caían todos). Conserva su `actualizado` y sale como `semilla`: la web enseña su fecha y no la hace pasar por
 * una cifra de hoy.
 */
export const COPIA_PUBLICADA = 'https://helpmiriam.com/fundraiser.json'

export async function getCopiaPublicada(): Promise<GoFundMeFundraiser> {
  const res = await fetch(COPIA_PUBLICADA, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`la copia publicada respondió ${res.status}`)
  const copia = (await res.json()) as GoFundMeFundraiser
  if (!copia || typeof copia.donationCount !== 'number' || typeof copia.currentAmount?.amount !== 'number') {
    throw new Error('la copia publicada no trae cifras')
  }
  return { ...copia, origen: 'semilla' }
}

async function fileExists(path: string) {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

export async function saveFundraiser(overwrite = false) {
  const exists = await fileExists(path)
  if (exists) {
    if (overwrite) {
      console.log('Updating fundraiser...')
    } else {
      console.log(`Fundraiser file already exists: ${path}.`)
      return
    }
  }
  try {
    const fundraiser = estampar(await getFundraiser(), 'semilla')
    await fs.mkdir('seed', { recursive: true })
    await fs.writeFile(path, JSON.stringify(fundraiser))
    console.log(`✔ Fundraiser saved to: ${path}`)
  } catch (error) {
    // Si GoFundMe no responde (p. ej. ECONNRESET por su anti-bot), no bloqueamos
    // el build/dev: conservamos el fundraiser.json existente —igual que hace
    // saveDonations—. Solo fallamos si no hay datos previos a los que recurrir.
    if (exists) {
      console.warn(`Fundraiser fetch failed; keeping existing file (${path}).`, error)
      return
    }
    // Sin semilla en disco (deploy preview, checkout limpio): la última cifra de la web publicada.
    try {
      const copia = await getCopiaPublicada()
      await fs.mkdir('seed', { recursive: true })
      await fs.writeFile(path, JSON.stringify(copia))
      console.warn(`GoFundMe no respondió; semilla tomada de ${COPIA_PUBLICADA} (cifra del ${copia.actualizado ?? '¿?'}).`, error)
      return
    } catch (errorCopia) {
      // En producción, mejor parar: Netlify deja publicado el deploy anterior, con su cifra. En una preview o en local,
      // se sigue sin semilla: el HTML sale sin la tarjeta (useFundraiser ya lo contempla).
      if (process.env.CONTEXT === 'production') throw error
      console.warn('Sin GoFundMe ni copia publicada: se construye sin semilla (la tarjeta no sale).', error, errorCopia)
    }
  }
}

// ── Donaciones públicas (muro de gracias · paridad con GoFundMe) ─────────────
// El feed público de GoFundMe ya muestra nombre + importe + anónimo + fecha.
// Re-publicamos lo mismo. OPT_OUT: nombres (no anónimos) a excluir si alguien
// pide quitarse (red de seguridad RGPD). Los anónimos salen como "Anónimo".
const donationsPath = 'seed/donations.json'
const donationsFeed = `https://gateway.gofundme.com/web-gateway/v1/feed/${slug}/donations`
const OPT_OUT: string[] = []

export interface PublicDonation {
  id: number
  name: string
  amount: number
  currencyCode: string
  createdAt: string
  anonymous: boolean
}

// Normaliza nombres a Título (GoFundMe los devuelve en MAYÚS/minús irregular).
// Unicode-aware (respeta acentos). Primera letra de cada palabra en mayúscula.
function titleCase(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('es-ES')
    .replace(/(^|[\s\-'’.])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es-ES'))
}

// Partículas que no cuentan como apellido al sacar iniciales (de la Cruz → C.).
const NAME_PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'i', 'da', 'das', 'do', 'dos', 'van', 'von', 'di', 'lo',
])

// Privacidad del muro: deja el nombre de pila y abrevia cada apellido a su
// inicial. "María González Pérez" → "María G. P."; "Juan Pérez" → "Juan P.";
// un solo token (o un nombre sin apellido) se deja igual. Las partículas no
// generan inicial. Los anónimos no pasan por aquí.
function maskSurnames(fullName: string): string {
  const tokens = fullName.split(/\s+/).filter(Boolean)
  if (tokens.length <= 1) return fullName
  const initials = tokens
    .slice(1)
    .filter((t) => !NAME_PARTICLES.has(t.toLocaleLowerCase('es-ES')))
    .map((t) => `${t.charAt(0).toLocaleUpperCase('es-ES')}.`)
  return initials.length ? `${tokens[0]} ${initials.join(' ')}` : tokens[0]
}

// Una página del feed (por offset) → donaciones normalizadas. Devuelve [] si la
// página falla (timeout / !ok), para no romper el barrido completo.
async function fetchDonationsPage(offset: number, limit = 20): Promise<PublicDonation[]> {
  try {
    const res = await fetch(`${donationsFeed}?limit=${limit}&sort=recent&offset=${offset}`, {
      headers: { 'User-Agent': headers['User-Agent'] },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      references?: { donations?: Array<Record<string, unknown>> }
    }
    const list = json.references?.donations ?? []
    const out: PublicDonation[] = []
    for (const d of list) {
      const anonymous = Boolean(d.is_anonymous)
      const fullName = titleCase(String(d.name || 'Anónimo')) || 'Anónimo'
      if (!anonymous && OPT_OUT.includes(fullName)) continue
      const name = anonymous ? 'Anónimo' : maskSurnames(fullName)
      out.push({
        id: Number(d.donation_id),
        name,
        amount: Number(d.amount),
        currencyCode: String(d.currencycode || 'EUR'),
        createdAt: String(d.created_at),
        anonymous,
      })
    }
    return out
  } catch {
    return []
  }
}

// Barrido SECUENCIAL (para el build/semilla). El feed no manda un has_next
// fiable (viene null), así que paramos al llegar una página incompleta o vacía.
export async function getDonations(maxItems = 1500): Promise<PublicDonation[]> {
  const out: PublicDonation[] = []
  const limit = 20
  for (let offset = 0, guard = 0; guard < 120 && out.length < maxItems; guard++, offset += limit) {
    const list = await fetchDonationsPage(offset, limit)
    if (list.length === 0) break
    out.push(...list)
    if (list.length < limit) break
  }
  return out
}

// Barrido en PARALELO acotado por el total de donaciones (lo da el fundraiser),
// para el endpoint EN VIVO, donde el tiempo de respuesta importa: lanza las
// páginas en oleadas de baja concurrencia, deduplica por id y ordena por fecha.
// Sin total conocido, cae al barrido secuencial.
export async function getDonationsFast(total?: number, maxItems = 1500): Promise<PublicDonation[]> {
  const limit = 20
  if (!total || total <= 0) return getDonations(maxItems)
  const pages = Math.min(Math.ceil(total / limit), Math.ceil(maxItems / limit), 120)
  const offsets = Array.from({ length: pages }, (_, i) => i * limit)
  const concurrency = 6
  const all: PublicDonation[] = []
  for (let i = 0; i < offsets.length; i += concurrency) {
    const wave = offsets.slice(i, i + concurrency)
    const lists = await Promise.all(wave.map((o) => fetchDonationsPage(o, limit)))
    for (const l of lists) all.push(...l)
  }
  const seen = new Set<number>()
  const dedup: PublicDonation[] = []
  for (const d of all) {
    if (seen.has(d.id)) continue
    seen.add(d.id)
    dedup.push(d)
  }
  dedup.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  return dedup.slice(0, maxItems)
}

export async function saveDonations() {
  try {
    const donations = await getDonations()
    if (donations.length === 0) {
      console.log('No donations fetched; keeping existing file.')
      return
    }
    await fs.mkdir('seed', { recursive: true })
    await fs.writeFile(donationsPath, JSON.stringify(donations))
    console.log(`✔ Donations saved (${donations.length}) to: ${donationsPath}`)
  } catch (error) {
    // No bloquear el build/dev ni sobrescribir con vacío si el feed falla.
    console.warn('Donations fetch failed; keeping existing file.', error)
  }
}
