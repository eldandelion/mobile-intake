import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders label, numeric value, icon, and sublabel correctly', () => {
    render(
      <MetricCard
        label="总注册学生"
        numericValue="1,240"
        sublabel="较昨日增加 12 人"
        icon="groups"
      />
    );

    expect(screen.getByText('总注册学生')).toBeDefined();
    expect(screen.getByText('1,240')).toBeDefined();
    expect(screen.getByText('较昨日增加 12 人')).toBeDefined();
    expect(screen.getByText('groups')).toBeDefined();
  });

  it('triggers onClick handler when card is clicked', () => {
    const handleClick = vi.fn();
    render(
      <MetricCard
        label="完成率"
        numericValue="85.4%"
        icon="check_circle"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('完成率'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
