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
