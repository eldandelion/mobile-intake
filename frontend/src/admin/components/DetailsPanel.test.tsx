import { render, screen, fireEvent, cleanup, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  DetailsPanel,
  CollapsibleHeader,
  useScrollCollapse,
  ScrollableDetailsLayout,
} from './DetailsPanel';
import { AdminStudentDetailDto } from '../api/adminApi';

afterEach(() => {
  cleanup();
});

const mockStudent: AdminStudentDetailDto = {
  studentNumber: '20260001',
  fullName: '张三',
  phone: '13800138000',
  registeredAt: '2026-09-01T08:00:00Z',
  demographics: {
    major: '临床医学八年制',
    gender: '男',
    ethnicity: '汉族',
    idCardNumber: '110101200601011234',
    emergencyContactName: '张父',
    emergencyContactPhone: '13900139000',
    counselorName: '李老师',
  },
  scaleStatuses: [
    { scaleCode: 'phq_9', title: '抑郁症筛查量表 (PHQ-9)', status: 'COMPLETED' },
    { scaleCode: 'gad_7', title: '广泛性焦虑量表 (GAD-7)', status: 'IN_PROGRESS' },
  ],
};

describe('DetailsPanel Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DetailsPanel
        isOpen={false}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders student identity header matching StudentDetailsView', () => {
    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );

    // Outer panel title
    expect(screen.getByText('学生档案详情')).toBeDefined();

    // Top identity header
    expect(screen.getByText('张三')).toBeDefined();
    expect(screen.getByText('20260001')).toBeDefined();
    // Major is displayed in demographic card only (removed from header subtitle)
    expect(screen.getAllByText('临床医学八年制').length).toBe(1);
    expect(screen.getByText('测评进行中')).toBeDefined();

    // Avatar with first character
    const avatar = screen.getByText('张');
    expect(avatar).toBeDefined();
    expect(avatar.className).toContain('w-16');
    expect(avatar.className).toContain('h-16');
  });

  it('shows 全部完成 badge when all scales are completed', () => {
    const completedStudent: AdminStudentDetailDto = {
      ...mockStudent,
      scaleStatuses: [
        { scaleCode: 'phq_9', title: 'PHQ-9', status: 'COMPLETED' },
        { scaleCode: 'gad_7', title: 'GAD-7', status: 'COMPLETED' },
      ],
    };

    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={completedStudent}
      />
    );

    expect(screen.getByText('全部完成')).toBeDefined();
  });

  it('renders student demographics cards and scale progress with clean unstarted state', () => {
    const studentWithUnstarted: AdminStudentDetailDto = {
      ...mockStudent,
      scaleStatuses: [
        { scaleCode: 'phq_9', title: '抑郁症筛查量表 (PHQ-9)', status: 'COMPLETED' },
        { scaleCode: 'gad_7', title: '广泛性焦虑量表 (GAD-7)', status: 'IN_PROGRESS' },
        { scaleCode: 'scl_90', title: '症状自评量表 (SCL-90)', status: 'NOT_STARTED' },
      ],
    };

    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={studentWithUnstarted}
      />
    );

    // Demographics
    expect(screen.getByText('学生基本档案 (ACL)')).toBeDefined();
    expect(screen.getByText('110101200601011234')).toBeDefined();
    expect(screen.getByText('李老师')).toBeDefined();
    expect(screen.getByText('张父 (13900139000)')).toBeDefined();

    // Scale statuses: no enum subtitles (phq_9, gad_7, scl_90)
    expect(screen.getByText('问卷测评填报动态')).toBeDefined();
    expect(screen.queryByText('phq_9')).toBeNull();
    expect(screen.queryByText('gad_7')).toBeNull();
    expect(screen.queryByText('scl_90')).toBeNull();

    expect(screen.getByText('抑郁症筛查量表 (PHQ-9)')).toBeDefined();
    expect(screen.getByText('已完成提交')).toBeDefined();
    expect(screen.getByText('广泛性焦虑量表 (GAD-7)')).toBeDefined();
    expect(screen.getByText('正在作答')).toBeDefined();
    expect(screen.getByText('症状自评量表 (SCL-90)')).toBeDefined();
    expect(screen.getByText('未开始')).toBeDefined();
  });

  it('ensures no horizontal separation lines exist in DetailsSection or outer header', () => {
    const { container } = render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );

    // Verify outer panel header does not have border-b
    const outerHeader = container.querySelector('.px-4.py-3');
    expect(outerHeader?.className).not.toContain('border-b');

    // Verify DetailsSection has no border-t
    const sections = container.querySelectorAll('.flex.flex-col.gap-3\\.5');
    expect(sections.length).toBeGreaterThan(0);
    sections.forEach((section) => {
      expect(section.className).not.toContain('border-t');
      expect(section.className).not.toContain('border-b');
    });
  });

  it('renders fixed ActionFooter and handles password reset & delete student actions', () => {
    const onResetPassword = vi.fn();
    const onDeleteStudent = vi.fn();

    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        onResetPassword={onResetPassword}
        onDeleteStudent={onDeleteStudent}
      />
    );

    // Buttons rendered in footer
    const resetBtn = screen.getByText('重置密码');
    expect(resetBtn).toBeDefined();

    fireEvent.click(resetBtn);
    expect(onResetPassword).toHaveBeenCalledWith('20260001', '张三');

    const deleteBtn = screen.getByText('删除账号');
    expect(deleteBtn).toBeDefined();

    fireEvent.click(deleteBtn);
    expect(onDeleteStudent).toHaveBeenCalledWith('20260001', '张三');
  });

  it('handles panel close trigger', () => {
    const onClose = vi.fn();
    render(
      <DetailsPanel
        isOpen={true}
        onClose={onClose}
        student={mockStudent}
      />
    );

    const closeBtn = screen.getByTitle('关闭');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('opens FullScreenView when expand button is clicked', () => {
    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );

    const expandBtn = screen.getByTitle('全屏查看');
    fireEvent.click(expandBtn);

    // Full screen view opens with arrow_back button
    expect(screen.getByLabelText('返回')).toBeDefined();
  });

  it('updates pinned outer header title to student name when scrolling down and restores on scroll back', async () => {
    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );

    // Initial title
    expect(screen.getByText('学生档案详情')).toBeDefined();

    const scrollContainer = screen.getByTestId('details-scroll-container');

    // Scroll down past threshold (20px)
    await act(async () => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 50 } });
      await new Promise((r) => setTimeout(r, 350));
    });

    // Pinned header title should now show the student's name
    expect(screen.getAllByText('张三').length).toBeGreaterThanOrEqual(1);

    // Scroll back to top
    await act(async () => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 0 } });
      await new Promise((r) => setTimeout(r, 350));
    });

    // Pinned header title restores to '学生档案详情'
    expect(screen.getByText('学生档案详情')).toBeDefined();
  });

  it('places the header at the top of the scroll container to lead the scroll stream without overlapping', () => {
    render(
      <DetailsPanel
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
      />
    );

    const headerSection = screen.getByTestId('details-header-section');
    const scrollContainer = screen.getByTestId('details-scroll-container');

    expect(headerSection).toBeDefined();
    expect(scrollContainer).toBeDefined();

    // Verify the header is inside the scroll container at the very top
    expect(scrollContainer.contains(headerSection)).toBe(true);
    expect(scrollContainer.firstElementChild).toBe(headerSection);
  });

  it('handles scrolling with useScrollCollapse and CollapsibleHeader', async () => {
    const ScrollWrapper = () => {
      const { isScrolled, handleScroll } = useScrollCollapse(20);
      return (
        <div data-testid="scroll-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100px' }}>
          <CollapsibleHeader visible={!isScrolled}>
            <div data-testid="header-content">Header</div>
          </CollapsibleHeader>
          <div style={{ height: '500px' }}>Content</div>
        </div>
      );
    };

    render(<ScrollWrapper />);

    const container = screen.getByTestId('scroll-container');
    expect(screen.getByTestId('header-content')).toBeDefined();

    await act(async () => {
      fireEvent.scroll(container, { target: { scrollTop: 50 } });
      await new Promise((r) => setTimeout(r, 350));
    });
  });

  it('tracks scroll threshold in useScrollCollapse hook', () => {
    const { result } = renderHook(() => useScrollCollapse(20));

    expect(result.current.isScrolled).toBe(false);

    act(() => {
      result.current.handleScroll({
        currentTarget: { scrollTop: 30 },
      } as React.UIEvent<HTMLElement>);
    });

    expect(result.current.isScrolled).toBe(true);

    act(() => {
      result.current.handleScroll({
        currentTarget: { scrollTop: 10 },
      } as React.UIEvent<HTMLElement>);
    });

    expect(result.current.isScrolled).toBe(false);
  });

  it('renders ScrollableDetailsLayout with pinned header, content, and footer', () => {
    render(
      <ScrollableDetailsLayout
        header={<div data-testid="layout-header">Header</div>}
        footer={<div data-testid="layout-footer">Footer</div>}
        title="Dynamic Title"
      >
        <div>Main Content</div>
      </ScrollableDetailsLayout>
    );

    expect(screen.getByTestId('layout-header')).toBeDefined();
    expect(screen.getByTestId('layout-footer')).toBeDefined();
    expect(screen.getByText('Main Content')).toBeDefined();
  });
});
