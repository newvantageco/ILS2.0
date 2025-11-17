/**
 * Modern ECP Dashboard - Redesigned with NHS-compliant design system
 *
 * Features:
 * - Beautiful gradient cards
 * - Smooth animations
 * - NHS-compliant colors
 * - Modern stats display
 * - AI-powered insights
 */

import { SearchBar } from "@/components/SearchBar";
import { QuickActionCards } from "@/components/QuickActionCards";
import { lazy, Suspense } from "react";

// Lazy load heavy components for better performance
const ConsultLogManager = lazy(() => import("@/components/ConsultLogManager").then(m => ({ default: m.ConsultLogManager })));
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderCardSkeleton } from "@/components/ui/CardSkeleton";
import { OnboardingProgress } from "@/components/ui/onboarding-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/components/OrderCard";
import {
  StatsCard,
  GradientCard,
  GradientCardHeader,
  GradientCardContent,
  GradientCardActions,
  ModernBadge,
  StatusBadge,
  SkeletonStats,
} from "@/components/ui";
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Brain,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Zap,
  Eye,
  Users,
  Calendar,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect, memo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithDetails } from "@shared/schema";

interface OrderStats {
  total: number;
  pending: number;
  inProduction: number;
  completed: number;
}

export default function ECPDashboardModern() {
  const [searchValue, setSearchValue] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<OrderStats>({
    queryKey: ["/api/stats"],
  });

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: aiUsage } = useQuery<{
    queriesUsed: number;
    queriesLimit: number;
    cacheHits: number;
    subscriptionTier: string;
  }>({
    queryKey: ["/api/ai/usage/stats"],
  });

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

  useEffect(() => {
    if (ordersError && isUnauthorizedError(ordersError as Error)) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [ordersError, toast]);

  const recentOrders = orders?.slice(0, 6) || [];

  // Quick actions with keyboard shortcuts
  const quickActions = [
    {
      title: "New Patient",
      description: "Add a new patient record",
      icon: Users,
      href: "/ecp/patients?new=true",
      shortcut: "N",
      color: "bg-blue-500",
    },
    {
      title: "New Examination",
      description: "Start an eye examination",
      icon: Eye,
      href: "/ecp/examinations",
      shortcut: "E",
      color: "bg-purple-500",
    },
    {
      title: "New Order",
      description: "Create a lens order",
      icon: Plus,
      href: "/ecp/new-order",
      shortcut: "O",
      color: "bg-green-500",
    },
    {
      title: "Point of Sale",
      description: "Process a sale",
      icon: Package,
      href: "/ecp/pos",
      shortcut: "P",
      color: "bg-orange-500",
    },
  ];

  // AI Quick Actions based on dashboard context
  const getAIQuickActions = () => {
    const actions = [];

    if (stats?.pending && stats.pending > 5) {
      actions.push({
        id: "pending-orders",
        title: "High pending orders",
        question: `I have ${stats.pending} pending orders. What should I prioritize and how can I process them efficiently?`,
        icon: AlertCircle,
        color: "text-warning-600",
      });
    }

    if (stats?.inProduction && stats.inProduction > 10) {
      actions.push({
        id: "production-tracking",
        title: "Track production orders",
        question: `I have ${stats.inProduction} orders in production. How can I track their progress and estimate completion times?`,
        icon: Clock,
        color: "text-primary-600",
      });
    }

    if (recentOrders.length > 0) {
      actions.push({
        id: "order-analysis",
        title: "Analyze recent orders",
        question: `Can you analyze my recent orders and provide insights on common lens types, coatings, and patient trends?`,
        icon: TrendingUp,
        color: "text-success-600",
      });
    }

    // Default actions if no specific context
    if (actions.length === 0) {
      actions.push(
        {
          id: "inventory-check",
          title: "Check inventory status",
          question: "What should I know about managing my lens inventory effectively?",
          icon: Package,
          color: "text-primary-600",
        },
        {
          id: "patient-management",
          title: "Patient management tips",
          question: "What are best practices for managing patient records and prescriptions?",
          icon: Lightbulb,
          color: "text-secondary-600",
        }
      );
    }

    return actions.slice(0, 3);
  };

  const quickActions = getAIQuickActions();

  const handleQuickAction = async (question: string) => {
    setLocation(`/ecp/ai-assistant?q=${encodeURIComponent(question)}`);
  };

  // Calculate onboarding progress
  const hasOrders = (stats?.total || 0) > 0;
  const hasProducts = false;
  const hasConnections = false;

  const onboardingSteps = [
    {
      id: "first-order",
      label: "Create your first order",
      completed: hasOrders,
      action: () => setLocation("/ecp/new-order"),
    },
    {
      id: "add-product",
      label: "Add products to inventory",
      completed: hasProducts,
      action: () => setLocation("/ecp/inventory"),
    },
    {
      id: "connect-lab",
      label: "Connect with a lab or supplier",
      completed: hasConnections,
      action: () => setLocation("/marketplace"),
    },
    {
      id: "explore-ai",
      label: "Try AI Assistant features",
      completed: (aiUsage?.queriesUsed || 0) > 0,
      action: () => setLocation("/ecp/ai-assistant"),
    },
  ];

  const completedSteps = onboardingSteps.filter((step) => step.completed).length;
  const showOnboarding = completedSteps < onboardingSteps.length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your practice today</p>
        </div>
      </div>

      {/* Quick Actions with Keyboard Shortcuts */}
      <QuickActionCards actions={quickActions} />

      {/* Onboarding Progress */}
      {showOnboarding && <OnboardingProgress steps={onboardingSteps} currentStep={completedSteps} />}

      {/* Stats Grid - Beautiful Modern Cards */}
      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Orders"
            value={stats?.total.toString() || "0"}
            subtitle="All time orders"
            icon={Package}
            variant="default"
            trend={{
              value: 12.5,
              isPositive: true,
              label: "vs last month",
            }}
          />
          <StatsCard
            title="In Production"
            value={stats?.inProduction.toString() || "0"}
            subtitle="Currently processing"
            icon={Clock}
            variant="primary"
            trend={{
              value: 8.2,
              isPositive: true,
              label: "production rate",
            }}
          />
          <StatsCard
            title="Completed"
            value={stats?.completed.toString() || "0"}
            subtitle="Successfully delivered"
            icon={CheckCircle}
            variant="success"
            trend={{
              value: 15.3,
              isPositive: true,
              label: "completion rate",
            }}
          />
          <StatsCard
            title="Pending"
            value={stats?.pending.toString() || "0"}
            subtitle="Awaiting processing"
            icon={AlertCircle}
            variant="warning"
          />
        </div>
      )}

      {/* AI Assistant - Simplified & Optional */}
      {(aiUsage?.queriesUsed ?? 0) > 0 && (
        <GradientCard variant="primary">
        <GradientCardHeader
          title="AI-Powered Practice Assistant"
          subtitle="Get instant insights and recommendations for your optical practice"
          icon={<Brain className="w-6 h-6" />}
        />

        <GradientCardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold">{aiUsage?.queriesUsed || 0}</div>
              <div className="text-sm text-white/80 mt-1">Queries Used</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold">{aiUsage?.cacheHits || 0}</div>
              <div className="text-sm text-white/80 mt-1">Cache Hits</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="text-3xl font-bold">
                {aiUsage?.queriesLimit
                  ? Math.round(((aiUsage.queriesLimit - (aiUsage.queriesUsed || 0)) / aiUsage.queriesLimit) * 100)
                  : 100}
                %
              </div>
              <div className="text-sm text-white/80 mt-1">Available</div>
            </div>
          </div>

          {/* AI Quick Actions */}
          {quickActions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">Quick AI Actions</span>
              </div>
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.question)}
                  className="w-full text-left p-4 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/40 hover-lift group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-0.5">{action.title}</div>
                      <div className="text-sm text-white/80">{action.question}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </GradientCardContent>

        <GradientCardActions>
          <Button
            onClick={() => setLocation("/ecp/ai-assistant")}
            className="flex-1 bg-white text-primary-600 hover:bg-white/90"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Open AI Chat
          </Button>
          <Button onClick={() => setLocation("/settings")} variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
            Upgrade Plan
          </Button>
        </GradientCardActions>
      </GradientCard>
      )}

      {/* Additional quick stats - simplified */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold mt-1">124</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
                <p className="text-3xl font-bold mt-1">8</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month's Exams</p>
                <p className="text-3xl font-bold mt-1">45</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <p className="text-gray-500 mt-1">Track and manage your latest orders</p>
          </div>
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search orders..."
            className="w-full sm:max-w-sm"
          />
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Get started by creating your first lens order."
            action={{
              label: "Create Order",
              onClick: () => setLocation("/ecp/new-order"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                orderId={order.orderNumber}
                patientName={order.patient.name}
                ecp={order.ecp.organizationName || `${order.ecp.firstName} ${order.ecp.lastName}`}
                status={order.status}
                orderDate={new Date(order.orderDate).toISOString().split("T")[0]}
                lensType={order.lensType}
                coating={order.coating}
                onViewDetails={() => setLocation(`/order/${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lazy load consult log manager */}
      <Suspense fallback={
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <ConsultLogManager />
      </Suspense>
    </div>
  );
}
