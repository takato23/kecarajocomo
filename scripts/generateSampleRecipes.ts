/**
 * Generate sample recipes for testing
 * Creates 50 diverse recipes for initial testing
 */

import { RecipeGenerator, GeneratedRecipe } from './generateRecipes';

class SampleRecipeGenerator extends RecipeGenerator {
  async generateSampleRecipes(): Promise<GeneratedRecipe[]> {
    console.log('🚀 Generating sample recipes for testing...');
    
    const samples: GeneratedRecipe[] = [];
    
    // Generate 5 batches of 10 recipes each
    for (let i = 0; i < 5; i++) {
      console.log(`📦 Generating sample batch ${i + 1}/5...`);
      
      const batch = await this.generateRecipeBatch(10);
      samples.push(...batch);
      
      console.log(`✅ Sample batch ${i + 1} complete: ${batch.length} recipes`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`🎉 Sample generation complete! Generated ${samples.length} recipes.`);
    
    // Save sample recipes
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const sampleFile = path.join(dataDir, 'sample-recipes.json');
    await fs.writeFile(sampleFile, JSON.stringify(samples, null, 2));
    
    console.log(`💾 Sample recipes saved to ${sampleFile}`);
    
    return samples;
  }
}

// Generate sample data
if (require.main === module) {
  const generator = new SampleRecipeGenerator();
  generator.generateSampleRecipes().catch(console.error);
}

export { SampleRecipeGenerator };