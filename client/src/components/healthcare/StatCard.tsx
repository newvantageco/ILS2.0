import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon?: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center mt-1">
                {change.type === "increase" ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    change.type === "increase" ? "text-green-500" : "text-red-500"
                  )}
                >
                  {Math.abs(change.value)}%
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  from last period
                </span>
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <div className="ml-4 p-3 bg-muted rounded-lg">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
