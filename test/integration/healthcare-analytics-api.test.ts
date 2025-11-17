/**
 * Healthcare Analytics API Tests
 * 
 * Comprehensive testing for healthcare analytics functionality including:
 * - Clinical outcome tracking and analysis
 * - Population health metrics and insights
 * - Quality reporting and compliance monitoring
 * - Predictive analytics and trend analysis
 * - Performance dashboards and KPI tracking
 * - Financial analytics and revenue insights
 * - Operational efficiency metrics
 * - Validation and error handling
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';

describe('Healthcare Analytics API', () => {
  let app: Application;
  let testCompanyId: string = 'test-company-id';
  let testUserId: string = 'test-user-id';
  let testProviderId: string = 'test-provider-id';

  beforeAll(async () => {
    // Create test Express app
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use('/api/healthcare-analytics', (req, res, next) => {
      req.user = {
        id: testUserId || 'test-user-id',
        companyId: testCompanyId || 'test-company-id',
        email: 'admin@example.com',
        role: 'admin'
      };
      next();
    });

    // Import and use healthcare analytics routes
    const healthcareAnalyticsRoutes = await import('../../server/routes/healthcare-analytics');
    app.use('/api/healthcare-analytics', healthcareAnalyticsRoutes.default);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Clinical Outcomes Analytics', () => {
    it('should get clinical outcome metrics successfully', async () => {
      const metricsData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        providerId: testProviderId || 'test-provider-id'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.summary).toBeDefined();
      expect(response.body.metrics.treatmentOutcomes).toBeDefined();
      expect(response.body.metrics.healthImprovements).toBeDefined();
      expect(response.body.metrics.medicationAdherence).toBeDefined();
      expect(response.body.metrics.readmissionRates).toBeDefined();
      expect(response.body.metrics.timeSeries).toBeDefined();
    });

    it('should filter clinical outcomes by provider', async () => {
      const metricsData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        providerId: 'specific-provider-id',
        patientDemographics: {
          ageRange: { min: 18, max: 65 },
          gender: 'female'
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });

    it('should validate clinical outcomes request data', async () => {
      const invalidData = {
        dateRange: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        },
        providerId: 123 // Invalid type
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Population Health Analytics', () => {
    it('should get population health metrics successfully', async () => {
      const metricsData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        metrics: [
          { type: 'chronic_disease' },
          { type: 'preventive_care' },
          { type: 'readmission' },
          { type: 'medication_adherence' },
          { type: 'vaccination_rate' }
        ]
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/population-health')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.benchmarks).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    it('should handle specific population health metric types', async () => {
      const metricTypes = ['chronic_disease', 'preventive_care', 'readmission', 'medication_adherence', 'vaccination_rate'];
      
      for (const metricType of metricTypes) {
        const metricsData = {
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          metrics: [{ type: metricType, parameters: { detailed: true } }]
        };

        const response = await request(app)
          .post('/api/healthcare-analytics/population-health')
          .send(metricsData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.metrics).toBeDefined();
      }
    });

    it('should validate population health request data', async () => {
      const invalidData = {
        dateRange: {
          dateFrom: new Date().toISOString(),
          dateTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Invalid date range
        },
        metrics: [
          { type: 'invalid_metric_type' }
        ]
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/population-health')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Quality Reporting Analytics', () => {
    it('should get quality reporting metrics successfully', async () => {
      const metricsData = {
        reportingPeriod: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        qualityMeasures: [
          { measureId: 'qm1', measureType: 'clinical_process' },
          { measureId: 'qm2', measureType: 'outcome' },
          { measureId: 'qm3', measureType: 'patient_experience' },
          { measureId: 'qm4', measureType: 'efficiency' }
        ]
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/quality-reporting')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.complianceStatus).toBeDefined();
      expect(response.body.trends).toBeDefined();
      expect(response.body.recommendations).toBeDefined();
    });

    it('should handle different quality measure types', async () => {
      const measureTypes = ['clinical_process', 'outcome', 'patient_experience', 'efficiency'];
      
      for (const measureType of measureTypes) {
        const metricsData = {
          reportingPeriod: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          qualityMeasures: [
            { measureId: `qm_${measureType}`, measureType }
          ]
        };

        const response = await request(app)
          .post('/api/healthcare-analytics/quality-reporting')
          .send(metricsData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.metrics).toBeDefined();
      }
    });

    it('should validate quality reporting request data', async () => {
      const invalidData = {
        reportingPeriod: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        },
        qualityMeasures: [
          { measureId: '', measureType: 'invalid_type' }
        ]
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/quality-reporting')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Predictive Analytics', () => {
    it('should get predictive analytics successfully', async () => {
      const modelTypes = ['no_show_prediction', 'readmission_risk', 'disease_progression', 'revenue_forecast'];
      
      for (const modelType of modelTypes) {
        const analyticsData = {
          modelType,
          predictionPeriod: {
            dateFrom: new Date().toISOString(),
            dateTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          features: ['age', 'gender', 'history']
        };

        const response = await request(app)
          .post('/api/healthcare-analytics/predictive-analytics')
          .send(analyticsData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.predictions).toBeDefined();
        expect(response.body.predictions.modelType).toBe(modelType);
        expect(response.body.predictions.confidence).toBeDefined();
        expect(response.body.predictions.modelAccuracy).toBeDefined();
        expect(response.body.predictions.recommendations).toBeDefined();
      }
    });

    it('should validate predictive analytics request data', async () => {
      const invalidData = {
        modelType: 'invalid_model_type',
        predictionPeriod: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        },
        features: 'not-an-array'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/predictive-analytics')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Financial Analytics', () => {
    it('should get financial analytics successfully', async () => {
      const analyticsData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/financial')
        .send(analyticsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.summary).toBeDefined();
      expect(response.body.analytics.revenue).toBeDefined();
      expect(response.body.analytics.costs).toBeDefined();
      expect(response.body.analytics.profitability).toBeDefined();
      expect(response.body.analytics.payerMix).toBeDefined();
      expect(response.body.analytics.revenueCycle).toBeDefined();
      expect(response.body.analytics.trends).toBeDefined();
      expect(response.body.analytics.forecasts).toBeDefined();
    });

    it('should validate financial analytics request data', async () => {
      const invalidData = {
        dateRange: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/financial')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Operational Efficiency Analytics', () => {
    it('should get operational efficiency metrics successfully', async () => {
      const metricsData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/operational-efficiency')
        .send(metricsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.summary).toBeDefined();
      expect(response.body.metrics.providerProductivity).toBeDefined();
      expect(response.body.metrics.resourceUtilization).toBeDefined();
      expect(response.body.metrics.waitTimeAnalysis).toBeDefined();
      expect(response.body.metrics.staffEfficiency).toBeDefined();
      expect(response.body.metrics.facilityUtilization).toBeDefined();
      expect(response.body.metrics.trends).toBeDefined();
      expect(response.body.metrics.recommendations).toBeDefined();
    });

    it('should validate operational efficiency request data', async () => {
      const invalidData = {
        dateRange: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/operational-efficiency')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Dashboard Analytics', () => {
    it('should get executive dashboard data successfully', async () => {
      const dashboardData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        dashboardType: 'executive'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(dashboardData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboardData).toBeDefined();
      expect(response.body.dashboardData.overview).toBeDefined();
      expect(response.body.dashboardData.kpis).toBeDefined();
      expect(response.body.dashboardData.alerts).toBeDefined();
    });

    it('should get clinical dashboard data successfully', async () => {
      const dashboardData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        dashboardType: 'clinical'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(dashboardData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboardData).toBeDefined();
      expect(response.body.dashboardData.clinicalOutcomes).toBeDefined();
      expect(response.body.dashboardData.qualityMetrics).toBeDefined();
      expect(response.body.dashboardData.patientSafety).toBeDefined();
    });

    it('should get financial dashboard data successfully', async () => {
      const dashboardData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        dashboardType: 'financial'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(dashboardData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboardData).toBeDefined();
      expect(response.body.dashboardData.financialAnalytics).toBeDefined();
      expect(response.body.dashboardData.revenueCycle).toBeDefined();
      expect(response.body.dashboardData.billingPerformance).toBeDefined();
    });

    it('should get operational dashboard data successfully', async () => {
      const dashboardData = {
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        dashboardType: 'operational'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(dashboardData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboardData).toBeDefined();
      expect(response.body.dashboardData.operationalEfficiency).toBeDefined();
      expect(response.body.dashboardData.resourceManagement).toBeDefined();
      expect(response.body.dashboardData.staffPerformance).toBeDefined();
    });

    it('should validate dashboard request data', async () => {
      const invalidData = {
        dateRange: {
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        },
        dashboardType: 'invalid_dashboard_type'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Quick Dashboard Endpoints', () => {
    it('should get executive overview with default date range', async () => {
      const response = await request(app)
        .get('/api/healthcare-analytics/executive-overview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.overview).toBeDefined();
      expect(response.body.overview.dashboardData).toBeDefined();
    });

    it('should get clinical dashboard with custom date range', async () => {
      const response = await request(app)
        .get('/api/healthcare-analytics/clinical-dashboard')
        .query({
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    it('should get financial dashboard with custom date range', async () => {
      const response = await request(app)
        .get('/api/healthcare-analytics/financial-dashboard')
        .query({
          dateFrom: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    it('should get operational dashboard with custom date range', async () => {
      const response = await request(app)
        .get('/api/healthcare-analytics/operational-dashboard')
        .query({
          dateFrom: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toBeDefined();
    });

    it('should handle invalid date ranges in quick endpoints', async () => {
      const response = await request(app)
        .get('/api/healthcare-analytics/executive-overview')
        .query({
          dateFrom: 'invalid-date',
          dateTo: 'invalid-date'
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Analytics Export', () => {
    it('should handle analytics export requests', async () => {
      const exportData = {
        reportType: 'clinical_outcomes',
        dateRange: {
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dateTo: new Date().toISOString()
        },
        format: 'csv'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/export')
        .send(exportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.reportType).toBe('clinical_outcomes');
      expect(response.body.format).toBe('csv');
    });

    it('should validate export request data', async () => {
      const invalidData = {
        reportType: '', // Empty string
        format: 'invalid_format'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/export')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const noAuthApp = express();
      noAuthApp.use(express.json());
      
      const healthcareAnalyticsRoutes = await import('../../server/routes/healthcare-analytics');
      noAuthApp.use('/api/healthcare-analytics', healthcareAnalyticsRoutes.default);

      const endpoints = [
        '/api/healthcare-analytics/clinical-outcomes',
        '/api/healthcare-analytics/population-health',
        '/api/healthcare-analytics/quality-reporting',
        '/api/healthcare-analytics/predictive-analytics',
        '/api/healthcare-analytics/financial',
        '/api/healthcare-analytics/operational-efficiency',
        '/api/healthcare-analytics/dashboard',
        '/api/healthcare-analytics/executive-overview',
        '/api/healthcare-analytics/export'
      ];

      for (const endpoint of endpoints) {
        const response = await request(noAuthApp)
          .post(endpoint)
          .send({
            dateRange: {
              dateFrom: new Date().toISOString(),
              dateTo: new Date().toISOString()
            }
          })
          .expect(401);
        expect(response.body.error).toBe('Authentication required');
      }
    });

    it('should require company access', async () => {
      // Create app without company context
      const noCompanyApp = express();
      noCompanyApp.use(express.json());
      
      noCompanyApp.use('/api/healthcare-analytics', (req, res, next) => {
        req.user = { id: 'test-user-id' }; // Missing companyId
        next();
      });
      
      const healthcareAnalyticsRoutes = await import('../../server/routes/healthcare-analytics');
      noCompanyApp.use('/api/healthcare-analytics', healthcareAnalyticsRoutes.default);

      const response = await request(noCompanyApp)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send({
          dateRange: {
            dateFrom: new Date().toISOString(),
            dateTo: new Date().toISOString()
          }
        })
        .expect(403);
      
      expect(response.body.error).toBe('Company context required');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed data that would cause server error
      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send({
          dateRange: {
            dateFrom: new Date().toISOString(),
            dateTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Invalid range
          }
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Data Validation', () => {
    it('should validate date range consistency', async () => {
      const invalidDateRangeData = {
        dateRange: {
          dateFrom: new Date().toISOString(),
          dateTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Past date
        }
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send(invalidDateRangeData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate enum values for metric types', async () => {
      const invalidMetricData = {
        dateRange: {
          dateFrom: new Date().toISOString(),
          dateTo: new Date().toISOString()
        },
        metrics: [
          { type: 'invalid_metric_type' }
        ]
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/population-health')
        .send(invalidMetricData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate enum values for dashboard types', async () => {
      const invalidDashboardData = {
        dateRange: {
          dateFrom: new Date().toISOString(),
          dateTo: new Date().toISOString()
        },
        dashboardType: 'invalid_dashboard_type'
      };

      const response = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send(invalidDashboardData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Workflow Integration', () => {
    it('should support comprehensive analytics workflow', async () => {
      // 1. Get clinical outcomes
      const clinicalResponse = await request(app)
        .post('/api/healthcare-analytics/clinical-outcomes')
        .send({
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          }
        })
        .expect(200);

      // 2. Get population health metrics
      const populationResponse = await request(app)
        .post('/api/healthcare-analytics/population-health')
        .send({
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          metrics: [{ type: 'chronic_disease' }]
        })
        .expect(200);

      // 3. Get quality reporting
      const qualityResponse = await request(app)
        .post('/api/healthcare-analytics/quality-reporting')
        .send({
          reportingPeriod: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          qualityMeasures: [{ measureId: 'qm1', measureType: 'clinical_process' }]
        })
        .expect(200);

      // 4. Get financial analytics
      const financialResponse = await request(app)
        .post('/api/healthcare-analytics/financial')
        .send({
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          }
        })
        .expect(200);

      // 5. Get operational efficiency
      const operationalResponse = await request(app)
        .post('/api/healthcare-analytics/operational-efficiency')
        .send({
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          }
        })
        .expect(200);

      // 6. Get executive dashboard
      const dashboardResponse = await request(app)
        .post('/api/healthcare-analytics/dashboard')
        .send({
          dateRange: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          dashboardType: 'executive'
        })
        .expect(200);

      expect(clinicalResponse.body.success).toBe(true);
      expect(populationResponse.body.success).toBe(true);
      expect(qualityResponse.body.success).toBe(true);
      expect(financialResponse.body.success).toBe(true);
      expect(operationalResponse.body.success).toBe(true);
      expect(dashboardResponse.body.success).toBe(true);
    });
  });
});
