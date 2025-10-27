import dicomParser from 'dicom-parser';
import { db } from '../db';
import { dicomReadings } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface DicomEquipmentReading {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  imageInstanceUID: string;
  modality: string;
  equipmentId: string;
  manufacturer: string;
  modelName: string;
  measurements: Record<string, any>;
  rawData: Buffer;
}

class DicomService {
  private static instance: DicomService;

  private constructor() {}

  public static getInstance(): DicomService {
    if (!DicomService.instance) {
      DicomService.instance = new DicomService();
    }
    return DicomService.instance;
  }

  /**
   * Parse DICOM data from equipment
   * @param buffer Raw DICOM data
   * @returns Parsed DICOM reading
   */
  public async parseDicomData(buffer: Buffer): Promise<DicomEquipmentReading> {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      return {
        studyInstanceUID: this.getString(dataSet, 'x0020000d'),
        seriesInstanceUID: this.getString(dataSet, 'x0020000e'),
        imageInstanceUID: this.getString(dataSet, 'x00080018'),
        modality: this.getString(dataSet, 'x00080060'),
        equipmentId: this.getString(dataSet, 'x00181000'),
        manufacturer: this.getString(dataSet, 'x00080070'),
        modelName: this.getString(dataSet, 'x00081090'),
        measurements: this.extractMeasurements(dataSet),
        rawData: buffer
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse DICOM data: ${error.message}`);
      }
      throw new Error('Failed to parse DICOM data: Unknown error');
    }
  }

  private getString(dataSet: dicomParser.DataSet, tag: string): string {
    const element = dataSet.elements[tag];
    return element ? dataSet.string(tag) || '' : '';
  }

  /**
   * Extract relevant measurements from DICOM data
   * @param dataSet DICOM dataset
   * @returns Structured measurements
   */
  private extractMeasurements(dataSet: dicomParser.DataSet): Record<string, any> {
    const measurements: Record<string, any> = {};

    // Extract common ophthalmic measurements
    // Keratometry
    if (dataSet.elements['x00460044']) {
      measurements.keratometryReadings = {
        rightEye: this.parseKeratometryData(dataSet, 'RIGHT'),
        leftEye: this.parseKeratometryData(dataSet, 'LEFT')
      };
    }

    // Autorefractor
    if (dataSet.elements['x00460040']) {
      measurements.autorefraction = {
        rightEye: this.parseAutoRefractionData(dataSet, 'RIGHT'),
        leftEye: this.parseAutoRefractionData(dataSet, 'LEFT')
      };
    }

    // Tonometry
    if (dataSet.elements['x00460048']) {
      measurements.tonometry = {
        rightEye: this.parseTonometryData(dataSet, 'RIGHT'),
        leftEye: this.parseTonometryData(dataSet, 'LEFT')
      };
    }

    return measurements;
  }

  /**
   * Parse keratometry data for specified eye
   */
  private parseKeratometryData(dataSet: dicomParser.DataSet, eye: 'RIGHT' | 'LEFT'): Record<string, number> {
    // Implementation specific to keratometry data format
    return {
      k1: this.getFloat(dataSet, 'x00460044') || 0,
      k2: this.getFloat(dataSet, 'x00460045') || 0,
      axis: this.getFloat(dataSet, 'x00460046') || 0
    };
  }

  /**
   * Parse autorefraction data for specified eye
   */
  private parseAutoRefractionData(dataSet: dicomParser.DataSet, eye: 'RIGHT' | 'LEFT'): Record<string, number> {
    // Implementation specific to autorefraction data format
    return {
      sphere: this.getFloat(dataSet, 'x00460040') || 0,
      cylinder: this.getFloat(dataSet, 'x00460041') || 0,
      axis: this.getFloat(dataSet, 'x00460042') || 0
    };
  }

  /**
   * Parse tonometry data for specified eye
   */
  private parseTonometryData(dataSet: dicomParser.DataSet, eye: 'RIGHT' | 'LEFT'): number {
    return this.getFloat(dataSet, 'x00460048') || 0;
  }

  private getFloat(dataSet: dicomParser.DataSet, tag: string): number | undefined {
    const element = dataSet.elements[tag];
    if (!element) return undefined;
    const stringValue = dataSet.string(tag);
    if (!stringValue) return undefined;
    return parseFloat(stringValue);
  }

  /**
   * Store DICOM reading in database
   * @param examinationId Examination ID
   * @param reading DICOM reading
   */
  public async storeReading(examinationId: string, reading: DicomEquipmentReading): Promise<void> {
    try {
      await db.insert(dicomReadings)
        .values({
          examinationId,
          studyInstanceUID: reading.studyInstanceUID,
          seriesInstanceUID: reading.seriesInstanceUID,
          imageInstanceUID: reading.imageInstanceUID,
          modality: reading.modality,
          equipmentId: reading.equipmentId,
          manufacturer: reading.manufacturer,
          modelName: reading.modelName,
          measurements: reading.measurements,
          rawData: reading.rawData.toString('base64')
        });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to store DICOM reading: ${error.message}`);
      }
      throw new Error('Failed to store DICOM reading: Unknown error');
    }
  }

  /**
   * Get stored DICOM readings for an examination
   * @param examinationId Examination ID
   */
  public async getReadings(examinationId: string): Promise<DicomEquipmentReading[]> {
    const readings = await db
      .select()
      .from(dicomReadings)
      .where(eq(dicomReadings.examinationId, examinationId));

    return readings.map(reading => ({
      studyInstanceUID: reading.studyInstanceUID,
      seriesInstanceUID: reading.seriesInstanceUID,
      imageInstanceUID: reading.imageInstanceUID,
      modality: reading.modality,
      equipmentId: reading.equipmentId,
      manufacturer: reading.manufacturer || '',
      modelName: reading.modelName || '',
      measurements: reading.measurements as Record<string, any>,
      rawData: Buffer.from(reading.rawData, 'base64')
    }));
  }

  /**
   * Validate DICOM data against expected format
   * @param reading DICOM reading
   * @returns Validation result
   */
  public validateReading(reading: DicomEquipmentReading): boolean {
    return !!(
      reading.studyInstanceUID &&
      reading.seriesInstanceUID &&
      reading.imageInstanceUID &&
      reading.modality &&
      reading.equipmentId
    );
  }
}

export default DicomService;