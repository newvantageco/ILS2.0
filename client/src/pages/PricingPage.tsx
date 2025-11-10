import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Building2,
  Beaker,
  Stethoscope,
  ArrowRight,
  Phone,
  MessageSquare,
  Sparkles,
  Shield,
  Zap,
  Users,
  Heart,
  Bot,
  Globe,
  Database,
  Lock
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSelectPlan = (plan: string) => {
    if (plan === "enterprise") {
      toast({
        title: "Contact Sales",
        description: "Our team will reach out to discuss your enterprise needs.",
      });
    } else {
      setLocation("/email-signup");
      toast({
        title: `${plan} Edition Selected`,
        description: "Create your account to start your 30-day free trial",
      });
    }
  };

  const handleContactSales = () => {
    toast({
      title: "Contact Sales",
      description: "Email us at sales@ils2.com or call +44 (0) 20 7946 0958",
    });
  };

  const plans = [
    {
      id: "practice",
      name: "Practice Edition",
      tagline: "Your Digital Front Desk & Clinical Assistant",
      icon: Stethoscope,
      price: "$199",
      period: "/month",
      description: "Perfect for independent optometrists and small optical practices (1-10 locations)",
      popular: false,
      features: [
        { name: "Patient & Appointment Management", included: true },
        { name: "Digital Eye Examinations", included: true },
        { name: "Prescription Management & Templates", included: true },
        { name: "Inventory & Point of Sale", included: true },
        { name: "Shopify E-Commerce Integration", included: true },
        { name: "NHS Compliance & Vouchers", included: true },
        { name: "AI Clinical Assistant", included: true },
        { name: "Basic Analytics & Reporting", included: true },
        { name: "Email Support", included: true },
        { name: "5 User Accounts", included: true },
        { name: "Production Queue Management", included: false },
        { name: "Advanced Analytics & BI", included: false },
        { name: "API Access", included: false },
        { name: "Multi-location Support", included: false },
        { name: "Healthcare Platform (RCM, Population Health)", included: false },
      ],
      cta: "Start Free Trial",
      highlight: false,
    },
    {
      id: "laboratory",
      name: "Laboratory Edition",
      tagline: "Production Intelligence & Quality at Scale",
      icon: Beaker,
      price: "$699",
      period: "/month",
      description: "Built for optical laboratories and manufacturing facilities",
      popular: true,
      features: [
        { name: "Everything in Practice Edition", included: true },
        { name: "Production Tracking & Queue Management", included: true },
        { name: "Quality Control Workflows", included: true },
        { name: "Equipment Management & Monitoring", included: true },
        { name: "Supplier & Purchase Order Management", included: true },
        { name: "Advanced Analytics & Business Intelligence", included: true },
        { name: "AI-Powered Demand Forecasting", included: true },
        { name: "Automated Purchase Orders", included: true },
        { name: "API Access & Webhooks", included: true },
        { name: "Multi-location Support", included: true },
        { name: "Priority Email & Chat Support", included: true },
        { name: "20 User Accounts", included: true },
        { name: "Custom Integrations", included: false },
        { name: "Healthcare Platform (RCM, Population Health)", included: false },
        { name: "Dedicated Account Manager", included: false },
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Edition",
      tagline: "Complete Healthcare Platform for Optical Excellence",
      icon: Building2,
      price: "Custom",
      period: "pricing",
      description: "For hospital systems, large optical chains, and healthcare enterprises",
      popular: false,
      features: [
        { name: "Everything in Laboratory Edition", included: true },
        { name: "Revenue Cycle Management (RCM)", included: true },
        { name: "Population Health Management", included: true },
        { name: "Quality & Compliance Reporting", included: true },
        { name: "mHealth & Remote Monitoring", included: true },
        { name: "Clinical Research Platform", included: true },
        { name: "Telehealth Capabilities", included: true },
        { name: "SSO (SAML, OIDC)", included: true },
        { name: "Advanced RBAC & Permissions", included: true },
        { name: "Custom Branding & White-label", included: true },
        { name: "Unlimited User Accounts", included: true },
        { name: "Dedicated Support Team", included: true },
        { name: "SLA Guarantees (99.9% uptime)", included: true },
        { name: "On-Premise Deployment Option", included: true },
        { name: "SOC 2, HIPAA, GDPR Compliance", included: true },
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: "Core Features",
      features: [
        { name: "Patient Management", practice: true, laboratory: true, enterprise: true },
        { name: "Digital Examinations", practice: true, laboratory: true, enterprise: true },
        { name: "Prescription Management", practice: true, laboratory: true, enterprise: true },
        { name: "Point of Sale", practice: true, laboratory: true, enterprise: true },
        { name: "Inventory Management", practice: true, laboratory: true, enterprise: true },
        { name: "NHS Integration", practice: true, laboratory: true, enterprise: true },
      ],
    },
    {
      category: "Laboratory & Production",
      features: [
        { name: "Production Queue", practice: false, laboratory: true, enterprise: true },
        { name: "Quality Control", practice: false, laboratory: true, enterprise: true },
        { name: "Equipment Management", practice: false, laboratory: true, enterprise: true },
        { name: "Supplier Management", practice: false, laboratory: true, enterprise: true },
      ],
    },
    {
      category: "Analytics & Intelligence",
      features: [
        { name: "Basic Analytics", practice: true, laboratory: true, enterprise: true },
        { name: "Advanced BI & Reports", practice: false, laboratory: true, enterprise: true },
        { name: "AI Demand Forecasting", practice: false, laboratory: true, enterprise: true },
        { name: "Predictive Analytics", practice: false, laboratory: false, enterprise: true },
      ],
    },
    {
      category: "Healthcare Platform",
      features: [
        { name: "Revenue Cycle Management", practice: false, laboratory: false, enterprise: true },
        { name: "Population Health", practice: false, laboratory: false, enterprise: true },
        { name: "Quality Reporting", practice: false, laboratory: false, enterprise: true },
        { name: "Telehealth", practice: false, laboratory: false, enterprise: true },
        { name: "Clinical Research", practice: false, laboratory: false, enterprise: true },
      ],
    },
    {
      category: "Support & Compliance",
      features: [
        { name: "Email Support", practice: true, laboratory: true, enterprise: true },
        { name: "Priority Support", practice: false, laboratory: true, enterprise: true },
        { name: "Dedicated Account Manager", practice: false, laboratory: false, enterprise: true },
        { name: "SLA Guarantees", practice: false, laboratory: false, enterprise: true },
        { name: "SOC 2 / HIPAA Compliance", practice: false, laboratory: false, enterprise: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-background/95 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">ILS 2.0</h1>
              <p className="text-xs text-muted-foreground">Healthcare Operating System</p>
            </div>
          </div>
          <Button onClick={() => setLocation("/")} variant="ghost">
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <Badge className="mb-4" variant="outline">
          <Sparkles className="h-3 w-3 mr-1" />
          Transparent Pricing
        </Badge>
        <h1 className="text-5xl font-bold mb-6">
          Choose the Edition That Fits Your Practice
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          From independent practices to enterprise healthcare systems, we have a plan that scales with your needs.
          All plans include 30-day free trial, no credit card required.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.highlight
                    ? "border-primary shadow-xl scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {plan.tagline}
                  </CardDescription>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    size="lg"
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">Features include:</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Detailed Feature Comparison</h2>
          <p className="text-muted-foreground">
            See exactly what's included in each edition
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Practice</th>
                    <th className="text-center p-4 font-semibold bg-primary/5">Laboratory</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category) => (
                    <>
                      <tr key={category.category} className="bg-muted/30">
                        <td colSpan={4} className="p-4 font-semibold">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-4">{feature.name}</td>
                          <td className="text-center p-4">
                            {feature.practice ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4 bg-primary/5">
                            {feature.laboratory ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.enterprise ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trust & Security */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security, Every Plan</h2>
          <p className="text-muted-foreground">
            Your data is protected with the highest security standards, regardless of which plan you choose
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Full compliance with data protection regulations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Encrypted Data</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encryption for all patient data
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Database className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">
                Complete data isolation per organization
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">
                Reliable infrastructure with SLA guarantees
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I switch plans later?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's included in the free trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All plans include a 30-day free trial with full access to features. No credit card required to start.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you offer annual billing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Save 20% with annual billing. Contact sales for annual pricing details.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I add more users to my plan?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Additional users can be added for $25/month per user on Practice and Laboratory editions. Enterprise edition includes unlimited users.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of optical practices using ILS 2.0 to streamline their operations
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => handleSelectPlan("laboratory")}>
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleContactSales}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Talk to Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
