import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { CollapsibleSidebarGroup } from "@/components/CollapsibleSidebarGroup";
import {
  Home,
  Package,
  ClipboardList,
  TrendingUp,
  Settings,
  HelpCircle,
  Beaker,
  LogOut,
  Shield,
  Users,
  UserCircle,
  FileText,
  ShoppingCart,
  Archive,
  Brain,
  Building2,
  BarChart3,
  Receipt,
  LineChart,
  Eye,
  TestTube,
  Factory,
  CalendarDays,
  CheckCircle,
  Wrench,
  FileSearch,
  KeyRound,
  PackageX,
  AlertTriangle,
  FileType,
  BookOpen,
  Mail,
  Key,
  Activity,
  Store,
  Heart,
  Flag,
  Keyboard,
  Bell,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/lib/authUtils";

interface AppSidebarProps {
  userRole?: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin" | "platform_admin" | "company_admin" | "dispenser";
}

const menuItems = {
  ecp: {
    main: [
      { title: "Dashboard", url: "/ecp/dashboard", icon: Home },
      { title: "Patients", url: "/ecp/patients", icon: UserCircle },
    ],
    clinical: [
      { title: "Examinations", url: "/ecp/examinations", icon: Eye },
      { title: "Prescriptions", url: "/ecp/prescriptions", icon: FileText },
      { title: "Diary", url: "/ecp/test-rooms/bookings", icon: CalendarDays },
      { title: "Patient Recalls", url: "/ecp/recalls", icon: Bell },
    ],
    retail: [
      { title: "Point of Sale", url: "/ecp/pos", icon: ShoppingCart },
      { title: "Inventory", url: "/ecp/inventory", icon: Archive },
    ],
    orders: [
      { title: "New Order", url: "/ecp/new-order", icon: Package },
      { title: "My Orders", url: "/ecp/orders", icon: ClipboardList },
    ],
    insights: [
      { title: "AI Assistant", url: "/ecp/ai-assistant", icon: Brain },
      { title: "BI Dashboard", url: "/ecp/bi-dashboard", icon: BarChart3 },
      { title: "Analytics", url: "/ecp/analytics", icon: LineChart },
    ],
    advanced: [
      { title: "NHS Integration", url: "/ecp/nhs", icon: Heart },
      { title: "Practice Management", url: "/ecp/practice-management", icon: Users },
      { title: "Compliance", url: "/ecp/compliance", icon: Shield },
      { title: "Templates", url: "/ecp/prescription-templates", icon: FileType },
      { title: "Company Settings", url: "/ecp/company", icon: Building2 },
    ],
  },
  lab_tech: [
    { title: "Dashboard", url: "/lab/dashboard", icon: Home },
    { title: "Order Queue", url: "/lab/queue", icon: ClipboardList },
    { title: "Production", url: "/lab/production", icon: Factory },
    { title: "Quality Control", url: "/lab/quality", icon: CheckCircle },
    { title: "Engineering", url: "/lab/engineering", icon: Wrench },
    { title: "Diary / Bookings", url: "/ecp/test-rooms/bookings", icon: CalendarDays },
    { title: "AI Forecasting", url: "/lab/ai-forecasting", icon: TrendingUp },
    { title: "Returns", url: "/lab/returns", icon: PackageX },
    { title: "Non-Adapts", url: "/lab/non-adapts", icon: AlertTriangle },
    { title: "Equipment", url: "/lab/equipment", icon: Wrench },
    { title: "Healthcare Analytics", url: "/lab/healthcare-analytics", icon: Heart },
    { title: "Laboratory Integration", url: "/lab/laboratory", icon: Beaker },
    { title: "Compliance", url: "/lab/compliance", icon: Shield },
    { title: "AI Assistant", url: "/lab/ai-assistant", icon: Brain },
    { title: "Company", url: "/lab/company", icon: Building2 },
    { title: "BI Dashboard", url: "/lab/bi-dashboard", icon: BarChart3 },
    { title: "Analytics", url: "/lab/analytics", icon: LineChart },
  ],
  supplier: [
    { title: "Dashboard", url: "/supplier/dashboard", icon: Home },
    { title: "Purchase Orders", url: "/supplier/orders", icon: ClipboardList },
    { title: "Technical Library", url: "/supplier/library", icon: Package },
    { title: "AI Assistant", url: "/supplier/ai-assistant", icon: Brain },
    { title: "BI Dashboard", url: "/supplier/bi-dashboard", icon: BarChart3 },
    { title: "Company", url: "/supplier/company", icon: Building2 },
  ],
  engineer: [
    { title: "Dashboard", url: "/lab/dashboard", icon: Home },
    { title: "Analytics Hub", url: "/lab/analytics", icon: TrendingUp },
    { title: "Engineering", url: "/lab/engineering", icon: Wrench },
    { title: "Diary / Bookings", url: "/ecp/test-rooms/bookings", icon: CalendarDays },
    { title: "Returns", url: "/lab/returns", icon: PackageX },
    { title: "Non-Adapts", url: "/lab/non-adapts", icon: AlertTriangle },
    { title: "Compliance", url: "/lab/compliance", icon: Shield },
    { title: "Equipment", url: "/lab/equipment", icon: Settings },
    { title: "Production", url: "/lab/production", icon: Factory },
    { title: "Quality Control", url: "/lab/quality", icon: CheckCircle },
    { title: "R&D Projects", url: "/lab/rnd", icon: Beaker },
    { title: "AI Assistant", url: "/lab/ai-assistant", icon: Brain },
    { title: "BI Dashboard", url: "/lab/bi-dashboard", icon: BarChart3 },
    { title: "Company", url: "/lab/company", icon: Building2 },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Companies", url: "/admin/companies", icon: Building2 },
    { title: "Orders", url: "/admin/orders", icon: ClipboardList },
    { title: "Prescriptions", url: "/admin/prescriptions", icon: FileText },
    { title: "Patient Recalls", url: "/admin/recalls", icon: Bell },
    { title: "Email Templates", url: "/admin/email-templates", icon: Mail },
    { title: "Healthcare Analytics", url: "/admin/healthcare-analytics", icon: Heart },
    { title: "Laboratory Integration", url: "/admin/laboratory", icon: Beaker },
    { title: "Practice Management", url: "/admin/practice-management", icon: Users },
    { title: "Compliance", url: "/admin/compliance", icon: Shield },
    { title: "AI Models", url: "/admin/ai-models", icon: Brain },
    { title: "ML Models", url: "/admin/ml-models", icon: Brain },
    { title: "Python ML", url: "/admin/python-ml", icon: Brain },
    { title: "Shopify", url: "/admin/shopify", icon: Store },
    { title: "NHS", url: "/admin/nhs", icon: Shield },
    { title: "Service Status", url: "/admin/service-status", icon: Activity },
    { title: "Feature Flags", url: "/admin/feature-flags", icon: Flag },
    { title: "API Docs", url: "/admin/api-docs", icon: FileText },
    { title: "AI Assistant", url: "/admin/ai-assistant", icon: Brain },
    { title: "Company", url: "/admin/company", icon: Building2 },
    { title: "BI Dashboard", url: "/admin/bi-dashboard", icon: BarChart3 },
    { title: "Analytics", url: "/admin/analytics", icon: LineChart },
  ],
  platform_admin: [
    { title: "Platform Dashboard", url: "/platform-admin/dashboard", icon: Home },
    { title: "All Users", url: "/platform-admin/users", icon: Users },
    { title: "All Companies", url: "/platform-admin/companies", icon: Building2 },
    { title: "System Health", url: "/platform-admin/system-health", icon: Activity },
    { title: "System Configuration", url: "/platform-admin/system-config", icon: Settings },
    { title: "API Keys", url: "/platform-admin/api-keys", icon: Key },
    { title: "Diary / Bookings", url: "/ecp/test-rooms/bookings", icon: CalendarDays },
    { title: "Platform Settings", url: "/platform-admin/settings", icon: Shield },
    { title: "Healthcare Analytics", url: "/platform-admin/healthcare-analytics", icon: Heart },
    { title: "Laboratory Integration", url: "/platform-admin/laboratory", icon: Beaker },
    { title: "Practice Management", url: "/platform-admin/practice-management", icon: Users },
    { title: "AI Models", url: "/platform-admin/ai-models", icon: Brain },
    { title: "ML Models", url: "/platform-admin/ml-models", icon: Brain },
    { title: "Python ML", url: "/platform-admin/python-ml", icon: Brain },
    { title: "Shopify", url: "/platform-admin/shopify", icon: Store },
    { title: "NHS", url: "/platform-admin/nhs", icon: Shield },
    { title: "Service Status", url: "/platform-admin/service-status", icon: Activity },
    { title: "Feature Flags", url: "/platform-admin/feature-flags", icon: Flag },
    { title: "API Docs", url: "/platform-admin/api-docs", icon: FileText },
    { title: "AI Assistant", url: "/admin/ai-assistant", icon: Brain },
    { title: "BI Dashboard", url: "/admin/bi-dashboard", icon: BarChart3 },
  ],
  company_admin: {
    admin: [
      { title: "Admin Dashboard", url: "/company-admin/dashboard", icon: Home },
      { title: "User Management", url: "/company-admin/users", icon: Users },
      { title: "Permissions", url: "/admin/permissions", icon: KeyRound },
      { title: "Role Management", url: "/admin/roles", icon: Shield },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: FileText },
      { title: "Patient Recalls", url: "/admin/recalls", icon: Bell },
      { title: "Company Settings", url: "/ecp/company", icon: Building2 },
    ],
    clinical: [
      { title: "ECP Dashboard", url: "/ecp/dashboard", icon: Eye },
      { title: "Patients", url: "/ecp/patients", icon: UserCircle },
      { title: "Examinations", url: "/ecp/examinations", icon: Eye },
      { title: "Prescriptions", url: "/ecp/prescriptions", icon: FileText },
      { title: "Diary / Bookings", url: "/ecp/test-rooms/bookings", icon: CalendarDays },
    ],
    retail: [
      { title: "Point of Sale", url: "/ecp/pos", icon: ShoppingCart },
      { title: "Inventory", url: "/ecp/inventory", icon: Archive },
      { title: "Invoices", url: "/ecp/invoices", icon: FileText },
    ],
    insights: [
      { title: "Analytics", url: "/company-admin/analytics", icon: BarChart3 },
      { title: "AI Assistant", url: "/company-admin/ai-assistant", icon: Brain },
      { title: "BI Dashboard", url: "/ecp/bi-dashboard", icon: LineChart },
      { title: "Compliance", url: "/ecp/compliance", icon: Shield },
    ],
  },
  dispenser: [
    { title: "Dashboard", url: "/dispenser/dashboard", icon: Home },
    { title: "Inventory", url: "/dispenser/inventory", icon: Archive },
    { title: "Orders", url: "/dispenser/orders", icon: ClipboardList },
    { title: "Point of Sale", url: "/dispenser/pos", icon: ShoppingCart },
    { title: "Patients", url: "/dispenser/patients", icon: UserCircle },
    { title: "Analytics", url: "/dispenser/analytics", icon: LineChart },
  ],
};

const roleLabels = {
  ecp: "Eye Care Professional",
  lab_tech: "Lab Technician",
  supplier: "Supplier",
  engineer: "Principal Engineer",
  admin: "Administrator",
  platform_admin: "Master Admin",
  company_admin: "Company Administrator",
  dispenser: "Dispenser",
};

export function AppSidebar({ userRole = "lab_tech" }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const items = menuItems[userRole];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Check if items is grouped (has sections)
  const isGrouped = userRole === "ecp" || userRole === "company_admin";

  return (
    <Sidebar aria-label="Primary">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">ILS</span>
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Lens System</h1>
            <Badge variant="outline" className="text-xs mt-1">
              {roleLabels[userRole]}
            </Badge>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {isGrouped && typeof items === 'object' && !Array.isArray(items) ? (
          <>
            {/* Main/Admin Section - Always Expanded */}
            <SidebarGroup>
              <SidebarGroupLabel>{userRole === "company_admin" ? "Administration" : "Main"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {(items.main || items.admin || []).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Link 
                          href={item.url}
                          aria-label={item.title}
                          aria-current={location === item.url ? "page" : undefined}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Clinical - Collapsible */}
            <CollapsibleSidebarGroup label="Clinical" defaultCollapsed={true}>
              <SidebarMenu>
                {items.clinical.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSidebarGroup>

            {/* Retail - Collapsible */}
            <CollapsibleSidebarGroup label="Retail" defaultCollapsed={true}>
              <SidebarMenu>
                {items.retail.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSidebarGroup>

            {/* Orders - Collapsible */}
            <CollapsibleSidebarGroup label="Orders" defaultCollapsed={true}>
              <SidebarMenu>
                {items.orders.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSidebarGroup>

            {/* Insights - Collapsible */}
            <CollapsibleSidebarGroup label="Insights" defaultCollapsed={true}>
              <SidebarMenu>
                {items.insights.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSidebarGroup>

            {/* Advanced - Collapsible */}
            <CollapsibleSidebarGroup label="Advanced" defaultCollapsed={true}>
              <SidebarMenu>
                {items.advanced.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleSidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.isArray(items) && items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Link 
                        href={item.url}
                        aria-label={item.title}
                        aria-current={location === item.url ? "page" : undefined}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Marketplace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-marketplace">
                  <Link href="/marketplace">
                    <Building2 className="h-4 w-4" />
                    <span>Marketplace</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-my-connections">
                  <Link href="/marketplace/my-connections">
                    <Users className="h-4 w-4" />
                    <span>My Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Admin Analytics (Chunk 7 - platform_admin only) */}
        {user?.role === 'platform_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Platform Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="nav-platform-insights">
                    <Link href="/platform-insights">
                      <BarChart3 className="h-4 w-4" />
                      <span>Platform Insights</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-help">
                  <Link href="/help">
                    <HelpCircle className="h-4 w-4" />
                    <span>Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-md">
              <Avatar className="h-8 w-8">
                {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                  {user.email || "No email"}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="button-logout-sidebar"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </Button>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-2 py-1">
                <Keyboard className="h-3 w-3" />
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘/</kbd>
                <span>for shortcuts</span>
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
