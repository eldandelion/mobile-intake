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
  };

  const mockCompletedScale: ScaleSummaryDto = {
    code: 'demographics_survey',
    title: '个人基本信息核对',
    subtitle: '新生入学档案',
    description: '身份证号、民族、专业与紧急联系人',
    questionCount: 8,
    estimatedMinutes: 3,
    status: 'COMPLETED',
  };

  it('renders uncompleted scale with start button and correct labels', () => {
    const handleStart = vi.fn();
    render(<AssessmentCard scale={mockUncompletedScale} onStart={handleStart} />);

    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    expect(screen.getByText('情绪评估')).toBeDefined();
    expect(screen.getByText(/约 2 分钟 • 9 题/)).toBeDefined();

    const startBtn = screen.getByText('开始测评');
    expect(startBtn).toBeDefined();

    fireEvent.click(startBtn);
    expect(handleStart).toHaveBeenCalledWith('phq_9');
  });

  it('renders completed scale with checkmark chip and view button', () => {
    const handleView = vi.fn();
    render(<AssessmentCard scale={mockCompletedScale} onStart={vi.fn()} onView={handleView} />);

    expect(screen.getByText('个人基本信息核对')).toBeDefined();
    expect(screen.getByText('已完成')).toBeDefined();

    const viewBtn = screen.getByText('查看已提交');
    expect(viewBtn).toBeDefined();

    fireEvent.click(viewBtn);
    expect(handleView).toHaveBeenCalledWith('demographics_survey');
  });
});
