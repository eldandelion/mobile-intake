import { lazy, Suspense } from 'react';
import { StudentApp } from './StudentApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function AdminLoadingSplash() {
  return (
    <div className="h-screen w-screen bg-[var(--md-sys-color-surface-container)] flex flex-col items-center justify-center">
      <md-circular-progress indeterminate></md-circular-progress>
      <p className="mt-4 text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
        正在加载管理控制台...
      </p>
    </div>
  );
}

export default function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Suspense fallback={<AdminLoadingSplash />}>
        <AdminApp />
      </Suspense>
    );
  }

  return <StudentApp />;
}
