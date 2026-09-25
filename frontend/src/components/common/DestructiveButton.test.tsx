import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DestructiveButton } from './DestructiveButton';

afterEach(() => {
  cleanup();
});

describe('DestructiveButton Component', () => {
  it('renders correctly with label and icon', () => {
    const handleClick = vi.fn();
    render(<DestructiveButton label="删除项目" icon="delete" onClick={handleClick} />);

    const buttonElement = screen.getByText('删除项目');
    expect(buttonElement).toBeDefined();

    // Verify onClick works
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies error tokens including icon color in style', () => {
    const { container } = render(<DestructiveButton label="清除测试账号" icon="delete" />);

    const button = container.querySelector('md-outlined-button');
    expect(button).toBeDefined();

    const style = button?.getAttribute('style') || '';
    expect(style).toContain('--md-outlined-button-icon-color: var(--md-sys-color-error)');
    expect(style).toContain('--md-outlined-button-label-text-color: var(--md-sys-color-error)');
    expect(style).not.toContain('--md-outlined-button-outline-color: var(--md-sys-color-error)');

    // Verify slotted icon exists
    const icon = container.querySelector('md-icon[slot="icon"]');
    expect(icon).toBeDefined();
    expect(icon?.textContent).toBe('delete');
  });
});
