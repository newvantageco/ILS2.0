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

  const handleSignIn = () => {
    setLocation("/login");
  };

  const handleGetDemo = () => {
    // Navigate to demo request page or external booking link
    // For now, route to email signup which can include demo request
    setLocation("/email-signup");
  };

  const handleSeeFeatures = () => {
    // Scroll to features section
    const featuresSection = document.getElementById("features");
    featuresSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLearnMoreAI = () => {
    // Find the AI-Powered Architecture section by looking for it in the DOM
    const sections = document.querySelectorAll("section");
    let aiSection: Element | null = null;
    sections.forEach((section) => {
      const heading = section.querySelector("h3");
      if (heading && heading.textContent?.includes("AI-Powered Architecture")) {
        aiSection = section;
      }
    });
    if (aiSection) {
      (aiSection as HTMLElement).scrollIntoView({ behavior: "smooth" });
    }
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
            <Button onClick={handleSignIn} variant="outline" data-testid="button-signin-nav">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
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
                  <Button size="lg" onClick={handleGetDemo} data-testid="button-demo-cta" className="shadow-lg text-lg px-8 h-12">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get a Demo
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleSeeFeatures} className="text-lg px-8 h-12 shadow-md" data-testid="button-see-features">
                    <Compass className="h-5 w-5 mr-2" />
                    See Features
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
                  <Button onClick={handleLearnMoreAI} size="sm" variant="ghost" className="gap-2 text-primary hover:text-primary/90 font-medium group" data-testid="link-learn-more-ai">
                    Learn More About Our AI
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-b from-background to-primary/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Sparkles className="h-4 w-4" />
                Our Core Promises
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">What ILS Delivers</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three fundamental commitments that transform lens manufacturing operations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Brain className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold">AI-Powered Intelligence</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Predictive analytics that learns your workflow, anomaly detection that prevents problems, and intelligent automation that cuts manual work by 60%.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border/50">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Demand forecasting & bottleneck prediction</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Real-time anomaly detection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Continuous workflow optimization</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold">Real-Time LIMS Sync</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Bidirectional integration with your LIMS ensures orders validate instantly and status updates reach your system in under 1 second.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border/50">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Instant validation on order submission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Sub-second status propagation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Zero manual data entry</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Cloud className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-2xl font-bold">Enterprise Scale Ready</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Kubernetes orchestration handles 10,000+ daily orders with 99.9% uptime SLA, automatic failover, and zero performance degradation.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2 pt-4 border-t border-border/50">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>10,000+ daily order capacity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>99.9% uptime guarantee</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Automatic failover & recovery</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="bg-background/80 border border-border/60 rounded-2xl p-8 backdrop-blur">
              <h4 className="text-lg font-semibold mb-4">Quantified Impact</h4>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">60%</p>
                  <p className="text-sm text-muted-foreground">Manual Work Reduction</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">&lt;1s</p>
                  <p className="text-sm text-muted-foreground">Status Update Speed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">35%</p>
                  <p className="text-sm text-muted-foreground">Faster Turnaround</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary mb-2">20%</p>
                  <p className="text-sm text-muted-foreground">Fewer Reworks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Feature Suite</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage lens production from patient intake to final delivery
              </p>
            </div>

            {/* Role-Based Dashboards */}
            <div className="mb-16">
              <h4 className="text-2xl font-bold mb-6 text-center">Role-Specific Dashboards</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover-elevate border-2 transition-all duration-300">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Glasses className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">Eye Care Professionals</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Complete patient & prescription management with e-commerce integration
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Patient records & eye test management</li>
                        <li>• Prescription tracking & validation</li>
                        <li>• Shopify customer sync</li>
                        <li>• POS & invoicing system</li>
                        <li>• Inventory management</li>
                      </ul>
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
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Production queue & quality control workflows
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Real-time order queue management</li>
                        <li>• Production tracking & status updates</li>
                        <li>• Quality control inspection</li>
                        <li>• LIMS integration hub</li>
                        <li>• Equipment monitoring</li>
                      </ul>
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
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Advanced analytics & R&D management
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Root cause analysis tools</li>
                        <li>• Equipment calibration tracking</li>
                        <li>• R&D project management</li>
                        <li>• Performance correlation engine</li>
                        <li>• Predictive maintenance alerts</li>
                      </ul>
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
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        Purchase order & documentation management
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Purchase order tracking</li>
                        <li>• Technical documentation library</li>
                        <li>• Supplier product catalog</li>
                        <li>• Order fulfillment workflow</li>
                        <li>• Communication hub</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Patient & Practice Management */}
            <div className="mb-16">
              <h4 className="text-2xl font-bold mb-6 text-center">Patient & Practice Management</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Patient Records</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Complete patient database</li>
                      <li>• Eye test & prescription history</li>
                      <li>• Automated Shopify customer import</li>
                      <li>• Duplicate detection & validation</li>
                      <li>• Full address management</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Prescription Management</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Digital prescription storage</li>
                      <li>• Sphere, cylinder, axis tracking</li>
                      <li>• Add power & prism specifications</li>
                      <li>• Prescription validity monitoring</li>
                      <li>• Quick reorder from history</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">POS & Inventory</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Point of sale system</li>
                      <li>• Frame & lens inventory tracking</li>
                      <li>• Invoice generation</li>
                      <li>• Payment processing</li>
                      <li>• Stock level alerts</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modern Practice Management Features */}
            <div className="mb-16">
              <h4 className="text-2xl font-bold mb-6 text-center">Advanced Practice Operations</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Test Room Management</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Complete room inventory & status</li>
                      <li>• Equipment tracking per room</li>
                      <li>• Maintenance scheduling</li>
                      <li>• Accessibility management</li>
                      <li>• Multi-location support</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Room Scheduling</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Calendar-based booking system</li>
                      <li>• Automatic conflict detection</li>
                      <li>• Patient appointment linking</li>
                      <li>• Real-time availability view</li>
                      <li>• Appointment type classification</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Gauge className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Equipment Calibration</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Equipment inventory tracking</li>
                      <li>• Calibration due date alerts</li>
                      <li>• Compliance reporting</li>
                      <li>• Calibration history logs</li>
                      <li>• Automated status updates</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Cloud className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-semibold">Offline PWA</h4>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Works without internet</li>
                      <li>• Background sync when online</li>
                      <li>• Installable on devices</li>
                      <li>• Offline data queue</li>
                      <li>• Push notifications</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Multi-Location & Remote Features */}
            <div className="mb-16">
              <h4 className="text-2xl font-bold mb-6 text-center">Multi-Location & Remote Capabilities</h4>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-xl">Multi-Location Dashboard</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage multiple practice locations from a unified dashboard with real-time statistics
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Per-location room utilization metrics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Centralized equipment tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Cross-location scheduling visibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Aggregate reporting & analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>System-wide health monitoring</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-xl">Secure Remote Access</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable remote prescription viewing and approval with enterprise-grade security
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Time-limited access tokens</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Approval workflow for remote sessions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Session audit trail & logging</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Instant session revocation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Patient data access controls</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* E-commerce & Multi-Tenant */}
            <div className="mb-16">
              <h4 className="text-2xl font-bold mb-6 text-center">E-commerce Integration & Administration</h4>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-xl">Shopify Integration</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seamlessly connect your Shopify store to import customers as patients automatically
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>One-click customer sync from Shopify</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Automatic duplicate detection by email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Address mapping & data validation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Store Shopify ID for reference tracking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Sync status & result reporting</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-xl">Multi-Tenant Administration</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hierarchical admin roles with platform-wide and company-level control
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Platform Admin:</strong> System-wide user & company management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span><strong>Company Admin:</strong> Company profile & team management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Complete data isolation per company</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>User password reset & account control</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>Role-based access control (RBAC)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Intelligent Features */}
            <div>
              <h4 className="text-2xl font-bold mb-6 text-center">Intelligent Features & AI Assistance</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">AI Assistant</h4>
                    <p className="text-xs text-muted-foreground">
                      Context-aware AI help for orders, prescriptions, and system navigation
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">BI Dashboard</h4>
                    <p className="text-xs text-muted-foreground">
                      Real-time analytics, KPIs, and performance metrics with AI insights
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">Smart Notifications</h4>
                    <p className="text-xs text-muted-foreground">
                      Priority-based alerts with snooze, actions, and intelligent filtering
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">Command Palette</h4>
                    <p className="text-xs text-muted-foreground">
                      Keyboard shortcuts (⌘K) for instant navigation & actions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-r from-primary/5 to-background">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Database className="h-4 w-4" />
                Real-Time Integration
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Seamless LIMS Integration</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Bidirectional sync with your existing LIMS eliminates data silos and keeps all systems in perfect harmony
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold">How It Works</h4>
                  <p className="text-muted-foreground">
                    ILS maintains a persistent, real-time connection with your LIMS. Every order, status change, and update flows instantly between systems.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">Order Submission</p>
                      <p className="text-sm text-muted-foreground">ECP submits order → ILS validates format → LIMS confirms receipt in &lt;100ms</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">Instant Validation</p>
                      <p className="text-sm text-muted-foreground">LIMS validates against lab capabilities → Sends approval/rejection within 1 second</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">Live Status Updates</p>
                      <p className="text-sm text-muted-foreground">Each production step triggers LIMS update → ECP dashboards refresh instantly</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-semibold">Completion & Archive</p>
                      <p className="text-sm text-muted-foreground">Order completes → Final data synced back to LIMS → Perfect audit trail maintained</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-4">
                    <h4 className="text-xl font-bold">Key Integration Features</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Bidirectional Sync:</strong> Orders flow to ILS, updates flow back to LIMS automatically
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Sub-Second Latency:</strong> All updates propagate within 1 second—no lag, no delays
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Data Integrity:</strong> Validation on both sides ensures no bad data enters either system
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Conflict Resolution:</strong> Intelligent handling of concurrent updates and edge cases
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Audit Trail:</strong> Every sync event logged for compliance and troubleshooting
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          <strong>Zero Manual Intervention:</strong> No copy-paste, no re-entry, no human errors
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="bg-background/80 border-l-4 border-primary rounded p-4 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Integration Impact
                  </p>
                  <p className="text-xs text-muted-foreground">
                    LIMS integration eliminates 15-20 manual data entry tasks per day. Faster validation means orders move from submitted → approved → production in minutes, not hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">15-20x Faster Validation</h4>
                  <p className="text-sm text-muted-foreground">
                    From 30 minutes manual entry to &lt;1 second automatic sync
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">100% Data Accuracy</h4>
                  <p className="text-sm text-muted-foreground">
                    Eliminates manual entry errors and ensures perfect data consistency
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">Real-Time Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Both systems always in sync—no surprises, no confusion
                  </p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Cloud className="h-4 w-4" />
                Enterprise Scale
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Built to Grow With You</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From first order to 10,000+ daily—ILS scales seamlessly with zero downtime or performance degradation
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-border/60 bg-background/80 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Gauge className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Horizontal Scaling</p>
                        <p className="text-sm text-muted-foreground">
                          Kubernetes automatically adds container instances as demand grows. No manual intervention, no capacity planning headaches.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border border-border/60 bg-background/80 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">99.9% Uptime SLA</p>
                        <p className="text-sm text-muted-foreground">
                          Multi-zone redundancy, automatic failover, and disaster recovery. Your business doesn't stop.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border border-border/60 bg-background/80 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Zero Downtime Deployments</p>
                        <p className="text-sm text-muted-foreground">
                          Rolling updates mean new features and fixes deploy without interrupting active orders.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border border-border/60 bg-background/80 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Database Optimization</p>
                        <p className="text-sm text-muted-foreground">
                          Serverless PostgreSQL with read replicas and intelligent caching ensures queries stay fast at any scale.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-6">
                    <h4 className="text-2xl font-bold">Capacity & Performance</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Daily Order Capacity</p>
                          <p className="text-sm font-bold text-primary">10,000+</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-full bg-primary rounded-full"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Uptime Guarantee</p>
                          <p className="text-sm font-bold text-primary">99.9%</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[99.9%] bg-primary rounded-full"></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Avg Response Time</p>
                          <p className="text-sm font-bold text-primary">&lt;200ms</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{width: "95%"}}></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Data Consistency</p>
                          <p className="text-sm font-bold text-primary">100%</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-full bg-primary rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-3">
                        <strong>Horizontal Scaling:</strong> Automatically adds 2-4 new container instances during peak hours
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Load Balancing:</strong> Intelligent traffic distribution ensures no single instance becomes a bottleneck
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Multi-Zone Redundancy</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Distributed across multiple geographic zones. If one goes down, others take over instantly with zero data loss.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Intelligent Health Checks</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Continuous monitoring detects and recovers from failures in seconds. Proactive alerts before issues impact users.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Shield className="h-4 w-4" />
                Enterprise Security
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Security Built In, Not Added On</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                SOC 2 aligned architecture with multi-layer security, audit trails, and compliance controls
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Data Encryption</p>
                        <p className="text-sm text-muted-foreground">
                          AES-256 encryption at rest, TLS 1.3 in transit. All sensitive data encrypted end-to-end.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Authentication & Authorization</p>
                        <p className="text-sm text-muted-foreground">
                          Multi-factor authentication (MFA), single sign-on (SSO), role-based access control (RBAC).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Audit Trails & Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          Complete audit log of all actions. SOC 2 Type II aligned controls with real-time monitoring.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Data Residency & Retention</p>
                        <p className="text-sm text-muted-foreground">
                          Data stored in secure, compliant data centers. Configurable retention policies with secure deletion.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Incident Response & Recovery</p>
                        <p className="text-sm text-muted-foreground">
                          24/7 security monitoring, rapid incident response procedures, and disaster recovery plans.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-6">
                    <h4 className="text-2xl font-bold">Compliance & Certifications</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">SOC 2 Type II Aligned</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Security, Availability, Processing Integrity, Confidentiality, and Privacy controls audited annually.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">HIPAA Ready</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Controls and procedures support healthcare data handling requirements.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">GDPR Compliant</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Data processing agreements, user privacy rights, and data retention policies implemented.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">Secure Infrastructure</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Penetration testing, vulnerability scanning, and security updates continuously applied.
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ongoing Security Practices
                      </p>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Regular security audits and assessments
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Automated vulnerability scanning
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Employee security training & background checks
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full"></span>
                          Third-party dependency audits
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-background/80 border-2 border-primary/30 rounded-xl p-8 space-y-6">
              <h4 className="text-xl font-bold">Your Data is Always in Your Control</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Encryption Keys</p>
                  <p className="text-xs text-muted-foreground">
                    You maintain control of encryption keys. ILS stores data encrypted with keys managed by you.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Data Access</p>
                  <p className="text-xs text-muted-foreground">
                    Only your team can access your data. ILS support cannot access customer data without explicit authorization.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">Data Portability</p>
                  <p className="text-xs text-muted-foreground">
                    Export your complete dataset at any time in standard formats. No lock-in.
                  </p>
                </div>
              </div>
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

        <section className="py-20 px-6 bg-gradient-to-b from-background to-primary/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Clock className="h-4 w-4" />
                Fast Implementation
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Up and Running in 30 Days</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Guided onboarding gets you from sign-up to full production in under a month
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Compass className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Week 1: Guided Setup</p>
                        <p className="text-sm text-muted-foreground">
                          Success engineer walks your team through configuration, data import, and team onboarding. Done-for-you migration from your existing system.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Week 2: Pilot Program</p>
                        <p className="text-sm text-muted-foreground">
                          Select 10-20 test orders processed through ILS. Your team learns the system with live support. Early feedback incorporated.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Week 3-4: Full Launch</p>
                        <p className="text-sm text-muted-foreground">
                          100% production traffic routed through ILS. Support available 24/7 during critical ramp-up period.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background hover:bg-primary/10 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Day 30+: Optimization</p>
                        <p className="text-sm text-muted-foreground">
                          First month in production complete. AI models trained on your data. Ongoing improvements and strategy sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
                  <CardContent className="p-8 space-y-6">
                    <h4 className="text-2xl font-bold">What's Included in Onboarding</h4>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">Dedicated Success Engineer</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Point person for your organization through entire implementation and beyond
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">Data Migration Service</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          We handle the technical details of moving your data from legacy systems
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">Custom Workflow Setup</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Tailor ILS to match your specific processes, not the other way around
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">Team Training Sessions</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Role-specific training for ECPs, lab techs, engineers, and admins
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">LIMS Integration Setup</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          We configure real-time sync with your existing LIMS systems
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="font-medium">30-Day Check-in</p>
                        </div>
                        <p className="text-sm text-muted-foreground ml-8">
                          Comprehensive review: metrics, feedback, optimizations, and ongoing support plan
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-background/80 border-2 border-primary/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Start Guarantee
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We guarantee you'll have ILS running in production within 30 days, or we extend support at no cost until you do.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">30 Days to Production</h4>
                  <p className="text-sm text-muted-foreground">
                    Fastest onboarding in the industry with proven methodology
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">Dedicated Support</h4>
                  <p className="text-sm text-muted-foreground">
                    4-hour response SLA plus weekly strategy sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">Proof of Value in 90 Days</h4>
                  <p className="text-sm text-muted-foreground">
                    See measurable results: faster turnaround, fewer reworks, lower costs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <Brain className="h-4 w-4" />
                Deep Dive: AI Intelligence
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Intelligent Automation in Action</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                How AI engines learn your workflow and eliminate bottlenecks before they occur
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">Demand Forecasting</h4>
                      <p className="text-sm text-muted-foreground">
                        AI models analyze seasonal patterns, historical trends, and market signals to predict order volume weeks in advance.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium">Real-world impact:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Optimize staffing schedules automatically</li>
                      <li>• Pre-stage materials before surge periods</li>
                      <li>• Reduce rush jobs by 40%</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">Anomaly Detection</h4>
                      <p className="text-sm text-muted-foreground">
                        ML monitors every production step and flags quality issues, equipment degradation, or process deviations instantly.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium">Real-world impact:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Catch defects before shipping (saving rework)</li>
                      <li>• Predict equipment failure 48 hours ahead</li>
                      <li>• 99.7% defect detection rate</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Gauge className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">Bottleneck Prevention</h4>
                      <p className="text-sm text-muted-foreground">
                        Identifies workflow constraints and recommends reallocation, process changes, and staffing adjustments in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium">Real-world impact:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Surface critical blockers before impact</li>
                      <li>• Reduce average order cycle by 35%</li>
                      <li>• Maximize utilization to 92%+</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Cpu className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-lg">Workflow Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        AI learns optimal production sequences and suggests process improvements based on your lab's unique patterns and capabilities.
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium">Real-world impact:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Reduce manual task time by 60%</li>
                      <li>• Improve process consistency</li>
                      <li>• Enable operator confidence in automation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-12">
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

        <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
                <BarChart3 className="h-4 w-4" />
                Proven Results
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">The ILS Impact: Measured & Guaranteed</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real results from lens labs of all sizes after their first 90 days
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-primary">35%</p>
                    <p className="text-lg font-semibold">Faster Order Turnaround</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Average order cycle reduced from 4.2 days to 2.7 days. Fewer manual handoffs, zero data re-entry delays.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium">What this means:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• ECPs ship orders to patients faster</li>
                      <li>• Higher customer satisfaction scores</li>
                      <li>• Competitive advantage in your market</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-primary">20%</p>
                    <p className="text-lg font-semibold">Fewer Reworks & Returns</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Anomaly detection catches quality issues before shipping. Process automation reduces human errors.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium">What this means:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Direct savings on materials & labor</li>
                      <li>• Reduced customer complaints</li>
                      <li>• First-time pass rate improvement</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-primary">60%</p>
                    <p className="text-lg font-semibold">Less Manual Work</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    AI-powered automation eliminates repetitive data entry, form filling, and status tracking tasks.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium">What this means:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Staff focus on complex, high-value work</li>
                      <li>• Fewer typos & errors in records</li>
                      <li>• Better employee satisfaction</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-primary">92%</p>
                    <p className="text-lg font-semibold">Production Utilization</p>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    AI-optimized scheduling and bottleneck detection keeps equipment running efficiently without downtime.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium">What this means:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• More orders through same equipment</li>
                      <li>• Better ROI on lab equipment</li>
                      <li>• Improved revenue per technician</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-background/80 border-2 border-primary/30 rounded-2xl p-8 space-y-8 mb-12">
              <h4 className="text-2xl font-bold text-center">Real Customer Outcomes</h4>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Glasses className="h-4 w-4" />
                    ECP Clinic
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Suburban Vision Center</p>
                    <p className="text-xs text-muted-foreground">150 orders/month</p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left">
                    <li>✓ Cut order processing time by 45%</li>
                    <li>✓ Saved $2,400/month on manual entry</li>
                    <li>✓ Same-day tracking for 99% of orders</li>
                  </ul>
                </div>

                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Package className="h-4 w-4" />
                    Lab Company
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Regional Lens Lab</p>
                    <p className="text-xs text-muted-foreground">800 orders/month</p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left">
                    <li>✓ Improved throughput by 28%</li>
                    <li>✓ Rework rate dropped to 3.2%</li>
                    <li>✓ Net revenue increase of $18K/month</li>
                  </ul>
                </div>

                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Users className="h-4 w-4" />
                    National Chain
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold">Multi-Location Network</p>
                    <p className="text-xs text-muted-foreground">3,200 orders/month</p>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 text-left">
                    <li>✓ Consolidated 3 LIMS into one</li>
                    <li>✓ Saved $45K in annual overhead</li>
                    <li>✓ Scaled without hiring staff</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-2xl font-bold mb-4">Typical ROI Timeline</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-2">
                  <CardContent className="p-6 space-y-2 text-center">
                    <p className="text-sm font-medium text-primary">Month 1</p>
                    <p className="text-xs text-muted-foreground">Setup & Training</p>
                    <p className="text-lg font-bold">-10%</p>
                    <p className="text-xs text-muted-foreground">Initial cost</p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 space-y-2 text-center">
                    <p className="text-sm font-medium text-primary">Month 2-3</p>
                    <p className="text-xs text-muted-foreground">Optimization</p>
                    <p className="text-lg font-bold">+15%</p>
                    <p className="text-xs text-muted-foreground">Efficiency gains</p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-6 space-y-2 text-center">
                    <p className="text-sm font-medium text-primary">Month 4-6</p>
                    <p className="text-xs text-muted-foreground">Break-even</p>
                    <p className="text-lg font-bold">+50%</p>
                    <p className="text-xs text-muted-foreground">Cost recovery</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-6 space-y-2 text-center">
                    <p className="text-sm font-medium text-primary">Year 1+</p>
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <p className="text-lg font-bold text-primary">+200%</p>
                    <p className="text-xs text-muted-foreground">Sustained ROI</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-gradient-to-b from-muted/20 to-background border-y border-border">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">Transform Your Operations Today</h3>
            <p className="text-lg text-muted-foreground">
              Join manufacturers who've already scaled to enterprise levels. Get instant LIMS validation, predictive insights, and the confidence to handle 10,000+ daily orders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" onClick={handleGetDemo} className="shadow-lg text-lg px-10 h-12" data-testid="button-demo-bottom">
                <Sparkles className="h-5 w-5 mr-2" />
                Get a Demo
              </Button>
              <Button size="lg" variant="outline" onClick={handleSignIn} className="text-lg px-10 h-12 shadow-md" data-testid="button-signin-bottom">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </div>
            <div className="text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-2">
              <span>Ready to explore?</span>
              <button onClick={handleSeeFeatures} className="text-primary hover:underline font-medium flex items-center gap-1" data-testid="link-features-bottom">
                See all features
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
