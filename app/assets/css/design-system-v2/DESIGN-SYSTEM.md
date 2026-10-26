# Sistema de diseño de helpmiriam.com (v3)

Este documento dice cómo se construye la web: qué tokens hay, qué componente se usa para cada cosa y qué no se hace nunca.
Es corto a propósito en la prosa y exhaustivo en las tablas, porque las tablas las genera el código.

- **Antes de tocar la interfaz:** lee este documento y la guía viva (`/guia-de-estilo`).
- **Antes de abrir el PR:** `pnpm test:diseno`. Si baja un recuento, `pnpm test:diseno --actualizar`. Si sube, se arregla o se firma una excepción (sección 8).
- **Si añades un token:** va en `btp-tokens.css` y luego `pnpm gen:design-doc`.

## 0. Qué manda

Cuando dos cosas discrepan, gana la primera de esta lista:

1. **Lo medido en la home.** Es la referencia visual. Si la home y un token discrepan, se ajusta el token y se anota en el registro de cambios (sección 11).
2. **`btp-tokens.css`.** Es el canon: ya no es una copia de ningún otro fichero.
3. **Este documento.** Las tablas de tokens y de utilidades salen del canon y de `tailwind.config.js`; no se editan a mano.
4. **La guía viva** (`app/pages/guia-de-estilo.vue`, noindex). Pinta los componentes reales: si un componente cambia, la guía cambia sola.

La copia pública de los tokens (`public/design-system/tokens.css`) es idéntica byte a byte al canon y la escribe el mismo generador. `/design-system/` redirige a la guía viva.

## 1. Tokens

Cinco colores y dos derivados son los únicos átomos de color. Todo lo demás (estados, velos, trazos, escena) se deriva con `color-mix()`. **No se añade ni un hex nuevo.** Las únicas excepciones firmadas están en la sección 8.

Los componentes no pintan con la paleta: pintan con **roles** (`--fondo`, `--superficie`, `--texto-1`, `--texto-2`, `--texto-3`, `--identidad`, `--marcador`, `--anillo-foco`, `--cta-texto`, `--trazo-*`). Una banda con `data-tema="oscuro"` los remapea, y el componente no se entera. Por eso un token derivado de un rol se declara también bajo `[data-tema="oscuro"]`: una variable que apunta a otra se resuelve donde se declara.

Los puntos de ruptura son los de Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. No hay tokens de breakpoint (los `--bp-*` de la v2 no los leía nadie).

### Tokens del canon

Generado desde `btp-tokens.css`. Un token que nadie lee se borra: `pnpm test:diseno` lo marca.

<!-- GENERADO:TOKENS:INICIO (scripts/gen-design-doc.ts; no se edita a mano) -->

#### Paleta

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--color-bg` | `#faf6f0` |  | Crema — fondo claro siempre (nunca blanco) |
| `--color-bg-card` | `#f5efe6` |  | Crema profunda — superficies elevadas |
| `--color-text` | `#2d1b3d` |  | Berenjena — texto/trazo/fondo oscuro (nunca negro) |
| `--color-text-soft` | `#3a3340` |  | Tinta — texto secundario |
| `--color-miriam` | `#9d44ab` |  | Violeta FIRMA — validado por Ceci/MCP: 5.07:1 sobre crema y 4.77:1 sobre tarjeta elevada = AA-normal en AMBAS. Gana a #a44db2 (4.55/4.29 = solo AA-large). Producción sirve aún #a44db2 → alinear vía PR. |
| `--color-miriam-soft` | `#e8d4ed` |  | Violeta soft — fondo de badges |
| `--color-cta` | `#ff6b47` |  | Coral — SOLO acción (nunca porta significado sobre crema) |
| `--color-cta-hover` | `#e5573a` |  |  |

#### Derivados oficiales

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--color-miriam-claro` | `#c77dd2` |  | Violeta sobre fondo oscuro (berenjena); NUNCA sobre crema |
| `--cielo-resplandor` | `#3a2450` |  | SOLO fondos de "cielo" (universo constelación) |

#### Estados derivados

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--cta-active` | `color-mix(in srgb, var(--color-cta) 85%, var(--color-text))` |  |  |
| `--miriam-hover` | `color-mix(in srgb, var(--color-miriam) 88%, var(--color-text))` | `color-mix(in srgb, var(--color-miriam-claro) 88%, var(--color-bg))` |  |
| `--miriam-active` | `color-mix(in srgb, var(--color-miriam) 78%, var(--color-text))` | `color-mix(in srgb, var(--color-miriam-claro) 78%, var(--color-bg))` |  |
| `--secundario-hover` | `color-mix(in srgb, var(--color-text) 6%, transparent)` | `color-mix(in srgb, var(--color-bg) 8%, transparent)` |  |
| `--seleccionado-bg` | `var(--color-miriam-soft)` |  |  |
| `--seleccionado-text` | `var(--color-text)` |  |  |
| `--btn-dark-hover` | `color-mix(in srgb, var(--color-text) 84%, var(--color-miriam))` |  | #3f224f; antes #3d2752 escrito a mano |

#### Velos

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--velo-berenjena-60` | `color-mix(in srgb, var(--color-text) 60%, transparent)` |  | backdrop de dialog |

#### Sombra

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--sombra-flotante` | `0 0 0 1px color-mix(in srgb, var(--color-text) 6%, transparent), 0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent), 0 8px 24px color-mix(in srgb, var(--color-text) 6%, transparent)` |  |  |
| `--sombra-hover` | `0 14px 34px color-mix(in srgb, var(--color-text) 10%, transparent)` |  |  |
| `--sombra-dura` | `6px 6px 0 color-mix(in srgb, var(--color-text) 90%, transparent)` |  |  |
| `--sombra-dura-hover` | `8px 8px 0 color-mix(in srgb, var(--color-text) 90%, transparent)` |  |  |

#### Tipografía

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--font-display` | `'Fraunces', Georgia, serif` |  | italic = gesto de firma (eyebrow) |
| `--font-body` | `'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif` |  | cuerpo/UI: elección del tipógrafo (9-jul) — auto-hospedada, no system-ui |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` |  | SOLO datos tabulares |
| `--texto-2xs` | `12px` |  | RESERVADO a mono en mayúsculas (.eyebrow, .etiqueta, ejes de gráfico). Nunca prosa. |
| `--texto-xs` | `13px` |  |  |
| `--texto-sm` | `15px` |  |  |
| `--texto-ui` | `16px` |  | cuerpo de tarjetas y UI: lo que usa la home |
| `--texto-base` | `17px` |  |  |
| `--texto-lg` | `clamp(19px, 1.6vw, 21px)` |  |  |
| `--texto-xl` | `clamp(22px, 2.2vw, 26px)` |  |  |
| `--texto-3xl` | `clamp(32px, 4.2vw, 44px)` |  | cifra grande (--tipo-cifra) |

#### Espaciado

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--sp-4` | `4px` |  |  |
| `--sp-8` | `8px` |  |  |
| `--sp-12` | `12px` |  |  |
| `--sp-16` | `16px` |  |  |
| `--sp-24` | `24px` |  |  |
| `--sp-32` | `32px` |  |  |
| `--sp-48` | `48px` |  |  |
| `--sp-64` | `64px` |  |  |

#### Radios

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--radius-sm` | `6px` |  |  |
| `--radius-md` | `8px` |  |  |
| `--radius-btn` | `12px` |  |  |
| `--radius-card` | `16px` |  |  |
| `--radius-pill` | `9999px` |  |  |

#### Movimiento

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--dur-micro` | `150ms` |  | hovers, focos |
| `--dur-transicion` | `300ms` |  | entradas, toasts, dialog |
| `--curva-salida` | `cubic-bezier(0.22, 1, 0.36, 1)` |  |  |
| `--curva-entrada` | `cubic-bezier(0.16, 1, 0.3, 1)` |  |  |
| `--dur-explica` | `450ms` |  |  |
| `--curva-mover` | `cubic-bezier(0.77, 0, 0.175, 1)` |  |  |

#### Lectura

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--measure` | `68ch` |  | valor mío para Hanken a 17 px (inferencia, sin probar con lectores). MEDIDO (26-oct-2026): da de 81 a 90 caracteres por línea con Hanken a 13 a 16 px, no los 75 o menos que daría 58ch; se baja a 58ch cuando entre el PR #290 (DS sección 8, punto d) |

#### Retícula

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--shell-max` | `75rem` |  | 1200 px: ancho único de cabecera, cuerpo y pie (.section-wide) |
| `--gutter` | `1.5rem` |  | 24 px; 32 desde 640 y 48 desde 1024 (abajo, tras los roles) |
| `--control-min` | `44px` |  | táctil mínimo y alto de campo |
| `--cabecera-alto` | `4.0625rem` |  | 65 px: la cabecera fija sola en móvil; 73 desde 640. app/plugins/cabecera-alto.client.ts lo sustituye por el real (con la barra «lo último» llega a +38) |

#### Tipografía compuesta

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--tipo-h1` | `600 clamp(1.875rem, 1.2rem + 2.8vw, 3rem)/1.08 var(--font-display)` |  | H1 de página: 30 a 48 px |
| `--tipo-hero` | `600 clamp(1.75rem, 1.1rem + 2.6vw, 2.875rem)/1.08 var(--font-display)` |  | hero y /marcas: 28 a 46 px |
| `--tipo-h2` | `600 clamp(1.875rem, 1.45rem + 1.7vw, 2.25rem)/1.12 var(--font-display)` |  | H2 de sección: 30 a 36 px; manda la home (D1) |
| `--tipo-h3` | `600 clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)/1.2 var(--font-display)` |  | H3 de sección: 20 a 24 px |
| `--tipo-h2-declaracion` | `600 clamp(1.875rem, 1.2rem + 2.8vw, 3rem)/1.1 var(--font-display)` |  | «Dónde estamos»: 30 a 48 px; máximo uno por página |
| `--tipo-h4` | `700 var(--texto-base)/1.3 var(--font-body)` |  | título de tarjeta |
| `--tipo-prosa` | `400 var(--texto-base)/1.6 var(--font-body)` |  | lectura larga: 17/1.6 |
| `--tipo-ui` | `400 var(--texto-ui)/1.5 var(--font-body)` |  | tarjetas y UI: 16/1.5 (la home) |
| `--tipo-body` | `var(--tipo-prosa)` |  | alias heredado de --tipo-prosa: no lo uses en código nuevo |
| `--tipo-body-sm` | `400 var(--texto-sm)/1.5 var(--font-body)` |  |  |
| `--tipo-cifra` | `700 var(--texto-3xl)/1 var(--font-display)` |  | «Cifra Fraunces» |
| `--tipo-eyebrow` | `500 var(--texto-2xs)/1.55 var(--font-mono)` |  | mono en mayúsculas, 12 px |
| `--tipo-etiqueta` | `600 var(--texto-2xs)/1.4 var(--font-mono)` |  | kicker de tarjeta o control, 12 px |
| `--track-eyebrow` | `0.12em` |  | versalitas espaciadas: único recurso «de sistema» |
| `--track-etiqueta` | `0.1em` |  |  |
| `--track-titular` | `-0.03em` |  | H1, H2 y hero: la home lo escribía en línea, seis veces |
| `--track-cifra` | `-0.02em` |  | display grande: tracking negativo |

#### Data-viz clínica

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--viz-eje` | `var(--trazo-fuerte)` |  |  |
| `--viz-rejilla` | `var(--trazo-sutil)` |  |  |
| `--viz-tooltip-bg` | `var(--color-text)` |  |  |
| `--viz-tooltip-text` | `var(--color-bg)` |  |  |
| `--viz-div-1` | `var(--color-text)` |  |  |
| `--viz-div-2` | `color-mix(in srgb, var(--color-text) 55%, var(--color-bg))` |  |  |
| `--viz-div-3` | `color-mix(in srgb, var(--color-text) 22%, var(--color-bg))` |  |  |
| `--viz-div-mid` | `var(--color-bg-card)` |  |  |
| `--viz-div-5` | `color-mix(in srgb, var(--color-cta) 32%, var(--color-bg))` |  |  |
| `--viz-div-6` | `color-mix(in srgb, var(--color-cta) 62%, var(--color-bg))` |  |  |
| `--viz-div-7` | `var(--color-cta)` |  |  |
| `--viz-sev-1` | `color-mix(in srgb, var(--color-miriam) 16%, var(--color-bg))` |  |  |
| `--viz-sev-2` | `color-mix(in srgb, var(--color-miriam) 38%, var(--color-bg))` |  |  |
| `--viz-sev-3` | `color-mix(in srgb, var(--color-miriam) 60%, var(--color-bg))` |  |  |
| `--viz-sev-4` | `color-mix(in srgb, var(--color-miriam) 82%, var(--color-bg))` |  |  |
| `--viz-sev-5` | `var(--color-miriam)` |  |  |
| `--viz-cat-frio-1` | `#3f7986; --viz-cat-frio-1-osc: #5595a3` |  |  |
| `--viz-cat-frio-2` | `#788fb3; --viz-cat-frio-2-osc: #5e769b` |  |  |
| `--viz-cat-frio-3` | `#5c758a; --viz-cat-frio-3-osc: #738ea4` |  |  |
| `--viz-cat-frio-4` | `#6d9098; --viz-cat-frio-4-osc: #53767f` |  |  |
| `--viz-cat-tierra-1` | `#9b8b7b; --viz-cat-tierra-1-osc: #7c6c5d` |  |  |
| `--viz-cat-tierra-2` | `#ab7f61; --viz-cat-tierra-2-osc: #996e51` |  |  |
| `--viz-cat-tierra-3` | `#896b4d; --viz-cat-tierra-3-osc: #a88a6c` |  |  |

#### ROLES SEMÁNTICOS POR TEMA

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--fondo` | `var(--color-bg)` | `var(--color-text)` |  |
| `--superficie` | `var(--color-bg-card)` | `color-mix(in srgb, var(--color-text) 88%, var(--color-bg))` |  |
| `--texto-1` | `var(--color-text)` | `var(--color-bg)` | texto principal |
| `--texto-2` | `var(--color-text-soft)` | `color-mix(in srgb, var(--color-bg) 78%, transparent)` | texto secundario |
| `--texto-3` | `color-mix(in srgb, var(--color-text-soft) 72%, var(--color-bg))` | `color-mix(in srgb, var(--color-bg) 58%, transparent)` | terciario / mute — 72% = 4.9:1 AA verificado (62% daba 3.7, fallaba) |
| `--identidad` | `var(--color-miriam)` | `var(--color-miriam-claro)` | violeta que porta identidad sobre este fondo |
| `--anillo-foco` | `var(--color-miriam)` | `var(--color-miriam-claro)` |  |
| `--marcador` | `var(--color-miriam-soft)` | `color-mix(in srgb, var(--color-miriam-claro) 30%, var(--color-text))` | resaltado «de rotulador» de un enlace al pasar o enfocar; el texto encima es --texto-1 |
| `--cta-texto` | `var(--color-text)` | `var(--color-cta)` |  |
| `--trazo-sutil` | `color-mix(in srgb, var(--color-text) 8%, transparent)` | `color-mix(in srgb, var(--color-bg) 10%, transparent)` |  |
| `--trazo-medio` | `color-mix(in srgb, var(--color-text) 12%, transparent)` | `color-mix(in srgb, var(--color-bg) 16%, transparent)` |  |
| `--trazo-fuerte` | `color-mix(in srgb, var(--color-text) 20%, transparent)` | `color-mix(in srgb, var(--color-bg) 26%, transparent)` |  |
| `--trazo-interactivo` | `color-mix(in srgb, var(--color-text) 55%, transparent)` | `color-mix(in srgb, var(--color-bg) 40%, transparent)` | borde de controles ≥3:1 sobre crema (3.59) — MCP/Ceci |

#### Estados derivados de los ROLES

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--estado-hecho-fondo` | `color-mix(in srgb, var(--identidad) 16%, var(--fondo))` | igual, resuelto con los roles de la banda |  |
| `--estado-hecho-texto` | `var(--texto-1)` | igual, resuelto con los roles de la banda |  |
| `--estado-hecho-borde` | `color-mix(in srgb, var(--identidad) 45%, var(--fondo))` | igual, resuelto con los roles de la banda |  |
| `--estado-curso-fondo` | `var(--texto-1)` | igual, resuelto con los roles de la banda |  |
| `--estado-curso-texto` | `var(--fondo)` | igual, resuelto con los roles de la banda |  |
| `--estado-curso-borde` | `var(--texto-1)` | igual, resuelto con los roles de la banda |  |
| `--estado-pendiente-fondo` | `color-mix(in srgb, var(--texto-1) 6%, transparent)` | igual, resuelto con los roles de la banda |  |
| `--estado-pendiente-texto` | `var(--texto-2)` | igual, resuelto con los roles de la banda |  |
| `--estado-pendiente-borde` | `var(--trazo-medio)` | igual, resuelto con los roles de la banda |  |
| `--estado-nopuede-fondo` | `transparent` | igual, resuelto con los roles de la banda |  |
| `--estado-nopuede-texto` | `var(--texto-3)` | igual, resuelto con los roles de la banda |  |
| `--estado-nopuede-borde` | `var(--trazo-interactivo)` | igual, resuelto con los roles de la banda |  |
| `--estado-atencion-fondo` | `color-mix(in srgb, var(--color-cta) 18%, var(--fondo))` | igual, resuelto con los roles de la banda |  |
| `--estado-atencion-texto` | `var(--texto-1)` | igual, resuelto con los roles de la banda |  |
| `--estado-atencion-borde` | `color-mix(in srgb, var(--color-cta) 60%, var(--fondo))` | igual, resuelto con los roles de la banda |  |

#### Escena de los visores 3D

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--escena-fondo` | `color-mix(in srgb, var(--color-text) 62%, black)` |  |  |
| `--escena-texto` | `color-mix(in srgb, var(--color-bg) 70%, var(--color-text))` |  |  |
| `--escena-velo` | `color-mix(in srgb, var(--escena-fondo) 92%, transparent)` |  |  |

#### Responsive de la retícula

| Token | Valor | En banda oscura | Nota |
|---|---|---|---|
| `--gutter` | `2rem` |  | solo (min-width: 640px) |
| `--cabecera-alto` | `4.5625rem` |  | solo (min-width: 640px) |
| `--gutter` | `3rem` |  | solo (min-width: 1024px) |
| `--color-bg-rgb` | `250 246 240` |  |  |
| `--color-bg-card-rgb` | `245 239 230` |  |  |
| `--color-text-rgb` | `45 27 61` |  |  |
| `--color-text-soft-rgb` | `58 51 64` |  |  |
| `--color-miriam-rgb` | `157 68 171` |  |  |
| `--color-miriam-soft-rgb` | `232 212 237` |  |  |
| `--color-miriam-claro-rgb` | `199 125 210` |  |  |
| `--color-cta-rgb` | `255 107 71` |  |  |
| `--color-cta-hover-rgb` | `229 87 58` |  |  |
| `--berenjena-2-rgb` | `58 35 80` |  |  |
| `--viz-cat-frio-1-rgb` | `63 121 134; --viz-cat-frio-1-osc-rgb: 85 149 163` |  |  |
| `--viz-cat-frio-2-rgb` | `120 143 179; --viz-cat-frio-2-osc-rgb: 94 118 155` |  |  |
| `--viz-cat-frio-3-rgb` | `92 117 138; --viz-cat-frio-3-osc-rgb: 115 142 164` |  |  |
| `--viz-cat-frio-4-rgb` | `109 144 152; --viz-cat-frio-4-osc-rgb: 83 118 127` |  |  |
| `--viz-cat-tierra-1-rgb` | `155 139 123; --viz-cat-tierra-1-osc-rgb: 124 108 93` |  |  |
| `--viz-cat-tierra-2-rgb` | `171 127 97; --viz-cat-tierra-2-osc-rgb: 153 110 81` |  |  |
| `--viz-cat-tierra-3-rgb` | `137 107 77; --viz-cat-tierra-3-osc-rgb: 168 138 108` |  |  |

<!-- GENERADO:TOKENS:FIN -->

### Puente con Tailwind

Generado desde `tailwind.config.js`. Estas utilidades apuntan a un token: úsalas en vez de un valor suelto. Las que no están aquí siguen siendo las de Tailwind; las que apuntan a un color fuera de la paleta (`text-green-600`, `bg-white`, `shadow-md`) las marca `test:diseno` (regla R1).

<!-- GENERADO:PUENTE:INICIO (scripts/gen-design-doc.ts; no se edita a mano) -->

| Utilidad | Valor |
|---|---|
| `text-2xs` | `var(--texto-2xs)` |
| `text-xs` | `var(--texto-xs)` |
| `text-sm` | `var(--texto-sm)` |
| `rounded-btn` | `var(--radius-btn)` |
| `rounded-card` | `var(--radius-card)` |
| `rounded-pill` | `var(--radius-pill)` |
| `shadow-flotante` | `var(--sombra-flotante)` |
| `shadow-hover` | `var(--sombra-hover)` |
| `shadow-dura` | `var(--sombra-dura)` |
| `duration-micro` | `var(--dur-micro)` |
| `duration-transicion` | `var(--dur-transicion)` |
| `duration-explica` | `var(--dur-explica)` |
| `ease-salida` | `var(--curva-salida)` |
| `ease-entrada` | `var(--curva-entrada)` |
| `ease-mover` | `var(--curva-mover)` |
| `max-w-shell` | `var(--shell-max)` |
| `max-w-medida` | `var(--measure)` |
| color de borde por defecto (`border`, `border-t`…) | `var(--trazo-sutil)` |
| color de divisor por defecto (`divide-x`, `divide-y`) | `var(--trazo-sutil)` |
| color de anillo por defecto (`ring`) | `var(--anillo-foco)` |
| `h-control`, `min-h-control`, `w-control`… | `var(--control-min)` |
| `px-gutter`, `mx-gutter`… | `var(--gutter)` |

<!-- GENERADO:PUENTE:FIN -->

## 2. Roles tipográficos

Cada clase es **un rol** y lleva dentro tamaño, peso, interlineado y tracking. Una página no los vuelve a escribir (nada de `style="letter-spacing"`). El color sale del fondo, así que el mismo rol sirve en una banda clara y en una oscura.

| Clase | Token | Medida | Cuándo sí | Nunca |
|---|---|---|---|---|
| `.h1-pagina` | `--tipo-h1` | Fraunces 600, 30 a 48 px | El H1 de una página, uno por página | Dentro de una tarjeta |
| `.h2-seccion` | `--tipo-h2` | Fraunces 600, 30 a 36 px | El H2 de cada capítulo | Con tamaños sueltos (`text-3xl sm:text-4xl`) |
| `.h2-declaracion` | `--tipo-h2-declaracion` | Fraunces 600, 30 a 48 px | El H2 que declara («Dónde estamos»). Máximo uno por página | Dos en la misma página |
| `.h3-seccion` | `--tipo-h3` | Fraunces 600, 20 a 24 px | Un subtítulo dentro de un capítulo. Excepción propuesta, aún sin firmar (sección 8): el `<h2>` de capítulo de las tres legales y de grupo de `/ciencia/evidencia` | Como título de tarjeta |
| `.h4-tarjeta` | `--tipo-h4` | Hanken 700, 17 px | El título de una tarjeta o de un aviso | Como titular de sección |
| `.lede` | `--texto-lg` | Hanken, 19 a 21 px | La entradilla bajo un titular | Párrafos normales |
| `.prosa` | `--tipo-prosa` | Hanken 400, 17/1.6 | Lectura larga | Etiquetas o datos |
| `.eyebrow` | `--tipo-eyebrow` | JetBrains Mono 500, 12 px, mayúsculas | La línea sobre un titular | Texto de más de una línea |
| `.etiqueta` | `--tipo-etiqueta` | JetBrains Mono 600, 12 px, mayúsculas | El kicker de una tarjeta o de un control | Prosa |
| (hero) | `--tipo-hero` | Fraunces 600, 28 a 46 px | El hero de la home y `/marcas` | Otras páginas |

Reglas:

- **Suelo de 13 px.** Nada de texto por debajo, salvo mono en mayúsculas (12 px: `.eyebrow`, `.etiqueta`, ejes de gráfico). `text-xs` es 13 px, `text-sm` es 15 px y `text-2xs` es 12 px y está reservado a ese mono.
- Cuerpo de lectura 17 px (`--tipo-prosa`); cuerpo de tarjetas y UI 16 px (`--tipo-ui`); secundario 15 px (`--tipo-body-sm`).
- Las cifras llevan `tabular-nums` (clase `nums`).
- Fraunces en cursiva es el gesto de firma (`.firma`). Se carga la cursiva real, no una oblicua sintética.
- La medida de lectura es `--measure` (68ch) y `.measure` la aplica alineada a la izquierda del shell.
- **Un párrafo de más de dos líneas va en `.measure`, `.prosa` o `.lede`**, nunca con un ancho suelto: `max-w-2xl` o `max-w-3xl` en un `<p>` los atrapa R13. Los componentes que llevan texto de apoyo (`TarjetaEnlace`, `Aviso`, `QueBuscamos`, `CampanaOficial`) traen la medida dentro, así que la página no tiene que ponérsela. R10 cuenta, con `linea_larga`, los bloques de texto cuya línea más larga pasa de 90 caracteres tal como se pinta.

## 3. Shell, ritmo y bandas

**Shell.** `.section-wide` es el ancho único de cabecera, cuerpo y pie: `--shell-max` (1200 px) con relleno `--gutter` (24, 32 desde 640 y 48 desde 1024). El borde izquierdo del H1 cae siempre bajo el logo.

- `.section-container` (896 px, centrado) queda solo para `/gracias` y `/links`, que son una columna centrada a propósito. Un contenedor propio (`max-w-[Npx]` con `px-4 sm:px-6 lg:px-8`) o un `section-container` en otra página lo atrapa R12: el H1 no caería bajo el logo.
- `.shell--pantalla` es la excepción firmada para la zona de trabajo de `/laminillas` y del explorador: ocupa todo el ancho, pero **la barra con el título va en `.section-wide`**, para que el borde del título siga alineado con el logo.

**Ritmo.** `.section-spacing` entre capítulos (80 px en móvil, 112 desde 640) y `.section-spacing--compacta` (56 y 80) para un bloque corto. La primera sección de una página tiene menos aire por arriba porque ya está bajo la cabecera.

**Bandas.** `<Banda tono="crema|tarjeta|oscura">` es el bloque de ancho completo. Lleva dentro `section-spacing`, `v-reveal` y `.section-wide`.

- La **oscura** usa `data-tema="oscuro"`, es siempre a sangre y no hay versión de caja redondeada.
- **Una oscura por página**, y nunca pegada a la banda de logos del pie.
- Alterna crema y tarjeta para marcar capítulos; no pongas dos bandas del mismo tono seguidas.

**Retícula: tres reglas y una utilidad (lote 0 del repaso de escritorio, 25 de octubre de 2026).** Las reglas 1 y 2 y la utilidad valen desde `lg` (1024 px); por debajo todo se apila como antes. La regla 3 es un tope de ancho (68ch) que solo se nota en un aviso de más de unos 600 px, así que el móvil no cambia. Tienen su ejemplo en la guía viva (sección «Retícula»).

1. **Un texto con una pieza ancha va en dos columnas: `.rejilla-par`.** Un texto estrecho encima de una tarjeta, una figura o una tabla deja la mitad de la fila vacía. Hijos directos: uno de texto (en `.measure`) y la pieza. Desde `lg` son dos columnas iguales con 48 px de hueco; debajo, una pila de una columna (`minmax(0, 1fr)`) con 32 px. La pista no crece con la pieza: el texto conserva el ancho del contenedor aunque la pieza sea más ancha, y la pieza ancha se encarga de su propio desborde (una tabla va dentro de `.tabla-scroll`, una figura con `width: 100%` y su `viewBox`); un SVG de 700 px fijos seguiría sacando la página de su ancho.
2. **Un grupo de N tarjetas no deja un hueco.** Cinco tarjetas en tres columnas dejan un hueco en la segunda fila. Se reparten en seis columnas con spans de 2 y de 3 (`lg:grid-cols-6` con `lg:col-span-2` y `lg:col-span-3`: 2, 2, 2, 3, 3), o la destacada ocupa dos columnas. Es una regla de composición: no hay clase propia, cada rejilla escribe sus spans.
3. **Un aviso llega hasta la medida.** `Aviso` y `.alert-callout` llevan `max-width: var(--measure)`, alineados a la izquierda del shell. Un aviso de dos líneas no ocupa 1104 px.
4. **`.sticky-bajo-cabecera`.** Fija el `top` del bloque pegajoso en `calc(var(--cabecera-alto) + var(--sp-24))`: 24 px por debajo de la cabecera real (73 px, o 112 con la barra «lo último»). Se escribe con prefijo y con la posición: `lg:sticky lg:sticky-bajo-cabecera lg:self-start`. Un `lg:top-24` (96 px) deja el título bajo la cabecera de 112 px. R10 lo vigila con `sticky_tapado`: un elemento `sticky`, fuera de la cabecera y con recorrido para pegarse, cuyo `top` queda por encima del borde de abajo de la cabecera.

**Qué se invierte solo en una banda oscura.** Contraste del texto medido en render (24 oct 2026, en reposo; el marcador del enlace al pasar y al enfocar da crema sobre `--marcador`, 8,8:1):

- **Se invierten y se leen (todos ≥ 5,4:1).** Los nueve componentes base; `.btn-cta|dark|secondary|ghost`, `.link-inline` (también `.link-underline`), `.link-action`, `.prose`, `.firma`, `.card-base`, `.card-marked`, `.data-card`, `.data-table`, `.form-input` (con su placeholder, 5,8:1) y `.form-label`, `.pill-data--info|warn|positive|neutral|berenjena`, `.status-badge--hecho|curso|pendiente|nopuede|atencion`, `.sello`, `.stat-readout`, `.notes-disclosure`, `.alert-callout`, `.eyebrow` y `.etiqueta`. **Vigilado en CI**: lo que tiene su ejemplo en la banda oscura de `/guia-de-estilo` (botones, enlace, `card-base`, `TarjetaEnlace` suave y apoyo, `status-badge--hecho`, tres píldoras, campo y tabla): `pnpm test:diseno-render` lo mide en cada build. El resto se midió a mano y no lo vigila nadie: si lo vas a usar en una banda oscura, añade su ejemplo a la guía.
- **Se leen porque llevan su propio par de fondo y texto, pero no cambian de lado.** `.pill-data--violet`, `.badge-genomic`, `.sello--verificado` y las `.status-badge` viejas con hex (`--active`, `--candidate`, `--paused`, `--firma`, `--reference`).
- **NO se leen en una banda oscura. No las uses ahí hasta migrarlas.** `.status-badge--shape` (2,3:1), `.link-logo` (2,6:1) y la hora de `.pathway-chip` (1:1: texto de rol sobre una píldora de fondo fijo).
- **Un enlace en línea sobre una tarjeta de banda oscura no cumple AA.** El violeta claro sobre `--superficie` oscura da 3,9:1 (solo texto grande). En una tarjeta de banda oscura el enlace va fuera de ella o es la tarjeta entera (`TarjetaEnlace`). Subir `--superficie` oscura al 94 % de berenjena lo arreglaría (4,6:1), pero cambia también el aspecto oscuro del explorador célula a célula, que es del PR #290: decisión pendiente.
- La miga de `PageHeader` pinta con `--identidad`; no tiene ejemplo en la guía porque `PageHeader` lleva el H1 y solo hay uno por página.

## 4. Contrato por componente

Cada componente dice cuándo sí, cuándo no, qué props tiene y qué no se hace nunca. Los nombres vivos (`btn-cta`, `card-base`, `link-action`) se mantienen: renombrar cientos de usos no ganaba nada visible.

### Botones y enlaces (clases en `main.css`)

- `.btn-cta`: **solo para apoyar** (donar). Uno por pantalla. Coral con texto berenjena en cualquier fondo, **en reposo (5,6:1)**: su `:hover` y su `:active` bajan de 4,5:1 (ver la sección 5, «Contraste de los estados de `.btn-cta`»). Nunca para navegar.
- `.btn-dark`: acción de explorar (reproducir, abrir un visor). En una banda oscura se invierte solo.
- `.btn-secondary`: navegar o contactar. Contorno.
- `.btn-ghost`: terciario, sin caja.
- Los cuatro miden 44 px como mínimo, tienen `:disabled` y `[aria-busy]`, y su hover solo existe donde hay hover de verdad.
- `.link-action`: enlace con flecha fuera de un párrafo. La regla de los 44 px vive en la clase. La flecha es un `Icon ph:arrow-right`, no el glifo.
- `.link-inline`: enlace dentro de una frase: subrayado siempre visible. Los correos van como `mailto` con esta clase.

### `Banda`

`tono`, `titular` (id del h2, para `aria-labelledby`), `compacta`, `reticula`. Nunca una caja oscura redondeada; nunca dos oscuras.

### `CabeceraSeccion`

`id` (obligatorio), `titulo` o slot `titulo`, `eyebrow`, `lede`, `nivel="seccion|declaracion"`. Es el único sitio donde se escribe el H2 de un capítulo. Nunca un H2 con aspecto de eyebrow.

### `PageHeader`

Con `variante`, `eyebrow`, `lede` o `align` usa la cabecera v3: H1 siempre visible con `.h1-pagina`. `variante="herramienta"` es la corta (el visor tiene que asomar al entrar); `oscura` va dentro de una banda oscura; `align="center"` es para `/gracias` y `/links`. Sin esas props conserva la cabecera heredada (`tag`, `subtitle`, `compact`), que se borra cuando ninguna página la use.

### `TarjetaEnlace`

Icono, título, meta y flecha; interna (`to`) o externa (`href`, con aviso de pestaña nueva). `tono`: `suave`, `destacada` (la protagonista, **una por grupo**) o `apoyo` (coral, **solo para donar**). Para una herramienta: `verbo`, `esfuerzo`, `nivel` y el slot `preview`. La tarjeta se estira a la altura de su fila de la rejilla y centra su contenido en vertical (el título de una línea y el de dos quedan a la misma altura media); las etiquetas de una tarjeta de herramienta van al borde de abajo, todas en el mismo raíl. Su línea de apoyo (`meta`) tiene tope a `--measure`: en la destacada de la home, que mide 1104 px, llegaba a unos 150 caracteres. Hover: borde más oscuro y flecha 2 px; no se eleva. Pulsar (`:active`, lo único que responde en un teléfono, donde el hover está filtrado a puntero fino): el borde se oscurece siempre y, si no se pide menos movimiento, la tarjeta cede a `scale(0,99)` y la flecha avanza 2 px, con `--dur-micro` y `--curva-salida` (en la `destacada` el cede sustituye al desplazamiento de −2 px del hover). En `apoyo` el fondo **no cambia** al pasar (el hover de la paleta no llega a AA con el texto de la tarjeta): avisan el borde, la flecha y `--sombra-hover`. Nunca una tarjeta de las cinco recetas viejas.

### `.card-base` y `.card-marked`

Una tarjeta: `.card-base` (papel y filete), `.card-marked` (la protagonista: borde de 1,5 px y sombra dura; el hover solo se mueve si es `a` o `button`). Nada de tarjetas locales (`dt-tarjeta`, `collab-card--hard`…).

### `Dato`

Valor, unidad, etiqueta, fecha formateada, sello de evidencia y fuente enlazada. `tam`: `lg`, `md`, `sm`. El valor y su unidad van separados por un `&nbsp;` de texto (no por un margen: el lector de pantalla no lo lee). El sello de evidencia sube a `--texto-xs` (13 px, el suelo) dentro de `Dato`, dentro de `QueBuscamos` (que también sale en `/herramientas`, página que no hace el `provide`) y en las páginas del panel (home, `/datos` y `/ciencia`, las que piden `provide('ocultarVerificado', true)`; clase `sello--panel`). **La única excepción de 11 px es célula a célula**, hasta el PR #290: subirlo desde la capa compartida movería los recuentos de R10 de esas páginas, que son de ese PR. Cuando #290 entre, `sello--panel` desaparece y el 13 px es el único tamaño. Los glifos de `Sello` (`✓ ~ “ ? ↧`) pasarán a `Icon ph:*` en la fase P9, junto con el resto de la fila Iconos. **Nunca lleva una cifra que no venga de su fuente**: una cifra clínica nueva pasa antes por verificación.

### `Aviso`

`tipo="apoyo|legal|limites"`, `titulo` obligatorio, `plegable`. Fondo `--superficie`, filete izquierdo `--identidad`, icono. La caja llega hasta `--measure` (68ch), igual que su cuerpo, y se alinea a la izquierda; `.alert-callout`, el aviso viejo que se mantiene hasta migrar, lleva el mismo tope. `Nota` queda solo para «Última actualización». Nunca un caveat clínico en mono de 12 px.

### `Segmentado`

`modo="radios|pestanas|toggle"`, `etiqueta` obligatoria, `desplazable`. Teclado completo (flechas, Inicio, Fin). El activo lleva borde de 2 px además del color. 44 px mínimo. `desplazable` (la fila se desliza en móvil) lleva 6 px de aire arriba y abajo y 4 a los lados, con margen negativo igual para no mover el diseño: el anillo de foco ocupa de 2 a 4 px fuera del botón y `overflow-x: auto` recorta también en vertical. Quien ponga un control enfocable dentro de otro contenedor con `overflow` debe dejarle ese aire.

### `Referencia`

Una línea mono de 13 px con el DOI como `.link-inline`. Nunca una píldora en mayúsculas. Nunca una cita que no se haya abierto y verificado.

### `RutaPasos`

Barra de pasos y lista con un único mapa de estado a insignia (`app/utils/estadoInsignia.ts`). Solo los `hecho` cuentan como dados.

### Otras clases

- `.visor` (con `data-tema="oscuro"`): el escenario oscuro de los visores 3D, con `--escena-*` y un solo estado de carga (`.visor__carga`, con `.anima-esencial`).
- `.desplegable`: `<details>` de sección, legible, con resumen de 44 px. `.notes-disclosure` es la nota al pie en mono.
- `.tabla-scroll`: envoltorio de una tabla ancha, con degradado en el borde que desborda. Con `tabindex="0"` y `aria-label`.
- `.form-input` y `.form-label`: 16 px, 44 px de alto, borde `--trazo-interactivo`, placeholder en `--texto-3`.
- `.barra-fija`: fondo de una barra pegajosa: casi opaco, **sin desenfoque**.

## 5. Estados y color

Cinco estados **de proceso** (un paso dado, en curso, pendiente…), derivados de la paleta y **siempre con icono y palabra**. El color nunca es la única señal. Describen cómo va una tarea; no valoran un dato.

| Estado | Fondo | Texto | Icono | Se usa para |
|---|---|---|---|---|
| `hecho` | violeta al 16 % sobre el fondo | `--texto-1` | check en círculo | Un paso dado |
| `curso` | `--texto-1` (invertido) | `--fondo` | círculo a medias | Lo que se hace hoy |
| `pendiente` | `--texto-1` al 6 % | `--texto-2` | círculo de puntos | Lo que viene o lo neutro |
| `nopuede` | transparente, borde discontinuo | `--texto-3` | círculo tachado | Lo que no puede hacerse (todavía) |
| `atencion` | coral al 18 % sobre el fondo | `--texto-1` | triángulo | Lo que pide una decisión o un cuidado |

- Clases: `.status-badge--hecho|curso|pendiente|nopuede|atencion`. Son las únicas con icono.
- **`atencion` como frase: `.msg-atencion`** (lote 2, 25-oct-2026). El mensaje de un error o de «esto pide un cuidado» (un envío que falló, un captcha que no cargó, un campo sin rellenar) va con los mismos `--estado-atencion-*` y el mismo triángulo de la insignia, pero en una o dos líneas de texto normal (hasta `--measure`), no en una etiqueta mono en mayúsculas de una sola línea. Lleva `role="alert"` (o `status`). Sustituye a `text-coral-deep`: el color de Tailwind `coral.deep` se borró y el coral no es texto en ningún caso.
- Los tonos de `.pill-data` (`info`, `warn`, `positive`, `neutral`, `violet`, `berenjena`) se mantienen por nombre, así `science.yml` no cambia, pero **solo tiñen: no llevan icono y no significan «hecho» ni «verificado»**. Una píldora de dato clínico (RE−, ECOG 0, Estadio IV) describe y no concluye; un icono de «hecho» sobre un atributo favorable lo leería como completado. Para decir que un dato está verificado está el sello de evidencia. Si un dato clínico necesitara icono, pasa antes por el comité médico con la tabla de qué significa cada uno.
- Las variantes viejas de `.status-badge` (`--active`, `--firma`, `--pending`, `--candidate`…) siguen existiendo hasta que `RutaPasos` y las páginas migren; entonces se borran.
- **El coral no es texto sobre crema** (2,6:1): como texto se usa `--cta-texto` (berenjena sobre claro, coral sobre berenjena) y un icono.
- Contrastes medidos del texto de cada estado sobre su fondo: de 4,6 a 14,6. Medidos con `color-mix` en sRGB, no en un teléfono. **Esa cifra es solo de las cinco insignias de estado**; los botones de donar tienen su apartado justo debajo.
- **Contraste de los estados de `.btn-cta` (berenjena `#2d1b3d` sobre coral).** Medido por cálculo con los hex de la paleta (WCAG, sRGB); **no lo mide ningún test**, porque R10 no mide el hover: en reposo `--color-cta` da 5,57:1; `:hover` (`--color-cta-hover`, `#e5573a`) da 4,31:1; `:active` (`--cta-active`, el coral al 85 % con berenjena) da 4,40:1. El texto del botón (16 px heredados en `.btn-cta`, 14 px en el donar de `SiteNav`, ambos en seminegrita) no cuenta como texto grande (WCAG pide 24 px, o 18,66 px en negrita), así que los dos estados quedan bajo AA (4,5:1). **Decisión pendiente de Miriam**, porque `--color-cta-hover` es un átomo firmado de la paleta. Opción medida antes de proponerla: hover derivado más claro, `color-mix(in srgb, var(--color-cta) 85%, var(--color-bg))`, que da 6,34:1 y no mete ningún hex. Mientras tanto, `TarjetaEnlace` en tono `apoyo` no cambia de fondo al pasar y no hereda el problema; `.btn-cta` y el botón de donar de `SiteNav` sí lo tienen (el de `SiteNav` usa `hover:bg-coral-hover`).
- No hay rojo ni verde: la visualización clínica los descarta por daltonismo.

## 6. Movimiento

- Duraciones: `--dur-micro` (150 ms: hovers y focos), `--dur-transicion` (300 ms: entradas), `--dur-explica` (450 ms: lo que explica algo: reproducir, cambiar de pestaña, la primera visita).
- Curvas: `--curva-salida` y `--curva-entrada` para entrar y salir; `--curva-mover` para lo que se mueve dentro de la pantalla (valor tomado de una guía externa, **sin probar en el sitio**).
- Nada de `transition-all`, de `ease-in`, de `cubic-bezier()` suelto ni de `scale()` por debajo de 0,95.
- **Todo `:hover` va dentro de `@media (hover: hover) and (pointer: fine)`.** En un teléfono el primer toque deja el hover pegado.
- **Movimiento reducido:** una red global deja cualquier animación en su estado final (`animation-duration: .01ms`, una iteración). Lo que comunica un estado y no se entiende parado lleva `.anima-esencial` (el indicador de carga). Las transiciones de `transform` se anulan clase a clase junto a su hover.
- Un solo sistema de revelado: `v-reveal`. `.scroll-reveal` y `.stagger-children` salen con las páginas que los usan.

## 7. Iconos

Siempre `Icon` de Phosphor (`ph:*`), decorativos con `aria-hidden="true"`. Nada de glifos (`✓ ✱ ↗ → ‹ › × ⓘ ↧`) como icono en una plantilla: el lint (R6) los cuenta. Los iconos de estado se dibujan con una máscara CSS para tomar el color del texto.

## 8. Excepciones firmadas

- **`--viz-cat-*`** (Miriam, 19-oct-2026): los 14 tokens de la categórica nominal del mapa del explorador. No abren la puerta a más colores.
- **`--escena-*`** (parcial, `diseno`): fondo, texto y velo de los visores, derivados con `color-mix` (cero hex). **Pendiente de firma de Miriam:** los trazadores 68Ga y FDG (teal y ámbar) y `--lienzo-muestra` (el `#fff` del lienzo de `/laminillas`).
- **`/* ds-exc: motivo */`** en el código: una excepción puntual, con su motivo, en la línea del hallazgo o en la anterior. La baseline guarda el tope por fichero y subirlo es una decisión de revisión. `pnpm test:diseno` las cuenta y las lista con su motivo (hoy: el radio del anillo de foco, el marcador de enlace en línea y la impresión en negro sobre blanco).
- **La caja oscura de la campaña en la home** (decisión de diseño 25-oct-2026, no se copia a otras páginas). `GoFundMeProgress` en variante `card` es una caja redondeada con `data-tema="oscuro"` y convive con la banda oscura de la cita, así que rompe a la vez «no hay caja oscura redondeada» y «una oscura por página» (sección 3). Se firma porque manda lo medido en la home (sección 0, punto 1) y porque es el único sitio donde la campaña es la protagonista. No abre la puerta a más: las cajas oscuras de `/equipo` y `/prensa` no son esta excepción y pasan a `Banda tono="oscura"`. **Estado: firmada por `diseno`; Miriam la ve porque cambia la cara de la web (decisión 1 del repaso de escritorio, opción A).** Si ella prefiere la opción B (tarjeta clara o banda oscura), esta línea se borra.
- **Sin bandas por capítulo en `/ciencia`** (CI-3 de la auditoría, gravedad alta; registrada en la revisión de P1, 25-oct-2026). Motivo: el índice de capítulos es pegajoso y la página es una hoja de referencia clínica de una sola columna; partirla en bandas obligaría a rehacer la rejilla y a mover el índice fuera de ella. **Estado: propuesta, no firmada.** Falta la firma del comité de diseño con su fecha, y Miriam la ve porque es una decisión visible (cambia la cara de la página). Mientras no conste, CI-3 sigue abierta y es una entrada con nombre de la limpieza de P13: se firma o se hace.
- **`.h3-seccion` en el `<h2>` de capítulo de las tres legales, de grupo de `/ciencia/evidencia` (solo por debajo de `lg`) y de la tarjeta lateral de `/contacto`** (revisión del lote 1, 25-oct-2026; ajustada en la revisión del barrido, 26-oct-2026). Motivo: a 375 px el H1 mide 30 px y `.h2-seccion` también (30 a 36), así que el titular de grupo igualaba al de página y luego saltaba de 30 a 15 px en el título de cada estudio; en las legales, 11 capítulos de 36 px bajo un H1 de 48 px a 1280. El nivel semántico no cambia (sigue siendo un `<h2>`, sin saltar de H1 a H3) y no se toca ningún token. Medido en render: evidencia 20 px a 375 y 24 a 1280 (antes de esta revisión, 30 y 36; antes del lote 1, 18 y 18); legales 20 y 24 (antes de la revisión, 30 y 36; antes del lote 1, 24 y 24). **Revisión del barrido (26-oct-2026).** `/ciencia/evidencia` sale de la lista: el `<h2>` de grupo lleva `bajo-lg:h3-seccion lg:h2-seccion` (20 px a 375 como antes; 36 px desde `lg`, bajo un H1 de 48 y sobre los 17 px del estudio), que R8 admite por el segundo. `/contacto` entra: su único `<h2>` es el titular de una tarjeta lateral de 530 px («Para profesionales de la oncología e investigación»), y a 36 px ocupaba dos líneas más que las tres de texto de la tarjeta; lleva `lg:h3-seccion` (24 px). **Cómo se vigila:** R8 admite `.h3-seccion` en un `<h2>` solo en esas cuatro páginas (las tres legales y `/contacto`; `H2_COMO_H3`, `scripts/test-diseno.ts`, con autotests que se ponen rojos si la lista se vacía o se abre a todas); en cualquier otra página sigue contando. **Resuelto en T3-CIERRE (26-oct-2026, decisión G):** los dos `<h3>` sueltos de `/privacidad` medían 20 px en Fraunces a 375 px, lo mismo que el H2 de capítulo. Ahora `.prose-ink > h3` (`main.css`) los lleva al rol `.h4-tarjeta` (Hanken 700, 17 px) con 32 px de aire arriba y 12 abajo, los que ya tenían. Medido en render: H2 de capítulo 20 / 24 px (375 / 1280) y `<h3>` 17 / 17 (antes 20 / 20); la página mide 52 px menos a 375 y 20 menos a 1280; `/aviso-legal` y `/cookies` no llevan `<h3>` y no cambian. Lo vigila una comprobación de R10 sin baseline (`PROSA_LEGAL`). **Estado: propuesta de la revisión, no firmada; Miriam la ve porque cambia el tamaño de los titulares en cuatro páginas.**
- **Tira de tres cifras de `/marcas` en una columna por debajo de `sm`** (lote 2, 25-oct-2026; registrada en el barrido final, 26-oct-2026). Motivo: con el suelo de 12 px en mono y mayúsculas, «MULTIPLATAFORMA» mide 119 px y la columna de tres, 93; solo cabría partiendo la palabra (`overflow-wrap: anywhere`). No toca ningún token. Coste: la página mide 157 px más a 375, 126 de ellos en la tira (medido por el barrido, igual frente a producción y frente a la build previa al lote 1). **Estado: decidido 26-oct-2026, en revisión de Miriam con el preview.** Miriam la ve porque cambia la cara de la web en el móvil; si la rechaza, esta línea se borra y la tira vuelve a tres columnas con la palabra partida.
- **Revisión del barrido (26-oct-2026): los cambios de móvil, uno a uno y medidos.** La regla de la tanda es que en el móvil solo se tocan el suelo de 13 px, el contenedor y la medida. Estas son las excepciones que el barrido dejó sin firma, con lo que cuesta cada una medido a 375 px (altura de la página antes del barrido, tras el barrido y ahora). Todas están **decididas el 26-oct-2026 (la sesión, por delegación de diseño de Miriam) y en revisión de Miriam con el preview**: Miriam las ve porque cambian la cara de la web en el teléfono, y si rechaza una se revierte esa y solo esa.
  1. **Barra fija de apoyo, con «Más formas de ayudar» a 44 px de alto y a 13 px de texto** (zona pulsable y suelo). Alto de la barra: 99 / 123 / **106 px**. Reserva de `main.has-support-bar`: 100 / 126 / **108 px** (6,25 / 7,9 / 6,75 rem). Las páginas con barra miden **8 px** más que antes del barrido (con 123 eran 26 o 27, también en la home y en célula a célula: la reserva es de `main.css` y no toca ningún fichero de célula). Cabecera pegajosa (104 px) más barra: 203 px, el 30,4 % de un viewport de 667 / 227 px, el 34,0 % / **210 px, el 31,5 %**. Se consigue sin tocar el alto de los dos controles (el botón de 52,8 y el enlace de 44): el relleno vertical pasa de 10 + 8 a 6 + 2 px y el hueco entre ellos, de 7,2 a 0. Si se rechaza: el enlace vuelve a 20 px de alto y la reserva a 6,25 rem.
  2. **Enlaces rápidos de `/colabora` a 44 px de alto y de ancho** (zona pulsable: «Inicio» medía 35 × 44). La lista (14 enlaces, una columna por debajo de `sm`) mide 436 px antes del barrido, 772 tras él y **616 ahora** (sin hueco entre filas; desde `sm` conserva sus 12 px). La página, +354 px tras el barrido y **+191 ahora** (8 de ellos, la reserva de la barra). Dos columnas no caben: «gofund.me/3e25cae99» mide unos 150 px y la columna unos 105. Si se rechaza: vuelven a 20 px de alto (la lista, a 436).
  3. **Diagrama de fenotipo y gráfica del FDG del mapa, deslizables por debajo de `lg`** (suelo de 13 px: encogidos, 47 textos medían de 5,8 a 7,8 px). El diagrama mide 680 px de ancho como mínimo (525 de alto, frente a 232 encogido) y la gráfica 460. La página del mapa, **+298 px** (28 885 → 29 183: 293 del diagrama y 5 de la columna de la gráfica y la imagen clave, que ahora cabe en su tarjeta). Se deslizan dentro de `.tabla-scroll`, con pista de borde y foco de teclado. Si se rechaza: vuelven al ancho de la tarjeta, con la letra a 6 u 8 px.
  4. **Cabecera v3 en `/datos` y en `/contacto`** (decidido 26-oct-2026; `/contacto` la lleva desde T3-CIERRE) (K8: un solo rol de H1). El barrido la aplicó a `/datos` y frenó `/contacto`, y decidir las dos con el mismo criterio es de Miriam. Aplicarla cambia el móvil: el H1 conserva sus 30 px pero su interlineado pasa de 36 a 32,4 px, y la entradilla, de 18 a 19 px. La página mide 3 px menos (`/datos`, con la cabecera puesta: 12 477 → 12 474; `/contacto`, medida con la variante puesta y sin quedarse con ella: 3 404 → 3 401, descontados los 8 px de la reserva de la barra). Sin eyebrow (sería copy nuevo). **Decidido: las dos con v3** (recomendada por `diseno`: un solo H1). Medido al aplicarla en `/contacto`: 3 px menos a 375 (3404 a 3401; EN, 3429 a 3426) y 9 más a 1280 (1990 a 1999; EN, +6). La alternativa era las dos heredadas (se revierte `variante="pagina"` en `/datos`; el camino heredado de `PageHeader` lo usa célula, PR #290, y por eso no se borra).
  5. **Zonas pulsables que no mueven la maqueta, para que conste:** las pastillas y los logos de prensa de `/marcas` (cajas de 33 y de 32 a 36 px; zona de 44 con un `::after` invisible de 6 px arriba y abajo; la página mide lo mismo que antes del barrido y no los +57 px de la versión con `min-height`) y los 12 enlaces «Ver…» de `/timeline` por debajo de `lg` (28 px; zona de 44 con `::after` de 8 px; desde `lg` siguen en 44 reales). R10 cuenta ahora esa zona (el `::before` o `::after` absoluto y sin `pointer-events: none`), no solo el dibujo. Si Miriam prefiere 44 px visibles: +11 px por pastilla o logo en `/marcas` y +16 por enlace en `/timeline`. Y el botón de reencuadre del visor 3D de `/lesiones` y del mapa (`BoneTriView`): se dibuja a 30 px y lleva una zona de 44 con un `::after` invisible con el ratón (con el dedo ya medía 44), en todos los anchos.
- **Revisión del barrido: decisiones del 26-oct-2026 (T3-CIERRE), con la opción que recomendaba el comité y lo medido.** (a) **Barra «Lo último»**: 25 px de alto en todas las páginas con ella, ES y EN, de 375 a 1920 (342 × 25 a 375, 1104 × 25 a 1280); con 44 px reales la cabecera crece 12 px. Recomendado: zona pulsable de 44 con `::after` y sin crecer (`diseno`). **Decidido el 26-oct-2026, salida (i), aplicada en T3-CIERRE (en revisión de Miriam con el preview).** `LatestUpdateBar` se pinta también en célula y alphafold (PR #290), así que la zona de 44 px baja el recuento de `objetivos_pequenos` de todas las filas con barra (cada ruta salvo la home, `/links` y `/gracias`, a 390 y a 1280, las de `/celula-a-celula` incluidas). La sesión autorizó bajar esas filas de la baseline, solo en esa métrica y solo a la baja; ningún fichero de `celula/` ni de alphafold se toca. La barra no es una excepción: el enlace sigue midiendo 25 px y la zona pulsable es un `::after` de 44 px que arranca en el borde de arriba de la pantalla (la barra, de 39 px, no crece: 38,7 antes y después). Lo que se toca de verdad, con `elementFromPoint` en la columna central, pasa de 26 px de alto a 44, y la zona no tapa el borde de ningún enlace ni botón de la cabecera (empiezan a 10 px de la barra a 375 y a 14 a 1280, y la zona llega a 5 px por debajo de ella). Lo comprueba `BARRA_ULTIMO`, de R10, sin baseline. El comentario de `LatestUpdateBar.vue` ya no dice «pendiente». (b) **Tira de tres cifras de `/marcas`**: +126 px a 375 (ver la excepción de arriba, lote 2). Recomendado: la columna única, que es la que cabe sin partir «MULTIPLATAFORMA». **Decidido 26-oct-2026: columna única (ya aplicada), en revisión de Miriam con el preview.** (c) **Año de `/timeline`**: cinco `<h2>` de 15 px que son una chip sólida sobre el raíl (`.tl-year`); pasarlos a `.h2-seccion` obliga a quitar la chip, y es decisión de diseño con mockup para Miriam. Recomendado: dejar la chip y que R8 admita `.tl-year` con su motivo. R8 queda en 8 (célula 2, colabora 2, la cita de la home 1, laminillas 2, este 1). **Decidido 26-oct-2026: la chip se queda (ya aplicada), en revisión de Miriam con el preview. La parte de R8 NO está aplicada:** `scripts/test-diseno.ts` sigue contando ese `<h2 class="tl-year">` (1, en `timeline.vue`) y no admite `.tl-year`; queda por añadirlo con su motivo, como `H2_COMO_H3`. (d) **`--measure`**: 68ch da hoy **de 81 a 90 caracteres por línea** con Hanken a 13 a 16 px, **no los 75 o menos que daría 58ch**. Lo midió la revisión del barrido (26-oct-2026) en `/datos`, la entradilla de `/ciencia` (90), `/colabora`, `/contacto`, `/gastos`, `/equipo`, `/marcas` y el pie (hasta 89 en inglés); el 93 que se midió en los hitos de `/timeline` en inglés ya queda acotado por su medida local. R10 tolera hasta 90 (`LINEA_MAX`), así que pasa en CI aunque la línea sea más larga de lo que el token promete: mientras `--measure` siga en 68ch, no se afirma que una página dé 75 o menos. Hoy hay tres medidas locales (`.mapa-medida` en el mapa y `[--measure:58ch]` en `TimelineEntry` y en `VideoCaso`) y el token global, que `/celula-a-celula` comparte. Recomendado: 58ch global y `LINEA_MAX` de R10 a 80 cuando entre el PR #290. **Fecha en que se retiran las tres medidas locales:** la del merge de #290 (hoy sin fecha; la apunta quien lo fusione, aquí y en la sección 11). **T3-CIERRE (26-oct-2026, decisión E):** `[--measure:58ch]` en la raíz de `/datos`, `/ciencia`, `/ciencia/evidencia`, `/gastos`, `/prensa`, `/marcas` y `/equipo` (y de sus espejos en inglés), el mismo patrón que `TimelineEntry` y `VideoCaso`. Es una variable heredada: dentro de esas siete páginas pasan a 58ch todos los que leen `var(--measure)` (`.measure`, `.lede`, `Nota`, `Aviso`, la meta de `TarjetaEnlace`, `QueBuscamos`), no solo los párrafos. **Esperan a #290:** el token global (`btp-tokens.css`), el pie, `/celula-a-celula` y las páginas que no están en la lista; `.lede` y `Nota` no se tocan como reglas (siguen leyendo `var(--measure)`), pero dentro de esas siete páginas heredan los 58ch. Medido a 1280 px con `LINEA_MAX` de 80: los bloques con una línea de más de 80 caracteres bajan de 34 a 2 en `/datos`, de 41 a 2 en `/ciencia`, de 28 a 2 en `/ciencia/evidencia`, de 11 a 1 en `/gastos`, de 16 a 2 en `/prensa`, de 8 a 3 en `/marcas` y de 6 a 3 en `/equipo`; la línea más larga, de 91 a 84. Lo que queda por encima de 80 es el pie (84 y 81 caracteres), la entradilla heredada de `/equipo` (`PageHeader`, `max-w-2xl`: 85) y un párrafo de `/marcas` (85 en 576 px). Cuesta altura desde `lg` y nada a 375 px (medido: +0 en las siete): a 1280, `/ciencia` +501 px, `/ciencia/evidencia` +869 (de los +1599 de la página, 621 son del interlineado de la decisión F), `/datos` +278, `/gastos` +89, `/marcas` +53, `/prensa` +27 y `/equipo` +24 (+99 con el interlineado). (e) **Entradilla de `/ciencia`**: 91 caracteres en 780 px (`.lede`, 68ch); con 58ch, unos 76. Misma decisión que (d). **Con la decisión E, medida a 1280:** la entradilla de `/ciencia` (`.lede`) pasa de 91 a 76 caracteres por línea. (f) **Controles del mapa en móvil**, medidos a 375 px en ES y EN con la build previa a la segunda revisión (los dos idiomas dan lo mismo). **Con ratón, 43 por debajo de 44** (62 antes del barrido; R10 da 43 a 390): es la cifra que manda. La revisión del barrido contó 64 en ES y 41 en EN con otra sonda; no se ha reconciliado con R10 (inferencia: cuenta de otra manera los enlaces y las zonas pulsables). Son chips, fechas, flechas, el selector Esqueleto/Lista y el resumen de «De dónde salen los datos». El selector es un `.seg__btn` local de 30 px y no el componente `Segmentado` (44 px); sustituirlo es composición y va con esta decisión. **Con el dedo** (`pointer: coarse` emulado) quedan **36** controles, de 38 a 43 px. **Coste de la opción recomendada** (`min-height` de 44 en `(pointer: coarse)` a esos 36, inyectado y medido solo dentro de `main`): la página pasa de 29 292 a 29 427 px en ES (**+135**) y de 28 496 a 28 607 en EN (**+111**); con ratón también serían +306 (ES), y por eso no se propone. Recomendado: `min-height` de 44 en `(pointer: coarse)` y firmar su coste. **Decidido el 26-oct-2026 y aplicado en T3-CIERRE (en revisión de Miriam con el preview).** `min-height` de `--control-min` en `(pointer: coarse)` para los chips de filtro, las fechas, «Copiar enlace», «Ver en grande», las descargas del manifiesto, el resumen del foco y el de «De dónde salen los datos», la lista de capítulos del móvil (`MapaSectionNav`) y los botones de región y de secuencia del visor de RMN (`SpineMRIViewer`, que solo existe en esta página). Son dos excepciones a «solo `min-height`»: las dos flechas redondas del visor de RMN pasan a 44 × 44 (ancho y alto, como ya hacía `.nav-step`: con solo el alto saldrían óvalos) y las cajas de los dos deslizadores (el de tiempo y el de cortes de RMN) a `height` de 44 px, con la pista dibujada igual. El selector Esqueleto/Lista pasa a ser el componente `Segmentado` (modo `radios`, con iconos de Phosphor); `onFocoNavKey` ignora las teclas que nacen en él, porque sus flechas ya mueven y eligen entre sus dos opciones. Lleva 12 px de relleno lateral por opción y no 16 para que quepa en una fila con las flechas en la columna de 360 px de `lg` (con 16, las flechas bajaban a una segunda fila: +50 px en un panel que tiene que caber en la pantalla). Medido con el dedo emulado (`pointer: coarse` más `mobile`, sin WebGL, con la sonda de R10) a 375 px: los controles bajo 44 pasan de **35 a 5** en ES (la página, de 29 424 a 29 592 px, **+168**) y de **35 a 6** en EN (de 28 628 a 28 789, **+161**). Las cifras de arriba (36 controles, +135 y +111) salieron de otra sonda y no se reconcilian con esta; la de ahora incluye la barra «Lo último» (que baja por el punto a) y controles que aquella no listaba (el visor de RMN y las descargas del manifiesto). Con ratón a 375, la página mide +11 px en ES y +12 en EN (el selector, de 32 a 44 px de alto); a 1280, +63 y +57 (el selector cabe en una fila y no suma; el resto es el interlineado de la decisión F, por inferencia: no se aisló). **Quedan bajo 44 por el ancho y no por el alto**, porque no se toca el ancho de los controles rectangulares: las tres fechas de la línea de tiempo (35 × 44), el chip «All» de EN (37 × 44) y el botón «T1» del visor de RMN (39 × 44); y la casilla nativa de «Ordenar por idoneidad» (16 × 16; su `<label>` sí es pulsable). (g) **Cabecera de `/contacto` frente a la de `/datos`**: ver el punto 4 de las excepciones de arriba (las dos con v3 o las dos heredadas). **Decidido 26-oct-2026: las dos con v3; aplicada en `/contacto` en T3-CIERRE (punto 4).**
- **Segunda revisión del barrido (26-oct-2026): los toggles del visor 3D.** Las pastillas «Ver la diana orientativa» y «Ver la aguja de biopsia» de `BoneTriView` miden **44 px de alto con el ratón desde `lg`** (27 hasta ahora; con el dedo ya medían 44). Es un cambio visible en escritorio: crecen 17 px de alto sobre el visor, y por eso consta aquí y no solo en el registro. No llevan zona invisible de 44 px, como el botón de reencuadre, porque entre las dos pastillas hay 6 px y las zonas se pisarían. **Por debajo de `lg` con ratón siguen en 27 px:** el móvil no se toca en esta tanda, con el dedo ya miden 44 y WCAG 2.5.8 pide 24. Si Miriam prefiere el aspecto de 27 px, se borra el bloque `@media (min-width: 1024px)` de `BoneTriView.client.vue` y vuelven a 27 (cumple 2.5.8, no la vara de marca de 44 px). **Estado: propuesta, no firmada.**
- **Pendiente de firma:** el cierre de apoyo de las herramientas (decisión de producto) y todo el paquete de copy de la fase de páginas.

**Resumen para el PR: lo que Miriam ve en el móvil, con la opción recomendada y su coste medido a 375 px** (el detalle de cada línea, arriba). Si rechaza una, se revierte esa y solo esa.

| Decisión | Opción recomendada | Coste medido a 375 px | Si se rechaza | Estado |
| --- | --- | --- | --- | --- |
| Tira de tres cifras de `/marcas` | Una columna por debajo de `sm` | +126 px en la tira (la página, +157) | `[overflow-wrap:anywhere]` en el rótulo y tres columnas con «MULTIPLATAFORMA» partida | decidido 26-oct-2026, en revisión de Miriam con el preview |
| Cabecera de `/contacto` frente a `/datos` | v3 en las dos | 3 px menos de página (3404 a 3401); H1 de 30 px con interlineado 36 → 32,4 px; entradilla 18 → 19 px | Las dos heredadas: se quita `variante="pagina"` de `/datos` y de `/contacto` | decidido 26-oct-2026, en revisión de Miriam con el preview; aplicado en `/contacto` |
| Año de `/timeline` | Dejar la chip y que R8 admita `.tl-year` con su motivo | 0 px (cinco `<h2>` de 15 px) | `.h2-seccion`, que obliga a quitar la chip: mockup para Miriam | decidido 26-oct-2026, en revisión de Miriam con el preview (la chip se queda; la parte de R8 sigue sin aplicar) |
| Controles del mapa | `min-height` de 44 en `(pointer: coarse)` y el selector como `Segmentado` | Con el dedo: +168 px en ES y +161 en EN (de 35 controles bajo 44 a 5 y 6); con ratón: +11 y +12 | Siguen en 28 a 43 px con el dedo y el selector vuelve a `.seg__btn` de 30 px | decidido 26-oct-2026, en revisión de Miriam con el preview; aplicado |
| Diagrama de fenotipo y gráfica del FDG del mapa | Deslizables por debajo de `lg` | +298 px en el mapa | Encogidos, con letra de 6 a 8 px | decidido 26-oct-2026, en revisión de Miriam con el preview |
| Barra fija de apoyo | 106 px de alto, con «Más formas de ayudar» a 44 px y 13 px | +8 px en cada página con barra (reserva de 108 px) | 99 px, con el enlace a 20 px de alto | decidido 26-oct-2026, en revisión de Miriam con el preview |
| Enlaces rápidos de `/colabora` | 44 px de alto, sin hueco entre filas | +191 px en la página (la lista, 616 px frente a 436) | Vuelven a 20 px | decidido 26-oct-2026, en revisión de Miriam con el preview |
| Barra «Lo último» | Zona pulsable de 44 con un `::after`, sin crecer | 0 px (la barra mide 38,7 antes y después; lo que se toca, de 26 a 44) | El enlace vuelve a 25 px de alto y las filas de baseline a su recuento | decidido 26-oct-2026, en revisión de Miriam con el preview; aplicado |

La barra «Lo último» se decidió aparte (punto a de la lista de arriba): salida (i), aplicada, sin coste de maqueta (la barra mide 39 px antes y después).

## 9. Cómo añadir algo

1. **Un token:** a `btp-tokens.css` (derivado, sin hex). Si es un color nuevo, no: la respuesta es no. `pnpm gen:design-doc` y commit.
2. **Un componente:** si ya hay uno que lo hace, se usa. Si no, se escribe aquí su contrato (cuándo sí, cuándo no, props, accesibilidad, nunca), se añade a la guía viva y se usan los tokens, no valores.
3. **Una excepción:** `ds-exc` con motivo, y se defiende en la revisión.
4. `pnpm test:diseno` en verde y, si has bajado deuda, `--actualizar` para que baje la baseline.
5. Si el cambio es visible, capturas con `node scripts/diseno-capturas.mjs` antes y después.
6. **Un merge de `main` que trae un fichero nuevo con deuda** (otra rama lo escribió antes del sistema) pone `lint.yml` en rojo en el PR, porque la baseline no lo conoce. Se mezcla `main` en la rama y se absorbe con `pnpm test:diseno --actualizar --absorber`: solo añade ficheros que la baseline no conoce y se ve en el diff. A partir de ahí el fichero entra en el ratchet como los demás.

La plantilla del PR (`.github/pull_request_template.md`) pregunta: ¿añade token?, ¿añade componente?, ¿lo documenta?, ¿baja la baseline?

### Comprobaciones

`pnpm test:diseno` (en `lint.yml`, sin build) cuenta lo que se aparta del sistema, por regla y por fichero, y lo compara con `scripts/diseno-baseline.json`: un recuento puede bajar, nunca subir. `--lista R3` enseña cada hallazgo.

| Regla | Qué atrapa |
|---|---|
| R1 color | Hex, `rgb()` o `hsl()` con números y familias de color o sombras de Tailwind fuera de la paleta |
| R2 tamaño | Texto por debajo de 13 px (12 solo en mono y mayúsculas), `text-[Npx]`, `style="font-size"` |
| R3 radio | `border-radius` literal y `rounded-lg`, `-xl`, `-2xl`, `-3xl` o `rounded-[...]` |
| R4 movimiento | `transition-all`, `cubic-bezier()` literal, `ease-in`, `scale()` por debajo de 0,95 y `:hover` sin `@media (hover: hover)` |
| R5 duplicados | Clases de rol (`-h2`, `-aviso`, `-tarjeta`, `-chip`, `-pill`) declaradas fuera de `main.css` y de los componentes base |
| R6 en línea | `letter-spacing` en `style=""` y glifos usados como icono en una plantilla |
| R7 clases clave | `.link-action` sin 44 px y `.form-input` sin 16 px y 44 px (si se rompen, falla) |
| R8 cabeceras | `<h2>` de página sin `.h2-seccion` ni `.h2-declaracion`. En `/ciencia/evidencia`, `/aviso-legal`, `/privacidad` y `/cookies` vale también `.h3-seccion` (sección 8; la lista es `H2_COMO_H3` en `scripts/test-diseno.ts`) |
| R9 documento | Tablas de este documento o `tokens.css` público desfasados del canon, y tokens que nadie lee |
| R12 contenedor | Un `max-w-[Npx]` con `px-4 sm:px-6 lg:px-8` (contenedor propio) o `section-container` fuera de `/gracias` y `/links`. Con baseline |
| R13 medida | `max-w-2xl` o `max-w-3xl` en un `<p>`: la medida es `.measure`. Con baseline |
| R11 espacios | Un espacio al principio o al final de un elemento en una plantilla (`<span> {{ x }}</span>`, `<template> <em>`): Vue, en modo condense, lo elimina y el texto sale pegado. El espacio va como texto (`{{ ' ' }}` o `&nbsp;`). Con baseline |
| R10 render | `pnpm test:diseno-render`, en Chrome sobre el build estático (`diseno.yml`): desborde, borde del H1 bajo el logo, texto bajo 13 px, texto de un SVG bajo 13 px a su tamaño de pantalla (`texto_svg_bajo_suelo`: el `font-size` del `<text>` por la escala de su viewBox; el recuento anterior salta todo lo que cuelga de un `<svg>`), controles bajo 44 px, contraste, foco tapado por la cabecera fija, línea larga (`linea_larga`: bloques de texto cuya línea más larga pasa de 90 caracteres) y pegajoso tapado (`sticky_tapado`: un `sticky` cuyo `top` queda bajo la cabecera). Mismo ratchet, con `scripts/diseno-render-baseline.json`. El contraste mide también el enlace en línea (su degradado de marcador no lo exime); solo se salta el texto con una imagen o un degradado en un antepasado |
| R10 render, sin baseline | En `scripts/test-diseno-render.mjs`, o cumplen o no: el visor 3D de `/lesiones`, `.rejilla-par`, el cielo de `/links`, la barra «Lo último» (no crece, mide 44 px tocables de verdad con `elementFromPoint` y no tapa el borde de ningún control de la cabecera) y los `<h3>` de la prosa legal (rol `.h4-tarjeta`, 32 px de aire arriba y 12 abajo, con el H2 de capítulo mayor). Los dos últimos, a 390 y 1280 px |
| Texto de los componentes | `pnpm test:componentes-texto` (`diseno.yml`): en la guía viva, el texto que de verdad sale de `Dato`, `Referencia` y `TarjetaEnlace` (unidad pegada al valor, «ejemplo.Revista», «Externa(se abre…»). Sin baseline: si falla, falla |

Lo que esto **no** hace: juzgar jerarquía o gusto, detectar duplicados con otro nombre ni sustituir un teléfono real. Eso sigue en la auditoría humana. El emulado de Chrome no prueba el hover pegado, el zoom de iOS con campos pequeños ni el `safe-area`: quedan «sin verificar en dispositivo».

## 10. Nombre del documento y nombre vivo

Los documentos viejos (el Consolidado de junio, el cuadernillo v1 y v2) usaban otros nombres. Esta tabla los traduce.

| Antes (documento) | Ahora (código) |
|---|---|
| `.btn-primary`, `.btn--primary` | `.btn-cta` |
| `--space-1` a `--space-16` (base 8) | `--sp-4` a `--sp-64` (base 4 con el 12) |
| `titulo-1`, `titulo-2`, `titulo-3` | `.h1-pagina`, `.h2-seccion`, `.h3-seccion` |
| `alerta`, `.alert-callout`, `.dt-aviso`, `CelulaAviso` | `Aviso` (`.alert-callout` se mantiene hasta migrar) |
| `campo-*` | `.form-input`, `.form-label` |
| `toast` | no existe en el sitio |
| `btp-components.css` | no existe: las clases viven en `main.css` y en los componentes |
| violeta `#a44db2` | `#9d44ab` (`--color-miriam`) |
| cuerpo `system-ui` | Hanken Grotesk (`--font-body`) |
| `--tipo-body` | `--tipo-prosa` (el alias se mantiene) |
| `.eyebrow--sm` | `.etiqueta` (el alias se mantiene) |
| `--color-link`, `--color-emphasis`, `--color-action` | se borraron: eran alias que nadie leía |

## 11. Registro de cambios

- **v3, tanda 3, cierre (T3-CIERRE, 26 de octubre de 2026).** Ocho decisiones de diseño que la sesión tomó por delegación de Miriam y que ella ve con el preview. Sin tokens ni hex nuevos, sin ningún texto nuevo ni cambiado y sin claves de i18n borradas. **A.** Las cinco opciones recomendadas de la tabla de la sección 8 que ya estaban aplicadas (tira de cifras de `/marcas` en una columna, año de `/timeline` con su chip, diagrama y gráfica del mapa deslizables, barra fija de apoyo de 106 px, enlaces rápidos de `/colabora` a 44 px) constan como «decidido 26-oct-2026, en revisión de Miriam con el preview». **B.** `/contacto` lleva `variante="pagina"` como `/datos`: a 375 mide 3 px menos (3404 a 3401; EN, 3429 a 3426) y a 1280, 9 más (1990 a 1999; EN, +6). **C.** Controles del mapa con el dedo: `min-height` de `--control-min` en `(pointer: coarse)` (las flechas redondas del visor de RMN, a 44 × 44, y las cajas de los deslizadores, a `height` de 44 px) y el selector Esqueleto/Lista como `Segmentado`, con 12 px de relleno lateral por opción; los `.seg*` de `mapa-metastasis.vue` se borran (R1, R3 y R4 de ese fichero bajan en 8, 1 y 2). Con el dedo a 375: de 35 controles bajo 44 a 5 (ES) y a 6 (EN), y la página +168 y +161 px; con ratón, +11 y +12 a 375 y +63 y +57 a 1280. Detalle y lo que no se alcanza (fechas, «All», «T1», la casilla) en la sección 8 (f). **D.** Barra «Lo último»: `::after` de 44 px que arranca en el borde de arriba de la pantalla y no hace crecer la barra (38,7 px antes y después); lo que se toca de verdad pasa de 26 a 44. `objetivos_pequenos` baja 1 en cada ruta con barra, a 390 y a 1280, y también en las filas de célula (autorizado solo para esa métrica y a la baja); ningún fichero de `celula/` ni de alphafold cambia. **E.** Medida de 58ch por página (`[--measure:58ch]` en la raíz) en `/datos`, `/ciencia`, `/ciencia/evidencia`, `/gastos`, `/prensa`, `/marcas` y `/equipo`: a 375 no cambia nada y a 1280 las páginas crecen (sección 8, d); el token global, el pie y `/celula-a-celula` esperan a #290, y `.lede` y `Nota` heredan los 58ch dentro de esas siete páginas. **F.** `lg:leading-*` donde un `lg:text-*` pisaba el interlineado: 22 clases en `/ciencia/evidencia`, `TeamCard`, `TimelineEntry` y 19 del mapa; a 1280, `/timeline` +292 px, `/ciencia/evidencia` +621 (de los +1599), `/equipo` +74. Queda sin tocar `app/pages/index.vue` (la cita de la home, `text-2xl sm:text-3xl lg:text-4xl leading-[1.2]`, ya venía así de `main`: a 1280 mide 36 px con 40 de interlineado, 1,11, y no los 43,2 que pide `leading-[1.2]`; a 375 y en `sm` sí cumple el 1,2; es la home, donde manda lo medido, y queda para decidir). **G.** `.prose-ink > h3` es el rol `.h4-tarjeta` con 32 px arriba y 12 abajo (sección 8). **H.** StarMap: la nota de M44 se midió con donaciones sintéticas a 320, 360, 375, 390 y 414 px, en ES y EN, contra el contenedor `overflow: hidden`: no se recorta en ninguno (la nota queda a 3 px o más del borde izquierdo y su subtítulo no desborda), así que `StarMap.vue` no cambia. **Texto visible:** el HTML prerenderizado de las 85 páginas (ES y EN) se comparó palabra a palabra, antes y después, sin `script`, `style`, `svg` ni `head`: idéntico en las 85 (solo lo prerenderizado; lo que pintan los `ClientOnly` no se comparó). **Baseline de R10:** se regeneró con `--actualizar` (solo bajó) y a mano se quitó la clave `desborde_oculto: 0` que el comando añade a las cuatro filas de `/celula-a-celula` (no la traían), para que esas filas cambien solo en `objetivos_pequenos`; un `--actualizar` futuro la volverá a añadir, y vale 0 como si faltara. **Tests nuevos (R10, sin baseline):** `BARRA_ULTIMO` y `PROSA_LEGAL`; canario con la build anterior: los dos ROJO (la zona tocable de la barra mide 26 px; los `<h3>` miden 20 px en Fraunces), con la nueva, verdes.
- **v3, tanda 3, segunda revisión del barrido (26 de octubre de 2026).** Sin tokens ni hex nuevos, sin ningún texto nuevo ni cambiado y sin claves de i18n borradas. **Desde `lg`:** el chip de filtro del mapa de metástasis lleva `min-width` de 44 px, como las fechas y el orden de la tabla (el chip «All» de `/en/mapa-metastasis` medía 37 × 44; en español R10 no lo cuenta); los toggles de la diana y de la aguja de `BoneTriView` pasan de 27 a 44 px de alto con el ratón (sección 8); las dos frases de la etiqueta «Ordenar por idoneidad» del mapa llevan `.measure` (en inglés una medía 94 caracteres en 520 px: `.measure` estaba en un contenedor de 17 px y los hijos son de 13). **En todos los anchos, sin mover nada:** el botón de reencuadre de `BoneTriView` mantiene sus 30 px y gana una zona de 44 con un `::after` invisible (con el dedo ya medía 44 y ahí el `::after` se apaga). **R10:** `RUTAS` suma el espejo en inglés de cada página que toca la tanda (`/en/mapa-metastasis`, `/en/timeline`, `/en/collaborate`, `/en/contact`, `/en/expenses`, `/en/brands`, `/en/press`, `/en/lesiones` y `/en/reservorio`) con su baseline. Canario con la build anterior: la ruta del mapa da el chip «All» de 37 px y la línea de 94 caracteres, y las otras ocho solo dan la barra «Lo último», así que la lista protege algo. R10 no veía `BoneTriView` (sin WebGL): sus botones se midieron con WebGL por software, con ratón y con el dedo emulado, antes y después (con el dedo, 44 en las dos builds; con ratón a 375, 27 en las dos; a 1280, de 27 a 44), y R10 gana una comprobación sin baseline que abre `/lesiones` a 1280 px con WebGL por software y exige 44 × 44 de zona pulsable al reencuadre y a la diana (canario con la build anterior: ROJO, 30 × 30 y 197 × 27; con la nueva, verde; si el visor no llega a pintarse, falla y lo dice). Solo corre en la pasada completa o con `--visor`. **Documentación:** `--measure` documenta lo que da hoy (81 a 90 caracteres por línea, no los 75 o menos de 58ch: token, cabecera de R10 y sección 8, punto d); el comentario de `LatestUpdateBar.vue` ya no dice que la barra esté exenta (sección 8, punto a); el punto f de la sección 8 lleva lo medido a 375 px en ES y EN y el coste en altura de los 44 px con el dedo; la sección 8 termina con una tabla para el PR. **Ya no está en «no hecho»** el control de `BoneTriView`, salvo los toggles por debajo de `lg` con ratón (27 px, sección 8). **Sigue sin hacer, con su motivo:** la barra «Lo último» (decide Vega o Miriam: bajarla toca filas de célula y alphafold), las decisiones de móvil de la sección 8 y `--measure: 58ch` (cuando entre #290).
- **v3, tanda 3, revisión del barrido (26 de octubre de 2026).** Correcciones de la revisión del barrido, sin tokens ni hex nuevos y sin ningún texto nuevo ni cambiado (no hay filas «antes / después» que firmar). **Bloqueante:** en `/mapa-metastasis` por debajo de 768 px, la rejilla de la gráfica del FDG y la imagen clave no tenía columna explícita y la gráfica (460 px de mínimo) ensanchaba su columna hasta 460 px dentro de una tarjeta de 277: el `overflow-x: clip` de la raíz cortaba el resto (el segundo punto, la fecha, el final de los párrafos) y R10 daba 0 porque solo mira `scrollWidth`. Con `grid-cols-1` y `min-w-0` la gráfica mide 277 px a 375 y 316 a 414 (ES y EN), y se desliza (460 de recorrido). **R10:** métrica nueva `desborde_oculto` (una caja que se sale por la derecha y que no explica ningún contenedor de scroll, ni un recorte dentro de una caja más estrecha que la ventana; contra la build anterior da 2 en el mapa a 390, ahora 0; la galería de `/laminillas`, que se desliza a propósito, no cuenta); datos sintéticos de `/donations.json` y `/fundraiser.json` en `/colabora` (los controles del muro no existían para el test); la barra fija medida tras bajar 700 px (106 px de alto a 390); y la zona pulsable cuenta el `::before` o `::after` absoluto sin `pointer-events: none` (la descarga de la imagen clave del mapa medía 42 × 42 con `inset: -8px` y ahora 44 × 44 con -9). **Móvil:** las excepciones están en la sección 8, una a una y medidas (barra fija de 106 px en vez de 123, enlaces rápidos de `/colabora` sin hueco entre filas, pastillas y logos de `/marcas` y enlaces de `/timeline` con zona pulsable en vez de crecer, diagrama y gráfica del mapa deslizables; la cabecera v3 de `/datos`, que el barrido ya había aplicado, queda como decisión junto con la de `/contacto`, que no se aplica). Además, en el móvil: el subtítulo de «M44 · el Pesebre» del mapa de estrellas deja de pasar de lo que cabe a la izquierda del aura (a 375 px se cortaba por el marco). **Desde `lg`:** `/colabora`, bento con `align-items: start` y el botón pegado al texto (el hueco entre texto y botón en las tarjetas 02 y 04 pasa de 168, 244, 131, 180 y 184 px a 20 px, de 1024 a 1920), numeral de 36 px y título a la misma altura en la 01 y la 02, la tarjeta 03 con sus enlaces en Hanken a 15 px y la flecha como `Icon`, las tres notas bajo el mapa de estrellas como `<p class="measure">` con su icono (en vez de `Nota`, que el sistema deja a «Última actualización»), «Inicio» a 44 × 44. `/mapa-metastasis`: los filtros van bajo el visor (la copia solo se ve desde `lg`; las dos columnas del navegador de focos pasan de 1534 y 1058 px a 1332 y 1224 a 1280, de 1534 y 1065 a 1332 y 1231 a 1024; el pegajoso de la columna izquierda sigue, y sí actúa con el navegador en modo lista: 803 px frente a 1058), 44 px en el resumen de «De dónde salen los datos», las pestañas y las flechas de la RMN y su deslizador, las fechas y el botón de orden de la tabla, el resumen del detalle del foco y los deslizadores de pesos, el botón «ver el foco D11» en su línea y el enlace de las salvedades como `.link-action`; los rótulos de la RMN a 13 px; el relleno de la ficha con el número del foco, la barra de concordancia y la pastilla «+ partes blandas» pasan de 4,32 a 4,42:1 a 4,9:1 o más (el relleno, un 8 % más claro; la pastilla, con texto `--texto-1`). R10 del mapa a 1280: 41 controles bajo 44 → 3 (la barra «Lo último», la miniatura de la imagen clave, que R10 mide sin haber bajado hasta ella (260 × 2; desplazada hasta ella mide 260 × 260, así que es de medición y no de la maqueta), y la casilla de idoneidad, de 16 px dentro de una etiqueta de más de 44), contraste 19 → 0, texto bajo el suelo 4 → 0. `/ciencia`: el raíl acompaña a las secciones 2 a 5, se cierra, las tablas de anatomía patológica y de perfil molecular van a los 1104 px del shell, se reabre solo para los ejes, como copia para el ratón (`copia` en `CienciaSectionNav`: sin nombre, fuera del árbol de accesibilidad y del tabulador, pero con clic; `inert` también quitaría el clic), y el panel y el cierre vuelven a ancho completo; por debajo de `xl` no cambia. `/reservorio`: los chips (qué mirar, fecha, dispositivo) son una sola fila que se parte donde haga falta. Titulares: `/lesiones` («En corto»), `/gastos` (cinco) y `/contacto` (el de éxito) llevan `lg:h2-seccion`; el de la tarjeta lateral de `/contacto`, `lg:h3-seccion` (sección 8); `/ciencia/evidencia`, `bajo-lg:h3-seccion lg:h2-seccion`. R8: 16 → 8. R6: `/colabora` 4 → 3 (la flecha de la tarjeta 03) y el mapa 39 → 38 (la del botón D11). **Sigue sin hacer, con su motivo:** lo pendiente de decisión de la sección 8 (barra «Lo último», tira de cifras de `/marcas`, año en chip de `/timeline`, medida global de 58ch, entradilla de `/ciencia` y controles del mapa en móvil). **Retirada de las tres medidas locales de 58ch** (`.mapa-medida`, `[--measure:58ch]` en `TimelineEntry` y en `VideoCaso`): el día en que entre el PR #290 y el DS firme `--measure: 58ch` (fecha: la del merge de #290; hoy no la tiene, y la apunta quien lo fusione aquí); ese día `LINEA_MAX` de R10 baja de 90 a 80 y los recuentos de célula cambian.
- **v3, tanda 3, barrido final de diseño (26 de octubre de 2026).** Arreglos del barrido, sin tokens ni hex nuevos. **Una variante de Tailwind nueva, `bajo-lg:`** (`tailwind.config.js`): `max-lg:` no se genera, porque `screens` mezcla px con el `menu: 70rem` y Tailwind 3 avisa en el build y no emite la clase. `bajo-lg:` fija la receta del móvil para que un rol del sistema entre solo desde `lg` (`bajo-lg:text-2xl lg:h2-seccion`). **Móvil: lo que toca, medido a 375 px (altura de página antes y después).** (1) Suelo de 13 px: los rótulos del lienzo de `/datos` (`Cielo` a 13 px, con la columna de nombres de 84 a 96 px; `Dias` en mono de 12 px, meses en mayúsculas, columna de 40 a 46 px) y «Más formas de ayudar» de la barra fija (11,52 px a 13). (2) Medida: `.measure` o `max-width: var(--measure)` en `/datos`, `Nota`, el pie (`CampanaOficial`, ahora en cada párrafo y no en el contenedor: `ch` se resolvía con los 17 px del contenedor y los párrafos son de 15), `/gastos`, `/colabora`, `/contacto`, `/ciencia` y el vídeo; a 375 ningún bloque llega a la medida (`/ciencia/evidencia` y `/lesiones` no cambian de altura). (3) Zonas pulsables de 44 px: son un objetivo táctil y no composición, como el enlace de `/gracias` en el lote 3. El pie en inglés (`min-w-[44px]`: «Team», «Press» y «Slides» medían 36 y 40), `.dt-vista`, `.dt-dx__link`, los chips del reservorio, la barra fija (el enlace pasa a 44 px y la reserva de `main.has-support-bar` de 6,25 a 7,9 rem: las páginas con barra miden 26 o 27 px más a 375), las píldoras y los logos de prensa de `/marcas` (+30 px más), los 14 enlaces rápidos de `/colabora` (+311 px más), el zoom del mapa de estrellas (la barra mide lo mismo: el círculo de 36 px lo dibuja un `::before`) y el selector y el paginador del muro de donantes. Las zonas invisibles (el `::after` del botón de descarga de las imágenes clave del mapa y el rectángulo transparente de 24 px de los marcadores y de 44 px de las barras de línea de `LineaTiempo`) no mueven nada. (4) Dos recetas de componente que se ven: `/datos` usa `PageHeader` v3 (H1 de 1,0 a 1,08 de interlineado y entradilla de 18 a 19 px) y sus ocho H2 pasan de `.dt-h2` a `.h2-seccion mb-3` (mismo `--tipo-h2`; suma el `letter-spacing` y el `text-wrap: balance` del rol; la página mide 3 px menos a 375); `/contacto` pasa «Enviar mensaje» de `.btn-cta` a `.btn-secondary` (solo color: el coral es de donar, como en `/marcas`). (5) En el mapa de metástasis, el diagrama de fenotipo (680 px de mínimo) y la gráfica del FDG (460 px) se deslizan a los lados por debajo de `lg` en vez de encogerse hasta letra de 6 px: es suelo de 13 px, pero el diagrama mide 293 px más a 375. **Todo lo demás vale desde `lg`:** la escala 13/15/16/17 de `/datos` (los 13,5, 14 y 14,5 px pasan a ella; por debajo conservan su valor), los cuerpos de 13 px del mapa a 15, los doce H2 del mapa y los cuatro de `/equipo` al rol (`bajo-lg:` + `lg:h2-seccion`), `.h4-tarjeta` en los títulos de estudio de `/ciencia/evidencia`, `.link-inline` en los enlaces dentro de párrafo del mapa (`.link-action` hincha la línea a 44 px), las tres columnas del reservorio desde `xl` con subgrid (entre 1024 y 1279, una columna) y el margen del párrafo del motivo, el pegajoso de la columna del visor de `/lesiones` y la frase del hígado bajo las dos tarjetas (copia con `hidden`/`lg:hidden`: la que no se ve sale del árbol de accesibilidad), el bento 6/6 de `/colabora`, las dos columnas de `/contacto` en 1,3fr/1fr desde `xl`, la fila de CTA del hero de `/marcas` (`lg:flex-wrap`), el cuerpo de las notas mono (línea «Actualizado el…» del pie, nota del reservorio, tres notas del mapa de estrellas) en Hanken a 15 px, el halo de las etiquetas del mapa de estrellas y los controles de 44 px con ratón en el mapa. **Medida de 58ch, interina y local.** El barrido midió que 68ch da de 81 a 93 caracteres por línea en Hanken. El token `--measure` no se toca (`/celula-a-celula` lo usa y es del PR #290, que no se toca): el mapa de metástasis lo fija en 58ch en su raíz (`.mapa-medida`) y los hitos de `/timeline` y la transcripción de `VideoCaso` lo hacen con `[--measure:58ch]`. Si el DS firma 58ch después de #290, esas tres líneas se borran y `LINEA_MAX` de R10 baja de 90 a 80. **R10:** `RUTAS` suma `/en`, `/en/science`, `/en/science/evidence`, `/en/data` y `/en/tools` (el pie en inglés tenía tres enlaces de menos de 44 px de ancho que ninguna medición veía) y la métrica nueva `objetivos_svg` cuenta los controles dentro de un `<svg>` de menos de 24 px (WCAG 2.5.8; sin recuentos hoy). **R2:** regla nueva sobre el lienzo (`cx.font = '…Npx'`: de 9 a 11 px nunca, 12 px solo en mono), con cinco autotests y probada contra el código original (rojo: 2 hallazgos en `Cielo` y 2 en `Dias`) y contra el arreglado (verde). **No hecho, con su motivo** (detalle en el informe de la fase): la barra «lo último» a 44 px (decisión de Miriam), las tablas de `/ciencia` fuera del raíl, el navegador de focos del mapa (mover «Controles» cambia el orden en el móvil), los controles del mapa que dependen de su estructura (summary, pestañas de RMN, sliders), la tira de cifras de `/marcas` (ver arriba), los enlaces «Ver…» de `/timeline`, la cabecera de `/contacto` y los títulos del equipo en el móvil, el contraste de `.foco-id-casing` (es la paleta de fenotipos), los controles de `BoneTriView`, el stub de donaciones de R10 y el token a 58ch.
- **v3, tanda 3, lote 3 del repaso de escritorio (26 de octubre de 2026).** Composición y detalle (A30 a A37), sin tokens ni hex nuevos. **Móvil: solo cambia la medida (`.measure` en los párrafos de la home y de `/gastos` que ya cabían en 327 px), el suelo de 13 px (las tres etiquetas y los tres números de fase de `/gastos` pasan de 11 a 12 px en mono y mayúsculas: la página mide 4 px menos a 375) y, en `/gracias`, el enlace del usuario, que mide 44 px a todos los anchos porque es un objetivo táctil (la línea que lo lleva crece 21 px en el móvil; lo nombra la especificación).** Todo lo demás vale desde `lg`, tipografía incluida. **A30:** «Dónde estamos» en la home va en dos columnas con `.rejilla-par` (la ruta | «Qué buscamos» con sus dos botones), solo si hay peticiones; por debajo de `lg` la pila conserva sus márgenes (`mt-12`, `mt-6`). El `max-w-3xl` de la tarjeta de la ruta se queda: dentro de la columna no limita nada, y quitarlo ensancharía la tarjeta entre 769 y 1023 px. **A31:** «El caso en 3 frases» es banda tarjeta desde `lg` (`lg:bg-cream-card`), para que no queden dos cremas seguidas (la banda de herramientas va justo antes); por debajo de `lg` sigue crema, así que en móvil las dos cremas seguidas siguen ahí hasta que se decida quitar el `lg:` (toca el móvil). **A32:** el eyebrow del hero pierde su tope de 28rem desde `lg`: a 1024 mide 501 px (ES) y 492 (EN) en una columna de 572 y sale en una línea. Debajo de `lg` se queda; a 375 sigue en dos líneas, porque el texto mide unos 500 px en una columna de 327. **A33:** `GoFundMeProgress` en variante `card` son tres bloques sin estilo propio (la cifra, las fases, la prueba social y el botón) y, desde `lg`, una rejilla de dos columnas con áreas (cifra y botón | fases); el DOM va en el orden de siempre y, por debajo de `lg`, la tarjeta pinta exactamente lo de antes (los once elementos de dentro miden lo mismo con los bloques aplanados con `display: contents`, a 375 y a 768 px). Ni el fondo, ni el radio, ni el `data-tema` cambian: la excepción firmada de la sección 8 sigue como estaba. **A34:** `Puertas` son seis columnas con spans 2, 2, 2, 3 y 3 de 1024 a 1279 px (regla de retícula 2: antes eran tres columnas con un hueco a la derecha de la segunda fila); desde 1280 siguen las cinco en fila. Entre 640 y 1023 siguen siendo dos columnas con la quinta sola: es debajo de `lg` y no se toca en este lote. **A35:** el cielo de `/gracias` es a sangre, como el de `/links` (la columna sigue siendo `.section-container`): la constelación de 672 px acababa en un borde recto. «@miriamgonp» es un enlace de 44 px a su Instagram (de `REDES`) y, desde `lg`, la frase va en Hanken de 15 px en lugar de mono de 13; `thanks.follow` lleva ahora el hueco `{handle}` y el texto que se ve es el mismo. **A36:** `Constellation` mide la proporción de su caja con un `ResizeObserver` y, si es más ancha que alta, reparte las posiciones por la franja que `slice` deja ver y divide por esa proporción el tamaño de las estrellas y del velo. Medido en `/links` a 1920 px: el centro de la estrella «tú» estaba a -57 px del borde de la página y el de la guía a -18, y de las once ancladas se veían nueve; ahora caben las dos y las once, con el mismo tamaño y a la misma altura que a 1280 px (la «tú» mide 63 px en las dos anchuras; la guía mide 51 px y su centro está a 198 px del borde de la página en ambas). **Caber no era verse (revisión del lote).** La «tú» caía a unos 97 px del borde de arriba de la caja (el 7 % de sus 1391 px) y el avatar de `/links` empieza a 80, así que a 1024, 1280, 1440 y 1920 px se veía entre un 4 y un 7 % de su área, una punta coral detrás del avatar (a 1440 px, además, menos que antes de esta fase, según la captura de la revisión). `Constellation` lleva ahora la prop `tuTopePx` (solo `/links`, con 40): desde `lg` (1024 px, la media query real) y en cualquier proporción de caja, también en las altas de 1024 a 1389 px donde la rama ancha no entra, el centro de la «tú» queda a 40 px del borde de arriba de la caja (medido 39,7 a 39,9 px, a 113 del borde de la página), por encima del avatar, y se ve el 100 % de su área. Sin la prop, o por debajo de `lg`, no cambia nada: `/gracias` da 0 píxeles distintos a 375, 1280 y 1920 px y `/links` a 375 px también. **Por debajo de `lg` la «tú» de `/links` sigue detrás del avatar** (a 375 px se ve un 0,6 % de su área, a 768 un 4,3 %): arreglarlo es composición del móvil y no entra en este lote. Lo vigila `test:diseno-render` con una comprobación sin baseline: a 1024, 1280, 1440 y 1920 px la «tú» tiene que verse al menos un 90 % (se mira qué hay encima de su relleno con `elementsFromPoint`, no si cabe en el SVG), la guía cabe en su caja y, en las cajas anchas (1440 y 1920 px), caben las once ancladas. **A37:** `/gastos` lleva `.measure` en todo párrafo de más de dos líneas (R13 de 5 a 0; `linea_larga` de 12 a 0 y `texto_bajo_suelo` de 6 a 0 a 1280) y un solo nombre, «Destino del dinero» (EN «Where the money goes»), en el pie, la caja de confianza y la tarjeta 02 de `/colabora`; lo vigila `test:dinero-fuente`, sección 10. **No hecho:** el `Aviso` de `/gastos` (exige un título y no hay uno publicado que sirva: crearlo es copy) y `home.dinero_informe` («Ver el informe de gastos», en la home y en `/gracias`), un quinto nombre que la especificación del lote no nombra.
- **v3, tanda 3, lote 2 del repaso de escritorio (25 de octubre de 2026).** Lectura, suelo de 13 px y recetas locales de las páginas que aún no usaban v3, sin tokens ni hex nuevos. **Móvil: lo único que toca es el suelo de 13 px, el contenedor y la medida (y, por ser recetas y no composición, los cambios de componente que se listan al final).** Todo lo demás vale desde `lg`. **Suelo (K3):** `/datos` (73 declaraciones de las 74 que contaba R2: la que queda es el sello de 11 px de `Sello`, la excepción de célula a célula), el mapa de metástasis (190 de R2, más las insignias heredadas y las unidades pequeñas), `/timeline`, `/marcas`, `/colabora`, `/contacto`, `/equipo` (retratos), el visor del reservorio y el muro de donantes bajan al suelo; `texto_bajo_suelo` de R10: ver la baseline. Un tamaño bajo 13 px que no es mono en mayúsculas pasa a 13 px (`--texto-xs`); el mono en mayúsculas por debajo de 12 pasa a 12 (`--texto-2xs`). **Etiquetas de eje: 13 px y no los 12 que proponía el plan.** El 12 solo vale en mono en mayúsculas, y poner en mayúsculas «mm», «mL», «ng/mL» o los meses cambia lo que dicen o cómo se leen; los números sueltos («20×», «2026») podrían ir a 12 en mayúsculas y quedan en 13 por coherencia con el resto de su eje. **Medida (K2):** `.measure` en los párrafos de `/marcas`, `/colabora`, `/equipo`, `/contacto`, `/lesiones` (la línea de «Hueso» y la descripción del foco), `/prensa` (citas, cronología, guía), la ruta de `/ciencia`, el mapa (28) y los hitos de `/timeline`. **Retícula:** `.rejilla-par` en el boilerplate de `/prensa`, la tarjeta 05 de `/colabora` y «Carga tumoral» de `/datos`; sin hueco (regla 2) en los medios de `/prensa` (2 columnas), las herramientas de `/herramientas` y de `/ciencia` (`.ci-herr`) y los marcadores de `/datos` (3 columnas si cuadran); el muro de donantes en dos columnas. **Recetas (K6, K9, K10):** «Lo que NO somos» de `/equipo` es una `Banda` oscura y «Beyond the Protocol» pasa a una banda tarjeta propia (la oscura nunca va pegada a la de logos del pie); el hero de `/marcas` es su banda oscura y el cierre pasa a crema; las tarjetas de `/equipo` pierden la sombra dura por paridad y las de `/colabora`, la «dura» de 01, 03 y 05; los canales de `/contacto` son `TarjetaEnlace`; los cuatro avisos salmón con título del mapa son `Aviso` (el quinto, sin título, sigue en `.alert-callout`: crear su título es copy); la píldora «Histórico» del mapa es `pill-data--neutral` y `.status-badge--reference` se borra; los tres `btn-cta` de `/marcas` (que no donan) son `btn-secondary`. **Coral (K10):** se borra `coral.deep` de `tailwind.config.js`; los errores van con `.msg-atencion` (nueva, §5), los importes y el código de error en `--texto-1` con peso 600 y el enlace de GoFundMe del pie sin coral; los números del bento de `/colabora` pasan de berenjena al 22 % (1,56:1) a `--texto-3`. **La guía viva no gana ejemplo de `.msg-atencion` en este lote: necesita un texto de ejemplo nuevo y la tanda no cambia texto visible fuera de lo que nombra su especificación.** **Caveat:** las notas a mano del mapa de estrellas pasan a Hanken 15 px desde `lg`; por debajo de `lg` siguen en Caveat, así que la fuente se queda en `nuxt.config.ts` (quitarla exige decidir el móvil). **`/datos`:** la fila KPI de «Hoy» son tantas casillas como datos hay y el sistema nervioso central (un texto de ~330 caracteres) sale de la rejilla, debajo y a la medida; las cifras de ECOG y de líneas usan `--tipo-cifra` y el valor de texto «Nunca ha recibido», `--texto-xl`; «Carga tumoral» va en dos columnas (la figura y, a su lado, las notas y el último PET); los marcadores van en tres columnas cuando el número cuadra. A 13 px caben pocos rótulos en el eje de una minigráfica de 92 px: las líneas de referencia se dibujan todas, sin tocar, y los rótulos son solo los que distan 15 px o más de los ya puestos (primero el 1×, el límite normal). Es un cambio de rotulado, no de escala ni de datos, y queda para el comité de datos como la escala de la PCR. El margen izquierdo común de los ejes (`EJE_IZQ`) pasa de 34 a 46 px para que «0,25×» no se corte. **Botón flotante de `/marcas`:** aparece solo desde 1520 px (medido: 161 px de ancho a 24 px del borde; el contenido del shell acaba en W/2 + 552 px, así que a partir de unos 1474 px queda fuera; el plan decía ~1500, que resulta cierto). **Corrección del registro (barrido, 26 de octubre de 2026):** el párrafo de arriba dice que el móvil solo cambió en suelo, contenedor y medida, y no es cierto del todo. En `/marcas` la tira de tres cifras (`~248K`, `+1M`, `72,5%`) pasa de tres columnas a una por debajo de `sm` (`grid-cols-1 sm:grid-cols-3`, `marcas.vue`), con un comentario de código que lo explica y ninguna línea aquí. El barrido de diseño midió que la página crece 157 px a 375 (126 de ellos en la tira) y que con rótulos de 12 px «MULTIPLATAFORMA» mide 119 px en una columna de 93: no hay composición de tres columnas que quepa sin partir palabras. Es un cambio visible del móvil fuera de las tres excepciones permitidas: se propone como excepción en la sección 8 y decide Miriam. Si la rechaza, `[overflow-wrap:anywhere]` en el rótulo y `grid-cols-3` a 375.
- **v3, tanda 3, revisión del lote 1 (25 de octubre de 2026).** (1) **H2 de capítulo y de grupo:** `/ciencia/evidencia`, `/aviso-legal`, `/privacidad` y `/cookies` llevan `.h3-seccion` en el `<h2>` en lugar de `.h2-seccion`, porque a 375 px el H1 y el H2 medían lo mismo (30 px). Medido en render a 375 / 1280 px: H2 de evidencia 18 / 18 antes del lote 1, 30 / 36 en el lote, **20 / 24 ahora**; H2 de las legales 24 / 24, 30 / 36, **20 / 24**; el H1 de las cuatro, 30 / 36 antes y 30 / 48 con `.h1-pagina` (cambio de `PageHeader` v3, no de esta revisión); la entradilla de evidencia, 18 / 18 y 19 / 20,5. R8 lo admite solo en esas cuatro páginas (sección 8, `H2_COMO_H3`); `.prose > .h2-seccion` de `main.css` pasa a `.prose > :is(.h2-seccion, .h3-seccion)`. Abierto: en `/privacidad` a 375 px el H2 y los dos `<h3>` de la prosa miden 20 px (sección 8). (2) **A18 queda parcial.** La barra de `/laminillas` en `.section-wide` alinea la flecha «← Herramientas» con el logo (x = 88 a 1280 px) y el botón «Pedir los ficheros» con «Apoyar a Miriam» (ambos terminan en x = 1192), pero el título empieza en x = 217 y `h1_borde` de `/laminillas:1280` sigue en 1. La sección 3 dice que en `.shell--pantalla` el borde del título sigue alineado con el logo: en esa ruta no se cumple, y una barra de dos filas rompería la pantalla completa de la herramienta. Decisión abierta para `diseno`.
- **v3, tanda 3, lote 1 del repaso de escritorio (25 de octubre de 2026).** Páginas altas del repaso, sin tokens, componentes ni hex nuevos. **Contenedor (K1):** `/mapa-metastasis` (dos), `/datos`, `/ciencia/evidencia`, `/aviso-legal`, `/privacidad` y `/cookies` pasan a `.section-wide` (R12 baja a 0 en ellas); `/laminillas` lleva el contenido de su barra de título en `.section-wide` y deja el filete y la zona de trabajo a sangre (`.shell--pantalla` de la sección 3), con el relleno de siempre hasta `lg`. **Pegajoso (K4):** `/timeline`, el mapa (dos) y el raíl de `/ciencia` usan `.sticky-bajo-cabecera`; el índice de `/ciencia` y su rejilla empiezan en `xl`, no en `lg` (a 1024 la columna de lectura medía 660 px y las tablas 679 y 687). **Tabla ancha (K5):** la tabla de focos del mapa (1137 px en una columna de unos 850 junto al raíl) va en `.tabla-scroll` con `<colgroup>` y el número de foco fijo. **Cabeceras y roles (K7, K8, K14):** `/ciencia/evidencia` y las tres legales usan `PageHeader` v3; los H2 de grupo y de capítulo, `.h2-seccion` (a 375 px el H2 de evidencia pasaba de 18 a 30 px y los de las legales de 24 a 30: **corregido en la revisión del lote 1, en la entrada de arriba**); la cita de cada estudio deja la píldora `status-badge--reference` de 10 px por una línea mono de 13 px; el enlace al estudio mide 44 px y desde `lg` dice «Ver estudio»; el aviso pendiente de las legales es un `Aviso tipo="legal"`. **Foto de prensa:** desde `lg` las dos fotos se recortan a 4/5 con el encuadre puesto a mano. `/prensa` mantiene el contacto en `Banda tono="tarjeta"` (la oscura es la de las citas, y una segunda iría pegada a la banda de logos del pie: sección 3).
- **v3, tanda 3, revisión del lote 0 (25 de octubre de 2026).** (1) `.rejilla-par` fija su pista de la pila en `minmax(0, 1fr)`: con la `auto` implícita, una pieza ancha (SVG de 700 px, tabla con `nowrap`) ensanchaba la columna y el texto con ella (609 px en un móvil de 375). (2) `QueBuscamos` sube su sello a `--texto-xs` por su cuenta: `/herramientas` no hace el `provide` y pintaba 5 sellos a 11 px dentro de los `<details>` (con el cambio, `texto_bajo_suelo` de `/herramientas` baja de 10 a 0 en R10); la excepción de 11 px queda solo en célula a célula. (3) `linea_larga` se comprobó en dos máquinas: el mismo build da los mismos recuentos, ruta por ruta, en el Chrome del Mac y en el Chromium de Debian (Linux); el test además fija `--font-render-hinting=none` y espera a las fuentes para que el corte de línea no dependa de ellos (detalle y lo que sigue sin probar, en la cabecera de `scripts/test-diseno-render.mjs`).
- **v3, tanda 3, lote 0 del repaso de escritorio (25 de octubre de 2026).** Capa compartida, sin tokens ni hex nuevos. `main.css`: `.sticky-bajo-cabecera`, `.rejilla-par` y el tope a `--measure` de `.alert-callout`. `TarjetaEnlace` (meta), `QueBuscamos`, `Aviso` (caja) y `CampanaOficial` llevan la medida dentro; `QueBuscamos` pasa su cuerpo de 14 px a `--tipo-ui` desde `lg` (por debajo conserva los 14 px: el móvil no se toca en este lote). El pie se calla también en `/gastos` (la página ya pinta su aviso) y su cabecera usa la rejilla de 5 columnas del `<nav>`, con el aviso bajo «Herramientas». `Sello` sube a 13 px en las páginas del panel y dentro de `QueBuscamos` (cierra el pendiente de P1 en la home; la única excepción de 11 px es célula a célula, hasta #290). Tests: reglas R12 y R13 en `test:diseno` y métricas `linea_larga` y `sticky_tapado` en R10, con baseline que solo baja. La guía viva gana la sección «Retícula». Excepción firmada en la sección 8: la caja oscura de la campaña en la home.
- **v3, tanda 3, fase «esquema» (25 de octubre de 2026).** `/ciencia` gana el esquema del tumor (`TumorEsquema`) dentro del bloque «Explicado sin tecnicismos». Es una **figura de contenido, no un componente del sistema**: no entra en la sección 4 ni en la guía viva. Cero texto dentro del SVG, glifos en `<symbol>` compartidos con la leyenda, solo roles y tokens (cero hex, cero tokens nuevos), una columna hasta `lg` y tres desde `lg`. Reutiliza `CelulaLesion` sin tocarlo: el óvalo se aclara con un override local (`:deep(.les__borde)`), porque sobre crema su relleno por defecto deja el punto violeta a 1,22:1. Sus textos son los de la «Lista FINAL» del cotejo de `verificacion`, vigilados por `test:ciencia-pro`.
- **v3, fase P1: la home, `/lesiones`, `/links` y `/ciencia` (25 de octubre de 2026).** Las cuatro páginas aplican el sistema: `/lesiones` pasa a `.section-wide` con `PageHeader` v3, `Aviso`, roles de titular y el selector de lente como `Segmentado`; `/links` es una lista de `TarjetaEnlace` con el cielo a sangre; `/ciencia` lleva la cabecera encima de la rejilla (el borde del H1 cae bajo el logo) y la ruta con el texto visible desde el principio; la home pasa la cita a `Banda tono="oscura"`, los titulares a clases de rol y `Puertas` a `TarjetaEnlace`. Los cuatro visores 3D pintan su interfaz con `--escena-*` y a 13 px mínimo. `BADGE_RUTA` pasa al mapa único de estados (`hecho`, `curso`, `pendiente`, `atencion`). `Term` gana la prop `icono` (control de 44 px), su anillo de foco deja de ser coral y su hover va filtrado. `Nota` usa icono en vez del glifo y sube a 13 px. Siguen con color propio, pendientes de firma, los trazadores 68Ga y FDG, la aguja de biopsia y los materiales del 3D (JS). No hecho: bandas por capítulo en `/ciencia` (el índice pegajoso lo impide sin rehacer la rejilla; excepción propuesta en la sección 8).
- **v3, revisión de la fase P1 (25 de octubre de 2026).** `TarjetaEnlace` centra su contenido en vertical y lleva las etiquetas al borde de abajo (en las cinco Puertas el título quedaba a 13 px del borde de arriba y a 29 del de abajo, y la fila icono-título-flecha caía a dos alturas en una misma fila). `EsqueletoFocos` escribe sus marcas de vértebra y el contador de la insignia en 20 unidades de viewBox (13,3 px a 375 px de ancho; antes 9 unidades, 6 px reales). R10 mide ahora el texto de dentro de un SVG a su tamaño de pantalla (métrica nueva `texto_svg_bajo_suelo`, que entra en la baseline con lo que trae: 0 en las cuatro páginas de P1; el `texto_bajo_suelo 33 → 0` de `/lesiones` no contaba ese texto). El E2E mide la salida de las herramientas con movimiento reducido: sin él, `v-reveal` dejaba la Banda con `translateY(18px)` si el scroll hasta abajo saltaba en vez de barrerla.
- **v3, segunda revisión de la fase P1 (25 de octubre de 2026).** `TarjetaEnlace` responde al toque: `:active` oscurece el borde y, sin movimiento reducido, la tarjeta cede a 0,99 y la flecha avanza 2 px (`/links`, que viene de la bio de redes, había perdido el `.bio-link:active`; las Puertas, la banda de herramientas y `/ciencia` no lo tenían). **Lo que P1 deja sin hacer, completo:** (1) bandas por capítulo en `/ciencia` (CI-3, ahora en la sección 8 como propuesta sin firmar); (2) el `Sello` a 11 px en la home, fuera de `Dato` (`app/pages/index.vue` pinta `DatosSello` sin subirlo); (3) las pestañas de `BoneTriView`, que siguen siendo una receta propia «con el mismo lenguaje que `Segmentado`» y no el componente; (4) los trazadores 68Ga y FDG, `--lienzo-muestra`, la aguja de biopsia y los materiales del 3D (JS), con color propio y pendientes de firma de Miriam.
- **v3, revisión de la fase DS (24 de octubre de 2026).** `.link-inline`, `.prose a`, `.card-base`, `.data-card`, `.data-table`, `.form-*`, `.pill-data--neutral|berenjena`, `.sello`, `.stat-readout`, `.notes-disclosure` y la miga de `PageHeader` pintan con roles (en claro resuelven al mismo color: 0 px). Rol nuevo `--marcador` (el resaltado del enlace) y `--miriam-hover`, `--miriam-active` y `--secundario-hover` repetidos bajo `data-tema="oscuro"`. Las píldoras de datos pierden el icono de estado. `Dato`, `Referencia` y `TarjetaEnlace` ya no pierden espacios (R11 y `test:componentes-texto`). `Segmentado desplazable` deja el anillo de foco entero. R10 mide el contraste del enlace en línea.
- **v3, segunda revisión de la fase DS (24 de octubre de 2026).** El sello de evidencia dentro de `Dato` sube de 11 a 13 px (suelo tipográfico; fuera de `Dato` no se mueve). `TarjetaEnlace` en tono `apoyo` deja de cambiar de fondo al pasar (el hover de `.btn-cta` mide 4,31:1 y su `:active` 4,40:1: documentado en la sección 5 y pendiente de decisión de Miriam). Pendiente para P9: glifos de `Sello` a `Icon ph:*`.
- **v3 (octubre de 2026).** Los tokens se ajustan a la home (H2 600 de 30 a 36 px, tracking -0,03em, shell de 1200 px, cuerpo de 16 px). Once tokens o roles nuevos, nueve componentes base y los arreglos de clase en `main.css`. Sin hex, fuentes ni radios nuevos. Suelo tipográfico de 13 px. Estados derivados con icono. Foco por rol, 44 px dentro de la clase, campos de 16 px, hover filtrado y red de movimiento reducido. `test:diseno` con baseline que solo baja. El canon deja de ser una copia vendorizada.
- **v2 (julio de 2026).** Tokens de rol por tema, estados con `color-mix`, data-viz clínica derivada.
