import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Download, Mail, FileText, ClipboardList, Truck, FileDown, AlertTriangle, Package, MessageSquare, Send } from "lucide-react";
import { Link } from "wouter";
import { OMAViewer } from "@/components/OMAViewer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { TimestampDisplay } from "@/components/ui/TimestampDisplay";
import { ChangeHistoryDialog } from "@/components/ui/ChangeHistoryDialog";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Order = {
  id: string;
  patientId: string;
  ecpId: string;
  status: string;
  lensType: string;
  lensMaterial: string;
  coating: string;
  frameType: string | null;
  odSphere: string | null;
  odCylinder: string | null;
  odAxis: string | null;
  odAdd: string | null;
  osSphere: string | null;
  osCylinder: string | null;
  osAxis: string | null;
  osAdd: string | null;
  pd: string | null;
  traceFileUrl: string | null;
  notes: string | null;
  customerReferenceNumber: string | null;
  omaFileContent: string | null;
  omaFilename: string | null;
  omaParsedData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  changeHistory?: Array<{
    timestamp: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: "created" | "updated" | "deleted" | "status_changed";
    changes?: Record<string, { old: any; new: any }>;
    ipAddress?: string;
  }>;
  patient: {
    name: string;
    dateOfBirth: string | null;
  };
  ecp: {
    organizationName: string | null;
  };
};

export default function OrderDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/order/:id");
  const orderId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      return response.json();
    },
    enabled: !!orderId,
  });

  const downloadPdfMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/orders/${id}/pdf`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/pdf",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to download PDF" }));
        throw new Error(errorData.message || "Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Downloaded",
        description: "The order sheet PDF has been downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadLabTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/orders/${id}/lab-ticket`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/pdf",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to download lab ticket" }));
        throw new Error(errorData.message || "Failed to download lab ticket");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lab-ticket-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Lab Ticket Downloaded",
        description: "The lab work ticket PDF has been downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download lab ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadExamFormMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/patients/${patientId}/examination-form`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/pdf",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to download examination form" }));
        throw new Error(errorData.message || "Failed to download examination form");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam-form-${patientId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Exam Form Downloaded",
        description: "The patient examination form PDF has been downloaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download examination form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/orders/${id}/email`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to send email");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "The order sheet has been emailed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Shipping Management
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [shippingData, setShippingData] = useState({
    trackingNumber: "",
    carrier: "",
    shippedDate: new Date().toISOString().split('T')[0],
  });

  // Consultation Logs
  const [showConsultDialog, setShowConsultDialog] = useState(false);
  const [consultResponse, setConsultResponse] = useState("");

  const { data: consultLogs } = useQuery({
    queryKey: ['/api/orders', orderId, 'consult-logs'],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/consult-logs`);
      if (!response.ok) throw new Error('Failed to fetch consultation logs');
      return response.json();
    },
    enabled: !!orderId && showConsultDialog,
  });

  const respondToConsultMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const res = await apiRequest("PATCH", `/api/consult-logs/${id}/respond`, { response });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to respond");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'consult-logs'] });
      setConsultResponse("");
      toast({ title: "Response sent successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send response",
        variant: "destructive",
      });
    },
  });

  const shipOrderMutation = useMutation({
    mutationFn: async (data: typeof shippingData) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/ship`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to mark as shipped");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      setShowShippingDialog(false);
      setShippingData({ trackingNumber: "", carrier: "", shippedDate: new Date().toISOString().split('T')[0] });
      toast({
        title: "Order Shipped",
        description: "The order has been marked as shipped with tracking information.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // OMA Export
  const downloadOMAMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/orders/${id}/oma`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download OMA file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${orderId}.oma`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "OMA File Downloaded",
        description: "The OMA file has been downloaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to download OMA file.",
        variant: "destructive",
      });
    },
  });

  // Risk Analysis
  const { data: riskAnalysis } = useQuery({
    queryKey: ['/api/orders/analyze-risk', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/analyze-risk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) throw new Error("Failed to analyze risk");
      return response.json();
    },
    enabled: !!orderId,
  });

  if (!orderId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order ID not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    processing: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    completed: "bg-green-500/20 text-green-700 dark:text-green-400",
    cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
  };

  const getBackPath = () => {
    if (!user?.role) return "/";
    switch (user.role) {
      case "ecp":
        return "/ecp/dashboard";
      case "lab_tech":
      case "engineer":
        return "/lab/dashboard";
      default:
        return "/";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href={getBackPath()}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Order Details</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Order #{orderId.slice(0, 8)}
            </p>
            {order.updatedAt && (
              <div className="mt-2">
                <TimestampDisplay
                  timestamp={order.updatedAt}
                  userName={order.updatedBy}
                  action="updated"
                  showIcon={true}
                  className="text-xs"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[order.status] || ""} data-testid="badge-order-status">
            {order.status.toUpperCase()}
          </Badge>
          {order.changeHistory && order.changeHistory.length > 0 && (
            <ChangeHistoryDialog
              title="Order Change History"
              history={order.changeHistory}
              triggerLabel="View History"
              triggerVariant="outline"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadPdfMutation.mutate(orderId)}
            disabled={downloadPdfMutation.isPending}
            data-testid="button-download-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {(user?.role === 'lab_tech' || user?.role === 'engineer' || user?.role === 'admin' || user?.role === 'company_admin' || user?.role === 'platform_admin') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadLabTicketMutation.mutate(orderId)}
              disabled={downloadLabTicketMutation.isPending}
              data-testid="button-download-lab-ticket"
              className="border-blue-500 text-blue-700 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Lab Ticket
            </Button>
          )}
          {order?.patient && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadExamFormMutation.mutate(order.patientId)}
              disabled={downloadExamFormMutation.isPending}
              data-testid="button-download-exam-form"
              className="border-green-500 text-green-700 hover:bg-green-50"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Print Exam Form
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => emailMutation.mutate(orderId)}
            disabled={emailMutation.isPending}
            data-testid="button-email-order"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Order
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadOMAMutation.mutate(orderId)}
            disabled={downloadOMAMutation.isPending}
            data-testid="button-download-oma"
            className="border-purple-500 text-purple-700 hover:bg-purple-50"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export OMA
          </Button>
          {(user?.role === 'lab_tech' || user?.role === 'engineer' || user?.role === 'admin' || user?.role === 'platform_admin') && 
           order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShippingDialog(true)}
              data-testid="button-mark-shipped"
              className="border-orange-500 text-orange-700 hover:bg-orange-50"
            >
              <Truck className="h-4 w-4 mr-2" />
              Mark Shipped
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConsultDialog(true)}
            data-testid="button-consult-logs"
            className="border-blue-500 text-blue-700 hover:bg-blue-50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Consultation Logs
          </Button>
        </div>
      </div>

      {/* Risk Analysis Card */}
      {riskAnalysis && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Score:</span>
                <Badge 
                  variant={riskAnalysis.score > 7 ? "destructive" : riskAnalysis.score > 4 ? "default" : "secondary"}
                  className="text-lg px-3 py-1"
                >
                  {riskAnalysis.score}/10
                </Badge>
              </div>
              {riskAnalysis.factors && riskAnalysis.factors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Risk Factors:</p>
                  <ul className="space-y-1">
                    {riskAnalysis.factors.map((factor: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {riskAnalysis.recommendations && riskAnalysis.recommendations.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {riskAnalysis.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <Package className="h-3 w-3 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Enter shipping details for order #{orderId.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="carrier">Carrier *</Label>
              <Input
                id="carrier"
                placeholder="e.g., FedEx, UPS, USPS"
                value={shippingData.carrier}
                onChange={(e) => setShippingData({ ...shippingData, carrier: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number *</Label>
              <Input
                id="trackingNumber"
                placeholder="Enter tracking number"
                value={shippingData.trackingNumber}
                onChange={(e) => setShippingData({ ...shippingData, trackingNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="shippedDate">Shipped Date *</Label>
              <Input
                id="shippedDate"
                type="date"
                value={shippingData.shippedDate}
                onChange={(e) => setShippingData({ ...shippingData, shippedDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShippingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => shipOrderMutation.mutate(shippingData)}
              disabled={!shippingData.carrier || !shippingData.trackingNumber || shipOrderMutation.isPending}
            >
              {shipOrderMutation.isPending ? "Saving..." : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consultation Logs Dialog */}
      <Dialog open={showConsultDialog} onOpenChange={setShowConsultDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Lab-ECP Consultation Logs
            </DialogTitle>
            <DialogDescription>
              Communication history between lab and eye care provider for order #{orderId.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {consultLogs && consultLogs.length > 0 ? (
              consultLogs.map((log: any, index: number) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{log.userName || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={log.status === 'resolved' ? 'default' : 'secondary'}>
                      {log.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Question:</p>
                    <p className="text-sm">{log.question}</p>
                  </div>
                  {log.response && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">Lab Response:</p>
                      <p className="text-sm text-blue-800">{log.response}</p>
                      {log.respondedAt && (
                        <p className="text-xs text-blue-600 mt-1">
                          Responded: {new Date(log.respondedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  {!log.response && (user?.role === 'lab_tech' || user?.role === 'engineer') && (
                    <div className="mt-3 space-y-2">
                      <Label htmlFor={`response-${log.id}`}>Respond to Consultation</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`response-${log.id}`}
                          placeholder="Enter your response..."
                          value={consultResponse}
                          onChange={(e) => setConsultResponse(e.target.value)}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (consultResponse.trim()) {
                              respondToConsultMutation.mutate({ id: log.id, response: consultResponse });
                            }
                          }}
                          disabled={!consultResponse.trim() || respondToConsultMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No consultation logs for this order</p>
                <p className="text-sm">Questions and responses will appear here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium" data-testid="text-patient-name">{order.patient.name}</p>
            </div>
            {order.patient.dateOfBirth && (
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium" data-testid="text-patient-dob">{order.patient.dateOfBirth}</p>
              </div>
            )}
            {order.customerReferenceNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Customer Reference</p>
                <p className="font-medium font-mono" data-testid="text-customer-reference">{order.customerReferenceNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Provider</p>
              <p className="font-medium" data-testid="text-provider">{order.ecp.organizationName || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lens Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Lens Type</p>
              <p className="font-medium" data-testid="text-lens-type">{order.lensType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Material</p>
              <p className="font-medium" data-testid="text-lens-material">{order.lensMaterial}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coating</p>
              <p className="font-medium" data-testid="text-coating">{order.coating}</p>
            </div>
            {order.frameType && (
              <div>
                <p className="text-sm text-muted-foreground">Frame Type</p>
                <p className="font-medium" data-testid="text-frame-type">{order.frameType}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Right Eye (OD)</h3>
              <div className="space-y-2 text-sm font-mono">
                {order.odSphere && <p data-testid="text-od-sphere">Sphere: {order.odSphere}</p>}
                {order.odCylinder && <p data-testid="text-od-cylinder">Cylinder: {order.odCylinder}</p>}
                {order.odAxis && <p data-testid="text-od-axis">Axis: {order.odAxis}</p>}
                {order.odAdd && <p data-testid="text-od-add">Add: {order.odAdd}</p>}
                {!order.odSphere && !order.odCylinder && !order.odAxis && !order.odAdd && (
                  <p className="text-muted-foreground">No data</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Left Eye (OS)</h3>
              <div className="space-y-2 text-sm font-mono">
                {order.osSphere && <p data-testid="text-os-sphere">Sphere: {order.osSphere}</p>}
                {order.osCylinder && <p data-testid="text-os-cylinder">Cylinder: {order.osCylinder}</p>}
                {order.osAxis && <p data-testid="text-os-axis">Axis: {order.osAxis}</p>}
                {order.osAdd && <p data-testid="text-os-add">Add: {order.osAdd}</p>}
                {!order.osSphere && !order.osCylinder && !order.osAxis && !order.osAdd && (
                  <p className="text-muted-foreground">No data</p>
                )}
              </div>
            </div>
          </div>
          {order.pd && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-mono" data-testid="text-pd">Pupillary Distance: {order.pd}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {order.omaFileContent && order.omaParsedData && (
        <OMAViewer
          omaData={{
            filename: order.omaFilename || "oma-file.oma",
            content: order.omaFileContent,
            parsedData: order.omaParsedData as any,
          }}
        />
      )}

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium" data-testid="text-created-at">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium" data-testid="text-updated-at">
              {new Date(order.updatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
