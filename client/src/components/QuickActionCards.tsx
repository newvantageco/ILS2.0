import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "@/components/ui/KeyboardShortcutBadge";
import { getModifierKey } from "@/hooks/useKeyboardShortcuts";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  shortcut?: string;
  color: string;
}

interface QuickActionCardsProps {
  actions: QuickAction[];
}

export function QuickActionCards({ actions }: QuickActionCardsProps) {
  const modKey = getModifierKey();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.title} href={action.href}>
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 border-2 hover:border-primary/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                {action.shortcut && (
                  <Kbd className="text-xs bg-muted/50">{modKey.symbol}{action.shortcut}</Kbd>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
