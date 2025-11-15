/**
 * useSaaSMetrics Hook
 * 
 * Centralized hook for fetching and managing SaaS business metrics
 * Provides real-time access to:
 * - MRR/ARR metrics
 * - Customer acquisition costs
 * - Customer lifetime value
 * - Net revenue retention
 * - Churn predictions
 * - Customer health scores
 * - Cohort retention analysis
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';

interface MRRData {
  mrr: number;
  arr: number;
  mom_growth: number;
}

interface CACData {
  cac: number;
  totalSpent: number;
  newCustomers: number;
}

interface CLVData {
  avgLifetimeValue: number;
  avgMonthlyChurn: number;
}

interface NRRData {
  nrr: number;
}

interface ChurnData {
  monthlyChurnRate: number;
}

interface SaaSMetricsSummary {
  mrr: MRRData;
  cac: CACData;
  clv: CLVData;
  nrr: NRRData;
  churn: ChurnData;
}

interface HealthSegmentation {
  excellent: number;
  good: number;
  at_risk: number;
  critical: number;
}

interface ChurnRiskCustomer {
  companyId: string;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topSignals: Array<{ signal: string; severity: number }>;
}

interface ChurnReport {
  totalCustomers: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  criticalRisk: number;
  topRiskCompanies: ChurnRiskCustomer[];
}

interface CohortData {
  cohortMonthIndex: number;
  retentionPercentage: number;
}

interface CohortDashboard {
  currentCohort: string;
  retentionCurve: CohortData[];
  avgRetention: number;
}

// Base API function
const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
  },
};

/**
 * Fetch core SaaS metrics (MRR, CAC, CLV, NRR, Churn)
 */
export function useSaaSMetricsSummary(): UseQueryResult<SaaSMetricsSummary> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'summary'],
    queryFn: () => apiClient.get('/api/saas/metrics/summary'),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Fetch MRR/ARR metrics specifically
 */
export function useMRRMetrics(): UseQueryResult<MRRData> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'mrr'],
    queryFn: () => apiClient.get('/api/saas/metrics/mrr'),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Fetch CAC metrics
 */
export function useCACMetrics(): UseQueryResult<CACData> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'cac'],
    queryFn: () => apiClient.get('/api/saas/metrics/cac'),
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000,
  });
}

/**
 * Fetch CLV metrics
 */
export function useCLVMetrics(): UseQueryResult<CLVData> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'clv'],
    queryFn: () => apiClient.get('/api/saas/metrics/clv'),
    refetchInterval: 300000,
    staleTime: 120000,
  });
}

/**
 * Fetch NRR metrics
 */
export function useNRRMetrics(): UseQueryResult<NRRData> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'nrr'],
    queryFn: () => apiClient.get('/api/saas/metrics/nrr'),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Fetch churn rate
 */
export function useChurnMetrics(): UseQueryResult<ChurnData> {
  return useQuery({
    queryKey: ['saas', 'metrics', 'churn'],
    queryFn: () => apiClient.get('/api/saas/metrics/churn'),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

/**
 * Fetch customer health segmentation
 */
export function useHealthSegmentation(): UseQueryResult<HealthSegmentation> {
  return useQuery({
    queryKey: ['saas', 'health', 'segmentation'],
    queryFn: () => apiClient.get('/api/saas/health/segmentation'),
    refetchInterval: 300000,
    staleTime: 120000,
  });
}

/**
 * Fetch churn risk report with top at-risk customers
 */
export function useChurnRiskReport(): UseQueryResult<ChurnReport> {
  return useQuery({
    queryKey: ['saas', 'churn', 'report'],
    queryFn: () => apiClient.get('/api/saas/churn/report'),
    refetchInterval: 300000,
    staleTime: 120000,
  });
}

/**
 * Fetch cohort retention dashboard
 */
export function useCohortRetention(): UseQueryResult<CohortDashboard> {
  return useQuery({
    queryKey: ['saas', 'cohorts', 'dashboard'],
    queryFn: () => apiClient.get('/api/saas/cohorts/dashboard'),
    refetchInterval: 600000, // Refetch every 10 minutes (cohorts change slowly)
    staleTime: 300000,
  });
}

/**
 * Combined hook for all metrics (convenience)
 */
export function useAllSaaSMetrics() {
  const summary = useSaaSMetricsSummary();
  const health = useHealthSegmentation();
  const churn = useChurnRiskReport();
  const cohorts = useCohortRetention();

  return {
    summary: summary.data,
    health: health.data,
    churn: churn.data,
    cohorts: cohorts.data,
    isLoading: summary.isLoading || health.isLoading || churn.isLoading || cohorts.isLoading,
    isError: summary.isError || health.isError || churn.isError || cohorts.isError,
    error: summary.error || health.error || churn.error || cohorts.error,
  };
}
