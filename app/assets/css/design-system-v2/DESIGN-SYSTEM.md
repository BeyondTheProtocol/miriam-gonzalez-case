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
| `--measure` | `68ch` |  | valor mío para Hanken a 17 px (inferencia, sin probar con lectores) |

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
- **`.h3-seccion` en el `<h2>` de capítulo de las tres legales y de grupo de `/ciencia/evidencia`** (revisión del lote 1, 25-oct-2026). Motivo: a 375 px el H1 mide 30 px y `.h2-seccion` también (30 a 36), así que el titular de grupo igualaba al de página y luego saltaba de 30 a 15 px en el título de cada estudio; en las legales, 11 capítulos de 36 px bajo un H1 de 48 px a 1280. El nivel semántico no cambia (sigue siendo un `<h2>`, sin saltar de H1 a H3) y no se toca ningún token. Medido en render: evidencia 20 px a 375 y 24 a 1280 (antes de esta revisión, 30 y 36; antes del lote 1, 18 y 18); legales 20 y 24 (antes de la revisión, 30 y 36; antes del lote 1, 24 y 24). **Cómo se vigila:** R8 admite `.h3-seccion` en un `<h2>` solo en esas cuatro páginas (`H2_COMO_H3`, `scripts/test-diseno.ts`, con dos autotests que se ponen rojos si la lista se vacía o se abre a todas); en cualquier otra página sigue contando. **Abierto, para `diseno`:** en `/privacidad` a 375 px el H2 de capítulo (20 px) y los dos `<h3>` sueltos de la prosa (20 px, el `h3` del plugin de tipografía) miden lo mismo; los separan el número del capítulo y 48 px de aire por arriba frente a 32. A 1280 no pasa (24 y 20). Falta decidir el rol del `<h3>` dentro de una prosa legal. **Estado: propuesta de la revisión, no firmada; Miriam la ve porque cambia el tamaño de los titulares en cuatro páginas.**
- **Pendiente de firma:** el cierre de apoyo de las herramientas (decisión de producto) y todo el paquete de copy de la fase de páginas.

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

- **v3, tanda 3, lote 2 del repaso de escritorio (25 de octubre de 2026).** Lectura, suelo de 13 px y recetas locales de las páginas que aún no usaban v3, sin tokens ni hex nuevos. **Móvil: lo único que toca es el suelo de 13 px, el contenedor y la medida (y, por ser recetas y no composición, los cambios de componente que se listan al final).** Todo lo demás vale desde `lg`. **Suelo (K3):** `/datos` (73 declaraciones de las 74 que contaba R2: la que queda es el sello de 11 px de `Sello`, la excepción de célula a célula), el mapa de metástasis (190 de R2, más las insignias heredadas y las unidades pequeñas), `/timeline`, `/marcas`, `/colabora`, `/contacto`, `/equipo` (retratos), el visor del reservorio y el muro de donantes bajan al suelo; `texto_bajo_suelo` de R10: ver la baseline. Un tamaño bajo 13 px que no es mono en mayúsculas pasa a 13 px (`--texto-xs`); el mono en mayúsculas por debajo de 12 pasa a 12 (`--texto-2xs`). **Etiquetas de eje: 13 px y no los 12 que proponía el plan.** El 12 solo vale en mono en mayúsculas, y poner en mayúsculas «mm», «mL», «ng/mL» o los meses cambia lo que dicen o cómo se leen; los números sueltos («20×», «2026») podrían ir a 12 en mayúsculas y quedan en 13 por coherencia con el resto de su eje. **Medida (K2):** `.measure` en los párrafos de `/marcas`, `/colabora`, `/equipo`, `/contacto`, `/lesiones` (la línea de «Hueso» y la descripción del foco), `/prensa` (citas, cronología, guía), la ruta de `/ciencia`, el mapa (28) y los hitos de `/timeline`. **Retícula:** `.rejilla-par` en el boilerplate de `/prensa`, la tarjeta 05 de `/colabora` y «Carga tumoral» de `/datos`; sin hueco (regla 2) en los medios de `/prensa` (2 columnas), las herramientas de `/herramientas` y de `/ciencia` (`.ci-herr`) y los marcadores de `/datos` (3 columnas si cuadran); el muro de donantes en dos columnas. **Recetas (K6, K9, K10):** «Lo que NO somos» de `/equipo` es una `Banda` oscura y «Beyond the Protocol» pasa a una banda tarjeta propia (la oscura nunca va pegada a la de logos del pie); el hero de `/marcas` es su banda oscura y el cierre pasa a crema; las tarjetas de `/equipo` pierden la sombra dura por paridad y las de `/colabora`, la «dura» de 01, 03 y 05; los canales de `/contacto` son `TarjetaEnlace`; los cuatro avisos salmón con título del mapa son `Aviso` (el quinto, sin título, sigue en `.alert-callout`: crear su título es copy); la píldora «Histórico» del mapa es `pill-data--neutral` y `.status-badge--reference` se borra; los tres `btn-cta` de `/marcas` (que no donan) son `btn-secondary`. **Coral (K10):** se borra `coral.deep` de `tailwind.config.js`; los errores van con `.msg-atencion` (nueva, §5), los importes y el código de error en `--texto-1` con peso 600 y el enlace de GoFundMe del pie sin coral; los números del bento de `/colabora` pasan de berenjena al 22 % (1,56:1) a `--texto-3`. **La guía viva no gana ejemplo de `.msg-atencion` en este lote: necesita un texto de ejemplo nuevo y la tanda no cambia texto visible fuera de lo que nombra su especificación.** **Caveat:** las notas a mano del mapa de estrellas pasan a Hanken 15 px desde `lg`; por debajo de `lg` siguen en Caveat, así que la fuente se queda en `nuxt.config.ts` (quitarla exige decidir el móvil). **`/datos`:** la fila KPI de «Hoy» son tantas casillas como datos hay y el sistema nervioso central (un texto de ~330 caracteres) sale de la rejilla, debajo y a la medida; las cifras de ECOG y de líneas usan `--tipo-cifra` y el valor de texto «Nunca ha recibido», `--texto-xl`; «Carga tumoral» va en dos columnas (la figura y, a su lado, las notas y el último PET); los marcadores van en tres columnas cuando el número cuadra. A 13 px caben pocos rótulos en el eje de una minigráfica de 92 px: las líneas de referencia se dibujan todas, sin tocar, y los rótulos son solo los que distan 15 px o más de los ya puestos (primero el 1×, el límite normal). Es un cambio de rotulado, no de escala ni de datos, y queda para el comité de datos como la escala de la PCR. El margen izquierdo común de los ejes (`EJE_IZQ`) pasa de 34 a 46 px para que «0,25×» no se corte. **Botón flotante de `/marcas`:** aparece solo desde 1520 px (medido: 161 px de ancho a 24 px del borde; el contenido del shell acaba en W/2 + 552 px, así que a partir de unos 1474 px queda fuera; el plan decía ~1500, que resulta cierto).
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
