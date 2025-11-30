/**
 * Modern Landing Page
 *
 * Design Principles:
 * - Clean, minimal aesthetic inspired by Linear/Notion
 * - Hero section with clear value proposition
 * - Feature highlights with AI focus
 * - Social proof and testimonials
 * - Clear CTAs throughout
 * - Responsive, mobile-first design
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Package,
  BarChart3,
  Calendar,
  Brain,
  ChevronRight,
  Play,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
} from "lucide-react";

// Feature data
const features = [
  {
    icon: Eye,
    title: "Clinical Excellence",
    description:
      "Comprehensive eye examination tools, prescription management, and clinical protocols designed for modern optometry.",
  },
  {
    icon: Package,
    title: "Order Management",
    description:
      "End-to-end lens ordering with real-time tracking, quality control, and seamless lab integration.",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Predictive analytics, automated recalls, and intelligent recommendations to grow your practice.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "AI-optimized appointment scheduling, waitlist management, and patient communications.",
  },
  {
    icon: BarChart3,
    title: "Business Intelligence",
    description:
      "Real-time dashboards, revenue analytics, and performance metrics at your fingertips.",
  },
  {
    icon: Shield,
    title: "NHS Integration",
    description:
      "Compliant with NHS standards, integrated voucher management, and exemption handling.",
  },
];

// Testimonials
const testimonials = [
  {
    quote:
      "ILS has transformed how we run our practice. The AI insights alone have increased our recall rates by 40%.",
    author: "Dr. Sarah Mitchell",
    role: "Independent Optometrist",
    avatar: "SM",
  },
  {
    quote:
      "The seamless integration between our practice and the lab has cut order processing time in half.",
    author: "James Wright",
    role: "Lab Manager, VisionCraft",
    avatar: "JW",
  },
  {
    quote:
      "Finally, a modern system that actually understands the optical industry. The UX is exceptional.",
    author: "Emma Thompson",
    role: "Practice Manager",
    avatar: "ET",
  },
];

// Stats
const stats = [
  { label: "Practices", value: "500+", suffix: "" },
  { label: "Orders Processed", value: "2M", suffix: "+" },
  { label: "Time Saved", value: "30", suffix: "%" },
  { label: "Patient Satisfaction", value: "98", suffix: "%" },
];

export default function ModernLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
          isScrolled
            ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ILS</span>
              </div>
              <span className="font-semibold text-lg">Lens System</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#testimonials" className="block text-sm text-muted-foreground hover:text-foreground">
                Testimonials
              </a>
              <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <div className="pt-4 border-t border-border space-y-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Powered by AI
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The modern platform for{" "}
              <span className="gradient-text">optical excellence</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Streamline your practice with intelligent lens management, AI-powered insights,
              and seamless NHS integration. Built for modern optometry.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["SM", "JW", "ET", "MK"].map((initials, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium",
                        i === 0 && "bg-blue-500 text-white",
                        i === 1 && "bg-green-500 text-white",
                        i === 2 && "bg-purple-500 text-white",
                        i === 3 && "bg-orange-500 text-white"
                      )}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span>Trusted by 500+ practices</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
              <div className="p-6 bg-muted/30">
                <div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  {stat.value}
                  <span className="text-primary">{stat.suffix}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to run a modern practice
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From clinical examinations to business analytics, ILS provides the tools
              you need to deliver exceptional patient care while growing your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "p-6 rounded-xl border border-border bg-card",
                    "hover:border-primary/50 hover:shadow-lg",
                    "transition-all duration-200"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Intelligence built into every workflow
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our AI doesn't just answer questions - it anticipates your needs,
                automates routine tasks, and provides insights that drive growth.
              </p>

              <div className="space-y-4">
                {[
                  "Predictive patient recall reminders",
                  "Automated inventory reordering suggestions",
                  "Revenue forecasting and trend analysis",
                  "Schedule optimization recommendations",
                  "Quality control anomaly detection",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">AI Assistant</div>
                    <div className="text-xs text-muted-foreground">Always ready to help</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      "Show me patients who need to be contacted for recall this week"
                    </p>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <p className="text-sm">
                      I found 12 patients due for recall. 5 are overdue by 30+ days.
                      Would you like me to send reminder messages?
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="secondary" className="h-7 text-xs">
                        View Patients
                      </Button>
                      <Button size="sm" className="h-7 text-xs">
                        Send Reminders
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by practices everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white",
                      i === 0 && "bg-blue-500",
                      i === 1 && "bg-green-500",
                      i === 2 && "bg-purple-500"
                    )}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-12 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to transform your practice?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join 500+ practices already using ILS to deliver exceptional patient care
              while growing their business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10 border border-white/20"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Logo & Description */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ILS</span>
                </div>
                <span className="font-semibold">Lens System</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                The modern platform for optical excellence. Streamline your practice
                with intelligent lens management and AI-powered insights.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground">GDPR</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ILS 2.0. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made with care for the optical industry
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
