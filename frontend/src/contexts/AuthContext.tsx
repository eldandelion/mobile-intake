import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { intakeApi, tokenStorage, StudentDto, LoginRequest, RegisterRequest } from '../api/intakeApi';

interface AuthContextType {
  student: StudentDto | null;
  token: string | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshStudent: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshStudent = useCallback(async () => {
    const currentToken = tokenStorage.get();
    if (!currentToken) {
      setStudent(null);
      setLoading(false);
      return;
    }
    try {
      const me = await intakeApi.getMe();
      setStudent(me);
    } catch (err) {
      console.warn('Failed to validate session token, clearing credentials:', err);
      tokenStorage.clear();
      setToken(null);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStudent();
  }, [refreshStudent]);

  const login = async (req: LoginRequest) => {
    const res = await intakeApi.login(req);
    tokenStorage.set(res.token);
    setToken(res.token);
    const s = res.student;
    setStudent({
      studentNumber: s?.studentNumber || res.studentNumber || req.identifier || req.studentNumber || '',
      fullName: s?.fullName || res.fullName || '',
      phone: s?.phone || res.phone || '',
      registeredAt: (s as any)?.createdAt || (s as any)?.registeredAt || new Date().toISOString(),
    });
  };

  const register = async (req: RegisterRequest) => {
    const res = await intakeApi.register(req);
    tokenStorage.set(res.token);
    setToken(res.token);
    const s = res.student;
    setStudent({
      studentNumber: s?.studentNumber || res.studentNumber || req.studentNumber || '',
      fullName: s?.fullName || res.fullName || req.fullName || '',
      phone: s?.phone || res.phone || req.phone || '',
      registeredAt: (s as any)?.createdAt || (s as any)?.registeredAt || new Date().toISOString(),
    });
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        token,
        loading,
        login,
        register,
        logout,
        refreshStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
