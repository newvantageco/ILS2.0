/**
 * Frontend Performance Optimization Service for ILS 2.0
 * 
 * Comprehensive performance optimization including:
 * - Code splitting and lazy loading
 * - Image optimization and compression
 * - Caching strategies
 * - Bundle analysis and optimization
 * - Runtime performance monitoring
 */

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bundleSize: {
    js: number;
    css: number;
    images: number;
    total: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    size: number;
  };
}

export interface OptimizationRecommendation {
  category: 'bundle' | 'images' | 'caching' | 'rendering' | 'network';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  estimatedImprovement: string;
  implementation: string;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics | null = null;
  private recommendations: OptimizationRecommendation[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor layout shifts
    this.observeLayoutShift();
  }

  /**
   * Monitor Core Web Vitals
   */
  private observeWebVitals(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics = {
          ...this.metrics,
          largestContentfulPaint: lastEntry.startTime
        } as PerformanceMetrics;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics = {
            ...this.metrics,
            firstInputDelay: entry.processingStart - entry.startTime
          } as PerformanceMetrics;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics = {
              ...this.metrics,
              cumulativeLayoutShift: clsValue
            } as PerformanceMetrics;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private observeResourceTiming(): void {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.analyzeResourcePerformance(entries as PerformanceResourceTiming[]);
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing monitoring not supported:', error);
    }
  }

  /**
   * Monitor long tasks
   */
  private observeLongTasks(): void {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }

  /**
   * Monitor layout shifts
   */
  private observeLayoutShift(): void {
    // Already handled in observeWebVitals for CLS
  }

  /**
   * Analyze resource performance
   */
  private analyzeResourcePerformance(entries: PerformanceResourceTiming[]): void {
    const bundleSize = {
      js: 0,
      css: 0,
      images: 0,
      total: 0
    };

    entries.forEach((entry) => {
      const size = entry.transferSize || 0;
      bundleSize.total += size;

      if (entry.name.endsWith('.js')) {
        bundleSize.js += size;
      } else if (entry.name.endsWith('.css')) {
        bundleSize.css += size;
      } else if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        bundleSize.images += size;
      }
    });

    this.metrics = {
      ...this.metrics,
      bundleSize
    } as PerformanceMetrics;
  }

  /**
   * Analyze current performance and generate recommendations
   */
  async analyzePerformance(): Promise<PerformanceMetrics> {
    console.log('🚀 Analyzing frontend performance...');

    try {
      // Collect performance metrics
      await this.collectPerformanceMetrics();
      
      // Generate optimization recommendations
      this.generateRecommendations();
      
      console.log('✅ Performance analysis completed', this.metrics);
      return this.metrics!;
    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw error;
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Wait for page to fully load
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Collect navigation timing metrics
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    // Collect First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

    // Analyze cache performance
    const cacheMetrics = this.analyzeCachePerformance();

    this.metrics = {
      loadTime,
      firstContentfulPaint,
      largestContentfulPaint: this.metrics?.largestContentfulPaint || 0,
      cumulativeLayoutShift: this.metrics?.cumulativeLayoutShift || 0,
      firstInputDelay: this.metrics?.firstInputDelay || 0,
      bundleSize: this.metrics?.bundleSize || { js: 0, css: 0, images: 0, total: 0 },
      cacheMetrics
    };
  }

  /**
   * Analyze cache performance
   */
  private analyzeCachePerformance(): PerformanceMetrics['cacheMetrics'] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let hits = 0;
    let misses = 0;
    let totalSize = 0;

    resources.forEach((resource) => {
      const size = resource.transferSize || 0;
      totalSize += size;
      
      // Check if resource was served from cache
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        hits++;
      } else if (size > 0) {
        misses++;
      }
    });

    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    const missRate = total > 0 ? (misses / total) * 100 : 0;

    return {
      hitRate: Math.round(hitRate),
      missRate: Math.round(missRate),
      size: totalSize
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): void {
    this.recommendations = [];

    if (!this.metrics) return;

    // Bundle size recommendations
    if (this.metrics.bundleSize.js > 1000000) { // > 1MB
      this.recommendations.push({
        category: 'bundle',
        priority: 'high',
        description: `Large JavaScript bundle detected: ${this.formatBytes(this.metrics.bundleSize.js)}`,
        impact: 'Slow initial page load and poor user experience',
        estimatedImprovement: '40-60% faster initial load',
        implementation: 'Implement code splitting, tree shaking, and dynamic imports'
      });
    }

    if (this.metrics.bundleSize.css > 200000) { // > 200KB
      this.recommendations.push({
        category: 'bundle',
        priority: 'medium',
        description: `Large CSS bundle detected: ${this.formatBytes(this.metrics.bundleSize.css)}`,
        impact: 'Slower rendering and larger bundle size',
        estimatedImprovement: '20-30% faster rendering',
        implementation: 'Remove unused CSS, implement critical CSS, and split styles'
      });
    }

    // Image optimization recommendations
    if (this.metrics.bundleSize.images > 500000) { // > 500KB
      this.recommendations.push({
        category: 'images',
        priority: 'high',
        description: `Large image assets detected: ${this.formatBytes(this.metrics.bundleSize.images)}`,
        impact: 'Slow page load times and high bandwidth usage',
        estimatedImprovement: '50-70% faster image loading',
        implementation: 'Compress images, use WebP format, implement lazy loading'
      });
    }

    // Loading performance recommendations
    if (this.metrics.loadTime > 3000) { // > 3 seconds
      this.recommendations.push({
        category: 'network',
        priority: 'high',
        description: `Slow page load time: ${this.metrics.loadTime}ms`,
        impact: 'Poor user experience and higher bounce rates',
        estimatedImprovement: '30-50% faster page loads',
        implementation: 'Optimize critical rendering path, implement resource hints, use CDN'
      });
    }

    if (this.metrics.firstContentfulPaint > 2000) { // > 2 seconds
      this.recommendations.push({
        category: 'rendering',
        priority: 'high',
        description: `Slow First Contentful Paint: ${this.metrics.firstContentfulPaint}ms`,
        impact: 'Users see blank screen for too long',
        estimatedImprovement: '40-60% faster initial paint',
        implementation: 'Optimize critical CSS, minimize render-blocking resources'
      });
    }

    // Core Web Vitals recommendations
    if (this.metrics.largestContentfulPaint > 2500) {
      this.recommendations.push({
        category: 'rendering',
        priority: 'medium',
        description: `Slow Largest Contentful Paint: ${this.metrics.largestContentfulPaint}ms`,
        impact: 'Poor perceived performance',
        estimatedImprovement: '30-40% better user experience',
        implementation: 'Optimize images, reduce server response time, eliminate render-blocking resources'
      });
    }

    if (this.metrics.cumulativeLayoutShift > 0.1) {
      this.recommendations.push({
        category: 'rendering',
        priority: 'medium',
        description: `High Cumulative Layout Shift: ${this.metrics.cumulativeLayoutShift}`,
        impact: 'Janky user experience and layout instability',
        estimatedImprovement: '80-90% reduction in layout shifts',
        implementation: 'Reserve space for images and ads, avoid inserting content above existing content'
      });
    }

    if (this.metrics.firstInputDelay > 100) {
      this.recommendations.push({
        category: 'network',
        priority: 'medium',
        description: `High First Input Delay: ${this.metrics.firstInputDelay}ms`,
        impact: 'Slow response to user interactions',
        estimatedImprovement: '50-70% faster interaction response',
        implementation: 'Reduce JavaScript execution time, break up long tasks, use web workers'
      });
    }

    // Cache performance recommendations
    if (this.metrics.cacheMetrics.hitRate < 80) {
      this.recommendations.push({
        category: 'caching',
        priority: 'medium',
        description: `Low cache hit rate: ${this.metrics.cacheMetrics.hitRate}%`,
        impact: 'Repeated downloads of same resources',
        estimatedImprovement: '20-40% faster repeat visits',
        implementation: 'Implement proper cache headers, use service workers, optimize bundle hashing'
      });
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations;
  }

  /**
   * Implement automatic optimizations
   */
  async applyAutomaticOptimizations(): Promise<{ applied: string[]; skipped: string[] }> {
    console.log('🔧 Applying automatic frontend optimizations...');

    const applied: string[] = [];
    const skipped: string[] = [];

    // Implement lazy loading for images
    if (this.recommendations.some(rec => rec.category === 'images')) {
      this.implementImageLazyLoading();
      applied.push('Image lazy loading');
    }

    // Implement resource hints
    if (this.recommendations.some(rec => rec.category === 'network')) {
      this.implementResourceHints();
      applied.push('Resource hints (preconnect, prefetch, preload)');
    }

    // Optimize font loading
    this.optimizeFontLoading();
    applied.push('Font loading optimization');

    // Implement critical CSS
    if (this.recommendations.some(rec => rec.category === 'rendering')) {
      applied.push('Critical CSS optimization (manual implementation required)');
    }

    console.log('✅ Automatic optimizations applied', { applied, skipped });
    return { applied, skipped };
  }

  /**
   * Implement image lazy loading
   */
  private implementImageLazyLoading(): void {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  /**
   * Implement resource hints
   */
  private implementResourceHints(): void {
    // Add preconnect for external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.openai.com'
    ];

    preconnectDomains.forEach(domain => {
      if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        document.head.appendChild(link);
      }
    });

    // Add prefetch for next likely pages
    const likelyNextPages = ['/dashboard', '/patients', '/orders'];
    likelyNextPages.forEach(page => {
      if (!document.querySelector(`link[rel="prefetch"][href="${page}"]`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = page;
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Optimize font loading
   */
  private optimizeFontLoading(): void {
    // Add font-display: swap to Google Fonts
    const googleFontsLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (googleFontsLink) {
      const href = googleFontsLink.getAttribute('href');
      if (href && !href.includes('display=swap')) {
        googleFontsLink.setAttribute('href', href + '&display=swap');
      }
    }
  }

  /**
   * Monitor performance over time
   */
  startPerformanceMonitoring(): void {
    // Monitor performance every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics();
      this.checkPerformanceThresholds();
    }, 30000);
  }

  /**
   * Check performance against thresholds
   */
  private checkPerformanceThresholds(): void {
    if (!this.metrics) return;

    const thresholds = {
      loadTime: 3000,
      firstContentfulPaint: 2000,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100
    };

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const value = this.metrics![metric as keyof PerformanceMetrics] as number;
      if (value > threshold) {
        console.warn(`Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
      }
    });
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    if (!this.metrics) {
      return 'No performance data available. Run analyzePerformance() first.';
    }

    const score = this.calculatePerformanceScore();

    const report = `
# 📊 Frontend Performance Report
Generated: ${new Date().toISOString()}

## 📈 Performance Metrics
- **Load Time**: ${this.metrics.loadTime}ms
- **First Contentful Paint**: ${this.metrics.firstContentfulPaint}ms
- **Largest Contentful Paint**: ${this.metrics.largestContentfulPaint}ms
- **Cumulative Layout Shift**: ${this.metrics.cumulativeLayoutShift}
- **First Input Delay**: ${this.metrics.firstInputDelay}ms

## 📦 Bundle Analysis
- **JavaScript**: ${this.formatBytes(this.metrics.bundleSize.js)}
- **CSS**: ${this.formatBytes(this.metrics.bundleSize.css)}
- **Images**: ${this.formatBytes(this.metrics.bundleSize.images)}
- **Total**: ${this.formatBytes(this.metrics.bundleSize.total)}

## 🎯 Cache Performance
- **Hit Rate**: ${this.metrics.cacheMetrics.hitRate}%
- **Miss Rate**: ${this.metrics.cacheMetrics.missRate}%
- **Total Size**: ${this.formatBytes(this.metrics.cacheMetrics.size)}

## 💡 Optimization Recommendations
${this.recommendations.map(rec => `
- **${rec.category.toUpperCase()}** (${rec.priority}): ${rec.description}
  - Impact: ${rec.impact}
  - Estimated Improvement: ${rec.estimatedImprovement}
  - Implementation: ${rec.implementation}
`).join('')}

## 🏆 Performance Score
${score}/100

## 🎯 Core Web Vitals Status
${this.getCoreWebVitalsStatus()}
    `.trim();

    return report;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): number {
    if (!this.metrics) return 0;

    let score = 100;

    // Deduct points for slow load time
    if (this.metrics.loadTime > 3000) {
      score -= Math.min((this.metrics.loadTime - 3000) / 100, 30);
    }

    // Deduct points for slow FCP
    if (this.metrics.firstContentfulPaint > 2000) {
      score -= Math.min((this.metrics.firstContentfulPaint - 2000) / 50, 25);
    }

    // Deduct points for layout shifts
    if (this.metrics.cumulativeLayoutShift > 0.1) {
      score -= Math.min((this.metrics.cumulativeLayoutShift - 0.1) * 100, 20);
    }

    // Deduct points for slow FID
    if (this.metrics.firstInputDelay > 100) {
      score -= Math.min((this.metrics.firstInputDelay - 100) / 10, 15);
    }

    // Deduct points for large bundle
    if (this.metrics.bundleSize.total > 2000000) { // > 2MB
      score -= Math.min((this.metrics.bundleSize.total - 2000000) / 100000, 10);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get Core Web Vitals status
   */
  private getCoreWebVitalsStatus(): string {
    if (!this.metrics) return 'No data available';

    const vitals = [
      { name: 'LCP', value: this.metrics.largestContentfulPaint, threshold: 2500, unit: 'ms' },
      { name: 'FID', value: this.metrics.firstInputDelay, threshold: 100, unit: 'ms' },
      { name: 'CLS', value: this.metrics.cumulativeLayoutShift, threshold: 0.1, unit: '' }
    ];

    return vitals.map(vital => {
      const status = vital.value <= vital.threshold ? '✅ Good' : '❌ Poor';
      return `- ${vital.name}: ${vital.value}${vital.unit} (${status})`;
    }).join('\n');
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  /**
   * Cleanup performance observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;
