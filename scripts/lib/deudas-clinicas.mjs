// Las seis deudas del cotejo de cifras de la web contra los informes (23-oct-2026), con los textos literales del comité médico (24-oct-2026).
// UNA sola definición para los dos tests que las vigilan: scripts/test-afirmaciones-clinicas.mjs (el FUENTE, sin build, en lint.yml) y
// scripts/test-ciencia-pro.ts (el HTML generado de todas las páginas). Si un patrón cambia, cambia en los dos.
// Cada deuda lleva un texto MALO (el patrón tiene que casar: si no, el test es decorativo) y uno BUENO (no puede casar: prohibiría la corrección).
// Cada patrón es CLASE y no ejemplo: pilla la afirmación sea cual sea el sitio en que reaparezca (copy, glosario, JSON de datos, yml).
export const DEUDAS = [
  {
    id: 'web-ne-80-del-tumor',
    // «~80 % del tumor» / «80 % de diferenciación neuroendocrina» / «CgA y Syn ~80 %»: la cifra es del 80 % de las CÉLULAS NEOPLÁSICAS de la
    // biopsia de 2024; en 2026 la expresión es focal y heterogénea. Ninguna página dice «el 80 % del tumor».
    re: /80\s?%\s*(?:del\s+tumor|de\s+(?:la\s+)?diferenciaci[oó]n|of\s+the\s+tumou?r|neuroendocrine\s+differentiation|of\s+neuroendocrine)|(?:diferenciaci[oó]n\s+neuroendocrina|neuroendocrine\s+differentiation)[^.\n]{0,24}~\s?80\s?%|~\s?80\s?%\s+(?:de\s+)?(?:diferenciaci|neuroendocrine)|CgA (?:y|and) Syn ~\s?80/i,
    por: 'el 80 % es de las células neoplásicas de la biopsia de 2024 (en 2026 la expresión es focal y heterogénea), no «del tumor»',
    malo: 'En el microscopio, ~80% del tumor muestra diferenciación neuroendocrina',
    bueno: 'el 80 % de las células neoplásicas expresaban cromogranina y sinaptofisina',
  },
  {
    id: 'web-oms-2019-entidad-propia',
    // La OMS 2019 reserva «neoplasia neuroendocrina de mama» para más del 90 % de células neuroendocrinas; este tumor es un carcinoma NST con
    // diferenciación NE, fuera de esa categoría. Y el pronóstico no coincide entre series: no se afirma «peor pronóstico».
    re: /reconoce las neoplasias neuroendocrinas de mama|recognized breast neuroendocrine neoplasms|(?:subtipo h[ií]brido|hybrid subtype)[^.\n]{0,60}(?:peor pron[oó]stico|worse prognosis)|BC-NED[^.\n]{0,60}peor pron[oó]stico/i,
    por: 'la OMS 2019 reserva la categoría para más del 90 % de células neuroendocrinas: este es un carcinoma NST con diferenciación NE, y el pronóstico no coincide entre series',
    malo: 'la OMS reconoce las neoplasias neuroendocrinas de mama como entidad propia desde su clasificación de 2019, y la literatura indica que este subtipo híbrido (BC-NED) tiene peor pronóstico',
    bueno: 'La clasificación de la OMS de 2019 reserva «neoplasia neuroendocrina de mama» para los tumores con más del 90 % de células neuroendocrinas',
  },
  {
    id: 'web-fgfr1-unidad-x',
    // «×13» se lee «trece veces», y 13 y 33 copias salen de plataformas, muestras y purezas distintas: se dicen en copias y con su nota, no con «×».
    // Solo gen + «×N» (a menos de 20 caracteres): «25×18×18» del mapa de metástasis son milímetros, no copias.
    re: /(?:FGFR1|CCND1|FGF3)[^\n]{0,20}(?:×|(?<![A-Za-z0-9&#])x)\s?\d+|(?:×|(?<![A-Za-z0-9&#])x)\s?\d+\s+(?:y|and)\s+(?:×|(?<![A-Za-z0-9&#])x)\s?\d+|\b33\s+(?:y|and)\s+37\s+cop|≈\s?3[37]\s+cop/,
    por: 'copias, no «×N»: 13 copias (primario 2024, TSO500) y 33/37 (fichero de investigación de FoundationOne) no se comparan entre sí',
    malo: 'FGFR1 amplificado ×13, CCND1 ×20, FGF3/4/19 ×18',
    bueno: '13 copias (primario 2024) · amplificado (hueso 2026; 33 copias en el fichero de investigación)',
  },
  {
    id: 'web-sinaptofisina-laminilla-sin-documento',
    // La revisión de la laminilla del 29-sep-2026 es lo DICHO en una reunión: sin informe escrito ni aclaración pedida al hospital.
    re: /la laminilla se revis[oó] despu[eé]s y confirma la expresi[oó]n|la entrada «negativa» es un error del informe|the slide was reviewed afterwards and confirms expression|the “negative” entry is an error in the report/i,
    por: 'la revisión de la laminilla es «dicha» (reunión del 29-sep-2026), sin informe escrito: no se afirma que la entrada «negativa» sea un error del informe',
    malo: 'la laminilla se revisó después y confirma la expresión, así que la entrada «negativa» es un error del informe',
    bueno: 'La laminilla se revisó en una reunión del 29 de septiembre de 2026 y, según lo dicho en ella, confirma la expresión; no hay informe escrito',
  },
  {
    id: 'web-recist-dianas-incompletas',
    // El RECIST del ensayo anterior tenía CUATRO dianas (hígado s.II y s.IVb, mama, vértebra dorsal), suma 68 → 74 mm. Y la lesión biopsiada
    // del hígado (segmento IVa, 2,2 cm) no se dice «no diana» sin más.
    re: /RECIST daba enfermedad estable \(\+8,8\s?%;|RECIST read stable disease \(\+8\.8%;|lesiones diana del h[ií]gado de 18 a 20 mm|liver target lesions from 18 to\s+20 mm|no es una de las lesiones diana del RECIST|not one of the RECIST target lesions/i,
    por: 'RECIST 1.1 de la 3L: cuatro dianas, suma 68 → 74 mm (+8,8 %), con las cuatro lesiones nombradas',
    malo: 'RECIST daba enfermedad estable (+8,8 %; lesiones diana del hígado de 18 a 20 mm y de 15 a 19 mm)',
    bueno: 'por RECIST 1.1 era enfermedad estable (suma de las cuatro dianas 68 → 74 mm, +8,8 %, sin lesiones nuevas',
  },
  {
    id: 'web-goserelina-fin-28-may',
    // El fulvestrant llegó hasta el 28-may-2026; la goserelina CONTINÚA (última dosis documentada 08-sep-2026).
    re: /Fulvestrant y Zoladex\s+siguen hasta el 28\/05\/2026|Fulvestrant and Zoladex continue\s+until 28 May 2026|Zoladex (?:termina|acaba|hasta) el 28/i,
    por: 'la goserelina continúa (última dosis documentada: 08/09/2026); solo el fulvestrant llega hasta el 28/05/2026',
    malo: 'Fulvestrant y Zoladex siguen hasta el 28/05/2026',
    bueno: 'El fulvestrant sigue hasta el 28/05/2026; la goserelina continúa',
  },
]
