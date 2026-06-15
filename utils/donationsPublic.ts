import type { PublicDonation } from './fundraiser'

/** Respuesta pública endurecida de /donations.json (sin PII recuperable). */
export interface PublicDonationSafe {
  /** Identificador opaco estable (no es el ID de GoFundMe). */
  id: string
  name: string
  amount: number
  currencyCode: string
  /** Solo fecha (sin hora) para ordenar sin fingerprint temporal fino. */
  createdAt: string
}

const NAME_PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'los', 'y', 'e', 'i', 'da', 'das', 'do', 'dos', 'van', 'von', 'di', 'lo',
])

function titleCase(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase('es-ES')
    .replace(/(^|[\s\-'’.])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es-ES'))
}

/** Máscara reforzada: nombre de pila + iniciales de apellidos (sin apellidos completos). */
export function maskDonorDisplayName(fullName: string): string {
  const tokens = fullName.split(/\s+/).filter(Boolean)
  if (tokens.length <= 1) {
    const t = tokens[0] ?? ''
    return t.length > 1 ? `${t.charAt(0).toLocaleUpperCase('es-ES')}.` : t
  }
  const initials = tokens
    .slice(1)
    .filter((t) => !NAME_PARTICLES.has(t.toLocaleLowerCase('es-ES')))
    .map((t) => `${t.charAt(0).toLocaleUpperCase('es-ES')}.`)
  return initials.length ? `${tokens[0]} ${initials.join(' ')}` : tokens[0]
}

/** ID opaco derivado del ID de GoFundMe (estable, no reversible en cliente). */
export function opaqueDonationId(gofundmeId: number): string {
  let h = 0x811c9dc5
  const s = `hm-don-${gofundmeId}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `d_${(h >>> 0).toString(36)}`
}

function toDateOnly(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function sanitizeDonation(d: PublicDonation): PublicDonationSafe {
  const rawName = d.anonymous ? 'Anónimo' : titleCase(d.name || 'Anónimo')
  return {
    id: opaqueDonationId(d.id),
    name: d.anonymous ? 'Anónimo' : maskDonorDisplayName(rawName),
    amount: d.amount,
    currencyCode: d.currencyCode || 'EUR',
    createdAt: toDateOnly(d.createdAt),
  }
}

export function sanitizeDonations(list: PublicDonation[]): PublicDonationSafe[] {
  return list.map(sanitizeDonation)
}