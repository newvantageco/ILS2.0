import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { clearAuthTokens } from "@/lib/api";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
