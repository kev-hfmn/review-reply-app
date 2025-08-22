// Quick test script to verify Lemon Squeezy API connection
// Run with: node test-lemon-squeezy.js

require('dotenv').config({ path: '.env.local' });
const { lemonSqueezySetup, getAuthenticatedUser } = require('@lemonsqueezy/lemonsqueezy.js');

console.log('Testing Lemon Squeezy API connection...');
console.log('API Key (first 20 chars):', process.env.LEMONSQUEEZY_API_KEY?.substring(0, 20) + '...');
console.log('Store ID:', process.env.LEMONSQUEEZY_STORE_ID);

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (error) => console.error('Lemon Squeezy Setup Error:', error),
});

async function testConnection() {
  try {
    console.log('Testing API connection...');
    const { data, error } = await getAuthenticatedUser();
    
    if (error) {
      console.error('❌ API Error:', error);
      return;
    }
    
    console.log('✅ API Connection successful!');
    console.log('User ID:', data?.data?.id);
    console.log('Store ID from API:', data?.data?.attributes?.store_id);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();