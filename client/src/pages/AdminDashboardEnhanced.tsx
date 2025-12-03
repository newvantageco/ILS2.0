import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { NumberCounter, StaggeredList, StaggeredItem } from "@/components/ui/AnimatedComponents";
import { pageVariants } from "@/lib/animations";

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

export default function AdminDashboardEnhanced() {
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
    <motion.div
      className="space-y-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
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

      {/* Enhanced Statistics Cards with Animations */}
      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberCounter to={stats?.total || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered accounts
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300 border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                <NumberCounter to={stats?.pending || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300 border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                <NumberCounter to={stats?.active || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently active
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberCounter to={stats?.suspended || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Restricted access
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>
      </StaggeredList>

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
            <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database */}
              <StaggeredItem>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Database</p>
                      <p className="text-xs text-gray-600">
                        <NumberCounter to={systemHealth.database.responseTime} duration={1} />ms
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    systemHealth.database.status === 'connected' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {systemHealth.database.status}
                  </span>
                </div>
              </StaggeredItem>

              {/* Redis */}
              <StaggeredItem>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Redis Cache</p>
                      <p className="text-xs text-gray-600">
                        <NumberCounter to={systemHealth.redis.responseTime} duration={1} />ms
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    systemHealth.redis.status === 'connected' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {systemHealth.redis.status}
                  </span>
                </div>
              </StaggeredItem>

              {/* API */}
              <StaggeredItem>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">API Service</p>
                      <p className="text-xs text-gray-600">
                        <NumberCounter to={systemHealth.api.averageResponseTime} duration={1} />ms
                      </p>
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
              </StaggeredItem>

              {/* AI Service */}
              <StaggeredItem>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">AI Service</p>
                      <p className="text-xs text-gray-600">
                        <NumberCounter to={Math.round(systemHealth.ai.modelAvailability * 100)} duration={1} />% available
                      </p>
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
              </StaggeredItem>
            </StaggeredList>

            {/* Additional Metrics */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">API Requests/min:</span>
                  <span className="font-medium">
                    <NumberCounter to={systemHealth.api.requestsPerMinute} duration={1} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-medium">
                    <NumberCounter to={systemHealth.api.errorRate} duration={1} decimals={1} />%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Queue Length:</span>
                  <span className="font-medium">
                    <NumberCounter to={systemHealth.ai.queueLength} duration={1} />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI System Statistics - Enhanced Modern Card with Animations */}
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
          <StaggeredList className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StaggeredItem>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-all duration-200 hover:scale-105">
                <div className="text-3xl font-bold text-primary">
                  <NumberCounter to={aiStats?.totalQueries || 0} duration={1.5} />
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-2">Total Queries</div>
              </div>
            </StaggeredItem>
            <StaggeredItem>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-50/50 border-2 border-green-200 hover:border-green-300 transition-all duration-200 hover:scale-105">
                <div className="text-3xl font-bold text-green-600">
                  <NumberCounter to={aiStats?.activeUsers || 0} duration={1.5} />
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-2">Active Users</div>
              </div>
            </StaggeredItem>
            <StaggeredItem>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105">
                <div className="text-3xl font-bold text-blue-600">
                  <NumberCounter to={aiStats?.cacheHitRate || 0} duration={1.5} />%
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-2">Cache Hit Rate</div>
              </div>
            </StaggeredItem>
            <StaggeredItem>
              <div className="text-center p-5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/50 border-2 border-orange-200 hover:border-orange-300 transition-all duration-200 hover:scale-105">
                <div className="text-3xl font-bold text-orange-600">
                  <NumberCounter to={aiStats?.rateLimitHits || 0} duration={1.5} />
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-2">Rate Limit Hits</div>
              </div>
            </StaggeredItem>
          </StaggeredList>

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
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="There are no users in the system yet."
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{getUserName(user)}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organizationName || "N/A"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.accountStatus === "pending" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(user)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {user.accountStatus === "suspended" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleActivate(user)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          {user.accountStatus === "active" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setActionDialog({ type: "suspend", user })}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActionDialog({ type: "change-role", user })}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Change Role
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActionDialog({ type: "delete", user })}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Action Dialogs */}
      <Dialog open={actionDialog.type === "suspend"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this user's account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === "change-role"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecp">ECP</SelectItem>
                  <SelectItem value="lab_tech">Lab Tech</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialog.type === "delete"} onOpenChange={(open) => !open && setActionDialog({ type: null, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
