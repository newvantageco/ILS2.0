import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import RoleSwitcher from "@/pages/RoleSwitcher";
import ECPDashboard from "@/pages/ECPDashboard";
import LabDashboard from "@/pages/LabDashboard";
import SupplierDashboard from "@/pages/SupplierDashboard";
import NewOrderPage from "@/pages/NewOrderPage";
import { useLocation } from "wouter";

function AppLayout({ children, userRole }: { children: React.ReactNode; userRole: "ecp" | "lab" | "supplier" | "engineer" }) {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar userRole={userRole} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [location] = useLocation();
  
  const getRoleFromPath = (): "ecp" | "lab" | "supplier" | "engineer" | null => {
    if (location.startsWith("/ecp")) return "ecp";
    if (location.startsWith("/lab")) return "lab";
    if (location.startsWith("/supplier")) return "supplier";
    if (location.startsWith("/engineer")) return "engineer";
    return null;
  };

  const userRole = getRoleFromPath();

  if (!userRole) {
    return (
      <Switch>
        <Route path="/" component={RoleSwitcher} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <AppLayout userRole={userRole}>
      <Switch>
        {/* ECP Routes */}
        <Route path="/ecp/dashboard" component={ECPDashboard} />
        <Route path="/ecp/new-order" component={NewOrderPage} />
        <Route path="/ecp/orders">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">My Orders</h2>
            <p className="text-muted-foreground mt-2">Order history will be displayed here</p>
          </div>
        </Route>
        <Route path="/ecp/returns">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Returns Management</h2>
            <p className="text-muted-foreground mt-2">Returns and non-adapt tracking</p>
          </div>
        </Route>

        {/* Lab Routes */}
        <Route path="/lab/dashboard" component={LabDashboard} />
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

        {/* Engineer Routes */}
        <Route path="/engineer/dashboard" component={LabDashboard} />
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

        {/* Supplier Routes */}
        <Route path="/supplier/dashboard" component={SupplierDashboard} />
        <Route path="/supplier/orders">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Purchase Orders</h2>
            <p className="text-muted-foreground mt-2">Complete PO management</p>
          </div>
        </Route>
        <Route path="/supplier/library">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Technical Library</h2>
            <p className="text-muted-foreground mt-2">Spec sheets and material documentation</p>
          </div>
        </Route>

        {/* Common Routes */}
        <Route path="/settings">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Settings</h2>
            <p className="text-muted-foreground mt-2">User preferences and configuration</p>
          </div>
        </Route>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
