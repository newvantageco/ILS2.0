/**
 * usePermissions Hook
 * 
 * Provides easy access to the current user's permissions
 * for showing/hiding UI elements based on role capabilities
 */

import { useState, useEffect } from 'react';

interface PermissionData {
  permissions: string[];
  roles: Array<{
    id: string;
    name: string;
    description: string;
    is_primary: boolean;
  }>;
  isOwner: boolean;
}

export function usePermissions() {
  const [data, setData] = useState<PermissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/roles/my/permissions', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const permData = await res.json();
      setData(permData);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    // Owner always has all permissions
    if (data?.isOwner) return true;
    
    // Check if permission exists in user's permission list
    return data?.permissions?.includes(permissionKey) || false;
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    if (data?.isOwner) return true;
    return permissionKeys.some(key => data?.permissions?.includes(key));
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    if (data?.isOwner) return true;
    return permissionKeys.every(key => data?.permissions?.includes(key));
  };

  const getPrimaryRole = () => {
    return data?.roles?.find(role => role.is_primary);
  };

  const hasRole = (roleName: string): boolean => {
    return data?.roles?.some((role: any) => 
      role.name.toLowerCase() === roleName.toLowerCase()
    ) || false;
  };

  return {
    permissions: data?.permissions || [],
    roles: data?.roles || [],
    isOwner: data?.isOwner || false,
    primaryRole: getPrimaryRole(),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isLoading,
    error,
  };
}

/**
 * Permission-based component wrapper
 * Shows children only if user has required permission
 */
interface RequirePermissionProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequirePermission({ 
  permission, 
  children,
  fallback = null 
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const hasRequiredPermission = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);

  if (!hasRequiredPermission) {
    return fallback as React.ReactElement;
  }

  return children as React.ReactElement;
}

/**
 * Role-based component wrapper
 * Shows children only if user has specified role
 */
interface RequireRoleProps {
  role: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ 
  role, 
  children,
  fallback = null 
}: RequireRoleProps) {
  const { hasRole } = usePermissions();

  const hasRequiredRole = Array.isArray(role)
    ? role.some((r: string) => hasRole(r))
    : hasRole(role);

  if (!hasRequiredRole) {
    return fallback as React.ReactElement;
  }

  return children as React.ReactElement;
}
