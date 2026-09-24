import { useSidebar } from '../contexts/SidebarContext';

interface AdminNavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  badge?: boolean;
  onClick?: () => void;
}

export function AdminNavItem({ icon, label, active, badge, onClick }: AdminNavItemProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`flex rounded-[12px] cursor-pointer transition-all duration-75 overflow-hidden ${
        isCollapsed
          ? 'flex-col items-center justify-center gap-1 py-1.5 mx-2'
          : 'flex-row items-center gap-4 px-4 py-2.5 mx-2 rounded-full'
      } font-medium ${
        active
          ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
          : 'hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] opacity-70 hover:opacity-100'
      }`}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        <span
          className="material-symbols-outlined shrink-0"
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
        {badge && (
          <span className="absolute top-[-2px] right-[-2px] w-2.5 h-2.5 bg-[var(--md-sys-color-error)] rounded-full border-2 border-[var(--md-sys-color-surface)] ring-0" />
        )}
      </div>
      <span
        className={`tracking-wide ${
          isCollapsed ? 'text-[10px] leading-[12px] text-center w-full' : 'text-sm'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
