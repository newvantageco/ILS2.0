/**
 * Welcome/Home Page - Enhanced UI/UX
 * 
 * This page serves as the main entry point for authenticated users,
 * showcasing the platform's advanced capabilities at a glance.
 * 
 * Following god-level UI/UX principles:
 * - Immediate value - show what's possible without reading docs
 * - Visual hierarchy - guide the eye to key actions
 * - Progressive disclosure - reveal complexity as needed
 * - Delight through motion - smooth, purposeful animations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShoppingCart,
  Users,
  BarChart3,
  Package,
  Eye,
  Zap,
  Shield,
  Pill,
  Receipt,
  Building2,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Beaker,
  Truck,
  Settings,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  path: string;
  badge?: string;
  color: string;
  bgGradient: string;
  available: boolean;
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change: string;
  trend: "up" | "down" | "neutral";
}

export default function WelcomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Role-specific feature cards
  const getFeatureCards = (): FeatureCard[] => {
    const role = user?.role || "ecp";

    const commonFeatures: FeatureCard[] = [
      {
        icon: Sparkles,
        title: "AI Assistant",
        description: "Intelligent automation for prescription analysis and smart recommendations",
        path: `/${getRoleBasePath()}/ai-assistant`,
        badge: "AI POWERED",
        color: "text-pink-500",
        bgGradient: "from-pink-500/10 to-purple-500/10",
        available: true,
      },
      {
        icon: BarChart3,
        title: "Business Intelligence",
        description: "Real-time analytics and insights with advanced forecasting",
        path: `/${getRoleBasePath()}/bi-dashboard`,
        badge: "ADVANCED",
        color: "text-blue-500",
        bgGradient: "from-blue-500/10 to-cyan-500/10",
        available: true,
      },
      {
        icon: Building2,
        title: "Company Management",
        description: "Multi-tenant architecture with complete data isolation",
        path: `/${getRoleBasePath()}/company`,
        badge: "SECURE",
        color: "text-purple-500",
        bgGradient: "from-purple-500/10 to-indigo-500/10",
        available: true,
      },
    ];

    if (role === "ecp") {
      return [
        {
          icon: ShoppingCart,
          title: "Point of Sale",
          description: "Modern retail till with barcode scanning and multi-payment processing",
          path: "/ecp/pos",
          badge: "NEW",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
        {
          icon: Eye,
          title: "Eye Examinations",
          description: "Comprehensive 10-tab examination forms with automated validation",
          path: "/ecp/examinations",
          badge: "CLINICAL",
          color: "text-cyan-500",
          bgGradient: "from-cyan-500/10 to-blue-500/10",
          available: true,
        },
        {
          icon: Users,
          title: "Patient Management",
          description: "Complete patient records with prescription history and analytics",
          path: "/ecp/patients",
          color: "text-orange-500",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          available: true,
        },
        {
          icon: Pill,
          title: "Prescriptions",
          description: "Smart prescription management with templates and protocols",
          path: "/ecp/prescriptions",
          color: "text-indigo-500",
          bgGradient: "from-indigo-500/10 to-purple-500/10",
          available: true,
        },
        {
          icon: Package,
          title: "Inventory",
          description: "Real-time stock tracking with automated reordering",
          path: "/ecp/inventory",
          color: "text-violet-500",
          bgGradient: "from-violet-500/10 to-purple-500/10",
          available: true,
        },
        {
          icon: Receipt,
          title: "Invoices & Billing",
          description: "Professional invoicing with automated payment tracking",
          path: "/ecp/invoices",
          color: "text-teal-500",
          bgGradient: "from-teal-500/10 to-cyan-500/10",
          available: true,
        },
        ...commonFeatures,
      ];
    }

    if (role === "lab_tech" || role === "engineer") {
      return [
        {
          icon: Beaker,
          title: "Production Tracking",
          description: "Real-time manufacturing process monitoring and quality control",
          path: "/lab/production",
          badge: "LIVE",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-cyan-500/10",
          available: true,
        },
        {
          icon: Eye,
          title: "Quality Control",
          description: "Comprehensive inspection workflows with defect tracking",
          path: "/lab/quality",
          badge: "PRECISION",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
        {
          icon: Package,
          title: "Order Queue",
          description: "Intelligent order prioritization and workload distribution",
          path: "/lab/queue",
          color: "text-orange-500",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          available: true,
        },
        {
          icon: Settings,
          title: "Equipment",
          description: "Maintenance tracking and calibration management",
          path: "/lab/equipment",
          color: "text-purple-500",
          bgGradient: "from-purple-500/10 to-indigo-500/10",
          available: true,
        },
        {
          icon: TrendingUp,
          title: "AI Forecasting",
          description: "Predictive analytics for demand and capacity planning",
          path: "/lab/ai-forecasting",
          badge: "AI POWERED",
          color: "text-pink-500",
          bgGradient: "from-pink-500/10 to-purple-500/10",
          available: true,
        },
        {
          icon: Activity,
          title: "Engineering",
          description: "R&D projects, pilot runs, and innovation tracking",
          path: "/lab/engineering",
          color: "text-cyan-500",
          bgGradient: "from-cyan-500/10 to-blue-500/10",
          available: true,
        },
        ...commonFeatures,
      ];
    }

    if (role === "supplier") {
      return [
        {
          icon: Truck,
          title: "Orders",
          description: "Manage incoming orders and delivery schedules",
          path: "/supplier/orders",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-cyan-500/10",
          available: true,
        },
        {
          icon: FileText,
          title: "Product Library",
          description: "Complete catalog with specifications and availability",
          path: "/supplier/library",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
        ...commonFeatures,
      ];
    }

    if (role === "admin" || role === "platform_admin") {
      return [
        {
          icon: Users,
          title: "User Management",
          description: "Complete user lifecycle with approval workflows",
          path: "/admin/users",
          badge: "ADMIN",
          color: "text-red-500",
          bgGradient: "from-red-500/10 to-orange-500/10",
          available: true,
        },
        {
          icon: Shield,
          title: "Permissions",
          description: "Granular role-based access control system",
          path: "/admin/permissions",
          badge: "RBAC",
          color: "text-purple-500",
          bgGradient: "from-purple-500/10 to-indigo-500/10",
          available: true,
        },
        {
          icon: FileText,
          title: "Audit Logs",
          description: "Complete audit trail for compliance and security",
          path: "/admin/audit-logs",
          badge: "COMPLIANCE",
          color: "text-cyan-500",
          bgGradient: "from-cyan-500/10 to-blue-500/10",
          available: true,
        },
        {
          icon: Sparkles,
          title: "AI Configuration",
          description: "Model management and external provider integration",
          path: "/admin/ai-settings",
          badge: "AI POWERED",
          color: "text-pink-500",
          bgGradient: "from-pink-500/10 to-purple-500/10",
          available: true,
        },
        ...commonFeatures,
      ];
    }

    return commonFeatures;
  };

  const getRoleBasePath = () => {
    const role = user?.role || "ecp";
    switch (role) {
      case "ecp":
        return "ecp";
      case "lab_tech":
      case "engineer":
        return "lab";
      case "supplier":
        return "supplier";
      case "admin":
        return "admin";
      case "platform_admin":
        return "platform-admin";
      case "company_admin":
        return "company-admin";
      default:
        return "ecp";
    }
  };

  const getRoleName = () => {
    const role = user?.role || "ecp";
    switch (role) {
      case "ecp":
        return "Eye Care Professional";
      case "lab_tech":
        return "Lab Technician";
      case "engineer":
        return "Engineer";
      case "supplier":
        return "Supplier";
      case "admin":
        return "Administrator";
      case "platform_admin":
        return "Platform Administrator";
      case "company_admin":
        return "Company Administrator";
      default:
        return "User";
    }
  };

  const quickStats: QuickStat[] = [
    {
      label: "Today's Activity",
      value: "24",
      icon: Activity,
      change: "+12%",
      trend: "up",
    },
    {
      label: "Pending Tasks",
      value: "8",
      icon: Clock,
      change: "-3",
      trend: "down",
    },
    {
      label: "This Month",
      value: "$12.4K",
      icon: DollarSign,
      change: "+18%",
      trend: "up",
    },
    {
      label: "System Status",
      value: "Optimal",
      icon: CheckCircle2,
      change: "100%",
      trend: "neutral",
    },
  ];

  const features = getFeatureCards();

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.firstName || user?.email?.split('@')[0] || "User"}!
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {getRoleName()}
              </Badge>
              {user?.companyId && (
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {user.companyId}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              Your command center for optical excellence
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => handleNavigate(`/${getRoleBasePath()}/dashboard`)}
            className="gap-2"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {quickStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                    <Badge
                      variant={
                        stat.trend === "up"
                          ? "default"
                          : stat.trend === "down"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Platform Capabilities */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Platform Capabilities</h2>
            <p className="text-muted-foreground">
              Powerful features designed for your role
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => handleNavigate("/settings")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <AnimatedCard
                className={`h-full cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/20 bg-gradient-to-br ${feature.bgGradient}`}
                onClick={() => feature.available && handleNavigate(feature.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-xl bg-background shadow-sm ${feature.color}`}
                    >
                      <feature.icon className="h-6 w-6" />
                    </div>
                    {feature.badge && (
                      <Badge variant="default" className="text-xs">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {feature.description}
                  </CardDescription>
                  {feature.available ? (
                    <div className="flex items-center text-sm text-primary hover:gap-2 transition-all group">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </CardContent>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* What's New Section */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>What&apos;s New in ILS 2.0</CardTitle>
          </div>
          <CardDescription>Latest updates and improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              </div>
              <div>
                <div className="font-semibold mb-1">Optimistic Updates</div>
                <div className="text-sm text-muted-foreground">
                  Lightning-fast UI with instant feedback for all actions
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              </div>
              <div>
                <div className="font-semibold mb-1">Command Palette (⌘K)</div>
                <div className="text-sm text-muted-foreground">
                  Navigate anywhere instantly with keyboard shortcuts
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              </div>
              <div>
                <div className="font-semibold mb-1">Enhanced Accessibility</div>
                <div className="text-sm text-muted-foreground">
                  Full keyboard navigation and screen reader support
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              </div>
              <div>
                <div className="font-semibold mb-1">Global Loading Bar</div>
                <div className="text-sm text-muted-foreground">
                  Subtle progress indicator for background operations
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleNavigate(`/${getRoleBasePath()}/ai-assistant`)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI Assistant
            </Button>
            <Button
              variant="outline"
              onClick={() => handleNavigate(`/${getRoleBasePath()}/bi-dashboard`)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
            {user?.role === "ecp" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate("/ecp/new-order")}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Create Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNavigate("/ecp/patients")}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Manage Patients
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => handleNavigate(`/${getRoleBasePath()}/company`)}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Company Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
