import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { intakeApi } from '../api/intakeApi';
import { PrimaryButton } from '../components/common/Buttons';
import { Snackbar } from '../components/common/Snackbar';

type AuthView = 'login' | 'register_step1' | 'register_step2' | 'register_step3';

export function translateAuthError(msg?: string): string {
  if (!msg) return '登录失败，请核对学号与密码';
  const lower = msg.toLowerCase().trim();
  if (
    lower.includes('invalid credential') ||
    lower.includes('invalid_credential') ||
    lower === 'unauthorized' ||
    lower.includes('bad credentials')
  ) {
    return '学号或密码错误，请重新输入';
  }
  if (lower.includes('not found') || lower.includes('student not found')) {
    return '该学号尚未登记，请先创建账号';
  }
  if (lower.includes('phone') && (lower.includes('already') || lower.includes('registered') || lower.includes('duplicate'))) {
    return '该手机号码已被注册';
  }
  if (lower.includes('already registered') || lower.includes('conflict')) {
    return '该学号已被注册';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return '网络连接异常，请稍后重试';
  }
  return msg;
}

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  // Login form state
  const [loginStudentNumber, setLoginStudentNumber] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration wizard state (preserved across back and forward steps)
  const [regFullName, setRegFullName] = useState('');
  const [regStudentNumber, setRegStudentNumber] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // SMS countdown timer
  const [countdown, setCountdown] = useState(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showAuthError = (rawError?: string, defaultMsg = '操作失败，请重试') => {
    const translated = translateAuthError(rawError || defaultMsg);
    setSnackbarMessage(translated);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSnackbarOpen(false);
    const errors: Record<string, string> = {};

    const cleanNum = loginStudentNumber.trim();
    if (!cleanNum) {
      errors.loginStudentNumber = '请输入您的学号';
    }
    if (!loginPassword) {
      errors.loginPassword = '请输入密码';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login({
        identifier: cleanNum,
        studentNumber: cleanNum,
        password: loginPassword,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      showAuthError(err.message, '学号或密码错误，请重新输入');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register Step 1 -> Send Code & Go to Step 2
  const handleStep1Next = async () => {
    setSnackbarOpen(false);
    const errors: Record<string, string> = {};

    const cleanName = regFullName.trim();
    const cleanNum = regStudentNumber.trim();
    const cleanPhone = regPhone.trim();

    if (!cleanName) {
      errors.regFullName = '请输入您的真实姓名';
    }
    if (!cleanNum) {
      errors.regStudentNumber = '请输入您的学号';
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      errors.regPhone = '请输入正确的11位手机号码';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await intakeApi.sendCode(cleanPhone);
      startCountdown();
      setView('register_step2');
    } catch (err: any) {
      console.error('Send code error:', err);
      showAuthError(err.message, '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler in Step 2
  const handleResendCode = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setSnackbarOpen(false);
    try {
      await intakeApi.sendCode(regPhone.trim());
      startCountdown();
    } catch (err: any) {
      console.error('Resend code error:', err);
      showAuthError(err.message, '重新获取验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Register Step 2 -> Verify Code & Go to Step 3
  const handleStep2Next = async () => {
    setSnackbarOpen(false);
    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setFieldErrors({ verificationCode: '请输入收到的验证码' });
      return;
    }

    setLoading(true);
    try {
      const res = await intakeApi.verifyCode(regPhone.trim(), cleanCode);
      if (!res.valid) {
        setFieldErrors({ verificationCode: '验证码不正确，请重新核对' });
        setLoading(false);
        return;
      }
      setView('register_step3');
    } catch (err: any) {
      console.error('Verify code error:', err);
      showAuthError(err.message, '验证码校验失败');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Register Step 3 -> Final Register Submit
  const handleStep3Submit = async () => {
    setSnackbarOpen(false);
    const errors: Record<string, string> = {};

    if (!regPassword || regPassword.length < 6) {
      errors.regPassword = '密码至少需要 6 位字符';
    }
    if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = '两次输入的密码不一致';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await register({
        studentNumber: regStudentNumber.trim(),
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      showAuthError(err.message, '登记建档失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Shared Brand Logo Header matching Google top-left logo placement, using theme color
  const renderLogo = () => (
    <div className="mb-6 select-none">
      <span className="text-[34px] font-extrabold text-[var(--md-sys-color-primary)] tracking-tight font-sans">
        CSU
      </span>
    </div>
  );

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] flex flex-col items-center px-6 py-8 sm:py-12">
      {/* Top indeterminate progress bar during network requests */}
      <div className="h-1 w-full fixed top-0 left-0 z-50">
        {loading && (
          <md-linear-progress
            indeterminate
            style={{ width: '100%', '--md-linear-progress-track-height': '3px' } as any}
          />
        )}
      </div>

      <div className="w-full max-w-[440px] flex-1 flex flex-col">
        {/* Main Body */}
        <div className="flex flex-col">
          {renderLogo()}

          {/* ==================== VIEW 1: 登录 (Sign in) ==================== */}
          {view === 'login' && (
            <div className="flex flex-col">
              <h1 className="text-[32px] sm:text-[36px] font-normal leading-[40px] sm:leading-[44px] text-[var(--md-sys-color-on-surface)] tracking-tight">
                登录
              </h1>
              <p className="text-[15px] sm:text-[16px] leading-[24px] text-[var(--md-sys-color-on-surface-variant)] mt-3 mb-8 font-normal">
                使用您的中南大学学号以继续心理普查
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div>
                  <md-outlined-text-field
                    label="学号"
                    value={loginStudentNumber}
                    required
                    className="w-full"
                    error={!!fieldErrors.loginStudentNumber}
                    error-text={fieldErrors.loginStudentNumber}
                    onInput={(e: any) => {
                      setLoginStudentNumber(e.target.value);
                      clearFieldError('loginStudentNumber');
                    }}
                  />
                </div>

                <div>
                  <md-outlined-text-field
                    label="登录密码"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    required
                    className="w-full"
                    error={!!fieldErrors.loginPassword}
                    error-text={fieldErrors.loginPassword}
                    onInput={(e: any) => {
                      setLoginPassword(e.target.value);
                      clearFieldError('loginPassword');
                    }}
                  >
                    <md-icon-button
                      type="button"
                      slot="trailing-icon"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                    >
                      <md-icon>{showLoginPassword ? 'visibility_off' : 'visibility'}</md-icon>
                    </md-icon-button>
                  </md-outlined-text-field>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => alert('请联系校区辅导员或心理健康中心管理员协助找回学号与密码。')}
                    className="text-[14px] font-medium text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    忘记了学号或密码？
                  </button>
                </div>

                {/* Action Row: Left: Create account, Right: Next */}
                <div className="flex items-center justify-between mt-10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSnackbarOpen(false);
                      setFieldErrors({});
                      setView('register_step1');
                    }}
                    className="text-[var(--md-sys-color-primary)] text-[14px] font-medium hover:bg-[var(--md-sys-color-primary)]/10 px-4 py-2.5 rounded-full transition-colors"
                  >
                    创建账号
                  </button>

                  <PrimaryButton
                    label={loading ? '登录中...' : '下一步'}
                    disabled={loading}
                    onClick={() => handleLoginSubmit()}
                    className="h-10 min-h-[40px] px-6 text-[14px] font-medium rounded-full"
                  />
                </div>
              </form>
            </div>
          )}

          {/* ==================== VIEW 2: 注册第 1 步 (Create Account - Names & Phone) ==================== */}
          {view === 'register_step1' && (
            <div className="flex flex-col">
              <h1 className="text-[32px] sm:text-[36px] font-normal leading-[40px] sm:leading-[44px] text-[var(--md-sys-color-on-surface)] tracking-tight">
                创建账号
              </h1>
              <p className="text-[15px] sm:text-[16px] leading-[24px] text-[var(--md-sys-color-on-surface-variant)] mt-3 mb-8 font-normal">
                输入您的基本信息以建立新生档案
              </p>

              <div className="space-y-6">
                <div>
                  <md-outlined-text-field
                    label="真实姓名"
                    value={regFullName}
                    required
                    className="w-full"
                    error={!!fieldErrors.regFullName}
                    error-text={fieldErrors.regFullName}
                    onInput={(e: any) => {
                      setRegFullName(e.target.value);
                      clearFieldError('regFullName');
                    }}
                  />
                </div>

                <div>
                  <md-outlined-text-field
                    label="学号"
                    value={regStudentNumber}
                    required
                    className="w-full"
                    error={!!fieldErrors.regStudentNumber}
                    error-text={fieldErrors.regStudentNumber}
                    supporting-text="校方分配的个人学号"
                    onInput={(e: any) => {
                      setRegStudentNumber(e.target.value);
                      clearFieldError('regStudentNumber');
                    }}
                  />
                </div>

                <div>
                  <md-outlined-text-field
                    type="tel"
                    label="手机号码"
                    value={regPhone}
                    required
                    className="w-full"
                    error={!!fieldErrors.regPhone}
                    error-text={fieldErrors.regPhone}
                    supporting-text="用于接收短信验证码"
                    onInput={(e: any) => {
                      setRegPhone(e.target.value);
                      clearFieldError('regPhone');
                    }}
                  />
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between mt-10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSnackbarOpen(false);
                      setFieldErrors({});
                      setView('login');
                    }}
                    className="text-[var(--md-sys-color-primary)] text-[14px] font-medium hover:bg-[var(--md-sys-color-primary)]/10 px-4 py-2.5 rounded-full transition-colors"
                  >
                    改为登录
                  </button>

                  <PrimaryButton
                    label="下一步"
                    disabled={loading}
                    onClick={handleStep1Next}
                    className="h-10 min-h-[40px] px-6 text-[14px] font-medium rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== VIEW 3: 注册第 2 步 (Verify Phone) ==================== */}
          {view === 'register_step2' && (
            <div className="flex flex-col">
              <h1 className="text-[32px] sm:text-[36px] font-normal leading-[40px] sm:leading-[44px] text-[var(--md-sys-color-on-surface)] tracking-tight">
                验证手机号码
              </h1>

              <div className="mt-3 mb-8 text-[15px] sm:text-[16px] leading-[24px] text-[var(--md-sys-color-on-surface-variant)] font-normal">
                <span>系统已向以下号码发送了一条包含 6 位验证码的短信：</span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono font-semibold text-[var(--md-sys-color-on-surface)] text-[16px]">{regPhone}</span>
                  <button
                    type="button"
                    onClick={() => setView('register_step1')}
                    className="text-[13px] text-[var(--md-sys-color-primary)] hover:underline font-medium"
                  >
                    修改号码
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <md-outlined-text-field
                    type="tel"
                    inputmode="numeric"
                    label="6 位短信验证码"
                    value={verificationCode}
                    maxLength={6}
                    required
                    className="w-full"
                    error={!!fieldErrors.verificationCode}
                    error-text={fieldErrors.verificationCode}
                    supporting-text="开发测试默认验证码：123456"
                    onInput={(e: any) => {
                      setVerificationCode(e.target.value);
                      clearFieldError('verificationCode');
                    }}
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendCode}
                    className={`text-[14px] font-medium transition-colors ${
                      countdown > 0 ? 'text-[var(--md-sys-color-outline)] cursor-not-allowed' : 'text-[var(--md-sys-color-primary)] hover:underline'
                    }`}
                  >
                    {countdown > 0 ? `${countdown} 秒后可重新获取` : '重新获取验证码'}
                  </button>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between mt-10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSnackbarOpen(false);
                      setFieldErrors({});
                      setView('register_step1');
                    }}
                    className="text-[var(--md-sys-color-primary)] text-[14px] font-medium hover:bg-[var(--md-sys-color-primary)]/10 px-4 py-2.5 rounded-full transition-colors"
                  >
                    上一步
                  </button>

                  <PrimaryButton
                    label={loading ? '校验中...' : '下一步'}
                    disabled={loading}
                    onClick={handleStep2Next}
                    className="h-10 min-h-[40px] px-6 text-[14px] font-medium rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== VIEW 4: 注册第 3 步 (Set Password) ==================== */}
          {view === 'register_step3' && (
            <div className="flex flex-col">
              <h1 className="text-[32px] sm:text-[36px] font-normal leading-[40px] sm:leading-[44px] text-[var(--md-sys-color-on-surface)] tracking-tight">
                创建安全密码
              </h1>
              <p className="text-[15px] sm:text-[16px] leading-[24px] text-[var(--md-sys-color-on-surface-variant)] mt-3 mb-8 font-normal">
                设置至少 6 位字符的密码以保护您的心理档案安全
              </p>

              <div className="space-y-6">
                <div>
                  <md-outlined-text-field
                    label="登录密码"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    required
                    className="w-full"
                    error={!!fieldErrors.regPassword}
                    error-text={fieldErrors.regPassword}
                    supporting-text="至少 6 位字符"
                    onInput={(e: any) => {
                      setRegPassword(e.target.value);
                      clearFieldError('regPassword');
                    }}
                  >
                    <md-icon-button
                      type="button"
                      slot="trailing-icon"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? '隐藏密码' : '显示密码'}
                    >
                      <md-icon>{showRegPassword ? 'visibility_off' : 'visibility'}</md-icon>
                    </md-icon-button>
                  </md-outlined-text-field>
                </div>

                <div>
                  <md-outlined-text-field
                    label="确认密码"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    required
                    className="w-full"
                    error={!!fieldErrors.regConfirmPassword}
                    error-text={fieldErrors.regConfirmPassword}
                    supporting-text="请再次输入新密码"
                    onInput={(e: any) => {
                      setRegConfirmPassword(e.target.value);
                      clearFieldError('regConfirmPassword');
                    }}
                  >
                    <md-icon-button
                      type="button"
                      slot="trailing-icon"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      aria-label={showRegConfirmPassword ? '隐藏密码' : '显示密码'}
                    >
                      <md-icon>{showRegConfirmPassword ? 'visibility_off' : 'visibility'}</md-icon>
                    </md-icon-button>
                  </md-outlined-text-field>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between mt-10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSnackbarOpen(false);
                      setFieldErrors({});
                      setView('register_step2');
                    }}
                    className="text-[var(--md-sys-color-primary)] text-[14px] font-medium hover:bg-[var(--md-sys-color-primary)]/10 px-4 py-2.5 rounded-full transition-colors"
                  >
                    上一步
                  </button>

                  <PrimaryButton
                    label={loading ? '建档中...' : '完成'}
                    disabled={loading}
                    onClick={handleStep3Submit}
                    className="h-10 min-h-[40px] px-6 text-[14px] font-medium rounded-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MD3 Bottom Error / Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        icon="error"
        actionLabel="关闭"
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};
