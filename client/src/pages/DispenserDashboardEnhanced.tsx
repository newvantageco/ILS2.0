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
import { motion } from "framer-motion";
import { NumberCounter, StaggeredList, StaggeredItem } from "@/components/ui/AnimatedComponents";
import { pageVariants } from "@/lib/animations";

interface DashboardStats {
  todaySales: number;
  patientsServed: number;
  activeHandoffs: number;
  monthSales: number;
  pendingTransactions: number;
  completedToday: number;
}

export default function DispenserDashboardEnhanced() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/pos/dashboard-stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in p-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 p-8">
          <div className="h-24 animate-pulse bg-white/10 rounded-lg" />
        </div>
        <SkeletonStats />
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
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

      {/* Enhanced Stats Grid with Animations */}
      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300 border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <Receipt className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                £<NumberCounter to={stats?.todaySales || 0} duration={1.5} decimals={2} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <NumberCounter to={stats?.completedToday || 0} duration={1} /> transactions completed
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients Served</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <NumberCounter to={stats?.patientsServed || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Today
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300 border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Handoffs</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                <NumberCounter to={stats?.activeHandoffs || 0} duration={1.5} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting your action
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-all duration-300 border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                £<NumberCounter to={stats?.monthSales || 0} duration={1.5} decimals={2} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly revenue
              </p>
            </CardContent>
          </Card>
        </StaggeredItem>
      </StaggeredList>

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
              console.log('Selected patient:', patientId, examination);
            }}
            onDismiss={() => {
              console.log('Notification dismissed');
            }}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <StaggeredList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StaggeredItem>
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
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Patient Management
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
        </StaggeredItem>

        <StaggeredItem>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Inventory
              </CardTitle>
              <CardDescription>
                Check stock levels and order supplies
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
        </StaggeredItem>
      </StaggeredList>
    </motion.div>
  );
}
