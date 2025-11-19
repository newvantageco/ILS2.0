/**
 * Appointment Status Badge Component
 * 
 * Color-coded status indicators for appointment workflow stages:
 * - 🟢 Green: Scheduled
 * - 🟡 Yellow: Checked In
 * - 🔵 Blue: In Exam
 * - 🟣 Purple: Ready for Dispense
 * - ⚫ Gray: Completed
 * - 🟠 Orange: Running Late
 * - 🔴 Red: Cancelled
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  UserCheck, 
  Stethoscope, 
  Package, 
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface AppointmentStatusBadgeProps {
  stage: 'scheduled' | 'checked_in' | 'in_pretest' | 'in_exam' | 'ready_for_dispense' | 'dispensing' | 'completed';
  status?: string;
  isRunningLate?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function AppointmentStatusBadge({
  stage,
  status,
  isRunningLate = false,
  className,
  showIcon = true,
}: AppointmentStatusBadgeProps) {
  // Handle cancelled/no-show statuses
  if (status === 'cancelled' || status === 'no_show') {
    return (
      <Badge
        variant="destructive"
        className={cn('flex items-center gap-1.5', className)}
      >
        {showIcon && <XCircle className="w-3 h-3" />}
        {status === 'cancelled' ? 'Cancelled' : 'No Show'}
      </Badge>
    );
  }
  
  // Handle running late
  if (isRunningLate) {
    return (
      <Badge
        className={cn(
          'flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white animate-pulse',
          className
        )}
      >
        {showIcon && <Clock className="w-3 h-3" />}
        Running Late
      </Badge>
    );
  }
  
  // Regular stage-based status
  const config = getStageConfig(stage);
  
  return (
    <Badge
      className={cn(
        'flex items-center gap-1.5',
        config.className,
        stage === 'checked_in' && 'animate-pulse', // Pulse for checked in
        className
      )}
    >
      {showIcon && <config.icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}

function getStageConfig(stage: string) {
  switch (stage) {
    case 'scheduled':
      return {
        label: 'Scheduled',
        icon: Calendar,
        className: 'bg-green-500 hover:bg-green-600 text-white',
      };
    
    case 'checked_in':
      return {
        label: 'Checked In',
        icon: UserCheck,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      };
    
    case 'in_pretest':
      return {
        label: 'Pre-Test',
        icon: Stethoscope,
        className: 'bg-blue-400 hover:bg-blue-500 text-white',
      };
    
    case 'in_exam':
      return {
        label: 'In Exam',
        icon: Stethoscope,
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    
    case 'ready_for_dispense':
      return {
        label: 'Ready for Dispense',
        icon: Package,
        className: 'bg-purple-500 hover:bg-purple-600 text-white',
      };
    
    case 'dispensing':
      return {
        label: 'Dispensing',
        icon: Package,
        className: 'bg-purple-400 hover:bg-purple-500 text-white',
      };
    
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-gray-500 hover:bg-gray-600 text-white',
      };
    
    default:
      return {
        label: stage,
        icon: Calendar,
        className: 'bg-gray-400 hover:bg-gray-500 text-white',
      };
  }
}

/**
 * Next action indicator
 */
interface NextActionBadgeProps {
  nextAction?: string;
  stage: string;
  className?: string;
}

export function NextActionBadge({ nextAction, stage, className }: NextActionBadgeProps) {
  if (!nextAction) return null;
  
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', className)}
    >
      Next: {nextAction}
    </Badge>
  );
}

/**
 * Status indicator dot (for compact views)
 */
interface StatusDotProps {
  stage: string;
  isRunningLate?: boolean;
  className?: string;
}

export function StatusDot({ stage, isRunningLate = false, className }: StatusDotProps) {
  const color = getStatusColor(stage, isRunningLate);
  
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        color,
        stage === 'checked_in' && 'animate-pulse',
        className
      )}
      aria-label={`Status: ${stage}`}
    />
  );
}

function getStatusColor(stage: string, isRunningLate: boolean): string {
  if (isRunningLate) return 'bg-orange-500';
  
  switch (stage) {
    case 'scheduled':
      return 'bg-green-500';
    case 'checked_in':
      return 'bg-yellow-500';
    case 'in_pretest':
      return 'bg-blue-400';
    case 'in_exam':
      return 'bg-blue-600';
    case 'ready_for_dispense':
      return 'bg-purple-500';
    case 'dispensing':
      return 'bg-purple-400';
    case 'completed':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}
