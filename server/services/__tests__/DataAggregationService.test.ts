import { DataAggregationServiceImpl } from '../DataAggregationService';
import { db } from '../../db';
import * as schema from '../../../shared/schema';

// Mock the database
jest.mock('../../db', () => ({
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
        metadata: {},
        organizationId: 'org123'
      };

      const mockCreated = {
        id: 'event123',
        timestamp: new Date(),
        ...mockEvent,
      };

      const mockReturning = jest.fn().mockResolvedValue([mockCreated]);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: mockReturning,
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
        metadata: {},
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

      const mockWhere = jest.fn().mockResolvedValue(mockEvents);
      const mockOrderBy = jest.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });

      (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const filters = {
        startTime: new Date('2025-01-01'),
        endTime: new Date('2025-12-31'),
        eventType: ['order_created'] as (
          | 'order_created'
          | 'order_updated'
          | 'quality_issue'
          | 'equipment_status'
          | 'material_usage'
          | 'return_created'
          | 'non_adapt_reported'
        )[],
        organizationId: 'org1'
      };

      const result = await dataAggregationService.getEvents(filters);
  expect(result).toEqual(mockEvents);
  expect(db.select).toHaveBeenCalled();
  expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('getAggregatedMetrics', () => {
    it('should return aggregated metrics for a given timeframe', async () => {
      const mockRows = [
        {
          time_period: '2025-01',
          event_count: '10',
          metrics: { total_orders: 10 },
          aggregated_data: [{ total_orders: 10 }]
        }
      ];

      (db.execute as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await dataAggregationService.getAggregatedMetrics('order_created', 'monthly');
      expect(result).toEqual([
        {
          timePeriod: '2025-01',
          count: 10,
          metrics: { total_orders: 10 },
          data: [{ total_orders: 10 }]
        }
      ]);
      expect(db.execute).toHaveBeenCalled();
    });
  });
});