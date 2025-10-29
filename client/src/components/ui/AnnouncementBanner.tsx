import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerType = "info" | "success" | "warning" | "error";

interface AnnouncementBannerProps {
  type?: BannerType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AnnouncementBanner({
  type = "info",
  title,
  message,
  action,
  dismissible = true,
  onDismiss,
  className,
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
  };

  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-900 dark:text-blue-200",
    success:
      "bg-green-50 dark:bg-green-950/20 border-green-500 text-green-900 dark:text-green-200",
    warning:
      "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 text-yellow-900 dark:text-yellow-200",
    error:
      "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-900 dark:text-red-200",
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className={cn(
            "relative border-l-4 p-4 mb-4",
            styles[type],
            className
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1">{title}</h4>
              {message && <p className="text-sm opacity-90">{message}</p>}
              
              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {action.label}
                </button>
              )}
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sticky banner for important announcements
export function StickyAnnouncementBanner(props: AnnouncementBannerProps) {
  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBanner {...props} />
    </div>
  );
}

// Multiple banners manager
interface Banner extends AnnouncementBannerProps {
  id: string;
}

export function BannerManager() {
  const [banners, setBanners] = React.useState<Banner[]>([]);

  React.useEffect(() => {
    // Example: Load banners from API or local storage
    const exampleBanners: Banner[] = [
      {
        id: "welcome",
        type: "info",
        title: "Welcome to the new ILS!",
        message: "Check out our new features and improvements.",
        action: {
          label: "Learn More",
          onClick: () => console.log("Learn more clicked"),
        },
      },
    ];
    
    // Only show if not dismissed
    const dismissedBanners = JSON.parse(
      localStorage.getItem("dismissedBanners") || "[]"
    );
    
    const activeBanners = exampleBanners.filter(
      (b) => !dismissedBanners.includes(b.id)
    );
    
    setBanners(activeBanners);
  }, []);

  const handleDismiss = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    
    // Save dismissed state
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedBanners") || "[]"
    );
    localStorage.setItem(
      "dismissedBanners",
      JSON.stringify([...dismissed, id])
    );
  };

  return (
    <div className="space-y-2">
      {banners.map((banner) => (
        <AnnouncementBanner
          key={banner.id}
          {...banner}
          onDismiss={() => handleDismiss(banner.id)}
        />
      ))}
    </div>
  );
}
