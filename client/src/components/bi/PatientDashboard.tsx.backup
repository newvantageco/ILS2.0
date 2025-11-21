import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Heart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  UserCheck,
  UserX,
  Activity,
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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface PatientDashboardData {
  totalActivePatients: number;
  activePatientsTrend: number;
  newPatientsAcquired: number;
  newPatientsTrend: number;
  averageLifetimeValue: number;
  lifetimeValueTrend: number;
  retentionRate: number;
  retentionRateTrend: number;
  patientAcquisition: Array<{
    source: string;
    newPatients: number;
    acquisitionCost: number;
    lifetimeValue: number;
  }>;
  lifetimeValueDistribution: Array<{
    segment: string;
    count: number;
    totalValue: number;
  }>;
  retentionCohorts: Array<{
    cohort: string;
    retention30: number;
    retention90: number;
    retention180: number;
    retention365: number;
  }>;
  clinicalOutcomes: {
    examCompletionRate: number;
    contactLensSuccessRate: number;
    averageVisitsPerYear: number;
    recallEffectiveness: number;
  };
  patientDemographics: {
    ageGroups: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    topConditions: Array<{
      condition: string;
      patientCount: number;
      averageRevenue: number;
    }>;
  };
  recallMetrics: {
    dueForRecall: number;
    recallResponseRate: number;
    averageDaysBetweenVisits: number;
    lapsedPatients: number;
  };
  patientSatisfaction: Array<{
    month: string;
    score: number;
    responses: number;
  }>;
}

const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#a855f7",
  teal: "#14b8a6",
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#ec4899"];

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

export function PatientDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const queryParams = new URLSearchParams({
    startDate: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
    endDate: format(dateRange?.to || new Date(), 'yyyy-MM-dd'),
  });

  const { data: dashboard, isLoading } = useQuery<PatientDashboardData>({
    queryKey: ["bi-patient", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/bi/patient?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch patient dashboard");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading patient analytics...</div>
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
            Patient & Clinical Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Patient lifetime value, retention, and clinical outcomes
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Key Patient Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Patients"
          value={dashboard.totalActivePatients.toLocaleString()}
          trend={dashboard.activePatientsTrend}
          icon={<Users className="h-4 w-4" />}
          description="Visited in last 12 months"
        />
        <MetricCard
          title="New Patients"
          value={dashboard.newPatientsAcquired.toLocaleString()}
          trend={dashboard.newPatientsTrend}
          icon={<UserCheck className="h-4 w-4" />}
          description="Acquired this period"
        />
        <MetricCard
          title="Avg Lifetime Value"
          value={formatCurrency(dashboard.averageLifetimeValue)}
          trend={dashboard.lifetimeValueTrend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Retention Rate"
          value={formatPercentage(dashboard.retentionRate)}
          trend={dashboard.retentionRateTrend}
          icon={<Heart className="h-4 w-4" />}
          description="12-month retention"
        />
      </div>

      {/* Patient Acquisition Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Acquisition by Source</CardTitle>
          <CardDescription>New patients, acquisition cost, and lifetime value by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">New Patients</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Acquisition Cost</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Avg LTV</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.patientAcquisition.map((source, index) => {
                  const roi = ((source.lifetimeValue - source.acquisitionCost) / source.acquisitionCost) * 100;
                  return (
                    <tr key={source.source} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="px-4 py-3 text-sm font-medium">{source.source}</td>
                      <td className="px-4 py-3 text-sm text-right">{source.newPatients}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(source.acquisitionCost)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(source.lifetimeValue)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={roi > 200 ? "default" : roi > 100 ? "secondary" : "destructive"}>
                          {roi.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Value Distribution & Retention Cohorts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lifetime Value Distribution</CardTitle>
            <CardDescription>Patient segmentation by value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.lifetimeValueDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === "totalValue") return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Patient Count" />
                <Bar yAxisId="right" dataKey="totalValue" fill={COLORS.success} name="Total Value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Retention Cohorts</CardTitle>
            <CardDescription>Retention rates by acquisition cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.retentionCohorts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="retention30" stroke={COLORS.primary} name="30 Days" />
                <Line type="monotone" dataKey="retention90" stroke={COLORS.success} name="90 Days" />
                <Line type="monotone" dataKey="retention180" stroke={COLORS.warning} name="180 Days" />
                <Line type="monotone" dataKey="retention365" stroke={COLORS.danger} name="365 Days" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Performance Metrics</CardTitle>
          <CardDescription>Key clinical indicators and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Exam Completion Rate</div>
              <div className="text-3xl font-bold text-blue-700">
                {formatPercentage(dashboard.clinicalOutcomes.examCompletionRate)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Of scheduled exams</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Contact Lens Success</div>
              <div className="text-3xl font-bold text-green-700">
                {formatPercentage(dashboard.clinicalOutcomes.contactLensSuccessRate)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Successful fittings</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Avg Visits/Year</div>
              <div className="text-3xl font-bold text-purple-700">
                {dashboard.clinicalOutcomes.averageVisitsPerYear.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Per active patient</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Recall Effectiveness</div>
              <div className="text-3xl font-bold text-teal-700">
                {formatPercentage(dashboard.clinicalOutcomes.recallEffectiveness)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Response rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Demographics & Top Conditions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient Demographics</CardTitle>
            <CardDescription>Age distribution of patient base</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.patientDemographics.ageGroups}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboard.patientDemographics.ageGroups.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Conditions Treated</CardTitle>
            <CardDescription>Most common patient conditions and revenue impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.patientDemographics.topConditions.map((condition, index) => (
                <div key={condition.condition} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{condition.condition}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{condition.patientCount} patients</div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {formatCurrency(condition.averageRevenue)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recall & Reactivation */}
      <Card>
        <CardHeader>
          <CardTitle>Recall & Reactivation Metrics</CardTitle>
          <CardDescription>Patient engagement and recall campaign performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Due for Recall</span>
              </div>
              <div className="text-2xl font-bold">{dashboard.recallMetrics.dueForRecall}</div>
              <p className="text-xs text-muted-foreground mt-1">Patients to contact</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Response Rate</span>
              </div>
              <div className="text-2xl font-bold">{formatPercentage(dashboard.recallMetrics.recallResponseRate)}</div>
              <p className="text-xs text-muted-foreground mt-1">Recall effectiveness</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Avg Days Between</span>
              </div>
              <div className="text-2xl font-bold">{Math.round(dashboard.recallMetrics.averageDaysBetweenVisits)}</div>
              <p className="text-xs text-muted-foreground mt-1">Visit frequency</p>
            </div>
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Lapsed Patients</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{dashboard.recallMetrics.lapsedPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">No visit in 18+ months</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Satisfaction Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Satisfaction Score</CardTitle>
          <CardDescription>Monthly satisfaction ratings and response volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dashboard.patientSatisfaction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={[0, 5]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="score"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.6}
                name="Satisfaction Score"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="responses"
                stroke={COLORS.primary}
                name="Responses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Actionable Insights */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-purple-600" />
            Patient Strategy Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Activity className="h-4 w-4 text-purple-600 mt-0.5" />
              <span>
                <strong>Lifetime Value Opportunity:</strong>{" "}
                {dashboard.patientAcquisition.find(s => s.lifetimeValue === Math.max(...dashboard.patientAcquisition.map(x => x.lifetimeValue)))?.source} 
                {" "}has the highest LTV - consider increasing investment in this channel.
              </span>
            </li>
            {dashboard.recallMetrics.lapsedPatients > 50 && (
              <li className="flex items-start gap-2">
                <UserX className="h-4 w-4 text-purple-600 mt-0.5" />
                <span>
                  <strong>Reactivation Campaign Needed:</strong> {dashboard.recallMetrics.lapsedPatients} lapsed patients represent potential revenue recovery.
                </span>
              </li>
            )}
            {dashboard.retentionRate < 70 && (
              <li className="flex items-start gap-2">
                <Heart className="h-4 w-4 text-purple-600 mt-0.5" />
                <span>
                  <strong>Retention Focus:</strong> Current retention rate is below optimal - implement loyalty program or enhanced recall system.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
              <span>
                Average patient visits {dashboard.clinicalOutcomes.averageVisitsPerYear.toFixed(1)}x per year - 
                increasing to 1.5x could boost annual revenue by {formatPercentage(((1.5 / dashboard.clinicalOutcomes.averageVisitsPerYear) - 1) * 100)}.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
