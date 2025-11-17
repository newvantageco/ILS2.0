/**
 * Centralized Route Configuration
 * 
 * Defines all application routes with their access requirements.
 * This eliminates the need for repetitive role-based routing logic.
 */

import React from 'react';
import { RoleEnum } from '@shared/schema';
import type { RouteConfig } from '@/components/auth/ProtectedRoute';

// Import all page components using default imports
import ECPDashboard from '@/pages/ECPDashboard';
import LabDashboard from '@/pages/LabDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import PatientsPage from '@/pages/PatientsPage';
import EquipmentDetailPage from '@/pages/EquipmentDetailPage';
import PrescriptionTemplatesPage from '@/pages/PrescriptionTemplatesPage';
import SettingsPage from '@/pages/SettingsPage';
import InventoryPage from '@/pages/InventoryPage';

// Placeholder components for missing pages
const SupplierDashboard = () => React.createElement('div', null, 'Supplier Dashboard - Coming Soon');
const PlatformAdminDashboard = () => React.createElement('div', null, 'Platform Admin Dashboard - Coming Soon');
const UnauthorizedPage = () => React.createElement('div', null, 'Unauthorized Access');
const NotFoundPage = () => React.createElement('div', null, 'Page Not Found');
const BillingPage = () => React.createElement('div', null, 'Billing Page - Coming Soon');
const ReportsPage = () => React.createElement('div', null, 'Reports Page - Coming Soon');
const OrdersPage = () => React.createElement('div', null, 'Orders Page - Coming Soon');

// Define all application routes with their access requirements
export const appRoutes: RouteConfig[] = [
  // Public routes
  {
    path: '/',
    component: ECPDashboard, // Default landing page
    roles: ['ecp', 'lab_tech', 'admin', 'supplier', 'platform_admin'],
    exact: true,
  },
  
  // Authentication routes (public)
  {
    path: '/login',
    component: () => null, // Handled by auth system
    roles: [], // Public
    exact: true,
  },
  
  // ECP Routes
  {
    path: '/ecp/dashboard',
    component: ECPDashboard,
    roles: ['ecp', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/ecp/patients',
    component: PatientsPage,
    roles: ['ecp', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/ecp/orders',
    component: OrdersPage,
    roles: ['ecp', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/ecp/prescriptions',
    component: PrescriptionTemplatesPage,
    roles: ['ecp', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/ecp/test-rooms',
    component: () => null, // Test rooms page
    roles: ['ecp', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/ecp/test-rooms/bookings',
    component: () => null, // Test room bookings
    roles: ['ecp', 'lab_tech', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  // Lab Routes
  {
    path: '/lab/dashboard',
    component: LabDashboard,
    roles: ['lab_tech', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/lab/production',
    component: () => null, // Production tracking
    roles: ['lab_tech', 'engineer', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/lab/quality-control',
    component: () => null, // Quality control
    roles: ['lab_tech', 'engineer', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/lab/equipment',
    component: EquipmentDetailPage,
    roles: ['lab_tech', 'engineer', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/lab/inventory',
    component: InventoryPage,
    roles: ['lab_tech', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  // Admin Routes
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
    roles: ['admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/admin/users',
    component: () => null, // User management
    roles: ['admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/admin/settings',
    component: SettingsPage,
    roles: ['admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/admin/billing',
    component: BillingPage,
    roles: ['admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/admin/reports',
    component: ReportsPage,
    roles: ['admin', 'platform_admin'],
    requireCompany: true,
  },
  
  // Supplier Routes
  {
    path: '/supplier/dashboard',
    component: SupplierDashboard,
    roles: ['supplier', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/supplier/orders',
    component: () => null, // Supplier orders
    roles: ['supplier', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/supplier/catalog',
    component: () => null, // Product catalog
    roles: ['supplier', 'platform_admin'],
    requireCompany: true,
  },
  
  // Platform Admin Routes
  {
    path: '/platform-admin/dashboard',
    component: PlatformAdminDashboard,
    roles: ['platform_admin'],
  },
  
  {
    path: '/platform-admin/companies',
    component: () => null, // Company management
    roles: ['platform_admin'],
  },
  
  {
    path: '/platform-admin/analytics',
    component: () => null, // Platform analytics
    roles: ['platform_admin'],
  },
  
  // Shared Routes
  {
    path: '/settings',
    component: SettingsPage,
    roles: ['ecp', 'lab_tech', 'supplier', 'admin', 'platform_admin'],
    requireCompany: true,
  },
  
  {
    path: '/profile',
    component: () => null, // User profile
    roles: ['ecp', 'lab_tech', 'supplier', 'admin', 'platform_admin'],
  },
  
  // Error Routes
  {
    path: '/unauthorized',
    component: UnauthorizedPage,
    roles: [], // Public but shows error
  },
  
  {
    path: '/404',
    component: NotFoundPage,
    roles: [], // Public
  },
  
  {
    path: '*',
    component: NotFoundPage,
    roles: [], // Catch-all
  },
];

// Helper functions for route filtering
export const getRoutesForRole = (role: RoleEnum): RouteConfig[] => {
  return appRoutes.filter(route => 
    route.roles.length === 0 || route.roles.includes(role)
  );
};

export const getRoutesByPath = (path: string): RouteConfig | undefined => {
  return appRoutes.find(route => route.path === path);
};

export const hasAccessToRoute = (role: RoleEnum, path: string): boolean => {
  const route = getRoutesByPath(path);
  return route ? route.roles.length === 0 || route.roles.includes(role) : false;
};

// Route groups for navigation
export const navigationGroups = {
  ecp: [
    { path: '/ecp/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/ecp/patients', label: 'Patients', icon: 'Users' },
    { path: '/ecp/orders', label: 'Orders', icon: 'ShoppingCart' },
    { path: '/ecp/prescriptions', label: 'Prescriptions', icon: 'FileText' },
    { path: '/ecp/test-rooms', label: 'Test Rooms', icon: 'Eye' },
  ],
  
  lab_tech: [
    { path: '/lab/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/lab/production', label: 'Production', icon: 'Settings' },
    { path: '/lab/quality-control', label: 'Quality Control', icon: 'CheckCircle' },
    { path: '/lab/equipment', label: 'Equipment', icon: 'Wrench' },
    { path: '/lab/inventory', label: 'Inventory', icon: 'Package' },
  ],
  
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/users', label: 'User Management', icon: 'Users' },
    { path: '/admin/settings', label: 'Settings', icon: 'Settings' },
    { path: '/admin/billing', label: 'Billing', icon: 'CreditCard' },
    { path: '/admin/reports', label: 'Reports', icon: 'BarChart' },
  ],
  
  supplier: [
    { path: '/supplier/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/supplier/orders', label: 'Orders', icon: 'ShoppingCart' },
    { path: '/supplier/catalog', label: 'Catalog', icon: 'Package' },
  ],
  
  platform_admin: [
    { path: '/platform-admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/platform-admin/companies', label: 'Companies', icon: 'Building' },
    { path: '/platform-admin/analytics', label: 'Analytics', icon: 'BarChart' },
  ],
  
  shared: [
    { path: '/settings', label: 'Settings', icon: 'Settings' },
    { path: '/profile', label: 'Profile', icon: 'User' },
  ],
};

export default appRoutes;
