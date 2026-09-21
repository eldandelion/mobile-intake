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
    vi.spyOn(intakeApi, 'getDraft').mockResolvedValue(null);
    vi.spyOn(intakeApi, 'saveDraft').mockResolvedValue();
    vi.spyOn(intakeApi, 'deleteDraft').mockResolvedValue();
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
        studentNumber="8209220532"
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
    localStorage.setItem('intake_draft_8209220532_phq_9', JSON.stringify({ phq9_1: 1 }));

    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="8209220532"
        onClose={handleClose}
      />
    );

    // Should resume directly at unanswered question 2
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });
    expect(screen.getByText('第 2 / 2 题')).toBeDefined();
  });

  it('allows opening instructions from header three-dot menu and returning to question', async () => {
    // Pre-seed draft to start in questionnaire
    localStorage.setItem('intake_draft_8209220532_phq_9', JSON.stringify({ phq9_1: 1 }));

    const handleClose = vi.fn();
    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="8209220532"
        onClose={handleClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });

    // Click three-dot menu button in header
    const moreBtn = screen.getByLabelText('更多选项');
    fireEvent.click(moreBtn);

    // Click "关于测评" menu item
    const aboutMenuItem = screen.getByText('关于测评');
    fireEvent.click(aboutMenuItem);

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
        studentNumber="8209220532"
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
        studentNumber="8209220532"
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
        studentNumber="8209220532"
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
        studentNumber="8209220532"
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

  it('displays category in top bar subtitle and updates dynamically across sections', async () => {
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue({
      ...mockScaleDetail,
      questions: [
        {
          ...mockScaleDetail.questions[0],
          sectionCode: 'phq_9',
          sectionTitle: 'PHQ-9 抑郁症筛查',
        },
        {
          ...mockScaleDetail.questions[1],
          sectionCode: 'gad_7',
          sectionTitle: 'GAD-7 焦虑症筛查',
        },
      ],
    });

    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    // Question 1: top bar subtitle shows PHQ-9 section
    await waitFor(() => {
      expect(screen.getByText('PHQ-9 抑郁症筛查')).toBeDefined();
    });
    // Category pill icon is no longer rendered above the question
    expect(screen.queryByText('category')).toBeNull();

    // Select option and advance to Question 2
    fireEvent.click(screen.getByText('好几天'));
    const nextBtn = screen.getByText('下一题');
    fireEvent.click(nextBtn);

    // Question 2: top bar subtitle dynamically updates to GAD-7 section
    await waitFor(() => {
      expect(screen.getByText('GAD-7 焦虑症筛查')).toBeDefined();
    });
  });

  it('hydrates server draft, skips intro, and positions at first unanswered question', async () => {
    vi.spyOn(intakeApi, 'getDraft').mockResolvedValue({
      scaleCode: 'phq_9',
      answers: { phq9_1: 1 },
      updatedAt: Date.now(),
    });

    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    // Should skip intro and directly show question 2 (first unanswered)
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });

    expect(screen.queryByText('问卷前指导')).toBeNull();
  });

  it('shows Material Design dialog instead of browser alert when submitting with unanswered questions', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockScaleDetail);

    render(
      <QuestionnairePlayerPage
        scaleCode="phq_9"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    // Currently on Question 1 (unanswered). Open Question Grid Sheet to jump to Question 2 (last question)
    const counterBtn = await screen.findByLabelText('查看题目列表并快速跳转');
    fireEvent.click(counterBtn);

    // In sheet, click question 2 button to jump to Question 2
    const q2Btn = await screen.findByLabelText(/跳转至第 2 题/);
    fireEvent.click(q2Btn);

    // Now on Question 2 (last question), answer Question 2
    await waitFor(() => {
      expect(screen.getByText('2. 感到心情低落、沮丧或绝望')).toBeDefined();
    });
    fireEvent.click(screen.getByText('好几天'));

    // Question 2 is answered, so "完成并提交" is enabled, but Question 1 is unanswered
    const submitBtn = await screen.findByText('完成并提交');
    fireEvent.click(submitBtn);

    // Material Design dialog shows up
    await waitFor(() => {
      expect(screen.getByText('还有题目尚未作答')).toBeDefined();
    });
    expect(alertSpy).not.toHaveBeenCalled();

    // Click 前往作答 button in the dialog
    fireEvent.click(screen.getByText('前往作答'));

    // Jumps back to unanswered Question 1
    await waitFor(() => {
      expect(screen.getByText('1. 做事提不起劲或没有兴趣')).toBeDefined();
    });
    alertSpy.mockRestore();
  });

  it('renders slider seek bar with min/max labels, score display card, and records score', async () => {
    const mockSliderScale = {
      code: 'slider_test',
      title: '健康评估',
      subtitle: '生理状况',
      description: '评估疼痛及社会经济地位',
      instructions: '按实际情况作答',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'G27',
          text: 'G27. 请问你现在存在身体某部位的疼痛吗？（0为无痛，10为剧痛）',
          orderNum: 1,
          type: 'slider',
          min: 0,
          max: 10,
          step: 1,
          minLabel: '0分 无痛',
          maxLabel: '10分 剧痛',
          options: [],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockSliderScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="slider_test"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText(/G27. 请问你现在存在身体某部位的疼痛吗/)).toBeDefined();
    });

    // Check boundary labels and score display
    expect(screen.getByText('0分 无痛')).toBeDefined();
    expect(screen.getByText('10分 剧痛')).toBeDefined();
    expect(screen.getByText('当前选择分值')).toBeDefined();
    expect(screen.getByText('/ 10 分')).toBeDefined();

    // Find md-slider and simulate slider input
    const slider = document.querySelector('md-slider');
    expect(slider).toBeDefined();
    if (slider) {
      (slider as any).value = 7;
      fireEvent(slider, new Event('input', { bubbles: true, composed: true }));
    }

    // After setting slider score to 7, score display updates to 7
    await waitFor(() => {
      expect(screen.getByText('7')).toBeDefined();
    });

    // Verify "完成并提交" is enabled
    const submitBtn = await screen.findByText('完成并提交');
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
  });

  it('renders number input field with unit badge, min, max, and handles digit entry', async () => {
    const mockNumberScale = {
      code: 'number_test',
      title: '生活习惯评估',
      subtitle: '运动时间',
      description: '评估运动时长',
      instructions: '按实际情况作答',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'G24_1',
          text: 'G24.1 最近一个星期，你锻炼的时间总共大约多少小时？',
          orderNum: 1,
          type: 'number',
          min: 0,
          max: 100,
          step: 0.5,
          unit: '小时',
          placeholder: '例如：3.5',
          options: [],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockNumberScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="number_test"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText(/G24.1 最近一个星期/)).toBeDefined();
    });

    // Verify unit badge is rendered
    expect(screen.getByText('小时')).toBeDefined();

    // Find md-outlined-text-field and enter number
    const numField = document.querySelector('md-outlined-text-field[type="number"]');
    expect(numField).toBeDefined();
    if (numField) {
      (numField as any).value = '4.5';
      fireEvent(numField, new Event('input', { bubbles: true, composed: true }));
    }

    // Submit button should become enabled
    const submitBtn = await screen.findByText('完成并提交');
    await waitFor(() => {
      expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders date question with 3-column inputs and enables submission upon valid birth date', async () => {
    const mockDateScale = {
      code: 'date_test',
      title: '基本信息调查',
      subtitle: '人口学资料',
      description: '出生日期评估',
      instructions: '按实际情况作答',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'G2',
          field: 'birthday',
          text: 'G2. 出生日期：',
          orderNum: 1,
          type: 'date',
          icon: 'cake',
          options: [],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockDateScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="date_test"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('G2. 出生日期：')).toBeDefined();
    });

    const select = document.querySelector('md-outlined-select[label="月"]') as HTMLElement;
    const dayInput = document.querySelector('md-outlined-text-field[label="日"]') as HTMLElement;
    const yearInput = document.querySelector('md-outlined-text-field[label="年"]') as HTMLElement;

    expect(select).toBeDefined();
    expect(dayInput).toBeDefined();
    expect(yearInput).toBeDefined();

    const submitBtn = await screen.findByText('完成并提交');
    // Initially disabled
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(true);

    // Enter valid date: 2006-05-18
    (select as any).value = '5';
    fireEvent(select, new Event('change', { bubbles: true, cancelable: true }));

    (dayInput as any).value = '18';
    fireEvent(dayInput, new Event('input', { bubbles: true, cancelable: true }));

    (yearInput as any).value = '2006';
    fireEvent(yearInput, new Event('input', { bubbles: true, cancelable: true }));

    // Now submit button is enabled
    await waitFor(() => {
      expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders single-choice option with hasTextInput, expands text field, and suppresses auto-advance', async () => {
    const mockTextInputScale = {
      code: 'text_input_test',
      title: '医疗求助调查',
      subtitle: '既往史',
      description: '调查就诊及咨询情况',
      instructions: '按实际情况作答',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'ghq_22',
          text: '22. 过去任何时候您服过抗精神病药或抗抑郁药吗？',
          orderNum: 1,
          type: 'single_choice',
          options: [
            { value: 0, label: '否' },
            {
              value: 1,
              label: '是',
              hasTextInput: true,
              textInputPlaceholder: '请具体描述服用的药物名称或类型...',
              textInputLabel: '药物名称',
            },
          ],
        },
        {
          id: 'ghq_23',
          text: '23. 后续问题',
          orderNum: 2,
          type: 'single_choice',
          options: [
            { value: 0, label: '否' },
            { value: 1, label: '是' },
          ],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockTextInputScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="text_input_test"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('22. 过去任何时候您服过抗精神病药或抗抑郁药吗？')).toBeDefined();
    });

    // Click option "是" (which has hasTextInput: true)
    fireEvent.click(screen.getByText('是'));

    // Verify inline text input field expands
    await waitFor(() => {
      const inlineField = document.querySelector('md-outlined-text-field[label="药物名称"]');
      expect(inlineField).toBeDefined();
    });

    // Wait 300ms to ensure auto-advance is suppressed and does not advance to Q2 automatically
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(screen.getByText('22. 过去任何时候您服过抗精神病药或抗抑郁药吗？')).toBeDefined();

    // Type into the text field
    const inlineField = document.querySelector('md-outlined-text-field[label="药物名称"]');
    if (inlineField) {
      (inlineField as any).value = '氟西汀';
      fireEvent(inlineField, new Event('input', { bubbles: true, composed: true }));
    }

    // Now manually click "下一题"
    const nextBtn = screen.getByText('下一题');
    fireEvent.click(nextBtn);

    // Transitions to Question 2
    await waitFor(() => {
      expect(screen.getByText('23. 后续问题')).toBeDefined();
    });
  });

  it('renders multiple-choice question with checkboxes and allows multi-selection', async () => {
    const mockMultiScale = {
      code: 'multi_test',
      title: '锻炼调查',
      subtitle: '生活习惯',
      description: '锻炼方式调查',
      instructions: '按实际情况作答',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'G23',
          text: 'G23. 你主要的锻炼方式是？（可多选）',
          orderNum: 1,
          type: 'multiple_choice',
          options: [
            { value: 'running', label: '跑步' },
            { value: 'swimming', label: '游泳' },
            { value: 'walking', label: '走路 / 散步' },
          ],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockMultiScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="multi_test"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('G23. 你主要的锻炼方式是？（可多选）')).toBeDefined();
    });

    // Click "跑步" and "游泳"
    fireEvent.click(screen.getByText('跑步'));
    fireEvent.click(screen.getByText('游泳'));

    // Checkboxes should exist and submit button should be enabled
    const checkboxes = document.querySelectorAll('md-checkbox');
    expect(checkboxes.length).toBe(3);

    const submitBtn = await screen.findByText('完成并提交');
    await waitFor(() => {
      expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
    });
  });

  it('renders relevant icons in input fields such as phone icon for phone number field', async () => {
    const mockDemographicsScale = {
      code: 'demographics_survey',
      title: '个人基本信息核对',
      subtitle: '基本信息',
      description: '基本信息核对',
      instructions: '请如实填写',
      estimatedMinutes: 2,
      questions: [
        {
          id: 'demo_phone',
          text: '2. 联系电话：',
          orderNum: 1,
          type: 'text',
          icon: 'phone',
          placeholder: '11位手机号码',
          options: [],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockDemographicsScale as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="demographics_survey"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('2. 联系电话：')).toBeDefined();
    });

    // Check that leading icon has "phone"
    const textField = document.querySelector('md-outlined-text-field');
    expect(textField).toBeDefined();
    const leadingIcon = textField?.querySelector('md-icon[slot="leading-icon"]');
    expect(leadingIcon?.textContent).toBe('phone');
  });

  it('renders a separate choice button for question G17a instead of forcing user to input 0', async () => {
    const mockScaleWithG17a = {
      code: 'demographics_survey',
      title: '个人基本信息核对',
      subtitle: '基本信息',
      description: '基本信息核对',
      instructions: '请如实填写',
      estimatedMinutes: 2,
      questions: [
        {
          id: 'G17a',
          text: 'G17a. 你从多少岁开始每星期喝酒的？',
          orderNum: 1,
          type: 'number',
          icon: 'liquor',
          min: 0,
          max: 80,
          step: 1,
          unit: '岁',
          placeholder: '例如：16',
          zeroOptionLabel: '从未喝过酒',
          options: [],
        },
      ],
    };

    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(mockScaleWithG17a as any);

    render(
      <QuestionnairePlayerPage
        scaleCode="demographics_survey"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('G17a. 你从多少岁开始每星期喝酒的？')).toBeDefined();
    });

    // Check that separate button with "从未喝过酒" is displayed without outline, circle, icon, or subtitle, but with radio button
    const zeroOptionBtn = screen.getByTestId('zero-option-button');
    expect(zeroOptionBtn).toBeDefined();
    expect(screen.getByText('从未喝过酒')).toBeDefined();
    expect(screen.queryByText('若从未尝试过，点击此处可直接选择')).toBeNull();
    expect(zeroOptionBtn.querySelector('md-icon')).toBeNull();
    expect(zeroOptionBtn.querySelector('.rounded-full')).toBeNull();
    expect(zeroOptionBtn.closest('div')?.className).not.toContain('border');

    // Radio button is present to visually confirm selection, initially not checked
    const radio = zeroOptionBtn.querySelector('md-radio');
    expect(radio).toBeDefined();
    expect(radio?.getAttribute('checked')).toBeNull();
    expect(zeroOptionBtn.getAttribute('aria-pressed')).toBe('false');

    // Click "从未喝过酒"
    fireEvent.click(zeroOptionBtn);

    // Now radio should be checked and answer recorded as 0
    await waitFor(() => {
      expect(radio?.getAttribute('checked')).toBe('');
      expect(zeroOptionBtn.getAttribute('aria-pressed')).toBe('true');
    });

    // Outlined text field should show placeholder indicating zero option is selected
    const textField = document.querySelector('md-outlined-text-field');
    expect(textField?.getAttribute('placeholder')).toContain('从未喝过酒');
    expect(textField?.getAttribute('value')).toBe('');

    // If user enters an age, zero option button and radio should be deselected
    if (textField) {
      (textField as any).value = '18';
      fireEvent(textField, new Event('input', { bubbles: true, composed: true }));
    }

    await waitFor(() => {
      expect(radio?.getAttribute('checked')).toBeNull();
      expect(zeroOptionBtn.getAttribute('aria-pressed')).toBe('false');
    });

    // Tapping the zero button again selects 0 and deselects the text field value
    fireEvent.click(zeroOptionBtn);
    await waitFor(() => {
      expect(radio?.getAttribute('checked')).toBe('');
      expect(zeroOptionBtn.getAttribute('aria-pressed')).toBe('true');
    });
  });

  it('validates numeric bounds and displays error text when input is out of range', async () => {
    const numericScale = {
      code: 'demo_num',
      title: '数值测试',
      description: '测试数值边界',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'G2',
          text: '您的实际年龄',
          orderNum: 1,
          type: 'number',
          min: 10,
          max: 100,
          unit: '岁',
          options: [],
        },
      ],
    };
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(numericScale);

    render(
      <QuestionnairePlayerPage
        scaleCode="demo_num"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    // Dismiss intro page if shown
    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('您的实际年龄')).toBeDefined();
    });

    const textField = document.querySelector('md-outlined-text-field')!;
    expect(textField).toBeDefined();

    // Input out-of-range value (5 < 10)
    (textField as any).value = '5';
    fireEvent(textField, new Event('input', { bubbles: true, composed: true }));

    await waitFor(() => {
      expect(textField.getAttribute('error-text')).toBe('输入数值不能小于 10');
    });

    // Next button / submit button should be disabled
    const submitBtn = screen.getByText('完成并提交');
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(true);

    // Input valid value (18)
    (textField as any).value = '18';
    fireEvent(textField, new Event('input', { bubbles: true, composed: true }));

    await waitFor(() => {
      expect(textField.getAttribute('error-text')).toBeNull();
    });
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
  });

  it('validates demographic National ID checksum and displays error on invalid check code', async () => {
    const idCardScale = {
      code: 'demo_id',
      title: '身份信息',
      description: '测试身份证核验',
      estimatedMinutes: 1,
      questions: [
        {
          id: 'demo_id_card',
          field: 'id_card',
          text: '请输入18位二代身份证号码',
          orderNum: 1,
          type: 'text',
          options: [],
        },
      ],
    };
    vi.spyOn(intakeApi, 'getScaleDetail').mockResolvedValue(idCardScale);

    render(
      <QuestionnairePlayerPage
        scaleCode="demo_id"
        studentNumber="8209220532"
        onClose={vi.fn()}
      />
    );

    // Dismiss intro page if shown
    await waitFor(() => {
      expect(screen.getByText('开始作答')).toBeDefined();
    });
    fireEvent.click(screen.getByText('开始作答'));

    await waitFor(() => {
      expect(screen.getByText('请输入18位二代身份证号码')).toBeDefined();
    });

    const textField = document.querySelector('md-outlined-text-field')!;

    // Input ID with invalid check code (79 instead of 75)
    (textField as any).value = '110101199003072379';
    fireEvent(textField, new Event('input', { bubbles: true, composed: true }));

    await waitFor(() => {
      expect(textField.getAttribute('error-text')).toContain('身份证校验码错误');
    });

    const submitBtn = screen.getByText('完成并提交');
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(true);

    // Input valid ID card (75)
    (textField as any).value = '110101199003072375';
    fireEvent(textField, new Event('input', { bubbles: true, composed: true }));

    await waitFor(() => {
      expect(textField.getAttribute('error-text')).toBeNull();
    });
    expect(submitBtn.closest('md-filled-button')?.hasAttribute('disabled')).toBe(false);
  });
});


