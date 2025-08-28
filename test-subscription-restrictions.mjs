#!/usr/bin/env node

/**
 * Test script to verify subscription plan restrictions are working correctly
 * Tests API routes, UI restrictions, and edge cases
 */

const BASE_URL = 'http://localhost:3002';

// Test data for different subscription scenarios
const testScenarios = [
  {
    name: 'Basic Plan User',
    planId: 'basic',
    shouldHaveAccess: {
      insights: false,
      autoSync: false,
      aiReplyGeneration: false,
      autoApproval: false
    }
  },
  {
    name: 'Starter Plan User', 
    planId: 'starter',
    shouldHaveAccess: {
      insights: false,
      autoSync: false,
      aiReplyGeneration: false,
      autoApproval: false
    }
  },
  {
    name: 'Pro Plan User',
    planId: 'pro',
    shouldHaveAccess: {
      insights: true,
      autoSync: true,
      aiReplyGeneration: true,
      autoApproval: true
    }
  }
];

// API endpoints to test
const protectedEndpoints = [
  {
    path: '/api/ai/generate-insights',
    method: 'POST',
    requiredFeature: 'advancedInsights',
    requiredPlan: 'pro',
    testData: {
      businessId: 'test-business-id',
      dateRange: 'last30days'
    }
  },
  {
    path: '/api/reviews/sync',
    method: 'POST', 
    requiredFeature: 'autoSync',
    requiredPlan: 'pro',
    testData: {
      businessId: 'test-business-id'
    }
  }
];

async function testAPIProtection(endpoint, scenario) {
  console.log(`\n🧪 Testing ${endpoint.path} for ${scenario.name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // Note: In real testing, we'd need actual auth headers
        'Authorization': `Bearer mock-token-${scenario.planId}`
      },
      body: JSON.stringify(endpoint.testData)
    });

    const expectedStatus = scenario.shouldHaveAccess[endpoint.requiredFeature] ? 200 : 403;
    const actualStatus = response.status;
    
    if (actualStatus === expectedStatus) {
      console.log(`✅ PASS: Expected ${expectedStatus}, got ${actualStatus}`);
    } else {
      console.log(`❌ FAIL: Expected ${expectedStatus}, got ${actualStatus}`);
    }

    if (actualStatus === 403) {
      const errorData = await response.json();
      console.log(`   📋 Error message: ${errorData.message}`);
      console.log(`   📋 Required plan: ${errorData.requiredPlan}`);
    }

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function testUIRestrictions() {
  console.log('\n🎨 Testing UI Restrictions...');
  
  // Test pages that should show upgrade prompts
  const restrictedPages = [
    '/insights',
    '/settings'
  ];

  for (const page of restrictedPages) {
    console.log(`\n📄 Testing ${page} page...`);
    
    try {
      const response = await fetch(`${BASE_URL}${page}`);
      if (response.ok) {
        console.log(`✅ Page loads successfully: ${response.status}`);
      } else {
        console.log(`❌ Page failed to load: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR loading ${page}: ${error.message}`);
    }
  }
}

async function testEdgeCases() {
  console.log('\n🔍 Testing Edge Cases...');
  
  // Test with invalid/missing auth
  console.log('\n🔐 Testing unauthorized access...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/generate-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No auth header
      },
      body: JSON.stringify({
        businessId: 'test-business-id',
        dateRange: 'last30days'
      })
    });
    
    console.log(`📊 Unauthorized request status: ${response.status}`);
    if (response.status === 401 || response.status === 403) {
      console.log('✅ PASS: Properly blocked unauthorized access');
    } else {
      console.log('❌ FAIL: Should block unauthorized access');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  // Test with malformed requests
  console.log('\n📝 Testing malformed requests...');
  try {
    const response = await fetch(`${BASE_URL}/api/ai/generate-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing required fields
      })
    });
    
    console.log(`📊 Malformed request status: ${response.status}`);
    if (response.status === 400) {
      console.log('✅ PASS: Properly validated request data');
    } else {
      console.log('❌ FAIL: Should validate request data');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Subscription Restriction Tests...\n');
  console.log('=' .repeat(60));
  
  // Test API protections for each scenario
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing scenario: ${scenario.name} (${scenario.planId})`);
    console.log('-'.repeat(50));
    
    for (const endpoint of protectedEndpoints) {
      await testAPIProtection(endpoint, scenario);
    }
  }
  
  // Test UI restrictions
  await testUIRestrictions();
  
  // Test edge cases
  await testEdgeCases();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test suite completed!');
  console.log('\n📝 Note: This is a basic connectivity test.');
  console.log('   For full testing, you need to:');
  console.log('   1. Set up test users with different subscription plans');
  console.log('   2. Use actual authentication tokens');
  console.log('   3. Test with real business data');
  console.log('   4. Verify UI components show correct upgrade prompts');
}

// Run the tests
runAllTests().catch(console.error);
