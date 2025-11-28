import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  CheckCircle2,
  Eye,
  MousePointerClick,
  Calendar,
  Award,
  DollarSign,
  Users,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

// Role-based access control
const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager'];

interface OverviewAnalytics {
  totalMessages: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversationRate: number;
  activePatients: number;
  avgResponseTime: number;
  trends: {
    messages: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
}

interface ChannelPerformance {
  channel: string;
  messages: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  avgCost: number;
}

interface SendTimeData {
  hour: number;
  dayOfWeek: string;
  messages: number;
  openRate: number;
}

interface EngagementTrend {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface TopTemplate {
  id: string;
  name: string;
  channel: string;
  uses: number;
  openRate: number;
  clickRate: number;
  conversions: number;
}

interface CampaignROI {
  campaignId: string;
  campaignName: string;
  sent: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
}

export default function CommunicationAnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<string>('30d');

  // Check authorization
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to view communication analytics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case '7d':
        start = subDays(end, 7);
        break;
      case '30d':
        start = subDays(end, 30);
        break;
      case '90d':
        start = subDays(end, 90);
        break;
      default:
        start = subDays(end, 30);
    }

    return { start, end };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Fetch overview analytics
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/communications/analytics/overview', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const res = await fetch(`/api/communications/analytics/overview?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch overview');
      return res.json();
    },
  });

  const overview: OverviewAnalytics = overviewData?.analytics || {
    totalMessages: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    conversationRate: 0,
    activePatients: 0,
    avgResponseTime: 0,
    trends: { messages: 0, deliveryRate: 0, openRate: 0, clickRate: 0 },
  };

  // Fetch channel performance
  const { data: channelData, isLoading: channelLoading } = useQuery({
    queryKey: ['/api/communications/analytics/channel-performance', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const res = await fetch(`/api/communications/analytics/channel-performance?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch channel performance');
      return res.json();
    },
  });

  const channelPerformance: ChannelPerformance[] = channelData?.performance || [];

  // Fetch send time optimization
  const { data: sendTimeData } = useQuery({
    queryKey: ['/api/communications/analytics/send-time-optimization'],
    queryFn: async () => {
      const res = await fetch('/api/communications/analytics/send-time-optimization', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch send time data');
      return res.json();
    },
  });

  const sendTimeOptimization: SendTimeData[] = sendTimeData?.optimization || [];

  // Fetch top templates
  const { data: templatesData } = useQuery({
    queryKey: ['/api/communications/analytics/top-templates'],
    queryFn: async () => {
      const res = await fetch('/api/communications/analytics/top-templates?limit=5', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch top templates');
      return res.json();
    },
  });

  const topTemplates: TopTemplate[] = templatesData?.templates || [];

  // Fetch campaign ROI
  const { data: roiData } = useQuery({
    queryKey: ['/api/communications/analytics/campaign-roi', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());

      const res = await fetch(`/api/communications/analytics/campaign-roi?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch ROI');
      return res.json();
    },
  });

  const campaignROI: CampaignROI[] = roiData?.roi || [];

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getBestSendTime = () => {
    if (sendTimeOptimization.length === 0) return 'N/A';
    const best = sendTimeOptimization.reduce((prev, current) =>
      current.openRate > prev.openRate ? current : prev
    );
    return `${best.dayOfWeek} at ${best.hour}:00`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Communication Analytics
          </h1>
          <p className="text-muted-foreground">
            Performance insights and data-driven optimization
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Total Messages
              </span>
              {getTrendIcon(overview.trends.messages)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.totalMessages.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(overview.trends.messages)}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Delivery Rate
              </span>
              {getTrendIcon(overview.trends.deliveryRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(overview.deliveryRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(overview.trends.deliveryRate)}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-600" />
                Open Rate
              </span>
              {getTrendIcon(overview.trends.openRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(overview.openRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(overview.trends.openRate)}% vs previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-orange-600" />
                Click Rate
              </span>
              {getTrendIcon(overview.trends.clickRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(overview.clickRate)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(overview.trends.clickRate)}% vs previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance Comparison</CardTitle>
          <CardDescription>Compare effectiveness across communication channels</CardDescription>
        </CardHeader>
        <CardContent>
          {channelLoading ? (
            <TableSkeleton rows={3} columns={7} />
          ) : channelPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No channel data available for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Delivery Rate</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelPerformance.map((channel) => (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(channel.channel)}
                        <span className="capitalize">{channel.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{channel.messages.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{channel.delivered.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{channel.opened.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={channel.deliveryRate > 0.95 ? "default" : "secondary"}>
                        {formatPercent(channel.deliveryRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={channel.openRate > 0.3 ? "default" : "secondary"}>
                        {formatPercent(channel.openRate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">£{channel.avgCost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Send Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Optimal Send Times
            </CardTitle>
            <CardDescription>Best times for maximum engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Best Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {getBestSendTime()}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Highest open rate across all messages
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Top 3 Send Times:</h4>
                {sendTimeOptimization
                  .sort((a, b) => b.openRate - a.openRate)
                  .slice(0, 3)
                  .map((time, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        {time.dayOfWeek} at {time.hour}:00
                      </span>
                      <Badge variant="outline">{formatPercent(time.openRate)}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Templates
            </CardTitle>
            <CardDescription>Best performing message templates</CardDescription>
          </CardHeader>
          <CardContent>
            {topTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No template data available
              </div>
            ) : (
              <div className="space-y-3">
                {topTemplates.map((template, idx) => (
                  <div key={template.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(template.channel)}
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{template.uses} uses</span>
                        <span>•</span>
                        <span>{formatPercent(template.openRate)} open rate</span>
                        {template.conversions > 0 && (
                          <>
                            <span>•</span>
                            <span>{template.conversions} conversions</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign ROI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Campaign ROI
          </CardTitle>
          <CardDescription>Return on investment for campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignROI.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaign ROI data available for the selected period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignROI.map((campaign) => (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                    <TableCell className="text-right">{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaign.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">£{campaign.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">£{campaign.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={campaign.roi > 3 ? "default" : campaign.roi > 1 ? "secondary" : "destructive"}>
                        {campaign.roi.toFixed(1)}x
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
