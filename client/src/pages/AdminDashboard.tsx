import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createOptimisticHandlers, optimisticArrayUpdate, optimisticRemove } from "@/lib/optimisticUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCardSkeleton } from "@/components/ui/CardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Ban, Shield, Trash2, UserPlus, Brain, TrendingUp, Zap, AlertTriangle, Lightbulb } from "lucide-react";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ecp" | "lab_tech" | "engineer" | "supplier" | "admin" | null;
  accountStatus: "pending" | "active" | "suspended";
  statusReason: string | null;
  organizationName: string | null;
  createdAt: string;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "suspend" | "activate" | "change-role" | "delete" | null;
    user: User | null;
  }>({type: null, user: null});
  const [suspensionReason, setSuspensionReason] = useState("");
  const [newRole, setNewRole] = useState<string>("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: stats } = useQuery<{
    total: number;
    pending: number;
    active: number;
    suspended: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: aiStats } = useQuery<{
    totalQueries: number;
    activeUsers: number;
    cacheHitRate: number;
    rateLimitHits: number;
  }>({
    queryKey: ["/api/admin/ai-stats"],
  });

  // AI Quick Actions for admin based on system state
  const getAdminAIQuickActions = () => {
    const actions = [];
    
    if (stats?.pending && stats.pending > 5) {
      actions.push({
        id: 'pending-users',
        title: `${stats.pending} pending approvals`,
        question: `I have ${stats.pending} users pending approval. What criteria should I use to evaluate them and how can I streamline the approval process?`,
        icon: AlertTriangle,
        color: 'text-orange-600'
      });
    }
    
    if (stats?.suspended && stats.suspended > 3) {
      actions.push({
        id: 'suspended-users',
        title: `${stats.suspended} suspended accounts`,
        question: `There are ${stats.suspended} suspended accounts. How should I review and manage suspended users?`,
        icon: Ban,
        color: 'text-red-600'
      });
    }
    
    if (aiStats?.rateLimitHits && aiStats.rateLimitHits > 10) {
      actions.push({
        id: 'rate-limits',
        title: 'High rate limit hits',
        question: `I'm seeing ${aiStats.rateLimitHits} rate limit hits. How can I optimize AI usage and adjust limits for better user experience?`,
        icon: Zap,
        color: 'text-yellow-600'
      });
    }
    
    if (aiStats?.cacheHitRate && aiStats.cacheHitRate < 50) {
      actions.push({
        id: 'cache-optimization',
        title: 'Low cache hit rate',
        question: `The AI cache hit rate is ${aiStats.cacheHitRate}%. How can I improve caching to reduce costs and improve performance?`,
        icon: TrendingUp,
        color: 'text-blue-600'
      });
    }
    
    // Default admin actions
    if (actions.length === 0) {
      actions.push(
        {
          id: 'user-management',
          title: 'User management tips',
          question: 'What are best practices for managing users, roles, and permissions at scale?',
          icon: Shield,
          color: 'text-primary'
        },
        {
          id: 'platform-optimization',
          title: 'Platform optimization',
          question: 'How can I optimize the platform for better performance and user satisfaction?',
          icon: Lightbulb,
          color: 'text-purple-600'
        }
      );
    }
    
    return actions.slice(0, 3);
  };

  const adminQuickActions = getAdminAIQuickActions();

  const handleAdminQuickAction = (question: string) => {
    window.location.href = `/admin/ai-assistant?q=${encodeURIComponent(question)}`;
  };

  const updateUserMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${data.userId}`, data.updates);
      return await response.json();
    },
    ...createOptimisticHandlers<User[], { userId: string; updates: any }>({
      queryKey: ["/api/admin/users"],
      updater: (oldData, variables) => {
        return optimisticArrayUpdate(oldData, variables.userId, (user) => ({
          ...user,
          ...variables.updates,
        })) || [];
      },
      successMessage: "User updated successfully",
      errorMessage: "Failed to update user",
    }),
    onSuccess: () => {
      setActionDialog({ type: null, user: null });
      setSuspensionReason("");
      setNewRole("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    ...createOptimisticHandlers<User[], string>({
      queryKey: ["/api/admin/users"],
      updater: (oldData, userId) => {
        return optimisticRemove(oldData, userId) || [];
      },
      successMessage: "User deleted successfully",
      errorMessage: "Failed to delete user",
    }),
    onSuccess: () => {
      setActionDialog({ type: null, user: null });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const handleApprove = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      updates: { accountStatus: "active" },
    });
  };

  const handleSuspend = () => {
    if (!actionDialog.user) return;
    updateUserMutation.mutate({
      userId: actionDialog.user.id,
      updates: {
        accountStatus: "suspended",
        statusReason: suspensionReason || "Suspended by administrator",
      },
    });
  };

  const handleActivate = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      updates: { accountStatus: "active", statusReason: null },
    });
  };

  const handleChangeRole = () => {
    if (!actionDialog.user || !newRole) return;
    updateUserMutation.mutate({
      userId: actionDialog.user.id,
      updates: { role: newRole },
    });
  };

  const handleDelete = () => {
    if (!actionDialog.user) return;
    deleteUserMutation.mutate(actionDialog.user.id);
  };

  const getUserName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "Unknown User";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">No Role</Badge>;
    
    const roleLabels: Record<string, string> = {
      ecp: "ECP",
      lab_tech: "Lab Tech",
      engineer: "Engineer",
      supplier: "Supplier",
      admin: "Admin",
    };
    
    return <Badge variant="outline">{roleLabels[role] || role}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and platform access</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} columns={7} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and platform access</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pending-users">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-users">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-suspended-users">{stats?.suspended || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI System Statistics */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI System Statistics</CardTitle>
          </div>
          <CardDescription>Platform-wide AI Assistant usage and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-primary">{aiStats?.totalQueries || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Queries</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-green-600">{aiStats?.activeUsers || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Users</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-blue-600">{aiStats?.cacheHitRate || 0}%</div>
              <div className="text-xs text-muted-foreground mt-1">Cache Hit Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background border">
              <div className="text-2xl font-bold text-orange-600">{aiStats?.rateLimitHits || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Rate Limit Hits</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              View AI Analytics
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Zap className="h-4 w-4 mr-2" />
              AI Settings
            </Button>
          </div>

          {/* Admin AI Quick Actions */}
          {adminQuickActions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Suggested Actions</span>
              </div>
              <div className="space-y-2">
                {adminQuickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAdminQuickAction(action.question)}
                    className="w-full text-left p-2 rounded-lg hover:bg-background/80 transition-colors border border-border/50 hover:border-primary/50 group"
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className={`h-4 w-4 ${action.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-xs sm:text-sm font-medium group-hover:text-primary transition-colors">
                        {action.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No users found"
              description="Users will appear here once they register for the platform."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">{getUserName(user)}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organizationName || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {user.accountStatus === "pending" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(user)}
                              data-testid={`button-approve-${user.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          
                          {user.accountStatus === "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setActionDialog({ type: "suspend", user })}
                              data-testid={`button-suspend-${user.id}`}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          
                          {user.accountStatus === "suspended" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleActivate(user)}
                                data-testid={`button-activate-${user.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setActionDialog({ type: "delete", user })}
                                data-testid={`button-delete-${user.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                          
                          {user.role && user.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setNewRole(user.role || "");
                                setActionDialog({ type: "change-role", user });
                              }}
                              data-testid={`button-change-role-${user.id}`}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Change Role
                            </Button>
                          )}
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

      {/* Suspension Dialog */}
      <Dialog open={actionDialog.type === "suspend"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent data-testid="dialog-suspend-user">
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              This will suspend {actionDialog.user && getUserName(actionDialog.user)}'s account and prevent them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Reason for Suspension</Label>
              <Textarea
                id="suspension-reason"
                placeholder="Enter reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                data-testid="input-suspension-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, user: null })}
              data-testid="button-cancel-suspend"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={updateUserMutation.isPending}
              data-testid="button-confirm-suspend"
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={actionDialog.type === "change-role"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent data-testid="dialog-change-role">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {actionDialog.user && getUserName(actionDialog.user)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role" data-testid="select-new-role">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecp">Eye Care Professional</SelectItem>
                  <SelectItem value="lab_tech">Lab Technician</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, user: null })}
              data-testid="button-cancel-role-change"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={updateUserMutation.isPending || !newRole}
              data-testid="button-confirm-role-change"
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={actionDialog.type === "delete"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent data-testid="dialog-delete-user">
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {actionDialog.user && getUserName(actionDialog.user)}'s account? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Warning: This is a permanent action and cannot be reversed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, user: null })}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
