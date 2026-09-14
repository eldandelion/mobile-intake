# Material Design 3 Type Scale Matrix & Token Reference

## 1. Type Scale Architecture

The Material Design 3 type scale is generated using the **Major Second (1.125)** ratio anchored to the base body size of **14sp (0.875rem)**.

```text
Display Large (57sp) ──► Display Medium (45sp) ──► Display Small (36sp)
       │
       ▼
Headline Large (32sp) ──► Headline Medium (28sp) ──► Headline Small (24sp)
       │
       ▼
Title Large (22sp) ──► Title Medium (16sp) ──► Title Small (14sp)
       │
       ▼
Body Large (16sp) ──► Body Medium (14sp) ──► Body Small (12sp)
       │
       ▼
Label Large (14sp) ──► Label Medium (12sp) ──► Label Small (11sp)
```

---

## 2. Complete 30-Style Specification Matrix

### 2.1 Baseline Styles (15 Styles)

| Style Role | Font Size (sp / rem / px) | Line Height (sp / rem / px) | Line Height Ratio | Tracking (sp/px / rem / em) | Weight | Font Role | CSS Font Shorthand |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `57sp` / `3.5625rem` / `57px` | `64sp` / `4.0rem` / `64px` | ~1.12x | `-0.25px` / `-0.0156rem` / `-0.0044em` | 400 | Brand | `400 3.5625rem/4.0rem var(--md-ref-typeface-brand)` |
| **Display Medium**| `45sp` / `2.8125rem` / `45px` | `52sp` / `3.25rem` / `52px` | ~1.15x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 2.8125rem/3.25rem var(--md-ref-typeface-brand)` |
| **Display Small** | `36sp` / `2.25rem` / `36px` | `44sp` / `2.75rem` / `44px` | ~1.22x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 2.25rem/2.75rem var(--md-ref-typeface-brand)` |
| **Headline Large**| `32sp` / `2.0rem` / `32px` | `40sp` / `2.5rem` / `40px` | 1.25x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 2.0rem/2.5rem var(--md-ref-typeface-brand)` |
| **Headline Medium**| `28sp` / `1.75rem` / `28px` | `36sp` / `2.25rem` / `36px` | ~1.28x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 1.75rem/2.25rem var(--md-ref-typeface-brand)` |
| **Headline Small**| `24sp` / `1.5rem` / `24px` | `32sp` / `2.0rem` / `32px` | ~1.33x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 1.5rem/2.0rem var(--md-ref-typeface-brand)` |
| **Title Large** | `22sp` / `1.375rem` / `22px` | `28sp` / `1.75rem` / `28px` | ~1.27x | `0.0px` / `0.0rem` / `0.0em` | 400 | Brand | `400 1.375rem/1.75rem var(--md-ref-typeface-brand)` |
| **Title Medium** | `16sp` / `1.0rem` / `16px` | `24sp` / `1.5rem` / `24px` | 1.5x | `+0.15px` / `+0.0094rem` / `+0.0094em` | 500 | Plain | `500 1.0rem/1.5rem var(--md-ref-typeface-plain)` |
| **Title Small** | `14sp` / `0.875rem` / `14px` | `20sp` / `1.25rem` / `20px` | ~1.43x | `+0.1px` / `+0.00625rem` / `+0.0071em`| 500 | Plain | `500 0.875rem/1.25rem var(--md-ref-typeface-plain)` |
| **Body Large** | `16sp` / `1.0rem` / `16px` | `24sp` / `1.5rem` / `24px` | 1.5x | `+0.5px` / `+0.03125rem` / `+0.03125em`| 400 | Plain | `400 1.0rem/1.5rem var(--md-ref-typeface-plain)` |
| **Body Medium** | `14sp` / `0.875rem` / `14px` | `20sp` / `1.25rem` / `20px` | ~1.43x | `+0.25px` / `+0.0156rem` / `+0.0179em`| 400 | Plain | `400 0.875rem/1.25rem var(--md-ref-typeface-plain)` |
| **Body Small** | `12sp` / `0.75rem` / `12px` | `16sp` / `1.0rem` / `16px` | ~1.33x | `+0.4px` / `+0.025rem` / `+0.0333em` | 400 | Plain | `400 0.75rem/1.0rem var(--md-ref-typeface-plain)` |
| **Label Large** | `14sp` / `0.875rem` / `14px` | `20sp` / `1.25rem` / `20px` | ~1.43x | `+0.1px` / `+0.00625rem` / `+0.0071em`| 500 | Plain | `500 0.875rem/1.25rem var(--md-ref-typeface-plain)` |
| **Label Medium** | `12sp` / `0.75rem` / `12px` | `16sp` / `1.0rem` / `16px` | ~1.33x | `+0.5px` / `+0.03125rem` / `+0.0417em`| 500 | Plain | `500 0.75rem/1.0rem var(--md-ref-typeface-plain)` |
| **Label Small** | `11sp` / `0.6875rem` / `11px` | `16sp` / `1.0rem` / `16px` | ~1.45x | `+0.5px` / `+0.03125rem` / `+0.0455em`| 500 | Plain | `500 0.6875rem/1.0rem var(--md-ref-typeface-plain)` |

---

### 2.2 Emphasized Styles (15 Styles)

Emphasized styles share the identical size, line-height, and tracking as their baseline counterparts, but elevate the weight:

| Style Role | Baseline Weight | Emphasized Weight | Primary Application Triggers |
| :--- | :--- | :--- | :--- |
| **Display Large Emphasized** | `400` | `600` / `700` | Landmark hero numbers, primary landing titles |
| **Display Medium Emphasized**| `400` | `600` / `700` | High-impact modal hero statistics |
| **Display Small Emphasized** | `400` | `600` / `700` | Urgent metric callouts |
| **Headline Large Emphasized**| `400` | `600` / `700` | Section headers with active focus |
| **Headline Medium Emphasized**| `400` | `600` / `700` | Unread drawer headings |
| **Headline Small Emphasized**| `400` | `600` / `700` | Destructive dialog titles |
| **Title Large Emphasized** | `400` | `700` | Active category card titles |
| **Title Medium Emphasized**| `500` | `700` | Selected list item headers, unread chat threads |
| **Title Small Emphasized** | `500` | `700` | Active data table column headers |
| **Body Large Emphasized** | `400` | `500` / `600` | Key lead paragraph in clinical evaluation |
| **Body Medium Emphasized** | `400` | `500` / `600` | High-priority body note, highlighted observation |
| **Body Small Emphasized** | `400` | `500` / `600` | Important footnote or disclaimer |
| **Label Large Emphasized** | `500` | `700` | Primary action button, active navigation destination |
| **Label Medium Emphasized**| `500` | `700` | Selected filter chip, active segment tab |
| **Label Small Emphasized** | `500` | `700` | Urgent status badge, unread count badge |

---

## 3. Tailwind CSS 4 Class Mappings

```tsx
// Display
const displayLarge  = "text-[3.5625rem] leading-[4.0rem] tracking-[-0.0156rem] font-normal";
const displayMedium = "text-[2.8125rem] leading-[3.25rem] font-normal";
const displaySmall  = "text-[2.25rem] leading-[2.75rem] font-normal";

// Headline
const headlineLarge  = "text-[2.0rem] leading-[2.5rem] font-normal";
const headlineMedium = "text-[1.75rem] leading-[2.25rem] font-normal";
const headlineSmall  = "text-[1.5rem] leading-[2.0rem] font-normal";

// Title
const titleLarge  = "text-[1.375rem] leading-[1.75rem] font-normal";
const titleMedium = "text-[1.0rem] leading-[1.5rem] tracking-[0.0094rem] font-medium";
const titleSmall  = "text-[0.875rem] leading-[1.25rem] tracking-[0.0071rem] font-medium";

// Body
const bodyLarge  = "text-[1.0rem] leading-[1.5rem] tracking-[0.03125rem] font-normal";
const bodyMedium = "text-[0.875rem] leading-[1.25rem] tracking-[0.0179rem] font-normal";
const bodySmall  = "text-[0.75rem] leading-[1.0rem] tracking-[0.0333rem] font-normal";

// Label
const labelLarge  = "text-[0.875rem] leading-[1.25rem] tracking-[0.0071rem] font-medium";
const labelMedium = "text-[0.75rem] leading-[1.0rem] tracking-[0.0417rem] font-medium";
const labelSmall  = "text-[0.6875rem] leading-[1.0rem] tracking-[0.0455rem] font-medium";

// Emphasized Modifiers
const labelLargeEmphasized = "text-[0.875rem] leading-[1.25rem] tracking-[0.0071rem] font-bold";
const titleMediumEmphasized = "text-[1.0rem] leading-[1.5rem] tracking-[0.0094rem] font-bold";
```
