import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Glasses,
  Package,
  Users,
  TrendingUp,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  Mail,
  ArrowRight,
  Clock,
  Compass,
  Layers,
  LogIn,
  UserPlus,
  Sparkles,
  Brain,
  Cpu,
  Database,
  GitBranch,
  Gauge,
  AlertCircle,
  Cloud,
  Lock,
} from "lucide-react";
import { useLocation } from "wouter";
import { SiReplit } from "react-icons/si";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
  };

  const handleEmailLogin = () => {
    setLocation("/email-login");
  };

  const handleEmailSignup = () => {
    setLocation("/email-signup");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/85 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-xl">ILS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Integrated Lens System</h1>
              <p className="text-xs text-muted-foreground">Enterprise Lens Management</p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap">
            <a href="#overview" className="hover:text-foreground transition-colors" data-testid="nav-overview">
              Overview
            </a>
            <a href="#features" className="hover:text-foreground transition-colors" data-testid="nav-features">
              Features
            </a>
            <a href="#experience" className="hover:text-foreground transition-colors" data-testid="nav-experience">
              Experience
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors" data-testid="nav-workflow">
              Workflow
            </a>
          </nav>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleEmailLogin} variant="outline" data-testid="button-email-login">
              <Mail className="h-4 w-4 mr-2" />
              Email Sign In
            </Button>
            <Button onClick={handleReplitLogin} data-testid="button-replit-login" className="shadow-md">
              <SiReplit className="h-4 w-4 mr-2" />
              Replit Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section id="overview" className="relative py-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
              <div className="space-y-6 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                  <Zap className="h-4 w-4" />
                  Streamline Your Lens Production Workflow
                </div>
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Enterprise-Grade Lens Management, Powered by AI Intelligence
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                  Scale from startup to 10,000+ daily orders. ILS unifies order processing, quality control, and real-time LIMS integration with an intelligent system that learns, predicts, and optimizes your entire production workflow.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <Button size="lg" onClick={handleEmailSignup} data-testid="button-signup-cta" className="shadow-lg text-lg px-8 h-12">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create a New Account
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleEmailLogin} className="text-lg px-8 h-12 shadow-md" data-testid="button-returning-signin">
                    <LogIn className="h-5 w-5 mr-2" />
                    I&apos;m Already Using ILS
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    AI-Powered Insights
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Real-time LIMS Sync
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Enterprise Scale Ready
                  </div>
                </div>
              </div>
              <div className="bg-background/80 border border-border/60 rounded-2xl shadow-xl p-6 space-y-5 backdrop-blur">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Intelligent Features</span>
                  <h3 className="text-2xl font-semibold">Next-Gen Manufacturing Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    AI engines predict demand, optimize inventory, detect anomalies, and surface actionable intelligence in real-time.
                  </p>
                </div>
                <div className="grid gap-3">
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Brain className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Predictive Analytics</p>
                        <p className="text-xs text-muted-foreground">
                          Anticipate bottlenecks, forecast demand, optimize staffing automatically.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Cpu className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Anomaly Detection</p>
                        <p className="text-xs text-muted-foreground">
                          Spot quality issues, equipment failures, and process deviations instantly.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleReplitLogin} size="sm" variant="secondary" className="gap-2" data-testid="button-replit-cta">
                    <SiReplit className="h-4 w-4" />
                    Continue with Replit
                  </Button>
                  <Button onClick={handleEmailLogin} size="sm" variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="link-email-login">
                    Resume via Email
                    <ArrowRight className="h-4 w-4" />
                  </Button>
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

        <section className="py-20 px-6 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Sparkles className="h-4 w-4" />
                Enterprise Intelligence
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">AI-Powered Architecture</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Next-generation microservices built for scale, intelligence, and real-time LIMS integration
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Intelligent Predictions</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI models predict demand patterns, identify bottlenecks, and recommend optimizations before problems occur.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">LIMS Integration Hub</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Real-time bidirectional sync with your LIMS. Orders validate instantly, status updates push automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cloud className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Kubernetes Scale</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enterprise-grade Kubernetes orchestration handles 10,000+ orders daily with automatic scaling and failover.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Anomaly Detection</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    ML-powered monitoring detects quality issues, equipment failures, and process deviations in real-time.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gauge className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Live Performance Metrics</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Real-time dashboards track KPIs, production efficiency, and cost metrics across all workflows.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-lg">Enterprise Security</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    SOC 2 aligned controls, audit trails, MFA, SSO, and compliance-ready infrastructure built-in.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="experience" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold">A differentiated experience for every entry point</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Teams moving from spreadsheets get guided automation. Enterprise labs tap into extensible APIs and governance. Each persona lands in the view that matters most the moment they sign in.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/40">
                    <Compass className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Guided onboarding playbooks</p>
                      <p className="text-sm text-muted-foreground">
                        Pre-built checklists, sample orders, and contextual tips help new clinics publish their first workflow in under 30 minutes.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/40">
                    <Layers className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Continuity for returning teams</p>
                      <p className="text-sm text-muted-foreground">
                        Role-aware dashboards cache your last actions, surface overdue tasks, and pick up in-flight returns instantly.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-muted/40">
                    <BarChart3 className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold">Growth insights out of the box</p>
                      <p className="text-sm text-muted-foreground">
                        Benchmark metrics and production KPIs are ready on day one—no BI team required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                      <Sparkles className="h-4 w-4" />
                      New Practices
                    </div>
                    <h4 className="text-xl font-semibold">Launch with confidence</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Done-for-you data import from legacy systems</li>
                      <li>• Workflow templates curated by industry experts</li>
                      <li>• Concierge onboarding with a success engineer</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-2 border-border/60 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Established Labs
                    </div>
                    <h4 className="text-xl font-semibold">Scale without friction</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• SOC 2 aligned permissions with SSO and MFA</li>
                      <li>• Custom analytics feeds for equipment health</li>
                      <li>• Dedicated support with 4-hour response</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-2 border-border/60">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Shared Success
                    </div>
                    <h4 className="text-xl font-semibold">Collaborate in one space</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Invite suppliers, engineers, and customer service stakeholders with granular permissions and shared review queues.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-border/60">
                  <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Measurable Impact
                    </div>
                    <h4 className="text-xl font-semibold">Proof in 90 days</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Standard engagements report 35% faster order turnaround and 20% fewer reworks after the first quarter.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="py-20 px-6 bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Your next session, mapped</h3>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Returning users jump straight into prioritized tasks while new teams get a structured path to full production readiness.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="h-full border-2 border-border/60">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    01
                  </div>
                  <h4 className="font-semibold text-lg">Sign in your way</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Email, SSO, or partner credentials all route through the same secure gateway with contextual guidance.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full border-2 border-border/60">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    02
                  </div>
                  <h4 className="font-semibold text-lg">Resume or launch</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Personalized start screens surface your saved work, upcoming approvals, or guided setup checklist.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full border-2 border-border/60">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    03
                  </div>
                  <h4 className="font-semibold text-lg">Operate with clarity</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dynamic queues, quality checkpoints, and collaborative notes keep workstreams aligned minute-by-minute.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full border-2 border-border/60">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    04
                  </div>
                  <h4 className="font-semibold text-lg">Measure the win</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reports and alerts automatically share progress with stakeholders, proving value every cycle.
                  </p>
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
                Purpose-built for lens manufacturers at every scale—from boutique practices to national networks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Intelligent Automation</h4>
                <p className="text-muted-foreground leading-relaxed">
                  AI engines handle complex logic, reducing manual work by 60% while improving accuracy and consistency.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Lightning Fast Sync</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time LIMS integration means instant validation, status updates within 1 second, zero delays.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Cloud className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Unlimited Scale</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Kubernetes-native architecture handles 10,000+ daily orders with zero performance degradation.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Actionable Insights</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Predictive analytics surface trends, bottlenecks, and opportunities in real-time dashboards.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Enterprise Grade</h4>
                <p className="text-muted-foreground leading-relaxed">
                  SOC 2 aligned, audit trails, MFA, SSO, and 99.9% uptime SLA built into the platform.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-bold text-xl">Smart Alerts</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Anomaly detection spots issues before they impact production, with intelligent, actionable alerts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-background border-y border-border">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">Transform Your Operations Today</h3>
            <p className="text-lg text-muted-foreground">
              Join manufacturers who've already scaled to enterprise levels. Get instant LIMS validation, predictive insights, and the confidence to handle 10,000+ daily orders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" onClick={handleEmailSignup} className="shadow-lg text-lg px-10 h-12" data-testid="button-signup-bottom">
                <Mail className="h-5 w-5 mr-2" />
                Start Your AI-Powered Trial
              </Button>
              <Button size="lg" variant="outline" onClick={handleEmailLogin} className="text-lg px-10 h-12 shadow-md" data-testid="button-returning-bottom">
                <LogIn className="h-5 w-5 mr-2" />
                Return to Your Dashboard
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-2">
              <span>Want to see it in action?</span>
              <button onClick={handleReplitLogin} className="text-primary hover:underline font-medium flex items-center gap-1" data-testid="button-replit-bottom">
                Book a personalized demo
                <ArrowRight className="h-4 w-4" />
              </button>
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
