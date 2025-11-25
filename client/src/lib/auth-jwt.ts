/**
 * JWT Authentication Client Helper
 *
 * Provides frontend utilities for JWT token-based authentication:
 * - Token storage (localStorage)
 * - Automatic token refresh
 * - API request with authentication
 */

const ACCESS_TOKEN_KEY = 'ils_access_token';
const REFRESH_TOKEN_KEY = 'ils_refresh_token';
const TOKEN_EXPIRY_KEY = 'ils_token_expiry';

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * User info from API
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  permissions: string[];
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * Store authentication tokens in localStorage
 */
export function setAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  // Calculate expiry timestamp
  const expiryTime = Date.now() + (tokens.expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get token expiry timestamp
 */
export function getTokenExpiry(): number | null {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

/**
 * Check if access token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;

  // Add 5-minute buffer for token refresh
  const bufferTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() >= (expiry - bufferTime);
}

/**
 * Clear all authentication tokens
 */
export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = getAccessToken();
  return !!accessToken && !isTokenExpired();
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();

  // Store tokens
  setAuthTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  });

  return data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Store new tokens
    setAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });

    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint (for logging purposes)
    await authenticatedFetch('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear tokens regardless of API call result
    clearAuthTokens();
  }
}

/**
 * Make authenticated API request
 * Automatically handles token refresh if needed
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Check if token needs refresh
  if (isTokenExpired()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Token refresh failed, redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      throw new Error('Authentication expired');
    }
  }

  // Get access token
  const accessToken = getAccessToken();

  // Add Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token expired during request)
  if (response.status === 401) {
    const data = await response.json();

    // Try token refresh if token expired
    if (data.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry request with new token
        const newAccessToken = getAccessToken();
        const retryHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };

        return fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      }
    }

    // Token refresh failed or invalid token, redirect to login
    clearAuthTokens();
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  return response;
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await authenticatedFetch('/api/auth/me');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Verify current token
 */
export async function verifyToken(): Promise<boolean> {
  try {
    const response = await authenticatedFetch('/api/auth/verify');
    return response.ok;
  } catch (error) {
    return false;
  }
}
