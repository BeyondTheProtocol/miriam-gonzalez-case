# Enlaces cortos · helpmiriam.com

Links cortos de **marca** (en nuestro propio dominio) para repartir en redes,
prensa y mensajes. Redirigen al destino real **con UTM**, así que se ven limpios
y además medimos el canal en **Umami**. Mejor que un Bitly: es tu dominio, tu
control y tu analítica.

> Se definen como `[[redirects]]` en `netlify.toml`. Cambios → requieren deploy.

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

1. Edita `netlify.toml`, añade un bloque:

   ```toml
   [[redirects]]
     from = "/caso-x"
     to = "/ciencia?utm_source=twitter&utm_medium=post&utm_campaign=actualizacion-jun"
     status = 302
   ```

2. Añádelo a la tabla de arriba.
3. Push + deploy (Netlify). Listo: ya funciona `helpmiriam.com/caso-x`.

## Cómo leerlo en Umami

Panel de Umami → filtra por **UTM Source · UTM Medium · UTM Campaign**. Cruza con
el evento `Apoyar` para ver qué canal no solo trae más visitas, sino que mejor
convierte. (Ver también `UTM-convention.md`.)
