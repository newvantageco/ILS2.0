import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backUrl?: string;
  breadcrumbs?: Array<{ label: string; url?: string }>;
}

export function PageHeader({
  title,
  description,
  actions,
  backUrl,
  breadcrumbs,
}: PageHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-4 mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <span>/</span>}
              {crumb.url ? (
                <button
                  onClick={() => setLocation(crumb.url!)}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Back button */}
      {backUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(backUrl)}
          className="mb-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
