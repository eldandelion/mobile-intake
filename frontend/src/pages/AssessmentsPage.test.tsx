import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AssessmentsPage } from './AssessmentsPage';
import { AuthProvider } from '../contexts/AuthContext';
import { intakeApi } from '../api/intakeApi';

describe('AssessmentsPage', () => {
  const mockScales = [
    {
      code: 'demographics_survey',
      title: '个人基本信息核对',
      subtitle: '入学档案',
      description: '身份证号、民族、专业与紧急联系人',
      questionCount: 8,
      estimatedMinutes: 3,
      status: 'NOT_STARTED' as const,
    },
    {
      code: 'phq_9',
      title: 'PHQ-9 抑郁健康问卷',
      subtitle: '情绪评估',
      description: '评估过去两周内的日常情绪体验',
      questionCount: 9,
      estimatedMinutes: 2,
      status: 'COMPLETED' as const,
    },
  ];

  beforeEach(() => {
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue(mockScales);
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue({
      code: 'demographics_survey',
      title: '个人基本信息核对',
      description: '信息填报',
      estimatedMinutes: 3,
      questions: [
        {
          id: 'q1',
          text: '性别',
          orderNum: 1,
          type: 'single_choice',
          options: [{ value: 1, label: '男' }, { value: 2, label: '女' }],
        },
      ],
    });
  });

  it('renders scale list and progress status banner', async () => {
    render(
      <AuthProvider>
        <AssessmentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('个人基本信息核对')).toBeDefined();
    });

    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    expect(screen.getByText(/1 \/ 2 完成/)).toBeDefined();
    expect(screen.getByText('还有 1 项任务待完成')).toBeDefined();
  });
});
