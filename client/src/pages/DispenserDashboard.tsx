import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispenser Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName}! Manage your POS and patient handoffs.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ecp/pos">
            <Button size="lg" className="gap-2">
              <ShoppingCart className="h-5 w-5" />
              Open POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats?.todaySales?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.completedToday || 0} transactions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.patientsServed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Handoffs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeHandoffs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting your action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{stats?.monthSales?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly revenue
            </p>
          </CardContent>
        </Card>
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
