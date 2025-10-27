import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { api } from '../../api';

interface ControlPoint {
  id: string;
  name: string;
  target: number;
  tolerance: number;
  lastMeasurement: number;
  lastMeasurementTime: string;
  status: 'in-control' | 'warning' | 'out-of-control';
}

export const ControlPointsTable: React.FC = () => {
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchControlPoints = async () => {
    try {
      setLoading(true);
      const response = await api.get<ControlPoint[]>('/api/engineering/control-points');
      setControlPoints(response.data);
    } catch (error) {
      console.error('Error fetching control points:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlPoints();
  }, []);

  const getStatusColor = (status: ControlPoint['status']) => {
    switch (status) {
      case 'in-control':
        return 'success';
      case 'warning':
        return 'warning';
      case 'out-of-control':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ControlPoint['status']) => {
    switch (status) {
      case 'in-control':
        return 'In Control';
      case 'warning':
        return 'Warning';
      case 'out-of-control':
        return 'Out of Control';
      default:
        return status;
    }
  };

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
            Process Control Points
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchControlPoints} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Control Point</TableCell>
                <TableCell align="right">Target</TableCell>
                <TableCell align="right">Tolerance</TableCell>
                <TableCell align="right">Last Measurement</TableCell>
                <TableCell align="right">Last Updated</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {controlPoints.map((point) => (
                <TableRow
                  key={point.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {point.name}
                  </TableCell>
                  <TableCell align="right">{point.target}</TableCell>
                  <TableCell align="right">±{point.tolerance}</TableCell>
                  <TableCell align="right">{point.lastMeasurement}</TableCell>
                  <TableCell align="right">
                    {new Date(point.lastMeasurementTime).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(point.status)}
                      color={getStatusColor(point.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};