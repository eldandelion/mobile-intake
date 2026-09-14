import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuestionnairePlayerPage } from './QuestionnairePlayerPage';
import { intakeApi } from '../api/intakeApi';

describe('QuestionnairePlayerPage', () => {
  const mockScaleDetail = {
    code: 'phq_9',
    title: 'PHQ-9 抑郁健康问卷',
    subtitle: '情绪评估',
    description: '评估过去两周内的心理健康状况',
    estimatedMinutes: 2,
    questions: [
      {
        id: 'phq9_1',
        text: '1. 做事提不起劲或没有兴趣',
        orderNum: 1,
        type: 'single_choice',
        options: [
          { value: 0, label: '完全不会' },
          { value: 1, label: '好几天' },
          { value: 2, label: '一半以上天数' },
          { value: 3, label: '几乎每天' },
        ],
      },
      {
        id: 'phq9_2',
        text: '2. 感到心情低落、沮丧或绝望',
        orderNum: 2,
        type: 'single_choice',
        options: [
          { value: 0, label: '完全不会' },
          { value: 1, label: '好几天' },
          { value: 2, label: '一半以上天数' },
          { value: 3, label: '几乎每天' },
        ],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockScaleDetail);
    vi.spyOn(intakeApi, 'submitScale').mockResolvedValue({
      scaleCode: 'phq_9',
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads scale questions, auto-advances after 200ms on option select, and completes survey', async () => {
    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    // Wait for getScaleDetail to load
    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });

    expect(screen.getByText('第 1 / 2 题')).toBeDefined();

    // Click option "好几天" on Question 1
    const option1 = screen.getByText('好几天');
    fireEvent.click(option1);

    // Wait 250ms for the 200ms auto-advance to trigger
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    }, { timeout: 1000 });

    expect(screen.getByText('第 2 / 2 题')).toBeDefined();

    // Click "上一题" to verify back navigation works
    const prevBtn = screen.getByText('上一题');
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });

    // Return to Question 2 via "下一题"
    const nextBtn = screen.getByText('下一题');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });

    // Select option for Question 2 (last question: should NOT auto-advance past end, but enable finish)
    const option2 = screen.getByText('完全不会');
    fireEvent.click(option2);

    // Finish button should be enabled
    const finishBtn = await screen.findByText('完成并提交');
    expect(finishBtn).toBeDefined();

    fireEvent.click(finishBtn);

    // Outro screen
    await waitFor(() => {
      expect(screen.getByText('作答已提交！')).toBeDefined();
    });
    expect(screen.getByText('返回测评列表')).toBeDefined();
  });

  it('opens exit confirmation dialog multiple times without getting stuck', async () => {
    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });

    // Answer Question 1 so answeredCount > 0
    fireEvent.click(screen.getByText('好几天'));

    const dialogEl = document.querySelector('md-dialog') as any;
    if (!dialogEl.show) dialogEl.show = vi.fn();
    if (!dialogEl.close) dialogEl.close = vi.fn();
    const showSpy = vi.spyOn(dialogEl, 'show');
    const closeSpy = vi.spyOn(dialogEl, 'close');

    // 1st click on exit button
    const backBtn = screen.getByLabelText('退出');
    fireEvent.click(backBtn);
    expect(showSpy).toHaveBeenCalledTimes(1);

    // Click "继续作答"
    const continueBtn = screen.getByText('继续作答');
    fireEvent.click(continueBtn);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    // 2nd click on exit button - verify it opens again!
    fireEvent.click(backBtn);
    expect(showSpy).toHaveBeenCalledTimes(2);
  });

  it('locks body scroll on mount and restores original overflow on unmount', async () => {
    document.body.style.overflow = 'visible';
    const handleClose = vi.fn();
    const { unmount } = render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    // Should be locked while mounted
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    // On unmount, should restore
    unmount();
    expect(document.body.style.overflow).toBe('visible');
  });
});
