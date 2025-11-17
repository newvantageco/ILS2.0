import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "in-progress" | "completed" | "cancelled" | "urgent" | "routine" | "stat";
  className?: string;
}

const statusConfig = {
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

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
