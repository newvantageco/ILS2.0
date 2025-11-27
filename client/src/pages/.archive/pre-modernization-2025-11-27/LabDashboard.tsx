import { StatCard } from "@/components/StatCard";
import { OrderTable } from "@/components/OrderTable";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { CreatePurchaseOrderDialog } from "@/components/CreatePurchaseOrderDialog";
import { ShipOrderDialog } from "@/components/ShipOrderDialog";
import { SuppliersTable } from "@/components/SuppliersTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCardSkeleton } from "@/components/ui/CardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle, TrendingUp, Printer, Mail, ClipboardList, Wifi, WifiOff, Beaker, Plus, Activity } from "lucide-react";
import { StatsCard, SkeletonStats } from "@/components/ui";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createOptimisticHandlers, optimisticArrayUpdate } from "@/lib/optimisticUpdates";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  
  // WebSocket for real-time updates
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  const ws = useWebSocket(wsUrl);
  
  // Join company room on connection
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && user?.companyId) {
      ws.send(JSON.stringify({
        type: 'join-company',
        companyId: user.companyId
      }));
    }
  }, [ws, user?.companyId]);
  
  // Listen for real-time order events
  useEffect(() => {
    if (!ws) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'order:created':
            toast({
              title: "New Order Created",
              description: `Order ${message.data.orderNumber} has been created`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            break;
            
          case 'order:status_changed':
            toast({
              title: "Order Status Updated",
              description: `Order ${message.data.orderNumber} is now ${message.data.newStatus}`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            break;
            
          case 'order:shipped':
            toast({
              title: "Order Shipped",
              description: `Order ${message.data.orderNumber} has been shipped`,
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    ws.addEventListener('message', handleMessage);
    
    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, toast]);

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
    ...createOptimisticHandlers<OrderWithDetails[], { id: string; status: string }>({
      queryKey: ordersQueryKey,
      updater: (oldData, variables) => {
        return optimisticArrayUpdate(oldData, variables.id, (order) => ({
          ...order,
          status: variables.status as any,
        })) || [];
      },
      successMessage: "Status updated",
      errorMessage: "Failed to update status",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl gradient-secondary p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Beaker className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">Lab Dashboard</h1>
                  <Badge
                    variant={ws && ws.readyState === WebSocket.OPEN ? "default" : "secondary"}
                    className="gap-2 bg-white/20 backdrop-blur-sm border-white/30"
                  >
                    {ws && ws.readyState === WebSocket.OPEN ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        Live Updates
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-white/90 mt-1">
                  Monitor production status and manage your order queue
                </p>
              </div>
            </div>
            <CreatePurchaseOrderDialog />
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="purchase-orders" data-testid="tab-purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6 mt-6">
          {/* Enhanced Stats Grid - Beautiful Modern Cards */}
          {statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Orders"
                value={stats?.total.toString() || "0"}
                subtitle="All time orders"
                icon={Package}
                variant="default"
                trend={{
                  value: 8.5,
                  isPositive: true,
                  label: "vs last week",
                }}
              />
              <StatsCard
                title="In Production"
                value={stats?.inProduction.toString() || "0"}
                subtitle="Currently processing"
                icon={Activity}
                variant="primary"
                trend={{
                  value: 12.3,
                  isPositive: true,
                  label: "production rate",
                }}
              />
              <StatsCard
                title="Completed Today"
                value={completedToday.toString()}
                subtitle="Successfully finished"
                icon={CheckCircle}
                variant="success"
                trend={{
                  value: 15.8,
                  isPositive: true,
                  label: "vs yesterday",
                }}
              />
              <StatsCard
                title="Efficiency Rate"
                value={`${efficiencyRate}%`}
                subtitle="Overall completion rate"
                icon={TrendingUp}
                variant="default"
                trend={{
                  value: efficiencyRate,
                  isPositive: efficiencyRate >= 75,
                  label: "target: 80%",
                }}
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
              <EmptyState
                icon={ClipboardList}
                title="No orders found"
                description={
                  searchValue || statusFilter 
                    ? "Try adjusting your search or filters." 
                    : "Orders will appear here once they are created."
                }
              />
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
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div>
              <h3 className="font-semibold text-base">Purchase Orders</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Manage purchase orders and send them to suppliers</p>
            </div>
            <CreatePurchaseOrderDialog />
          </div>

          {purchaseOrders && purchaseOrders.length > 0 ? (
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Active Purchase Orders
                </CardTitle>
                <CardDescription>Track and manage orders sent to suppliers</CardDescription>
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
            <Card className="border-2 border-dashed">
              <CardContent className="py-16">
                <EmptyState
                  icon={Package}
                  title="No Purchase Orders Yet"
                  description="Create your first purchase order to start ordering from suppliers."
                  action={{
                    label: "Create Purchase Order",
                    onClick: () => {}, // Handled by CreatePurchaseOrderDialog
                  }}
                />
                <div className="flex justify-center mt-6">
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
