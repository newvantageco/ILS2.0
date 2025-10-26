import { StatCard } from "@/components/StatCard";
import { OrderCard } from "@/components/OrderCard";
import { SearchBar } from "@/components/SearchBar";
import { ConsultLogManager } from "@/components/ConsultLogManager";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your order overview.
          </p>
        </div>
        <Link href="/ecp/new-order">
          <Button data-testid="button-new-order">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <SearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search orders..."
            className="max-w-sm"
          />
        </div>

        {ordersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-card rounded-md animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first lens order.
            </p>
            <Link href="/ecp/new-order">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                onViewDetails={() => console.log(`View details for ${order.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ConsultLogManager />
    </div>
  );
}
