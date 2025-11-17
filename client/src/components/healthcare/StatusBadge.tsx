import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  "pending": {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  "completed": {
    label: "Completed",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  "cancelled": {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
  "urgent": {
    label: "Urgent",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  "routine": {
    label: "Routine",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  "stat": {
    label: "Stat",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

// Capitalize first letter of status for display
const formatStatus = (status: string) => {
  return status
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: formatStatus(status),
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  };
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
