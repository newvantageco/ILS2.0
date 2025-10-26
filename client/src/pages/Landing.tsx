import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Glasses, Package, Users, TrendingUp, CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">ILS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Integrated Lens System</h1>
              <p className="text-xs text-muted-foreground">Enterprise Lens Management</p>
            </div>
          </div>
          <Button onClick={handleLogin} size="lg" data-testid="button-login" className="shadow-md">
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Zap className="h-4 w-4" />
                Streamline Your Lens Production Workflow
              </div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to the Future of Lens Management
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                A unified platform for managing lens orders, production workflows, and quality control across eye care professionals, labs, and suppliers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button size="lg" onClick={handleLogin} data-testid="button-login-cta" className="shadow-lg text-lg px-8 h-12">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-12" data-testid="button-learn-more" onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Learn More
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Real-time Tracking
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Quality Control
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Secure & Compliant
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Role</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools tailored to each stakeholder in the lens production ecosystem
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover-elevate border-2 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Glasses className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Eye Care Professionals</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Submit and track lens orders with real-time production updates and seamless communication.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate border-2 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Package className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Lab Technicians</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Manage production queue and quality control workflows with efficiency and precision.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate border-2 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Engineers</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Access analytics, equipment tracking, and comprehensive R&D project management tools.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate border-2 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">Suppliers</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Manage purchase orders and maintain a comprehensive technical documentation library.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ILS?</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to streamline your entire lens production workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Lightning Fast</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time updates and instant notifications keep everyone in sync across your entire operation.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Secure & Reliable</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Enterprise-grade security with role-based access control and comprehensive audit trails.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Data-Driven Insights</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Advanced analytics and reporting help you make informed decisions and optimize production.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background border-y border-border">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Workflow?</h3>
            <p className="text-lg text-muted-foreground">
              Join leading lens manufacturers and eye care professionals who trust ILS for their production management.
            </p>
            <div className="pt-4">
              <Button size="lg" onClick={handleLogin} className="shadow-lg text-lg px-10 h-12">
                Get Started Today
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">ILS</span>
              </div>
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Integrated Lens System. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
