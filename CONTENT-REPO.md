# Cómo gestionar el contenido de la web

Este documento explica cómo añadir y editar contenido.
No hace falta tocar código. Solo archivos Markdown o YAML.

---

## Estructura del repo

```
content/
  es/
    timeline.yml          → cronología completa en español
    team.yml              → equipo (3 grupos: coreTeam, medicalNetwork, integrativeSupport)
    press.yml             → menciones en prensa en español
    science.yml           → datos de la página de ciencia: tratamientos, papers, panel
    historia/
      01-el-comienzo.md   → capítulo 1 → genera /historia/01-...

  en/
    timeline.yml          → cronología completa en inglés
    team.yml              → equipo en inglés
    press.yml             → menciones en prensa en inglés
    science.yml           → datos de la página de ciencia en inglés
    story/
      01-the-beginning.md → genera /en/story/01-...
```

> No es obligatorio tener todos los archivos en los dos idiomas.
> Si un capítulo solo existe en español, la web lo muestra
> en español independientemente del idioma seleccionado, con un aviso.
> Es mejor leer en español que no leer nada.

---

## 1. Timeline

El timeline usa archivos **YAML** (no Markdown). Un solo archivo por idioma.
Las entradas se añaden al final. El orden en el archivo es el orden en la web.

### Formato de una entrada (`content/es/timeline.yml`)

```yaml
  - date: "10 Abril 2026"
    title: Avalancha de puertas abiertas
    description: >
      VHIO acepta evaluar el caso. El jefe de onco-radioterapia de la Arrixaca
      lleva el caso a comité tumoral. Guardant360 realizado. GoFundMe activado.
    highlight: true
    link: https://x.com/miriamgonp
    linkLabel: Ver en X
```

### Campos

| Campo         | Obligatorio | Qué es |
|---------------|-------------|--------|
| `date`        | ✅ | Fecha o periodo. Texto libre: "Abril 2026", "8-9 Abril 2026", "2024, Diagnóstico" |
| `title`       | ✅ | Título corto del hito |
| `description` | ✅ | Descripción. Usar `>` al inicio para texto que ocupa más de una línea |
| `highlight`   | ✅ | `true` = hito importante (acento dorado). `false` = evento menor |
| `link`        | ❌ | URL opcional (tweet, publicación, noticia...) |
| `linkLabel`   | ❌ | Texto del enlace. Obligatorio si hay `link` |
| `image`       | ❌ | Ruta a imagen en `/public/img/` |

### Estructura completa del archivo

```yaml
entries:
  - date: "2024, Diagnóstico"
    title: Diagnóstico de cáncer de mama metastásico
    description: >
      Miriam ingresa por urgencias sin poder andar. Cáncer de mama ER+/HER2-
      con metástasis óseas exclusivas.
    highlight: true

  - date: "10 Abril 2026"
    title: Avalancha de puertas abiertas
    description: >
      VHIO acepta evaluar el caso. GoFundMe activado.
    highlight: true
    link: https://x.com/miriamgonp
    linkLabel: Ver en X
```

### Añadir una nueva entrada

Copiar este bloque al final de la lista (respetando la indentación de 2 espacios):

```yaml
  - date: ""
    title: ""
    description: >

    highlight: false
```

---

## 2. Historia (`content/es/historia/`)

Cada capítulo es un archivo `.md` separado. Al crear un archivo nuevo,
la web genera automáticamente una nueva página con navegación prev/next.

### Nombre del archivo

Usar número de orden + slug descriptivo:

```
01-el-comienzo.md
02-cuando-llego-el-cancer.md
03-el-equipo.md
```

El número controla el orden en el índice y la paginación.

### Formato del archivo

```markdown
---
order: 1
title: Antes del diagnóstico
subtitle: Quién es Miriam más allá del cáncer
excerpt: Una ingeniera de software, divulgadora y podcaster que llevaba años hablando de tecnología cuando el cáncer llegó.
translationKey: before-the-diagnosis
---

Una ingeniera de software. Divulgadora. Podcaster. Curiosa compulsiva.

Miriam no empezó a usar inteligencia artificial por su diagnóstico...

## Una nueva sección

El texto continúa aquí. Se puede usar **negrita**, *cursiva*, y cualquier
formato estándar de Markdown.

> Una cita si hace falta.
```

### Campos del frontmatter

| Campo            | Obligatorio | Qué es |
|------------------|-------------|--------|
| `order`          | ✅ | Número de orden para el índice y la paginación |
| `title`          | ✅ | Título del capítulo |
| `subtitle`       | ❌ | Subtítulo opcional |
| `excerpt`        | ✅ | Resumen de 1-2 frases. Aparece en el índice y en redes sociales |
| `translationKey` | ❌ | Clave compartida con la versión EN para enlazar traducciones |
| `robots`         | ❌ | Control de indexación. Ejemplo: `noindex` para capítulos en borrador |
| `sitemap`        | ❌ | Control del sitemap. Ejemplo: `{ priority: 0.8, lastmod: 2026-05-01 }` |

### Versión en inglés (`content/en/story/`)

El archivo en inglés usa el mismo número de orden pero slug en inglés:
- ES: `content/es/historia/01-el-comienzo.md`
- EN: `content/en/story/01-the-beginning.md`

Ambos deben tener el mismo `translationKey` en el frontmatter.

---

## 3. Ciencia (retirada)

Los análisis en Markdown (`content/es/ciencia/`, `content/en/science/`) y la ruta `/ciencia/[slug]` se
retiraron el 23-oct-2026: nunca llegó a publicarse ningún artículo. La página de ciencia sale de
`app/pages/ciencia/` y de los datos de la sección 6.

---

## 4. Equipo (`content/es/team.yml` / `content/en/team.yml`)

El equipo se gestiona en archivos YAML, uno por idioma. Hay tres grupos:
- `coreTeam` — equipo principal
- `medicalNetwork` — red médica
- `integrativeSupport` — apoyo integrador (oncología metabólica, ejercicio, nutrición, psicología...)

### Añadir un miembro

Añadir un objeto al grupo correspondiente en `content/es/team.yml` (y su traducción en `content/en/team.yml`):

```yaml
- role: Título profesional (Ciudad/País)
  description: Lo que aporta al caso.
  icon: ph:icon-name-fill
  color: gold  # o ocean o ink
```

### Colores disponibles

| Color   | Uso |
|---------|-----|
| `gold`  | Roles clave o con alta visibilidad |
| `ocean` | Perfiles técnicos o científicos |
| `ink`   | Roles de apoyo o contexto |

---

## 5. Prensa (`content/es/press.yml` / `content/en/press.yml`)

### Añadir una mención

```yaml
articles:
  - outlet: Nombre del medio
    url: https://...
    title: Titular del artículo
```

---

## 6. Datos de ciencia (`content/es/science.yml` / `content/en/science.yml`)

Este archivo contiene los datos estructurados que alimentan la página de ciencia:
tratamientos recibidos, papers de referencia, y filas del panel de rebiopsia.

### Sección `treatments`

```yaml
treatments:
  - line: 1L
    regimen: Letrozol + Ribociclib + Zoladex + ác. zoledrónico
    outcome: Descripción del resultado.
    active: false  # true si es la línea actual
```

### Sección `papers`

```yaml
papers:
  - ref: 'Autor et al., año — Revista'
    finding: Qué se encontró
    relevance: Por qué es relevante para el caso de Míriam
    link: 'https://doi.org/...'  # null si no hay enlace
```

### Sección `panelRows`

```yaml
panelRows:
  - component: NGS amplio (tejido)
    method: Panel ≥500 genes
    targets: 'ESR1, PIK3CA, FGFR1-4, CCND1'
    implication: Selección de terapia/ensayo por biomarcador
```

---

## Datos clínicos que NO deben modificarse

Los siguientes valores son médicamente verificados. Cualquier corrección
debe consultarse con el equipo médico antes de cambiar:

| Dato | Valor correcto |
|------|----------------|
| Amplificación FGFR1 | **×13** (no ×12, no ×14) |
| Amplificación CCND1 | **×20** |
| Amplificación FGF3/FGF4/FGF19 | **×18** |
| Diferenciación neuroendocrina | **~80%** (no 70%, no 90%) |
| Ki67 inicial | **60%** |
| HER2 | **negativo (0)** |
| ECOG actual | **0** (abril 2026) |

---

## SEO por capítulo

Los archivos `.md` de `historia/` aceptan campos SEO en el frontmatter:

```markdown
---
title: Mi capítulo
robots: noindex        # evita indexación (útil para borradores)
sitemap:
  priority: 0.8        # prioridad en el sitemap (0.0–1.0)
  lastmod: 2026-05-01  # fecha de última modificación
---
```

El `robots.txt` general lo gestiona automáticamente el módulo `nuxt-robots`.
No editar ni crear `public/robots.txt` — el archivo fuente es `public/_robots.txt`.

---

## Flujo para publicar contenido nuevo

1. Crear o editar el archivo correspondiente en este repo
2. Hacer commit y push a `main`
3. La web se regenera automáticamente en los siguientes minutos

No hace falta hacer nada más.
