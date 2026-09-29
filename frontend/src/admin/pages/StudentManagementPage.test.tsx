import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { StudentManagementPage } from './StudentManagementPage';
import { adminApi, AdminStudentSummaryDto, AdminStudentDetailDto } from '../api/adminApi';

describe('StudentManagementPage', () => {
  const mockStudents: AdminStudentSummaryDto[] = [
    {
      studentNumber: '8209220532',
      fullName: '张三',
      phone: '13800000001',
      registeredAt: '2026-09-01 08:30',
      scaleStatuses: [
        { scaleCode: 'demographics_survey', title: '基本信息', status: 'COMPLETED' },
        { scaleCode: 'MENTAL_HEALTH_ASSESSMENT', title: '心理测评', status: 'COMPLETED' },
      ],
      allCompleted: true,
    },
    {
      studentNumber: '8209220533',
      fullName: '李四',
      phone: '13800000002',
      registeredAt: '2026-09-01 09:15',
      scaleStatuses: [
        { scaleCode: 'demographics_survey', title: '基本信息', status: 'COMPLETED' },
        { scaleCode: 'MENTAL_HEALTH_ASSESSMENT', title: '心理测评', status: 'IN_PROGRESS' },
      ],
      allCompleted: false,
    },
  ];

  const mockDetail: AdminStudentDetailDto = {
    studentNumber: '8209220532',
    fullName: '张三',
    phone: '13800000001',
    registeredAt: '2026-09-01 08:30',
    demographics: {
      major: '计算机科学与技术',
      gender: '男',
    },
    scaleStatuses: [
      { scaleCode: 'demographics_survey', title: '基本信息', status: 'COMPLETED' },
      { scaleCode: 'MENTAL_HEALTH_ASSESSMENT', title: '心理测评', status: 'COMPLETED' },
    ],
  };

  const mockOnSelectStudent = vi.fn();
  const mockSetIsSidePanelOpen = vi.fn();
  const mockSetIsSidePanelLoading = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders student table and status filters', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
        setIsSidePanelLoading={mockSetIsSidePanelLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeDefined();
      expect(screen.getByText(/8209220532/)).toBeDefined();
      expect(screen.getByText('李四')).toBeDefined();
      expect(screen.getByText(/8209220533/)).toBeDefined();
    });

    // Test filter: click 已全部完成
    fireEvent.click(screen.getByText('已全部完成'));
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.queryByText('李四')).toBeNull();

    // Test filter: click 未全部完成
    fireEvent.click(screen.getByText('未全部完成'));
    expect(screen.queryByText('张三')).toBeNull();
    expect(screen.getByText('李四')).toBeDefined();

    // Click 全部 to reset filter
    fireEvent.click(screen.getByText('全部'));
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.getByText('李四')).toBeDefined();
  });

  it('renders transparent outlined status badges with status color dots and neutral text', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
        setIsSidePanelLoading={mockSetIsSidePanelLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已全完成')).toBeDefined();
      expect(screen.getByText('填报中 (1/2)')).toBeDefined();
    });

    const completedText = screen.getByText('已全完成');
    const completedContainer = completedText.closest('.rounded-full');
    expect(completedContainer?.className).toContain('bg-transparent');
    expect(completedContainer?.className).toContain('border');
    expect(completedContainer?.className).toContain('text-[var(--md-sys-color-on-surface)]');

    const completedDot = completedContainer?.querySelector('.w-1\\.5');
    expect(completedDot?.className).toContain('bg-emerald-500');

    const inProgressText = screen.getByText('填报中 (1/2)');
    const inProgressContainer = inProgressText.closest('.rounded-full');
    expect(inProgressContainer?.className).toContain('bg-transparent');
    expect(inProgressContainer?.className).toContain('border');
    expect(inProgressContainer?.className).toContain('text-[var(--md-sys-color-on-surface)]');

    const inProgressDot = inProgressContainer?.querySelector('.w-1\\.5');
    expect(inProgressDot?.className).toContain('bg-amber-500');
  });

  it('selects a student on row click and opens side panel', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);
    const detailSpy = vi.spyOn(adminApi, 'getStudentDetail').mockResolvedValue(mockDetail);

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
        setIsSidePanelLoading={mockSetIsSidePanelLoading}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeDefined();
    });

    // Click row
    fireEvent.click(screen.getByText('张三'));

    expect(mockSetIsSidePanelOpen).toHaveBeenCalledWith(true);
    expect(detailSpy).toHaveBeenCalledWith('8209220532');

    await waitFor(() => {
      expect(mockOnSelectStudent).toHaveBeenCalledWith(mockDetail);
    });
  });

  it('opens reset password dialog and completes reset', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);
    const resetSpy = vi.spyOn(adminApi, 'resetPassword').mockResolvedValue({
      studentNumber: '8209220532',
      newPassword: 'new-temp-password',
      message: '密码已成功重置为: new-temp-password',
    });

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeDefined();
    });

    const resetButtons = screen.getAllByTitle('重置密码');
    fireEvent.click(resetButtons[0]);

    // Step 1: Input Dialog should open
    await waitFor(() => {
      expect(screen.getByText('重置学生密码')).toBeDefined();
    });

    // Click 下一步 to enter Step 2: Confirmation
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    fireEvent.click(nextBtn);

    // Step 2: Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText('确认重置密码？')).toBeDefined();
    });

    const confirmBtn = screen.getByRole('button', { name: /确认重置/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith('8209220532', undefined);
      expect(screen.getByText('密码已成功重置为: new-temp-password')).toBeDefined();
    });
  });

  it('opens delete student dialog and completes deletion', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);
    const deleteSpy = vi.spyOn(adminApi, 'deleteStudent').mockResolvedValue({
      studentNumber: '8209220533',
      success: true,
      message: '学生李四账号及全部作答记录已成功级联清除',
    });

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('李四')).toBeDefined();
    });

    const deleteButtons = screen.getAllByTitle('删除测试账号');
    fireEvent.click(deleteButtons[1]);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText('确认删除学生登记？')).toBeDefined();
    });

    const confirmBtn = screen.getByRole('button', { name: /彻底删除/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('8209220533');
      expect(screen.getByText('学生李四账号及全部作答记录已成功级联清除')).toBeDefined();
    });
  });

  it('filters students with the expandable search bar and clears on close', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeDefined();
      expect(screen.getByText('李四')).toBeDefined();
    });

    // Expand search bar
    const searchToggleBtn = screen.getByRole('button', { name: '展开搜索' });
    fireEvent.click(searchToggleBtn);

    const searchInput = screen.getByPlaceholderText('搜索学生姓名、学号、手机号...');
    expect(searchInput).toBeDefined();

    // Type query
    fireEvent.change(searchInput, { target: { value: '张三' } });
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.queryByText('李四')).toBeNull();

    // Search by student number
    fireEvent.change(searchInput, { target: { value: '8209220533' } });
    expect(screen.queryByText('张三')).toBeNull();
    expect(screen.getByText('李四')).toBeDefined();

    // Click close/clear button
    const clearBtn = screen.getByRole('button', { name: '清除搜索' });
    fireEvent.click(clearBtn);

    // Both should be visible again
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.getByText('李四')).toBeDefined();
  });

  it('triggers exports via the SplitButton primary action and dropdown options', async () => {
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue(mockStudents);
    const exportSpy = vi.spyOn(adminApi, 'downloadExport').mockResolvedValue();

    render(
      <StudentManagementPage
        selectedStudent={null}
        onSelectStudent={mockOnSelectStudent}
        isSidePanelOpen={false}
        setIsSidePanelOpen={mockSetIsSidePanelOpen}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('导出数据')).toBeDefined();
    });

    // 1. Primary action click triggers default ZIP export
    fireEvent.click(screen.getByText('导出数据'));
    expect(exportSpy).toHaveBeenCalledWith('zip', 'intake-package.zip');

    await waitFor(() => {
      expect(screen.getByText('导出数据')).toBeDefined();
    });

    // 2. Open dropdown menu via trailing toggle button
    const dropdownToggle = screen.getByRole('button', { name: '更多操作' });
    fireEvent.click(dropdownToggle);

    // Verify dropdown items
    expect(screen.getByText('完整普查数据包 (.zip)')).toBeDefined();
    expect(screen.getByText('学生档案 (students.csv)')).toBeDefined();
    expect(screen.getByText('原始作答记录 (assessments.csv)')).toBeDefined();

    // Trigger students CSV export from menu
    fireEvent.click(screen.getByText('学生档案 (students.csv)'));
    expect(exportSpy).toHaveBeenCalledWith('students', 'students.csv');
  });
});
