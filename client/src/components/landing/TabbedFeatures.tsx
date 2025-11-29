import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  CreditCard,
  Glasses,
  Sparkles,
  PieChart,
  Lock,
  MessageSquare,
  Calendar,
  Stethoscope,
  Building2,
  Factory,
  Users,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  icon: any;
  items: string[];
  badge?: string;
  imageDescription: string;
}

const features: Feature[] = [
  {
    id: "clinical",
    title: "Clinical Suite",
    icon: Stethoscope,
    badge: "COMPREHENSIVE",
    items: [
      "Digital eye examinations with customizable forms",
      "Electronic Health Records (EHR) with full patient history",
      "DICOM imaging support for medical imaging integration",
      "Clinical decision support with AI-powered insights",
      "Prescription verification and management",
      "Contact lens fitting and trial management",
    ],
    imageDescription: "Clinical examination suite with EHR integration and DICOM imaging",
  },
  {
    id: "pos",
    title: "Retail & POS",
    icon: CreditCard,
    badge: "NEW",
    items: [
      "Barcode scanning & quick search",
      "Multi-payment processing (card, cash, finance)",
      "Automatic stock management with low-stock alerts",
      "Staff performance tracking and commission calculation",
      "Daily sales reports and cash reconciliation",
      "Refund & return handling with full audit trail",
    ],
    imageDescription: "Point of Sale interface with barcode scanner and multi-payment checkout",
  },
  {
    id: "communication",
    title: "Patient Communication",
    icon: MessageSquare,
    badge: "OMNICHANNEL",
    items: [
      "SMS, Email, WhatsApp, and Push notifications",
      "Automated appointment reminders and recalls",
      "Two-way messaging with patient response tracking",
      "Campaign management for marketing and recalls",
      "Patient portal with self-service booking",
      "Telehealth video consultations built-in",
    ],
    imageDescription: "Omnichannel patient communication hub with SMS, Email, and WhatsApp",
  },
  {
    id: "diary",
    title: "Diary & Appointments",
    icon: Calendar,
    badge: "SMART SCHEDULING",
    items: [
      "Day, week, and month calendar views",
      "Multi-practitioner scheduling with room allocation",
      "Online booking integration for patient self-service",
      "Waitlist management with automated notifications",
      "Appointment types with customizable durations",
      "Resource scheduling for test rooms and equipment",
    ],
    imageDescription: "Smart diary system with multi-practitioner scheduling and online booking",
  },
  {
    id: "lens",
    title: "Prescription & Orders",
    icon: Glasses,
    badge: "CORE",
    items: [
      "Complete order tracking from prescription to delivery",
      "OMA file upload and parsing for precision frame data",
      "Automated quality control checkpoints",
      "Seamless integration with preferred labs",
      "Patient status notifications via SMS/email",
      "Inventory-linked ordering with real-time availability",
    ],
    imageDescription: "Prescription Management with OMA file support and order tracking",
  },
  {
    id: "nhs",
    title: "NHS Integration",
    icon: Building2,
    badge: "UK MARKET",
    items: [
      "NHS GOS claims processing and submission",
      "NHS e-Referral Service (e-RS) integration",
      "Patient Demographics Service (PDS) lookup",
      "NHS voucher validation and exemption checking",
      "PCSE API integration for claims management",
      "NHS-compliant patient consent and data handling",
    ],
    imageDescription: "NHS integration dashboard with claims processing and e-Referral support",
  },
  {
    id: "lab",
    title: "Lab Management",
    icon: Factory,
    badge: "FULL WORKFLOW",
    items: [
      "Complete lab work ticket management",
      "Production tracking with real-time status updates",
      "Quality control workflows with defect tracking",
      "Equipment management and maintenance scheduling",
      "Returns and non-adapt processing",
      "Supplier integration for automated ordering",
    ],
    imageDescription: "Lab management suite with production tracking and quality control",
  },
  {
    id: "ai",
    title: "AI & Predictive Analytics",
    icon: Sparkles,
    badge: "POWERED BY AI",
    items: [
      "Fine-tuned ophthalmic LLM for clinical questions",
      "AI-powered frame recommendations based on face analysis",
      "Demand forecasting for inventory optimization",
      "Predictive non-adapt detection before dispensing",
      "Natural language business analytics queries",
      "Clinical anomaly detection for patient safety",
    ],
    imageDescription: "AI-powered analytics with predictive insights and clinical decision support",
  },
  {
    id: "analytics",
    title: "Business Intelligence",
    icon: PieChart,
    badge: "REAL-TIME",
    items: [
      "Four dashboards: Practice Pulse, Financial, Operational, Patient",
      "Natural language queries - 'What were top sellers?'",
      "Sales trend analysis and product performance",
      "Staff productivity and commission tracking",
      "Profit margin tracking with drill-down capabilities",
      "Population health analytics for patient cohorts",
    ],
    imageDescription: "Advanced Analytics dashboard with AI-powered natural language queries",
  },
  {
    id: "security",
    title: "Enterprise Security",
    icon: Lock,
    badge: "HIPAA + GDPR",
    items: [
      "Complete data isolation per company (true multi-tenancy)",
      "HIPAA and GDPR compliant with full audit trails",
      "Role-based access control with fine-grained permissions",
      "Two-factor authentication (2FA) with TOTP support",
      "Field-level encryption for sensitive patient data",
      "SOC 2 Type II ready architecture",
    ],
    imageDescription: "Enterprise security dashboard with HIPAA/GDPR compliance and audit logs",
  },
];

export function TabbedFeatures() {
  const [activeTab, setActiveTab] = useState<string>("clinical");
  const activeFeature = features.find((f) => f.id === activeTab) || features[0];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isActive = activeTab === feature.id;
          
          return (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-background border-border hover:border-primary/50 hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium text-sm">{feature.title}</span>
              {feature.badge && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="text-xs ml-1"
                >
                  {feature.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Feature List */}
            <div className="p-8 lg:p-12 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <activeFeature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{activeFeature.title}</h3>
                  {activeFeature.badge && (
                    <Badge className="mt-1 text-xs">{activeFeature.badge}</Badge>
                  )}
                </div>
              </div>

              <ul className="space-y-3">
                {activeFeature.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature Visual Placeholder */}
            <div className="relative bg-gradient-to-br from-muted via-muted/50 to-background p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <activeFeature.icon className="h-12 w-12 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {activeFeature.imageDescription}
                </p>
                <div className="text-xs text-muted-foreground/70">
                  [Product Screenshot Placeholder]
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
