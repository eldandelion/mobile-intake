import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { intakeApi, ScaleDetail, ScaleQuestion } from '../api/intakeApi';
import { PrimaryButton, OutlinedButton, TertiaryButton } from '../components/common/Buttons';
import type { MdDialog } from '@material/web/dialog/dialog';

interface QuestionnairePlayerPageProps {
  scaleCode: string;
  studentNumber: string;
  onClose: (completed: boolean) => void;
}

export const QuestionnairePlayerPage: React.FC<QuestionnairePlayerPageProps> = ({
  scaleCode,
  studentNumber,
  onClose,
}) => {
  const [scale, setScale] = useState<ScaleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogRef = useRef<MdDialog>(null);

  const draftKey = `intake_draft_${studentNumber}_${scaleCode}`;

  // Fetch scale details and load local draft
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    intakeApi
      .getScaleDetail(scaleCode)
      .then((data) => {
        if (!isMounted) return;
        setScale(data);

        // Try restoring draft from localStorage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed && typeof parsed === 'object') {
              setAnswers(parsed);
              // Resume at first unanswered question if possible
              const firstUnanswered = data.questions.findIndex((q) => parsed[q.id] === undefined);
              if (firstUnanswered > 0) {
                setCurrentIndex(firstUnanswered);
              }
            }
          } catch (e) {
            console.warn('Failed to parse saved draft:', e);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || '加载问卷失败');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [scaleCode, draftKey]);

  // Sync answers to localStorage draft
  const persistAnswers = useCallback((newAnswers: Record<string, any>) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(newAnswers));
    } catch (e) {
      console.warn('Failed to persist draft:', e);
    }
  }, [draftKey]);

  const questions: ScaleQuestion[] = scale?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion: ScaleQuestion | undefined = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Calculate answered count
  const answeredCount = Object.keys(answers).filter((k) =>
    questions.some((q) => q.id === k && answers[k] !== undefined && answers[k] !== '')
  ).length;

  const isCurrentAnswered = currentAnswer !== undefined && currentAnswer !== '';

  const handleSelectOption = (value: any) => {
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    persistAnswers(newAnswers);

    // Cancel pending auto-advance
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    // Auto-advance after 200ms if not on the last question
    if (currentIndex < totalQuestions - 1) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 200);
    }
  };

  const handleTextInput = (val: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: val };
    setAnswers(newAnswers);
    persistAnswers(newAnswers);
  };

  const handlePrev = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Check if any questions are unanswered
    const missing = questions.filter((q) => answers[q.id] === undefined || answers[q.id] === '');
    if (missing.length > 0) {
      const firstMissingIdx = questions.findIndex((q) => q.id === missing[0].id);
      if (firstMissingIdx !== -1) {
        setCurrentIndex(firstMissingIdx);
      }
      alert(`还有 ${missing.length} 道题目尚未作答，已为您跳转至未作答题目。`);
      return;
    }

    setSubmitting(true);
    try {
      await intakeApi.submitScale(scaleCode, answers);
      // Clear draft on successful submission
      localStorage.removeItem(draftKey);
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(err.message || '提交测评问卷失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttemptClose = () => {
    if (isCompleted || answeredCount === 0) {
      onClose(isCompleted);
    } else {
      dialogRef.current?.show();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex flex-col items-center justify-center p-6 text-center">
        <md-circular-progress indeterminate></md-circular-progress>
        <p className="mt-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
          正在加载测评问卷...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !scale) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center mb-4">
          <md-icon style={{ fontSize: '32px' }}>error</md-icon>
        </div>
        <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">问卷加载失败</h3>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-xs">
          {error || '无法获取测评数据'}
        </p>
        <div className="mt-6">
          <PrimaryButton label="返回测评列表" icon="arrow_back" onClick={() => onClose(false)} />
        </div>
      </div>
    );
  }

  // Completed outro screen
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex justify-center">
        <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col p-6 items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center mb-6 shadow-md animate-bounce">
            <md-icon style={{ fontSize: '48px' }}>task_alt</md-icon>
          </div>

          <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
            作答已提交！
          </h2>
          <p className="text-sm font-medium text-[var(--md-sys-color-primary)] mt-1">
            《{scale.title}》
          </p>

          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-4 leading-relaxed max-w-xs">
            您的测评数据已安全加密保存在数据库中，后续将由系统管理员导入学校心理健康管理中心进行综合评估。
          </p>

          <div className="w-full mt-10">
            <PrimaryButton
              label="返回测评列表"
              icon="arrow_back"
              className="w-full h-12 text-base"
              onClick={() => onClose(true)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex justify-center">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col relative border-x border-[var(--md-sys-color-outline-variant)] border-opacity-30">
        
        {/* Pinned Top Navigation Header */}
        <header className="shrink-0 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] border-opacity-40">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition"
                onClick={handleAttemptClose}
                aria-label="退出"
              >
                <md-icon style={{ fontSize: '22px' }}>arrow_back</md-icon>
              </button>
              <div className="truncate max-w-[200px]">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  {scale.title}
                </h2>
              </div>
            </div>

            {/* Question Counter Pill */}
            <div className="px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-xs font-semibold flex items-center gap-1">
              <span>第 {currentIndex + 1} / {totalQuestions} 题</span>
            </div>
          </div>

          {/* Linear Progress Bar */}
          <div className="w-full">
            <md-linear-progress
              value={answeredCount}
              max={totalQuestions}
              style={{ width: '100%', '--md-linear-progress-track-height': '4px' } as any}
            ></md-linear-progress>
          </div>
        </header>

        {/* Question Viewport Area */}
        <main className="flex-1 p-5 pb-28 overflow-y-auto flex flex-col justify-start">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-col flex-1"
              >
                {/* Question text */}
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--md-sys-color-on-surface)] leading-relaxed">
                    {currentQuestion.text}
                  </h3>
                </div>

                {/* Option / Input list */}
                {currentQuestion.type === 'single_choice' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = currentAnswer === opt.value;
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => handleSelectOption(opt.value)}
                          className={`w-full min-h-[56px] p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-secondary-container)] border-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary-container)] shadow-sm'
                              : 'bg-[var(--md-sys-color-surface-container-lowest)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <span className="text-base font-medium pr-3 leading-snug">
                            {opt.label}
                          </span>

                          {/* MD3 Radio Circle indicator */}
                          <div
                            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-secondary)]'
                                : 'border-[var(--md-sys-color-outline)]'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-[var(--md-sys-color-on-secondary)]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Text Input Question with MD3 outlined text field */
                  <div className="space-y-4 pt-2">
                    <md-outlined-text-field
                      label="填写回答"
                      value={currentAnswer || ''}
                      placeholder={currentQuestion.placeholder || '请输入...'}
                      className="w-full"
                      supporting-text="输入完成后点击下方“下一题”即可继续作答"
                      onInput={(e: any) => handleTextInput(e.target.value)}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter' && isCurrentAnswered) {
                          handleNext();
                        }
                      }}
                    >
                      <md-icon slot="leading-icon">edit_note</md-icon>
                    </md-outlined-text-field>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Pinned Bottom Action Footer */}
        <footer className="absolute bottom-0 inset-x-0 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] border-opacity-40 p-4 flex items-center justify-between gap-3 z-30">
          <TertiaryButton
            label="上一题"
            icon="chevron_left"
            className="h-11 px-4"
            disabled={currentIndex === 0}
            onClick={handlePrev}
          />

          {currentIndex === totalQuestions - 1 ? (
            <PrimaryButton
              label={submitting ? '提交中...' : '完成并提交'}
              icon="check"
              className="flex-1 h-11"
              disabled={submitting || !isCurrentAnswered}
              onClick={handleSubmit}
            />
          ) : (
            <PrimaryButton
              label="下一题"
              icon="chevron_right"
              trailingIcon
              className="flex-1 h-11"
              disabled={!isCurrentAnswered}
              onClick={handleNext}
            />
          )}
        </footer>

        {/* Exit Confirmation Dialog */}
        <md-dialog
          ref={dialogRef}
          style={{
            maxWidth: 'min(420px, calc(100vw - 32px))',
            minWidth: '300px',
            '--md-dialog-container-shape': '28px',
          } as React.CSSProperties}
        >
          <div slot="headline" className="px-6 pt-6 pb-2 text-xl font-bold text-[var(--md-sys-color-on-surface)]">
            退出问卷作答？
          </div>
          <div slot="content" className="px-6 py-2 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            当前已作答 <span className="font-semibold text-[var(--md-sys-color-primary)] font-mono">{answeredCount}</span> 道题目。您的作答内容已保存在本地设备中，稍后可随时进入继续完成。
          </div>
          <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-3">
            <OutlinedButton
              label="退出"
              className="h-10 min-h-[40px] px-5 text-sm"
              onClick={() => {
                dialogRef.current?.close();
                onClose(false);
              }}
            />
            <PrimaryButton
              label="继续作答"
              className="h-10 min-h-[40px] px-5 text-sm"
              onClick={() => dialogRef.current?.close()}
            />
          </div>
        </md-dialog>

      </div>
    </div>
  );
};
