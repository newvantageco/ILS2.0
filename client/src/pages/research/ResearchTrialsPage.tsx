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
import { Plus, FileText, Download, Filter, Users, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Trial {
  id: string;
  trialId: string;
  title: string;
  sponsor: string;
  phase: string;
  status: string;
  principalInvestigator: string;
  startDate: string;
  endDate?: string;
  enrollmentTarget: number;
  currentEnrollment: number;
  sites: number;
  condition: string;
}

interface Participant {
  id: string;
  participantId: string;
  trialId: string;
  trialTitle: string;
  status: string;
  enrollmentDate: string;
  site: string;
  completionRate: number;
}

export default function ResearchTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trialsRes, participantsRes] = await Promise.all([
        fetch('/api/research/trials'),
        fetch('/api/research/participants'),
      ]);

      if (!trialsRes.ok || !participantsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const trialsData = await trialsRes.json();
      const participantsData = await participantsRes.json();

      setTrials(trialsData.data || []);
      setParticipants(participantsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load research data',
        variant: 'destructive',
      });

      // Mock data for demonstration
      setTrials([
        {
          id: '1',
          trialId: 'NCT-001234',
          title: 'Phase III Study of Novel Cardiac Drug',
          sponsor: 'CardioPharm Inc.',
          phase: 'Phase III',
          status: 'active',
          principalInvestigator: 'Dr. Sarah Johnson',
          startDate: '2024-01-15',
          endDate: '2026-01-15',
          enrollmentTarget: 500,
          currentEnrollment: 342,
          sites: 8,
          condition: 'Heart Failure',
        },
        {
          id: '2',
          trialId: 'NCT-001235',
          title: 'Diabetes Management Technology Trial',
          sponsor: 'DiaTech Solutions',
          phase: 'Phase II',
          status: 'active',
          principalInvestigator: 'Dr. Michael Chen',
          startDate: '2024-06-01',
          endDate: '2025-12-01',
          enrollmentTarget: 200,
          currentEnrollment: 87,
          sites: 4,
          condition: 'Type 2 Diabetes',
        },
        {
          id: '3',
          trialId: 'NCT-001236',
          title: 'Oncology Immunotherapy Study',
          sponsor: 'National Cancer Institute',
          phase: 'Phase I',
          status: 'recruiting',
          principalInvestigator: 'Dr. Emily Rodriguez',
          startDate: '2024-11-01',
          enrollmentTarget: 50,
          currentEnrollment: 12,
          sites: 2,
          condition: 'Lung Cancer',
        },
        {
          id: '4',
          trialId: 'NCT-001237',
          title: 'COVID-19 Vaccine Booster Study',
          sponsor: 'VaxCorp Global',
          phase: 'Phase III',
          status: 'completed',
          principalInvestigator: 'Dr. Robert Williams',
          startDate: '2023-03-01',
          endDate: '2024-09-30',
          enrollmentTarget: 1000,
          currentEnrollment: 1000,
          sites: 15,
          condition: 'COVID-19',
        },
        {
          id: '5',
          trialId: 'NCT-001238',
          title: 'Alzheimer\'s Disease Prevention Trial',
          sponsor: 'NeuroResearch Foundation',
          phase: 'Phase II',
          status: 'suspended',
          principalInvestigator: 'Dr. Lisa Anderson',
          startDate: '2024-02-15',
          enrollmentTarget: 300,
          currentEnrollment: 145,
          sites: 6,
          condition: 'Alzheimer\'s Disease',
        },
      ]);

      setParticipants([
        {
          id: '1',
          participantId: 'P-001234',
          trialId: 'NCT-001234',
          trialTitle: 'Phase III Study of Novel Cardiac Drug',
          status: 'active',
          enrollmentDate: '2024-02-15',
          site: 'University Hospital',
          completionRate: 75,
        },
        {
          id: '2',
          participantId: 'P-001235',
          trialId: 'NCT-001234',
          trialTitle: 'Phase III Study of Novel Cardiac Drug',
          status: 'active',
          enrollmentDate: '2024-03-01',
          site: 'Community Health Center',
          completionRate: 68,
        },
        {
          id: '3',
          participantId: 'P-001236',
          trialId: 'NCT-001235',
          trialTitle: 'Diabetes Management Technology Trial',
          status: 'active',
          enrollmentDate: '2024-07-10',
          site: 'Metro Clinic',
          completionRate: 42,
        },
        {
          id: '4',
          participantId: 'P-001237',
          trialId: 'NCT-001236',
          trialTitle: 'Oncology Immunotherapy Study',
          status: 'screening',
          enrollmentDate: '2024-11-15',
          site: 'Cancer Research Center',
          completionRate: 15,
        },
        {
          id: '5',
          participantId: 'P-001238',
          trialId: 'NCT-001234',
          trialTitle: 'Phase III Study of Novel Cardiac Drug',
          status: 'completed',
          enrollmentDate: '2024-01-20',
          site: 'University Hospital',
          completionRate: 100,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrials = trials.filter((trial) => {
    const statusMatch = statusFilter === 'all' || trial.status === statusFilter;
    const phaseMatch = phaseFilter === 'all' || trial.phase === phaseFilter;
    return statusMatch && phaseMatch;
  });

  const trialColumns: Column<Trial>[] = [
    {
      key: 'trialId',
      header: 'Trial ID',
      sortable: true,
      width: '120px',
      render: (trial) => (
        <span className="font-medium text-primary">{trial.trialId}</span>
      ),
    },
    {
      key: 'title',
      header: 'Study Title',
      sortable: true,
      render: (trial) => (
        <div>
          <p className="font-medium">{trial.title}</p>
          <p className="text-xs text-muted-foreground">{trial.condition}</p>
        </div>
      ),
    },
    {
      key: 'phase',
      header: 'Phase',
      sortable: true,
      width: '100px',
      render: (trial) => <Badge variant="outline">{trial.phase}</Badge>,
    },
    {
      key: 'sponsor',
      header: 'Sponsor',
      sortable: true,
    },
    {
      key: 'principalInvestigator',
      header: 'PI',
      sortable: true,
    },
    {
      key: 'enrollment',
      header: 'Enrollment',
      sortable: true,
      width: '150px',
      render: (trial) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{trial.currentEnrollment} / {trial.enrollmentTarget}</span>
            <span className="text-muted-foreground">
              {Math.round((trial.currentEnrollment / trial.enrollmentTarget) * 100)}%
            </span>
          </div>
          <Progress value={(trial.currentEnrollment / trial.enrollmentTarget) * 100} />
        </div>
      ),
    },
    {
      key: 'sites',
      header: 'Sites',
      sortable: true,
      width: '80px',
      render: (trial) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
          {trial.sites}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (trial) => <StatusBadge status={trial.status} />,
    },
  ];

  const participantColumns: Column<Participant>[] = [
    {
      key: 'participantId',
      header: 'Participant ID',
      sortable: true,
      width: '120px',
      render: (participant) => (
        <span className="font-medium text-primary">{participant.participantId}</span>
      ),
    },
    {
      key: 'trialTitle',
      header: 'Study',
      sortable: true,
      render: (participant) => (
        <div>
          <p className="font-medium">{participant.trialId}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">
            {participant.trialTitle}
          </p>
        </div>
      ),
    },
    {
      key: 'site',
      header: 'Site',
      sortable: true,
    },
    {
      key: 'enrollmentDate',
      header: 'Enrolled',
      sortable: true,
      render: (participant) => new Date(participant.enrollmentDate).toLocaleDateString(),
    },
    {
      key: 'completionRate',
      header: 'Progress',
      sortable: true,
      width: '150px',
      render: (participant) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Data Collection</span>
            <span className="text-muted-foreground">{participant.completionRate}%</span>
          </div>
          <Progress value={participant.completionRate} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (participant) => <StatusBadge status={participant.status} />,
    },
  ];

  const handleRowClick = (item: Trial | Participant) => {
    console.log('Navigate to detail:', item.id);
  };

  const handleCreateTrial = () => {
    console.log('Create new trial');
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your research data export is being prepared...',
    });
  };

  const statusCounts = {
    all: trials.length,
    recruiting: trials.filter((t) => t.status === 'recruiting').length,
    active: trials.filter((t) => t.status === 'active').length,
    suspended: trials.filter((t) => t.status === 'suspended').length,
    completed: trials.filter((t) => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading research data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Trials Management"
        description="Manage clinical research studies, participants, and data collection"
        breadcrumbs={[
          { label: 'Research', url: '/research/dashboard' },
          { label: 'Trials' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreateTrial}>
              <Plus className="mr-2 h-4 w-4" />
              New Trial
            </Button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className={statusFilter === 'all' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('all')}
            >
              View all
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'recruiting' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recruiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.recruiting}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('recruiting')}
            >
              View trials
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'active' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.active}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('active')}
            >
              View active
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'suspended' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.suspended}
            </div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('suspended')}
            >
              View suspended
            </Button>
          </CardContent>
        </Card>

        <Card className={statusFilter === 'completed' ? 'border-primary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setStatusFilter('completed')}
            >
              View completed
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Trials and Participants */}
      <Tabs defaultValue="trials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trials">Clinical Trials</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="trials" className="space-y-4">
          {/* Trials Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Research Studies</CardTitle>
                  <CardDescription>
                    {statusFilter === 'all'
                      ? 'All clinical trials'
                      : `Trials with status: ${statusFilter}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Phases</SelectItem>
                      <SelectItem value="Phase I">Phase I</SelectItem>
                      <SelectItem value="Phase II">Phase II</SelectItem>
                      <SelectItem value="Phase III">Phase III</SelectItem>
                      <SelectItem value="Phase IV">Phase IV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Trials</SelectItem>
                      <SelectItem value="recruiting">Recruiting</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredTrials}
                columns={trialColumns}
                searchable
                searchPlaceholder="Search trials..."
                onRowClick={handleRowClick}
                emptyMessage="No trials found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Study Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Study Metrics</CardTitle>
              <CardDescription>Key performance indicators across all trials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Enrollment</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {trials.reduce((sum, trial) => sum + trial.currentEnrollment, 0)}
                  </div>
                  <Progress
                    value={
                      (trials.reduce((sum, trial) => sum + trial.currentEnrollment, 0) /
                        trials.reduce((sum, trial) => sum + trial.enrollmentTarget, 0)) *
                      100
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Target: {trials.reduce((sum, trial) => sum + trial.enrollmentTarget, 0)}{' '}
                    participants
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sites</span>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {trials.reduce((sum, trial) => sum + trial.sites, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {trials.length} studies
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Completion</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      (trials.reduce(
                        (sum, trial) =>
                          sum + (trial.currentEnrollment / trial.enrollmentTarget) * 100,
                        0
                      ) /
                        trials.length) ||
                        0
                    )}
                    %
                  </div>
                  <Progress
                    value={
                      trials.reduce(
                        (sum, trial) =>
                          sum + (trial.currentEnrollment / trial.enrollmentTarget) * 100,
                        0
                      ) / trials.length
                    }
                  />
                  <p className="text-xs text-muted-foreground">Enrollment progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          {/* Participants Table */}
          <Card>
            <CardHeader>
              <CardTitle>Study Participants</CardTitle>
              <CardDescription>Enrolled participants across all studies</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={participants}
                columns={participantColumns}
                searchable
                searchPlaceholder="Search participants..."
                onRowClick={handleRowClick}
                emptyMessage="No participants found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Participant Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{participants.length}</div>
                <p className="text-xs text-muted-foreground">Across all studies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {participants.filter((p) => p.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently enrolled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    participants.reduce((sum, p) => sum + p.completionRate, 0) /
                      participants.length || 0
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Data collection</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common research management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Generate Protocol
            </Button>
            <Button variant="outline" className="justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Visit
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Adverse Event
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export Study Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
