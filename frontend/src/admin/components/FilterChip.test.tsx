import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip, FilterChipSet } from './FilterChip';

describe('FilterChip Component', () => {
  it('renders an outlined button with border and transparent background', () => {
    render(
      <FilterChip
        label="状态"
        options={['全部', '已全部完成']}
        selectedValue="全部"
        isOpen={false}
        onToggle={vi.fn()}
      />
    );

    const button = screen.getByText('状态: 全部').closest('button');
    expect(button).toBeDefined();
    expect(button?.className).toContain('border-[var(--md-sys-color-outline)]');
    expect(button?.className).toContain('bg-transparent');
  });

  it('triggers onToggle when chip button is clicked', () => {
    const onToggleMock = vi.fn();
    render(
      <FilterChip
        label="状态"
        options={['全部', '已全部完成']}
        isOpen={false}
        onToggle={onToggleMock}
      />
    );

    const button = screen.getByText('状态');
    fireEvent.click(button);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});

describe('FilterChipSet Component', () => {
  it('renders chips and children in the set', () => {
    const onFilterChangeMock = vi.fn();
    render(
      <FilterChipSet
        chips={[{ label: '状态', options: ['全部', '已全部完成'] }]}
        initialFilters={{ 状态: '全部' }}
        onFilterChange={onFilterChangeMock}
      >
        <div data-testid="custom-child">Child Element</div>
      </FilterChipSet>
    );

    expect(screen.getByText('状态: 全部')).toBeDefined();
    expect(screen.getByTestId('custom-child')).toBeDefined();
  });
});
