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
    title: "Lens Management",
    icon: Glasses,
    badge: "CORE",
    items: [
      "Complete order tracking from prescription to delivery",
      "Automated quality control checkpoints",
      "Seamless integration with your preferred labs",
      "Patient status notifications",
      "Inventory-linked ordering",
    ],
    imageDescription: "Lens Management dashboard showing order tracking and status updates",
  },
  {
    id: "ai",
    title: "AI Assistant",
    icon: Sparkles,
    badge: "CORE",
    items: [
      "Intelligent automation for prescription analysis",
      "Context-aware recommendations for lens and coatings",
      "Automated patient follow-up suggestions",
      "Smart support and documentation access",
    ],
    imageDescription: "AI Assistant providing intelligent prescription recommendations",
  },
  {
    id: "analytics",
    title: "Business Intelligence",
    icon: PieChart,
    badge: "COMING SOON",
    items: [
      "Real-time dashboards",
      "Sales trend analysis",
      "Product performance tracking",
      "Customer insights & demographics",
      "Profit tracking",
      "Predictive analytics",
    ],
    imageDescription: "Advanced Analytics dashboard with real-time business metrics",
  },
  {
    id: "security",
    title: "Multi-Tenant Security",
    icon: Lock,
    badge: "NEW",
    items: [
      "Complete data isolation per company",
      "Company-scoped access & role-based permissions",
      "Subscription enforcement",
      "Full audit trail logging",
      "Compliance-ready architecture",
    ],
    imageDescription: "Security dashboard showing audit logs and access controls",
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
