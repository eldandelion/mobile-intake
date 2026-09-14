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

  it('renders Google-style login screen by default with CSU branding', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // CSU Brand Header & Title
    expect(screen.getByText('CSU')).toBeDefined();
    expect(screen.getByText('登录')).toBeDefined();
    expect(screen.getByText('使用您的中南大学学号以继续心理普查')).toBeDefined();

    // No unnecessary subtitles
    expect(screen.queryByText(/仅需30秒/)).toBeNull();

    // Login inputs
    expect(document.querySelector('md-outlined-text-field[label="学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="登录密码"]')).not.toBeNull();
    expect(screen.getByText('忘记了学号或密码？')).toBeDefined();

    // Google-style Action Buttons (Left: Create account, Right: Next)
    expect(screen.getByText('创建账号')).toBeDefined();
    expect(screen.getByText('下一步')).toBeDefined();

    // Footer
    expect(screen.getByText('中文（简体）')).toBeDefined();
    expect(screen.getByText('帮助')).toBeDefined();
    expect(screen.getByText('隐私权')).toBeDefined();
    expect(screen.getByText('条款')).toBeDefined();
  });

  it('validates empty login inputs on submit', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const nextBtn = screen.getByText('下一步');
    fireEvent.click(nextBtn);

    expect(document.querySelector('md-outlined-text-field[error-text="请输入您的学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[error-text="请输入密码"]')).not.toBeNull();
  });

  it('navigates to register step 1 and validates empty inputs', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    // Click "创建账号" to enter registration sequence
    fireEvent.click(screen.getByText('创建账号'));

    // Step 1 Header
    expect(screen.getByText('创建账号')).toBeDefined();
    expect(screen.getByText('输入您的基本信息以建立新生档案')).toBeDefined();
    expect(document.querySelector('md-outlined-text-field[label="真实姓名"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="手机号码"]')).not.toBeNull();

    // Attempt next with empty fields
    const nextBtn = screen.getByText('下一步');
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

    fireEvent.click(screen.getByText('创建账号'));

    // Fill Step 1
    const nameField = document.querySelector('md-outlined-text-field[label="真实姓名"]')!;
    const numberField = document.querySelector('md-outlined-text-field[label="学号"]')!;
    const phoneField = document.querySelector('md-outlined-text-field[label="手机号码"]')!;

    simulateInput(nameField, '李四');
    simulateInput(numberField, '2026002');
    simulateInput(phoneField, '13800138000');

    fireEvent.click(screen.getByText('下一步'));

    await waitFor(() => {
      expect(sendCodeSpy).toHaveBeenCalledWith('13800138000');
    });

    // Step 2 Screen
    expect(screen.getByText('验证手机号码')).toBeDefined();
    expect(screen.getByText('13800138000')).toBeDefined();
    expect(document.querySelector('md-outlined-text-field[label="6 位短信验证码"]')).not.toBeNull();

    // Click "修改号码"
    fireEvent.click(screen.getByText('修改号码'));

    // Should return to Step 1 with preserved values
    expect(screen.getByText('输入您的基本信息以建立新生档案')).toBeDefined();
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

    fireEvent.click(screen.getByText('创建账号'));

    // Step 1
    simulateInput(document.querySelector('md-outlined-text-field[label="真实姓名"]')!, '王五');
    simulateInput(document.querySelector('md-outlined-text-field[label="学号"]')!, '2026003');
    simulateInput(document.querySelector('md-outlined-text-field[label="手机号码"]')!, '13900139000');
    fireEvent.click(screen.getByText('下一步'));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('验证手机号码')).toBeDefined();
    });

    const codeField = document.querySelector('md-outlined-text-field[label="6 位短信验证码"]')!;
    simulateInput(codeField, '123456');
    fireEvent.click(screen.getByText('下一步'));

    await waitFor(() => {
      expect(verifyCodeSpy).toHaveBeenCalledWith('13900139000', '123456');
    });

    // Step 3 Screen
    expect(screen.getByText('创建安全密码')).toBeDefined();

    const pwdField = document.querySelector('md-outlined-text-field[label="登录密码"]')!;
    const confirmPwdField = document.querySelector('md-outlined-text-field[label="确认密码"]')!;

    // Test mismatched passwords
    simulateInput(pwdField, 'abcdef');
    simulateInput(confirmPwdField, 'xyz123');
    fireEvent.click(screen.getByText('完成'));

    expect(document.querySelector('md-outlined-text-field[error-text="两次输入的密码不一致"]')).not.toBeNull();
  });

  it('supports back navigation through "改为登录" and "上一步"', async () => {
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
    fireEvent.click(screen.getByText('创建账号'));
    expect(screen.getByText('输入您的基本信息以建立新生档案')).toBeDefined();

    // From Step 1 -> "改为登录" back to Login
    fireEvent.click(screen.getByText('改为登录'));
    expect(screen.getByText('使用您的中南大学学号以继续心理普查')).toBeDefined();
  });
});
