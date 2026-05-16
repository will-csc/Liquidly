import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { loadingBus } from './loadingBus';
import { readSessionToken } from '@/lib/authStorage';
import type { 
  User, 
  AuthResponse,
  LoginRequest, 
  FaceLoginRequest,
  SignupRequest, 
  Bom, 
  Conversion, 
  Invoice, 
  Po, 
  Project,
  ReportJobStartResponse,
  ReportJobStatusResponse,
} from '../types';

type RequestConfigWithLoading = InternalAxiosRequestConfig & {
  skipGlobalLoading?: boolean;
  metadata?: {
    start: number;
    id: string;
  };
};

// URL Configuration
const IS_PROD_BUILD = import.meta.env.MODE === 'production';
const PROD_URL = import.meta.env.VITE_API_URL_PROD || 'https://liquidly-backend.onrender.com';
const LOCAL_URL = (import.meta.env.VITE_API_URL_LOCAL || '').trim();
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
const canUseLocalFallback = !IS_PROD_BUILD && LOCAL_URL.length > 0;
const LOG_API = !IS_PROD_BUILD;
const LOG_TO_FRONTEND_TERMINAL = import.meta.env.DEV;

// Determine initial URL based on environment
// Always try PROD first, fallback to LOCAL only if PROD is unreachable.
const INITIAL_URL = PROD_URL;

// Current Connection State
let currentBaseUrl = INITIAL_URL;
let isFallbackActive = false;

console.log(`[API Config] Initializing API with URL: ${currentBaseUrl} (Mode: ${import.meta.env.MODE})`);

const nowMs = () => Date.now();

const newRequestId = () => `${nowMs().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

const redactValue = (key: string, value: unknown) => {
  const normalizedKey = key.toLowerCase();
  if (
    normalizedKey === 'authorization' ||
    normalizedKey.includes('token') ||
    normalizedKey.includes('password') ||
    normalizedKey.includes('faceimage')
  ) {
    return '[REDACTED]';
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return `[Blob size=${value.size}]`;
  }
  return value;
};

const redactObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactObject(item));
  }

  const record = asRecord(value);
  if (!record) return value;

  const output: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(record)) {
    output[key] = redactValue(key, redactObject(entryValue));
  }
  return output;
};

const safeToLog = (value: unknown): unknown => {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') {
    return value.length > 800 ? `${value.slice(0, 800)}...` : value;
  }
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return '[FormData]';
  }
  return redactObject(value);
};

const postFrontendTerminalLog = (payload: Record<string, unknown>) => {
  if (!LOG_TO_FRONTEND_TERMINAL || typeof window === 'undefined') return;

  const body = JSON.stringify(payload);
  const url = '/__client-log';

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    if (ok) return;
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    void 0;
  });
};

const logApiEvent = (label: string, payload: Record<string, unknown>, consoleMethod: 'log' | 'warn' | 'error' = 'log') => {
  if (!LOG_API) return;

  console[consoleMethod](label, payload);
  postFrontendTerminalLog({
    timestamp: new Date().toISOString(),
    label,
    consoleMethod,
    payload,
  });
};

const getResponseMessage = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null) return null;
  if (!('message' in data)) return null;
  const message = (data as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
};

const getStoredToken = (): string => {
  return readSessionToken();
};

const getStoredLanguage = (): string => {
  try {
    const v = localStorage.getItem('language') || '';
    if (v === 'pt' || v === 'en' || v === 'es') return v;
  } catch {
    void 0;
  }
  return 'pt';
};

const logApiError = (label: string, error: AxiosError) => {
  const config = error.config as RequestConfigWithLoading | undefined;
  const method = typeof config?.method === 'string' ? config.method.toUpperCase() : undefined;
  const url = config?.url;
  const baseURL = config?.baseURL || currentBaseUrl;
  const status = error.response?.status;
  const responseMessage = getResponseMessage(error.response?.data);
  const elapsedMs = config?.metadata ? nowMs() - config.metadata.start : undefined;

  logApiEvent(label, {
    id: config?.metadata?.id,
    baseURL,
    method,
    url,
    status,
    code: error.code,
    message: responseMessage || error.message,
    elapsedMs,
    params: safeToLog(config?.params),
    request: safeToLog(config?.data),
    response: safeToLog(error.response?.data),
  }, 'error');
};

// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: Number.isFinite(API_TIMEOUT_MS) && API_TIMEOUT_MS > 0 ? API_TIMEOUT_MS : 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Ensure correct Base URL is used
api.interceptors.request.use(
  (config: RequestConfigWithLoading) => {
    config.metadata = { start: nowMs(), id: newRequestId() };
    if (!config.skipGlobalLoading) {
      loadingBus.start();
    }
    // If fallback is active, force the new URL
    if (config.baseURL !== currentBaseUrl) {
      config.baseURL = currentBaseUrl;
    }
    const language = getStoredLanguage();
    if (!config.headers) {
      config.headers = {} as unknown as typeof config.headers;
    }
    const h0 = config.headers as unknown as { set?: (k: string, v: string) => void; [k: string]: unknown };
    if (typeof h0?.set === 'function') {
      h0.set('Accept-Language', language);
    } else {
      h0['Accept-Language'] = language;
    }
    const token = getStoredToken();
    if (token) {
      if (!config.headers) {
        config.headers = {} as unknown as typeof config.headers;
      }
      const h = config.headers as unknown as { set?: (k: string, v: string) => void; [k: string]: unknown };
      if (typeof h?.set === 'function') {
        h.set('Authorization', `Bearer ${token}`);
      } else {
        h.Authorization = `Bearer ${token}`;
      }
    }
    logApiEvent('[API Request]', {
      id: config.metadata.id,
      method: typeof config.method === 'string' ? config.method.toUpperCase() : 'GET',
      baseURL: config.baseURL || currentBaseUrl,
      url: config.url || '',
      params: safeToLog(config.params),
      data: safeToLog(config.data),
      headers: safeToLog(config.headers),
    });
    return config;
  },
  (error) => {
    loadingBus.end();
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors and manage Failover
api.interceptors.response.use(
  (response) => {
    const responseConfig = response.config as RequestConfigWithLoading;
    if (!responseConfig.skipGlobalLoading) {
      loadingBus.end();
    }
    logApiEvent('[API Response]', {
      id: responseConfig.metadata?.id,
      method: typeof responseConfig.method === 'string' ? responseConfig.method.toUpperCase() : 'GET',
      baseURL: responseConfig.baseURL || currentBaseUrl,
      url: responseConfig.url || '',
      status: response.status,
      elapsedMs: responseConfig.metadata ? nowMs() - responseConfig.metadata.start : undefined,
      data: safeToLog(response.data),
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (RequestConfigWithLoading & { _retry?: boolean }) | undefined;
    if (!originalRequest?.skipGlobalLoading) {
      loadingBus.end();
    }

    // Check if it's a network/connection error and retry hasn't been attempted yet
    // Only attempt failover if we are currently using PROD_URL
    if (
      canUseLocalFallback &&
      !isFallbackActive &&
      currentBaseUrl === PROD_URL &&
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response)
    ) {
      logApiError('[API Error] Production request failed (will try local fallback)', error);
      logApiEvent(
        '[API Failover]',
        {
          from: PROD_URL,
          to: LOCAL_URL,
          reason: error.message,
          code: error.code,
        },
        'warn'
      );
      
      // Mark request to prevent infinite loop
      originalRequest._retry = true;
      
      // Activate fallback mode
      isFallbackActive = true;
      currentBaseUrl = LOCAL_URL;
      
      // Update instance Base URL for future requests
      api.defaults.baseURL = LOCAL_URL;
      
      // Update current request URL and retry
      originalRequest.baseURL = LOCAL_URL;
      logApiEvent('[API Failover] Switching URL', { activeBaseUrl: LOCAL_URL }, 'warn');
      
      try {
        return await api(originalRequest);
      } catch (retryError) {
        if (axios.isAxiosError(retryError)) {
          logApiError('[API Failover] Backup server (local) also failed', retryError);
        } else {
          logApiEvent('[API Failover] Backup server (local) also failed', {
            error: retryError instanceof Error ? retryError.message : String(retryError),
          }, 'error');
        }
        return Promise.reject(retryError);
      }
    }

    logApiError('[API Error]', error);
    return Promise.reject(error);
  }
);

// Helper function to reset URL (useful for testing or "Try Again" button)
export const resetApiUrl = () => {
  console.log('[API Config] Resetting to Production URL...');
  isFallbackActive = false;
  currentBaseUrl = PROD_URL;
  api.defaults.baseURL = PROD_URL;
};

// Function to check which URL is active
export const getCurrentBaseUrl = () => currentBaseUrl;

const withSilentLoading = <T extends Record<string, unknown>>(config: T): T & { skipGlobalLoading: true } => ({
  ...config,
  skipGlobalLoading: true,
});

const getDownloadFilename = (contentDisposition?: string): string => {
  if (!contentDisposition) return 'liquidly_report.xlsx';
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || 'liquidly_report.xlsx';
};

// --- API Services ---

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/users/login', data);
    return response.data;
  },

  loginFace: async (data: FaceLoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/users/login-face', data);
    return response.data;
  },
  
  signup: async (data: SignupRequest): Promise<User> => {
    const response = await api.post<User>('/api/users/signup', data, { timeout: 60000 });
    return response.data;
  },

  emailExists: async (email: string): Promise<boolean> => {
    const response = await api.get<{ exists: boolean }>('/api/users/exists', { params: { email } });
    return response.data.exists;
  },

  sendRecoveryCode: async (email: string): Promise<void> => {
    await api.post('/api/users/recovery/send-code', { email });
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await api.post('/api/users/recovery/reset-password', { email, code, newPassword });
  }
};

export const userService = {
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`, { timeout: 60000 });
  },
};

export const bomService = {
  getAll: async (): Promise<Bom[]> => {
    const response = await api.get<Bom[]>('/api/boms');
    return response.data;
  },

  getByCompany: async (companyId: number): Promise<Bom[]> => {
    const response = await api.get<Bom[]>(`/api/boms/company/${companyId}`);
    return response.data;
  },

  create: async (data: Bom): Promise<Bom> => {
    const response = await api.post<Bom>('/api/boms', data);
    return response.data;
  },

  update: async (id: number, data: Bom): Promise<Bom> => {
    const response = await api.put<Bom>(`/api/boms/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/boms/${id}`);
  }
};

export const conversionService = {
  getAll: async (): Promise<Conversion[]> => {
    const response = await api.get<Conversion[]>('/api/conversions');
    return response.data;
  },

  getByCompany: async (companyId: number): Promise<Conversion[]> => {
    const response = await api.get<Conversion[]>(`/api/conversions/company/${companyId}`);
    return response.data;
  },

  create: async (data: Conversion): Promise<Conversion> => {
    const response = await api.post<Conversion>('/api/conversions', data);
    return response.data;
  },

  update: async (id: number, data: Conversion): Promise<Conversion> => {
    const response = await api.put<Conversion>(`/api/conversions/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/conversions/${id}`);
  }
};

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>('/api/invoices');
    return response.data;
  },

  getByCompany: async (companyId: number): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>(`/api/invoices/company/${companyId}`);
    return response.data;
  },

  create: async (data: Invoice): Promise<Invoice> => {
    const response = await api.post<Invoice>('/api/invoices', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/invoices/${id}`);
  }
};

export const poService = {
  getAll: async (): Promise<Po[]> => {
    const response = await api.get<Po[]>('/api/pos');
    return response.data;
  },

  getByCompany: async (companyId: number): Promise<Po[]> => {
    const response = await api.get<Po[]>(`/api/pos/company/${companyId}`);
    return response.data;
  },

  create: async (data: Po): Promise<Po> => {
    const response = await api.post<Po>('/api/pos', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/pos/${id}`);
  }
};

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/api/projects');
    return response.data;
  },

  getByCompany: async (companyId: number): Promise<Project[]> => {
    const response = await api.get<Project[]>(`/api/projects/company/${companyId}`);
    return response.data;
  },

  create: async (data: Project): Promise<Project> => {
    const response = await api.post<Project>('/api/projects', data);
    return response.data;
  },

  update: async (id: number, data: Project): Promise<Project> => {
    const response = await api.put<Project>(`/api/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  }
};

export const reportService = {
  runReport: async (payload: {
    companyId: number;
    projectId: number;
    selectedBom: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ReportJobStartResponse> => {
    const response = await api.post<ReportJobStartResponse>(
      '/api/liquidation-results/run-report',
      payload,
      withSilentLoading({ timeout: 120000 })
    );
    return response.data;
  },

  downloadReport: async (jobId: string, companyId: number): Promise<{ blob: Blob; fileName: string }> => {
    const response = await api.get(
      `/api/liquidation-results/run-report/${jobId}/download`,
      withSilentLoading({
        params: { companyId },
        responseType: 'blob' as const,
        timeout: 120000,
      })
    );
    return {
      blob: response.data as Blob,
      fileName: getDownloadFilename(response.headers['content-disposition']),
    };
  },

  getReportStatus: async (jobId: string, companyId: number): Promise<ReportJobStatusResponse> => {
    const response = await api.get<ReportJobStatusResponse>(
      `/api/liquidation-results/run-report/${jobId}/status`,
      withSilentLoading({
        params: { companyId },
        timeout: 15000,
      })
    );
    return response.data;
  }
};

export default api;
