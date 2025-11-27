import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Download,
  RefreshCw,
  Lock,
  AlertCircle,
  Building2,
  Activity,
  BarChart3,
  Database
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MarketInsight {
  id: string;
  insightType: string;
  category: string;
  title: string;
  description: string;
  region: string | null;
  periodStart: string;
  periodEnd: string;
  dataPoints: any[];
  companiesIncluded: number;
  accessLevel: string;
  price: string | null;
  status: string;
  createdAt: string;
}

interface PlatformStatistics {
  id: string;
  date: string;
  totalCompanies: number;
  activeCompanies: number;
  companiesByType: any;
  mrr: string;
  arr: string;
  ordersCreated: number;
  patientsAdded: number;
  invoicesGenerated: number;
  totalConnections: number;
  apiCallsTotal: number;
  apiErrorRate: string;
  uptimePercentage: string;
}

interface AggregatedMetric {
  id: string;
  metricType: string;
  category: string | null;
  region: string | null;
  count: number;
  sum: string;
  average: string;
  median: string;
  min: string;
  max: string;
  percentile25: string | null;
  percentile50: string | null;
  percentile75: string | null;
  percentile90: string | null;
  percentile95: string | null;
  sampleSize: number;
  lastRefreshed: string;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PlatformInsightsDashboard() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [statistics, setStatistics] = useState<PlatformStatistics[]>([]);
  const [metrics, setMetrics] = useState<AggregatedMetric[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Filter states
  const [insightTypeFilter, setInsightTypeFilter] = useState<string>('all');
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  // Check platform admin access
  useEffect(() => {
    if (user && user.role !== 'platform_admin') {
      toast({
        title: "Access Denied",
        description: "Platform admin access required",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load dashboard data
  useEffect(() => {
    if (user?.role === 'platform_admin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load overview dashboard
      const dashboardRes = await fetch('/api/platform-admin/dashboard', {
        credentials: 'include',
      });
      
      if (!dashboardRes.ok) throw new Error('Failed to load dashboard');
      const dashboardData = await dashboardRes.json();
      
      if (dashboardData.success) {
        setDashboardData(dashboardData.dashboard);
        setInsights(dashboardData.dashboard.recentInsights || []);
        setMetrics(dashboardData.dashboard.currentMetrics || []);
      }
      
      // Load statistics for the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const statsRes = await fetch(
        `/api/platform-admin/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { credentials: 'include' }
      );
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStatistics(statsData.statistics || []);
        }
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load platform data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const params = new URLSearchParams();
      if (insightTypeFilter !== 'all') params.set('insightType', insightTypeFilter);
      if (accessLevelFilter !== 'all') params.set('accessLevel', accessLevelFilter);
      
      const res = await fetch(`/api/platform-admin/insights?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to load insights');
      const data = await res.json();
      
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user?.role === 'platform_admin') {
      loadInsights();
    }
  }, [insightTypeFilter, accessLevelFilter]);

  const handleRefreshMetrics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/platform-admin/metrics/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to refresh metrics');
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: `Refreshed ${data.refreshedMetrics} metrics`,
        });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh metrics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportInsight = async (insightId: string) => {
    try {
      const res = await fetch(`/api/platform-admin/insights/${insightId}/export`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to export insight');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insight-${insightId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Insight exported successfully",
      });
    } catch (error) {
      console.error('Error exporting insight:', error);
      toast({
        title: "Error",
        description: "Failed to export insight",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInsight = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const res = await fetch('/api/platform-admin/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'invoice_pricing',
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate insight');
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Insight generated successfully",
        });
        loadInsights();
      }
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insight",
        variant: "destructive",
      });
    }
  };

  if (user?.role !== 'platform_admin') {
    return (
      <div className="container max-w-7xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-destructive">
              <Lock className="h-8 w-8" />
              <div>
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">
                  Platform admin access required to view this dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const latestStats = dashboardData?.latestStatistics;
  
  // Prepare chart data
  const revenueChartData = statistics.map(stat => ({
    date: new Date(stat.date).toLocaleDateString(),
    MRR: parseFloat(stat.mrr),
    ARR: parseFloat(stat.arr) / 12, // Monthly view
  })).reverse();
  
  const companyGrowthData = statistics.map(stat => ({
    date: new Date(stat.date).toLocaleDateString(),
    total: stat.totalCompanies,
    active: stat.activeCompanies,
  })).reverse();

  const companyTypeData = latestStats?.companiesByType ? 
    Object.entries(latestStats.companiesByType).map(([name, value]) => ({
      name,
      value: value as number
    })) : [];

  return (
    <div className="container max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Insights</h1>
          <p className="text-muted-foreground mt-1">
            Cross-tenant analytics and monetizable industry intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </Button>
          <Button onClick={handleGenerateInsight}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate New Insight
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {latestStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (MRR)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{parseFloat(latestStats.mrr).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ARR: £{parseFloat(latestStats.arr).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestStats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestStats.activeCompanies} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">B2B Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestStats.totalConnections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Network effect growth
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(latestStats.uptimePercentage).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestStats.apiCallsTotal.toLocaleString()} API calls
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="companies">Company Growth</TabsTrigger>
          <TabsTrigger value="distribution">Company Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue</CardTitle>
              <CardDescription>MRR and normalized ARR trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="MRR" stroke="#4F46E5" strokeWidth={2} />
                  <Line type="monotone" dataKey="ARR" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Growth</CardTitle>
              <CardDescription>Total and active companies over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#4F46E5" name="Total Companies" />
                  <Bar dataKey="active" fill="#10B981" name="Active Companies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Distribution by Type</CardTitle>
              <CardDescription>Breakdown of company types on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={companyTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {companyTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Market Insights</CardTitle>
              <CardDescription>
                Anonymized cross-tenant analytics for monetization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={insightTypeFilter} onValueChange={setInsightTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="patient_metrics">Patient Metrics</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={accessLevelFilter} onValueChange={setAccessLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No insights available with current filters</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div 
                  key={insight.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant={insight.accessLevel === 'free' ? 'secondary' : 'default'}>
                          {insight.accessLevel}
                        </Badge>
                        {insight.price && (
                          <Badge variant="outline">£{insight.price}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {insight.companiesIncluded} companies
                        </span>
                        <span>
                          {new Date(insight.periodStart).toLocaleDateString()} - {new Date(insight.periodEnd).toLocaleDateString()}
                        </span>
                        {insight.region && <span>Region: {insight.region}</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportInsight(insight.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aggregated Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Aggregated Metrics</CardTitle>
          <CardDescription>
            Pre-computed statistical metrics across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No metrics available. Click &ldquo;Refresh Metrics&rdquo; to compute.</p>
              </div>
            ) : (
              metrics.map((metric) => (
                <div 
                  key={metric.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{metric.metricType.replace(/_/g, ' ').toUpperCase()}</h3>
                    <Badge variant="secondary">{metric.sampleSize} companies</Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Average</p>
                      <p className="font-mono">{parseFloat(metric.average).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Median</p>
                      <p className="font-mono">{parseFloat(metric.median).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min</p>
                      <p className="font-mono">{parseFloat(metric.min).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max</p>
                      <p className="font-mono">{parseFloat(metric.max).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="text-xs">{new Date(metric.lastRefreshed).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
