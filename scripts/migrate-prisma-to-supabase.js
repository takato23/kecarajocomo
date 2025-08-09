#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to migrate from Prisma to Supabase Database Service
 */

const replacements = [
  // Import replacements
  {
    from: /import\s+{\s*prisma\s*}\s+from\s+['"]@\/lib\/prisma['"]/g,
    to: 'import { db } from \'@/lib/supabase/database.service\''
  },
  {
    from: /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g,
    to: '// PrismaClient removed - using Supabase'
  },
  // Prisma query replacements - Recipes
  {
    from: /await\s+prisma\.recipe\.findMany\(/g,
    to: 'await db.getRecipes(user.id'
  },
  {
    from: /await\s+prisma\.recipe\.findUnique\(/g,
    to: 'await db.getRecipeById('
  },
  {
    from: /await\s+prisma\.recipe\.create\(/g,
    to: 'await db.createRecipe('
  },
  {
    from: /await\s+prisma\.recipe\.update\(/g,
    to: 'await db.updateRecipe('
  },
  {
    from: /await\s+prisma\.recipe\.delete\(/g,
    to: 'await db.deleteRecipe('
  },
  // Prisma query replacements - Ingredients
  {
    from: /await\s+prisma\.ingredient\.findFirst\(/g,
    to: 'await db.findOrCreateIngredient('
  },
  {
    from: /await\s+prisma\.ingredient\.create\(/g,
    to: 'await db.findOrCreateIngredient('
  },
  // Prisma query replacements - Pantry
  {
    from: /await\s+prisma\.pantryItem\.findMany\(/g,
    to: 'await db.getPantryItems(user.id'
  },
  {
    from: /await\s+prisma\.pantryItem\.create\(/g,
    to: 'await db.addPantryItem(user.id, '
  },
  {
    from: /await\s+prisma\.pantryItem\.update\(/g,
    to: 'await db.updatePantryItem('
  },
  {
    from: /await\s+prisma\.pantryItem\.delete\(/g,
    to: 'await db.deletePantryItem('
  },
  // Prisma query replacements - User
  {
    from: /await\s+prisma\.user\.findUnique\(/g,
    to: 'await db.getUserProfile('
  },
  {
    from: /await\s+prisma\.user\.update\(/g,
    to: 'await db.updateUserProfile('
  },
  // Remove Prisma-specific syntax
  {
    from: /where:\s*{\s*id:\s*([^}]+)\s*}/g,
    to: '$1'
  },
  {
    from: /data:\s*{\s*/g,
    to: '{ '
  },
  {
    from: /include:\s*{[^}]+}/g,
    to: '// includes handled by Supabase service'
  }
];

// Files to process
const patterns = [
  'src/app/api/**/*.ts',
  'src/app/api/**/*.tsx',
  'src/lib/services/**/*.ts',
  'src/services/**/*.ts'
];

let filesProcessed = 0;
let filesModified = 0;
const modifiedFiles = [];

console.log('🔄 Starting Prisma to Supabase migration...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { 
    ignore: [
      '**/node_modules/**', 
      '**/database.service.ts',
      '**/supabase-auth.ts'
    ] 
  });
  
  files.forEach(file => {
    filesProcessed++;
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Skip if file doesn't contain Prisma references
    if (!content.includes('prisma') && !content.includes('Prisma')) {
      return;
    }
    
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      filesModified++;
      modifiedFiles.push(file);
      console.log(`✅ Updated: ${file}`);
    }
  });
});

console.log(`\n📊 Migration Summary:`);
console.log(`   - Files processed: ${filesProcessed}`);
console.log(`   - Files modified: ${filesModified}`);

if (modifiedFiles.length > 0) {
  console.log('\n📝 Modified files:');
  modifiedFiles.forEach(file => console.log(`   - ${file}`));
}

// Create a migration report
const report = {
  date: new Date().toISOString(),
  filesProcessed,
  filesModified,
  modifiedFiles,
  patterns,
  replacements: replacements.map(r => ({ from: r.from.toString(), to: r.to }))
};

fs.writeFileSync(
  path.join(process.cwd(), 'prisma-migration-report.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('\n📄 Migration report saved to prisma-migration-report.json');
console.log('\n⚠️  Next steps:');
console.log('1. Review modified files and fix any complex queries manually');
console.log('2. Remove Prisma dependencies: npm uninstall prisma @prisma/client');
console.log('3. Delete prisma/ directory');
console.log('4. Update src/lib/prisma.ts to export Supabase client');
console.log('5. Run type checking: npm run type-check');
console.log('6. Test all API endpoints thoroughly');