import { useState, useEffect } from 'react';
import { PageHeader, DataTable, StatusBadge, Column } from '@/components/healthcare';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QualityMeasure {
  id: string;
  measureId: string;
  measureName: string;
  measureType: string;
  category: string;
  numerator: number;
  denominator: number;
  performance: number;
  target: number;
  status: string;
  reportingPeriod: string;
  lastUpdated: string;
}

interface PatientGap {
  id: string;
  patientId: string;
  patientName: string;
  measureId: string;
  measureName: string;
  gapType: string;
  dueDate: string;
  priority: string;
  status: string;
}

interface MeasureSubmission {
  id: string;
  submissionId: string;
  registry: string;
  measures: number;
  patients: number;
  submissionDate: string;
  reportingPeriod: string;
  status: string;
  confirmationNumber?: string;
}

export default function QualityMeasuresPage() {
  const [measures, setMeasures] = useState<QualityMeasure[]>([]);
  const [gaps, setGaps] = useState<PatientGap[]>([]);
  const [submissions, setSubmissions] = useState<MeasureSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [measuresRes, gapsRes, submissionsRes] = await Promise.all([
        fetch('/api/quality/measures'),
        fetch('/api/quality/gaps'),
        fetch('/api/quality/submissions'),
      ]);

      if (!measuresRes.ok || !gapsRes.ok || !submissionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const measuresData = await measuresRes.json();
      const gapsData = await gapsRes.json();
      const submissionsData = await submissionsRes.json();

      setMeasures(measuresData.data || []);
      setGaps(gapsData.data || []);
      setSubmissions(submissionsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quality measures data',
        variant: 'destructive',
      });

      // Mock data for demonstration
      setMeasures([
        {
          id: '1',
          measureId: 'HEDIS-BCS',
          measureName: 'Breast Cancer Screening',
          measureType: 'HEDIS',
          category: 'Preventive Care',
          numerator: 456,
          denominator: 520,
          performance: 87.7,
          target: 85.0,
          status: 'met',
          reportingPeriod: '2025 Q3',
          lastUpdated: '2025-11-08',
        },
        {
          id: '2',
          measureId: 'MIPS-117',
          measureName: 'Diabetes: Eye Exam',
          measureType: 'MIPS',
          category: 'Chronic Care',
          numerator: 234,
          denominator: 310,
          performance: 75.5,
          target: 80.0,
          status: 'below_target',
          reportingPeriod: '2025 Q3',
          lastUpdated: '2025-11-08',
        },
        {
          id: '3',
          measureId: 'CQM-165',
          measureName: 'Controlling High Blood Pressure',
          measureType: 'CQM',
          category: 'Chronic Care',
          numerator: 678,
          denominator: 780,
          performance: 86.9,
          target: 85.0,
          status: 'met',
          reportingPeriod: '2025 Q3',
          lastUpdated: '2025-11-07',
        },
        {
          id: '4',
          measureId: 'HEDIS-CDC',
          measureName: 'Comprehensive Diabetes Care',
          measureType: 'HEDIS',
          category: 'Chronic Care',
          numerator: 345,
          denominator: 420,
          performance: 82.1,
          target: 85.0,
          status: 'below_target',
          reportingPeriod: '2025 Q3',
          lastUpdated: '2025-11-06',
        },
        {
          id: '5',
          measureId: 'MIPS-236',
          measureName: 'Controlling High Blood Pressure',
          measureType: 'MIPS',
          category: 'Chronic Care',
          numerator: 567,
          denominator: 645,
          performance: 87.9,
          target: 85.0,
          status: 'met',
          reportingPeriod: '2025 Q3',
          lastUpdated: '2025-11-05',
        },
      ]);

      setGaps([
        {
          id: '1',
          patientId: 'PT-001234',
          patientName: 'Mary Johnson',
          measureId: 'HEDIS-BCS',
          measureName: 'Breast Cancer Screening',
          gapType: 'Overdue Screening',
          dueDate: '2025-10-15',
          priority: 'high',
          status: 'pending',
        },
        {
          id: '2',
          patientId: 'PT-001235',
          patientName: 'Robert Smith',
          measureId: 'MIPS-117',
          measureName: 'Diabetes: Eye Exam',
          gapType: 'Missing Annual Exam',
          dueDate: '2025-11-30',
          priority: 'medium',
          status: 'pending',
        },
        {
          id: '3',
          patientId: 'PT-001236',
          patientName: 'Sarah Williams',
          measureId: 'HEDIS-CDC',
          measureName: 'Diabetes HbA1c Testing',
          gapType: 'Overdue Lab Work',
          dueDate: '2025-11-01',
          priority: 'high',
          status: 'pending',
        },
        {
          id: '4',
          patientId: 'PT-001237',
          patientName: 'James Brown',
          measureId: 'CQM-165',
          measureName: 'Blood Pressure Control',
          gapType: 'Missing Follow-up',
          dueDate: '2025-11-20',
          priority: 'medium',
          status: 'contacted',
        },
        {
          id: '5',
          patientId: 'PT-001238',
          patientName: 'Linda Davis',
          measureId: 'HEDIS-BCS',
          measureName: 'Breast Cancer Screening',
          gapType: 'Overdue Screening',
          dueDate: '2025-09-30',
          priority: 'critical',
          status: 'pending',
        },
      ]);

      setSubmissions([
        {
          id: '1',
          submissionId: 'SUB-2025-Q3-001',
          registry: 'CMS MIPS',
          measures: 12,
          patients: 1250,
          submissionDate: '2025-10-15',
          reportingPeriod: '2025 Q3',
          status: 'completed',
          confirmationNumber: 'MIPS-CONF-789456123',
        },
        {
          id: '2',
          submissionId: 'SUB-2025-Q2-002',
          registry: 'HEDIS',
          measures: 8,
          patients: 980,
          submissionDate: '2025-07-20',
          reportingPeriod: '2025 Q2',
          status: 'completed',
          confirmationNumber: 'HEDIS-CONF-456123789',
        },
        {
          id: '3',
          submissionId: 'SUB-2025-Q3-003',
          registry: 'PQRS',
          measures: 10,
          patients: 1100,
          submissionDate: '2025-10-30',
          reportingPeriod: '2025 Q3',
          status: 'pending',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeasures =
    categoryFilter === 'all'
      ? measures
      : measures.filter((measure) => measure.category === categoryFilter);

  const measureColumns: Column<QualityMeasure>[] = [
    {
      key: 'measureId',
      header: 'Measure ID',
      sortable: true,
      width: '140px',
      render: (measure) => (
        <div>
          <span className="font-medium text-primary">{measure.measureId}</span>
          <p className="text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="text-xs">
              {measure.measureType}
            </Badge>
          </p>
        </div>
      ),
    },
    {
      key: 'measureName',
      header: 'Measure Name',
      sortable: true,
      render: (measure) => (
        <div>
          <p className="font-medium">{measure.measureName}</p>
          <p className="text-xs text-muted-foreground">{measure.category}</p>
        </div>
      ),
    },
    {
      key: 'performance',
      header: 'Performance',
      sortable: true,
      width: '180px',
      render: (measure) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{measure.performance.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">
              Target: {measure.target.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={measure.performance}
            className={
              measure.performance >= measure.target
                ? '[&>div]:bg-green-600'
                : '[&>div]:bg-orange-600'
            }
          />
          <p className="text-xs text-muted-foreground">
            {measure.numerator} / {measure.denominator} patients
          </p>
        </div>
      ),
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      width: '80px',
      render: (measure) => (
        <div className="flex items-center justify-center">
          {measure.performance >= measure.target ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-orange-600" />
          )}
        </div>
      ),
    },
    {
      key: 'reportingPeriod',
      header: 'Period',
      sortable: true,
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (measure) => <StatusBadge status={measure.status} />,
    },
  ];

  const gapColumns: Column<PatientGap>[] = [
    {
      key: 'patientId',
      header: 'Patient ID',
      sortable: true,
      width: '120px',
      render: (gap) => <span className="font-medium text-primary">{gap.patientId}</span>,
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      sortable: true,
    },
    {
      key: 'measureName',
      header: 'Measure',
      sortable: true,
      render: (gap) => (
        <div>
          <p className="font-medium text-sm">{gap.measureId}</p>
          <p className="text-xs text-muted-foreground">{gap.measureName}</p>
        </div>
      ),
    },
    {
      key: 'gapType',
      header: 'Gap Type',
      sortable: true,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (gap) => {
        const dueDate = new Date(gap.dueDate);
        const isOverdue = dueDate < new Date();
        return (
          <div className="flex items-center gap-2">
            {isOverdue && <AlertCircle className="h-4 w-4 text-red-600" />}
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {dueDate.toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      width: '120px',
      render: (gap) => <StatusBadge status={gap.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (gap) => <StatusBadge status={gap.status} />,
    },
  ];

  const submissionColumns: Column<MeasureSubmission>[] = [
    {
      key: 'submissionId',
      header: 'Submission ID',
      sortable: true,
      width: '160px',
      render: (submission) => (
        <span className="font-medium text-primary">{submission.submissionId}</span>
      ),
    },
    {
      key: 'registry',
      header: 'Registry',
      sortable: true,
      render: (submission) => <Badge variant="outline">{submission.registry}</Badge>,
    },
    {
      key: 'measures',
      header: 'Measures',
      sortable: true,
      width: '100px',
      render: (submission) => (
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span>{submission.measures}</span>
        </div>
      ),
    },
    {
      key: 'patients',
      header: 'Patients',
      sortable: true,
      width: '100px',
    },
    {
      key: 'reportingPeriod',
      header: 'Period',
      sortable: true,
    },
    {
      key: 'submissionDate',
      header: 'Submitted',
      sortable: true,
      render: (submission) => new Date(submission.submissionDate).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (submission) => <StatusBadge status={submission.status} />,
    },
  ];

  const handleRowClick = (item: QualityMeasure | PatientGap | MeasureSubmission) => {
    console.log('Navigate to detail:', item.id);
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your quality measures export is being prepared...',
    });
  };

  const handleSubmit = () => {
    toast({
      title: 'Submission Initiated',
      description: 'Preparing quality measures for registry submission...',
    });
  };

  const totalMeasures = measures.length;
  const metTarget = measures.filter((m) => m.status === 'met').length;
  const belowTarget = measures.filter((m) => m.status === 'below_target').length;
  const avgPerformance =
    measures.reduce((sum, m) => sum + m.performance, 0) / measures.length || 0;
  const openGaps = gaps.filter((g) => g.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quality measures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Measures Management"
        description="Track and manage clinical quality measures and performance"
        breadcrumbs={[
          { label: 'Quality & Compliance', url: '/quality/dashboard' },
          { label: 'Measures' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleSubmit}>
              <Target className="mr-2 h-4 w-4" />
              Submit to Registry
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Measures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeasures}</div>
            <p className="text-xs text-muted-foreground">Being tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Met Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metTarget}</div>
            <p className="text-xs text-muted-foreground">
              {((metTarget / totalMeasures) * 100).toFixed(0)}% of measures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all measures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Care Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openGaps}</div>
            <p className="text-xs text-muted-foreground">Require closure</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Summary of measure performance status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Met Target</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{metTarget}</div>
              <Progress value={(metTarget / totalMeasures) * 100} className="[&>div]:bg-green-600" />
              <p className="text-xs text-muted-foreground">
                {((metTarget / totalMeasures) * 100).toFixed(1)}% of measures
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Below Target</span>
                <XCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600">{belowTarget}</div>
              <Progress
                value={(belowTarget / totalMeasures) * 100}
                className="[&>div]:bg-orange-600"
              />
              <p className="text-xs text-muted-foreground">
                {((belowTarget / totalMeasures) * 100).toFixed(1)}% of measures
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Score</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold">{avgPerformance.toFixed(1)}%</div>
              <Progress value={avgPerformance} />
              <p className="text-xs text-muted-foreground">Overall performance rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="measures" className="space-y-4">
        <TabsList>
          <TabsTrigger value="measures">Quality Measures</TabsTrigger>
          <TabsTrigger value="gaps">Care Gaps</TabsTrigger>
          <TabsTrigger value="submissions">Registry Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="measures" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quality Measures Library</CardTitle>
                  <CardDescription>
                    {categoryFilter === 'all' ? 'All measures' : categoryFilter}
                  </CardDescription>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Preventive Care">Preventive Care</SelectItem>
                    <SelectItem value="Chronic Care">Chronic Care</SelectItem>
                    <SelectItem value="Acute Care">Acute Care</SelectItem>
                    <SelectItem value="Patient Safety">Patient Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredMeasures}
                columns={measureColumns}
                searchable
                searchPlaceholder="Search measures..."
                onRowClick={handleRowClick}
                emptyMessage="No measures found"
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Care Gap Analysis</CardTitle>
              <CardDescription>Patients with open care gaps requiring intervention</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={gaps}
                columns={gapColumns}
                searchable
                searchPlaceholder="Search care gaps..."
                onRowClick={handleRowClick}
                emptyMessage="No care gaps found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Critical Gaps */}
          {gaps.filter((g) => g.priority === 'critical' && g.status === 'pending').length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Critical Care Gaps
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gaps
                    .filter((g) => g.priority === 'critical' && g.status === 'pending')
                    .map((gap) => (
                      <div
                        key={gap.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{gap.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {gap.measureName} - {gap.gapType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(gap.dueDate).toLocaleDateString()} (Overdue)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Schedule
                          </Button>
                          <Button size="sm">Contact Patient</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registry Submissions</CardTitle>
              <CardDescription>Quality measure submissions to reporting registries</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={submissions}
                columns={submissionColumns}
                searchable
                searchPlaceholder="Search submissions..."
                onRowClick={handleRowClick}
                emptyMessage="No submissions found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Submission Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Statistics</CardTitle>
              <CardDescription>Registry submission activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Submissions</span>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                  <p className="text-xs text-muted-foreground">This reporting period</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {submissions.filter((s) => s.status === 'completed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Successfully submitted</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Patients</span>
                    <Badge>{submissions.reduce((sum, s) => sum + s.patients, 0)}</Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {submissions.reduce((sum, s) => sum + s.measures, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total measures submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common quality measures management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Target className="mr-2 h-4 w-4" />
              Run Gap Analysis
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="justify-start">
              <CheckCircle className="mr-2 h-4 w-4" />
              Close Care Gaps
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Trends
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
