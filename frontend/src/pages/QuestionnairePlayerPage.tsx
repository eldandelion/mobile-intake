import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { intakeApi, ScaleDetail, ScaleQuestion, ScaleOption } from '../api/intakeApi';
import { PrimaryButton, OutlinedButton, TertiaryButton } from '../components/common/Buttons';
import { QuestionGridSheet } from '../components/assessments/QuestionGridSheet';
import { QuestionnaireIntroScaffold } from '../components/assessments/QuestionnaireIntroScaffold';
import { DateQuestionField } from '../components/assessments/DateQuestionField';
import { setCenteredDialogAnimation } from '../utils/dialogAnimation';
import { useAssessmentDraft } from '../hooks/useAssessmentDraft';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useOptionalAuth } from '../contexts/AuthContext';
import { validateQuestionAnswer } from '../domain/validators';
import type { MdDialog } from '@material/web/dialog/dialog';
import type { MdMenu } from '@material/web/menu/menu';

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

export const getFieldLeadingIcon = (question: ScaleQuestion): string => {
  if (question.icon) {
    return question.icon;
  }

  const id = question.id.toLowerCase();
  const text = question.text.toLowerCase();

  // Contact / Phone
  if (id.includes('phone') || text.includes('电话') || text.includes('手机') || text.includes('联系方式')) {
    return 'phone';
  }
  // Name
  if (id.includes('name') || text.includes('姓名')) {
    return 'person';
  }
  // Student ID
  if (id.includes('student_number') || id.includes('studentno') || text.includes('学号')) {
    return 'badge';
  }
  // Class / Major / College / School
  if (id.includes('class') || id.includes('major') || text.includes('班级') || text.includes('专业') || text.includes('学院')) {
    return 'school';
  }
  // Height
  if (id.includes('height') || text.includes('身高')) {
    return 'height';
  }
  // Weight
  if (id.includes('weight') || text.includes('体重')) {
    return 'monitor_weight';
  }
  // Age
  if (id.includes('age') || text.includes('年龄') || text.includes('周岁')) {
    return 'cake';
  }
  // Alcohol
  if (id.includes('alcohol') || text.includes('喝酒') || text.includes('饮酒')) {
    return 'liquor';
  }
  // Smoking count
  if (id.includes('cigs') || text.includes('抽烟') || text.includes('吸烟')) {
    return 'smoking_rooms';
  }
  // History / Years
  if (id.includes('years') || text.includes('持续') || text.includes('年数')) {
    return 'history';
  }
  // Exercise / Fitness
  if (id.includes('exercise') || text.includes('锻炼') || text.includes('运动')) {
    return 'directions_run';
  }
  // Sedentary / Sitting
  if (id.includes('sedentary') || text.includes('坐姿') || text.includes('久坐')) {
    return 'chair';
  }
  // Hospital / Clinic / Medical / Date
  if (id.includes('clinic') || text.includes('门诊') || text.includes('就诊') || text.includes('时间') || text.includes('日期')) {
    return 'calendar_month';
  }
  // Menstruation / Female
  if (text.includes('月经') || text.includes('女性')) {
    return 'female';
  }

  // Fallback based on question type
  if (question.type === 'number') {
    return 'pin';
  }
  return 'edit_note';
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

  const incompleteDialogRef = useRef<MdDialog>(null);
  const setIncompleteDialogRef = useCallback((node: MdDialog | null) => {
    (incompleteDialogRef as React.MutableRefObject<MdDialog | null>).current = node;
    if (node) {
      setCenteredDialogAnimation(node);
    }
  }, []);

  const [unansweredCount, setUnansweredCount] = useState<number>(0);
  const [firstUnansweredIndex, setFirstUnansweredIndex] = useState<number>(0);

  const menuRef = useRef<MdMenu | null>(null);
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (menuRef.current) {
        if (menuAnchorRef.current) {
          menuRef.current.anchorElement = menuAnchorRef.current;
        }
        if (next) {
          if (typeof menuRef.current.show === 'function') {
            menuRef.current.show();
          } else {
            menuRef.current.open = true;
          }
        } else {
          if (typeof menuRef.current.close === 'function') {
            menuRef.current.close();
          } else {
            menuRef.current.open = false;
          }
        }
      }
      return next;
    });
  };

  const handleOpenAboutTest = () => {
    if (menuRef.current) {
      if (typeof menuRef.current.close === 'function') {
        menuRef.current.close();
      } else {
        menuRef.current.open = false;
      }
    }
    setIsMenuOpen(false);
    setShowIntro(true);
  };

  const { showSnackbar } = useSnackbar();

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

  const auth = useOptionalAuth();
  const student = auth?.student;

  // Automatically pre-fill basic info fields in demographics_survey from authenticated student profile
  useEffect(() => {
    if (scaleCode === 'demographics_survey' && student && isInitialized) {
      if ((answers['demo_name'] === undefined || answers['demo_name'] === '') && student.fullName) {
        recordAnswer('demo_name', student.fullName);
      }
      if ((answers['demo_phone'] === undefined || answers['demo_phone'] === '') && student.phone) {
        recordAnswer('demo_phone', student.phone);
      }
      if ((answers['demo_student_number'] === undefined || answers['demo_student_number'] === '') && student.studentNumber) {
        recordAnswer('demo_student_number', student.studentNumber);
      }
    }
  }, [scaleCode, student, isInitialized, answers, recordAnswer]);

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
        (k) => answers[k] !== undefined && answers[k] !== null && answers[k] !== ''
      );
      if (hasAnswers) {
        const firstUnanswered = scale.questions.findIndex(
          (q) => !validateQuestionAnswer(q, answers[q.id]).isValid
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
  const currentCategory = currentQuestion?.sectionTitle || scale?.subtitle;

  // Calculate answered & valid count
  const answeredCount = questions.filter((q) =>
    validateQuestionAnswer(q, answers[q.id]).isValid
  ).length;

  const currentValidation = currentQuestion
    ? validateQuestionAnswer(currentQuestion, currentAnswer)
    : { isValid: false };
  const isCurrentValid = currentValidation.isValid;
  const isCurrentAnswered = isCurrentValid;

  const handleSelectOption = (opt: ScaleOption) => {
    if (!currentQuestion) return;

    if (opt.hasTextInput) {
      const existingText =
        typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) && currentAnswer.value === opt.value
          ? currentAnswer.text || ''
          : '';
      recordAnswer(currentQuestion.id, { value: opt.value, text: existingText });

      // Inhibit auto-advance so student can enter explanation in the blank
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      return;
    }

    recordAnswer(currentQuestion.id, opt.value);

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

  const handleOptionTextInput = (opt: ScaleOption, text: string) => {
    if (!currentQuestion) return;
    recordAnswer(currentQuestion.id, { value: opt.value, text });
  };

  const isMultiOptionSelected = (opt: ScaleOption): boolean => {
    if (!Array.isArray(currentAnswer)) return false;
    return currentAnswer.some((item) => {
      const val = item && typeof item === 'object' ? item.value : item;
      return val === opt.value;
    });
  };

  const getMultiOptionText = (opt: ScaleOption): string => {
    if (!Array.isArray(currentAnswer)) return '';
    const found = currentAnswer.find((item) => item && typeof item === 'object' && item.value === opt.value);
    return found ? found.text || '' : '';
  };

  const handleToggleMultipleChoice = (opt: ScaleOption) => {
    if (!currentQuestion) return;
    const currentList: any[] = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    const existingIdx = currentList.findIndex((item) => {
      const val = item && typeof item === 'object' ? item.value : item;
      return val === opt.value;
    });

    if (existingIdx >= 0) {
      currentList.splice(existingIdx, 1);
    } else {
      if (opt.hasTextInput) {
        currentList.push({ value: opt.value, text: '' });
      } else {
        currentList.push(opt.value);
      }
    }
    recordAnswer(currentQuestion.id, currentList);
  };

  const handleMultiOptionTextInput = (opt: ScaleOption, text: string) => {
    if (!currentQuestion) return;
    const currentList: any[] = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    const existingIdx = currentList.findIndex((item) => {
      const val = item && typeof item === 'object' ? item.value : item;
      return val === opt.value;
    });
    if (existingIdx >= 0) {
      currentList[existingIdx] = { value: opt.value, text };
    } else {
      currentList.push({ value: opt.value, text });
    }
    recordAnswer(currentQuestion.id, currentList);
  };

  const handleSliderChange = (val: number) => {
    if (!currentQuestion) return;
    recordAnswer(currentQuestion.id, val);
  };

  const handleNumberInput = (val: string) => {
    if (!currentQuestion) return;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (val === '') {
      recordAnswer(currentQuestion.id, '');
    } else {
      const num = Number(val);
      recordAnswer(currentQuestion.id, isNaN(num) ? val : num);
    }
  };

  const handleZeroOptionClick = () => {
    if (!currentQuestion) return;

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    const isCurrentlyZero = currentAnswer === 0 || currentAnswer === '0';
    if (isCurrentlyZero) {
      recordAnswer(currentQuestion.id, '');
      return;
    }

    recordAnswer(currentQuestion.id, 0);

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
    if (!isCurrentValid) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Check if any questions are unanswered or invalid
    const invalidQuestions = questions.filter(
      (q) => !validateQuestionAnswer(q, answers[q.id]).isValid
    );
    if (invalidQuestions.length > 0) {
      const firstInvalidIdx = questions.findIndex((q) => q.id === invalidQuestions[0].id);
      setUnansweredCount(invalidQuestions.length);
      setFirstUnansweredIndex(firstInvalidIdx !== -1 ? firstInvalidIdx : 0);
      incompleteDialogRef.current?.show();
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
      showSnackbar({
        message: err.message || '提交测评问卷失败，请重试',
        icon: 'error',
      });
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
            <header className="shrink-0 w-full bg-[var(--md-sys-color-surface)]">
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
            <header className="shrink-0 w-full bg-[var(--md-sys-color-surface)]">
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
      <header className="shrink-0 w-full bg-[var(--md-sys-color-surface)]">
        {/* Linear Progress Bar placed above the top bar */}
        <md-linear-progress
          value={answeredCount}
          max={totalQuestions}
          style={{
            width: '100%',
            '--md-linear-progress-track-height': '4px',
            display: 'block',
          } as any}
        ></md-linear-progress>

        <div className="w-full px-4 sm:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <md-icon-button
              onClick={handleAttemptClose}
              aria-label="退出"
            >
              <md-icon>arrow_back</md-icon>
            </md-icon-button>
            <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-xl">
              <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                {scale.title}
              </h2>
              {currentCategory && (
                <motion.span
                  key={currentCategory}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[11px] sm:text-xs font-medium text-[var(--md-sys-color-primary)] truncate mt-0.5 leading-tight block"
                >
                  {currentCategory}
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Question Counter Pill (Interactive Sheet Trigger) */}
            <button
              type="button"
              onClick={() => {
                flushDraft();
                setIsQuestionSheetOpen(true);
              }}
              aria-label="查看题目列表并快速跳转"
              title="点击查看所有题目并快速跳转"
              className="px-3 py-1 rounded-full bg-transparent border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-primary-container)] text-xs sm:text-sm font-semibold shrink-0 cursor-pointer active:scale-95 transition-all hover:bg-[var(--md-sys-color-surface-container-low)] select-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)]"
            >
              <span>第 {currentIndex + 1} / {totalQuestions} 题</span>
            </button>

            {/* Vertical Three-Dot Menu */}
            <div className="relative flex items-center">
              <md-icon-button
                ref={menuAnchorRef}
                id="player-menu-anchor"
                onClick={handleToggleMenu}
                aria-label="更多选项"
                title="更多选项"
              >
                <md-icon>more_vert</md-icon>
              </md-icon-button>

              <md-menu
                ref={menuRef}
                id="player-menu"
                anchor="player-menu-anchor"
                open={isMenuOpen}
                anchor-corner="end-end"
                menu-corner="start-end"
                onClosed={() => setIsMenuOpen(false)}
                style={{
                  minWidth: '160px',
                  '--md-menu-container-shape': '12px',
                } as React.CSSProperties}
              >
                <md-menu-item onClick={handleOpenAboutTest}>
                  <md-icon slot="start">info</md-icon>
                  <div slot="headline">关于测评</div>
                </md-menu-item>
              </md-menu>
            </div>
          </div>
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
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--md-sys-color-on-surface)] leading-relaxed">
                    {currentQuestion.text}
                  </h3>
                </div>

                {/* Option / Input list */}
                {currentQuestion.type === 'single_choice' && (
                  <div className="flex flex-col gap-[2px]">
                    {currentQuestion.options.map((opt, optIndex) => {
                      const selectedVal =
                        currentAnswer !== null && typeof currentAnswer === 'object' && !Array.isArray(currentAnswer)
                          ? currentAnswer.value
                          : currentAnswer;
                      const isSelected = selectedVal === opt.value;
                      const cornerRadius = getOptionCornerRadius(optIndex, currentQuestion.options.length);
                      return (
                        <div
                          key={String(opt.value)}
                          className={`w-full transition-colors duration-150 relative overflow-hidden ${cornerRadius} ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                              : 'bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectOption(opt)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectOption(opt);
                              }
                            }}
                            className="w-full min-h-[56px] px-5 py-4 text-left flex items-center justify-between cursor-pointer select-none relative"
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
                          </div>

                          {isSelected && opt.hasTextInput && (
                            <div className="px-5 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <md-outlined-text-field
                                label={opt.textInputLabel || '请详细说明'}
                                placeholder={opt.textInputPlaceholder || '请输入补充内容...'}
                                value={typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) ? currentAnswer.text || '' : ''}
                                className="w-full bg-[var(--md-sys-color-surface)] rounded-xl"
                                error={!isCurrentValid}
                                error-text={currentValidation.error}
                                onInput={(e: any) => handleOptionTextInput(opt, e.target.value)}
                                onKeyDown={(e: any) => {
                                  if (e.key === 'Enter' && isCurrentAnswered) {
                                    handleNext();
                                  }
                                }}
                              >
                                <md-icon slot="leading-icon">edit</md-icon>
                              </md-outlined-text-field>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'multiple_choice' && (
                  <div className="flex flex-col gap-[2px]">
                    <div className="mb-2 px-1 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                      <md-icon style={{ fontSize: '16px', width: '16px', height: '16px' } as any}>check_box</md-icon>
                      <span>本题为多选题，可选择多项（完成后点击下方“下一题”）</span>
                    </div>
                    {currentQuestion.options.map((opt, optIndex) => {
                      const isSelected = isMultiOptionSelected(opt);
                      const cornerRadius = getOptionCornerRadius(optIndex, currentQuestion.options.length);
                      return (
                        <div
                          key={String(opt.value)}
                          className={`w-full transition-colors duration-150 relative overflow-hidden ${cornerRadius} ${
                            isSelected
                              ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                              : 'bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleToggleMultipleChoice(opt)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggleMultipleChoice(opt);
                              }
                            }}
                            className="w-full min-h-[56px] px-5 py-4 text-left flex items-center justify-between cursor-pointer select-none relative"
                          >
                            <md-ripple></md-ripple>
                            <span className={`text-base leading-snug pr-4 ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                              {opt.label}
                            </span>

                            <md-checkbox
                              checked={isSelected}
                              tabIndex={-1}
                              className="pointer-events-none shrink-0"
                            ></md-checkbox>
                          </div>

                          {isSelected && opt.hasTextInput && (
                            <div className="px-5 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              <md-outlined-text-field
                                label={opt.textInputLabel || '请详细说明'}
                                placeholder={opt.textInputPlaceholder || '请输入补充内容...'}
                                value={getMultiOptionText(opt)}
                                className="w-full bg-[var(--md-sys-color-surface)] rounded-xl"
                                error={!getMultiOptionText(opt).trim() && !isCurrentValid}
                                error-text={!getMultiOptionText(opt).trim() ? '请补充填写具体说明' : undefined}
                                onInput={(e: any) => handleMultiOptionTextInput(opt, e.target.value)}
                              >
                                <md-icon slot="leading-icon">edit</md-icon>
                              </md-outlined-text-field>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.type === 'slider' && (
                  <div className="space-y-6 pt-2">
                    {/* Score display card */}
                    <div className="flex flex-col items-center justify-center p-6 bg-[var(--md-sys-color-surface-container-low)] rounded-3xl">
                      <div className="flex items-baseline gap-1.5 my-1">
                        <span className="text-5xl font-extrabold text-[var(--md-sys-color-tertiary)] font-mono">
                          {typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.min ?? 0)}
                        </span>
                        <span className="text-base font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                          / {currentQuestion.max ?? 10} 分
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mt-1">
                        当前选择分值
                      </span>
                    </div>

                    {/* Seek bar control */}
                    <div className="px-2 py-2 bg-transparent flex flex-col gap-3">
                      <md-slider
                        min={currentQuestion.min ?? 0}
                        max={currentQuestion.max ?? 10}
                        step={currentQuestion.step ?? 1}
                        value={typeof currentAnswer === 'number' ? currentAnswer : (currentQuestion.min ?? 0)}
                        labeled
                        ticks
                        className="w-full"
                        style={{
                          width: '100%',
                          '--md-sys-color-primary': 'var(--md-sys-color-tertiary)',
                          '--md-sys-color-on-primary': 'var(--md-sys-color-on-tertiary)',
                          '--md-slider-active-track-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-handle-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-focus-handle-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-hover-handle-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-pressed-handle-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-hover-state-layer-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-pressed-state-layer-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-label-container-color': 'var(--md-sys-color-tertiary)',
                          '--md-slider-label-text-color': 'var(--md-sys-color-on-tertiary)',
                          '--md-slider-with-tick-marks-active-container-color': 'var(--md-sys-color-on-tertiary)',
                        } as React.CSSProperties}
                        onInput={(e: any) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            handleSliderChange(val);
                          }
                        }}
                        onChange={(e: any) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            handleSliderChange(val);
                          }
                        }}
                      ></md-slider>

                      {/* Boundary labels */}
                      <div className="flex justify-between items-center px-1 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                        <span className="max-w-[45%] truncate">{currentQuestion.minLabel || `${currentQuestion.min ?? 0} 分`}</span>
                        <span className="max-w-[45%] truncate text-right">{currentQuestion.maxLabel || `${currentQuestion.max ?? 10} 分`}</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'number' && (() => {
                  const zeroOptionLabel = currentQuestion.zeroOptionLabel || (currentQuestion.id === 'G17a' ? '从未喝过酒' : undefined);
                  const isZeroSelected = Boolean(zeroOptionLabel && (currentAnswer === 0 || currentAnswer === '0'));

                  return (
                    <div className="space-y-4 pt-2">
                      <md-outlined-text-field
                        type="number"
                        label={zeroOptionLabel ? '开始饮酒年龄' : '数值'}
                        value={isZeroSelected ? '' : (currentAnswer !== undefined && currentAnswer !== '' ? String(currentAnswer) : '')}
                        placeholder={isZeroSelected ? `已选择“${zeroOptionLabel}”` : (currentQuestion.placeholder || '请输入数值')}
                        min={zeroOptionLabel && currentQuestion.min === 0 ? 1 : currentQuestion.min}
                        max={currentQuestion.max}
                        step={currentQuestion.step ?? 1}
                        inputmode={currentQuestion.step && currentQuestion.step < 1 ? 'decimal' : 'numeric'}
                        className="w-full"
                        error={Boolean(!isZeroSelected && currentAnswer !== undefined && currentAnswer !== '' && !isCurrentValid)}
                        error-text={currentValidation.error}
                        supporting-text={
                          isZeroSelected
                            ? `已选择“${zeroOptionLabel}”，若需修改请在此直接输入开始饮酒年龄`
                            : currentQuestion.min !== undefined && currentQuestion.max !== undefined
                            ? `有效范围：${zeroOptionLabel && currentQuestion.min === 0 ? 1 : currentQuestion.min} ~ ${currentQuestion.max} ${currentQuestion.unit || ''}`
                            : currentQuestion.placeholder || '请输入数值'
                        }
                        onInput={(e: any) => handleNumberInput(e.target.value)}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter' && isCurrentAnswered) {
                            handleNext();
                          }
                        }}
                      >
                        <md-icon slot="leading-icon">{getFieldLeadingIcon(currentQuestion)}</md-icon>
                        {currentQuestion.unit && (
                          <span
                            slot="trailing-icon"
                            className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] pr-3 select-none"
                          >
                            {currentQuestion.unit}
                          </span>
                        )}
                      </md-outlined-text-field>

                      {zeroOptionLabel && (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center gap-3 py-1">
                            <div className="h-[1px] flex-1 bg-[var(--md-sys-color-outline-variant)]" />
                            <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] select-none">
                              或者
                            </span>
                            <div className="h-[1px] flex-1 bg-[var(--md-sys-color-outline-variant)]" />
                          </div>

                          <div
                            className={`w-full transition-all duration-200 relative overflow-hidden rounded-2xl ${
                              isZeroSelected
                                ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                                : 'bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                            }`}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              aria-pressed={isZeroSelected}
                              data-testid="zero-option-button"
                              onClick={handleZeroOptionClick}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleZeroOptionClick();
                                }
                              }}
                              className="w-full min-h-[56px] px-5 py-4 text-left flex items-center justify-between cursor-pointer select-none relative active:scale-[0.99] transition-transform"
                            >
                              <md-ripple></md-ripple>
                              <span className={`text-base leading-snug pr-4 ${isZeroSelected ? 'font-semibold' : 'font-medium'}`}>
                                {zeroOptionLabel}
                              </span>

                              <md-radio
                                checked={isZeroSelected}
                                name={`question_${currentQuestion.id}_zero`}
                                value="0"
                                tabIndex={-1}
                                className="pointer-events-none shrink-0"
                              ></md-radio>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Date Question (Option B: Month dropdown, Day input, Year input) */}
                {currentQuestion.type === 'date' && (
                  <DateQuestionField
                    question={currentQuestion}
                    value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                    error={currentAnswer ? currentValidation.error : undefined}
                    onChange={(isoDate) => {
                      recordAnswer(currentQuestion.id, isoDate);
                    }}
                    onEnterPress={() => {
                      if (isCurrentAnswered) {
                        handleNext();
                      }
                    }}
                  />
                )}

                {/* Text Question (Fallback for text and any other types) */}
                {currentQuestion.type !== 'single_choice' &&
                  currentQuestion.type !== 'multiple_choice' &&
                  currentQuestion.type !== 'slider' &&
                  currentQuestion.type !== 'number' &&
                  currentQuestion.type !== 'date' && (
                    <div className="space-y-4 pt-2">
                      <md-outlined-text-field
                        type="text"
                        label="填写回答"
                        value={currentAnswer || ''}
                        placeholder={currentQuestion.placeholder || '请输入...'}
                        className="w-full"
                        error={Boolean(currentAnswer !== undefined && currentAnswer !== '' && !isCurrentValid)}
                        error-text={currentValidation.error}
                        supporting-text="输入完成后点击下方“下一题”即可继续作答"
                        onInput={(e: any) => handleTextInput(e.target.value)}
                        onKeyDown={(e: any) => {
                          if (e.key === 'Enter' && isCurrentAnswered) {
                            handleNext();
                          }
                        }}
                      >
                        <md-icon slot="leading-icon">{getFieldLeadingIcon(currentQuestion)}</md-icon>
                      </md-outlined-text-field>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Pinned Bottom Action Footer - transparent action bar */}
      <footer
        className="shrink-0 w-full bg-transparent px-4 sm:px-8 py-3.5 flex justify-center z-10"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.875rem)',
        }}
      >
        <div className="w-full max-w-md flex items-center justify-between gap-3">
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
        </div>
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

      {/* Incomplete / Unanswered Questions Dialog */}
      <md-dialog
        ref={setIncompleteDialogRef}
        style={{
          maxWidth: 'min(420px, calc(100vw - 32px))',
          minWidth: '300px',
          '--md-dialog-container-shape': '28px',
        } as React.CSSProperties}
      >
        <div slot="headline" className="px-6 pt-6 pb-2 text-xl font-bold text-[var(--md-sys-color-on-surface)]">
          还有题目尚未作答
        </div>
        <div slot="content" className="px-6 py-2 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
          当前问卷共有 <span className="font-semibold text-[var(--md-sys-color-on-surface)] font-mono">{totalQuestions}</span> 道题目，您还有 <span className="font-semibold text-[var(--md-sys-color-error)] font-mono">{unansweredCount}</span> 道题目尚未作答。请完整回答所有题目后再提交。
        </div>
        <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-3">
          <OutlinedButton
            label="取消"
            className="h-10 min-h-[40px] px-5 text-sm"
            onClick={() => incompleteDialogRef.current?.close()}
          />
          <PrimaryButton
            label="前往作答"
            className="h-10 min-h-[40px] px-5 text-sm"
            onClick={() => {
              incompleteDialogRef.current?.close();
              if (firstUnansweredIndex >= 0) {
                setCurrentIndex(firstUnansweredIndex);
              }
            }}
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
