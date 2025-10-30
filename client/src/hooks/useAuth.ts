import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const logout = async () => {
    try {
      // Clear the React Query cache
      queryClient.clear();
      
      // Call the logout endpoint which will clear session and redirect
      window.location.href = "/api/logout";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to landing page even if there's an error
      window.location.href = "/";
    }
  };

  return {
    user: user ?? undefined,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
