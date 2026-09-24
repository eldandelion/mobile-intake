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
}

export function StudentManagementPage({
  searchQuery = '',
  selectedStudent,
  onSelectStudent,
  isSidePanelOpen,
  setIsSidePanelOpen,
  setIsSidePanelLoading,
}: StudentManagementPageProps) {
  const [students, setStudents] = useState<AdminStudentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('全部');

  // Search keyword state for ExpandableSearchBar
  const [searchKeyword, setSearchKeyword] = useState('');

  // Exporting state
  const [exporting, setExporting] = useState(false);

  // Dialog states
  const [resetTargetNumber, setResetTargetNumber] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ number: string; name: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
  }, [searchQuery]);

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
      alert(err.message || '重置密码失败');
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
      alert(err.message || '删除学生失败');
    }
  };

  const handleExport = async (type: 'zip' | 'students' | 'assessments', filename: string) => {
    setExporting(true);
    try {
      await adminApi.downloadExport(type, filename);
      setFeedbackMessage(`已成功导出 ${filename}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || '导出失败');
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
      label: '登记时间',
      width: 'w-[20%]',
      render: (item) => (
        <span className="text-[13px] opacity-70">{item.registeredAt}</span>
      ),
    },
    {
      key: 'scaleStatuses',
      label: '普查填报进展',
      width: 'w-[20%]',
      render: (item) => {
        const completed = item.scaleStatuses.filter((s) => s.status === 'COMPLETED').length;
        const total = item.scaleStatuses.length;
        const isAll = item.allCompleted;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAll
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isAll ? '已全完成' : `进行中 (${completed}/${total})`}
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
            onClick={() => setResetTargetNumber(item.studentNumber)}
            title="重置密码"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setDeleteTarget({
                number: item.studentNumber,
                name: item.fullName,
              })
            }
            title="删除测试账号"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/30 cursor-pointer"
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
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter & Actions Bar matching medical-system StudentsView */}
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

        {/* Right: Material Design 3 SplitButton matching medical-system */}
        <SplitButton
          icon={exporting ? 'progress_activity' : 'download'}
          label={exporting ? '正在导出...' : '导出数据'}
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
              icon: 'table_chart',
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

      {/* Main Table Content using medical-system DataTable */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {loading && students.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] gap-3">
            <md-circular-progress indeterminate></md-circular-progress>
            <span className="text-xs">加载学生普查记录中...</span>
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

      {/* Reset Password Dialog */}
      {resetTargetNumber && (
        <ResetPasswordDialog
          isOpen={!!resetTargetNumber}
          studentNumber={resetTargetNumber}
          onClose={() => setResetTargetNumber(null)}
          onConfirm={handleConfirmResetPassword}
        />
      )}

      {/* Delete Student Dialog */}
      {deleteTarget && (
        <DeleteStudentDialog
          isOpen={!!deleteTarget}
          studentNumber={deleteTarget.number}
          studentName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDeleteStudent}
        />
      )}
    </div>
  );
}
