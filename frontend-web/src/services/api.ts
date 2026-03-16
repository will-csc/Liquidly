import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { loadingBus } from './loadingBus';
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
  Project 
} from '../types';

// URL Configuration
const IS_PROD_BUILD = import.meta.env.MODE === 'production';
const PROD_URL = import.meta.env.VITE_API_URL_PROD || 'https://liquidly-backend.onrender.com';
const LOCAL_URL = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8080';

// Determine initial URL based on environment
// Always try PROD first, fallback to LOCAL only if PROD is unreachable.
const INITIAL_URL = PROD_URL;

// Current Connection State
let currentBaseUrl = INITIAL_URL;
let isFallbackActive = false;

console.log(`[API Config] Initializing API with URL: ${currentBaseUrl} (Mode: ${import.meta.env.MODE})`);

const getResponseMessage = (data: unknown): string | null => {
  if (typeof data !== 'object' || data === null) return null;
  if (!('message' in data)) return null;
  const message = (data as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
};

const getStoredToken = (): string => {
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
};

const logApiError = (label: string, error: AxiosError) => {
  const config = error.config;
  const method = typeof config?.method === 'string' ? config.method.toUpperCase() : undefined;
  const url = config?.url;
  const baseURL = config?.baseURL || currentBaseUrl;
  const status = error.response?.status;
  const responseMessage = getResponseMessage(error.response?.data);

  console.error(label, {
    baseURL,
    method,
    url,
    status,
    code: error.code,
    message: responseMessage || error.message,
  });
};

// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 5000, // 5s timeout to fail fast and try local backup
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Ensure correct Base URL is used
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    loadingBus.start();
    // If fallback is active, force the new URL
    if (config.baseURL !== currentBaseUrl) {
      config.baseURL = currentBaseUrl;
    }
    const token = getStoredToken();
    if (token) {
      const h = config.headers as unknown as { set?: (k: string, v: string) => void; [k: string]: unknown };
      if (typeof h?.set === 'function') {
        h.set('Authorization', `Bearer ${token}`);
      } else {
        h.Authorization = `Bearer ${token}`;
      }
    }
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
    loadingBus.end();
    return response;
  },
  async (error: AxiosError) => {
    loadingBus.end();
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if it's a network/connection error and retry hasn't been attempted yet
    // Only attempt failover if we are currently using PROD_URL
    if (
      !IS_PROD_BUILD &&
      !isFallbackActive &&
      currentBaseUrl === PROD_URL &&
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response)
    ) {
      logApiError('[API Error] Production request failed (will try local fallback)', error);
      console.warn(`[API Failover] Failed to connect to ${PROD_URL}. Attempting to connect to local server (Backup)...`);
      
      // Mark request to prevent infinite loop
      originalRequest._retry = true;
      
      // Activate fallback mode
      isFallbackActive = true;
      currentBaseUrl = LOCAL_URL;
      
      // Update instance Base URL for future requests
      api.defaults.baseURL = LOCAL_URL;
      
      // Update current request URL and retry
      originalRequest.baseURL = LOCAL_URL;
      
      console.log(`[API Failover] Switching to Backup URL: ${LOCAL_URL}`);
      
      try {
        return await api(originalRequest);
      } catch (retryError) {
        console.error('[API Failover] Backup server (local) also failed.', retryError);
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
    const response = await api.post<User>('/api/users/signup', data);
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

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  }
};

export const reportService = {
  runReport: async (payload: {
    companyId: number;
    projectId: number;
    email: string;
    selectedBom: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    await api.post('/api/liquidation-results/run-report', payload, { timeout: 120000 });
  }
};

export default api;
