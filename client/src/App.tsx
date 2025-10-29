import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcherDropdown } from "@/components/RoleSwitcherDropdown";
import { FloatingAiChat } from "@/components/FloatingAiChat";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import ECPDashboard from "@/pages/ECPDashboard";
import LabDashboard from "@/pages/LabDashboard";
import SupplierDashboard from "@/pages/SupplierDashboard";
import NewOrderPage from "@/pages/NewOrderPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import SettingsPage from "@/pages/SettingsPage";
import SignupPage from "@/pages/SignupPage";
import PendingApprovalPage from "@/pages/PendingApprovalPage";
import AccountSuspendedPage from "@/pages/AccountSuspendedPage";
import AdminDashboard from "@/pages/AdminDashboard";
import EmailLoginPage from "@/pages/EmailLoginPage";
import EmailSignupPage from "@/pages/EmailSignupPage";
import GitHubPushPage from "@/pages/github-push";
import PatientsPage from "@/pages/PatientsPage";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import InventoryPage from "@/pages/InventoryPage";
import POSPage from "@/pages/POSPage";
import InvoicesPage from "@/pages/InvoicesPage";
import EyeTestPage from "@/pages/EyeTestPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import AISettingsPage from "@/pages/AISettingsPage";
import CompanyManagementPage from "@/pages/CompanyManagementPage";
import BIDashboardPage from "@/pages/BIDashboardPage";
import { LogOut } from "lucide-react";
import { useLocation } from "wouter";

function AppLayout({ children, userRole }: { children: React.ReactNode; userRole: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin" }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-mobile": "100%",
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <RoleSwitcherDropdown />
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                data-testid="button-logout"
                className="shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Public routes (accessible without auth)
  if (location === '/login') {
    return <Login />;
  }

  if (location === '/email-login') {
    return <EmailLoginPage />;
  }
  
  if (location === '/email-signup') {
    return <EmailSignupPage />;
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
    return <Landing />;
  }

  // Handle users who need to complete signup
  if (!user.role) {
    return (
      <Switch>
        <Route path="/signup" component={SignupPage} />
        <Route><Redirect to="/signup" /></Route>
      </Switch>
    );
  }

  // Handle pending approval status
  if (user.accountStatus === 'pending') {
    return (
      <Switch>
        <Route path="/pending-approval" component={PendingApprovalPage} />
        <Route><Redirect to="/pending-approval" /></Route>
      </Switch>
    );
  }

  // Handle suspended accounts
  if (user.accountStatus === 'suspended') {
    return (
      <Switch>
        <Route path="/account-suspended" component={AccountSuspendedPage} />
        <Route><Redirect to="/account-suspended" /></Route>
      </Switch>
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
      default:
        return "/lab";
    }
  };

  if (location === "/" || location === "") {
    return <Redirect to={`${getRoleBasePath()}/dashboard`} />;
  }

  return (
    <AppLayout userRole={userRole}>
      <Switch>
        {userRole === "ecp" && (
          <>
            <Route path="/ecp/dashboard" component={ECPDashboard} />
            <Route path="/ecp/patients" component={PatientsPage} />
            <Route path="/ecp/patient/:id/test" component={EyeTestPage} />
            <Route path="/ecp/prescriptions" component={PrescriptionsPage} />
            <Route path="/ecp/inventory" component={InventoryPage} />
            <Route path="/ecp/pos" component={POSPage} />
            <Route path="/ecp/invoices" component={InvoicesPage} />
            <Route path="/ecp/new-order" component={NewOrderPage} />
            <Route path="/ecp/orders" component={ECPDashboard} />
            <Route path="/ecp/ai-assistant" component={AIAssistantPage} />
            <Route path="/ecp/company" component={CompanyManagementPage} />
            <Route path="/ecp/bi-dashboard" component={BIDashboardPage} />
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
            <Route path="/lab/ai-assistant" component={AIAssistantPage} />
            <Route path="/lab/company" component={CompanyManagementPage} />
            <Route path="/lab/bi-dashboard" component={BIDashboardPage} />
            <Route path="/lab/queue">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Order Queue</h2>
                <p className="text-muted-foreground mt-2">Full order queue management</p>
              </div>
            </Route>
            <Route path="/lab/production">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Production Tracking</h2>
                <p className="text-muted-foreground mt-2">Real-time production monitoring</p>
              </div>
            </Route>
            <Route path="/lab/quality">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Quality Control</h2>
                <p className="text-muted-foreground mt-2">QC inspection and approval workflow</p>
              </div>
            </Route>
            <Route path="/lab/analytics">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Analytics Hub</h2>
                <p className="text-muted-foreground mt-2">Root cause analysis and data correlation</p>
              </div>
            </Route>
            <Route path="/lab/equipment">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Equipment Management</h2>
                <p className="text-muted-foreground mt-2">Calibration tracking and maintenance scheduling</p>
              </div>
            </Route>
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
            <Route path="/supplier/library" component={SupplierDashboard} />
            <Route path="/supplier/ai-assistant" component={AIAssistantPage} />
            <Route path="/supplier/company" component={CompanyManagementPage} />
            <Route path="/supplier/bi-dashboard" component={BIDashboardPage} />
          </>
        )}

        {userRole === "admin" && (
          <>
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/users" component={AdminDashboard} />
            <Route path="/admin/ai-assistant" component={AIAssistantPage} />
            <Route path="/admin/ai-settings" component={AISettingsPage} />
            <Route path="/admin/company" component={CompanyManagementPage} />
            <Route path="/admin/bi-dashboard" component={BIDashboardPage} />
            <Route path="/admin/platform">
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold">Platform Settings</h2>
                <p className="text-muted-foreground mt-2">Configure platform-wide settings and restrictions</p>
              </div>
            </Route>
          </>
        )}

        <Route path="/settings" component={SettingsPage} />
        <Route path="/github-push" component={GitHubPushPage} />
        <Route path="/help">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Help & Documentation</h2>
            <p className="text-muted-foreground mt-2">Support resources and guides</p>
          </div>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthenticatedApp />
        <FloatingAiChat />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
