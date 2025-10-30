import { db } from "../db";
import { orders } from "@shared/schema";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

export interface QualityInspection {
  id: string;
  orderId: string;
  inspectorId: string;
  inspectionDate: Date;
  status: "passed" | "failed" | "needs_review";
  defects: QualityDefect[];
  measurements: QualityMeasurement[];
  notes: string | null;
  images: string[];
}

export interface QualityDefect {
  type: string;
  severity: "minor" | "major" | "critical";
  description: string;
  location: string;
}

export interface QualityMeasurement {
  parameter: string;
  expected: number;
  actual: number;
  tolerance: number;
  passed: boolean;
}

export interface QCStats {
  totalInspections: number;
  passed: number;
  failed: number;
  needsReview: number;
  passRate: number;
  commonDefects: { type: string; count: number }[];
}

// Since we don't have a quality_inspections table yet, we'll use order metadata
// In a production system, you'd want a dedicated table

export async function getOrdersForQC(companyId: string): Promise<any[]> {
  const ordersForQC = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.companyId, companyId),
        eq(orders.status, "quality_check")
      )
    )
    .orderBy(orders.orderDate);

  return ordersForQC;
}

export async function getQCStats(companyId: string): Promise<QCStats> {
  // For now, return simulated stats based on order status
  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.companyId, companyId));

  const qcOrders = allOrders.filter(o => 
    o.status === "quality_check" || o.status === "completed"
  );

  const completed = allOrders.filter(o => o.status === "completed");
  const inQC = allOrders.filter(o => o.status === "quality_check");

  const stats: QCStats = {
    totalInspections: qcOrders.length,
    passed: completed.length,
    failed: 0, // Would need defect tracking
    needsReview: inQC.length,
    passRate: qcOrders.length > 0 ? (completed.length / qcOrders.length) * 100 : 0,
    commonDefects: [
      { type: "Scratches", count: 3 },
      { type: "Coating defect", count: 2 },
      { type: "Misalignment", count: 2 },
      { type: "Power variance", count: 1 },
    ],
  };

  return stats;
}

export async function performQCInspection(
  orderId: string,
  companyId: string,
  inspectorId: string,
  status: "passed" | "failed" | "needs_review",
  defects: QualityDefect[],
  measurements: QualityMeasurement[],
  notes?: string,
  images?: string[]
): Promise<any> {
  // Verify order belongs to company
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .limit(1);

  if (!order) {
    return null;
  }

  // Create inspection record (stored in order metadata for now)
  const inspection: QualityInspection = {
    id: crypto.randomUUID(),
    orderId,
    inspectorId,
    inspectionDate: new Date(),
    status,
    defects: defects || [],
    measurements: measurements || [],
    notes: notes || null,
    images: images || [],
  };

  // Determine next status based on inspection result
  let newStatus: string;
  if (status === "passed") {
    newStatus = "completed";
  } else if (status === "failed") {
    newStatus = "on_hold";
  } else {
    newStatus = "quality_check"; // needs_review stays in QC
  }

  // Update order status and add inspection to metadata
  const currentMetadata = (order as any).metadata || {};
  const inspections = currentMetadata.qcInspections || [];
  inspections.push(inspection);

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: newStatus as any,
      ...(status === "passed" && { completedAt: new Date() }),
    })
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .returning();

  return {
    order: updatedOrder,
    inspection,
  };
}

export async function getInspectionHistory(orderId: string, companyId: string): Promise<QualityInspection[]> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.companyId, companyId)))
    .limit(1);

  if (!order) {
    return [];
  }

  const metadata = (order as any).metadata || {};
  return metadata.qcInspections || [];
}

export interface QCMetrics {
  defectRate: number;
  avgInspectionTime: number;
  topDefectTypes: { type: string; count: number; percentage: number }[];
  inspectionsByInspector: { inspectorId: string; count: number; passRate: number }[];
}

export async function getQCMetrics(companyId: string): Promise<QCMetrics> {
  // Simulated metrics - in production, query from quality_inspections table
  return {
    defectRate: 2.3, // percentage
    avgInspectionTime: 15, // minutes
    topDefectTypes: [
      { type: "Surface scratches", count: 12, percentage: 35 },
      { type: "Coating defects", count: 8, percentage: 24 },
      { type: "Power variance", count: 7, percentage: 21 },
      { type: "Alignment issues", count: 4, percentage: 12 },
      { type: "Edge defects", count: 3, percentage: 8 },
    ],
    inspectionsByInspector: [
      { inspectorId: "inspector1", count: 145, passRate: 97.9 },
      { inspectorId: "inspector2", count: 132, passRate: 98.5 },
      { inspectorId: "inspector3", count: 98, passRate: 96.9 },
    ],
  };
}

export async function getDefectTrends(companyId: string, days: number = 30): Promise<{
  date: string;
  defects: number;
}[]> {
  // Simulated trend data
  const trends = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toISOString().split('T')[0],
      defects: Math.floor(Math.random() * 5), // Random between 0-5
    });
  }
  return trends;
}

// Standard measurement parameters for lenses
export const standardMeasurements = [
  { parameter: "Sphere Power OD", tolerance: 0.12 },
  { parameter: "Sphere Power OS", tolerance: 0.12 },
  { parameter: "Cylinder Power OD", tolerance: 0.12 },
  { parameter: "Cylinder Power OS", tolerance: 0.12 },
  { parameter: "Axis OD", tolerance: 2 },
  { parameter: "Axis OS", tolerance: 2 },
  { parameter: "PD", tolerance: 1 },
  { parameter: "Thickness Center", tolerance: 0.3 },
];

// Standard defect types
export const defectTypes = [
  "Surface scratches",
  "Coating defects",
  "Power variance",
  "Alignment issues",
  "Edge defects",
  "Bubbles/Inclusions",
  "Decentration",
  "Thickness variance",
  "Cosmetic defects",
  "Other",
];
