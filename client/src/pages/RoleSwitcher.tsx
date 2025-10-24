import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Beaker, Package, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function RoleSwitcher() {
  const [, setLocation] = useLocation();

  const roles = [
    {
      title: "Eye Care Professional",
      description: "Submit orders, track status, and manage patient prescriptions",
      icon: Users,
      path: "/ecp/dashboard",
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    {
      title: "Lab Technician",
      description: "Manage production queue, update order status, and quality control",
      icon: Package,
      path: "/lab/dashboard",
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Principal Engineer",
      description: "Analytics hub, equipment tracking, and R&D project management",
      icon: Beaker,
      path: "/engineer/dashboard",
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    },
    {
      title: "Supplier",
      description: "View purchase orders, manage deliveries, and technical documentation",
      icon: Building2,
      path: "/supplier/dashboard",
      color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-md bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-2xl">ILS</span>
          </div>
          <h1 className="text-3xl font-bold">Integrated Lens System</h1>
          <p className="text-muted-foreground mt-2">
            Select your role to access the portal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.title} className="hover-elevate">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-md ${role.color} flex items-center justify-center mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setLocation(role.path)}
                    data-testid={`button-role-${role.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Access Portal
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
