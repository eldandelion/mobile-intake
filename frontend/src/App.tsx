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
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
      {/* Mobile-constrained viewport shell */}
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex flex-col relative">
        {/* Main Body Content */}
        <main className="flex-1 p-4 sm:p-5 pt-6 sm:pt-8 pb-24 overflow-y-auto">
          {activeTab === 0 ? <AssessmentsPage /> : <ProfilePage />}
        </main>

        {/* MD3 Bottom Navigation Bar */}
        <nav className="fixed bottom-0 max-w-md w-full bg-[var(--md-sys-color-surface-container)]">
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
