#!/usr/bin/env node
// Frases sobre el caso que ya se cotejaron contra la fuente y resultaron falsas.
// Si vuelven al copy (por un copia-pega o un PR viejo), este test falla.
//
// - SSTR2 afirmado del tumor: ningún informe dice SSTR2. El PET 68Ga-DOTATOC
//   (26-may-2026) habla de «receptores de somatostatina» y la IHQ de SSTR2 está
//   pendiente. SSTR2 como concepto (literatura, qué mide el trazador, panel de
//   IHQ, definición de PRRT) sí se permite: los patrones solo pillan la
//   afirmación sobre el tumor. PR #141 y #243, 26-sep-2026.
// - Rareza «menos de 1 de cada 1.000» atribuida al paper SEER de 2023: ese
//   paper da 0,1–5 % (dato de fondo) y su propio SEER, 1,07 %. PR #141.
// - «Metástasis exclusivamente óseas» en presente: hay afectación hepática desde
//   julio de 2026. Las entradas fechadas de la cronología cuentan el pasado y no
//   se revisan aquí.
// - Estado del caso que caducó (29-sep-2026, visita de Dana-Farber a /ciencia): la
//   rebiopsia ya se hizo (Zúrich, 8-jul-2026), salió del BG-75202 el 9-sep y el
//   ECOG documentado es 0. FGFR1 está en 8p11, no en 11q13. Las variantes de RB1
//   solo están en ctDNA: no se afirma que «se está perdiendo». El PIK3CA ya se
//   reanalizó en tejido (FoundationOne CDx, jul-2026).
// - Citas que no dicen lo que se les atribuía (cotejadas en Crossref y PubMed el
//   29-sep-2026): el DOI 10.1158/2159-8290.CD-24-0837 es «Drugging p53» (Song
//   2024), no una revisión de transformación NE; 10.1007/s00259-020-05054-9 es un
//   estudio preclínico con 177Lu-DOTA-folato, no una serie de PRRT en mama NE;
//   10.1136/jclinpath-2020-207002 es un paper de páncreas (Pareja es ...-207052).
//   Las guías NCCN NET 2025 y ENETS 2023 no recogen un algoritmo para mama NE.
// - Repaso contra informes originales (29-sep-2026): la biopsia de Zúrich es del ilion
//   derecho («rechtes Os Ileum»), no de la cresta; el Guardant360 de abril NO detectó
//   ESR1; Vall d'Hebron anota ECOG 0 en 2026; la RM craneal del 13-jul-2026 fue
//   negativa (el SNC sí está estudiado); el informe de la RM de columna del 11-jun
//   describe dorsal y lumbar; ningún documento dice que Oncología Radioterápica
//   revisara los focos de carga.
//
// Uso: pnpm test:afirmaciones-clinicas   (CI: .github/workflows/lint.yml)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const DIRS = ['app', 'i18n', 'content']
const EXT = new Set(['.vue', '.ts', '.json', '.yml', '.yaml', '.md'])
// La cronología narra hechos fechados («hasta entonces, solo óseas»).
const SALTAR_OSEAS = /content\/(es|en)\/timeline\.yml$/

const PROHIBIDO = [
  { re: /SSTR2\+/, por: 'SSTR2+ afirmado del tumor (usa SSTR+)' },
  { re: /subtipo 2, SSTR2|subtype 2, SSTR2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /somatostatina de subtipo 2 \(SSTR2\) (confirmada|—)|sobreexpresión de receptores de somatostatina de subtipo 2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /somatostatin receptor subtype 2 \(SSTR2\) overexpression/, por: 'subtype 2 asserted for the tumour' },
  { re: /demuestra expresión de receptores de somatostatina de subtipo 2|shows somatostatin-receptor subtype 2/, por: 'subtipo 2 afirmado del tumor' },
  { re: /SSTR2 \((PET|Ga-68|somatostat)/, por: 'SSTR2 en tabla de perfil del tumor' },
  { re: /(expresión|sobreexpresión) de SSTR2 en (PET|las metástasis)|SSTR2 expression on|confirmed SSTR2/, por: 'SSTR2 afirmado del tumor' },
  { re: /\(SSTR2\) del tumor|tumor’s somatostatin receptors \(SSTR2\)|lesiones SSTR2|SSTR2\+? lesions/, por: 'SSTR2 afirmado del tumor' },
  { re: /menos de 1 de cada 1\.000|fewer than 1 in 1,000/, por: 'cifra de rareza que no sostiene su fuente' },
  { re: /Metástasis exclusivamente óseas|Bone-only metastases\./, por: 'hay afectación hepática desde jul-2026', saltar: SALTAR_OSEAS },
  { re: /rebiopsia ósea PET pendiente|siguiente paso es una rebiopsia|rebiopsia molecular avanzada como siguiente|Próximo paso \(junio 2026\)|next step is an advanced|Advanced molecular rebiopsy as the next step|Next step \(June 2026\)/, por: 'la rebiopsia se hizo el 8-jul-2026', saltar: SALTAR_OSEAS },
  { re: /en ensayo en fase 1 con BG-75202|on a phase 1 trial with BG-75202/, por: 'salió del BG-75202 el 9-sep-2026', saltar: SALTAR_OSEAS },
  { re: /FGFR1 en 11q13|FGFR1 at 11q13|amplicón 11q13 \(FGFR1|11q13 amplicon \(FGFR1/, por: 'FGFR1 está en 8p11, no en 11q13' },
  { re: /un freno que se (está|va) perdiendo|a brake that is being lost|"se está perdiendo"/, por: 'RB1 solo en ctDNA, no confirmado en tejido' },
  { re: /Pendiente reanálisis sobre tejido actualizado|Pending re-analysis on updated tissue/, por: 'PIK3CA ya reanalizado en tejido (F1CDx jul-2026)' },
  { re: /ECOG 1, sin crisis visceral|ECOG 1, no visceral crisis/, por: 'ECOG documentado 0 (9-sep-2026)' },
  { re: /2159-8290\.CD-24-0837|s00259-020-05054-9|jclinpath-2020-207002/, por: 'DOI que resuelve a otro paper' },
  { re: /NCCN Guidelines — Neuroendocrine and Adrenal Tumors|ENETS Consensus Guidelines, 2023/, por: 'guía que no recoge un algoritmo para mama NE' },
  { re: /biopsia (ósea )?(de |\()?cresta ilíaca|Biopsia ósea · cresta ilíaca|iliac crest biopsy|Bone biopsy \(right iliac crest\)|Hueso, cresta ilíaca/, por: 'la biopsia de Zúrich es del ilion derecho' },
  { re: /guardant1: \{ value: '(detectada|detected)'/, por: 'el Guardant360 de abril no detectó ESR1' },
  { re: /label: 'ECOG 1'/, por: 'ECOG 0 documentado en 2026' },
  { re: /sin imagen cerebral en el archivo y sin clínica|no brain imaging on file and no recorded|no estudiado \(no es un negativo\)|not studied \(not a negative\)/, por: 'RM craneal 13-jul-2026 negativa' },
  { re: /RMN de columna cervical y dorsal \(11\/06\/2026\)/, por: 'el informe de la RM describe dorsal y lumbar' },
  { re: /revisado por Oncología Radioterápica|Oncología Radioterápica ya los revisó|en seguimiento por Oncología Radioterápica|reviewed by Radiation Oncology|under Radiation Oncology follow/, por: 'sin documento de revisión por Oncología Radioterápica' },
]

function* ficheros(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) yield* ficheros(p)
    else if (EXT.has(extname(n))) yield p
  }
}

const fallos = []
for (const d of DIRS) {
  for (const f of ficheros(join(ROOT, d))) {
    const rel = relative(ROOT, f)
    readFileSync(f, 'utf8').split('\n').forEach((linea, i) => {
      for (const { re, por, saltar } of PROHIBIDO) {
        if (saltar?.test(rel)) continue
        const m = linea.match(re)
        if (m) fallos.push(`${rel}:${i + 1}  «${m[0]}»  → ${por}`)
      }
    })
  }
}

if (fallos.length) {
  console.error(`✗ ${fallos.length} afirmación(es) ya refutada(s) han vuelto al copy:\n  ${fallos.join('\n  ')}`)
  process.exit(1)
}
console.log('✓ afirmaciones clínicas: ninguna refutada en el copy')
