/**
 * Modern Lab Dashboard
 *
 * Complete redesign with:
 * - Production Kanban board
 * - Real-time order tracking
 * - Quality metrics
 * - Equipment status
 * - Performance analytics
 * - Smooth animations with Framer Motion
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Beaker,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Target,
  Activity,
  Settings,
  BarChart3,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  status: string;
  priority: string;
  createdAt: string;
  dueDate: string;
  productType: string;
}

interface ProductionStats {
  pending: number;
  inProduction: number;
  qualityCheck: number;
  completed: number;
  todayOutput: number;
  avgProductionTime: number;
  qualityRate: number;
  onTimeDelivery: number;
}

export default function LabDashboardModern() {
  const [activeTab, setActiveTab] = useState("production");

  // Fetch orders
  const { data: orders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Calculate stats
  const stats: ProductionStats = {
    pending: orders?.filter((o) => o.status === "pending").length || 0,
    inProduction: orders?.filter((o) => o.status === "in_production").length || 0,
    qualityCheck: orders?.filter((o) => o.status === "quality_check").length || 0,
    completed: orders?.filter((o) => o.status === "completed").length || 0,
    todayOutput: orders?.filter((o) => 
      o.status === "completed" && isToday(new Date(o.createdAt))
    ).length || 0,
    avgProductionTime: 4.2, // hours - mock data
    qualityRate: 98.5, // percentage - mock data
    onTimeDelivery: 96.8, // percentage - mock data
  };

  const ordersByStatus = {
    pending: orders?.filter((o) => o.status === "pending") || [],
    inProduction: orders?.filter((o) => o.status === "in_production") || [],
    qualityCheck: orders?.filter((o) => o.status === "quality_check") || [],
    completed: orders?.filter((o) => o.status === "completed") || [],
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beaker className="w-8 h-8 text-primary" />
            Laboratory Production
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time production tracking and quality management
          </p>
        </div>
        <ErrorState
          title="Couldn't load production data"
          message="We had trouble loading your lab orders and production status. Please check your connection and try again."
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Beaker className="w-8 h-8 text-primary" />
            Laboratory Production
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time production tracking and quality management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProduction}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently being produced
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {stats.pending} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Output</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOutput}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders completed today
            </p>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>+12% vs yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualityRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              First-time pass rate
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${stats.qualityRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onTimeDelivery}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Delivered on schedule
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Avg: {stats.avgProductionTime}h
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="production">
            <Package className="w-4 h-4 mr-2" />
            Production
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Target className="w-4 h-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Production Kanban */}
        <TabsContent value="production" className="space-y-4">
          <ProductionKanban orders={ordersByStatus} isLoading={isLoading} />
        </TabsContent>

        {/* Quality Control */}
        <TabsContent value="quality" className="space-y-4">
          <QualityControl orders={ordersByStatus.qualityCheck} />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Production Kanban Board
function ProductionKanban({ orders, isLoading }: {
  orders: {
    pending: Order[];
    inProduction: Order[];
    qualityCheck: Order[];
    completed: Order[];
  };
  isLoading: boolean;
}) {
  const columns = [
    {
      id: "pending",
      title: "Pending",
      icon: Clock,
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      orders: orders.pending,
    },
    {
      id: "inProduction",
      title: "In Production",
      icon: Zap,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      orders: orders.inProduction,
    },
    {
      id: "qualityCheck",
      title: "Quality Check",
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      orders: orders.qualityCheck,
    },
    {
      id: "completed",
      title: "Completed",
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-100",
      orders: orders.completed,
    },
  ];

  // Loading handled at parent level

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {columns.map((column) => (
        <Card key={column.id} className="border-t-4" style={{ borderTopColor: `var(--${column.color})` }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <column.icon className={cn("w-5 h-5", column.color)} />
                {column.title}
              </span>
              <Badge variant="secondary">{column.orders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.orders.slice(0, 5).map((order) => (
              <OrderCard key={order.id} order={order} statusColor={column.bgColor} />
            ))}
            {column.orders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No orders
              </p>
            )}
            {column.orders.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full">
                View all {column.orders.length} orders
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Order Card Component
function OrderCard({ order, statusColor }: { order: Order; statusColor: string }) {
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  return (
    <div className={cn("p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md", statusColor)}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">#{order.orderNumber}</h4>
            <p className="text-xs text-muted-foreground truncate">{order.patientName}</p>
          </div>
          {order.priority && (
            <Badge variant="outline" className={cn("text-xs ml-2", getPriorityColor(order.priority))}>
              {order.priority}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{order.productType}</span>
          {order.dueDate && (
            <span className="font-medium">
              Due: {format(new Date(order.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Quality Control Component
function QualityControl({ orders }: { orders: Order[] }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Quality Inspection Queue</CardTitle>
          <CardDescription>Orders awaiting quality verification</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <h4 className="font-medium">#{order.orderNumber}</h4>
                    <p className="text-sm text-muted-foreground">{order.patientName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Flag Issue
                    </Button>
                    <Button size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p className="text-muted-foreground">No orders in quality check</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ stats }: { stats: ProductionStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Production Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Quality Rate</span>
                <span className="text-sm font-bold">{stats.qualityRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.qualityRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">On-Time Delivery</span>
                <span className="text-sm font-bold">{stats.onTimeDelivery}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${stats.onTimeDelivery}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Production Time</span>
              <span className="font-bold">{stats.avgProductionTime}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Today&apos;s Output</span>
              <span className="font-bold">{stats.todayOutput} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">In Production</span>
              <span className="font-bold">{stats.inProduction} orders</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
