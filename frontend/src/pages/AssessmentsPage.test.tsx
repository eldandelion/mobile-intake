import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
      code: 'gad_7',
      title: 'GAD-7 广泛性焦虑量表',
      subtitle: '情绪评估',
      description: '评估日常焦虑与紧张程度',
      questionCount: 7,
      estimatedMinutes: 2,
      status: 'IN_PROGRESS' as const,
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

  it('renders scale list and does not render the removed counter container', async () => {
    render(
      <AuthProvider>
        <AssessmentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('个人基本信息核对')).toBeDefined();
    });

    expect(screen.getByText('GAD-7 广泛性焦虑量表')).toBeDefined();
    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    // Counter container has been removed from AssessmentsPage (now handled in App Top Bar)
    expect(screen.queryByText(/入学心理普查任务/)).toBeNull();
  });

  it('renders segmented filter with 全部, 未完成, 已完成', async () => {
    render(
      <AuthProvider>
        <AssessmentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('全部')).toBeDefined();
    });
    expect(screen.getByText('未完成')).toBeDefined();
    expect(screen.getByText('已完成')).toBeDefined();
  });

  it('filters list correctly between 全部, 未完成 (NOT_STARTED + IN_PROGRESS), and 已完成 (COMPLETED)', async () => {
    render(
      <AuthProvider>
        <AssessmentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('个人基本信息核对')).toBeDefined();
    });

    // Default 'all': all 3 scales visible
    expect(screen.getByText('个人基本信息核对')).toBeDefined();
    expect(screen.getByText('GAD-7 广泛性焦虑量表')).toBeDefined();
    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();

    // Click '未完成': should show NOT_STARTED and IN_PROGRESS, but hide COMPLETED
    fireEvent.click(screen.getByText('未完成'));
    expect(screen.getByText('个人基本信息核对')).toBeDefined();
    expect(screen.getByText('GAD-7 广泛性焦虑量表')).toBeDefined();
    expect(screen.queryByText('PHQ-9 抑郁健康问卷')).toBeNull();

    // Click '已完成': should show only COMPLETED
    fireEvent.click(screen.getByText('已完成'));
    expect(screen.queryByText('个人基本信息核对')).toBeNull();
    expect(screen.queryByText('GAD-7 广泛性焦虑量表')).toBeNull();
    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();

    // Click '全部': restores all
    fireEvent.click(screen.getByText('全部'));
    expect(screen.getByText('个人基本信息核对')).toBeDefined();
    expect(screen.getByText('GAD-7 广泛性焦虑量表')).toBeDefined();
    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
  });

  it('displays empty state when filtered result is empty', async () => {
    // Return only completed scales
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue([
      {
        code: 'phq_9',
        title: 'PHQ-9 抑郁健康问卷',
        subtitle: '情绪评估',
        description: '评估过去两周内的日常情绪体验',
        questionCount: 9,
        estimatedMinutes: 2,
        status: 'COMPLETED' as const,
      },
    ]);

    render(
      <AuthProvider>
        <AssessmentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    });

    // Filter to '未完成' when no unfinished scales exist
    fireEvent.click(screen.getByText('未完成'));
    expect(screen.getByText('暂无未完成测评')).toBeDefined();
    expect(screen.queryByText('PHQ-9 抑郁健康问卷')).toBeNull();
  });
});
