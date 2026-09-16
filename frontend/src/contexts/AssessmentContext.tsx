import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { intakeApi, ScaleSummaryDto } from '../api/intakeApi';
import { useAuth } from './AuthContext';

export type AssessmentFilterType = 'all' | 'unfinished' | 'completed';

export const ASSESSMENT_FILTER_ITEMS: { label: string; value: AssessmentFilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '未完成', value: 'unfinished' },
  { label: '已完成', value: 'completed' },
];

export interface AssessmentContextType {
  scales: ScaleSummaryDto[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  completedCount: number;
  remainingCount: number;
  isAllCompleted: boolean;
  refreshScales: () => Promise<void>;
  filter: AssessmentFilterType;
  setFilter: (filter: AssessmentFilterType) => void;
  isScrolled: boolean;
  setIsScrolled: (scrolled: boolean) => void;
}

export const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { student } = useAuth();
  const [scales, setScales] = useState<ScaleSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<AssessmentFilterType>('all');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

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
        filter,
        setFilter,
        isScrolled,
        setIsScrolled,
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
      filter: 'all',
      setFilter: () => {},
      isScrolled: false,
      setIsScrolled: () => {},
    };
  }
  return context;
};
