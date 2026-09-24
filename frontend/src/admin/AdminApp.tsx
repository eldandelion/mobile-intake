import { useState } from 'react';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { AdminSidebar } from './layout/AdminSidebar';
import { AdminNavItem } from './layout/AdminNavItem';
import { AdminHeader } from './layout/AdminHeader';
import { AdminMainContent } from './layout/AdminMainContent';
import { DetailsPanel } from './components/DetailsPanel';
import { AdminStudentDetailDto, adminApi } from './api/adminApi';

export type AdminTab = 'dashboard' | 'users';

function AdminShell() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student for side panel in student management
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentDetailDto | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [sidePanelLoading, setSidePanelLoading] = useState(false);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab !== 'users') {
      setIsSidePanelOpen(false);
    }
  };

  const handleResetPassword = async (studentNumber: string) => {
    try {
      const res = await adminApi.resetPassword(studentNumber);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || '重置密码失败');
    }
  };

  const handleDeleteStudent = async (studentNumber: string, name: string) => {
    if (!window.confirm(`确定要删除学生 ${name} (${studentNumber}) 吗？`)) return;
    try {
      const res = await adminApi.deleteStudent(studentNumber);
      alert(res.message);
      setIsSidePanelOpen(false);
      setSelectedStudent(null);
    } catch (err: any) {
      alert(err.message || '删除学生失败');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[var(--md-sys-color-surface-container)] flex flex-col items-center justify-center">
        <md-circular-progress indeterminate></md-circular-progress>
        <p className="mt-4 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
          正在加载管理控制台...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-background)',
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      {/* Left Navigation Rail matching medical-system Sidebar */}
      <AdminSidebar>
        <AdminNavItem
          icon="dashboard"
          label="系统总览"
          active={activeTab === 'dashboard'}
          onClick={() => handleTabChange('dashboard')}
        />
        <AdminNavItem
          icon="group"
          label="学生档案"
          active={activeTab === 'users'}
          onClick={() => handleTabChange('users')}
        />
      </AdminSidebar>

      {/* Right Application Workspace matching medical-system Header + MainContent */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
        <AdminHeader
          searchPlaceholder="全局搜索学生与作答记录"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <AdminMainContent
          isSidePanelOpen={isSidePanelOpen && activeTab === 'users'}
          sidePanel={
            <DetailsPanel
              isOpen={isSidePanelOpen && activeTab === 'users'}
              onClose={() => setIsSidePanelOpen(false)}
              student={selectedStudent}
              loading={sidePanelLoading}
              onResetPassword={handleResetPassword}
              onDeleteStudent={handleDeleteStudent}
            />
          }
        >
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToUsers={() => handleTabChange('users')}
            />
          )}

          {activeTab === 'users' && (
            <StudentManagementPage
              searchQuery={searchQuery}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
              isSidePanelOpen={isSidePanelOpen}
              setIsSidePanelOpen={setIsSidePanelOpen}
              setIsSidePanelLoading={setSidePanelLoading}
            />
          )}
        </AdminMainContent>
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <AdminShell />
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
