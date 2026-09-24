import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, adminTokenStorage, AdminAuthResponse } from '../api/adminApi';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminAuthResponse | null;
  loading: boolean;
  login: (secret: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminAuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = adminTokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }

    adminApi.getMe()
      .then((user) => {
        setAdminUser(user);
      })
      .catch(() => {
        adminTokenStorage.clear();
        setAdminUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (secret: string) => {
    const res = await adminApi.login(secret);
    setAdminUser(res);
  };

  const logout = () => {
    adminTokenStorage.clear();
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!adminUser,
        adminUser,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
