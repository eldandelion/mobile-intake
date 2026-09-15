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
    instructions: '请仔细阅读每一项，按实际感受如实作答。',
    estimatedMinutes: 2,
    introItems: [
      {
        icon: 'assignment',
        title: '评估内容',
        description: '本评估共包含 2 道题目，预计用时约 2 分钟。',
      },
      {
        icon: 'volunteer_activism',
        title: '客观作答',
        description: '所有问题的答案没有对错之分，请放心填写。',
      },
      {
        icon: 'lock',
        title: '隐私保密',
        description: '您的个人信息及答题数据将被严格加密保密。',
      },
    ],
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

  it('shows introductory page for first-time session, then transitions to questions on "开始作答"', async () => {
    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    // Wait for scale to load intro view
    await waitFor(() => {
      expect(screen.getByText('问卷前指导')).toBeDefined();
    });

    expect(screen.getByText('PHQ-9 抑郁健康问卷')).toBeDefined();
    expect(screen.getByText('评估内容')).toBeDefined();
    expect(screen.getByText('客观作答')).toBeDefined();
    expect(screen.getByText('隐私保密')).toBeDefined();

    // Click "开始作答"
    const startBtn = screen.getByText('开始作答');
    fireEvent.click(startBtn);

    // Now question 1 should be visible
    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });
    expect(screen.getByText('第 1 / 2 题')).toBeDefined();
  });

  it('bypasses intro page and resumes directly at question when saved draft exists', async () => {
    // Pre-seed draft with question 1 answered
    localStorage.setItem('intake_draft_2026001_phq_9', JSON.stringify({ phq9_1: 1 }));

    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    // Should resume directly at unanswered question 2
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });
    expect(screen.getByText('第 2 / 2 题')).toBeDefined();
  });

  it('allows opening instructions from header info button and returning to question', async () => {
    // Pre-seed draft to start in questionnaire
    localStorage.setItem('intake_draft_2026001_phq_9', JSON.stringify({ phq9_1: 1 }));

    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });

    // Click info button in header
    const infoBtn = screen.getByLabelText('查看量表指导语与说明');
    fireEvent.click(infoBtn);

    // Intro scaffold is visible with "继续作答"
    await waitFor(() => {
      expect(screen.getByText('问卷前指导')).toBeDefined();
    });
    const continueBtn = screen.getByText('继续作答 (已完成 1/2 题)');
    fireEvent.click(continueBtn);

    // Returned to question 2
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });
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

    // Intro screen first
    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    // Wait for question 1 to load
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

    // Advance past intro
    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

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

  it('opens question grid bottom sheet when clicking counter pill and jumps to selected question', async () => {
    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="2026001"
        onClose={handleClose}
      />
    );

    // Advance past intro
    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });

    // Find and click the counter pill button
    const counterBtn = screen.getByLabelText('查看题目列表并快速跳转');
    expect(counterBtn).toBeDefined();
    fireEvent.click(counterBtn);

    // Sheet should be open
    expect(screen.getByText('题目列表')).toBeDefined();

    // Click on question 2 button
    const q2Btn = screen.getByLabelText(/跳转至第 2 题/);
    fireEvent.click(q2Btn);

    // Sheet should auto-close and player should now be on question 2
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });
    expect(screen.getByText('第 2 / 2 题')).toBeDefined();
  });
});
