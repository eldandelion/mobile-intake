import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Snackbar } from './Snackbar';

describe('Snackbar', () => {
  it('renders with default styling when open is true', () => {
    render(
      <Snackbar
        open={true}
        message="这是一条普通提示"
        onClose={() => {}}
      />
    );

    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toBeDefined();
    expect(snackbar.textContent).toContain('这是一条普通提示');
    expect(snackbar.className).toContain('bg-[var(--md-sys-color-inverse-surface)]');
    expect(snackbar.className).toContain('text-[var(--md-sys-color-inverse-on-surface)]');
  });

  it('renders with error color tokens when variant is error', () => {
    render(
      <Snackbar
        open={true}
        message="这是一条错误提示"
        variant="error"
        actionLabel="前往登录"
        onClose={() => {}}
      />
    );

    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toBeDefined();
    expect(snackbar.textContent).toContain('这是一条错误提示');
    expect(snackbar.className).toContain('bg-[var(--md-sys-color-error-container)]');
    expect(snackbar.className).toContain('text-[var(--md-sys-color-on-error-container)]');
    expect(snackbar.className).not.toContain('border');

    const button = screen.getByText('前往登录');
    expect(button.className).toContain('text-[var(--md-sys-color-error)]');
  });

  it('fires onAction when action button is clicked', () => {
    const actionSpy = vi.fn();
    render(
      <Snackbar
        open={true}
        message="账号冲突"
        variant="error"
        actionLabel="前往登录"
        onAction={actionSpy}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByText('前往登录'));
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });
});
