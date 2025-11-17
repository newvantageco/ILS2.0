import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface CollapsibleSidebarGroupProps {
  label: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function CollapsibleSidebarGroup({
  label,
  children,
  defaultCollapsed = false,
  className,
}: CollapsibleSidebarGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel
        className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label} section`}
      >
        <span>{label}</span>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </SidebarGroupLabel>
      {!isCollapsed && <SidebarGroupContent>{children}</SidebarGroupContent>}
    </SidebarGroup>
  );
}
