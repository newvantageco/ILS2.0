/**
 * Modern Supplier Dashboard
 * 
 * Complete redesign with:
 * - Inventory alerts and tracking
 * - Order fulfillment pipeline
 * - Performance metrics
 * - Catalog management
 * - Revenue analytics
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Package,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  Truck,
  BarChart3,
  Box,
  Search,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SupplierOrder {
  id: string;
  orderNumber: string;
  companyName: string;
  items: number;
  totalValue: number;
  status: string;
  createdAt: string;
  estimatedDelivery: string;
}

interface SupplierStats {
  pendingOrders: number;
  readyToShip: number;
  shipped: number;
  monthlyRevenue: number;
  lowStockItems: number;
  averageFulfillmentTime: number;
}

export default function SupplierDashboardModern() {
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch supplier orders
  const { data: orders, isLoading } = useQuery<SupplierOrder[]>({
    queryKey: ["/api/supplier/orders"],
  });

  // Calculate stats
  const stats: SupplierStats = {
    pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
    readyToShip: orders?.filter((o) => o.status === "ready_to_ship").length || 0,
    shipped: orders?.filter((o) => o.status === "shipped").length || 0,
    monthlyRevenue: orders?.reduce((sum, o) => sum + o.totalValue, 0) || 0,
    lowStockItems: 12, // Mock data
    averageFulfillmentTime: 2.5, // days - mock data
  };

  const ordersByStatus = {
    pending: orders?.filter((o) => o.status === "pending") || [],
    preparing: orders?.filter((o) => o.status === "preparing") || [],
    readyToShip: orders?.filter((o) => o.status === "ready_to_ship") || [],
    shipped: orders?.filter((o) => o.status === "shipped") || [],
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Supplier Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage inventory, orders, and fulfillment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Reports
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting processing
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {stats.readyToShip} ready to ship
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{(stats.monthlyRevenue / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month's orders
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+18% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items need restocking
            </p>
            <Button variant="link" className="h-auto p-0 mt-2 text-xs">
              View inventory →
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fulfillment</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageFulfillmentTime} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Order to delivery
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Target: 3 days
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Box className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Orders Pipeline */}
        <TabsContent value="orders" className="space-y-4">
          <OrdersPipeline orders={ordersByStatus} isLoading={isLoading} />
        </TabsContent>

        {/* Inventory Management */}
        <TabsContent value="inventory" className="space-y-4">
          <InventoryManagement />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <SupplierAnalytics stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Orders Pipeline Component
function OrdersPipeline({ orders, isLoading }: {
  orders: {
    pending: SupplierOrder[];
    preparing: SupplierOrder[];
    readyToShip: SupplierOrder[];
    shipped: SupplierOrder[];
  };
  isLoading: boolean;
}) {
  const stages = [
    {
      id: "pending",
      title: "New Orders",
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      orders: orders.pending,
    },
    {
      id: "preparing",
      title: "Preparing",
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      orders: orders.preparing,
    },
    {
      id: "readyToShip",
      title: "Ready to Ship",
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-50",
      orders: orders.readyToShip,
    },
    {
      id: "shipped",
      title: "Shipped",
      icon: Truck,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      orders: orders.shipped,
    },
  ];

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stages.map((stage) => (
        <Card key={stage.id} className="border-t-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <stage.icon className={cn("w-5 h-5", stage.color)} />
                {stage.title}
              </span>
              <Badge variant="secondary">{stage.orders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stage.orders.slice(0, 5).map((order) => (
              <SupplierOrderCard key={order.id} order={order} bgColor={stage.bgColor} />
            ))}
            {stage.orders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No orders
              </p>
            )}
            {stage.orders.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full">
                View all {stage.orders.length}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Supplier Order Card
function SupplierOrderCard({ order, bgColor }: { order: SupplierOrder; bgColor: string }) {
  return (
    <div className={cn("p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md", bgColor)}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">#{order.orderNumber}</h4>
            <p className="text-xs text-muted-foreground truncate">{order.companyName}</p>
          </div>
          <Badge variant="outline" className="text-xs ml-2">
            £{order.totalValue}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{order.items} items</span>
          <span className="font-medium">
            Due: {format(new Date(order.estimatedDelivery), "MMM d")}
          </span>
        </div>
      </div>
    </div>
  );
}

// Inventory Management Component
function InventoryManagement() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Manage stock levels and reorder points</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9 w-64" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Box className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Product Name {i}</h4>
                  <p className="text-sm text-muted-foreground">SKU: PRD-00{i}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Stock: 45 units</p>
                  <p className="text-xs text-muted-foreground">Reorder at: 20</p>
                </div>
                <Badge variant={i <= 2 ? "destructive" : "secondary"}>
                  {i <= 2 ? "Low Stock" : "In Stock"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Analytics Component
function SupplierAnalytics({ stats }: { stats: SupplierStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Order Fulfillment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">On-Time Delivery</span>
                <span className="text-sm font-bold">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Order Accuracy</span>
                <span className="text-sm font-bold">98%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "98%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Orders</span>
              <span className="font-bold">{stats.pendingOrders + stats.readyToShip + stats.shipped}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Monthly Revenue</span>
              <span className="font-bold">£{(stats.monthlyRevenue / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Order Value</span>
              <span className="font-bold">
                £{(stats.monthlyRevenue / Math.max(stats.pendingOrders + stats.shipped, 1)).toFixed(0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
