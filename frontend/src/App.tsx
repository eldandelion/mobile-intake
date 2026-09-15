import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AssessmentProvider, useAssessments } from './contexts/AssessmentContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { AuthPage } from './pages/AuthPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { ProfilePage } from './pages/ProfilePage';
import './utils/navigationTabStyles';

function AppContent() {
  const { student, loading } = useAuth();
  const { totalCount, completedCount, remainingCount, isAllCompleted, loading: scalesLoading } = useAssessments();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col items-center justify-center p-6 text-center">
        <md-circular-progress indeterminate></md-circular-progress>
        <p className="mt-4 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
          正在初始化普查系统...
        </p>
      </div>
    );
  }

  if (!student) {
    return <AuthPage />;
  }

  return (
    <div className="w-full h-[100dvh] min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col items-center overflow-hidden">
      {/* MD3 Top Navigation Bar - spans full width on wider screens */}
      <header className="sticky top-0 inset-x-0 w-full bg-[var(--md-sys-color-surface-container-low)] z-20 shrink-0">
        <div className="w-full px-4 sm:px-8 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)] block">
              中南大学 · 心理普查
            </span>
            <h1 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] leading-none mt-0.5">
              {scalesLoading
                ? '正在获取测评任务...'
                : isAllCompleted
                  ? '全部测评任务已完成'
                  : `还有 ${remainingCount} 项任务待完成`}
            </h1>
          </div>
          {student && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
                {student.fullName} ({student.studentNumber})
              </span>
              <md-outlined-icon-button
                onClick={toggleTheme}
                aria-label={isDark ? '切换为浅色模式' : '切换为深色模式'}
                title={isDark ? '切换为浅色模式' : '切换为深色模式'}
                className="cursor-pointer"
              >
                <md-icon>{isDark ? 'light_mode' : 'dark_mode'}</md-icon>
              </md-outlined-icon-button>
            </div>
          )}
        </div>

        {/* Progress bar placed at the bottom of the top bar with no separation line */}
        <md-linear-progress
          value={completedCount}
          max={totalCount || 1}
          style={{
            width: '100%',
            '--md-linear-progress-track-height': '3px',
            '--md-linear-progress-active-indicator-height': '3px',
            display: 'block',
          } as any}
        />
      </header>

      {/* Main Body Content */}
      <main className="w-full max-w-md flex-1 p-4 sm:p-5 pt-6 sm:pt-8 pb-24 overflow-y-auto">
        {activeTab === 0 ? <AssessmentsPage /> : <ProfilePage />}
      </main>

      {/* MD3 Bottom Navigation Bar - spans full width on wider screens with zero bottom gap */}
      <nav
        className="fixed inset-x-0 w-full bg-[var(--md-sys-color-surface-container)] z-20 flex justify-center"
        style={{
          bottom: '-2px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2px)',
        }}
      >
        <md-navigation-bar
          active-index={activeTab}
          className="w-full flex"
          style={{
            '--md-navigation-bar-container-elevation': '0',
            '--md-elevation-level': '0',
            width: '100%',
          } as any}
        >
          <md-navigation-tab
            label="问卷测评"
            onClick={() => setActiveTab(0)}
          >
            <md-icon slot="active-icon">assignment</md-icon>
            <md-icon slot="inactive-icon">assignment</md-icon>
          </md-navigation-tab>
          <md-navigation-tab
            label="个人中心"
            onClick={() => setActiveTab(1)}
          >
            <md-icon slot="active-icon">account_circle</md-icon>
            <md-icon slot="inactive-icon">account_circle</md-icon>
          </md-navigation-tab>
        </md-navigation-bar>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <AuthProvider>
          <AssessmentProvider>
            <AppContent />
          </AssessmentProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
