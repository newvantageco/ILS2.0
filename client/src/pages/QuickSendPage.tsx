import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  Mail,
  Smartphone,
  MessageSquare,
  Send,
  Users,
  Calendar,
  Clock,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

// Role-based access control
const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

interface RecipientFilters {
  filterType: 'appointments_today' | 'appointments_week' | 'recalls_due' | 'segment' | 'manual';
  segmentId?: string;
  patientIds?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface BroadcastHistory {
  id: string;
  channel: string;
  subject?: string;
  content: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  sentBy: string;
  sentByName?: string;
}

export default function QuickSendPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('sms');
  const [filterType, setFilterType] = useState<string>('appointments_today');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);

  const hasAccess = !!user && ALLOWED_ROLES.includes(user.role);

  // Build filters object
  const buildFilters = (): RecipientFilters => {
    const filters: RecipientFilters = {
      filterType: filterType as any,
    };

    if (channel === 'email') {
      filters.hasEmail = true;
    } else if (channel === 'sms' || channel === 'whatsapp') {
      filters.hasPhone = true;
    }

    return filters;
  };

  // Preview recipients
  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['/api/communications/broadcast/preview', filterType, channel],
    queryFn: async () => {
      const res = await fetch('/api/communications/broadcast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filters: buildFilters() }),
      });
      if (!res.ok) throw new Error('Failed to preview recipients');
      return res.json();
    },
    enabled: hasAccess && !!filterType,
  });

  const recipients: Recipient[] = previewData?.recipients || [];
  const recipientCount = previewData?.count || 0;

  // Fetch broadcast history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/communications/broadcast/history'],
    queryFn: async () => {
      const res = await fetch('/api/communications/broadcast/history', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: hasAccess,
  });

  const broadcasts: BroadcastHistory[] = historyData?.broadcasts || [];

  // Fetch stats for selected broadcast
  const { data: statsData } = useQuery({
    queryKey: [`/api/communications/broadcast/${selectedBroadcastId}/stats`],
    enabled: !!selectedBroadcastId,
    queryFn: async () => {
      const res = await fetch(`/api/communications/broadcast/${selectedBroadcastId}/stats`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  // Send broadcast mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/communications/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          channel,
          filters: buildFilters(),
          content: {
            subject: channel === 'email' ? subject : undefined,
            body: message,
          },
          scheduledFor: scheduledFor || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to send broadcast');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/broadcast/history'] });
      toast({
        title: scheduledFor ? "Broadcast Scheduled" : "Broadcast Sent",
        description: `Message ${scheduledFor ? 'scheduled for' : 'sent to'} ${recipientCount} recipients.`,
      });
      // Reset form
      setMessage('');
      setSubject('');
      setScheduledFor('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send broadcast. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (recipientCount === 0) {
      toast({
        title: "No Recipients",
        description: "No recipients match the selected filters.",
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate();
  };

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getFilterLabel = (type: string) => {
    const labels: Record<string, string> = {
      appointments_today: "Appointments Today",
      appointments_week: "Appointments This Week",
      recalls_due: "Recalls Due",
      segment: "Specific Segment",
      manual: "Manual Selection",
    };
    return labels[type] || type;
  };

  // Check authorization - placed after all hooks
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have permission to send broadcast messages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-600" />
          Quick Send / Broadcast
        </h1>
        <p className="text-muted-foreground">
          Send immediate messages to filtered patient groups
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Message Composer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compose Broadcast Message</CardTitle>
            <CardDescription>
              Send urgent or time-sensitive messages to multiple patients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Channel Selection */}
            <div className="space-y-2">
              <Label>Channel</Label>
              <div className="flex gap-2">
                <Button
                  variant={channel === 'sms' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setChannel('sms')}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  SMS
                </Button>
                <Button
                  variant={channel === 'email' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setChannel('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={channel === 'whatsapp' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setChannel('whatsapp')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Filter Selection */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments_today">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Patients with Appointments Today
                    </div>
                  </SelectItem>
                  <SelectItem value="appointments_week">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Patients with Appointments This Week
                    </div>
                  </SelectItem>
                  <SelectItem value="recalls_due">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Patients with Recalls Due
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {previewLoading ? 'Loading...' : `${recipientCount} recipients`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  disabled={recipientCount === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Recipients
                </Button>
              </div>
            </div>

            {/* Subject (Email only) */}
            {channel === 'email' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{message.length} characters</span>
                {channel === 'sms' && (
                  <span className={message.length > 160 ? 'text-orange-600' : ''}>
                    {Math.ceil(message.length / 160)} SMS segment{message.length > 160 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Schedule (Optional) */}
            <div className="space-y-2">
              <Label>Schedule For (Optional)</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to send immediately
              </p>
            </div>

            {/* Send Button */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || recipientCount === 0}
                className="flex-1"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending
                  ? 'Sending...'
                  : scheduledFor
                  ? 'Schedule Broadcast'
                  : 'Send Now'}
              </Button>
            </div>

            {recipientCount > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Ready to send</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      This message will be sent to {recipientCount} patient{recipientCount !== 1 ? 's' : ''} via {channel.toUpperCase()}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Broadcasts</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <TableSkeleton rows={5} columns={1} />
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">No broadcasts sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {broadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedBroadcastId(broadcast.id);
                      setShowStatsDialog(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(broadcast.channel)}
                        <span className="text-sm font-medium capitalize">{broadcast.channel}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(broadcast.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {broadcast.subject || broadcast.content.substring(0, 50)}...
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{broadcast.recipientCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{broadcast.deliveredCount}</span>
                      </div>
                      {broadcast.failedCount > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>{broadcast.failedCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Recipients Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Recipients</DialogTitle>
            <DialogDescription>
              {recipientCount} patient{recipientCount !== 1 ? 's' : ''} match the selected filters
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.name}</TableCell>
                    <TableCell>
                      {channel === 'email' ? recipient.email : recipient.phone || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Statistics</DialogTitle>
            <DialogDescription>
              Delivery and engagement metrics
            </DialogDescription>
          </DialogHeader>
          {statsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{statsData.stats.sent || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Delivered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {statsData.stats.delivered || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Opened</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {statsData.stats.opened || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">
                      {statsData.stats.failed || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
