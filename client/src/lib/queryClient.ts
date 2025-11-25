import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { globalLoadingManager } from "./globalLoading";

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
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
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
