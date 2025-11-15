/**
 * Code-Split Route Components
 * 
 * Using React.lazy() for route-based code splitting to optimize initial load time.
 * Each route is loaded on-demand, reducing the main bundle size.
 * 
 * This ensures the user only downloads code for pages they actually visit,
 * targeting sub-1.5s initial load time.
 */

import { lazy } from "react";

// Public pages
export const Landing = lazy(() => import("@/pages/Landing"));
export const Login = lazy(() => import("@/pages/Login"));
export const EmailLoginPage = lazy(() => import("@/pages/EmailLoginPage"));
export const EmailSignupPage = lazy(() => import("@/pages/EmailSignupPage"));

// Special pages
export const WelcomePage = lazy(() => import("@/pages/WelcomePage"));
export const SignupPage = lazy(() => import("@/pages/SignupPage"));
export const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
export const AccountSuspendedPage = lazy(() => import("@/pages/AccountSuspendedPage"));
export const OnboardingFlow = lazy(() => import("@/pages/OnboardingFlow"));

// Dashboard pages
export const ECPDashboard = lazy(() => import("@/pages/ECPDashboard"));
export const LabDashboard = lazy(() => import("@/pages/LabDashboard"));
export const SupplierDashboard = lazy(() => import("@/pages/SupplierDashboard"));
export const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const PlatformAdminPage = lazy(() => import("@/pages/PlatformAdminPage"));
export const CompanyAdminPage = lazy(() => import("@/pages/CompanyAdminPage"));

// ECP pages
export const PatientsPage = lazy(() => import("@/pages/PatientsPage"));
export const PrescriptionsPage = lazy(() => import("@/pages/PrescriptionsPage"));
export const InventoryPage = lazy(() => import("@/pages/InventoryPage"));
export const InventoryManagement = lazy(() => import("@/pages/InventoryManagement"));
export const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
export const EyeTestPage = lazy(() => import("@/pages/EyeTestPage"));
export const TestRoomsPage = lazy(() => import("@/pages/TestRoomsPage"));
export const TestRoomBookingsPage = lazy(() => import("@/pages/TestRoomBookingsPage"));
export const OpticalPOSPage = lazy(() => import("@/pages/OpticalPOSPage"));
export const ExaminationList = lazy(() => import("@/pages/ExaminationList"));
export const EyeExaminationComprehensive = lazy(() => import("@/pages/EyeExaminationComprehensive"));
export const AddOutsideRx = lazy(() => import("@/pages/AddOutsideRx"));
export const PrescriptionTemplatesPage = lazy(() => import("@/pages/PrescriptionTemplatesPage"));
export const ClinicalProtocolsPage = lazy(() => import("@/pages/ClinicalProtocolsPage"));

// Lab pages
export const ProductionTrackingPage = lazy(() => import("@/pages/ProductionTrackingPage"));
export const QualityControlPage = lazy(() => import("@/pages/QualityControlPage"));
export const EngineeringDashboardPage = lazy(() => import("@/pages/EngineeringDashboardPage"));
export const EquipmentPage = lazy(() => import("@/pages/EquipmentPage"));
export const EquipmentDetailPage = lazy(() => import("@/pages/EquipmentDetailPage"));
export const ReturnsManagementPage = lazy(() => import("@/pages/ReturnsManagementPage"));
export const NonAdaptsPage = lazy(() => import("@/pages/NonAdaptsPage"));

// Shared pages
export const NewOrderPage = lazy(() => import("@/pages/NewOrderPage"));
export const OrderDetailsPage = lazy(() => import("@/pages/OrderDetailsPage"));
export const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
export const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage"));
export const BIDashboardPage = lazy(() => import("@/pages/BIDashboardPage"));
export const CompanyManagementPage = lazy(() => import("@/pages/admin/CompanyManagementPage"));
export const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
export const SaaSMetricsDashboard = lazy(() => import("@/pages/SaaSMetricsDashboard"));
export const BusinessAnalyticsPage = lazy(() => import("@/pages/BusinessAnalyticsPage"));

// Admin pages
export const AISettingsPage = lazy(() => import("@/pages/AISettingsPage"));
export const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
export const PermissionsManagementPage = lazy(() => import("@/pages/PermissionsManagementPage"));
export const ComplianceDashboardPage = lazy(() => import("@/pages/ComplianceDashboardPage"));
export const AIForecastingDashboardPage = lazy(() => import("@/pages/AIForecastingDashboardPage"));
export const AIModelManagementPage = lazy(() => import("@/pages/AIModelManagementPage"));

// Other
export const GitHubPushPage = lazy(() => import("@/pages/github-push"));
export const NotFound = lazy(() => import("@/pages/not-found"));
