import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { AuthProvider } from '../contexts/AuthContext';
import { intakeApi, tokenStorage } from '../api/intakeApi';

describe('ProfilePage', () => {
  beforeEach(() => {
    tokenStorage.set('test-token');
    vi.spyOn(intakeApi, 'getMe').mockResolvedValue({
      studentNumber: '2026001',
      fullName: '李同学',
      phone: '13812345678',
      registeredAt: '2026-09-01T10:00:00',
    });
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue([
      {
        code: 'phq_9',
        title: 'PHQ-9 抑郁健康问卷',
        description: '评估情绪',
        questionCount: 9,
        estimatedMinutes: 2,
        status: 'COMPLETED',
      },
    ]);
  });

  it('renders student profile information and task checklist', async () => {
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('李同学')).toBeDefined();
    });

    expect(screen.getByText('2026001')).toBeDefined();
    expect(screen.getByText('13812345678')).toBeDefined();
    expect(screen.getByText('普查任务清单')).toBeDefined();
    expect(screen.getByText('退出登录')).toBeDefined();
    expect(screen.getByText('医疗与数据安全须知')).toBeDefined();
  });
});
