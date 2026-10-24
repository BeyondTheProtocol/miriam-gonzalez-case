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

  en/
    timeline.yml          → cronología completa en inglés
    team.yml              → equipo en inglés
    press.yml             → menciones en prensa en inglés
    science.yml           → datos de la página de ciencia en inglés
```

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

## 2. Historia

La página `/historia` (un aviso de «en preparación» y cuatro párrafos) está viva. Las carpetas `content/es/historia/` y
`content/en/story/` (con el capítulo 1, vacío) se retiraron el 23-oct-2026, en el rediseño de arquitectura (fase F4), que
además redirigió `/historia` a `/timeline`; el 24-oct-2026 (T2a) se quitó ese redirect, porque Umami mostró que 184 de sus 191
entradas llegan de Google. No hay capítulos: `/historia/01-el-comienzo` sigue con su 301 a `/timeline`. Cuando haya texto, va en
`app/pages/historia/index.vue` (o se recuperan `[slug].vue` y las colecciones del historial de git, commit anterior a
`rediseno(F4)`); ver «Alba's Text (Story)» en AGENTS.md.

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

## SEO

Hoy no queda ninguna colección de páginas en Markdown, así que no hay frontmatter SEO que editar (las colecciones
de YAML —cronología, equipo, prensa, ciencia— no son páginas). El SEO de cada página vive en su `.vue`
(`useSeoMeta`); para pasar una página a `noindex` o al revés, ver la nota «Hacer PÚBLICA una página» en `nuxt.config.ts`.

El `robots.txt` general lo gestiona automáticamente el módulo `nuxt-robots`.
No editar ni crear `public/robots.txt` — el archivo fuente es `public/_robots.txt`.

---

## Flujo para publicar contenido nuevo

1. Crear o editar el archivo correspondiente en este repo
2. Hacer commit y push a `main`
3. La web se regenera automáticamente en los siguientes minutos

No hace falta hacer nada más.
