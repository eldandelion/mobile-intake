import * as React from 'react';

interface ButtonProps {
  id?: string;
  icon?: string;
  label: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  trailingIcon?: boolean;
  iconSize?: string;
  disabled?: boolean;
}

export function PrimaryButton({
  id,
  icon,
  label,
  className = "h-12 min-h-[48px] px-6 text-base font-medium rounded-full",
  onClick,
  style,
  trailingIcon,
  iconSize = "20px",
  disabled
}: ButtonProps) {
  return (
    <md-filled-button
      id={id}
      className={`shrink-0 select-none ${className}`}
      onClick={onClick}
      disabled={disabled}
      trailing-icon={trailingIcon ? "" : undefined}
      style={{
        '--md-filled-button-container-elevation': '0',
        '--md-filled-button-hover-container-elevation': '0',
        '--md-filled-button-icon-size': iconSize,
        ...style
      } as React.CSSProperties}
    >
      {icon && <md-icon slot="icon">{icon}</md-icon>}
      {label}
    </md-filled-button>
  );
}

export function SecondaryButton({
  id,
  icon,
  label,
  className = "h-12 min-h-[48px] px-6 text-base font-medium rounded-full",
  onClick,
  style,
  trailingIcon,
  iconSize = "20px",
  disabled
}: ButtonProps) {
  return (
    <md-filled-tonal-button
      id={id}
      className={`shrink-0 select-none ${className}`}
      onClick={onClick}
      disabled={disabled}
      trailing-icon={trailingIcon ? "" : undefined}
      style={{
        '--md-filled-tonal-button-icon-size': iconSize,
        ...style
      } as React.CSSProperties}
    >
      {icon && <md-icon slot="icon">{icon}</md-icon>}
      {label}
    </md-filled-tonal-button>
  );
}

export const FilledTonalButton = SecondaryButton;

export function OutlinedButton({
  id,
  icon,
  label,
  className = "h-12 min-h-[48px] px-6 text-base font-medium rounded-full",
  onClick,
  style,
  trailingIcon,
  iconSize = "20px",
  disabled
}: ButtonProps) {
  return (
    <md-outlined-button
      id={id}
      className={`shrink-0 select-none ${className}`}
      onClick={onClick}
      disabled={disabled}
      trailing-icon={trailingIcon ? "" : undefined}
      style={{
        '--md-outlined-button-icon-size': iconSize,
        ...style
      } as React.CSSProperties}
    >
      {icon && <md-icon slot="icon">{icon}</md-icon>}
      {label}
    </md-outlined-button>
  );
}

export function TertiaryButton({
  id,
  icon,
  label,
  className = "h-12 min-h-[48px] px-4 text-base font-medium",
  onClick,
  style,
  trailingIcon,
  iconSize = "20px",
  disabled
}: ButtonProps) {
  return (
    <md-text-button
      id={id}
      className={`shrink-0 select-none ${className}`}
      onClick={onClick}
      disabled={disabled}
      trailing-icon={trailingIcon ? "" : undefined}
      style={{
        '--md-text-button-icon-size': iconSize,
        ...style
      } as React.CSSProperties}
    >
      {icon && <md-icon slot="icon">{icon}</md-icon>}
      {label}
    </md-text-button>
  );
}

export const TextButton = TertiaryButton;

export interface SegmentedButtonItem {
  label: string;
  value: string;
}

export interface SegmentedButtonProps {
  items: SegmentedButtonItem[];
  selectedValue: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedButton({
  items,
  selectedValue,
  onChange,
  disabled,
  className = '',
}: SegmentedButtonProps) {
  return (
    <div
      role="group"
      className={`inline-flex h-10 border border-[var(--md-sys-color-outline)] rounded-full overflow-hidden bg-transparent ${className}`}
    >
      {items.map((item, index) => {
        const isSelected = item.value === selectedValue;
        const isLast = index === items.length - 1;

        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(item.value)}
            className={`flex items-center justify-center px-4 sm:px-6 text-sm font-medium transition-all relative group select-none ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${
              isSelected
                ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold'
                : 'text-[var(--md-sys-color-on-surface)]'
            } ${!isLast ? 'border-r border-[var(--md-sys-color-outline)]' : ''}`}
          >
            {/* MD3 State Layer */}
            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-[0.08] active:opacity-[0.12] transition-opacity pointer-events-none" />

            <div className="relative flex items-center justify-center">
              {isSelected && (
                <span className="material-symbols-outlined text-[18px] mr-1.5 sm:mr-2">check</span>
              )}
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
