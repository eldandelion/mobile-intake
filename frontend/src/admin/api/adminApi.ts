/**
 * Admin Console API Client & Token Management
 */

export const ADMIN_TOKEN_KEY = 'mobile_intake_admin_token';

export const adminTokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export interface AdminAuthResponse {
  token: string;
  username: string;
  role: string;
}

export interface ScaleMetricStat {
  scaleCode: string;
  title: string;
  completedCount: number;
  inProgressCount: number;
  totalStudents: number;
  completionRate: number;
}

export interface AdminDashboardMetrics {
  totalStudents: number;
  fullyCompletedStudents: number;
  overallCompletionRate: number;
  scaleStats: ScaleMetricStat[];
}

export interface StudentScaleStatusItem {
  scaleCode: string;
  title: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  completedAt?: string;
}

export interface AdminStudentSummaryDto {
  studentNumber: string;
  fullName: string;
  phone: string;
  registeredAt: string;
  scaleStatuses: StudentScaleStatusItem[];
  allCompleted: boolean;
}

export interface AdminStudentDetailDto {
  studentNumber: string;
  fullName: string;
  phone: string;
  registeredAt: string;
  demographics?: Record<string, any>;
  scaleStatuses: StudentScaleStatusItem[];
}

export interface ResetPasswordResponse {
  studentNumber: string;
  newPassword: string;
  message: string;
}

export interface DeleteStudentResponse {
  studentNumber: string;
  success: boolean;
  message: string;
}

const API_BASE = '/api/admin';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = adminTokenStorage.get();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // If unauthorized on admin endpoint
      if (endpoint !== '/auth/login') {
        adminTokenStorage.clear();
      }
    }
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `请求失败 (${response.status})`);
  }

  return response.json();
}

export const adminApi = {
  login: async (secret: string): Promise<AdminAuthResponse> => {
    const res = await request<AdminAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ secret }),
    });
    if (res.token) {
      adminTokenStorage.set(res.token);
    }
    return res;
  },

  getMe: async (): Promise<AdminAuthResponse> => {
    return request<AdminAuthResponse>('/auth/me');
  },

  getMetrics: async (): Promise<AdminDashboardMetrics> => {
    return request<AdminDashboardMetrics>('/dashboard/metrics');
  },

  getStudents: async (search?: string): Promise<AdminStudentSummaryDto[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<AdminStudentSummaryDto[]>(`/students${query}`);
  },

  getStudentDetail: async (studentNumber: string): Promise<AdminStudentDetailDto> => {
    return request<AdminStudentDetailDto>(`/students/${encodeURIComponent(studentNumber)}`);
  },

  resetPassword: async (studentNumber: string, newPassword?: string): Promise<ResetPasswordResponse> => {
    return request<ResetPasswordResponse>(`/students/${encodeURIComponent(studentNumber)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  deleteStudent: async (studentNumber: string): Promise<DeleteStudentResponse> => {
    return request<DeleteStudentResponse>(`/students/${encodeURIComponent(studentNumber)}`, {
      method: 'DELETE',
    });
  },

  downloadExport: async (type: 'zip' | 'students' | 'assessments', filename: string): Promise<void> => {
    const token = adminTokenStorage.get();
    const endpoint = type === 'zip' ? '/export/package.zip' : `/export/${type}.csv`;
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!response.ok) {
      throw new Error(`导出失败: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
