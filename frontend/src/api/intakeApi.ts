/**
 * Mobile Intake API Client
 * Interacts with Spring Boot Intake Backend (/api)
 */

export interface StudentDto {
  studentNumber: string;
  fullName: string;
  phone: string;
  registeredAt: string;
}

export interface AuthResponse {
  token: string;
  studentNumber?: string;
  fullName?: string;
  phone?: string;
  student?: StudentDto;
}

export interface RegisterRequest {
  studentNumber: string;
  fullName: string;
  phone: string;
  password?: string;
}

export interface LoginRequest {
  identifier?: string;
  studentNumber?: string;
  password?: string;
}

export interface ScaleSummaryDto {
  code: string;
  title: string;
  subtitle?: string;
  description: string;
  questionCount: number;
  estimatedMinutes: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  answeredCount?: number;
  completionPercentage?: number;
}

export interface ScaleDraftDto {
  scaleCode: string;
  answers: Record<string, any>;
  updatedAt: number;
}

export interface ScaleOption {
  value: any;
  label: string;
  hasTextInput?: boolean;
  textInputPlaceholder?: string;
  textInputLabel?: string;
}

export interface ScaleQuestion {
  id: string;
  text: string;
  orderNum: number;
  type: string; // 'single_choice' | 'multiple_choice' | 'number' | 'slider' | 'text' | 'select'
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  minLabel?: string;
  maxLabel?: string;
  options: ScaleOption[];
  sectionCode?: string;
  sectionTitle?: string;
}

export interface BatterySection {
  code: string;
  title: string;
  questionCount: number;
  orderNum: number;
}

export interface ScaleIntroItem {
  icon?: string;
  title: string;
  description: string;
}

export interface ScaleDetail {
  code: string;
  title: string;
  subtitle?: string;
  description: string;
  estimatedMinutes: number;
  instructions?: string;
  introItems?: ScaleIntroItem[];
  questions: ScaleQuestion[];
  sections?: BatterySection[];
}

export interface SubmitScaleResponse {
  scaleCode: string;
  status: string;
  completedAt: string;
}

const TOKEN_KEY = 'mobile_intake_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
    keepalive: options.keepalive,
  });

  if (!res.ok) {
    let errorMsg = '网络请求失败';
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || `请求失败 (${res.status})`;
    } catch {
      errorMsg = `请求失败 (${res.status})`;
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return null as unknown as T;
  }

  const text = await res.text();
  if (!text) {
    return null as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const intakeApi = {
  // Auth
  register: (data: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) => {
    const id = data.identifier || data.studentNumber || '';
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: id,
        studentNumber: id,
        password: data.password || '',
      }),
    });
  },

  sendCode: (phone: string) =>
    request<{ phone: string; devCode: string; expiresInSeconds: number }>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyCode: (phone: string, code: string) =>
    request<{ valid: boolean }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  getMe: () => request<StudentDto>('/api/auth/me'),

  // Scales
  getScales: () => request<ScaleSummaryDto[]>('/api/scales'),

  getScaleDetail: (code: string) => request<ScaleDetail>(`/api/scales/${code}`),

  submitScale: (code: string, answers: Record<string, any>) =>
    request<SubmitScaleResponse>(`/api/scales/${code}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getSubmission: (code: string) =>
    request<{ scaleCode: string; status: string; completedAt: string; answers: Record<string, any> }>(
      `/api/scales/${code}/submission`
    ),

  // In-session drafts
  getDraft: (code: string) =>
    request<ScaleDraftDto | null>(`/api/scales/${code}/draft`),

  saveDraft: (code: string, data: { answers: Record<string, any>; updatedAt: number }, keepalive?: boolean) =>
    request<void>(`/api/scales/${code}/draft`, {
      method: 'PUT',
      body: JSON.stringify(data),
      keepalive,
    }),

  deleteDraft: (code: string) =>
    request<void>(`/api/scales/${code}/draft`, {
      method: 'DELETE',
    }),
};
