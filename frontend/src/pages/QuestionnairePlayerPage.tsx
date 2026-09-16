import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { intakeApi, ScaleDetail, ScaleQuestion } from '../api/intakeApi';
import { PrimaryButton, OutlinedButton, TertiaryButton } from '../components/common/Buttons';
import { QuestionGridSheet } from '../components/assessments/QuestionGridSheet';
import { QuestionnaireIntroScaffold } from '../components/assessments/QuestionnaireIntroScaffold';
import { setCenteredDialogAnimation } from '../utils/dialogAnimation';
import { useAssessmentDraft } from '../hooks/useAssessmentDraft';
import type { MdDialog } from '@material/web/dialog/dialog';

interface QuestionnairePlayerPageProps {
  scaleCode: string;
  studentNumber: string;
  onClose: (completed: boolean) => void;
}

const getOptionCornerRadius = (index: number, total: number): string => {
  if (total <= 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
};

export const QuestionnairePlayerPage: React.FC<QuestionnairePlayerPageProps> = ({
  scaleCode,
  studentNumber,
  onClose,
}) => {
  const [scale, setScale] = useState<ScaleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isQuestionSheetOpen, setIsQuestionSheetOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(false);

  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogRef = useRef<MdDialog>(null);
  const setDialogRef = useCallback((node: MdDialog | null) => {
    (dialogRef as React.MutableRefObject<MdDialog | null>).current = node;
    if (node) {
      setCenteredDialogAnimation(node);
    }
  }, []);

  // Offline-first dual-tier draft synchronization
  const {
    answers,
    recordAnswer,
    flushDraft,
    clearDraft,
    isInitialized,
  } = useAssessmentDraft({
    scaleCode,
    studentNumber,
  });

  // Prevent background scrolling while questionnaire session is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Fetch scale details
  useEffect(() => {
    let isMounted = true;
    setError(null);

    intakeApi
      .getScaleDetail(scaleCode)
      .then((data) => {
        if (!isMounted) return;
        setScale(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || '加载问卷失败');
        setIsReady(true);
      });

    return () => {
      isMounted = false;
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [scaleCode]);

  // Atomically transition from loading to ready once BOTH scale and draft are initialized
  useEffect(() => {
    if (scale && isInitialized && !isReady) {
      const hasAnswers = Object.keys(answers).some(
        (k) => answers[k] !== undefined && answers[k] !== ''
      );
      if (hasAnswers) {
        const firstUnanswered = scale.questions.findIndex(
          (q) => answers[q.id] === undefined || answers[q.id] === ''
        );
        if (firstUnanswered > 0) {
          setCurrentIndex(firstUnanswered);
        }
      } else {
        setShowIntro(true);
      }
      setIsReady(true);
    }
  }, [scale, isInitialized, isReady, answers]);

  const loading = !isReady;

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

    recordAnswer(currentQuestion.id, value);

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
    recordAnswer(currentQuestion.id, val);
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
      clearDraft();
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(err.message || '提交测评问卷失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttemptClose = () => {
    flushDraft();
    if (isCompleted || answeredCount === 0) {
      onClose(isCompleted);
    } else {
      dialogRef.current?.show();
    }
  };

  const pageContent = (
    <motion.div
      key="player-shell"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex flex-col justify-between overflow-hidden overscroll-contain"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full flex flex-col justify-between overflow-hidden"
          >
            <header className="shrink-0 w-full bg-[var(--md-sys-color-surface-container-low)]">
              <div className="w-full px-4 sm:px-8 py-2.5 flex items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <md-icon-button onClick={() => onClose(false)} aria-label="返回测评列表">
                    <md-icon>arrow_back</md-icon>
                  </md-icon-button>
                  <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] truncate">
                    正在加载测评...
                  </span>
                </div>
              </div>
            </header>

            <main className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center">
              <md-circular-progress indeterminate></md-circular-progress>
              <p className="mt-4 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)]">
                正在加载测评问卷...
              </p>
            </main>
          </motion.div>
        ) : error || !scale ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full flex flex-col justify-between overflow-hidden"
          >
            <header className="shrink-0 w-full bg-[var(--md-sys-color-surface-container-low)]">
              <div className="w-full px-4 sm:px-8 py-2.5 flex items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <md-icon-button onClick={() => onClose(false)} aria-label="返回测评列表">
                    <md-icon>arrow_back</md-icon>
                  </md-icon-button>
                  <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] truncate">
                    问卷加载失败
                  </span>
                </div>
              </div>
            </header>

            <main className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center mb-4 shadow-sm">
                <md-icon
                  style={{
                    '--md-icon-size': '32px',
                    fontSize: '32px',
                    width: '32px',
                    height: '32px',
                    overflow: 'visible',
                  } as React.CSSProperties}
                >
                  error
                </md-icon>
              </div>
              <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">问卷加载失败</h3>
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-xs">
                {error || '无法获取测评数据'}
              </p>
              <div className="mt-6">
                <PrimaryButton label="返回测评列表" icon="arrow_back" onClick={() => onClose(false)} />
              </div>
            </main>
          </motion.div>
        ) : isCompleted ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full h-full flex justify-center items-center overflow-hidden"
          >
            <div className="w-full max-w-md h-full bg-[var(--md-sys-color-surface)] flex flex-col p-6 items-center justify-center text-center overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center mb-6 shadow-md animate-bounce">
                <md-icon
                  style={{
                    '--md-icon-size': '48px',
                    fontSize: '48px',
                    width: '48px',
                    height: '48px',
                    overflow: 'visible',
                  } as React.CSSProperties}
                >
                  task_alt
                </md-icon>
              </div>

              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">
                作答已提交！
              </h2>
              <p className="text-sm font-medium text-[var(--md-sys-color-primary)] mt-1">
                《{scale?.title || ''}》
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
          </motion.div>
        ) : showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full flex flex-col justify-between overflow-hidden"
          >
            <QuestionnaireIntroScaffold
              scale={scale}
              totalQuestions={totalQuestions}
              hasExistingDraft={answeredCount > 0}
              answeredCount={answeredCount}
              onStart={() => setShowIntro(false)}
              onClose={() => {
                if (answeredCount > 0) {
                  setShowIntro(false);
                } else {
                  onClose(false);
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full h-full flex flex-col justify-between overflow-hidden"
          >
      {/* Pinned Top Navigation Header - spans full width on wider screens */}
      <header className="shrink-0 w-full bg-[var(--md-sys-color-surface-container-low)]">
        <div className="w-full px-4 sm:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <md-icon-button
              onClick={handleAttemptClose}
              aria-label="退出"
            >
              <md-icon>arrow_back</md-icon>
            </md-icon-button>
            <div className="truncate max-w-[180px] sm:max-w-xl">
              <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)] truncate">
                {scale.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Instructions Button */}
            <md-icon-button
              onClick={() => setShowIntro(true)}
              aria-label="查看量表指导语与说明"
              title="查看指导说明"
            >
              <md-icon>info</md-icon>
            </md-icon-button>

            {/* Question Counter Pill (Interactive Sheet Trigger) */}
            <button
              type="button"
              onClick={() => {
                flushDraft();
                setIsQuestionSheetOpen(true);
              }}
              aria-label="查看题目列表并快速跳转"
              title="点击查看所有题目并快速跳转"
              className="px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] text-xs sm:text-sm font-semibold shrink-0 cursor-pointer active:scale-95 transition-all hover:bg-[var(--md-sys-color-surface-container-highest)] select-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
            >
              <span>第 {currentIndex + 1} / {totalQuestions} 题</span>
            </button>
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

      {/* Question Viewport Area - centered reading container */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain flex justify-center">
        <div className="w-full max-w-md p-5 pb-8 sm:p-6 sm:pb-8 flex flex-col justify-start">
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
                  {currentQuestion.sectionTitle && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]">
                      <md-icon style={{ '--md-icon-size': '14px', fontSize: '14px', width: '14px', height: '14px' } as React.CSSProperties}>category</md-icon>
                      <span>{currentQuestion.sectionTitle}</span>
                    </div>
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--md-sys-color-on-surface)] leading-relaxed">
                    {currentQuestion.text}
                  </h3>
                </div>

                {/* Option / Input list */}
                {currentQuestion.type === 'single_choice' ? (
                  <div className="flex flex-col gap-[2px]">
                    {currentQuestion.options.map((opt, optIndex) => {
                      const isSelected = currentAnswer === opt.value;
                      const cornerRadius = getOptionCornerRadius(optIndex, currentQuestion.options.length);
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => handleSelectOption(opt.value)}
                          className={`w-full min-h-[56px] px-5 py-4 text-left flex items-center justify-between transition-colors duration-150 cursor-pointer select-none relative overflow-hidden ${cornerRadius} ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                              : 'bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <md-ripple></md-ripple>
                          <span className={`text-base leading-snug pr-4 ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                            {opt.label}
                          </span>

                          <md-radio
                            checked={isSelected}
                            name={`question_${currentQuestion.id}`}
                            value={String(opt.value)}
                            tabIndex={-1}
                            className="pointer-events-none shrink-0"
                          ></md-radio>
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
        </div>
      </main>

      {/* Pinned Bottom Action Footer - spans full width on wider screens with zero bottom gap */}
      <footer
        className="shrink-0 w-full bg-[var(--md-sys-color-surface-container)] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 z-10"
        style={{
          marginBottom: '-2px',
          paddingBottom: 'calc(0.875rem + 2px)',
        }}
      >
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
            className="h-11 min-w-[140px]"
            disabled={submitting || !isCurrentAnswered}
            onClick={handleSubmit}
          />
        ) : (
          <PrimaryButton
            label="下一题"
            icon="chevron_right"
            trailingIcon
            className="h-11 min-w-[120px]"
            disabled={!isCurrentAnswered}
            onClick={handleNext}
          />
        )}
      </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <md-dialog
        ref={setDialogRef}
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

      {/* Question Navigation Grid Bottom Sheet */}
      <QuestionGridSheet
        isOpen={isQuestionSheetOpen}
        totalQuestions={totalQuestions}
        currentIndex={currentIndex}
        answers={answers}
        questions={questions}
        onSelectQuestion={(index) => {
          setCurrentIndex(index);
          setIsQuestionSheetOpen(false);
        }}
        onClose={() => setIsQuestionSheetOpen(false)}
      />
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(pageContent, document.body) : pageContent;
};
