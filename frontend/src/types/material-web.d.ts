import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'md-chip-set': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-filter-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string;
        selected?: boolean;
        removable?: boolean;
        elevated?: boolean;
        disabled?: boolean;
        'has-icon'?: boolean;
      }, HTMLElement>;
      'md-assist-chip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string;
        elevated?: boolean;
        disabled?: boolean;
      }, HTMLElement>;
      'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        href?: string;
        target?: string;
        ariaLabel?: string;
        'aria-label'?: string;
        toggle?: boolean;
        selected?: boolean;
      }, HTMLElement>;
      'md-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        open?: boolean;
        type?: 'alert' | 'full-screen';
        headline?: string;
      }, HTMLElement>;
      'md-filled-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        'trailing-icon'?: string;
      }, HTMLElement>;
      'md-filled-tonal-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        'trailing-icon'?: string;
      }, HTMLElement>;
      'md-outlined-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        'trailing-icon'?: string;
      }, HTMLElement>;
      'md-text-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        'trailing-icon'?: string;
      }, HTMLElement>;
      'md-outlined-text-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        type?: string;
        rows?: number;
        label?: string;
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        required?: boolean;
        'supporting-text'?: string;
        supportingText?: string;
        maxLength?: number;
        error?: boolean;
        'error-text'?: string;
        errorText?: string;
        'prefix-text'?: string;
        prefixText?: string;
        autocomplete?: string;
        inputmode?: string;
        onInput?: (e: any) => void;
        onChange?: (e: any) => void;
      }, HTMLElement>;
      'md-navigation-bar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'active-index'?: number;
      }, HTMLElement>;
      'md-navigation-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string;
        badge?: string;
        'active-index'?: number;
      }, HTMLElement>;
      'md-radio': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        checked?: boolean;
        name?: string;
        value?: string;
        disabled?: boolean;
      }, HTMLElement>;
      'md-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        checked?: boolean;
        indeterminate?: boolean;
        name?: string;
        value?: string;
        disabled?: boolean;
      }, HTMLElement>;
      'md-linear-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        value?: number;
        max?: number;
        indeterminate?: boolean;
        fourColor?: boolean;
      }, HTMLElement>;
      'md-circular-progress': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        value?: number;
        max?: number;
        indeterminate?: boolean;
        fourColor?: boolean;
      }, HTMLElement>;
      'md-ripple': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'md-divider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
