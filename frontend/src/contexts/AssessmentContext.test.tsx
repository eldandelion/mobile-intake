import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AssessmentProvider, useAssessments } from './AssessmentContext';
import { AuthContext } from './AuthContext';
import { intakeApi, ScaleSummaryDto } from '../api/intakeApi';
import React from 'react';

describe('AssessmentContext', () => {
  const mockStudent = {
    studentNumber: '8209220532',
    fullName: '张三',
    phone: '13800138000',
    registeredAt: '2026-09-01T00:00:00',
  };

  const mockScales: ScaleSummaryDto[] = [
    {
      code: 'comprehensive_student_intake_survey',
      title: '中南大学学生心身健康综合调查问卷',
      description: '综合普查',
      questionCount: 336,
      estimatedMinutes: 45,
      status: 'IN_PROGRESS',
      answeredCount: 50,
      completionPercentage: 15,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithAuth = (student: any = mockStudent) => {
    const authValue: any = {
      student,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      setStudent: vi.fn(),
    };

    return ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={authValue}>
        <AssessmentProvider>{children}</AssessmentProvider>
      </AuthContext.Provider>
    );
  };

  it('fetches scales on mount when student is authenticated', async () => {
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue(mockScales);

    const { result } = renderHook(() => useAssessments(), {
      wrapper: renderWithAuth(mockStudent),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.scales.length).toBe(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.remainingCount).toBe(1);
    expect(result.current.isAllCompleted).toBe(false);
  });

  it('calculates isAllCompleted as true when all scales are completed', async () => {
    const completedScales: ScaleSummaryDto[] = [
      {
        ...mockScales[0],
        status: 'COMPLETED',
        answeredCount: 336,
        completionPercentage: 100,
      },
    ];
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue(completedScales);

    const { result } = renderHook(() => useAssessments(), {
      wrapper: renderWithAuth(mockStudent),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.completedCount).toBe(1);
    expect(result.current.remainingCount).toBe(0);
    expect(result.current.isAllCompleted).toBe(true);
  });

  it('handles error when getScales fails', async () => {
    vi.spyOn(intakeApi, 'getScales').mockRejectedValue(new Error('网络连接异常'));

    const { result } = renderHook(() => useAssessments(), {
      wrapper: renderWithAuth(mockStudent),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('网络连接异常');
    expect(result.current.scales.length).toBe(0);
  });

  it('updates filter state and scroll state', async () => {
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue(mockScales);

    const { result } = renderHook(() => useAssessments(), {
      wrapper: renderWithAuth(mockStudent),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilter('completed');
      result.current.setIsScrolled(true);
    });

    expect(result.current.filter).toBe('completed');
    expect(result.current.isScrolled).toBe(true);
  });

  it('returns default fallback when outside AssessmentProvider', () => {
    const { result } = renderHook(() => useAssessments());

    expect(result.current.scales).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.isAllCompleted).toBe(false);
    expect(result.current.filter).toBe('all');
  });
});
