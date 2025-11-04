import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
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
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, startOfMonth } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface FinancialDashboardData {
  totalRevenue: number;
  totalRevenueTrend: number;
  netRevenue: number;
  netRevenueTrend: number;
  grossProfit: number;
  grossProfitTrend: number;
  averageTransactionValue: number;
  atvTrend: number;
  revenueByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  arAging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  };
  topRevenueProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
  }>;
  refundsAndAdjustments: {
    refunds: number;
    adjustments: number;
    total: number;
  };
}

const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#a855f7",
  teal: "#14b8a6",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

function MetricCard({
  title,
  value,
  trend,
  icon,
  description,
}: {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
}) {
  const trendColor = trend && trend > 0 ? "text-green-600" : "text-red-600";
  const TrendIcon = trend && trend > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trendColor} mt-1`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            <span>{Math.abs(trend).toFixed(1)}% vs previous period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

export function FinancialDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const queryParams = new URLSearchParams({
    startDate: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
    endDate: format(dateRange?.to || new Date(), 'yyyy-MM-dd'),
  });

  const { data: dashboard, isLoading } = useQuery<FinancialDashboardData>({
    queryKey: ["bi-financial", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/bi/financial?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial dashboard");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading financial analytics...</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Financial & Sales Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Revenue analysis and financial health metrics
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(dashboard.totalRevenue)}
          trend={dashboard.totalRevenueTrend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(dashboard.netRevenue)}
          trend={dashboard.netRevenueTrend}
          icon={<DollarSign className="h-4 w-4" />}
          description="After refunds & adjustments"
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(dashboard.grossProfit)}
          trend={dashboard.grossProfitTrend}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Avg Transaction Value"
          value={formatCurrency(dashboard.averageTransactionValue)}
          trend={dashboard.atvTrend}
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue and transaction volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboard.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), "MMM d")}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "revenue") return formatCurrency(value);
                  return value;
                }}
                labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.6}
                name="Revenue"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.3}
                name="Transactions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Sales breakdown by product type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.revenueByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {dashboard.revenueByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {dashboard.revenueByCategory.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Transaction breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.paymentMethods.map((method) => (
                <div key={method.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{method.method}</span>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(method.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {method.count} transactions
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage(method.percentage)} of total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* A/R Aging and Top Products */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* A/R Aging */}
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable Aging</CardTitle>
            <CardDescription>Outstanding balances by aging bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Current (0-30 days)</span>
                <span className="font-bold text-green-700">
                  {formatCurrency(dashboard.arAging.current)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">31-60 days</span>
                <span className="font-bold text-yellow-700">
                  {formatCurrency(dashboard.arAging.days30)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">61-90 days</span>
                <span className="font-bold text-orange-700">
                  {formatCurrency(dashboard.arAging.days60)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Over 90 days</span>
                <span className="font-bold text-red-700">
                  {formatCurrency(dashboard.arAging.over90)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2 border-gray-300">
                <span className="font-bold">Total Outstanding</span>
                <span className="font-bold text-lg">
                  {formatCurrency(
                    dashboard.arAging.current +
                    dashboard.arAging.days30 +
                    dashboard.arAging.days60 +
                    dashboard.arAging.over90
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Revenue Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.topRevenueProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Bar dataKey="revenue" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Refunds & Adjustments Alert */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Refunds & Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Refunds</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(dashboard.refundsAndAdjustments.refunds)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Adjustments</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(dashboard.refundsAndAdjustments.adjustments)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Impact</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(dashboard.refundsAndAdjustments.total)}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Total refunds and adjustments represent{" "}
            {formatPercentage((dashboard.refundsAndAdjustments.total / dashboard.totalRevenue) * 100)}{" "}
            of gross revenue
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
