import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { intakeApi, ScaleSummaryDto } from '../api/intakeApi';
import { OutlinedButton, PrimaryButton } from '../components/common/Buttons';
import { setCenteredDialogAnimation } from '../utils/dialogAnimation';
import type { MdDialog } from '@material/web/dialog/dialog';

export const ProfilePage: React.FC = () => {
  const { student, logout } = useAuth();
  const [scales, setScales] = useState<ScaleSummaryDto[]>([]);
  const logoutDialogRef = React.useRef<MdDialog>(null);
  const setLogoutDialogRef = useCallback((node: MdDialog | null) => {
    (logoutDialogRef as React.MutableRefObject<MdDialog | null>).current = node;
    if (node) {
      setCenteredDialogAnimation(node);
    }
  }, []);

  useEffect(() => {
    intakeApi
      .getScales()
      .then((data) => setScales(data))
      .catch((e) => console.warn('Failed to load scales for profile:', e));
  }, []);

  if (!student) return null;

  const firstLetter = student.fullName ? student.fullName.slice(0, 1) : '学';
  const completedCount = scales.filter((s) => s.status === 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Student Profile Card */}
      <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] border-opacity-40 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
          {firstLetter}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] truncate">
            {student.fullName}
          </h3>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            学号：<span className="font-mono">{student.studentNumber}</span>
          </p>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
            手机：<span className="font-mono">{student.phone}</span>
          </p>
        </div>
      </div>

      {/* Completion Checklist */}
      <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] border-opacity-40">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
            普查任务清单
          </h4>
          <span className="text-xs font-semibold text-[var(--md-sys-color-primary)]">
            已完成 {completedCount} / {scales.length || 4}
          </span>
        </div>

        <div className="space-y-2.5">
          {scales.map((s) => {
            const isDone = s.status === 'COMPLETED';
            return (
              <div
                key={s.code}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isDone
                        ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                        : 'border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-outline)]'
                    }`}
                  >
                    {isDone ? (
                      <md-icon style={{ fontSize: '14px' }}>check</md-icon>
                    ) : (
                      <span className="text-[10px]">·</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                    {s.title}
                  </span>
                </div>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isDone
                      ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
                      : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {isDone ? '已完成' : '待作答'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy & Medical Statement Card */}
      <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] border-opacity-30">
        <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] mb-2">
          <md-icon style={{ fontSize: '18px' }}>shield</md-icon>
          <h4 className="text-xs font-bold uppercase tracking-wider">医疗与数据安全须知</h4>
        </div>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          1. 本系统为中南大学心理健康档案采集专用通道，所有测试题目与回答均经过端到端加密传输。<br />
          2. 为避免给您带来不必要的心理压力，移动端不展示临床量化评分或诊断性标签；数据导入后由专业心理咨询师或校医院精神科医师进行综合评定。<br />
          3. 如遇突发情绪困扰或紧急求助，请拨打中南大学心理求助热线或联系您的辅导员老师。
        </p>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <OutlinedButton
          label="退出登录"
          icon="logout"
          className="w-full h-12 text-sm text-[var(--md-sys-color-error)]"
          onClick={() => logoutDialogRef.current?.show()}
        />
      </div>

      {/* Logout Confirmation Dialog (Portalled to body to cover full screen including top/bottom bars) */}
      {typeof document !== 'undefined'
        ? createPortal(
            <md-dialog
              ref={setLogoutDialogRef}
              style={{
                maxWidth: 'min(420px, calc(100vw - 32px))',
                minWidth: '300px',
                '--md-dialog-container-shape': '28px',
              } as React.CSSProperties}
            >
              <div slot="headline" className="px-6 pt-6 pb-2 text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                确认退出登录？
              </div>
              <div slot="content" className="px-6 py-2 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                退出登录后，再次进入需输入学号与密码重新验证。
              </div>
              <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-3">
                <OutlinedButton
                  label="取消"
                  className="h-10 min-h-[40px] px-5 text-sm"
                  onClick={() => logoutDialogRef.current?.close()}
                />
                <PrimaryButton
                  label="确认退出"
                  className="h-10 min-h-[40px] px-5 text-sm"
                  onClick={() => {
                    logoutDialogRef.current?.close();
                    logout();
                  }}
                />
              </div>
            </md-dialog>,
            document.body
          )
        : null}

    </div>
  );
};
