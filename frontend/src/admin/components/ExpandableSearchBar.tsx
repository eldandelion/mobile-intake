import * as React from 'react';

export interface ExpandableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Material Design 3 Expandable Search Bar component copied from medical-system.
 * Collapsed: Compact square icon button matching filter chip dimensions (h-8, rounded-lg).
 * Expanded: Smoothly animates width to the right with primary highlighted border, auto-focused input,
 * and trailing clear/close button.
 */
export function ExpandableSearchBar({
  value,
  onChange,
  placeholder = '搜索学生...',
  className = '',
}: ExpandableSearchBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(Boolean(value));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when expanding
  React.useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // If value is set externally, expand the bar
  React.useEffect(() => {
    if (value && !isExpanded) {
      setIsExpanded(true);
    }
  }, [value, isExpanded]);

  // Click outside collapses if search query is empty
  React.useEffect(() => {
    if (!isExpanded) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value.trim()) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isExpanded, value]);

  // Escape key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (value) {
        onChange('');
      } else {
        setIsExpanded(false);
      }
    }
  };

  const handleClearOrClose = () => {
    if (value) {
      onChange('');
      inputRef.current?.focus();
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center h-8 shrink-0 transition-all duration-200 ease-out overflow-hidden rounded-lg ${
        isExpanded
          ? 'w-64 border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] px-2 gap-1.5'
          : 'w-8 border border-[var(--md-sys-color-outline)] bg-transparent hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer justify-center'
      } ${className}`}
      onClick={() => {
        if (!isExpanded) {
          setIsExpanded(true);
        }
      }}
      role={isExpanded ? 'search' : 'button'}
      aria-label={isExpanded ? '搜索栏' : '展开搜索'}
      title={isExpanded ? undefined : '搜索'}
    >
      <span
        className={`material-symbols-outlined !text-[17px] shrink-0 select-none ${
          isExpanded
            ? 'text-[var(--md-sys-color-primary)]'
            : 'text-[var(--md-sys-color-on-surface-variant)]'
        }`}
        style={{ fontSize: '17px', width: '17px', height: '17px', lineHeight: '17px' }}
      >
        search
      </span>

      {isExpanded && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 min-w-0"
            aria-label={placeholder}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearOrClose();
            }}
            className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors focus:outline-none cursor-pointer"
            aria-label={value ? '清除搜索' : '收起搜索'}
            title={value ? '清除搜索' : '收起搜索'}
          >
            <span
              className="material-symbols-outlined !text-[16px]"
              style={{ fontSize: '16px', width: '16px', height: '16px', lineHeight: '16px' }}
            >
              cancel
            </span>
          </button>
        </>
      )}
    </div>
  );
}
