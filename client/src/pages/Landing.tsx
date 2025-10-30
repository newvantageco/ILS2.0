import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import {
  Glasses,
  ShoppingCart,
  BarChart3,
  FileText,
  Shield,
  Zap,
  Users,
  Building2,
  TrendingUp,
  LogIn,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Package,
  CreditCard,
  PieChart,
  Lock,
  Receipt,
  Scan,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: ShoppingCart,
      title: "Point of Sale",
      description: "Modern OTC retail till with barcode scanning, multi-payment support, and real-time inventory",
      badge: "NEW",
      color: "text-blue-500",
    },
    {
      icon: Building2,
      title: "Multi-Tenant Architecture",
      description: "Complete data isolation per company with enterprise-grade security and compliance",
      badge: "NEW",
      color: "text-purple-500",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Shopify-style dashboards with real-time metrics, trends, and performance insights",
      badge: "COMING SOON",
      color: "text-green-500",
    },
    {
      icon: FileText,
      title: "Smart PDF Generation",
      description: "Professional branded templates for receipts, invoices, prescriptions, and reports",
      badge: "COMING SOON",
      color: "text-orange-500",
    },
    {
      icon: Glasses,
      title: "Lens Management",
      description: "Complete order tracking from prescription to delivery with quality control",
      badge: "CORE",
      color: "text-cyan-500",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Intelligent automation for prescription analysis, recommendations, and support",
      badge: "CORE",
      color: "text-pink-500",
    },
  ];

  const stats = [
    { label: "Orders Processed", value: "10K+", icon: Package },
    { label: "Active Practices", value: "500+", icon: Building2 },
    { label: "Customer Satisfaction", value: "98%", icon: CheckCircle2 },
    { label: "Processing Time", value: "-60%", icon: Zap },
  ];

  const capabilities = [
    {
      category: "Retail & POS",
      items: [
        "Barcode scanning & quick search",
        "Multi-payment processing",
        "Automatic stock management",
        "Staff performance tracking",
        "Daily sales reports",
        "Refund & return handling",
      ],
      icon: Scan,
    },
    {
      category: "Multi-Tenant Security",
      items: [
        "Complete data isolation",
        "Company-scoped access",
        "Subscription enforcement",
        "Audit trail logging",
        "Role-based permissions",
        "Compliance ready",
      ],
      icon: Lock,
    },
    {
      category: "Business Intelligence",
      items: [
        "Real-time dashboards",
        "Sales trend analysis",
        "Product performance",
        "Customer insights",
        "Profit tracking",
        "Predictive analytics",
      ],
      icon: PieChart,
    },
    {
      category: "Professional Documents",
      items: [
        "Custom branded templates",
        "Automated receipts",
        "Invoice generation",
        "Prescription forms",
        "QR code integration",
        "Email delivery",
      ],
      icon: Receipt,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Glasses className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">ILS 2.0</h1>
              <p className="text-xs text-muted-foreground">Integrated Lens System</p>
            </div>
          </div>
          <Button onClick={() => setLocation("/login")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge className="gap-1">
                <Sparkles className="h-3 w-3" />
                Now with POS & Multi-Tenant
              </Badge>
            </div>
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              Complete Lens Management Platform
            </h2>
            <p className="text-xl text-muted-foreground">
              From prescription to retail—manage orders, inventory, sales, and analytics in one powerful system with enterprise-grade security.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setLocation("/email-signup")} className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Features
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <AnimatedCard key={index} className="p-6">
                <div className="space-y-2">
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 bg-muted/30 rounded-3xl mb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">Powerful Features</h3>
          <p className="text-muted-foreground text-lg">Everything you need to run your optical business</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedCard key={index} className="p-6 hover:shadow-xl transition-shadow">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-background ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <Badge variant={feature.badge === "NEW" ? "default" : "secondary"}>
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">Complete Capabilities</h3>
          <p className="text-muted-foreground text-lg">Built for modern optical practices</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <capability.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{capability.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {capability.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">60%</div>
                <div className="text-muted-foreground">Faster Processing</div>
              </div>
              <div>
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-muted-foreground">Data Security</div>
              </div>
              <div>
                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="space-y-6">
          <h3 className="text-4xl font-bold">Ready to transform your practice?</h3>
          <p className="text-xl text-muted-foreground">
            Join hundreds of optical practices using ILS 2.0 to streamline operations and boost revenue.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button size="lg" onClick={() => setLocation("/email-signup")} className="gap-2">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/login")}>
              Sign In to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Glasses className="h-5 w-5 text-primary" />
              <span className="font-semibold">ILS 2.0</span>
              <span className="text-sm text-muted-foreground">© 2025 All rights reserved</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
