import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, FileText, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export default function SupplierDashboard() {
  //todo: remove mock functionality
  const purchaseOrders = [
    {
      id: "PO-2024-501",
      material: "AR Coating - Premium",
      quantity: "500 units",
      status: "in_production" as const,
      dueDate: "2024-10-30",
    },
    {
      id: "PO-2024-502",
      material: "Polycarbonate Blanks 1.59",
      quantity: "1000 units",
      status: "shipped" as const,
      dueDate: "2024-10-25",
    },
    {
      id: "PO-2024-503",
      material: "High Index 1.67 Blanks",
      quantity: "250 units",
      status: "pending" as const,
      dueDate: "2024-11-05",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track purchase orders and manage your deliveries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Orders"
          value="12"
          icon={Package}
        />
        <StatCard
          title="Delivered This Month"
          value="38"
          icon={TrendingUp}
          trend={{ value: "+18% from last month", isPositive: true }}
        />
        <StatCard
          title="Technical Docs"
          value="156"
          icon={FileText}
        />
        <StatCard
          title="Pending Issues"
          value="2"
          icon={AlertCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md border border-border hover-elevate"
                data-testid={`card-po-${po.id}`}
              >
                <div className="flex-1">
                  <p className="font-semibold font-mono text-sm">{po.id}</p>
                  <p className="text-sm mt-1">{po.material}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {po.quantity}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{po.dueDate}</p>
                  </div>
                  <StatusBadge status={po.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`button-view-po-${po.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
