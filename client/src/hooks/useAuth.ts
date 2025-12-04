import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { clearAuthTokens } from "@/lib/api";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/jwt/me"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const accessToken = localStorage.getItem('ils_access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/auth/jwt/me", {
        credentials: "include",
        headers,
      });

      // Return null on 401 instead of throwing
      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      // Unwrap the { success: true, user: {...} } response
      return data.user || null;
    },
    retry: false,
  });

  const logout = async () => {
    // Clear JWT tokens
    clearAuthTokens();

    // Clear the React Query cache immediately
    queryClient.clear();

    // Clear any remaining local storage
    localStorage.clear();
    sessionStorage.clear();

    // Force navigation to logout endpoint which will clear session
    // Using direct window navigation ensures clean redirect
    window.location.href = "/api/logout";
  };

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
