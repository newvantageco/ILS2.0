# Order Tracking UI Component

This component will provide real-time order status updates and timeline visualization.

```tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Timeline } from '../components/ui/timeline';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface OrderStatus {
  status: string;
  timestamp: Date;
  details?: {
    location?: string;
    stage?: string;
    completedSteps?: string[];
    nextStep?: string;
    estimatedCompletion?: Date;
  };
}

interface Props {
  orderId: string;
}

export const OrderTracking: React.FC<Props> = ({ orderId }) => {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [timeline, setTimeline] = useState<OrderStatus[]>([]);
  
  // Connect to WebSocket for real-time updates
  const ws = useWebSocket(`ws://localhost:3000/ws?orderId=${orderId}`);
  
  useEffect(() => {
    // Initial status fetch
    fetch(`/api/orders/${orderId}/status`)
      .then(res => res.json())
      .then(data => setStatus(data));
      
    // Fetch timeline
    fetch(`/api/orders/${orderId}/timeline`)
      .then(res => res.json())
      .then(data => setTimeline(data));
  }, [orderId]);
  
  // Handle real-time updates
  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const update = JSON.parse(event.data);
        setStatus(update);
        setTimeline(prev => [...prev, update]);
      };
    }
  }, [ws]);

  if (!status) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold">Current Status</h2>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant={getStatusVariant(status.status)}>
            {status.status}
          </Badge>
          {status.details?.stage && (
            <span className="text-sm text-gray-500">
              {status.details.stage}
            </span>
          )}
        </div>
        {status.details?.estimatedCompletion && (
          <p className="text-sm text-gray-500 mt-2">
            Estimated completion: {formatDate(status.details.estimatedCompletion)}
          </p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
        <Timeline items={timeline.map(item => ({
          title: item.status,
          description: item.details?.stage || '',
          timestamp: formatDate(item.timestamp),
          icon: getStatusIcon(item.status)
        }))} />
      </Card>
    </div>
  );
};

// Helper functions
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'in_production': return 'default';
    case 'quality_check': return 'warning';
    case 'shipped': return 'success';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  // Return appropriate icon component based on status
  return null; // Implement with your icon set
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};
```

This component implements:
1. Real-time status updates via WebSocket
2. Timeline visualization of order progress
3. Detailed current status display
4. Estimated completion time