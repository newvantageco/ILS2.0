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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Plus,
  Smartphone,
  Battery,
  BatteryLow,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  deviceId: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  assignedTo?: string;
  patientId?: string;
  status: string;
  batteryLevel: number;
  lastSync: string;
  firmwareVersion: string;
  registrationDate: string;
}

interface DeviceReading {
  id: string;
  deviceId: string;
  deviceType: string;
  patientName: string;
  readingType: string;
  timestamp: string;
  status: string;
  dataPoints: number;
}

interface DeviceAlert {
  id: string;
  deviceId: string;
  deviceType: string;
  assignedTo?: string;
  alertType: string;
  severity: string;
  message: string;
  timestamp: string;
  status: string;
}

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<DeviceReading[]>([]);
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [registerDeviceOpen, setRegisterDeviceOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesRes, readingsRes, alertsRes] = await Promise.all([
        fetch('/api/mhealth/devices'),
        fetch('/api/mhealth/devices/readings'),
        fetch('/api/mhealth/devices/alerts'),
      ]);

      if (!devicesRes.ok || !readingsRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const devicesData = await devicesRes.json();
      const readingsData = await readingsRes.json();
      const alertsData = await alertsRes.json();

      setDevices(devicesData.data || []);
      setReadings(readingsData.data || []);
      setAlerts(alertsData.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load device data',
        variant: 'destructive',
      });

      // Mock data for demonstration
      setDevices([
        {
          id: '1',
          deviceId: 'BPM-4521',
          deviceType: 'Blood Pressure Monitor',
          manufacturer: 'Omron',
          model: 'HEM-7156',
          serialNumber: 'SN-BP-45210001',
          assignedTo: 'John Doe',
          patientId: 'PT-001234',
          status: 'active',
          batteryLevel: 85,
          lastSync: '2025-11-08 08:30',
          firmwareVersion: '2.1.5',
          registrationDate: '2025-09-15',
        },
        {
          id: '2',
          deviceId: 'GLU-7893',
          deviceType: 'Glucometer',
          manufacturer: 'Accu-Chek',
          model: 'Guide',
          serialNumber: 'SN-GL-78930002',
          assignedTo: 'Jane Smith',
          patientId: 'PT-001235',
          status: 'active',
          batteryLevel: 92,
          lastSync: '2025-11-08 07:15',
          firmwareVersion: '3.2.1',
          registrationDate: '2025-08-20',
        },
        {
          id: '3',
          deviceId: 'WSC-3321',
          deviceType: 'Weight Scale',
          manufacturer: 'Withings',
          model: 'Body+',
          serialNumber: 'SN-WS-33210003',
          assignedTo: 'Bob Wilson',
          patientId: 'PT-001236',
          status: 'active',
          batteryLevel: 45,
          lastSync: '2025-11-07 18:45',
          firmwareVersion: '1.8.3',
          registrationDate: '2025-10-01',
        },
        {
          id: '4',
          deviceId: 'POX-1156',
          deviceType: 'Pulse Oximeter',
          manufacturer: 'Nonin',
          model: 'Onyx II',
          serialNumber: 'SN-PO-11560004',
          assignedTo: 'Alice Johnson',
          patientId: 'PT-001237',
          status: 'inactive',
          batteryLevel: 15,
          lastSync: '2025-11-03 12:00',
          firmwareVersion: '2.0.7',
          registrationDate: '2025-09-01',
        },
        {
          id: '5',
          deviceId: 'BPM-4522',
          deviceType: 'Blood Pressure Monitor',
          manufacturer: 'Omron',
          model: 'HEM-7156',
          serialNumber: 'SN-BP-45220005',
          status: 'available',
          batteryLevel: 100,
          lastSync: '2025-11-07 09:20',
          firmwareVersion: '2.1.5',
          registrationDate: '2025-10-15',
        },
      ]);

      setReadings([
        {
          id: '1',
          deviceId: 'BPM-4521',
          deviceType: 'BP Monitor',
          patientName: 'John Doe',
          readingType: 'Blood Pressure',
          timestamp: '2025-11-08 08:30',
          status: 'synced',
          dataPoints: 3,
        },
        {
          id: '2',
          deviceId: 'GLU-7893',
          deviceType: 'Glucometer',
          patientName: 'Jane Smith',
          readingType: 'Blood Glucose',
          timestamp: '2025-11-08 07:15',
          status: 'synced',
          dataPoints: 5,
        },
        {
          id: '3',
          deviceId: 'WSC-3321',
          deviceType: 'Weight Scale',
          patientName: 'Bob Wilson',
          readingType: 'Weight',
          timestamp: '2025-11-07 18:45',
          status: 'synced',
          dataPoints: 2,
        },
        {
          id: '4',
          deviceId: 'POX-1156',
          deviceType: 'Pulse Oximeter',
          patientName: 'Alice Johnson',
          readingType: 'SpO2',
          timestamp: '2025-11-03 12:00',
          status: 'failed',
          dataPoints: 0,
        },
      ]);

      setAlerts([
        {
          id: '1',
          deviceId: 'POX-1156',
          deviceType: 'Pulse Oximeter',
          assignedTo: 'Alice Johnson',
          alertType: 'Low Battery',
          severity: 'high',
          message: 'Battery level critically low (15%)',
          timestamp: '2025-11-08 06:00',
          status: 'pending',
        },
        {
          id: '2',
          deviceId: 'WSC-3321',
          deviceType: 'Weight Scale',
          assignedTo: 'Bob Wilson',
          alertType: 'Low Battery',
          severity: 'medium',
          message: 'Battery level low (45%)',
          timestamp: '2025-11-08 00:00',
          status: 'pending',
        },
        {
          id: '3',
          deviceId: 'POX-1156',
          deviceType: 'Pulse Oximeter',
          assignedTo: 'Alice Johnson',
          alertType: 'Sync Failed',
          severity: 'high',
          message: 'Device has not synced for 5 days',
          timestamp: '2025-11-08 06:00',
          status: 'pending',
        },
        {
          id: '4',
          deviceId: 'BPM-4522',
          deviceType: 'BP Monitor',
          alertType: 'Firmware Update',
          severity: 'low',
          message: 'Firmware update available (v2.1.6)',
          timestamp: '2025-11-07 09:00',
          status: 'acknowledged',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices =
    typeFilter === 'all'
      ? devices
      : devices.filter((device) => device.deviceType === typeFilter);

  const deviceColumns: Column<Device>[] = [
    {
      key: 'deviceId',
      header: 'Device ID',
      sortable: true,
      width: '120px',
      render: (device) => (
        <span className="font-medium text-primary">{device.deviceId}</span>
      ),
    },
    {
      key: 'deviceType',
      header: 'Type',
      sortable: true,
      render: (device) => (
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span>{device.deviceType}</span>
        </div>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      sortable: true,
      render: (device) => (
        <div>
          <p className="font-medium">{device.manufacturer}</p>
          <p className="text-xs text-muted-foreground">{device.model}</p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      render: (device) =>
        device.assignedTo ? (
          <div>
            <p className="font-medium">{device.assignedTo}</p>
            <p className="text-xs text-muted-foreground">{device.patientId}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: 'batteryLevel',
      header: 'Battery',
      sortable: true,
      width: '140px',
      render: (device) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {device.batteryLevel > 50 ? (
              <Battery className="h-4 w-4 text-green-600" />
            ) : device.batteryLevel > 20 ? (
              <Battery className="h-4 w-4 text-orange-600" />
            ) : (
              <BatteryLow className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">{device.batteryLevel}%</span>
          </div>
          <Progress
            value={device.batteryLevel}
            className={
              device.batteryLevel <= 20
                ? '[&>div]:bg-red-600'
                : device.batteryLevel <= 50
                ? '[&>div]:bg-orange-600'
                : ''
            }
          />
        </div>
      ),
    },
    {
      key: 'lastSync',
      header: 'Last Sync',
      sortable: true,
      render: (device) => (
        <div className="flex items-center gap-2">
          {new Date().getTime() - new Date(device.lastSync).getTime() < 86400000 ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm">{new Date(device.lastSync).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (device) => <StatusBadge status={device.status} />,
    },
  ];

  const readingColumns: Column<DeviceReading>[] = [
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
      key: 'deviceId',
      header: 'Device',
      sortable: true,
      render: (reading) => (
        <div>
          <p className="font-medium">{reading.deviceId}</p>
          <p className="text-xs text-muted-foreground">{reading.deviceType}</p>
        </div>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
    },
    {
      key: 'readingType',
      header: 'Reading Type',
      sortable: true,
    },
    {
      key: 'dataPoints',
      header: 'Data Points',
      sortable: true,
      width: '120px',
      render: (reading) => <Badge variant="outline">{reading.dataPoints}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (reading) => <StatusBadge status={reading.status} />,
    },
  ];

  const alertColumns: Column<DeviceAlert>[] = [
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
      key: 'deviceId',
      header: 'Device',
      sortable: true,
      render: (alert) => (
        <div>
          <p className="font-medium">{alert.deviceId}</p>
          <p className="text-xs text-muted-foreground">{alert.deviceType}</p>
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Patient',
      sortable: true,
      render: (alert) => alert.assignedTo || <span className="text-muted-foreground">N/A</span>,
    },
    {
      key: 'alertType',
      header: 'Alert Type',
      sortable: true,
    },
    {
      key: 'message',
      header: 'Message',
      sortable: true,
      render: (alert) => <span className="text-sm">{alert.message}</span>,
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

  const handleRowClick = (item: Device | DeviceReading | DeviceAlert) => {
    console.log('Navigate to detail:', item.id);
  };

  const handleRegisterDevice = () => {
    toast({
      title: 'Device Registered',
      description: 'Device has been successfully registered in the system',
    });
    setRegisterDeviceOpen(false);
  };

  const handleSyncAll = () => {
    toast({
      title: 'Sync Initiated',
      description: 'Syncing all active devices...',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your device data export is being prepared...',
    });
  };

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.status === 'active').length;
  const lowBatteryDevices = devices.filter((d) => d.batteryLevel <= 20).length;
  const syncedToday = devices.filter(
    (d) => new Date().getTime() - new Date(d.lastSync).getTime() < 86400000
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading device data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Management"
        description="Monitor and manage connected medical devices"
        breadcrumbs={[
          { label: 'mHealth & RPM', url: '/mhealth/dashboard' },
          { label: 'Devices' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleSyncAll}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={registerDeviceOpen} onOpenChange={setRegisterDeviceOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Register New Device</DialogTitle>
                  <DialogDescription>
                    Enter device information to register it in the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="device_type">Device Type</Label>
                    <Select>
                      <SelectTrigger id="device_type">
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bp_monitor">Blood Pressure Monitor</SelectItem>
                        <SelectItem value="glucometer">Glucometer</SelectItem>
                        <SelectItem value="weight_scale">Weight Scale</SelectItem>
                        <SelectItem value="pulse_oximeter">Pulse Oximeter</SelectItem>
                        <SelectItem value="heart_rate">Heart Rate Monitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input id="manufacturer" placeholder="e.g., Omron" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" placeholder="e.g., HEM-7156" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input id="serial" placeholder="SN-XX-XXXXXXXX" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="firmware">Firmware Version</Label>
                    <Input id="firmware" placeholder="e.g., 2.1.5" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="patient">Assign to Patient (Optional)</Label>
                    <Input id="patient" placeholder="Search patient..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRegisterDeviceOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRegisterDevice}>Register Device</Button>
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
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">Registered devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeDevices}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Synced Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncedToday}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowBatteryDevices}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="readings">Sync History</TabsTrigger>
          <TabsTrigger value="alerts">Device Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Device Inventory</CardTitle>
                  <CardDescription>
                    {typeFilter === 'all' ? 'All devices' : typeFilter}
                  </CardDescription>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Blood Pressure Monitor">BP Monitor</SelectItem>
                    <SelectItem value="Glucometer">Glucometer</SelectItem>
                    <SelectItem value="Weight Scale">Weight Scale</SelectItem>
                    <SelectItem value="Pulse Oximeter">Pulse Oximeter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredDevices}
                columns={deviceColumns}
                searchable
                searchPlaceholder="Search devices..."
                onRowClick={handleRowClick}
                emptyMessage="No devices found"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Device Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Device Distribution</CardTitle>
              <CardDescription>Devices by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">BP Monitors</span>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {devices.filter((d) => d.deviceType === 'Blood Pressure Monitor').length}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Glucometers</span>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {devices.filter((d) => d.deviceType === 'Glucometer').length}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weight Scales</span>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {devices.filter((d) => d.deviceType === 'Weight Scale').length}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pulse Oximeters</span>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {devices.filter((d) => d.deviceType === 'Pulse Oximeter').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Sync History</CardTitle>
              <CardDescription>Recent data synchronization from devices</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={readings}
                columns={readingColumns}
                searchable
                searchPlaceholder="Search sync history..."
                onRowClick={handleRowClick}
                emptyMessage="No sync history found"
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Alerts</CardTitle>
              <CardDescription>Device issues and maintenance notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={alerts}
                columns={alertColumns}
                searchable
                searchPlaceholder="Search alerts..."
                onRowClick={handleRowClick}
                emptyMessage="No device alerts"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* Critical Alerts Section */}
          {alerts.filter((a) => a.severity === 'high' && a.status === 'pending').length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900 dark:text-red-100">
                    Critical Device Issues
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts
                    .filter((a) => a.severity === 'high' && a.status === 'pending')
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {alert.deviceId} - {alert.alertType}
                          </p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.assignedTo ? `Patient: ${alert.assignedTo}` : 'Unassigned'} •{' '}
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Acknowledge
                          </Button>
                          <Button size="sm">Take Action</Button>
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
          <CardDescription>Common device management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Device Settings
            </Button>
            <Button variant="outline" className="justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Force Sync
            </Button>
            <Button variant="outline" className="justify-start">
              <Battery className="mr-2 h-4 w-4" />
              Battery Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Firmware Updates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
