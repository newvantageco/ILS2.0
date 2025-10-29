import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [, setLocation] = useLocation();

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <button
        onClick={() => setLocation("/")}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {item.path && !isLast ? (
              <button
                onClick={() => setLocation(item.path!)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </button>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  isLast ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Auto-generate breadcrumbs from current path
export function AutoBreadcrumbs() {
  const [location] = useLocation();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.split("/").filter(Boolean);
    
    return paths.map((path, index) => {
      const fullPath = "/" + paths.slice(0, index + 1).join("/");
      const label = path
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      return {
        label,
        path: index < paths.length - 1 ? fullPath : undefined,
      };
    });
  };

  const items = generateBreadcrumbs();

  if (items.length === 0) {
    return null;
  }

  return <Breadcrumbs items={items} className="mb-4" />;
}
