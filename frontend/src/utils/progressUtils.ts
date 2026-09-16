/**
 * Scale Progress Calculation Utilities
 * Ensures mathematically defensive boundaries and avoids division-by-zero or overflow.
 */

export interface ProgressMetrics {
  percentage: number;
  clampedAnswered: number;
  total: number;
}

export function calculateScaleProgress(
  answeredCount: number = 0,
  questionCount: number = 0
): ProgressMetrics {
  if (questionCount <= 0) {
    return { percentage: 0, clampedAnswered: 0, total: 0 };
  }
  const clampedAnswered = Math.min(Math.max(0, answeredCount), questionCount);
  const percentage = Math.min(100, Math.max(0, Math.round((clampedAnswered / questionCount) * 100)));
  return { percentage, clampedAnswered, total: questionCount };
}
