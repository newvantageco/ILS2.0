/**
 * Marketplace API Test Script
 * Tests the Company Marketplace endpoints (Chunk 6)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authCookie = '';

// Test user credentials
const TEST_USER = {
  email: 'admin@newvantage.com',
  password: 'admin123'
};

/**
 * Login and get session cookie
 */
async function login() {
  try {
    console.log('\n🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/api/auth/login-email`, TEST_USER, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Extract session cookie
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      authCookie = cookies[0].split(';')[0];
      console.log('✅ Login successful');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Make authenticated request
 */
async function makeRequest(method, path, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Test: Get marketplace stats
 */
async function testGetStats() {
  console.log('\n📊 Test: Get Marketplace Stats');
  const result = await makeRequest('GET', '/api/marketplace/stats');
  
  if (result.success) {
    console.log('✅ Stats retrieved successfully:');
    console.log('   Total companies:', result.data.totalCompanies);
    console.log('   Total connections:', result.data.totalConnections);
    console.log('   By type:', JSON.stringify(result.data.companiesByType));
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Search marketplace
 */
async function testSearchMarketplace() {
  console.log('\n🔍 Test: Search Marketplace');
  const result = await makeRequest('GET', '/api/marketplace/search?limit=10');
  
  if (result.success) {
    console.log('✅ Search successful:');
    console.log(`   Found ${result.data.companies.length} companies`);
    if (result.data.companies.length > 0) {
      console.log(`   First: ${result.data.companies[0].name} (${result.data.companies[0].type})`);
    }
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Search by type
 */
async function testSearchByType() {
  console.log('\n🔍 Test: Search Labs');
  const result = await makeRequest('GET', '/api/marketplace/search?companyType=lab&limit=5');
  
  if (result.success) {
    console.log('✅ Search successful:');
    console.log(`   Found ${result.data.companies.length} labs`);
    result.data.companies.forEach((company, i) => {
      console.log(`   ${i + 1}. ${company.name} - ${company.connectionStatus}`);
    });
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Get my profile
 */
async function testGetMyProfile() {
  console.log('\n👤 Test: Get My Profile');
  const result = await makeRequest('GET', '/api/marketplace/my-profile');
  
  if (result.success) {
    console.log('✅ Profile retrieved:');
    console.log(`   Company: ${result.data.name} (${result.data.type})`);
    console.log(`   Profile exists: ${!!result.data.profile}`);
    if (result.data.profile) {
      console.log(`   Connections: ${result.data.profile.connectionsCount || 0}`);
    }
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Update my profile
 */
async function testUpdateMyProfile() {
  console.log('\n✏️  Test: Update My Profile');
  
  const profileData = {
    profileHeadline: 'Leading Optical Solutions Provider',
    profileDescription: 'We provide high-quality optical solutions with fast turnaround times.',
    tagline: 'Quality Vision Care',
    specialties: ['single_vision', 'progressive', 'sunglasses'],
    isMarketplaceVisible: true,
  };
  
  const result = await makeRequest('PUT', '/api/marketplace/my-profile', profileData);
  
  if (result.success) {
    console.log('✅ Profile updated:');
    console.log(`   Headline: ${result.data.profileHeadline}`);
    console.log(`   Specialties: ${result.data.specialties?.length || 0}`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Get company profile by ID
 */
async function testGetCompanyProfile(companyId) {
  console.log('\n🏢 Test: Get Company Profile');
  const result = await makeRequest('GET', `/api/marketplace/companies/${companyId}`);
  
  if (result.success) {
    console.log('✅ Profile retrieved:');
    console.log(`   Company: ${result.data.name}`);
    console.log(`   Type: ${result.data.type}`);
    console.log(`   Status: ${result.data.connectionStatus}`);
    console.log(`   Can connect: ${result.data.canConnect}`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Request connection
 */
async function testRequestConnection(targetCompanyId) {
  console.log('\n🤝 Test: Request Connection');
  
  const requestData = {
    targetCompanyId,
    message: 'Hi, I would like to connect and explore potential collaboration opportunities.',
    proposedTerms: 'Standard partnership terms'
  };
  
  const result = await makeRequest('POST', '/api/marketplace/connections/request', requestData);
  
  if (result.success) {
    console.log('✅ Connection request sent:');
    console.log(`   Request ID: ${result.data.id}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Expires: ${new Date(result.data.expiresAt).toLocaleDateString()}`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Get connection requests
 */
async function testGetConnectionRequests() {
  console.log('\n📬 Test: Get Connection Requests (All)');
  const result = await makeRequest('GET', '/api/marketplace/connections/requests?type=all');
  
  if (result.success) {
    console.log('✅ Requests retrieved:');
    console.log(`   Total: ${result.data.length}`);
    result.data.forEach((req, i) => {
      console.log(`   ${i + 1}. ${req.direction} - ${req.status} - From: ${req.fromCompany?.name || 'Unknown'}`);
    });
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Get incoming requests
 */
async function testGetIncomingRequests() {
  console.log('\n📥 Test: Get Incoming Requests');
  const result = await makeRequest('GET', '/api/marketplace/connections/requests?type=incoming');
  
  if (result.success) {
    console.log('✅ Incoming requests:');
    console.log(`   Total: ${result.data.length}`);
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Test: Get active connections
 */
async function testGetConnections() {
  console.log('\n🔗 Test: Get Active Connections');
  const result = await makeRequest('GET', '/api/marketplace/connections?status=active');
  
  if (result.success) {
    console.log('✅ Connections retrieved:');
    console.log(`   Total: ${result.data.length}`);
    result.data.forEach((conn, i) => {
      console.log(`   ${i + 1}. ${conn.connectedCompany?.name} (${conn.relationshipType})`);
    });
  } else {
    console.log('❌ Failed:', result.error);
  }
  
  return result;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   MARKETPLACE API TEST SUITE (Chunk 6)             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Run tests
  await testGetStats();
  await testGetMyProfile();
  await testUpdateMyProfile();
  await testSearchMarketplace();
  await testSearchByType();
  
  // Get a company to test connection with
  const searchResult = await makeRequest('GET', '/api/marketplace/search?companyType=lab&limit=1');
  if (searchResult.success && searchResult.data.companies.length > 0) {
    const targetCompany = searchResult.data.companies[0];
    console.log(`\n📌 Target company for connection tests: ${targetCompany.name}`);
    
    await testGetCompanyProfile(targetCompany.id);
    
    // Only request connection if not already connected
    if (targetCompany.connectionStatus === 'not_connected' && targetCompany.canConnect) {
      await testRequestConnection(targetCompany.id);
    } else {
      console.log(`\n⚠️  Skipping connection request (status: ${targetCompany.connectionStatus})`);
    }
  }
  
  await testGetConnectionRequests();
  await testGetIncomingRequests();
  await testGetConnections();
  
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   TEST SUITE COMPLETE                              ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
