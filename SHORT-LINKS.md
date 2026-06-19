# Enlaces cortos · helpmiriam.com

Links cortos de **marca** (en nuestro propio dominio) para repartir en redes,
prensa y mensajes. Redirigen al destino real **con UTM**, así que se ven limpios
y además medimos el canal en **Umami**. Mejor que un Bitly: es tu dominio, tu
control y tu analítica.

> Se definen como `routeRules` en **`nuxt.config.ts`** (no en `netlify.toml`).
> Cambios → requieren deploy.
>
> **¿Por qué no en `netlify.toml`?** `nuxt generate` produce un `dist/_redirects`
> que acaba con un catch-all `/* /404.html 404`. Netlify procesa el fichero
> `_redirects` **antes** que `netlify.toml`, así que ese catch-all interceptaba
> los enlaces cortos y devolvía **404** (ni `force=true` lo arreglaba: `force`
> solo gana a un fichero del mismo nombre, no a una regla previa del propio
> `_redirects`). Como `routeRules`, nitro escribe las reglas 302 en `_redirects`
> **antes** del catch-all, así que ganan. Además se **excluyen del prerender**
> (`nitro.prerender.ignore`) para que no se genere un `.html` de meta-refresh que
> «sombrearía» el 302 (regla de _shadowing_ de Netlify). Detalle en los
> comentarios de `nuxt.config.ts`.

## Cómo funciona

`helpmiriam.com/3d-x` → redirige (302) a
`helpmiriam.com/mapa-metastasis?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento-herramienta`

- **302 (temporal)** a propósito: permite repuntar o re-etiquetar un link sin que
  quede cacheado de forma permanente en los navegadores.
- El UTM viaja en el destino → **Umami** lo registra (Campañas / UTM).

## Convención de nombres

```
/<slug>        → versión genérica (utm_source=short&utm_medium=link)
/<slug>-x      → X / Twitter   (utm_source=twitter&utm_medium=post)
/<slug>-in     → LinkedIn      (utm_source=linkedin&utm_medium=post)
/<slug>-ig     → Instagram     (utm_source=instagram&utm_medium=bio)
```

- `slug` = corto y memorable (`3d`, `caso`, `marcas`…).
- `utm_campaign` = la ola/acción (p. ej. `lanzamiento-herramienta`).
- Todo en **minúsculas, sin acentos ni espacios** (igual que `UTM-convention.md`;
  Umami agrupa por coincidencia exacta).

## Enlaces activos

| Link corto | Destino | Campaña |
|---|---|---|
| `/3d` | `/mapa-metastasis` | `lanzamiento-herramienta` (genérico) |
| `/3d-x` | `/mapa-metastasis` | `lanzamiento-herramienta` (X) |
| `/3d-in` | `/mapa-metastasis` | `lanzamiento-herramienta` (LinkedIn) |
| `/3d-ig` | `/mapa-metastasis` | `lanzamiento-herramienta` (Instagram/bio) |
| `/donar` | GoFundMe (externo) | — (sin UTM: salto externo, no medible en Umami) |

## Cómo añadir uno nuevo

1. En `nuxt.config.ts`, añade la regla dentro de `routeRules`:

   ```ts
   routeRules: {
     // …
     '/caso-x': { redirect: { to: '/ciencia?utm_source=twitter&utm_medium=post&utm_campaign=actualizacion-jun', statusCode: 302 } },
   },
   ```

2. Añade la **misma ruta** a `nitro.prerender.ignore` (para que no se genere su
   `.html` y gane el 302 limpio):

   ```ts
   ignore: [ /* … */ '/caso-x' ],
   ```

3. Añádelo a la tabla de arriba.
4. Verifica local: `pnpm generate` y comprueba que en `dist/_redirects` la regla
   `/caso-x … 302` aparece **antes** del catch-all `/*` y que **no** existe
   `dist/caso-x.html`.
5. Push + deploy (Netlify). Listo: ya funciona `helpmiriam.com/caso-x`.

## Cómo leerlo en Umami

Panel de Umami → filtra por **UTM Source · UTM Medium · UTM Campaign**. Cruza con
el evento `Apoyar` para ver qué canal no solo trae más visitas, sino que mejor
convierte. (Ver también `UTM-convention.md`.)
