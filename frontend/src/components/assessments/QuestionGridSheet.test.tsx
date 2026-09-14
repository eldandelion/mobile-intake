import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionGridSheet } from './QuestionGridSheet';
import type { ScaleQuestion } from '../../api/intakeApi';

describe('QuestionGridSheet', () => {
  const mockQuestions: ScaleQuestion[] = [
    {
      id: 'q1',
      text: '题目一',
      orderNum: 1,
      type: 'single_choice',
      options: [
        { value: 0, label: '无' },
        { value: 1, label: '轻度' },
      ],
    },
    {
      id: 'q2',
      text: '题目二',
      orderNum: 2,
      type: 'single_choice',
      options: [
        { value: 0, label: '无' },
        { value: 1, label: '轻度' },
      ],
    },
    {
      id: 'q3',
      text: '题目三',
      orderNum: 3,
      type: 'single_choice',
      options: [
        { value: 0, label: '无' },
        { value: 1, label: '轻度' },
      ],
    },
    {
      id: 'q4',
      text: '题目四',
      orderNum: 4,
      type: 'single_choice',
      options: [
        { value: 0, label: '无' },
        { value: 1, label: '轻度' },
      ],
    },
  ];

  it('does not render content when isOpen is false', () => {
    render(
      <QuestionGridSheet
        isOpen={false}
        totalQuestions={4}
        currentIndex={0}
        answers={{}}
        questions={mockQuestions}
        onSelectQuestion={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('题目列表')).toBeNull();
  });

  it('renders title, progress counter, legend, and all question buttons when isOpen is true', () => {
    render(
      <QuestionGridSheet
        isOpen={true}
        totalQuestions={4}
        currentIndex={1} // question 2 is current
        answers={{ q1: 1, q3: 0 }} // questions 1 and 3 are answered
        questions={mockQuestions}
        onSelectQuestion={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('题目列表')).toBeDefined();
    expect(screen.getByText(/已作答/)).toBeDefined();
    expect(screen.getByText(/4\s*题/)).toBeDefined();
    expect(screen.getByText('当前')).toBeDefined();
    expect(screen.getByText('已完成')).toBeDefined();
    expect(screen.getByText('未完成')).toBeDefined();

    // Verify 4 question buttons
    const btn1 = screen.getByLabelText(/跳转至第 1 题（已作答）/);
    const btn2 = screen.getByLabelText(/跳转至第 2 题（当前作答中）/);
    const btn3 = screen.getByLabelText(/跳转至第 3 题（已作答）/);
    const btn4 = screen.getByLabelText(/跳转至第 4 题（未作答）/);

    expect(btn1).toBeDefined();
    expect(btn2).toBeDefined();
    expect(btn3).toBeDefined();
    expect(btn4).toBeDefined();
  });

  it('calls onSelectQuestion when a question button is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <QuestionGridSheet
        isOpen={true}
        totalQuestions={4}
        currentIndex={0}
        answers={{}}
        questions={mockQuestions}
        onSelectQuestion={handleSelect}
        onClose={vi.fn()}
      />
    );

    const btn3 = screen.getByLabelText(/跳转至第 3 题/);
    fireEvent.click(btn3);
    expect(handleSelect).toHaveBeenCalledWith(2); // 0-indexed
  });

  it('calls onClose when backdrop scrim is clicked or Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <QuestionGridSheet
        isOpen={true}
        totalQuestions={4}
        currentIndex={0}
        answers={{}}
        questions={mockQuestions}
        onSelectQuestion={vi.fn()}
        onClose={handleClose}
      />
    );

    // Click backdrop scrim
    const scrim = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(scrim);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Test Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
