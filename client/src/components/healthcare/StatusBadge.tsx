import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'denied'
  | 'active'
  | 'inactive'
  | 'completed'
  | 'cancelled'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { variant: string; className: string }> = {
  // Claim/Document statuses
  draft: { variant: 'outline', className: 'border-gray-400 text-gray-700' },
  pending: { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  submitted: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  approved: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  denied: { variant: 'destructive', className: '' },

  // Activity statuses
  active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  inactive: { variant: 'outline', className: 'border-gray-400 text-gray-700' },
  completed: { variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
  cancelled: { variant: 'destructive', className: '' },

  // Risk/Priority levels
  critical: { variant: 'destructive', className: 'bg-red-600 hover:bg-red-700' },
  high: { variant: 'destructive', className: '' },
  medium: { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  low: { variant: 'outline', className: 'border-green-500 text-green-700' },

  // General statuses
  success: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  warning: { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  error: { variant: 'destructive', className: '' },
  info: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const config = statusConfig[normalizedStatus] || statusConfig.info;

  return (
    <Badge
      variant={config.variant as any}
      className={cn(config.className, className)}
    >
      {status}
    </Badge>
  );
}
