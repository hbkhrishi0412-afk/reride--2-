// Test API endpoints to diagnose production issues
const API_BASE = 'https://www.reride.co.in/api';

async function testEndpoint(method, endpoint, data = null) {
  try {
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
    return response;
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests');
  console.log('='.repeat(50));
  
  // Test 1: GET vehicle-data
  await testEndpoint('GET', '/vehicle-data');
  
  // Test 2: GET vehicles?type=data
  await testEndpoint('GET', '/vehicles?type=data');
  
  // Test 3: POST vehicle-data (with sample data)
  const sampleData = {
    FOUR_WHEELER: [
      {
        name: "Test Make",
        models: [
          { name: "Test Model", variants: ["Variant1", "Variant2"] }
        ]
      }
    ],
    TWO_WHEELER: []
  };
  
  await testEndpoint('POST', '/vehicle-data', sampleData);
  
  // Test 4: POST vehicles?type=data (with sample data)
  await testEndpoint('POST', '/vehicles?type=data', sampleData);
  
  console.log('\n🏁 Tests completed');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
} else {
  // Browser environment
  window.testAPIEndpoints = runTests;
  console.log('API test function available as window.testAPIEndpoints()');
}
