import { StatCard } from "@/components/StatCard";
import { OrderTable } from "@/components/OrderTable";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { CreatePurchaseOrderDialog } from "@/components/CreatePurchaseOrderDialog";
import { ShipOrderDialog } from "@/components/ShipOrderDialog";
import { SuppliersTable } from "@/components/SuppliersTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle, TrendingUp, Printer, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { OrderWithDetails, PurchaseOrderWithDetails } from "@shared/schema";

interface OrderStats {
  total: number;
  pending: number;
  inProduction: number;
  completed: number;
}

export default function LabDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ecpFilter, setEcpFilter] = useState("");
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<OrderStats>({
    queryKey: ["/api/stats"],
  });

  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);
  if (searchValue) queryParams.append("search", searchValue);
  
  const queryString = queryParams.toString();
  const ordersQueryKey = queryString ? ["/api/orders", `?${queryString}`] : ["/api/orders"];

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery<OrderWithDetails[]>({
    queryKey: ordersQueryKey,
  });

  const { data: purchaseOrders, isLoading: posLoading } = useQuery<PurchaseOrderWithDetails[]>({
    queryKey: ["/api/purchase-orders"],
  });

  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError as Error)) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [statsError, toast]);

  useEffect(() => {
    if (ordersError && isUnauthorizedError(ordersError as Error)) {
      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
    }
  }, [ordersError, toast]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
      } else {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleShipOrder = (id: string) => {
    setSelectedOrderId(id);
    setShipDialogOpen(true);
  };

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

  const emailPOMutation = useMutation({
    mutationFn: async (poId: string) => {
      const response = await apiRequest("POST", `/api/purchase-orders/${poId}/email`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Purchase order has been emailed to the supplier.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const tableOrders = (orders || []).map((order: OrderWithDetails) => ({
    id: order.id,
    patientName: order.patient.name,
    ecp: order.ecp.organizationName || `${order.ecp.firstName} ${order.ecp.lastName}`,
    status: order.status,
    orderDate: new Date(order.orderDate).toISOString().split('T')[0],
    lensType: order.lensType,
  }));

  const efficiencyRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const completedToday = stats?.completed || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lab Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor production status and manage your order queue.
        </p>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="purchase-orders" data-testid="tab-purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6 mt-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-card rounded-md animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Orders"
                value={stats?.total.toString() || "0"}
                icon={Package}
              />
              <StatCard
                title="In Production"
                value={stats?.inProduction.toString() || "0"}
                icon={Clock}
              />
              <StatCard
                title="Completed Today"
                value={completedToday.toString()}
                icon={CheckCircle}
              />
              <StatCard
                title="Efficiency Rate"
                value={`${efficiencyRate}%`}
                icon={TrendingUp}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <SearchBar
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search orders, patients, or ECPs..."
              />
              <CreatePurchaseOrderDialog />
            </div>

            <FilterBar
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              ecpFilter={ecpFilter}
              onEcpChange={setEcpFilter}
              onClearFilters={() => {
                setStatusFilter("");
                setEcpFilter("");
              }}
            />

            {ordersLoading ? (
              <div className="h-96 bg-card rounded-md animate-pulse" />
            ) : tableOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchValue || statusFilter 
                    ? "Try adjusting your search or filters." 
                    : "Orders will appear here once they are created."}
                </p>
              </div>
            ) : (
              <OrderTable
                orders={tableOrders}
                onViewDetails={(id) => setLocation(`/order/${id}`)}
                onUpdateStatus={handleUpdateStatus}
                onShipOrder={handleShipOrder}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage purchase orders and send them to suppliers</p>
            <CreatePurchaseOrderDialog />
          </div>
          
          {purchaseOrders && purchaseOrders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id} data-testid={`row-po-${po.id}`}>
                        <TableCell className="font-medium" data-testid={`text-po-number-${po.id}`}>
                          {po.poNumber}
                        </TableCell>
                        <TableCell data-testid={`text-po-supplier-${po.id}`}>
                          {po.supplier.organizationName || 'Unknown'}
                        </TableCell>
                        <TableCell data-testid={`text-po-date-${po.id}`}>
                          {format(new Date(po.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell data-testid={`text-po-total-${po.id}`}>
                          ${parseFloat(po.totalAmount || "0").toFixed(2)}
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => emailPOMutation.mutate(po.id)}
                              disabled={emailPOMutation.isPending}
                              data-testid={`button-email-po-${po.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Purchase Orders</h3>
                  <p className="text-muted-foreground mb-4">Create your first purchase order to get started.</p>
                  <CreatePurchaseOrderDialog />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6 mt-6">
          <SuppliersTable />
        </TabsContent>
      </Tabs>

      <ShipOrderDialog
        orderId={selectedOrderId}
        open={shipDialogOpen}
        onOpenChange={setShipDialogOpen}
      />
    </div>
  );
}
