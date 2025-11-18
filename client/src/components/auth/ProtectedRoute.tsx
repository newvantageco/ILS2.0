/**
 * ProtectedRoute Component
 * 
 * Eliminates role-based routing duplication by centralizing
 * permission checking and route access control.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleEnum } from '@shared/schema';

// Location state types for navigation
interface LoginRedirectState {
  from: string;
}

interface UnauthorizedState {
  requiredRoles: RoleEnum[];
  userRole?: RoleEnum;
  attemptedPath: string;
}

interface OnboardingState {
  message: string;
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  roles: RoleEnum[];
  exact?: boolean;
  requireCompany?: boolean;
  requireActiveSubscription?: boolean;
}

interface ProtectedRouteProps {
  config: RouteConfig;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ config, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const loginState: LoginRedirectState = { from: location.pathname };
    return <Navigate to="/login" state={loginState} replace />;
  }

  // Check if user has required role
  if (config.roles.length > 0 && (!user.role || !config.roles.includes(user.role))) {
    const unauthorizedState: UnauthorizedState = {
      requiredRoles: config.roles,
      userRole: user.role,
      attemptedPath: location.pathname,
    };
    return (
      <Navigate
        to="/unauthorized"
        state={unauthorizedState}
        replace
      />
    );
  }

  // Check if user is associated with a company (if required)
  if (config.requireCompany && !user.companyId) {
    const onboardingState: OnboardingState = {
      message: 'Company association required',
    };
    return (
      <Navigate
        to="/onboarding/company"
        state={onboardingState}
        replace
      />
    );
  }

  // Check if user has active subscription (if required)
  if (config.requireActiveSubscription) {
    // Add subscription check logic here
    // For now, we'll assume all authenticated users have access
  }

  // Render the protected component or children
  if (children) {
    return <>{children}</>;
  }

  const Component = config.component;
  return <Component />;
};

// HOC for wrapping components with protection
export const withProtection = (config: RouteConfig) => {
  return (Component: React.ComponentType<any>) => (
    <ProtectedRoute config={{ ...config, component: Component }} />
  );
};

// Permission checking utilities
export const hasRole = (user: any, roles: RoleEnum[]): boolean => {
  return user && roles.includes(user.role);
};

export const hasAnyRole = (user: any, roles: RoleEnum[]): boolean => {
  return user && roles.some(role => user.role === role);
};

export const isAdmin = (user: any): boolean => {
  return hasRole(user, ['admin', 'platform_admin']);
};

export const isECP = (user: any): boolean => {
  return user?.role === 'ecp';
};

export const isLabTech = (user: any): boolean => {
  return user?.role === 'lab_tech';
};

export const isSupplier = (user: any): boolean => {
  return user?.role === 'supplier';
};

export default ProtectedRoute;
