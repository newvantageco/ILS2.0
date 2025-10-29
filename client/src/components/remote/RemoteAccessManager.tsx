import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wifi, 
  Eye, 
  FileCheck, 
  Shield,
  Clock,
  User,
  Lock,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface RemoteSession {
  id: string;
  patientId: string;
  examinationId: string | null;
  prescriptionId: string | null;
  accessToken: string;
  expiresAt: Date;
  status: "active" | "expired" | "revoked";
  viewedBy: string | null;
  viewedAt: Date | null;
  patient: {
    name: string;
  };
  createdBy: {
    name: string;
  };
  accessUrl: string;
}

interface PendingApproval {
  id: string;
  prescriptionId: string;
  patientName: string;
  submittedBy: string;
  submittedAt: Date;
  requiresApproval: boolean;
}

export function RemoteAccessManager() {
  const [selectedSession, setSelectedSession] = useState<RemoteSession | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: remoteSessions, isLoading } = useQuery<RemoteSession[]>({
    queryKey: ["/api/ecp/remote-sessions"],
  });

  const { data: pendingApprovals } = useQuery<PendingApproval[]>({
    queryKey: ["/api/ecp/prescriptions/pending-approval"],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/ecp/remote-sessions", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/remote-sessions"] });
      toast({
        title: "Remote Session Created",
        description: "Secure access link has been generated.",
      });
      setIsCreateDialogOpen(false);
      setSelectedSession(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create remote session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/ecp/remote-sessions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/remote-sessions"] });
      toast({
        title: "Session Revoked",
        description: "Remote access has been revoked.",
      });
    },
  });

  const approvePrescriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/ecp/prescriptions/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ecp/prescriptions/pending-approval"] });
      toast({
        title: "Prescription Approved",
        description: "The prescription has been approved and signed.",
      });
    },
  });

  const handleCopyUrl = (url: string, sessionId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(sessionId);
    toast({
      title: "Link Copied",
      description: "Secure access link copied to clipboard.",
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getSessionStatus = (session: RemoteSession) => {
    if (session.status === "revoked") {
      return { label: "Revoked", color: "destructive" as const };
    }
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    if (now > expiresAt || session.status === "expired") {
      return { label: "Expired", color: "secondary" as const };
    }
    
    return { label: "Active", color: "default" as const };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wifi className="h-8 w-8" />
            Remote Access Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure remote viewing and prescription approval
          </p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <Card className="border-yellow-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-yellow-500" />
              Pending Approvals ({pendingApprovals.length})
            </CardTitle>
            <CardDescription>
              Prescriptions requiring remote approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950"
                >
                  <div>
                    <div className="font-medium">{approval.patientName}</div>
                    <div className="text-sm text-muted-foreground">
                      Submitted by {approval.submittedBy} •{" "}
                      {format(new Date(approval.submittedAt), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // Open prescription review dialog
                        window.open(`/ecp/prescriptions/${approval.prescriptionId}/review`, "_blank");
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approvePrescriptionMutation.mutate(approval.prescriptionId)}
                      disabled={approvePrescriptionMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {remoteSessions?.filter(s => getSessionStatus(s).label === "Active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-green-600 border-green-600">
              All Secure
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Active Remote Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Remote Access Sessions</CardTitle>
          <CardDescription>
            Manage secure remote viewing links for patients and colleagues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!remoteSessions || remoteSessions.length === 0 ? (
            <div className="text-center py-12">
              <Wifi className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No remote sessions</h3>
              <p className="text-muted-foreground mb-4">
                Create secure links for remote prescription viewing
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Accessed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remoteSessions.map((session) => {
                    const status = getSessionStatus(session);

                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.patient.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {session.createdBy.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(session.expiresAt), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {session.viewedAt ? (
                            <div>
                              <div className="text-sm">
                                {format(new Date(session.viewedAt), "dd/MM/yyyy HH:mm")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                by {session.viewedBy}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not accessed</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status.label === "Active" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyUrl(session.accessUrl, session.id)}
                                >
                                  {copiedUrl === session.id ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(session.accessUrl, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => revokeSessionMutation.mutate(session.id)}
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">End-to-End Encryption</div>
                <div className="text-muted-foreground">
                  All remote sessions use TLS 1.3 encryption
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Time-Limited Access</div>
                <div className="text-muted-foreground">
                  Sessions automatically expire after 24 hours
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Audit Trail</div>
                <div className="text-muted-foreground">
                  All access attempts are logged and monitored
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Instant Revocation</div>
                <div className="text-muted-foreground">
                  Access can be revoked immediately if needed
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
