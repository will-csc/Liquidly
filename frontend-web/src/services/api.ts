import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// URL Configuration
const PROD_URL = import.meta.env.VITE_API_URL_PROD || 'https://backend-api.onrender.com';
const LOCAL_URL = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8080';

// Current Connection State
let currentBaseUrl = PROD_URL;
let isFallbackActive = false;

console.log(`[API Config] Initializing API with URL: ${currentBaseUrl}`);

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
    // If fallback is active, force the new URL
    if (config.baseURL !== currentBaseUrl) {
      config.baseURL = currentBaseUrl;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors and manage Failover
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if it's a network/connection error and retry hasn't been attempted yet
    if (
      !isFallbackActive &&
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response)
    ) {
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

export default api;
