import { BillingAutomationService } from '../../server/services/rcm/BillingAutomationService';

describe('BillingAutomationService (unit)', () => {
  beforeEach(() => {
    // Clear in-memory stores to keep tests idempotent
    (BillingAutomationService as any).charges?.clear?.();
    (BillingAutomationService as any).chargeCaptureRules?.clear?.();
    (BillingAutomationService as any).collectionsCases?.clear?.();
    (BillingAutomationService as any).collectionsActivities = [];
    (BillingAutomationService as any).writeOffs?.clear?.();
    (BillingAutomationService as any).feeSchedules?.clear?.();
    // Reinitialize defaults (the static initializer runs on import; ensure default fee schedule exists)
    if (typeof (BillingAutomationService as any).initializeDefaultFeeSchedule === 'function') {
      try {
        (BillingAutomationService as any).initializeDefaultFeeSchedule();
      } catch (err) {
        // ignore if already initialized
      }
    }
  });

  test('createCharge creates a charge with robust chargeNumber and returns expected fields', async () => {
    const payload = {
      patientId: 'patient-1',
      encounterId: 'enc-1',
      providerId: 'prov-1',
      serviceDate: new Date(),
      procedureCode: '92004',
      diagnosisCodes: ['H52.4'],
      units: 1,
      chargeAmount: 15000,
      createdBy: 'tester',
    } as any;

    const charge = await BillingAutomationService.createCharge(payload);

    expect(charge).toBeDefined();
    expect(typeof charge.id).toBe('string');
    expect(charge.status).toBe('pending');
    expect(charge.chargeAmount).toBe(15000);
    // chargeNumber should include CHG-<date>-<ts>-<hex>
    expect(charge.chargeNumber).toMatch(/^CHG-\d{8}-\d{13}-[0-9A-F]+$/);
  });

  test('autoCaptureCharges creates charges for procedures and falls back to default fee when code missing', async () => {
    const procedures = [
      { procedureCode: '92004', units: 1, diagnosisCodes: ['H52.4'] },
      { procedureCode: 'UNKNOWN_CODE', units: 2, diagnosisCodes: ['H52.4'] },
    ];

    const charges = await BillingAutomationService.autoCaptureCharges(
      'enc-1',
      'patient-1',
      'prov-1',
      new Date(),
      procedures,
      'tester'
    );

    expect(Array.isArray(charges)).toBe(true);
    expect(charges.length).toBe(2);

    const first = charges[0];
    const second = charges[1];

    // Known code should use fee schedule amount for 92004 (initialized default is 15000)
    expect(first.procedureCode).toBe('92004');
    expect(first.chargeAmount).toBeGreaterThanOrEqual(15000);

    // Unknown code should fall back to default $100 -> 10000 cents
    expect(second.procedureCode).toBe('UNKNOWN_CODE');
    expect(second.chargeAmount).toBe(10000);
  });
});
