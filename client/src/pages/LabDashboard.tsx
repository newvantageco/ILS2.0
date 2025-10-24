import { StatCard } from "@/components/StatCard";
import { OrderTable } from "@/components/OrderTable";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { Package, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithDetails } from "@shared/schema";

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
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search orders, patients, or ECPs..."
          />
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
            onViewDetails={(id) => console.log(`View details for ${id}`)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
}
