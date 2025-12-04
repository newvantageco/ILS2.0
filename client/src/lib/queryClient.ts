import { QueryClient, QueryFunction, MutationCache, QueryCache } from "@tanstack/react-query";
import { globalLoadingManager } from "./globalLoading";
import { getCsrfToken, fetchCsrfToken } from "./api";

/**
 * Parse error message from various error formats
 */
function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Try to parse JSON error message
    try {
      const match = error.message.match(/^\d+:\s*(.+)$/);
      if (match) {
        const parsed = JSON.parse(match[1]);
        return parsed.error || parsed.message || match[1];
      }
    } catch {
      // Not JSON, use as-is
    }
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Check if error is a token revocation error
 */
function isTokenRevokedError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('TOKEN_REVOKED') ||
           error.message.includes('Token has been revoked');
  }
  return false;
}

/**
 * Check if error is an auth error that should redirect
 */
function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for token revocation first - show specific message
    if (isTokenRevokedError(error)) {
      // Show user-friendly message for token revocation
      if (toastFn) {
        toastFn({
          title: 'Session Expired',
          description: 'Your session was ended because your password was changed. Please log in again.',
          variant: 'destructive',
        });
      }
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login?reason=session_revoked';
      }, 1500);
      return true;
    }
    return error.message.startsWith('401:') || error.message.startsWith('403:');
  }
  return false;
}

/**
 * Global error handler for API errors
 * Shows toast notifications for user-facing errors
 */
let toastFn: ((props: { title: string; description: string; variant?: 'default' | 'destructive' }) => void) | null = null;

export function setGlobalToast(toast: typeof toastFn) {
  toastFn = toast;
}

function showErrorToast(error: unknown, context?: string) {
  const message = parseErrorMessage(error);

  // Don't show toast for auth errors (handled by redirect)
  if (isAuthError(error)) {
    return;
  }

  // Show toast if available
  if (toastFn) {
    toastFn({
      title: context || 'Error',
      description: message,
      variant: 'destructive',
    });
  } else {
    // Fallback to console
    console.error(`[API Error] ${context || 'Error'}:`, message);
  }
}

async function throwIfResNotOk(res: Response, clearCacheOnAuthFailure = true) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Clear all cached data on authorization failures to prevent showing PHI to unauthorized users
    if (clearCacheOnAuthFailure && (res.status === 401 || res.status === 403)) {
      queryClient.clear();
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retry = true,
): Promise<Response> {
  // Build headers
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add JWT token to Authorization header
  const accessToken = localStorage.getItem('ils_access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Add CSRF token for non-GET requests
  const methodUpper = method.toUpperCase();
  if (methodUpper !== "GET" && methodUpper !== "HEAD" && methodUpper !== "OPTIONS") {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle CSRF token validation failure - retry once with fresh token
  if (res.status === 403 && retry) {
    const errorText = await res.clone().text();
    if (errorText.includes("CSRF")) {
      await fetchCsrfToken();
      return apiRequest(method, url, data, false); // Retry without further retries
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Only use string parts of queryKey for the URL, skip objects (used for cache keys)
    const urlParts = queryKey.filter((part): part is string => typeof part === 'string');
    const url = urlParts.join("/");

    // Build headers with JWT token
    const headers: Record<string, string> = {};
    const accessToken = localStorage.getItem('ils_access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Global query cache with error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Only show error toast for queries that have already been fetched
    // This prevents showing errors for background refetches
    if (query.state.data !== undefined) {
      showErrorToast(error, 'Failed to refresh data');
    }
    // Log all query errors for debugging
    console.error('[Query Error]', {
      queryKey: query.queryKey,
      error: parseErrorMessage(error),
    });
  },
});

// Global mutation cache with error handling
const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    // Show toast for mutation errors (these are always user-initiated)
    const mutationKey = mutation.options.mutationKey;
    const context = Array.isArray(mutationKey) ? String(mutationKey[0]) : 'Operation failed';
    showErrorToast(error, context);

    // Log all mutation errors for debugging
    console.error('[Mutation Error]', {
      mutationKey,
      error: parseErrorMessage(error),
    });
  },
});

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      // PERFORMANCE: Allow data to become stale and refresh automatically
      // Healthcare data should be reasonably fresh, not cached forever
      refetchOnWindowFocus: true, // Refresh when user returns to tab
      staleTime: 5 * 60 * 1000, // 5 minutes - data becomes stale after this time
      gcTime: 10 * 60 * 1000, // 10 minutes - cache is garbage collected after this time
      retry: 1, // Retry failed queries once
    },
    mutations: {
      retry: false,
      onMutate: () => {
        // Start loading indicator for all mutations
        return { endLoading: globalLoadingManager.start() };
      },
      onSettled: (_data, _error, _variables, context: any) => {
        // End loading indicator
        if (context?.endLoading) {
          context.endLoading();
        }
      },
    },
  },
});
