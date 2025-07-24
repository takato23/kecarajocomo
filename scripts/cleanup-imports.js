#!/usr/bin/env node

/**
 * Safe cleanup script for unused imports
 * This script removes common unused imports that are safe to remove
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns for imports that are commonly unused and safe to remove
const SAFE_UNUSED_IMPORTS = [
  // React import (not needed in modern React)
  /^import\s+React\s+from\s+['"]react['"];\s*$/gm,
  
  // Specific unused type imports
  /^import\s+type\s+\{\s*Database\s*\}\s+from\s+['"].*database\.types['"];\s*$/gm,
  
  // Unused Storybook imports
  /^import\s+type\s+\{\s*Meta\s*\}\s+from\s+['"]@storybook\/react['"];\s*$/gm,
];

// Files to process
const FILES_PATTERN = 'src/**/*.{ts,tsx,js,jsx}';

// Count statistics
let totalFilesProcessed = 0;
let totalImportsRemoved = 0;
let filesModified = 0;

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileImportsRemoved = 0;

    // Check for React usage (JSX or React.* calls)
    const hasJSX = /<[A-Z][^>]*>/.test(content);
    const hasReactCall = /React\.\w+/.test(content);
    
    // Only remove React import if it's truly not used
    if (!hasJSX && !hasReactCall) {
      const reactImportRegex = /^import\s+React\s+from\s+['"]react['"];\s*$/gm;
      const matches = content.match(reactImportRegex);
      if (matches) {
        content = content.replace(reactImportRegex, '');
        fileImportsRemoved += matches.length;
      }
    }

    // Remove other safe unused imports
    SAFE_UNUSED_IMPORTS.slice(1).forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, '');
        fileImportsRemoved += matches.length;
      }
    });

    // Clean up multiple empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // Remove empty lines at the start of the file
    content = content.replace(/^\n+/, '');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      filesModified++;
      totalImportsRemoved += fileImportsRemoved;
      console.log(`✓ ${filePath} - Removed ${fileImportsRemoved} imports`);
    }

    totalFilesProcessed++;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🧹 Starting safe import cleanup...\n');

const files = glob.sync(FILES_PATTERN, {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
});

console.log(`Found ${files.length} files to process\n`);

files.forEach(processFile);

console.log('\n📊 Cleanup Summary:');
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Imports removed: ${totalImportsRemoved}`);
console.log('\n✅ Safe cleanup complete!');
console.log('\n⚠️  Note: This script only removes obviously safe unused imports.');
console.log('   For a more thorough cleanup, consider using ESLint with unused-imports plugin.');