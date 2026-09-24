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
});
