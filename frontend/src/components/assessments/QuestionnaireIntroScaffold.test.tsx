import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionnaireIntroScaffold } from './QuestionnaireIntroScaffold';
import type { ScaleDetail } from '../../api/intakeApi';

describe('QuestionnaireIntroScaffold', () => {
  const mockScale: ScaleDetail = {
    code: 'phq_9',
    title: '情绪状况评估 (PHQ-9)',
    subtitle: 'PHQ-9 抑郁症筛查量表',
    description: '在过去的两周里，您有多少时间受到以下问题的困扰？',
    instructions: '请仔细阅读每一项，按实际感受如实作答。',
    estimatedMinutes: 3,
    introItems: [
      {
        icon: 'assignment',
        title: '评估内容',
        description: '本量表共包含 9 道题目，用于了解您近期的情绪状态。',
      },
      {
        icon: 'volunteer_activism',
        title: '客观作答',
        description: '所有选项无好坏之分，请根据实际感受作答。',
      },
      {
        icon: 'lock',
        title: '隐私保密',
        description: '数据全程加密，严格保护个人隐私。',
      },
    ],
    questions: [
      { id: 'q1', text: '做事提不起劲', orderNum: 1, type: 'single_choice', options: [] },
      { id: 'q2', text: '感到心情低落', orderNum: 2, type: 'single_choice', options: [] },
    ],
  };

  it('renders scale title, subtitle, metrics pills, instructions, and intro notice cards', () => {
    const handleStart = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuestionnaireIntroScaffold
        scale={mockScale}
        totalQuestions={2}
        onStart={handleStart}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('情绪状况评估 (PHQ-9)')).toBeDefined();
    expect(screen.getByText('PHQ-9 抑郁症筛查量表')).toBeDefined();
    expect(screen.getByText('约 3 分钟')).toBeDefined();
    expect(screen.getByText('共 2 道题目')).toBeDefined();
    expect(screen.queryByText('作答指导语')).toBeNull();
    expect(screen.queryByText('隐私加密')).toBeNull();

    // Intro cards
    expect(screen.getByText('评估内容')).toBeDefined();
    expect(screen.getByText('本量表共包含 9 道题目，用于了解您近期的情绪状态。')).toBeDefined();
    expect(screen.getByText('客观作答')).toBeDefined();
    expect(screen.getByText('隐私保密')).toBeDefined();

    // Primary action button
    const startButton = screen.getByText('开始作答');
    expect(startButton).toBeDefined();
  });

  it('calls onStart when clicking action button', () => {
    const handleStart = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuestionnaireIntroScaffold
        scale={mockScale}
        totalQuestions={2}
        onStart={handleStart}
        onClose={handleClose}
      />
    );

    const startButton = screen.getByText('开始作答');
    fireEvent.click(startButton);
    expect(handleStart).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking back button', () => {
    const handleStart = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuestionnaireIntroScaffold
        scale={mockScale}
        totalQuestions={2}
        onStart={handleStart}
        onClose={handleClose}
      />
    );

    const backButton = screen.getByLabelText('返回测评列表');
    fireEvent.click(backButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows continue button when draft exists', () => {
    const handleStart = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuestionnaireIntroScaffold
        scale={mockScale}
        totalQuestions={5}
        hasExistingDraft={true}
        answeredCount={3}
        onStart={handleStart}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('继续作答 (已完成 3/5 题)')).toBeDefined();
  });

  it('falls back to default notice cards when scale introItems is empty', () => {
    const scaleWithoutIntro: ScaleDetail = {
      ...mockScale,
      introItems: undefined,
    };

    render(
      <QuestionnaireIntroScaffold
        scale={scaleWithoutIntro}
        totalQuestions={2}
        onStart={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('评估内容')).toBeDefined();
    expect(screen.getByText('客观作答')).toBeDefined();
    expect(screen.getByText('隐私保密')).toBeDefined();
  });
});
