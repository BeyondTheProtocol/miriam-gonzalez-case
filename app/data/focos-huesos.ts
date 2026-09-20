/**
 * De qué hueso habla cada foco del informe, para colocarlo sobre el esqueleto REAL.
 *
 * Antes cada foco llevaba una x/y escrita a mano sobre un esqueleto dibujado. Ahora la
 * posición sale del centroide de su propio hueso, segmentado de su TC. Esta tabla es el único
 * sitio donde se dice qué hueso nombra cada foco, y sale literalmente del campo `level` del
 * mapa de metástasis: no se interpreta nada aquí.
 *
 * Los nombres son los de TotalSegmentator, que es lo que produce `tools/visor3d.py esqueleto`.
 */
export const HUESO_DE_FOCO: Record<number, string> = {
  1: 'vertebrae_C3',    // C3 · apófisis espinosa
  2: 'vertebrae_C4',    // C4 · lámina / arco derecho
  3: 'scapula_right',   // escápula derecha
  4: 'vertebrae_T1',    // D1 (T1) · cuerpo vertebral
  5: 'vertebrae_T5',    // D5 (T5) · cuerpo vertebral
  6: 'vertebrae_T9',    // D9 (T9) · cuerpo derecho
  7: 'vertebrae_T11',   // D11 (T11) · cuerpo vertebral
  8: 'vertebrae_T11',   // D11 (T11) · pedículo izquierdo
  9: 'vertebrae_L1',    // L1 · apófisis espinosa
  10: 'vertebrae_L1',   // L1 · pedículo izquierdo
  11: 'vertebrae_L5',   // L5 · cuerpo vertebral
  12: 'sacrum',         // ala sacra derecha
  13: 'hip_right',      // ilíaco derecho · ala ilíaca
  14: 'hip_right',      // ilíaco derecho supraacetabular
  15: 'hip_left',       // ilíaco izquierdo supraacetabular
  16: 'femur_right',    // fémur proximal derecho
  17: 'rib_right_3',    // tórax alto / costilla
  18: 'hip_right',      // ilíaco derecho · unión ilíaco-femoral
  19: 'vertebrae_T1',   // C7-D2 · transición cervicotorácica
}

/**
 * Desplazamiento dentro del hueso, en fracción del ancho de la imagen.
 *
 * Varios focos comparten hueso (el cuerpo y el pedículo de la misma vértebra, los tres del
 * ilíaco derecho) y el centroide es uno solo: sin esto se taparían entre ellos. El signo lo
 * dice el informe —«pedículo izquierdo», «cuerpo derecho»— y en vista anterior la izquierda
 * del cuerpo cae a la DERECHA de quien mira. Es separación para poder verlos y pincharlos,
 * no una medida de dónde está la lesión dentro del hueso.
 */
export const DESPLAZA: Record<number, [number, number]> = {
  6: [-0.018, 0],      // D9 · cuerpo DERECHO → a la izquierda de la imagen
  8: [0.028, 0],       // D11 · pedículo IZQUIERDO → a la derecha de la imagen
  10: [0.028, 0.004],  // L1 · pedículo IZQUIERDO
  12: [-0.018, 0.008], // ala sacra DERECHA
  13: [-0.03, -0.022], // ilíaco derecho · ala (arriba)
  14: [-0.012, 0.022], // ilíaco derecho · supraacetabular (abajo)
  18: [-0.034, 0.004], // ilíaco derecho · unión ilíaco-femoral
  19: [0.022, -0.012], // C7-D2 · transición, por encima de D1
}
