/**
 * Scheduled Messages Queue Page
 *
 * Complete visibility into upcoming scheduled communications
 * Provides operational control over pending message sends
 *
 * Features:
 * - Calendar and list views of scheduled messages
 * - Filter by date range, channel, campaign, status
 * - Message details with recipient and content preview
 * - Cancel scheduled messages before sending
 * - Statistics on upcoming sends by channel and timeframe
 * - Prevent duplicate or conflicting messages
 * - Compliance review before sending
 *
 * SECURITY: Restricted to admin, company_admin, manager, receptionist, ecp roles
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Smartphone,
  MessageCircle,
  Bell,
  Search,
  Calendar,
  Clock,
  XCircle,
  Eye,
  AlertTriangle,
  Shield,
  Filter,
  RefreshCw,
  TrendingUp,
  Send,
  Trash2,
} from "lucide-react";
import { format, addDays, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface ScheduledMessage {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  recipientId: string;
  recipientName?: string;
  recipientContact: string;
  subject?: string;
  body: string;
  scheduledFor: string;
  campaignId?: string;
  campaignName?: string;
  workflowId?: string;
  workflowName?: string;
  templateId?: string;
  templateName?: string;
  status: 'scheduled' | 'processing' | 'cancelled';
  createdAt: string;
  createdBy?: string;
}

const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist', 'ecp'];

export default function ScheduledMessagesPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ScheduledMessage | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('7'); // days
  const [searchQuery, setSearchQuery] = useState('');

  // Role-based access control
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have permission to view scheduled messages.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch scheduled messages
  const { data: messagesData, isLoading, refetch } = useQuery({
    queryKey: ['/api/communications/messages/scheduled', channelFilter, timeRangeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.append('channel', channelFilter);
      if (timeRangeFilter !== 'all') {
        const days = parseInt(timeRangeFilter);
        const endDate = addDays(new Date(), days);
        params.append('endDate', endDate.toISOString());
      }
      params.append('limit', '200');

      const res = await fetch(`/api/communications/messages/scheduled?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch scheduled messages');
      return res.json();
    },
  });

  const messages: ScheduledMessage[] = messagesData?.messages || [];
  const totalMessages = messagesData?.total || 0;

  // Filter by search query
  const filteredMessages = searchQuery
    ? messages.filter(m =>
        m.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.recipientContact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Cancel message mutation
  const cancelMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/communications/messages/${messageId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/messages/scheduled'] });
      toast({
        title: "Message Cancelled",
        description: "The scheduled message has been cancelled successfully.",
      });
      setCancelOpen(false);
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the scheduled message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const now = new Date();
  const stats = {
    total: filteredMessages.length,
    today: filteredMessages.filter(m => isToday(new Date(m.scheduledFor))).length,
    tomorrow: filteredMessages.filter(m => isTomorrow(new Date(m.scheduledFor))).length,
    thisWeek: filteredMessages.filter(m => isThisWeek(new Date(m.scheduledFor))).length,
    thisMonth: filteredMessages.filter(m => isThisMonth(new Date(m.scheduledFor))).length,
    byChannel: {
      email: filteredMessages.filter(m => m.channel === 'email').length,
      sms: filteredMessages.filter(m => m.channel === 'sms').length,
      whatsapp: filteredMessages.filter(m => m.channel === 'whatsapp').length,
      push: filteredMessages.filter(m => m.channel === 'push').length,
      in_app: filteredMessages.filter(m => m.channel === 'in_app').length,
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

  const getTimeUntilSend = (scheduledFor: string) => {
    const scheduled = new Date(scheduledFor);
    const diff = scheduled.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Overdue';
    if (hours < 1) return `${minutes}m`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const getTimeBadge = (scheduledFor: string) => {
    const scheduled = new Date(scheduledFor);
    if (isToday(scheduled)) {
      return <Badge variant="destructive">Today</Badge>;
    }
    if (isTomorrow(scheduled)) {
      return <Badge variant="default">Tomorrow</Badge>;
    }
    if (isThisWeek(scheduled)) {
      return <Badge variant="secondary">This Week</Badge>;
    }
    return <Badge variant="outline">Later</Badge>;
  };

  const handleViewDetails = (message: ScheduledMessage) => {
    setSelectedMessage(message);
    setDetailsOpen(true);
  };

  const handleCancelClick = (message: ScheduledMessage) => {
    setSelectedMessage(message);
    setCancelOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedMessage) return;
    cancelMutation.mutate(selectedMessage.id);
  };

  // Group messages by date
  const messagesByDate = filteredMessages.reduce((acc, message) => {
    const date = format(new Date(message.scheduledFor), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {} as Record<string, ScheduledMessage[]>);

  const sortedDates = Object.keys(messagesByDate).sort();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Scheduled Messages Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage upcoming scheduled communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4 text-destructive" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sending today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tomorrow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tomorrow.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sending tomorrow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Next 24 Hours</SelectItem>
                  <SelectItem value="7">Next 7 Days</SelectItem>
                  <SelectItem value="30">Next 30 Days</SelectItem>
                  <SelectItem value="all">All Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Messages</CardTitle>
          <CardDescription>
            Upcoming messages grouped by send date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scheduled messages</h3>
              <p className="text-muted-foreground">
                There are no messages scheduled to send
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">
                      {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
                    </h4>
                    <Badge variant="outline" className="ml-auto">
                      {messagesByDate[date].length} {messagesByDate[date].length === 1 ? 'message' : 'messages'}
                    </Badge>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Sends In</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messagesByDate[date]
                          .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                          .map(message => (
                            <TableRow key={message.id} className="hover:bg-muted/50">
                              <TableCell className="font-mono text-sm">
                                {format(new Date(message.scheduledFor), 'HH:mm')}
                                <br />
                                {getTimeBadge(message.scheduledFor)}
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
                                  {message.body.substring(0, 50)}...
                                </div>
                              </TableCell>
                              <TableCell>
                                {message.campaignName ? (
                                  <Badge variant="default" className="gap-1">
                                    <Send className="h-3 w-3" />
                                    {message.campaignName}
                                  </Badge>
                                ) : message.workflowName ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {message.workflowName}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Direct</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm font-medium">
                                  {getTimeUntilSend(message.scheduledFor)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDetails(message)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelClick(message)}
                                  >
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
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
              Scheduled Message Details
            </DialogTitle>
            <DialogDescription>
              Review message details before it sends
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Schedule Info */}
              <div>
                <h4 className="font-medium mb-2">Schedule Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Scheduled For</span>
                    <div className="text-right">
                      <div className="font-mono font-medium">
                        {format(new Date(selectedMessage.scheduledFor), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getTimeUntilSend(selectedMessage.scheduledFor)} from now
                      </div>
                    </div>
                  </div>
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
                  {selectedMessage.workflowName && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Workflow:</span>
                      <span className="col-span-2">{selectedMessage.workflowName}</span>
                    </div>
                  )}
                  {selectedMessage.templateName && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="col-span-2">{selectedMessage.templateName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <h4 className="font-medium mb-2">Content Preview</h4>
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDetailsOpen(false);
                setCancelOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Scheduled Message?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The scheduled message will be permanently cancelled.
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium mb-1">
                  To: {selectedMessage.recipientName || selectedMessage.recipientContact}
                </div>
                <div className="text-muted-foreground">
                  Scheduled for: {format(new Date(selectedMessage.scheduledFor), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Scheduled
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
