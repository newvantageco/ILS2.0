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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/lib/authUtils";

interface AppSidebarProps {
  userRole?: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin";
}

const menuItems = {
  ecp: [
    { title: "Dashboard", url: "/ecp/dashboard", icon: Home },
    { title: "New Order", url: "/ecp/new-order", icon: Package },
    { title: "My Orders", url: "/ecp/orders", icon: ClipboardList },
    { title: "Returns", url: "/ecp/returns", icon: TrendingUp },
  ],
  lab_tech: [
    { title: "Dashboard", url: "/lab/dashboard", icon: Home },
    { title: "Order Queue", url: "/lab/queue", icon: ClipboardList },
    { title: "Production", url: "/lab/production", icon: Package },
    { title: "Quality Control", url: "/lab/quality", icon: Beaker },
  ],
  supplier: [
    { title: "Dashboard", url: "/supplier/dashboard", icon: Home },
    { title: "Purchase Orders", url: "/supplier/orders", icon: ClipboardList },
    { title: "Technical Library", url: "/supplier/library", icon: Package },
  ],
  engineer: [
    { title: "Dashboard", url: "/lab/dashboard", icon: Home },
    { title: "Analytics Hub", url: "/lab/analytics", icon: TrendingUp },
    { title: "Equipment", url: "/lab/equipment", icon: Settings },
    { title: "R&D Projects", url: "/lab/rnd", icon: Beaker },
  ],
  admin: [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Platform Settings", url: "/admin/platform", icon: Shield },
  ],
};

const roleLabels = {
  ecp: "Eye Care Professional",
  lab_tech: "Lab Technician",
  supplier: "Supplier",
  engineer: "Principal Engineer",
  admin: "Administrator",
};

export function AppSidebar({ userRole = "lab_tech" }: AppSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const items = menuItems[userRole];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <Sidebar>
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
                    <Link href={item.url}>
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
