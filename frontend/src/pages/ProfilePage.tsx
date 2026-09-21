import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { intakeApi } from '../api/intakeApi';
import { OutlinedButton, PrimaryButton } from '../components/common/Buttons';
import { setCenteredDialogAnimation } from '../utils/dialogAnimation';
import type { MdDialog } from '@material/web/dialog/dialog';

function formatBirthday(birthday?: string | null): string {
  if (!birthday) return '未填报';
  const trimmed = String(birthday).trim();
  if (trimmed.endsWith('周岁') || trimmed.endsWith('岁')) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return `${match[1]}年${parseInt(match[2], 10)}月${parseInt(match[3], 10)}日`;
  }
  return trimmed || '未填报';
}

const getItemCornerRadius = (index: number, total: number): string => {
  if (total <= 1) return 'rounded-[20px]';
  if (index === 0) return 'rounded-t-[20px] rounded-b-[4px]';
  if (index === total - 1) return 'rounded-t-[4px] rounded-b-[20px]';
  return 'rounded-[4px]';
};

export const ProfilePage: React.FC = () => {
  const { student, logout } = useAuth();
  const [profile, setProfile] = useState<import('../api/intakeApi').StudentProfileDto | null>(null);
  const logoutDialogRef = useRef<MdDialog>(null);
  const setLogoutDialogRef = useCallback((node: MdDialog | null) => {
    (logoutDialogRef as React.MutableRefObject<MdDialog | null>).current = node;
    if (node) {
      setCenteredDialogAnimation(node);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    intakeApi
      .getMyProfile()
      .then((data) => {
        if (isMounted && data) {
          setProfile(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load profile:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!student) return null;

  const firstLetter = student.fullName ? student.fullName.slice(0, 1) : '学';

  const infoRows = [
    {
      id: 'photo',
      icon: 'photo_camera',
      title: '个人资料照片',
      trailing: (
        <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
          {firstLetter}
        </div>
      ),
    },
    {
      id: 'name',
      icon: 'badge',
      title: '姓名',
      value: profile?.fullName || student.fullName,
    },
    {
      id: 'studentNumber',
      icon: 'tag',
      title: '学号',
      value: profile?.studentNumber || student.studentNumber,
    },
    {
      id: 'gender',
      icon: 'person',
      title: '性别',
      value: profile?.demographics?.gender || '未填报',
    },
    {
      id: 'ethnicity',
      icon: 'groups',
      title: '民族',
      value: profile?.demographics?.ethnicity || '未填报',
    },
    {
      id: 'phone',
      icon: 'call',
      title: '电话',
      value: profile?.phone || student.phone,
    },
    {
      id: 'email',
      icon: 'mail',
      title: '邮箱',
      value: profile?.demographics?.email || '未填报',
    },
    {
      id: 'birthday',
      icon: 'cake',
      title: '生日',
      value: formatBirthday(profile?.demographics?.birthday),
    },
    {
      id: 'major',
      icon: 'school',
      title: '院系专业',
      value: profile?.demographics?.major || '未填报',
    },
    {
      id: 'address',
      icon: 'home',
      title: '住址',
      value: profile?.demographics?.homeAddress || '未填报',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] px-1 pt-1">
        个人信息
      </h2>

      {/* Personal Info List */}
      <div className="flex flex-col gap-[2px]">
        {infoRows.map((row, index) => {
          const cornerRadius = getItemCornerRadius(index, infoRows.length);
          return (
            <div
              key={row.id}
              className={`px-4 py-3.5 flex items-center gap-4 min-h-[56px] bg-[var(--md-sys-color-surface-container-low)] ${cornerRadius}`}
            >
              <md-icon
                className="text-[var(--md-sys-color-on-surface-variant)] shrink-0"
                style={{ '--md-icon-size': '22px', fontSize: '22px', width: '22px', height: '22px' } as React.CSSProperties}
              >
                {row.icon}
              </md-icon>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)] leading-snug">
                  {row.title}
                </div>
                {row.value && (
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 truncate font-normal">
                    {row.value}
                  </div>
                )}
              </div>
              {row.trailing}
            </div>
          );
        })}
      </div>

      {/* Privacy & Medical Statement Card */}
      <div className="p-5 rounded-2xl bg-[var(--md-sys-color-surface-container-low)]">
        <div className="flex items-center gap-2 text-[var(--md-sys-color-primary)] mb-2">
          <md-icon style={{ '--md-icon-size': '18px', fontSize: '18px', width: '18px', height: '18px' } as React.CSSProperties}>shield</md-icon>
          <h4 className="text-xs font-bold uppercase tracking-wider">医疗与数据安全须知</h4>
        </div>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          1. 本系统为中南大学心理健康档案采集专用通道，所有测试题目与回答均经过端到端加密传输。<br />
          2. 为避免给您带来不必要的心理压力，移动端不展示临床量化评分或诊断性标签；数据导入后由专业心理咨询师或校医院精神科医师进行综合评定。<br />
          3. 如遇突发情绪困扰或紧急求助，请拨打中南大学心理求助热线或联系您的辅导员老师。
        </p>
      </div>

      {/* Logout Action at Bottom */}
      <div className="pt-2 pb-6">
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
