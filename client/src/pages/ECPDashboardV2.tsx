/**
 * ECP Dashboard V2 - Modern Design System Implementation
 *
 * Design Principles:
 * - Clean, Linear-inspired layout
 * - Information hierarchy - key metrics at the top
 * - AI insights integrated seamlessly
 * - Micro-interactions for engagement
 * - Progressive disclosure
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// New Design System Components
import {
  MetricCard,
  DashboardSection,
  DashboardGrid,
  DashboardHeader,
  AIInsightCard,
  QuickStatsBar,
} from "@/components/dashboard/ModernDashboardLayout";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Users,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Search,
  FileText,
  Activity,
  BarChart3,
  Zap,
  Timer,
  User,
} from "lucide-react";

import type { OrderWithDetails } from "@shared/schema";

interface OrderStats {
  total: number;
  pending: number;
  inProduction: number;
  completed: number;
}

// Quick action item type
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  shortcut?: string;
}

// Sample sparkline data generator
function generateSparkline(base: number, variance: number = 20): number[] {
  return Array.from({ length: 7 }, () =>
    Math.max(0, base + Math.floor(Math.random() * variance - variance / 2))
  );
}

export default function ECPDashboardV2() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Data fetching
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<OrderStats>({
    queryKey: ["/api/stats"],
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: aiInsights } = useQuery<{
    insights: Array<{
      id: string;
      title: string;
      description: string;
      type: "insight" | "alert" | "prediction" | "recommendation";
      confidence: number;
      action?: { label: string; href: string };
    }>;
  }>({
    queryKey: ["/api/platform-ai/suggestions"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle auth errors
  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError as Error)) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [statsError, toast]);

  // Refresh handler
  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
    setLastUpdated(new Date());
  };

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: "new-patient",
      label: "New Patient",
      description: "Add patient record",
      icon: Users,
      href: "/ecp/patients?new=true",
      shortcut: "N",
    },
    {
      id: "new-exam",
      label: "New Exam",
      description: "Start examination",
      icon: Eye,
      href: "/ecp/examination/new",
      shortcut: "E",
    },
    {
      id: "new-order",
      label: "New Order",
      description: "Create lens order",
      icon: Plus,
      href: "/ecp/new-order",
      shortcut: "O",
    },
    {
      id: "pos",
      label: "Point of Sale",
      description: "Process sale",
      icon: Package,
      href: "/ecp/pos",
      shortcut: "P",
    },
    {
      id: "calendar",
      label: "Calendar",
      description: "View schedule",
      icon: Calendar,
      href: "/ecp/calendar",
      shortcut: "C",
    },
    {
      id: "search",
      label: "Search",
      description: "Find anything",
      icon: Search,
      href: "/ecp/patients",
      shortcut: "/",
    },
  ];

  // Calculate trends
  const getTrend = (current: number, previous: number): "up" | "down" | "neutral" => {
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "neutral";
  };

  // Recent orders
  const recentOrders = orders?.slice(0, 5) || [];

  // Today's stats for quick bar
  const quickStats = [
    { label: "Today's Exams", value: 8, change: 14 },
    { label: "Pending Pickups", value: 3, change: -5 },
    { label: "New Patients", value: 2, change: 50 },
    { label: "Revenue", value: "$2,450", change: 8 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <DashboardHeader
        title="Practice Dashboard"
        subtitle="Here's what's happening with your practice today"
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        actions={
          <Button asChild>
            <Link href="/ecp/new-order">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Link>
          </Button>
        }
      />

      {/* Quick Stats Bar */}
      <QuickStatsBar stats={quickStats} />

      {/* Quick Actions */}
      <DashboardSection title="Quick Actions" subtitle="Press keyboard shortcut for instant access">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <button className="w-full group p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-left">
                <div className="flex items-center justify-between mb-2">
                  <action.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  {action.shortcut && (
                    <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {action.description}
                </div>
              </button>
            </Link>
          ))}
        </div>
      </DashboardSection>

      {/* Key Metrics */}
      <DashboardSection title="Key Metrics" subtitle="Your practice performance at a glance">
        <DashboardGrid columns={4}>
          <MetricCard
            title="Total Orders"
            value={stats?.total ?? 0}
            change={12.5}
            changeLabel="vs last month"
            icon={Package}
            trend="up"
            sparklineData={generateSparkline(stats?.total ?? 100)}
            loading={statsLoading}
          />
          <MetricCard
            title="In Production"
            value={stats?.inProduction ?? 0}
            change={8.2}
            changeLabel="processing rate"
            icon={Clock}
            trend="up"
            variant="primary"
            sparklineData={generateSparkline(stats?.inProduction ?? 20)}
            loading={statsLoading}
          />
          <MetricCard
            title="Completed"
            value={stats?.completed ?? 0}
            change={15.3}
            changeLabel="completion rate"
            icon={CheckCircle}
            trend="up"
            variant="success"
            sparklineData={generateSparkline(stats?.completed ?? 80)}
            loading={statsLoading}
          />
          <MetricCard
            title="Pending"
            value={stats?.pending ?? 0}
            change={-5.2}
            changeLabel="vs yesterday"
            icon={AlertCircle}
            trend="down"
            variant="warning"
            sparklineData={generateSparkline(stats?.pending ?? 10)}
            loading={statsLoading}
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - 2 columns */}
        <div className="lg:col-span-2">
          <DashboardSection
            title="Recent Orders"
            subtitle="Latest lens orders from your practice"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ecp/orders">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {ordersLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-32 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-muted rounded-full" />
                    </div>
                  </div>
                ))
              ) : recentOrders.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No orders yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first order to get started
                  </p>
                  <Button asChild size="sm">
                    <Link href="/ecp/new-order">
                      <Plus className="w-4 h-4 mr-2" />
                      New Order
                    </Link>
                  </Button>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <div className="group p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              order.status === "completed"
                                ? "bg-success/10 text-success"
                                : order.status === "in_production"
                                ? "bg-primary/10 text-primary"
                                : "bg-warning/10 text-warning"
                            )}
                          >
                            {order.status === "completed" ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : order.status === "in_production" ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <Timer className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              Order #{order.orderNumber || order.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.patientName || "Patient"} •{" "}
                              {order.lensType || "Standard Lens"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              order.status === "completed" &&
                                "border-success/30 text-success bg-success/5",
                              order.status === "in_production" &&
                                "border-primary/30 text-primary bg-primary/5",
                              order.status === "pending" &&
                                "border-warning/30 text-warning bg-warning/5"
                            )}
                          >
                            {order.status?.replace("_", " ") || "Pending"}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </DashboardSection>
        </div>

        {/* AI Insights - 1 column */}
        <div className="lg:col-span-1">
          <DashboardSection
            title="AI Insights"
            subtitle="Powered by your practice data"
            actions={
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI
              </Badge>
            }
          >
            <div className="space-y-3">
              {/* Default insights if API doesn't return any */}
              {(!aiInsights?.insights || aiInsights.insights.length === 0) ? (
                <>
                  <AIInsightCard
                    title="Inventory Alert"
                    description="Progressive lenses stock is running low. Consider reordering within the next 5 days."
                    confidence={92}
                    type="alert"
                    action={{
                      label: "View inventory",
                      onClick: () => setLocation("/ecp/inventory"),
                    }}
                  />
                  <AIInsightCard
                    title="Revenue Trend"
                    description="Your revenue is up 12% compared to last month. Premium lens upgrades are driving growth."
                    confidence={88}
                    type="insight"
                    action={{
                      label: "View analytics",
                      onClick: () => setLocation("/ecp/analytics"),
                    }}
                  />
                  <AIInsightCard
                    title="Recall Prediction"
                    description="15 patients are due for their annual eye exam in the next 2 weeks."
                    confidence={95}
                    type="prediction"
                    action={{
                      label: "View recalls",
                      onClick: () => setLocation("/ecp/recalls"),
                    }}
                  />
                </>
              ) : (
                aiInsights.insights.slice(0, 3).map((insight) => (
                  <AIInsightCard
                    key={insight.id}
                    title={insight.title}
                    description={insight.description}
                    confidence={insight.confidence}
                    type={insight.type}
                    action={
                      insight.action
                        ? {
                            label: insight.action.label,
                            onClick: () => setLocation(insight.action!.href),
                          }
                        : undefined
                    }
                  />
                ))
              )}

              {/* Link to AI Assistant */}
              <Button
                variant="ghost"
                className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/ecp/ai-assistant">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open AI Assistant
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
            </div>
          </DashboardSection>
        </div>
      </div>

      {/* Activity Feed */}
      <DashboardSection
        title="Today's Schedule"
        subtitle="Upcoming appointments and tasks"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/ecp/calendar">
              View calendar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { time: "9:00 AM", patient: "John Smith", type: "Eye Exam", status: "upcoming" },
            { time: "10:30 AM", patient: "Sarah Johnson", type: "Frame Selection", status: "upcoming" },
            { time: "11:45 AM", patient: "Michael Brown", type: "Contact Lens Fitting", status: "upcoming" },
            { time: "2:00 PM", patient: "Emily Davis", type: "Follow-up", status: "upcoming" },
          ].map((appointment, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">{appointment.time}</span>
                <Badge variant="outline" className="text-xs">
                  {appointment.status}
                </Badge>
              </div>
              <div className="font-medium text-sm">{appointment.patient}</div>
              <div className="text-xs text-muted-foreground mt-1">{appointment.type}</div>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
