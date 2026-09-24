import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminStudentDetailDto } from '../api/adminApi';
import { FullScreenView } from './FullScreenView';

interface DetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  student: AdminStudentDetailDto | null;
  loading?: boolean;
  onResetPassword?: (studentNumber: string) => void;
  onDeleteStudent?: (studentNumber: string, name: string) => void;
  width?: number | string;
}

/**
 * Helper component for sections inside the DetailsPanel matching medical-system
 */
export function DetailsSection({
  title,
  children,
  icon,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-4 border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 pt-0 mt-6 first:border-0 first:pt-0 first:mt-0 ${className}`}
    >
      {title && (
        <div className="flex items-center gap-3">
          {icon && (
            <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface)]">{icon}</span>
          )}
          <h3 className="text-[18px] font-medium text-[var(--md-sys-color-on-surface)]">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Demographic MetricCard matching medical-system DetailsPanel item
 */
export function DetailMetricCard({
  label,
  value,
  icon,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  className?: string;
}) {
  return (
    <div
      className={`p-3.5 rounded-[16px] bg-[var(--md-sys-color-surface-container-low)] flex items-center gap-3 min-w-0 overflow-hidden ${className}`}
    >
      <span className="material-symbols-outlined text-[24px] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
        {icon}
      </span>
      <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
        <span className="text-xs leading-4 font-medium tracking-wide truncate text-[var(--md-sys-color-on-surface-variant)]">
          {label}
        </span>
        <div className="text-sm leading-5 font-semibold text-[var(--md-sys-color-on-surface)] tabular-nums truncate">
          {value || '未填报'}
        </div>
      </div>
    </div>
  );
}

export function DetailsPanel({
  isOpen,
  onClose,
  student,
  loading = false,
  onResetPassword,
  onDeleteStudent,
  width = 380,
}: DetailsPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen && !isExpanded) return null;

  const demographics = student?.demographics || {};
  const major = demographics.major || demographics.college || demographics.department || '未登记专业';
  const gender = demographics.gender || '未知';
  const idCard = demographics.idCardNumber || demographics.idCard || '未登记';
  const ethnicity = demographics.ethnicity || '汉族';
  const emergencyName = demographics.emergencyContactName || demographics.emergencyContact || '未登记';
  const emergencyPhone = demographics.emergencyContactPhone || '未登记';
  const counselor = demographics.counselorName || demographics.counselorId || '未分配';

  const completedCount = student?.scaleStatuses?.filter((s) => s.status === 'COMPLETED').length || 0;
  const totalScales = student?.scaleStatuses?.length || 0;

  const panelContent = (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header Info Banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
        <div className="w-14 h-14 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-xl shrink-0">
          {student?.fullName?.[0] || '学'}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] truncate">
              {student?.fullName || '学生姓名'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] shrink-0">
              {completedCount === totalScales && totalScales > 0 ? '全部完成' : '测评进行中'}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5 truncate">
            学号: {student?.studentNumber} · 电话: {student?.phone}
          </p>
        </div>
      </div>

      {/* Demographics Section */}
      <DetailsSection title="学生基本档案 (ACL)" icon="badge">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <DetailMetricCard label="就读专业" value={major} icon="school" />
          <DetailMetricCard label="生理性别" value={gender} icon="wc" />
          <DetailMetricCard label="民族特征" value={ethnicity} icon="public" />
          <DetailMetricCard label="身份证件号" value={idCard} icon="credit_card" />
          <DetailMetricCard label="辅导员 / 班主任" value={counselor} icon="supervisor_account" />
          <DetailMetricCard
            label="紧急联系人"
            value={`${emergencyName} (${emergencyPhone})`}
            icon="contact_emergency"
          />
        </div>
      </DetailsSection>

      {/* Psychological Scale Response Progress */}
      <DetailsSection title="问卷测评填报动态" icon="fact_check">
        <div className="flex flex-col gap-2">
          {student?.scaleStatuses?.map((scale) => {
            const isCompleted = scale.status === 'COMPLETED';
            const isInProgress = scale.status === 'IN_PROGRESS';

            return (
              <div
                key={scale.scaleCode}
                className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-between gap-3"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                    {scale.title}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    {scale.scaleCode}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {isCompleted ? 'check_circle' : isInProgress ? 'pending' : 'radio_button_unchecked'}
                    </span>
                    <span>{isCompleted ? '已完成提交' : isInProgress ? '正在作答' : '未开始'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </DetailsSection>

      {/* Account Governance Actions */}
      <DetailsSection title="账号运维操作" icon="manage_accounts">
        <div className="flex items-center gap-3">
          <button
            onClick={() => student && onResetPassword?.(student.studentNumber)}
            className="flex-1 h-10 px-4 rounded-full border border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--md-sys-color-primary)]/10 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            <span>应急重置密码</span>
          </button>

          <button
            onClick={() => student && onDeleteStudent?.(student.studentNumber, student.fullName)}
            className="h-10 px-4 rounded-full border border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--md-sys-color-error-container)]/30 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>清除测试账号</span>
          </button>
        </div>
      </DetailsSection>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '20%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '20%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full bg-[var(--md-sys-color-surface)] rounded-3xl overflow-hidden flex flex-col shrink-0 border-none ring-0 relative select-none"
            style={{ width: typeof width === 'number' ? `${width}px` : width }}
          >
            {/* Panel Header matching medical-system */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--md-sys-color-outline-variant)]/30">
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className="material-symbols-outlined shrink-0 text-[var(--md-sys-color-primary)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person
                </span>
                <span className="text-[16px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
                  {student?.fullName || '学生档案详情'}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setIsExpanded(true)}
                  title="全屏查看"
                  className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-colors flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">open_in_full</span>
                </button>
                <button
                  onClick={onClose}
                  title="关闭"
                  className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-colors flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-[var(--md-sys-color-on-surface-variant)]">
                <md-circular-progress indeterminate></md-circular-progress>
                <span className="text-xs">加载学生详细档案中...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">{panelContent}</div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Fullscreen View overlay on expand */}
      <FullScreenView
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={student?.fullName || '学生详情'}
        subtitle={`学号: ${student?.studentNumber} · 电话: ${student?.phone}`}
        avatar={
          <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-[14px] font-medium">
            {student?.fullName?.[0] || '学'}
          </div>
        }
      >
        {panelContent}
      </FullScreenView>
    </>
  );
}
