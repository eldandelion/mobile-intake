import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { intakeApi, ScaleSummaryDto } from '../api/intakeApi';
import { useAuth } from './AuthContext';

export interface AssessmentContextType {
  scales: ScaleSummaryDto[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  completedCount: number;
  remainingCount: number;
  isAllCompleted: boolean;
  refreshScales: () => Promise<void>;
}

export const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student } = useAuth();
  const [scales, setScales] = useState<ScaleSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshScales = useCallback(async () => {
    if (!student) {
      setScales([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await intakeApi.getScales();
      setScales(list);
    } catch (err: any) {
      console.error('Failed to load scales:', err);
      setError(err.message || '获取问卷列表失败');
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    refreshScales();
  }, [refreshScales]);

  const totalCount = scales.length;
  const completedCount = scales.filter((s) => s.status === 'COMPLETED').length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const isAllCompleted = totalCount > 0 && remainingCount === 0;

  return (
    <AssessmentContext.Provider
      value={{
        scales,
        loading,
        error,
        totalCount,
        completedCount,
        remainingCount,
        isAllCompleted,
        refreshScales,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessments = (): AssessmentContextType => {
  const context = useContext(AssessmentContext);
  if (!context) {
    return {
      scales: [],
      loading: false,
      error: null,
      totalCount: 0,
      completedCount: 0,
      remainingCount: 0,
      isAllCompleted: false,
      refreshScales: async () => {},
    };
  }
  return context;
};
