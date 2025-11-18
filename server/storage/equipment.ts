import { db } from "../db";
import { equipment } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import type { Equipment } from "@shared/schema";

export interface EquipmentFilters {
  companyId: string;
  status?: string;
  testRoomId?: string;
  needsCalibration?: boolean;
  needsMaintenance?: boolean;
}

/**
 * Equipment technical specifications
 */
export interface EquipmentSpecifications {
  [key: string]: string | number | boolean | null;
}

/**
 * Equipment metadata for extensibility
 */
export interface EquipmentMetadata {
  [key: string]: string | number | boolean | null | EquipmentMetadata;
}

/**
 * Maintenance record for equipment history tracking
 */
export interface MaintenanceRecord {
  type: "routine" | "repair" | "upgrade" | "emergency";
  date: Date;
  description: string;
  performedBy: string;
  cost?: number;
  nextScheduledDate?: Date;
  parts?: string[];
  notes?: string;
}

export interface CreateEquipmentData {
  companyId: string;
  testRoomId?: string | null;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber: string;
  status?: "operational" | "maintenance" | "repair" | "offline";
  purchaseDate?: Date | null;
  lastCalibrationDate?: Date | null;
  nextCalibrationDate?: Date | null;
  calibrationFrequencyDays?: number;
  lastMaintenance?: Date | null;
  nextMaintenance?: Date | null;
  specifications?: EquipmentSpecifications;
  notes?: string | null;
  location?: string | null;
  warrantyExpiration?: Date | null;
  maintenanceHistory?: MaintenanceRecord[];
  metadata?: EquipmentMetadata;
}

export interface UpdateEquipmentData {
  testRoomId?: string | null;
  name?: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string;
  status?: "operational" | "maintenance" | "repair" | "offline";
  purchaseDate?: Date | null;
  lastCalibrationDate?: Date | null;
  nextCalibrationDate?: Date | null;
  calibrationFrequencyDays?: number;
  lastMaintenance?: Date | null;
  nextMaintenance?: Date | null;
  specifications?: EquipmentSpecifications;
  notes?: string | null;
  location?: string | null;
  warrantyExpiration?: Date | null;
  maintenanceHistory?: MaintenanceRecord[];
  metadata?: EquipmentMetadata;
}

export async function getAllEquipment(filters: EquipmentFilters): Promise<Equipment[]> {
  const conditions = [eq(equipment.companyId, filters.companyId)];

  if (filters.status) {
    conditions.push(eq(equipment.status, filters.status as any));
  }

  if (filters.testRoomId) {
    conditions.push(eq(equipment.testRoomId, filters.testRoomId));
  }

  let equipmentList = await db
    .select()
    .from(equipment)
    .where(and(...conditions))
    .orderBy(desc(equipment.createdAt));

  // Filter for calibration needs
  if (filters.needsCalibration) {
    const now = new Date();
    equipmentList = equipmentList.filter(
      (e) => e.nextCalibrationDate && new Date(e.nextCalibrationDate) <= now
    );
  }

  // Filter for maintenance needs
  if (filters.needsMaintenance) {
    const now = new Date();
    equipmentList = equipmentList.filter(
      (e) => e.nextMaintenance && new Date(e.nextMaintenance) <= now
    );
  }

  return equipmentList;
}

export async function getEquipmentById(id: string, companyId: string): Promise<Equipment | null> {
  const [result] = await db
    .select()
    .from(equipment)
    .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
    .limit(1);

  return result || null;
}

export async function createEquipment(data: CreateEquipmentData): Promise<Equipment> {
  const [result] = await db
    .insert(equipment)
    .values({
      ...data,
      maintenanceHistory: data.maintenanceHistory || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result;
}

export async function updateEquipment(
  id: string,
  companyId: string,
  data: UpdateEquipmentData
): Promise<Equipment | null> {
  const [result] = await db
    .update(equipment)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
    .returning();

  return result || null;
}

export async function deleteEquipment(id: string, companyId: string): Promise<boolean> {
  const result = await db
    .delete(equipment)
    .where(and(eq(equipment.id, id), eq(equipment.companyId, companyId)))
    .returning();

  return result.length > 0;
}

export async function addMaintenanceRecord(
  id: string,
  companyId: string,
  record: MaintenanceRecord
): Promise<Equipment | null> {
  const equipmentItem = await getEquipmentById(id, companyId);
  if (!equipmentItem) return null;

  const maintenanceHistory = Array.isArray(equipmentItem.maintenanceHistory)
    ? equipmentItem.maintenanceHistory
    : [];

  const updatedHistory = [...maintenanceHistory, record];

  const updateData: Partial<UpdateEquipmentData> = {
    maintenanceHistory: updatedHistory as MaintenanceRecord[],
    lastMaintenance: record.date,
  };

  // Update next maintenance if provided
  if (record.nextScheduledDate) {
    updateData.nextMaintenance = record.nextScheduledDate;
  }

  // If it was a repair, set status back to operational
  if (record.type === "repair") {
    updateData.status = "operational";
  }

  return updateEquipment(id, companyId, updateData);
}

export async function recordCalibration(
  id: string,
  companyId: string,
  calibrationDate: Date,
  nextCalibrationDate: Date,
  performedBy: string,
  notes?: string
): Promise<Equipment | null> {
  const equipmentItem = await getEquipmentById(id, companyId);
  if (!equipmentItem) return null;

  // Add calibration to maintenance history
  const record: MaintenanceRecord = {
    type: "routine",
    date: calibrationDate,
    description: "Equipment calibration",
    performedBy,
    nextScheduledDate: nextCalibrationDate,
    notes,
  };

  return addMaintenanceRecord(id, companyId, record);
}

export async function getDueCalibrations(companyId: string, daysAhead: number = 30): Promise<Equipment[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const equipmentList = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.companyId, companyId),
        lte(equipment.nextCalibrationDate, futureDate)
      )
    )
    .orderBy(equipment.nextCalibrationDate);

  return equipmentList;
}

export async function getDueMaintenance(companyId: string, daysAhead: number = 30): Promise<Equipment[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const equipmentList = await db
    .select()
    .from(equipment)
    .where(
      and(
        eq(equipment.companyId, companyId),
        lte(equipment.nextMaintenance, futureDate)
      )
    )
    .orderBy(equipment.nextMaintenance);

  return equipmentList;
}

export async function getEquipmentStats(companyId: string): Promise<{
  total: number;
  operational: number;
  maintenance: number;
  repair: number;
  offline: number;
  needsCalibration: number;
  needsMaintenance: number;
}> {
  const equipmentList = await getAllEquipment({ companyId });
  const now = new Date();

  return {
    total: equipmentList.length,
    operational: equipmentList.filter((e) => e.status === "operational").length,
    maintenance: equipmentList.filter((e) => e.status === "maintenance").length,
    repair: equipmentList.filter((e) => e.status === "repair").length,
    offline: equipmentList.filter((e) => e.status === "offline").length,
    needsCalibration: equipmentList.filter(
      (e) => e.nextCalibrationDate && new Date(e.nextCalibrationDate) <= now
    ).length,
    needsMaintenance: equipmentList.filter(
      (e) => e.nextMaintenance && new Date(e.nextMaintenance) <= now
    ).length,
  };
}
