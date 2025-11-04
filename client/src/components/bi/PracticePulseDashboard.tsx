import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  AlertTriangle,
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
} from "recharts";
import { format, subDays, startOfMonth } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface PracticePulseData {
  netRevenue: number;
  netRevenueTrend: number;
  patientsSeen: number;
  patientsSeenTrend: number;
  averageRevenuePerPatient: number;
  arppTrend: number;
  noShowRate: number;
  noShowRateTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
  newVsReturningPatients: {
    new: number;
    returning: number;
  };
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  dailyAppointments: Array<{
    date: string;
    scheduled: number;
    completed: number;
    noShow: number;
    cancelled: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  description?: string;
  invertTrend?: boolean; // For metrics where down is good (like no-show rate)
}

function MetricCard({ title, value, trend, icon, description, invertTrend = false }: MetricCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = invertTrend ? trend! < 0 : trend! > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hasTrend && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {Math.abs(trend!).toFixed(1)}%
            </span>
            <span>vs last period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PracticePulseDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const queryParams = new URLSearchParams({
    startDate: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
    endDate: format(dateRange?.to || new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading, error } = useQuery<{ success: boolean; data: PracticePulseData }>({
    queryKey: ["/api/bi/practice-pulse", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/bi/practice-pulse?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || 'An error occurred while loading the dashboard'}
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dashboard = data.data;

  // Prepare data for new vs returning chart
  const newVsReturningData = [
    { name: 'New Patients', value: dashboard.newVsReturningPatients.new, color: COLORS[0] },
    { name: 'Returning Patients', value: dashboard.newVsReturningPatients.returning, color: COLORS[1] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8" />
            Practice Pulse
          </h1>
          <p className="text-muted-foreground mt-1">
            Your practice health at a glance
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(dashboard.netRevenue)}
          trend={dashboard.netRevenueTrend}
          icon={<DollarSign className="h-4 w-4" />}
          description="Total revenue after discounts and refunds"
        />
        <MetricCard
          title="Patients Seen"
          value={dashboard.patientsSeen.toLocaleString()}
          trend={dashboard.patientsSeenTrend}
          icon={<Users className="h-4 w-4" />}
          description="Completed appointments this period"
        />
        <MetricCard
          title="Avg Revenue Per Patient"
          value={formatCurrency(dashboard.averageRevenuePerPatient)}
          trend={dashboard.arppTrend}
          icon={<DollarSign className="h-4 w-4" />}
          description="Average value per patient visit"
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(dashboard.conversionRate)}
          trend={dashboard.conversionRateTrend}
          icon={<Target className="h-4 w-4" />}
          description="Exams resulting in eyewear sales"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="No-Show Rate"
          value={formatPercent(dashboard.noShowRate)}
          trend={dashboard.noShowRateTrend}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Appointments not attended"
          invertTrend={true}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New vs. Returning Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-blue-500">
                  {dashboard.newVsReturningPatients.new}
                </p>
                <p className="text-xs text-muted-foreground">New Patients</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-2xl font-bold text-green-500">
                  {dashboard.newVsReturningPatients.returning}
                </p>
                <p className="text-xs text-muted-foreground">Returning Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Source Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
            <CardDescription>Breakdown of revenue streams</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.revenueBySource}
                  dataKey="amount"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.source}: ${formatPercent(entry.percentage / 100)}`}
                >
                  {dashboard.revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {dashboard.revenueBySource.map((item, index) => (
                <div key={item.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                    <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Appointments Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Performance</CardTitle>
            <CardDescription>Daily appointment completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.dailyAppointments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Legend />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                <Bar dataKey="noShow" fill="#ef4444" name="No-Show" />
                <Bar dataKey="cancelled" fill="#94a3b8" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <p className="text-xl font-bold">
                  {dashboard.dailyAppointments.reduce((sum, d) => sum + d.completed, 0)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">No-Show</span>
                </div>
                <p className="text-xl font-bold">
                  {dashboard.dailyAppointments.reduce((sum, d) => sum + d.noShow, 0)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-muted-foreground">Cancelled</span>
                </div>
                <p className="text-xl font-bold">
                  {dashboard.dailyAppointments.reduce((sum, d) => sum + d.cancelled, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights based on your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.netRevenueTrend > 10 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Strong Revenue Growth</h4>
                <p className="text-sm text-green-700">
                  Your revenue is up {dashboard.netRevenueTrend.toFixed(1)}% compared to the previous period. 
                  Continue focusing on the strategies that are driving this growth.
                </p>
              </div>
            </div>
          )}
          
          {dashboard.noShowRate > 0.10 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">High No-Show Rate</h4>
                <p className="text-sm text-yellow-700">
                  Your no-show rate is {formatPercent(dashboard.noShowRate)}, above the recommended 8-10% threshold. 
                  Consider implementing automated SMS reminders 24 hours before appointments.
                </p>
              </div>
            </div>
          )}

          {dashboard.conversionRate < 0.60 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Conversion Rate Opportunity</h4>
                <p className="text-sm text-blue-700">
                  Your conversion rate is {formatPercent(dashboard.conversionRate)}. Industry average is 65-70%. 
                  Train staff on consultative selling techniques and ensure frame selection matches patient lifestyle needs.
                </p>
              </div>
            </div>
          )}

          {dashboard.newVsReturningPatients.new / dashboard.patientsSeen > 0.5 && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900">High New Patient Ratio</h4>
                <p className="text-sm text-purple-700">
                  {((dashboard.newVsReturningPatients.new / dashboard.patientsSeen) * 100).toFixed(0)}% of 
                  your patients are new. Focus on retention strategies to build a loyal patient base and 
                  increase lifetime value.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
