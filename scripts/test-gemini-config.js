#!/usr/bin/env node
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Test script to verify Gemini configuration is working correctly
 */

console.log('🧪 Testing Gemini Configuration...\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log('  - GOOGLE_GEMINI_API_KEY:', process.env.GOOGLE_GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('  - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('  - GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('  - NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('  - NEXT_PUBLIC_GOOGLE_AI_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY ? '✅ Set' : '❌ Not set');

// Test API key resolution
console.log('\n🔑 API Key Resolution:');
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_AI_API_KEY || 
               process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
               process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

if (apiKey) {
  console.log('  ✅ API key found');
  console.log('  - Key length:', apiKey.length);
  console.log('  - Key starts with:', apiKey.substring(0, 10) + '...');
} else {
  console.log('  ❌ No API key found');
}

// Test a simple Gemini API call
if (apiKey) {
  console.log('\n🚀 Testing Gemini API...');
  
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('  - Model initialized: ✅');
    
    // Test a simple generation
    model.generateContent('Say "Hello World" in exactly two words')
      .then(result => {
        const response = result.response.text();
        console.log('  - API call successful: ✅');
        console.log('  - Response:', response);
        console.log('\n✅ Gemini configuration is working correctly!');
      })
      .catch(error => {
        console.log('  - API call failed: ❌');
        console.log('  - Error:', error.message);
        console.log('\n❌ Gemini configuration has issues');
      });
  } catch (error) {
    console.log('  - Failed to initialize: ❌');
    console.log('  - Error:', error.message);
  }
} else {
  console.log('\n⚠️  Cannot test API without a valid key');
}

// Test configuration file
console.log('\n📁 Configuration File Test:');
try {
  // Use require to load the TypeScript config (after transpilation)
  console.log('  ⚠️  Note: TypeScript config requires compilation to test');
  console.log('  - Run "npm run build" to compile TypeScript files');
} catch (error) {
  console.log('  - Error loading config:', error.message);
}