/**
 * Comprehensive Test Data Generator
 * Creates realistic test data for ALL features including hidden ones
 * 
 * Run with: npx tsx server/scripts/createComprehensiveTestData.ts
 */

import { db } from '../db';
import { 
  users, companies, patients, orders, prescriptions, 
  appointments, testRooms, inventory, products,
  invoices, invoiceLineItems, notifications,
  eyeExaminations, equipment, userPreferences
} from '@shared/schema';
import { hashPassword } from '../localAuth';
import { sql } from 'drizzle-orm';

const TEST_COMPANY_ID = 'e635e4d5-0a44-4acf-a798-5ca3a450f601';
const TEST_PASSWORD = 'Test123!@#';

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isCompanyAdmin: boolean;
}

async function createComprehensiveTestData() {
  console.log('🚀 Creating comprehensive test data...\n');

  const hashedPassword = await hashPassword(TEST_PASSWORD);

  // ========== STEP 1: CREATE DIVERSE TEST USERS ==========
  console.log('👥 Creating test users...');
  
  const testUsers: TestUser[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'owner@test.com',
      firstName: 'Owner',
      lastName: 'Admin',
      role: 'admin',
      isCompanyAdmin: true
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'ecp1@test.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ecp',
      isCompanyAdmin: true
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'ecp2@test.com',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'ecp',
      isCompanyAdmin: false
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'optometrist@test.com',
      firstName: 'Dr. Emily',
      lastName: 'Roberts',
      role: 'ecp',
      isCompanyAdmin: false
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'lab1@test.com',
      firstName: 'David',
      lastName: 'Martinez',
      role: 'lab_tech',
      isCompanyAdmin: false
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      email: 'lab2@test.com',
      firstName: 'Jennifer',
      lastName: 'Wilson',
      role: 'lab_tech',
      isCompanyAdmin: false
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      email: 'dispenser@test.com',
      firstName: 'Robert',
      lastName: 'Brown',
      role: 'dispenser',
      isCompanyAdmin: false
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      email: 'engineer@test.com',
      firstName: 'Lisa',
      lastName: 'Anderson',
      role: 'engineer',
      isCompanyAdmin: false
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'supplier@test.com',
      firstName: 'James',
      lastName: 'Taylor',
      role: 'supplier',
      isCompanyAdmin: false
    },
  ];

  for (const user of testUsers) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      isCompanyAdmin: user.isCompanyAdmin,
      companyId: TEST_COMPANY_ID,
      accountStatus: 'active',
      subscriptionPlan: 'full',
      isActive: true,
      isVerified: true,
      canPrescribe: ['ecp', 'admin'].includes(user.role),
      canDispense: ['dispenser', 'ecp', 'admin'].includes(user.role),
    }).onConflictDoNothing();
  }
  
  console.log(`   ✅ Created ${testUsers.length} test users`);

  // ========== STEP 2: CREATE TEST PATIENTS ==========
  console.log('\n👤 Creating test patients...');
  
  const patientData = [
    { name: 'John Smith', dob: '1985-05-15', email: 'john.smith@email.com', phone: '555-0101' },
    { name: 'Emma Wilson', dob: '1992-08-22', email: 'emma.wilson@email.com', phone: '555-0102' },
    { name: 'Oliver Brown', dob: '1978-03-10', email: 'oliver.brown@email.com', phone: '555-0103' },
    { name: 'Sophia Davis', dob: '1995-11-30', email: 'sophia.davis@email.com', phone: '555-0104' },
    { name: 'William Miller', dob: '1988-07-18', email: 'william.miller@email.com', phone: '555-0105' },
    { name: 'Ava Garcia', dob: '2000-01-25', email: 'ava.garcia@email.com', phone: '555-0106' },
    { name: 'James Rodriguez', dob: '1970-09-08', email: 'james.rodriguez@email.com', phone: '555-0107' },
    { name: 'Isabella Martinez', dob: '1998-12-14', email: 'isabella.martinez@email.com', phone: '555-0108' },
    { name: 'Lucas Anderson', dob: '1982-04-20', email: 'lucas.anderson@email.com', phone: '555-0109' },
    { name: 'Mia Thompson', dob: '1990-06-05', email: 'mia.thompson@email.com', phone: '555-0110' },
  ];

  const createdPatients = [];
  for (const patient of patientData) {
    const [created] = await db.insert(patients).values({
      name: patient.name,
      dateOfBirth: patient.dob,
      email: patient.email,
      phone: patient.phone,
      companyId: TEST_COMPANY_ID,
      ecpId: testUsers[1].id, // Sarah Johnson (ECP)
      status: 'active',
    }).returning();
    createdPatients.push(created);
  }
  
  console.log(`   ✅ Created ${createdPatients.length} test patients`);

  // ========== STEP 3: CREATE TEST PRESCRIPTIONS ==========
  console.log('\n📋 Creating test prescriptions...');
  
  let prescriptionCount = 0;
  for (let i = 0; i < Math.min(5, createdPatients.length); i++) {
    await db.insert(prescriptions).values({
      patientId: createdPatients[i].id,
      companyId: TEST_COMPANY_ID,
      ecpId: testUsers[3].id, // Dr. Emily Roberts
      prescriptionDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      rightEye: {
        sphere: -2.50,
        cylinder: -0.75,
        axis: 180,
        add: 0,
        prism: 0,
        base: null
      },
      leftEye: {
        sphere: -2.25,
        cylinder: -0.50,
        axis: 175,
        add: 0,
        prism: 0,
        base: null
      },
      pd: 64,
      notes: 'Standard distance prescription for myopia',
      status: 'active',
    }).onConflictDoNothing();
    prescriptionCount++;
  }
  
  console.log(`   ✅ Created ${prescriptionCount} test prescriptions`);

  // ========== STEP 4: CREATE TEST PRODUCTS ==========
  console.log('\n📦 Creating test products...');
  
  const productData = [
    { name: 'Single Vision Lens', category: 'lenses', price: 89.99, stock: 100 },
    { name: 'Progressive Lens', category: 'lenses', price: 249.99, stock: 50 },
    { name: 'Blue Light Filter', category: 'coatings', price: 49.99, stock: 200 },
    { name: 'Anti-Glare Coating', category: 'coatings', price: 39.99, stock: 150 },
    { name: 'Titanium Frame', category: 'frames', price: 199.99, stock: 30 },
    { name: 'Acetate Frame', category: 'frames', price: 149.99, stock: 45 },
    { name: 'Metal Frame', category: 'frames', price: 129.99, stock: 60 },
    { name: 'Cleaning Kit', category: 'accessories', price: 19.99, stock: 100 },
    { name: 'Lens Case', category: 'accessories', price: 9.99, stock: 200 },
    { name: 'Microfiber Cloth', category: 'accessories', price: 4.99, stock: 300 },
  ];

  const createdProducts = [];
  for (const product of productData) {
    const [created] = await db.insert(products).values({
      companyId: TEST_COMPANY_ID,
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stockQuantity: product.stock,
      isActive: true,
    }).returning();
    createdProducts.push(created);
  }
  
  console.log(`   ✅ Created ${createdProducts.length} test products`);

  // ========== STEP 5: CREATE TEST ORDERS ==========
  console.log('\n🛒 Creating test orders...');
  
  const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  let orderCount = 0;
  
  for (let i = 0; i < Math.min(8, createdPatients.length); i++) {
    const status = orderStatuses[i % orderStatuses.length];
    await db.insert(orders).values({
      patientId: createdPatients[i].id,
      companyId: TEST_COMPANY_ID,
      ecpId: testUsers[1].id,
      status: status as any,
      totalAmount: (Math.random() * 500 + 100).toFixed(2),
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Test order ${i + 1} - Status: ${status}`,
    }).onConflictDoNothing();
    orderCount++;
  }
  
  console.log(`   ✅ Created ${orderCount} test orders`);

  // ========== STEP 6: CREATE TEST APPOINTMENTS ==========
  console.log('\n📅 Creating test appointments...');
  
  let appointmentCount = 0;
  const today = new Date();
  
  for (let i = 0; i < Math.min(10, createdPatients.length); i++) {
    const appointmentDate = new Date(today);
    appointmentDate.setDate(today.getDate() + (i - 5)); // Mix of past and future
    appointmentDate.setHours(9 + (i % 8), 0, 0, 0);
    
    const statuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
    const status = i < 5 ? 'completed' : 'scheduled';
    
    await db.insert(appointments).values({
      patientId: createdPatients[i].id,
      providerId: testUsers[3].id, // Dr. Emily Roberts
      companyId: TEST_COMPANY_ID,
      appointmentType: i % 3 === 0 ? 'eye_exam' : 'follow_up',
      scheduledAt: appointmentDate.toISOString(),
      duration: 30,
      status: status as any,
      notes: `${status} appointment for ${createdPatients[i].name}`,
    }).onConflictDoNothing();
    appointmentCount++;
  }
  
  console.log(`   ✅ Created ${appointmentCount} test appointments`);

  // ========== STEP 7: CREATE TEST ROOMS ==========
  console.log('\n🏥 Creating test rooms...');
  
  const roomData = [
    { name: 'Exam Room 1', type: 'examination', capacity: 1 },
    { name: 'Exam Room 2', type: 'examination', capacity: 1 },
    { name: 'Consultation Room', type: 'consultation', capacity: 3 },
    { name: 'Testing Room', type: 'testing', capacity: 2 },
  ];

  let roomCount = 0;
  for (const room of roomData) {
    await db.insert(testRooms).values({
      companyId: TEST_COMPANY_ID,
      name: room.name,
      roomType: room.type,
      capacity: room.capacity,
      isAvailable: true,
      equipment: ['Phoropter', 'Slit Lamp', 'Tonometer'],
    }).onConflictDoNothing();
    roomCount++;
  }
  
  console.log(`   ✅ Created ${roomCount} test rooms`);

  // ========== STEP 8: CREATE TEST EQUIPMENT ==========
  console.log('\n⚙️  Creating test equipment...');
  
  const equipmentData = [
    { name: 'Phoropter Model A', type: 'refraction', status: 'operational' },
    { name: 'Slit Lamp SL-1', type: 'examination', status: 'operational' },
    { name: 'Tonometer T-200', type: 'diagnostic', status: 'operational' },
    { name: 'Auto-Refractor AR-1', type: 'refraction', status: 'operational' },
    { name: 'Keratometer K-500', type: 'diagnostic', status: 'maintenance' },
  ];

  let equipmentCount = 0;
  for (const equip of equipmentData) {
    await db.insert(equipment).values({
      companyId: TEST_COMPANY_ID,
      name: equip.name,
      equipmentType: equip.type,
      status: equip.status as any,
      location: 'Main Office',
      purchaseDate: new Date('2023-01-15').toISOString(),
      lastMaintenanceDate: new Date('2024-10-01').toISOString(),
    }).onConflictDoNothing();
    equipmentCount++;
  }
  
  console.log(`   ✅ Created ${equipmentCount} test equipment items`);

  // ========== STEP 9: CREATE USER PREFERENCES ==========
  console.log('\n⚙️  Setting up user preferences...');
  
  let prefCount = 0;
  for (const user of testUsers.slice(0, 5)) {
    await db.insert(userPreferences).values({
      userId: user.id,
      theme: 'light',
      language: 'en',
      timezone: 'America/New_York',
      emailNotifications: true,
      smsNotifications: false,
      dashboardLayout: 'default',
    }).onConflictDoNothing();
    prefCount++;
  }
  
  console.log(`   ✅ Set preferences for ${prefCount} users`);

  // ========== STEP 10: CREATE TEST NOTIFICATIONS ==========
  console.log('\n🔔 Creating test notifications...');
  
  const notificationTypes = [
    { title: 'New Order Received', message: 'Order #1001 has been placed', type: 'order' },
    { title: 'Appointment Reminder', message: 'You have an appointment tomorrow at 2 PM', type: 'appointment' },
    { title: 'Lab Results Ready', message: 'Lab results for patient John Smith are ready', type: 'lab' },
    { title: 'Low Stock Alert', message: 'Progressive Lenses stock is low (5 remaining)', type: 'inventory' },
    { title: 'Payment Received', message: 'Payment of $250.00 received for invoice #2001', type: 'payment' },
  ];

  let notifCount = 0;
  for (let i = 0; i < testUsers.length && i < notificationTypes.length; i++) {
    await db.insert(notifications).values({
      userId: testUsers[i].id,
      title: notificationTypes[i].title,
      message: notificationTypes[i].message,
      type: notificationTypes[i].type,
      isRead: i % 3 === 0, // Some read, some unread
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).onConflictDoNothing();
    notifCount++;
  }
  
  console.log(`   ✅ Created ${notifCount} test notifications`);

  // ========== SUMMARY ==========
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✨ Comprehensive Test Data Creation Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📊 Summary:');
  console.log(`   👥 Users: ${testUsers.length}`);
  console.log(`   👤 Patients: ${createdPatients.length}`);
  console.log(`   📋 Prescriptions: ${prescriptionCount}`);
  console.log(`   📦 Products: ${createdProducts.length}`);
  console.log(`   🛒 Orders: ${orderCount}`);
  console.log(`   📅 Appointments: ${appointmentCount}`);
  console.log(`   🏥 Test Rooms: ${roomCount}`);
  console.log(`   ⚙️  Equipment: ${equipmentCount}`);
  console.log(`   🔔 Notifications: ${notifCount}`);
  console.log(`   ⚙️  User Preferences: ${prefCount}\n`);

  console.log('🔑 Test User Credentials:');
  console.log('   Password for ALL users: Test123!@#\n');
  
  console.log('   👨‍💼 Admin/Owner:');
  console.log('      owner@test.com - Company Admin');
  console.log('      admin@test.com - Company Admin\n');
  
  console.log('   👨‍⚕️ Eye Care Professionals:');
  console.log('      ecp1@test.com (Sarah) - Company Admin');
  console.log('      ecp2@test.com (Michael)');
  console.log('      optometrist@test.com (Dr. Emily)\n');
  
  console.log('   🔬 Lab Staff:');
  console.log('      lab1@test.com (David)');
  console.log('      lab2@test.com (Jennifer)\n');
  
  console.log('   👓 Other Roles:');
  console.log('      dispenser@test.com (Robert)');
  console.log('      engineer@test.com (Lisa)');
  console.log('      supplier@test.com (James)\n');

  console.log('🌐 Access at: http://localhost:5005');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the script
createComprehensiveTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  });
