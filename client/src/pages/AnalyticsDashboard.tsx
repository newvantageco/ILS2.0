import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  BarChart3
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import StatsCard from "@/components/ui/StatsCard";
import { StatsGridSkeleton } from "@/components/ui/LoadingSkeletons";
import {
  dateRanges,
  getDateRange,
  formatCurrency,
  formatDate,
  CHART_COLOR_ARRAY,
  fetchAnalyticsData
} from "@/lib/analytics-utils";

interface AnalyticsOverview {
  period: { start: string; end: string };
  metrics: {
    revenue: { current: number; trend: number };
    orders: { current: number; trend: number };
    averageOrderValue: number;
    transactionCount: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: string;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    total: string;
  }>;
}

interface SalesTrend {
  period: string;
  revenue: number;
  orders: number;
  transactions: number;
  averageValue: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  category: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  transactionCount: number;
}

interface CategoryBreakdown {
  category: string;
  revenue: number;
  percentage: number;
  unitsSold: number;
  transactionCount: number;
}

interface StaffPerformance {
  staffId: string;
  staffName: string;
  transactionCount: number;
  revenue: number;
  averageTransaction: number;
  cashTransactions: number;
  cardTransactions: number;
}

interface CustomerLifetimeValue {
  patientId: string;
  customerName: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  firstPurchase: string;
  lastPurchase: string;
}

interface ProductAffinity {
  product1Id: string;
  product1Name: string;
  product2Id: string;
  product2Name: string;
  occurrences: number;
  affinityScore: number;
}

interface HourlyRevenue {
  hour: number;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

interface WeekdayRevenue {
  dayOfWeek: number;
  dayName: string;
  revenue: number;
  transactionCount: number;
  averageValue: number;
}

interface InventoryTurnover {
  productId: string;
  productName: string;
  currentStock: number;
  soldQuantity: number;
  turnoverRate: number;
  daysToStockout: number | null;
}

interface PeakHour {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  revenue: number;
  transactionCount: number;
}

// Gradient Header Component for consistent styling
const GradientHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white shadow-lg"
  >
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    <div className="relative flex items-center gap-4">
      <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
        <BarChart3 className="h-8 w-8" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-white/80">Comprehensive business insights and performance metrics</p>
      </div>
    </div>
  </motion.div>
);

export default function AnalyticsDashboard() {
  console.log('[AnalyticsDashboard] Component mounted');
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  
  // Advanced analytics state
  const [customerLTV, setCustomerLTV] = useState<CustomerLifetimeValue[]>([]);
  const [productAffinity, setProductAffinity] = useState<ProductAffinity[]>([]);
  const [hourlyRevenue, setHourlyRevenue] = useState<HourlyRevenue[]>([]);
  const [weekdayRevenue, setWeekdayRevenue] = useState<WeekdayRevenue[]>([]);
  const [inventoryTurnover, setInventoryTurnover] = useState<InventoryTurnover[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);

  const fetchAnalytics = async () => {
    console.log('[AnalyticsDashboard] fetchAnalytics called');
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const params = new URLSearchParams({ startDate, endDate });
      console.log('[AnalyticsDashboard] Fetching with params:', { startDate, endDate });

      const [
        overviewRes, 
        trendsRes, 
        productsRes, 
        categoriesRes, 
        staffRes,
        clvRes,
        affinityRes,
        hourlyRes,
        weekdayRes,
        turnoverRes,
        peakRes
      ] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/sales-trends?${params}&interval=day`),
        fetch(`/api/analytics/product-performance?${params}`),
        fetch(`/api/analytics/category-breakdown?${params}`),
        fetch(`/api/analytics/staff-performance?${params}`),
        fetch(`/api/analytics/customer-lifetime-value?limit=20`),
        fetch(`/api/analytics/product-affinity?minOccurrences=3`),
        fetch(`/api/analytics/revenue-by-hour?${params}`),
        fetch(`/api/analytics/revenue-by-day-of-week?${params}`),
        fetch(`/api/analytics/inventory-turnover?days=30`),
        fetch(`/api/analytics/peak-hours?${params}`),
      ]);

      // Check if any request failed
      if (!overviewRes.ok) {
        throw new Error(`Failed to fetch analytics: ${overviewRes.statusText}`);
      }

      const [
        overviewData, 
        trendsData, 
        productsData, 
        categoriesData, 
        staffData,
        clvData,
        affinityData,
        hourlyData,
        weekdayData,
        turnoverData,
        peakData
      ] = await Promise.all([
        overviewRes.json(),
        trendsRes.ok ? trendsRes.json() : { data: [] },
        productsRes.ok ? productsRes.json() : { products: [] },
        categoriesRes.ok ? categoriesRes.json() : { categories: [] },
        staffRes.ok ? staffRes.json() : { staff: [] },
        clvRes.ok ? clvRes.json() : [],
        affinityRes.ok ? affinityRes.json() : [],
        hourlyRes.ok ? hourlyRes.json() : [],
        weekdayRes.ok ? weekdayRes.json() : [],
        turnoverRes.ok ? turnoverRes.json() : [],
        peakRes.ok ? peakRes.json() : [],
      ]);

      setOverview(overviewData);
      setSalesTrends(trendsData.data || []);
      setProductPerformance(productsData.products || []);
      setCategoryBreakdown(categoriesData.categories || []);
      setStaffPerformance(staffData.staff || []);
      setCustomerLTV(Array.isArray(clvData) ? clvData : []);
      setProductAffinity(Array.isArray(affinityData) ? affinityData : []);
      setHourlyRevenue(Array.isArray(hourlyData) ? hourlyData : []);
      setWeekdayRevenue(Array.isArray(weekdayData) ? weekdayData : []);
      setInventoryTurnover(Array.isArray(turnoverData) ? turnoverData : []);
      setPeakHours(Array.isArray(peakData) ? peakData : []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <GradientHeader />
        <StatsGridSkeleton count={4} />
        <div className="h-96 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              There is no analytics data for the selected period. Start by making some sales transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Modern Gradient Header */}
      <GradientHeader />

      {/* Action Bar */}
      <div className="flex justify-end items-center gap-2">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Key Metrics with StatsCard */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`£${overview.metrics.revenue.current.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            change={overview.metrics.revenue.trend}
            changeLabel="vs last period"
            icon={DollarSign}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatsCard
            title="Orders"
            value={overview.metrics.orders.current.toLocaleString()}
            change={overview.metrics.orders.trend}
            changeLabel="vs last period"
            icon={ShoppingCart}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatsCard
            title="Average Order Value"
            value={`£${overview.metrics.averageOrderValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatsCard
            title="Transactions"
            value={overview.metrics.transactionCount.toLocaleString()}
            icon={Users}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Sales Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders Over Time</CardTitle>
              <CardDescription>Daily sales performance trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                    formatter={(value: number, name: string) => {
                      if (name === 'Revenue') return `£${value.toFixed(2)}`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Revenue"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Orders"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>By revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance Table</CardTitle>
                <CardDescription>Detailed metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {productPerformance.slice(0, 10).map((product, idx) => (
                    <div key={product.productId} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <div>
                          <p className="font-medium text-sm">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">£{product.revenue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{product.unitsSold} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Revenue by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Detailed category metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryBreakdown.map((category, idx) => (
                    <div key={category.category} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CHART_COLOR_ARRAY[idx % CHART_COLOR_ARRAY.length] }}
                          />
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <span className="font-semibold">£{category.revenue.toFixed(2)}</span>
                      </div>
                      <div className="ml-5 text-xs text-muted-foreground">
                        {category.unitsSold} units • {category.percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Performance Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <CardDescription>Individual staff sales metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance.map((staff, idx) => (
                  <motion.div
                    key={staff.staffId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge>{idx + 1}</Badge>
                        <div>
                          <p className="font-semibold">{staff.staffName}</p>
                          <p className="text-sm text-muted-foreground">
                            {staff.transactionCount} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          £{staff.revenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Avg: £{staff.averageTransaction.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span>💵 Cash: {staff.cashTransactions}</span>
                      <span>💳 Card: {staff.cardTransactions}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                {overview && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={overview.paymentMethods}
                        dataKey="total"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.method}: ${entry.count}`}
                      >
                        {overview.paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLOR_ARRAY[index % CHART_COLOR_ARRAY.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling items</CardDescription>
              </CardHeader>
              <CardContent>
                {overview && (
                  <div className="space-y-3">
                    {overview.topProducts.slice(0, 5).map((product, idx) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{idx + 1}</Badge>
                          <span className="font-medium">{product.productName}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">£{parseFloat(product.totalRevenue).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{product.totalQuantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab - LTV Analysis */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value</CardTitle>
              <CardDescription>Top 20 customers by total spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {customerLTV.map((customer, idx) => (
                  <div key={customer.patientId} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted border">
                    <div className="flex items-center gap-3">
                      <Badge variant={idx < 3 ? "default" : "outline"}>{idx + 1}</Badge>
                      <div>
                        <p className="font-semibold">{customer.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.orderCount} orders • Avg £{customer.averageOrderValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">£{customer.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(customer.firstPurchase).toLocaleDateString()} - {new Date(customer.lastPurchase).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Affinity Analysis</CardTitle>
              <CardDescription>Products frequently bought together</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {productAffinity.slice(0, 15).map((affinity, idx) => (
                  <div key={idx} className="p-3 rounded-lg border hover:bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{affinity.occurrences}x</Badge>
                        <span className="text-sm font-medium">{affinity.product1Name}</span>
                        <span className="text-muted-foreground">+</span>
                        <span className="text-sm font-medium">{affinity.product2Name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Affinity:</span>
                        <Badge variant={affinity.affinityScore > 0.5 ? "default" : "secondary"}>
                          {(affinity.affinityScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab - Time-based Analysis */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Hour of Day</CardTitle>
                <CardDescription>24-hour sales performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                      formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Day of Week</CardTitle>
                <CardDescription>Weekly sales patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekdayRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayName" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Peak Sales Hours</CardTitle>
              <CardDescription>Best performing hour/day combinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {peakHours.slice(0, 10).map((peak, idx) => (
                  <div key={idx} className="p-3 rounded-lg border text-center hover:bg-muted">
                    <Badge className="mb-2" variant={idx < 3 ? "default" : "secondary"}>
                      #{idx + 1}
                    </Badge>
                    <p className="font-semibold text-sm">{peak.dayName}</p>
                    <p className="text-xs text-muted-foreground">{peak.hour}:00</p>
                    <p className="text-lg font-bold text-green-600 mt-1">£{peak.revenue.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{peak.transactionCount} sales</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab - Stock Analysis */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover Analysis</CardTitle>
              <CardDescription>Stock movement over last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                <div className="grid grid-cols-6 gap-2 pb-2 border-b font-semibold text-sm">
                  <div className="col-span-2">Product</div>
                  <div className="text-right">Stock</div>
                  <div className="text-right">Sold</div>
                  <div className="text-right">Turnover</div>
                  <div className="text-right">Days Left</div>
                </div>
                {inventoryTurnover.map((item) => (
                  <div key={item.productId} className="grid grid-cols-6 gap-2 p-2 rounded hover:bg-muted items-center">
                    <div className="col-span-2">
                      <p className="font-medium text-sm">{item.productName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.currentStock < 10 ? "destructive" : "outline"}>
                        {item.currentStock}
                      </Badge>
                    </div>
                    <div className="text-right text-sm">{item.soldQuantity}</div>
                    <div className="text-right">
                      <Badge variant={item.turnoverRate > 1 ? "default" : "secondary"}>
                        {item.turnoverRate.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {item.daysToStockout !== null ? (
                        <Badge variant={item.daysToStockout < 7 ? "destructive" : item.daysToStockout < 14 ? "default" : "outline"}>
                          {Math.round(item.daysToStockout)}d
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
