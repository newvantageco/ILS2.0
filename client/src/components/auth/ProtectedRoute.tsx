/**
 * ProtectedRoute Component
 * 
 * Eliminates role-based routing duplication by centralizing
 * permission checking and route access control.
 */

import React from 'react';
import { Redirect, useLocation } from 'wouter';
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
  const [pathname] = useLocation();

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
    // Note: wouter's Redirect doesn't support state, storing in sessionStorage if needed
    sessionStorage.setItem('redirectFrom', pathname);
    return <Redirect to="/login" />;
  }

  // Check if user has required role
  if (config.roles.length > 0 && (!user.role || !config.roles.includes(user.role))) {
    // Store unauthorized state in sessionStorage for the unauthorized page to use
    sessionStorage.setItem('unauthorizedState', JSON.stringify({
      requiredRoles: config.roles,
      userRole: user.role,
      attemptedPath: pathname,
    }));
    return <Redirect to="/unauthorized" />;
  }

  // Check if user is associated with a company (if required)
  if (config.requireCompany && !user.companyId) {
    return <Redirect to="/onboarding/company" />;
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
