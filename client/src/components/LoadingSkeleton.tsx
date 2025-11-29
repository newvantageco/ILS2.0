/**
 * LoadingSkeleton Component
 * 
 * UX Principle: Show progress, don't leave users guessing
 * Skeleton screens reduce perceived load time
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'form' | 'text';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 3,
  className
}) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  // Card skeleton
  if (variant === 'card') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className={`${baseClasses} w-12 h-12 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${baseClasses} h-5 w-3/4`} />
                <div className={`${baseClasses} h-4 w-1/2`} />
              </div>
            </div>
            <div className="space-y-2">
              <div className={`${baseClasses} h-4 w-full`} />
              <div className={`${baseClasses} h-4 w-5/6`} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // List skeleton
  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded">
            <div className={`${baseClasses} w-10 h-10 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-2/3`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
            <div className={`${baseClasses} w-20 h-8 rounded`} />
          </div>
        ))}
      </div>
    );
  }
  
  // Table skeleton
  if (variant === 'table') {
    return (
      <div className={cn("border rounded-lg overflow-hidden", className)}>
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex gap-4">
          <div className={`${baseClasses} h-4 w-32`} />
          <div className={`${baseClasses} h-4 w-24`} />
          <div className={`${baseClasses} h-4 w-28`} />
          <div className={`${baseClasses} h-4 flex-1`} />
        </div>
        {/* Rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 border-b flex gap-4">
            <div className={`${baseClasses} h-4 w-32`} />
            <div className={`${baseClasses} h-4 w-24`} />
            <div className={`${baseClasses} h-4 w-28`} />
            <div className={`${baseClasses} h-4 flex-1`} />
          </div>
        ))}
      </div>
    );
  }
  
  // Form skeleton
  if (variant === 'form') {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={`${baseClasses} h-4 w-24`} />
            <div className={`${baseClasses} h-10 w-full rounded-md`} />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <div className={`${baseClasses} h-10 w-32 rounded-md`} />
          <div className={`${baseClasses} h-10 w-24 rounded-md`} />
        </div>
      </div>
    );
  }
  
  // Text skeleton
  if (variant === 'text') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className={`${baseClasses} h-4`}
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </div>
    );
  }
  
  return null;
};

// Specialized skeleton components

export const PatientListSkeleton: React.FC = () => (
  <LoadingSkeleton variant="list" count={5} />
);

export const DashboardCardSkeleton: React.FC = () => (
  <LoadingSkeleton variant="card" count={3} />
);

export const OrderTableSkeleton: React.FC = () => (
  <LoadingSkeleton variant="table" count={8} />
);

export const FormSkeleton: React.FC = () => (
  <LoadingSkeleton variant="form" count={5} />
);

// Usage examples:

// Generic
// {isLoading && <LoadingSkeleton variant="card" count={3} />}

// Specific
// {isLoading && <PatientListSkeleton />}
// {isLoading && <DashboardCardSkeleton />}
// {isLoading && <OrderTableSkeleton />}
