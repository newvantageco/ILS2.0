import * as React from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Package,
  Users,
  Settings,
  FileText,
  BarChart3,
  ShoppingCart,
  Beaker,
  Truck,
  Sparkles,
  Building2,
  Eye,
  Pill,
  Box,
  Receipt,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";

interface CommandItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  userRole: "ecp" | "lab_tech" | "supplier" | "engineer" | "admin";
}

export function CommandPalette({ userRole }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [, setLocation] = useLocation();

  // Define navigation items based on role
  const getNavigationItems = (): CommandItem[] => {
    const commonItems: CommandItem[] = [
      {
        label: "Settings",
        icon: Settings,
        path: "/settings",
        shortcut: "⌘S",
        keywords: ["settings", "preferences", "config"],
      },
      {
        label: "AI Assistant",
        icon: Sparkles,
        path: `/${userRole === "admin" ? "admin" : userRole === "supplier" ? "supplier" : userRole === "ecp" ? "ecp" : "lab"}/ai-assistant`,
        shortcut: "⌘K",
        keywords: ["ai", "assistant", "help", "chat"],
      },
      {
        label: "BI Dashboard",
        icon: BarChart3,
        path: `/${userRole === "admin" ? "admin" : userRole === "supplier" ? "supplier" : userRole === "ecp" ? "ecp" : "lab"}/bi-dashboard`,
        keywords: ["analytics", "business intelligence", "insights", "reports"],
      },
      {
        label: "Company Management",
        icon: Building2,
        path: `/${userRole === "admin" ? "admin" : userRole === "supplier" ? "supplier" : userRole === "ecp" ? "ecp" : "lab"}/company`,
        keywords: ["company", "organization", "team"],
      },
    ];

    switch (userRole) {
      case "ecp":
        return [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/ecp/dashboard",
            shortcut: "⌘H",
            keywords: ["home", "dashboard", "overview"],
          },
          {
            label: "Patients",
            icon: Users,
            path: "/ecp/patients",
            shortcut: "⌘P",
            keywords: ["patients", "people", "clients"],
          },
          {
            label: "Prescriptions",
            icon: Pill,
            path: "/ecp/prescriptions",
            keywords: ["prescriptions", "rx", "orders"],
          },
          {
            label: "Inventory",
            icon: Box,
            path: "/ecp/inventory",
            keywords: ["inventory", "stock", "products"],
          },
          {
            label: "Point of Sale",
            icon: DollarSign,
            path: "/ecp/pos",
            keywords: ["pos", "point of sale", "checkout", "sales"],
          },
          {
            label: "Invoices",
            icon: Receipt,
            path: "/ecp/invoices",
            keywords: ["invoices", "billing", "payments"],
          },
          {
            label: "New Order",
            icon: ShoppingCart,
            path: "/ecp/new-order",
            shortcut: "⌘N",
            keywords: ["new", "order", "create"],
          },
          ...commonItems,
        ];

      case "lab_tech":
      case "engineer":
        return [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/lab/dashboard",
            shortcut: "⌘H",
            keywords: ["home", "dashboard", "overview"],
          },
          {
            label: "Order Queue",
            icon: Package,
            path: "/lab/queue",
            keywords: ["queue", "orders", "pending"],
          },
          {
            label: "Production",
            icon: Beaker,
            path: "/lab/production",
            keywords: ["production", "manufacturing", "process"],
          },
          {
            label: "Quality Control",
            icon: Eye,
            path: "/lab/quality",
            keywords: ["quality", "qc", "inspection"],
          },
          {
            label: "Analytics",
            icon: BarChart3,
            path: "/lab/analytics",
            keywords: ["analytics", "data", "insights"],
          },
          {
            label: "Equipment",
            icon: Settings,
            path: "/lab/equipment",
            keywords: ["equipment", "machines", "calibration"],
          },
          {
            label: "R&D Projects",
            icon: Sparkles,
            path: "/lab/rnd",
            keywords: ["research", "development", "r&d", "innovation"],
          },
          ...commonItems,
        ];

      case "supplier":
        return [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/supplier/dashboard",
            shortcut: "⌘H",
            keywords: ["home", "dashboard", "overview"],
          },
          {
            label: "Orders",
            icon: Package,
            path: "/supplier/orders",
            keywords: ["orders", "shipments"],
          },
          {
            label: "Product Library",
            icon: FileText,
            path: "/supplier/library",
            keywords: ["library", "products", "catalog"],
          },
          ...commonItems,
        ];

      case "admin":
        return [
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            path: "/admin/dashboard",
            shortcut: "⌘H",
            keywords: ["home", "dashboard", "overview"],
          },
          {
            label: "Users",
            icon: Users,
            path: "/admin/users",
            keywords: ["users", "accounts", "people"],
          },
          {
            label: "Companies",
            icon: Building2,
            path: "/admin/companies",
            keywords: ["companies", "organizations"],
          },
          {
            label: "Platform Settings",
            icon: Settings,
            path: "/admin/platform",
            keywords: ["platform", "config", "system"],
          },
          {
            label: "AI Settings",
            icon: Sparkles,
            path: "/admin/ai-settings",
            keywords: ["ai", "configuration", "models"],
          },
          ...commonItems,
        ];

      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  // Keyboard shortcut listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    setLocation(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search for pages, features, or actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => handleSelect(item.path)}
              className="flex items-center gap-2"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => window.location.href = "/api/logout"}>
            <span>Logout</span>
          </CommandItem>
          <CommandItem onSelect={() => setLocation("/settings")}>
            <span>Open Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => setLocation("/help")}>
            <span>Get Help</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
