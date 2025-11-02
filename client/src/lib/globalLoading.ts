/**
 * Global Loading State Manager
 * 
 * Provides a centralized, non-intrusive loading indicator system.
 * Uses an NProgress-style loading bar at the top of the page.
 */

type LoadingListener = (isLoading: boolean) => void;

class GlobalLoadingManager {
  private listeners: Set<LoadingListener> = new Set();
  private activeLoaders = 0;

  get isLoading() {
    return this.activeLoaders > 0;
  }

  subscribe(listener: LoadingListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const isLoading = this.isLoading;
    this.listeners.forEach((listener) => listener(isLoading));
  }

  /**
   * Start a loading operation
   * Returns a function to end this specific loading operation
   */
  start(): () => void {
    this.activeLoaders++;
    this.notify();

    let ended = false;
    return () => {
      if (!ended) {
        ended = true;
        this.activeLoaders = Math.max(0, this.activeLoaders - 1);
        this.notify();
      }
    };
  }

  /**
   * Manually set loading state (use sparingly)
   */
  setLoading(loading: boolean) {
    if (loading && this.activeLoaders === 0) {
      this.activeLoaders = 1;
      this.notify();
    } else if (!loading && this.activeLoaders > 0) {
      this.activeLoaders = 0;
      this.notify();
    }
  }
}

export const globalLoadingManager = new GlobalLoadingManager();

// Need to import React
import * as React from "react";

// React hook for components
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = React.useState(globalLoadingManager.isLoading);

  React.useEffect(() => {
    return globalLoadingManager.subscribe(setIsLoading);
  }, []);

  return {
    isLoading,
    start: () => globalLoadingManager.start(),
    setLoading: (loading: boolean) => globalLoadingManager.setLoading(loading),
  };
}
