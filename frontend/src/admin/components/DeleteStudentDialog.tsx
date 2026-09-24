import { useState } from 'react';

interface DeleteStudentDialogProps {
  isOpen: boolean;
  studentNumber: string;
  studentName: string;
  onClose: () => void;
  onConfirm: (studentNumber: string) => Promise<void>;
}

export function DeleteStudentDialog({
  isOpen,
  studentNumber,
  studentName,
  onClose,
  onConfirm,
}: DeleteStudentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(studentNumber);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]/40 p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              确认删除学生登记？
            </h3>
            <p className="text-xs text-[var(--md-sys-color-error)]">
              此操作将级联删除该学生的所有作答记录
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          即将彻底移除学生 <strong className="text-[var(--md-sys-color-on-surface)]">{studentName}</strong> (学号: {studentNumber}) 及其填报的所有草稿和已提交问卷。此操作不可逆。
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-10 px-4 rounded-full text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-10 px-5 rounded-full bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] text-xs font-semibold flex items-center gap-1.5 hover:brightness-105 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? '正在删除...' : '彻底删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
