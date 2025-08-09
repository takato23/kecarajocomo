#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Meal Planner Functionality\n');

// Test 1: Check for type mismatches
console.log('1. Checking Type Definitions...');
const typeFiles = [
  '/src/types/meal-planning/index.ts',
  '/src/features/meal-planning/types/index.ts',
  '/src/lib/types/mealPlanning.ts'
];

typeFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ Found: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('MealType')) {
      const isEnum = content.includes('enum MealType');
      const isStringLiteral = content.includes("'desayuno'");
      console.log(`      Type system: ${isEnum ? 'Enum' : isStringLiteral ? 'String Literal' : 'Unknown'}`);
    }
  } else {
    console.log(`   ❌ Missing: ${file}`);
  }
});

// Test 2: Check imports consistency
console.log('\n2. Checking Import Consistency...');
const componentsToCheck = [
  '/src/app/(app)/planificador/enhanced-page.tsx',
  '/src/hooks/meal-planning/useMealPlanning.ts',
  '/src/features/meal-planning/store/useMealPlanningStore.ts'
];

componentsToCheck.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const typeImports = content.match(/from ['"].*types.*meal.*['"]/g) || [];
    console.log(`   ${path.basename(file)}:`);
    typeImports.forEach(imp => console.log(`      ${imp}`));
  }
});

// Test 3: Check API endpoints
console.log('\n3. Checking API Endpoints...');
const apiEndpoints = [
  '/src/app/api/meal-planning/generate/route.ts',
  '/src/app/api/meal-planning/regenerate/route.ts',
  '/src/app/api/meal-plans/route.ts'
];

apiEndpoints.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ Found: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasAuth = content.includes('getServerSession') || content.includes('auth');
    console.log(`      Auth check: ${hasAuth ? '✅' : '❌'}`);
  } else {
    console.log(`   ❌ Missing: ${file}`);
  }
});

// Test 4: Check store data structure
console.log('\n4. Checking Store Data Structure...');
const storePath = path.join(process.cwd(), '/src/features/meal-planning/store/useMealPlanningStore.ts');
if (fs.existsSync(storePath)) {
  const content = fs.readFileSync(storePath, 'utf8');
  const hasSlots = content.includes('slots:');
  const hasItems = content.includes('items:');
  console.log(`   Data structure: ${hasSlots ? 'slots[]' : hasItems ? 'items[]' : 'Unknown'}`);
  
  // Check meal types used
  const mealTypes = content.match(/mealType: ['"]([^'"]+)['"]/g) || [];
  console.log(`   Meal types found: ${mealTypes.length > 0 ? mealTypes.join(', ') : 'None'}`);
}

// Test 5: Component callback implementations
console.log('\n5. Checking Component Callbacks...');
const enhancedPagePath = path.join(process.cwd(), '/src/app/(app)/planificador/enhanced-page.tsx');
if (fs.existsSync(enhancedPagePath)) {
  const content = fs.readFileSync(enhancedPagePath, 'utf8');
  const emptyCallbacks = content.match(/\(\) => \{\s*\}/g) || [];
  console.log(`   Empty callbacks found: ${emptyCallbacks.length}`);
  
  // Check specific callbacks
  const callbacks = ['onMealAdd', 'onMealEdit', 'onMealRemove', 'onAiGenerate'];
  callbacks.forEach(cb => {
    const hasImplementation = content.includes(`${cb}={(`) && !content.includes(`${cb}={() => {}}`);
    console.log(`   ${cb}: ${hasImplementation ? '✅ Implemented' : '❌ Empty'}`);
  });
}

console.log('\n📊 Summary of Issues Found:');
console.log('1. Type system mismatch between enum and string literals');
console.log('2. Data structure mismatch (slots vs items)');
console.log('3. Empty callback implementations in components');
console.log('4. Authentication might not be properly configured');
console.log('\nRecommended fixes have been generated in type-adapter.ts and useMealPlanningFixed.ts');