import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthPage } from './AuthPage';
import { AuthProvider } from '../contexts/AuthContext';
import { intakeApi } from '../api/intakeApi';

// Helper to simulate input on Material Web custom elements in jsdom
function simulateInput(element: Element, value: string) {
  act(() => {
    (element as any).value = value;
    fireEvent(element, new Event('input', { bubbles: true, composed: true }));
  });
}

describe('AuthPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders login screen by default with CSU branding and clean layout', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // CSU Brand Header
    expect(screen.getByText('CSU')).toBeDefined();
    expect(screen.getByText('中南大学 · 心理健康教育与咨询中心')).toBeDefined();
    expect(screen.getByText('新生心理普查与档案采集')).toBeDefined();

    // No unnecessary subtitles
    expect(screen.queryByText(/仅需30秒/)).toBeNull();

    // Login inputs
    expect(document.querySelector('md-outlined-text-field[label="学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="登录密码"]')).not.toBeNull();
    expect(screen.getByText('立即登录')).toBeDefined();
    expect(screen.getByText('新同学登记 / 首次使用？立即建档')).toBeDefined();
  });

  it('validates empty login inputs on submit', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const loginBtn = screen.getByText('立即登录');
    fireEvent.click(loginBtn);

    expect(document.querySelector('md-outlined-text-field[error-text="请输入您的学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[error-text="请输入密码"]')).not.toBeNull();
  });

  it('navigates to register step 1 and validates empty inputs', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // Click link to registration sequence
    fireEvent.click(screen.getByText('新同学登记 / 首次使用？立即建档'));

    // Step 1 Header
    expect(screen.getByText('第 1 / 3 步')).toBeDefined();
    expect(screen.getByText('填写基本信息')).toBeDefined();
    expect(document.querySelector('md-outlined-text-field[label="真实姓名"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="手机号码"]')).not.toBeNull();

    // Attempt next with empty fields
    const nextBtn = screen.getByText('下一步：获取验证码');
    fireEvent.click(nextBtn);

    expect(document.querySelector('md-outlined-text-field[error-text="请输入您的真实姓名"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[error-text="请输入您的学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[error-text="请输入正确的11位手机号码"]')).not.toBeNull();
  });

  it('progresses to step 2, shows entered phone number, and supports modifying phone', async () => {
    const sendCodeSpy = vi.spyOn(intakeApi, 'sendCode').mockResolvedValue({
      phone: '13800138000',
      devCode: '123456',
      expiresInSeconds: 60,
    });

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('新同学登记 / 首次使用？立即建档'));

    // Fill Step 1
    const nameField = document.querySelector('md-outlined-text-field[label="真实姓名"]')!;
    const numberField = document.querySelector('md-outlined-text-field[label="学号"]')!;
    const phoneField = document.querySelector('md-outlined-text-field[label="手机号码"]')!;

    simulateInput(nameField, '李四');
    simulateInput(numberField, '2026002');
    simulateInput(phoneField, '13800138000');

    fireEvent.click(screen.getByText('下一步：获取验证码'));

    await waitFor(() => {
      expect(sendCodeSpy).toHaveBeenCalledWith('13800138000');
    });

    // Step 2 Screen
    expect(screen.getByText('第 2 / 3 步')).toBeDefined();
    expect(screen.getByText('输入短信验证码')).toBeDefined();
    expect(screen.getByText('13800138000')).toBeDefined();
    expect(screen.getByText(/已发送至/)).toBeDefined();
    expect(document.querySelector('md-outlined-text-field[label="6 位短信验证码"]')).not.toBeNull();

    // Click "修改号码"
    fireEvent.click(screen.getByText('修改号码'));

    // Should return to Step 1 with preserved values
    expect(screen.getByText('第 1 / 3 步')).toBeDefined();
    expect(document.querySelector('md-outlined-text-field[label="真实姓名"]')?.getAttribute('value')).toBe('李四');
  });

  it('progresses through step 2 to step 3 and validates password matching', async () => {
    vi.spyOn(intakeApi, 'sendCode').mockResolvedValue({
      phone: '13900139000',
      devCode: '123456',
      expiresInSeconds: 60,
    });
    const verifyCodeSpy = vi.spyOn(intakeApi, 'verifyCode').mockResolvedValue({
      valid: true,
    });

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('新同学登记 / 首次使用？立即建档'));

    // Step 1
    simulateInput(document.querySelector('md-outlined-text-field[label="真实姓名"]')!, '王五');
    simulateInput(document.querySelector('md-outlined-text-field[label="学号"]')!, '2026003');
    simulateInput(document.querySelector('md-outlined-text-field[label="手机号码"]')!, '13900139000');
    fireEvent.click(screen.getByText('下一步：获取验证码'));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('输入短信验证码')).toBeDefined();
    });

    const codeField = document.querySelector('md-outlined-text-field[label="6 位短信验证码"]')!;
    simulateInput(codeField, '123456');
    fireEvent.click(screen.getByText('下一步：设置密码'));

    await waitFor(() => {
      expect(verifyCodeSpy).toHaveBeenCalledWith('13900139000', '123456');
    });

    // Step 3 Screen
    expect(screen.getByText('第 3 / 3 步')).toBeDefined();
    expect(screen.getByText('设置账户登录密码')).toBeDefined();

    const pwdField = document.querySelector('md-outlined-text-field[label="登录密码"]')!;
    const confirmPwdField = document.querySelector('md-outlined-text-field[label="确认新密码"]')!;

    // Test mismatched passwords
    simulateInput(pwdField, 'abcdef');
    simulateInput(confirmPwdField, 'xyz123');
    fireEvent.click(screen.getByText('完成建档并进入'));

    expect(document.querySelector('md-outlined-text-field[error-text="两次输入的密码不一致"]')).not.toBeNull();
  });

  it('supports back navigation through arrow back button', async () => {
    vi.spyOn(intakeApi, 'sendCode').mockResolvedValue({
      phone: '13812345678',
      devCode: '123456',
      expiresInSeconds: 60,
    });

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // From Login -> Step 1
    fireEvent.click(screen.getByText('新同学登记 / 首次使用？立即建档'));
    expect(screen.getByText('第 1 / 3 步')).toBeDefined();

    // From Step 1 -> Back to Login
    const backBtn = screen.getByLabelText('返回上一步');
    fireEvent.click(backBtn);
    expect(screen.getByText('立即登录')).toBeDefined();
  });
});
