import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

// URL Configuration
// In Android emulator, localhost must be accessed via 10.0.2.2
// In iOS and Web, localhost is localhost or 127.0.0.1
const PROD_URL = 'https://backend-api.onrender.com';
const LOCAL_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080' 
  : 'http://localhost:8080';

let currentBaseUrl = PROD_URL;
let isFallbackActive = false;

console.log(`[Mobile API] Initializing with URL: ${currentBaseUrl}`);

// Create Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 5000, // 5 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Ensure updated URL
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.baseURL !== currentBaseUrl) {
      config.baseURL = currentBaseUrl;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Failover Logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If network/connection error and fallback hasn't been tried yet
    if (
      !isFallbackActive &&
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response)
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
    await api.get('/health-check'); // Test endpoint
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

export default api;
