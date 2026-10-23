/**
 * ¿Lleva ESTA ruta el chrome mínimo? (rediseño de arquitectura, F3, 23-oct-2026)
 *
 * /links (la página de la bio de las redes) y /gracias (lo que ve quien acaba de donar) son embudos de una sola
 * acción: quien llega no va a recorrer el sitio, y un menú de cinco ítems, la barra «lo último» y un pie de cinco
 * columnas compiten con lo único que la página le pide. Con el chrome mínimo la cabecera lleva solo el logo y el
 * selector de idioma; el pie, la marca, el aviso, las redes y lo legal; y la barra «lo último» no sale.
 *
 * · `minimo`   → /links y /gracias, en los dos idiomas.
 * · `sinApoyo` → /gracias: además, sin el botón «Apoyar a Miriam» de la cabecera (quien llega ya ha donado).
 *
 * Es un composable propio y no una rama más de useSupportBarRoute: ese fichero decide solo la barra «Donar» del
 * móvil, y es el que tocan los PR abiertos de célula a célula. Aquí, como allí, la decisión es por RUTA y se
 * toma por path (robusto entre locales): en el SSR y en el cliente sale lo mismo, así que no hay salto al hidratar.
 */
export function useChromeMinimo() {
  const route = useRoute()

  const path = computed(() => route.path.replace(/\/+$/, '') || '/')

  // /links y /en/links: la ruta EN conserva el slug (no está en el mapa `pages` de nuxt.config).
  const esLinks = computed(() => /^\/(?:en\/)?links$/.test(path.value))

  // /gracias (· /en/thank-you): la ruta EN no contiene «gracias», así que se comprueban las dos.
  const sinApoyo = computed(() => path.value === '/gracias' || path.value === '/en/thank-you')

  const minimo = computed(() => esLinks.value || sinApoyo.value)

  return { minimo, sinApoyo }
}
