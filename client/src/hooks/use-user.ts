import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useUser() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logout = async () => {
    try {
      // Get JWT token for logout request
      const accessToken = localStorage.getItem('ils_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Call logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear the React Query cache
      queryClient.clear();

      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login page
      window.location.href = '/login';
    }
  };

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
