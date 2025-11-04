import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface OperationalDashboardData {
  appointmentUtilization: number;
  utilizationTrend: number;
  averageAppointmentDuration: number;
  durationTrend: number;
  staffProductivity: number;
  productivityTrend: number;
  noShowRate: number;
  noShowRateTrend: number;
  staffPerformance: Array<{
    staffName: string;
    appointmentsCompleted: number;
    averageDuration: number;
    revenueGenerated: number;
    patientSatisfaction: number;
  }>;
  appointmentsByHour: Array<{
    hour: string;
    scheduled: number;
    completed: number;
    noShow: number;
  }>;
  roomUtilization: Array<{
    roomName: string;
    utilizationRate: number;
    totalAppointments: number;
    averageTurnoverTime: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    appointments: number;
    productivity: number;
    utilization: number;
  }>;
  operationalMetrics: {
    averageWaitTime: number;
    appointmentsPerDay: number;
    cancellationRate: number;
    rescheduleRate: number;
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

const formatMinutes = (value: number) => {
  return `${Math.round(value)} min`;
};

export function OperationalDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const queryParams = new URLSearchParams({
    startDate: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
    endDate: format(dateRange?.to || new Date(), 'yyyy-MM-dd'),
  });

  const { data: dashboard, isLoading } = useQuery<OperationalDashboardData>({
    queryKey: ["bi-operational", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/bi/operational?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch operational dashboard");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading operational analytics...</div>
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
            Operational & Staff Efficiency
          </h1>
          <p className="text-muted-foreground mt-1">
            Resource utilization and staff performance metrics
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Key Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Appointment Utilization"
          value={formatPercentage(dashboard.appointmentUtilization)}
          trend={dashboard.utilizationTrend}
          icon={<Target className="h-4 w-4" />}
          description="Scheduled capacity used"
        />
        <MetricCard
          title="Avg Appointment Time"
          value={formatMinutes(dashboard.averageAppointmentDuration)}
          trend={dashboard.durationTrend}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Staff Productivity"
          value={formatPercentage(dashboard.staffProductivity)}
          trend={dashboard.productivityTrend}
          icon={<Users className="h-4 w-4" />}
          description="Active time vs available"
        />
        <MetricCard
          title="No-Show Rate"
          value={formatPercentage(dashboard.noShowRate)}
          trend={dashboard.noShowRateTrend}
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance</CardTitle>
          <CardDescription>Individual performance metrics by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium">Staff Member</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Appointments</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Avg Duration</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.staffPerformance.map((staff, index) => (
                  <tr key={staff.staffName} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="px-4 py-3 text-sm font-medium">{staff.staffName}</td>
                    <td className="px-4 py-3 text-sm text-right">{staff.appointmentsCompleted}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatMinutes(staff.averageDuration)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(staff.revenueGenerated)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge 
                        variant={staff.patientSatisfaction >= 4.5 ? "default" : staff.patientSatisfaction >= 4.0 ? "secondary" : "destructive"}
                      >
                        {staff.patientSatisfaction.toFixed(1)} ⭐
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Appointments by Hour & Room Utilization */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Time of Day</CardTitle>
            <CardDescription>Hourly appointment distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dashboard.appointmentsByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill={COLORS.success} name="Completed" />
                <Bar dataKey="noShow" stackId="a" fill={COLORS.danger} name="No-Show" />
                <Line type="monotone" dataKey="scheduled" stroke={COLORS.primary} name="Scheduled" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
            <CardDescription>Efficiency by exam room</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.roomUtilization.map((room) => (
                <div key={room.roomName} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{room.roomName}</span>
                    <div className="text-right">
                      <div className="font-bold">{formatPercentage(room.utilizationRate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {room.totalAppointments} appointments
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        room.utilizationRate >= 80
                          ? "bg-green-500"
                          : room.utilizationRate >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${room.utilizationRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg turnover: {formatMinutes(room.averageTurnoverTime)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance Trends</CardTitle>
          <CardDescription>Appointments, productivity, and utilization over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="appointments"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Appointments"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="productivity"
                stroke={COLORS.success}
                strokeWidth={2}
                name="Productivity %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                stroke={COLORS.warning}
                strokeWidth={2}
                name="Utilization %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Additional Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(dashboard.operationalMetrics.averageWaitTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">Before appointment start</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appointments/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.operationalMetrics.appointmentsPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average daily volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(dashboard.operationalMetrics.cancellationRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">Of scheduled appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reschedule Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(dashboard.operationalMetrics.rescheduleRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">Appointments rescheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Operational Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {dashboard.noShowRate > 10 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>
                  <strong>High no-show rate:</strong> Consider implementing appointment reminders or requiring deposits for high-value appointments.
                </span>
              </li>
            )}
            {dashboard.appointmentUtilization < 70 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>
                  <strong>Low utilization:</strong> Review scheduling templates and consider optimizing appointment slots to match demand patterns.
                </span>
              </li>
            )}
            {dashboard.operationalMetrics.averageWaitTime > 15 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>
                  <strong>Long wait times:</strong> Analyze workflow bottlenecks and consider adjusting buffer times between appointments.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <span>
                Peak hours are clear - ensure adequate staff coverage during {dashboard.appointmentsByHour.reduce((max, hour) => 
                  hour.completed > max.completed ? hour : max
                ).hour}.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
