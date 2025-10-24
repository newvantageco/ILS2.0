import { StatCard } from "@/components/StatCard";
import { OrderTable } from "@/components/OrderTable";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";
import { Package, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function LabDashboard() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ecpFilter, setEcpFilter] = useState("");

  //todo: remove mock functionality
  const orders = [
    {
      id: "ORD-2024-1001",
      patientName: "John Smith",
      ecp: "Vision Care Center",
      status: "in_production" as const,
      orderDate: "2024-10-20",
      lensType: "Progressive",
    },
    {
      id: "ORD-2024-1002",
      patientName: "Sarah Johnson",
      ecp: "Eye Health Associates",
      status: "quality_check" as const,
      orderDate: "2024-10-21",
      lensType: "Single Vision",
    },
    {
      id: "ORD-2024-1003",
      patientName: "Michael Chen",
      ecp: "Clarity Optical",
      status: "pending" as const,
      orderDate: "2024-10-22",
      lensType: "Bifocal",
    },
    {
      id: "ORD-2024-1004",
      patientName: "Emily Davis",
      ecp: "Perfect Vision Clinic",
      status: "shipped" as const,
      orderDate: "2024-10-19",
      lensType: "Progressive",
    },
    {
      id: "ORD-2024-1005",
      patientName: "David Wilson",
      ecp: "Vision Care Center",
      status: "in_production" as const,
      orderDate: "2024-10-22",
      lensType: "Single Vision",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lab Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor production status and manage your order queue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value="1,234"
          icon={Package}
          trend={{ value: "+12.5% from last month", isPositive: true }}
        />
        <StatCard
          title="In Production"
          value="45"
          icon={Clock}
        />
        <StatCard
          title="Completed Today"
          value="23"
          icon={CheckCircle}
          trend={{ value: "+5.2% from yesterday", isPositive: true }}
        />
        <StatCard
          title="Efficiency Rate"
          value="94%"
          icon={TrendingUp}
          trend={{ value: "+2.1% from last week", isPositive: true }}
        />
      </div>

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

        <OrderTable
          orders={orders}
          onViewDetails={(id) => console.log(`View details for ${id}`)}
          onUpdateStatus={(id, status) => console.log(`Update ${id} to ${status}`)}
        />
      </div>
    </div>
  );
}
