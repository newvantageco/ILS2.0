/**
 * Enhanced Dashboard Example Page
 *
 * Showcases all advanced UI/UX enhancements:
 * - Advanced animations with Framer Motion
 * - Interactive data visualization
 * - Advanced DataTable with filtering/sorting
 * - Number counters and progress indicators
 * - Sparklines and trend indicators
 * - Responsive design
 * - Loading states and skeletons
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  MoreVertical,
  Eye,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import {
  NumberCounter,
  ProgressRing,
  AnimatedCard,
  StaggeredList,
  StaggeredItem,
  PulseIndicator,
  ExpandableSection,
} from "@/components/ui/AnimatedComponents";
import {
  InteractiveLineChart,
  InteractiveBarChart,
  SparklineChart,
  GaugeChart,
  StatCard,
} from "@/components/ui/ChartAdvanced";
import { DataTableAdvanced, DataTableColumnHeader, DataTableRowActions } from "@/components/ui/DataTableAdvanced";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staggerContainer, pageVariants } from "@/lib/animations";

// ============================================================================
// SAMPLE DATA
// ============================================================================

const revenueData = [
  { month: "Jan", revenue: 45000, orders: 234, customers: 189 },
  { month: "Feb", revenue: 52000, orders: 267, customers: 215 },
  { month: "Mar", revenue: 48000, orders: 245, customers: 198 },
  { month: "Apr", revenue: 61000, orders: 312, customers: 256 },
  { month: "May", revenue: 58000, orders: 298, customers: 241 },
  { month: "Jun", revenue: 67000, orders: 345, customers: 289 },
];

const categoryData = [
  { category: "Frames", sales: 12500 },
  { category: "Lenses", sales: 18300 },
  { category: "Contacts", sales: 9800 },
  { category: "Accessories", sales: 6400 },
  { category: "Sunglasses", sales: 15200 },
];

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  date: string;
}

const recentOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    product: "Ray-Ban Aviator",
    amount: 159.99,
    status: "completed",
    date: "2025-12-02",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    product: "Progressive Lenses",
    amount: 349.99,
    status: "processing",
    date: "2025-12-02",
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    product: "Contact Lenses (Monthly)",
    amount: 89.99,
    status: "pending",
    date: "2025-12-01",
  },
  {
    id: "ORD-004",
    customer: "Alice Williams",
    product: "Designer Frame",
    amount: 279.99,
    status: "completed",
    date: "2025-12-01",
  },
  {
    id: "ORD-005",
    customer: "Charlie Brown",
    product: "Blue Light Glasses",
    amount: 129.99,
    status: "processing",
    date: "2025-11-30",
  },
  {
    id: "ORD-006",
    customer: "Diana Prince",
    product: "Prescription Sunglasses",
    amount: 399.99,
    status: "cancelled",
    date: "2025-11-30",
  },
];

// ============================================================================
// TABLE COLUMNS
// ============================================================================

const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Order ID" />,
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
  },
  {
    accessorKey: "product",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <div className="font-semibold">
        ${row.getValue<number>("amount").toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<Order["status"]>("status");
      const variants = {
        completed: "default",
        processing: "secondary",
        pending: "outline",
        cancelled: "destructive",
      } as const;

      return (
        <Badge variant={variants[status]} className="capitalize">
          {status}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        actions={[
          {
            label: "View Details",
            icon: <Eye className="h-4 w-4" />,
            onClick: () => console.log("View", row.original.id),
          },
          {
            label: "Download Invoice",
            icon: <Download className="h-4 w-4" />,
            onClick: () => console.log("Download", row.original.id),
          },
          {
            label: "Cancel Order",
            icon: <AlertCircle className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => console.log("Cancel", row.original.id),
          },
        ]}
      />
    ),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EnhancedDashboardExample() {
  const [isLoading, setIsLoading] = React.useState(false);

  // Sample sparkline data
  const weeklyRevenue = [45, 52, 48, 61, 58, 67, 72];
  const weeklyOrders = [234, 267, 245, 312, 298, 345, 378];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto p-6 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Enhanced Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Showcasing advanced UI/UX features with modern interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Filter className="h-4 w-4 mr-2" />
            Customize View
          </Button>
        </div>
      </div>

      {/* Stats Grid with Animated Cards */}
      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggeredItem>
          <StatCard
            title="Total Revenue"
            value={`$${(67000).toLocaleString()}`}
            change={15.3}
            trend="up"
            sparklineData={weeklyRevenue}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </StaggeredItem>

        <StaggeredItem>
          <StatCard
            title="Orders"
            value="345"
            change={12.5}
            trend="up"
            sparklineData={weeklyOrders}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
        </StaggeredItem>

        <StaggeredItem>
          <StatCard
            title="Customers"
            value="289"
            change={8.2}
            trend="up"
            icon={<Users className="h-5 w-5" />}
          />
        </StaggeredItem>

        <StaggeredItem>
          <StatCard
            title="Avg. Order Value"
            value="$194.20"
            change={-2.4}
            trend="down"
            icon={<Activity className="h-5 w-5" />}
          />
        </StaggeredItem>
      </StaggeredList>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <InteractiveLineChart
          title="Revenue Trend"
          description="Monthly revenue and orders over the past 6 months"
          data={revenueData}
          xAxisKey="month"
          config={[
            { dataKey: "revenue", name: "Revenue", color: "#3b82f6" },
            { dataKey: "orders", name: "Orders", color: "#10b981" },
          ]}
          enableZoom
          enableExport
          height={300}
        />

        {/* Category Performance */}
        <InteractiveBarChart
          title="Sales by Category"
          description="Product category performance"
          data={categoryData}
          xAxisKey="category"
          config={[{ dataKey: "sales", name: "Sales", color: "#f59e0b" }]}
          enableExport
          height={300}
          onDataPointClick={(data) => console.log("Clicked:", data)}
        />
      </div>

      {/* Progress and Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedCard className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Monthly Target</h3>
            <ProgressRing
              progress={78}
              size={150}
              strokeWidth={10}
              color="#10b981"
              showPercentage
            />
            <div className="text-center text-sm text-muted-foreground">
              $52,000 / $67,000
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Satisfaction</h3>
            <GaugeChart
              value={92}
              max={100}
              label="Score"
              size={180}
              color="#3b82f6"
            />
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">System Health</h3>
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PulseIndicator size="sm" color="bg-green-500" />
                  <span className="text-sm">API Status</span>
                </div>
                <Badge variant="outline">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PulseIndicator size="sm" color="bg-green-500" />
                  <span className="text-sm">Database</span>
                </div>
                <Badge variant="outline">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PulseIndicator size="sm" color="bg-yellow-500" />
                  <span className="text-sm">Queue</span>
                </div>
                <Badge variant="secondary">Processing</Badge>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Advanced DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Advanced table with filtering, sorting, and bulk actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            data={recentOrders}
            columns={orderColumns}
            enableFiltering
            enableRowSelection
            globalFilterPlaceholder="Search orders..."
            filterConfigs={[
              {
                column: "status",
                label: "Status",
                type: "select",
                options: [
                  { label: "Completed", value: "completed" },
                  { label: "Processing", value: "processing" },
                  { label: "Pending", value: "pending" },
                  { label: "Cancelled", value: "cancelled" },
                ],
              },
            ]}
            bulkActions={[
              {
                label: "Export Selected",
                icon: <Download className="h-4 w-4" />,
                onClick: (rows) => console.log("Export", rows),
              },
              {
                label: "Cancel Orders",
                icon: <AlertCircle className="h-4 w-4" />,
                variant: "destructive",
                onClick: (rows) => console.log("Cancel", rows),
              },
            ]}
            enableExport
            exportFileName="recent-orders"
            pageSize={5}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Expandable Sections */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Additional Information</h2>

        <ExpandableSection title="Performance Metrics" defaultExpanded>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Page Load Time</span>
                <span className="font-semibold">1.2s</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>API Response</span>
                <span className="font-semibold">180ms</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uptime</span>
                <span className="font-semibold">99.9%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "99.9%" }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="h-full bg-green-500"
                />
              </div>
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection title="Recent Activity">
          <div className="space-y-4">
            {[
              { action: "New order received", time: "2 minutes ago", type: "success" },
              { action: "Payment processed", time: "15 minutes ago", type: "success" },
              { action: "Order cancelled", time: "1 hour ago", type: "warning" },
              { action: "New customer registered", time: "3 hours ago", type: "info" },
            ].map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.type === "success"
                      ? "bg-green-500"
                      : activity.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ExpandableSection>
      </div>

      {/* Feature Highlights */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>✨ Enhanced Features Showcase</CardTitle>
          <CardDescription>
            This dashboard demonstrates all the advanced UI/UX enhancements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Activity className="h-5 w-5" />,
                title: "Advanced Animations",
                desc: "Framer Motion with smooth transitions",
              },
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: "Interactive Charts",
                desc: "Zoom, export, drill-down capabilities",
              },
              {
                icon: <Package className="h-5 w-5" />,
                title: "Smart DataTable",
                desc: "Filtering, sorting, bulk actions",
              },
              {
                icon: <Clock className="h-5 w-5" />,
                title: "Real-time Updates",
                desc: "Live counters and progress indicators",
              },
              {
                icon: <CheckCircle className="h-5 w-5" />,
                title: "Form Validation",
                desc: "Zod + React Hook Form integration",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Responsive Design",
                desc: "Mobile-first, touch-optimized",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
