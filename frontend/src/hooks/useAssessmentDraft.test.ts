import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssessmentDraft } from './useAssessmentDraft';
import { intakeApi } from '../api/intakeApi';

describe('useAssessmentDraft', () => {
  const studentNumber = '2026001';
  const scaleCode = 'phq_9';
  const draftKey = `intake_draft_${studentNumber}_${scaleCode}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.spyOn(intakeApi, 'getDraft').mockResolvedValue(null);
    vi.spyOn(intakeApi, 'saveDraft').mockResolvedValue();
    vi.spyOn(intakeApi, 'deleteDraft').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('hydrates empty state when no local or remote draft exists', async () => {
    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.answers).toEqual({});
  });

  it('hydrates from localStorage when local draft exists', async () => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        answers: { phq9_1: 1 },
        updatedAt: 1000,
      })
    );

    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.answers).toEqual({ phq9_1: 1 });
  });

  it('reconciles and merges remote draft with local draft', async () => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        answers: { phq9_1: 1 },
        updatedAt: 1000,
      })
    );

    vi.spyOn(intakeApi, 'getDraft').mockResolvedValue({
      scaleCode,
      answers: { phq9_2: 2 },
      updatedAt: 2000,
    });

    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isInitialized).toBe(true);
    expect(result.current.answers).toEqual({ phq9_1: 1, phq9_2: 2 });
  });

  it('immediately updates local state and debounces server sync', async () => {
    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber, debounceMs: 1500 })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.recordAnswer('phq9_1', 2);
    });

    // Instant local commit
    expect(result.current.answers).toEqual({ phq9_1: 2 });
    const stored = JSON.parse(localStorage.getItem(draftKey)!);
    expect(stored.answers).toEqual({ phq9_1: 2 });

    // Server should not have been called yet
    expect(intakeApi.saveDraft).not.toHaveBeenCalled();

    // Advance by 1400ms - still not called
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(intakeApi.saveDraft).not.toHaveBeenCalled();

    // Another answer within debounce window
    act(() => {
      result.current.recordAnswer('phq9_2', 0);
    });
    expect(result.current.answers).toEqual({ phq9_1: 2, phq9_2: 0 });

    // Advance 1500ms from last tap
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await vi.runAllTimersAsync();
    });

    // Debounced call executed once with full accumulated answers
    expect(intakeApi.saveDraft).toHaveBeenCalledTimes(1);
    expect(intakeApi.saveDraft).toHaveBeenCalledWith(
      scaleCode,
      expect.objectContaining({
        answers: { phq9_1: 2, phq9_2: 0 },
      }),
      false
    );
  });

  it('flushes draft on document visibilitychange to hidden', async () => {
    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber, debounceMs: 5000 })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.recordAnswer('phq9_1', 3);
    });

    // Simulate tab switch / backgrounding
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.runAllTimersAsync();
    });

    expect(intakeApi.saveDraft).toHaveBeenCalledWith(
      scaleCode,
      expect.objectContaining({
        answers: { phq9_1: 3 },
      }),
      true // keepalive: true
    );
  });

  it('clears local and remote draft on clearDraft', async () => {
    const { result } = renderHook(() =>
      useAssessmentDraft({ scaleCode, studentNumber })
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.recordAnswer('phq9_1', 1);
    });

    expect(localStorage.getItem(draftKey)).not.toBeNull();

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem(draftKey)).toBeNull();
    expect(intakeApi.deleteDraft).toHaveBeenCalledWith(scaleCode);
  });
});
