/**
 * Modern Sidebar - Clean, Linear-inspired Navigation
 *
 * Design Principles:
 * - Minimal, clean aesthetic
 * - Progressive disclosure - show only what's needed
 * - Role-based navigation
 * - Quick access to AI features
 * - Smooth transitions and micro-interactions
 */

import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getUserDisplayName, getUserInitials } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Users,
  Calendar,
  FileText,
  Package,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  LogOut,
  Sparkles,
  Eye,
  ShoppingCart,
  Archive,
  Mail,
  Brain,
  Activity,
  Shield,
  Building2,
  Wrench,
  Factory,
  AlertTriangle,
  Beaker,
  Heart,
  Clock,
  UserCheck,
  Send,
  LineChart,
  CheckCircle,
  Store,
  Keyboard,
} from "lucide-react";

// Navigation item type
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "destructive";
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Role-based navigation configuration
const getNavigation = (role: string): NavGroup[] => {
  const commonItems: NavGroup = {
    id: "support",
    label: "Support",
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
      { id: "help", label: "Help", icon: HelpCircle, href: "/help" },
    ],
  };

  switch (role) {
    case "ecp":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: "/ecp/dashboard" },
            { id: "patients", label: "Patients", icon: Users, href: "/ecp/patients" },
          ],
        },
        {
          id: "clinical",
          label: "Clinical",
          defaultOpen: true,
          items: [
            { id: "examinations", label: "Examinations", icon: Eye, href: "/ecp/examinations" },
            { id: "prescriptions", label: "Prescriptions", icon: FileText, href: "/ecp/prescriptions" },
            { id: "diary", label: "Diary", icon: Calendar, href: "/ecp/diary" },
            { id: "recalls", label: "Patient Recalls", icon: Bell, href: "/ecp/recalls", badge: 5, badgeVariant: "destructive" },
          ],
        },
        {
          id: "retail",
          label: "Retail",
          items: [
            { id: "pos", label: "Point of Sale", icon: ShoppingCart, href: "/ecp/pos" },
            { id: "inventory", label: "Inventory", icon: Archive, href: "/ecp/inventory" },
          ],
        },
        {
          id: "insights",
          label: "Insights",
          items: [
            { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/ecp/ai-assistant" },
            { id: "analytics", label: "Analytics", icon: BarChart3, href: "/ecp/analytics" },
          ],
        },
        commonItems,
      ];

    case "lab_tech":
    case "engineer":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: "/lab/dashboard" },
            { id: "queue", label: "Order Queue", icon: Package, href: "/lab/queue", badge: 12 },
          ],
        },
        {
          id: "production",
          label: "Production",
          defaultOpen: true,
          items: [
            { id: "production", label: "Production", icon: Factory, href: "/lab/production" },
            { id: "quality", label: "Quality Control", icon: CheckCircle, href: "/lab/quality" },
            { id: "equipment", label: "Equipment", icon: Wrench, href: "/lab/equipment" },
          ],
        },
        {
          id: "insights",
          label: "Insights",
          items: [
            { id: "ai-forecasting", label: "AI Forecasting", icon: Brain, href: "/lab/ai-forecasting" },
            { id: "analytics", label: "Analytics", icon: LineChart, href: "/lab/analytics" },
            { id: "non-adapts", label: "Non-Adapts", icon: AlertTriangle, href: "/lab/non-adapts", badge: 3, badgeVariant: "destructive" },
          ],
        },
        commonItems,
      ];

    case "admin":
    case "platform_admin":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: role === "platform_admin" ? "/platform-admin/dashboard" : "/admin/dashboard" },
            { id: "users", label: "Users", icon: Users, href: role === "platform_admin" ? "/platform-admin/users" : "/admin/users" },
            { id: "companies", label: "Companies", icon: Building2, href: role === "platform_admin" ? "/platform-admin/companies" : "/admin/companies" },
          ],
        },
        {
          id: "platform",
          label: "Platform",
          items: [
            { id: "health", label: "System Health", icon: Activity, href: "/platform-admin/system-health" },
            { id: "ai-models", label: "AI Models", icon: Brain, href: role === "platform_admin" ? "/platform-admin/ai-models" : "/admin/ai-models" },
            { id: "audit", label: "Audit Logs", icon: Shield, href: "/admin/audit-logs" },
          ],
        },
        commonItems,
      ];

    case "company_admin":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: "/company-admin/dashboard" },
            { id: "users", label: "Team Members", icon: Users, href: "/company-admin/users" },
            { id: "pending", label: "Pending Members", icon: UserCheck, href: "/company-admin/pending-members", badge: 2 },
          ],
        },
        {
          id: "clinical",
          label: "Clinical",
          items: [
            { id: "ecp-dashboard", label: "ECP Dashboard", icon: Eye, href: "/ecp/dashboard" },
            { id: "patients", label: "Patients", icon: Users, href: "/ecp/patients" },
          ],
        },
        {
          id: "insights",
          label: "Insights",
          items: [
            { id: "analytics", label: "Analytics", icon: BarChart3, href: "/company-admin/analytics" },
            { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/company-admin/ai-assistant" },
          ],
        },
        commonItems,
      ];

    case "dispenser":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: "/dispenser/dashboard" },
            { id: "handoff", label: "Handoff Queue", icon: UserCheck, href: "/dispenser/handoff", badge: 4 },
          ],
        },
        {
          id: "retail",
          label: "Retail",
          items: [
            { id: "pos", label: "Point of Sale", icon: ShoppingCart, href: "/dispenser/pos" },
            { id: "inventory", label: "Inventory", icon: Archive, href: "/dispenser/inventory" },
          ],
        },
        commonItems,
      ];

    case "supplier":
      return [
        {
          id: "main",
          label: "Main",
          defaultOpen: true,
          items: [
            { id: "dashboard", label: "Dashboard", icon: Home, href: "/supplier/dashboard" },
            { id: "orders", label: "Purchase Orders", icon: Package, href: "/supplier/orders" },
            { id: "library", label: "Technical Library", icon: FileText, href: "/supplier/library" },
          ],
        },
        {
          id: "insights",
          label: "Insights",
          items: [
            { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/supplier/ai-assistant" },
            { id: "bi", label: "BI Dashboard", icon: BarChart3, href: "/supplier/bi-dashboard" },
          ],
        },
        commonItems,
      ];

    default:
      return [commonItems];
  }
};

// Role display names
const roleLabels: Record<string, string> = {
  ecp: "Eye Care Professional",
  lab_tech: "Lab Technician",
  supplier: "Supplier",
  engineer: "Principal Engineer",
  admin: "Administrator",
  platform_admin: "Platform Admin",
  company_admin: "Company Admin",
  dispenser: "Dispenser",
  store_manager: "Store Manager",
};

interface ModernSidebarProps {
  className?: string;
}

export function ModernSidebar({ className }: ModernSidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["main", "clinical"]));

  const userRole = user?.role || "ecp";
  const navigation = getNavigation(userRole);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border",
        "transition-all duration-200 ease-out",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">ILS</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm">Lens System</h1>
              <Badge variant="secondary" className="text-xs mt-0.5 h-5">
                {roleLabels[userRole]}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search & AI Quick Access */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-muted/50 hover:bg-muted transition-colors",
              "text-sm text-muted-foreground"
            )}
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs">
              ⌘K
            </kbd>
          </button>
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-gradient-to-r from-primary/10 to-purple-500/10",
              "border border-primary/20 hover:border-primary/40",
              "transition-colors"
            )}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="flex-1 text-left text-sm font-medium">AI Assistant</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-4">
          {navigation.map((group) => (
            <div key={group.id}>
              {!isCollapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                >
                  {group.label}
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 transition-transform",
                      openGroups.has(group.id) && "rotate-90"
                    )}
                  />
                </button>
              )}
              <div
                className={cn(
                  "space-y-0.5",
                  !isCollapsed && !openGroups.has(group.id) && "hidden"
                )}
              >
                {group.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.id} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>
                            <a
                              className={cn(
                                "flex items-center justify-center w-full h-10 rounded-lg transition-colors",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                              {item.badge && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                              )}
                            </a>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          <div className="flex items-center gap-2">
                            {item.label}
                            {item.badge && (
                              <Badge variant={item.badgeVariant || "secondary"} className="h-5">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link key={item.id} href={item.href}>
                      <a
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "secondary"}
                            className="h-5 px-1.5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer / User */}
      <div className="p-3 border-t border-sidebar-border">
        {user && (
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center gap-3 px-2 py-1">
                <Avatar className="h-8 w-8">
                  {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email || "No email"}
                  </p>
                </div>
              </div>
            )}

            <div className={cn("flex", isCollapsed ? "flex-col gap-1" : "gap-1")}>
              {isCollapsed ? (
                <>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Bell className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Notifications</TooltipContent>
                  </Tooltip>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Logout</TooltipContent>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="flex-1 justify-start h-8">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-8"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
            </div>

            {!isCollapsed && (
              <div className="pt-2 border-t border-sidebar-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-2">
                  <Keyboard className="h-3 w-3" />
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘/</kbd>
                  <span>for shortcuts</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ModernSidebar;
