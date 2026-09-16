import { describe, it, expect } from 'vitest';
import { calculateScaleProgress } from './progressUtils';

describe('calculateScaleProgress', () => {
  it('handles zero questionCount gracefully without division-by-zero', () => {
    const result = calculateScaleProgress(0, 0);
    expect(result).toEqual({ percentage: 0, clampedAnswered: 0, total: 0 });

    const resultWithAnswered = calculateScaleProgress(5, 0);
    expect(resultWithAnswered).toEqual({ percentage: 0, clampedAnswered: 0, total: 0 });
  });

  it('handles negative answeredCount and negative questionCount', () => {
    const result = calculateScaleProgress(-2, 10);
    expect(result).toEqual({ percentage: 0, clampedAnswered: 0, total: 10 });

    const resultNegativeTotal = calculateScaleProgress(2, -5);
    expect(resultNegativeTotal).toEqual({ percentage: 0, clampedAnswered: 0, total: 0 });
  });

  it('accurately calculates partial percentages', () => {
    // 3 / 9 = 33%
    const phq = calculateScaleProgress(3, 9);
    expect(phq).toEqual({ percentage: 33, clampedAnswered: 3, total: 9 });

    // 1 / 3 = 33%
    const oneThird = calculateScaleProgress(1, 3);
    expect(oneThird).toEqual({ percentage: 33, clampedAnswered: 1, total: 3 });

    // 2 / 3 = 67%
    const twoThird = calculateScaleProgress(2, 3);
    expect(twoThird).toEqual({ percentage: 67, clampedAnswered: 2, total: 3 });

    // 9 / 9 = 100%
    const full = calculateScaleProgress(9, 9);
    expect(full).toEqual({ percentage: 100, clampedAnswered: 9, total: 9 });
  });

  it('clamps answeredCount when it exceeds questionCount', () => {
    const clamped = calculateScaleProgress(15, 9);
    expect(clamped).toEqual({ percentage: 100, clampedAnswered: 9, total: 9 });
  });
});
