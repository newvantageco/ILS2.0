import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award,
  Target,
  FileCheck,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  measures: {
    totalMeasures: number;
    hedis: number;
    mips: number;
    cqm: number;
    averagePerformance: number;
  };
  compliance: {
    activePrograms: number;
    pendingAttestations: number;
    upcomingAudits: number;
    completedTrainings: number;
  };
  improvement: {
    activeProjects: number;
    pdsCycles: number;
    careBundles: number;
    improvementRate: number;
  };
}

export default function QualityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/quality/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quality statistics',
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
        <h1 className="text-3xl font-bold tracking-tight">Quality Measures & Regulatory Compliance</h1>
        <p className="text-muted-foreground mt-2">
          HEDIS, MIPS, CQM reporting and compliance management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Measures</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.measures.totalMeasures || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.measures.averagePerformance || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Above national average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Programs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.compliance.activePrograms || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.compliance.pendingAttestations || 0} pending attestations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QI Projects</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.improvement.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.improvement.improvementRate || 0}% improvement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Measure Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Measure Performance</CardTitle>
          <CardDescription>Performance across measure types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Award className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium">HEDIS Measures</p>
                <p className="text-2xl font-bold">{stats?.measures.hedis || 0}</p>
                <p className="text-xs text-muted-foreground">Healthcare Effectiveness</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium">MIPS Measures</p>
                <p className="text-2xl font-bold">{stats?.measures.mips || 0}</p>
                <p className="text-xs text-muted-foreground">Merit-Based Incentive</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium">CQM Measures</p>
                <p className="text-2xl font-bold">{stats?.measures.cqm || 0}</p>
                <p className="text-xs text-muted-foreground">Clinical Quality</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Tabs defaultValue="measures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="measures">Quality Measures</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="improvement">Quality Improvement</TabsTrigger>
        </TabsList>

        <TabsContent value="measures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Measures Management</CardTitle>
              <CardDescription>Track and report quality metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/quality/measures/calculate'}>
                  <Target className="mr-2 h-4 w-4" />
                  Calculate Measures
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/measures'}>
                  View All Measures
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/measures/gaps'}>
                  Identify Gaps
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Measure Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• HEDIS (Healthcare Effectiveness)</li>
                    <li>• MIPS (Merit-Based Incentive)</li>
                    <li>• CQM (Clinical Quality Measures)</li>
                    <li>• Star Ratings</li>
                    <li>• Value-Based Programs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Reporting</h4>
                  <ul className="text-sm space-y-1">
                    <li>Total: {stats?.measures.totalMeasures || 0}</li>
                    <li>Performance: {stats?.measures.averagePerformance || 0}%</li>
                    <li>Submission Frequency: Quarterly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Measures */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Measures</CardTitle>
              <CardDescription>Measures exceeding benchmarks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">CDC - Diabetes HbA1c Testing</p>
                    <p className="text-sm text-muted-foreground">HEDIS | Comprehensive Diabetes Care</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-green-600">94.2%</span>
                    <Badge variant="success">Excellent</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">CBP - Controlling High Blood Pressure</p>
                    <p className="text-sm text-muted-foreground">HEDIS | Hypertension Control</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-green-600">89.7%</span>
                    <Badge variant="success">Excellent</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">BCS - Breast Cancer Screening</p>
                    <p className="text-sm text-muted-foreground">HEDIS | Preventive Care</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-green-600">85.3%</span>
                    <Badge variant="success">Good</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
              <CardDescription>HIPAA, MIPS, and compliance tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/quality/compliance/programs'}>
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Programs
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/compliance/audits'}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Schedule Audit
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/compliance/attestations'}>
                  Attestations
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Compliance Areas</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• HIPAA Privacy & Security</li>
                    <li>• MIPS Quality Payment Program</li>
                    <li>• Meaningful Use</li>
                    <li>• CMS Quality Programs</li>
                    <li>• State Regulations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <ul className="text-sm space-y-1">
                    <li>Active: {stats?.compliance.activePrograms || 0}</li>
                    <li>Pending: {stats?.compliance.pendingAttestations || 0}</li>
                    <li>Audits: {stats?.compliance.upcomingAudits || 0}</li>
                    <li>Training: {stats?.compliance.completedTrainings || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Program Status</CardTitle>
              <CardDescription>Current compliance program overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">HIPAA Security Assessment</p>
                      <p className="text-sm text-muted-foreground">Annual review completed</p>
                    </div>
                  </div>
                  <Badge variant="success">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">MIPS Reporting</p>
                      <p className="text-sm text-muted-foreground">Q4 submission due in 15 days</p>
                    </div>
                  </div>
                  <Badge>Pending</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Staff Training</p>
                      <p className="text-sm text-muted-foreground">98% completion rate</p>
                    </div>
                  </div>
                  <Badge variant="success">Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="improvement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Improvement Projects</CardTitle>
              <CardDescription>PDSA cycles and care bundles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/quality/improvement/projects/create'}>
                  <Award className="mr-2 h-4 w-4" />
                  New QI Project
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/improvement/pdsa'}>
                  PDSA Cycles
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/quality/improvement/bundles'}>
                  Care Bundles
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">QI Methodology</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• PDSA (Plan-Do-Study-Act)</li>
                    <li>• Six Sigma</li>
                    <li>• Lean Healthcare</li>
                    <li>• Evidence-Based Practice</li>
                    <li>• Best Practice Implementation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Project Metrics</h4>
                  <ul className="text-sm space-y-1">
                    <li>Active: {stats?.improvement.activeProjects || 0}</li>
                    <li>PDSA Cycles: {stats?.improvement.pdsCycles || 0}</li>
                    <li>Care Bundles: {stats?.improvement.careBundles || 0}</li>
                    <li>Improvement: +{stats?.improvement.improvementRate || 0}%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active QI Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Active QI Projects</CardTitle>
              <CardDescription>Current quality improvement initiatives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Reduce Hospital Readmissions</p>
                    <p className="text-sm text-muted-foreground">Target: 15% reduction | Current: 12%</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge>In Progress</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Improve Diabetes Control</p>
                    <p className="text-sm text-muted-foreground">Target: HbA1c <8% | Current: 87%</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge>In Progress</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Sepsis Care Bundle</p>
                    <p className="text-sm text-muted-foreground">3-hour bundle compliance: 92%</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Completed</Badge>
                    <Button size="sm" variant="outline">Report</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Important compliance and reporting deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">MIPS Q4 Data Submission</p>
                <p className="text-sm text-muted-foreground">Due: December 31, 2025</p>
              </div>
              <Badge variant="destructive">15 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">HEDIS Audit Preparation</p>
                <p className="text-sm text-muted-foreground">Due: January 15, 2026</p>
              </div>
              <Badge>30 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Annual HIPAA Risk Assessment</p>
                <p className="text-sm text-muted-foreground">Due: March 1, 2026</p>
              </div>
              <Badge variant="outline">90 days</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
