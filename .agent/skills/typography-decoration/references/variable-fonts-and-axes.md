# Variable Fonts, Axes & Fallback Strategy

## 1. Variable Typefaces in Material Design 3

Variable fonts contain multiple style variations within a single font file, allowing continuous interpolation along customizable axes.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                VARIABLE FONT FAMILIES                                  │
├─────────────────┬───────────────────────────────────┬──────────────────────────────────┤
│ Font Family     │ Core Supported Axes               │ Advanced / Parametric Axes       │
├─────────────────┼───────────────────────────────────┼──────────────────────────────────┤
│ Roboto Flex     │ wght, wdth, GRAD, opsz, slnt      │ XOPQ, YOPQ, XTRA, YTUC, YTLC,    │
│                 │                                   │ YTAS, YTDE, YTFI                 │
│ Roboto Serif    │ wght, wdth, GRAD, opsz, slnt      │ —                                │
│ Roboto Mono     │ wght, ital                        │ —                                │
│ Noto Sans       │ wght, wdth, ital                  │ Multi-script variations          │
└─────────────────┴───────────────────────────────────┴──────────────────────────────────┘
```

---

## 2. Variable Font Axes Specification

### 2.1 Standard Axes

| CSS Tag | Axis Name | Range | Description & Application |
| :--- | :--- | :--- | :--- |
| `'wght'` | Weight | `100` – `1000` | Controls stroke thickness. `400` = Regular, `500` = Medium, `600` = SemiBold, `700` = Bold. |
| `'wdth'` | Width | `25` – `150` | Horizontal character proportions. `100` = Normal, `<100` = Condensed (dense tables), `>100` = Expanded (hero headers). |
| `'GRAD'` | Grade | `-200` – `150` | Modifies optical weight **without shifting layout or line breaks**. |
| `'opsz'` | Optical Size | `7` – `72` | Refines contrast and counter spaces for specific rendered font sizes. |
| `'slnt'` | Slant | `-10` – `0` | Angle of italicization (in negative degrees). |

### 2.2 Advanced Parametric Axes (Roboto Flex)

| CSS Tag | Axis Name | Range | Description |
| :--- | :--- | :--- | :--- |
| `'XOPQ'` | Thick stroke | `27` – `175` | Adjusts vertical thick stems. |
| `'YOPQ'` | Thin stroke | `25` – `135` | Adjusts horizontal thin bars and serifs. |
| `'XTRA'` | Counter width | `323` – `603` | Adjusts width of internal white space inside letters. |
| `'YTUC'` | Uppercase height | `528` – `760` | Adjusts height of capital letters relative to baseline. |
| `'YTLC'` | Lowercase height | `416` – `570` | Adjusts x-height of lowercase letters. |
| `'YTAS'` | Ascender height | `645` – `854` | Adjusts ascenders (d, b, h, l, t). |
| `'YTDE'` | Descender depth | `-305` – `-98` | Adjusts descenders (p, q, y, g, j). |
| `'YTFI'` | Figure height | `538` – `760` | Adjusts numeral heights to align with uppercase or lowercase. |

---

## 3. Dark Mode Optical Grade Compensation

### The Problem: Optical Blooming
When light text renders against a dark background (`#141218`), the irradiation illusion causes white letters to look significantly bolder and heavier than dark letters on a light background, even with identical font weights.

### The Solution: Negative Grade
Adjust the `'GRAD'` axis in dark mode to reduce stroke thickness **without changing character width, line wrapping, or layout geometry**.

```css
/* Light Theme */
:root {
  font-variation-settings: 'GRAD' 0, 'wght' 400;
}

/* Dark Theme */
.dark {
  /* Counteract optical blooming in dark mode */
  font-variation-settings: 'GRAD' -30;
}

/* Emphasized Text in Dark Mode */
.dark .font-bold,
.dark .m3-headline-emphasized {
  font-variation-settings: 'GRAD' -50, 'wght' 700;
}
```

---

## 4. Multi-Script Font Fallback Chain

To guarantee complete global script coverage while preserving Material Design aesthetics, always configure font fallbacks in this exact order:

```css
/* Global font family fallback stack */
--font-sans: 'Roboto Flex', 'Roboto', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### Fallback Behavior:
1. **Latin / Cyrillic / Greek**: Rendered via `Roboto Flex` (with full variable axis support).
2. **Standard Fallback**: Falls back to `Roboto` if variable features are unsupported.
3. **East Asian & Global Scripts**: Automatically handled by `Noto Sans SC` (Simplified Chinese), `Noto Sans JP` (Japanese), `Noto Sans KR` (Korean), or regional Noto Sans families.
4. **System Baseline**: Falls back to platform native system fonts (`system-ui`, `PingFang SC`, `Segoe UI`).
