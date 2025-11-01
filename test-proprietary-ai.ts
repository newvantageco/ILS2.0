/**
 * Test script for Proprietary AI Service
 * Tests topic classification without requiring full authentication
 */

import { ProprietaryAIService } from './server/services/ProprietaryAIService';
import { storage } from './server/storage';

async function testProprietaryAI() {
  console.log('=================================');
  console.log('Proprietary AI Service Tests');
  console.log('=================================\n');

  const aiService = new ProprietaryAIService(storage);

  // Test 1: On-topic question (should accept)
  console.log('Test 1: Optometry Question (Should Accept)');
  console.log('Question: "What lens material is best for high prescriptions?"\n');
  
  try {
    const result1 = await aiService.ask({
      question: 'What lens material is best for high prescriptions?',
      companyId: 'test-company-id',
      userId: 'test-user-id'
    });
    
    console.log('✅ Result:');
    console.log(`   Topic Relevant: ${result1.isTopicRelevant}`);
    console.log(`   Confidence: ${result1.confidence}`);
    console.log(`   Learning Phase: ${result1.learningPhase}`);
    console.log(`   Used External AI: ${result1.usedExternalAI}`);
    console.log(`   Answer Preview: ${result1.answer.substring(0, 100)}...\n`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: Off-topic question (should reject)
  console.log('=================================');
  console.log('Test 2: Off-Topic Question (Should Reject)');
  console.log('Question: "What is the weather like today?"\n');
  
  try {
    const result2 = await aiService.ask({
      question: 'What is the weather like today?',
      companyId: 'test-company-id',
      userId: 'test-user-id'
    });
    
    console.log('✅ Result:');
    console.log(`   Topic Relevant: ${result2.isTopicRelevant}`);
    console.log(`   Rejection Reason: ${result2.topicRejectionReason}`);
    console.log(`   Confidence: ${result2.confidence}`);
    console.log(`   Answer: ${result2.answer}\n`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Spectacle dispensing question (should accept)
  console.log('=================================');
  console.log('Test 3: Spectacle Dispensing Question (Should Accept)');
  console.log('Question: "How do I measure pupillary distance accurately?"\n');
  
  try {
    const result3 = await aiService.ask({
      question: 'How do I measure pupillary distance accurately?',
      companyId: 'test-company-id',
      userId: 'test-user-id'
    });
    
    console.log('✅ Result:');
    console.log(`   Topic Relevant: ${result3.isTopicRelevant}`);
    console.log(`   Confidence: ${result3.confidence}`);
    console.log(`   Sources: ${result3.sources.length} sources`);
    console.log(`   Answer Preview: ${result3.answer.substring(0, 100)}...\n`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Ambiguous question
  console.log('=================================');
  console.log('Test 4: Ambiguous Question');
  console.log('Question: "Tell me about progressive technology"\n');
  
  try {
    const result4 = await aiService.ask({
      question: 'Tell me about progressive technology',
      companyId: 'test-company-id',
      userId: 'test-user-id'
    });
    
    console.log('✅ Result:');
    console.log(`   Topic Relevant: ${result4.isTopicRelevant}`);
    console.log(`   Confidence: ${result4.confidence}`);
    if (result4.isTopicRelevant) {
      console.log(`   Answer Preview: ${result4.answer.substring(0, 100)}...\n`);
    } else {
      console.log(`   Rejection Reason: ${result4.topicRejectionReason}\n`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 5: Another off-topic (programming)
  console.log('=================================');
  console.log('Test 5: Programming Question (Should Reject)');
  console.log('Question: "How do I write a Python function?"\n');
  
  try {
    const result5 = await aiService.ask({
      question: 'How do I write a Python function?',
      companyId: 'test-company-id',
      userId: 'test-user-id'
    });
    
    console.log('✅ Result:');
    console.log(`   Topic Relevant: ${result5.isTopicRelevant}`);
    console.log(`   Rejection Reason: ${result5.topicRejectionReason || 'N/A'}`);
    console.log(`   Answer: ${result5.answer}\n`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log('=================================');
  console.log('All Tests Complete!');
  console.log('=================================');
  
  process.exit(0);
}

// Run tests
testProprietaryAI().catch(console.error);
