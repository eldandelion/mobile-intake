import { useEffect, useState } from 'react';
import { adminApi, AdminDashboardMetrics } from '../api/adminApi';
import { AdminCanvasHeader } from '../layout/AdminCanvasHeader';

interface DashboardPageProps {
  onNavigateToUsers: () => void;
}

export function DashboardPage({
  onNavigateToUsers,
}: DashboardPageProps) {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    adminApi
      .getMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message || '获取指标失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const [exportFeedback, setExportFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleQuickZipExport = async () => {
    setExporting(true);
    try {
      await adminApi.downloadExport('zip', 'intake-package.zip');
      setExportFeedback({ message: '已成功导出 intake-package.zip', type: 'success' });
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback({ message: err.message || '导出失败', type: 'error' });
      setTimeout(() => setExportFeedback(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      <AdminCanvasHeader
        title="系统总览"
        isLoading={loading}
      />

      {exportFeedback && (
        <div className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
          exportFeedback.type === 'error'
            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
        }`}>
          <span className="material-symbols-outlined text-base">
            {exportFeedback.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{exportFeedback.message}</span>
        </div>
      )}

      <div className="w-full h-full p-6 bg-[var(--md-sys-color-surface)] overflow-y-auto custom-scrollbar">
        {error ? (
          <div className="max-w-6xl mx-auto bg-[var(--md-sys-color-surface-container-low)] min-h-[188px] rounded-[16px] p-6 flex flex-col items-center justify-center gap-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-[var(--md-sys-color-error)] opacity-80">
              error_outline
            </span>
            <div className="flex flex-col items-center">
              <h3 className="m-0 mb-1 text-[16px] font-medium text-[var(--md-sys-color-on-surface)]">
                {error}
              </h3>
              <p className="m-0 text-[14px] text-[var(--md-sys-color-on-surface-variant)]">
                请检查服务状态并重新尝试
              </p>
            </div>
            <button
              onClick={fetchMetrics}
              className="mt-2 px-6 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              重试
            </button>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
            {/* 1. Action Metric Widget: Total Registered Students (col-span-4) */}
            <div className="md:col-span-4 flex flex-col h-full">
              <div
                onClick={onNavigateToUsers}
                className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] p-6 rounded-[24px] flex flex-col gap-4 cursor-pointer hover:opacity-90 transition-opacity h-full min-h-[188px]"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[32px] text-[var(--md-sys-color-on-surface)]">
                    group
                  </span>
                  <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface)] opacity-70">
                    arrow_forward
                  </span>
                </div>
                <div className="flex-1 flex flex-col mt-1">
                  <div className="text-[45px] leading-[52px] tracking-[0px] font-normal text-[var(--md-sys-color-on-surface)]">
                    {metrics?.totalStudents ?? 0}
                  </div>
                  <div className="text-[16px] leading-[24px] tracking-[0.15px] mt-auto font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    已注册学生
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Action Metric Widget: Overall Completion Rate (col-span-4) */}
            <div className="md:col-span-4 flex flex-col h-full">
              <div
                onClick={onNavigateToUsers}
                className="bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] p-6 rounded-[24px] flex flex-col gap-4 cursor-pointer hover:opacity-90 transition-opacity h-full min-h-[188px]"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[32px] text-[var(--md-sys-color-on-surface)]">
                    task_alt
                  </span>
                  <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface)] opacity-70">
                    arrow_forward
                  </span>
                </div>
                <div className="flex-1 flex flex-col mt-1">
                  <div className="text-[45px] leading-[52px] tracking-[0px] font-normal text-[var(--md-sys-color-on-surface)]">
                    {metrics?.overallCompletionRate ?? 0}%
                  </div>
                  <div className="text-[16px] leading-[24px] tracking-[0.15px] mt-auto font-medium text-[var(--md-sys-color-on-surface-variant)]">
                    全部完成率 (已完成 {metrics?.fullyCompletedStudents ?? 0} 人)
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Action Metric Widget: Quick ZIP Export (col-span-4) */}
            <div className="md:col-span-4 flex flex-col h-full">
              <div
                onClick={handleQuickZipExport}
                className="bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] p-6 rounded-[24px] flex flex-col gap-4 cursor-pointer hover:opacity-90 transition-opacity h-full min-h-[188px]"
              >
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[32px] text-[var(--md-sys-color-on-primary-container)]">
                    {exporting ? 'progress_activity' : 'archive'}
                  </span>
                  <span className="material-symbols-outlined text-[var(--md-sys-color-on-primary-container)] opacity-70">
                    download
                  </span>
                </div>
                <div className="flex-1 flex flex-col mt-1">
                  <div className="text-[28px] leading-[36px] font-bold tracking-tight text-[var(--md-sys-color-on-primary-container)]">
                    {exporting ? '正在打包...' : '一键导出普查 ZIP'}
                  </div>
                  <div className="text-[14px] leading-[20px] mt-auto font-medium text-[var(--md-sys-color-on-primary-container)] opacity-85">
                    含学生档案与原始作答 CSV (UTF-8 BOM)
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Scale Completion Status List matching medical-system InteractiveStatusList */}
            <div className="md:col-span-12 flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] leading-[24px] font-medium text-[var(--md-sys-color-on-surface)] tracking-[0.15px]">
                  各量表填报动态
                </h3>
                <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">
                  共监测 {metrics?.scaleStats?.length ?? 0} 项测评
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {metrics?.scaleStats?.map((scale, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (metrics?.scaleStats?.length ?? 0) - 1;
                  const radiusClass =
                    metrics?.scaleStats?.length === 1
                      ? 'rounded-[16px]'
                      : isFirst
                      ? 'rounded-t-[16px] rounded-b-[4px]'
                      : isLast
                      ? 'rounded-t-[4px] rounded-b-[16px]'
                      : 'rounded-[4px]';

                  return (
                    <div
                      key={scale.scaleCode}
                      onClick={onNavigateToUsers}
                      className={`bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] overflow-hidden flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--md-sys-color-surface-container)] transition-colors group ${radiusClass}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] leading-[24px] tracking-[0.5px] font-normal text-[var(--md-sys-color-on-surface)]">
                            {scale.title}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] opacity-60">
                            {scale.scaleCode}
                          </span>
                        </div>
                        <span className="text-[14px] leading-[20px] tracking-[0.25px] font-normal text-[var(--md-sys-color-on-surface-variant)]">
                          已完成: {scale.completedCount} 人 · 进行中: {scale.inProgressCount} 人
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full text-[14px] leading-[20px] tracking-[0.1px] font-medium bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]">
                          完成率 {scale.completionRate}%
                        </span>
                        <span className="material-symbols-outlined text-[var(--md-sys-color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
