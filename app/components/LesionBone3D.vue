<script setup lang="ts">
/**
 * Hueso 3D anatómico + PET de doble trazador, por lesión. Estilo científico.
 * Recibe la lesión `le` (forma del array LES de mapa-metastasis) y, opcional, `all`
 * (todas las lesiones, para mostrar varios focos sobre la misma vértebra).
 *  - Vértebras: modelo 3D rotable (arrastra) construido con volúmenes redondeados
 *    (cuerpo tipo tambor, pedículos, apófisis, arco) e iluminación Lambert + rim.
 *  - Otros huesos (fémur, ilíaco, sacro, escápula): esquema con volumen y foco PET.
 *  - Mapa de calor: dos focos PET (receptor Galio y FDG), tamaño/brillo según SUVmáx.
 * Todo el SVG se genera como cadena y se inyecta con v-html (igual que evoChartSvg).
 */
const props = defineProps<{ le: any; all?: any[]; vertKey?: string }>()
const { locale } = useI18n()
const lang = computed<'es' | 'en'>(() => (locale.value === 'en' ? 'en' : 'es'))
const L = (es: string, en: string) => (lang.value === 'en' ? en : es)

const PH: Record<string, string> = { ne: '#9d44ab', mixNe: '#8a5bb3', mixBal: '#c9921e', mixAgg: '#df7a44', agg: '#bb4128' }
const col = (l: any) => PH[l.pheno] || '#8a5bb3'
/* proporción orientativa receptor (Galio) vs azúcar (FDG) para la barra del paso 3 */
const neShare = (l: any) => (l.fdg == null ? 0.9 : l.dota == null ? 0.1 : l.dota / (l.dota + l.fdg))

/* ---------- tiny vec3 ---------- */
type V3 = number[]
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x)
function hex2rgb(h: string): number[] { const c = h.replace('#', ''); return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)] }
function mberry(seed: number) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

/* ---------- rotation (yaw about Y, pitch about X) + perspective ---------- */
function rot(p: V3, yaw: number, pit: number): V3 {
  const x = p[0], y = p[1], z = p[2]
  const cy = Math.cos(yaw), sy = Math.sin(yaw), x1 = x * cy + z * sy, z1 = -x * sy + z * cy
  const cx = Math.cos(pit), sx = Math.sin(pit), y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx
  return [x1, y2, z2]
}
function toScreen(r: V3): { x: number; y: number; z: number } {
  const s = 200 / (200 - r[2] * 1.3)
  return { x: 90 + r[0] * 2.3 * s, y: 78 - r[1] * 2.3 * s, z: r[2] }
}

/* ---------- geometry: rounded tube (tapered), faces in MODEL space ---------- */
function tube(p0: V3, p1: V3, r0: number, r1: number, seg: number, key: string, ellip: number[] = [1, 1]): { pts: V3[]; key: string }[] {
  const a = norm(sub(p1, p0))
  const up: V3 = Math.abs(a[1]) < 0.88 ? [0, 1, 0] : [1, 0, 0]
  const u = norm(cross(a, up)), v = norm(cross(a, u))
  const ringPts = (c: V3, r: number): V3[] => {
    const arr: V3[] = []
    for (let i = 0; i < seg; i++) {
      const t = 2 * Math.PI * i / seg
      const dir = add(mul(u, Math.cos(t) * ellip[0]), mul(v, Math.sin(t) * ellip[1]))
      arr.push(add(c, mul(dir, r)))
    }
    return arr
  }
  const A = ringPts(p0, r0), B = ringPts(p1, r1)
  const faces: { pts: V3[]; key: string }[] = []
  for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; faces.push({ pts: [A[i], A[j], B[j], B[i]], key }) }
  faces.push({ pts: A.slice().reverse(), key })
  faces.push({ pts: B.slice(), key })
  return faces
}
function vertebraFaces(): { pts: V3[]; key: string }[] {
  const F: { pts: V3[]; key: string }[] = []
  F.push(...tube([0, -9, 9], [0, 9, 9], 1, 1, 32, 'body', [15.5, 8.5]))      // body — elliptical drum
  F.push(...tube([9, 0, 4], [7, 0, -6], 4, 3, 14, 'pedR'))                    // pedicles
  F.push(...tube([-9, 0, 4], [-7, 0, -6], 4, 3, 14, 'pedL'))
  F.push(...tube([7, 1, -3], [22, 2, -5], 3.4, 1.8, 12, 'tpR'))               // transverse processes
  F.push(...tube([-7, 1, -3], [-22, 2, -5], 3.4, 1.8, 12, 'tpL'))
  F.push(...tube([7, 0, -6], [0, -1, -12], 3, 2.4, 12, 'lamR'))               // laminae / arch
  F.push(...tube([-7, 0, -6], [0, -1, -12], 3, 2.4, 12, 'lamL'))
  F.push(...tube([0, -1, -11], [0, -5, -23], 2.6, 1.4, 12, 'spin', [0.7, 1])) // spinous process
  F.push(...tube([8, 5, -5], [9, 8, -6], 2.2, 1.6, 10, 'lamR'))               // articular facets
  F.push(...tube([-8, 5, -5], [-9, 8, -6], 2.2, 1.6, 10, 'lamL'))
  return F
}
function faceNormalModel(pts: V3[]): V3 {
  let nx = 0, ny = 0, nz = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1])
  }
  return norm([nx, ny, nz])
}
function centroid(pts: V3[]): V3 { let c: V3 = [0, 0, 0]; pts.forEach((p) => { c = add(c, p) }); return mul(c, 1 / pts.length) }

/* ---------- lighting (view space) ---------- */
const LIGHT = norm([-0.45, 0.62, 0.62])
const HALF = norm(add(LIGHT, [0, 0, 1]))
function shadeFace(nModel: V3, yaw: number, pit: number, baseRGB: number[], hl: boolean): string {
  const n = norm(rot(nModel, yaw, pit))
  const nv: V3 = n[2] < 0 ? [-n[0], -n[1], -n[2]] : n
  const diff = clamp(dot(nv, LIGHT), 0, 1)
  const shade = 0.40 + 0.78 * diff
  const rim = Math.pow(1 - clamp(nv[2], 0, 1), 2.2) * (hl ? 0.5 : 0.42)
  const spec = Math.pow(clamp(dot(nv, HALF), 0, 1), hl ? 18 : 26) * (hl ? 0.5 : 0.6)
  const rgb = baseRGB.map((c) => clamp(Math.round(c * shade + 255 * rim * 0.55 + 255 * spec), 0, 255))
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

/* ---------- which bone / which vertebral part ---------- */
function boneType(l: any): string {
  const s = ((l.region?.es || '') + ' ' + (l.level?.es || '')).toLowerCase()
  if (/fémur|femur/.test(s)) return 'femur'
  if (/escáp|escap/.test(s)) return 'scapula'
  if (/sacr/.test(s)) return 'sacrum'
  if (/pelvis|ilíac|iliac|acetab|cadera/.test(s)) return 'iliac'
  if (/costilla|\brib\b|cervicotor/.test(s)) return 'other'
  return 'vertebra'
}
function vertPart(l: any): string {
  const lv = (l.level?.es || '').toLowerCase()
  if (/ped[íi]c/.test(lv)) return l.side === 'L' ? 'pedL' : 'pedR'
  if (/espinosa/.test(lv)) return 'spin'
  if (/l[áa]mina|arco/.test(lv)) return l.side === 'L' ? 'lamL' : 'lamR'
  return 'body'
}
function vertKey(l: any): string { const m = (l.level?.es || '').match(/\b([CDL]\d+)\b/); return m ? m[1] : 'id' + l.id }
function fociOn(l: any, all?: any[]): any[] {
  if (boneType(l) !== 'vertebra') return [l]
  return (all || [l]).filter((x: any) => boneType(x) === 'vertebra' && vertKey(x) === vertKey(l))
}

/* ---------- 3D vertebra ---------- */
const vYaw = ref(0.85), vPitch = ref(0.34)
function vert3D(le: any, yaw: number, pit: number, all?: any[]): string {
  const id = 'v' + le.id
  const foci = fociOn(le, all)
  const hi: Record<string, { c: string; self: boolean }> = {}
  foci.forEach((f: any) => { hi[vertPart(f)] = { c: col(f), self: f.id === le.id } })
  const boneRGB = [228, 221, 205]

  const F = vertebraFaces()
  const drawn = F.map((f) => {
    const nModel = faceNormalModel(f.pts)
    const sp = f.pts.map((p) => toScreen(rot(p, yaw, pit)))
    const z = sp.reduce((s, p) => s + p.z, 0) / sp.length
    const H = hi[f.key]
    const base = H ? hex2rgb(H.c) : boneRGB
    const fill = shadeFace(nModel, yaw, pit, base, !!H)
    const d = 'M' + sp.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join('L') + 'Z'
    return { z, d, fill, hl: !!H }
  })
  drawn.sort((a, b) => a.z - b.z)

  const shadow = `<ellipse cx="90" cy="138" rx="46" ry="8" fill="url(#sh${id})"/>`
  const body = drawn.map((f) => `<path d="${f.d}" fill="${f.fill}" stroke="${f.fill}" stroke-width="0.5" stroke-linejoin="round"${f.hl ? ' opacity="0.99"' : ''}/>`).join('')

  const hk = Object.keys(hi)[0]
  let pins = ''
  Object.keys(hi).forEach((k) => {
    const pf = F.filter((f) => f.key === k); if (!pf.length) return
    const c = centroid(pf.flatMap((f) => f.pts))
    const sc = toScreen(rot(c, yaw, pit))
    const self = hi[k].self
    pins += `<circle cx="${sc.x.toFixed(1)}" cy="${sc.y.toFixed(1)}" r="${self ? 22 : 16}" fill="url(#hl${id})" opacity="0.5"/>`
    pins += `<circle cx="${sc.x.toFixed(1)}" cy="${sc.y.toFixed(1)}" r="${self ? 4.4 : 3.2}" fill="${hi[k].c}" stroke="#fff" stroke-width="${self ? 1.4 : 1}"/>`
  })

  const defs = `<defs>
    <radialGradient id="bg${id}" cx="42%" cy="34%" r="78%"><stop offset="0%" stop-color="#1b2530"/><stop offset="60%" stop-color="#121922"/><stop offset="100%" stop-color="#0a0e14"/></radialGradient>
    <radialGradient id="sh${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient>
    <radialGradient id="hl${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${hk ? hi[hk].c : '#fff'}" stop-opacity="0.75"/><stop offset="100%" stop-color="${hk ? hi[hk].c : '#fff'}" stop-opacity="0"/></radialGradient>
  </defs>`
  return `<svg viewBox="0 0 180 156" style="width:100%;height:auto;display:block">${defs}<rect x="0" y="0" width="180" height="156" rx="10" fill="url(#bg${id})"/>${shadow}${body}${pins}</svg>`
}

/* ---------- dual-tracer PET heatmap ---------- */
function petBlob(cx: number, cy: number, suv: number | null, id: string, kind: string): string {
  const gid = kind + id
  if (suv == null) {
    return `<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#3a4350" stroke-width="1.5" stroke-dasharray="3 3"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="monospace" font-size="11" fill="#6b7686">—</text>`
  }
  const t = Math.min(suv, 14) / 14
  const rad = 7 + t * 16
  const core = (0.10 + t * 0.34) * 100
  const stops = kind === 'ga'
    ? `<stop offset="0%" stop-color="#fff5fc"/><stop offset="${core.toFixed(0)}%" stop-color="#f0b6ea"/><stop offset="${(core + 30).toFixed(0)}%" stop-color="#c061d6"/><stop offset="78%" stop-color="#7a2da6"/><stop offset="100%" stop-color="#7a2da6" stop-opacity="0"/>`
    : `<stop offset="0%" stop-color="#fffce8"/><stop offset="${core.toFixed(0)}%" stop-color="#ffd24a"/><stop offset="${(core + 30).toFixed(0)}%" stop-color="#ff8a3a"/><stop offset="78%" stop-color="#d23b1c"/><stop offset="100%" stop-color="#d23b1c" stop-opacity="0"/>`
  return `<defs><radialGradient id="${gid}" cx="50%" cy="50%" r="50%">${stops}</radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${(rad * 1.25).toFixed(1)}" fill="url(#${gid})"/><circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#3a4350" stroke-width="1"/>`
}
function heatmap(l: any): string {
  const id = 'm' + l.id
  const r = mberry(l.id * 131 + 5)
  let ct = ''
  for (let k = 0; k < 26; k++) { const x = 8 + r() * 116, y = 24 + r() * 78, a = r() * 3.14159, ln = 3 + r() * 5; ct += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * ln).toFixed(1)}" y2="${(y + Math.sin(a) * ln).toFixed(1)}" stroke="#252c36" stroke-width="1.2" stroke-linecap="round"/>` }
  const W = 132, H = 120
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">`
    + `<defs><radialGradient id="bgh${id}" cx="50%" cy="42%" r="75%"><stop offset="0%" stop-color="#1a2029"/><stop offset="100%" stop-color="#0c1014"/></radialGradient><clipPath id="clp${id}"><rect width="${W}" height="${H}" rx="10"/></clipPath></defs>`
    + `<rect width="${W}" height="${H}" rx="10" fill="url(#bgh${id})"/>`
    + `<g clip-path="url(#clp${id})">${ct}</g>`
    + `<text x="35" y="18" text-anchor="middle" font-family="sans-serif" font-size="10.5" font-weight="700" fill="#caa8e0">⁶⁸Ga</text>`
    + `<text x="97" y="18" text-anchor="middle" font-family="sans-serif" font-size="10.5" font-weight="700" fill="#f0a07a">FDG</text>`
    + petBlob(35, 58, l.dota, id, 'ga')
    + petBlob(97, 58, l.fdg, id, 'fd')
    + `<text x="35" y="104" text-anchor="middle" font-family="monospace" font-size="12" fill="#e7e0d2">${l.dota != null ? l.dota.toFixed(1) : '—'}</text>`
    + `<text x="97" y="104" text-anchor="middle" font-family="monospace" font-size="12" fill="#e7e0d2">${l.fdg != null ? l.fdg.toFixed(1) : '—'}</text>`
    + `<text x="66" y="116" text-anchor="middle" font-family="monospace" font-size="8" fill="#7c8694">SUVmáx</text>`
    + `</svg>`
}

/* ---------- volumetric 2D bone schema (non-vertebra) ---------- */
function petSpot(x: number, y: number, color: string, intensity: number, id: number, self: boolean, tag: string): string {
  const rad = 10 + Math.min(intensity || 4, 14) * 1.5
  const gid = 'ps' + id + tag
  return `<defs><radialGradient id="${gid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="28%" stop-color="${color}" stop-opacity="0.92"/><stop offset="62%" stop-color="${color}" stop-opacity="0.42"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>`
    + `<circle cx="${x}" cy="${y}" r="${rad.toFixed(1)}" fill="url(#${gid})"/>`
    + `<circle cx="${x}" cy="${y}" r="${self ? 6 : 4.6}" fill="${color}" stroke="#fff" stroke-width="${self ? 2 : 1.5}"/>`
    + `<text x="${x}" y="${y + 3.2}" text-anchor="middle" font-family="sans-serif" font-size="${self ? 9 : 8}" font-weight="700" fill="#fff">${id}</text>`
}
function boneSchema(l: any): string {
  const bt = boneType(l); const id = l.id; const av = Math.max(l.dota || 0, l.fdg || 0)
  const G = `<defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f3eee2"/><stop offset="52%" stop-color="#ddd5c4"/><stop offset="100%" stop-color="#c0b8a4"/></linearGradient>
    <radialGradient id="hi${id}" cx="34%" cy="26%" r="80%"><stop offset="0%" stop-color="#fffdf6" stop-opacity="0.85"/><stop offset="55%" stop-color="#fffdf6" stop-opacity="0"/></radialGradient>
    <radialGradient id="bgp${id}" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#1a2029"/><stop offset="100%" stop-color="#0c1014"/></radialGradient>
  </defs>`
  const FILL = `fill="url(#bg${id})" stroke="#9a917f" stroke-width="2" stroke-linejoin="round"`
  let base = '', inner = ''
  if (bt === 'scapula') {
    base = `<path d="M28,26 L152,44 L74,150 Z" ${FILL}/><path d="M28,26 L152,44 L74,150 Z" fill="url(#hi${id})"/><line x1="40" y1="64" x2="146" y2="54" stroke="#b3aa96" stroke-width="7" stroke-linecap="round"/>`
    inner = petSpot(82, 84, col(l), av, id, true, 'a')
  } else if (bt === 'sacrum') {
    base = `<path d="M58,22 L142,22 L128,150 Q100,172 72,150 Z" ${FILL}/><path d="M58,22 L142,22 L128,150 Q100,172 72,150 Z" fill="url(#hi${id})"/>`
    ;[[86, 58], [114, 58], [86, 94], [114, 94], [90, 126], [110, 126]].forEach((p) => { base += `<ellipse cx="${p[0]}" cy="${p[1]}" rx="6" ry="5" fill="#c4bca9" stroke="#a99f8b" stroke-width="1.3"/>` })
    inner = petSpot(l.side === 'L' ? 72 : 128, 42, col(l), av, id, true, 'a')
  } else if (bt === 'iliac') {
    base = `<path d="M34,30 Q150,16 172,76 Q150,102 96,100 Q52,92 34,30 Z" ${FILL}/><path d="M34,30 Q150,16 172,76 Q150,102 96,100 Q52,92 34,30 Z" fill="url(#hi${id})"/><circle cx="122" cy="134" r="22" fill="#c4bca9" stroke="#9a917f" stroke-width="3"/><path d="M106,152 Q98,188 126,192" fill="none" stroke="url(#bg${id})" stroke-width="11" stroke-linecap="round"/>`
    const supra = /supr/i.test(l.level?.es || '')
    inner = petSpot(supra ? 122 : 88, supra ? 108 : 56, col(l), av, id, true, 'a')
  } else if (bt === 'femur') {
    base = `<rect x="92" y="58" width="34" height="156" rx="15" ${FILL}/><path d="M126,70 L160,42 L176,60 L150,90 Z" ${FILL}/><line x1="98" y1="78" x2="56" y2="50" stroke="url(#bg${id})" stroke-width="22" stroke-linecap="round"/><circle cx="46" cy="46" r="24" ${FILL}/><circle cx="46" cy="46" r="24" fill="url(#hi${id})"/><rect x="92" y="58" width="34" height="156" rx="15" fill="url(#hi${id})"/>`
    inner = petSpot(70, 64, col(l), av, id, true, 'a')
  } else {
    base = `<circle cx="100" cy="110" r="30" ${FILL}/><circle cx="100" cy="110" r="30" fill="url(#hi${id})"/>`
    inner = petSpot(100, 110, col(l), av, id, true, 'a')
  }
  return `<svg viewBox="0 0 200 220" style="width:100%;height:auto;display:block">${G}<rect width="200" height="220" rx="10" fill="url(#bgp${id})"/>${base}${inner}</svg>`
}

const bone3dSvg = computed(() => (boneType(props.le) === 'vertebra' ? vert3D(props.le, vYaw.value, vPitch.value, props.all) : boneSchema(props.le)))
const heatSvg = computed(() => heatmap(props.le))
const boneLabel = computed(() => {
  const sz = props.le?.size ? ' · ' + props.le.size + ' mm' : ''
  return (boneType(props.le) === 'vertebra'
    ? L('Vértebra 3D · arrastra para rotar', '3D vertebra · drag to rotate')
    : L('Hueso (esquema a escala)', 'Bone (scale schematic)')) + sz
})
/* parte del hueso afectada (para el paso "dónde está") */
const partLabel = computed(() => {
  if (boneType(props.le) !== 'vertebra') return L(props.le.region?.es || '', props.le.region?.en || '')
  const lv = (props.le.level?.es || '').toLowerCase()
  if (/ped[íi]c/.test(lv)) return L('pedículo', 'pedicle')
  if (/espinosa/.test(lv)) return L('apófisis espinosa', 'spinous process')
  if (/l[áa]mina|arco/.test(lv)) return L('lámina / arco', 'lamina / arch')
  return L('cuerpo vertebral', 'vertebral body')
})

/* drag to rotate (scientific: user-controlled) */
let dragging = false, lx = 0, ly = 0
function down(e: PointerEvent) { dragging = true; lx = e.clientX; ly = e.clientY }
function moveR(e: PointerEvent) {
  if (!dragging) return
  vYaw.value += (e.clientX - lx) * 0.012
  vPitch.value = Math.max(-0.55, Math.min(1.0, vPitch.value + (e.clientY - ly) * 0.012))
  lx = e.clientX; ly = e.clientY
}
function up() { dragging = false }

/* ---------- vértebra REAL del CT: visor de fotogramas (arrastra para girar) ---------- */
/* Vértebras con frames reales reconstruidos en /public/metastasis/vertebra (12 c/u).
   El Paso 2 SOLO se muestra para estas claves: cualquier otra lesión (pelvis, fémur,
   sacro, escápula, o vértebras sin reconstruir) no tiene frames y mostraría una imagen
   rota. El propio componente lo decide, no depende de quién pase la prop. */
const FRAME_KEYS = ['C3', 'C4', 'D1', 'D5', 'D9', 'D11', 'L1', 'L5', 'ESCAPULA_R', 'SACRO', 'ILIACO_R', 'ILIACO_L', 'FEMUR_R']
const hasFrames = computed(() => !!props.vertKey && FRAME_KEYS.includes(props.vertKey))
const isVert = computed(() => boneType(props.le) === 'vertebra')
/* clave de malla 3D: la PROP vertKey (no la función vertKey() interna, que colisiona de nombre) */
const meshKey = computed(() => props.vertKey)
const NF = 12
const vframe = ref(3)
const vsrc = computed(() => (hasFrames.value ? `/metastasis/vertebra/${props.vertKey}-${String(vframe.value).padStart(2, '0')}.jpg` : ''))
let fdrag = false, flx = 0, facc = 0
function fdown(e: PointerEvent) { fdrag = true; flx = e.clientX; facc = 0 }
function fmove(e: PointerEvent) {
  if (!fdrag) return
  facc += e.clientX - flx; flx = e.clientX
  const step = Math.trunc(facc / 14)
  if (step !== 0) { vframe.value = ((vframe.value + step) % NF + NF) % NF; facc = 0 }
}
function fup() { fdrag = false }

/* ---------- PASO 3 · morfología (densidad del CT) · visor de fotogramas ---------- */
const mframe = ref(3)
const msrc = computed(() => (hasFrames.value ? `/metastasis/morfo/${props.vertKey}-${String(mframe.value).padStart(2, '0')}.jpg` : ''))
let mdrag = false, mlx = 0, macc = 0
function mdown(e: PointerEvent) { mdrag = true; mlx = e.clientX; macc = 0 }
function mmove(e: PointerEvent) {
  if (!mdrag) return
  macc += e.clientX - mlx; mlx = e.clientX
  const s = Math.trunc(macc / 14)
  if (s !== 0) { mframe.value = ((mframe.value + s) % NF + NF) % NF; macc = 0 }
}
function mup() { mdrag = false }
</script>

<template>
  <div class="space-y-3.5">
    <!-- PASO 1 · DÓNDE ESTÁ (orientación, esquemático) -->
    <div>
      <p class="bn-step">{{ L('1 · Dónde está', '1 · Where it is') }}</p>
      <figure class="m-0 rounded-lg p-2" style="background:#0d1117">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          :class="boneType(le) === 'vertebra' ? 'cursor-grab active:cursor-grabbing select-none' : ''"
          @pointerdown="down" @pointermove="moveR" @pointerup="up" @pointerleave="up"
          v-html="bone3dSvg"
        />
        <figcaption class="bn-cap">
          {{ L('Parte afectada', 'Affected part') }}: <span style="color:#e7e0d2">{{ partLabel }}</span>
          <template v-if="boneType(le) === 'vertebra'"> · {{ L('arrastra para rotar', 'drag to rotate') }}</template>
        </figcaption>
      </figure>
    </div>

    <!-- PASO 2 · TU HUESO REAL EN 3D (morfología + captación unificadas · rotación libre 360°) -->
    <div v-if="hasFrames">
      <p class="bn-step">{{ L('2 · Tu hueso real en 3D · gira 360°', '2 · Your real bone in 3D · rotate 360°') }}</p>
      <figure class="m-0">
        <NuxtErrorBoundary>
          <BoneViewer3D :mesh-key="meshKey" />
          <template #error="{ error }">
            <div class="rounded-lg p-4 text-center text-[12px] flex items-center justify-center" style="background:#0d1117;color:#aeb6c2;aspect-ratio:5/4">
              {{ L('No se pudo cargar el visor 3D en este navegador.', 'Could not load the 3D viewer in this browser.') }}
            </div>
          </template>
        </NuxtErrorBoundary>
        <figcaption class="bn-cap mt-1.5">
          {{ L('Reconstruido de tu CT (IA) · arrastra para girar en cualquier dirección · rueda para acercar', 'Reconstructed from your CT (AI) · drag to rotate any direction · scroll to zoom') }}<br>
          <span style="color:#dbe4f7">●</span> {{ L('blanco denso = blástico (hueso duro)', 'dense white = blastic (hard bone)') }} · <span style="color:#c061d6">●</span> {{ L('receptor · Galio', 'receptor · gallium') }} · <span style="color:#f08a3a">●</span> {{ L('azúcar · FDG', 'sugar · FDG') }}
        </figcaption>
      </figure>
    </div>

    <!-- PASO 3 · CUÁNTO CAPTA CADA TRAZADOR (SUVmáx) -->
    <div>
      <p class="bn-step">{{ (hasFrames ? '3' : '2') + ' · ' + L('Cuánto capta · SUVmáx', 'How much · SUVmax') }}</p>
      <div class="mb-2">
        <div class="flex justify-between text-[11px] mb-1">
          <span style="color:#9d44ab">{{ L('Receptor · Galio', 'Receptor · gallium') }} {{ le.dota != null ? le.dota.toFixed(1) : '—' }}</span>
          <span style="color:#bb4128">{{ L('Azúcar · FDG', 'Sugar · FDG') }} {{ le.fdg != null ? le.fdg.toFixed(1) : '—' }}</span>
        </div>
        <div class="h-3 rounded-full overflow-hidden flex" style="background:rgba(45,27,61,0.06)">
          <div :style="{ width: (neShare(le) * 100) + '%', background: '#9d44ab' }" />
          <div :style="{ width: ((1 - neShare(le)) * 100) + '%', background: '#bb4128' }" />
        </div>
      </div>
      <figure class="m-0 rounded-lg p-2" style="background:#11161d">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="heatSvg" />
        <figcaption class="bn-cap">
          <span style="color:#c061d6">■</span> {{ L('receptor', 'receptor') }} · <span style="color:#ff8a3a">■</span> FDG · {{ L('tamaño y brillo = intensidad de captación', 'size & brightness = uptake intensity') }}
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.bn-step {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2d1b3d;
  margin-bottom: 5px;
}
.bn-cap {
  font-size: 10px;
  text-align: center;
  margin-top: 4px;
  font-family: ui-monospace, monospace;
  line-height: 1.35;
  color: #aeb6c2;
}
</style>
