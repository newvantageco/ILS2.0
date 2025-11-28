import { Suspense, lazy, useState, useEffect } from "react";
import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RoleSwitcherDropdown } from "@/components/RoleSwitcherDropdown";
import { NotificationCenter } from "@/components/NotificationCenter";
import { FloatingAiChat } from "@/components/FloatingAiChat";
import { PageTransition } from "@/components/ui/PageTransition";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GlobalKeyboardShortcuts } from "@/components/GlobalKeyboardShortcuts";
import { ScrollToTop, ScrollProgress } from "@/components/ui/ScrollEnhancements";
import { PWAInstallPrompt, OfflineIndicator } from "@/components/ui/PWAFeatures";
import { NotificationProvider } from "@/components/ui/SmartNotifications";
import { GlobalLoadingBar } from "@/components/ui/GlobalLoadingBar";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { fetchCsrfToken } from "@/lib/api";

// Code-split route components for optimal performance
// Only load the code for pages users actually visit
const Landing = lazy(() => import("@/pages/Landing"));
const LandingNew = lazy(() => import("@/pages/LandingNew"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/not-found"));
const WelcomePage = lazy(() => import("@/pages/WelcomePage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
const AccountSuspendedPage = lazy(() => import("@/pages/AccountSuspendedPage"));
const OnboardingFlow = lazy(() => import("@/pages/OnboardingFlow"));
const EmailLoginPage = lazy(() => import("@/pages/EmailLoginPage"));
const EmailSignupPage = lazy(() => import("@/pages/EmailSignupPage"));

// Policy Pages
const PrivacyPolicy = lazy(() => import("@/pages/policies/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/policies/TermsOfService"));
const CookiePolicy = lazy(() => import("@/pages/policies/CookiePolicy"));
const GDPRCompliance = lazy(() => import("@/pages/policies/GDPRCompliance"));

// Dashboards - Using Modern versions for enhanced UX
const ECPDashboard = lazy(() => import("@/pages/ECPDashboard"));
const LabDashboard = lazy(() => import("@/pages/LabDashboardModern"));
const SupplierDashboard = lazy(() => import("@/pages/SupplierDashboardModern"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const PlatformAdminPage = lazy(() => import("@/pages/PlatformAdminPage"));
const SystemHealthDashboard = lazy(() => import("@/pages/admin/SystemHealthDashboard"));
const SystemConfigPage = lazy(() => import("@/pages/admin/SystemConfigPage"));
const APIKeysManagementPage = lazy(() => import("@/pages/admin/APIKeysManagementPage"));
const CompanyAdminPage = lazy(() => import("@/pages/CompanyAdminPage"));
const DispenserDashboard = lazy(() => import("@/pages/DispenserDashboardModern"));

// ECP Pages
const PatientsPage = lazy(() => import("@/pages/PatientsPage"));
const PatientProfile = lazy(() => import("@/pages/PatientProfile"));
const PrescriptionsPage = lazy(() => import("@/pages/PrescriptionsPage"));
const InventoryManagement = lazy(() => import("@/pages/InventoryManagement"));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const EyeTestPage = lazy(() => import("@/pages/EyeTestPage"));
const EyeTestWizard = lazy(() => import("@/components/eye-test/EyeTestWizard").then(m => ({ default: m.EyeTestWizard })));
const DiaryPage = lazy(() => import("@/pages/DiaryPage"));
const CommunicationsHubPage = lazy(() => import("@/pages/CommunicationsHubPage"));
const RecallManagementPage = lazy(() => import("@/pages/RecallManagementPage"));
const TestRoomsPage = lazy(() => import("@/pages/TestRoomsPage"));
const TestRoomBookingsPage = lazy(() => import("@/pages/TestRoomBookingsPage"));
const OpticalPOSPage = lazy(() => import("@/pages/OpticalPOSPage"));
const SmartFrameFinder = lazy(() => import("@/pages/SmartFrameFinder"));
const ExaminationList = lazy(() => import("@/pages/ExaminationList"));
const EyeExaminationComprehensive = lazy(() => import("@/pages/EyeExaminationComprehensive"));
const AddOutsideRx = lazy(() => import("@/pages/AddOutsideRx"));
const PrescriptionTemplatesPage = lazy(() => import("@/pages/PrescriptionTemplatesPage"));
const ClinicalProtocolsPage = lazy(() => import("@/pages/ClinicalProtocolsPage"));

// Lab Pages
const ProductionTrackingPage = lazy(() => import("@/pages/ProductionTrackingPage"));
const QualityControlPage = lazy(() => import("@/pages/QualityControlPage"));
const EngineeringDashboardPage = lazy(() => import("@/pages/EngineeringDashboardPage"));
const EquipmentPage = lazy(() => import("@/pages/EquipmentPage"));
const EquipmentDetailPage = lazy(() => import("@/pages/EquipmentDetailPage"));
const ReturnsManagementPage = lazy(() => import("@/pages/ReturnsManagementPage"));
const NonAdaptsPage = lazy(() => import("@/pages/NonAdaptsPage"));
const AIForecastingDashboardPage = lazy(() => import("@/pages/AIForecastingDashboardPage"));

// Shared Pages
const NewOrderPage = lazy(() => import("@/pages/NewOrderPage"));
const OrderDetailsPage = lazy(() => import("@/pages/OrderDetailsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const AIAssistantPage = lazy(() => import("@/pages/AIAssistantPage"));
const AIPurchaseOrdersPage = lazy(() => import("@/pages/AIPurchaseOrdersPage"));
const BIDashboardPage = lazy(() => import("@/pages/BIDashboardPage"));
const CompanyManagementPage = lazy(() => import("@/pages/admin/CompanyManagementPage"));
const AnalyticsDashboard = lazy(() => import("@/pages/AnalyticsDashboard"));
const SaaSMetricsDashboard = lazy(() => import("@/pages/SaaSMetricsDashboard"));
const BusinessAnalyticsPage = lazy(() => import("@/pages/BusinessAnalyticsPage"));

// BI Dashboard Components
const PracticePulseDashboard = lazy(() => import("@/components/bi/PracticePulseDashboard").then(m => ({ default: m.PracticePulseDashboard })));
const FinancialDashboard = lazy(() => import("@/components/bi/FinancialDashboard").then(m => ({ default: m.FinancialDashboard })));
const OperationalDashboard = lazy(() => import("@/components/bi/OperationalDashboard").then(m => ({ default: m.OperationalDashboard })));
const PatientDashboard = lazy(() => import("@/components/bi/PatientDashboard").then(m => ({ default: m.PatientDashboard })));
const PlatformAIDashboard = lazy(() => import("@/components/bi/PlatformAIDashboard").then(m => ({ default: m.PlatformAIDashboard })));

// Admin Pages
const AISettingsPage = lazy(() => import("@/pages/AISettingsPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const PermissionsManagementPage = lazy(() => import("@/pages/PermissionsManagementPage"));
const RoleManagementPage = lazy(() => import("@/pages/admin/RoleManagement"));
const ComplianceDashboardPage = lazy(() => import("@/pages/ComplianceDashboardPage"));
const AIModelManagementPage = lazy(() => import("@/pages/AIModelManagementPage"));
const MLModelManagementPage = lazy(() => import("@/pages/MLModelManagementPage"));
const PythonMLDashboardPage = lazy(() => import("@/pages/PythonMLDashboardPage"));
const ShopifyIntegrationPage = lazy(() => import("@/pages/integrations/ShopifyIntegrationPage"));
const NHSIntegrationPage = lazy(() => import("@/pages/integrations/NHSIntegrationPage"));
const ServiceStatusPage = lazy(() => import("@/pages/ServiceStatusPage"));
const FeatureFlagsPage = lazy(() => import("@/pages/FeatureFlagsPage"));
const APIDocumentationPage = lazy(() => import("@/pages/APIDocumentationPage"));
const SupplierLibraryPage = lazy(() => import("@/pages/SupplierLibraryPage"));

// Email & Communications
const EmailAnalyticsPage = lazy(() => import("@/pages/EmailAnalyticsPage"));
const EmailTemplatesPage = lazy(() => import("@/pages/EmailTemplatesPage"));

// Advanced Healthcare Systems (New Implementation)
const HealthcareAnalyticsPage = lazy(() => import("@/pages/HealthcareAnalyticsPage"));
const LaboratoryIntegrationPage = lazy(() => import("@/pages/LaboratoryIntegrationPage"));
const PracticeManagementPage = lazy(() => import("@/pages/PracticeManagementPage"));
const HealthcareSystemsDemoPage = lazy(() => import("@/pages/HealthcareSystemsDemoPage"));

// Marketplace (Chunk 6)
const MarketplacePage = lazy(() => import("@/pages/MarketplacePage"));
const CompanyProfilePage = lazy(() => import("@/pages/CompanyProfilePage"));
const MyConnectionsPage = lazy(() => import("@/pages/MyConnectionsPage"));

// Platform Admin (Chunk 7)
const PlatformInsightsDashboard = lazy(() => import("@/pages/PlatformInsightsDashboard"));

// Healthcare Pages (Phases 17-21)
const RCMDashboard = lazy(() => import("@/pages/rcm/RCMDashboard"));
const ClaimsManagementPage = lazy(() => import("@/pages/rcm/ClaimsManagementPage"));
const PaymentProcessingPage = lazy(() => import("@/pages/rcm/PaymentProcessingPage"));
const PopulationHealthDashboard = lazy(() => import("@/pages/population-health/PopulationHealthDashboard"));
const QualityDashboard = lazy(() => import("@/pages/quality/QualityDashboard"));
const QualityMeasuresPage = lazy(() => import("@/pages/quality/QualityMeasuresPage"));
const MHealthDashboard = lazy(() => import("@/pages/mhealth/MHealthDashboard"));
const RemoteMonitoringPage = lazy(() => import("@/pages/mhealth/RemoteMonitoringPage"));
const DeviceManagementPage = lazy(() => import("@/pages/mhealth/DeviceManagementPage"));
const ResearchDashboard = lazy(() => import("@/pages/research/ResearchDashboard"));
const ResearchTrialsPage = lazy(() => import("@/pages/research/ResearchTrialsPage"));

// Other
const GitHubPushPage = lazy(() => import("@/pages/github-push"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

// Error boundary for catching component loading errors
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center p-6 max-w-md">
            <div className="text-destructive mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This page failed to load. Please try refreshing or navigating to another page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppLayout({ children, userRole }: { children: React.ReactNode; userRole: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin" | "platform_admin" | "company_admin" | "dispenser" }) {
  const { logout } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Check if user has seen the welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-mobile": "100%",
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <WelcomeModal open={showWelcome} onClose={handleWelcomeClose} />
      <ScrollProgress />
      <OfflineIndicator />
      <CommandPalette userRole={userRole} />
      <GlobalKeyboardShortcuts />
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-col flex-1 min-w-0">
          <header aria-label="Main header" className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <RoleSwitcherDropdown />
              <NotificationCenter />
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
                className="shrink-0"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            <Suspense fallback={<RouteLoadingFallback />}>
              <PageTransition>
                {children}
              </PageTransition>
            </Suspense>
          </main>
        </div>
      </div>
      <ScrollToTop />
      <PWAInstallPrompt />
    </SidebarProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Fetch CSRF token on app initialization
  useEffect(() => {
    fetchCsrfToken().catch((error) => {
      console.error('Failed to initialize CSRF token:', error);
    });
  }, []);

  // Public routes (accessible without auth) - wrapped in Suspense
  if (location === '/landing-new') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LandingNew />
      </Suspense>
    );
  }

  if (location === '/pricing') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <PricingPage />
      </Suspense>
    );
  }

  if (location === '/login') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Login />
      </Suspense>
    );
  }

  if (location === '/email-login') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <EmailLoginPage />
      </Suspense>
    );
  }
  
  if (location === '/email-signup') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <EmailSignupPage />
      </Suspense>
    );
  }

  // Policy pages (public, no auth required)
  if (location === '/privacy') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (location === '/terms') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <TermsOfService />
      </Suspense>
    );
  }

  if (location === '/cookies') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <CookiePolicy />
      </Suspense>
    );
  }

  if (location === '/gdpr') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <GDPRCompliance />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LandingNew />
      </Suspense>
    );
  }

  // Handle users who need to complete signup
  if (!user.role) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/signup" component={SignupPage} />
          <Route path="/onboarding" component={OnboardingFlow} />
          <Route><Redirect to="/signup" /></Route>
        </Switch>
      </Suspense>
    );
  }
  
  // Handle users who completed signup but no company
  if (!user.companyId && user.role !== 'platform_admin') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/onboarding" component={OnboardingFlow} />
          <Route><Redirect to="/onboarding" /></Route>
        </Switch>
      </Suspense>
    );
  }

  // Handle pending approval status
  if (user.accountStatus === 'pending') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/pending-approval" component={PendingApprovalPage} />
          <Route><Redirect to="/pending-approval" /></Route>
        </Switch>
      </Suspense>
    );
  }

  // Handle suspended accounts
  if (user.accountStatus === 'suspended') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/account-suspended" component={AccountSuspendedPage} />
          <Route><Redirect to="/account-suspended" /></Route>
        </Switch>
      </Suspense>
    );
  }

  const userRole = user.role;
  
  const getRoleBasePath = () => {
    switch (userRole) {
      case "ecp":
        return "/ecp";
      case "lab_tech":
      case "engineer":
        return "/lab";
      case "supplier":
        return "/supplier";
      case "admin":
        return "/admin";
      case "platform_admin":
        return "/platform-admin";
      case "company_admin":
        return "/company-admin";
      default:
        return "/lab";
    }
  };

  if (location === "/" || location === "") {
    return <Redirect to="/welcome" />;
  }

  return (
    <AppLayout userRole={userRole}>
      <RouteErrorBoundary>
        <Switch>
          {/* Welcome/Home Page - Shows platform capabilities */}
          <Route path="/welcome" component={WelcomePage} />
          <Route path="/healthcare-systems-demo" component={HealthcareSystemsDemoPage} />

        {userRole === "ecp" && (
          <>
            <Route path="/ecp/dashboard" component={ECPDashboard} />
            <Route path="/ecp/patients" component={PatientsPage} />
            <Route path="/ecp/patients/:id" component={PatientProfile} />
            <Route path="/ecp/patient/:id/test" component={EyeTestPage} />
            <Route path="/ecp/patient/:id/test-wizard" component={EyeTestWizard} />
            <Route path="/ecp/prescriptions" component={PrescriptionsPage} />
            <Route path="/ecp/inventory" component={InventoryManagement} />
            <Route path="/ecp/examinations" component={ExaminationList} />
            <Route path="/ecp/examination/new" component={EyeExaminationComprehensive} />
            <Route path="/ecp/examination/:id" component={EyeExaminationComprehensive} />
            <Route path="/ecp/outside-rx" component={AddOutsideRx} />
            <Route path="/ecp/pos" component={OpticalPOSPage} />
            <Route path="/ecp/smart-frame-finder" component={SmartFrameFinder} />
            <Route path="/ecp/invoices" component={InvoicesPage} />
            <Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
            <Route path="/ecp/test-rooms" component={TestRoomsPage} />
            <Route path="/ecp/diary" component={DiaryPage} />
            <Route path="/ecp/communications" component={CommunicationsHubPage} />
            <Route path="/ecp/recalls" component={RecallManagementPage} />
            <Route path="/ecp/ai-assistant" component={AIAssistantPage} />
            <Route path="/ecp/orders" component={ECPDashboard} />
            <Route path="/ecp/ai-purchase-orders" component={AIPurchaseOrdersPage} />
            <Route path="/ecp/company" component={CompanyManagementPage} />
            <Route path="/ecp/bi-dashboard" component={BIDashboardPage} />
            <Route path="/ecp/analytics" component={AnalyticsDashboard} />
            <Route path="/ecp/analytics/practice-pulse" component={PracticePulseDashboard} />
            <Route path="/ecp/analytics/financial" component={FinancialDashboard} />
            <Route path="/ecp/analytics/operational" component={OperationalDashboard} />
            <Route path="/ecp/analytics/patient" component={PatientDashboard} />
            <Route path="/ecp/analytics/ai-insights" component={PlatformAIDashboard} />
            <Route path="/ecp/email-analytics" component={EmailAnalyticsPage} />
            <Route path="/ecp/email-templates" component={EmailTemplatesPage} />
            <Route path="/ecp/compliance" component={ComplianceDashboardPage} />
            <Route path="/ecp/prescription-templates" component={PrescriptionTemplatesPage} />
            <Route path="/ecp/clinical-protocols" component={ClinicalProtocolsPage} />
            <Route path="/ecp/analytics" component={BusinessAnalyticsPage} />
            <Route path="/ecp/nhs" component={NHSIntegrationPage} />
            
            {/* Advanced Healthcare Systems */}
            <Route path="/ecp/healthcare-analytics" component={HealthcareAnalyticsPage} />
            <Route path="/ecp/laboratory" component={LaboratoryIntegrationPage} />
            <Route path="/ecp/practice-management" component={PracticeManagementPage} />
            
            <Route path="/order/:id" component={OrderDetailsPage} />
            <Route path="/ecp/returns">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Returns Management</h2>
                <p className="text-muted-foreground mt-2">Returns and non-adapt tracking</p>
              </div>
            </Route>
          </>
        )}

        {(userRole === "lab_tech" || userRole === "engineer") && (
          <>
            <Route path="/lab/dashboard" component={LabDashboard} />
            <Route path="/order/:id" component={OrderDetailsPage} />
            <Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
            <Route path="/lab/returns" component={ReturnsManagementPage} />
            <Route path="/lab/non-adapts" component={NonAdaptsPage} />
            <Route path="/lab/compliance" component={ComplianceDashboardPage} />
            <Route path="/lab/ai-assistant" component={AIAssistantPage} />
            <Route path="/lab/company" component={CompanyManagementPage} />
            <Route path="/lab/bi-dashboard" component={BIDashboardPage} />
            <Route path="/lab/analytics/practice-pulse" component={PracticePulseDashboard} />
            <Route path="/lab/analytics/financial" component={FinancialDashboard} />
            <Route path="/lab/analytics/operational" component={OperationalDashboard} />
            <Route path="/lab/analytics/patient" component={PatientDashboard} />
            <Route path="/lab/queue">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Order Queue</h2>
                <p className="text-muted-foreground mt-2">Full order queue management</p>
              </div>
            </Route>
            <Route path="/lab/production" component={ProductionTrackingPage} />
            <Route path="/lab/quality" component={QualityControlPage} />
            <Route path="/lab/engineering" component={EngineeringDashboardPage} />
            <Route path="/lab/ai-forecasting" component={AIForecastingDashboardPage} />
            <Route path="/lab/analytics" component={BusinessAnalyticsPage} />
            <Route path="/lab/equipment" component={EquipmentPage} />
            <Route path="/lab/equipment/:id" component={EquipmentDetailPage} />
            
            {/* Advanced Healthcare Systems */}
            <Route path="/lab/healthcare-analytics" component={HealthcareAnalyticsPage} />
            <Route path="/lab/laboratory" component={LaboratoryIntegrationPage} />
            
            <Route path="/lab/rnd">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">R&D Projects</h2>
                <p className="text-muted-foreground mt-2">Pilot runs and experimental tracking</p>
              </div>
            </Route>
          </>
        )}

        {userRole === "supplier" && (
          <>
            <Route path="/supplier/dashboard" component={SupplierDashboard} />
            <Route path="/supplier/orders" component={SupplierDashboard} />
            <Route path="/supplier/library" component={SupplierLibraryPage} />
            <Route path="/supplier/ai-assistant" component={AIAssistantPage} />
            <Route path="/supplier/company" component={CompanyManagementPage} />
            <Route path="/supplier/bi-dashboard" component={BIDashboardPage} />
            <Route path="/supplier/analytics/practice-pulse" component={PracticePulseDashboard} />
            <Route path="/supplier/analytics/financial" component={FinancialDashboard} />
            <Route path="/supplier/analytics/operational" component={OperationalDashboard} />
            <Route path="/supplier/analytics/patient" component={PatientDashboard} />
          </>
        )}

        {userRole === "admin" && (
          <>
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/users" component={AdminDashboard} />
            <Route path="/admin/companies" component={CompanyManagementPage} />
            <Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
            <Route path="/admin/audit-logs" component={AuditLogsPage} />
            <Route path="/admin/permissions" component={PermissionsManagementPage} />
            <Route path="/admin/roles" component={RoleManagementPage} />
            <Route path="/admin/returns" component={ReturnsManagementPage} />
            <Route path="/admin/non-adapts" component={NonAdaptsPage} />
            <Route path="/admin/compliance" component={ComplianceDashboardPage} />
            <Route path="/admin/prescription-templates" component={PrescriptionTemplatesPage} />
            <Route path="/admin/clinical-protocols" component={ClinicalProtocolsPage} />
            <Route path="/admin/ai-forecasting" component={AIForecastingDashboardPage} />
            <Route path="/admin/ai-assistant" component={AIAssistantPage} />
            <Route path="/admin/ai-settings" component={AISettingsPage} />
            <Route path="/admin/email-analytics" component={EmailAnalyticsPage} />
            <Route path="/admin/email-templates" component={EmailTemplatesPage} />
            <Route path="/admin/company" component={CompanyManagementPage} />
            <Route path="/admin/bi-dashboard" component={BIDashboardPage} />
            <Route path="/admin/analytics" component={BusinessAnalyticsPage} />
            <Route path="/admin/analytics/practice-pulse" component={PracticePulseDashboard} />
            <Route path="/admin/analytics/financial" component={FinancialDashboard} />
            <Route path="/admin/analytics/operational" component={OperationalDashboard} />
            <Route path="/admin/analytics/patient" component={PatientDashboard} />
            <Route path="/admin/analytics/ai-insights" component={PlatformAIDashboard} />
            <Route path="/admin/ai-models" component={AIModelManagementPage} />
            <Route path="/admin/ml-models" component={MLModelManagementPage} />
            <Route path="/admin/python-ml" component={PythonMLDashboardPage} />
            <Route path="/admin/shopify" component={ShopifyIntegrationPage} />
            <Route path="/admin/nhs" component={NHSIntegrationPage} />
            <Route path="/admin/service-status" component={ServiceStatusPage} />
            <Route path="/admin/feature-flags" component={FeatureFlagsPage} />
            <Route path="/admin/api-docs" component={APIDocumentationPage} />
            
            {/* Advanced Healthcare Systems */}
            <Route path="/admin/healthcare-analytics" component={HealthcareAnalyticsPage} />
            <Route path="/admin/laboratory" component={LaboratoryIntegrationPage} />
            <Route path="/admin/practice-management" component={PracticeManagementPage} />
            
            <Route path="/admin/platform">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Platform Settings</h2>
                <p className="text-muted-foreground mt-2">Configure platform-wide settings and restrictions</p>
              </div>
            </Route>
          </>
        )}

        {userRole === "platform_admin" && (
          <>
            <Route path="/platform-admin/dashboard" component={PlatformAdminPage} />
            <Route path="/platform-admin/users" component={PlatformAdminPage} />
            <Route path="/platform-admin/companies" component={PlatformAdminPage} />
            <Route path="/platform-admin/system-health" component={SystemHealthDashboard} />
            <Route path="/platform-admin/system-config" component={SystemConfigPage} />
            <Route path="/platform-admin/api-keys" component={APIKeysManagementPage} />
            <Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
            <Route path="/platform-admin/settings" component={SettingsPage} />
            <Route path="/platform-admin/ai-models" component={AIModelManagementPage} />
            <Route path="/platform-admin/ml-models" component={MLModelManagementPage} />
            <Route path="/platform-admin/python-ml" component={PythonMLDashboardPage} />
            <Route path="/platform-admin/shopify" component={ShopifyIntegrationPage} />
            <Route path="/platform-admin/nhs" component={NHSIntegrationPage} />
            <Route path="/platform-admin/service-status" component={ServiceStatusPage} />
            <Route path="/platform-admin/feature-flags" component={FeatureFlagsPage} />
            <Route path="/platform-admin/api-docs" component={APIDocumentationPage} />
            
            {/* Advanced Healthcare Systems */}
            <Route path="/platform-admin/healthcare-analytics" component={HealthcareAnalyticsPage} />
            <Route path="/platform-admin/laboratory" component={LaboratoryIntegrationPage} />
            <Route path="/platform-admin/practice-management" component={PracticeManagementPage} />
            
            {/* ECP Routes */}
            <Route path="/ecp/dashboard" component={ECPDashboard} />
            <Route path="/ecp/patients" component={PatientsPage} />
            <Route path="/ecp/patient/:id/test" component={EyeTestPage} />
            <Route path="/ecp/patient/:id/test-wizard" component={EyeTestWizard} />
            <Route path="/ecp/prescriptions" component={PrescriptionsPage} />
            <Route path="/ecp/inventory" component={InventoryManagement} />
            <Route path="/ecp/pos" component={OpticalPOSPage} />
            <Route path="/ecp/invoices" component={InvoicesPage} />
            <Route path="/ecp/test-rooms" component={TestRoomsPage} />
            <Route path="/ecp/new-order" component={NewOrderPage} />
            <Route path="/ecp/orders" component={ECPDashboard} />
            <Route path="/ecp/ai-assistant" component={AIAssistantPage} />
            <Route path="/ecp/company" component={CompanyManagementPage} />
            <Route path="/ecp/bi-dashboard" component={BIDashboardPage} />
            <Route path="/ecp/analytics" component={AnalyticsDashboard} />
            
            {/* Lab Routes */}
            <Route path="/lab/dashboard" component={LabDashboard} />
            <Route path="/lab/production" component={ProductionTrackingPage} />
            <Route path="/lab/quality" component={QualityControlPage} />
            <Route path="/lab/equipment" component={EquipmentPage} />
            <Route path="/lab/engineering" component={EngineeringDashboardPage} />
            <Route path="/lab/returns" component={ReturnsManagementPage} />
            <Route path="/lab/non-adapts" component={NonAdaptsPage} />
            <Route path="/lab/ai-assistant" component={AIAssistantPage} />
            <Route path="/lab/bi-dashboard" component={BIDashboardPage} />
            <Route path="/lab/queue">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Order Queue</h2>
                <p className="text-muted-foreground mt-2">Full order queue management</p>
              </div>
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/audit-logs" component={AuditLogsPage} />
            <Route path="/admin/recalls" component={RecallManagementPage} />
            <Route path="/admin/permissions" component={PermissionsManagementPage} />
            <Route path="/admin/ai-assistant" component={AIAssistantPage} />
            <Route path="/admin/bi-dashboard" component={BIDashboardPage} />
            
            {/* Common Routes */}
            <Route path="/order/:id" component={OrderDetailsPage} />
          </>
        )}

        {userRole === "company_admin" && (
          <>
            {/* Company Admin Dashboard */}
            <Route path="/company-admin/dashboard" component={CompanyAdminPage} />
            <Route path="/company-admin/profile" component={CompanyAdminPage} />
            <Route path="/company-admin/users" component={CompanyAdminPage} />
            <Route path="/company-admin/suppliers" component={CompanyAdminPage} />
            <Route path="/company-admin/settings" component={SettingsPage} />
            <Route path="/company-admin/analytics" component={AnalyticsDashboard} />
            <Route path="/company-admin/ai-assistant" component={AIAssistantPage} />
            <Route path="/admin/permissions" component={PermissionsManagementPage} />
            <Route path="/admin/roles" component={RoleManagementPage} />
            <Route path="/admin/audit-logs" component={AuditLogsPage} />
            <Route path="/admin/recalls" component={RecallManagementPage} />

            {/* ECP Routes - Company Admin has full visibility into clinical operations */}
            <Route path="/ecp/dashboard" component={ECPDashboard} />
            <Route path="/ecp/patients" component={PatientsPage} />
            <Route path="/ecp/patients/:id" component={PatientProfile} />
            <Route path="/ecp/patient/:id/test" component={EyeTestPage} />
            <Route path="/ecp/patient/:id/test-wizard" component={EyeTestWizard} />
            <Route path="/ecp/prescriptions" component={PrescriptionsPage} />
            <Route path="/ecp/inventory" component={InventoryManagement} />
            <Route path="/ecp/examinations" component={ExaminationList} />
            <Route path="/ecp/examination/new" component={EyeExaminationComprehensive} />
            <Route path="/ecp/examination/:id" component={EyeExaminationComprehensive} />
            <Route path="/ecp/outside-rx" component={AddOutsideRx} />
            <Route path="/ecp/pos" component={OpticalPOSPage} />
            <Route path="/ecp/invoices" component={InvoicesPage} />
            <Route path="/ecp/test-rooms/bookings" component={TestRoomBookingsPage} />
            <Route path="/ecp/test-rooms" component={TestRoomsPage} />
            <Route path="/ecp/diary" component={DiaryPage} />
            <Route path="/ecp/communications" component={CommunicationsHubPage} />
            <Route path="/ecp/recalls" component={RecallManagementPage} />
            <Route path="/ecp/ai-assistant" component={AIAssistantPage} />
            <Route path="/ecp/orders" component={ECPDashboard} />
            <Route path="/ecp/ai-purchase-orders" component={AIPurchaseOrdersPage} />
            <Route path="/ecp/company" component={CompanyManagementPage} />
            <Route path="/ecp/bi-dashboard" component={BIDashboardPage} />
            <Route path="/ecp/analytics" component={AnalyticsDashboard} />
            <Route path="/ecp/analytics/practice-pulse" component={PracticePulseDashboard} />
            <Route path="/ecp/analytics/financial" component={FinancialDashboard} />
            <Route path="/ecp/analytics/operational" component={OperationalDashboard} />
            <Route path="/ecp/analytics/patient" component={PatientDashboard} />
            <Route path="/ecp/analytics/ai-insights" component={PlatformAIDashboard} />
            <Route path="/ecp/compliance" component={ComplianceDashboardPage} />
            <Route path="/ecp/prescription-templates" component={PrescriptionTemplatesPage} />
            <Route path="/ecp/clinical-protocols" component={ClinicalProtocolsPage} />
            <Route path="/order/:id" component={OrderDetailsPage} />
          </>
        )}

        {userRole === "dispenser" && (
          <>
            <Route path="/dispenser/dashboard" component={DispenserDashboard} />
            <Route path="/ecp/pos" component={OpticalPOSPage} />
            <Route path="/ecp/patients" component={PatientsPage} />
            <Route path="/ecp/inventory" component={InventoryManagement} />
            <Route path="/ecp/prescriptions" component={PrescriptionsPage} />
            <Route path="/ecp/invoices" component={InvoicesPage} />
          </>
        )}

        <Route path="/settings" component={SettingsPage} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/billing" component={SubscriptionPage} />
        <Route path="/github-push" component={GitHubPushPage} />
        
        {/* Email System Routes - Common for all roles */}
        <Route path="/email-analytics" component={EmailAnalyticsPage} />
        <Route path="/email-templates" component={EmailTemplatesPage} />
        
        {/* SaaS Metrics Dashboard - Platform Admin */}
        <Route path="/platform-admin/saas-metrics" component={SaaSMetricsDashboard} />
        
        {/* Marketplace Routes - Common for all roles (Chunk 6) */}
        <Route path="/marketplace" component={MarketplacePage} />
        <Route path="/marketplace/companies/:id" component={CompanyProfilePage} />
        <Route path="/marketplace/my-connections" component={MyConnectionsPage} />

        {/* Healthcare Routes - Phases 17-21 */}
        <Route path="/rcm/dashboard" component={RCMDashboard} />
        <Route path="/rcm/claims" component={ClaimsManagementPage} />
        <Route path="/rcm/payments" component={PaymentProcessingPage} />
        <Route path="/population-health/dashboard" component={PopulationHealthDashboard} />
        <Route path="/quality/dashboard" component={QualityDashboard} />
        <Route path="/quality/measures" component={QualityMeasuresPage} />
        <Route path="/mhealth/dashboard" component={MHealthDashboard} />
        <Route path="/mhealth/monitoring" component={RemoteMonitoringPage} />
        <Route path="/mhealth/devices" component={DeviceManagementPage} />
        <Route path="/research/dashboard" component={ResearchDashboard} />
        <Route path="/research/trials" component={ResearchTrialsPage} />

        {/* Platform Admin Routes (Chunk 7) */}
        <Route path="/platform-insights" component={PlatformInsightsDashboard} />
        
        <Route path="/help">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Help & Documentation</h2>
            <p className="text-muted-foreground mt-2">Support resources and guides</p>
          </div>
        </Route>

        <Route component={NotFound} />
      </Switch>
      </RouteErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <GlobalLoadingBar />
          <AuthenticatedApp />
          <FloatingAiChat />
          <Toaster />
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
