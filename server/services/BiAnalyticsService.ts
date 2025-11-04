/**
 * Business Intelligence Analytics Service
 * 
 * Comprehensive BI calculations and aggregations:
 * - Practice Pulse KPIs
 * - Financial & Sales Performance
 * - Operational & Staff Efficiency
 * - Patient & Clinical Insights
 */

import { eq, and, between, sql, gte, lte, desc, asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  dailyPracticeMetrics,
  patientLifetimeValue,
  revenueBreakdown,
  staffPerformanceMetrics,
  paymentMethodAnalytics,
  inventoryPerformanceMetrics,
  insuranceClaimMetrics,
  patientAcquisition,
  patientRetentionMetrics,
  recallEffectiveness,
  clinicalExamAnalytics,
  platformPracticeComparison,
  kpiAlerts,
} from "../../shared/bi-schema";
import {
  posTransactions,
  posTransactionItems,
  patients,
  testRoomBookings,
  testRooms,
  products,
  inventoryMovements,
  users,
  prescriptions,
} from "../../shared/schema";

type Database = NodePgDatabase<any>;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PracticePulseDashboard {
  netRevenue: number;
  netRevenueTrend: number; // % change vs previous period
  patientsSeen: number;
  patientsSeenTrend: number;
  averageRevenuePerPatient: number;
  arppTrend: number;
  noShowRate: number;
  noShowRateTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
  newVsReturningPatients: {
    new: number;
    returning: number;
  };
  revenueBySource: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  dailyAppointments: Array<{
    date: string;
    scheduled: number;
    completed: number;
    noShow: number;
    cancelled: number;
  }>;
}

export interface FinancialDashboard {
  grossSales: number;
  netSales: number;
  discounts: number;
  refunds: number;
  taxes: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossProfitMargin: number;
  salesByCategory: Array<{
    category: string;
    revenue: number;
    cogs: number;
    margin: number;
  }>;
  topItems: Array<{
    name: string;
    sales: number;
    revenue: number;
    margin: number;
  }>;
  bottomItems: Array<{
    name: string;
    sales: number;
    revenue: number;
    issue: string;
  }>;
  staffPerformance: Array<{
    staffId: string;
    staffName: string;
    totalSales: number;
    transactions: number;
    averageTransaction: number;
    upsellRate: number;
  }>;
  paymentMethods: Array<{
    method: string;
    transactions: number;
    revenue: number;
    percentage: number;
  }>;
}

export interface OperationalDashboard {
  inventoryTurnoverRate: number;
  inventoryValue: number;
  topBrands: Array<{
    brand: string;
    sales: number;
    revenue: number;
    units: number;
  }>;
  claimMetrics: {
    totalClaims: number;
    approvalRate: number;
    rejectionRate: number;
    averageProcessingDays: number;
    totalValue: number;
    approvedValue: number;
  };
  staffProductivity: Array<{
    staffId: string;
    staffName: string;
    revenuePerHour: number;
    transactionsPerHour: number;
    hoursWorked: number;
  }>;
  upsellMetrics: {
    upsellRate: number;
    averageUpsellValue: number;
    topUpsells: string[];
  };
}

export interface PatientDashboard {
  retentionRate: number;
  retentionTrend: number;
  newPatientAcquisition: Array<{
    month: string;
    count: number;
  }>;
  patientAcquisitionCost: number;
  averageLifetimeValue: number;
  referralSources: Array<{
    source: string;
    patients: number;
    conversionRate: number;
  }>;
  recallEffectiveness: {
    sent: number;
    opened: number;
    booked: number;
    completed: number;
    bookingRate: number;
    revenueGenerated: number;
  };
  clinicalMix: {
    routine: number;
    routineRevenue: number;
    medical: number;
    medicalRevenue: number;
    ratio: number;
  };
}

export class BiAnalyticsService {
  constructor(private db: Database) {}

  /**
   * Calculate or retrieve Practice Pulse dashboard metrics
   */
  async getPracticePulseDashboard(
    companyId: string,
    dateRange: DateRange
  ): Promise<PracticePulseDashboard> {
    const [currentMetrics, previousMetrics, revenueBreakdownData, appointmentData] = await Promise.all([
      this.getOrCalculateDailyMetrics(companyId, dateRange),
      this.getPreviousPeriodMetrics(companyId, dateRange),
      this.getRevenueBreakdown(companyId, dateRange),
      this.getAppointmentMetrics(companyId, dateRange),
    ]);

    // Calculate aggregated metrics
    const netRevenue = currentMetrics.reduce((sum: number, m: any) => sum + Number(m.netRevenue), 0);
    const prevNetRevenue = previousMetrics.reduce((sum: number, m: any) => sum + Number(m.netRevenue), 0);
    const netRevenueTrend = prevNetRevenue > 0 ? ((netRevenue - prevNetRevenue) / prevNetRevenue) * 100 : 0;

    const patientsSeen = currentMetrics.reduce((sum: number, m: any) => sum + m.totalPatientsSeen, 0);
    const prevPatientsSeen = previousMetrics.reduce((sum: number, m: any) => sum + m.totalPatientsSeen, 0);
    const patientsSeenTrend = prevPatientsSeen > 0 ? ((patientsSeen - prevPatientsSeen) / prevPatientsSeen) * 100 : 0;

    const averageRevenuePerPatient = patientsSeen > 0 ? netRevenue / patientsSeen : 0;
    const prevARPP = prevPatientsSeen > 0 ? prevNetRevenue / prevPatientsSeen : 0;
    const arppTrend = prevARPP > 0 ? ((averageRevenuePerPatient - prevARPP) / prevARPP) * 100 : 0;

    const totalAppointments = currentMetrics.reduce((sum: number, m: any) => sum + m.totalAppointments, 0);
    const noShowAppointments = currentMetrics.reduce((sum: number, m: any) => sum + m.noShowAppointments, 0);
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) : 0;

    const prevTotalAppts = previousMetrics.reduce((sum: number, m: any) => sum + m.totalAppointments, 0);
    const prevNoShowAppts = previousMetrics.reduce((sum: number, m: any) => sum + m.noShowAppointments, 0);
    const prevNoShowRate = prevTotalAppts > 0 ? (prevNoShowAppts / prevTotalAppts) : 0;
    const noShowRateTrend = prevNoShowRate > 0 ? ((noShowRate - prevNoShowRate) / prevNoShowRate) * 100 : 0;

    const eyewearSales = currentMetrics.reduce((sum: number, m: any) => sum + m.eyewearSalesCount, 0);
    const completedAppts = currentMetrics.reduce((sum: number, m: any) => sum + m.completedAppointments, 0);
    const conversionRate = completedAppts > 0 ? (eyewearSales / completedAppts) : 0;

    const prevEyewearSales = previousMetrics.reduce((sum: number, m: any) => sum + m.eyewearSalesCount, 0);
    const prevCompletedAppts = previousMetrics.reduce((sum: number, m: any) => sum + m.completedAppointments, 0);
    const prevConversionRate = prevCompletedAppts > 0 ? (prevEyewearSales / prevCompletedAppts) : 0;
    const conversionRateTrend = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

    const newPatients = currentMetrics.reduce((sum: number, m: any) => sum + m.newPatients, 0);
    const returningPatients = currentMetrics.reduce((sum: number, m: any) => sum + m.returningPatients, 0);

    return {
      netRevenue,
      netRevenueTrend,
      patientsSeen,
      patientsSeenTrend,
      averageRevenuePerPatient,
      arppTrend,
      noShowRate,
      noShowRateTrend,
      conversionRate,
      conversionRateTrend,
      newVsReturningPatients: {
        new: newPatients,
        returning: returningPatients,
      },
      revenueBySource: this.aggregateRevenueBySource(revenueBreakdownData),
      dailyAppointments: appointmentData,
    };
  }

  /**
   * Calculate or retrieve Financial & Sales Performance dashboard
   */
  async getFinancialDashboard(
    companyId: string,
    dateRange: DateRange
  ): Promise<FinancialDashboard> {
    const [transactions, revenueBreakdownData, staffPerf, paymentAnalytics] = await Promise.all([
      this.getTransactionData(companyId, dateRange),
      this.getRevenueBreakdown(companyId, dateRange),
      this.getStaffPerformance(companyId, dateRange),
      this.getPaymentMethodAnalytics(companyId, dateRange),
    ]);

    const grossSales = transactions.reduce((sum, t) => sum + Number(t.subtotal) + Number(t.taxAmount), 0);
    const discounts = transactions.reduce((sum, t) => sum + Number(t.discountAmount), 0);
    const refunds = transactions.filter(t => t.paymentStatus === 'refunded')
      .reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const taxes = transactions.reduce((sum, t) => sum + Number(t.taxAmount), 0);
    const netSales = grossSales - discounts - refunds;

    const costOfGoodsSold = revenueBreakdownData.reduce((sum, r) => 
      sum + Number(r.framesCogs) + Number(r.lensesCogs) + Number(r.coatingsCogs) + Number(r.contactLensesCogs), 0
    );

    const grossProfit = netSales - costOfGoodsSold;
    const grossProfitMargin = netSales > 0 ? (grossProfit / netSales) : 0;

    return {
      grossSales,
      netSales,
      discounts,
      refunds,
      taxes,
      costOfGoodsSold,
      grossProfit,
      grossProfitMargin,
      salesByCategory: await this.getSalesByCategory(companyId, dateRange),
      topItems: await this.getTopItems(companyId, dateRange, 10),
      bottomItems: await this.getBottomItems(companyId, dateRange, 10),
      staffPerformance: staffPerf.map(s => ({
        staffId: s.staffId,
        staffName: '', // Will be joined with user data
        totalSales: Number(s.totalSales),
        transactions: s.totalTransactions,
        averageTransaction: Number(s.averageTransactionValue),
        upsellRate: Number(s.upsellRate),
      })),
      paymentMethods: this.aggregatePaymentMethods(paymentAnalytics, netSales),
    };
  }

  /**
   * Calculate or retrieve Operational & Staff Efficiency dashboard
   */
  async getOperationalDashboard(
    companyId: string,
    dateRange: DateRange
  ): Promise<OperationalDashboard> {
    const [inventoryMetrics, claimMetrics, staffPerf] = await Promise.all([
      this.getInventoryPerformance(companyId, dateRange),
      this.getInsuranceClaimMetrics(companyId, dateRange),
      this.getStaffPerformance(companyId, dateRange),
    ]);

    const latestInventory = inventoryMetrics[0];
    const latestClaims = claimMetrics[0];

    return {
      inventoryTurnoverRate: latestInventory ? Number(latestInventory.inventoryTurnoverRate) : 0,
      inventoryValue: latestInventory ? Number(latestInventory.averageInventoryValue) : 0,
      topBrands: latestInventory?.topBrands as any[] || [],
      claimMetrics: {
        totalClaims: latestClaims?.totalClaims || 0,
        approvalRate: latestClaims ? 
          (latestClaims.approvedClaims / (latestClaims.totalClaims || 1)) : 0,
        rejectionRate: latestClaims ? Number(latestClaims.rejectionRate) : 0,
        averageProcessingDays: latestClaims ? Number(latestClaims.averageProcessingTimeDays) : 0,
        totalValue: latestClaims ? Number(latestClaims.totalClaimValue) : 0,
        approvedValue: latestClaims ? Number(latestClaims.approvedClaimValue) : 0,
      },
      staffProductivity: staffPerf.map(s => ({
        staffId: s.staffId,
        staffName: '', // Join with user data
        revenuePerHour: Number(s.revenuePerHour) || 0,
        transactionsPerHour: Number(s.transactionsPerHour) || 0,
        hoursWorked: Number(s.hoursWorked) || 0,
      })),
      upsellMetrics: {
        upsellRate: staffPerf.length > 0 ?
          staffPerf.reduce((sum, s) => sum + Number(s.upsellRate), 0) / staffPerf.length : 0,
        averageUpsellValue: staffPerf.length > 0 ?
          staffPerf.reduce((sum, s) => sum + Number(s.upsellRevenue), 0) / 
          staffPerf.reduce((sum, s) => sum + s.upsellCount, 0) : 0,
        topUpsells: [], // Calculate from transaction items
      },
    };
  }

  /**
   * Calculate or retrieve Patient & Clinical Insights dashboard
   */
  async getPatientDashboard(
    companyId: string,
    dateRange: DateRange
  ): Promise<PatientDashboard> {
    const [retentionData, acquisitionData, recallData, clinicalData] = await Promise.all([
      this.getPatientRetentionMetrics(companyId, dateRange),
      this.getPatientAcquisitionData(companyId, dateRange),
      this.getRecallEffectiveness(companyId, dateRange),
      this.getClinicalExamAnalytics(companyId, dateRange),
    ]);

    const latestRetention = retentionData[0];
    const latestRecall = recallData[0];
    const latestClinical = clinicalData[0];

    // Calculate average PAC and LTV
    const totalAcquisitionCost = acquisitionData.reduce((sum, a) => 
      sum + Number(a.totalMarketingSpend || 0), 0
    );
    const totalNewPatients = acquisitionData.reduce((sum, a) => sum + a.newPatients, 0);
    const pac = totalNewPatients > 0 ? totalAcquisitionCost / totalNewPatients : 0;

    const avgLTV = await this.getAverageLifetimeValue(companyId);

    return {
      retentionRate: latestRetention ? Number(latestRetention.retentionRate) : 0,
      retentionTrend: 0, // Calculate by comparing cohorts
      newPatientAcquisition: acquisitionData.map(a => ({
        month: a.periodStart.toISOString().substring(0, 7),
        count: a.newPatients,
      })),
      patientAcquisitionCost: pac,
      averageLifetimeValue: avgLTV,
      referralSources: acquisitionData.map(a => ({
        source: a.referralSource,
        patients: a.newPatients,
        conversionRate: Number(a.firstVisitConversionRate) || 0,
      })),
      recallEffectiveness: {
        sent: latestRecall?.recallsSent || 0,
        opened: latestRecall?.recallsOpened || 0,
        booked: latestRecall?.appointmentsBooked || 0,
        completed: latestRecall?.appointmentsCompleted || 0,
        bookingRate: latestRecall ? Number(latestRecall.bookingRate) : 0,
        revenueGenerated: latestRecall ? Number(latestRecall.recallGeneratedRevenue) : 0,
      },
      clinicalMix: {
        routine: latestClinical?.routineExams || 0,
        routineRevenue: latestClinical ? Number(latestClinical.routineExamsRevenue) : 0,
        medical: latestClinical?.medicalExams || 0,
        medicalRevenue: latestClinical ? Number(latestClinical.medicalExamsRevenue) : 0,
        ratio: latestClinical ? Number(latestClinical.medicalToRoutineRatio) : 0,
      },
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private async getOrCalculateDailyMetrics(companyId: string, dateRange: DateRange) {
    const existing = await this.db
      .select()
      .from(dailyPracticeMetrics)
      .where(
        and(
          eq(dailyPracticeMetrics.companyId, companyId),
          between(dailyPracticeMetrics.metricDate, dateRange.start, dateRange.end)
        )
      )
      .orderBy(asc(dailyPracticeMetrics.metricDate));

    // If data exists and is recent, return it
    if (existing.length > 0) {
      return existing;
    }

    // Otherwise calculate and store
    return await this.calculateAndStoreDailyMetrics(companyId, dateRange);
  }

  private async calculateAndStoreDailyMetrics(companyId: string, dateRange: DateRange) {
    // This would be called by a scheduled job daily
    // For now, calculate on-demand
    const metrics = [];
    const currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMetrics = await this.calculateSingleDayMetrics(companyId, dayStart, dayEnd);
      metrics.push(dayMetrics);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Store in database
    if (metrics.length > 0) {
      await this.db.insert(dailyPracticeMetrics).values(metrics).onConflictDoNothing();
    }

    return metrics;
  }

  private async calculateSingleDayMetrics(companyId: string, dayStart: Date, dayEnd: Date) {
    const [transactionData, appointmentData] = await Promise.all([
      this.db
        .select({
          grossRevenue: sql<string>`sum(${posTransactions.subtotal} + ${posTransactions.taxAmount})`,
          netRevenue: sql<string>`sum(${posTransactions.totalAmount})`,
          discounts: sql<string>`sum(${posTransactions.discountAmount})`,
          refunds: sql<string>`sum(case when ${posTransactions.paymentStatus} = 'refunded' then ${posTransactions.totalAmount} else 0 end)`,
          transactionCount: sql<number>`count(*)`,
        })
        .from(posTransactions)
        .where(
          and(
            eq(posTransactions.companyId, companyId),
            between(posTransactions.transactionDate, dayStart, dayEnd)
          )
        ),
      this.db
        .select({
          totalAppointments: sql<number>`count(*)`,
          completedAppointments: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'completed')`,
          cancelledAppointments: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'cancelled')`,
          noShowAppointments: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'no_show')`,
        })
        .from(testRoomBookings)
        .innerJoin(testRooms, eq(testRoomBookings.testRoomId, testRooms.id))
        .where(
          and(
            eq(testRooms.companyId, companyId),
            between(testRoomBookings.bookingDate, dayStart, dayEnd)
          )
        ),
    ]);

    const txData = transactionData[0];
    const apptData = appointmentData[0];

    return {
      companyId,
      metricDate: dayStart,
      grossRevenue: txData?.grossRevenue || '0',
      netRevenue: txData?.netRevenue || '0',
      discountsGiven: txData?.discounts || '0',
      refundsIssued: txData?.refunds || '0',
      totalPatientsSeen: apptData?.completedAppointments || 0,
      newPatients: 0, // Calculate from patient records
      returningPatients: 0,
      totalAppointments: apptData?.totalAppointments || 0,
      completedAppointments: apptData?.completedAppointments || 0,
      cancelledAppointments: apptData?.cancelledAppointments || 0,
      noShowAppointments: apptData?.noShowAppointments || 0,
      totalTransactions: txData?.transactionCount || 0,
      eyewearSalesCount: 0, // Calculate from transaction items
      eyewearSalesRevenue: '0',
      examRevenue: '0',
      averageRevenuePerPatient: '0',
      noShowRate: '0',
      conversionRate: '0',
    };
  }

  private async getPreviousPeriodMetrics(companyId: string, dateRange: DateRange) {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(dateRange.start);
    previousStart.setDate(previousStart.getDate() - daysDiff);
    const previousEnd = new Date(dateRange.start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    return await this.getOrCalculateDailyMetrics(companyId, {
      start: previousStart,
      end: previousEnd,
    });
  }

  private async getRevenueBreakdown(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(revenueBreakdown)
      .where(
        and(
          eq(revenueBreakdown.companyId, companyId),
          gte(revenueBreakdown.periodStart, dateRange.start),
          lte(revenueBreakdown.periodEnd, dateRange.end)
        )
      );
  }

  private async getAppointmentMetrics(companyId: string, dateRange: DateRange) {
    const appointments = await this.db
      .select({
        date: sql<string>`date(${testRoomBookings.bookingDate})`,
        scheduled: sql<number>`count(*)`,
        completed: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'completed')`,
        noShow: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'no_show')`,
        cancelled: sql<number>`count(*) filter (where ${testRoomBookings.status} = 'cancelled')`,
      })
      .from(testRoomBookings)
      .innerJoin(testRooms, eq(testRoomBookings.testRoomId, testRooms.id))
      .where(
        and(
          eq(testRooms.companyId, companyId),
          between(testRoomBookings.bookingDate, dateRange.start, dateRange.end)
        )
      )
      .groupBy(sql`date(${testRoomBookings.bookingDate})`);

    return appointments;
  }

  private aggregateRevenueBySource(breakdownData: any[]) {
    if (breakdownData.length === 0) return [];

    const totalRevenue = breakdownData.reduce((sum, b) => 
      sum + Number(b.framesRevenue) + Number(b.lensesRevenue) + Number(b.coatingsRevenue) + 
      Number(b.contactLensesRevenue) + Number(b.examsRevenue) + Number(b.servicesRevenue), 0
    );

    const sources = [
      { source: 'Frames', amount: breakdownData.reduce((sum, b) => sum + Number(b.framesRevenue), 0) },
      { source: 'Lenses', amount: breakdownData.reduce((sum, b) => sum + Number(b.lensesRevenue), 0) },
      { source: 'Coatings', amount: breakdownData.reduce((sum, b) => sum + Number(b.coatingsRevenue), 0) },
      { source: 'Contact Lenses', amount: breakdownData.reduce((sum, b) => sum + Number(b.contactLensesRevenue), 0) },
      { source: 'Exams', amount: breakdownData.reduce((sum, b) => sum + Number(b.examsRevenue), 0) },
      { source: 'Services', amount: breakdownData.reduce((sum, b) => sum + Number(b.servicesRevenue), 0) },
    ];

    return sources.map(s => ({
      ...s,
      percentage: totalRevenue > 0 ? (s.amount / totalRevenue) * 100 : 0,
    })).filter(s => s.amount > 0);
  }

  private async getTransactionData(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.companyId, companyId),
          between(posTransactions.transactionDate, dateRange.start, dateRange.end)
        )
      );
  }

  private async getStaffPerformance(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(staffPerformanceMetrics)
      .where(
        and(
          eq(staffPerformanceMetrics.companyId, companyId),
          gte(staffPerformanceMetrics.periodStart, dateRange.start),
          lte(staffPerformanceMetrics.periodEnd, dateRange.end)
        )
      );
  }

  private async getPaymentMethodAnalytics(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(paymentMethodAnalytics)
      .where(
        and(
          eq(paymentMethodAnalytics.companyId, companyId),
          gte(paymentMethodAnalytics.periodStart, dateRange.start),
          lte(paymentMethodAnalytics.periodEnd, dateRange.end)
        )
      );
  }

  private aggregatePaymentMethods(analytics: any[], totalRevenue: number) {
    if (analytics.length === 0) return [];

    const aggregated = {
      cash: { transactions: 0, revenue: 0 },
      card: { transactions: 0, revenue: 0 },
      insurance: { transactions: 0, revenue: 0 },
    };

    analytics.forEach(a => {
      aggregated.cash.transactions += a.cashTransactions;
      aggregated.cash.revenue += Number(a.cashRevenue);
      aggregated.card.transactions += a.cardTransactions;
      aggregated.card.revenue += Number(a.cardRevenue);
      aggregated.insurance.transactions += a.insuranceTransactions;
      aggregated.insurance.revenue += Number(a.insuranceRevenue);
    });

    return Object.entries(aggregated).map(([method, data]) => ({
      method,
      transactions: data.transactions,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));
  }

  private async getSalesByCategory(companyId: string, dateRange: DateRange) {
    // Implementation would query transaction items and categorize
    return [];
  }

  private async getTopItems(companyId: string, dateRange: DateRange, limit: number) {
    // Implementation would aggregate transaction items
    return [];
  }

  private async getBottomItems(companyId: string, dateRange: DateRange, limit: number) {
    // Implementation would find slow-moving inventory
    return [];
  }

  private async getInventoryPerformance(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(inventoryPerformanceMetrics)
      .where(
        and(
          eq(inventoryPerformanceMetrics.companyId, companyId),
          gte(inventoryPerformanceMetrics.periodStart, dateRange.start),
          lte(inventoryPerformanceMetrics.periodEnd, dateRange.end)
        )
      )
      .orderBy(desc(inventoryPerformanceMetrics.periodStart))
      .limit(1);
  }

  private async getInsuranceClaimMetrics(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(insuranceClaimMetrics)
      .where(
        and(
          eq(insuranceClaimMetrics.companyId, companyId),
          gte(insuranceClaimMetrics.periodStart, dateRange.start),
          lte(insuranceClaimMetrics.periodEnd, dateRange.end)
        )
      )
      .orderBy(desc(insuranceClaimMetrics.periodStart))
      .limit(1);
  }

  private async getPatientRetentionMetrics(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(patientRetentionMetrics)
      .where(
        and(
          eq(patientRetentionMetrics.companyId, companyId),
          gte(patientRetentionMetrics.measurementMonth, dateRange.start),
          lte(patientRetentionMetrics.measurementMonth, dateRange.end)
        )
      )
      .orderBy(desc(patientRetentionMetrics.measurementMonth))
      .limit(1);
  }

  private async getPatientAcquisitionData(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(patientAcquisition)
      .where(
        and(
          eq(patientAcquisition.companyId, companyId),
          gte(patientAcquisition.periodStart, dateRange.start),
          lte(patientAcquisition.periodEnd, dateRange.end)
        )
      );
  }

  private async getRecallEffectiveness(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(recallEffectiveness)
      .where(
        and(
          eq(recallEffectiveness.companyId, companyId),
          gte(recallEffectiveness.periodStart, dateRange.start),
          lte(recallEffectiveness.periodEnd, dateRange.end)
        )
      )
      .orderBy(desc(recallEffectiveness.periodStart))
      .limit(1);
  }

  private async getClinicalExamAnalytics(companyId: string, dateRange: DateRange) {
    return await this.db
      .select()
      .from(clinicalExamAnalytics)
      .where(
        and(
          eq(clinicalExamAnalytics.companyId, companyId),
          gte(clinicalExamAnalytics.periodStart, dateRange.start),
          lte(clinicalExamAnalytics.periodEnd, dateRange.end)
        )
      )
      .orderBy(desc(clinicalExamAnalytics.periodStart))
      .limit(1);
  }

  private async getAverageLifetimeValue(companyId: string): Promise<number> {
    const result = await this.db
      .select({
        avgLTV: sql<string>`avg(${patientLifetimeValue.lifetimeValue})`,
      })
      .from(patientLifetimeValue)
      .where(
        and(
          eq(patientLifetimeValue.companyId, companyId),
          eq(patientLifetimeValue.isActive, true)
        )
      );

    return result[0]?.avgLTV ? Number(result[0].avgLTV) : 0;
  }

  /**
   * Get platform-wide metrics for platform admin
   */
  async getPlatformComparison(dateRange: DateRange) {
    return await this.db
      .select()
      .from(platformPracticeComparison)
      .where(
        and(
          gte(platformPracticeComparison.periodStart, dateRange.start),
          lte(platformPracticeComparison.periodEnd, dateRange.end)
        )
      )
      .orderBy(desc(platformPracticeComparison.totalRevenue));
  }

  /**
   * Get active KPI alerts for a practice
   */
  async getActiveAlerts(companyId: string) {
    return await this.db
      .select()
      .from(kpiAlerts)
      .where(
        and(
          eq(kpiAlerts.companyId, companyId),
          eq(kpiAlerts.isResolved, false)
        )
      )
      .orderBy(desc(kpiAlerts.severity), desc(kpiAlerts.triggeredAt));
  }
}
