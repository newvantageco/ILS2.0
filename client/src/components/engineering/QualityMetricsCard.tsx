import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface QualityMetricsProps {
  metrics: {
    totalFailures: number;
    criticalFailures: number;
    reworkRatePercent: number;
    failureDistribution: Array<{ type: string; count: number }>;
  } | null;
}

export const QualityMetricsCard: React.FC<QualityMetricsProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quality Metrics (Last 30 Days)
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Total Failures
            </Typography>
            <Typography variant="h4">
              {metrics.totalFailures}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Critical Failures
            </Typography>
            <Typography variant="h4" color="error">
              {metrics.criticalFailures}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Rework Rate
            </Typography>
            <Typography variant="h4">
              {metrics.reworkRatePercent}%
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="subtitle1" gutterBottom>
          Failure Distribution
        </Typography>
        
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics.failureDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};