import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { TabbedFeatures } from "@/components/landing/TabbedFeatures";
import { TestimonialCard } from "@/components/landing/TestimonialCard";
import { LogoWall } from "@/components/landing/LogoWall";
import { ComplianceBadges } from "@/components/landing/ComplianceBadges";
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
  Rocket,
  Keyboard,
  Eye,
  Gauge,
  MessageSquare,
  Video,
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

  const handleBookDemo = () => {
    toast({
      title: "Book a Demo",
      description: "We'll be in touch shortly to schedule your personalized demo.",
    });
  };

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
            {/* Value Proposition */}
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              The All-in-One OS for Modern Optical Practices
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Streamline your entire practice, from patient check-in to final sale. ILS 2.0 unifies your prescriptions, inventory, POS, and analytics in one powerful, secure platform.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={handleGetStarted} className="gap-2" aria-label="Start free trial">
                Start Your 30-Day Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleBookDemo} className="gap-2" aria-label="Book a demo">
                <Video className="h-4 w-4" />
                Book a Demo
              </Button>
            </div>

            {/* Trust Metrics - Moved directly below CTAs */}
            <div className="pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Trusted by 500+ practices just like yours
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">10K+</div>
                    <div className="text-xs text-muted-foreground">Orders Processed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-xs text-muted-foreground">Active Practices</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-xs text-muted-foreground">Customer Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Product Hero - Placeholder for Dashboard Visual */}
          <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 min-h-[500px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-xl">
                <Glasses className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Dynamic Product Hero
                </p>
                <p className="text-xs text-muted-foreground italic max-w-md mx-auto">
                  [Auto-playing video or GIF of ILS 2.0 dashboard showing AI Assistant analyzing a prescription or the POS completing a transaction]
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar Section - NEW */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="p-8">
            <LogoWall />
          </CardContent>
        </Card>
      </section>

      {/* Speed & Simplicity Section (Refined UI/UX) */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20 overflow-hidden">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl">Built for Speed and Simplicity</CardTitle>
            <CardDescription className="text-lg mt-2">
              Experience a seamless, instant workflow designed to reduce clicks and save you time at every step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Instant Feedback */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
                <h4 className="font-semibold">Instant Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  Zero perceived latency. Optimistic updates mean every form, sale, and report feels instant.
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">0ms latency</Badge>
                </div>
                <div className="text-xs text-muted-foreground/70 italic pt-2">
                  [GIF: Form being updated instantly]
                </div>
              </div>

              {/* Command Palette */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/20 flex items-center justify-center">
                  <Keyboard className="h-8 w-8 text-purple-500" />
                </div>
                <h4 className="font-semibold">Command Palette</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate at light-speed. Use our Ctrl+K palette to find any patient, product, or report in seconds.
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">⌘K / Ctrl+K</Badge>
                </div>
                <div className="text-xs text-muted-foreground/70 italic pt-2">
                  [GIF: Ctrl+K palette in action]
                </div>
              </div>

              {/* Lightning Fast */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center">
                  <Gauge className="h-8 w-8 text-green-500" />
                </div>
                <h4 className="font-semibold">Lightning Fast</h4>
                <p className="text-sm text-muted-foreground">
                  65% smaller bundle. 54% faster load. Our code-splitting delivers the speed your practice demands.
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">&lt;1.5s Load Time</Badge>
                </div>
              </div>

              {/* Fully Accessible */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/20 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-orange-500" />
                </div>
                <h4 className="font-semibold">Fully Accessible</h4>
                <p className="text-sm text-muted-foreground">
                  A WCAG 2.1 AA Compliant platform ensures your system is usable by everyone, with full keyboard navigation.
                </p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">98/100 Score</Badge>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">65%</div>
                  <div className="text-xs text-muted-foreground mt-1">Smaller Bundle</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">54%</div>
                  <div className="text-xs text-muted-foreground mt-1">Faster Load</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">0ms</div>
                  <div className="text-xs text-muted-foreground mt-1">Perceived Latency</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">+20</div>
                  <div className="text-xs text-muted-foreground mt-1">Accessibility Points</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* All-in-One Platform Section (Tabbed Features) */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">Your Complete Practice, All in One Place</h3>
          <p className="text-muted-foreground text-lg">
            Explore the powerful modules that unify your operations, from the front desk to the back office
          </p>
        </div>
        <TabbedFeatures />
      </section>

      {/* Human Social Proof Section - NEW */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">See Why Practice Owners Love ILS 2.0</h3>
          <p className="text-muted-foreground text-lg">
            Join 500+ optical practices transforming their operations
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TestimonialCard
            quote="ILS 2.0 cut our processing time in half and streamlined our entire inventory. It's the brain of our operation."
            author="Dr. Sarah Chen"
            title="Lead Optometrist"
            company="VisionFirst Practice"
          />
          <TestimonialCard
            quote="The analytics are a game-changer. I can finally see my profit tracking in real-time and make smarter business decisions. We're up 15% in high-margin sales."
            author="Mark David"
            title="Practice Manager"
            company="OptiCore Group"
          />
          <TestimonialCard
            quote="The multi-tenant security gives us complete peace of mind. Each location's data is perfectly isolated, and the audit trails are comprehensive."
            author="Jennifer Martinez"
            title="IT Director"
            company="EyeCare Solutions Network"
          />
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

      {/* Security & Compliance Section - NEW */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-3">Enterprise-Grade Security. Zero Compromises.</h3>
          <p className="text-muted-foreground text-lg">
            We protect your practice and patient data with the highest compliance standards in the industry
          </p>
        </div>
        <ComplianceBadges />
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="space-y-6 p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl border border-primary/20">
          <h3 className="text-4xl font-bold">Ready to transform your practice?</h3>
          <p className="text-xl text-muted-foreground">
            Join hundreds of optical practices using ILS 2.0 to streamline operations and boost revenue.
          </p>
          <div className="grid md:grid-cols-2 gap-4 pt-4 max-w-2xl mx-auto">
            <Card className="p-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
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
          
          {/* Enhanced "Talk to Sales" Visibility */}
          <div className="pt-6 border-t border-border/50 mt-8">
            <p className="text-sm text-muted-foreground mb-3">
              Prefer a guided demo? Our team is ready to help.
            </p>
            <Button variant="default" size="lg" onClick={handleBookDemo} className="gap-2">
              <Video className="h-4 w-4" />
              Book a Demo
            </Button>
            <Button variant="ghost" size="lg" onClick={handleContactSales} className="gap-2 ml-2">
              <MessageSquare className="h-4 w-4" />
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Glasses className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">ILS 2.0</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The All-in-One OS for Modern Optical Practices
              </p>
              <p className="text-xs text-muted-foreground">
                © 2025 New Vantage Co LTD
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Column 2: Product */}
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

            {/* Column 3: Resources */}
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

            {/* Column 4: Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a href="mailto:support@ils2.com" className="hover:text-foreground transition-colors">
                    support@ils2.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a href="tel:+441012079460958" className="hover:text-foreground transition-colors">
                    +44 101 20 7946 0958
                  </a>
                </li>
                <li className="pt-2">
                  <Button variant="outline" size="sm" onClick={handleContactSales} className="gap-2">
                    <MessageSquare className="h-3 w-3" />
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
