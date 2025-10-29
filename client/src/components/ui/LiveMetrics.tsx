import * as React from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LiveMetricProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  updateFrequency?: number; // in milliseconds
  animated?: boolean;
  className?: string;
}

export function LiveMetric({
  label,
  value,
  icon: Icon = Zap,
  trend,
  updateFrequency = 5000,
  animated = true,
  className,
}: LiveMetricProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (displayValue !== value) {
      setIsUpdating(true);
      setDisplayValue(value);
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative", className)}
    >
      <Card className="p-4">
        {isUpdating && animated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-primary/10 rounded-lg"
          />
        )}
        
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <motion.p
              key={String(displayValue)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold"
            >
              {displayValue}
            </motion.p>
            
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  trend.direction === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                <TrendingUp
                  className={cn(
                    "h-3 w-3",
                    trend.direction === "down" && "rotate-180"
                  )}
                />
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 bg-green-500 rounded-full"
          />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </Card>
    </motion.div>
  );
}

// Dashboard with live metrics
export function LiveMetricsDashboard() {
  const [metrics, setMetrics] = React.useState({
    activeOrders: 42,
    revenue: "$12,450",
    avgProcessingTime: "2.3h",
    completionRate: 98,
  });

  // Simulate real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        activeOrders: Math.floor(Math.random() * 20) + 30,
        revenue: `$${(Math.random() * 5000 + 10000).toFixed(0)}`,
        avgProcessingTime: `${(Math.random() * 2 + 1).toFixed(1)}h`,
        completionRate: Math.floor(Math.random() * 5) + 95,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <LiveMetric
        label="Active Orders"
        value={metrics.activeOrders}
        icon={Zap}
        trend={{ value: 12, direction: "up" }}
      />
      <LiveMetric
        label="Today's Revenue"
        value={metrics.revenue}
        icon={DollarSign}
        trend={{ value: 8, direction: "up" }}
      />
      <LiveMetric
        label="Avg Processing Time"
        value={metrics.avgProcessingTime}
        icon={Clock}
        trend={{ value: 5, direction: "down" }}
      />
      <LiveMetric
        label="Completion Rate"
        value={`${metrics.completionRate}%`}
        icon={TrendingUp}
        trend={{ value: 2, direction: "up" }}
      />
    </div>
  );
}
