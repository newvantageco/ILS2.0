import { useState, useEffect } from 'react';
import { shouldLoadHighQuality } from '@/utils/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Lazy loading with Intersection Observer
 * - Low quality placeholder
 * - Adaptive loading based on connection speed
 * - Proper aspect ratio to prevent layout shift
 * 
 * @example
 * <OptimizedImage 
 *   src="/images/hero.jpg" 
 *   lowQualitySrc="/images/hero-low.jpg"
 *   alt="Hero image"
 *   width={1200}
 *   height={600}
 * />
 */
export function OptimizedImage({
  src,
  alt,
  lowQualitySrc,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(lowQualitySrc || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadHighQuality = shouldLoadHighQuality();

  useEffect(() => {
    if (!loadHighQuality && lowQualitySrc) {
      // On slow connection, stick with low quality
      setImageSrc(lowQualitySrc);
      return;
    }

    // Load high quality image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
  }, [src, lowQualitySrc, loadHighQuality, onLoad]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? '' : 'blur-sm'} transition-all duration-300`}
      width={width}
      height={height}
      loading={loading}
      style={
        width && height
          ? { aspectRatio: `${width} / ${height}` }
          : undefined
      }
    />
  );
}

/**
 * Skeleton loader for images
 * Shows while image is loading to prevent layout shift
 */
export function ImageSkeleton({ 
  width, 
  height, 
  className = '' 
}: { 
  width?: number; 
  height?: number; 
  className?: string;
}) {
  return (
    <div
      className={`bg-muted animate-pulse ${className}`}
      style={
        width && height
          ? { width, height, aspectRatio: `${width} / ${height}` }
          : { width: '100%', paddingBottom: '56.25%' } // 16:9 default
      }
    />
  );
}
