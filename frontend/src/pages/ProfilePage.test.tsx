import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfilePage } from './ProfilePage';
import { AuthProvider } from '../contexts/AuthContext';
import { intakeApi, tokenStorage } from '../api/intakeApi';

describe('ProfilePage', () => {
  beforeEach(() => {
    tokenStorage.set('test-token');
    vi.spyOn(intakeApi, 'getMe').mockResolvedValue({
      studentNumber: '8209220532',
      fullName: '李同学',
      phone: '13812345678',
      registeredAt: '2026-09-01T10:00:00',
    });
    vi.spyOn(intakeApi, 'getScales').mockResolvedValue([
      {
        code: 'phq_9',
        title: 'PHQ-9 抑郁健康问卷',
        description: '评估情绪',
        questionCount: 9,
        estimatedMinutes: 2,
        status: 'COMPLETED',
      },
    ]);
    vi.spyOn(intakeApi, 'getMyProfile').mockResolvedValue({
      studentNumber: '8209220532',
      fullName: '李同学',
      phone: '13812345678',
      registeredAt: '2026-09-01T10:00:00',
      isDemographicsSubmitted: true,
      demographics: {
        isSubmitted: true,
        gender: '男',
        ethnicity: '汉族',
        major: '软件工程',
        birthday: '2001-02-05',
        idCardNumber: '110101200102051234',
        email: 'student@csu.edu.cn',
        homeAddress: '湖南省长沙市岳麓区',
      },
    });
    vi.spyOn(intakeApi, 'getSubmission').mockResolvedValue({
      scaleCode: 'demographics_survey',
      status: 'COMPLETED',
      completedAt: '2026-09-01T10:00:00',
      answers: {
        demo_gender: 1,
        demo_id_card: '110101200102051234',
        demo_email: 'student@csu.edu.cn',
        demo_major: '软件工程',
        demo_home_address: '湖南省长沙市岳麓区',
      },
    });
  });

  it('renders personal info list layout, statement card, and bottom logout button', async () => {
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('个人信息')).toBeDefined();
      expect(screen.getByText('李同学')).toBeDefined();
    });

    // Check list headers and values
    expect(screen.getByText('个人资料照片')).toBeDefined();
    expect(screen.getByText('姓名')).toBeDefined();
    expect(screen.getByText('学号')).toBeDefined();
    expect(screen.getByText('8209220532')).toBeDefined();
    expect(screen.getByText('性别')).toBeDefined();
    expect(screen.getByText('男')).toBeDefined();
    expect(screen.getByText('民族')).toBeDefined();
    expect(screen.getByText('汉族')).toBeDefined();
    expect(screen.getByText('电话')).toBeDefined();
    expect(screen.getByText('13812345678')).toBeDefined();
    expect(screen.getByText('邮箱')).toBeDefined();
    expect(screen.getByText('student@csu.edu.cn')).toBeDefined();
    expect(screen.getByText('生日')).toBeDefined();
    expect(screen.getByText('2001年2月5日')).toBeDefined();
    expect(screen.getByText('院系专业')).toBeDefined();
    expect(screen.getByText('软件工程')).toBeDefined();
    expect(screen.getByText('住址')).toBeDefined();
    expect(screen.getByText('湖南省长沙市岳麓区')).toBeDefined();

    // Checklist remains removed
    expect(screen.queryByText('普查任务清单')).toBeNull();

    // Info card and logout action
    expect(screen.getByText('医疗与数据安全须知')).toBeDefined();
    expect(screen.getByText('退出登录')).toBeDefined();
  });
});
