import { StatCard } from "@/components/StatCard";
import { OrderCard } from "@/components/OrderCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function ECPDashboard() {
  const [searchValue, setSearchValue] = useState("");

  //todo: remove mock functionality
  const recentOrders = [
    {
      orderId: "ORD-2024-1001",
      patientName: "John Smith",
      ecp: "Vision Care Center",
      status: "in_production" as const,
      orderDate: "2024-10-20",
      lensType: "Progressive",
      coating: "Anti-Reflective",
    },
    {
      orderId: "ORD-2024-1002",
      patientName: "Sarah Johnson",
      ecp: "Eye Health Associates",
      status: "quality_check" as const,
      orderDate: "2024-10-21",
      lensType: "Single Vision",
      coating: "Blue Light Filter",
    },
    {
      orderId: "ORD-2024-1003",
      patientName: "Michael Chen",
      ecp: "Clarity Optical",
      status: "shipped" as const,
      orderDate: "2024-10-19",
      lensType: "Bifocal",
      coating: "Scratch Resistant",
    },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value="127"
          icon={Package}
          trend={{ value: "+8 this week", isPositive: true }}
        />
        <StatCard
          title="In Production"
          value="12"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value="98"
          icon={CheckCircle}
          trend={{ value: "+15.2% from last month", isPositive: true }}
        />
        <StatCard
          title="Pending Review"
          value="3"
          icon={AlertCircle}
        />
      </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              {...order}
              onViewDetails={() => console.log(`View details for ${order.orderId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
