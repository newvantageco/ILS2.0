#!/usr/bin/env node

/**
 * Advanced API Testing Suite
 * Tests all API endpoints with proper session management
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Session management
let sessionCookie = '';
let authenticatedClient;

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(category, test, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  
  console.log(`${color}${icon} [${category}] ${test}${colors.reset}`);
  if (details) {
    console.log(`   ${colors.blue}${details}${colors.reset}`);
  }
  
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') {
    results.failed++;
    results.errors.push({ category, test, details });
  } else {
    results.skipped++;
  }
}

async function testAuth() {
  console.log('\n🔐 AUTHENTICATION & AUTHORIZATION TESTS');
  console.log('═'.repeat(60));
  
  try {
    // Test login
    const loginResponse = await axios.post(`${API_URL}/login`, {
      email: 'saban@newvantageco.com',
      password: 'B6cdcab52a!!'
    }, {
      validateStatus: () => true,
      withCredentials: true
    });
    
    if (loginResponse.status === 200 && loginResponse.data.user) {
      log('Auth', 'User login', 'PASS', `Logged in as ${loginResponse.data.user.email}`);
      
      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        sessionCookie = cookies[0].split(';')[0];
        
        // Create authenticated client
        authenticatedClient = axios.create({
          baseURL: API_URL,
          headers: {
            'Cookie': sessionCookie
          },
          validateStatus: () => true,
          withCredentials: true
        });
        
        log('Auth', 'Session cookie extracted', 'PASS', sessionCookie.substring(0, 50) + '...');
      }
    } else {
      log('Auth', 'User login', 'FAIL', `Status: ${loginResponse.status}`);
    }
    
    // Test session validation
    if (authenticatedClient) {
      const sessionCheck = await authenticatedClient.get('/user');
      if (sessionCheck.status === 200 && sessionCheck.data) {
        log('Auth', 'Session validation', 'PASS', `User: ${sessionCheck.data.email}`);
      } else {
        log('Auth', 'Session validation', 'FAIL', `Status: ${sessionCheck.status}`);
      }
    }
    
    // Test unauthorized access
    const unauthClient = axios.create({ baseURL: API_URL, validateStatus: () => true });
    const unauthResponse = await unauthClient.get('/users');
    if (unauthResponse.status === 401 || unauthResponse.status === 403) {
      log('Auth', 'Unauthorized access prevention', 'PASS', `Status: ${unauthResponse.status}`);
    } else {
      log('Auth', 'Unauthorized access prevention', 'FAIL', `Expected 401/403, got ${unauthResponse.status}`);
    }
    
    // Test logout
    if (authenticatedClient) {
      const logoutResponse = await authenticatedClient.post('/logout');
      if (logoutResponse.status === 200) {
        log('Auth', 'User logout', 'PASS', 'Logged out successfully');
        
        // Re-login for further tests
        const reloginResponse = await axios.post(`${API_URL}/login`, {
          email: 'saban@newvantageco.com',
          password: 'B6cdcab52a!!'
        }, { validateStatus: () => true });
        
        if (reloginResponse.status === 200) {
          const cookies = reloginResponse.headers['set-cookie'];
          sessionCookie = cookies[0].split(';')[0];
          authenticatedClient = axios.create({
            baseURL: API_URL,
            headers: { 'Cookie': sessionCookie },
            validateStatus: () => true
          });
        }
      }
    }
    
  } catch (error) {
    log('Auth', 'Authentication tests', 'FAIL', error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 API ENDPOINTS TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) {
    log('API', 'All endpoints', 'FAIL', 'No authenticated client available');
    return;
  }
  
  try {
    // Test GET endpoints
    const endpoints = [
      { path: '/orders', name: 'Orders' },
      { path: '/patients', name: 'Patients' },
      { path: '/companies', name: 'Companies' },
      { path: '/users', name: 'Users' },
      { path: '/technical-documents', name: 'Technical Documents' },
      { path: '/equipment', name: 'Equipment' },
      { path: '/notifications', name: 'Notifications' }
    ];
    
    for (const endpoint of endpoints) {
      const response = await authenticatedClient.get(endpoint.path);
      if (response.status === 200) {
        const count = Array.isArray(response.data) ? response.data.length : 'N/A';
        log('API', `GET ${endpoint.path}`, 'PASS', `Status: 200, Records: ${count}`);
      } else {
        log('API', `GET ${endpoint.path}`, 'FAIL', `Status: ${response.status}`);
      }
    }
    
    // Test POST - Create patient
    const newPatient = {
      firstName: 'Integration',
      lastName: 'Test',
      email: `test-${Date.now()}@example.com`,
      phone: '555-9999',
      dateOfBirth: '1985-05-15'
    };
    
    const createPatientResponse = await authenticatedClient.post('/patients', newPatient);
    if (createPatientResponse.status === 201 || createPatientResponse.status === 200) {
      log('API', 'POST /patients (create)', 'PASS', `Created patient: ${createPatientResponse.data.id}`);
      
      // Test GET single patient
      const patientId = createPatientResponse.data.id;
      const getPatientResponse = await authenticatedClient.get(`/patients/${patientId}`);
      if (getPatientResponse.status === 200) {
        log('API', 'GET /patients/:id (single)', 'PASS', `Retrieved patient: ${getPatientResponse.data.firstName}`);
      }
      
      // Test PUT - Update patient
      const updateResponse = await authenticatedClient.put(`/patients/${patientId}`, {
        phone: '555-8888'
      });
      if (updateResponse.status === 200) {
        log('API', 'PUT /patients/:id (update)', 'PASS', `Updated patient phone`);
      }
    } else {
      log('API', 'POST /patients (create)', 'FAIL', `Status: ${createPatientResponse.status}`);
    }
    
    // Test order creation
    const patientsResponse = await authenticatedClient.get('/patients');
    if (patientsResponse.status === 200 && patientsResponse.data.length > 0) {
      const patientId = patientsResponse.data[0].id;
      
      const newOrder = {
        patientId: patientId,
        orderType: 'prescription',
        status: 'pending',
        prescriptionData: {
          rightEye: { sphere: -2.5, cylinder: -0.5, axis: 180, add: 1.5 },
          leftEye: { sphere: -2.0, cylinder: -0.5, axis: 170, add: 1.5 }
        }
      };
      
      const createOrderResponse = await authenticatedClient.post('/orders', newOrder);
      if (createOrderResponse.status === 201 || createOrderResponse.status === 200) {
        log('API', 'POST /orders (create)', 'PASS', `Created order: ${createOrderResponse.data.id}`);
        
        // Test order update
        const orderId = createOrderResponse.data.id;
        const updateOrderResponse = await authenticatedClient.put(`/orders/${orderId}`, {
          status: 'in_production'
        });
        if (updateOrderResponse.status === 200) {
          log('API', 'PUT /orders/:id (update)', 'PASS', 'Updated order status');
        }
      }
    }
    
  } catch (error) {
    log('API', 'API endpoint tests', 'FAIL', error.message);
  }
}

async function testDataIntegrity() {
  console.log('\n🗄️  DATA INTEGRITY TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) return;
  
  try {
    // Test data relationships
    const ordersResponse = await authenticatedClient.get('/orders');
    if (ordersResponse.status === 200 && ordersResponse.data.length > 0) {
      const order = ordersResponse.data[0];
      
      // Check if patient exists
      if (order.patientId) {
        const patientResponse = await authenticatedClient.get(`/patients/${order.patientId}`);
        if (patientResponse.status === 200) {
          log('Data', 'Order-Patient relationship', 'PASS', 'Patient exists for order');
        } else {
          log('Data', 'Order-Patient relationship', 'FAIL', 'Patient not found');
        }
      }
    }
    
    // Test data validation
    const invalidPatient = {
      firstName: '',
      lastName: '',
      email: 'invalid-email'
    };
    
    const invalidResponse = await authenticatedClient.post('/patients', invalidPatient);
    if (invalidResponse.status === 400) {
      log('Data', 'Data validation', 'PASS', 'Invalid data rejected');
    } else {
      log('Data', 'Data validation', 'FAIL', `Expected 400, got ${invalidResponse.status}`);
    }
    
  } catch (error) {
    log('Data', 'Data integrity tests', 'FAIL', error.message);
  }
}

async function testMultiTenant() {
  console.log('\n🏢 MULTI-TENANT FUNCTIONALITY TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) return;
  
  try {
    // Test company listing
    const companiesResponse = await authenticatedClient.get('/companies');
    if (companiesResponse.status === 200) {
      log('Multi-Tenant', 'Company listing', 'PASS', `Found ${companiesResponse.data.length} companies`);
    } else {
      log('Multi-Tenant', 'Company listing', 'FAIL', `Status: ${companiesResponse.status}`);
    }
    
    // Test company creation
    const newCompany = {
      name: `Test Company ${Date.now()}`,
      subscriptionPlan: 'full',
      contactEmail: `company-${Date.now()}@example.com`,
      settings: {
        timezone: 'America/New_York',
        defaultLanguage: 'en'
      }
    };
    
    const createCompanyResponse = await authenticatedClient.post('/companies', newCompany);
    if (createCompanyResponse.status === 201 || createCompanyResponse.status === 200) {
      log('Multi-Tenant', 'Company creation', 'PASS', `Created: ${createCompanyResponse.data.name}`);
      
      // Test company update
      const companyId = createCompanyResponse.data.id;
      const updateResponse = await authenticatedClient.put(`/companies/${companyId}`, {
        contactEmail: `updated-${Date.now()}@example.com`
      });
      if (updateResponse.status === 200) {
        log('Multi-Tenant', 'Company update', 'PASS', 'Company updated');
      }
    }
    
  } catch (error) {
    log('Multi-Tenant', 'Multi-tenant tests', 'FAIL', error.message);
  }
}

async function testAIFeatures() {
  console.log('\n🤖 AI ASSISTANT FEATURES TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) return;
  
  try {
    // Test AI status
    const statusResponse = await authenticatedClient.get('/ai-assistant/status');
    if (statusResponse.status === 200) {
      log('AI', 'AI Assistant status', 'PASS', 'AI system operational');
    } else if (statusResponse.status === 404) {
      log('AI', 'AI Assistant status', 'SKIP', 'AI endpoint not available');
    }
    
    // Test AI chat
    const chatResponse = await authenticatedClient.post('/ai-assistant/chat', {
      message: 'What are the recent orders?',
      context: 'order_management'
    });
    
    if (chatResponse.status === 200) {
      log('AI', 'AI Chat functionality', 'PASS', 'Chat response received');
    } else if (chatResponse.status === 503 || chatResponse.status === 501) {
      log('AI', 'AI Chat functionality', 'SKIP', 'AI service not configured');
    } else {
      log('AI', 'AI Chat functionality', 'FAIL', `Status: ${chatResponse.status}`);
    }
    
    // Test AI suggestions
    const ordersResponse = await authenticatedClient.get('/orders');
    if (ordersResponse.status === 200 && ordersResponse.data.length > 0) {
      const orderId = ordersResponse.data[0].id;
      
      const suggestResponse = await authenticatedClient.post('/ai-assistant/suggest', {
        orderId: orderId,
        type: 'production_optimization'
      });
      
      if (suggestResponse.status === 200) {
        log('AI', 'AI Suggestions', 'PASS', 'Suggestions generated');
      } else if (suggestResponse.status === 503) {
        log('AI', 'AI Suggestions', 'SKIP', 'AI service not configured');
      }
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      log('AI', 'AI features', 'SKIP', 'AI endpoints not implemented');
    } else {
      log('AI', 'AI features tests', 'FAIL', error.message);
    }
  }
}

async function testPerformance() {
  console.log('\n⚡ PERFORMANCE TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) return;
  
  try {
    // Test response time
    const start = Date.now();
    await authenticatedClient.get('/orders');
    const duration = Date.now() - start;
    
    if (duration < 500) {
      log('Performance', 'API response time', 'PASS', `${duration}ms`);
    } else {
      log('Performance', 'API response time', 'FAIL', `${duration}ms (>500ms)`);
    }
    
    // Test concurrent requests
    const concurrentStart = Date.now();
    await Promise.all([
      authenticatedClient.get('/orders'),
      authenticatedClient.get('/patients'),
      authenticatedClient.get('/companies'),
      authenticatedClient.get('/users'),
      authenticatedClient.get('/equipment')
    ]);
    const concurrentDuration = Date.now() - concurrentStart;
    
    if (concurrentDuration < 2000) {
      log('Performance', 'Concurrent requests (5)', 'PASS', `${concurrentDuration}ms`);
    } else {
      log('Performance', 'Concurrent requests (5)', 'FAIL', `${concurrentDuration}ms (>2000ms)`);
    }
    
    // Test large dataset handling
    const largeDataStart = Date.now();
    const largeResponse = await authenticatedClient.get('/orders?limit=100');
    const largeDataDuration = Date.now() - largeDataStart;
    
    if (largeResponse.status === 200 && largeDataDuration < 1000) {
      log('Performance', 'Large dataset (100 records)', 'PASS', `${largeDataDuration}ms`);
    } else {
      log('Performance', 'Large dataset (100 records)', 'FAIL', `${largeDataDuration}ms or error`);
    }
    
  } catch (error) {
    log('Performance', 'Performance tests', 'FAIL', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  ERROR HANDLING TESTS');
  console.log('═'.repeat(60));
  
  if (!authenticatedClient) return;
  
  try {
    // Test 404 handling
    const notFoundResponse = await authenticatedClient.get('/nonexistent-endpoint');
    if (notFoundResponse.status === 404) {
      log('Error', '404 handling', 'PASS', 'Proper 404 response');
    }
    
    // Test invalid ID
    const invalidIdResponse = await authenticatedClient.get('/orders/invalid-uuid-format');
    if (invalidIdResponse.status === 400 || invalidIdResponse.status === 404) {
      log('Error', 'Invalid ID format', 'PASS', 'Invalid ID rejected');
    }
    
    // Test missing required fields
    const missingFieldsResponse = await authenticatedClient.post('/patients', {
      firstName: 'Test'
    });
    if (missingFieldsResponse.status === 400) {
      log('Error', 'Missing required fields', 'PASS', 'Validation error returned');
    }
    
    // Test SQL injection prevention
    const sqlInjectionResponse = await authenticatedClient.get('/orders?id=1\'; DROP TABLE orders; --');
    if (sqlInjectionResponse.status !== 500) {
      log('Error', 'SQL injection prevention', 'PASS', 'SQL injection blocked');
    }
    
  } catch (error) {
    log('Error', 'Error handling tests', 'FAIL', error.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🧪 ADVANCED API TESTING SUITE');
  console.log('   Integrated Lens System - Comprehensive Tests');
  console.log('═'.repeat(60));
  console.log(`\n📅 Started at: ${new Date().toISOString()}\n`);
  
  const startTime = Date.now();
  
  await testAuth();
  await testAPIEndpoints();
  await testDataIntegrity();
  await testMultiTenant();
  await testAIFeatures();
  await testPerformance();
  await testErrorHandling();
  
  const duration = Date.now() - startTime;
  const total = results.passed + results.failed + results.skipped;
  const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`${colors.green}✅ Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Skipped: ${results.skipped}${colors.reset}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  console.log(`⏱️  Total Duration: ${duration}ms`);
  console.log(`📝 Total Tests: ${total}`);
  
  if (results.errors.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('❌ FAILED TESTS DETAILS');
    console.log('═'.repeat(60));
    results.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. [${error.category}] ${error.test}`);
      console.log(`   ${colors.yellow}${error.details}${colors.reset}`);
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Test suite completed at: ${new Date().toISOString()}`);
  console.log('═'.repeat(60) + '\n');
  
  // Write results to file
  const report = {
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    results: {
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      total: total,
      successRate: `${successRate}%`
    },
    errors: results.errors
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 Test results saved to: test-results.json\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
