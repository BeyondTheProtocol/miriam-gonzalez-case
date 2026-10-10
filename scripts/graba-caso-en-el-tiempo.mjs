#!/usr/bin/env node
// Graba «El caso en el tiempo» (/datos?peli=1) a MP4, fotograma a fotograma, desde el build estático.
//
// Por qué así y no con un generador de vídeo: el 25-sep-2026 un vídeo generado a partir de capturas
// de /datos alteró cifras en 3 de 6 clips. Aquí no se genera nada: cada fotograma es una captura
// del DOM real con el cabezal en un día exacto (`window.__peli.seek`), y ANTES de capturarlo se
// coteja contra app/data/caso.json que cada serie enseña el valor y la fecha de su último análisis
// real. Si un solo fotograma no cuadra, no hay vídeo.
//
// El ritmo es el de la página: 24 s de recorrido y la misma pausa (0,9 s) al empezar cada etapa.
//
// Uso:  pnpm exec nuxt generate && node scripts/graba-caso-en-el-tiempo.mjs salida.mp4 [vertical|horizontal] [es|en]
// Necesita ffmpeg en el PATH. El MP4 es un BORRADOR: publicarlo lo decide Miriam.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador } from './lib/navegador-cdp.mjs'

const [salida, formato = 'vertical', lg = 'es'] = process.argv.slice(2)
if (!salida) { console.error('Uso: node scripts/graba-caso-en-el-tiempo.mjs salida.mp4 [vertical|horizontal] [es|en]'); process.exit(2) }
// lienzo en px de CSS y su escala: sale 1080×1920 o 1920×1080. El vertical es estrecho a propósito,
// para que los gráficos llenen el encuadre como en un móvil.
const [ancho, alto, escala, salW, salH] = formato === 'horizontal' ? [1422, 800, 1.35, 1920, 1080] : [450, 800, 2.4, 1080, 1920]
const FPS = 30
const RECORRIDO = 24, PAUSA = 0.9, INICIO = 1.2, FINAL = 3 // segundos

const caso = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'app', 'data', 'caso.json'), 'utf8'))
const DIA = 86400000
const ms = (iso) => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d) }
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const HOY = String(caso.generado).slice(0, 10)
const DESDE = Date.UTC(2023, 9, 1)
const analito = (k) => { for (const g of Object.values(caso.analiticas.grupos)) { const a = g.analitos.find((x) => x.key === k); if (a) return a } return null }
const SERIES = [['ca153', 'lsn'], ['got', 'lsn'], ['hemoglobina', 'real']]
const esperado = (k, modo, t) => analito(k).puntos.filter((p) => ms(p.f) >= DESDE && ms(p.f) <= t && (modo === 'real' || (p.hi && p.hi > 0))).pop() ?? null
const num = (v) => (lg === 'es' ? String(v).replace('.', ',') : String(v))

// etapas: las mismas que calcula la página (diagnóstico y líneas sistémicas con día exacto ya empezadas)
const etapas = [ms(caso.ficha.fecha_diagnostico.valor.es ?? caso.ficha.fecha_diagnostico.valor)]
for (const l of caso.lineas) if (/^\d+L$/i.test(l.id) && /^\d{4}-\d{2}-\d{2}$/.test(l.inicio) && ms(l.inicio) <= ms(HOY)) etapas.push(ms(l.inicio))
etapas.sort((a, b) => a - b)

// guion: un día por fotograma
const dias = []
const repetir = (t, s) => { for (let i = 0; i < Math.round(s * FPS); i++) dias.push(t) }
repetir(DESDE, INICIO)
const total = RECORRIDO * FPS
let pendientes = [...etapas]
for (let i = 1; i <= total; i++) {
  const t = Math.round((DESDE + ((ms(HOY) - DESDE) * i) / total) / DIA) * DIA
  while (pendientes.length && pendientes[0] <= t) { const e = pendientes.shift(); if (e < t) dias.push(e); repetir(e, PAUSA) }
  dias.push(t)
}
repetir(ms(HOY), FINAL)

const nav = await abrirNavegador({ ancho, alto, escala })
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-vf', `scale=${salW}:${salH}:flags=lanczos`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', salida], { stdio: ['pipe', 'inherit', 'inherit'] })
const finFf = new Promise((r) => ff.on('close', r))
let cotejados = 0
try {
  await nav.cargar(`${lg === 'en' ? '/en/data' : '/datos'}?peli=1`)
  for (let i = 0; i < 60 && !(await nav.evaluate('!!window.__peli && !!document.querySelector(".pl[open] .ps")')); i++) await nav.sleep(100)
  // para el vídeo sobran los mandos; se queda la barra como indicador y se añade la dirección de la página
  await nav.evaluate(`(() => {
    const st = document.createElement('style')
    st.textContent = '.pl__botones,.pl__x,.pl__ver{display:none!important}.pl{animation:none!important}.pl__barra-caja{pointer-events:none}.pl__firma{font:600 13px var(--font-mono);color:var(--color-text-soft);text-align:center;padding:8px 0 4px;margin:0}'
    document.head.appendChild(st)
    const p = document.createElement('p'); p.className = 'pl__firma'; p.textContent = 'helpmiriam.com/datos'
    document.querySelector('.pl__ctl').appendChild(p)
  })()`)
  await nav.sleep(600)
  const sobra = await nav.evaluate(`(() => { const e = document.querySelector('.pl__escena'); return e.scrollHeight - e.clientHeight })()`)
  if (sobra > 0) throw new Error(`la escena no cabe en ${ancho}×${alto}: sobran ${sobra} px y el vídeo saldría cortado`)
  let ultimo = null
  let png = null
  for (const t of dias) {
    if (t !== ultimo) {
      await nav.evaluate(`window.__peli.seek(${t})`)
      const d = await nav.evaluate(`[...document.querySelectorAll('.pl .ps')].map((el) => ({ k: el.dataset.k, f: el.dataset.f, v: el.dataset.v, txt: el.querySelector('.ps__valor')?.textContent ?? '' }))`)
      for (const [k, modo] of SERIES) {
        const s = d.find((x) => x.k === k), e = esperado(k, modo, t)
        const ok = s && (e ? s.f === e.f && s.v === String(e.v) && s.txt.includes(`${e.cmp ?? ''}${num(e.v)}`) : s.f === '' && s.txt === '')
        if (!ok) throw new Error(`fotograma del ${iso(t)}: ${k} pinta ${JSON.stringify(s)} y caso.json dice ${e ? `${e.v} (${e.f})` : 'sin análisis'}`)
        cotejados++
      }
      png = Buffer.from((await nav.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')
      ultimo = t
    }
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r))
  }
} finally {
  ff.stdin.end()
  await nav.cerrar()
}
const cod = await finFf
console.log(cod === 0 ? `✔ ${salida}: ${dias.length} fotogramas (${(dias.length / FPS).toFixed(1)} s), ${cotejados} cifras cotejadas contra caso.json, 0 discrepancias` : `ffmpeg salió con código ${cod}`)
process.exit(cod === 0 ? 0 : 1)
