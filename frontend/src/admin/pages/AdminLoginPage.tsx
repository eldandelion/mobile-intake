import React, { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { PrimaryButton, TertiaryButton } from '../../components/common/Buttons';

export function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [secret, setSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!secret.trim()) {
      setError('请输入管理安全密钥');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(secret.trim());
    } catch (err: any) {
      setError(err.message || '登录验证失败，请核对密钥');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] overflow-y-auto select-none">
      {/* Main Card Container matching medical-system LoginOverlay */}
      <div className="relative w-full max-w-[1040px] min-h-[440px] bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface)] rounded-[28px] p-8 sm:p-10 md:p-12 shadow-sm flex flex-col justify-between">
        {/* Two-Column Step Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 flex-1">
          {/* Left Column */}
          <div className="flex flex-col justify-start">
            <div className="h-[32px] flex items-center">
              <span className="text-[28px] font-bold text-[var(--md-sys-color-primary)] tracking-tight">
                CSU
              </span>
            </div>

            <div className="mt-6">
              <h1 className="text-[36px] leading-[44px] font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
                心理普查管理控制台
              </h1>
              <p className="text-[16px] leading-[24px] text-[var(--md-sys-color-on-surface-variant)] mt-3 font-normal">
                使用您的系统管理安全密钥以继续运维工作
              </p>
            </div>

            <div className="mt-auto pt-8 text-xs text-[var(--md-sys-color-on-surface-variant)] opacity-70">
              <p>中南大学新生心理健康普查系统 · 独立支撑域运维端</p>
              <p className="mt-1">严格执行临床诊断权限隔离 (Separation of Clinical Authority)</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between h-full">
            <div className="hidden md:flex h-[32px] items-center" />

            <div className="mt-0 md:mt-6 flex flex-col justify-between flex-1">
              <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full space-y-6">
                <div className="space-y-3">
                  <p className="text-[16px] text-[var(--md-sys-color-on-surface)] font-normal">
                    如要继续，请先验证您的管理员身份
                  </p>

                  <div>
                    <md-outlined-text-field
                      label="系统管理密钥 (Admin Secret)"
                      placeholder="请输入管理安全密钥"
                      type={showPassword ? 'text' : 'password'}
                      value={secret}
                      className="w-full"
                      error={!!error || undefined}
                      error-text={error || undefined}
                      onInput={(e: React.SyntheticEvent) => {
                        const target = e.target as HTMLInputElement;
                        setSecret(target.value);
                        if (error) setError(null);
                      }}
                    >
                      <md-icon slot="leading-icon">key</md-icon>
                    </md-outlined-text-field>

                    {error && (
                      <div className="text-xs text-[var(--md-sys-color-error)] flex items-center gap-1 pt-1.5">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Show password checkbox */}
                  <label
                    className="flex items-center gap-2 pt-1 cursor-pointer select-none text-[14px] text-[var(--md-sys-color-on-surface)] w-fit"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                  >
                    <md-checkbox
                      aria-label="显示密钥"
                      checked={showPassword || undefined}
                      touch-target="none"
                    />
                    <span>显示密钥内容</span>
                  </label>
                </div>

                {/* Action Buttons matching medical-system */}
                <div className="flex items-center justify-end gap-3 pt-8 mt-auto">
                  <TertiaryButton
                    label="返回学生端"
                    onClick={() => {
                      window.location.pathname = '/';
                    }}
                  />
                  <PrimaryButton
                    label={loading ? '正在验证...' : '验证并登入工作台'}
                    onClick={() => handleSubmit()}
                    disabled={loading}
                    className="px-6 rounded-full"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
