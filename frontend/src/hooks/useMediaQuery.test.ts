import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('min-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          listeners.push(callback);
        }
      }),
      removeEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          listeners = listeners.filter((l) => l !== callback);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  it('initializes with matchMedia result', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    const { result: mobileResult } = renderHook(() => useMediaQuery('(max-width: 480px)'));
    expect(mobileResult.current).toBe(false);
  });

  it('updates state when media query change event fires', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });
    });

    expect(result.current).toBe(false);
  });
});
