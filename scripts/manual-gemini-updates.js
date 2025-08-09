#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Manual updates for Gemini configuration consolidation
 * These require more context-aware changes
 */

console.log('🔧 Starting manual Gemini configuration updates...\n');

// Update UnifiedAIService.ts
function updateUnifiedAIService() {
  const filePath = 'src/services/ai/UnifiedAIService.ts';
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the Gemini initialization line
    content = content.replace(
      /const geminiKey = this\.config\.apiKey \|\| process\.env\.GOOGLE_AI_API_KEY \|\| process\.env\.GOOGLE_GEMINI_API_KEY;/,
      'const geminiKey = this.config.apiKey || geminiConfig.getApiKey();'
    );
    
    // Add import if not present
    if (!content.includes('geminiConfig')) {
      const importPosition = content.indexOf("import { GeminiProvider }");
      content = content.slice(0, importPosition) + 
        "import geminiConfig from '@/lib/config/gemini.config';\n" + 
        content.slice(importPosition);
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update GeminiProvider.ts for model configuration
function updateGeminiProvider() {
  const filePath = 'src/services/ai/providers/GeminiProvider.ts';
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Update model selection to use config
    content = content.replace(
      /model: config\.model === 'gemini-pro-vision' \? 'gemini-1\.5-flash' : config\.model \|\| 'gemini-1\.5-flash',/g,
      "model: config.model || geminiConfig.default.model,"
    );
    
    content = content.replace(
      /model: config\.model \|\| 'gemini-1\.5-flash',/g,
      "model: config.model || geminiConfig.default.model,"
    );
    
    content = content.replace(
      /model: 'gemini-1\.5-flash',/g,
      "model: geminiConfig.models['gemini-1.5-flash'].model,"
    );
    
    content = content.replace(
      /model: \(config\.model \|\| 'gemini-1\.5-flash'\) as any,/g,
      "model: (config.model || geminiConfig.default.model) as any,"
    );
    
    // Add import if not present
    if (!content.includes('geminiConfig')) {
      const importPosition = content.indexOf("import { GoogleGenerativeAI }");
      content = content.slice(0, importPosition) + 
        "import geminiConfig from '@/lib/config/gemini.config';\n" + 
        content.slice(importPosition);
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update services that need feature-specific configs
function updateFeatureServices() {
  const updates = [
    {
      file: 'src/lib/services/mealPlanningAI.ts',
      feature: 'mealPlanning'
    },
    {
      file: 'src/features/recipes/api/generate/gemini/route.ts',
      feature: 'recipeGeneration'
    },
    {
      file: 'src/features/pantry/services/geminiPantryService.ts',
      feature: 'pantryAnalysis'
    },
    {
      file: 'src/app/api/parse-voice-command/route.ts',
      feature: 'voiceCommands'
    }
  ];
  
  updates.forEach(({ file, feature }) => {
    const fullPath = path.join(process.cwd(), file);
    
    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
      }
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let hasChanges = false;
      
      // Add import if not present
      if (!content.includes('geminiConfig')) {
        const importMatch = content.match(/import .* from ['"].*['"]/);
        if (importMatch) {
          const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
          const importStatement = "\nimport geminiConfig from '@/lib/config/gemini.config';";
          content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
          hasChanges = true;
        }
      }
      
      // Add feature config usage
      if (!content.includes('getFeatureConfig')) {
        // Find where GoogleGenerativeAI is initialized
        const initMatch = content.match(/new GoogleGenerativeAI\([^)]+\)/);
        if (initMatch) {
          // Add feature config before initialization
          const initIndex = content.indexOf(initMatch[0]);
          const featureConfig = `\n  const featureConfig = geminiConfig.getFeatureConfig('${feature}');\n  `;
          content = content.slice(0, initIndex) + featureConfig + content.slice(initIndex);
          
          // Replace API key in initialization
          content = content.replace(
            /new GoogleGenerativeAI\([^)]+\)/,
            'new GoogleGenerativeAI(featureConfig.apiKey)'
          );
          
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated ${file} with ${feature} config`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  });
}

// Update onboarding components
function updateOnboardingComponents() {
  const components = [
    'src/features/auth/components/onboarding/ProfileSetupStep.tsx',
    'src/features/auth/components/onboarding/PantrySetupStep.tsx',
    'src/features/auth/components/onboarding/MealPlanPreviewStep.tsx'
  ];
  
  components.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    
    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
      }
      
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace direct Gemini usage with service calls
      if (content.includes('GoogleGenerativeAI')) {
        content = content.replace(
          /import { GoogleGenerativeAI } from '@google\/generative-ai';/,
          "import { getAIService } from '@/services/ai/UnifiedAIService';"
        );
        
        // Remove direct Gemini initialization
        content = content.replace(
          /const genAI = new GoogleGenerativeAI\([^)]+\);[\s\S]*?const model = genAI\.getGenerativeModel\([^)]+\);/g,
          'const aiService = getAIService();'
        );
        
        // Replace generateContent calls
        content = content.replace(
          /await model\.generateContent\(/g,
          'await aiService.generateText({ prompt: '
        );
        
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated ${file} to use UnifiedAIService`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  });
}

// Run all updates
updateUnifiedAIService();
updateGeminiProvider();
updateFeatureServices();
updateOnboardingComponents();

console.log('\n✅ Manual updates completed!');
console.log('\n📋 Remaining tasks:');
console.log('1. Review and test all updated files');
console.log('2. Update generation config parameters to use centralized config');
console.log('3. Remove duplicate Gemini service files');
console.log('4. Update API routes to use feature-specific configs');