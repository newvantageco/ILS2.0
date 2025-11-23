import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard, SkeletonStats } from "@/components/ui";
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Glasses,
  Receipt
} from "lucide-react";
import { Link } from "wouter";
import { PatientHandoffNotification } from "@/components/pos/PatientHandoffNotification";

interface DashboardStats {
  todaySales: number;
  patientsServed: number;
  activeHandoffs: number;
  monthSales: number;
  pendingTransactions: number;
  completedToday: number;
}

export default function DispenserDashboard() {
  const { user } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/pos/dashboard-stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in p-6">
        {/* Loading Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 p-8">
          <div className="h-24 animate-pulse bg-white/10 rounded-lg" />
        </div>
        <SkeletonStats />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Modern Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Glasses className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dispenser Dashboard</h1>
                <p className="text-white/90 mt-1">
                  Welcome back, {user?.firstName}! Manage your POS and patient handoffs.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/ecp/pos">
                <Button size="lg" className="gap-2 bg-white text-orange-600 hover:bg-white/90">
                  <ShoppingCart className="h-5 w-5" />
                  Open POS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Sales"
          value={`£${stats?.todaySales?.toFixed(2) || "0.00"}`}
          subtitle={`${stats?.completedToday || 0} transactions completed`}
          icon={Receipt}
          variant="success"
          trend={{
            value: 8.5,
            isPositive: true,
            label: "vs yesterday",
          }}
        />
        <StatsCard
          title="Patients Served"
          value={(stats?.patientsServed || 0).toString()}
          subtitle="Today"
          icon={Users}
          variant="default"
          trend={{
            value: 12.3,
            isPositive: true,
            label: "vs average",
          }}
        />
        <StatsCard
          title="Active Handoffs"
          value={(stats?.activeHandoffs || 0).toString()}
          subtitle="Awaiting your action"
          icon={Package}
          variant="warning"
          trend={{
            value: stats?.activeHandoffs || 0,
            isPositive: (stats?.activeHandoffs || 0) === 0,
            label: "needs attention",
          }}
        />
        <StatsCard
          title="This Month"
          value={`£${stats?.monthSales?.toFixed(2) || "0.00"}`}
          subtitle="Monthly revenue"
          icon={TrendingUp}
          variant="primary"
          trend={{
            value: 15.2,
            isPositive: true,
            label: "vs last month",
          }}
        />
      </div>

      {/* Patient Handoff Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Patient Handoffs
          </CardTitle>
          <CardDescription>
            Manage patient transfers from optometrists. Accept handoffs to complete dispensing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientHandoffNotification 
            onSelectPatient={(patientId, examination) => {
              // Handle patient selection - could navigate to patient details
              console.log('Selected patient:', patientId, examination);
            }}
            onDismiss={() => {
              // Handle dismissal - could show a toast or update state
              console.log('Notification dismissed');
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Point of Sale
            </CardTitle>
            <CardDescription>
              Process transactions and manage sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ecp/pos">
              <Button variant="outline" className="w-full gap-2">
                Open POS
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Patients
            </CardTitle>
            <CardDescription>
              View and manage patient records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ecp/patients">
              <Button variant="outline" className="w-full gap-2">
                View Patients
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Inventory
            </CardTitle>
            <CardDescription>
              Check stock levels and manage inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ecp/inventory">
              <Button variant="outline" className="w-full gap-2">
                View Inventory
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your recent transactions and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.completedToday === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No activity yet today</p>
                <p className="text-sm">Start by opening the POS or checking patient handoffs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* This would be populated with actual recent transactions */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Transaction completed</p>
                    <p className="text-xs text-muted-foreground">Recent activity will appear here</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Quick tips for using the Dispenser dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            Accept patient handoffs from the "Patient Handoffs" section above
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            Use the POS system to process sales and manage transactions
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            Check inventory levels before completing patient orders
          </p>
          <p className="flex items-start gap-2">
            <span className="text-primary font-semibold">•</span>
            View patient records to check prescription details
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
