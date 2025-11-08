import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Heart,
  Activity,
  Target,
  ClipboardList,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  risk: {
    totalPatients: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    activeModels: number;
  };
  care: {
    activePlans: number;
    openGaps: number;
    transitionsThisMonth: number;
    careTeams: number;
  };
  chronic: {
    activeRegistries: number;
    enrolledPatients: number;
    activePrograms: number;
    averageCompliance: number;
  };
}

export default function PopulationHealthDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/population-health/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load population health statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Population Health Management</h1>
        <p className="text-muted-foreground mt-2">
          Risk stratification, care coordination, and chronic disease management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.risk.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              In risk stratification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Patients</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.risk.highRisk || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Care Plans</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.care.activePlans || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.care.openGaps || 0} care gaps open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled in Programs</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chronic.enrolledPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.chronic.activePrograms || 0} active programs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Patient population by risk level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium">Critical Risk</p>
                <p className="text-2xl font-bold">{Math.floor((stats?.risk.highRisk || 0) * 0.3)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium">High Risk</p>
                <p className="text-2xl font-bold">{stats?.risk.highRisk || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Medium Risk</p>
                <p className="text-2xl font-bold">{stats?.risk.mediumRisk || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium">Low Risk</p>
                <p className="text-2xl font-bold">{stats?.risk.lowRisk || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risk">Risk Stratification</TabsTrigger>
          <TabsTrigger value="care">Care Coordination</TabsTrigger>
          <TabsTrigger value="chronic">Chronic Disease</TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Stratification</CardTitle>
              <CardDescription>Identify and manage high-risk patients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/population-health/risk/calculate'}>
                  <Target className="mr-2 h-4 w-4" />
                  Calculate Risk Scores
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/risk'}>
                  View Risk Scores
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/risk/models'}>
                  Manage Models
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Risk Categories</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Hospitalization risk</li>
                    <li>• Readmission risk</li>
                    <li>• Emergency department utilization</li>
                    <li>• Cost prediction</li>
                    <li>• Disease progression</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Predictive Models</h4>
                  <ul className="text-sm space-y-1">
                    <li>Active Models: {stats?.risk.activeModels || 0}</li>
                    <li>Model Types: Machine Learning, Statistical</li>
                    <li>Update Frequency: Monthly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Risk Patients */}
          <Card>
            <CardHeader>
              <CardTitle>High Risk Patients</CardTitle>
              <CardDescription>Patients requiring immediate intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">CHF, Diabetes | Score: 95</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">Critical</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-sm text-muted-foreground">COPD, HTN | Score: 88</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">High</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Bob Johnson</p>
                    <p className="text-sm text-muted-foreground">CKD, CAD | Score: 82</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">High</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Care Coordination</CardTitle>
              <CardDescription>Manage care plans and close care gaps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/population-health/care/plans/create'}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Create Care Plan
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/care/gaps'}>
                  View Care Gaps
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/care/teams'}>
                  Manage Teams
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Care Plan Types</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Chronic Disease</Badge>
                    <Badge variant="outline">Preventive</Badge>
                    <Badge variant="outline">Transitional</Badge>
                    <Badge variant="outline">Behavioral Health</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <ul className="text-sm space-y-1">
                    <li>Active Plans: {stats?.care.activePlans || 0}</li>
                    <li>Care Gaps: {stats?.care.openGaps || 0}</li>
                    <li>Transitions: {stats?.care.transitionsThisMonth || 0}</li>
                    <li>Care Teams: {stats?.care.careTeams || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chronic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chronic Disease Management</CardTitle>
              <CardDescription>Registry-based disease management programs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/population-health/chronic/registries'}>
                  <Activity className="mr-2 h-4 w-4" />
                  View Registries
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/chronic/programs'}>
                  Manage Programs
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/population-health/chronic/enroll'}>
                  Enroll Patients
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Active Registries</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Diabetes Registry</li>
                    <li>• Hypertension Registry</li>
                    <li>• COPD Registry</li>
                    <li>• Heart Failure Registry</li>
                    <li>• CKD Registry</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Program Metrics</h4>
                  <ul className="text-sm space-y-1">
                    <li>Enrolled: {stats?.chronic.enrolledPatients || 0}</li>
                    <li>Programs: {stats?.chronic.activePrograms || 0}</li>
                    <li>Compliance: {stats?.chronic.averageCompliance || 0}%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disease Registry Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Disease Registry Overview</CardTitle>
              <CardDescription>Patient enrollment by disease registry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Diabetes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">1,245 patients</span>
                    <Badge>Active</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Hypertension</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">2,156 patients</span>
                    <Badge>Active</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium">COPD</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">456 patients</span>
                    <Badge>Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Care Gaps Alert */}
      <Card>
        <CardHeader>
          <CardTitle>Open Care Gaps</CardTitle>
          <CardDescription>Quality measures requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats && stats.care.openGaps > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">HbA1c Test Overdue</p>
                      <p className="text-sm text-muted-foreground">156 diabetic patients need testing</p>
                    </div>
                  </div>
                  <Button size="sm">Outreach</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">BP Control</p>
                      <p className="text-sm text-muted-foreground">89 HTN patients above target</p>
                    </div>
                  </div>
                  <Button size="sm">Review</Button>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No open care gaps</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
