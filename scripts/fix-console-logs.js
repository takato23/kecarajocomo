#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to replace console.log/error/warn/info/debug with logger imports
 * Handles TypeScript and TSX files
 */

const loggerImportTS = "import { logger } from '@/services/logger';";
const loggerImportJS = "import { logger } from '@/services/logger';";

function processFile(filePath) {
  // Skip the logger file itself
  if (filePath.includes('services/logger.ts') || filePath.includes('lib/logger.ts')) {
    console.log(`Skipping logger file: ${filePath}`);
    return;
  }

  // Skip test files and setup files
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('setup.ts')) {
    console.log(`Skipping test file: ${filePath}`);
    return;
  }

  // Skip README files
  if (filePath.endsWith('.md')) {
    console.log(`Skipping markdown file: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let needsLoggerImport = false;

    // Replace console.log with logger.info
    if (content.includes('console.log')) {
      content = content.replace(/console\.log\(/g, 'logger.info(');
      modified = true;
      needsLoggerImport = true;
    }

    // Replace console.error with logger.error
    if (content.includes('console.error')) {
      // Special handling for error interception patterns
      if (!content.includes('const originalError = console.error')) {
        content = content.replace(/console\.error\(/g, 'logger.error(');
        modified = true;
        needsLoggerImport = true;
      }
    }

    // Replace console.warn with logger.warn
    if (content.includes('console.warn')) {
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      modified = true;
      needsLoggerImport = true;
    }

    // Replace console.info with logger.info
    if (content.includes('console.info')) {
      content = content.replace(/console\.info\(/g, 'logger.info(');
      modified = true;
      needsLoggerImport = true;
    }

    // Replace console.debug with logger.debug
    if (content.includes('console.debug')) {
      content = content.replace(/console\.debug\(/g, 'logger.debug(');
      modified = true;
      needsLoggerImport = true;
    }

    // Add logger import if needed and not already present
    if (needsLoggerImport && !content.includes("from '@/services/logger'") && !content.includes('from "../services/logger"')) {
      const importStatement = filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? loggerImportTS : loggerImportJS;
      
      // Find the right place to add the import
      const importRegex = /^import .* from ['"].*['"];?\s*$/m;
      const lastImportMatch = content.match(importRegex);
      
      if (lastImportMatch) {
        // Add after the last import
        const lastImportIndex = content.lastIndexOf(lastImportMatch[0]);
        const insertPosition = lastImportIndex + lastImportMatch[0].length;
        content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
      } else {
        // Add at the beginning of the file
        content = importStatement + '\n\n' + content;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Find all TypeScript and TSX files in src directory
const files = glob.sync('src/**/*.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

console.log(`Found ${files.length} files to process...`);

files.forEach(processFile);

console.log('\n✨ Console log replacement complete!');