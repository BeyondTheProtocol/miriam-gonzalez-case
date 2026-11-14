// La semilla de la recaudación no tumba el build cuando GoFundMe falla (14-nov-2026).
//
// Desde el 11-nov GoFundMe contesta sin `data.fundraiser`. Con semilla en disco el build seguía (la conserva);
// sin ella (deploy previews de Netlify, sin caché) `update-fundraiser` reventaba con un TypeError mudo.
// Esto fija, con `fetch` simulado y SIN red:
//   1. GoFundMe sin campaña + sin semilla → semilla = copia publicada, `origen: semilla`, con SU fecha.
//   2. El error de GoFundMe dice qué pasó (no un TypeError).
//   3. Semilla en disco + GoFundMe caído → se conserva y ni se pide la copia.
//   4. Copia publicada sin cifras → no vale como semilla.
//   5. Todo caído en una preview → se construye sin semilla; en producción → el build para.
//   6. GoFundMe bien → la semilla es la cifra de GoFundMe (lo de siempre).
//
// Uso:  pnpm test:fundraiser-respaldo
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveFundraiser, getFundraiser, COPIA_PUBLICADA } from '../utils/fundraiser'

let fallos = 0
const check = (ok: boolean, desc: string) => {
  console.log(`  ${ok ? '✅' : '❌'} ${desc}`)
  if (!ok) fallos++
}

const CIFRA = { currentAmount: { amount: 1234, currencyCode: 'EUR' }, donationCount: 56, donationsEnabled: true }
const COPIA = { ...CIFRA, origen: 'vivo', actualizado: '2026-11-11T09:21:00.026Z' }
type Resp = { status?: number; body: unknown } | 'red'
const pedidas: string[] = []

function simular(gofundme: Resp, copia: Resp) {
  pedidas.length = 0
  globalThis.fetch = (async (url: string | URL) => {
    const u = String(url)
    pedidas.push(u)
    const r = u === COPIA_PUBLICADA ? copia : gofundme
    if (r === 'red') throw new TypeError('fetch failed')
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
  }) as typeof fetch
}

const original = process.cwd()
const silencio = console.warn
async function enCarpeta(fn: () => Promise<void>, semillaPrevia?: unknown) {
  const dir = mkdtempSync(join(tmpdir(), 'fundraiser-'))
  process.chdir(dir)
  if (semillaPrevia) {
    mkdirSync('seed')
    writeFileSync('seed/fundraiser.json', JSON.stringify(semillaPrevia))
  }
  console.warn = () => {}
  try {
    await fn()
  } finally {
    console.warn = silencio
    process.chdir(original)
    rmSync(dir, { recursive: true, force: true })
  }
}
const semilla = () => (existsSync('seed/fundraiser.json') ? JSON.parse(readFileSync('seed/fundraiser.json', 'utf8')) : null)
const SIN_CAMPANA = { body: { data: null, errors: [{ message: 'Fundraiser not found' }] } }

console.log('1 · GoFundMe sin campaña y sin semilla → copia publicada')
await enCarpeta(async () => {
  simular(SIN_CAMPANA, { body: COPIA })
  await saveFundraiser(false)
  const s = semilla()
  check(s?.donationCount === 56 && s?.currentAmount?.amount === 1234, 'la semilla trae las cifras de la copia publicada')
  check(s?.origen === 'semilla', 'sale como «semilla», no como «vivo»')
  check(s?.actualizado === COPIA.actualizado, 'conserva la fecha de la copia, no la de hoy')
})

console.log('2 · el error de GoFundMe se explica')
simular(SIN_CAMPANA, 'red')
const err = await getFundraiser().then(() => null, (e: Error) => e)
check(!!err && !(err instanceof TypeError) && /Fundraiser not found/.test(err.message), `error legible: ${err?.message}`)

console.log('3 · semilla en disco y GoFundMe caído → se conserva')
await enCarpeta(async () => {
  simular('red', { body: COPIA })
  await saveFundraiser(true)
  check(semilla()?.donationCount === 7, 'la semilla previa sigue intacta')
  check(!pedidas.includes(COPIA_PUBLICADA), 'no se pide la copia publicada')
}, { ...CIFRA, donationCount: 7 })

console.log('4 · copia publicada sin cifras → no vale')
await enCarpeta(async () => {
  simular(SIN_CAMPANA, { body: { origen: 'semilla' } })
  delete process.env.CONTEXT
  await saveFundraiser(false)
  check(semilla() === null, 'no se escribe una semilla sin cifras')
})

console.log('5 · todo caído')
await enCarpeta(async () => {
  simular('red', { status: 502, body: 'fundraiser unavailable' })
  process.env.CONTEXT = 'deploy-preview'
  const r = await saveFundraiser(false).then(() => 'sigue', () => 'para')
  check(r === 'sigue' && semilla() === null, 'en una preview el build sigue, sin semilla')
  process.env.CONTEXT = 'production'
  const p = await saveFundraiser(false).then(() => 'sigue', () => 'para')
  check(p === 'para', 'en producción el build para (queda publicado el deploy anterior)')
  delete process.env.CONTEXT
})

console.log('6 · GoFundMe bien → su cifra')
await enCarpeta(async () => {
  simular({ body: { data: { fundraiser: { ...CIFRA, donationCount: 99 } } } }, { body: COPIA })
  await saveFundraiser(false)
  check(semilla()?.donationCount === 99 && !pedidas.includes(COPIA_PUBLICADA), 'la semilla es la de GoFundMe y no se toca la copia')
})

if (fallos) {
  console.log(`\n${fallos} FALLO(S)`)
  process.exit(1)
}
console.log('\nOK test-fundraiser-respaldo')
