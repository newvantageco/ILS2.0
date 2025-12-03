import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatCardSkeleton } from "@/components/ui/CardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatsCard, SkeletonStats } from "@/components/ui";
import { Package, FileText, Truck, Plus, Edit, Trash2, Printer, Mail, ClipboardList, Boxes, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { PurchaseOrderWithDetails } from "@shared/schema";
import { TechnicalDocumentManager } from "@/components/TechnicalDocumentManager";
import { motion } from "framer-motion";
import { NumberCounter, StaggeredList, StaggeredItem } from "@/components/ui/AnimatedComponents";
import { pageVariants } from "@/lib/animations";

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
              <Select value={status} onValueChange={(value) => setStatus(value as typeof po.status)}>
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

export default function SupplierDashboardEnhanced() {
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading: posLoading } = useQuery<PurchaseOrderWithDetails[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: technicalDocs, isLoading: docsLoading } = useQuery<any[]>({
    queryKey: ["/api/technical-documents"],
  });

  const handlePrintPO = async (poId: string) => {
    try {
      window.open(`/api/purchase-orders/${poId}/pdf`, '_blank');
    } catch (error) {
      toast({
        title: "Error printing PO",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const stats = {
    totalPOs: purchaseOrders?.length || 0,
    pendingPOs: purchaseOrders?.filter(po => po.status === 'sent' || po.status === 'acknowledged').length || 0,
    inTransit: purchaseOrders?.filter(po => po.status === 'in_transit').length || 0,
    documents: technicalDocs?.length || 0,
    delivered: purchaseOrders?.filter(po => po.status === 'delivered').length || 0,
  };

  return (
    <motion.div
      className="space-y-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Modern Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Boxes className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-supplier-dashboard-title">
                  Supplier Portal
                </h1>
                <p className="text-white/90 mt-1">
                  Manage purchase orders and technical documentation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with Animations */}
      {posLoading ? (
        <SkeletonStats />
      ) : (
        <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <NumberCounter to={stats.totalPOs} duration={1.5} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time orders
                </p>
              </CardContent>
            </Card>
          </StaggeredItem>

          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-orange-200 bg-orange-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  <NumberCounter to={stats.pendingPOs} duration={1.5} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting response
                </p>
              </CardContent>
            </Card>
          </StaggeredItem>

          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  <NumberCounter to={stats.inTransit} duration={1.5} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently shipping
                </p>
              </CardContent>
            </Card>
          </StaggeredItem>

          <StaggeredItem>
            <Card className="hover:shadow-lg transition-all duration-300 border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Technical Docs</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  <NumberCounter to={stats.documents} duration={1.5} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Available documents
                </p>
              </CardContent>
            </Card>
          </StaggeredItem>
        </StaggeredList>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>View and manage incoming purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {posLoading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : !purchaseOrders || purchaseOrders.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No purchase orders"
              description="Purchase orders from labs will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
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
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintPO(po.id)}
                          data-testid={`button-print-po-${po.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <UpdatePOStatusDialog po={po} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TechnicalDocumentManager />
    </motion.div>
  );
}
