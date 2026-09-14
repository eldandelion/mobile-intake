import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { ProfilePage } from './pages/ProfilePage';

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

  const firstLetter = student.fullName ? student.fullName.slice(0, 1) : '学';

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
      {/* Mobile-constrained viewport shell */}
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] border-x border-[var(--md-sys-color-outline-variant)] border-opacity-30 flex flex-col relative shadow-xl">
        
        {/* Top App Header */}
        <header className="px-5 pt-5 pb-3.5 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] border-opacity-40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                中南大学 · 心理健康中心
              </span>
              <h1 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                新生心理普查与建档
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className="w-9 h-9 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-sm shadow-xs active:scale-95 transition"
              title="查看个人中心"
            >
              {firstLetter}
            </button>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-4 sm:p-5 pb-24 overflow-y-auto">
          {activeTab === 0 ? <AssessmentsPage /> : <ProfilePage />}
        </main>

        {/* MD3 Bottom Navigation Bar */}
        <nav className="fixed bottom-0 max-w-md w-full bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] border-opacity-40 z-30">
          <md-navigation-bar active-index={activeTab}>
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
