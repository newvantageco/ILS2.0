/**
 * Contextual Help Button Component
 * Provides inline help and documentation access
 */

import { useState } from "react";
import { HelpCircle, ExternalLink, Video, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Separator } from "./separator";
import { Badge } from "./badge";

export interface HelpContent {
  title: string;
  description: string;
  videoUrl?: string;
  docUrl?: string;
  supportUrl?: string;
  tips?: string[];
  relatedTopics?: Array<{
    title: string;
    url: string;
  }>;
}

interface HelpButtonProps {
  content: HelpContent;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function HelpButton({
  content,
  variant = "ghost",
  size = "icon",
  className,
}: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label="Get help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h4 className="font-semibold text-base mb-1">{content.title}</h4>
            <p className="text-sm text-muted-foreground">
              {content.description}
            </p>
          </div>

          <Separator />

          {/* Quick Tips */}
          {content.tips && content.tips.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Quick Tips
                </Badge>
              </div>
              <ul className="space-y-1.5 text-sm">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Action Links */}
          <div className="space-y-2">
            {content.videoUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={content.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Video Tutorial
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}

            {content.docUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={content.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read Documentation
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}

            {content.supportUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={content.supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            )}
          </div>

          {/* Related Topics */}
          {content.relatedTopics && content.relatedTopics.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Related Topics
                </p>
                <div className="space-y-1">
                  {content.relatedTopics.map((topic, index) => (
                    <a
                      key={index}
                      href={topic.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {topic.title}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Help Content Library
 * Pre-configured help content for common features
 */
export const helpContent = {
  orders: {
    title: "Creating Orders",
    description: "Learn how to create and manage orders in the system.",
    tips: [
      "Use ⌘K to quickly create a new order",
      "Orders automatically sync with your lab partners",
      "Save time with prescription templates",
    ],
    videoUrl: "https://help.ils.com/videos/creating-orders",
    docUrl: "https://docs.ils.com/orders/creating",
    supportUrl: "https://support.ils.com/contact",
    relatedTopics: [
      { title: "Prescription Management", url: "/help/prescriptions" },
      { title: "Order Status Tracking", url: "/help/order-status" },
    ],
  },
  
  inventory: {
    title: "Inventory Management",
    description: "Track and manage your product inventory efficiently.",
    tips: [
      "Set low stock alerts to never run out",
      "Use barcode scanning for quick updates",
      "Auto-sync with Shopify inventory",
    ],
    videoUrl: "https://help.ils.com/videos/inventory",
    docUrl: "https://docs.ils.com/inventory",
    relatedTopics: [
      { title: "Stock Adjustments", url: "/help/stock-adjustments" },
      { title: "Reorder Management", url: "/help/reorders" },
    ],
  },
  
  eyeTest: {
    title: "Eye Examinations",
    description: "Conduct comprehensive eye tests following UK standards.",
    tips: [
      "Uses Snellen 6/6 notation (UK standard)",
      "All results automatically saved to patient record",
      "Clinical anomaly detection alerts you to issues",
    ],
    videoUrl: "https://help.ils.com/videos/eye-tests",
    docUrl: "https://docs.ils.com/clinical/eye-tests",
    relatedTopics: [
      { title: "UK Clinical Standards", url: "/help/uk-standards" },
      { title: "Patient Records", url: "/help/patient-records" },
    ],
  },

  multiTenant: {
    title: "Multi-Tenant Features",
    description: "Understanding company data isolation and security.",
    tips: [
      "Your data is completely isolated from other companies",
      "Subscription tier determines available features",
      "AI query limits based on your subscription",
    ],
    docUrl: "https://docs.ils.com/security/multi-tenant",
    supportUrl: "https://support.ils.com/contact",
  },

  aiAssistant: {
    title: "AI Assistant",
    description: "Get intelligent insights and recommendations powered by AI.",
    tips: [
      "Ask questions in natural language",
      "AI learns from your company's data",
      "Query limits based on subscription tier",
    ],
    videoUrl: "https://help.ils.com/videos/ai-assistant",
    docUrl: "https://docs.ils.com/ai/getting-started",
    relatedTopics: [
      { title: "AI Query Limits", url: "/help/ai-limits" },
      { title: "Training the AI", url: "/help/ai-training" },
    ],
  },
};
