import { StatCard } from "@/components/StatCard";
import { OrderCard } from "@/components/OrderCard";
import { SearchBar } from "@/components/SearchBar";
import { ConsultLogManager } from "@/components/ConsultLogManager";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCardSkeleton, OrderCardSkeleton } from "@/components/ui/CardSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, AlertCircle, Plus, Brain, Sparkles, MessageSquare, TrendingUp, Lightbulb, Zap } from "lucide-react";
import { useState, useEffect } from "react";
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

export default function ECPDashboard() {
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

  // AI Quick Actions based on dashboard context
  const getAIQuickActions = () => {
    const actions = [];
    
    if (stats?.pending && stats.pending > 5) {
      actions.push({
        id: 'pending-orders',
        title: 'High pending orders',
        question: `I have ${stats.pending} pending orders. What should I prioritize and how can I process them efficiently?`,
        icon: AlertCircle,
        color: 'text-orange-600'
      });
    }
    
    if (stats?.inProduction && stats.inProduction > 10) {
      actions.push({
        id: 'production-tracking',
        title: 'Track production orders',
        question: `I have ${stats.inProduction} orders in production. How can I track their progress and estimate completion times?`,
        icon: Clock,
        color: 'text-blue-600'
      });
    }
    
    if (recentOrders.length > 0) {
      actions.push({
        id: 'order-analysis',
        title: 'Analyze recent orders',
        question: `Can you analyze my recent orders and provide insights on common lens types, coatings, and patient trends?`,
        icon: TrendingUp,
        color: 'text-green-600'
      });
    }
    
    // Default actions if no specific context
    if (actions.length === 0) {
      actions.push(
        {
          id: 'inventory-check',
          title: 'Check inventory status',
          question: 'What should I know about managing my lens inventory effectively?',
          icon: Package,
          color: 'text-primary'
        },
        {
          id: 'patient-management',
          title: 'Patient management tips',
          question: 'What are best practices for managing patient records and prescriptions?',
          icon: Lightbulb,
          color: 'text-purple-600'
        }
      );
    }
    
    return actions.slice(0, 3); // Limit to 3 actions
  };

  const quickActions = getAIQuickActions();

  const handleQuickAction = async (question: string) => {
    // Navigate to AI Assistant with pre-filled question
    setLocation(`/ecp/ai-assistant?q=${encodeURIComponent(question)}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's your order overview.
          </p>
        </div>
        <Link href="/ecp/new-order" className="shrink-0">
          <Button data-testid="button-new-order" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total Orders"
            value={stats?.total.toString() || "0"}
            icon={Package}
          />
          <StatCard
            title="In Production"
            value={stats?.inProduction.toString() || "0"}
            icon={Clock}
          />
          <StatCard
            title="Completed"
            value={stats?.completed.toString() || "0"}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending"
            value={stats?.pending.toString() || "0"}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* AI Assistant Quick Access Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-background">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  AI Assistant
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {aiUsage?.subscriptionTier || "Active"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Get instant help with your business</CardDescription>
              </div>
            </div>
            <Button onClick={() => setLocation("/ecp/ai-assistant")} className="gap-2 w-full sm:w-auto" size="sm">
              <MessageSquare className="h-4 w-4" />
              Open AI Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
              <div className="text-lg sm:text-2xl font-bold text-primary">{aiUsage?.queriesUsed || 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Queries Used</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{aiUsage?.cacheHits || 0}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Cache Hits</div>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {aiUsage?.queriesLimit ? Math.round(((aiUsage.queriesLimit - (aiUsage.queriesUsed || 0)) / aiUsage.queriesLimit) * 100) : 100}%
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Available</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => setLocation("/ecp/ai-assistant")}>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm" onClick={() => setLocation("/settings")}>
              Upgrade Plan
            </Button>
          </div>

          {/* AI Quick Actions */}
          {quickActions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Quick AI Actions</span>
              </div>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.question)}
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

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Orders</h2>
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search orders..."
            className="w-full sm:max-w-sm"
          />
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                orderId={order.orderNumber}
                patientName={order.patient.name}
                ecp={order.ecp.organizationName || `${order.ecp.firstName} ${order.ecp.lastName}`}
                status={order.status}
                orderDate={new Date(order.orderDate).toISOString().split('T')[0]}
                lensType={order.lensType}
                coating={order.coating}
                onViewDetails={() => setLocation(`/order/${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ConsultLogManager />
    </div>
  );
}
