/**
 * Patient Engagement Dashboard
 *
 * Analytics and insights hub for all patient communication and engagement activities.
 * Provides unified view of recalls, waitlist, campaigns, and communication performance
 * to enable data-driven decision making for patient outreach strategies.
 *
 * SECURITY: Requires admin, company_admin, manager, or ecp roles
 */

import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Clock,
  UserCheck,
  Shield,
  BarChart3,
  Activity,
  Target,
  Eye,
} from "lucide-react";

export default function PatientEngagementDashboard() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState("30");

  const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'ecp'];
  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role);

  // Fetch recall statistics - moved before conditional returns
  const { data: recallStats } = useQuery({
    queryKey: ['/api/recalls/stats'],
    queryFn: async () => {
      const res = await fetch('/api/recalls/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch recall stats');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch waitlist data
  const { data: waitlistData } = useQuery({
    queryKey: ['/api/appointments/waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/appointments/waitlist', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch waitlist');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['/api/communications/campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/communications/campaigns', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch message statistics
  const { data: messageStats } = useQuery({
    queryKey: ['/api/communications/messages/stats', timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const res = await fetch(`/api/communications/messages/stats?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch message stats');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Fetch handoff queue
  const { data: handoffData } = useQuery({
    queryKey: ['/api/examinations/recent'],
    queryFn: async () => {
      const res = await fetch('/api/examinations/recent?hours=24&status=completed', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch handoff data');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Calculate key metrics
  const metrics = {
    recalls: {
      totalDue: recallStats?.stats?.patientsDueForRecall || 0,
      totalPatients: recallStats?.stats?.totalPatients || 0,
      recallRate: recallStats?.stats?.totalPatients > 0
        ? ((recallStats.stats.patientsDueForRecall / recallStats.stats.totalPatients) * 100).toFixed(1)
        : '0.0',
    },
    waitlist: {
      active: waitlistData?.entries?.filter((e: any) => e.status === 'active').length || 0,
      total: waitlistData?.entries?.length || 0,
    },
    campaigns: {
      total: campaignsData?.campaigns?.length || 0,
      running: campaignsData?.campaigns?.filter((c: any) => c.status === 'running').length || 0,
      completed: campaignsData?.campaigns?.filter((c: any) => c.status === 'completed').length || 0,
      totalSent: campaignsData?.campaigns?.reduce((sum: number, c: any) => sum + (c.sentCount || 0), 0) || 0,
    },
    messages: {
      total: messageStats?.stats?.totalSent || 0,
      delivered: messageStats?.stats?.delivered || 0,
      failed: messageStats?.stats?.failed || 0,
      deliveryRate: messageStats?.stats?.totalSent > 0
        ? ((messageStats.stats.delivered / messageStats.stats.totalSent) * 100).toFixed(1)
        : '0.0',
      byChannel: {
        email: messageStats?.stats?.byChannel?.email || 0,
        sms: messageStats?.stats?.byChannel?.sms || 0,
        whatsapp: messageStats?.stats?.byChannel?.whatsapp || 0,
      },
    },
    handoff: {
      pending: handoffData?.count || 0,
    },
  };

  const getTrendIndicator = (value: number, threshold: number = 0) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value < threshold) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  // Role-based access control - placed after all hooks
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Shield className="h-6 w-6" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-red-700">
              You do not have permission to view engagement analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-red-800">
              <p>
                <strong>Required roles:</strong> Admin, Company Admin, Manager, or ECP
              </p>
              <p>
                <strong>Your role:</strong> {user.role}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Patient Engagement Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified analytics across recalls, waitlist, campaigns, and communications
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Due for Recall</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recalls.totalDue}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.recalls.recallRate}% of total patient base
            </p>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIndicator(parseFloat(metrics.recalls.recallRate), 15)}
              <span className="text-xs text-muted-foreground">
                {metrics.recalls.totalPatients} total patients
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Waitlist</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.waitlist.active}</div>
            <p className="text-xs text-muted-foreground">
              Patients seeking earlier appointments
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                High conversion opportunity
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.campaigns.running}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.campaigns.total} total campaigns
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">
                {metrics.campaigns.totalSent.toLocaleString()} messages sent
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messages.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.messages.delivered.toLocaleString()} / {metrics.messages.total.toLocaleString()} delivered
            </p>
            <div className="flex items-center gap-1 mt-2">
              {getTrendIndicator(parseFloat(metrics.messages.deliveryRate), 95)}
              <span className="text-xs text-muted-foreground">
                {metrics.messages.failed} failed
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Channels Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Communication Channels</CardTitle>
            <CardDescription>
              Message distribution by channel (last {timeRange} days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{metrics.messages.byChannel.email}</span>
                  <Badge variant="outline">
                    {metrics.messages.total > 0
                      ? `${((metrics.messages.byChannel.email / metrics.messages.total) * 100).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{metrics.messages.byChannel.sms}</span>
                  <Badge variant="outline">
                    {metrics.messages.total > 0
                      ? `${((metrics.messages.byChannel.sms / metrics.messages.total) * 100).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{metrics.messages.byChannel.whatsapp}</span>
                  <Badge variant="outline">
                    {metrics.messages.total > 0
                      ? `${((metrics.messages.byChannel.whatsapp / metrics.messages.total) * 100).toFixed(0)}%`
                      : '0%'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
            <CardDescription>
              Patient flow through engagement touchpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Recall Pipeline</div>
                    <div className="text-xs text-muted-foreground">Annual exam outreach</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{metrics.recalls.totalDue}</div>
                  <div className="text-xs text-muted-foreground">patients</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Waitlist Queue</div>
                    <div className="text-xs text-muted-foreground">Appointment requests</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{metrics.waitlist.active}</div>
                  <div className="text-xs text-muted-foreground">active</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium">Dispenser Handoff</div>
                    <div className="text-xs text-muted-foreground">Clinical to retail</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{metrics.handoff.pending}</div>
                  <div className="text-xs text-muted-foreground">pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Overview of bulk communication campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Total Campaigns</div>
              <div className="text-3xl font-bold mt-2">{metrics.campaigns.total}</div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-sm font-medium text-green-700">Running</div>
              <div className="text-3xl font-bold mt-2 text-green-600">{metrics.campaigns.running}</div>
            </div>

            <div className="p-4 border rounded-lg bg-purple-50">
              <div className="text-sm font-medium text-purple-700">Completed</div>
              <div className="text-3xl font-bold mt-2 text-purple-600">{metrics.campaigns.completed}</div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="text-sm font-medium text-blue-700">Messages Sent</div>
              <div className="text-3xl font-bold mt-2 text-blue-600">
                {metrics.campaigns.totalSent.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Navigate to key engagement tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <a
              href="/ecp/recalls"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Manage Recalls</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.recalls.totalDue} patients due
                </div>
              </div>
            </a>

            <a
              href="/ecp/campaigns"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Send className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">Campaign Manager</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.campaigns.running} running
                </div>
              </div>
            </a>

            <a
              href="/ecp/waitlist"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Waitlist Queue</div>
                <div className="text-sm text-muted-foreground">
                  {metrics.waitlist.active} active requests
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
