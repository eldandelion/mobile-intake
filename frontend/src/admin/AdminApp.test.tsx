import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import AdminApp from './AdminApp';
import App from '../App';
import { adminApi, adminTokenStorage } from './api/adminApi';
import { intakeApi } from '../api/intakeApi';

function simulateInput(element: Element, value: string) {
  act(() => {
    (element as any).value = value;
    fireEvent(element, new Event('input', { bubbles: true, composed: true }));
  });
}

describe('AdminApp Root & Navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders AdminLoginPage when unauthenticated', async () => {
    vi.spyOn(adminApi, 'getMe').mockRejectedValue(new Error('Unauthorized'));

    render(<AdminApp />);

    await waitFor(() => {
      expect(screen.getByText('心理普查管理控制台')).toBeDefined();
      expect(screen.getByText('验证并登入工作台')).toBeDefined();
    });
  });

  it('logs in successfully and shows the dashboard shell', async () => {
    vi.spyOn(adminApi, 'getMe').mockRejectedValueOnce(new Error('Unauthorized'));
    vi.spyOn(adminApi, 'login').mockResolvedValue({
      token: 'mock-admin-token',
      username: 'admin',
      role: 'ROLE_INTAKE_ADMIN',
    });
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue({
      totalStudents: 1500,
      fullyCompletedStudents: 1200,
      overallCompletionRate: 80,
      scaleStats: [],
    });

    render(<AdminApp />);

    await waitFor(() => {
      expect(screen.getByText('心理普查管理控制台')).toBeDefined();
    });

    const secretInput = screen.getByPlaceholderText('请输入管理安全密钥');
    simulateInput(secretInput, 'intake-admin-2026');

    const submitBtn = screen.getByText('验证并登入工作台');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getAllByText('系统总览').length).toBeGreaterThan(0);
      expect(screen.getByText('学生档案')).toBeDefined();
    });
  });

  it('switches navigation tabs and logs out', async () => {
    adminTokenStorage.set('valid-token');
    vi.spyOn(adminApi, 'getMe').mockResolvedValue({
      token: 'valid-token',
      username: 'admin',
      role: 'ROLE_INTAKE_ADMIN',
    });
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue({
      totalStudents: 10,
      fullyCompletedStudents: 8,
      overallCompletionRate: 80,
      scaleStats: [],
    });
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue([]);

    render(<AdminApp />);

    await waitFor(() => {
      expect(screen.getAllByText('系统总览').length).toBeGreaterThan(0);
    });

    // Navigate to Student Management
    fireEvent.click(screen.getByText('学生档案'));
    await waitFor(() => {
      expect(screen.getByText('全校学生档案')).toBeDefined();
    });

    // Logout via AccountMenu
    fireEvent.click(screen.getByTitle('系统管理员账号'));
    await waitFor(() => {
      expect(screen.getByText('退出所有账号')).toBeDefined();
    });
    fireEvent.click(screen.getByText('退出所有账号'));

    await waitFor(() => {
      expect(screen.getByText('心理普查管理控制台')).toBeDefined();
      expect(adminTokenStorage.get()).toBeNull();
    });
  });

  it('routes correctly in App.tsx based on pathname', async () => {
    // 1. When path is /admin
    Object.defineProperty(window, 'location', {
      value: { pathname: '/admin' },
      writable: true,
    });
    vi.spyOn(adminApi, 'getMe').mockRejectedValue(new Error('Unauthorized'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('心理普查管理控制台')).toBeDefined();
    });

    // 2. When path is /
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });
    vi.spyOn(intakeApi, 'getMe').mockRejectedValue(new Error('Not logged in'));

    render(<App />);

    await waitFor(() => {
      // Student login page
      expect(screen.getByText('使用您的中南大学学号以继续心理普查')).toBeDefined();
    });
  });

  it('handles reset password and delete account via Material dialogs and in-app feedback without browser popups', async () => {
    adminTokenStorage.set('valid-token');
    vi.spyOn(adminApi, 'getMe').mockResolvedValue({
      token: 'valid-token',
      username: 'admin',
      role: 'ROLE_INTAKE_ADMIN',
    });
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue({
      totalStudents: 1,
      fullyCompletedStudents: 1,
      overallCompletionRate: 100,
      scaleStats: [],
    });
    vi.spyOn(adminApi, 'getStudents').mockResolvedValue([
      {
        studentNumber: '8209220532',
        fullName: '张三',
        phone: '13800000001',
        registeredAt: '2026-09-01 08:30',
        scaleStatuses: [],
        allCompleted: true,
      },
    ]);
    vi.spyOn(adminApi, 'getStudentDetail').mockResolvedValue({
      studentNumber: '8209220532',
      fullName: '张三',
      phone: '13800000001',
      registeredAt: '2026-09-01 08:30',
      demographics: { major: '计算机' },
      scaleStatuses: [],
    });
    const resetSpy = vi.spyOn(adminApi, 'resetPassword').mockResolvedValue({
      studentNumber: '8209220532',
      newPassword: '123456',
      message: '密码已成功重置为: 123456',
    });
    const deleteSpy = vi.spyOn(adminApi, 'deleteStudent').mockResolvedValue({
      studentNumber: '8209220532',
      success: true,
      message: '学生张三账号已成功清除',
    });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<AdminApp />);

    await waitFor(() => {
      expect(screen.getAllByText('系统总览').length).toBeGreaterThan(0);
    });

    // 1. Go to student management tab
    fireEvent.click(screen.getByText('学生档案'));
    await waitFor(() => {
      expect(screen.getByText('全校学生档案')).toBeDefined();
    });

    // 2. Click student row to open DetailsPanel
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeDefined();
    });
    fireEvent.click(screen.getByText('张三'));

    // Wait for DetailsPanel to display
    await waitFor(() => {
      expect(screen.getByText('学生档案详情')).toBeDefined();
    });

    // 3. Test Reset Password flow via DetailsPanel
    const resetBtn = screen.getByText('重置密码');
    fireEvent.click(resetBtn);

    // Step 1 Dialog appears
    await waitFor(() => {
      expect(screen.getByText('重置学生密码')).toBeDefined();
    });
    // Click 下一步
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));

    // Step 2 Confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText('确认重置密码？')).toBeDefined();
    });
    // Click 确认重置
    fireEvent.click(screen.getByRole('button', { name: /确认重置/i }));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith('8209220532', undefined);
      // In-app snackbar appears
      expect(screen.getByText('密码已成功重置为: 123456')).toBeDefined();
    });
    expect(alertSpy).not.toHaveBeenCalled();

    // 4. Test Delete Account flow via DetailsPanel
    const deleteBtn = screen.getByText('删除账号');
    fireEvent.click(deleteBtn);

    // Delete confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText('确认删除学生登记？')).toBeDefined();
    });
    // Click 彻底删除
    fireEvent.click(screen.getByRole('button', { name: /彻底删除/i }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('8209220532');
      // In-app snackbar appears
      expect(screen.getByText('学生张三账号已成功清除')).toBeDefined();
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
