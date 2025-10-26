import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, FileText, Truck, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { PurchaseOrderWithDetails } from "@shared/schema";
import { TechnicalDocumentManager } from "@/components/TechnicalDocumentManager";

function POStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string }> = {
    draft: { color: "bg-slate-500" },
    sent: { color: "bg-blue-500" },
    acknowledged: { color: "bg-purple-500" },
    in_transit: { color: "bg-yellow-600" },
    delivered: { color: "bg-green-600" },
    cancelled: { color: "bg-red-500" },
  };

  const variant = variants[status] || { color: "bg-gray-500" };

  return (
    <Badge className={`${variant.color} text-white`} data-testid={`badge-po-status-${status}`}>
      {status.replace(/_/g, " ").toUpperCase()}
    </Badge>
  );
}

function UpdatePOStatusDialog({ po }: { po: PurchaseOrderWithDetails }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(po.status);
  const [trackingNumber, setTrackingNumber] = useState(po.trackingNumber || "");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async (data: { status: string; trackingNumber?: string }) => {
      const response = await apiRequest("PATCH", `/api/purchase-orders/${po.id}/status`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: "Purchase order updated",
        description: "The purchase order status has been updated successfully.",
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating purchase order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      status,
      trackingNumber: trackingNumber || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-update-po-${po.id}`}>
          <Edit className="h-4 w-4 mr-2" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Purchase Order Status</DialogTitle>
            <DialogDescription>
              Update the status and tracking information for {po.poNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" data-testid="select-po-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                data-testid="input-tracking-number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-update"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-update">
              {updateMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupplierDashboard() {
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading: posLoading } = useQuery<PurchaseOrderWithDetails[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: technicalDocs, isLoading: docsLoading } = useQuery<any[]>({
    queryKey: ["/api/technical-documents"],
  });

  const stats = {
    totalPOs: purchaseOrders?.length || 0,
    pendingPOs: purchaseOrders?.filter(po => po.status === 'sent' || po.status === 'acknowledged').length || 0,
    inTransit: purchaseOrders?.filter(po => po.status === 'in_transit').length || 0,
    documents: technicalDocs?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-supplier-dashboard-title">
          Supplier Portal
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage purchase orders and technical documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="stat-total-pos">{stats.totalPOs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="stat-pending-pos">{stats.pendingPOs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="stat-in-transit">{stats.inTransit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technical Docs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="stat-documents">{stats.documents}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {posLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : purchaseOrders && purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id} data-testid={`row-po-${po.id}`}>
                    <TableCell className="font-medium" data-testid={`text-po-number-${po.id}`}>
                      {po.poNumber}
                    </TableCell>
                    <TableCell data-testid={`text-po-date-${po.id}`}>
                      {format(new Date(po.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell data-testid={`text-po-items-${po.id}`}>
                      {po.lineItems.length} item(s)
                    </TableCell>
                    <TableCell data-testid={`text-po-total-${po.id}`}>
                      ${parseFloat(po.totalAmount || "0").toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <POStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell data-testid={`text-tracking-${po.id}`}>
                      {po.trackingNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <UpdatePOStatusDialog po={po} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pos">
              No purchase orders yet. The lab will send orders as materials are needed.
            </div>
          )}
        </CardContent>
      </Card>

      <TechnicalDocumentManager />
    </div>
  );
}
