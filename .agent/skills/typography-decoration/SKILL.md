---
name: typography-decoration
description: >
  Material Design 3 (M3) Typography Decoration and Styling System.
  Covers the 30-style type scale (15 baseline + 15 emphasized), variable font axes (Roboto Flex, Roboto Serif, Roboto Mono, Noto Sans),
  design tokens (--md-sys-typescale-*), typesetting rules, language script height adaptations, contrast/accessibility,
  editorial treatments, and concrete React 19 + Tailwind CSS 4 + @material/web component decoration patterns.
  Use when: "typography", "typescale", "type tokens", "font styles", "font hierarchy", "text styling", "editorial treatment", "M3 type".
user-invokable: true
argument-hint: "[scale|tokens|fonts|editorial|audit|component] [description]"
---

# Material Design 3 Typography Decoration & Styling Skill

This skill provides a definitive, production-grade guide to typography decoration and text styling under **Material Design 3 (M3 / Material You)** guidelines. It establishes strict type scale consistency, accessibility compliance, tokenized theming, and expressive typography treatments across all frontend components.

---

## 1. Core Principles & Philosophy

1. **Hierarchy & Purpose-Driven Roles**:
   Typography is structured into **5 distinct semantic roles** (`Display`, `Headline`, `Title`, `Body`, `Label`), each offering **3 sizes** (`Large`, `Medium`, `Small`). Use the role that matches the function of the text, not just its visual size.
2. **Dual-Set Type Scale (30 Styles)**:
   M3 defines **15 baseline type styles** paired with **15 emphasized type styles** (introduced in the M3 Expressive update). Emphasized styles feature heavier weights and tighter tracking for selection states, actions, unread indicators, and hero moments.
3. **Variable Typography & Font Fallback**:
   Harness variable font axes (`wght`, `wdth`, `GRAD`, `opsz`, `slnt`) for fine-grained optical tuning without layout shifting. Always preserve global script coverage via fallback:
   $$\text{Roboto Flex} \longrightarrow \text{Roboto} \longrightarrow \text{Noto Sans [Script]} \longrightarrow \text{system-ui, sans-serif}$$
4. **Platform-Agnostic Typesetting & Language Height**:
   Respect bounding-box half-leading on Web/iOS and baseline metrics on Android. Automatically adapt line heights to international language script height categories (Small, Medium, Large, Extra Large).
5. **Rigorous Contrast & Accessibility**:
   Ensure minimum WCAG 2.x contrast ratios of **3:1** for large text and **4.5:1** for small/body text, with tabular figures for changing metrics and distinct underlined styling for hyperlinks.

---

## 2. Typeface Strategy & Font Family Catalog

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   M3 TYPEFACE CATALOG                                          │
├──────────────────┬─────────────────┬───────────────────────────────────────────────────────────┤
│ Typeface         │ Nature          │ Purpose & Key Axes                                        │
├──────────────────┼─────────────────┼───────────────────────────────────────────────────────────┤
│ Roboto           │ Static          │ Default baseline Android/M3 typeface (3,300+ glyphs)      │
│ Roboto Flex      │ Variable        │ Primary variable font: wght, wdth, GRAD, opsz, slnt + 8adv│
│ Roboto Serif     │ Variable        │ Functional editorial & long-form reading (wght, wdth, opsz│
│ Roboto Mono      │ Static/Variable │ Monospaced: tabular numbers, code, timestamps, data rows  │
│ Noto Sans        │ Global Fallback │ Universal multi-script collection (150+ global scripts)   │
└──────────────────┴─────────────────┴───────────────────────────────────────────────────────────┘
```

### 2.1 Brand vs. Plain Typeface Roles
- **Brand Typeface (`--md-ref-typeface-brand`)**: Applied to expressive, large styles (`Display`, `Headline`, `Title Large`). Conveys personality and brand identity (e.g. `Roboto Flex`, `Google Sans`, or custom brand serif/sans).
- **Plain Typeface (`--md-ref-typeface-plain`)**: Applied to high-legibility styles (`Title Medium/Small`, `Body`, `Label`). Prioritizes scannability at small sizes (e.g. `Roboto`, `Roboto Flex` with standard optical size, `Noto Sans`).

### 2.2 Variable Font Axes Reference
When using variable typefaces like `Roboto Flex`, adjust optical properties via CSS `font-variation-settings`:

| Axis Name | CSS Tag | Value Range | Use Case & Decoration Purpose |
| :--- | :--- | :--- | :--- |
| **Weight** | `'wght'` | `100` – `1000` | Controls stroke thickness. Default regular: `400`, medium: `500`, bold: `700`. |
| **Width** | `'wdth'` | `25` – `150` | Horizontal character compression. Narrow (`<100`) fits dense tables/chips; wide (`>100`) creates expressive headlines. |
| **Grade** | `'GRAD'` | `-200` – `150` | Changes visual thickness **without changing character width or triggering reflow**. Use negative grade in Dark Mode to counteract optical blooming. |
| **Optical Size** | `'opsz'` | `7` – `72` | Adjusts x-height, counter-form, and stroke contrast optimized for the rendered point size. |
| **Slant** | `'slnt'` | `-10` – `0` | Angle of letterforms for stylistic italicization. |
| **Ascender Height** | `'YTAS'` | `645` – `854` | Advanced axis: adjusts ascender length. |
| **Descender Depth**| `'YTDE'` | `-305` – `-98` | Advanced axis: adjusts descender depth. |
| **Uppercase Height**| `'YTUC'` | `528` – `760` | Advanced axis: adjusts capital letter heights. |
| **Lowercase Height**| `'YTLC'` | `416` – `570` | Advanced axis: adjusts x-height. |
| **Figure Height** | `'YTFI'` | `538` – `760` | Advanced axis: adjusts numeral heights. |

---

## 3. The 30-Style M3 Type Scale & Design Tokens

Material Design 3 uses the **Major Second type scale (1.125)** anchored to the base body size of **14sp (0.875rem)**.

### 3.1 Unit Conversion Rules
- **Android**: `sp` (scale-independent pixels).
- **Web**: `rem` based on root `16px` ($$\text{size in rem} = \frac{\text{sp}}{16}$$).
- **Letter Spacing (Tracking)**:
  $$\text{Web letter-spacing (rem/em)} = \frac{\text{Tracking (px)}}{\text{Font Size (px)}}$$

### 3.2 Master Type Scale Specification Table

```text
┌──────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┐
│ Style Role       │ Size(sp) │ Size(rem)│ Line Ht. │ Tracking │ Weight   │ CSS Shorthand    │
├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────┤
│ Display Large    │ 57sp     │ 3.5625rem│ 4.0rem   │ -0.016rem│ 400 (Reg)│ text-[3.5625rem] │
│ Display Medium   │ 45sp     │ 2.8125rem│ 3.25rem  │ 0.000rem │ 400 (Reg)│ text-[2.8125rem] │
│ Display Small    │ 36sp     │ 2.25rem  │ 2.75rem  │ 0.000rem │ 400 (Reg)│ text-[2.25rem]   │
│ Headline Large   │ 32sp     │ 2.0rem   │ 2.5rem   │ 0.000rem │ 400 (Reg)│ text-[2.0rem]    │
│ Headline Medium  │ 28sp     │ 1.75rem  │ 2.25rem  │ 0.000rem │ 400 (Reg)│ text-[1.75rem]   │
│ Headline Small   │ 24sp     │ 1.5rem   │ 2.0rem   │ 0.000rem │ 400 (Reg)│ text-[1.5rem]    │
│ Title Large      │ 22sp     │ 1.375rem │ 1.75rem  │ 0.000rem │ 400 (Reg)│ text-[1.375rem]  │
│ Title Medium     │ 16sp     │ 1.0rem   │ 1.5rem   │ +0.009rem│ 500 (Med)│ text-[1.0rem]    │
│ Title Small      │ 14sp     │ 0.875rem │ 1.25rem  │ +0.007rem│ 500 (Med)│ text-[0.875rem]  │
│ Body Large       │ 16sp     │ 1.0rem   │ 1.5rem   │ +0.031rem│ 400 (Reg)│ text-[1.0rem]    │
│ Body Medium      │ 14sp     │ 0.875rem │ 1.25rem  │ +0.018rem│ 400 (Reg)│ text-[0.875rem]  │
│ Body Small       │ 12sp     │ 0.75rem  │ 1.0rem   │ +0.033rem│ 400 (Reg)│ text-[0.75rem]   │
│ Label Large      │ 14sp     │ 0.875rem │ 1.25rem  │ +0.007rem│ 500 (Med)│ text-[0.875rem]  │
│ Label Medium     │ 12sp     │ 0.75rem  │ 1.0rem   │ +0.042rem│ 500 (Med)│ text-[0.75rem]   │
│ Label Small      │ 11sp     │ 0.6875rem│ 1.0rem   │ +0.045rem│ 500 (Med)│ text-[0.6875rem] │
└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

### 3.3 Emphasized vs. Baseline Weight Mapping

| Style Role | Baseline Weight Token | Emphasized Weight Token | Standard Numeric Weight |
| :--- | :--- | :--- | :--- |
| **Display (L/M/S)** | `--md-sys-typescale-display-*-weight` | `--md-sys-typescale-emphasized-display-*-weight` | `400 (Regular)` $\rightarrow$ `600/700 (SemiBold/Bold)` |
| **Headline (L/M/S)** | `--md-sys-typescale-headline-*-weight` | `--md-sys-typescale-emphasized-headline-*-weight` | `400 (Regular)` $\rightarrow$ `600/700 (SemiBold/Bold)` |
| **Title Large** | `--md-sys-typescale-title-large-weight` | `--md-sys-typescale-emphasized-title-large-weight` | `400 (Regular)` $\rightarrow$ `700 (Bold)` |
| **Title Medium/Small** | `--md-sys-typescale-title-*-weight` | `--md-sys-typescale-emphasized-title-*-weight` | `500 (Medium)` $\rightarrow$ `700 (Bold)` |
| **Body (L/M/S)** | `--md-sys-typescale-body-*-weight` | `--md-sys-typescale-emphasized-body-*-weight` | `400 (Regular)` $\rightarrow$ `500/600 (Medium/SemiBold)` |
| **Label (L/M/S)** | `--md-sys-typescale-label-*-weight` | `--md-sys-typescale-emphasized-label-*-weight` | `500 (Medium)` $\rightarrow$ `700 (Bold)` |

---

## 4. Applying Typography: Component & Layout Rules

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                  ROLE USAGE MAP                                   │
├───────────┬───────────────────────────────────────────────────────────────────────┤
│ Display   │ Hero banners, huge numeric metrics, dashboard stat highlights        │
│ Headline  │ Main section headers, modal/dialog headers, drawer hero titles        │
│ Title     │ Card headers, app bar titles, table category headers, tab titles      │
│ Body      │ Long-form text, clinical notes, descriptions, setup flow paragraphs   │
│ Label     │ Button text, badge counters, chip text, nav destinations, captions    │
└───────────┴───────────────────────────────────────────────────────────────────────┘
```

### 4.1 Component Mapping Matrix

| Component | Target Type Style | Emphasized Variant Trigger | Recommended CSS / Utility |
| :--- | :--- | :--- | :--- |
| **Filled/Tonal Button** | `Label Large` | Primary/CTA emphasis (`weight: 700`) | `font-[var(--md-sys-typescale-label-large)] font-medium` |
| **Filter / Assist Chip** | `Label Large` / `Medium` | Selected chip state | `text-xs font-medium tracking-wide` |
| **Top App Bar Title** | `Title Large` | Dense/Scrolled state | `text-[1.375rem] leading-7 font-normal` |
| **Card Header** | `Title Medium` / `Large` | Unread / Critical state | `text-base leading-6 font-medium` |
| **Dialog Title** | `Headline Small` | Destructive/Warning modal | `text-2xl leading-8 font-normal` |
| **Data Table Header** | `Title Small` / `Label Large` | Active sorting column | `text-sm font-medium tracking-wider text-[var(--md-sys-color-on-surface-variant)]` |
| **Data Table Cell** | `Body Medium` | Numeric/Clinical value (`tabular-nums`) | `text-sm leading-5 font-normal tabular-nums` |
| **Badge / Tag** | `Label Small` | Critical / Urgent status | `text-[0.6875rem] leading-4 font-semibold tracking-wider uppercase` |
| **Navigation Tab** | `Title Small` / `Label Large` | Active tab indicator | `text-sm font-medium transition-colors` |
| **Clinical Form Input** | `Body Large` | Active input value | `text-base leading-6 font-normal` |
| **Helper / Caption Text** | `Body Small` | Error validation state | `text-xs leading-4 text-[var(--md-sys-color-error)]` |
| **Large Metric / Stat** | `Display Small` / `Medium` | Severe risk score alert | `text-4xl lg:text-5xl font-normal tabular-nums tracking-tight` |

### 4.2 Vertical Typesetting & Bounding Box Behavior
In Web CSS, line-height creates an equal distribution of space above and below glyphs (**half-leading**).
- **Line-Height Ratios**:
  - Display/Headline/Title: **1.15x – 1.25x** font size.
  - Body/Label: **1.4x – 1.5x** font size for sustained readability.
- **Vertical Spacing Calculation**:
  Always compute vertical margins and paddings using container padding around the bounding box, never by attempting manual font baseline shifts.
- **Tabular Figures for Dynamic Data**:
  Any value that fluctuates (timers, clocks, financial values, test scores, progress percentages) **MUST** include:
  ```css
  font-variant-numeric: tabular-nums;
  ```
  or class `tabular-nums` in Tailwind to prevent horizontal layout jank.

### 4.3 Language Script Height Adaptation
Different writing systems require dynamic line height expansion:
- **Small (Base, 1.0x)**: Latin, Cyrillic, Greek, Hebrew.
- **Medium (+7% height, ~1.07x)**: Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-TW`), Japanese (`ja`), Korean (`ko`), Arabic (`ar`), Hindi (`hi`), Thai (`th`), Vietnamese (`vi`).
- **Large (+30% height, ~1.30x)**: Telugu (`te`), Burmese (`my`).
- **Extra Large (+100% height, ~2.0x)**: Nastaliq / Urdu (`ur`).

> [!IMPORTANT]
> Never hardcode fixed pixel heights on text containers wrapping multilingual content. Use `min-h-[...]` or `py-*` so line-height can expand naturally without clipping ascenders/descenders.

---

## 5. Editorial Treatments & Expressive Moments

Editorial treatments depart from standard functional UI to create **showcase hero moments**:

```text
                                  EDITORIAL TYPOGRAPHY
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│Celebrating Content│             │Voice of the User │             │Bespoke State/FX  │
│Milestones, covers│             │Moods, quotes,    │             │Dynamic axes tied │
│hero statistics   │             │personalized text │             │to progress/slider│
└──────────────────┘             └──────────────────┘             └──────────────────┘
```

### 5.1 Rules for Editorial Treatments
1. **Never use editorial styles for utilitarian UI**: Do not apply decorative weights, wide widths, or script fonts to buttons, labels, dense table cells, or system forms.
2. **Use Negative Grade in Dark Mode**:
   When rendering bold/display text in Dark Mode, apply `font-variation-settings: 'GRAD' -50` or `'GRAD' -100` to prevent the bright letters from bleeding optically on dark surfaces.
3. **Width Pairing Constraints**:
   Use narrow widths (`'wdth' 75-85`) when packing expressive numbers in constrained cards; use wide widths (`'wdth' 120-130`) only on wide desktop hero banners.
4. **Consistency**:
   Tokenize recurring editorial treatments into reusable CSS classes (e.g. `.editorial-hero-title`, `.editorial-metric-stat`).

---

## 6. CSS & Tailwind CSS 4 Implementation Tokens

### 6.1 Theme Token Configuration (`index.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Roboto Flex', 'Roboto', 'Noto Sans SC', 'Noto Sans', system-ui, sans-serif;
  --font-serif: 'Roboto Serif', Georgia, serif;
  --font-mono: 'Roboto Mono', monospace;
}

/* Material 3 Typescale CSS Custom Properties */
:root {
  /* Typeface references */
  --md-ref-typeface-brand: 'Roboto Flex', 'Roboto', 'Noto Sans SC', 'Noto Sans', system-ui, sans-serif;
  --md-ref-typeface-plain: 'Roboto Flex', 'Roboto', 'Noto Sans SC', 'Noto Sans', system-ui, sans-serif;

  /* Display */
  --md-sys-typescale-display-large: 400 3.5625rem/4.0rem var(--md-ref-typeface-brand);
  --md-sys-typescale-display-medium: 400 2.8125rem/3.25rem var(--md-ref-typeface-brand);
  --md-sys-typescale-display-small: 400 2.25rem/2.75rem var(--md-ref-typeface-brand);

  /* Headline */
  --md-sys-typescale-headline-large: 400 2.0rem/2.5rem var(--md-ref-typeface-brand);
  --md-sys-typescale-headline-medium: 400 1.75rem/2.25rem var(--md-ref-typeface-brand);
  --md-sys-typescale-headline-small: 400 1.5rem/2.0rem var(--md-ref-typeface-brand);

  /* Title */
  --md-sys-typescale-title-large: 400 1.375rem/1.75rem var(--md-ref-typeface-brand);
  --md-sys-typescale-title-medium: 500 1.0rem/1.5rem var(--md-ref-typeface-plain);
  --md-sys-typescale-title-small: 500 0.875rem/1.25rem var(--md-ref-typeface-plain);

  /* Body */
  --md-sys-typescale-body-large: 400 1.0rem/1.5rem var(--md-ref-typeface-plain);
  --md-sys-typescale-body-medium: 400 0.875rem/1.25rem var(--md-ref-typeface-plain);
  --md-sys-typescale-body-small: 400 0.75rem/1.0rem var(--md-ref-typeface-plain);

  /* Label */
  --md-sys-typescale-label-large: 500 0.875rem/1.25rem var(--md-ref-typeface-plain);
  --md-sys-typescale-label-medium: 500 0.75rem/1.0rem var(--md-ref-typeface-plain);
  --md-sys-typescale-label-small: 500 0.6875rem/1.0rem var(--md-ref-typeface-plain);

  /* Emphasized Tokens */
  --md-sys-typescale-emphasized-title-medium: 700 1.0rem/1.5rem var(--md-ref-typeface-plain);
  --md-sys-typescale-emphasized-label-large: 700 0.875rem/1.25rem var(--md-ref-typeface-plain);
}

/* Dark mode optical grade compensation */
.dark {
  --md-sys-typescale-display-large: 400 3.5625rem/4.0rem var(--md-ref-typeface-brand);
  font-variation-settings: 'GRAD' -25;
}
```

### 6.2 Utility Helper Classes

```css
@layer utilities {
  /* Typescale Shorthands */
  .m3-display-large   { font: var(--md-sys-typescale-display-large); letter-spacing: -0.0156rem; }
  .m3-display-medium  { font: var(--md-sys-typescale-display-medium); }
  .m3-display-small   { font: var(--md-sys-typescale-display-small); }
  
  .m3-headline-large  { font: var(--md-sys-typescale-headline-large); }
  .m3-headline-medium { font: var(--md-sys-typescale-headline-medium); }
  .m3-headline-small  { font: var(--md-sys-typescale-headline-small); }

  .m3-title-large     { font: var(--md-sys-typescale-title-large); }
  .m3-title-medium    { font: var(--md-sys-typescale-title-medium); letter-spacing: 0.0094rem; }
  .m3-title-small     { font: var(--md-sys-typescale-title-small); letter-spacing: 0.0071rem; }

  .m3-body-large      { font: var(--md-sys-typescale-body-large); letter-spacing: 0.03125rem; }
  .m3-body-medium     { font: var(--md-sys-typescale-body-medium); letter-spacing: 0.0179rem; }
  .m3-body-small      { font: var(--md-sys-typescale-body-small); letter-spacing: 0.0333rem; }

  .m3-label-large     { font: var(--md-sys-typescale-label-large); letter-spacing: 0.0071rem; }
  .m3-label-medium    { font: var(--md-sys-typescale-label-medium); letter-spacing: 0.0417rem; }
  .m3-label-small     { font: var(--md-sys-typescale-label-small); letter-spacing: 0.0455rem; }

  /* Emphasized variants */
  .m3-label-large-emphasized { font: var(--md-sys-typescale-emphasized-label-large); letter-spacing: 0.0071rem; }
  .m3-title-medium-emphasized { font: var(--md-sys-typescale-emphasized-title-medium); letter-spacing: 0.0094rem; }
}
```

---

## 7. Concrete Component Decoration Patterns

### 7.1 Card with Structured Hierarchy

```tsx
import React from 'react';

export function ClinicalRecordCard({ studentName, riskLevel, diagnosis, date }: {
  studentName: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  diagnosis: string;
  date: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 flex flex-col gap-3">
      {/* Top Meta: Title Medium & Label Small */}
      <div className="flex items-center justify-between">
        <h3 className="text-base leading-6 font-medium text-[var(--md-sys-color-on-surface)] tracking-tight">
          {studentName}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full text-[0.6875rem] leading-4 font-semibold tracking-wider uppercase bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
          {riskLevel} RISK
        </span>
      </div>

      {/* Body: Body Medium */}
      <p className="text-sm leading-5 font-normal text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
        {diagnosis}
      </p>

      {/* Footer Meta: Label Medium (Tabular Timestamp) & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]/30">
        <span className="text-xs leading-4 font-normal text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
          Assigned: {date}
        </span>
        <button className="text-sm leading-5 font-semibold text-[var(--md-sys-color-primary)] hover:underline focus:outline-none">
          Review Record
        </button>
      </div>
    </div>
  );
}
```

### 7.2 Big Numeric Metric Widget (Tabular & Display)

```tsx
import React from 'react';

export function MetricStatCard({ label, count, trend, unit }: {
  label: string;
  count: number;
  trend: string;
  unit?: string;
}) {
  return (
    <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] flex flex-col gap-2">
      <span className="text-xs leading-4 font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl lg:text-5xl font-normal text-[var(--md-sys-color-on-surface)] tabular-nums tracking-tight font-sans">
          {count}
        </span>
        {unit && (
          <span className="text-sm leading-5 font-medium text-[var(--md-sys-color-on-surface-variant)]">
            {unit}
          </span>
        )}
      </div>
      <span className="text-xs leading-4 font-medium text-[var(--md-sys-color-tertiary)] flex items-center gap-1">
        {trend}
      </span>
    </div>
  );
}
```

### 7.3 Accessible Hyperlinks and Text Pairing
- **Hyperlink Rule**: Must always have an underline (`underline underline-offset-2`) and use `--md-sys-color-primary`.
- **Secondary Text Pairing**:
  - Primary text on surface: `--md-sys-color-on-surface` (e.g. `rgb(29 27 32)` light / `rgb(230 224 233)` dark).
  - Secondary/Caption text on surface: `--md-sys-color-on-surface-variant` (e.g. `rgb(73 69 79)` light / `rgb(202 196 208)` dark).
  - Disabled text: `opacity-38 text-[var(--md-sys-color-on-surface)]`.

---

## 8. Anti-Patterns & Linting Checklist

### ❌ Anti-Patterns (Never Do These)
- **Never use arbitrary font sizes** (e.g., `text-[13px]`, `text-[21px]`, `text-[17px]`). Stick strictly to the standard M3 scale (`11px/12px/14px/16px/22px/24px/28px/32px/36px/45px/57px`).
- **Never use decorative or display fonts for Body or Label text**. Body and Label text must prioritize readability.
- **Never hardcode line-height without checking font size**. A `text-2xl` header with `leading-4` will cause severe text collision; `text-xs` with `leading-8` wastes screen real estate.
- **Never neglect `tabular-nums` for dynamic numerals**. Without tabular figures, numbers jumping from `1` to `8` cause layout jiggling.
- **Never use light gray text on white that fails 4.5:1 contrast**. Always pair `on-surface` / `on-surface-variant` against appropriate container colors.
- **Never place wide-width variable font text in constrained headers or mobile navigation**.

### ✅ Typography Quality Audit Checklist
When reviewing or creating components, verify:
- [ ] Are text elements mapped to one of the 5 M3 roles (`Display`, `Headline`, `Title`, `Body`, `Label`)?
- [ ] Is button text styled with `Label Large` (`14sp / 0.875rem, weight: 500/700`)?
- [ ] Are dates, timestamps, counters, and table numbers formatted with `tabular-nums`?
- [ ] Do headlines and display styles have proportional line heights ($$1.15 \times - 1.25 \times$$)?
- [ ] Do body paragraphs have readable line heights ($$1.4 \times - 1.5 \times$$)?
- [ ] Is font fallback configured with `Roboto Flex` $\rightarrow$ `Roboto` $\rightarrow$ `Noto Sans` $\rightarrow$ `sans-serif`?
- [ ] Are interactive text links underlined and colored with `primary` or `tertiary`?
- [ ] Does dark mode typography avoid optical over-bolding via grade adjustment?
