/**
 * Role Management Page
 * 
 * Admin UI for managing dynamic RBAC (Role-Based Access Control):
 * - Create custom roles with specific permissions
 * - Assign permissions to roles
 * - Assign roles to users
 * - View role change audit log
 * 
 * This connects to the dynamic RBAC system we built earlier:
 * - Database: migrations/001_dynamic_rbac_schema.sql
 * - Backend: /api/roles/* endpoints
 * - Schema: shared/schema.ts (dynamicRoles, dynamicRolePermissions, etc.)
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Plus, 
  Edit, 
  Users, 
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface DynamicRole {
  id: string;
  companyId: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface UserRole {
  userId: string;
  roleId: string;
  isPrimary: boolean;
  assignedBy: string;
  assignedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface AuditLog {
  id: string;
  roleId: string;
  userId: string;
  actionType: string;
  performedBy: string;
  previousValue: any;
  newValue: any;
  timestamp: Date;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  planLevel: string;
}

interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  permissions: Permission[];
}

interface AllPermissionsResponse {
  categories: PermissionCategory[];
}

export default function RoleManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<DynamicRole | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<DynamicRole[]>({
    queryKey: ["/api/roles"],
  });

  // Fetch all available permissions
  const { data: allPermissionsData } = useQuery<AllPermissionsResponse>({
    queryKey: ["/api/roles/permissions/all"],
  });

  // Fetch permissions for a specific role
  const { data: rolePermissions } = useQuery<RolePermission[]>({
    queryKey: ["/api/roles", editingRole?.id, "permissions"],
    enabled: !!editingRole,
  });

  // Fetch users assigned to a role
  const { data: roleUsers } = useQuery<UserRole[]>({
    queryKey: ["/api/roles", editingRole?.id, "users"],
    enabled: !!editingRole,
  });

  // Fetch audit log
  const { data: auditLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/roles/audit"],
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: { roleName: string; description: string }) => {
      const response = await apiRequest("POST", "/api/roles", {
        name: data.roleName,
        description: data.description
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      toast({
        title: "Role Created",
        description: "New role has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    },
  });

  // Update role permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const response = await apiRequest("PUT", `/api/roles/${roleId}`, { permissionIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "Permissions Updated",
        description: "Role permissions have been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  // Assign user to role mutation
  const assignUserMutation = useMutation({
    mutationFn: async ({ roleId, userId }: { roleId: string; userId: string }) => {
      const response = await apiRequest("POST", `/api/roles/users/${userId}/assign`, {
        roleIds: [roleId],
        setPrimaryRoleId: roleId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({
        title: "User Assigned",
        description: "User has been assigned to role",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      roleName: newRoleName,
      description: newRoleDescription,
    });
  };

  const handleSavePermissions = () => {
    if (!editingRole) return;

    updatePermissionsMutation.mutate({
      roleId: editingRole.id,
      permissionIds: Array.from(selectedPermissions),
    });
  };

  const togglePermission = (permissionKey: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionKey)) {
      newSet.delete(permissionKey);
    } else {
      newSet.add(permissionKey);
    }
    setSelectedPermissions(newSet);
  };

  // Load permissions when editing a role
  useEffect(() => {
    if (editingRole && rolePermissions) {
      const permIds = new Set(rolePermissions.map((p: any) => p.id));
      setSelectedPermissions(permIds);
    } else {
      setSelectedPermissions(new Set());
    }
  }, [editingRole, rolePermissions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage roles, permissions, and user assignments
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a custom role with specific permissions for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Senior Optician"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Describe this role's responsibilities..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Roles</CardTitle>
              <CardDescription>
                Custom roles defined for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading roles...</p>
              ) : !roles || roles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No custom roles yet. Create your first role to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.roleName}</TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={role.isActive ? "default" : "secondary"}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(role.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRole(role)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Role Editor Dialog */}
          {editingRole && (
            <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Manage Role: {editingRole.roleName}
                  </DialogTitle>
                  <DialogDescription>
                    Configure permissions and user assignments for this role
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="permissions" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="users">
                      Users ({roleUsers?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="permissions" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                      {allPermissionsData?.categories?.flatMap((category: any) => 
                        category.permissions.map((perm: any) => {
                          const key = perm.id;
                          return (
                            <div key={key} className="flex items-start space-x-2">
                              <Checkbox
                                id={key}
                                checked={selectedPermissions.has(key)}
                                onCheckedChange={() => togglePermission(key)}
                              />
                              <Label htmlFor={key} className="cursor-pointer">
                                <span className="font-medium">{perm.key}</span>
                                <p className="text-sm text-muted-foreground">{perm.description}</p>
                              </Label>
                            </div>
                          );
                        })
                      ) || (
                        <p className="text-center text-muted-foreground col-span-2">
                          Loading permissions...
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSavePermissions}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Permissions
                      </Button>
                    </DialogFooter>
                  </TabsContent>

                  <TabsContent value="users">
                    {!roleUsers || roleUsers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No users assigned to this role yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Primary Role</TableHead>
                            <TableHead>Assigned</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleUsers.map((ur) => (
                            <TableRow key={ur.userId}>
                              <TableCell>
                                {ur.user.firstName} {ur.user.lastName}
                              </TableCell>
                              <TableCell>{ur.user.email}</TableCell>
                              <TableCell>
                                <Badge variant={ur.isPrimary ? "default" : "outline"}>
                                  {ur.isPrimary ? "Primary" : "Secondary"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(ur.assignedAt), "MMM d, yyyy")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Change Audit Log</CardTitle>
              <CardDescription>
                Complete history of role modifications and user assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!auditLogs || auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No audit records yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.actionType}</Badge>
                        </TableCell>
                        <TableCell>{log.roleId}</TableCell>
                        <TableCell>{log.performedBy}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.newValue ? JSON.stringify(log.newValue) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
