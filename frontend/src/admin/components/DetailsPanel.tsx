import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AdminStudentDetailDto } from '../api/adminApi';
import { FullScreenView } from './FullScreenView';
import { OutlinedButton } from '../../components/common/Buttons';
import { DestructiveButton } from '../../components/common/DestructiveButton';

interface DetailsContextType {
  isFullScreen: boolean;
  titleOverride?: string | null;
  setTitleOverride?: (title: string | null) => void;
}

export const DetailsContext = React.createContext<DetailsContextType>({
  isFullScreen: false,
});

export const useDetails = () => React.useContext(DetailsContext);

interface DetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  student: AdminStudentDetailDto | null;
  loading?: boolean;
  onResetPassword?: (studentNumber: string, studentName?: string) => void;
  onDeleteStudent?: (studentNumber: string, name: string) => void;
  width?: number | string;
}

/**
 * Hook to manage scroll collapsing state for detail view headers matching medical-system.
 */
export function useScrollCollapse(threshold = 20) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > threshold);
  }, [threshold]);

  return { isScrolled, handleScroll, setIsScrolled };
}

interface CollapsibleHeaderProps {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
}

/**
 * Reusable motion wrapper to animate header collapse on scroll matching medical-system.
 */
export function CollapsibleHeader({
  visible,
  children,
  className = '',
  onWheel,
}: CollapsibleHeaderProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`overflow-hidden origin-top shrink-0 ${className}`}
          onWheel={onWheel}
          data-testid="collapsible-header"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ScrollableDetailsLayoutProps {
  header?: React.ReactNode;
  tabs?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Reusable details view layout that handles standard scroll-to-collapse header interactions,
 * sticky tab items with scroll-based shadows, fixed action footers, and minimum tab content heights.
 * Header and content are unified in a single continuous scroll stream matching medical-system,
 * so the header scrolls out of view first before content reaches the top, with zero visual overlap.
 * Automatically synchronizes the scroll title with the outer details shell.
 */
export function ScrollableDetailsLayout({
  header,
  tabs,
  footer,
  children,
  className = '',
  title,
}: ScrollableDetailsLayoutProps) {
  const { isScrolled, handleScroll } = useScrollCollapse(20);
  const { setTitleOverride } = React.useContext(DetailsContext);

  React.useEffect(() => {
    if (setTitleOverride) {
      if (isScrolled && title) {
        setTitleOverride(title);
      } else {
        setTitleOverride(null);
      }
    }
  }, [isScrolled, title, setTitleOverride]);

  return (
    <div className={`flex flex-col h-full bg-[var(--md-sys-color-surface)] relative overflow-hidden ${className}`}>
      <div
        className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden relative"
        onScroll={handleScroll}
        data-testid="details-scroll-container"
      >
        {/* Header Section: Leads the scroll stream so it moves out of view first before content passes the top */}
        {header && (
          <div className="p-6 pb-6 flex flex-col gap-5 shrink-0" data-testid="details-header-section">
            {header}
          </div>
        )}

        {/* Sticky Tabs / Bar if present */}
        {tabs && (
          <div
            className={`sticky top-0 z-20 bg-[var(--md-sys-color-surface)] transition-shadow duration-200 ${
              isScrolled ? 'shadow-sm' : ''
            }`}
          >
            {tabs}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 px-6 pb-8 min-h-[75vh]">
          {children}
        </div>
      </div>

      {/* Fixed Action Footer */}
      {footer}
    </div>
  );
}

/**
 * Fixed Action Footer matching medical-system
 * Pinned at the bottom of the details view, and portals to fullscreen header in full-screen mode.
 */
export function ActionFooter({
  children,
  isFullScreen = false,
}: {
  children: React.ReactNode;
  isFullScreen?: boolean;
}) {
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isFullScreen) {
      setPortalTarget(document.getElementById('fullscreen-header-actions'));
    }
  }, [isFullScreen]);

  if (isFullScreen && portalTarget) {
    return createPortal(
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
        {children}
      </div>,
      portalTarget
    );
  }

  if (isFullScreen) return null;

  return (
    <div className="action-footer-anchor p-4 bg-[var(--md-sys-color-surface-container-high)] shrink-0 overflow-hidden">
      <div className="flex flex-row items-center justify-start gap-2 w-fit">
        {children}
      </div>
    </div>
  );
}

/**
 * Helper component for sections inside the DetailsPanel matching medical-system
 * Borderless design without horizontal separation lines.
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
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="material-symbols-outlined text-[20px] text-[var(--md-sys-color-on-surface)]">
              {icon}
            </span>
          )}
          <h3 className="text-[16px] font-medium text-[var(--md-sys-color-on-surface)] tracking-tight">
            {title}
          </h3>
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

const getItemCornerRadius = (index: number, total: number): string => {
  if (total <= 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
};

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
  const [titleOverride, setTitleOverride] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
      setTitleOverride(null);
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

  const studentHeader = (
    <div className="flex items-center justify-between gap-4 flex-nowrap overflow-hidden">
      <div className="flex items-center gap-4 min-w-0">
        {/* Primary Anchor: First Letter Avatar */}
        <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-3xl font-medium shrink-0 animate-in fade-in zoom-in duration-300">
          {student?.fullName ? student.fullName.charAt(0) : '学'}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-[24px] font-medium leading-[32px] text-[var(--md-sys-color-on-surface)] tracking-tight truncate">
            {student?.fullName || '学生姓名'}
          </h1>
          <div className="flex items-center gap-x-2 gap-y-1 text-[14px] text-[var(--md-sys-color-on-surface-variant)] flex-wrap">
            <span className="font-mono text-[13px] tracking-tight text-[var(--md-sys-color-primary)] font-bold">
              {student?.studentNumber || '未登记'}
            </span>
            <span className="opacity-40 shrink-0">•</span>
            <div
              className="px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold text-[11px] shrink-0 whitespace-nowrap border border-[var(--md-sys-color-outline-variant)] bg-transparent text-[var(--md-sys-color-on-surface)]"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  completedCount === totalScales && totalScales > 0
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : student?.scaleStatuses?.some((s) => s.status === 'IN_PROGRESS')
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-zinc-400 dark:bg-zinc-500'
                }`}
              />
              <span>
                {completedCount === totalScales && totalScales > 0
                  ? '全部完成'
                  : student?.scaleStatuses?.some((s) => s.status === 'IN_PROGRESS')
                  ? '测评进行中'
                  : '未开始'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const mainBodyContent = (
    <div className="flex flex-col gap-6 pt-1">
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
        <div className="flex flex-col gap-[2px]">
          {student?.scaleStatuses?.map((scale, index) => {
            const isCompleted = scale.status === 'COMPLETED';
            const isInProgress = scale.status === 'IN_PROGRESS';
            const total = student.scaleStatuses.length;
            const cornerRadius = getItemCornerRadius(index, total);

            return (
              <div
                key={scale.scaleCode}
                className={`px-4 py-3.5 bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-between gap-3 min-h-[52px] ${cornerRadius}`}
              >
                <span className="text-[14px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
                  {scale.title}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)] bg-transparent text-[var(--md-sys-color-on-surface)]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-500 dark:bg-emerald-400" />
                      <span>已完成提交</span>
                    </span>
                  ) : isInProgress ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)] bg-transparent text-[var(--md-sys-color-on-surface)]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500 dark:bg-amber-400" />
                      <span>正在作答</span>
                    </span>
                  ) : (
                    <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] opacity-70 font-normal pr-1">
                      未开始
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DetailsSection>
    </div>
  );

  const renderActionButtons = () => (
    <>
      <OutlinedButton
        icon="lock_reset"
        label="重置密码"
        className="h-10 min-h-0 px-4 text-xs font-semibold"
        onClick={() => student && onResetPassword?.(student.studentNumber, student.fullName)}
      />
      <DestructiveButton
        icon="delete"
        label="删除账号"
        className="h-10 min-h-0 px-4 text-xs font-semibold"
        onClick={() => student && onDeleteStudent?.(student.studentNumber, student.fullName)}
      />
    </>
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
            {/* Panel Header matching medical-system: pinned at top with titleOverride */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <span
                  className="material-symbols-outlined shrink-0 text-[var(--md-sys-color-primary)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person
                </span>
                <span className="text-[16px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
                  {titleOverride || '学生档案详情'}
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
              <div className="flex-1 custom-scrollbar flex flex-col scroll-smooth overflow-hidden">
                <DetailsContext.Provider value={{ isFullScreen: false, titleOverride, setTitleOverride }}>
                  <ScrollableDetailsLayout
                    title={student?.fullName}
                    header={studentHeader}
                    footer={
                      <ActionFooter isFullScreen={false}>
                        {renderActionButtons()}
                      </ActionFooter>
                    }
                  >
                    {mainBodyContent}
                  </ScrollableDetailsLayout>
                </DetailsContext.Provider>
              </div>
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
        <DetailsContext.Provider value={{ isFullScreen: true, titleOverride, setTitleOverride }}>
          <ScrollableDetailsLayout
            title={student?.fullName}
            header={undefined}
            footer={
              <ActionFooter isFullScreen={true}>
                {renderActionButtons()}
              </ActionFooter>
            }
          >
            {mainBodyContent}
          </ScrollableDetailsLayout>
        </DetailsContext.Provider>
      </FullScreenView>
    </>
  );
}
