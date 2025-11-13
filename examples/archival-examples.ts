/**
 * Archival System Usage Examples
 *
 * Practical examples showing how to use the archival system in your application.
 */

import { archivalService } from '../server/services/ArchivalService';
import archivalUtils from '../server/utils/archivalUtils';

/**
 * =============================================================================
 * EXAMPLE 1: Soft Delete an Order
 * =============================================================================
 *
 * Instead of permanently deleting an order, archive it for recovery.
 */
export async function example1_softDeleteOrder(
  order: any,
  userId: string,
  companyId: string
) {
  console.log('Example 1: Soft Delete Order');
  console.log('============================');

  // Archive the order instead of deleting
  const archived = await archivalUtils.softDelete({
    tableName: 'orders',
    record: order,
    companyId,
    userId,
    reason: 'Customer requested deletion',
    tags: ['customer-request', 'soft-delete'],
  });

  console.log('✅ Order archived:', archived.id);
  console.log('   Original ID:', archived.originalId);
  console.log('   Archived at:', archived.archivedAt);
  console.log('   Can be restored anytime!');

  return archived;
}

/**
 * =============================================================================
 * EXAMPLE 2: Restore a Deleted Order
 * =============================================================================
 *
 * Customer changed their mind - restore the deleted order.
 */
export async function example2_restoreOrder(
  originalOrderId: string,
  userId: string,
  companyId: string
) {
  console.log('Example 2: Restore Deleted Order');
  console.log('=================================');

  // Find and restore the order
  const restoredData = await archivalUtils.findAndRestoreRecord({
    tableName: 'orders',
    originalId: originalOrderId,
    companyId,
    userId,
  });

  console.log('✅ Order restored successfully!');
  console.log('   Order data:', restoredData);
  console.log('   You can now re-insert it into the orders table');

  return restoredData;
}

/**
 * =============================================================================
 * EXAMPLE 3: Generate and Archive a Monthly Report
 * =============================================================================
 *
 * Generate an expensive report once and reuse it forever.
 */
export async function example3_archiveMonthlyReport(
  companyId: string,
  userId: string,
  month: number,
  year: number
) {
  console.log('Example 3: Archive Monthly Report');
  console.log('==================================');

  // Simulate generating an expensive report
  const reportData = {
    month,
    year,
    totalSales: 145000,
    orderCount: 847,
    topProducts: [
      { name: 'Progressive Lenses', revenue: 45000 },
      { name: 'Single Vision', revenue: 38000 },
    ],
    generatedAt: new Date(),
  };

  // Archive it for future retrieval
  const archived = await archivalUtils.archiveGeneratedReport({
    reportType: 'monthly_sales',
    reportName: `Monthly Sales Report - ${month}/${year}`,
    reportData,
    companyId,
    userId,
    periodStart: new Date(year, month - 1, 1),
    periodEnd: new Date(year, month, 0),
    category: 'sales',
    retentionDays: 365, // Keep for 1 year
  });

  console.log('✅ Report archived:', archived.id);
  console.log('   Access anytime without regenerating!');

  return archived;
}

/**
 * =============================================================================
 * EXAMPLE 4: Retrieve Old Reports
 * =============================================================================
 *
 * Get last 3 months of sales reports instantly.
 */
export async function example4_retrieveOldReports(companyId: string) {
  console.log('Example 4: Retrieve Old Reports');
  console.log('================================');

  // Get last 90 days of reports
  const { reports, total } = await archivalUtils.getRecentReports({
    companyId,
    reportType: 'monthly_sales',
    category: 'sales',
    days: 90,
    limit: 10,
  });

  console.log(`✅ Found ${total} reports`);
  reports.forEach(report => {
    console.log(`   - ${report.reportName} (Generated: ${report.generatedAt})`);
  });

  return reports;
}

/**
 * =============================================================================
 * EXAMPLE 5: Track Changes with Historical Snapshots
 * =============================================================================
 *
 * Create snapshots before important updates.
 */
export async function example5_trackChanges(
  orderId: string,
  orderData: any,
  companyId: string,
  userId: string
) {
  console.log('Example 5: Track Changes with Snapshots');
  console.log('========================================');

  // Create a snapshot before updating
  const snapshot = await archivalUtils.createUpdateSnapshot({
    entityType: 'orders',
    entityId: orderId,
    data: orderData,
    companyId,
    userId,
    triggerEvent: 'before_status_change',
  });

  console.log('✅ Snapshot created:', snapshot.id);
  console.log('   Version:', snapshot.version);

  // Now you can safely update the order
  // If something goes wrong, you can restore from the snapshot

  return snapshot;
}

/**
 * =============================================================================
 * EXAMPLE 6: View Complete History
 * =============================================================================
 *
 * See all changes made to an order over time.
 */
export async function example6_viewHistory(orderId: string) {
  console.log('Example 6: View Complete History');
  console.log('=================================');

  const history = await archivalUtils.getEntityHistory('orders', orderId, 50);

  console.log(`✅ Found ${history.length} versions`);
  history.forEach(version => {
    console.log(`   Version ${version.version}:`);
    console.log(`     Changed at: ${version.capturedAt}`);
    console.log(`     Changed by: ${version.capturedBy}`);
    console.log(`     Change type: ${version.changeType}`);
    if (version.changes) {
      console.log(`     Changes:`, JSON.stringify(version.changes, null, 2));
    }
  });

  return history;
}

/**
 * =============================================================================
 * EXAMPLE 7: Time Travel - View Order 6 Months Ago
 * =============================================================================
 *
 * See exactly how an order looked in the past.
 */
export async function example7_timeTravelQuery(orderId: string, date: Date) {
  console.log('Example 7: Time Travel Query');
  console.log('=============================');

  const snapshot = await archivalService.getEntityAtTime('orders', orderId, date);

  if (snapshot) {
    console.log('✅ Found snapshot from', snapshot.capturedAt);
    console.log('   Data at that time:', snapshot.snapshotData);
  } else {
    console.log('❌ No snapshot found for that date');
  }

  return snapshot;
}

/**
 * =============================================================================
 * EXAMPLE 8: GDPR Data Export
 * =============================================================================
 *
 * Export all customer data for GDPR compliance.
 */
export async function example8_gdprExport(
  patientId: string,
  companyId: string,
  userId: string
) {
  console.log('Example 8: GDPR Data Export');
  console.log('============================');

  // Collect all patient data
  const patientData = {
    patient: { id: patientId, name: 'John Doe' }, // Get from DB
    orders: [], // Get from DB
    examinations: [], // Get from DB
    invoices: [], // Get from DB
  };

  // Export with automatic logging
  const { data, exportLog } = await archivalUtils.exportEntityData({
    entityType: 'patients',
    data: [patientData],
    format: 'json',
    companyId,
    userId,
    filters: { patientId },
    dateRange: {
      start: '2020-01-01',
      end: new Date().toISOString(),
    },
  });

  console.log('✅ Export completed:', exportLog.id);
  console.log('   Records exported:', exportLog.recordCount);
  console.log('   Export tracked for compliance');

  return { data, exportLog };
}

/**
 * =============================================================================
 * EXAMPLE 9: Audit Trail Investigation
 * =============================================================================
 *
 * Investigate who changed what and when.
 */
export async function example9_auditTrail(
  entityType: string,
  entityId: string
) {
  console.log('Example 9: Audit Trail Investigation');
  console.log('=====================================');

  const trail = await archivalUtils.getFormattedAuditTrail(entityType, entityId, 100);

  console.log(`✅ Found ${trail.length} audit entries`);
  trail.forEach(entry => {
    console.log(`   ${entry.timestamp}:`);
    console.log(`     Action: ${entry.action}`);
    console.log(`     User: ${entry.user} (${entry.userRole})`);
    console.log(`     IP: ${entry.ipAddress}`);
    if (entry.changes) {
      console.log(`     Changes:`, entry.changes);
    }
  });

  return trail;
}

/**
 * =============================================================================
 * EXAMPLE 10: Bulk Archive Multiple Records
 * =============================================================================
 *
 * Archive many records at once (e.g., cleanup old data).
 */
export async function example10_bulkArchive(
  orders: Array<{ id: string; data: any }>,
  companyId: string,
  userId: string
) {
  console.log('Example 10: Bulk Archive');
  console.log('========================');

  const result = await archivalUtils.bulkArchive({
    tableName: 'orders',
    records: orders,
    companyId,
    userId,
    reason: 'Bulk cleanup of old completed orders',
    tags: ['bulk-operation', 'cleanup'],
  });

  console.log('✅ Bulk archive completed:');
  console.log(`   Total: ${result.total}`);
  console.log(`   Succeeded: ${result.succeeded}`);
  console.log(`   Failed: ${result.failed}`);

  return result;
}

/**
 * =============================================================================
 * EXAMPLE 11: Compare Two Versions
 * =============================================================================
 *
 * See what changed between two versions of a record.
 */
export async function example11_compareVersions(
  orderId: string,
  version1: number,
  version2: number
) {
  console.log('Example 11: Compare Versions');
  console.log('============================');

  const comparison = await archivalUtils.compareVersions(
    'orders',
    orderId,
    version1,
    version2
  );

  console.log(`✅ Comparing versions ${version1} and ${version2}:`);
  console.log('   Version 1:', comparison.version1.capturedAt);
  console.log('   Version 2:', comparison.version2.capturedAt);
  console.log('   Changes:', comparison.changes);

  return comparison;
}

/**
 * =============================================================================
 * EXAMPLE 12: Check Retention Policy
 * =============================================================================
 *
 * See how long data should be kept.
 */
export async function example12_checkRetentionPolicy(entityType: string) {
  console.log('Example 12: Check Retention Policy');
  console.log('===================================');

  const policy = await archivalUtils.getRetentionInfo(entityType);

  if (policy.hasPolicy) {
    console.log(`✅ Retention policy for ${entityType}:`);
    console.log(`   Active retention: ${policy.activeRetentionDays} days`);
    console.log(`   Archive retention: ${policy.archiveRetentionDays} days`);
    console.log(`   Total retention: ${policy.totalRetentionDays} days`);
    console.log(`   Auto-archive: ${policy.autoArchive ? 'Yes' : 'No'}`);
    console.log(`   Auto-delete: ${policy.autoDelete ? 'Yes' : 'No'}`);
  } else {
    console.log(`❌ No retention policy defined for ${entityType}`);
  }

  return policy;
}

/**
 * =============================================================================
 * RUN ALL EXAMPLES
 * =============================================================================
 */
export async function runAllExamples() {
  console.log('');
  console.log('=============================================================================');
  console.log('ARCHIVAL SYSTEM EXAMPLES');
  console.log('=============================================================================');
  console.log('');

  try {
    // Example data
    const mockOrder = {
      id: 'ORD-2025-123456',
      customerName: 'John Doe',
      total: 450.00,
      status: 'completed',
    };
    const userId = 'user-123';
    const companyId = 'company-456';

    // Run examples (commented out to avoid actual execution)
    // await example1_softDeleteOrder(mockOrder, userId, companyId);
    // await example2_restoreOrder(mockOrder.id, userId, companyId);
    // await example3_archiveMonthlyReport(companyId, userId, 1, 2025);
    // await example4_retrieveOldReports(companyId);
    // await example5_trackChanges(mockOrder.id, mockOrder, companyId, userId);
    // await example6_viewHistory(mockOrder.id);
    // await example7_timeTravelQuery(mockOrder.id, new Date('2024-07-01'));
    // await example8_gdprExport('patient-789', companyId, userId);
    // await example9_auditTrail('orders', mockOrder.id);
    // await example10_bulkArchive([mockOrder], companyId, userId);
    // await example11_compareVersions(mockOrder.id, 1, 2);
    // await example12_checkRetentionPolicy('orders');

    console.log('');
    console.log('✅ All examples documented!');
    console.log('   Uncomment the examples you want to run.');
    console.log('');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export all examples
export default {
  example1_softDeleteOrder,
  example2_restoreOrder,
  example3_archiveMonthlyReport,
  example4_retrieveOldReports,
  example5_trackChanges,
  example6_viewHistory,
  example7_timeTravelQuery,
  example8_gdprExport,
  example9_auditTrail,
  example10_bulkArchive,
  example11_compareVersions,
  example12_checkRetentionPolicy,
  runAllExamples,
};
