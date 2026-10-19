/**
 * Estado «Copiado» atado a UN grupo de botones (pase de diseño del 19-oct sobre el PR #300): el aviso sale junto a lo
 * que se copió, no en otro sitio de la tarjeta. Se vacía y se vuelve a poner en el siguiente tick, para que el lector de
 * pantalla lo anuncie aunque se pulse dos veces el mismo botón; se borra solo a los 4 s y con `reinicia()` (al cambiar
 * de gen o de biopsia el mensaje del anterior no se queda).
 */
export function useCopiado() {
  const estado = ref('')
  let t: ReturnType<typeof setTimeout> | null = null
  async function copia(texto: string, ok: string, falla: string) {
    if (t) clearTimeout(t)
    estado.value = ''
    await nextTick()
    try { await navigator.clipboard.writeText(texto); estado.value = ok }
    catch { estado.value = falla }
    t = setTimeout(() => { estado.value = '' }, 4000)
  }
  function reinicia() { if (t) clearTimeout(t); estado.value = '' }
  onBeforeUnmount(() => { if (t) clearTimeout(t) })
  return { estado, copia, reinicia }
}
