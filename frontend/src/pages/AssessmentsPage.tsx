import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { intakeApi, ScaleSummaryDto } from '../api/intakeApi';
import { AssessmentCard } from '../components/assessments/AssessmentCard';
import { QuestionnairePlayerPage } from './QuestionnairePlayerPage';
import { useAuth } from '../contexts/AuthContext';
import { PrimaryButton, OutlinedButton } from '../components/common/Buttons';
import { setCenteredDialogAnimation } from '../utils/dialogAnimation';
import type { MdDialog } from '@material/web/dialog/dialog';

import { useContext } from 'react';
import { AssessmentContext } from '../contexts/AssessmentContext';

export const AssessmentsPage: React.FC = () => {
  const { student } = useAuth();
  const context = useContext(AssessmentContext);
  const [localScales, setLocalScales] = useState<ScaleSummaryDto[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(!context);
  const [localError, setLocalError] = useState<string | null>(null);

  // Active scale being taken in questionnaire player
  const [activeScaleCode, setActiveScaleCode] = useState<string | null>(null);

  // View completed submission detail modal
  const [viewingScaleCode, setViewingScaleCode] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<any | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState<boolean>(false);
  const viewDialogRef = React.useRef<MdDialog>(null);
  const setViewDialogRef = useCallback((node: MdDialog | null) => {
    (viewDialogRef as React.MutableRefObject<MdDialog | null>).current = node;
    if (node) {
      setCenteredDialogAnimation(node);
    }
  }, []);

  const fetchLocalScales = useCallback(async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      const list = await intakeApi.getScales();
      setLocalScales(list);
    } catch (err: any) {
      console.error('Failed to load scales:', err);
      setLocalError(err.message || '获取问卷列表失败');
    } finally {
      setLocalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!context) {
      fetchLocalScales();
    }
  }, [context, fetchLocalScales]);

  const scales = context ? context.scales : localScales;
  const loading = context ? context.loading : localLoading;
  const error = context ? context.error : localError;
  const fetchScales = context ? context.refreshScales : fetchLocalScales;

  const handleStartScale = (code: string) => {
    setActiveScaleCode(code);
  };

  const handlePlayerClose = (_completed: boolean) => {
    setActiveScaleCode(null);
    fetchScales();
  };

  const handleViewSubmission = async (code: string) => {
    setViewingScaleCode(code);
    setLoadingSubmission(true);
    viewDialogRef.current?.show();
    try {
      const data = await intakeApi.getSubmission(code);
      setSubmissionData(data);
    } catch (err: any) {
      console.warn('Failed to get submission details:', err);
      setSubmissionData(null);
    } finally {
      setLoadingSubmission(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* If taking a scale, render Questionnaire Player as takeover */}
      <AnimatePresence>
        {activeScaleCode && student && (
          <QuestionnairePlayerPage
            key={activeScaleCode}
            scaleCode={activeScaleCode}
            studentNumber={student.studentNumber}
            onClose={handlePlayerClose}
          />
        )}
      </AnimatePresence>

      {/* Scales List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <md-circular-progress indeterminate></md-circular-progress>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-3">
            加载问卷列表中...
          </span>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
          <p className="text-sm font-medium">{error}</p>
          <div className="mt-3">
            <PrimaryButton label="重新加载" icon="refresh" onClick={fetchScales} />
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {scales.map((scale) => (
            <AssessmentCard
              key={scale.code}
              scale={scale}
              onStart={handleStartScale}
              onView={handleViewSubmission}
            />
          ))}
        </div>
      )}

      {/* Submission Detail Modal (Portalled to body to cover full screen including top/bottom bars) */}
      {typeof document !== 'undefined'
        ? createPortal(
            <md-dialog
              ref={setViewDialogRef}
              style={{
                maxWidth: 'min(420px, calc(100vw - 32px))',
                minWidth: '300px',
                '--md-dialog-container-shape': '28px',
              } as React.CSSProperties}
            >
              <div slot="headline" className="px-6 pt-6 pb-2 text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                问卷提交状态 {viewingScaleCode ? `· ${viewingScaleCode}` : ''}
              </div>
              <div slot="content" className="px-6 py-2 text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                {loadingSubmission ? (
                  <div className="py-4 text-center">
                    <md-circular-progress indeterminate></md-circular-progress>
                  </div>
                ) : submissionData ? (
                  <>
                    <p>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">问卷标识：</span>{' '}
                      {submissionData.scaleCode}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">提交状态：</span>{' '}
                      <span className="text-[var(--md-sys-color-primary)] font-medium">已完成</span>
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--md-sys-color-on-surface)]">完成时间：</span>{' '}
                      {submissionData.completedAt ? new Date(submissionData.completedAt).toLocaleString('zh-CN') : '已记录'}
                    </p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] pt-2">
                      作答内容已加密上传并保存，本终端不展示临床分值以保护学生心理状态。
                    </p>
                  </>
                ) : (
                  <p>已成功提交作答记录。</p>
                )}
              </div>
              <div slot="actions" className="px-6 pb-6 pt-3 flex items-center justify-end gap-3">
                <OutlinedButton
                  label="关闭"
                  className="h-10 min-h-[40px] px-5 text-sm"
                  onClick={() => viewDialogRef.current?.close()}
                />
              </div>
            </md-dialog>,
            document.body
          )
        : null}

    </div>
  );
};
