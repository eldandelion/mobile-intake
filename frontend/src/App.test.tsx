import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { intakeApi } from './api/intakeApi';
import { tokenStorage } from './api/intakeApi';

describe('App Top Bar & Navigation', () => {
  const mockStudent = {
    studentNumber: '2026001',
    fullName: '张同学',
    phone: '13800000000',
    registeredAt: '2026-09-01T08:00:00',
  };

  const mockScales = [
    {
      code: 'demographics_survey',
      title: '个人基本信息核对',
      description: '采集基本信息',
      questionCount: 8,
      estimatedMinutes: 3,
      status: 'NOT_STARTED' as const,
    },
    {
      code: 'phq_9',
      title: 'PHQ-9 抑郁健康问卷',
      description: '日常情绪评估',
      questionCount: 9,
      estimatedMinutes: 2,
      status: 'COMPLETED' as const,
    },
    {
      code: 'gad_7',
      title: 'GAD-7 焦虑筛查问卷',
      description: '焦虑倾向评估',
      questionCount: 7,
      estimatedMinutes: 2,
      status: 'NOT_STARTED' as const,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    tokenStorage.set('valid-test-token');
    vi.spyOn(intakeApi, 'getMe').mockResolvedValue(mockStudent);
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue(mockScales);
  });

  it('displays "还有x项任务待完成" in the top bar header', async () => {
    render(<App />);

    // 1 completed out of 3 -> 2 remaining tasks
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '还有 2 项任务待完成' })).toBeDefined();
    });
  });

  it('renders progress bar at the bottom of the top bar and no separation line (border-b)', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '还有 2 项任务待完成' })).toBeDefined();
    });

    const header = container.querySelector('header');
    expect(header).toBeDefined();
    // Verify separation line (border-b) is removed
    expect(header?.className).not.toContain('border-b');

    // Verify md-linear-progress exists in header
    const progressBar = header?.querySelector('md-linear-progress');
    expect(progressBar).not.toBeNull();
    expect(progressBar?.getAttribute('value')).toBe('1');
    expect(progressBar?.getAttribute('max')).toBe('3');
  });

  it('replaces avatar image with light/dark mode outlined icon button and toggles dark theme', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '还有 2 项任务待完成' })).toBeDefined();
    });

    const header = container.querySelector('header');
    // Ensure avatar button is NOT present in the header
    const avatarButton = header?.querySelector('button[title="查看个人中心"]');
    expect(avatarButton).toBeNull();

    // Verify outlined icon button is present
    const themeBtn = header?.querySelector('md-outlined-icon-button');
    expect(themeBtn).not.toBeNull();
    expect(themeBtn?.getAttribute('aria-label')).toBe('切换为深色模式');

    // Click theme button to toggle to dark mode
    fireEvent.click(themeBtn!);

    // Root should have 'dark' class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('app-theme')).toBe('dark');
    expect(themeBtn?.getAttribute('aria-label')).toBe('切换为浅色模式');

    // Click again to toggle back to light mode
    fireEvent.click(themeBtn!);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('app-theme')).toBe('light');
  });
});
