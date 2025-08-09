#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Script to update all files using Gemini to use centralized configuration
 */

// Files that need to be updated
const filesToUpdate = [
  'src/services/ai/providers/GeminiProvider.ts',
  'src/services/ai/UnifiedAIService.ts', 
  'src/lib/services/receiptOCR.ts',
  'src/lib/services/mealPlanningAI.ts',
  'src/lib/services/geminiService.ts',
  'src/lib/services/geminiServer.ts',
  'src/lib/services/geminiMealService.ts',
  'src/lib/services/geminiMealPlannerClient.ts',
  'src/lib/services/geminiMealPlannerAPI.ts',
  'src/features/recipes/api/generate/gemini/route.ts',
  'src/features/pantry/services/geminiPantryService.ts',
  'src/app/api/test-gemini/route.ts',
  'src/app/api/parse-voice-command/route.ts',
  'src/app/api/gemini/weekly/route.ts',
  'src/app/api/ai/recipes/suggest-pantry/route.ts',
  'src/app/api/ai/recipes/personalized/route.ts',
  'src/app/api/ai/recipes/generate/route.ts',
  'src/features/auth/components/onboarding/ProfileSetupStep.tsx',
  'src/features/auth/components/onboarding/PantrySetupStep.tsx',
  'src/features/auth/components/onboarding/MealPlanPreviewStep.tsx'
];

// Updates to make
const updates = [
  {
    // Replace direct env var access
    patterns: [
      /process\.env\.GOOGLE_GEMINI_API_KEY/g,
      /process\.env\.GEMINI_API_KEY/g,
      /process\.env\.GOOGLE_AI_API_KEY/g,
      /process\.env\.NEXT_PUBLIC_GEMINI_API_KEY/g,
      /process\.env\.NEXT_PUBLIC_GOOGLE_AI_API_KEY/g
    ],
    replacement: 'geminiConfig.getApiKey()'
  },
  {
    // Replace hardcoded model names
    patterns: [
      /['"]gemini-pro['"]/g,
      /['"]gemini-1\.5-pro['"]/g,
      /['"]gemini-1\.5-flash['"]/g,
      /['"]gemini-pro-vision['"]/g
    ],
    replacement: 'geminiConfig.default.model'
  }
];

// Process each file
let updatedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    
    // Check if file already imports geminiConfig
    const hasImport = content.includes('geminiConfig');
    
    // Apply updates
    updates.forEach(update => {
      update.patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, update.replacement);
          hasChanges = true;
        }
      });
    });
    
    // Add import if needed
    if (hasChanges && !hasImport) {
      // Find the right place to add import
      const importMatch = content.match(/import .* from ['"].*['"]/);
      if (importMatch) {
        const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        const importStatement = "\nimport geminiConfig from '@/lib/config/gemini.config';";
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
        hasChanges = true;
      }
    }
    
    // Write back if changed
    if (hasChanges) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${filePath}`);
      updatedCount++;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    errorCount++;
  }
});

console.log('\n📊 Summary:');
console.log(`  - Files updated: ${updatedCount}`);
console.log(`  - Files with errors: ${errorCount}`);
console.log(`  - Total files processed: ${filesToUpdate.length}`);

// Create a summary of model usage
console.log('\n💡 Next steps:');
console.log('1. Update model-specific configurations to use feature configs');
console.log('2. Replace hardcoded generation configs with centralized ones');
console.log('3. Test all AI features to ensure they work correctly');
console.log('4. Update .env file with correct GOOGLE_GEMINI_API_KEY');