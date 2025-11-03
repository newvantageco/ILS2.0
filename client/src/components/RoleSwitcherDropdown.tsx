import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Beaker, ChevronDown, Check, Package, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
  ecp: {
    label: "Eye Care Professional",
    icon: Users,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  lab_tech: {
    label: "Lab Technician",
    icon: Beaker,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  engineer: {
    label: "Principal Engineer",
    icon: Beaker,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  supplier: {
    label: "Supplier",
    icon: Package,
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  admin: {
    label: "Administrator",
    icon: Shield,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  platform_admin: {
    label: "Platform Administrator",
    icon: Shield,
    color: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  company_admin: {
    label: "Company Administrator",
    icon: Shield,
    color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
};

export function RoleSwitcherDropdown() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get available roles from the user object which now includes availableRoles
  const availableRoles = (user as any)?.availableRoles || [];

  const switchRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/auth/switch-role", { role });
      return await res.json() as User;
    },
    onSuccess: (data: User) => {
      // Clear React Query cache to ensure fresh data
      queryClient.clear();
      
      // Redirect to appropriate dashboard
      const role = data.role;
      if (!role) return;
      
      let path = "/";
      if (role === "ecp") path = "/ecp/dashboard";
      else if (role === "lab_tech" || role === "engineer") path = "/lab/dashboard";
      else if (role === "supplier") path = "/supplier/dashboard";
      else if (role === "admin") path = "/admin/dashboard";
      else if (role === "platform_admin") path = "/platform-admin/dashboard";
      else if (role === "company_admin") path = "/company-admin/dashboard";
      
      toast({
        title: "Role switched",
        description: `You are now viewing as ${roleConfig[role]?.label || role}`,
      });
      
      // Immediate page reload for clean state refresh
      window.location.href = path;
    },
    onError: (error: any) => {
      toast({
        title: "Failed to switch role",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!user || !availableRoles || availableRoles.length <= 1) {
    return null; // Don't show if user has only one role
  }

  const currentRole = user.role || 'ecp';
  const config = roleConfig[currentRole];
  const CurrentIcon = config?.icon || Users;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          data-testid="button-role-switcher"
          disabled={switchRoleMutation.isPending}
        >
          {switchRoleMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentIcon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {config?.label || currentRole}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role: string) => {
          const roleConf = roleConfig[role];
          if (!roleConf) return null;
          
          const RoleIcon = roleConf.icon;
          const isActive = role === user.role;

          return (
            <DropdownMenuItem
              key={role}
              onClick={() => !isActive && switchRoleMutation.mutate(role)}
              disabled={isActive || switchRoleMutation.isPending}
              className="gap-2 cursor-pointer"
              data-testid={`menu-item-switch-${role}`}
            >
              {switchRoleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RoleIcon className="h-4 w-4" />
              )}
              <span className="flex-1">{roleConf.label}</span>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
