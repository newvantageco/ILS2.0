/**
 * Lazy-loaded route components
 * 
 * Implements route-based code splitting to improve initial load performance.
 * Each route is loaded on-demand using React.lazy().
 */

import { lazy } from "react";

// Landing & Auth Pages
export const Landing = lazy(() => import("@/pages/Landing"));
export const Login = lazy(() => import("@/pages/Login"));
export const SignupPage = lazy(() => import("@/pages/SignupPage"));
export const EmailLoginPage = lazy(() => import("@/pages/EmailLoginPage"));
export const EmailSignupPage = lazy(() => import("@/pages/EmailSignupPage"));
export const OnboardingFlow = lazy(() => import("@/pages/OnboardingFlow"));
export const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
export const AccountSuspendedPage = lazy(() => import("@/pages/AccountSuspendedPage"));

// Dashboards
export const ECPDashboard = lazy(() => import("@/pages/ECPDashboard"));
export const LabDashboard = lazy(() => import("@/pages/LabDashboard"));
export const SupplierDashboard = lazy(() => import("@/pages/SupplierDashboard"));
export const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const PlatformAdminPage = lazy(() => import("@/pages/PlatformAdminPage"));
export const CompanyAdminPage = lazy(() => import("@/pages/CompanyAdminPage"));

// ECP Pages
export const PatientsPage = lazy(() => import("@/pages/PatientsPage"));
export const PrescriptionsPage = lazy(() => import("@/pages/PrescriptionsPage"));
export const InventoryPage = lazy(() => import("@/pages/InventoryPage"));
export const InventoryManagement = lazy(() => import("@/pages/InventoryManagement"));
export const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
export const EyeTestPage = lazy(() => import("@/pages/EyeTestPage"));
export const TestRoomsPage = lazy(() => import("@/pages/TestRoomsPage"));
export const OpticalPOSPage = lazy(() => import("@/pages/OpticalPOSPage"));
export const ExaminationList = lazy(() => import("@/pages/ExaminationList"));
export const EyeExaminationComprehensive = lazy(() => import("@/pages/EyeExaminationComprehensive"));
export const AddOutsideRx = lazy(() => import("@/pages/AddOutsideRx"));
export const NewOrderPage = lazy(() => import("@/pages/NewOrderPage"));

// Lab Pages
export const ProductionTrackingPage = lazy(() => import("@/pages/ProductionTrackingPage"));
export const QualityControlPage = lazy(() => import("@/pages/QualityControlPage"));
export const EquipmentPage = lazy(() => import("@/pages/EquipmentPage"));

// Common Pages
export const OrderDetailsPage = lazy(() => import("@/pages/OrderDetailsPage"));
export const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
export const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage"));
export const AISettingsPage = lazy(() => import("@/pages/AISettingsPage"));
export const CompanyManagementPage = lazy(() => import("@/pages/admin/CompanyManagementPage"));
export const BIDashboardPage = lazy(() => import("@/pages/BIDashboardPage"));
export const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
export const GitHubPushPage = lazy(() => import("@/pages/github-push"));
export const NotFound = lazy(() => import("@/pages/not-found"));
