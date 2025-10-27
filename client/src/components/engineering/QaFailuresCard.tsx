import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { api } from '../../api';

interface QaFailure {
  id: string;
  failureType: string;
  severity: number;
  timestamp: string;
  resolved: boolean;
}

interface WeeklyStats {
  week: string;
  total: number;
  resolved: number;
  pending: number;
}

export const QaFailuresCard: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQaFailures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/engineering/qa/failures', {
        params: {
          timeframe: 'last4weeks'
        }
      });
      
      // Process weekly statistics
      const failures: QaFailure[] = response.data;
      const stats = processWeeklyStats(failures);
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Error fetching QA failures:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyStats = (failures: QaFailure[]): WeeklyStats[] => {
    const weeks = new Map<string, WeeklyStats>();
    
    // Get the last 4 weeks
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks.set(weekKey, {
        week: `Week ${4-i}`,
        total: 0,
        resolved: 0,
        pending: 0
      });
    }

    // Process failures
    failures.forEach(failure => {
      const failureDate = new Date(failure.timestamp);
      const weekStart = new Date(failureDate.setDate(failureDate.getDate() - failureDate.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weeks.has(weekKey)) {
        const stats = weeks.get(weekKey)!;
        stats.total++;
        if (failure.resolved) {
          stats.resolved++;
        } else {
          stats.pending++;
        }
      }
    });

    return Array.from(weeks.values()).reverse();
  };

  useEffect(() => {
    fetchQaFailures();
  }, []);

  if (loading) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            QA Failures Trend
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchQaFailures} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyStats}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="resolved" name="Resolved" fill="#4caf50" stackId="a" />
              <Bar dataKey="pending" name="Pending" fill="#ff9800" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Failures
            </Typography>
            <Typography variant="h6">
              {weeklyStats.reduce((sum, week) => sum + week.total, 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="success.main">
              Resolved
            </Typography>
            <Typography variant="h6">
              {weeklyStats.reduce((sum, week) => sum + week.resolved, 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="warning.main">
              Pending
            </Typography>
            <Typography variant="h6">
              {weeklyStats.reduce((sum, week) => sum + week.pending, 0)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};