import React, { useState, useEffect, useCallback } from 'react';
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

  const handlePlayerClose = (completed: boolean) => {
    setActiveScaleCode(null);
    if (completed) {
      fetchScales();
    }
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

  const totalCount = scales.length;
  const completedCount = scales.filter((s) => s.status === 'COMPLETED').length;
  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="space-y-4">
      {/* If taking a scale, render Questionnaire Player as takeover */}
      {activeScaleCode && student && (
        <QuestionnairePlayerPage
          scaleCode={activeScaleCode}
          studentNumber={student.studentNumber}
          onClose={handlePlayerClose}
        />
      )}

      {/* Progress Overview Card */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--md-sys-color-primary)] uppercase tracking-wider">
            入学心理普查任务
          </span>
          <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
            {completedCount} / {totalCount} 完成
          </span>
        </div>

        <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1">
          {isAllCompleted
            ? '🎉 全部测评任务已顺利完成！'
            : `还有 ${totalCount - completedCount} 项任务待完成`}
        </h3>

        <div className="mt-3">
          <md-linear-progress
            value={completedCount}
            max={totalCount || 1}
            style={{ width: '100%', '--md-linear-progress-track-height': '6px' } as any}
          ></md-linear-progress>
        </div>

        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2.5 leading-relaxed">
          {isAllCompleted
            ? '感谢您的配合！您的测评与档案数据已安全建档，供校心理中心建立健康档案。'
            : '请如实根据您近期的实际情况作答，各量表均支持实时自动保存进度。'}
        </p>
      </div>

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

      {/* Submission Detail Modal */}
      <md-dialog ref={setViewDialogRef}>
        <div slot="headline">
          问卷提交状态 {viewingScaleCode ? `· ${viewingScaleCode}` : ''}
        </div>
        <div slot="content" className="text-sm text-[var(--md-sys-color-on-surface-variant)] space-y-2">
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
        <div slot="actions">
          <OutlinedButton
            label="关闭"
            onClick={() => viewDialogRef.current?.close()}
          />
        </div>
      </md-dialog>

    </div>
  );
};
