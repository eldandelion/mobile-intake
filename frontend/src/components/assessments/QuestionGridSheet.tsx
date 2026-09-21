import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ScaleQuestion } from '../../api/intakeApi';
import { validateQuestionAnswer } from '../../domain/validators';

export interface QuestionGridSheetProps {
  isOpen: boolean;
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, any>;
  questions: ScaleQuestion[];
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export const isQuestionAnswered = (val: any, q?: ScaleQuestion): boolean => {
  if (q) {
    return validateQuestionAnswer(q, val).isValid;
  }
  if (val === undefined || val === null || val === '') return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') {
    return val.value !== undefined && val.value !== null && val.value !== '';
  }
  return true;
};

export const QuestionGridSheet: React.FC<QuestionGridSheetProps> = ({
  isOpen,
  totalQuestions,
  currentIndex,
  answers,
  questions,
  onSelectQuestion,
  onClose,
}) => {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const answeredCount = questions.filter((q) => isQuestionAnswered(answers[q.id], q)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed Backdrop Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-[var(--md-sys-color-scrim,#000)]/40 backdrop-blur-[1px]"
          />

          {/* MD3 Modal Bottom Sheet Container */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="题目列表"
            className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto rounded-t-[28px] bg-[var(--md-sys-color-surface-container-low)] shadow-2xl border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 flex flex-col max-h-[85dvh] overflow-hidden"
          >
            {/* Top Centered Drag Handle (MD3 Spec: 32px x 4px) */}
            <div className="pt-3 pb-1.5 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
              <div
                className="w-8 h-1 rounded-full bg-[var(--md-sys-color-outline)] opacity-40"
                aria-hidden="true"
              />
            </div>

            {/* Sheet Header */}
            <div className="px-5 pt-1 pb-2 shrink-0">
              <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                题目列表
              </h3>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                已作答 <span className="font-semibold text-[var(--md-sys-color-primary)] font-mono">{answeredCount}</span> / {totalQuestions} 题
              </p>
            </div>

            {/* Status Legend (No separation line) */}
            <div className="px-5 py-1.5 flex items-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[var(--md-sys-color-primary)] shrink-0" />
                <span>当前</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[var(--md-sys-color-primary-container)] shrink-0" />
                <span>已完成</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[var(--md-sys-color-surface-container-high)] shrink-0" />
                <span>未完成</span>
              </div>
            </div>

            {/* Question Number Grid */}
            <div className="p-5 overflow-y-auto overscroll-contain flex-1">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = isQuestionAnswered(answers[q.id], q);

                  let buttonStyles =
                    'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]';

                  if (isCurrent) {
                    buttonStyles =
                      'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold shadow-xs';
                  } else if (isAnswered) {
                    buttonStyles =
                      'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-semibold hover:brightness-95';
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => onSelectQuestion(idx)}
                      aria-label={`跳转至第 ${idx + 1} 题${isCurrent ? '（当前作答中）' : isAnswered ? '（已作答）' : '（未作答）'}`}
                      className={`h-11 min-h-[44px] rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-150 cursor-pointer select-none active:scale-95 ${buttonStyles}`}
                    >
                      <span className="font-mono text-sm leading-none">{idx + 1}</span>
                      {isAnswered && !isCurrent && (
                        <span className="text-[9px] leading-none opacity-80 mt-0.5">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Safe Area Padding */}
            <div
              className="shrink-0"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
