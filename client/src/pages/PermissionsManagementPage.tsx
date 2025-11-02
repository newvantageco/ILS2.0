import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Shield, Users, Lock, Unlock, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface PermissionsByCategory {
  [category: string]: Permission[];
}

interface UserPermission {
  userId: string;
  userName: string;
  email: string;
  role: string;
  permissions: string[];
}

const ROLES = [
  { value: "ecp", label: "Eye Care Professional" },
  { value: "lab_tech", label: "Lab Technician" },
  { value: "engineer", label: "Engineer" },
  { value: "supplier", label: "Supplier" },
  { value: "admin", label: "Admin" },
  { value: "company_admin", label: "Company Admin" },
  { value: "platform_admin", label: "Platform Admin" },
];

export default function PermissionsManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());

  // Fetch all available permissions
  const { data: allPermissions, isLoading: loadingPermissions } = useQuery<PermissionsByCategory>({
    queryKey: ["/api/permissions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/permissions");
      const data = await response.json();
      return data.data || {};
    },
  });

  // Fetch current user's company users
  const { data: companyUsers, isLoading: loadingUsers } = useQuery<UserPermission[]>({
    queryKey: ["/api/users/company"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/company/${user?.companyId}`);
      const data = await response.json();
      return data || [];
    },
    enabled: !!user?.companyId,
  });

  // Grant permission mutation
  const grantPermission = useMutation({
    mutationFn: async ({ userId, permissionKey }: { userId: string; permissionKey: string }) => {
      const response = await apiRequest("POST", "/api/permissions/grant", {
        userId,
        permissionKey,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/company"] });
      toast({
        title: "Permission Granted",
        description: "The permission has been granted successfully.",
      });
      setIsGrantDialogOpen(false);
      setSelectedUser(null);
      setSelectedPermission("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant permission",
        variant: "destructive",
      });
    },
  });

  // Revoke permission mutation
  const revokePermission = useMutation({
    mutationFn: async ({ userId, permissionKey }: { userId: string; permissionKey: string }) => {
      const response = await apiRequest("POST", "/api/permissions/revoke", {
        userId,
        permissionKey,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/company"] });
      toast({
        title: "Permission Revoked",
        description: "The permission has been revoked successfully.",
      });
      setIsRevokeDialogOpen(false);
      setSelectedUser(null);
      setSelectedPermission("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke permission",
        variant: "destructive",
      });
    },
  });

  // Update role permissions mutation
  const updateRolePermissions = useMutation({
    mutationFn: async ({ role, permissionKeys }: { role: string; permissionKeys: string[] }) => {
      const response = await apiRequest("PUT", `/api/permissions/role/${user?.companyId}`, {
        role,
        permissionKeys,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/company"] });
      toast({
        title: "Role Permissions Updated",
        description: "The role permissions have been updated successfully.",
      });
      setEditingRole(null);
      setRolePermissions(new Set());
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role permissions",
        variant: "destructive",
      });
    },
  });

  const handleGrantPermission = () => {
    if (selectedUser && selectedPermission) {
      grantPermission.mutate({ userId: selectedUser, permissionKey: selectedPermission });
    }
  };

  const handleRevokePermission = () => {
    if (selectedUser && selectedPermission) {
      revokePermission.mutate({ userId: selectedUser, permissionKey: selectedPermission });
    }
  };

  const handleSaveRolePermissions = () => {
    if (editingRole) {
      updateRolePermissions.mutate({
        role: editingRole,
        permissionKeys: Array.from(rolePermissions),
      });
    }
  };

  const togglePermissionForRole = (permissionKey: string) => {
    setRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionKey)) {
        newSet.delete(permissionKey);
      } else {
        newSet.add(permissionKey);
      }
      return newSet;
    });
  };

  const filteredUsers = companyUsers?.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const flatPermissions = Object.entries(allPermissions || {}).flatMap(([category, perms]) =>
    perms.map((p) => ({ ...p, category }))
  );

  if (loadingPermissions || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground">
            Manage user permissions and role-based access control
          </p>
        </div>
        <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Permission</DialogTitle>
              <DialogDescription>
                Grant a custom permission to a user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyUsers?.map((user) => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.userName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Permission</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatPermissions.map((perm) => (
                      <SelectItem key={perm.key} value={perm.key}>
                        {perm.name} - {perm.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGrantPermission} disabled={!selectedUser || !selectedPermission}>
                <Lock className="h-4 w-4 mr-2" />
                Grant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Permissions Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            Configure default permissions for each role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={editingRole || ""} onValueChange={(value) => {
              setEditingRole(value);
              // Load current permissions for this role
              // In a real implementation, fetch from backend
              setRolePermissions(new Set());
            }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select role to edit" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editingRole && (
              <Button onClick={handleSaveRolePermissions}>
                <Save className="h-4 w-4 mr-2" />
                Save Role Permissions
              </Button>
            )}
          </div>

          {editingRole && allPermissions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Object.entries(allPermissions).map(([category, permissions]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {permissions.map((perm) => (
                      <div key={perm.key} className="flex items-start space-x-2">
                        <Checkbox
                          id={perm.key}
                          checked={rolePermissions.has(perm.key)}
                          onCheckedChange={() => togglePermissionForRole(perm.key)}
                        />
                        <Label
                          htmlFor={perm.key}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {perm.name}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Permissions
          </CardTitle>
          <CardDescription>View and manage individual user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm.split(".").pop()}
                        </Badge>
                      ))}
                      {user.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isGrantDialogOpen && selectedUser === user.userId} onOpenChange={(open) => {
                        setIsGrantDialogOpen(open);
                        if (open) setSelectedUser(user.userId);
                        else setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Lock className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      <Dialog open={isRevokeDialogOpen && selectedUser === user.userId} onOpenChange={(open) => {
                        setIsRevokeDialogOpen(open);
                        if (open) setSelectedUser(user.userId);
                        else setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Unlock className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke Permission</DialogTitle>
                            <DialogDescription>
                              Revoke a permission from {user.userName}
                            </DialogDescription>
                          </DialogHeader>
                          <div>
                            <Label>Permission</Label>
                            <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select permission to revoke" />
                              </SelectTrigger>
                              <SelectContent>
                                {user.permissions.map((perm) => (
                                  <SelectItem key={perm} value={perm}>
                                    {perm}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleRevokePermission}
                              disabled={!selectedPermission}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
