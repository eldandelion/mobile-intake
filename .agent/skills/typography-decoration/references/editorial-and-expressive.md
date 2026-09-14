# Editorial Treatments & Expressive Typography

## 1. What are Editorial Treatments?

Editorial treatments are **standalone, showcase moments driven by expressive typography**. They diverge from purely utilitarian layouts to create high-impact, emotional, or celebratory touchpoints in a digital product.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         EDITORIAL TYPOGRAPHY                             │
├──────────────────────┬────────────────────────┬──────────────────────────┤
│ 1. Celebrating       │ 2. Voice of the User   │ 3. Bespoke Functionality │
│    Content           │                        │                          │
│ Milestones, covers,  │ Mood framing, quotes,  │ Dynamic axis transitions │
│ major accomplishments│ personalized feedback  │ tied to state / sensor   │
└──────────────────────┴────────────────────────┴──────────────────────────┘
```

---

## 2. The Three Core Applications

### 2.1 Celebrating Content
- **Purpose**: Mark a significant user achievement, case completion, or milestone.
- **Visual Style**: Large display type, high contrast, pairing expressive brand typefaces with vibrant primary/secondary container surfaces.
- **Example**: A referral case successfully closed and archived with a celebratory header.

```tsx
export function CaseClosedCelebrationBanner({ studentName, completedDate }: {
  studentName: string;
  completedDate: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[var(--md-sys-color-primary-container)] p-8 text-[var(--md-sys-color-on-primary-container)] flex flex-col gap-4">
      <span className="text-xs uppercase tracking-widest font-bold text-[var(--md-sys-color-primary)]">
        Workflow Completed
      </span>
      <h1 className="text-3xl lg:text-5xl font-normal tracking-tight leading-tight">
        Intervention plan closed for <span className="font-bold underline decoration-[var(--md-sys-color-primary)]">{studentName}</span>
      </h1>
      <p className="text-base text-[var(--md-sys-color-on-primary-container)]/80 max-w-xl">
        All psychological counseling notes, hospital feedback, and discharge evaluations have been audited on {completedDate}.
      </p>
    </div>
  );
}
```

### 2.2 Voice of the User
- **Purpose**: Highlight qualitative remarks, student sentiment, counselor observations, or doctor intake feedback.
- **Visual Style**: Italicized serif or distinct variable weights (`Roboto Serif` or `Roboto Flex` with `'slnt' -8`), framed inside surface containers with subtle quotation borders.

```tsx
export function CounselorObservationQuote({ counselorName, observation }: {
  counselorName: string;
  observation: string;
}) {
  return (
    <blockquote className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border-l-4 border-[var(--md-sys-color-primary)] flex flex-col gap-2">
      <p className="text-lg leading-relaxed italic text-[var(--md-sys-color-on-surface)] font-serif">
        "{observation}"
      </p>
      <cite className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] not-italic">
        — Counselor {counselorName}, Psychological Counseling Center
      </cite>
    </blockquote>
  );
}
```

### 2.3 Bespoke Functionality & Dynamic Axes
- **Purpose**: Adapt typography in real time based on state changes (e.g. risk score sliders, triage urgency levels).
- **Visual Style**: Modulating `'wght'` (Weight) and `'wdth'` (Width) as urgency escalates.

```tsx
export function DynamicRiskLevelIndicator({ riskScore }: { riskScore: number }) {
  // Interpolate weight and width based on score 0-100
  const weight = Math.min(900, Math.max(300, 300 + riskScore * 6));
  const width = Math.min(125, Math.max(80, 80 + riskScore * 0.45));

  const isHighRisk = riskScore >= 70;

  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`text-5xl lg:text-6xl transition-all duration-300 tabular-nums ${
          isHighRisk ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-primary)]'
        }`}
        style={{
          fontVariationSettings: `'wght' ${weight}, 'wdth' ${width}`,
        }}
      >
        {riskScore}
      </span>
      <span className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
        / 100 Clinical Index
      </span>
    </div>
  );
}
```

---

## 3. Guard Rails & Best Practices

| Rule | Rationale |
| :--- | :--- |
| **Do not use in Labels or Data Tables** | Utilitarian elements require predictable, rapid scannability. |
| **Tokenize Recurring Treatments** | Ensure consistent visual weight across different pages by creating reusable classes. |
| **Limit to One Hero Treatment Per View** | Competing hero typography creates visual clutter and distracts users. |
| **Always Test Contrast in Dark & Light Modes** | Expressive colored backgrounds must maintain WCAG 3:1 (large text) or 4.5:1 (body text) contrast. |
