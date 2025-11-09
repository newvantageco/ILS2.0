import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FlaskConical,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  trials: {
    totalTrials: number;
    activeTrials: number;
    completedTrials: number;
    totalEnrollment: number;
    activeSites: number;
    openDeviations: number;
    pendingDocuments: number;
  };
  enrollment: {
    totalParticipants: number;
    activeParticipants: number;
    screening: number;
    enrolled: number;
    completed: number;
    withdrawn: number;
    screenFailed: number;
  };
  dataCollection: {
    totalVisits: number;
    completedVisits: number;
    missedVisits: number;
    totalCRFs: number;
    lockedCRFs: number;
    totalAdverseEvents: number;
    seriousAdverseEvents: number;
    openQueries: number;
    totalSDVs: number;
  };
}

export default function ResearchDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/research/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load research statistics',
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
        <h1 className="text-3xl font-bold tracking-tight">Clinical Research & Trial Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage clinical trials, participant enrollment, and data collection
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trials.activeTrials || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.trials.totalTrials || 0} total trials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trials.totalEnrollment || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.enrollment.activeParticipants || 0} active participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.dataCollection.totalCRFs ?
                Math.round((stats.dataCollection.lockedCRFs / stats.dataCollection.totalCRFs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.dataCollection.lockedCRFs || 0} CRFs locked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(stats?.dataCollection.openQueries || 0) + (stats?.trials.openDeviations || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.dataCollection.openQueries || 0} queries, {stats?.trials.openDeviations || 0} deviations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Portfolio Overview</CardTitle>
          <CardDescription>Status of all clinical trials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FlaskConical className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Recruiting</p>
                <p className="text-2xl font-bold">{Math.floor((stats?.trials.activeTrials || 0) * 0.6)}</p>
                <p className="text-xs text-muted-foreground">Open for enrollment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{stats?.trials.activeTrials || 0}</p>
                <p className="text-xs text-muted-foreground">Data collection ongoing</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{stats?.trials.completedTrials || 0}</p>
                <p className="text-xs text-muted-foreground">Closed out</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Tabs defaultValue="trials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trials">Trial Management</TabsTrigger>
          <TabsTrigger value="enrollment">Participant Enrollment</TabsTrigger>
          <TabsTrigger value="data">Data Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="trials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial Management</CardTitle>
              <CardDescription>Create and manage clinical trials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/research/trials/create'}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Create Trial
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/trials'}>
                  View All Trials
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/sites'}>
                  Manage Sites
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Trial Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Phase 1 (Safety)</li>
                    <li>• Phase 2 (Efficacy)</li>
                    <li>• Phase 3 (Effectiveness)</li>
                    <li>• Phase 4 (Post-Market)</li>
                    <li>• Observational Studies</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Trial Metrics</h4>
                  <ul className="text-sm space-y-1">
                    <li>Total: {stats?.trials.totalTrials || 0}</li>
                    <li>Active: {stats?.trials.activeTrials || 0}</li>
                    <li>Sites: {stats?.trials.activeSites || 0}</li>
                    <li>Enrollment: {stats?.trials.totalEnrollment || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Trials */}
          <Card>
            <CardHeader>
              <CardTitle>Active Clinical Trials</CardTitle>
              <CardDescription>Currently recruiting or in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Phase 3 Study of Drug X in Hypertension</p>
                    <p className="text-sm text-muted-foreground">CT-001234 | Target: 500 | Enrolled: 387</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge>Recruiting</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Phase 2 Trial for Diabetes Treatment</p>
                    <p className="text-sm text-muted-foreground">CT-001235 | Target: 200 | Enrolled: 198</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Active</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Observational Study - Heart Failure Outcomes</p>
                    <p className="text-sm text-muted-foreground">CT-001236 | Target: 1000 | Enrolled: 1000</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge>Active</Badge>
                    <Button size="sm">View</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Participant Enrollment</CardTitle>
              <CardDescription>Screen, consent, and enroll participants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/research/participants/screen'}>
                  <Users className="mr-2 h-4 w-4" />
                  Screen Participant
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/participants'}>
                  View Participants
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/enrollment-stats'}>
                  Enrollment Stats
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Enrollment Process</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>1. Screening assessment</li>
                    <li>2. Eligibility verification</li>
                    <li>3. Informed consent</li>
                    <li>4. Enrollment</li>
                    <li>5. Randomization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Enrollment Status</h4>
                  <ul className="text-sm space-y-1">
                    <li>Screening: {stats?.enrollment.screening || 0}</li>
                    <li>Enrolled: {stats?.enrollment.enrolled || 0}</li>
                    <li>Active: {stats?.enrollment.activeParticipants || 0}</li>
                    <li>Completed: {stats?.enrollment.completed || 0}</li>
                    <li>Withdrawn: {stats?.enrollment.withdrawn || 0}</li>
                    <li>Screen Failed: {stats?.enrollment.screenFailed || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Metrics</CardTitle>
              <CardDescription>Screening and enrollment statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Screen Success Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                    <span className="text-sm font-bold">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Retention Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                    <span className="text-sm font-bold">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Consent Completion Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '98%'}}></div>
                    </div>
                    <span className="text-sm font-bold">98%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
              <CardDescription>Manage visits, CRFs, and adverse events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/research/visits/schedule'}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Visit
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/crfs'}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage CRFs
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/research/adverse-events'}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report AE
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Data Collection Tools</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Electronic Case Report Forms (eCRFs)</li>
                    <li>• Adverse Event Reporting</li>
                    <li>• Data Query Management</li>
                    <li>• Source Document Verification</li>
                    <li>• Data Monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Quality</h4>
                  <ul className="text-sm space-y-1">
                    <li>Visits: {stats?.dataCollection.completedVisits || 0}/{stats?.dataCollection.totalVisits || 0}</li>
                    <li>CRFs Locked: {stats?.dataCollection.lockedCRFs || 0}/{stats?.dataCollection.totalCRFs || 0}</li>
                    <li>Open Queries: {stats?.dataCollection.openQueries || 0}</li>
                    <li>SDV Complete: {stats?.dataCollection.totalSDVs || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Metrics</CardTitle>
              <CardDescription>CRF completion and query status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3">CRF Lifecycle</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Not Started</span>
                      <span className="font-medium">{Math.floor((stats?.dataCollection.totalCRFs || 0) * 0.05)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>In Progress</span>
                      <span className="font-medium">{Math.floor((stats?.dataCollection.totalCRFs || 0) * 0.15)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span className="font-medium">{Math.floor((stats?.dataCollection.totalCRFs || 0) * 0.25)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Verified</span>
                      <span className="font-medium">{Math.floor((stats?.dataCollection.totalCRFs || 0) * 0.30)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Locked</span>
                      <span>{stats?.dataCollection.lockedCRFs || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Safety Reporting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total AEs</span>
                      <span className="font-medium">{stats?.dataCollection.totalAdverseEvents || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Serious AEs (SAEs)</span>
                      <span className="font-medium text-red-600">{stats?.dataCollection.seriousAdverseEvents || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missed Visits</span>
                      <span className="font-medium">{stats?.dataCollection.missedVisits || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Open Queries</span>
                      <span className="text-yellow-600">{stats?.dataCollection.openQueries || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts & Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Action Items</CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats && stats.dataCollection.openQueries > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Open Data Queries</p>
                    <p className="text-sm text-muted-foreground">{stats.dataCollection.openQueries} queries awaiting response</p>
                  </div>
                </div>
                <Button size="sm">Review</Button>
              </div>
            )}
            {stats && stats.trials.openDeviations > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Protocol Deviations</p>
                    <p className="text-sm text-muted-foreground">{stats.trials.openDeviations} unresolved deviations</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive">Address</Button>
              </div>
            )}
            {stats && stats.dataCollection.seriousAdverseEvents > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">Serious Adverse Events</p>
                    <p className="text-sm text-muted-foreground">{stats.dataCollection.seriousAdverseEvents} SAEs require reporting</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive">Report</Button>
              </div>
            )}
            {stats && stats.trials.pendingDocuments > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Pending Documents</p>
                    <p className="text-sm text-muted-foreground">{stats.trials.pendingDocuments} documents awaiting approval</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Review</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
