// Los textos LITERALES de la figura del tumor de /ciencia (fase «esquema» de la tanda 3, 25-oct-2026): la «Lista FINAL» del cotejo de
// `verificacion` (esquema-del-tumor-actualizado-para-la-capa-llana-de-ciencia-2026-10-25.md, sección «Cotejo adversarial»), con sus 15 filas
// de cifras (A1 a C4; D1 queda fuera de la capa llana), el título, el subtítulo y los límites 2 a 8 (el 1 es la nota de la figura).
// ÚNICA copia de la verdad de scripts/test-ciencia-pro.ts: el i18n (`esquemaTumor.*`) tiene que decir EXACTAMENTE esto. Si el comité médico
// corrige una fila, se corrige aquí Y en el i18n, y el test deja de estar de acuerdo con el uno o el otro hasta que coinciden.
// El único cambio sobre el literal del comité es el de `diseno` en `limite_2`: la fecha sale de fechaEstado() ({fecha}) y «Polaris» se define
// en la propia frase («el sistema de Miriam»).
export const ESQUEMA_LITERALES = {
  "titulo": {
    "es": "Un tumor de mama con rasgos neuroendocrinos",
    "en": "A breast tumor with neuroendocrine features"
  },
  "lede": {
    "es": "Es un tumor de tipo mama (luminal). Una parte de sus células lleva además rasgos neuroendocrinos. En las dos biopsias leídas célula a célula (hígado y hueso, 2026) esas células están mezcladas dentro del tumor, no en un bando aparte. Lo que cambia según el tejido y la técnica (tinción, ADN, ARN, PET) es cómo se le ve.",
    "en": "It is a breast-type (luminal) tumor. Some of its cells also carry neuroendocrine features. In the two biopsies read cell by cell (liver and bone, 2026) those cells are mixed within the tumor, not a separate camp. What changes with the tissue and the technique (staining, DNA, RNA, PET) is how it looks."
  },
  "cifras": {
    "es": [
      "Receptor de estrógeno (RE): presente en la mama, ausente en la tinción del hígado · 95 %, 100 % y 85 % en tres lecturas del tumor de mama (2024-2026) · 0 % en el hígado (2026)",
      "…pero el gen del receptor de estrógeno sigue encendido en el ARN de las biopsias de 2026 leídas célula a célula, aunque la tinción del hígado salió 0 %. (También estaba alto en el ARN del tumor de mama de 2024, donde la tinción sí era positiva.)",
      "Receptor de progesterona (RP): discordante entre laboratorios en la mama (5 %, 100 %, 20 %) · 5 % en el hígado (2026)",
      "HER2: no lo tiene (0) en cuatro lecturas: tres del tumor de mama y una del hígado",
      "Receptores de somatostatina: el PET con DOTATOC (mayo 2026) los vio en varias lesiones de hueso, no en todas, y el hígado aún no tenía lesiones · el gen SSTR2 apenas aparece en el ARN célula a célula (2026)",
      "Copias de más del gen FGFR1 · 13 copias (mama 2024, TSO500) · amplificado en hueso 2026 (FoundationOne; 33 copias en su anexo de investigación) · 5-7 copias en sangre 2026 (señal diluida) · activo en el ARN de hígado y hueso",
      "Copias de más de CCND1 y sus vecinos FGF3/FGF4/FGF19 · 20 y 18 copias (mama 2024) · 37 en el anexo de investigación de hueso 2026 · 6-7,6 en sangre",
      "Un cambio puntual en el gen del receptor de estrógeno (ESR1 D538G), solo en sangre y a muy baja proporción · 0,24 % (abril) · 0,84-1,38 % (mayo) · no visto en el Guardant de abril ni en ningún tejido",
      "Alteraciones de RB1, un freno del ciclo celular, vistas solo en sangre y a muy baja proporción · tres en abril (1,58 %, 1,48 %, 0,28 %) · en mayo solo una (0,19-0,68 %) · ninguna en tejido (mama 2024, hueso 2026)",
      "Pocas mutaciones en total (3-4 por megabase) · microsatélites estables o con inestabilidad baja",
      "PIK3CA sin mutar en mama 2024, hueso 2026 y sangre 2026 (es una de las alteraciones más frecuentes en este tipo de tumor, y no la tiene)",
      "Rasgos neuroendocrinos (cromogranina, sinaptofisina, INSM1) · 80 % de las células tumorales en una lectura de la biopsia de mama de 2024; otra lectura de 2024 no los informó · relectura 2026: cromogranina focal, sinaptofisina heterogénea, INSM1 en mosaico · hueso 2026: sinaptofisina positiva (poco tejido tumoral; cromogranina no consta) · hígado 2026: cromogranina A y sinaptofisina positivas, sin porcentaje · célula a célula: repartidos, sin grupo aparte; INSM1 real en hígado",
      "Hígado y hueso: compatibles con el mismo tumor (mismos genes principales, FGFR1 activo en ambos, perfil de copias en ARN compatible con un solo clon; el exoma podría confirmarlo)",
      "Casi sin defensas dentro: tumor «frío» · linfocitos T en torno a 1 de cada 100 células en el hígado, o menos · TILs <5 % en el tumor de mama (2026) · PD-L1 CPS 0 en mama (2024) y en hígado (2026)",
      "Velocidad de división (Ki67) · 60 % mama 2024 · 40 % relectura 2026 · ≈15 % hueso 2026 (poca muestra, descalcificada) · no informado en hígado. No es una tendencia: tejidos y métodos distintos"
    ],
    "en": [
      "Estrogen receptor (ER): present in the breast, absent on liver staining · 95%, 100% and 85% in three readings of the breast tumor (2024-2026) · 0% in the liver (2026)",
      "…yet the estrogen receptor gene is still switched on in the RNA of the 2026 biopsies read cell by cell, although liver staining came back 0%. (It was also high in the RNA of the 2024 breast tumor, where staining was positive.)",
      "Progesterone receptor (PR): discordant between laboratories in the breast (5%, 100%, 20%) · 5% in the liver (2026)",
      "HER2: she does not have it (0) in four readings: three of the breast tumor and one of the liver",
      "Somatostatin receptors: the DOTATOC PET (May 2026) saw them in several bone lesions, not all, and the liver had no lesions yet · the SSTR2 gene barely shows in the cell-by-cell RNA (2026)",
      "Extra copies of the FGFR1 gene · 13 copies (breast 2024, TSO500) · amplified in bone 2026 (FoundationOne; 33 copies in its research annex) · 5-7 copies in blood 2026 (diluted signal) · active in liver and bone RNA",
      "Extra copies of CCND1 and its neighbours FGF3/FGF4/FGF19 · 20 and 18 copies (breast 2024) · 37 in the 2026 bone research annex · 6-7.6 in blood",
      "A single point change in the estrogen receptor gene (ESR1 D538G), only in blood and at a very low fraction · 0.24% (April) · 0.84-1.38% (May) · not seen in the April Guardant nor in any tissue",
      "RB1 alterations, a cell-cycle brake, seen only in blood and at a very low fraction · three in April (1.58%, 1.48%, 0.28%) · only one in May (0.19-0.68%) · none in tissue (breast 2024, bone 2026)",
      "Few mutations overall (3-4 per megabase) · microsatellites stable or with low instability",
      "PIK3CA not mutated in breast 2024, bone 2026 and blood 2026 (one of the most frequent alterations in this tumor type, and she does not have it)",
      "Neuroendocrine features (chromogranin, synaptophysin, INSM1) · 80% of tumor cells in one reading of the 2024 breast biopsy; another 2024 reading did not report them · 2026 re-read: focal chromogranin, heterogeneous synaptophysin, mosaic INSM1 · bone 2026: synaptophysin positive (little tumor tissue; chromogranin not reported) · liver 2026: chromogranin A and synaptophysin positive, no percentage · cell by cell: scattered, no separate group; real INSM1 in the liver",
      "Liver and bone: compatible with the same tumor (same main genes, FGFR1 active in both, RNA copy profile compatible with a single clone; the exome could confirm it)",
      "Almost no defences inside: a \"cold\" tumor · T lymphocytes around 1 in 100 cells in the liver, or fewer · TILs <5% in the breast tumor (2026) · PD-L1 CPS 0 in breast (2024) and liver (2026)",
      "Division rate (Ki67) · 60% breast 2024 · 40% 2026 re-read · ≈15% bone 2026 (small, decalcified sample) · not reported in the liver. Not a trend: different tissues and methods"
    ]
  },
  "limite1": {
    "es": "Esquema ilustrativo: ni la célula, ni el número de puntos, ni su posición son datos.",
    "en": "Illustrative diagram: neither the cell, the number of dots nor their position are data."
  },
  "limites": {
    "es": {
      "2": "Resultados célula a célula (estado a {fecha}): cifras del análisis de Polaris, el sistema de Miriam, sobre los datos del laboratorio, no del informe del laboratorio; dos trozos pequeños de dos lesiones.",
      "3": "El hueso se descalcifica para cortarlo y eso daña el ARN: su lectura tiene más ruido.",
      "4": "El ARN no es la proteína: lo «encendido» hay que confirmarlo con tinción en tejido.",
      "5": "Falta el exoma (WES) y el tipo de HLA: sin ellos no hay mutaciones propias del tumor ni candidatos para una terapia personalizada.",
      "6": "Las cifras de copias vienen de pruebas y muestras distintas (2024 mama, 2026 hueso, sangre) y no se comparan entre sí; las de sangre son fracciones por debajo del 2 %.",
      "7": "El PET detecta receptores de somatostatina en conjunto, sin distinguir subtipos; el ARN mide un gen concreto (SSTR2).",
      "8": "La discordancia RE 0 % en tinción del hígado frente a programa ER activo en ARN está abierta y la tiene delante su equipo médico. Nada de esta página recomienda tratamiento."
    },
    "en": {
      "2": "Cell-by-cell results (status as of {fecha}): figures from the analysis by Polaris, Miriam's system, on the lab's data, not from the lab report; two small pieces of two lesions.",
      "3": "Bone is decalcified to be cut and that damages RNA: its reading is noisier.",
      "4": "RNA is not protein: what is \"switched on\" must be confirmed by tissue staining.",
      "5": "The exome (WES) and HLA type are missing: without them there are no tumor-specific mutations nor candidates for a personalised therapy.",
      "6": "Copy figures come from different tests and samples (2024 breast, 2026 bone, blood) and are not comparable; blood figures are fractions under 2%.",
      "7": "The PET detects somatostatin receptors as a whole, without telling subtypes apart; RNA measures one specific gene (SSTR2).",
      "8": "The discordance between 0% ER staining in the liver and an active ER program in RNA is open and in front of her medical team. Nothing on this page recommends treatment."
    }
  }
}
