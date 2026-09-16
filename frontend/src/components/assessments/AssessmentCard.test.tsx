import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssessmentCard } from './AssessmentCard';
import { ScaleSummaryDto } from '../../api/intakeApi';

describe('AssessmentCard', () => {
  const mockUncompletedScale: ScaleSummaryDto = {
    code: 'phq_9',
    title: 'PHQ-9 抑郁健康问卷',
    subtitle: '情绪评估',
    description: '评估过去两周内的心理健康状况与日常情绪体验',
    questionCount: 9,
    estimatedMinutes: 2,
    status: 'NOT_STARTED',
    answeredCount: 0,
    completionPercentage: 0,
  };

  const mockCompletedScale: ScaleSummaryDto = {
    code: 'demographics_survey',
    title: '个人基本信息核对',
    subtitle: '新生入学档案',
    description: '身份证号、民族、专业与紧急联系人',
    questionCount: 8,
    estimatedMinutes: 3,
    status: 'COMPLETED',
    answeredCount: 8,
    completionPercentage: 100,
  };

  it('renders uncompleted scale with start button, correct labels, and no progress bar', () => {
    const handleStart = vi.fn();
    render(<AssessmentCard scale={mockUncompletedScale} onStart={handleStart} />);

    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    expect(screen.queryByText('情绪评估')).toBeNull();
    expect(screen.getByText(/约 2 分钟 • 9 题/)).toBeDefined();
    expect(screen.queryByRole('progressbar')).toBeNull();

    const startBtn = screen.getByText('开始测评');
    expect(startBtn).toBeDefined();

    fireEvent.click(startBtn);
    expect(handleStart).toHaveBeenCalledWith('phq_9');
  });

  it('renders completed scale with view button and without progress bar', () => {
    const handleView = vi.fn();
    render(<AssessmentCard scale={mockCompletedScale} onStart={vi.fn()} onView={handleView} />);

    expect(screen.getByText('个人基本信息核对')).toBeDefined();
    expect(screen.queryByText('已完成')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();

    const viewBtn = screen.getByText('查看已提交');
    expect(viewBtn).toBeDefined();

    fireEvent.click(viewBtn);
    expect(handleView).toHaveBeenCalledWith('demographics_survey');
  });

  it('renders in-progress scale with progress bar and summary when answeredCount > 0', () => {
    const mockInProgressScale: ScaleSummaryDto = {
      code: 'phq_9',
      title: 'PHQ-9 抑郁健康问卷',
      description: '评估过去两周内的心理健康状况与日常情绪体验',
      questionCount: 9,
      estimatedMinutes: 2,
      status: 'IN_PROGRESS',
      answeredCount: 3,
      completionPercentage: 33,
    };

    const handleStart = vi.fn();
    render(<AssessmentCard scale={mockInProgressScale} onStart={handleStart} />);

    expect(screen.queryByText('进行中')).toBeNull();
    expect(screen.queryByText('作答进度')).toBeNull();
    expect(screen.getByText('33%')).toBeDefined();
    expect(screen.getByText('3 / 9 题')).toBeDefined();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeDefined();
    expect(progressBar.getAttribute('aria-valuenow')).toBe('33');
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');

    const fillElement = progressBar.querySelector('.bg-\\[var\\(--md-sys-color-primary\\)\\]');
    expect(fillElement).toBeDefined();
    expect((fillElement as HTMLElement).style.width).toBe('33%');

    const resumeBtn = screen.getByText('继续测评');
    expect(resumeBtn).toBeDefined();

    fireEvent.click(resumeBtn);
    expect(handleStart).toHaveBeenCalledWith('phq_9');
  });

  it('suppresses progress bar when in-progress scale has 0 answered questions', () => {
    const mockEmptyProgressScale: ScaleSummaryDto = {
      code: 'phq_9',
      title: 'PHQ-9 抑郁健康问卷',
      description: '评估过去两周内的心理健康状况与日常情绪体验',
      questionCount: 9,
      estimatedMinutes: 2,
      status: 'IN_PROGRESS',
      answeredCount: 0,
      completionPercentage: 0,
    };

    render(<AssessmentCard scale={mockEmptyProgressScale} onStart={vi.fn()} />);

    expect(screen.queryByText('进行中')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText('作答进度')).toBeNull();
    expect(screen.getByText('继续测评')).toBeDefined();
  });

  it('handles boundary edge cases cleanly and clamps answeredCount', () => {
    // answeredCount exceeds questionCount (e.g. 12 / 9)
    const mockOverflowScale: ScaleSummaryDto = {
      code: 'phq_9',
      title: 'PHQ-9 抑郁健康问卷',
      description: 'Test description',
      questionCount: 9,
      estimatedMinutes: 2,
      status: 'IN_PROGRESS',
      answeredCount: 12,
    };

    render(<AssessmentCard scale={mockOverflowScale} onStart={vi.fn()} />);

    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('9 / 9 题')).toBeDefined();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.getAttribute('aria-valuenow')).toBe('100');
  });
});
