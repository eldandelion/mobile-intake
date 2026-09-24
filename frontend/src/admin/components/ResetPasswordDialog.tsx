import { useState } from 'react';

interface ResetPasswordDialogProps {
  isOpen: boolean;
  studentNumber: string;
  onClose: () => void;
  onConfirm: (studentNumber: string, newPassword?: string) => Promise<void>;
}

export function ResetPasswordDialog({
  isOpen,
  studentNumber,
  onClose,
  onConfirm,
}: ResetPasswordDialogProps) {
  const [customPassword, setCustomPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(studentNumber, customPassword.trim() || undefined);
      setCustomPassword('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">lock_reset</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              重置学生密码
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              学号: {studentNumber}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
              新密码 (留空则默认为 123456)
            </label>
            <input
              type="text"
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="请输入新密码或留空"
              className="w-full h-11 px-4 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold flex items-center gap-1.5 hover:brightness-105 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? '正在重置...' : '确认重置'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
