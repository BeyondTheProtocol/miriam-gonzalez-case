/**
 * Medición de Umami, segunda parte: el ciclo de vida de lo que se VE y la entrada de la sesión (23-oct-2026).
 * Qué es cada cosa y por qué: app/utils/umamiVistas.ts. Aquí solo se enchufa a Nuxt, y sin tocar
 * plugins/umami-delegado.client.ts (clics y scroll), que otra rama comparte tal cual.
 *
 * - Otra página es otra vista: los avisos «una vez por vista» empiezan de cero en `page:start`.
 * - `entrada` = la primera página de la sesión. Se fija cuando el router resuelve la ruta inicial (no antes: al
 *   montar el plugin la ruta aún es la de arranque y daría un nombre vacío) y solo una vez; el resto del
 *   recorrido no la cambia.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  nuxtApp.hook('page:start', () => reiniciarVistas())

  void router.isReady().then(() => {
    fijarEntrada(paginaBase(router.currentRoute.value.name))
  })
})
