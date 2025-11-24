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
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Ban, Shield, Trash2, UserPlus, Brain, TrendingUp, Zap, AlertTriangle, Lightbulb, ShieldCheck, ArrowRight, Database } from "lucide-react";
import { StatsCard, SkeletonStats } from "@/components/ui";

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

  const { data: systemHealth } = useQuery<{
    overall: 'healthy' | 'warning' | 'critical';
    database: { status: string; responseTime: number; connectionCount: number };
    redis: { status: string; responseTime: number; memoryUsage: number };
    api: { status: string; averageResponseTime: number; requestsPerMinute: number; errorRate: number };
    ai: { status: string; modelAvailability: number; averageProcessingTime: number; queueLength: number };
    storage: { status: string; totalSpace: number; usedSpace: number; availableSpace: number };
  }>({
    queryKey: ["/api/admin/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
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
      <div className="space-y-8 animate-fade-in">
        {/* Loading Header */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-8">
          <div className="h-24 animate-pulse bg-white/10 rounded-lg" />
        </div>
        <SkeletonStats />
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
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Admin Dashboard</h1>
              <p className="text-white/90 mt-1">
                Manage users, permissions, and platform access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={(stats?.total || 0).toString()}
          subtitle="Registered accounts"
          icon={Users}
          variant="default"
          trend={{
            value: 12.5,
            isPositive: true,
            label: "vs last month",
          }}
        />
        <StatsCard
          title="Pending Approval"
          value={(stats?.pending || 0).toString()}
          subtitle="Awaiting review"
          icon={Clock}
          variant="warning"
          trend={{
            value: stats?.pending || 0,
            isPositive: false,
            label: "needs attention",
          }}
        />
        <StatsCard
          title="Active Users"
          value={(stats?.active || 0).toString()}
          subtitle="Currently active"
          icon={UserCheck}
          variant="success"
          trend={{
            value: 8.3,
            isPositive: true,
            label: "activity rate",
          }}
        />
        <StatsCard
          title="Suspended"
          value={(stats?.suspended || 0).toString()}
          subtitle="Restricted access"
          icon={UserX}
          variant="default"
          trend={{
            value: stats?.suspended || 0,
            isPositive: stats?.suspended === 0,
            label: "suspended accounts",
          }}
        />
      </div>

      {/* System Health Monitoring */}
      {systemHealth && (
        <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 via-background to-background shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  System Health
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    systemHealth.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                    systemHealth.overall === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {systemHealth.overall.toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription className="mt-0.5">Real-time system status and performance metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Database</p>
                    <p className="text-xs text-gray-600">{systemHealth.database.responseTime}ms</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  systemHealth.database.status === 'connected' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.database.status}
                </span>
              </div>

              {/* Redis */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Redis Cache</p>
                    <p className="text-xs text-gray-600">{systemHealth.redis.responseTime}ms</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  systemHealth.redis.status === 'connected' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.redis.status}
                </span>
              </div>

              {/* API */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">API Service</p>
                    <p className="text-xs text-gray-600">{systemHealth.api.averageResponseTime}ms</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  systemHealth.api.status === 'operational' ? 'bg-green-100 text-green-800' :
                  systemHealth.api.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.api.status}
                </span>
              </div>

              {/* AI Service */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Service</p>
                    <p className="text-xs text-gray-600">{Math.round(systemHealth.ai.modelAvailability * 100)}% available</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  systemHealth.ai.status === 'operational' ? 'bg-green-100 text-green-800' :
                  systemHealth.ai.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {systemHealth.ai.status}
                </span>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">API Requests/min:</span>
                  <span className="font-medium">{systemHealth.api.requestsPerMinute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-medium">{systemHealth.api.errorRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Queue Length:</span>
                  <span className="font-medium">{systemHealth.ai.queueLength}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI System Statistics - Enhanced Modern Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">AI System Statistics</CardTitle>
              <CardDescription className="mt-0.5">Platform-wide AI Assistant usage and performance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
              <div className="text-3xl font-bold text-primary">{aiStats?.totalQueries || 0}</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Total Queries</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-50/50 border-2 border-green-200 hover:border-green-300 transition-all duration-200 hover:scale-105">
              <div className="text-3xl font-bold text-green-600">{aiStats?.activeUsers || 0}</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Active Users</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105">
              <div className="text-3xl font-bold text-blue-600">{aiStats?.cacheHitRate || 0}%</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Cache Hit Rate</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/50 border-2 border-orange-200 hover:border-orange-300 transition-all duration-200 hover:scale-105">
              <div className="text-3xl font-bold text-orange-600">{aiStats?.rateLimitHits || 0}</div>
              <div className="text-xs font-medium text-muted-foreground mt-2">Rate Limit Hits</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="h-auto py-3 hover:bg-primary/10 hover:border-primary/40 transition-all">
              <TrendingUp className="h-4 w-4 mr-2" />
              View AI Analytics
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 hover:bg-primary/10 hover:border-primary/40 transition-all">
              <Zap className="h-4 w-4 mr-2" />
              AI Settings
            </Button>
          </div>

          {/* Admin AI Quick Actions - Enhanced */}
          {adminQuickActions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-base">AI Suggested Actions</span>
              </div>
              <div className="grid gap-3">
                {adminQuickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAdminQuickAction(action.question)}
                    className="w-full text-left p-4 rounded-xl hover:bg-white/80 transition-all duration-200 border-2 border-border/50 hover:border-primary/50 hover:shadow-md group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold group-hover:text-primary transition-colors block">
                          {action.title}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 block">
                          Ask AI for insights
                        </span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table - Enhanced */}
      <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">All Users</CardTitle>
              <CardDescription className="mt-0.5">Manage user accounts, roles, and permissions</CardDescription>
            </div>
          </div>
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
              This will suspend {actionDialog.user && getUserName(actionDialog.user)}&apos;s account and prevent them from accessing the system.
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
              Are you sure you want to permanently delete {actionDialog.user && getUserName(actionDialog.user)}&apos;s account? 
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
