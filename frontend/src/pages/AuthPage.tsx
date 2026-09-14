import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton, TextButton } from '../components/common/Buttons';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(true);

  // Form fields
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: Record<string, string> = {};

    const cleanStudentNumber = studentNumber.trim();
    if (!cleanStudentNumber) {
      errors.studentNumber = '请输入您的学号';
    }

    if (isRegisterMode) {
      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();

      if (!cleanName) {
        errors.fullName = '请输入您的真实姓名';
      }
      if (!cleanPhone || cleanPhone.length < 11) {
        errors.phone = '请输入正确的11位手机号码';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await register({
          studentNumber: cleanStudentNumber,
          fullName: fullName.trim(),
          phone: phone.trim(),
          password: password.trim() || undefined,
        });
      } else {
        await login({
          studentNumber: cleanStudentNumber,
          password: password.trim() || undefined,
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(
        err.message ||
          (isRegisterMode
            ? '登记建档失败，请重试'
            : '登录失败，请核对学号与密码')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] px-6 py-8 sm:py-12 flex flex-col justify-between">
        
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center mb-3 shadow-xs">
              <md-icon style={{ fontSize: '32px' }}>psychology</md-icon>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
              中南大学 · 心理健康教育与咨询中心
            </span>
            <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mt-1">
              新生心理普查与档案采集
            </h1>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
              {isRegisterMode
                ? '仅需 30 秒快速登记即可开始测评'
                : '输入学号与密码登录系统'}
            </p>
          </div>

          {/* Tab switch */}
          <div className="flex bg-[var(--md-sys-color-surface-container)] p-1 rounded-xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegisterMode
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
                setFieldErrors({});
              }}
            >
              新同学登记
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegisterMode
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
                setFieldErrors({});
              }}
            >
              已有学号登录
            </button>
          </div>

        {/* Global Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-start gap-2.5">
            <md-icon style={{ fontSize: '18px', shrink: 0 }}>error</md-icon>
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Form using Material Design 3 Text Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Student Number Input */}
          <div>
            <md-outlined-text-field
              label="学号"
              placeholder="例如：2026001"
              value={studentNumber}
              required
              className="w-full"
              error={!!fieldErrors.studentNumber}
              error-text={fieldErrors.studentNumber}
              supporting-text="校方分配的个人学工号"
              onInput={(e: any) => {
                setStudentNumber(e.target.value);
                clearFieldError('studentNumber');
              }}
            >
              <md-icon slot="leading-icon">badge</md-icon>
            </md-outlined-text-field>
          </div>

          {isRegisterMode && (
            <>
              {/* Full Name Input */}
              <div>
                <md-outlined-text-field
                  label="真实姓名"
                  placeholder="请输入您的姓名"
                  value={fullName}
                  required
                  className="w-full"
                  error={!!fieldErrors.fullName}
                  error-text={fieldErrors.fullName}
                  supporting-text="请填写真实姓名用于档案核对"
                  onInput={(e: any) => {
                    setFullName(e.target.value);
                    clearFieldError('fullName');
                  }}
                >
                  <md-icon slot="leading-icon">person</md-icon>
                </md-outlined-text-field>
              </div>

              {/* Phone Input */}
              <div>
                <md-outlined-text-field
                  type="tel"
                  label="手机号码"
                  placeholder="11位手机号码"
                  value={phone}
                  required
                  className="w-full"
                  error={!!fieldErrors.phone}
                  error-text={fieldErrors.phone}
                  supporting-text="常用联系手机，接收健康通知"
                  onInput={(e: any) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                >
                  <md-icon slot="leading-icon">call</md-icon>
                </md-outlined-text-field>
              </div>
            </>
          )}

          {/* Password Input */}
          <div>
            <md-outlined-text-field
              label={isRegisterMode ? '设置密码 (选填)' : '登录密码'}
              placeholder={isRegisterMode ? '选填，至少6位字符' : '请输入密码'}
              type={showPassword ? 'text' : 'password'}
              value={password}
              className="w-full"
              error={!!fieldErrors.password}
              error-text={fieldErrors.password}
              supporting-text={
                isRegisterMode ? '默认使用手机号后6位' : undefined
              }
              onInput={(e: any) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
            >
              <md-icon slot="leading-icon">lock</md-icon>
              <md-icon-button
                type="button"
                slot="trailing-icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                <md-icon>{showPassword ? 'visibility_off' : 'visibility'}</md-icon>
              </md-icon-button>
            </md-outlined-text-field>
          </div>

          <div className="pt-2">
            <PrimaryButton
              label={
                loading
                  ? '处理中...'
                  : isRegisterMode
                  ? '快速建档并进入'
                  : '立即登录'
              }
              icon={isRegisterMode ? 'how_to_reg' : 'login'}
              className="w-full h-12 text-sm"
              disabled={loading}
              onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
            />
          </div>
        </form>
        </div>

        {/* Footnote */}
        <div className="mt-8 pt-4 border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 text-center">
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            数据安全承诺：您的个人档案及心理作答受《中华人民共和国个人信息保护法》及医疗隐私规范严格保密。
          </p>
          <div className="mt-2">
            <TextButton
              label={isRegisterMode ? '已有账号？去登录' : '没有账号？去建档登记'}
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
                setFieldErrors({});
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
