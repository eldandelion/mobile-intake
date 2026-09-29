import { useEffect, useState, useMemo } from 'react';
import {
  adminApi,
  AdminStudentSummaryDto,
  AdminStudentDetailDto,
} from '../api/adminApi';
import { AdminCanvasHeader } from '../layout/AdminCanvasHeader';
import { DataTable, ColumnDefinition } from '../components/DataTable';
import { FilterChipSet } from '../components/FilterChip';
import { ExpandableSearchBar } from '../components/ExpandableSearchBar';
import { SplitButton } from '../components/SplitButton';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { DeleteStudentDialog } from '../components/DeleteStudentDialog';

interface StudentManagementPageProps {
  searchQuery?: string;
  onSelectStudent?: (student: AdminStudentDetailDto | null) => void;
  selectedStudent: AdminStudentDetailDto | null;
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: (open: boolean) => void;
  setIsSidePanelLoading?: (loading: boolean) => void;
  onResetPassword?: (studentNumber: string, studentName?: string) => void;
  onDeleteStudent?: (studentNumber: string, name: string) => void;
  refreshKey?: number;
}

export function StudentManagementPage({
  searchQuery = '',
  selectedStudent,
  onSelectStudent,
  isSidePanelOpen,
  setIsSidePanelOpen,
  setIsSidePanelLoading,
  onResetPassword,
  onDeleteStudent,
  refreshKey,
}: StudentManagementPageProps) {
  const [students, setStudents] = useState<AdminStudentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('全部');

  // Search keyword state for ExpandableSearchBar
  const [searchKeyword, setSearchKeyword] = useState('');

  // Exporting state
  const [exporting, setExporting] = useState(false);

  // Local dialog states (used when callbacks are not provided, e.g. standalone test runs)
  const [localResetTarget, setLocalResetTarget] = useState<{ number: string; name?: string } | null>(null);
  const [localDeleteTarget, setLocalDeleteTarget] = useState<{ number: string; name: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStudents = (query?: string) => {
    setLoading(true);
    adminApi
      .getStudents(query)
      .then(setStudents)
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents(searchQuery);
  }, [searchQuery, refreshKey]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (filterStatus === '已全部完成') {
      result = result.filter((s) => s.allCompleted);
    } else if (filterStatus === '未全部完成') {
      result = result.filter((s) => !s.allCompleted);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentNumber.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }

    return result;
  }, [students, filterStatus, searchKeyword]);

  const handleRowClick = async (studentSummary: AdminStudentSummaryDto) => {
    setIsSidePanelOpen(true);
    setIsSidePanelLoading?.(true);
    try {
      const detail = await adminApi.getStudentDetail(studentSummary.studentNumber);
      onSelectStudent?.(detail);
    } catch (err) {
      console.error('Failed to get student detail:', err);
    } finally {
      setIsSidePanelLoading?.(false);
    }
  };

  const handleConfirmResetPassword = async (studentNumber: string, newPassword?: string) => {
    try {
      const res = await adminApi.resetPassword(studentNumber, newPassword);
      setFeedbackMessage(res.message);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || '重置密码失败');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleConfirmDeleteStudent = async (studentNumber: string) => {
    try {
      const res = await adminApi.deleteStudent(studentNumber);
      setFeedbackMessage(res.message);
      setTimeout(() => setFeedbackMessage(null), 4000);
      if (selectedStudent?.studentNumber === studentNumber) {
        setIsSidePanelOpen(false);
        onSelectStudent?.(null);
      }
      fetchStudents(searchQuery);
    } catch (err: any) {
      setErrorMessage(err.message || '删除学生失败');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleExport = async (type: 'zip' | 'students' | 'assessments', filename: string) => {
    setExporting(true);
    try {
      await adminApi.downloadExport(type, filename);
      setFeedbackMessage(`已成功导出 ${filename}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || '导出失败');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  // Columns definition matching medical-system StudentsView
  const columns: ColumnDefinition<AdminStudentSummaryDto>[] = [
    {
      key: 'fullName',
      label: '学生姓名',
      width: 'w-[28%]',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center text-xs font-medium shrink-0">
            {item.fullName.charAt(0) || '学'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-medium text-[var(--md-sys-color-on-surface)] truncate">
              {item.fullName}
            </span>
            <span className="text-[12px] opacity-70 font-mono">
              学号: {item.studentNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: '联系电话',
      width: 'w-[18%]',
      render: (item) => (
        <span className="text-[14px] font-mono opacity-80">{item.phone}</span>
      ),
    },
    {
      key: 'registeredAt',
      label: '报到注册时间',
      width: 'w-[20%]',
      render: (item) => (
        <span className="text-[13px] opacity-70">{item.registeredAt}</span>
      ),
    },
    {
      key: 'allCompleted',
      label: '测评填报状态',
      width: 'w-[20%]',
      render: (item) => {
        const completedCount = item.scaleStatuses?.filter((s) => s.status === 'COMPLETED').length || 0;
        const totalCount = item.scaleStatuses?.length || 2;
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--md-sys-color-outline-variant)] bg-transparent text-[var(--md-sys-color-on-surface)]">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  item.allCompleted
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : 'bg-amber-500 dark:bg-amber-400'
                }`}
              />
              <span>{item.allCompleted ? '已全完成' : `填报中 (${completedCount}/${totalCount})`}</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'studentNumber',
      label: '',
      width: 'w-[14%]',
      render: (item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              if (onResetPassword) {
                onResetPassword(item.studentNumber, item.fullName);
              } else {
                setLocalResetTarget({ number: item.studentNumber, name: item.fullName });
              }
            }}
            title="重置密码"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onDeleteStudent) {
                onDeleteStudent(item.studentNumber, item.fullName);
              } else {
                setLocalDeleteTarget({
                  number: item.studentNumber,
                  name: item.fullName,
                });
              }
            }}
            title="删除测试账号"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      <AdminCanvasHeader
        title="全校学生档案"
        isLoading={loading}
      />

      {feedbackMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="shrink-0 z-20 bg-[var(--md-sys-color-surface)] pb-2 pt-4 px-6 flex items-center justify-between gap-4 mb-6">
        {/* Left: Filter Chips + ExpandableSearchBar matching medical-system */}
        <FilterChipSet
          className="flex flex-wrap items-center gap-2 relative z-20"
          chips={[
            {
              label: '状态',
              options: ['全部', '已全部完成', '未全部完成'],
            },
          ]}
          initialFilters={{ 状态: filterStatus }}
          onFilterChange={(filters) => {
            setFilterStatus(filters['状态'] || '全部');
          }}
        >
          <ExpandableSearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="搜索学生姓名、学号、手机号..."
          />
        </FilterChipSet>

        {/* Right: Material Design 3 SplitButton */}
        <div className="flex items-center gap-3">

          <SplitButton
            label="导出数据"
            icon="download"
            disabled={exporting}
            onClick={() => handleExport('zip', 'intake-package.zip')}
            options={[
              {
                label: '完整普查数据包 (.zip)',
                icon: 'folder_zip',
                onClick: () => handleExport('zip', 'intake-package.zip'),
              },
              {
                label: '学生档案 (students.csv)',
                icon: 'badge',
                onClick: () => handleExport('students', 'students.csv'),
              },
              {
                label: '原始作答记录 (assessments.csv)',
                icon: 'fact_check',
                onClick: () => handleExport('assessments', 'assessments.csv'),
              },
            ]}
          />
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {loading && students.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-[var(--md-sys-color-on-surface-variant)]">
            <md-circular-progress indeterminate></md-circular-progress>
            <span className="text-xs">加载学生档案中...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] gap-2">
            <span className="material-symbols-outlined text-4xl opacity-40">person_off</span>
            <span className="text-xs">没有找到符合条件的学生</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredStudents.map((s) => ({ ...s, id: s.studentNumber }))}
            onRowClick={handleRowClick}
            selectedId={isSidePanelOpen ? selectedStudent?.studentNumber : undefined}
          />
        )}
      </div>

      {/* Local Reset Password Dialog (Two-step Material Design confirmation) */}
      {localResetTarget && (
        <ResetPasswordDialog
          isOpen={!!localResetTarget}
          studentNumber={localResetTarget.number}
          studentName={localResetTarget.name}
          onClose={() => setLocalResetTarget(null)}
          onConfirm={handleConfirmResetPassword}
        />
      )}

      {/* Local Delete Student Dialog (Material Design confirmation) */}
      {localDeleteTarget && (
        <DeleteStudentDialog
          isOpen={!!localDeleteTarget}
          studentNumber={localDeleteTarget.number}
          studentName={localDeleteTarget.name}
          onClose={() => setLocalDeleteTarget(null)}
          onConfirm={handleConfirmDeleteStudent}
        />
      )}
    </div>
  );
}
