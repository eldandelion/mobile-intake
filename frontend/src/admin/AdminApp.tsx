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
import { ResetPasswordDialog } from './components/ResetPasswordDialog';
import { DeleteStudentDialog } from './components/DeleteStudentDialog';
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

  // Dialog states for reset password and delete student
  const [resetTarget, setResetTarget] = useState<{ studentNumber: string; studentName?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ studentNumber: string; studentName: string } | null>(null);

  // In-app snackbar notification state (replaces browser alerts)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab !== 'users') {
      setIsSidePanelOpen(false);
    }
  };

  const handleOpenResetPassword = (studentNumber: string, studentName?: string) => {
    setResetTarget({ studentNumber, studentName });
  };

  const handleOpenDeleteStudent = (studentNumber: string, studentName: string) => {
    setDeleteTarget({ studentNumber, studentName });
  };

  const handleConfirmResetPassword = async (studentNumber: string, newPassword?: string) => {
    try {
      const res = await adminApi.resetPassword(studentNumber, newPassword);
      setFeedback({ message: res.message, type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setFeedback({ message: err.message || '重置密码失败', type: 'error' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleConfirmDeleteStudent = async (studentNumber: string) => {
    try {
      const res = await adminApi.deleteStudent(studentNumber);
      setFeedback({ message: res.message, type: 'success' });
      setTimeout(() => setFeedback(null), 4000);
      if (selectedStudent?.studentNumber === studentNumber) {
        setIsSidePanelOpen(false);
        setSelectedStudent(null);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setFeedback({ message: err.message || '删除学生失败', type: 'error' });
      setTimeout(() => setFeedback(null), 4000);
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
      <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative">
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
              onResetPassword={handleOpenResetPassword}
              onDeleteStudent={handleOpenDeleteStudent}
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
              onResetPassword={handleOpenResetPassword}
              onDeleteStudent={handleOpenDeleteStudent}
              refreshKey={refreshTrigger}
            />
          )}
        </AdminMainContent>

        {/* Global Floating Material Design Snackbar Notification */}
        {feedback && (
          <div
            role="status"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 select-none border border-[var(--md-sys-color-outline-variant)]"
            style={{
              backgroundColor:
                feedback.type === 'error'
                  ? 'var(--md-sys-color-error-container)'
                  : 'var(--md-sys-color-surface-container-highest)',
              color:
                feedback.type === 'error'
                  ? 'var(--md-sys-color-on-error-container)'
                  : 'var(--md-sys-color-on-surface)',
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{
                color:
                  feedback.type === 'error'
                    ? 'var(--md-sys-color-error)'
                    : 'var(--md-sys-color-primary)',
              }}
            >
              {feedback.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span className="text-xs font-semibold">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Material Design Reset Password Dialog (Two-step confirmation) */}
      {resetTarget && (
        <ResetPasswordDialog
          isOpen={!!resetTarget}
          studentNumber={resetTarget.studentNumber}
          studentName={resetTarget.studentName}
          onClose={() => setResetTarget(null)}
          onConfirm={handleConfirmResetPassword}
        />
      )}

      {/* Material Design Delete Student Confirmation Dialog */}
      {deleteTarget && (
        <DeleteStudentDialog
          isOpen={!!deleteTarget}
          studentNumber={deleteTarget.studentNumber}
          studentName={deleteTarget.studentName}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDeleteStudent}
        />
      )}
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
