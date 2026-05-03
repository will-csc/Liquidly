import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { 
  User, 
  AuthResponse,
  FaceLoginRequest,
  LoginRequest, 
  SignupRequest, 
  Bom, 
  Conversion, 
  Invoice, 
  Po, 
  Project,
  ReportJobStartResponse,
  ReportJobStatusResponse,
} from '../types';
import { userStorage } from './userStorage';
import { getCurrentLanguage } from '../i18n/i18n';

// URL Configuration
// Match the same primary backend URL strategy used by the web frontend.
// Allow overrides via Expo public env vars while keeping the same defaults.
const PROD_URL =
  process.env.EXPO_PUBLIC_API_URL_PROD ||
  'https://liquidly-backend.onrender.com';
const LOCAL_URL =
  process.env.EXPO_PUBLIC_API_URL_LOCAL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

let currentBaseUrl = PROD_URL;
let isFallbackActive = false;

type RequestMeta = { start: number; id: string };

const IS_TEST = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
const LOG_API = IS_DEV && !IS_TEST;
const API_TIMEOUT_MS = IS_DEV ? 5000 : 20000;
const NETWORK_ERROR_CODES = new Set(['ECONNABORTED', 'ERR_NETWORK']);

const isNetworkFailure = (error: AxiosError) =>
  NETWORK_ERROR_CODES.has(error.code || '') ||
  error.message.includes('Network Error') ||
  error.message.includes('timeout') ||
  !error.response;

if (LOG_API) console.log(`[Mobile API] Initializing with URL: ${currentBaseUrl}`);

const nowMs = () => Date.now();

const newRequestId = () => `${nowMs().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const asRecord = (v: unknown): Record<string, unknown> | null => (typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null);

const redactValue = (key: string, value: unknown) => {
  const k = key.toLowerCase();
  if (k === 'authorization' || k.includes('token')) return '[REDACTED]';
  if (k.includes('password')) return '[REDACTED]';
  if (k.includes('faceimage')) return '[REDACTED]';
  return value;
};

const redactObject = (obj: unknown): unknown => {
  const rec = asRecord(obj);
  if (!rec) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    out[k] = redactValue(k, v);
  }
  return out;
};

const safeToLog = (value: unknown) => {
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value.length > 800 ? `${value.slice(0, 800)}…` : value;
  return redactObject(value);
};

const logRequest = (config: InternalAxiosRequestConfig & { metadata?: RequestMeta }) => {
  if (!LOG_API) return;
  const method = typeof config.method === 'string' ? config.method.toUpperCase() : 'GET';
  const baseURL = config.baseURL || currentBaseUrl;
  const url = config.url || '';
  const params = safeToLog(config.params);
  const data = safeToLog(config.data);
  const headers = safeToLog(config.headers);
  console.log('[Mobile API] Request', {
    id: config.metadata?.id,
    method,
    baseURL,
    url,
    params,
    data,
    headers,
  });
};

const logResponse = (
  config: InternalAxiosRequestConfig & { metadata?: RequestMeta },
  status: number,
  data: unknown
) => {
  if (!LOG_API) return;
  const method = typeof config.method === 'string' ? config.method.toUpperCase() : 'GET';
  const baseURL = config.baseURL || currentBaseUrl;
  const url = config.url || '';
  const elapsedMs = config.metadata ? nowMs() - config.metadata.start : undefined;
  console.log('[Mobile API] Response', {
    id: config.metadata?.id,
    method,
    baseURL,
    url,
    status,
    elapsedMs,
    data: safeToLog(data),
  });
};

const logError = (error: AxiosError) => {
  if (!LOG_API) return;
  const config = (error.config || {}) as InternalAxiosRequestConfig & { metadata?: RequestMeta };
  const method = typeof config.method === 'string' ? config.method.toUpperCase() : undefined;
  const baseURL = config.baseURL || currentBaseUrl;
  const url = config.url;
  const status = error.response?.status;
  const elapsedMs = config.metadata ? nowMs() - config.metadata.start : undefined;
  const responseData = error.response?.data;

  console.log('[Mobile API] Error', {
    id: config.metadata?.id,
    method,
    baseURL,
    url,
    status,
    code: error.code,
    message: error.message,
    elapsedMs,
    response: safeToLog(responseData),
  });
};

// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Ensure updated URL
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const cfg = config as InternalAxiosRequestConfig & { metadata?: RequestMeta };
    cfg.metadata = { start: nowMs(), id: newRequestId() };
    if (config.baseURL !== currentBaseUrl) {
      config.baseURL = currentBaseUrl;
    }
    const language = getCurrentLanguage();
    const baseHeaders = config.headers as any;
    if (baseHeaders && typeof baseHeaders.set === 'function') {
      baseHeaders.set('Accept-Language', language);
    } else if (baseHeaders && typeof baseHeaders === 'object') {
      baseHeaders['Accept-Language'] = language;
    }
    const token = userStorage.getToken();
    if (token) {
      const headers = config.headers as any;
      if (headers && typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (headers && typeof headers === 'object') {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    logRequest(cfg);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Failover Logic
api.interceptors.response.use(
  (response) => {
    const cfg = (response.config || {}) as InternalAxiosRequestConfig & { metadata?: RequestMeta };
    logResponse(cfg, response.status, response.data);
    return response;
  },
  async (error: AxiosError) => {
    logError(error);
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      try {
        await userStorage.clearUser();
      } catch {}
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
      }
      return Promise.reject(error);
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If network/connection error and fallback hasn't been tried yet
    if (
      IS_DEV &&
      !isFallbackActive &&
      currentBaseUrl === PROD_URL &&
      originalRequest &&
      !originalRequest._retry &&
      isNetworkFailure(error)
    ) {
      console.warn(`[Mobile API Failover] Failed to connect to ${PROD_URL}. Attempting fallback to local server (Backup)...`);
      
      originalRequest._retry = true;
      isFallbackActive = true;
      currentBaseUrl = LOCAL_URL;
      
      // Update instance and request Base URL
      api.defaults.baseURL = LOCAL_URL;
      originalRequest.baseURL = LOCAL_URL;

      console.log(`[Mobile API Failover] Switching to Backup URL: ${LOCAL_URL}`);

      // Retry original request
      try {
        return await api(originalRequest);
      } catch (retryError) {
        if (axios.isAxiosError(retryError)) logError(retryError);
        console.error('[Mobile API Failover] Backup server (local) also failed.', retryError);
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

// Function to check connection status
export const checkConnection = async () => {
  try {
    await api.get('/api/users/exists', { params: { email: 'healthcheck@liquidly.app' } });
    console.log(`[Mobile API] Successfully connected to: ${currentBaseUrl}`);
    return true;
  } catch (error) {
    console.warn(`[Mobile API] Connection failed with: ${currentBaseUrl}`);
    return false;
  }
};

// Function to reset to Production URL
export const resetApiUrl = () => {
  console.log('[Mobile API] Resetting to Production URL...');
  isFallbackActive = false;
  currentBaseUrl = PROD_URL;
  api.defaults.baseURL = PROD_URL;
};

export const getCurrentBaseUrl = () => currentBaseUrl;

const getDownloadFilename = (headers?: Record<string, string>): string => {
  const contentDisposition = headers?.['content-disposition'] || headers?.['Content-Disposition'];
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

const buildApiUrl = (path: string) => `${currentBaseUrl}${path}`;

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
    const response = await api.get<{ exists: boolean }>('/api/users/exists', {
      params: { email }
    });
    return Boolean(response.data?.exists);
  },

  sendRecoveryCode: async (email: string): Promise<void> => {
    await api.post('/api/users/recovery/send-code', { email });
  },

  resetPassword: async (data: { email: string; code: string; newPassword: string }): Promise<void> => {
    await api.post('/api/users/recovery/reset-password', data);
  }
};

export const userService = {
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`, { timeout: 60000 });
  },
};

export const liquidationResultService = {
  runReport: async (payload: {
    companyId: number;
    projectId: number;
    selectedBom?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ReportJobStartResponse> => {
    const response = await api.post<ReportJobStartResponse>('/api/liquidation-results/run-report', payload, {
      timeout: 120000,
    });
    return response.data;
  },

  getReportStatus: async (jobId: string, companyId: number): Promise<ReportJobStatusResponse> => {
    const response = await api.get<ReportJobStatusResponse>(`/api/liquidation-results/run-report/${jobId}/status`, {
      params: { companyId },
      timeout: 15000,
    });
    return response.data;
  },

  downloadReport: async (jobId: string, companyId: number): Promise<{ uri: string; fileName: string }> => {
    const token = userStorage.getToken();
    const downloadUrl = buildApiUrl(
      `/api/liquidation-results/run-report/${jobId}/download?companyId=${encodeURIComponent(String(companyId))}`
    );
    const targetFile = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}liquidly-report-${jobId}.xlsx`;
    const result = await FileSystem.downloadAsync(downloadUrl, targetFile, {
      headers: {
        'Accept-Language': getCurrentLanguage(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return {
      uri: result.uri,
      fileName: getDownloadFilename(result.headers),
    };
  }
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

export default api;
