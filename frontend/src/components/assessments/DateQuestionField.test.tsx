import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateQuestionField } from './DateQuestionField';
import { ScaleQuestion } from '../../api/intakeApi';

function setMdInputValue(field: HTMLElement, value: string) {
  (field as any).value = value;
  fireEvent(field, new Event('input', { bubbles: true, cancelable: true }));
}

function setMdSelectValue(select: HTMLElement, value: string) {
  (select as any).value = value;
  fireEvent(select, new Event('change', { bubbles: true, cancelable: true }));
}

describe('DateQuestionField', () => {
  const mockQuestion: ScaleQuestion = {
    id: 'G2',
    field: 'birthday',
    text: 'G2. 出生日期：',
    orderNum: 2,
    type: 'date',
    options: [],
  };

  it('renders 3-column inputs for month, day, and year', () => {
    const onChange = vi.fn();
    render(<DateQuestionField question={mockQuestion} onChange={onChange} />);

    const select = document.querySelector('md-outlined-select[label="月"]');
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]');
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]');

    expect(select).toBeDefined();
    expect(dayInput).toBeDefined();
    expect(yearInput).toBeDefined();
    expect(screen.getByText(/请选择出生月份/)).toBeDefined();
  });

  it('populates fields when initial ISO date value is provided', () => {
    const onChange = vi.fn();
    render(<DateQuestionField question={mockQuestion} value="2005-08-15" onChange={onChange} />);

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]') as HTMLElement;
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;

    expect(select.getAttribute('value')).toBe('8');
    expect(dayInput.getAttribute('value')).toBe('15');
    expect(yearInput.getAttribute('value')).toBe('2005');
  });

  it('triggers onChange with formatted ISO date when all 3 fields are provided', () => {
    const onChange = vi.fn();
    render(<DateQuestionField question={mockQuestion} onChange={onChange} />);

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]') as HTMLElement;
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;

    // Select month 5
    setMdSelectValue(select, '5');
    expect(onChange).toHaveBeenCalledWith(''); // Incomplete

    // Input day 18
    setMdInputValue(dayInput, '18');
    expect(onChange).toHaveBeenCalledWith(''); // Incomplete

    // Input year 2006
    setMdInputValue(yearInput, '2006');
    expect(onChange).toHaveBeenLastCalledWith('2006-05-18');
  });

  it('flags error and rejects invalid day for the selected month', () => {
    const onChange = vi.fn();
    render(<DateQuestionField question={mockQuestion} onChange={onChange} />);

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]') as HTMLElement;
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;

    // Set April (has 30 days) and Day 31
    setMdSelectValue(select, '4');
    setMdInputValue(dayInput, '31');
    setMdInputValue(yearInput, '2006');

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/该月最大天数为 30 日/)).toBeDefined();
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('displays external error message', () => {
    const onChange = vi.fn();
    render(
      <DateQuestionField
        question={mockQuestion}
        value="2000-01-01"
        error="测试错误提示"
        onChange={onChange}
      />
    );

    expect(screen.getByText('测试错误提示')).toBeDefined();
  });

  it('calls onEnterPress when Enter key is pressed in year field', () => {
    const onChange = vi.fn();
    const onEnterPress = vi.fn();
    render(
      <DateQuestionField
        question={mockQuestion}
        value="2006-05-18"
        onChange={onChange}
        onEnterPress={onEnterPress}
      />
    );

    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;
    fireEvent.keyDown(yearInput, { key: 'Enter' });

    expect(onEnterPress).toHaveBeenCalled();
  });

  it('does not default to an error state on initial render even if external error is passed', () => {
    const onChange = vi.fn();
    render(
      <DateQuestionField
        question={mockQuestion}
        error="请完成本道题目作答"
        onChange={onChange}
      />
    );

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('请完成本道题目作答')).toBeNull();
    const select = document.querySelector('md-outlined-select[label="月"]');
    expect(select?.getAttribute('error')).toBeNull();
  });

  it('preserves month and day when erasing the year', () => {
    let currentValue = '';
    const onChange = vi.fn((val: string) => {
      currentValue = val;
    });

    const { rerender } = render(
      <DateQuestionField question={mockQuestion} value={currentValue} onChange={onChange} />
    );

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]') as HTMLElement;
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;

    // Fill month and day
    setMdSelectValue(select, '10');
    setMdInputValue(dayInput, '25');
    setMdInputValue(yearInput, '2005');

    expect(onChange).toHaveBeenLastCalledWith('2005-10-25');
    rerender(
      <DateQuestionField question={mockQuestion} value={currentValue} onChange={onChange} />
    );

    // Erase the year
    setMdInputValue(yearInput, '');

    expect(onChange).toHaveBeenLastCalledWith('');
    rerender(
      <DateQuestionField question={mockQuestion} value={currentValue} onChange={onChange} />
    );

    // Verify month and day are still preserved
    expect((select as any).value).toBe('10');
    expect((dayInput as any).value).toBe('25');
    expect((yearInput as any).value).toBe('');
  });

  it('applies matching container shape CSS token to month select', () => {
    const onChange = vi.fn();
    render(<DateQuestionField question={mockQuestion} onChange={onChange} />);

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    expect(select.style.getPropertyValue('--md-outlined-select-text-field-container-shape')).toBe(
      'var(--md-outlined-text-field-container-shape, 4px)'
    );
  });
});

