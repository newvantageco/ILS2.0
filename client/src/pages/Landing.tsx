import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Glasses, Package, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">ILS</span>
            </div>
            <h1 className="font-semibold text-lg">Integrated Lens System</h1>
          </div>
          <Button onClick={handleLogin} data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-6xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Welcome to the Integrated Lens System</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A unified platform for managing lens orders, production workflows, and quality control across eye care professionals, labs, and suppliers.
            </p>
            <div className="pt-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-login-cta">
                Get Started
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Glasses className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Eye Care Professionals</h3>
                <p className="text-sm text-muted-foreground">
                  Submit and track lens orders with real-time production updates.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Lab Technicians</h3>
                <p className="text-sm text-muted-foreground">
                  Manage production queue and quality control workflows efficiently.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Engineers</h3>
                <p className="text-sm text-muted-foreground">
                  Access analytics, equipment tracking, and R&D project management.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  Manage purchase orders and maintain technical documentation library.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border p-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Integrated Lens System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
