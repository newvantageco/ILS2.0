/**
 * Global Loading Bar
 * 
 * NProgress-style loading indicator that appears at the top of the page.
 * Automatically shows/hides based on global loading state.
 */

import { useEffect, useState } from "react";
import { useGlobalLoading } from "@/lib/globalLoading";

export function GlobalLoadingBar() {
  const { isLoading } = useGlobalLoading();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setProgress(0);

      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 300);
      const timer3 = setTimeout(() => setProgress(80), 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Complete the progress
      setProgress(100);
      
      // Hide after animation completes
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(hideTimer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
      role="progressbar"
      aria-label="Loading"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out shadow-lg shadow-primary/50"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease-out" : "width 300ms ease-out",
        }}
      />
    </div>
  );
}

/**
 * Hook to integrate loading bar with TanStack Query
 */
export function useQueryLoadingBar() {
  const { start } = useGlobalLoading();

  return {
    onFetch: () => {
      const endLoading = start();
      return endLoading;
    },
  };
}
