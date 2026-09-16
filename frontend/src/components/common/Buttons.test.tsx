import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  OutlinedButton,
  FilledTonalButton,
  SegmentedButton,
  SegmentedButtonItem,
} from './Buttons';

afterEach(() => {
  cleanup();
});

describe('Buttons Component', () => {
  describe('PrimaryButton', () => {
    it('renders the label correctly', () => {
      render(<PrimaryButton label="提交" />);
      expect(screen.getByText('提交')).toBeDefined();
    });

    it('triggers onClick when clicked', () => {
      const onClickMock = vi.fn();
      render(<PrimaryButton label="点击" onClick={onClickMock} />);
      fireEvent.click(screen.getByText('点击'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('passes disabled attribute', () => {
      render(<PrimaryButton label="禁用" disabled={true} />);
      const btn = screen.getByText('禁用').closest('md-filled-button');
      expect(btn?.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('SecondaryButton and FilledTonalButton', () => {
    it('renders correctly', () => {
      render(<SecondaryButton label="次要" />);
      expect(screen.getByText('次要')).toBeDefined();
    });

    it('aliases FilledTonalButton', () => {
      render(<FilledTonalButton label="色调按钮" />);
      expect(screen.getByText('色调按钮')).toBeDefined();
    });
  });

  describe('OutlinedButton', () => {
    it('renders md-outlined-button correctly', () => {
      render(<OutlinedButton label="边框按钮" />);
      expect(screen.getByText('边框按钮')).toBeDefined();
      const btn = screen.getByText('边框按钮').closest('md-outlined-button');
      expect(btn).toBeDefined();
    });
  });

  describe('TertiaryButton', () => {
    it('renders md-text-button correctly', () => {
      render(<TertiaryButton label="文本按钮" />);
      expect(screen.getByText('文本按钮')).toBeDefined();
    });
  });

  describe('SegmentedButton', () => {
    const items: SegmentedButtonItem[] = [
      { label: '全部', value: 'all' },
      { label: '未完成', value: 'unfinished' },
      { label: '已完成', value: 'completed' },
    ];

    it('renders all options', () => {
      render(<SegmentedButton items={items} selectedValue="all" onChange={() => {}} />);
      expect(screen.getByText('全部')).toBeDefined();
      expect(screen.getByText('未完成')).toBeDefined();
      expect(screen.getByText('已完成')).toBeDefined();
    });

    it('shows checkmark and checked aria state for selected item', () => {
      render(<SegmentedButton items={items} selectedValue="unfinished" onChange={() => {}} />);
      const unfinishedBtn = screen.getByText('未完成').closest('button');
      expect(unfinishedBtn?.getAttribute('aria-checked')).toBe('true');
      expect(unfinishedBtn?.querySelector('.material-symbols-outlined')?.textContent).toBe('check');

      const allBtn = screen.getByText('全部').closest('button');
      expect(allBtn?.getAttribute('aria-checked')).toBe('false');
      expect(allBtn?.querySelector('.material-symbols-outlined')).toBeNull();
    });

    it('calls onChange with correct value when an option is clicked', () => {
      const onChangeMock = vi.fn();
      render(<SegmentedButton items={items} selectedValue="all" onChange={onChangeMock} />);

      const completedBtn = screen.getByText('已完成');
      fireEvent.click(completedBtn);

      expect(onChangeMock).toHaveBeenCalledWith('completed');
    });

    it('disables all buttons when disabled prop is true', () => {
      const onChangeMock = vi.fn();
      render(<SegmentedButton items={items} selectedValue="all" onChange={onChangeMock} disabled={true} />);

      const allBtn = screen.getByText('全部').closest('button');
      expect(allBtn?.disabled).toBe(true);

      fireEvent.click(screen.getByText('未完成'));
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });
});
