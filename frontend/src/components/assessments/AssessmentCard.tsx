import React from 'react';
import { PrimaryButton, OutlinedButton } from '../common/Buttons';
import { ScaleSummaryDto } from '../../api/intakeApi';
import { calculateScaleProgress } from '../../utils/progressUtils';

interface AssessmentCardProps {
  scale: ScaleSummaryDto;
  onStart: (code: string) => void;
  onView?: (code: string) => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  scale,
  onStart,
  onView,
}) => {
  const isCompleted = scale.status === 'COMPLETED';
  const isInProgress = scale.status === 'IN_PROGRESS';
  const isDemographic = scale.code === 'demographics_survey';

  const { percentage, clampedAnswered, total } = calculateScaleProgress(
    scale.answeredCount,
    scale.questionCount
  );
  const showProgress = isInProgress && clampedAnswered > 0;

  return (
    <div
      className={`rounded-2xl bg-[var(--md-sys-color-surface-container-low)] transition-all duration-200 p-5 flex flex-col gap-3.5 ${
        isCompleted
          ? 'opacity-80'
          : 'hover:bg-[var(--md-sys-color-surface-container)]'
      }`}
    >
      {/* Header chips */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isDemographic
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                : 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
            }`}
          >
            {isDemographic ? '必填档案' : '心理测评'}
          </span>
        </div>

        <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          约 {scale.estimatedMinutes} 分钟 • {scale.questionCount} 题
        </span>
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] leading-snug">
          {scale.title}
        </h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mt-1 leading-relaxed">
          {scale.description}
        </p>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div
          className="w-full flex flex-col gap-1.5 mt-1"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${scale.title}作答进度`}
        >
          <div className="w-full h-[6px] bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-500"
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-[var(--md-sys-color-primary)]">
              {percentage}%
            </span>
            <span className="text-[var(--md-sys-color-on-surface-variant)]">
              {clampedAnswered} / {total} 题
            </span>
          </div>
        </div>
      )}

      {/* Action Area */}
      <div className="w-full flex justify-end pt-1">
        {isCompleted ? (
          <OutlinedButton
            label="查看已提交"
            className="h-10 px-4 text-xs font-medium"
            onClick={() => onView?.(scale.code)}
          />
        ) : (
          <PrimaryButton
            label={
              isInProgress
                ? isDemographic
                  ? '继续填报'
                  : '继续测评'
                : isDemographic
                  ? '开始填报'
                  : '开始测评'
            }
            className="h-10 px-5 text-sm font-medium"
            onClick={() => onStart(scale.code)}
          />
        )}
      </div>
    </div>
  );
};
