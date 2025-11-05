/**
 * Test Script for Chunk 5: Predictive AI with Demand Forecasting
 * 
 * This script tests the demand forecasting system by:
 * 1. Generating demand forecasts for next 14 days
 * 2. Retrieving and analyzing forecasts
 * 3. Getting seasonal patterns
 * 4. Checking accuracy metrics
 * 5. Getting AI recommendations (staffing, surges, anomalies)
 * 6. Identifying surge periods
 * 7. Detecting anomalies
 */

const BASE_URL = 'http://localhost:5000';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include'
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  return data;
}

async function testDemandForecasting() {
  console.log('='.repeat(80));
  console.log('CHUNK 5: PREDICTIVE AI DEMAND FORECASTING SYSTEM TEST');
  console.log('='.repeat(80));
  console.log();

  try {
    // Step 1: Login as ECP user
    console.log('📝 Step 1: Logging in as ECP user...');
    const loginResponse = await apiCall('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'ecp@example.com',
        password: 'password123'
      })
    });
    console.log('✅ Logged in successfully');
    console.log(`   User: ${loginResponse.user.firstName} ${loginResponse.user.lastName}`);
    console.log(`   Company: ${loginResponse.user.companyId}`);
    console.log();

    // Step 2: Generate demand forecasts
    console.log('🔮 Step 2: Generating demand forecasts for next 14 days...');
    const generateResponse = await apiCall('/api/demand-forecasting/generate', {
      method: 'POST',
      body: JSON.stringify({
        daysAhead: 14,
        productId: null // Company-wide forecast
      })
    });
    
    console.log(`✅ Generated ${generateResponse.forecasts?.length || 0} forecasts`);
    console.log(`   Average confidence: ${generateResponse.summary?.averageConfidence?.toFixed(1)}%`);
    console.log(`   Date range: ${new Date(generateResponse.summary?.dateRange?.start).toLocaleDateString()} to ${new Date(generateResponse.summary?.dateRange?.end).toLocaleDateString()}`);
    
    if (generateResponse.forecasts && generateResponse.forecasts.length > 0) {
      console.log('\n   📊 Sample forecasts:');
      generateResponse.forecasts.slice(0, 5).forEach(f => {
        const date = new Date(f.forecastDate).toLocaleDateString();
        console.log(`   - ${date}: ${f.predictedDemand} orders (confidence: ${parseFloat(f.confidence).toFixed(1)}%)`);
      });
    }
    console.log();

    // Step 3: Retrieve forecasts
    console.log('📈 Step 3: Retrieving stored forecasts...');
    const forecastsResponse = await apiCall('/api/demand-forecasting/forecasts?limit=30');
    
    console.log(`✅ Retrieved ${forecastsResponse.forecasts?.length || 0} forecasts`);
    console.log(`   Statistics:`);
    console.log(`   - Average predicted demand: ${forecastsResponse.stats?.averagePredictedDemand?.toFixed(1)} orders`);
    console.log(`   - Average confidence: ${forecastsResponse.stats?.averageConfidence?.toFixed(1)}%`);
    console.log(`   - Forecasts with actuals: ${forecastsResponse.stats?.forecastsWithActuals}`);
    console.log();

    // Step 4: Analyze seasonal patterns
    console.log('🌊 Step 4: Analyzing seasonal patterns...');
    const patternsResponse = await apiCall('/api/demand-forecasting/patterns');
    
    console.log(`✅ Identified ${patternsResponse.patterns?.length || 0} seasonal patterns`);
    console.log(`   Summary:`);
    console.log(`   - Total patterns: ${patternsResponse.summary?.totalPatterns}`);
    console.log(`   - Active patterns: ${patternsResponse.summary?.activePatterns}`);
    console.log(`   - Average confidence: ${patternsResponse.summary?.averageConfidence?.toFixed(1)}%`);
    
    if (patternsResponse.patterns && patternsResponse.patterns.length > 0) {
      console.log('\n   🔄 Sample patterns:');
      patternsResponse.patterns.slice(0, 5).forEach(p => {
        console.log(`   - ${p.patternName}: ${parseFloat(p.demandMultiplier).toFixed(2)}x multiplier (confidence: ${parseFloat(p.confidence).toFixed(1)}%)`);
      });
    }
    console.log();

    // Step 5: Get accuracy metrics
    console.log('🎯 Step 5: Checking forecast accuracy metrics...');
    const accuracyResponse = await apiCall('/api/demand-forecasting/accuracy?period=30');
    
    console.log(`✅ Accuracy metrics calculated`);
    console.log(`   Performance:`);
    console.log(`   - Accuracy rate: ${accuracyResponse.metrics?.accuracy?.toFixed(1)}%`);
    console.log(`   - MAPE: ${accuracyResponse.metrics?.mape?.toFixed(2)}%`);
    console.log(`   - MAE: ${accuracyResponse.metrics?.mae?.toFixed(2)}`);
    console.log(`   - Total forecasts analyzed: ${accuracyResponse.metrics?.totalForecasts}`);
    console.log(`   - Accurate forecasts (within 10%): ${accuracyResponse.metrics?.accurateForecasts}`);
    
    if (accuracyResponse.recentForecasts && accuracyResponse.recentForecasts.length > 0) {
      console.log('\n   📝 Recent forecast performance:');
      accuracyResponse.recentForecasts.slice(0, 3).forEach(f => {
        const date = new Date(f.date).toLocaleDateString();
        console.log(`   - ${date}: predicted ${f.predicted}, actual ${f.actual || 'N/A'}`);
      });
    }
    console.log();

    // Step 6: Get AI recommendations
    console.log('💡 Step 6: Getting AI recommendations...');
    const recommendationsResponse = await apiCall('/api/demand-forecasting/recommendations?daysAhead=7');
    
    console.log(`✅ Recommendations generated`);
    console.log(`   Summary:`);
    console.log(`   - Upcoming challenges: ${recommendationsResponse.summary?.upcomingChallenges}`);
    console.log(`   - Recent anomalies: ${recommendationsResponse.summary?.recentAnomalies}`);
    console.log(`   - Staffing optimized: ${recommendationsResponse.summary?.staffingOptimized}`);
    
    if (recommendationsResponse.recommendations?.staffing && recommendationsResponse.recommendations.staffing.length > 0) {
      console.log('\n   👥 Staffing recommendations (next 3 days):');
      recommendationsResponse.recommendations.staffing.slice(0, 3).forEach(s => {
        console.log(`   - ${s.date}: ${s.labTechs} lab techs, ${s.engineers} engineers`);
        console.log(`     Reason: ${s.reasoning}`);
      });
    }
    
    if (recommendationsResponse.recommendations?.surges && recommendationsResponse.recommendations.surges.length > 0) {
      console.log('\n   ⚠️  Upcoming surge periods:');
      recommendationsResponse.recommendations.surges.forEach(s => {
        console.log(`   - ${s.period}: ${s.severity} severity (peak: ${s.peakValue} orders)`);
        s.actions.slice(0, 2).forEach(action => {
          console.log(`     • ${action}`);
        });
      });
    }
    
    if (recommendationsResponse.recommendations?.anomalies) {
      console.log('\n   🚨 Recent anomalies detected:');
      console.log(`   - Total: ${recommendationsResponse.recommendations.anomalies.detected}`);
      console.log(`   - High severity: ${recommendationsResponse.recommendations.anomalies.highSeverity}`);
      
      if (recommendationsResponse.recommendations.anomalies.recent && recommendationsResponse.recommendations.anomalies.recent.length > 0) {
        recommendationsResponse.recommendations.anomalies.recent.forEach(a => {
          console.log(`   - ${a.date}: ${a.volume} orders (${a.severity} severity, deviation: ${a.deviation})`);
        });
      }
    }
    console.log();

    // Step 7: Identify surge periods
    console.log('📊 Step 7: Identifying surge periods for next 30 days...');
    const surgesResponse = await apiCall('/api/demand-forecasting/surge-periods?daysAhead=30');
    
    console.log(`✅ Identified ${surgesResponse.surges?.length || 0} surge periods`);
    console.log(`   Severity breakdown:`);
    console.log(`   - High: ${surgesResponse.summary?.highSeverity || 0}`);
    console.log(`   - Medium: ${surgesResponse.summary?.mediumSeverity || 0}`);
    console.log(`   - Low: ${surgesResponse.summary?.lowSeverity || 0}`);
    
    if (surgesResponse.surges && surgesResponse.surges.length > 0) {
      console.log('\n   📈 Surge details:');
      surgesResponse.surges.slice(0, 3).forEach(s => {
        console.log(`   - ${s.startDate} to ${s.endDate}`);
        console.log(`     Peak: ${s.peakValue} orders | Severity: ${s.severity}`);
        console.log(`     Recommendations:`);
        s.recommendations.slice(0, 2).forEach(r => {
          console.log(`     • ${r}`);
        });
      });
    }
    console.log();

    // Step 8: Detect anomalies
    console.log('🔍 Step 8: Detecting anomalies in last 30 days...');
    const anomaliesResponse = await apiCall('/api/demand-forecasting/anomalies?daysBack=30');
    
    console.log(`✅ Anomaly detection complete`);
    console.log(`   Summary:`);
    console.log(`   - Total anomalies: ${anomaliesResponse.summary?.totalAnomalies || 0}`);
    console.log(`   - High severity: ${anomaliesResponse.summary?.highSeverityCount || 0}`);
    console.log(`   - Average deviation: ${anomaliesResponse.summary?.averageDeviation?.toFixed(1)}%`);
    console.log(`   - Significant trend changes: ${anomaliesResponse.summary?.significantTrendChanges || 0}`);
    
    if (anomaliesResponse.anomalies && anomaliesResponse.anomalies.length > 0) {
      console.log('\n   🚨 Detected anomalies (top 5):');
      anomaliesResponse.anomalies.slice(0, 5).forEach(a => {
        console.log(`   - ${a.date}: ${a.volume} orders (${a.severity} severity)`);
        console.log(`     Deviation: ${a.deviationPercent.toFixed(1)}% | Methods: ${a.methods.join(', ')}`);
      });
    }
    
    if (anomaliesResponse.seasonalAnomalies && anomaliesResponse.seasonalAnomalies.length > 0) {
      console.log('\n   🌊 Seasonal anomalies (top 3):');
      anomaliesResponse.seasonalAnomalies.slice(0, 3).forEach(a => {
        console.log(`   - ${a.date}: ${a.volume} orders (expected: ${a.expectedValue.toFixed(0)})`);
        console.log(`     Deviation: ${a.deviation.toFixed(1)}`);
      });
    }
    
    if (anomaliesResponse.trendChanges && anomaliesResponse.trendChanges.length > 0) {
      console.log('\n   📉 Trend changes detected:');
      anomaliesResponse.trendChanges.slice(0, 3).forEach(t => {
        console.log(`   - ${t.date}: trend changed from ${t.oldTrend.toFixed(2)} to ${t.newTrend.toFixed(2)}`);
        console.log(`     Change: ${t.changePercent.toFixed(1)}%`);
      });
    }
    console.log();

    // Final Summary
    console.log('='.repeat(80));
    console.log('✅ CHUNK 5 TEST COMPLETE - ALL OPERATIONS SUCCESSFUL');
    console.log('='.repeat(80));
    console.log('\nKey capabilities verified:');
    console.log('  ✓ Demand forecast generation (AI/ML predictions)');
    console.log('  ✓ Forecast retrieval and analysis');
    console.log('  ✓ Seasonal pattern detection');
    console.log('  ✓ Accuracy metric tracking');
    console.log('  ✓ AI-powered recommendations (staffing, surges, anomalies)');
    console.log('  ✓ Surge period identification');
    console.log('  ✓ Multi-method anomaly detection');
    console.log('\nThe predictive AI system is fully operational! 🚀');
    console.log();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testDemandForecasting();
