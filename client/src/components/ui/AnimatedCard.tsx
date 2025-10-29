import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function AnimatedCard({ children, className, onClick, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card className={cn("transition-shadow", hover && "hover:shadow-lg", className)}>
        {children}
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  onClick?: () => void;
}

export function StatCard({ title, value, description, icon, trend, onClick }: StatCardProps) {
  return (
    <AnimatedCard onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <motion.h3
              className="text-3xl font-bold mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {value}
            </motion.h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "text-xs font-medium mt-2 flex items-center gap-1",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                <span>{trend.positive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">from last month</span>
              </motion.div>
            )}
          </div>
          {icon && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="text-muted-foreground"
            >
              {icon}
            </motion.div>
          )}
        </div>
      </CardContent>
    </AnimatedCard>
  );
}

export { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter };
