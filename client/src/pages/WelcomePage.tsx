/**
 * Welcome/Home Page - Enhanced Dashboard
 *
 * The main entry point for authenticated users, showcasing:
 * - Role-specific capabilities
 * - Company information
 * - AI system status
 * - Pending approvals (for admins)
 * - Quick actions and navigation
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Brain,
  Bell,
  AlertTriangle,
  Star,
  Target,
  HeartPulse,
  Microscope,
  MessageSquare,
  LayoutDashboard,
  ChevronRight,
  UserCheck,
  Globe,
  Mail,
  Phone,
  Stethoscope,
  ClipboardList,
  Boxes,
  Send,
  Workflow,
  Database,
  Server,
  CreditCard,
  Lock,
  RefreshCw,
  MonitorCheck,
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
  color: string;
}

export default function WelcomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch platform stats for admins
  const { data: platformStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "platform_admin" || user?.role === "admin" || user?.role === "company_admin",
  });

  // Fetch AI stats
  const { data: aiStats } = useQuery({
    queryKey: ["/api/admin/ai-stats"],
    enabled: true,
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ["/api/admin/health"],
    enabled: user?.role === "platform_admin" || user?.role === "admin",
  });

  // Fetch pending companies (platform admin only)
  const { data: pendingCompanies = [] } = useQuery({
    queryKey: ["/api/companies/pending"],
    enabled: user?.role === "platform_admin",
  });

  // Fetch company info
  const { data: companyInfo } = useQuery({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  const getRoleBasePath = () => {
    const role = user?.role || "ecp";
    switch (role) {
      case "ecp": return "ecp";
      case "lab_tech":
      case "engineer": return "lab";
      case "supplier": return "supplier";
      case "admin": return "admin";
      case "platform_admin": return "platform-admin";
      case "company_admin": return "company-admin";
      case "dispenser": return "dispenser";
      default: return "ecp";
    }
  };

  const getRoleName = () => {
    const role = user?.role || "ecp";
    const roleNames: Record<string, string> = {
      ecp: "Eye Care Professional",
      lab_tech: "Lab Technician",
      engineer: "Engineer",
      supplier: "Supplier",
      admin: "Administrator",
      platform_admin: "Platform Administrator",
      company_admin: "Company Administrator",
      dispenser: "Dispenser",
    };
    return roleNames[role] || "User";
  };

  const getRoleColor = () => {
    const role = user?.role || "ecp";
    const colors: Record<string, string> = {
      ecp: "bg-blue-100 text-blue-800",
      lab_tech: "bg-purple-100 text-purple-800",
      engineer: "bg-indigo-100 text-indigo-800",
      supplier: "bg-green-100 text-green-800",
      admin: "bg-red-100 text-red-800",
      platform_admin: "bg-violet-100 text-violet-800",
      company_admin: "bg-orange-100 text-orange-800",
      dispenser: "bg-cyan-100 text-cyan-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  // Get role-specific feature cards
  const getFeatureCards = (): FeatureCard[] => {
    const role = user?.role || "ecp";

    const allFeatures: Record<string, FeatureCard[]> = {
      ecp: [
        {
          icon: ShoppingCart,
          title: "Point of Sale",
          description: "Modern retail till with barcode scanning and multi-payment",
          path: "/ecp/pos",
          badge: "POPULAR",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
        {
          icon: Eye,
          title: "Eye Examinations",
          description: "Comprehensive 10-tab examination forms with validation",
          path: "/ecp/examinations",
          badge: "CLINICAL",
          color: "text-cyan-500",
          bgGradient: "from-cyan-500/10 to-blue-500/10",
          available: true,
        },
        {
          icon: Users,
          title: "Patient Management",
          description: "Complete patient records with prescription history",
          path: "/ecp/patients",
          color: "text-orange-500",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          available: true,
        },
        {
          icon: Pill,
          title: "Prescriptions",
          description: "Smart prescription management with templates",
          path: "/ecp/prescriptions",
          color: "text-indigo-500",
          bgGradient: "from-indigo-500/10 to-purple-500/10",
          available: true,
        },
        {
          icon: Calendar,
          title: "Diary & Appointments",
          description: "Full scheduling with test room management",
          path: "/ecp/diary",
          color: "text-pink-500",
          bgGradient: "from-pink-500/10 to-rose-500/10",
          available: true,
        },
        {
          icon: MessageSquare,
          title: "Communications Hub",
          description: "Email, SMS, and campaign management",
          path: "/ecp/communications",
          badge: "NEW",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-indigo-500/10",
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
          description: "Professional invoicing with payment tracking",
          path: "/ecp/invoices",
          color: "text-teal-500",
          bgGradient: "from-teal-500/10 to-cyan-500/10",
          available: true,
        },
      ],
      lab_tech: [
        {
          icon: Beaker,
          title: "Production Tracking",
          description: "Real-time manufacturing process monitoring",
          path: "/lab/production",
          badge: "LIVE",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-cyan-500/10",
          available: true,
        },
        {
          icon: CheckCircle2,
          title: "Quality Control",
          description: "Comprehensive inspection workflows",
          path: "/lab/quality",
          badge: "QC",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
        {
          icon: Boxes,
          title: "Order Queue",
          description: "Intelligent order prioritization",
          path: "/lab/queue",
          color: "text-orange-500",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          available: true,
        },
        {
          icon: Settings,
          title: "Equipment",
          description: "Maintenance and calibration tracking",
          path: "/lab/equipment",
          color: "text-purple-500",
          bgGradient: "from-purple-500/10 to-indigo-500/10",
          available: true,
        },
      ],
      supplier: [
        {
          icon: Truck,
          title: "Orders",
          description: "Manage incoming orders and deliveries",
          path: "/supplier/orders",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-cyan-500/10",
          available: true,
        },
        {
          icon: FileText,
          title: "Product Library",
          description: "Complete catalog management",
          path: "/supplier/library",
          color: "text-emerald-500",
          bgGradient: "from-emerald-500/10 to-green-500/10",
          available: true,
        },
      ],
      platform_admin: [
        {
          icon: Building2,
          title: "Company Approvals",
          description: "Review and approve new company registrations",
          path: "/platform-admin/company-approvals",
          badge: pendingCompanies.length > 0 ? `${pendingCompanies.length} PENDING` : undefined,
          color: "text-yellow-600",
          bgGradient: "from-yellow-500/10 to-orange-500/10",
          available: true,
        },
        {
          icon: Users,
          title: "User Management",
          description: "Complete user lifecycle with approval workflows",
          path: "/platform-admin/users",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-indigo-500/10",
          available: true,
        },
        {
          icon: MonitorCheck,
          title: "System Health",
          description: "Real-time platform monitoring and diagnostics",
          path: "/platform-admin/system-health",
          color: "text-green-500",
          bgGradient: "from-green-500/10 to-emerald-500/10",
          available: true,
        },
        {
          icon: Brain,
          title: "AI Model Management",
          description: "Configure and deploy AI models across tenants",
          path: "/platform-admin/ai-models",
          badge: "AI",
          color: "text-pink-500",
          bgGradient: "from-pink-500/10 to-purple-500/10",
          available: true,
        },
      ],
      company_admin: [
        {
          icon: Users,
          title: "Team Management",
          description: "Manage team members and permissions",
          path: "/company-admin/users",
          color: "text-blue-500",
          bgGradient: "from-blue-500/10 to-indigo-500/10",
          available: true,
        },
        {
          icon: Shield,
          title: "Permissions",
          description: "Role-based access control",
          path: "/admin/permissions",
          color: "text-purple-500",
          bgGradient: "from-purple-500/10 to-indigo-500/10",
          available: true,
        },
        {
          icon: Building2,
          title: "Company Profile",
          description: "Update company information and branding",
          path: "/company-admin/profile",
          color: "text-orange-500",
          bgGradient: "from-orange-500/10 to-amber-500/10",
          available: true,
        },
      ],
    };

    const role_key = role === "engineer" ? "lab_tech" : role;
    return allFeatures[role_key] || [];
  };

  // Common features for all roles
  const getCommonFeatures = (): FeatureCard[] => [
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Intelligent automation and smart recommendations",
      path: `/${getRoleBasePath()}/ai-assistant`,
      badge: "AI POWERED",
      color: "text-pink-500",
      bgGradient: "from-pink-500/10 to-purple-500/10",
      available: true,
    },
    {
      icon: BarChart3,
      title: "Business Intelligence",
      description: "Real-time analytics with advanced forecasting",
      path: `/${getRoleBasePath()}/bi-dashboard`,
      badge: "ANALYTICS",
      color: "text-blue-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      available: true,
    },
    {
      icon: TrendingUp,
      title: "AI Forecasting",
      description: "Predictive analytics for demand planning",
      path: `/${getRoleBasePath()}/ai-forecasting`,
      badge: "AI",
      color: "text-cyan-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10",
      available: true,
    },
  ];

  const features = [...getFeatureCards(), ...getCommonFeatures()];

  const quickStats: QuickStat[] = [
    {
      label: "Active Users",
      value: platformStats?.active?.toString() || "0",
      icon: Users,
      change: "+12%",
      trend: "up",
      color: "text-green-600",
    },
    {
      label: "Pending Approvals",
      value: (platformStats?.pending || 0).toString(),
      icon: Clock,
      change: platformStats?.pending > 0 ? "Needs attention" : "All clear",
      trend: platformStats?.pending > 0 ? "down" : "neutral",
      color: platformStats?.pending > 0 ? "text-yellow-600" : "text-green-600",
    },
    {
      label: "AI Queries Today",
      value: aiStats?.totalQueries?.toString() || "0",
      icon: Brain,
      change: `${aiStats?.cacheHitRate || 0}% cache`,
      trend: "neutral",
      color: "text-purple-600",
    },
    {
      label: "System Status",
      value: systemHealth?.overall === "healthy" ? "Optimal" : systemHealth?.overall || "Online",
      icon: Activity,
      change: "100% uptime",
      trend: "neutral",
      color: "text-blue-600",
    },
  ];

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section with Company Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user?.firstName || "there"}!
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleColor()}>{getRoleName()}</Badge>
                  {companyInfo && (
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      <Building2 className="w-3 h-3 mr-1" />
                      {companyInfo.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-lg text-white/80 max-w-xl">
              Your intelligent command center for optical excellence.
              Everything you need to manage your practice efficiently.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() => handleNavigate(`/${getRoleBasePath()}/dashboard`)}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => handleNavigate(`/${getRoleBasePath()}/ai-assistant`)}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Ask AI
              </Button>
            </div>
          </div>

          {/* Company Quick Stats */}
          {(user?.role === "company_admin" || user?.role === "platform_admin") && (
            <div className="flex flex-wrap gap-4 lg:flex-nowrap">
              {quickStats.slice(0, 2).map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[140px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 text-white/70" />
                    <span className="text-sm text-white/70">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.change}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Pending Approvals Alert (Platform Admin) */}
      {user?.role === "platform_admin" && pendingCompanies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-yellow-900">
                      {pendingCompanies.length} Company Registration{pendingCompanies.length > 1 ? "s" : ""} Pending
                    </h3>
                    <p className="text-sm text-yellow-700">
                      New companies are waiting for your approval to get started
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleNavigate("/platform-admin/company-approvals")}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Review Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted/50`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                  {stat.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {stat.trend === "down" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Platform Capabilities */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Platform Capabilities</h2>
            <p className="text-muted-foreground">Powerful features tailored for your role</p>
          </div>
          <Button variant="outline" onClick={() => handleNavigate("/settings")} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <AnimatedCard
                className={`h-full cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20 bg-gradient-to-br ${feature.bgGradient}`}
                onClick={() => feature.available && handleNavigate(feature.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-3 rounded-xl bg-background shadow-sm ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    {feature.badge && (
                      <Badge variant="default" className="text-xs">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-3">
                    {feature.description}
                  </CardDescription>
                  <div className="flex items-center text-sm text-primary hover:gap-2 transition-all group">
                    <span>Open</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI & System Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI System Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">AI-Powered Platform</CardTitle>
                <CardDescription>Intelligent automation at your fingertips</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border">
                <p className="text-sm text-muted-foreground">Total AI Queries</p>
                <p className="text-2xl font-bold text-primary">{aiStats?.totalQueries || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-background border">
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-green-600">{aiStats?.cacheHitRate || 0}%</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={() => handleNavigate(`/${getRoleBasePath()}/ai-assistant`)}>
                <Sparkles className="w-4 h-4" />
                Open AI Assistant
              </Button>
              {(user?.role === "admin" || user?.role === "platform_admin") && (
                <Button variant="outline" onClick={() => handleNavigate("/admin/ai-settings")}>
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* What's New */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">What's New in ILS 2.0</CardTitle>
                <CardDescription>Latest platform enhancements</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Lock, title: "Google OAuth + Tenant Selection", desc: "Secure sign-in with company approval workflow" },
                { icon: Building2, title: "Multi-Tenant Architecture", desc: "Complete data isolation and company management" },
                { icon: Brain, title: "Enhanced AI Systems", desc: "Dual-model validation for higher accuracy" },
                { icon: MessageSquare, title: "Communications Hub", desc: "Unified email, SMS, and campaign management" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Button variant="outline" onClick={() => handleNavigate("/ecp/pos")} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Open POS
                </Button>
                <Button variant="outline" onClick={() => handleNavigate("/ecp/patients")} className="gap-2">
                  <Users className="h-4 w-4" />
                  Manage Patients
                </Button>
                <Button variant="outline" onClick={() => handleNavigate("/ecp/communications")} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Communications
                </Button>
              </>
            )}
            {user?.role === "platform_admin" && (
              <>
                <Button variant="outline" onClick={() => handleNavigate("/platform-admin/company-approvals")} className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Approvals
                </Button>
                <Button variant="outline" onClick={() => handleNavigate("/platform-admin/system-health")} className="gap-2">
                  <Activity className="h-4 w-4" />
                  System Health
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => handleNavigate("/settings")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
