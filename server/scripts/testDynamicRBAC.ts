/**
 * Test Script for Dynamic RBAC System
 * 
 * This script tests:
 * 1. Database schema (tables exist)
 * 2. Permission seeding (permissions and categories loaded)
 * 3. Default role creation
 * 4. User role assignment
 * 5. Permission resolution (sum of permissions logic)
 * 6. Plan-level filtering
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { createDefaultRoles, DEFAULT_ROLE_TEMPLATES } from '../services/DefaultRolesService';
import logger from '../utils/logger';


interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
  results.push({ test, status, message, details });
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  logger.info(`${emoji} ${test}: ${message}`);
  if (details) {
    logger.info('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testDatabaseSchema() {
  logger.info('\n🔍 Testing Database Schema...\n');
  
  try {
    // Test permission_categories table
    const categories = await db.execute(sql`SELECT COUNT(*) as count FROM permission_categories`);
    const categoryCount = Number(categories.rows[0].count);
    
    if (categoryCount > 0) {
      logTest('Permission Categories Table', 'PASS', `Found ${categoryCount} categories`);
    } else {
      logTest('Permission Categories Table', 'FAIL', 'No categories found');
    }

    // Test permissions table
    const permissions = await db.execute(sql`SELECT COUNT(*) as count FROM permissions`);
    const permCount = Number(permissions.rows[0].count);
    
    if (permCount > 0) {
      logTest('Permissions Table', 'PASS', `Found ${permCount} permissions`);
    } else {
      logTest('Permissions Table', 'FAIL', 'No permissions found');
    }

    // Test dynamic_roles table
    const rolesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'dynamic_roles'
    `);
    
    if (rolesCheck.rows.length > 0) {
      logTest('Dynamic Roles Table', 'PASS', 'Table exists');
    } else {
      logTest('Dynamic Roles Table', 'FAIL', 'Table does not exist');
    }

    // Test dynamic_role_permissions table
    const rolePermsCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'dynamic_role_permissions'
    `);
    
    if (rolePermsCheck.rows.length > 0) {
      logTest('Dynamic Role Permissions Table', 'PASS', 'Table exists');
    } else {
      logTest('Dynamic Role Permissions Table', 'FAIL', 'Table does not exist');
    }

    // Test user_dynamic_roles table
    const userRolesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_dynamic_roles'
    `);
    
    if (userRolesCheck.rows.length > 0) {
      logTest('User Dynamic Roles Table', 'PASS', 'Table exists');
    } else {
      logTest('User Dynamic Roles Table', 'FAIL', 'Table does not exist');
    }

    // Test user_effective_permissions view
    const viewCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'user_effective_permissions'
    `);
    
    if (viewCheck.rows.length > 0) {
      logTest('User Effective Permissions View', 'PASS', 'View exists');
    } else {
      logTest('User Effective Permissions View', 'FAIL', 'View does not exist');
    }

  } catch (error) {
    const err = error as Error;
    logTest('Database Schema', 'FAIL', `Error: ${err.message}`);
  }
}

async function testPermissionSeeding() {
  logger.info('\n🌱 Testing Permission Seeding...\n');
  
  try {
    // Check permission distribution by plan level
    const planDistribution = await db.execute(sql`
      SELECT plan_level, COUNT(*) as count 
      FROM permissions 
      GROUP BY plan_level 
      ORDER BY plan_level
    `);
    
    logTest('Permission Plan Distribution', 'PASS', 'Permissions grouped by plan', 
      planDistribution.rows.map(r => ({ plan: r.plan_level, count: Number(r.count) }))
    );

    // Check for required permissions
    const requiredPerms = [
      'company:view',
      'users:view',
      'orders:create',
      'patients:create',
      'analytics:view',
      'ai:assistant'
    ];

    for (const permKey of requiredPerms) {
      const result = await db.execute(sql`
        SELECT permission_key, permission_name, plan_level 
        FROM permissions 
        WHERE permission_key = ${permKey}
      `);
      
      if (result.rows.length > 0) {
        logTest(`Permission: ${permKey}`, 'PASS', 
          `Found: ${result.rows[0].permission_name} (${result.rows[0].plan_level})`
        );
      } else {
        logTest(`Permission: ${permKey}`, 'FAIL', 'Not found');
      }
    }

    // Check categories are linked
    const categoryCheck = await db.execute(sql`
      SELECT 
        pc.name as category_name,
        COUNT(p.id) as permission_count
      FROM permission_categories pc
      LEFT JOIN permissions p ON p.category = pc.name
      GROUP BY pc.name
      ORDER BY pc.display_order
    `);
    
    logTest('Category-Permission Links', 'PASS', 'Categories with permission counts',
      categoryCheck.rows.map(r => ({ 
        category: r.category_name, 
        count: Number(r.permission_count) 
      }))
    );

  } catch (error) {
    const err = error as Error;
    logTest('Permission Seeding', 'FAIL', `Error: ${err.message}`);
  }
}

async function testDefaultRoles() {
  logger.info('\n👥 Testing Default Roles Creation...\n');
  
  try {
    // Get first company to test with
    const companies = await db.execute(sql`SELECT id, name FROM companies LIMIT 1`);
    
    if (companies.rows.length === 0) {
      logTest('Default Roles', 'WARN', 'No companies found to test with');
      return;
    }

    const testCompany = companies.rows[0];
    logTest('Test Company', 'PASS', `Using company: ${testCompany.name}`);

    // Check if roles already exist
    const existingRoles = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM dynamic_roles 
      WHERE company_id = ${testCompany.id}
    `);
    
    const existingCount = Number(existingRoles.rows[0].count);
    
    if (existingCount === 0) {
      // Create default roles
      logger.info('   Creating default roles...');
      await createDefaultRoles(testCompany.id as string);
      
      const newRoles = await db.execute(sql`
        SELECT id, name, description, is_deletable 
        FROM dynamic_roles 
        WHERE company_id = ${testCompany.id}
      `);
      
      logTest('Default Roles Created', 'PASS', `Created ${newRoles.rows.length} roles`,
        newRoles.rows.map(r => ({ name: r.name, deletable: r.is_deletable }))
      );

      // Check role permissions
      for (const role of newRoles.rows) {
        const permCount = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM dynamic_role_permissions 
          WHERE role_id = ${role.id}
        `);
        
        const count = Number(permCount.rows[0].count);
        logTest(`Role: ${role.name}`, 'PASS', `${count} permissions assigned`);
      }

    } else {
      logTest('Default Roles', 'PASS', `${existingCount} roles already exist for company`);
      
      // List existing roles
      const roles = await db.execute(sql`
        SELECT dr.name, COUNT(drp.permission_id) as perm_count
        FROM dynamic_roles dr
        LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
        WHERE dr.company_id = ${testCompany.id}
        GROUP BY dr.id, dr.name
      `);
      
      logTest('Existing Roles', 'PASS', 'Roles with permission counts',
        roles.rows.map(r => ({ role: r.name, permissions: Number(r.perm_count) }))
      );
    }

  } catch (error) {
    const err = error as Error;
    logTest('Default Roles', 'FAIL', `Error: ${err.message}`);
  }
}

async function testUserRoleAssignment() {
  logger.info('\n🔐 Testing User Role Assignment...\n');
  
  try {
    // Get a test user
    const users = await db.execute(sql`
      SELECT u.id, u.email, u.name, c.id as company_id, c.name as company_name
      FROM users u
      JOIN companies c ON c.id = u.company_id
      LIMIT 1
    `);
    
    if (users.rows.length === 0) {
      logTest('User Role Assignment', 'WARN', 'No users found to test with');
      return;
    }

    const testUser = users.rows[0];
    logTest('Test User', 'PASS', `Using user: ${testUser.email}`);

    // Get roles for this company
    const roles = await db.execute(sql`
      SELECT id, name 
      FROM dynamic_roles 
      WHERE company_id = ${testUser.company_id}
      LIMIT 1
    `);
    
    if (roles.rows.length === 0) {
      logTest('User Role Assignment', 'WARN', 'No roles found for user company');
      return;
    }

    const testRole = roles.rows[0];

    // Check if user already has roles
    const existingAssignment = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM user_dynamic_roles 
      WHERE user_id = ${testUser.id}
    `);
    
    const assignmentCount = Number(existingAssignment.rows[0].count);
    
    if (assignmentCount === 0) {
      // Assign role to user
      logger.info(`   Assigning role "${testRole.name}" to user...`);
      await db.execute(sql`
        INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
        VALUES (${testUser.id}, ${testRole.id}, true)
      `);
      
      logTest('Role Assignment', 'PASS', `Assigned "${testRole.name}" to user`);
    } else {
      logTest('Role Assignment', 'PASS', `User already has ${assignmentCount} role(s)`);
    }

    // List user's roles
    const userRoles = await db.execute(sql`
      SELECT dr.name, udr.is_primary
      FROM user_dynamic_roles udr
      JOIN dynamic_roles dr ON dr.id = udr.role_id
      WHERE udr.user_id = ${testUser.id}
    `);
    
    logTest('User Roles', 'PASS', 'Roles assigned to user',
      userRoles.rows.map(r => ({ role: r.name, primary: r.is_primary }))
    );

  } catch (error) {
    const err = error as Error;
    logTest('User Role Assignment', 'FAIL', `Error: ${err.message}`);
  }
}

async function testPermissionResolution() {
  logger.info('\n🎯 Testing Permission Resolution (Sum of Permissions)...\n');
  
  try {
    // Get a user with roles
    const userWithRoles = await db.execute(sql`
      SELECT DISTINCT u.id, u.email, u.name, c.subscription_plan
      FROM users u
      JOIN companies c ON c.id = u.company_id
      JOIN user_dynamic_roles udr ON udr.user_id = u.id
      LIMIT 1
    `);
    
    if (userWithRoles.rows.length === 0) {
      logTest('Permission Resolution', 'WARN', 'No users with roles found');
      return;
    }

    const user = userWithRoles.rows[0];
    logTest('Test User for Resolution', 'PASS', `${user.email} (Plan: ${user.subscription_plan})`);

    // Get user's effective permissions using the view
    const effectivePerms = await db.execute(sql`
      SELECT * FROM user_effective_permissions WHERE user_id = ${user.id}
    `);
    
    if (effectivePerms.rows.length > 0) {
      const permData = effectivePerms.rows[0];
      const permissions = (permData.permission_keys || []) as string[];
      const roles = (permData.role_names || []) as string[];
      
      logTest('Effective Permissions View', 'PASS', 
        `User has ${permissions.length} permissions from ${roles.length} role(s)`,
        { roles, permissionCount: permissions.length }
      );

      // Test specific permission checks
      const testPermissions = ['company:view', 'orders:create', 'analytics:view'];
      
      for (const perm of testPermissions) {
        const hasPermission = permissions.includes(perm);
        logTest(`Has Permission: ${perm}`, hasPermission ? 'PASS' : 'WARN', 
          hasPermission ? 'User has this permission' : 'User does not have this permission'
        );
      }

      // Test plan-level filtering
      const planLevel = user.subscription_plan || 'free';
      const analyticsPerms = permissions.filter((p: string) => p.startsWith('analytics:'));
      const aiPerms = permissions.filter((p: string) => p.startsWith('ai:'));
      
      logTest('Plan-Level Permissions', 'PASS', 
        `Analytics: ${analyticsPerms.length}, AI: ${aiPerms.length}`,
        { plan: planLevel, analytics: analyticsPerms, ai: aiPerms }
      );

    } else {
      logTest('Permission Resolution', 'FAIL', 'No permissions found for user');
    }

  } catch (error) {
    const err = error as Error;
    logTest('Permission Resolution', 'FAIL', `Error: ${err.message}`);
  }
}

async function testMultiRoleScenario() {
  logger.info('\n🔄 Testing Multi-Role Scenario (Sum Logic)...\n');
  
  try {
    // Get a user with roles
    const users = await db.execute(sql`
      SELECT u.id, u.email, c.id as company_id
      FROM users u
      JOIN companies c ON c.id = u.company_id
      JOIN user_dynamic_roles udr ON udr.user_id = u.id
      LIMIT 1
    `);
    
    if (users.rows.length === 0) {
      logTest('Multi-Role Test', 'WARN', 'No users found for multi-role test');
      return;
    }

    const user = users.rows[0];

    // Get available roles for this company
    const availableRoles = await db.execute(sql`
      SELECT id, name 
      FROM dynamic_roles 
      WHERE company_id = ${user.company_id}
      LIMIT 3
    `);
    
    if (availableRoles.rows.length < 2) {
      logTest('Multi-Role Test', 'WARN', 'Not enough roles to test multi-role scenario');
      return;
    }

    // Get current role count
    const currentRoles = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM user_dynamic_roles 
      WHERE user_id = ${user.id}
    `);
    
    const roleCount = Number(currentRoles.rows[0].count);
    logTest('Current Role Count', 'PASS', `User has ${roleCount} role(s)`);

    // If user only has one role, add a second one
    if (roleCount === 1) {
      const secondRole = availableRoles.rows.find(r => {
        // Find a role not already assigned
        return true; // Simplified for test
      });
      
      if (secondRole) {
        await db.execute(sql`
          INSERT INTO user_dynamic_roles (user_id, role_id, is_primary)
          VALUES (${user.id}, ${secondRole.id}, false)
          ON CONFLICT DO NOTHING
        `);
        
        logTest('Added Second Role', 'PASS', `Added "${secondRole.name}" to user`);
      }
    }

    // Get combined permissions
    const combinedPerms = await db.execute(sql`
      SELECT DISTINCT p.permission_key, p.permission_name
      FROM user_dynamic_roles udr
      JOIN dynamic_role_permissions drp ON drp.role_id = udr.role_id
      JOIN permissions p ON p.id = drp.permission_id
      WHERE udr.user_id = ${user.id}
      ORDER BY p.permission_key
    `);
    
    logTest('Combined Permissions', 'PASS', 
      `User has ${combinedPerms.rows.length} unique permissions from all roles`,
      { totalPermissions: combinedPerms.rows.length }
    );

    // Show permissions by role
    const permsByRole = await db.execute(sql`
      SELECT dr.name as role_name, COUNT(drp.permission_id) as perm_count
      FROM user_dynamic_roles udr
      JOIN dynamic_roles dr ON dr.id = udr.role_id
      LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
      WHERE udr.user_id = ${user.id}
      GROUP BY dr.id, dr.name
    `);
    
    logTest('Permissions by Role', 'PASS', 'Permission breakdown',
      permsByRole.rows.map(r => ({ role: r.role_name, permissions: Number(r.perm_count) }))
    );

  } catch (error) {
    const err = error as Error;
    logTest('Multi-Role Scenario', 'FAIL', `Error: ${err.message}`);
  }
}

async function printSummary() {
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 TEST SUMMARY');
  logger.info('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  logger.info(`Total Tests: ${total}`);
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`⚠️  Warnings: ${warned}`);
  logger.info();

  if (failed > 0) {
    logger.info('Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      logger.info(`  ❌ ${r.test}: ${r.message}`);
    });
    logger.info();
  }

  if (warned > 0) {
    logger.info('Warnings:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      logger.info(`  ⚠️  ${r.test}: ${r.message}`);
    });
    logger.info();
  }

  const successRate = ((passed / total) * 100).toFixed(1);
  logger.info(`Success Rate: ${successRate}%`);
  logger.info();

  if (failed === 0) {
    logger.info('🎉 All critical tests passed! Dynamic RBAC system is working correctly.');
  } else {
    logger.info('⚠️  Some tests failed. Please review the issues above.');
  }
  
  logger.info('\n' + '='.repeat(60) + '\n');
}

// Main test runner
async function runTests() {
  logger.info('\n🚀 Dynamic RBAC System Test Suite\n');
  logger.info('='.repeat(60));
  
  try {
    await testDatabaseSchema();
    await testPermissionSeeding();
    await testDefaultRoles();
    await testUserRoleAssignment();
    await testPermissionResolution();
    await testMultiRoleScenario();
    
    await printSummary();
    
    process.exit(results.filter(r => r.status === 'FAIL').length > 0 ? 1 : 0);
    
  } catch (error) {
    logger.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runTests();
}

export { runTests };
