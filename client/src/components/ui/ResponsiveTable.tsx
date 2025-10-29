/**
 * Responsive Table Component
 * 
 * Automatically adapts table display for mobile devices:
 * - Desktop: Traditional table layout
 * - Mobile: Horizontal scroll with sticky first column OR card-based layout
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  mobileMode?: "scroll" | "cards";
}

/**
 * Wrapper for responsive table behavior
 */
export function ResponsiveTable({ 
  children, 
  className,
  mobileMode = "scroll" 
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileMode === "cards") {
    // Card mode is handled by ResponsiveTableRow component
    return <div className="space-y-3">{children}</div>;
  }

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  );
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  const isMobile = useIsMobile();
  
  return (
    <thead className={cn("[&_tr]:border-b", !isMobile && "sticky top-0 bg-background z-10", className)}>
      {children}
    </thead>
  );
}

export function ResponsiveTableBody({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  mobileCardView?: boolean;
  headers?: string[];
  onClick?: () => void;
}

export function ResponsiveTableRow({ 
  children, 
  className,
  mobileCardView = false,
  headers = [],
  onClick
}: ResponsiveTableRowProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobileCardView) {
    // Convert table row to card on mobile
    const cells = React.Children.toArray(children);
    return (
      <Card className={cn("cursor-pointer hover:bg-accent transition-colors", className)} onClick={onClick}>
        <CardContent className="p-4 space-y-2">
          {cells.map((cell, index) => (
            <div key={index} className="flex justify-between items-start gap-2">
              {headers[index] && (
                <span className="text-xs font-medium text-muted-foreground shrink-0 min-w-[80px]">
                  {headers[index]}
                </span>
              )}
              <div className="text-sm flex-1 text-right">
                {cell}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function ResponsiveTableHead({ 
  children, 
  className,
  hideOnMobile = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hideOnMobile?: boolean;
}) {
  const isMobile = useIsMobile();

  if (isMobile && hideOnMobile) {
    return null;
  }

  return (
    <th
      className={cn(
        "h-10 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        isMobile && "text-xs",
        className
      )}
    >
      {children}
    </th>
  );
}

export function ResponsiveTableCell({ 
  children, 
  className,
  hideOnMobile = false,
  truncate = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hideOnMobile?: boolean;
  truncate?: boolean;
}) {
  const isMobile = useIsMobile();

  if (isMobile && hideOnMobile) {
    return null;
  }

  return (
    <td
      className={cn(
        "p-2 sm:p-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        truncate && "max-w-[200px] truncate",
        isMobile && "text-xs",
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * Simple responsive table wrapper with horizontal scroll
 * Use this for simple tables that don't need card view
 */
export function SimpleResponsiveTable({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border rounded-lg">
          <table className={cn("min-w-full divide-y divide-border", className)}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}
