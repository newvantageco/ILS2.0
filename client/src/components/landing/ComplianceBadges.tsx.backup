import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, FileCheck, Globe } from "lucide-react";

interface ComplianceBadge {
  name: string;
  icon: any;
  description: string;
  verified: boolean;
}

const badges: ComplianceBadge[] = [
  {
    name: "HIPAA Compliant",
    icon: Shield,
    description: "Healthcare data protection standards",
    verified: true,
  },
  {
    name: "GDPR Ready",
    icon: Globe,
    description: "EU data protection compliance",
    verified: true,
  },
  {
    name: "SSL Secured",
    icon: Lock,
    description: "256-bit encryption",
    verified: true,
  },
  {
    name: "ISO 27001",
    icon: FileCheck,
    description: "Information security management",
    verified: false, // Set to true once certified
  },
];

export function ComplianceBadges() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {badges.map((badge, index) => {
        const Icon = badge.icon;
        
        return (
          <Card
            key={index}
            className={`text-center hover:shadow-md transition-shadow ${
              !badge.verified ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="font-semibold flex items-center justify-center gap-2">
                  {badge.name}
                  {badge.verified && (
                    <Badge variant="default" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
