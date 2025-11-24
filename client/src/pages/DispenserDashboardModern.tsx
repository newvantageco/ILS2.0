/**
 * Modern Dispenser Dashboard
 * Complete redesign with POS metrics and sales tracking
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  CreditCard,
  Clock,
  CheckCircle2,
  Plus,
  BarChart3,
  Glasses,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { ReadyForDispenseQueue, ReadyForDispenseCount } from "@/components/diary/ReadyForDispenseQueue";

interface Sale {
  id: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  items: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface DispenserStats {
  todaySales: number;
  todayRevenue: number;
  patientsServed: number;
  avgTransactionValue: number;
  pendingFittings: number;
  completedToday: number;
}

export default function DispenserDashboardModern() {
  const [activeTab, setActiveTab] = useState("queue");

  // Fetch sales data
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/pos/sales"],
  });

  const todaySales = sales?.filter((s) => isToday(new Date(s.createdAt))) || [];

  // Calculate stats
  const stats: DispenserStats = {
    todaySales: todaySales.length,
    todayRevenue: todaySales.reduce((sum, s) => sum + s.amount, 0),
    patientsServed: todaySales.length,
    avgTransactionValue: todaySales.length > 0 
      ? todaySales.reduce((sum, s) => sum + s.amount, 0) / todaySales.length 
      : 0,
    pendingFittings: 8,
    completedToday: 12,
  };

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Glasses className="w-8 h-8 text-primary" />
            Dispenser Point of Sale
          </h1>
          <p className="text-muted-foreground mt-1">
            Sales, fittings, and customer service management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Queue
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Today's Metrics - CHUNK 1 */}
      <MetricsGrid stats={stats} />

      {/* Main Content - CHUNK 2 */}
      <MainTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        sales={todaySales}
        isLoading={isLoading}
        stats={stats}
      />
    </div>
  );
}

// Metrics Grid Component - CHUNK 1
function MetricsGrid({ stats }: { stats: DispenserStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
          <ShoppingBag className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todaySales}</div>
          <p className="text-xs text-muted-foreground mt-1">Transactions completed</p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">{stats.patientsServed} patients</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{stats.todayRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total sales value</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>+15% vs yesterday</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{stats.avgTransactionValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Per customer spend</p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">Target: £120</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-500/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Frame Fittings</CardTitle>
          <Eye className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedToday}</div>
          <p className="text-xs text-muted-foreground mt-1">Completed today</p>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">{stats.pendingFittings} pending</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Tabs Component
function MainTabs({ activeTab, setActiveTab, sales, isLoading, stats }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sales: Sale[];
  isLoading: boolean;
  stats: DispenserStats;
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full max-w-2xl grid-cols-4">
        <TabsTrigger value="queue">
          <Package className="w-4 h-4 mr-2" />
          Queue
          <ReadyForDispenseCount />
        </TabsTrigger>
        <TabsTrigger value="sales">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Sales
        </TabsTrigger>
        <TabsTrigger value="fittings">
          <Glasses className="w-4 h-4 mr-2" />
          Fittings
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="space-y-4">
        <ReadyForDispenseQueue />
      </TabsContent>

      <TabsContent value="sales" className="space-y-4">
        <RecentSales sales={sales} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="fittings" className="space-y-4">
        <FrameFittings />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <SalesAnalytics stats={stats} />
      </TabsContent>
    </Tabs>
  );
}

// Recent Sales Component
function RecentSales({ sales, isLoading }: { sales: Sale[]; isLoading: boolean }) {
  if (isLoading) {
    return <div>Loading sales...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today&apos;s Sales</CardTitle>
            <CardDescription>Recent transactions and invoices</CardDescription>
          </div>
          <Button variant="outline" size="sm">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sales.slice(0, 10).map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">#{sale.invoiceNumber}</h4>
                  <p className="text-sm text-muted-foreground">{sale.patientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold">£{sale.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{sale.paymentMethod}</p>
                </div>
                <Badge variant={sale.status === "completed" ? "default" : "secondary"}>
                  {sale.status}
                </Badge>
              </div>
            </div>
          ))}
          {sales.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sales today yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Frame Fittings Component - CHUNK 4
function FrameFittings() {
  const fittings = [
    { id: "1", patient: "John Smith", frame: "Ray-Ban RB2140", status: "ready", time: "10:30 AM" },
    { id: "2", patient: "Sarah Jones", frame: "Oakley OO9013", status: "in-progress", time: "11:00 AM" },
    { id: "3", patient: "Mike Brown", frame: "Gucci GG0061S", status: "pending", time: "11:30 AM" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending
            </span>
            <Badge variant="secondary">3</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fittings.filter((f) => f.status === "pending").map((fitting) => (
            <div key={fitting.id} className="p-3 rounded-lg border-2 bg-orange-50 hover:shadow-md transition-all">
              <h4 className="font-medium text-sm">{fitting.patient}</h4>
              <p className="text-xs text-muted-foreground">{fitting.frame}</p>
              <p className="text-xs font-medium mt-1">{fitting.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              In Progress
            </span>
            <Badge variant="secondary">1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fittings.filter((f) => f.status === "in-progress").map((fitting) => (
            <div key={fitting.id} className="p-3 rounded-lg border-2 bg-blue-50 hover:shadow-md transition-all">
              <h4 className="font-medium text-sm">{fitting.patient}</h4>
              <p className="text-xs text-muted-foreground">{fitting.frame}</p>
              <p className="text-xs font-medium mt-1">{fitting.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Ready
            </span>
            <Badge variant="secondary">1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fittings.filter((f) => f.status === "ready").map((fitting) => (
            <div key={fitting.id} className="p-3 rounded-lg border-2 bg-green-50 hover:shadow-md transition-all">
              <h4 className="font-medium text-sm">{fitting.patient}</h4>
              <p className="text-xs text-muted-foreground">{fitting.frame}</p>
              <Button size="sm" className="w-full mt-2">Complete</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Sales Analytics Component - CHUNK 5
function SalesAnalytics({ stats }: { stats: DispenserStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Daily Target Progress</span>
                <span className="text-sm font-bold">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "68%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversion Rate</span>
                <span className="text-sm font-bold">82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Sales</span>
              <span className="font-bold">{stats.todaySales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue</span>
              <span className="font-bold">£{stats.todayRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Transaction</span>
              <span className="font-bold">£{stats.avgTransactionValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fittings Completed</span>
              <span className="font-bold">{stats.completedToday}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
