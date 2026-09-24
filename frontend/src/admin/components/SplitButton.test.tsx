import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SplitButton } from './SplitButton';

describe('SplitButton Component', () => {
  const mockOptions = [
    { label: '完整数据包 (.zip)', icon: 'folder_zip', onClick: vi.fn() },
    { label: '学生名单 (.csv)', icon: 'table_chart', onClick: vi.fn() },
  ];

  it('renders main button and triggers onClick', () => {
    const onMainClick = vi.fn();
    render(
      <SplitButton
        label="导出数据"
        icon="download"
        onClick={onMainClick}
        options={mockOptions}
      />
    );

    const mainBtn = screen.getByText('导出数据');
    expect(mainBtn).toBeDefined();

    fireEvent.click(mainBtn);
    expect(onMainClick).toHaveBeenCalledTimes(1);
  });

  it('opens menu when dropdown toggle is clicked and triggers option click', () => {
    const onMainClick = vi.fn();
    render(
      <SplitButton
        label="导出数据"
        icon="download"
        onClick={onMainClick}
        options={mockOptions}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: '更多操作' });
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);

    const optionItem = screen.getByText('完整数据包 (.zip)');
    expect(optionItem).toBeDefined();

    fireEvent.click(optionItem);
    expect(mockOptions[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state on both buttons', () => {
    render(
      <SplitButton
        label="导出中..."
        disabled={true}
        onClick={vi.fn()}
        options={mockOptions}
      />
    );

    const mainBtn = screen.getByText('导出中...').closest('md-filled-tonal-button');
    expect(mainBtn?.hasAttribute('disabled')).toBe(true);

    const toggleBtn = screen.getByRole('button', { name: '更多操作' });
    expect(toggleBtn.hasAttribute('disabled')).toBe(true);
  });
});
