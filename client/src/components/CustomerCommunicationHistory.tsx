import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Eye, MousePointer, Smartphone, Monitor, Tablet, Send, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  htmlContent: string;
}

interface EmailEvent {
  id: string;
  eventType: string;
  eventTimestamp: string;
  deviceType: string | null;
  userAgent: string | null;
  linkUrl: string | null;
}

interface Props {
  patientEmail: string;
  patientId: string;
}

export function CustomerCommunicationHistory({ patientEmail, patientId }: Props) {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (patientEmail) {
      fetchEmailHistory();
    }
  }, [patientEmail]);

  const fetchEmailHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/emails/logs?recipient=${encodeURIComponent(patientEmail)}&limit=50`);
      if (!response.ok) throw new Error("Failed to fetch email history");
      const data = await response.json();
      setEmails(data);
    } catch (error: any) {
      console.error("Error fetching email history:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailEvents = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/logs/${emailId}/events`);
      if (!response.ok) throw new Error("Failed to fetch email events");
      const data = await response.json();
      setEmailEvents(data);
    } catch (error: any) {
      console.error("Error fetching email events:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (email: EmailLog) => {
    setSelectedEmail(email);
    setIsDetailOpen(true);
    await fetchEmailEvents(email.id);
  };

  const handleResend = async (email: EmailLog) => {
    if (!confirm("Are you sure you want to resend this email?")) return;

    try {
      setResending(true);
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email.recipientEmail,
          toName: email.recipientName || undefined,
          subject: email.subject,
          htmlContent: email.htmlContent,
          emailType: email.emailType,
          companyId: (window as any).companyId, // Assuming companyId is available
          sentBy: (window as any).userId, // Assuming userId is available
          patientId: patientId,
        }),
      });

      if (!response.ok) throw new Error("Failed to resend email");

      toast({
        title: "Success",
        description: "Email resent successfully",
      });

      fetchEmailHistory();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
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

  const getDeviceIcon = (device: string | null) => {
    if (!device) return <Monitor className="h-3 w-3" />;
    switch (device.toLowerCase()) {
      case "desktop":
        return <Monitor className="h-3 w-3" />;
      case "mobile":
        return <Smartphone className="h-3 w-3" />;
      case "tablet":
        return <Tablet className="h-3 w-3" />;
      default:
        return <Monitor className="h-3 w-3" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!patientEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Communication History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No email address on file for this patient
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Communication History
              </CardTitle>
              <CardDescription className="mt-1">
                All emails sent to {patientEmail}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchEmailHistory}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No emails sent to this patient yet
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{email.subject}</h4>
                          <Badge className={getStatusColor(email.status)} variant="secondary">
                            {email.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {email.emailType.replace('_', ' ')} • Sent {formatDate(email.sentAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
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
                      {email.firstOpenedAt && (
                        <span className="text-xs">
                          First opened: {formatDate(email.firstOpenedAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(email)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResend(email)}
                        disabled={resending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Resend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              {selectedEmail?.subject}
            </DialogDescription>
          </DialogHeader>
          {selectedEmail && (
            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {/* Email Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Status</p>
                    <Badge className={getStatusColor(selectedEmail.status)}>
                      {selectedEmail.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Type</p>
                    <p className="text-sm">{selectedEmail.emailType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Sent</p>
                    <p className="text-sm">{formatDate(selectedEmail.sentAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Engagement</p>
                    <p className="text-sm">
                      {selectedEmail.openCount} opens, {selectedEmail.clickCount} clicks
                    </p>
                  </div>
                </div>

                {/* Engagement Timeline */}
                {emailEvents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Engagement Timeline</h3>
                    <div className="space-y-2">
                      {emailEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 p-3 border rounded bg-white"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {event.eventType === 'opened' && <Eye className="h-4 w-4 text-purple-600" />}
                            {event.eventType === 'clicked' && <MousePointer className="h-4 w-4 text-blue-600" />}
                            {event.eventType === 'delivered' && <Mail className="h-4 w-4 text-green-600" />}
                            {event.eventType === 'bounced' && <Mail className="h-4 w-4 text-red-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium capitalize">{event.eventType}</span>
                              {event.deviceType && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {getDeviceIcon(event.deviceType)}
                                  {event.deviceType}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(event.eventTimestamp)}
                            </p>
                            {event.linkUrl && (
                              <p className="text-xs text-blue-600 truncate mt-1">
                                Clicked: {event.linkUrl}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Content Preview */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Email Content</h3>
                  <div
                    className="p-4 border rounded bg-white"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.htmlContent) }}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
