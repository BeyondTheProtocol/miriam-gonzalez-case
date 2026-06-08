# Convención UTM · helpmiriam.com

> **Por qué:** el 71% del tráfico es social pero todos los `utm_*` llegan vacíos, así
> que la atribución depende solo del *referrer* — y Twitter llega como `t.co/…` opaco.
> Etiquetando NUESTROS propios enlaces sabremos qué canal y qué pieza traen donantes.
> (Brief P6 · `OPTIMIZACION-datos-helpmiriam.md`.)

## Regla

Añade parámetros UTM **solo a los enlaces que controlamos nosotros** (bio de Instagram,
tuits, firma de prensa, newsletters…). **Nunca** los pongas en enlaces internos del sitio
ni en los que comparten terceros — solo en los que publicamos.

```
https://helpmiriam.com/?utm_source=<dónde>&utm_medium=<tipo>&utm_campaign=<acción>
```

| Parámetro | Qué es | Valores que usamos |
|---|---|---|
| `utm_source` | la plataforma | `instagram` · `twitter` · `prensa` · `whatsapp` · `linkedin` · `newsletter` |
| `utm_medium` | el tipo de enlace | `bio` · `post` · `story` · `firma` · `perfil` · `dm` |
| `utm_campaign` | la acción/ola | `lanzamiento` · (futuras: `actualizacion-jun`, `hito-50k`…) |

Todo en **minúsculas, sin acentos ni espacios** (usa guiones). Sé consistente: Plausible
agrupa por coincidencia exacta, así que `Instagram` ≠ `instagram`.

## Plantillas listas para copiar

```
# Bio de Instagram
https://helpmiriam.com/?utm_source=instagram&utm_medium=bio&utm_campaign=lanzamiento

# Story de Instagram (con enlace)
https://helpmiriam.com/?utm_source=instagram&utm_medium=story&utm_campaign=lanzamiento

# Tuit de lanzamiento
https://helpmiriam.com/?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento

# Firma / pie en notas de prensa
https://helpmiriam.com/?utm_source=prensa&utm_medium=firma&utm_campaign=lanzamiento

# WhatsApp / difusión directa
https://helpmiriam.com/?utm_source=whatsapp&utm_medium=dm&utm_campaign=lanzamiento
```

> Para enlazar a una página concreta, pon los UTM detrás de la ruta:
> `https://helpmiriam.com/ciencia?utm_source=twitter&utm_medium=post&utm_campaign=lanzamiento`

## Cómo leerlo en Plausible

Filtros → **Sources / UTM Source · UTM Medium · UTM Campaign**. Cruza con el goal
`Apoyar` (intención de donar) para ver **qué canal convierte mejor**, no solo cuál trae
más visitas. (El importe donado no es medible desde la web — la donación ocurre en
GoFundMe; ver `plausible-donar-tracking.md`.)
