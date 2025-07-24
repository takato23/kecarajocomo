#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting comprehensive lint cleanup...\n');

// Step 1: Fix import order issues automatically
console.log('📦 Step 1: Fixing import order issues...');
try {
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix --rule "import/order: error"', { stdio: 'inherit' });
  console.log('✅ Import order issues fixed\n');
} catch (error) {
  console.log('⚠️  Some import order issues could not be auto-fixed\n');
}

// Step 2: Remove unused imports
console.log('🔍 Step 2: Removing unused imports...');
try {
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix --rule "unused-imports/no-unused-imports: error"', { stdio: 'inherit' });
  console.log('✅ Unused imports removed\n');
} catch (error) {
  console.log('⚠️  Some unused imports could not be auto-fixed\n');
}

// Step 3: Fix no-unescaped-entities
console.log('📝 Step 3: Fixing unescaped entities...');
try {
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix --rule "react/no-unescaped-entities: error"', { stdio: 'inherit' });
  console.log('✅ Unescaped entities fixed\n');
} catch (error) {
  console.log('⚠️  Some unescaped entities could not be auto-fixed\n');
}

// Step 4: Run full ESLint fix
console.log('🔧 Step 4: Running full ESLint auto-fix...');
try {
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix', { stdio: 'inherit' });
  console.log('✅ ESLint auto-fix completed\n');
} catch (error) {
  console.log('⚠️  Some issues could not be auto-fixed\n');
}

// Step 5: Count remaining issues
console.log('📊 Step 5: Counting remaining issues...');
try {
  const result = execSync('npm run lint 2>&1 | grep -E "(Error:|Warning:)" | wc -l', { encoding: 'utf-8' });
  const count = parseInt(result.trim());
  console.log(`\n📈 Remaining issues: ${count}`);
  
  if (count > 0) {
    console.log('\n🔍 Top remaining issues:');
    const topIssues = execSync('npm run lint 2>&1 | grep -E "(Error:|Warning:)" | sort | uniq -c | sort -nr | head -10', { encoding: 'utf-8' });
    console.log(topIssues);
  }
} catch (error) {
  console.log('Could not count remaining issues');
}

console.log('\n✨ Cleanup complete!');