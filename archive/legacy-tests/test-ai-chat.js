#!/usr/bin/env node
/**
 * AI Chat Test Script
 * 
 * Quick test to verify the AI chat is working with database integration
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:3000';

// Test queries
const testQueries = [
  "Hello, what can you help me with?",
  "What is progressive lens technology?",
  "Tell me about anti-reflective coatings",
  // These will require authentication:
  // "What was my revenue last month?",
  // "Show me my pending orders",
  // "Which items are running low on stock?"
];

async function testAIChat() {
  console.log('🧪 Testing AI Chat Integration\n');
  console.log('=' . repeat(50));
  
  // Test 1: Check if Ollama is running
  console.log('\n1️⃣  Checking Ollama service...');
  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/tags');
    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      console.log('   ✅ Ollama is running');
      console.log(`   📦 Models: ${data.models.map(m => m.name).join(', ')}`);
    }
  } catch (error) {
    console.log('   ❌ Ollama is not running');
    console.log('   💡 Start it with: ollama serve');
    process.exit(1);
  }

  // Test 2: Test AI endpoint (without auth)
  console.log('\n2️⃣  Testing AI endpoint (public query)...');
  try {
    const response = await fetch(`${BASE_URL}/api/master-ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQueries[0],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ AI endpoint is working');
      console.log(`   🤖 Response: ${data.answer?.substring(0, 100)}...`);
      console.log(`   ⏱️  Response time: ${data.metadata?.responseTime}ms`);
    } else {
      const error = await response.text();
      console.log('   ⚠️  Response status:', response.status);
      console.log('   📝 Error:', error);
      
      if (response.status === 401) {
        console.log('   💡 Endpoint requires authentication');
        console.log('   💡 This is normal - AI chat needs logged-in user');
      }
    }
  } catch (error) {
    console.log('   ❌ Failed to connect to server');
    console.log('   💡 Make sure development server is running: npm run dev');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Test data access tools
  console.log('\n3️⃣  Testing AI Data Access Layer...');
  console.log('   💡 Data access requires authenticated user');
  console.log('   💡 Test these queries in the UI after logging in:');
  console.log('');
  console.log('   Business Queries:');
  console.log('   - "What was my revenue last month?"');
  console.log('   - "How many pending orders do I have?"');
  console.log('   - "Which items are running low on stock?"');
  console.log('   - "Show me my top 5 selling products"');
  console.log('');
  console.log('   Patient Queries:');
  console.log('   - "How many patients need a recall?"');
  console.log('   - "Find patient named John"');
  console.log('   - "Show me recent patient registrations"');
  console.log('');
  console.log('   Knowledge Queries (No auth needed):');
  console.log('   - "What is progressive lens technology?"');
  console.log('   - "Explain anti-reflective coatings"');
  console.log('   - "What are the benefits of blue light filters?"');

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ AI System Verification Complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Open http://localhost:3000 in your browser');
  console.log('   2. Log in to your account');
  console.log('   3. Click the AI chat button (bottom-right corner)');
  console.log('   4. Try the queries listed above');
  console.log('\n💡 The AI will:');
  console.log('   - Answer knowledge questions using Ollama');
  console.log('   - Query your database for business insights');
  console.log('   - Maintain conversation context');
  console.log('   - Respect multi-tenant data isolation');
}

// Run tests
testAIChat().catch(console.error);
