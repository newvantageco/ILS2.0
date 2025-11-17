/**
 * Performance Monitoring Utilities
 * 
 * Tracks Core Web Vitals and provides performance insights
 */

export interface PerformanceMetrics {
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  inp?: number;  // Interaction to Next Paint (replaces FID)
  cls?: number;  // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

/**
 * Report Web Vitals to analytics
 * Compatible with Google Analytics, custom endpoints, etc.
 */
export function reportWebVitals(onPerfEntry?: (metric: PerformanceMetrics) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric: any) => onPerfEntry({ cls: metric.value }));
      onINP((metric: any) => onPerfEntry({ inp: metric.value }));
      onFCP((metric: any) => onPerfEntry({ fcp: metric.value }));
      onLCP((metric: any) => onPerfEntry({ lcp: metric.value }));
      onTTFB((metric: any) => onPerfEntry({ ttfb: metric.value }));
    });
  }
}

/**
 * Log performance metrics to console (dev mode only)
 */
export function logPerformanceMetrics() {
  if (import.meta.env.DEV) {
    reportWebVitals((metric) => {
      console.log('📊 Performance Metric:', metric);
    });
  }
}

/**
 * Prefetch a route for faster navigation
 * Call this when user hovers over a link
 */
export function prefetchRoute(path: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Preload critical resources
 * Use for fonts, critical CSS, hero images
 */
export function preloadResource(url: string, as: 'image' | 'font' | 'style' | 'script') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Measure component render time
 * Useful for identifying slow components
 */
export function measureRenderTime(componentName: string, callback: () => void) {
  const start = performance.now();
  callback();
  const end = performance.now();
  const duration = end - start;
  
  if (import.meta.env.DEV && duration > 16) { // Slower than 60fps
    console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
  }
  
  return duration;
}

/**
 * Check if user prefers reduced motion
 * Disable animations for accessibility
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection information for adaptive loading
 */
export function getConnectionInfo() {
  // @ts-ignore - navigator.connection is not in TypeScript lib yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  return {
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0,
    saveData: connection?.saveData || false,
  };
}

/**
 * Should load high quality assets?
 * Checks connection speed and data saver settings
 */
export function shouldLoadHighQuality(): boolean {
  const { effectiveType, saveData } = getConnectionInfo();
  
  if (saveData) return false;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return false;
  
  return true;
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
