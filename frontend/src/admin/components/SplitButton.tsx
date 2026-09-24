import * as React from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export interface SplitButtonOption {
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SplitButtonProps {
  id?: string;
  icon?: string;
  label: string;
  className?: string;
  onClick: () => void;
  options: SplitButtonOption[];
  variant?: 'primary' | 'secondary' | 'tonal' | 'outlined';
  disabled?: boolean;
  noCollapse?: boolean;
  iconSize?: string;
  style?: React.CSSProperties;
}

/**
 * Material Design 3 Split Button component copied from medical-system.
 * Features a primary action button on the left (rounded-l-full rounded-r-[4px])
 * and an arrow dropdown trigger on the right (rounded-l-[4px] rounded-r-full)
 * separated by a 2px gap (gap-0.5), connected to an md-menu for selecting actions.
 */
export function SplitButton({
  id,
  icon,
  label,
  className = 'h-10',
  onClick,
  options,
  variant = 'secondary',
  disabled,
  noCollapse = true,
  iconSize,
  style,
}: SplitButtonProps) {
  const { isCollapsed } = useSidebar();
  const effectiveCollapsed = noCollapse ? false : isCollapsed;
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLElement>(null);
  const autoId = React.useId().replace(/:/g, '');
  const menuAnchorId = id || `split-btn-${autoId}`;

  React.useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const handleClosed = () => {
      setIsOpen(false);
    };

    menuEl.addEventListener('closed', handleClosed);
    menuEl.addEventListener('close', handleClosed);
    return () => {
      menuEl.removeEventListener('closed', handleClosed);
      menuEl.removeEventListener('close', handleClosed);
    };
  }, []);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const menuEl = menuRef.current as any;
    const isCurrentlyOpen = menuEl ? Boolean(menuEl.open) : isOpen;
    setIsOpen(!isCurrentlyOpen);
  };

  const isTonal = variant === 'secondary' || variant === 'tonal';
  const isPrimary = variant === 'primary';
  const isOutlined = variant === 'outlined';

  const leftButtonShapeStyles = {
    '--md-filled-button-container-shape-start-start': '9999px',
    '--md-filled-button-container-shape-end-start': '9999px',
    '--md-filled-button-container-shape-start-end': '4px',
    '--md-filled-button-container-shape-end-end': '4px',
    '--md-filled-button-container-elevation': '0',
    '--md-filled-button-hover-container-elevation': '0',
    '--md-filled-button-icon-size': iconSize,
    '--md-filled-tonal-button-container-shape-start-start': '9999px',
    '--md-filled-tonal-button-container-shape-end-start': '9999px',
    '--md-filled-tonal-button-container-shape-start-end': '4px',
    '--md-filled-tonal-button-container-shape-end-end': '4px',
    '--md-filled-tonal-button-icon-size': iconSize,
    '--md-outlined-button-container-shape-start-start': '9999px',
    '--md-outlined-button-container-shape-end-start': '9999px',
    '--md-outlined-button-container-shape-start-end': '4px',
    '--md-outlined-button-container-shape-end-end': '4px',
    '--md-outlined-button-icon-size': iconSize,
  } as React.CSSProperties;

  const rightButtonShapeStyles = {
    '--md-filled-button-container-shape-start-start': '4px',
    '--md-filled-button-container-shape-end-start': '4px',
    '--md-filled-button-container-shape-start-end': '9999px',
    '--md-filled-button-container-shape-end-end': '9999px',
    '--md-filled-button-container-elevation': '0',
    '--md-filled-button-hover-container-elevation': '0',
    '--md-filled-button-leading-space': '0px',
    '--md-filled-button-trailing-space': '0px',
    '--md-filled-button-with-leading-icon-leading-space': '0px',
    '--md-filled-button-with-leading-icon-trailing-space': '0px',
    '--md-filled-button-with-trailing-icon-leading-space': '0px',
    '--md-filled-button-with-trailing-icon-trailing-space': '0px',
    '--md-filled-tonal-button-container-shape-start-start': '4px',
    '--md-filled-tonal-button-container-shape-end-start': '4px',
    '--md-filled-tonal-button-container-shape-start-end': '9999px',
    '--md-filled-tonal-button-container-shape-end-end': '9999px',
    '--md-filled-tonal-button-leading-space': '0px',
    '--md-filled-tonal-button-trailing-space': '0px',
    '--md-filled-tonal-button-with-leading-icon-leading-space': '0px',
    '--md-filled-tonal-button-with-leading-icon-trailing-space': '0px',
    '--md-filled-tonal-button-with-trailing-icon-leading-space': '0px',
    '--md-filled-tonal-button-with-trailing-icon-trailing-space': '0px',
    '--md-outlined-button-container-shape-start-start': '4px',
    '--md-outlined-button-container-shape-end-start': '4px',
    '--md-outlined-button-container-shape-start-end': '9999px',
    '--md-outlined-button-container-shape-end-end': '9999px',
    '--md-outlined-button-leading-space': '0px',
    '--md-outlined-button-trailing-space': '0px',
    '--md-outlined-button-with-leading-icon-leading-space': '0px',
    '--md-outlined-button-with-leading-icon-trailing-space': '0px',
    '--md-outlined-button-with-trailing-icon-leading-space': '0px',
    '--md-outlined-button-with-trailing-icon-trailing-space': '0px',
  } as React.CSSProperties;

  return (
    <div
      className={`inline-flex items-center gap-0.5 shrink-0 ${
        effectiveCollapsed ? 'w-10 min-w-0 overflow-hidden' : ''
      }`}
      style={style}
    >
      {/* 1. Main Action Button */}
      {isPrimary && (
        <md-filled-button
          className={`${className} shrink-0 whitespace-nowrap transition-all duration-75`}
          onClick={onClick}
          onPointerUp={(e: any) => e.currentTarget.blur()}
          disabled={disabled}
          style={leftButtonShapeStyles}
        >
          {icon && (
            <md-icon slot="icon" style={{ '--md-icon-size': iconSize } as React.CSSProperties}>
              {icon}
            </md-icon>
          )}
          {label}
        </md-filled-button>
      )}

      {isTonal && (
        <md-filled-tonal-button
          className={`${className} shrink-0 whitespace-nowrap transition-all duration-75`}
          onClick={onClick}
          onPointerUp={(e: any) => e.currentTarget.blur()}
          disabled={disabled}
          style={leftButtonShapeStyles}
        >
          {icon && (
            <md-icon
              slot="icon"
              style={{ color: 'inherit', '--md-icon-size': iconSize } as React.CSSProperties}
            >
              {icon}
            </md-icon>
          )}
          {label}
        </md-filled-tonal-button>
      )}

      {isOutlined && (
        <md-outlined-button
          className={`${className} shrink-0 whitespace-nowrap transition-all duration-75`}
          onClick={onClick}
          onPointerUp={(e: any) => e.currentTarget.blur()}
          disabled={disabled}
          style={leftButtonShapeStyles}
        >
          {icon && (
            <md-icon
              slot="icon"
              style={{ color: 'inherit', '--md-icon-size': iconSize } as React.CSSProperties}
            >
              {icon}
            </md-icon>
          )}
          {label}
        </md-outlined-button>
      )}

      {/* 2. Trailing Dropdown Trigger + Menu */}
      {!effectiveCollapsed && (
        <div className="relative shrink-0">
          {isPrimary && (
            <md-filled-button
              id={menuAnchorId}
              role="button"
              aria-label="更多操作"
              className={`${className} !w-8 !min-w-0 !p-0 shrink-0 transition-all duration-75`}
              onClick={handleToggleMenu}
              onPointerUp={(e: any) => e.currentTarget.blur()}
              disabled={disabled}
              style={rightButtonShapeStyles}
            >
              <md-icon slot="icon">arrow_drop_down</md-icon>
            </md-filled-button>
          )}

          {isTonal && (
            <md-filled-tonal-button
              id={menuAnchorId}
              role="button"
              aria-label="更多操作"
              className={`${className} !w-8 !min-w-0 !p-0 shrink-0 transition-all duration-75`}
              onClick={handleToggleMenu}
              onPointerUp={(e: any) => e.currentTarget.blur()}
              disabled={disabled}
              style={rightButtonShapeStyles}
            >
              <md-icon slot="icon">arrow_drop_down</md-icon>
            </md-filled-tonal-button>
          )}

          {isOutlined && (
            <md-outlined-button
              id={menuAnchorId}
              role="button"
              aria-label="更多操作"
              className={`${className} !w-8 !min-w-0 !p-0 shrink-0 transition-all duration-75 -ml-[1px]`}
              onClick={handleToggleMenu}
              onPointerUp={(e: any) => e.currentTarget.blur()}
              disabled={disabled}
              style={rightButtonShapeStyles}
            >
              <md-icon slot="icon">arrow_drop_down</md-icon>
            </md-outlined-button>
          )}

          <md-menu
            ref={menuRef as any}
            anchor={menuAnchorId}
            open={isOpen}
            onClosed={() => setIsOpen(false)}
            quick
            style={
              {
                minWidth: '220px',
                '--md-menu-item-focus-outline-width': '0',
                '--md-menu-item-selected-outline-width': '0',
                zIndex: 100,
              } as React.CSSProperties
            }
          >
            {options.map((opt, idx) => (
              <md-menu-item
                key={idx}
                disabled={opt.disabled}
                onClick={() => {
                  setIsOpen(false);
                  opt.onClick();
                }}
              >
                {opt.icon && <md-icon slot="start">{opt.icon}</md-icon>}
                <div slot="headline">{opt.label}</div>
              </md-menu-item>
            ))}
          </md-menu>
        </div>
      )}
    </div>
  );
}
