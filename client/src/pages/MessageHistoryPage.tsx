/**
 * Message History & Audit Log Page
 *
 * Comprehensive audit trail of all patient communications
 * Provides HIPAA-compliant message history with advanced filtering
 *
 * Features:
 * - Complete message history across all channels and campaigns
 * - Advanced filtering (channel, status, date range, campaign, recipient)
 * - Real-time search by content or recipient
 * - Message details with delivery tracking
 * - Export capabilities for compliance reporting
 * - HIPAA-compliant audit trail
 *
 * SECURITY: Restricted to admin, company_admin, manager, receptionist, ecp, dispenser roles
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Smartphone,
  MessageCircle,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  RefreshCw,
  Shield,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface Message {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  recipientId: string;
  recipientType: string;
  recipientName?: string;
  recipientContact: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced';
  campaignId?: string;
  campaignName?: string;
  templateId?: string;
  templateName?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
  metadata?: any;
  createdAt: string;
  createdBy?: string;
}

interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  byChannel: {
    email: number;
    sms: number;
    whatsapp: number;
    push: number;
    in_app: number;
  };
}

const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist', 'ecp', 'dispenser'];

export default function MessageHistoryPage() {
  const { user } = useUser();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('7'); // days

  // Role-based access control
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view message history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch messages with filters
  const { data: messagesData, isLoading: messagesLoading, refetch } = useQuery({
    queryKey: ['/api/communications/messages', channelFilter, statusFilter, searchQuery, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('startDate', startDate.toISOString());
      }
      params.append('limit', '100');

      const res = await fetch(`/api/communications/messages?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const messages: Message[] = messagesData?.messages || [];
  const totalMessages = messagesData?.total || 0;

  // Calculate statistics from current filtered messages
  const stats: MessageStats = {
    total: messages.length,
    sent: messages.filter(m => ['sent', 'delivered', 'opened', 'clicked'].includes(m.status)).length,
    delivered: messages.filter(m => ['delivered', 'opened', 'clicked'].includes(m.status)).length,
    opened: messages.filter(m => ['opened', 'clicked'].includes(m.status)).length,
    failed: messages.filter(m => ['failed', 'bounced'].includes(m.status)).length,
    byChannel: {
      email: messages.filter(m => m.channel === 'email').length,
      sms: messages.filter(m => m.channel === 'sms').length,
      whatsapp: messages.filter(m => m.channel === 'whatsapp').length,
      push: messages.filter(m => m.channel === 'push').length,
      in_app: messages.filter(m => m.channel === 'in_app').length,
    },
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <WhatsAppIcon className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'in_app': return <MessageCircle className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      sent: { variant: "default", icon: CheckCircle2 },
      delivered: { variant: "default", icon: CheckCircle2 },
      opened: { variant: "default", icon: Eye },
      clicked: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: XCircle },
      bounced: { variant: "destructive", icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleViewDetails = (message: Message) => {
    setSelectedMessage(message);
    setDetailsOpen(true);
  };

  const handleExport = () => {
    // Export messages as CSV
    const headers = ['Date', 'Channel', 'Recipient', 'Subject', 'Status', 'Campaign'];
    const rows = messages.map(m => [
      format(new Date(m.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      m.channel,
      m.recipientContact,
      m.subject || '',
      m.status,
      m.campaignName || 'Direct Message',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Message History & Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete audit trail of all patient communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={messages.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalMessages > stats.total && `${totalMessages.toLocaleString()} total (filtered)`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 && `${((stats.delivered / stats.total) * 100).toFixed(1)}% delivery rate`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.delivered > 0 && `${((stats.opened / stats.delivered) * 100).toFixed(1)}% open rate`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 && `${((stats.failed / stats.total) * 100).toFixed(1)}% failure rate`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              By Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-medium">{stats.byChannel.email}</span>
              </div>
              <div className="flex justify-between">
                <span>SMS</span>
                <span className="font-medium">{stats.byChannel.sms}</span>
              </div>
              <div className="flex justify-between">
                <span>WhatsApp</span>
                <span className="font-medium">{stats.byChannel.whatsapp}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipient or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="in_app">In-App Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="clicked">Clicked</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Message Log</CardTitle>
          <CardDescription>
            Complete audit trail with delivery tracking and compliance documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject/Content</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'HH:mm:ss')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(message.channel)}
                          <span className="capitalize">{message.channel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.recipientName || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{message.recipientContact}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {message.subject && (
                          <div className="font-medium truncate">{message.subject}</div>
                        )}
                        <div className="text-sm text-muted-foreground truncate">
                          {message.body.substring(0, 60)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.campaignName ? (
                          <Badge variant="outline">{message.campaignName}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Direct</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(message)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getChannelIcon(selectedMessage.channel)}
              Message Details
            </DialogTitle>
            <DialogDescription>
              Complete audit trail and delivery tracking
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Status & Timeline */}
              <div>
                <h4 className="font-medium mb-2">Delivery Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Current Status</span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  {selectedMessage.sentAt && (
                    <div className="flex items-center justify-between p-2 text-sm">
                      <span className="text-muted-foreground">Sent</span>
                      <span className="font-mono">{format(new Date(selectedMessage.sentAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                  )}
                  {selectedMessage.deliveredAt && (
                    <div className="flex items-center justify-between p-2 text-sm">
                      <span className="text-muted-foreground">Delivered</span>
                      <span className="font-mono">{format(new Date(selectedMessage.deliveredAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                  )}
                  {selectedMessage.openedAt && (
                    <div className="flex items-center justify-between p-2 text-sm">
                      <span className="text-muted-foreground">Opened</span>
                      <span className="font-mono">{format(new Date(selectedMessage.openedAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                    </div>
                  )}
                  {selectedMessage.failureReason && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{selectedMessage.failureReason}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Message Details */}
              <div>
                <h4 className="font-medium mb-2">Message Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Channel:</span>
                    <span className="col-span-2 capitalize">{selectedMessage.channel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="col-span-2">{selectedMessage.recipientContact}</span>
                  </div>
                  {selectedMessage.campaignName && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Campaign:</span>
                      <span className="col-span-2">{selectedMessage.campaignName}</span>
                    </div>
                  )}
                  {selectedMessage.templateName && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="col-span-2">{selectedMessage.templateName}</span>
                    </div>
                  )}
                  {selectedMessage.createdBy && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Sent By:</span>
                      <span className="col-span-2">{selectedMessage.createdBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                {selectedMessage.subject && (
                  <div className="mb-2">
                    <label className="text-sm text-muted-foreground">Subject:</label>
                    <div className="font-medium mt-1">{selectedMessage.subject}</div>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Body:</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                    {selectedMessage.body}
                  </div>
                </div>
              </div>

              {/* Audit Information */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>
                    Message ID: {selectedMessage.id} • Created: {format(new Date(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
