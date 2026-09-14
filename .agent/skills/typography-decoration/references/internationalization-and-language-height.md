# Internationalization & Language Script Height Support

## 1. The Language Height Challenge

Different writing systems around the world feature vastly different vertical proportions, diacritics, and ascender/descender heights. 

Applying a single, rigid line-height across all languages leads to:
- **Diacritic Clipping**: Accents above capital letters (e.g. Vietnamese, Arabic) or below letters (Hindi, Telugu) get cut off.
- **Text Collisions**: Descenders on line $N$ collide with ascenders on line $N+1$.
- **Container Overflow**: Text spills outside fixed-height buttons and card headers.

---

## 2. Script Height Categories

Material Design 3 classifies international languages into **four vertical script categories**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              LANGUAGE SCRIPT CATEGORIES                                │
├──────────────┬──────────────────┬──────────────────────────────────────────────────────┤
│ Category     │ Height Offset    │ Representative Languages & Scripts                   │
├──────────────┼──────────────────┼──────────────────────────────────────────────────────┤
│ Small (Base) │ 1.00x (Base)     │ Latin (English, Spanish, French, German), Cyrillic,  │
│              │                  │ Greek, Hebrew                                        │
│ Medium       │ ~1.07x (+7%)     │ Simplified Chinese (zh-CN), Traditional Chinese (zh),│
│              │                  │ Japanese (ja), Korean (ko), Arabic (ar), Hindi (hi), │
│              │                  │ Thai (th), Vietnamese (vi), Amharic, Armenian, Bangla│
│ Large        │ ~1.30x (+30%)    │ Telugu (te), Burmese (my), Kannada, Malayalam        │
│ Extra Large  │ ~2.00x (+100%)   │ Nastaliq (Urdu script)                               │
└──────────────┴──────────────────┴──────────────────────────────────────────────────────┘
```

---

## 3. Engineering & Layout Guidelines

### 3.1 Recommended Default
For web applications supporting multilingual or East Asian text (such as English + Chinese), **default to the Medium category (~1.07x line height)**. This provides safe clearance for Chinese/Japanese/Korean characters while maintaining great typography in English.

### 3.2 Defensive Container Styling
1. **Never use fixed heights on text containers**:
   - ❌ Bad: `h-10` or `height: 40px` on a wrapper enclosing localized titles.
   - ✅ Good: `min-h-10 py-2` to allow vertical expansion when rendering multi-script text.
2. **Use Relative Line-Height (`leading-normal` or `leading-relaxed`)**:
   - For multi-line body paragraphs, prefer relative line heights (e.g. `leading-relaxed` / `1.625` or `leading-6` / `1.5rem` for `14px` text).
3. **Avoid Overly Tight Tracking on CJK and Complex Scripts**:
   - Chinese, Japanese, and Korean glyphs require zero or positive tracking. Negative tracking (e.g. `tracking-tighter`) causes glyph overlap.

```tsx
// Example of a resilient multilingual card header
export function MultilingualHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1 min-h-[48px] py-1">
      <h2 className="text-xl leading-normal font-medium text-[var(--md-sys-color-on-surface)] break-words">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        {subtitle}
      </p>
    </div>
  );
}
```
