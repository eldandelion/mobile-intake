import * as React from 'react';
import { OutlinedButton } from './Buttons';

export interface DestructiveButtonProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

/**
 * Destructive action button styled with Material Design 3 error tokens matching medical-system.
 * Guarantees that label, outline, state layer, and slotted icon are uniformly colored in --md-sys-color-error.
 */
export const DestructiveButton: React.FC<DestructiveButtonProps> = ({
  icon = 'delete',
  label,
  onClick,
  className,
  disabled,
  style,
}) => {
  return (
    <OutlinedButton
      icon={icon}
      label={label}
      onClick={onClick}
      className={className}
      disabled={disabled}
      style={
        {
          color: 'var(--md-sys-color-error)',
          '--md-outlined-button-label-text-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-hover-label-text-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-focus-label-text-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-pressed-label-text-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-hover-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-focus-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-pressed-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-with-icon-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-with-icon-hover-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-with-icon-focus-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-with-icon-pressed-icon-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-hover-state-layer-color': 'var(--md-sys-color-error)',
          '--md-outlined-button-pressed-state-layer-color': 'var(--md-sys-color-error)',
          ...style,
        } as React.CSSProperties
      }
    />
  );
};
