import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { adminApi, AdminDashboardMetrics } from '../api/adminApi';

describe('DashboardPage', () => {
  const mockMetrics: AdminDashboardMetrics = {
    totalStudents: 3200,
    fullyCompletedStudents: 2880,
    overallCompletionRate: 90,
    scaleStats: [
      {
        scaleCode: 'demographics_survey',
        title: '个人基本信息核对',
        completedCount: 3100,
        inProgressCount: 50,
        totalStudents: 3200,
        completionRate: 96,
      },
      {
        scaleCode: 'MENTAL_HEALTH_ASSESSMENT',
        title: '心理健康综合测评',
        completedCount: 2950,
        inProgressCount: 120,
        totalStudents: 3200,
        completionRate: 92,
      },
    ],
  };

  const mockNavigateUsers = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard metrics and scale stats', async () => {
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue(mockMetrics);

    render(
      <DashboardPage
        onNavigateToUsers={mockNavigateUsers}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('3200')).toBeDefined();
      expect(screen.getByText('已注册学生')).toBeDefined();
      expect(screen.getByText('90%')).toBeDefined();
      expect(screen.getByText(/已完成 2880 人/)).toBeDefined();
      expect(screen.getByText('个人基本信息核对')).toBeDefined();
      expect(screen.getByText(/96%/)).toBeDefined();
      expect(screen.getByText('心理健康综合测评')).toBeDefined();
      expect(screen.getByText(/92%/)).toBeDefined();
    });
  });

  it('navigates to users on card clicks', async () => {
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue(mockMetrics);

    render(
      <DashboardPage
        onNavigateToUsers={mockNavigateUsers}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('已注册学生')).toBeDefined();
    });

    // Click total students card
    fireEvent.click(screen.getByText('已注册学生'));
    expect(mockNavigateUsers).toHaveBeenCalledTimes(1);

    // Click completion rate card
    fireEvent.click(screen.getByText(/全部完成率/));
    expect(mockNavigateUsers).toHaveBeenCalledTimes(2);
  });

  it('triggers quick zip export when clicking quick export card', async () => {
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue(mockMetrics);
    const exportSpy = vi.spyOn(adminApi, 'downloadExport').mockResolvedValue();

    render(
      <DashboardPage
        onNavigateToUsers={mockNavigateUsers}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('一键导出普查 ZIP')).toBeDefined();
    });

    fireEvent.click(screen.getByText('一键导出普查 ZIP'));

    expect(exportSpy).toHaveBeenCalledWith('zip', 'intake-package.zip');
  });

  it('renders error message and allows retrying when API fails', async () => {
    vi.spyOn(adminApi, 'getMetrics').mockRejectedValueOnce(new Error('网络连接超时'));

    render(
      <DashboardPage
        onNavigateToUsers={mockNavigateUsers}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('网络连接超时')).toBeDefined();
    });

    // Mock successful retry
    vi.spyOn(adminApi, 'getMetrics').mockResolvedValue(mockMetrics);
    fireEvent.click(screen.getByText('重试'));

    await waitFor(() => {
      expect(screen.getByText('3200')).toBeDefined();
    });
  });
});
