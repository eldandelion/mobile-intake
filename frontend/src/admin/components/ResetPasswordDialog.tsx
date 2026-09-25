import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MdDialog } from '@material/web/dialog/dialog';
import { setCenteredDialogAnimation } from '../../utils/dialogAnimation';
import { OutlinedButton, PrimaryButton } from '../../components/common/Buttons';

export interface ResetPasswordDialogProps {
  isOpen: boolean;
  studentNumber: string;
  studentName?: string;
  onClose: () => void;
  onConfirm: (studentNumber: string, newPassword?: string) => Promise<void>;
}

export function ResetPasswordDialog({
  isOpen,
  studentNumber,
  studentName,
  onClose,
  onConfirm,
}: ResetPasswordDialogProps) {
  const [customPassword, setCustomPassword] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;

  const dialogRef = useRef<MdDialog | null>(null);
  const setDialogRef = useCallback(
    (node: MdDialog | null) => {
      dialogRef.current = node;
      if (node) {
        setCenteredDialogAnimation(node);
        const handleCancelOrClosed = (e: Event) => {
          if (isSubmittingRef.current) {
            e.preventDefault();
            return;
          }
          handleClose();
        };
        node.addEventListener('closed', handleCancelOrClosed);
        node.addEventListener('cancel', handleCancelOrClosed);
      }
    },
    []
  );

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setIsConfirming(false);
    setCustomPassword('');
    setValidationError(null);
    onClose();
  };

  const handlePasswordChange = (val: string) => {
    setCustomPassword(val);
    if (val.trim().length > 0 && val.trim().length < 6) {
      setValidationError('新密码长度不能少于 6 位');
    } else {
      setValidationError(null);
    }
  };

  const handleNextStep = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = customPassword.trim();
    if (trimmed.length > 0 && trimmed.length < 6) {
      setValidationError('新密码长度不能少于 6 位');
      return;
    }
    setValidationError(null);
    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(studentNumber, customPassword.trim() || undefined);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetPasswordDisplay = customPassword.trim() || '123456';

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
          {isConfirming ? '确认重置密码？' : '重置学生密码'}
        </h3>
        {!isConfirming && (
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
            {studentName ? `${studentName} · ` : ''}学号: {studentNumber}
          </p>
        )}
      </div>

      {/* Content Slot */}
      <div slot="content" className="px-6 py-2 select-none">
        {!isConfirming ? (
          <form id="reset-password-form" onSubmit={handleNextStep} className="pt-1">
            <md-outlined-text-field
              label="新密码"
              placeholder="留空则默认为 123456"
              value={customPassword}
              onInput={(e: any) => handlePasswordChange(e.target.value)}
              onChange={(e: any) => handlePasswordChange(e.target.value)}
              error={!!validationError}
              error-text={validationError || undefined}
              supporting-text={!validationError ? '留空则默认为 123456' : undefined}
              className="w-full"
            />
          </form>
        ) : (
          <div className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
            确认将学生 <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{studentName ? `${studentName} (${studentNumber})` : studentNumber}</span> 的登录密码重置为 <span className="font-mono font-semibold text-[var(--md-sys-color-primary)]">{targetPasswordDisplay}</span> 吗？
          </div>
        )}
      </div>

      {/* Actions Slot */}
      <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-2.5 select-none">
        {!isConfirming ? (
          <>
            <OutlinedButton
              label="取消"
              className="h-10 min-h-[40px] px-4 text-xs font-semibold"
              onClick={handleClose}
            />
            <PrimaryButton
              label="下一步"
              className="h-10 min-h-[40px] px-5 text-xs font-semibold"
              disabled={!!validationError}
              onClick={() => handleNextStep()}
            />
          </>
        ) : (
          <>
            <OutlinedButton
              label="返回修改"
              className="h-10 min-h-[40px] px-4 text-xs font-semibold"
              disabled={isSubmitting}
              onClick={() => setIsConfirming(false)}
            />
            <PrimaryButton
              label={isSubmitting ? '正在重置...' : '确认重置'}
              className="h-10 min-h-[40px] px-5 text-xs font-semibold"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
            />
          </>
        )}
      </div>
    </md-dialog>
  );

  return typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : dialogContent;
}
