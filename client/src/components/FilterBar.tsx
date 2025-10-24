import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterBarProps {
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  ecpFilter?: string;
  onEcpChange?: (value: string) => void;
  onClearFilters?: () => void;
}

export function FilterBar({
  statusFilter,
  onStatusChange,
  ecpFilter,
  onEcpChange,
  onClearFilters,
}: FilterBarProps) {
  const hasFilters = statusFilter || ecpFilter;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48" data-testid="select-status-filter">
          <SelectValue placeholder="Filter by Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_production">In Production</SelectItem>
          <SelectItem value="quality_check">Quality Check</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={ecpFilter} onValueChange={onEcpChange}>
        <SelectTrigger className="w-48" data-testid="select-ecp-filter">
          <SelectValue placeholder="Filter by ECP" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ECPs</SelectItem>
          <SelectItem value="vision-care">Vision Care Center</SelectItem>
          <SelectItem value="eye-health">Eye Health Associates</SelectItem>
          <SelectItem value="clarity">Clarity Optical</SelectItem>
          <SelectItem value="perfect-vision">Perfect Vision Clinic</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
