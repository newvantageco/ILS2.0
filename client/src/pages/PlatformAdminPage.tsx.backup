import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Users, 
  Building2, 
  Key, 
  Trash2, 
  Edit, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  accountStatus: string;
  companyId: string | null;
  createdAt: Date;
}

interface Company {
  id: string;
  name: string;
  type: string;
  status: string;
  email: string;
  subscriptionPlan: string;
  createdAt: Date;
}

export default function PlatformAdminPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editFormData, setEditFormData] = useState({
    role: "",
    accountStatus: "",
  });

  // Fetch all users
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/platform-admin/users"],
  });

  // Fetch all companies
  const { data: companies, isLoading: loadingCompanies } = useQuery<Company[]>({
    queryKey: ["/api/platform-admin/companies"],
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await fetch(`/api/platform-admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "User password has been reset successfully.",
      });
      setIsResetPasswordOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/platform-admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been permanently deleted.",
      });
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await fetch(`/api/platform-admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-admin/users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setIsEditUserOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      accountStatus: user.accountStatus,
    });
    setIsEditUserOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      suspended: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Platform Administration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all users, companies, and system-wide settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="companies" className="gap-2">
            <Building2 className="h-4 w-4" />
            Companies
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    Manage user accounts, reset passwords, and modify permissions
                  </CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading users...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                          <TableCell>
                            {user.companyId ? (
                              <span className="text-sm">{user.companyId.substring(0, 8)}...</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetPassword(user)}
                              >
                                <Key className="h-3 w-3 mr-1" />
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
              <CardDescription>
                View and manage company registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading companies...
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies?.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-sm text-muted-foreground">{company.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{company.type}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(company.status)}</TableCell>
                          <TableCell>
                            <Badge>{company.subscriptionPlan}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user role and account status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <div className="text-sm">
                <div className="font-medium">{selectedUser?.name}</div>
                <div className="text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecp">ECP</SelectItem>
                  <SelectItem value="lab_tech">Lab Technician</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <Select
                value={editFormData.accountStatus}
                onValueChange={(value) => setEditFormData({ ...editFormData, accountStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  updateUserMutation.mutate({
                    userId: selectedUser.id,
                    updates: editFormData,
                  });
                }
              }}
              disabled={updateUserMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Password should be at least 8 characters long
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsResetPasswordOpen(false);
              setNewPassword("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && newPassword.length >= 8) {
                  resetPasswordMutation.mutate({
                    userId: selectedUser.id,
                    password: newPassword,
                  });
                } else {
                  toast({
                    title: "Invalid Password",
                    description: "Password must be at least 8 characters long",
                    variant: "destructive",
                  });
                }
              }}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this user?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
              <div className="flex items-start gap-3">
                <UserX className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">This action cannot be undone</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    User: <strong>{selectedUser?.name}</strong> ({selectedUser?.email})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All associated data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
                }
              }}
              disabled={deleteUserMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
