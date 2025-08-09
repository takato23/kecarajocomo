#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to consolidate Gemini API configuration across the codebase
 */

console.log('🔍 Searching for Gemini API usage...\n');

// Patterns to search for
const geminiPatterns = [
  'GOOGLE_GEMINI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_AI_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
  'NEXT_PUBLIC_GOOGLE_AI_API_KEY',
  'GoogleGenerativeAI',
  'gemini-pro',
  'gemini-1.5'
];

// Files to search
const filePatterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  '.env*',
  '!**/node_modules/**',
  '!**/.next/**'
];

const results = {
  envVarUsage: {},
  geminiImports: [],
  modelUsage: {},
  totalFiles: 0
};

// Search for patterns in files
filePatterns.forEach(pattern => {
  const files = glob.sync(pattern);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    results.totalFiles++;
    
    // Check for environment variable usage
    geminiPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        if (!results.envVarUsage[pattern]) {
          results.envVarUsage[pattern] = [];
        }
        results.envVarUsage[pattern].push(file);
      }
    });
    
    // Check for Gemini imports
    if (content.includes('GoogleGenerativeAI') || content.includes('@google/generative-ai')) {
      results.geminiImports.push(file);
    }
    
    // Check for model usage
    const modelMatches = content.match(/gemini-[\w.-]+/g);
    if (modelMatches) {
      modelMatches.forEach(model => {
        if (!results.modelUsage[model]) {
          results.modelUsage[model] = [];
        }
        results.modelUsage[model].push(file);
      });
    }
  });
});

// Generate report
console.log('📊 Gemini Configuration Report\n');
console.log('═══════════════════════════════════════════\n');

console.log('🔑 Environment Variable Usage:');
Object.entries(results.envVarUsage).forEach(([varName, files]) => {
  console.log(`\n  ${varName}:`);
  files.forEach(file => console.log(`    - ${file}`));
});

console.log('\n\n📦 Files importing Gemini SDK:');
results.geminiImports.forEach(file => console.log(`  - ${file}`));

console.log('\n\n🤖 Model Usage:');
Object.entries(results.modelUsage).forEach(([model, files]) => {
  console.log(`\n  ${model}:`);
  files.forEach(file => console.log(`    - ${file}`));
});

console.log('\n\n📈 Summary:');
console.log(`  - Total files scanned: ${results.totalFiles}`);
console.log(`  - Files using Gemini: ${results.geminiImports.length}`);
console.log(`  - Different env vars used: ${Object.keys(results.envVarUsage).length}`);
console.log(`  - Different models used: ${Object.keys(results.modelUsage).length}`);

// Recommendations
console.log('\n\n💡 Recommendations:');
console.log('1. Use geminiConfig.getApiKey() instead of process.env directly');
console.log('2. Import gemini config: import geminiConfig from \'@/lib/config/gemini.config\'');
console.log('3. Use feature-specific configs: geminiConfig.getFeatureConfig(\'mealPlanning\')');
console.log('4. Consolidate model usage to gemini-1.5-flash for consistency');

// Generate migration script
const migrationScript = `
// Add this import to files using Gemini:
import geminiConfig from '@/lib/config/gemini.config';

// Replace direct env var access:
// OLD: process.env.GOOGLE_GEMINI_API_KEY
// NEW: geminiConfig.getApiKey()

// Use feature-specific configs:
const config = geminiConfig.getFeatureConfig('mealPlanning');
`;

fs.writeFileSync('gemini-migration-guide.md', `# Gemini Configuration Migration Guide

${migrationScript}

## Files to update:
${results.geminiImports.map(f => `- ${f}`).join('\n')}
`);

console.log('\n\n✅ Migration guide saved to gemini-migration-guide.md');