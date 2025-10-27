import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { api } from '../../api';

interface KpiDataPoint {
  timestamp: string;
  value: number;
  target: number;
  metric: string;
}

interface ProcessedKpiData {
  date: string;
  [key: string]: number | string;
}

export const KpiTrendsCard: React.FC = () => {
  const [kpiData, setKpiData] = useState<ProcessedKpiData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKpiData = async () => {
    try {
      setLoading(true);
      const response = await api.get<KpiDataPoint[]>('/api/engineering/kpis', {
        params: {
          timeframe: 'last30days'
        }
      });
      
      // Process and aggregate KPI data
      const processedData = processKpiData(response.data);
      setKpiData(processedData);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processKpiData = (data: KpiDataPoint[]): ProcessedKpiData[] => {
    // Group data by date and metric
    const groupedData = new Map<string, { [key: string]: number }>();
    
    data.forEach(point => {
      const date = new Date(point.timestamp).toISOString().split('T')[0];
      if (!groupedData.has(date)) {
        groupedData.set(date, {});
      }
      
      const dateData = groupedData.get(date)!;
      dateData[point.metric] = point.value;
      dateData[`${point.metric}Target`] = point.target;
    });

    // Convert to array format for Recharts
    return Array.from(groupedData.entries())
      .map(([date, values]) => ({
        date,
        ...values
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  useEffect(() => {
    fetchKpiData();
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

  const metrics = Array.from(
    new Set(
      Object.keys(kpiData[0] || {})
        .filter(key => !key.endsWith('Target') && key !== 'date')
    )
  );

  const colors = ['#2196f3', '#4caf50', '#ff9800', '#f44336'];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            KPI Trends
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchKpiData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={kpiData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {metrics.map((metric, index) => (
                <React.Fragment key={metric}>
                  <Line
                    type="monotone"
                    dataKey={metric}
                    name={metric}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${metric}Target`}
                    name={`${metric} Target`}
                    stroke={colors[index % colors.length]}
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {metrics.map((metric, index) => {
          const currentValue = kpiData[kpiData.length - 1]?.[metric];
          const target = kpiData[kpiData.length - 1]?.[`${metric}Target`];
          
          return (
            <Box key={metric} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {metric}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2">
                  Current: {currentValue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Target: {target}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};