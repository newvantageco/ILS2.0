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
  CheckCircle,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/lib/authUtils";

interface AppSidebarProps {
  userRole?: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin" | "platform_admin" | "company_admin";
}

const menuItems = {
  ecp: [
    { title: "Dashboard", url: "/ecp/dashboard", icon: Home },
    { title: "Patients", url: "/ecp/patients", icon: UserCircle },
    { title: "Prescriptions", url: "/ecp/prescriptions", icon: FileText },
    { title: "Test Rooms", url: "/ecp/test-rooms", icon: TestTube },
    { title: "Inventory", url: "/ecp/inventory", icon: Archive },
    { title: "Point of Sale", url: "/ecp/pos", icon: ShoppingCart },
    { title: "Invoices", url: "/ecp/invoices", icon: Receipt },
    { title: "New Order", url: "/ecp/new-order", icon: Package },
    { title: "My Orders", url: "/ecp/orders", icon: ClipboardList },
    { title: "Returns", url: "/ecp/returns", icon: TrendingUp },
    { title: "AI Assistant", url: "/ecp/ai-assistant", icon: Brain },
    { title: "Analytics", url: "/ecp/analytics", icon: LineChart },
    { title: "BI Dashboard", url: "/ecp/bi-dashboard", icon: BarChart3 },
    { title: "Company", url: "/ecp/company", icon: Building2 },
  ],
  lab_tech: [
    { title: "Dashboard", url: "/lab/dashboard", icon: Home },
    { title: "Order Queue", url: "/lab/queue", icon: ClipboardList },
    { title: "Production", url: "/lab/production", icon: Factory },
    { title: "Quality Control", url: "/lab/quality", icon: CheckCircle },
    { title: "Equipment", url: "/lab/equipment", icon: Settings },
    { title: "AI Assistant", url: "/lab/ai-assistant", icon: Brain },
    { title: "BI Dashboard", url: "/lab/bi-dashboard", icon: BarChart3 },
    { title: "Company", url: "/lab/company", icon: Building2 },
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
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Company Management", url: "/admin/companies", icon: Building2 },
    { title: "Platform Settings", url: "/admin/platform", icon: Shield },
    { title: "AI Assistant", url: "/admin/ai-assistant", icon: Brain },
    { title: "AI Settings", url: "/admin/ai-settings", icon: Settings },
    { title: "BI Dashboard", url: "/admin/bi-dashboard", icon: BarChart3 },
  ],
  platform_admin: [
    { title: "Platform Dashboard", url: "/platform-admin/dashboard", icon: Home },
    { title: "All Users", url: "/platform-admin/users", icon: Users },
    { title: "All Companies", url: "/platform-admin/companies", icon: Building2 },
    { title: "Platform Settings", url: "/platform-admin/settings", icon: Shield },
    // ECP Testing
    { title: "ECP: Patients", url: "/ecp/patients", icon: UserCircle },
    { title: "ECP: Point of Sale", url: "/ecp/pos", icon: ShoppingCart },
    { title: "ECP: Prescriptions", url: "/ecp/prescriptions", icon: FileText },
    { title: "ECP: Orders", url: "/ecp/orders", icon: ClipboardList },
    { title: "ECP: Inventory", url: "/ecp/inventory", icon: Archive },
    // Lab Testing
    { title: "Lab: Queue", url: "/lab/queue", icon: ClipboardList },
    { title: "Lab: Production", url: "/lab/production", icon: Factory },
    { title: "Lab: Quality Control", url: "/lab/quality", icon: CheckCircle },
    { title: "Lab: Equipment", url: "/lab/equipment", icon: Settings },
    // Analytics & AI
    { title: "AI Assistant", url: "/admin/ai-assistant", icon: Brain },
    { title: "BI Dashboard", url: "/admin/bi-dashboard", icon: BarChart3 },
  ],
  company_admin: [
    { title: "Dashboard", url: "/company-admin/dashboard", icon: Home },
    { title: "Company Profile", url: "/company-admin/profile", icon: Building2 },
    { title: "Users", url: "/company-admin/users", icon: Users },
    { title: "Suppliers", url: "/company-admin/suppliers", icon: Package },
    { title: "Settings", url: "/company-admin/settings", icon: Settings },
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
};

export function AppSidebar({ userRole = "lab_tech" }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const items = menuItems[userRole];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
