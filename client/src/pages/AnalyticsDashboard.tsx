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
  ArrowDown
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const dateRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 90 Days', value: '90days' },
  { label: 'This Year', value: 'year' },
];

const getDateRange = (range: string) => {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  format = 'number' 
}: { 
  title: string; 
  value: number; 
  trend?: number; 
  icon: any; 
  format?: 'number' | 'currency';
}) => {
  const formattedValue = format === 'currency' 
    ? `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : value.toLocaleString();

  const trendColor = trend && trend > 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trend && trend > 0 ? ArrowUp : ArrowDown;

  return (
    <AnimatedCard>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {trend !== undefined && (
          <p className={`text-xs flex items-center gap-1 mt-1 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend).toFixed(1)}%</span>
            <span className="text-muted-foreground">vs last period</span>
          </p>
        )}
      </CardContent>
    </AnimatedCard>
  );
};

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);
      const params = new URLSearchParams({ startDate, endDate });

      const [overviewRes, trendsRes, productsRes, categoriesRes, staffRes] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/sales-trends?${params}&interval=day`),
        fetch(`/api/analytics/product-performance?${params}`),
        fetch(`/api/analytics/category-breakdown?${params}`),
        fetch(`/api/analytics/staff-performance?${params}`),
      ]);

      const [overviewData, trendsData, productsData, categoriesData, staffData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        productsRes.json(),
        categoriesRes.json(),
        staffRes.json(),
      ]);

      setOverview(overviewData);
      setSalesTrends(trendsData.data);
      setProductPerformance(productsData.products);
      setCategoryBreakdown(categoriesData.categories);
      setStaffPerformance(staffData.staff);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={overview.metrics.revenue.current}
            trend={overview.metrics.revenue.trend}
            icon={DollarSign}
            format="currency"
          />
          <StatCard
            title="Orders"
            value={overview.metrics.orders.current}
            trend={overview.metrics.orders.trend}
            icon={ShoppingCart}
          />
          <StatCard
            title="Average Order Value"
            value={overview.metrics.averageOrderValue}
            icon={TrendingUp}
            format="currency"
          />
          <StatCard
            title="Transactions"
            value={overview.metrics.transactionCount}
            icon={Users}
          />
        </div>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      </Tabs>
    </div>
  );
}
