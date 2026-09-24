interface MetricCardProps {
  icon: string;
  numericValue: number | string;
  label: string;
  sublabel?: string;
  colorClass?: string;
  onClick?: () => void;
}

export function MetricCard({
  icon,
  numericValue,
  label,
  sublabel,
  colorClass = 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
  onClick,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-3xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/30 flex flex-col justify-between transition-all duration-150 select-none shadow-2xs ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-2xl sm:text-3xl font-extrabold text-[var(--md-sys-color-on-surface)] tracking-tight">
          {numericValue}
        </span>
        {sublabel && (
          <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
