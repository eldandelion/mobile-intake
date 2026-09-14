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

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanStudentNumber = studentNumber.trim();
    if (!cleanStudentNumber) {
      setErrorMessage('请输入您的学号');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const cleanName = fullName.trim();
        const cleanPhone = phone.trim();

        if (!cleanName) {
          setErrorMessage('请输入您的真实姓名');
          setLoading(false);
          return;
        }
        if (!cleanPhone || cleanPhone.length < 11) {
          setErrorMessage('请输入正确的11位手机号码');
          setLoading(false);
          return;
        }

        await register({
          studentNumber: cleanStudentNumber,
          fullName: cleanName,
          phone: cleanPhone,
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
      setErrorMessage(err.message || (isRegisterMode ? '登记建档失败，请重试' : '登录失败，请核对学号与密码'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface-container-lowest)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] border-opacity-50 p-6 sm:p-8 shadow-sm flex flex-col">
        
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
            {isRegisterMode ? '仅需 30 秒快速登记即可开始测评' : '输入学号与密码登录系统'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[var(--md-sys-color-surface-container)] p-1 rounded-xl mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegisterMode
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMessage(null);
            }}
          >
            新同学登记
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegisterMode
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMessage(null);
            }}
          >
            已有学号登录
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-start gap-2.5">
            <md-icon style={{ fontSize: '18px', shrink: 0 }}>error</md-icon>
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
              学号 <span className="text-[var(--md-sys-color-error)]">*</span>
            </label>
            <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-surface-container-lowest)] px-3.5 py-3 transition">
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="例如：2026001"
                required
                className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-outline)]"
              />
            </div>
          </div>

          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                  真实姓名 <span className="text-[var(--md-sys-color-error)]">*</span>
                </label>
                <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-surface-container-lowest)] px-3.5 py-3 transition">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="请输入您的姓名"
                    required
                    className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-outline)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                  手机号码 <span className="text-[var(--md-sys-color-error)]">*</span>
                </label>
                <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-surface-container-lowest)] px-3.5 py-3 transition">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11位手机号码"
                    required
                    className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-outline)]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                {isRegisterMode ? '设置密码 (选填)' : '登录密码'}
              </label>
              {isRegisterMode && (
                <span className="text-[11px] text-[var(--md-sys-color-outline)]">
                  默认使用手机号后6位
                </span>
              )}
            </div>
            <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] focus-within:border-[var(--md-sys-color-primary)] focus-within:ring-2 focus-within:ring-[var(--md-sys-color-primary-container)] bg-[var(--md-sys-color-surface-container-lowest)] px-3.5 py-3 transition">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterMode ? '选填，至少6位字符' : '请输入密码'}
                className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder:text-[var(--md-sys-color-outline)]"
              />
            </div>
          </div>

          <div className="pt-3">
            <PrimaryButton
              label={loading ? '处理中...' : isRegisterMode ? '快速建档并进入' : '立即登录'}
              icon={isRegisterMode ? 'how_to_reg' : 'login'}
              className="w-full h-12 text-sm"
              disabled={loading}
              onClick={() => {}}
            />
          </div>
        </form>

        {/* Footnote */}
        <div className="mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)] border-opacity-30 text-center">
          <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            数据安全承诺：您的个人档案及心理作答受《中华人民共和国个人信息保护法》及医疗隐私规范严格保密。
          </p>
          <div className="mt-2">
            <TextButton
              label={isRegisterMode ? '已有账号？去登录' : '没有账号？去建档登记'}
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
