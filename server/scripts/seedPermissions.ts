/**
 * Permission Seeding Script for Dynamic RBAC
 * 
 * Creates all permission categories and permissions with plan levels
 * This is the "master list" of what actions exist in your platform
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import logger from '../utils/logger';


interface PermissionCategory {
  name: string;
  description: string;
  displayOrder: number;
}

interface Permission {
  slug: string; // e.g., "orders:create"
  name: string; // Human-readable
  description: string;
  category: string; // References category name
  planLevel: 'free' | 'full' | 'add_on_analytics' | 'enterprise';
}

// Step 1: Define all permission categories
const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Company Management',
    description: 'Manage company settings, billing, and profile',
    displayOrder: 1
  },
  {
    name: 'User Management',
    description: 'Manage team members and their roles',
    displayOrder: 2
  },
  {
    name: 'Patients',
    description: 'Patient records and information',
    displayOrder: 3
  },
  {
    name: 'Orders',
    description: 'Order creation, tracking, and management',
    displayOrder: 4
  },
  {
    name: 'Prescriptions',
    description: 'Prescription management and digital Rx',
    displayOrder: 5
  },
  {
    name: 'Clinical Examinations',
    description: 'Eye exams and clinical records',
    displayOrder: 6
  },
  {
    name: 'Inventory',
    description: 'Frame and lens inventory management',
    displayOrder: 7
  },
  {
    name: 'Lab Production',
    description: 'Lab queue, production, and quality control',
    displayOrder: 8
  },
  {
    name: 'Equipment & Engineering',
    description: 'Equipment management and maintenance',
    displayOrder: 9
  },
  {
    name: 'Suppliers & Purchasing',
    description: 'Supplier management and purchase orders',
    displayOrder: 10
  },
  {
    name: 'Reports & Analytics',
    description: 'Business intelligence and analytics',
    displayOrder: 11
  },
  {
    name: 'AI Features',
    description: 'AI-powered tools and insights',
    displayOrder: 12
  },
  {
    name: 'Integrations',
    description: 'Third-party integrations (Shopify, etc.)',
    displayOrder: 13
  },
  {
    name: 'Point of Sale',
    description: 'POS and payment processing',
    displayOrder: 14
  }
];

// Step 2: Define all granular permissions
const PERMISSIONS: Permission[] = [
  // =============================================
  // COMPANY MANAGEMENT (typically admin-only)
  // =============================================
  {
    slug: 'company:view',
    name: 'View Company Profile',
    description: 'View company information and settings',
    category: 'Company Management',
    planLevel: 'free'
  },
  {
    slug: 'company:edit',
    name: 'Edit Company Profile',
    description: 'Modify company information and settings',
    category: 'Company Management',
    planLevel: 'free'
  },
  {
    slug: 'company:manage_billing',
    name: 'Manage Billing',
    description: 'Access billing, subscriptions, and payment methods',
    category: 'Company Management',
    planLevel: 'free'
  },
  {
    slug: 'company:manage_integrations',
    name: 'Manage Integrations',
    description: 'Configure third-party integrations',
    category: 'Company Management',
    planLevel: 'full'
  },

  // =============================================
  // USER MANAGEMENT
  // =============================================
  {
    slug: 'users:view',
    name: 'View Team Members',
    description: 'View list of users in the company',
    category: 'User Management',
    planLevel: 'free'
  },
  {
    slug: 'users:create',
    name: 'Invite Team Members',
    description: 'Send invitations to new users',
    category: 'User Management',
    planLevel: 'free'
  },
  {
    slug: 'users:edit',
    name: 'Edit Team Members',
    description: 'Modify user information and details',
    category: 'User Management',
    planLevel: 'free'
  },
  {
    slug: 'users:delete',
    name: 'Remove Team Members',
    description: 'Deactivate or delete users',
    category: 'User Management',
    planLevel: 'free'
  },
  {
    slug: 'users:manage_roles',
    name: 'Manage User Roles',
    description: 'Assign and remove roles from users',
    category: 'User Management',
    planLevel: 'free'
  },
  {
    slug: 'users:reset_password',
    name: 'Reset User Passwords',
    description: 'Force password resets for users',
    category: 'User Management',
    planLevel: 'free'
  },

  // =============================================
  // PATIENTS
  // =============================================
  {
    slug: 'patients:view',
    name: 'View Patients',
    description: 'View patient list and records',
    category: 'Patients',
    planLevel: 'full' // Free users get limited access
  },
  {
    slug: 'patients:create',
    name: 'Add Patients',
    description: 'Create new patient records',
    category: 'Patients',
    planLevel: 'full'
  },
  {
    slug: 'patients:edit',
    name: 'Edit Patients',
    description: 'Modify patient information',
    category: 'Patients',
    planLevel: 'full'
  },
  {
    slug: 'patients:delete',
    name: 'Delete Patients',
    description: 'Remove patient records',
    category: 'Patients',
    planLevel: 'full'
  },
  {
    slug: 'patients:export',
    name: 'Export Patient Data',
    description: 'Export patient records to CSV/PDF',
    category: 'Patients',
    planLevel: 'full'
  },

  // =============================================
  // ORDERS
  // =============================================
  {
    slug: 'orders:view',
    name: 'View Orders',
    description: 'View order list and details',
    category: 'Orders',
    planLevel: 'free'
  },
  {
    slug: 'orders:create',
    name: 'Create Orders',
    description: 'Submit new orders to lab',
    category: 'Orders',
    planLevel: 'free'
  },
  {
    slug: 'orders:edit',
    name: 'Edit Orders',
    description: 'Modify order details',
    category: 'Orders',
    planLevel: 'free'
  },
  {
    slug: 'orders:delete',
    name: 'Cancel Orders',
    description: 'Cancel or delete orders',
    category: 'Orders',
    planLevel: 'free'
  },
  {
    slug: 'orders:update_status',
    name: 'Update Order Status',
    description: 'Change order status (lab tech)',
    category: 'Orders',
    planLevel: 'free'
  },
  {
    slug: 'orders:view_all',
    name: 'View All Company Orders',
    description: 'See orders created by all users',
    category: 'Orders',
    planLevel: 'free'
  },

  // =============================================
  // PRESCRIPTIONS
  // =============================================
  {
    slug: 'prescriptions:view',
    name: 'View Prescriptions',
    description: 'View digital prescriptions',
    category: 'Prescriptions',
    planLevel: 'full'
  },
  {
    slug: 'prescriptions:create',
    name: 'Create Prescriptions',
    description: 'Write new digital prescriptions',
    category: 'Prescriptions',
    planLevel: 'full'
  },
  {
    slug: 'prescriptions:edit',
    name: 'Edit Prescriptions',
    description: 'Modify existing prescriptions',
    category: 'Prescriptions',
    planLevel: 'full'
  },
  {
    slug: 'prescriptions:delete',
    name: 'Delete Prescriptions',
    description: 'Remove prescriptions',
    category: 'Prescriptions',
    planLevel: 'full'
  },
  {
    slug: 'prescriptions:sign',
    name: 'Sign Prescriptions',
    description: 'Digitally sign prescriptions (GOC optometrists only)',
    category: 'Prescriptions',
    planLevel: 'full'
  },

  // =============================================
  // CLINICAL EXAMINATIONS
  // =============================================
  {
    slug: 'examinations:view',
    name: 'View Examinations',
    description: 'View clinical examination records',
    category: 'Clinical Examinations',
    planLevel: 'full'
  },
  {
    slug: 'examinations:create',
    name: 'Perform Examinations',
    description: 'Conduct and record eye examinations',
    category: 'Clinical Examinations',
    planLevel: 'full'
  },
  {
    slug: 'examinations:edit',
    name: 'Edit Examinations',
    description: 'Modify examination records',
    category: 'Clinical Examinations',
    planLevel: 'full'
  },
  {
    slug: 'examinations:delete',
    name: 'Delete Examinations',
    description: 'Remove examination records',
    category: 'Clinical Examinations',
    planLevel: 'full'
  },

  // =============================================
  // INVENTORY
  // =============================================
  {
    slug: 'inventory:view',
    name: 'View Inventory',
    description: 'View frame and lens inventory',
    category: 'Inventory',
    planLevel: 'free'
  },
  {
    slug: 'inventory:manage',
    name: 'Manage Inventory',
    description: 'Add, edit, and remove inventory items',
    category: 'Inventory',
    planLevel: 'full'
  },
  {
    slug: 'inventory:transfer',
    name: 'Transfer Inventory',
    description: 'Transfer stock between locations',
    category: 'Inventory',
    planLevel: 'full'
  },
  {
    slug: 'inventory:adjust',
    name: 'Adjust Stock Levels',
    description: 'Perform stock adjustments and counts',
    category: 'Inventory',
    planLevel: 'full'
  },

  // =============================================
  // LAB PRODUCTION
  // =============================================
  {
    slug: 'lab:view_queue',
    name: 'View Production Queue',
    description: 'See orders in production queue',
    category: 'Lab Production',
    planLevel: 'free'
  },
  {
    slug: 'lab:manage_production',
    name: 'Manage Production',
    description: 'Update production status and workflow',
    category: 'Lab Production',
    planLevel: 'free'
  },
  {
    slug: 'lab:quality_control',
    name: 'Quality Control',
    description: 'Perform QC checks and approvals',
    category: 'Lab Production',
    planLevel: 'free'
  },
  {
    slug: 'lab:shipping',
    name: 'Manage Shipping',
    description: 'Process shipments and tracking',
    category: 'Lab Production',
    planLevel: 'free'
  },

  // =============================================
  // EQUIPMENT & ENGINEERING
  // =============================================
  {
    slug: 'equipment:view',
    name: 'View Equipment',
    description: 'View equipment list and status',
    category: 'Equipment & Engineering',
    planLevel: 'free'
  },
  {
    slug: 'equipment:manage',
    name: 'Manage Equipment',
    description: 'Add, edit, and maintain equipment',
    category: 'Equipment & Engineering',
    planLevel: 'full'
  },
  {
    slug: 'equipment:maintenance',
    name: 'Log Maintenance',
    description: 'Record maintenance and repairs',
    category: 'Equipment & Engineering',
    planLevel: 'full'
  },

  // =============================================
  // SUPPLIERS & PURCHASING
  // =============================================
  {
    slug: 'suppliers:view',
    name: 'View Suppliers',
    description: 'View supplier directory',
    category: 'Suppliers & Purchasing',
    planLevel: 'free'
  },
  {
    slug: 'suppliers:manage',
    name: 'Manage Suppliers',
    description: 'Add and edit supplier information',
    category: 'Suppliers & Purchasing',
    planLevel: 'full'
  },
  {
    slug: 'purchasing:view',
    name: 'View Purchase Orders',
    description: 'View PO history',
    category: 'Suppliers & Purchasing',
    planLevel: 'free'
  },
  {
    slug: 'purchasing:create',
    name: 'Create Purchase Orders',
    description: 'Submit new purchase orders',
    category: 'Suppliers & Purchasing',
    planLevel: 'full'
  },
  {
    slug: 'purchasing:approve',
    name: 'Approve Purchase Orders',
    description: 'Approve POs for processing',
    category: 'Suppliers & Purchasing',
    planLevel: 'full'
  },

  // =============================================
  // REPORTS & ANALYTICS
  // =============================================
  {
    slug: 'reports:view',
    name: 'View Reports',
    description: 'Access basic reports',
    category: 'Reports & Analytics',
    planLevel: 'free'
  },
  {
    slug: 'analytics:view',
    name: 'View Analytics Dashboard',
    description: 'Access advanced analytics and BI dashboard',
    category: 'Reports & Analytics',
    planLevel: 'add_on_analytics' // This is the key for upselling!
  },
  {
    slug: 'analytics:export',
    name: 'Export Analytics',
    description: 'Export analytics data',
    category: 'Reports & Analytics',
    planLevel: 'add_on_analytics'
  },
  {
    slug: 'reports:custom',
    name: 'Create Custom Reports',
    description: 'Build custom report templates',
    category: 'Reports & Analytics',
    planLevel: 'full'
  },

  // =============================================
  // AI FEATURES
  // =============================================
  {
    slug: 'ai:basic',
    name: 'Basic AI Assistant',
    description: 'Ask basic questions to AI assistant',
    category: 'AI Features',
    planLevel: 'free' // Limited queries
  },
  {
    slug: 'ai:full',
    name: 'Full AI Assistant',
    description: 'Unlimited AI queries and advanced features',
    category: 'AI Features',
    planLevel: 'full'
  },
  {
    slug: 'ai:insights',
    name: 'AI Business Insights',
    description: 'AI-powered business recommendations',
    category: 'AI Features',
    planLevel: 'add_on_analytics'
  },
  {
    slug: 'ai:predictive',
    name: 'Predictive Analytics',
    description: 'Demand forecasting and predictions',
    category: 'AI Features',
    planLevel: 'add_on_analytics'
  },

  // =============================================
  // INTEGRATIONS
  // =============================================
  {
    slug: 'integrations:shopify',
    name: 'Shopify Integration',
    description: 'Connect and sync with Shopify',
    category: 'Integrations',
    planLevel: 'full'
  },
  {
    slug: 'integrations:api',
    name: 'API Access',
    description: 'Use platform API for custom integrations',
    category: 'Integrations',
    planLevel: 'full'
  },

  // =============================================
  // POINT OF SALE
  // =============================================
  {
    slug: 'pos:access',
    name: 'Access POS',
    description: 'Use point of sale system',
    category: 'Point of Sale',
    planLevel: 'full'
  },
  {
    slug: 'pos:refunds',
    name: 'Process Refunds',
    description: 'Issue refunds and returns',
    category: 'Point of Sale',
    planLevel: 'full'
  },
  {
    slug: 'pos:reports',
    name: 'View POS Reports',
    description: 'Access POS sales reports',
    category: 'Point of Sale',
    planLevel: 'full'
  }
];

/**
 * Main seeding function
 */
export async function seedPermissions() {
  logger.info('🌱 Starting permission seeding...\n');

  try {
    // Step 1: Insert permission categories
    logger.info('📁 Creating permission categories...');
    
    for (const category of PERMISSION_CATEGORIES) {
      await db.execute(sql`
        INSERT INTO permission_categories (name, description, display_order)
        VALUES (${category.name}, ${category.description}, ${category.displayOrder})
        ON CONFLICT (name) DO UPDATE 
        SET description = EXCLUDED.description,
            display_order = EXCLUDED.display_order
      `);
    }
    
    logger.info(`✅ Created ${PERMISSION_CATEGORIES.length} categories\n`);

    // Step 2: Get category IDs for reference
    const categoryMap = new Map<string, string>();
    const categoriesResult = await db.execute(sql`SELECT id, name FROM permission_categories`);
    
    for (const row of categoriesResult.rows) {
      categoryMap.set(row.name as string, row.id as string);
    }

    // Step 3: Insert permissions
    logger.info('🔐 Creating permissions...');
    let insertedCount = 0;
    let updatedCount = 0;

    for (const perm of PERMISSIONS) {
      const categoryId = categoryMap.get(perm.category);
      
      if (!categoryId) {
        logger.warn(`⚠️  Category not found: ${perm.category} for permission ${perm.slug}`);
        continue;
      }

      const result = await db.execute(sql`
        INSERT INTO permissions (
          permission_key,
          permission_name,
          category,
          category_id,
          plan_level,
          description
        )
        VALUES (
          ${perm.slug},
          ${perm.name},
          ${perm.category},
          ${categoryId},
          ${perm.planLevel},
          ${perm.description}
        )
        ON CONFLICT (permission_key) DO UPDATE
        SET permission_name = EXCLUDED.permission_name,
            category = EXCLUDED.category,
            category_id = EXCLUDED.category_id,
            plan_level = EXCLUDED.plan_level,
            description = EXCLUDED.description
        RETURNING (xmax = 0) AS inserted
      `);

      if (result.rows[0]?.inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    logger.info(`✅ Created ${insertedCount} new permissions`);
    logger.info(`🔄 Updated ${updatedCount} existing permissions\n`);

    // Step 4: Summary
    logger.info('📊 Permission Seeding Summary:');
    logger.info(`   • ${PERMISSION_CATEGORIES.length} categories`);
    logger.info(`   • ${PERMISSIONS.length} total permissions`);
    logger.info(`   • ${PERMISSIONS.filter(p => p.planLevel === 'free').length} free permissions`);
    logger.info(`   • ${PERMISSIONS.filter(p => p.planLevel === 'full').length} full plan permissions`);
    logger.info(`   • ${PERMISSIONS.filter(p => p.planLevel === 'add_on_analytics').length} analytics add-on permissions`);
    logger.info('\n✅ Permission seeding complete!\n');

    return {
      success: true,
      categories: PERMISSION_CATEGORIES.length,
      permissions: PERMISSIONS.length,
      inserted: insertedCount,
      updated: updatedCount
    };

  } catch (error) {
    logger.error('❌ Permission seeding failed:', error);
    throw error;
  }
}

/**
 * Export for use in other scripts
 */
export { PERMISSIONS, PERMISSION_CATEGORIES };

// Run if called directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedPermissions()
    .then(() => {
      logger.info('Done!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}
