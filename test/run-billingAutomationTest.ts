import { BillingAutomationService } from '../server/services/rcm/BillingAutomationService';

async function run() {
  try {
    // ensure a dummy DATABASE_URL to avoid storage bootstrap fatal checks when importing storage
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost/unused';

    // reset internal maps (best-effort)
    (BillingAutomationService as any).charges?.clear?.();
    (BillingAutomationService as any).chargeCaptureRules?.clear?.();
    (BillingAutomationService as any).collectionsCases?.clear?.();
    (BillingAutomationService as any).collectionsActivities = [];
    (BillingAutomationService as any).writeOffs?.clear?.();
    (BillingAutomationService as any).feeSchedules?.clear?.();

    // Ensure default fee schedule exists (private static helper may be present)
    try {
      if (typeof (BillingAutomationService as any).initializeDefaultFeeSchedule === 'function') {
        (BillingAutomationService as any).initializeDefaultFeeSchedule();
      }
    } catch (err) {
      // ignore
    }

    // call createCharge
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
    if (!charge || typeof charge.id !== 'string' || charge.status !== 'pending') {
      console.error('createCharge basic assertions failed', charge);
      process.exit(2);
    }

    if (!/^CHG-\d{8}-\d{13}-[0-9A-F]+$/.test(charge.chargeNumber)) {
      console.error('chargeNumber format assertion failed', charge.chargeNumber);
      process.exit(3);
    }

    // autoCaptureCharges
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

    if (!Array.isArray(charges) || charges.length !== 2) {
      console.error('autoCaptureCharges did not return expected number of charges', charges);
      process.exit(4);
    }

    const known = charges[0];
    const unknown = charges[1];

    if (known.chargeAmount < 15000) {
      console.error('Known procedure charge amount seems incorrect', known.chargeAmount);
      process.exit(5);
    }

    if (unknown.chargeAmount !== 10000) {
      console.error('Unknown procedure did not fallback to default amount', unknown.chargeAmount);
      process.exit(6);
    }

    console.log('BillingAutomationService quick-run tests: PASS');
    process.exit(0);
  } catch (err) {
    console.error('Error running billing automation quick tests', err);
    process.exit(1);
  }
}

run();
