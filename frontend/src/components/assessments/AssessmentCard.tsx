import React from 'react';
import { PrimaryButton, OutlinedButton } from '../common/Buttons';
import { ScaleSummaryDto } from '../../api/intakeApi';

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
  const isDemographic = scale.code === 'demographics_survey';

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
            label={isDemographic ? '开始填报' : '开始测评'}
            className="h-10 px-5 text-sm font-medium"
            onClick={() => onStart(scale.code)}
          />
        )}
      </div>
    </div>
  );
};
