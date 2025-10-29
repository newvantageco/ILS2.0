import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Mail } from "lucide-react";
import { Link } from "wouter";
import { OMAViewer } from "@/components/OMAViewer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  if (!orderId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order ID not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[order.status] || ""} data-testid="badge-order-status">
            {order.status.toUpperCase()}
          </Badge>
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
        </div>
      </div>

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
