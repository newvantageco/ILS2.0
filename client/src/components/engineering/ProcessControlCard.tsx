import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip
} from '@mui/material';

interface ProcessControlProps {
  processStatus: Array<{
    id: string;
    name: string;
    process: string;
    violationRate: number;
    totalMeasurements: number;
  }>;
}

const getStatusColor = (violationRate: number) => {
  if (violationRate <= 2) return 'success';
  if (violationRate <= 5) return 'warning';
  return 'error';
};

export const ProcessControlCard: React.FC<ProcessControlProps> = ({ processStatus }) => {
  if (!processStatus.length) {
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
          Process Control Status
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Control Point</TableCell>
                <TableCell>Process</TableCell>
                <TableCell align="center">Violation Rate</TableCell>
                <TableCell align="right">Measurements</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processStatus.map((point) => (
                <TableRow key={point.id}>
                  <TableCell>{point.name}</TableCell>
                  <TableCell>{point.process}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${point.violationRate}%`}
                      color={getStatusColor(point.violationRate)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{point.totalMeasurements}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};