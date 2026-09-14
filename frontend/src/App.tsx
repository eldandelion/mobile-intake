import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { ProfilePage } from './pages/ProfilePage';
import './utils/navigationTabStyles';

function AppContent() {
  const { student, loading } = useAuth();
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
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col items-center">
      {/* MD3 Top Navigation Bar - spans full width on wider screens */}
      <header className="sticky top-0 inset-x-0 w-full bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] border-opacity-40 z-20 shrink-0">
        <div className="w-full px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <md-icon className="text-[var(--md-sys-color-primary)] text-2xl">psychology</md-icon>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)] block">
                中南大学 · 心理健康中心
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] leading-none mt-0.5">
                新生心理普查与建档
              </h1>
            </div>
          </div>
          {student && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
                {student.fullName} ({student.studentNumber})
              </span>
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className="w-9 h-9 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-sm shadow-xs active:scale-95 transition cursor-pointer"
                title="查看个人中心"
              >
                {student.fullName ? student.fullName.slice(0, 1) : '学'}
              </button>
            </div>
          )}
        </div>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
