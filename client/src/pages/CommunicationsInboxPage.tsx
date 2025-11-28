import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Inbox,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
  CheckCircle2,
  Clock,
  User,
  Filter,
  RefreshCw,
  Archive,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

// Role-based access control
const ALLOWED_ROLES = ['admin', 'platform_admin', 'company_admin', 'manager', 'receptionist'];

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'in_app';
  status: 'new' | 'read' | 'responded' | 'resolved' | 'archived';
  subject?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageDirection: 'inbound' | 'outbound';
  unreadCount: number;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
}

interface ConversationMessage {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  channel: string;
  status: string;
  sentBy?: string;
  sentByName?: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

interface InboxStats {
  new: number;
  unread: number;
  needsResponse: number;
  resolved: number;
  byChannel: {
    sms: number;
    whatsapp: number;
    email: number;
    in_app: number;
  };
}

export default function CommunicationsInboxPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');

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
                  You don't have permission to access the communications inbox.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch inbox stats
  const { data: statsData } = useQuery({
    queryKey: ['/api/communications/inbox/stats'],
    queryFn: async () => {
      const res = await fetch('/api/communications/inbox/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats: InboxStats = statsData?.stats || {
    new: 0,
    unread: 0,
    needsResponse: 0,
    resolved: 0,
    byChannel: { sms: 0, whatsapp: 0, email: 0, in_app: 0 },
  };

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/communications/inbox/conversations', statusFilter, channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);

      const res = await fetch(`/api/communications/inbox/conversations?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const conversations: Conversation[] = conversationsData?.conversations || [];

  // Fetch selected conversation messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/communications/inbox/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const res = await fetch(`/api/communications/inbox/conversations/${selectedConversation}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const messages: ConversationMessage[] = messagesData?.messages || [];
  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const res = await fetch(`/api/communications/inbox/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communications/inbox/conversations/${selectedConversation}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications/inbox/conversations'] });
      setReplyText('');
      toast({
        title: "Reply Sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      const res = await fetch(`/api/communications/inbox/conversations/${conversationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/inbox/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/communications/inbox/stats'] });
      toast({
        title: "Status Updated",
        description: "Conversation status has been updated.",
      });
    },
  });

  // Assign conversation mutation
  const assignMutation = useMutation({
    mutationFn: async ({ conversationId, assignedTo }: { conversationId: string; assignedTo: string }) => {
      const res = await fetch(`/api/communications/inbox/conversations/${conversationId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error('Failed to assign conversation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/inbox/conversations'] });
      toast({
        title: "Conversation Assigned",
        description: "The conversation has been assigned successfully.",
      });
    },
  });

  const handleSendReply = () => {
    if (!selectedConversation || !replyText.trim()) return;
    replyMutation.mutate({ conversationId: selectedConversation, content: replyText });
  };

  const handleMarkResolved = () => {
    if (!selectedConversation) return;
    updateStatusMutation.mutate({ conversationId: selectedConversation, status: 'resolved' });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      new: { variant: "destructive", label: "New" },
      read: { variant: "secondary", label: "Read" },
      responded: { variant: "default", label: "Responded" },
      resolved: { variant: "outline", label: "Resolved" },
      archived: { variant: "outline", label: "Archived" },
    };

    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(date, 'MMM d');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Inbox className="h-8 w-8" />
            Communications Inbox
          </h1>
          <p className="text-muted-foreground">
            Manage two-way patient communications across all channels
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          refetchConversations();
          toast({ title: "Refreshed", description: "Inbox updated" });
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              New Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.new}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.unread}</p>
            <p className="text-xs text-muted-foreground mt-1">Not yet viewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Needs Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.needsResponse}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting reply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.byChannel.sms} SMS, {stats.byChannel.email} Email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Inbox Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="flex gap-2 mt-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversationsLoading ? (
              <div className="p-4">
                <TableSkeleton rows={5} columns={1} />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversation === conv.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(conv.channel)}
                        <span className="font-medium text-sm">{conv.patientName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(conv.status)}
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Conversation Detail */}
        <Card className="lg:col-span-2">
          {!selectedConversation ? (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getChannelIcon(selectedConv?.channel || 'sms')}
                      {selectedConv?.patientName}
                    </CardTitle>
                    <CardDescription>
                      {selectedConv?.patientPhone || selectedConv?.patientEmail}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedConv?.status || 'new')}
                    {selectedConv?.status !== 'resolved' && (
                      <Button size="sm" variant="outline" onClick={handleMarkResolved}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Messages Thread */}
                <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                  {messagesLoading ? (
                    <TableSkeleton rows={3} columns={1} />
                  ) : messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.direction === 'outbound'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs opacity-70">
                              {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                            </span>
                            {msg.direction === 'outbound' && msg.sentByName && (
                              <span className="text-xs opacity-70">• {msg.sentByName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Box */}
                <div className="border-t pt-4 space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Reply via {selectedConv?.channel.toUpperCase()}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || replyMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
