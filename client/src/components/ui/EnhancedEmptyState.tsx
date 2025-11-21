/**
 * Enhanced Empty State Component
 * Beautiful empty states with illustrations, tips, and actions
 */

import { LucideIcon, FileQuestion, Package, Users, ClipboardList, Search, Plus } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface QuickAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary";
}

interface EnhancedEmptyStateProps {
  title: string;
  description: string;
  illustration?: "orders" | "patients" | "inventory" | "search" | "general";
  tips?: string[];
  primaryAction?: QuickAction;
  secondaryAction?: QuickAction;
  quickActions?: QuickAction[];
  className?: string;
}

export function EnhancedEmptyState({
  title,
  description,
  illustration = "general",
  tips,
  primaryAction,
  secondaryAction,
  quickActions,
  className,
}: EnhancedEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {/* Illustration */}
      <div className="mb-6 w-full max-w-md">
        <EmptyStateIllustration type={illustration} />
      </div>

      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>

      {/* Tips Section */}
      {tips && tips.length > 0 && (
        <Card className="mt-6 max-w-md w-full p-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            💡 Quick Tips
          </h4>
          <ul className="space-y-2 text-sm text-left">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Primary Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {primaryAction && (
            <Button
              size="lg"
              onClick={primaryAction.onClick}
              className="gap-2"
            >
              {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              size="lg"
              onClick={secondaryAction.onClick}
              className="gap-2"
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Quick Actions Grid */}
      {quickActions && quickActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-md">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              onClick={action.onClick}
              className="justify-start gap-2"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SVG Illustrations for Empty States
 */
function EmptyStateIllustration({ type }: { type: string }) {
  switch (type) {
    case "orders":
      return <OrdersIllustration />;
    case "patients":
      return <PatientsIllustration />;
    case "inventory":
      return <InventoryIllustration />;
    case "search":
      return <SearchIllustration />;
    default:
      return <GeneralIllustration />;
  }
}

function OrdersIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect width="400" height="300" fill="transparent" />
      
      {/* Clipboard */}
      <rect x="120" y="60" width="160" height="200" rx="8" fill="currentColor" className="text-muted opacity-10" />
      <rect x="140" y="40" width="120" height="20" rx="4" fill="currentColor" className="text-primary opacity-20" />
      
      {/* Lines representing text */}
      <rect x="150" y="100" width="100" height="8" rx="4" fill="currentColor" className="text-muted-foreground opacity-20" />
      <rect x="150" y="130" width="100" height="8" rx="4" fill="currentColor" className="text-muted-foreground opacity-20" />
      <rect x="150" y="160" width="80" height="8" rx="4" fill="currentColor" className="text-muted-foreground opacity-20" />
      <rect x="150" y="190" width="90" height="8" rx="4" fill="currentColor" className="text-muted-foreground opacity-20" />
      
      {/* Checkboxes */}
      <circle cx="145" cy="104" r="6" stroke="currentColor" strokeWidth="2" className="text-primary opacity-30" />
      <circle cx="145" cy="134" r="6" stroke="currentColor" strokeWidth="2" className="text-primary opacity-30" />
      <circle cx="145" cy="164" r="6" stroke="currentColor" strokeWidth="2" className="text-primary opacity-30" />
      <circle cx="145" cy="194" r="6" stroke="currentColor" strokeWidth="2" className="text-primary opacity-30" />
    </svg>
  );
}

function PatientsIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect width="400" height="300" fill="transparent" />
      
      {/* User silhouettes */}
      <circle cx="150" cy="120" r="30" fill="currentColor" className="text-primary opacity-10" />
      <path d="M 120 180 Q 150 150 180 180" fill="currentColor" className="text-primary opacity-10" />
      
      <circle cx="250" cy="130" r="25" fill="currentColor" className="text-muted opacity-10" />
      <path d="M 225 180 Q 250 155 275 180" fill="currentColor" className="text-muted opacity-10" />
      
      <circle cx="200" cy="90" r="20" fill="currentColor" className="text-muted-foreground opacity-10" />
      <path d="M 180 130 Q 200 110 220 130" fill="currentColor" className="text-muted-foreground opacity-10" />
    </svg>
  );
}

function InventoryIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect width="400" height="300" fill="transparent" />
      
      {/* Boxes stacked */}
      <rect x="130" y="160" width="60" height="60" rx="4" fill="currentColor" className="text-primary opacity-10" stroke="currentColor" strokeWidth="2" className="text-primary opacity-30" />
      <rect x="210" y="160" width="60" height="60" rx="4" fill="currentColor" className="text-muted opacity-10" stroke="currentColor" strokeWidth="2" className="text-muted opacity-30" />
      <rect x="170" y="100" width="60" height="60" rx="4" fill="currentColor" className="text-muted-foreground opacity-10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground opacity-30" />
      
      {/* Labels on boxes */}
      <rect x="145" y="180" width="30" height="4" rx="2" fill="currentColor" className="text-primary opacity-40" />
      <rect x="145" y="190" width="20" height="4" rx="2" fill="currentColor" className="text-primary opacity-40" />
      
      <rect x="225" y="180" width="30" height="4" rx="2" fill="currentColor" className="text-muted opacity-40" />
      <rect x="225" y="190" width="20" height="4" rx="2" fill="currentColor" className="text-muted opacity-40" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect width="400" height="300" fill="transparent" />
      
      {/* Magnifying glass */}
      <circle cx="170" cy="130" r="50" stroke="currentColor" strokeWidth="8" className="text-primary opacity-20" />
      <line x1="210" y1="170" x2="250" y2="210" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-primary opacity-20" />
      
      {/* Question mark inside */}
      <text x="160" y="150" fontSize="48" fill="currentColor" className="text-muted-foreground opacity-30">?</text>
    </svg>
  );
}

function GeneralIllustration() {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <rect width="400" height="300" fill="transparent" />
      
      {/* Document with plus */}
      <rect x="130" y="80" width="140" height="180" rx="8" fill="currentColor" className="text-muted opacity-10" stroke="currentColor" strokeWidth="2" className="text-muted opacity-20" />
      
      {/* Plus icon */}
      <line x1="200" y1="140" x2="200" y2="200" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary opacity-30" />
      <line x1="170" y1="170" x2="230" y2="170" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary opacity-30" />
    </svg>
  );
}

/**
 * Pre-configured Empty States
 */
export const emptyStates = {
  noOrders: {
    title: "No orders yet",
    description: "Create your first order to start processing with your lab partners.",
    illustration: "orders" as const,
    tips: [
      "Orders sync automatically with connected labs",
      "Use ⌘N to quickly create a new order",
      "Import orders from your existing system",
    ],
    primaryAction: {
      label: "Create First Order",
      icon: Plus,
      onClick: () => (window.location.href = "/orders/new"),
    },
    secondaryAction: {
      label: "Import Orders",
      onClick: () => (window.location.href = "/settings/import"),
    },
  },

  noPatients: {
    title: "No patients found",
    description: "Add patients to your system to manage their records and prescriptions.",
    illustration: "patients" as const,
    tips: [
      "Import patient data from CSV or Excel",
      "Patient records are encrypted and HIPAA-compliant",
      "Link patients to their prescriptions and orders",
    ],
    primaryAction: {
      label: "Add Patient",
      icon: Plus,
      onClick: () => (window.location.href = "/patients/new"),
    },
    quickActions: [
      {
        label: "Import from CSV",
        onClick: () => (window.location.href = "/patients/import"),
      },
      {
        label: "Connect EHR",
        onClick: () => (window.location.href = "/settings/integrations"),
      },
    ],
  },

  noInventory: {
    title: "Inventory is empty",
    description: "Add products to start tracking your stock levels and sales.",
    illustration: "inventory" as const,
    tips: [
      "Set low-stock alerts to avoid running out",
      "Sync with Shopify for automatic updates",
      "Use barcodes for quick stock adjustments",
    ],
    primaryAction: {
      label: "Add Product",
      icon: Plus,
      onClick: () => (window.location.href = "/inventory/new"),
    },
  },

  noSearchResults: {
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
    illustration: "search" as const,
    tips: [
      "Check for typos in your search query",
      "Try using fewer or different keywords",
      "Remove some filters to broaden results",
    ],
  },
};
