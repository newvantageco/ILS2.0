import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  MessageSquare,
  Inbox,
  Zap,
  BarChart3,
  Target,
  Eye,
  FileText,
  ShoppingCart,
  Brain,
  Users,
  Calendar,
  Bell,
  TrendingUp,
  Shield,
  Workflow,
  Mail,
  Clock,
  Activity,
  Heart,
  Stethoscope,
  Building2,
  Globe,
  Lock,
  Sparkles,
  ArrowRight,
  Package,
  Factory,
  Beaker,
  DollarSign,
  UserCheck,
  GitBranch,
  Send,
  LineChart,
  Database,
  Cpu,
  Zap as Lightning,
  Award,
  Rocket,
  ChevronRight,
} from "lucide-react";

export default function PlatformShowcasePage() {
  const [activeCategory, setActiveCategory] = useState("overview");

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12">
        <div className="relative z-10 max-w-3xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            Next-Generation Healthcare Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            ILS 2.0: Integrated Lens System
          </h1>
          <p className="text-xl mb-6 text-white/90">
            The most comprehensive, AI-powered optical healthcare management platform.
            Seamlessly integrating clinical excellence, patient engagement, business intelligence,
            and laboratory operations.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
              <Rocket className="mr-2 h-5 w-5" />
              Explore Features
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Watch Demo
            </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <Eye className="absolute top-10 right-10 h-32 w-32" />
          <Brain className="absolute bottom-10 right-32 h-24 w-24" />
          <Activity className="absolute top-1/2 right-20 h-20 w-20" />
        </div>
      </div>

      {/* Key Differentiators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Award className="h-8 w-8 text-yellow-500" />
            What Sets Us Apart
          </CardTitle>
          <CardDescription>
            Industry-leading features that no other optical platform offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Omnichannel Patient Engagement</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Industry's first true omnichannel communication platform with SMS, Email, WhatsApp,
                Push Notifications, and In-App messaging - all managed from one unified inbox.
              </p>
              <Badge variant="secondary" className="text-xs">
                5 Channels • AI-Powered • HIPAA Compliant
              </Badge>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">AI-First Architecture</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Built-in AI assistant, ML-powered forecasting, intelligent patient segmentation,
                and predictive analytics that learn from your practice patterns.
              </p>
              <Badge variant="secondary" className="text-xs">
                GPT-4 • Custom ML Models • Real-time Insights
              </Badge>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Workflow className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">No-Code Workflow Builder</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Visual workflow automation that lets non-technical staff create sophisticated
                patient engagement sequences with triggers, conditions, and multi-step flows.
              </p>
              <Badge variant="secondary" className="text-xs">
                Drag & Drop • 50+ Templates • Smart Triggers
              </Badge>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg">Advanced Patient Segmentation</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Visual segment builder with real-time preview. Filter by demographics, visit history,
                spend patterns, recall status, and custom criteria with AND/OR logic.
              </p>
              <Badge variant="secondary" className="text-xs">
                Real-time Preview • 10+ Filter Types • Export Ready
              </Badge>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-lg">Unified Business Intelligence</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Practice Pulse, Financial, Operational, and Patient analytics dashboards with
                drill-down capabilities and customizable KPI tracking.
              </p>
              <Badge variant="secondary" className="text-xs">
                4 Dashboards • 100+ Metrics • Live Updates
              </Badge>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg">Enterprise-Grade Security</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                HIPAA and GDPR compliant with full audit logging, role-based access control,
                data encryption, and consent management built into every feature.
              </p>
              <Badge variant="secondary" className="text-xs">
                HIPAA • GDPR • SOC 2 Ready • Encrypted
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Platform Overview</CardTitle>
              <CardDescription>
                A comprehensive solution covering every aspect of optical practice management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">50+</div>
                    <div className="text-sm text-muted-foreground">Core Features</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-green-600">15+</div>
                    <div className="text-sm text-muted-foreground">Integrations</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">5</div>
                    <div className="text-sm text-muted-foreground">Communication Channels</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime SLA</div>
                  </div>
                </div>

                {/* Platform Layers */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Platform Architecture</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <Eye className="h-6 w-6 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Clinical Excellence Layer</h4>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive eye examinations, prescription management, test room scheduling,
                          patient recalls, waitlist management, and clinical protocols.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Patient Engagement Layer</h4>
                        <p className="text-sm text-muted-foreground">
                          Omnichannel communications, two-way inbox, broadcast messaging, automated workflows,
                          campaign management, and real-time analytics.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-green-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Retail Operations Layer</h4>
                        <p className="text-sm text-muted-foreground">
                          Point of Sale, inventory management, smart frame finder, invoicing,
                          and dispenser handoff workflow.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <BarChart3 className="h-6 w-6 text-yellow-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Business Intelligence Layer</h4>
                        <p className="text-sm text-muted-foreground">
                          Practice Pulse dashboard, financial analytics, operational metrics,
                          patient insights, and AI-powered forecasting.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <Factory className="h-6 w-6 text-red-600 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">Laboratory Operations Layer</h4>
                        <p className="text-sm text-muted-foreground">
                          Production tracking, quality control, equipment management, returns processing,
                          and engineering dashboards.
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Tab */}
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Clinical Examination Suite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Comprehensive Eye Examinations</div>
                    <div className="text-sm text-muted-foreground">
                      Visual acuity, refraction, tonometry, ophthalmoscopy, and more
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Digital Prescription Management</div>
                    <div className="text-sm text-muted-foreground">
                      Templates, outside Rx tracking, and automated dispensing
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Test Room Scheduling</div>
                    <div className="text-sm text-muted-foreground">
                      Real-time availability, conflict detection, and resource optimization
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Clinical Protocols</div>
                    <div className="text-sm text-muted-foreground">
                      Standardized workflows and best practice guidelines
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Patient Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">360° Patient Profiles</div>
                    <div className="text-sm text-muted-foreground">
                      Complete history, communications, prescriptions, and analytics
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Automated Patient Recalls</div>
                    <div className="text-sm text-muted-foreground">
                      Smart scheduling based on last visit and recommended intervals
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Intelligent Waitlist</div>
                    <div className="text-sm text-muted-foreground">
                      Priority queuing, automated notifications, and slot optimization
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Dispenser Handoff Workflow</div>
                    <div className="text-sm text-muted-foreground">
                      Seamless transition from examination to dispensing with notes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Communication Platform</CardTitle>
              <CardDescription>
                The most comprehensive patient engagement system in optical healthcare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Communication Timeline</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete communication history visible in patient profiles. Every message,
                    across all channels, in chronological order.
                  </p>
                  <Badge variant="outline" className="text-xs">Patient Profile Integration</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Inbox className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Two-Way Inbox</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unified inbox for all patient replies. Auto-refresh, conversation threading,
                    staff assignment, and status tracking.
                  </p>
                  <Badge variant="outline" className="text-xs">15-Second Auto-Refresh</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold">Quick Send / Broadcast</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send urgent messages to filtered patient groups instantly. Real-time
                    recipient preview before sending.
                  </p>
                  <Badge variant="outline" className="text-xs">Instant or Scheduled</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Communication Analytics</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Delivery rates, engagement metrics, channel performance, send-time
                    optimization, and ROI tracking.
                  </p>
                  <Badge variant="outline" className="text-xs">Real-Time Metrics</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold">Patient Segmentation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visual segment builder with 10+ filter criteria. Save segments for
                    campaigns and broadcast targeting.
                  </p>
                  <Badge variant="outline" className="text-xs">Live Preview</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold">Template Manager</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Multi-channel templates with variables, versioning, and A/B testing
                    capabilities.
                  </p>
                  <Badge variant="outline" className="text-xs">50+ Pre-built</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="h-5 w-5 text-pink-600" />
                    <h4 className="font-semibold">Campaign Manager</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Orchestrate multi-step, multi-channel campaigns with scheduling,
                    segmentation, and performance tracking.
                  </p>
                  <Badge variant="outline" className="text-xs">Automated Execution</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-5 w-5 text-teal-600" />
                    <h4 className="font-semibold">Workflow Automation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No-code visual builder for creating automated patient engagement
                    sequences with triggers and conditions.
                  </p>
                  <Badge variant="outline" className="text-xs">Drag & Drop</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold">Scheduled Queue</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    View and manage all scheduled messages. Edit, cancel, or reschedule
                    before delivery.
                  </p>
                  <Badge variant="outline" className="text-xs">Full Control</Badge>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Supported Communication Channels
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>SMS</Badge>
                  <Badge>Email</Badge>
                  <Badge>WhatsApp</Badge>
                  <Badge>Push Notifications</Badge>
                  <Badge>In-App Messages</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Business Intelligence Suite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Practice Pulse Dashboard</div>
                  <p className="text-sm text-muted-foreground">
                    Real-time overview of practice health with key performance indicators,
                    trend analysis, and actionable insights.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Financial Analytics</div>
                  <p className="text-sm text-muted-foreground">
                    Revenue tracking, expense analysis, profit margins, and cash flow
                    forecasting with drill-down capabilities.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Operational Metrics</div>
                  <p className="text-sm text-muted-foreground">
                    Appointment utilization, wait times, staff productivity, and
                    resource optimization analytics.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Patient Analytics</div>
                  <p className="text-sm text-muted-foreground">
                    Demographics, lifetime value, retention rates, and behavioral
                    segmentation with cohort analysis.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Retail & POS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Modern Point of Sale</div>
                  <p className="text-sm text-muted-foreground">
                    Fast checkout, inventory sync, payment processing, and receipt
                    management with offline capability.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Inventory Management</div>
                  <p className="text-sm text-muted-foreground">
                    Stock tracking, low-stock alerts, automated reordering, and
                    multi-location inventory sync.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Smart Frame Finder</div>
                  <p className="text-sm text-muted-foreground">
                    AI-powered frame recommendations based on face shape, preferences,
                    and prescription requirements.
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium mb-1">Invoice Management</div>
                  <p className="text-sm text-muted-foreground">
                    Automated invoicing, payment tracking, refunds, and accounting
                    system integration.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" />
                  AI & Machine Learning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>GPT-4 powered AI assistant for clinical and business queries</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>ML-based demand forecasting for inventory and staffing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>Predictive analytics for patient churn and engagement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
                    <span>Intelligent send-time optimization for communications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5" />
                  Healthcare Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>NHS Integration for UK practices (GPConnect, Spine)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Laboratory integration for external testing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Practice management system connectors</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Third-party optical lab connections</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>HIPAA compliant with full audit trails</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>GDPR compliant with consent management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>Role-based access control (8 role types)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-red-600 mt-0.5" />
                    <span>End-to-end encryption for all patient data</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Factory className="h-5 w-5" />
                  Laboratory Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Production tracking with real-time status updates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Quality control workflows and defect tracking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Equipment management and maintenance scheduling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>Returns and non-adapt management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Multi-Tenant Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Complete data isolation per practice</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Custom branding and white-labeling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Flexible subscription tiers and billing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Database className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Multi-location support for practice groups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-5 w-5" />
                  Developer Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightning className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>RESTful API with comprehensive documentation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightning className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Webhooks for real-time event notifications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightning className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>SDK support for popular languages</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lightning className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <span>Sandbox environment for testing</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Competitive Advantages */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Why Practices Choose ILS 2.0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">3x</div>
              <div className="font-semibold">Patient Engagement</div>
              <p className="text-sm text-muted-foreground">
                Practices report 3x higher patient engagement rates compared to traditional
                methods, thanks to our omnichannel approach and automated workflows.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">60%</div>
              <div className="font-semibold">Time Savings</div>
              <p className="text-sm text-muted-foreground">
                Administrative staff save 60% of time on patient communications through
                automation, templates, and intelligent scheduling.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">2.5x</div>
              <div className="font-semibold">ROI on Campaigns</div>
              <p className="text-sm text-muted-foreground">
                Targeted campaigns with our segmentation and analytics tools achieve
                2.5x better ROI than generic outreach.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Practice?</h2>
          <p className="text-xl mb-6 text-white/90">
            Join leading optical practices using ILS 2.0 to deliver exceptional patient care
            and drive business growth.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
              Schedule Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
