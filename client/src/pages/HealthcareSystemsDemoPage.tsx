/**
 * Healthcare Systems Demo Page
 * 
 * This page demonstrates the integration of all three healthcare systems:
 * 1. Advanced Healthcare Analytics
 * 2. Laboratory Integration System
 * 3. Extended Practice Management
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Beaker, 
  Users, 
  TrendingUp,
  Activity,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Building2,
  DollarSign,
  Package,
  FileText,
  Eye,
  Settings,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const systemFeatures = {
  analytics: [
    {
      icon: Heart,
      title: "Clinical Outcomes",
      description: "Track treatment success rates, readmission rates, and patient satisfaction scores",
      metrics: ["92.3% Success Rate", "2.8% Readmission", "94.5% Satisfaction"]
    },
    {
      icon: Users,
      title: "Population Health",
      description: "Monitor patient demographics, chronic conditions, and preventive care metrics",
      metrics: ["2,847 Total Patients", "523 Chronic Conditions", "78.9% Preventive Care"]
    },
    {
      icon: Shield,
      title: "Quality Reporting",
      description: "Comprehensive compliance tracking with clinical guidelines and safety metrics",
      metrics: ["94.2% Overall Compliance", "91.8% Guideline Adherence", "3 Safety Incidents"]
    }
  ],
  laboratory: [
    {
      icon: Beaker,
      title: "Order Management",
      description: "Kanban-style lab order tracking with real-time status updates",
      metrics: ["12 Pending Orders", "8 In Progress", "24 Completed Today"]
    },
    {
      icon: FileText,
      title: "Results Viewer",
      description: "Interactive lab results with trend analysis and critical value alerts",
      metrics: ["156 Results Today", "3 Critical Values", "98% On-time Delivery"]
    },
    {
      icon: Activity,
      title: "Quality Control",
      description: "HL7 integration with automated QC metrics and compliance tracking",
      metrics: ["98.5% QC Pass Rate", "94.2% TAT Compliance", "2 Active Interfaces"]
    }
  ],
  practiceManagement: [
    {
      icon: Users,
      title: "Staff Scheduling",
      description: "AI-optimized staff scheduling with real-time utilization tracking",
      metrics: ["85% Staff Utilization", "78% Room Utilization", "24.3 Patients/Day"]
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Smart inventory tracking with automated reordering and cost optimization",
      metrics: ["3 Low Stock Items", "$12,450 Total Value", "4.2x Turnover Rate"]
    },
    {
      icon: Building2,
      title: "Performance Analytics",
      description: "Comprehensive practice metrics with AI-powered optimization suggestions",
      metrics: ["$4,250 Daily Revenue", "68.5% Profit Margin", "12 Min Wait Time"]
    }
  ]
};

const integrationBenefits = [
  {
    icon: Zap,
    title: "Seamless Data Flow",
    description: "Real-time synchronization between all three systems eliminates data silos"
  },
  {
    icon: Target,
    title: "Improved Patient Care",
    description: "Integrated insights lead to better clinical decisions and patient outcomes"
  },
  {
    icon: DollarSign,
    title: "Cost Optimization",
    description: "AI-driven recommendations reduce operational costs by up to 15%"
  },
  {
    icon: Shield,
    title: "Enhanced Compliance",
    description: "Unified compliance tracking ensures regulatory requirements are met"
  }
];

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  metrics: string[];
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, metrics, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02 }}
  >
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">•</span>
              <span className="font-medium">{metric}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-start space-x-4"
  >
    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
      <Icon className="h-5 w-5 text-green-600" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  </motion.div>
);

export default function HealthcareSystemsDemoPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center space-x-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Beaker className="h-8 w-8 text-green-600" />
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Advanced Healthcare Systems
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrated analytics, laboratory management, and practice optimization
            powered by AI and designed for modern healthcare delivery
          </p>
          <div className="flex justify-center space-x-4">
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
              NHS Compliant
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
              HIPAA Aligned
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
              AI Powered
            </Badge>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
            <TabsTrigger value="practice">Practice Mgmt</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Integration Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Why Choose Integrated Healthcare Systems?
                </CardTitle>
                <CardDescription>
                  Discover how our three integrated systems transform healthcare delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {integrationBenefits.map((benefit, index) => (
                    <BenefitCard
                      key={index}
                      icon={benefit.icon}
                      title={benefit.title}
                      description={benefit.description}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">92.3%</div>
                    <p className="text-sm text-gray-600">Treatment Success Rate</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">2,847</div>
                    <p className="text-sm text-gray-600">Active Patients</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
                    <p className="text-sm text-gray-600">Staff Utilization</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-orange-600 mb-2">$4.2K</div>
                    <p className="text-sm text-gray-600">Daily Revenue</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-2xl font-bold mb-4">
                    Ready to Transform Your Practice?
                  </h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Experience the power of integrated healthcare systems with real-time analytics,
                    seamless laboratory management, and AI-driven practice optimization.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button size="lg" variant="secondary" asChild>
                      <Link href="/ecp/healthcare-analytics">
                        View Analytics Demo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Systems
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Healthcare Analytics System
              </h2>
              <p className="text-gray-600">
                Real-time clinical insights and population health management
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemFeatures.analytics.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  metrics={feature.metrics}
                  delay={index * 0.1}
                />
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" asChild>
                <Link href="/ecp/healthcare-analytics">
                  <Eye className="h-4 w-4 mr-2" />
                  Explore Analytics Dashboard
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Laboratory Tab */}
          <TabsContent value="laboratory" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Laboratory Integration System
              </h2>
              <p className="text-gray-600">
                Comprehensive lab order management with HL7 integration
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemFeatures.laboratory.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  metrics={feature.metrics}
                  delay={index * 0.1}
                />
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" asChild>
                <Link href="/ecp/laboratory">
                  <Beaker className="h-4 w-4 mr-2" />
                  View Laboratory System
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* Practice Management Tab */}
          <TabsContent value="practice" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Practice Management System
              </h2>
              <p className="text-gray-600">
                AI-powered optimization for staff, inventory, and operations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemFeatures.practiceManagement.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  metrics={feature.metrics}
                  delay={index * 0.1}
                />
              ))}
            </div>
            <div className="text-center">
              <Button size="lg" asChild>
                <Link href="/ecp/practice-management">
                  <Building2 className="h-4 w-4 mr-2" />
                  Access Practice Management
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
