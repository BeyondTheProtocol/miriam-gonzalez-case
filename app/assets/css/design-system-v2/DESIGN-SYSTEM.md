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

Los componentes no pintan con la paleta: pintan con **roles** (`--fondo`, `--superficie`, `--texto-1`, `--texto-2`, `--texto-3`, `--identidad`, `--anillo-foco`, `--cta-texto`, `--trazo-*`). Una banda con `data-tema="oscuro"` los remapea, y el componente no se entera. Por eso un token derivado de un rol se declara también bajo `[data-tema="oscuro"]`: una variable que apunta a otra se resuelve donde se declara.

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
| `--miriam-hover` | `color-mix(in srgb, var(--color-miriam) 88%, var(--color-text))` |  |  |
| `--miriam-active` | `color-mix(in srgb, var(--color-miriam) 78%, var(--color-text))` |  |  |
| `--secundario-hover` | `color-mix(in srgb, var(--color-text) 6%, transparent)` |  |  |
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
| `.h3-seccion` | `--tipo-h3` | Fraunces 600, 20 a 24 px | Un subtítulo dentro de un capítulo | Como título de tarjeta |
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

## 3. Shell, ritmo y bandas

**Shell.** `.section-wide` es el ancho único de cabecera, cuerpo y pie: `--shell-max` (1200 px) con relleno `--gutter` (24, 32 desde 640 y 48 desde 1024). El borde izquierdo del H1 cae siempre bajo el logo.

- `.section-container` (896 px, centrado) queda solo para `/gracias` y `/links`, que son una columna centrada a propósito.
- `.shell--pantalla` es la excepción firmada para la zona de trabajo de `/laminillas` y del explorador: ocupa todo el ancho, pero **la barra con el título va en `.section-wide`**, para que el borde del título siga alineado con el logo.

**Ritmo.** `.section-spacing` entre capítulos (80 px en móvil, 112 desde 640) y `.section-spacing--compacta` (56 y 80) para un bloque corto. La primera sección de una página tiene menos aire por arriba porque ya está bajo la cabecera.

**Bandas.** `<Banda tono="crema|tarjeta|oscura">` es el bloque de ancho completo. Lleva dentro `section-spacing`, `v-reveal` y `.section-wide`.

- La **oscura** usa `data-tema="oscuro"`, es siempre a sangre y no hay versión de caja redondeada.
- **Una oscura por página**, y nunca pegada a la banda de logos del pie.
- Alterna crema y tarjeta para marcar capítulos; no pongas dos bandas del mismo tono seguidas.

## 4. Contrato por componente

Cada componente dice cuándo sí, cuándo no, qué props tiene y qué no se hace nunca. Los nombres vivos (`btn-cta`, `card-base`, `link-action`) se mantienen: renombrar cientos de usos no ganaba nada visible.

### Botones y enlaces (clases en `main.css`)

- `.btn-cta`: **solo para apoyar** (donar). Uno por pantalla. Coral con texto berenjena en cualquier fondo. Nunca para navegar.
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

Icono, título, meta y flecha; interna (`to`) o externa (`href`, con aviso de pestaña nueva). `tono`: `suave`, `destacada` (la protagonista, **una por grupo**) o `apoyo` (coral, **solo para donar**). Para una herramienta: `verbo`, `esfuerzo`, `nivel` y el slot `preview`. Hover: borde más oscuro y flecha 2 px; no se eleva. Nunca una tarjeta de las cinco recetas viejas.

### `.card-base` y `.card-marked`

Una tarjeta: `.card-base` (papel y filete), `.card-marked` (la protagonista: borde de 1,5 px y sombra dura; el hover solo se mueve si es `a` o `button`). Nada de tarjetas locales (`dt-tarjeta`, `collab-card--hard`…).

### `Dato`

Valor, unidad, etiqueta, fecha formateada, sello de evidencia y fuente enlazada. `tam`: `lg`, `md`, `sm`. **Nunca lleva una cifra que no venga de su fuente**: una cifra clínica nueva pasa antes por verificación.

### `Aviso`

`tipo="apoyo|legal|limites"`, `titulo` obligatorio, `plegable`. Fondo `--superficie`, filete izquierdo `--identidad`, icono. `Nota` queda solo para «Última actualización». Nunca un caveat clínico en mono de 12 px.

### `Segmentado`

`modo="radios|pestanas|toggle"`, `etiqueta` obligatoria, `desplazable`. Teclado completo (flechas, Inicio, Fin). El activo lleva borde de 2 px además del color. 44 px mínimo.

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

Cinco estados, derivados de la paleta y **siempre con icono y palabra**. El color nunca es la única señal.

| Estado | Fondo | Texto | Icono | Se usa para |
|---|---|---|---|---|
| `hecho` | violeta al 16 % sobre el fondo | `--texto-1` | check en círculo | Un paso dado o un dato verificado |
| `curso` | `--texto-1` (invertido) | `--fondo` | círculo a medias | Lo que se hace hoy |
| `pendiente` | `--texto-1` al 6 % | `--texto-2` | círculo de puntos | Lo que viene o lo neutro |
| `nopuede` | transparente, borde discontinuo | `--texto-3` | círculo tachado | Lo que no puede hacerse (todavía) |
| `atencion` | coral al 18 % sobre el fondo | `--texto-1` | triángulo | Lo que pide una decisión o un cuidado |

- Clases: `.status-badge--hecho|curso|pendiente|nopuede|atencion`. Los tonos de `.pill-data` se mantienen por nombre (`info` es pendiente, `warn` es atención, `positive` es hecho), así `science.yml` no cambia.
- Las variantes viejas de `.status-badge` (`--active`, `--firma`, `--pending`, `--candidate`…) siguen existiendo hasta que `RutaPasos` y las páginas migren; entonces se borran.
- **El coral no es texto sobre crema** (2,6:1): como texto se usa `--cta-texto` (berenjena sobre claro, coral sobre berenjena) y un icono.
- Contrastes medidos del texto de cada estado sobre su fondo: de 4,6 a 14,6. Medidos con `color-mix` en sRGB, no en un teléfono.
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
| R8 cabeceras | `<h2>` de página sin `.h2-seccion` ni `.h2-declaracion` |
| R9 documento | Tablas de este documento o `tokens.css` público desfasados del canon, y tokens que nadie lee |
| R10 render | `pnpm test:diseno-render`, en Chrome sobre el build estático (`diseno.yml`): desborde, borde del H1 bajo el logo, texto bajo 13 px, controles bajo 44 px, contraste y foco tapado por la cabecera fija. Mismo ratchet, con `scripts/diseno-render-baseline.json` |

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

- **v3 (octubre de 2026).** Los tokens se ajustan a la home (H2 600 de 30 a 36 px, tracking -0,03em, shell de 1200 px, cuerpo de 16 px). Once tokens o roles nuevos, nueve componentes base y los arreglos de clase en `main.css`. Sin hex, fuentes ni radios nuevos. Suelo tipográfico de 13 px. Estados derivados con icono. Foco por rol, 44 px dentro de la clase, campos de 16 px, hover filtrado y red de movimiento reducido. `test:diseno` con baseline que solo baja. El canon deja de ser una copia vendorizada.
- **v2 (julio de 2026).** Tokens de rol por tema, estados con `color-mix`, data-viz clínica derivada.
