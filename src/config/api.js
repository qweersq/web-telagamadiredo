import axios from 'axios';

const HOST = import.meta.env.VITE_API_HOST;
const PORT = parseInt(import.meta.env.VITE_API_PORT);
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT);

export const API_URL = HOST?.includes('localhost') ? `${HOST}:${PORT}` : HOST;
const instance = axios.create({ baseURL: API_URL, timeout: TIMEOUT });

export const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete instance.defaults.headers.common['Authorization'];
    // localStorage.removeItem('token');
  }
};

// Helper function to refresh access token
const refreshAccessToken = async () => {
  try {
    console.log('🔄 [RefreshToken] Starting refresh token process...');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('❌ [RefreshToken] No refresh token available in storage');
      throw new Error('No refresh token available');
    }

    console.log('📤 [RefreshToken] Calling /refresh-token endpoint...');
    const response = await axios.post(`${API_URL}/refresh-token`, {
      refreshToken: refreshToken
    }, {
      timeout: TIMEOUT
    });

    if (response.data?.success && response.data?.data?.token) {
      const newAccessToken = response.data.data.token;
      console.log('✅ [RefreshToken] New access token received:', newAccessToken.substring(0, 20) + '...');
      setAuthToken(newAccessToken);
      console.log('✅ [RefreshToken] Access token updated successfully');
      return newAccessToken;
    }
    console.error('❌ [RefreshToken] Invalid response structure:', response.data);
    throw new Error('No token in refresh response');
  } catch (error) {
    console.error('❌ [RefreshToken] Refresh failed:', error.response?.data || error.message);
    // Clear tokens on refresh failure
    setAuthToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    console.log('🧹 [RefreshToken] Tokens cleared due to refresh failure');
    throw error;
  }
};

const savedToken = localStorage.getItem('token');
if (savedToken) setAuthToken(savedToken);

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle invalid/expired token globally
    const status = error.response?.status;
    const statusCode = error.response?.data?.statusCode;
    const originalRequest = error.config;
    const currentPath = window.location.pathname;
    
    // Handle 401 - Token expired (try refresh first)
    if ((status === 401 || statusCode === 401)) {
      console.log('🔒 [Interceptor] 401 Unauthorized detected');
      console.log('🔍 [Interceptor] URL:', originalRequest.url);
      console.log('🔍 [Interceptor] Already retried:', originalRequest._retry);
      
      // Skip refresh for login endpoint or if already retried
      if (originalRequest.url?.includes('/login') || originalRequest._retry) {
        console.log('⏭️ [Interceptor] Skipping refresh (login endpoint or already retried)');
        if (currentPath !== '/login' && currentPath !== '/') {
      console.log('🔒 Token expired or invalid, redirecting to login');
      setAuthToken(null);
      localStorage.removeItem('workStartTime');
      localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('fromPresent');
      sessionStorage.removeItem('fromIzin');
      window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Web: Try to refresh token
      if (currentPath && currentPath !== '/login' && currentPath !== '/') {
        if (isRefreshing) {
          console.log('⏳ [Interceptor] Already refreshing, queueing request...');
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              console.log('✅ [Interceptor] Queued request retrying with new token');
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch(err => {
              // Don't treat CanceledError or network errors as refresh failure
              const isCanceled = err.name === 'CanceledError' || 
                                err.message?.includes('canceled') ||
                                err.code === 'ERR_CANCELED';
              
              if (isCanceled) {
                console.log('ℹ️ [Interceptor] Request was canceled, not a refresh failure');
              } else {
                console.error('❌ [Interceptor] Queued request failed:', err.message || err);
              }
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        console.log('🔄 [Interceptor] Web detected, attempting auto refresh...');

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          
          // Retry original request with new token
          console.log('🔄 [Interceptor] Retrying original request with new token...');
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await instance(originalRequest);
          console.log('✅ [Interceptor] Request retry successful');
          return retryResponse;
        } catch (refreshError) {
          // Check if error is from refresh token call or from retry request
          const isRefreshTokenError = refreshError.message?.includes('refresh') || 
                                     refreshError.message?.includes('No refresh token') ||
                                     refreshError.response?.status === 401;
          
          const isCanceled = refreshError.name === 'CanceledError' || 
                            refreshError.message?.includes('canceled') ||
                            refreshError.code === 'ERR_CANCELED';
          
          // Only logout if refresh token endpoint failed, not if retry request failed
          if (isRefreshTokenError && !isCanceled) {
            console.error('❌ [Interceptor] Refresh token failed, clearing tokens');
            processQueue(refreshError, null);
            setAuthToken(null);
            localStorage.removeItem('workStartTime');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('fromPresent');
            sessionStorage.removeItem('fromIzin');
            console.log('🚪 [Interceptor] Redirecting to login due to refresh failure...');
            window.location.href = '/login';
          } else {
            // Not a refresh token error (might be retry request error), just reject
            if (isCanceled) {
              console.log('ℹ️ [Interceptor] Request was canceled, not a refresh failure');
            } else {
              console.log('ℹ️ [Interceptor] Request error (not refresh token failure):', refreshError.message);
            }
            processQueue(refreshError, null);
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
          console.log('✅ [Interceptor] Refresh process completed');
        }
      } else if (currentPath === '/login' || currentPath === '/') {
      console.log('🔒 401 error on login/landing page, not redirecting to avoid loop');
      }
    }
    
    // Handle payment required (subscription not active)
    if (status === 402 || statusCode === 402) {
      // Don't redirect if already on inactive-tenant-billing page to avoid infinite loop
      if (currentPath === '/inactive-tenant-billing') {
        console.log('🔒 Already on inactive-tenant-billing page, not redirecting');
        return Promise.reject(error);
      }
      
      // Don't redirect if user is on login or onboarding pages
      const allowedPaths = ['/', '/login', '/onboarding', '/panduan'];
      if (allowedPaths.includes(currentPath)) {
        console.log('🔒 User is on allowed path, not redirecting:', currentPath);
        return Promise.reject(error);
      }
      
      // Save encryptedData from 402 response to localStorage
      const encryptedData = error.response?.data?.data?.encrypted_data;
      if (encryptedData) {
        console.log('💾 Saving encryptedData to localStorage:', encryptedData);
        localStorage.setItem('inactiveBillingEncryptedData', encryptedData);
      }
      
      // Direct redirect to inactive-tenant-billing page for 402 errors
      console.log('💳 Payment required, redirecting to inactive-tenant-billing page');
      window.location.href = '/inactive-tenant-billing';
    }
    
    return Promise.reject(error);
  }
);

export default instance;

export const fetchData = (url, config = {}) => instance.get(url, config);
export const postData = (url, data, config = {}) => instance.post(url, data, config);
export const putData = (url, data, config = {}) => instance.put(url, data, config);
export const deleteData = (url, config = {}) => instance.delete(url, config);