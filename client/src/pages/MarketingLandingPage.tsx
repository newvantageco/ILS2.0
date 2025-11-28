import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Shield,
  Zap,
  MessageSquare,
  Brain,
  BarChart3,
  Eye,
  ShoppingCart,
  Factory,
  Globe,
  Award,
  Rocket,
  Target,
  Clock,
  DollarSign,
  Sparkles,
  Heart,
  Lock,
  Workflow,
  LineChart,
  Play,
  Check,
  X,
  ChevronRight,
  Quote,
} from "lucide-react";

export default function MarketingLandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "enterprise">("professional");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">ILS</span>
              </div>
              <span className="font-bold text-xl">Integrated Lens System 2.0</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
                Benefits
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                Testimonials
              </a>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/login"}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => window.location.href = "/email-signup"}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 text-sm px-4 py-1" variant="secondary">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Trusted by 500+ Optical Practices Worldwide
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transform Your Optical Practice
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              The all-in-one platform that combines clinical excellence, patient engagement,
              business intelligence, and AI-powered automation to help you deliver exceptional
              care and grow your practice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = "/email-signup"}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Practices Using ILS</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2.5M+</div>
              <div className="text-sm text-muted-foreground">Patients Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10M+</div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-background" id="benefits">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Stop Juggling Multiple Systems</h2>
            <p className="text-xl text-muted-foreground">
              Most optical practices waste time and money managing 5-7 disconnected tools.
              ILS 2.0 brings everything into one unified platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <X className="h-6 w-6" />
                  The Old Way
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">Separate tools for appointments, EMR, communications, and billing</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">Manual data entry across multiple systems</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">No unified patient view or communication history</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">Paying for multiple expensive subscriptions</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">Limited analytics and no AI capabilities</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-6 w-6" />
                  The ILS 2.0 Way
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">All-in-one platform: Clinical + Engagement + Analytics + Retail</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Data flows automatically between modules</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">360° patient profiles with complete communication timeline</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">Single subscription replaces 5-7 tools</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-sm">AI-powered insights, forecasting, and automation</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-muted/30" id="features">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4" variant="outline">Platform Capabilities</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-xl text-muted-foreground">
              Comprehensive features designed specifically for modern optical practices
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Omnichannel Patient Engagement</CardTitle>
                <CardDescription>
                  Communicate across 5 channels from one unified inbox
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>SMS, Email, WhatsApp, Push, In-App</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Two-way conversations with threading</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Broadcast messaging with targeting</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Real-time delivery & engagement analytics</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>AI-Powered Automation</CardTitle>
                <CardDescription>
                  Let AI handle routine tasks while you focus on patient care
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>GPT-4 assistant for clinical queries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>ML forecasting for inventory & staffing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Automated patient recall workflows</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Smart send-time optimization</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Complete Clinical Suite</CardTitle>
                <CardDescription>
                  Comprehensive tools for eye care professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Digital eye examinations & records</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Prescription management & templates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Test room scheduling & conflicts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Clinical protocols & best practices</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle>Business Intelligence</CardTitle>
                <CardDescription>
                  Make data-driven decisions with real-time insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>4 specialized dashboards with 100+ metrics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Practice Pulse real-time overview</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Financial & operational analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Patient lifetime value tracking</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Retail & POS Integration</CardTitle>
                <CardDescription>
                  Seamlessly manage your optical retail operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Modern POS with offline support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Inventory with automated reordering</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI-powered Smart Frame Finder</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Integrated invoicing & payments</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  HIPAA & GDPR compliant by design, not by accident
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Full HIPAA compliance with audit trails</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>GDPR compliant consent management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Role-based access control (8 roles)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>End-to-end data encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4" variant="outline">Proven Results</Badge>
            <h2 className="text-4xl font-bold mb-4">Real Impact on Your Bottom Line</h2>
            <p className="text-xl text-muted-foreground">
              Practices using ILS 2.0 see measurable improvements within 30 days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-5xl font-bold text-primary mb-2">3x</div>
                <div className="text-lg font-semibold mb-2">Higher Patient Engagement</div>
                <p className="text-sm text-muted-foreground">
                  Multi-channel communication and automated workflows drive 3x more patient
                  interactions compared to traditional methods
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-5xl font-bold text-primary mb-2">60%</div>
                <div className="text-lg font-semibold mb-2">Time Saved on Admin</div>
                <p className="text-sm text-muted-foreground">
                  Automation, templates, and unified workflows save your staff 60% of time
                  previously spent on manual tasks
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-5xl font-bold text-primary mb-2">2.5x</div>
                <div className="text-lg font-semibold mb-2">Better Campaign ROI</div>
                <p className="text-sm text-muted-foreground">
                  Targeted segmentation and analytics tools achieve 2.5x better ROI than
                  generic outreach campaigns
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30" id="testimonials">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4" variant="outline">What Customers Say</Badge>
            <h2 className="text-4xl font-bold mb-4">Loved by Optical Professionals</h2>
            <p className="text-xl text-muted-foreground">
              Join hundreds of practices transforming their operations with ILS 2.0
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm mb-4">
                  "ILS 2.0 replaced 6 different tools we were using. The patient communication
                  features alone have increased our recall appointment bookings by 45%. Best
                  investment we've made in years."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">DW</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. David Wilson</div>
                    <div className="text-xs text-muted-foreground">Wilson Eye Care, London</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm mb-4">
                  "The AI-powered analytics have given us insights we never had before. We can
                  now predict inventory needs, optimize staffing, and identify at-risk patients
                  before they churn. Game-changing."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">SP</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Sarah Patterson</div>
                    <div className="text-xs text-muted-foreground">Practice Manager, Manchester</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm mb-4">
                  "Setup took less than an hour, and our team was fully trained within a day.
                  The visual workflow builder means we can create complex patient journeys
                  without calling IT. Absolutely brilliant!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">MK</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. Michael Kumar</div>
                    <div className="text-xs text-muted-foreground">Kumar Optometry, Birmingham</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background" id="pricing">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge className="mb-4" variant="outline">Simple Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Plans That Scale With Your Practice</h2>
            <p className="text-xl text-muted-foreground">
              All plans include core features. Scale up as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <Card className={selectedPlan === "starter" ? "border-2 border-primary" : ""}>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for solo practitioners</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">£199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Up to 500 patients</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>2 user accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Clinical suite & EMR</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Patient communications (1,000 msgs/mo)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Basic analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Email support</span>
                  </div>
                </div>
                <Button className="w-full" variant={selectedPlan === "starter" ? "default" : "outline"}
                  onClick={() => setSelectedPlan("starter")}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className={`${selectedPlan === "professional" ? "border-2 border-primary" : ""} relative`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <CardDescription>For growing practices</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">£499</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Up to 2,500 patients</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>10 user accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Everything in Starter, plus:</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Omnichannel comms (10,000 msgs/mo)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>AI assistant & automation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Advanced analytics & BI dashboards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Workflow automation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Priority support</span>
                  </div>
                </div>
                <Button className="w-full" variant={selectedPlan === "professional" ? "default" : "outline"}
                  onClick={() => setSelectedPlan("professional")}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className={selectedPlan === "enterprise" ? "border-2 border-primary" : ""}>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For practice groups</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Unlimited patients</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Unlimited users</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Everything in Professional, plus:</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Unlimited messaging</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Multi-location support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>White-labeling & custom branding</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Dedicated success manager</span>
                  </div>
                </div>
                <Button className="w-full" variant={selectedPlan === "enterprise" ? "default" : "outline"}
                  onClick={() => setSelectedPlan("enterprise")}>
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-2">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join 500+ optical practices using ILS 2.0 to deliver exceptional patient care,
            save time, and grow revenue. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 text-lg px-8 py-6"
              onClick={() => window.location.href = "/email-signup"}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm mt-6 opacity-75">
            No credit card required • 14-day free trial • Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">ILS</span>
                </div>
                <span className="font-bold">ILS 2.0</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The all-in-one optical practice management platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-sm">
                <div><a href="#features" className="text-muted-foreground hover:text-foreground">Features</a></div>
                <div><a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a></div>
                <div><a href="/platform-showcase" className="text-muted-foreground hover:text-foreground">Platform Showcase</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-foreground">Integrations</a></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <div className="space-y-2 text-sm">
                <div><a href="#" className="text-muted-foreground hover:text-foreground">About Us</a></div>
                <div><a href="#testimonials" className="text-muted-foreground hover:text-foreground">Customers</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-sm">
                <div><a href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</a></div>
                <div><a href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</a></div>
                <div><a href="/gdpr" className="text-muted-foreground hover:text-foreground">GDPR</a></div>
                <div><a href="#" className="text-muted-foreground hover:text-foreground">Security</a></div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Integrated Lens System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
