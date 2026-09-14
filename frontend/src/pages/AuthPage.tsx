import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { intakeApi } from '../api/intakeApi';
import { PrimaryButton, TextButton, TertiaryButton } from '../components/common/Buttons';

type AuthView = 'login' | 'register_step1' | 'register_step2' | 'register_step3';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (errorMessage) setErrorMessage(null);
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMessage(null);
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
        studentNumber: cleanNum,
        password: loginPassword,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || '登录失败，请核对学号与密码');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register Step 1 -> Send Code & Go to Step 2
  const handleStep1Next = async () => {
    setErrorMessage(null);
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
      setErrorMessage(err.message || '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler in Step 2
  const handleResendCode = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await intakeApi.sendCode(regPhone.trim());
      startCountdown();
    } catch (err: any) {
      console.error('Resend code error:', err);
      setErrorMessage(err.message || '重新获取验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Register Step 2 -> Verify Code & Go to Step 3
  const handleStep2Next = async () => {
    setErrorMessage(null);
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
      setErrorMessage(err.message || '验证码校验失败');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Register Step 3 -> Final Register Submit
  const handleStep3Submit = async () => {
    setErrorMessage(null);
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
      setErrorMessage(err.message || '登记建档失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = (): number => {
    switch (view) {
      case 'register_step1':
        return 1;
      case 'register_step2':
        return 2;
      case 'register_step3':
        return 3;
      default:
        return 1;
    }
  };

  const handleBackNavigation = () => {
    setErrorMessage(null);
    setFieldErrors({});
    if (view === 'register_step1') {
      setView('login');
    } else if (view === 'register_step2') {
      setView('register_step1');
    } else if (view === 'register_step3') {
      setView('register_step2');
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (view === 'login') {
    return (
      <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
        <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] px-6 py-8 sm:py-12 flex flex-col justify-between">
          <div className="flex flex-col">
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-2 flex items-center justify-center">
                <span className="text-[36px] font-extrabold text-[var(--md-sys-color-primary)] tracking-tight">
                  CSU
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                中南大学 · 心理健康教育与咨询中心
              </span>
              <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mt-1">
                新生心理普查与档案采集
              </h1>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-start gap-2.5">
                <md-icon style={{ fontSize: '18px', shrink: 0 }}>error</md-icon>
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <md-outlined-text-field
                  label="学号"
                  placeholder="例如：2026001"
                  value={loginStudentNumber}
                  required
                  className="w-full"
                  error={!!fieldErrors.loginStudentNumber}
                  error-text={fieldErrors.loginStudentNumber}
                  supporting-text="请输入您的学号"
                  onInput={(e: any) => {
                    setLoginStudentNumber(e.target.value);
                    clearFieldError('loginStudentNumber');
                  }}
                >
                  <md-icon slot="leading-icon">badge</md-icon>
                </md-outlined-text-field>
              </div>

              <div>
                <md-outlined-text-field
                  label="登录密码"
                  placeholder="请输入密码"
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
                  <md-icon slot="leading-icon">lock</md-icon>
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

              <div className="pt-2">
                <PrimaryButton
                  label={loading ? '登录中...' : '立即登录'}
                  icon="login"
                  className="w-full h-12 text-sm"
                  disabled={loading}
                  onClick={() => handleLoginSubmit()}
                />
              </div>
            </form>
          </div>

          {/* Footer Navigation Link to Register Sequence */}
          <div className="mt-8 pt-4 border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 text-center">
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              新生首次填报请先完成身份建档验证
            </p>
            <div className="mt-2">
              <TextButton
                label="新同学登记 / 首次使用？立即建档"
                onClick={() => {
                  setErrorMessage(null);
                  setFieldErrors({});
                  setView('register_step1');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: 3-SCREEN REGISTRATION SEQUENCE ---
  const currentStep = getStepNumber();

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] px-6 py-6 sm:py-10 flex flex-col justify-between">
        <div className="flex flex-col">
          
          {/* Sequence Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition"
              aria-label="返回上一步"
            >
              <md-icon style={{ fontSize: '24px' }}>arrow_back</md-icon>
            </button>

            <span className="text-xs font-bold text-[var(--md-sys-color-primary)] px-3 py-1 rounded-full bg-[var(--md-sys-color-primary-container)]">
              第 {currentStep} / 3 步
            </span>
          </div>

          {/* Linear Progress for 3 steps */}
          <div className="w-full mb-6">
            <md-linear-progress
              value={currentStep}
              max={3}
              style={{ width: '100%', '--md-linear-progress-track-height': '4px' } as any}
            ></md-linear-progress>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-start gap-2.5">
              <md-icon style={{ fontSize: '18px', shrink: 0 }}>error</md-icon>
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* --- STEP 1: 基本档案信息 --- */}
          {view === 'register_step1' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                  填写基本信息
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  请如实输入您的学号、姓名与联系手机
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <md-outlined-text-field
                    label="真实姓名"
                    placeholder="请输入您的姓名"
                    value={regFullName}
                    required
                    className="w-full"
                    error={!!fieldErrors.regFullName}
                    error-text={fieldErrors.regFullName}
                    supporting-text="请填写真实姓名用于档案核对"
                    onInput={(e: any) => {
                      setRegFullName(e.target.value);
                      clearFieldError('regFullName');
                    }}
                  >
                    <md-icon slot="leading-icon">person</md-icon>
                  </md-outlined-text-field>
                </div>

                <div>
                  <md-outlined-text-field
                    label="学号"
                    placeholder="例如：2026001"
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
                  >
                    <md-icon slot="leading-icon">badge</md-icon>
                  </md-outlined-text-field>
                </div>

                <div>
                  <md-outlined-text-field
                    type="tel"
                    label="手机号码"
                    placeholder="11位手机号码"
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
                  >
                    <md-icon slot="leading-icon">call</md-icon>
                  </md-outlined-text-field>
                </div>

                <div className="pt-2">
                  <PrimaryButton
                    label={loading ? '发送中...' : '下一步：获取验证码'}
                    icon="arrow_forward"
                    trailingIcon
                    className="w-full h-12 text-sm"
                    disabled={loading}
                    onClick={handleStep1Next}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 2: 短信验证码确认 --- */}
          {view === 'register_step2' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                  输入短信验证码
                </h2>
                {/* Prominently displays the entered phone number */}
                <div className="mt-2 p-3 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] border-opacity-40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface)]">
                    <md-icon style={{ fontSize: '18px' }}>phonelink_ring</md-icon>
                    <span>
                      已发送至 <span className="font-bold font-mono text-[var(--md-sys-color-primary)]">{regPhone}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('register_step1')}
                    className="text-xs font-semibold text-[var(--md-sys-color-primary)] hover:underline"
                  >
                    修改号码
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <md-outlined-text-field
                    type="tel"
                    inputmode="numeric"
                    label="6 位短信验证码"
                    placeholder="请输入验证码"
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
                  >
                    <md-icon slot="leading-icon">sms</md-icon>
                  </md-outlined-text-field>
                </div>

                <div className="flex justify-end">
                  <TertiaryButton
                    label={countdown > 0 ? `${countdown}s 后可重新获取` : '重新获取验证码'}
                    icon="refresh"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendCode}
                  />
                </div>

                <div className="pt-2">
                  <PrimaryButton
                    label={loading ? '校验中...' : '下一步：设置密码'}
                    icon="arrow_forward"
                    trailingIcon
                    className="w-full h-12 text-sm"
                    disabled={loading}
                    onClick={handleStep2Next}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3: 设置密码与确认密码 --- */}
          {view === 'register_step3' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                  设置账户登录密码
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  请设置至少 6 位字符的安全密码用于日常登录
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <md-outlined-text-field
                    label="登录密码"
                    placeholder="至少 6 位字符"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    required
                    className="w-full"
                    error={!!fieldErrors.regPassword}
                    error-text={fieldErrors.regPassword}
                    supporting-text="请妥善保管您的登录密码"
                    onInput={(e: any) => {
                      setRegPassword(e.target.value);
                      clearFieldError('regPassword');
                    }}
                  >
                    <md-icon slot="leading-icon">lock</md-icon>
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
                    label="确认新密码"
                    placeholder="请再次输入新密码"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    required
                    className="w-full"
                    error={!!fieldErrors.regConfirmPassword}
                    error-text={fieldErrors.regConfirmPassword}
                    supporting-text="确保两次输入一致"
                    onInput={(e: any) => {
                      setRegConfirmPassword(e.target.value);
                      clearFieldError('regConfirmPassword');
                    }}
                  >
                    <md-icon slot="leading-icon">lock_reset</md-icon>
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

                <div className="pt-2">
                  <PrimaryButton
                    label={loading ? '建档中...' : '完成建档并进入'}
                    icon="check_circle"
                    className="w-full h-12 text-sm"
                    disabled={loading}
                    onClick={handleStep3Submit}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info notice */}
        <div className="mt-8 pt-4 border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 text-center">
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            已有账号？
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setFieldErrors({});
                setView('login');
              }}
              className="ml-1 text-[var(--md-sys-color-primary)] font-semibold hover:underline"
            >
              直接登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
