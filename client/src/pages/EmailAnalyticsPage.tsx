import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Mail, TrendingUp, MousePointer, Smartphone, Monitor, Tablet, RefreshCw, Eye, Link, AlertCircle } from "lucide-react";

interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  avgTimeToOpen?: number;
  deviceBreakdown: Record<string, number>;
  topClickedLinks: Array<{ url: string; clicks: number }>;
}

interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  emailType: string;
  subject: string;
  status: string;
  sentAt: string;
  openCount: number;
  clickCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
}

export default function EmailAnalyticsPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailType, setEmailType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  useEffect(() => {
    fetchAnalytics();
    fetchEmailLogs();
  }, [emailType, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (emailType !== "all") {
        params.append("emailType", emailType);
      }
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      params.append("startDate", startDate.toISOString());
      params.append("endDate", endDate.toISOString());

      const response = await fetch(`/api/emails/analytics?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const params = new URLSearchParams();
      
      if (emailType !== "all") {
        params.append("emailType", emailType);
      }
      
      params.append("limit", "50");

      const response = await fetch(`/api/emails/logs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch email logs");

      const data = await response.json();
      setEmailLogs(data);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      opened: "bg-purple-100 text-purple-800",
      clicked: "bg-indigo-100 text-indigo-800",
      bounced: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
      queued: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (loading && !analytics) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Analytics</h1>
          <p className="text-gray-500 mt-1">Track email engagement and performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Email Types</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
              <SelectItem value="receipt">Receipts</SelectItem>
              <SelectItem value="prescription_reminder">Prescription Reminders</SelectItem>
              <SelectItem value="recall_notification">Recall Notifications</SelectItem>
              <SelectItem value="appointment_reminder">Appointment Reminders</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { fetchAnalytics(); fetchEmailLogs(); }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSent}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalDelivered} delivered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.openRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalOpened} opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalClicked} clicked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.bounceRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalBounced} bounced, {analytics.totalFailed} failed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Email opens by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.deviceBreakdown).map(([device, count]) => {
                    const total = Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(device)}
                          <span className="text-sm font-medium capitalize">{device}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-20 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Clicked Links */}
            <Card>
              <CardHeader>
                <CardTitle>Top Clicked Links</CardTitle>
                <CardDescription>Most popular links in emails</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {analytics.topClickedLinks.length > 0 ? (
                      analytics.topClickedLinks.map((link, index) => (
                        <div key={index} className="flex items-start justify-between p-2 rounded hover:bg-gray-50">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Link className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm truncate" title={link.url}>
                              {link.url}
                            </span>
                          </div>
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            {link.clicks} clicks
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No link clicks recorded yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Average Time to Open */}
          {analytics.avgTimeToOpen !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
                <CardDescription>Email performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average Time to First Open</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(analytics.avgTimeToOpen / 60)}h {Math.floor(analytics.avgTimeToOpen % 60)}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>Latest email activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {emailLogs.map((email) => (
                <div
                  key={email.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{email.subject}</p>
                      <Badge className={getStatusColor(email.status)}>
                        {email.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      To: {email.recipientName || email.recipientEmail}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Sent: {new Date(email.sentAt).toLocaleString()}</span>
                      {email.openCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Opened {email.openCount}x
                        </span>
                      )}
                      {email.clickCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          Clicked {email.clickCount}x
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-4 flex-shrink-0">
                    {email.emailType.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              {emailLogs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No emails sent yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
