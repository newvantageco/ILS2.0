import { StatCard } from "@/components/StatCard";
import { OrderCard } from "@/components/OrderCard";
import { SearchBar } from "@/components/SearchBar";
import { ConsultLogManager } from "@/components/ConsultLogManager";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCardSkeleton, OrderCardSkeleton } from "@/components/ui/CardSkeleton";
import { Package, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import type { OrderWithDetails } from "@shared/schema";

interface OrderStats {
  total: number;
  pending: number;
  inProduction: number;
  completed: number;
}

export default function ECPDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<OrderStats>({
    queryKey: ["/api/stats"],
  });

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
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

  const recentOrders = orders?.slice(0, 6) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold truncate">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's your order overview.
          </p>
        </div>
        <Link href="/ecp/new-order" className="shrink-0">
          <Button data-testid="button-new-order" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
            title="Completed"
            value={stats?.completed.toString() || "0"}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending"
            value={stats?.pending.toString() || "0"}
            icon={AlertCircle}
          />
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Orders</h2>
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search orders..."
            className="w-full sm:max-w-sm"
          />
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Get started by creating your first lens order."
            action={{
              label: "Create Order",
              onClick: () => setLocation("/ecp/new-order"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                orderId={order.orderNumber}
                patientName={order.patient.name}
                ecp={order.ecp.organizationName || `${order.ecp.firstName} ${order.ecp.lastName}`}
                status={order.status}
                orderDate={new Date(order.orderDate).toISOString().split('T')[0]}
                lensType={order.lensType}
                coating={order.coating}
                onViewDetails={() => setLocation(`/order/${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ConsultLogManager />
    </div>
  );
}
