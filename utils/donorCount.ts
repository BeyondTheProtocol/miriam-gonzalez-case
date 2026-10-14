/**
 * Nº de donantes que se MUESTRA como total.
 *
 * /donations.json devuelve como mucho 500 (privacidad y peso), así que la longitud de esa
 * lista NO es el total. El total real es el de /fundraiser.json (`donationCount`). Si no ha
 * llegado (o es menor que lo que ya hay en la lista, p. ej. caché desfasada), se usa la lista.
 */
export function resolveDonorCount(official: number | null | undefined, listed: number): number {
  if (typeof official !== 'number' || !Number.isFinite(official)) return listed
  return Math.max(Math.floor(official), listed)
}
