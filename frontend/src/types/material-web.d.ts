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
      'md-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        filled?: boolean;
        slot?: string;
      }, HTMLElement>;
      'md-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        href?: string;
        target?: string;
        ariaLabel?: string;
        'aria-label'?: string;
        toggle?: boolean;
        selected?: boolean;
      }, HTMLElement>;
      'md-outlined-icon-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
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
        value?: string | number;
        min?: number | string;
        max?: number | string;
        step?: number | string;
        disabled?: boolean;
        required?: boolean;
        'supporting-text'?: string;
        supportingText?: string;
        'suffix-text'?: string;
        suffixText?: string;
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
        onKeyDown?: (e: any) => void;
      }, HTMLElement>;
      'md-outlined-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string;
        value?: string;
        disabled?: boolean;
        error?: boolean;
        'error-text'?: string;
        errorText?: string;
        'supporting-text'?: string;
        supportingText?: string;
        onChange?: (e: any) => void;
      }, HTMLElement>;
      'md-select-option': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        value?: string;
        selected?: boolean;
        disabled?: boolean;
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
      'md-slider': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        min?: number;
        max?: number;
        step?: number;
        value?: number;
        labeled?: boolean;
        ticks?: boolean;
        disabled?: boolean;
        onInput?: (e: any) => void;
        onChange?: (e: any) => void;
      }, HTMLElement>;
      'md-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        anchor?: string;
        open?: boolean;
        quick?: boolean;
        positioning?: 'absolute' | 'fixed' | 'document' | 'popover';
        'has-overflow'?: boolean;
        'x-offset'?: number;
        'y-offset'?: number;
        'anchor-corner'?: string;
        'menu-corner'?: string;
        'stay-open-on-outside-click'?: boolean;
        'stay-open-on-focusout'?: boolean;
        'skip-restore-focus'?: boolean;
        'default-focus'?: string;
        onClosed?: (e: any) => void;
        onOpened?: (e: any) => void;
        onclosed?: (e: any) => void;
        onclosing?: (e: any) => void;
        onopened?: (e: any) => void;
        onopening?: (e: any) => void;
      }, HTMLElement>;
      'md-menu-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        type?: string;
        href?: string;
        target?: string;
        'keep-open'?: boolean;
        selected?: boolean;
        onClick?: (e: any) => void;
      }, HTMLElement>;
      'md-sub-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'anchor-corner'?: string;
        'menu-corner'?: string;
        'hover-open-delay'?: number;
        'hover-close-delay'?: number;
      }, HTMLElement>;
    }
  }
}
