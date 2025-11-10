/**
 * Enhanced Stat Card Component
 * 
 * A beautiful, animated stat card with:
 * - Count-up animation for numbers
 * - Trend indicators with icons
 * - Gradient accents
 * - Hover effects
 * - Accessibility features
 * 
 * Usage:
 * <EnhancedStatCard
 *   title="Total Orders"
 *   value={1234}
 *   trend={{ value: 12.5, direction: "up" }}
 *   icon={<Package />}
 *   color="blue"
 * />
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'neutral';
  period?: string; // e.g., "vs last month"
}

interface EnhancedStatCardProps {
  title: string;
  value: number | string;
  trend?: TrendData;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  prefix?: string; // e.g., "$" for currency
  suffix?: string; // e.g., "%" for percentages
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-500',
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-500',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-500',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'text-orange-500',
  },
  red: {
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-500',
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: 'text-cyan-500',
  },
};

export function EnhancedStatCard({
  title,
  value,
  trend,
  icon,
  color = 'blue',
  prefix = '',
  suffix = '',
  loading = false,
  onClick,
  className,
}: EnhancedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const colors = colorClasses[color];
  
  // Count-up animation for numeric values
  useEffect(() => {
    if (typeof value === 'number' && !loading) {
      let startValue = 0;
      const duration = 1000; // 1 second
      const steps = 60;
      const increment = value / steps;
      const stepDuration = duration / steps;
      
      const timer = setInterval(() => {
        startValue += increment;
        if (startValue >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(startValue));
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [value, loading]);

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer')}
    >
      <Card 
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:shadow-primary/5',
          'border-2 hover:border-primary/20',
          className
        )}
      >
        {/* Gradient accent line */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', colors.gradient)} />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {title}
              </p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className={cn('text-3xl font-bold tracking-tight', colors.text)}
              >
                {prefix}
                {typeof value === 'number' ? displayValue.toLocaleString() : value}
                {suffix}
              </motion.div>
            </div>
            
            {icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className={cn('p-3 rounded-xl', colors.bg)}
              >
                <div className={colors.icon}>
                  {icon}
                </div>
              </motion.div>
            )}
          </div>
          
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold',
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              <span>
                {trend.value > 0 && '+'}
                {trend.value}%
              </span>
              {trend.period && (
                <span className="text-xs opacity-75">
                  {trend.period}
                </span>
              )}
            </motion.div>
          )}
        </CardContent>
        
        {/* Hover effect overlay */}
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 pointer-events-none',
            colors.gradient
          )}
          whileHover={{ opacity: 0.03 }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}

// Skeleton version for loading states
export function EnhancedStatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700" />
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </CardContent>
    </Card>
  );
}
