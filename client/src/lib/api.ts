import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

// JWT Token storage keys
const ACCESS_TOKEN_KEY = 'ils_access_token';
const REFRESH_TOKEN_KEY = 'ils_refresh_token';
const TOKEN_EXPIRY_KEY = 'ils_token_expiry';

// CSRF Token storage (in-memory for security)
let csrfToken: string | null = null;

// Create an axios instance with default config
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for session fallback
});

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get token expiry timestamp
 */
function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

/**
 * Check if access token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;

  // Add 5-minute buffer for token refresh
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() >= (expiry - bufferTime);
}

/**
 * Store authentication tokens
 */
export function setAuthTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Calculate expiry timestamp
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  // Also clear legacy token
  localStorage.removeItem('token');
  // Clear CSRF token
  clearCsrfToken();
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await axios.post('/api/auth/refresh', {
      refreshToken
    }, {
      baseURL: api.defaults.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success && response.data.accessToken) {
      setAuthTokens(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.expiresIn
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Fetch CSRF token from the server
 */
export async function fetchCsrfToken(): Promise<void> {
  try {
    const response = await axios.get('/api/csrf-token', {
      baseURL: api.defaults.baseURL,
      withCredentials: true,
    });

    if (response.data?.csrfToken) {
      csrfToken = response.data.csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    // Don't throw - CSRF might be disabled in development
  }
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

// Track if we're currently refreshing to avoid multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Add a request interceptor for authentication
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check if token needs refresh (but not for refresh endpoint itself)
    if (!config.url?.includes('/auth/refresh') && isTokenExpired()) {
      // If already refreshing, wait for that promise
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
      } else {
        // Start refresh
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
        const refreshed = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (!refreshed) {
          // Token refresh failed, clear tokens
          clearAuthTokens();
          // Don't redirect here, let response interceptor handle it
        }
      }
    }

    // Add JWT token to Authorization header
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token to non-GET requests (except CSRF token fetch itself)
    const method = config.method?.toLowerCase();
    if (method && method !== 'get' && !config.url?.includes('/csrf-token')) {
      const csrf = getCsrfToken();
      if (csrf && config.headers) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle CSRF token validation errors
    if (error.response?.status === 403) {
      const data = error.response.data as any;

      // If CSRF token is invalid, fetch a new one and retry
      if (data?.error?.includes('CSRF') && !originalRequest._retry) {
        originalRequest._retry = true;

        await fetchCsrfToken();

        // Retry the original request with the new CSRF token
        const newCsrf = getCsrfToken();
        if (newCsrf && originalRequest.headers) {
          originalRequest.headers['X-CSRF-Token'] = newCsrf;
        }
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      const data = error.response.data as any;

      // Try token refresh if token expired and we haven't retried yet
      if (data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshed = await refreshAccessToken();

        if (refreshed) {
          // Retry original request with new token
          const newToken = getAccessToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      }

      // Token refresh failed or invalid token, redirect to login
      clearAuthTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
