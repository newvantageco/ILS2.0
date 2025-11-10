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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Activity,
  Heart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Filter,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MonitoredPatient {
  id: string;
  patientId: string;
  patientName: string;
  program: string;
  enrollmentDate: string;
  status: string;
  lastReading: string;
  complianceRate: number;
  activeAlerts: number;
  deviceAssigned: string;
}

interface VitalReading {
  id: string;
  patientName: string;
  vitalType: string;
  value: string;
  unit: string;
  timestamp: string;
  status: string;
  trend?: 'up' | 'down' | 'stable';
  threshold?: string;
}

interface Alert {
  id: string;
  patientName: string;
  vitalType: string;
  value: string;
  threshold: string;
  severity: string;
  timestamp: string;
  status: string;
}

export default function RemoteMonitoringPage() {
  const [patients, setPatients] = useState<MonitoredPatient[]>([]);
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [enrollPatientOpen, setEnrollPatientOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, readingsRes, alertsRes] = await Promise.all([
        fetch('/api/mhealth/monitoring/patients'),
        fetch('/api/mhealth/monitoring/readings'),
        fetch('/api/mhealth/monitoring/alerts'),
      ]);

      if (!patientsRes.ok || !readingsRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const patientsData = await patientsRes.json();
      const readingsData = await readingsRes.json();
      const alertsData = await alertsRes.json();

      setPatients(patientsData.data || []);
      setReadings(readingsData.data || []);
      setAlerts(alertsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive',
      });

      // Mock data for demonstration
      setPatients([
        {
          id: '1',
          patientId: 'PT-001234',
          patientName: 'John Doe',
          program: 'Hypertension Management',
          enrollmentDate: '2025-09-15',
          status: 'active',
          lastReading: '2025-11-08 08:30',
          complianceRate: 92,
          activeAlerts: 2,
          deviceAssigned: 'BP Monitor - BPM-4521',
        },
        {
          id: '2',
          patientId: 'PT-001235',
          patientName: 'Jane Smith',
          program: 'Diabetes Care',
          enrollmentDate: '2025-08-20',
          status: 'active',
          lastReading: '2025-11-08 07:15',
          complianceRate: 98,
          activeAlerts: 0,
          deviceAssigned: 'Glucometer - GLU-7893',
        },
        {
          id: '3',
          patientId: 'PT-001236',
          patientName: 'Bob Wilson',
          program: 'Heart Failure Monitoring',
          enrollmentDate: '2025-10-01',
          status: 'active',
          lastReading: '2025-11-07 18:45',
          complianceRate: 75,
          activeAlerts: 1,
          deviceAssigned: 'Weight Scale - WSC-3321',
        },
        {
          id: '4',
          patientId: 'PT-001237',
          patientName: 'Alice Johnson',
          program: 'COPD Management',
          enrollmentDate: '2025-09-01',
          status: 'suspended',
          lastReading: '2025-11-03 12:00',
          complianceRate: 45,
          activeAlerts: 3,
          deviceAssigned: 'Pulse Oximeter - POX-1156',
        },
        {
          id: '5',
          patientId: 'PT-001238',
          patientName: 'Charlie Brown',
          program: 'Post-Surgical Recovery',
          enrollmentDate: '2025-10-15',
          status: 'completed',
          lastReading: '2025-11-07 09:20',
          complianceRate: 100,
          activeAlerts: 0,
          deviceAssigned: 'Multi-vital Monitor - MVM-9982',
        },
      ]);

      setReadings([
        {
          id: '1',
          patientName: 'John Doe',
          vitalType: 'Blood Pressure',
          value: '145/92',
          unit: 'mmHg',
          timestamp: '2025-11-08 08:30',
          status: 'high',
          trend: 'up',
          threshold: '140/90',
        },
        {
          id: '2',
          patientName: 'Jane Smith',
          vitalType: 'Blood Glucose',
          value: '110',
          unit: 'mg/dL',
          timestamp: '2025-11-08 07:15',
          status: 'normal',
          trend: 'stable',
          threshold: '70-130',
        },
        {
          id: '3',
          patientName: 'Bob Wilson',
          vitalType: 'Weight',
          value: '185.2',
          unit: 'lbs',
          timestamp: '2025-11-07 18:45',
          status: 'normal',
          trend: 'down',
        },
        {
          id: '4',
          patientName: 'Alice Johnson',
          vitalType: 'SpO2',
          value: '88',
          unit: '%',
          timestamp: '2025-11-03 12:00',
          status: 'critical',
          trend: 'down',
          threshold: '>92',
        },
        {
          id: '5',
          patientName: 'Charlie Brown',
          vitalType: 'Heart Rate',
          value: '72',
          unit: 'bpm',
          timestamp: '2025-11-07 09:20',
          status: 'normal',
          trend: 'stable',
          threshold: '60-100',
        },
      ]);

      setAlerts([
        {
          id: '1',
          patientName: 'John Doe',
          vitalType: 'Blood Pressure',
          value: '145/92 mmHg',
          threshold: '140/90 mmHg',
          severity: 'high',
          timestamp: '2025-11-08 08:30',
          status: 'pending',
        },
        {
          id: '2',
          patientName: 'John Doe',
          vitalType: 'Blood Pressure',
          value: '148/94 mmHg',
          threshold: '140/90 mmHg',
          severity: 'high',
          timestamp: '2025-11-07 08:15',
          status: 'acknowledged',
        },
        {
          id: '3',
          patientName: 'Alice Johnson',
          vitalType: 'SpO2',
          value: '88%',
          threshold: '>92%',
          severity: 'critical',
          timestamp: '2025-11-03 12:00',
          status: 'pending',
        },
        {
          id: '4',
          patientName: 'Bob Wilson',
          vitalType: 'Weight',
          value: '190.5 lbs',
          threshold: '<188 lbs',
          severity: 'medium',
          timestamp: '2025-11-05 07:30',
          status: 'resolved',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients =
    programFilter === 'all'
      ? patients
      : patients.filter((patient) => patient.program === programFilter);

  const patientColumns: Column<MonitoredPatient>[] = [
    {
      key: 'patientId',
      header: 'Patient ID',
      sortable: true,
      width: '120px',
      render: (patient) => (
        <span className="font-medium text-primary">{patient.patientId}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      sortable: true,
    },
    {
      key: 'program',
      header: 'Program',
      sortable: true,
      render: (patient) => (
        <Badge variant="outline" className="text-xs">
          {patient.program}
        </Badge>
      ),
    },
    {
      key: 'lastReading',
      header: 'Last Reading',
      sortable: true,
      render: (patient) => (
        <span className="text-sm">{new Date(patient.lastReading).toLocaleString()}</span>
      ),
    },
    {
      key: 'complianceRate',
      header: 'Compliance',
      sortable: true,
      width: '140px',
      render: (patient) => (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Readings</span>
            <span className="font-medium">{patient.complianceRate}%</span>
          </div>
          <Progress value={patient.complianceRate} />
        </div>
      ),
    },
    {
      key: 'activeAlerts',
      header: 'Alerts',
      sortable: true,
      width: '80px',
      render: (patient) =>
        patient.activeAlerts > 0 ? (
          <Badge variant="destructive">{patient.activeAlerts}</Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (patient) => <StatusBadge status={patient.status} />,
    },
  ];

  const readingColumns: Column<VitalReading>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      width: '160px',
      render: (reading) => (
        <span className="text-sm">{new Date(reading.timestamp).toLocaleString()}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
    },
    {
      key: 'vitalType',
      header: 'Vital Type',
      sortable: true,
      render: (reading) => (
        <div className="flex items-center gap-2">
          {reading.vitalType === 'Blood Pressure' && <Heart className="h-4 w-4 text-red-500" />}
          {reading.vitalType === 'Heart Rate' && <Activity className="h-4 w-4 text-blue-500" />}
          {reading.vitalType === 'Blood Glucose' && (
            <TrendingUp className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm">{reading.vitalType}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      width: '120px',
      render: (reading) => (
        <span className="font-semibold">
          {reading.value} {reading.unit}
        </span>
      ),
    },
    {
      key: 'threshold',
      header: 'Threshold',
      sortable: true,
      width: '120px',
      render: (reading) => (
        <span className="text-xs text-muted-foreground">
          {reading.threshold || 'N/A'}
        </span>
      ),
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      width: '80px',
      render: (reading) =>
        reading.trend ? (
          <div className="flex items-center">
            {reading.trend === 'up' && <TrendingUp className="h-4 w-4 text-orange-500" />}
            {reading.trend === 'down' && <TrendingDown className="h-4 w-4 text-blue-500" />}
            {reading.trend === 'stable' && <span className="text-muted-foreground">—</span>}
          </div>
        ) : null,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (reading) => <StatusBadge status={reading.status} />,
    },
  ];

  const alertColumns: Column<Alert>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      width: '160px',
      render: (alert) => (
        <span className="text-sm">{new Date(alert.timestamp).toLocaleString()}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
    },
    {
      key: 'vitalType',
      header: 'Vital',
      sortable: true,
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      render: (alert) => <span className="font-semibold text-red-600">{alert.value}</span>,
    },
    {
      key: 'threshold',
      header: 'Threshold',
      sortable: true,
      render: (alert) => <span className="text-sm text-muted-foreground">{alert.threshold}</span>,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      width: '120px',
      render: (alert) => <StatusBadge status={alert.severity} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (alert) => <StatusBadge status={alert.status} />,
    },
  ];

  const handleRowClick = (item: MonitoredPatient | VitalReading | Alert) => {
    console.log('Navigate to detail:', item.id);
  };

  const handleEnrollPatient = () => {
    toast({
      title: 'Patient Enrolled',
      description: 'Patient has been successfully enrolled in the monitoring program',
    });
    setEnrollPatientOpen(false);
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your monitoring data export is being prepared...',
    });
  };

  const activePatients = patients.filter((p) => p.status === 'active').length;
  const totalReadings = readings.length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'pending').length;
  const avgCompliance =
    patients.reduce((sum, p) => sum + p.complianceRate, 0) / patients.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remote Patient Monitoring"
        description="Monitor patient vital signs and health metrics in real-time"
        breadcrumbs={[
          { label: 'mHealth & RPM', url: '/mhealth/dashboard' },
          { label: 'Monitoring' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={enrollPatientOpen} onOpenChange={setEnrollPatientOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Enroll Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Enroll Patient in Monitoring Program</DialogTitle>
                  <DialogDescription>
                    Select a patient and program to begin remote monitoring
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="patient">Patient</Label>
                    <Input id="patient" placeholder="Search patient..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="program">Monitoring Program</Label>
                    <Select>
                      <SelectTrigger id="program">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hypertension">Hypertension Management</SelectItem>
                        <SelectItem value="diabetes">Diabetes Care</SelectItem>
                        <SelectItem value="heart_failure">Heart Failure Monitoring</SelectItem>
                        <SelectItem value="copd">COPD Management</SelectItem>
                        <SelectItem value="post_surgical">Post-Surgical Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="device">Assign Device</Label>
                    <Select>
                      <SelectTrigger id="device">
                        <SelectValue placeholder="Select device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bp_monitor">BP Monitor</SelectItem>
                        <SelectItem value="glucometer">Glucometer</SelectItem>
                        <SelectItem value="weight_scale">Weight Scale</SelectItem>
                        <SelectItem value="pulse_ox">Pulse Oximeter</SelectItem>
                        <SelectItem value="multi_vital">Multi-vital Monitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEnrollPatientOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEnrollPatient}>Enroll Patient</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePatients}</div>
            <p className="text-xs text-muted-foreground">Currently monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReadings}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlertsCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(avgCompliance)}%
            </div>
            <p className="text-xs text-muted-foreground">Reading adherence</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patients">Monitored Patients</TabsTrigger>
          <TabsTrigger value="readings">Recent Readings</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Monitoring List</CardTitle>
                  <CardDescription>
                    {programFilter === 'all' ? 'All patients' : programFilter}
                  </CardDescription>
                </div>
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="Hypertension Management">
                      Hypertension Management
                    </SelectItem>
                    <SelectItem value="Diabetes Care">Diabetes Care</SelectItem>
                    <SelectItem value="Heart Failure Monitoring">
                      Heart Failure Monitoring
                    </SelectItem>
                    <SelectItem value="COPD Management">COPD Management</SelectItem>
                    <SelectItem value="Post-Surgical Recovery">
                      Post-Surgical Recovery
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredPatients}
                columns={patientColumns}
                searchable
                searchPlaceholder="Search patients..."
                onRowClick={handleRowClick}
                emptyMessage="No patients found"
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Vital Sign Readings</CardTitle>
              <CardDescription>Latest measurements from all monitored patients</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={readings}
                columns={readingColumns}
                searchable
                searchPlaceholder="Search readings..."
                onRowClick={handleRowClick}
                emptyMessage="No readings found"
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Monitoring Alerts</CardTitle>
              <CardDescription>Vital signs exceeding configured thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={alerts}
                columns={alertColumns}
                searchable
                searchPlaceholder="Search alerts..."
                onRowClick={handleRowClick}
                emptyMessage="No active alerts"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Critical Alerts Section */}
          {alerts.filter((a) => a.severity === 'critical' && a.status === 'pending').length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Critical Alerts Requiring Immediate Action
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts
                    .filter((a) => a.severity === 'critical' && a.status === 'pending')
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{alert.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.vitalType}: {alert.value} (Threshold: {alert.threshold})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Acknowledge
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
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common monitoring management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Activity className="mr-2 h-4 w-4" />
              Configure Thresholds
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              View Care Team
            </Button>
            <Button variant="outline" className="justify-start">
              <Heart className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Export Readings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
