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
    id: "pos",
    title: "Retail & POS",
    icon: CreditCard,
    badge: "NEW",
    items: [
      "Barcode scanning & quick search",
      "Multi-payment processing",
      "Automatic stock management",
      "Staff performance tracking",
      "Daily sales reports",
      "Refund & return handling",
    ],
    imageDescription: "Point of Sale interface with barcode scanner and multi-payment checkout",
  },
  {
    id: "lens",
    title: "Prescription & Order Management",
    icon: Glasses,
    badge: "CORE",
    items: [
      "Complete order tracking from prescription to delivery",
      "OMA file upload and parsing for precision frame data",
      "Automated quality control checkpoints",
      "Seamless integration with your preferred labs",
      "Patient status notifications and consult logging",
      "Inventory-linked ordering with real-time availability",
    ],
    imageDescription: "Prescription Management with OMA file support and order tracking",
  },
  {
    id: "ai",
    title: "AI Assistant",
    icon: Sparkles,
    badge: "POWERED BY LLAMA 3.1",
    items: [
      "Fine-tuned ophthalmic knowledge LLM - answers clinical questions instantly",
      "Natural language queries for sales, inventory, and patient analytics",
      "HIPAA-compliant with complete data anonymization",
      "Multi-tenant secure architecture with JWT authentication",
      "RAG-powered real-time database insights",
      "Context-aware recommendations for prescriptions and products",
    ],
    imageDescription: "AI Assistant with fine-tuned ophthalmic LLM providing intelligent insights",
  },
  {
    id: "analytics",
    title: "Business Intelligence",
    icon: PieChart,
    badge: "REAL-TIME",
    items: [
      "Live dashboards with AI-powered natural language queries",
      "Ask questions like 'What were top sellers last month?'",
      "Sales trend analysis and product performance tracking",
      "Customer insights & demographics (HIPAA-anonymized)",
      "Profit margin tracking with drill-down capabilities",
      "Predictive analytics for inventory optimization",
    ],
    imageDescription: "Advanced Analytics dashboard with AI-powered natural language queries",
  },
  {
    id: "security",
    title: "Enterprise Security",
    icon: Lock,
    badge: "HIPAA COMPLIANT",
    items: [
      "Complete data isolation per company (true multi-tenancy)",
      "JWT-based authentication with role-based permissions",
      "HIPAA Safe Harbor Method for patient data anonymization",
      "Subscription enforcement and usage monitoring",
      "Comprehensive audit trail logging for compliance",
      "SOC 2 Type II ready architecture with encryption at rest and in transit",
    ],
    imageDescription: "Enterprise security dashboard with HIPAA compliance and audit logs",
  },
];

export function TabbedFeatures() {
  const [activeTab, setActiveTab] = useState<string>("pos");
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
