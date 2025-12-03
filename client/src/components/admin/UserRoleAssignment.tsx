/**
 * User Role Assignment Component
 *
 * Allows admins to assign MULTIPLE roles to a user
 * Supports setting a primary role and multiple secondary roles
 *
 * Key Features:
 * - Multi-select role assignment
 * - Primary role designation
 * - Real-time permission preview
 * - Audit logging
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Role {
  id: string;
  name: string;
  description: string;
  is_system_default: boolean;
  is_deletable: boolean;
  user_count: number;
  permission_count: number;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  is_primary: boolean;
  assigned_at: string;
}

interface Permission {
  key: string;
  name: string;
  description: string;
}

interface UserRoleAssignmentProps {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserRoleAssignment({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: UserRoleAssignmentProps) {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [primaryRoleId, setPrimaryRoleId] = useState<string>("");
  const { toast } = useToast();

  // Fetch all available roles for the company
  const { data: allRoles = { roles: [] }, isLoading: rolesLoading } = useQuery<{ roles: Role[] }>({
    queryKey: ["/api/roles"],
    enabled: open,
  });

  // Fetch current roles for this user
  const { data: userRoles = { roles: [] }, isLoading: userRolesLoading } = useQuery<{ roles: UserRole[] }>({
    queryKey: [`/api/roles/users/${userId}`],
    enabled: open && !!userId,
  });

  // Fetch permissions for selected roles
  const { data: previewPermissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/roles/permissions/preview", Array.from(selectedRoles)],
    enabled: selectedRoles.size > 0,
    queryFn: async () => {
      // Get unique permissions from all selected roles
      const allPerms = new Set<string>();
      const promises = Array.from(selectedRoles).map(async (roleId) => {
        const res = await fetch(`/api/roles/${roleId}`, { credentials: "include" });
        const data = await res.json();
        data.permissions?.forEach((p: Permission) => allPerms.add(JSON.stringify(p)));
      });
      await Promise.all(promises);
      return Array.from(allPerms).map(p => JSON.parse(p));
    },
  });

  // Initialize selected roles when user roles load
  useEffect(() => {
    if (userRoles.roles && userRoles.roles.length > 0) {
      const roleIds = new Set(userRoles.roles.map(r => r.id));
      setSelectedRoles(roleIds);

      const primary = userRoles.roles.find(r => r.is_primary);
      if (primary) {
        setPrimaryRoleId(primary.id);
      }
    }
  }, [userRoles]);

  // Assign roles mutation
  const assignRolesMutation = useMutation({
    mutationFn: async () => {
      if (selectedRoles.size === 0) {
        throw new Error("At least one role must be selected");
      }

      const response = await apiRequest("POST", `/api/roles/users/${userId}/assign`, {
        roleIds: Array.from(selectedRoles),
        setPrimaryRoleId: primaryRoleId || Array.from(selectedRoles)[0],
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roles/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });

      toast({
        title: "Roles Assigned",
        description: `Successfully assigned ${selectedRoles.size} role(s) to ${userName}`,
      });

      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign roles",
        variant: "destructive",
      });
    },
  });

  const toggleRole = (roleId: string) => {
    const newSet = new Set(selectedRoles);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
      // If removing the primary role, clear primary selection
      if (roleId === primaryRoleId) {
        setPrimaryRoleId("");
      }
    } else {
      newSet.add(roleId);
      // If this is the first role selected, make it primary
      if (newSet.size === 1) {
        setPrimaryRoleId(roleId);
      }
    }
    setSelectedRoles(newSet);
  };

  const handleSave = () => {
    // Validate that a primary role is set
    if (selectedRoles.size > 0 && !primaryRoleId) {
      toast({
        title: "Primary Role Required",
        description: "Please select a primary role",
        variant: "destructive",
      });
      return;
    }

    // Validate that primary role is in selected roles
    if (primaryRoleId && !selectedRoles.has(primaryRoleId)) {
      toast({
        title: "Invalid Primary Role",
        description: "Primary role must be one of the selected roles",
        variant: "destructive",
      });
      return;
    }

    assignRolesMutation.mutate();
  };

  const selectedRolesArray = Array.from(selectedRoles);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Roles to User
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{userName}</span>
              <span className="text-muted-foreground">({userEmail})</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Role Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Select Roles ({selectedRoles.size} selected)
              </Label>
              {selectedRoles.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRoles(new Set())}
                >
                  Clear All
                </Button>
              )}
            </div>

            {rolesLoading || userRolesLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading roles...</p>
            ) : (
              <ScrollArea className="h-64 rounded-md border p-4">
                <div className="space-y-3">
                  {allRoles.roles.map((role) => {
                    const isSelected = selectedRoles.has(role.id);
                    return (
                      <div
                        key={role.id}
                        className={`
                          flex items-start space-x-3 p-3 rounded-lg border transition-colors
                          ${isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}
                        `}
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleRole(role.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`role-${role.id}`}
                            className="cursor-pointer font-medium"
                          >
                            {role.name}
                            {role.is_system_default && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                System
                              </Badge>
                            )}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {role.description || "No description"}
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{role.permission_count} permissions</span>
                            <span>"</span>
                            <span>{role.user_count} users</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Primary Role Selection */}
          {selectedRoles.size > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Primary Role
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Default role shown in UI)
                  </span>
                </Label>
                <Select value={primaryRoleId} onValueChange={setPrimaryRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRolesArray.map((roleId) => {
                      const role = allRoles.roles.find(r => r.id === roleId);
                      return (
                        <SelectItem key={roleId} value={roleId}>
                          {role?.name || roleId}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Permission Preview */}
          {selectedRoles.size > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Combined Permissions ({previewPermissions.length})
                </Label>
                <ScrollArea className="h-48 rounded-md border p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {previewPermissions.map((perm) => (
                      <div key={perm.key} className="flex items-center gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="font-mono text-xs">{perm.key}</span>
                      </div>
                    ))}
                  </div>
                  {previewPermissions.length === 0 && (
                    <p className="text-center text-muted-foreground">
                      No permissions assigned to selected roles
                    </p>
                  )}
                </ScrollArea>
              </div>
            </>
          )}

          {/* Warning for no roles selected */}
          {selectedRoles.size === 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                At least one role must be selected
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignRolesMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedRoles.size === 0 || assignRolesMutation.isPending}
          >
            {assignRolesMutation.isPending ? (
              <>Assigning...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Assign Roles
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
