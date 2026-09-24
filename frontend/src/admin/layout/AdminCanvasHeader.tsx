interface AdminCanvasHeaderProps {
  title: string;
  isLoading?: boolean;
}

export function AdminCanvasHeader({ title, isLoading }: AdminCanvasHeaderProps) {
  return (
    <div className="sticky top-0 z-30 w-full flex items-center justify-between px-6 py-3 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] relative shrink-0 select-none">
      <h2 className="text-[22px] font-normal text-[var(--md-sys-color-on-surface)] truncate">{title}</h2>

      {isLoading && (
        <div className="absolute bottom-[-1px] left-0 w-full z-10">
          <md-linear-progress indeterminate style={{ width: '100%' }}></md-linear-progress>
        </div>
      )}
    </div>
  );
}
