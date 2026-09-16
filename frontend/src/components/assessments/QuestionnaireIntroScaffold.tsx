import React from 'react';
import type { ScaleDetail, ScaleIntroItem } from '../../api/intakeApi';
import { PrimaryButton } from '../common/Buttons';

export interface QuestionnaireIntroScaffoldProps {
  scale: ScaleDetail;
  totalQuestions: number;
  hasExistingDraft?: boolean;
  answeredCount?: number;
  onStart: () => void;
  onClose: () => void;
}

export const QuestionnaireIntroScaffold: React.FC<QuestionnaireIntroScaffoldProps> = ({
  scale,
  totalQuestions,
  hasExistingDraft = false,
  answeredCount = 0,
  onStart,
  onClose,
}) => {
  // Derive notice items from backend scale data, with standard fallback if not supplied
  const introItems: ScaleIntroItem[] =
    scale.introItems && scale.introItems.length > 0
      ? scale.introItems
      : [
          {
            icon: 'assignment',
            title: '评估内容',
            description: `本评估共包含 ${totalQuestions} 道题目，预计用时约 ${scale.estimatedMinutes || 3} 分钟。${scale.description || ''}`,
          },
          {
            icon: 'volunteer_activism',
            title: '客观作答',
            description:
              '所有问题的答案没有对错之分，您的第一反应往往最准确，请按照您的实际感受放心填写。',
          },
          {
            icon: 'lock',
            title: '隐私保密',
            description:
              '您的个人信息及答题数据将被严格加密保密，仅用于高校新生心理健康筛查与支持，请您安心作答。',
          },
        ];

  const actionLabel =
    hasExistingDraft && answeredCount > 0
      ? `继续作答 (已完成 ${answeredCount}/${totalQuestions} 题)`
      : '开始作答';

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden overscroll-contain bg-[var(--md-sys-color-surface)]">
      {/* Top Header Bar */}
      <header className="shrink-0 w-full bg-[var(--md-sys-color-surface-container-low)]">
        <div className="w-full px-4 sm:px-8 py-2.5 flex items-center">
          <div className="flex items-center gap-2 min-w-0">
            <md-icon-button onClick={onClose} aria-label="返回测评列表">
              <md-icon>arrow_back</md-icon>
            </md-icon-button>
            <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)] truncate">
              问卷前指导
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain flex justify-center">
        <div className="w-full max-w-md p-5 sm:p-6 flex flex-col justify-start space-y-6">
          {/* Title and Subtitle */}
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight tracking-tight">
              {scale.title}
            </h1>
            {scale.subtitle && (
              <p className="text-sm font-medium text-[var(--md-sys-color-primary)] mt-1.5 leading-snug">
                {scale.subtitle}
              </p>
            )}

            {/* Quick Metrics Text Line */}
            <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <md-icon style={{ '--md-icon-size': '14px', fontSize: '14px', width: '14px', height: '14px' } as React.CSSProperties}>schedule</md-icon>
                <span>约 {scale.estimatedMinutes || 3} 分钟</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <md-icon style={{ '--md-icon-size': '14px', fontSize: '14px', width: '14px', height: '14px' } as React.CSSProperties}>quiz</md-icon>
                <span>共 {totalQuestions} 道题目</span>
              </span>
            </div>
          </div>

          {/* Structured Notice Cards (Outlines removed, circle backgrounds removed, smaller icons) */}
          <div className="space-y-3">
            {introItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--md-sys-color-surface-container-low)] p-4 sm:p-5 rounded-[22px] flex items-start gap-3.5"
              >
                <div className="text-[var(--md-sys-color-primary)] shrink-0 mt-0.5">
                  <md-icon style={{ '--md-icon-size': '18px', fontSize: '18px', width: '18px', height: '18px' } as React.CSSProperties}>
                    {item.icon || 'assignment'}
                  </md-icon>
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--md-sys-color-on-surface)] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Pinned Bottom Action Container (Top border/outline removed) */}
      <footer
        className="shrink-0 w-full bg-[var(--md-sys-color-surface)] p-4 sm:p-5 flex justify-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="w-full max-w-md">
          <PrimaryButton
            label={actionLabel}
            className="w-full h-12 text-base font-medium shadow-sm"
            onClick={onStart}
          />
        </div>
      </footer>
    </div>
  );
};
