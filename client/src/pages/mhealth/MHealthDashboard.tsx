import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Heart,
  Smartphone,
  Bell,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  monitoring: {
    programs: number;
    activeMonitoring: number;
    totalReadings: number;
    activeAlerts: number;
  };
  engagement: {
    activeReminders: number;
    contentItems: number;
    totalMessages: number;
    surveyResponses: number;
  };
  devices: {
    totalDevices: number;
    activeDevices: number;
    syncedToday: number;
    lowBattery: number;
  };
}

export default function MHealthDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/mhealth/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load mHealth statistics',
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
        <h1 className="text-3xl font-bold tracking-tight">Mobile Health & Remote Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive remote patient monitoring and engagement platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monitoring.activeMonitoring || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.monitoring.programs || 0} programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monitoring.totalReadings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Collected from devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.monitoring.activeAlerts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.devices.activeDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.devices.syncedToday || 0} synced today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Remote Monitoring</TabsTrigger>
          <TabsTrigger value="engagement">Patient Engagement</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remote Patient Monitoring</CardTitle>
              <CardDescription>Monitor vital signs and health metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/mhealth/programs/create'}>
                  <Heart className="mr-2 h-4 w-4" />
                  Create Program
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/monitoring'}>
                  View All Patients
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/alerts'}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View Alerts
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                <p><strong>Vital Types:</strong></p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">Blood Pressure</Badge>
                  <Badge variant="outline">Heart Rate</Badge>
                  <Badge variant="outline">Temperature</Badge>
                  <Badge variant="outline">SpO2</Badge>
                  <Badge variant="outline">Weight</Badge>
                  <Badge variant="outline">Glucose</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Readings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Readings</CardTitle>
              <CardDescription>Latest vital sign measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Blood Pressure</p>
                      <p className="text-sm text-muted-foreground">Patient: John Doe</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">145/92 mmHg</p>
                    <Badge variant="destructive">High</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Heart Rate</p>
                      <p className="text-sm text-muted-foreground">Patient: Jane Smith</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">72 bpm</p>
                    <Badge variant="success">Normal</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Glucose</p>
                      <p className="text-sm text-muted-foreground">Patient: Bob Johnson</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">110 mg/dL</p>
                    <Badge variant="success">Normal</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Engagement</CardTitle>
              <CardDescription>Reminders, education, and communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/mhealth/reminders/create'}>
                  <Bell className="mr-2 h-4 w-4" />
                  Create Reminder
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/messages'}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/content'}>
                  View Content
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Engagement Tools</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Medication reminders</li>
                    <li>• Educational content</li>
                    <li>• Secure messaging</li>
                    <li>• Patient surveys</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Statistics</h4>
                  <ul className="text-sm space-y-1">
                    <li>Active Reminders: {stats?.engagement.activeReminders || 0}</li>
                    <li>Messages Sent: {stats?.engagement.totalMessages || 0}</li>
                    <li>Survey Responses: {stats?.engagement.surveyResponses || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
              <CardDescription>Monitor and manage connected medical devices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={() => window.location.href = '/mhealth/devices/register'}>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Register Device
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/devices'}>
                  View All Devices
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/mhealth/devices/sync'}>
                  Sync Data
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Device Types</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>BP Monitor</Badge>
                    <Badge>Glucometer</Badge>
                    <Badge>Pulse Oximeter</Badge>
                    <Badge>Weight Scale</Badge>
                    <Badge>Wearable</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Device Status</h4>
                  <ul className="text-sm space-y-1">
                    <li>Total: {stats?.devices.totalDevices || 0}</li>
                    <li>Active: {stats?.devices.activeDevices || 0}</li>
                    <li>Low Battery: {stats?.devices.lowBattery || 0}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Patients requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats && stats.monitoring.activeAlerts > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium">High Blood Pressure Alert</p>
                      <p className="text-sm text-muted-foreground">Patient: John Doe | 145/92 mmHg</p>
                    </div>
                  </div>
                  <Button size="sm">Review</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Missed Reading</p>
                      <p className="text-sm text-muted-foreground">Patient: Jane Smith | No data for 3 days</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Contact</Button>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No active alerts</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
