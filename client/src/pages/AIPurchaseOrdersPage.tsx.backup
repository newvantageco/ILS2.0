import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle, Package, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIPurchaseOrderItem {
  id: string;
  productId: string;
  productName: string | null;
  productSku: string | null;
  currentStock: number;
  recommendedQuantity: number;
  urgency: string;
  stockoutRisk: number;
  estimatedCost: number;
}

interface AIPurchaseOrder {
  id: string;
  companyId: string;
  supplierId: string | null;
  supplierName: string | null;
  estimatedTotal: number;
  reason: string;
  aiAnalysis: any;
  confidence: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'converted';
  reviewedById: string | null;
  reviewNotes: string | null;
  convertedPoId: string | null;
  generatedAt: string;
  reviewedAt: string | null;
  items: AIPurchaseOrderItem[];
}

interface Stats {
  totalDrafts: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalEstimatedValue: number;
}

export default function AIPurchaseOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AIPurchaseOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AIPurchaseOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending_review");

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab === "all" ? "" : `&status=${activeTab}`;
      const response = await fetch(`/api/ai-purchase-orders?limit=50${statusFilter}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch AI purchase orders');
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load AI purchase orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ai-purchase-orders/stats/summary', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateNewOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-purchase-orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to generate purchase orders');
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Generated ${data.draftPOs?.length || 0} draft purchase orders`
      });
      
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error generating orders:', error);
      toast({
        title: "Error",
        description: "Failed to generate purchase orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-purchase-orders/${selectedOrder.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes || undefined }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to approve purchase order');
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Purchase order approved and converted (PO #${data.convertedPoId})`
      });
      
      setShowApproveDialog(false);
      setShowDetailDialog(false);
      setReviewNotes("");
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error approving order:', error);
      toast({
        title: "Error",
        description: "Failed to approve purchase order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ai-purchase-orders/${selectedOrder.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reviewNotes }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to reject purchase order');
      
      toast({
        title: "Success",
        description: "Purchase order rejected"
      });
      
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setReviewNotes("");
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Error",
        description: "Failed to reject purchase order",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/ai-purchase-orders/${orderId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch order details');
      
      const data = await response.json();
      setSelectedOrder(data);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      draft: { color: "bg-gray-500", label: "Draft" },
      pending_review: { color: "bg-yellow-500", label: "Pending Review" },
      approved: { color: "bg-green-500", label: "Approved" },
      rejected: { color: "bg-red-500", label: "Rejected" },
      converted: { color: "bg-blue-500", label: "Converted" }
    };
    
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, string> = {
      critical: "bg-red-600",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500"
    };
    
    return <Badge className={variants[urgency] || variants.medium}>{urgency.toUpperCase()}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve AI-generated purchase orders based on inventory levels
          </p>
        </div>
        <Button onClick={generateNewOrders} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate New Orders
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDrafts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEstimatedValue)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>AI-generated purchase orders based on inventory analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No purchase orders found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Generated</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Estimated Total</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {new Date(order.generatedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {order.supplierName || 'No Supplier'}
                        </TableCell>
                        <TableCell>
                          {order.items?.length || 0} items
                        </TableCell>
                        <TableCell>
                          {formatCurrency(order.estimatedTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.confidence >= 80 ? "default" : "secondary"}>
                            {order.confidence.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              Review AI-generated purchase order and approve or reject
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{selectedOrder.supplierName || 'No Supplier Assigned'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Generated At</Label>
                  <p>{new Date(selectedOrder.generatedAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">AI Confidence</Label>
                  <p className="font-medium">{selectedOrder.confidence.toFixed(1)}%</p>
                </div>
              </div>

              {/* AI Reasoning */}
              <div>
                <Label className="text-muted-foreground">AI Justification</Label>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap">{selectedOrder.reason}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Items */}
              <div>
                <Label className="text-muted-foreground">Items ({selectedOrder.items?.length || 0})</Label>
                <Table className="mt-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Recommended Qty</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Est. Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName || 'Unknown'}</p>
                            {item.productSku && (
                              <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.currentStock === 0 ? "destructive" : "secondary"}>
                            {item.currentStock}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.recommendedQuantity}</TableCell>
                        <TableCell>{getUrgencyBadge(item.urgency)}</TableCell>
                        <TableCell>
                          <Badge variant={item.stockoutRisk >= 70 ? "destructive" : "secondary"}>
                            {item.stockoutRisk.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.estimatedCost)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="text-right">
                  <Label className="text-muted-foreground">Estimated Total</Label>
                  <p className="text-2xl font-bold">{formatCurrency(selectedOrder.estimatedTotal)}</p>
                </div>
              </div>

              {/* Review Notes (if reviewed) */}
              {selectedOrder.reviewNotes && (
                <div>
                  <Label className="text-muted-foreground">Review Notes</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p>{selectedOrder.reviewNotes}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              {selectedOrder.status === 'pending_review' && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailDialog(false);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      setShowApproveDialog(true);
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              This will create an official purchase order and notify relevant parties
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Review Notes (Optional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setShowDetailDialog(true);
                setReviewNotes("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Purchase Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this purchase order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Explain why you're rejecting this purchase order..."
                className="mt-2"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setShowDetailDialog(true);
                setReviewNotes("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !reviewNotes.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
