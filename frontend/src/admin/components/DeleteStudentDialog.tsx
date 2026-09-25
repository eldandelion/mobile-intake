import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MdDialog } from '@material/web/dialog/dialog';
import { setCenteredDialogAnimation } from '../../utils/dialogAnimation';
import { OutlinedButton, PrimaryButton } from '../../components/common/Buttons';

export interface DeleteStudentDialogProps {
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

  const isDeletingRef = useRef(isDeleting);
  isDeletingRef.current = isDeleting;

  const dialogRef = useRef<MdDialog | null>(null);
  const setDialogRef = useCallback(
    (node: MdDialog | null) => {
      dialogRef.current = node;
      if (node) {
        setCenteredDialogAnimation(node);
        const handleCancelOrClosed = (e: Event) => {
          if (isDeletingRef.current) {
            e.preventDefault();
            return;
          }
          onClose();
        };
        node.addEventListener('closed', handleCancelOrClosed);
        node.addEventListener('cancel', handleCancelOrClosed);
      }
    },
    [onClose]
  );

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

  const dialogContent = (
    <md-dialog
      ref={setDialogRef}
      open={true}
      style={{
        maxWidth: 'min(420px, calc(100vw - 32px))',
        minWidth: '320px',
        '--md-dialog-container-shape': '28px',
      } as React.CSSProperties}
    >
      {/* Headline Slot - No icon */}
      <div slot="headline" className="px-6 pt-6 pb-2 select-none">
        <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
          确认删除学生登记？
        </h3>
      </div>

      {/* Content Slot - Concise, clean text */}
      <div slot="content" className="px-6 py-2 select-none text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
        确认彻底删除学生 <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{studentName}</span> (学号: <span className="font-mono">{studentNumber}</span>) 吗？该学生的所有作答记录将被清除，此操作不可撤销。
      </div>

      {/* Actions Slot */}
      <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-2.5 select-none">
        <OutlinedButton
          label="取消"
          className="h-10 min-h-[40px] px-4 text-xs font-semibold"
          disabled={isDeleting}
          onClick={onClose}
        />
        <PrimaryButton
          label={isDeleting ? '正在删除...' : '彻底删除'}
          className="h-10 min-h-[40px] px-5 text-xs font-semibold"
          disabled={isDeleting}
          onClick={handleDelete}
        />
      </div>
    </md-dialog>
  );

  return typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : dialogContent;
}
