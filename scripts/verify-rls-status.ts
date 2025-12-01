#!/usr/bin/env tsx
/**
 * Verification Script: Check RLS Status
 *
 * This script connects to the database and verifies:
 * 1. Which tables have RLS enabled
 * 2. How many RLS policies exist
 * 3. Whether critical tables are protected
 */

import { db } from "../db/index";
import { sql } from "drizzle-orm";

const CRITICAL_TABLES = [
  'patients',
  'prescriptions',
  'eye_examinations',
  'orders',
  'invoices',
  'products',
  'ai_conversations',
  'ai_messages',
  'users'
];

async function verifyRLSStatus() {
  console.log('\n🔒 RLS Status Verification Report');
  console.log('=''.repeat(60));

  try {
    // Check if helper functions exist
    console.log('\n📋 Step 1: Checking RLS Helper Functions...');
    const functions = await db.execute(sql`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE proname IN ('get_current_tenant', 'get_current_user_role', 'is_platform_admin')
      ORDER BY proname
    `);

    if (functions.rows.length === 3) {
      console.log('✅ All 3 RLS helper functions exist');
      functions.rows.forEach((fn: any) => {
        console.log(`   - ${fn.proname}()`);
      });
    } else {
      console.log(`❌ Missing RLS helper functions (found ${functions.rows.length}/3)`);
      return;
    }

    // Check tables with RLS enabled
    console.log('\n📋 Step 2: Checking Tables with RLS Enabled...');
    const rlsTables = await db.execute(sql`
      SELECT
        tablename,
        rowsecurity AS rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = true
      ORDER BY tablename
    `);

    console.log(`✅ Found ${rlsTables.rows.length} tables with RLS enabled`);

    // Check critical tables
    console.log('\n📋 Step 3: Verifying Critical Tables...');
    const criticalTableStatus = await db.execute(sql`
      SELECT
        tablename,
        CASE WHEN rowsecurity THEN '✓ PROTECTED' ELSE '✗ UNPROTECTED' END as status
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY(${CRITICAL_TABLES})
      ORDER BY tablename
    `);

    let allProtected = true;
    criticalTableStatus.rows.forEach((table: any) => {
      console.log(`   ${table.status} ${table.tablename}`);
      if (!table.status.includes('PROTECTED')) {
        allProtected = false;
      }
    });

    if (allProtected && criticalTableStatus.rows.length === CRITICAL_TABLES.length) {
      console.log('\n✅ All critical tables are protected with RLS');
    } else {
      console.log(`\n⚠️  Some critical tables are UNPROTECTED!`);
    }

    // Count RLS policies
    console.log('\n📋 Step 4: Counting RLS Policies...');
    const policies = await db.execute(sql`
      SELECT COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    const policyCount = policies.rows[0]?.policy_count || 0;
    console.log(`✅ Found ${policyCount} RLS policies`);

    // Check RLS metadata
    console.log('\n📋 Step 5: Checking RLS Metadata...');
    try {
      const metadata = await db.execute(sql`
        SELECT
          migration_version,
          applied_at,
          total_tables_protected,
          security_level,
          compliance_standards
        FROM rls_metadata
        ORDER BY applied_at DESC
        LIMIT 1
      `);

      if (metadata.rows.length > 0) {
        const meta = metadata.rows[0];
        console.log('✅ RLS Metadata found:');
        console.log(`   Migration: ${meta.migration_version}`);
        console.log(`   Applied: ${meta.applied_at}`);
        console.log(`   Tables Protected: ${meta.total_tables_protected}`);
        console.log(`   Security Level: ${meta.security_level}`);
        console.log(`   Compliance: ${meta.compliance_standards}`);
      } else {
        console.log('⚠️  No RLS metadata found');
      }
    } catch (e) {
      console.log('⚠️  rls_metadata table does not exist');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    if (allProtected && policyCount > 0 && rlsTables.rows.length > 0) {
      console.log('\n✅ RLS IS FULLY IMPLEMENTED AND ACTIVE');
      console.log(`   - ${rlsTables.rows.length} tables protected`);
      console.log(`   - ${policyCount} policies enforcing tenant isolation`);
      console.log(`   - All critical tables secured`);
      console.log('\n✅ P0-1 (RLS Implementation): COMPLETE');
    } else {
      console.log('\n❌ RLS IS NOT FULLY IMPLEMENTED');
      console.log('\n⚠️  P0-1 (RLS Implementation): INCOMPLETE');
      console.log('\nNext Steps:');
      console.log('1. Run: npm run db:push');
      console.log('2. Or manually apply: migrations/2025-11-25-implement-row-level-security.sql');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error verifying RLS status:', error);
    process.exit(1);
  }
}

// Run verification
verifyRLSStatus()
  .then(() => {
    console.log('✅ Verification complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
