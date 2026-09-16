import { useState, useEffect, useRef, useCallback } from 'react';
import { intakeApi } from '../api/intakeApi';

export type SyncStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'OFFLINE' | 'ERROR';

export interface UseAssessmentDraftOptions {
  scaleCode: string;
  studentNumber: string;
  debounceMs?: number;
  onInitialHydrated?: (answers: Record<string, any>) => void;
}

export function useAssessmentDraft({
  scaleCode,
  studentNumber,
  debounceMs = 1500,
  onInitialHydrated,
}: UseAssessmentDraftOptions) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [isInitialized, setIsInitialized] = useState(false);

  const answersRef = useRef<Record<string, any>>({});
  answersRef.current = answers;

  const onHydratedRef = useRef(onInitialHydrated);
  onHydratedRef.current = onInitialHydrated;

  const draftKey = `intake_draft_${studentNumber}_${scaleCode}`;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cloud push function
  const pushToServer = useCallback(
    async (currentAnswers: Record<string, any>, keepalive = false) => {
      if (Object.keys(currentAnswers).length === 0) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('OFFLINE');
        return;
      }
      setSyncStatus('SAVING');
      try {
        await intakeApi.saveDraft(
          scaleCode,
          {
            answers: currentAnswers,
            updatedAt: Date.now(),
          },
          keepalive
        );
        setSyncStatus('SAVED');
      } catch (err) {
        console.warn('Background draft sync failed, saved locally:', err);
        setSyncStatus('ERROR');
      }
    },
    [scaleCode]
  );

  // Flush in-flight answers on pagehide / visibilitychange
  useEffect(() => {
    const handleFlush = () => {
      if (document.visibilityState === 'hidden' && Object.keys(answersRef.current).length > 0) {
        pushToServer(answersRef.current, true);
      }
    };

    document.addEventListener('visibilitychange', handleFlush);
    window.addEventListener('pagehide', handleFlush);

    return () => {
      document.removeEventListener('visibilitychange', handleFlush);
      window.removeEventListener('pagehide', handleFlush);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [pushToServer]);

  // Initial Hydration: Monotonic additive reconciliation between LocalStorage and Cloud
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      let localAnswers: Record<string, any> = {};
      let localTime = 0;

      // 1. Read local storage draft
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            localAnswers = parsed.answers || parsed;
            localTime = typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0;
          }
        }
      } catch (e) {
        console.warn('Failed to parse local draft:', e);
      }

      // 2. Fetch server draft in parallel
      try {
        const remote = await intakeApi.getDraft(scaleCode);
        if (remote && remote.answers && typeof remote.answers === 'object') {
          // Additive union reconciliation: merge answers
          if (remote.updatedAt >= localTime) {
            localAnswers = { ...localAnswers, ...remote.answers };
            localTime = remote.updatedAt;
          } else {
            localAnswers = { ...remote.answers, ...localAnswers };
          }
          // Update local storage with reconciled state
          localStorage.setItem(
            draftKey,
            JSON.stringify({ answers: localAnswers, updatedAt: Math.max(localTime, Date.now()) })
          );
        }
      } catch (e) {
        // Network unavailable: proceed with local draft seamlessly
        console.warn('Unable to reach server draft, using local draft:', e);
      }

      if (isMounted) {
        setAnswers(localAnswers);
        setIsInitialized(true);
        if (onHydratedRef.current) {
          onHydratedRef.current(localAnswers);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [scaleCode, draftKey]);

  // Record an answer: instant local commit + 1.5s debounced cloud push
  const recordAnswer = useCallback(
    (questionId: string, value: any) => {
      const nextAnswers = { ...answersRef.current, [questionId]: value };
      const now = Date.now();

      // Immediate in-memory & LocalStorage update (0ms latency preserves 200ms auto-advance)
      setAnswers(nextAnswers);
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ answers: nextAnswers, updatedAt: now })
        );
      } catch (e) {
        console.warn('Failed to save draft to localStorage:', e);
      }

      // Debounce cloud sync
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        pushToServer(nextAnswers);
      }, debounceMs);
    },
    [draftKey, debounceMs, pushToServer]
  );

  // Force immediate cloud sync (e.g. before opening overview drawer or exiting)
  const flushDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (Object.keys(answersRef.current).length > 0) {
      pushToServer(answersRef.current);
    }
  }, [pushToServer]);

  // Clear draft upon successful final submission
  const clearDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      console.warn('Failed to remove local draft:', e);
    }
    intakeApi.deleteDraft(scaleCode).catch(() => {});
  }, [draftKey, scaleCode]);

  return {
    answers,
    recordAnswer,
    flushDraft,
    clearDraft,
    syncStatus,
    isInitialized,
  };
}
