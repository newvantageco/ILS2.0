/**
 * Quick script to create default roles for all existing companies
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { createDefaultRoles } from '../services/DefaultRolesService';

async function createRolesForAllCompanies() {
  console.log('🚀 Creating default roles for all companies...\n');
  
  try {
    // Get all companies
    const companies = await db.execute(sql`SELECT id, name FROM companies`);
    
    console.log(`Found ${companies.rows.length} companies\n`);
    
    for (const company of companies.rows) {
      console.log(`📦 Creating roles for: ${company.name}`);
      
      try {
        await createDefaultRoles(company.id as string);
        
        // Query created roles
        const rolesResult = await db.execute(sql`
          SELECT dr.name, COUNT(drp.permission_id) as permission_count
          FROM dynamic_roles dr
          LEFT JOIN dynamic_role_permissions drp ON drp.role_id = dr.id
          WHERE dr.company_id = ${company.id}
          GROUP BY dr.id, dr.name
        `);
        
        console.log(`   ✅ Created ${rolesResult.rows.length} roles`);
        
        // Show created roles
        for (const role of rolesResult.rows) {
          console.log(`      - ${role.name} (${role.permission_count} permissions)`);
        }
        
      } catch (error) {
        const err = error as Error;
        if (err.message.includes('already exist')) {
          console.log(`   ⚠️  Roles already exist for this company`);
        } else {
          console.log(`   ❌ Error: ${err.message}`);
        }
      }
      
      console.log('');
    }
    
    console.log('✅ Done! All companies now have default roles.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to create roles:', error);
    process.exit(1);
  }
}

// Run if called directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  createRolesForAllCompanies();
}

export { createRolesForAllCompanies };
