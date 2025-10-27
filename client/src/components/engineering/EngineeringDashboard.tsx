import React from 'react';
import { Card, Grid, Typography, Box } from '@mui/material';
import {
  QualityMetricsCard,
  ProcessControlCard,
  RcaStatusCard,
  QaFailuresCard,
  KpiTrendsCard,
  ControlPointsTable
} from '.';
import { useEffect, useState } from 'react';
import { api } from '../../api';

interface QualityMetrics {
  totalFailures: number;
  criticalFailures: number;
  reworkRatePercent: number;
  failureDistribution: Array<{ type: string; count: number }>;
}

interface ProcessStatus {
  id: string;
  name: string;
  process: string;
  violationRate: number;
  totalMeasurements: number;
}

export const EngineeringDashboard: React.FC = () => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [processStatus, setProcessStatus] = useState<ProcessStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Set date range to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const [qualityRes, processRes] = await Promise.all([
          api.get('/api/engineering/analytics/quality', {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            }
          }),
          api.get('/api/engineering/analytics/process-control')
        ]);

        setQualityMetrics(qualityRes.data);
        setProcessStatus(processRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading dashboard data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Engineering Hub
      </Typography>
      
            <Box sx={{ display: 'grid', gap: 3 }}>
        {/* Top row with summary cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <QualityMetricsCard metrics={qualityMetrics} />
          <ProcessControlCard processStatus={processStatus} />
        </Box>
        
        {/* Middle row with RCA, QA, and KPI cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <RcaStatusCard />
          <QaFailuresCard />
          <KpiTrendsCard />
        </Box>
        
        {/* Bottom row with control points table */}
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Process Control Points
            </Typography>
            <ControlPointsTable />
          </Box>
        </Card>
      </Box>
    </Box>
  );
};