/**
 * Advanced Healthcare Analytics Dashboard
 * 
 * Features:
 * - Real-time clinical metrics
 * - Interactive data visualizations
 * - NHS-compliant design system
 * - Mobile-responsive layout
 * - Export capabilities
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart, 
  Activity,
  Target,
  Award,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  BarChart3,
  LineChart,
  PieChart,
  FileText
} from "lucide-react";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const clinicalOutcomesData = [
  { month: "Jan", treatmentSuccess: 88, readmissionRate: 4.2, patientSatisfaction: 92 },
  { month: "Feb", treatmentSuccess: 90, readmissionRate: 3.8, patientSatisfaction: 93 },
  { month: "Mar", treatmentSuccess: 89, readmissionRate: 3.5, patientSatisfaction: 94 },
  { month: "Apr", treatmentSuccess: 91, readmissionRate: 3.2, patientSatisfaction: 95 },
  { month: "May", treatmentSuccess: 92, readmissionRate: 3.0, patientSatisfaction: 94 },
  { month: "Jun", treatmentSuccess: 93, readmissionRate: 2.8, patientSatisfaction: 96 }
];

const populationHealthData = [
  { name: "Diabetes", value: 245, color: "#005EB8" },
  { name: "Hypertension", value: 189, color: "#00A678" },
  { name: "Asthma", value: 156, color: "#FFB81C" },
  { name: "Heart Disease", value: 98, color: "#C5352A" },
  { name: "Other", value: 234, color: "#704C9C" }
];

const qualityMetricsData = [
  { metric: "Clinical Guidelines", current: 94, target: 95 },
  { metric: "Patient Safety", current: 96, target: 98 },
  { metric: "Documentation", current: 88, target: 90 },
  { metric: "Follow-up Care", current: 91, target: 93 },
  { metric: "Medication Safety", current: 97, target: 99 }
];

const COLORS = ['#005EB8', '#00A678', '#FFB81C', '#C5352A', '#704C9C'];

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, description, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -mr-16 -mt-16`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
            {Math.abs(trend)}%
          </span>
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function HealthcareAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const { toast } = useToast();

  // Mock API calls - replace with actual endpoints
  const { data: clinicalMetrics, isLoading: clinicalLoading } = useQuery({
    queryKey: ["/api/healthcare-analytics/clinical-outcomes", selectedPeriod],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        treatmentSuccessRate: 92.3,
        readmissionRate: 2.8,
        patientSatisfaction: 94.5,
        averageLengthOfStay: 4.2
      };
    }
  });

  const { data: populationMetrics, isLoading: populationLoading } = useQuery({
    queryKey: ["/api/healthcare-analytics/population-health", selectedPeriod],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalPatients: 2847,
        activePatients: 2156,
        chronicConditions: 523,
        preventiveCare: 78.9
      };
    }
  });

  const { data: qualityMetrics, isLoading: qualityLoading } = useQuery({
    queryKey: ["/api/healthcare-analytics/quality-reporting", selectedPeriod],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        overallCompliance: 94.2,
        guidelineAdherence: 91.8,
        safetyIncidents: 3,
        documentationQuality: 88.5
      };
    }
  });

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export Started",
      description: `Your analytics report is being exported as ${format.toUpperCase()}`,
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Healthcare Analytics</h1>
            <p className="text-gray-600">Comprehensive clinical and operational insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Treatment Success Rate"
            value={clinicalMetrics?.treatmentSuccessRate || 0}
            trend={2.1}
            icon={<Target className="h-4 w-4 text-blue-600" />}
            description="from last period"
            color="bg-blue-600"
          />
          <MetricCard
            title="Active Patients"
            value={populationMetrics?.activePatients || 0}
            trend={5.3}
            icon={<Users className="h-4 w-4 text-green-600" />}
            description="growth rate"
            color="bg-green-600"
          />
          <MetricCard
            title="Quality Compliance"
            value={qualityMetrics?.overallCompliance || 0}
            trend={1.2}
            icon={<Award className="h-4 w-4 text-purple-600" />}
            description="improvement"
            color="bg-purple-600"
          />
          <MetricCard
            title="Critical Alerts"
            value={12}
            trend={-8.5}
            icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
            description="reduction"
            color="bg-orange-600"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clinical-outcomes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinical-outcomes">Clinical Outcomes</TabsTrigger>
            <TabsTrigger value="population-health">Population Health</TabsTrigger>
            <TabsTrigger value="quality-reporting">Quality Reporting</TabsTrigger>
            <TabsTrigger value="financial">Financial Analytics</TabsTrigger>
            <TabsTrigger value="operational">Operational Efficiency</TabsTrigger>
          </TabsList>

          {/* Clinical Outcomes Tab */}
          <TabsContent value="clinical-outcomes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Treatment Outcomes Trend
                  </CardTitle>
                  <CardDescription>Monthly performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={clinicalOutcomesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="treatmentSuccess" stackId="1" stroke="#005EB8" fill="#005EB8" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="patientSatisfaction" stackId="2" stroke="#00A678" fill="#00A678" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    Readmission Rate Analysis
                  </CardTitle>
                  <CardDescription>30-day readmission trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={clinicalOutcomesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="readmissionRate" stroke="#C5352A" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Dashboard</CardTitle>
                <CardDescription>Compliance with clinical guidelines</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={qualityMetricsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="current" stroke="#005EB8" fill="#005EB8" fillOpacity={0.6} />
                    <Radar name="Target" dataKey="target" stroke="#00A678" fill="#00A678" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Population Health Tab */}
          <TabsContent value="population-health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    Patient Population Overview
                  </CardTitle>
                  <CardDescription>Demographics and health conditions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{populationMetrics?.totalPatients}</div>
                      <div className="text-sm text-gray-600">Total Patients</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{populationMetrics?.activePatients}</div>
                      <div className="text-sm text-gray-600">Active Patients</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={populationHealthData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {populationHealthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preventive Care Metrics</CardTitle>
                  <CardDescription>Screening and vaccination coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Annual Check-ups</span>
                      <Badge variant="secondary">78%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vaccination Coverage</span>
                      <Badge variant="secondary">85%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Health Screenings</span>
                      <Badge variant="secondary">72%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quality Reporting Tab */}
          <TabsContent value="quality-reporting" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-500" />
                    Overall Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {qualityMetrics?.overallCompliance}%
                    </div>
                    <p className="text-sm text-gray-600">Meeting quality standards</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {qualityMetrics?.safetyIncidents}
                    </div>
                    <p className="text-sm text-gray-600">This month</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {qualityMetrics?.documentationQuality}%
                    </div>
                    <p className="text-sm text-gray-600">Complete records</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Analytics Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                  Financial Performance
                </CardTitle>
                <CardDescription>Revenue and cost analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Financial analytics coming soon</p>
                  <p className="text-sm text-gray-500">Integration with billing system in progress</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operational Efficiency Tab */}
          <TabsContent value="operational" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2 text-purple-500" />
                  Operational Metrics
                </CardTitle>
                <CardDescription>Practice efficiency and workflow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Operational analytics coming soon</p>
                  <p className="text-sm text-gray-500">Resource utilization tracking in development</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
