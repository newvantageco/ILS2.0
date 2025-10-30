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
  Phone,
  Mail,
  BookOpen,
  HelpCircle,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGetStarted = () => {
    setLocation("/email-signup");
    toast({
      title: "Welcome to ILS 2.0!",
      description: "Create your account to start your free trial",
    });
  };

  const handleSignIn = () => {
    setLocation("/login");
  };

  const handleLearnMore = (feature: string) => {
    toast({
      title: `Learn more about ${feature}`,
      description: "Full documentation coming soon. Contact support for details.",
    });
  };

  const handleContactSales = () => {
    toast({
      title: "Contact Sales",
      description: "Email us at sales@ils2.0 or call +44 (0) 20 7946 0958",
    });
  };

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
          <Button onClick={handleSignIn} className="gap-2" aria-label="Sign in">
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
              <Button size="lg" onClick={handleGetStarted} className="gap-2" aria-label="Get started free">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Explore features">
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
            <AnimatedCard 
              key={index} 
              className="p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleLearnMore(feature.title)}
            >
              <CardHeader className="p-0 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-background ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <Badge variant={feature.badge === "NEW" ? "default" : feature.badge === "CORE" ? "outline" : "secondary"}>
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground">{feature.description}</p>
                <p className="mt-3 text-sm text-primary hover:underline">
                  Learn more →
                </p>
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
        <div className="space-y-6 p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl border border-primary/20">
          <Badge className="gap-1 mb-2">
            <Sparkles className="h-3 w-3" />
            Special Launch Offer
          </Badge>
          <h3 className="text-4xl font-bold">Ready to transform your practice?</h3>
          <p className="text-xl text-muted-foreground">
            Join hundreds of optical practices using ILS 2.0 to streamline operations and boost revenue.
          </p>
          <div className="grid md:grid-cols-2 gap-4 pt-4 max-w-2xl mx-auto">
            <Card className="p-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold">For New Users</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>30-day free trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>No credit card required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full feature access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Free onboarding support</span>
                  </li>
                </ul>
                <Button size="lg" className="w-full gap-2 mt-4" onClick={handleGetStarted}>
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
            <Card className="p-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Existing Users</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Access your dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Manage orders & inventory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>View analytics & reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>24/7 platform access</span>
                  </li>
                </ul>
                <Button size="lg" variant="outline" className="w-full gap-2 mt-4" onClick={handleSignIn}>
                  Sign In to Dashboard
                  <LogIn className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
          <div className="pt-4">
            <Button variant="ghost" size="lg" onClick={handleContactSales} className="gap-2" aria-label="Talk to sales">
              <Phone className="h-4 w-4" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Glasses className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">ILS 2.0</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete lens management platform for modern optical practices.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("Pricing")} className="hover:text-foreground transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("Security")} className="hover:text-foreground transition-colors">
                    Security
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("Integrations")} className="hover:text-foreground transition-colors">
                    Integrations
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => handleLearnMore("Documentation")} className="hover:text-foreground transition-colors flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Documentation
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("API Reference")} className="hover:text-foreground transition-colors">
                    API Reference
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("Support")} className="hover:text-foreground transition-colors flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Support Center
                  </button>
                </li>
                <li>
                  <button onClick={() => handleLearnMore("Community")} className="hover:text-foreground transition-colors">
                    Community Forum
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a href="mailto:support@ils2.0" className="hover:text-foreground transition-colors">
                    support@ils2.0
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a href="tel:+442079460958" className="hover:text-foreground transition-colors">
                    +44 (0) 20 7946 0958
                  </a>
                </li>
                <li>
                  <Button variant="outline" size="sm" onClick={handleContactSales} className="mt-2 gap-2">
                    <Mail className="h-3 w-3" />
                    Contact Sales
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2025 ILS 2.0 - Integrated Lens System. All rights reserved.</p>
              <div className="flex gap-6">
                <button onClick={() => handleLearnMore("Privacy Policy")} className="hover:text-foreground transition-colors">
                  Privacy Policy
                </button>
                <button onClick={() => handleLearnMore("Terms of Service")} className="hover:text-foreground transition-colors">
                  Terms of Service
                </button>
                <button onClick={() => handleLearnMore("Cookie Policy")} className="hover:text-foreground transition-colors">
                  Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
