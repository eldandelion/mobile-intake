import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpandableSearchBar } from './ExpandableSearchBar';

describe('ExpandableSearchBar Component', () => {
  it('renders collapsed state by default and expands on click', () => {
    const onChangeMock = vi.fn();
    render(<ExpandableSearchBar value="" onChange={onChangeMock} placeholder="搜索学生..." />);

    // Collapsed button with aria-label
    const expandBtn = screen.getByRole('button', { name: '展开搜索' });
    expect(expandBtn).toBeDefined();

    // Click to expand
    fireEvent.click(expandBtn);

    const input = screen.getByPlaceholderText('搜索学生...');
    expect(input).toBeDefined();
  });

  it('updates query via onChange when typing', () => {
    const onChangeMock = vi.fn();
    render(<ExpandableSearchBar value="张" onChange={onChangeMock} />);

    const input = screen.getByDisplayValue('张');
    fireEvent.change(input, { target: { value: '张三' } });

    expect(onChangeMock).toHaveBeenCalledWith('张三');
  });

  it('clears query when clicking the cancel button', () => {
    const onChangeMock = vi.fn();
    render(<ExpandableSearchBar value="张三" onChange={onChangeMock} />);

    const clearBtn = screen.getByRole('button', { name: '清除搜索' });
    fireEvent.click(clearBtn);

    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  it('collapses on Escape key when query is empty', () => {
    const onChangeMock = vi.fn();
    render(<ExpandableSearchBar value="" onChange={onChangeMock} />);

    const expandBtn = screen.getByRole('button', { name: '展开搜索' });
    fireEvent.click(expandBtn);

    const input = screen.getByPlaceholderText('搜索学生...');
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should collapse back to button
    expect(screen.getByRole('button', { name: '展开搜索' })).toBeDefined();
  });
});
