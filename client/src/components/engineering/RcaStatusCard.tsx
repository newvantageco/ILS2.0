import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { api } from '../../api';

interface RcaStatus {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const RcaStatusCard: React.FC = () => {
  const [status, setStatus] = useState<RcaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  interface RcaRecord {
  status: 'open' | 'in-progress' | 'resolved';
  severity: number;
}

const fetchRcaStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get<RcaRecord[]>('/api/engineering/rca', {
        params: {
          status: 'all'
        }
      });
      
      // Process the response data
      const rcas = response.data;
      const stats: RcaStatus = {
        total: rcas.length,
        open: rcas.filter((r: RcaRecord) => r.status === 'open').length,
        inProgress: rcas.filter((r: RcaRecord) => r.status === 'in-progress').length,
        resolved: rcas.filter((r: RcaRecord) => r.status === 'resolved').length,
        bySeverity: {
          critical: rcas.filter((r: RcaRecord) => r.severity === 5).length,
          high: rcas.filter((r: RcaRecord) => r.severity === 4).length,
          medium: rcas.filter((r: RcaRecord) => r.severity === 3).length,
          low: rcas.filter((r: RcaRecord) => r.severity <= 2).length
        }
      };
      
      setStatus(stats);
    } catch (error) {
      console.error('Error fetching RCA status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRcaStatus();
  }, []);

  if (!status || loading) {
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

  const pieData = [
    { name: 'Open', value: status.open },
    { name: 'In Progress', value: status.inProgress },
    { name: 'Resolved', value: status.resolved }
  ];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            RCA Status
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchRcaStatus} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 7 }}>
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box sx={{ flex: 5 }}>
            <Typography variant="subtitle2" gutterBottom>
              By Severity
            </Typography>
            
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="error">
                Critical ({status.bySeverity.critical})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(status.bySeverity.critical / status.total) * 100}
                color="error"
                sx={{ mb: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="warning.main">
                High ({status.bySeverity.high})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(status.bySeverity.high / status.total) * 100}
                color="warning"
                sx={{ mb: 0.5 }}
              />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="caption">
                Medium ({status.bySeverity.medium})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(status.bySeverity.medium / status.total) * 100}
                sx={{ mb: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="success.main">
                Low ({status.bySeverity.low})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(status.bySeverity.low / status.total) * 100}
                color="success"
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};