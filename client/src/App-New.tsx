/**
 * New App Component with ProtectedRoute System
 * 
 * This replaces the old role-based routing duplication with a clean,
 * centralized permission system using ProtectedRoute components.
 */

import React, { Suspense } from 'react';
// @ts-ignore - Temporary fix for react-router-dom import issues
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toast } from '@/components/ui/toast';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { GlobalLoadingBar } from '@/components/ui/GlobalLoadingBar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { appRoutes } from '@/routes/config';
import { useAuth } from '@/hooks/useAuth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for lazy loaded routes
const RouteLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error boundary for route errors
const RouteError = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-gray-600">{error.message}</p>
    </div>
  </div>
);

function AppRoutes() {
  const { user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <RouteLoading />;
  }

  return (
    <Routes>
      {/* Render all configured routes through ProtectedRoute */}
      {appRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute config={route}>
              <Suspense fallback={<RouteLoading />}>
                <route.component />
              </Suspense>
            </ProtectedRoute>
          }
        />
      ))}
      
      {/* Default redirect based on user role */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate 
              to={
                user.role === 'ecp' ? '/ecp/dashboard' :
                user.role === 'lab_tech' ? '/lab/dashboard' :
                user.role === 'admin' ? '/admin/dashboard' :
                user.role === 'supplier' ? '/supplier/dashboard' :
                user.role === 'platform_admin' ? '/platform-admin/dashboard' :
                '/unauthorized'
              } 
              replace 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  const { user } = useAuth();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {/* Global UI Components */}
        <GlobalLoadingBar />
        <Toast />
        <CommandPalette userRole={user?.role || 'ecp'} />
        
        {/* Main Application Routes */}
        <AppRoutes />
      </div>
    </QueryClientProvider>
  );
}

export default App;
