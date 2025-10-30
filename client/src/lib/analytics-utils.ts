/**
 * Common Analytics Utilities
 * Shared functions for date ranges, formatting, and data fetching
 */

/**
 * Date range options for analytics
 */
export const dateRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'Last 90 Days', value: '90days' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
] as const;

export type DateRangeValue = typeof dateRanges[number]['value'];

/**
 * Convert date range selection to start/end dates
 */
export const getDateRange = (range: string): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(end.getDate() - 30); // default to 30 days
  }
  
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

/**
 * Format currency values
 */
export const formatCurrency = (value: number, locale: string = 'en-GB', currency: string = 'GBP'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(decimals)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toLocaleString();
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date, format: 'short' | 'medium' | 'long' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    case 'medium':
      return dateObj.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return dateObj.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    default:
      return dateObj.toLocaleDateString('en-GB');
  }
};

/**
 * Format time for display
 */
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get day name from day number (0-6)
 */
export const getDayName = (dayNumber: number, short: boolean = false): string => {
  const days = short 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || '';
};

/**
 * Calculate trend percentage
 */
export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Generic API fetch with error handling
 */
export const fetchAnalyticsData = async <T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'Unauthorized. Please log in again.' };
      }
      if (response.status === 403) {
        return { data: null, error: 'Access denied. You do not have permission to view this data.' };
      }
      return { data: null, error: `Failed to fetch data: ${response.statusText}` };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

/**
 * Chart colors for consistent styling
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316',
} as const;

export const CHART_COLOR_ARRAY = Object.values(CHART_COLORS);

/**
 * Get trend color class based on value and direction
 */
export const getTrendColor = (value: number, inverse: boolean = false): string => {
  const isPositive = value > 0;
  const isGood = inverse ? !isPositive : isPositive;
  return isGood ? 'text-green-600' : 'text-red-600';
};

/**
 * Get trend icon name based on value
 */
export const getTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

/**
 * Calculate sum from array of numbers
 */
export const calculateSum = (numbers: number[]): number => {
  return numbers.reduce((acc, num) => acc + num, 0);
};

/**
 * Group data by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by key
 */
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};
