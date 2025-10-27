import { DataAggregationServiceImpl } from '../services/DataAggregationService';
import { db } from '../db';
import * as schema from '../../shared/schema';

// Mock the database
jest.mock('../db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    execute: jest.fn(),
  },
}));

describe('DataAggregationService', () => {
  let dataAggregationService: DataAggregationServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    dataAggregationService = new DataAggregationServiceImpl();
  });

  describe('recordEvent', () => {
    it('should successfully record an analytics event', async () => {
      const mockEvent = {
        eventType: 'order_created' as const,
        sourceId: 'order123',
        sourceType: 'order',
        data: { orderId: 'order123', status: 'pending' },
        organizationId: 'org123'
      };

      const mockCreated = {
        id: 'event123',
        timestamp: new Date(),
        ...mockEvent,
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockCreated]),
      });

      const result = await dataAggregationService.recordEvent(mockEvent);
      expect(result).toEqual(mockCreated);
      expect(db.insert).toHaveBeenCalledWith(schema.analyticsEvents);
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        eventType: 'order_created' as const,
        sourceId: 'order123',
        sourceType: 'order',
        data: { orderId: 'order123', status: 'pending' },
        organizationId: 'org123'
      };

      const error = new Error('Database error');
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(error),
      });

      await expect(dataAggregationService.recordEvent(mockEvent))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('getEvents', () => {
    it('should fetch events with filters', async () => {
      const mockEvents = [
        {
          id: 'event1',
          eventType: 'order_created',
          timestamp: new Date(),
          sourceId: 'order1',
          sourceType: 'order',
          data: { orderId: 'order1' },
          organizationId: 'org1'
        }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockEvents),
      });

      const filters = {
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-12-31'),
        eventType: ['order_created'],
        organizationId: 'org1'
      };

      const result = await dataAggregationService.getEvents(filters);
      expect(result).toEqual(mockEvents);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('getAggregatedMetrics', () => {
    it('should return aggregated metrics for a given timeframe', async () => {
      const mockMetrics = [
        {
          time_period: '2025-01',
          count: 10,
          event_type: 'order_created',
          aggregated_data: [{ total_orders: 10 }]
        }
      ];

      (db.execute as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await dataAggregationService.getAggregatedMetrics('order_created', 'monthly');
      expect(result).toEqual(mockMetrics);
      expect(db.execute).toHaveBeenCalled();
    });
  });
});