#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern to match console.log, console.error, console.warn
const consolePattern = /console\.(log|error|warn)\s*\(/g;

// Import statement for logger
const loggerImport = "import { logger } from '@/services/logger';";

// Files to skip
const skipPatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/public/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/__tests__/**',
  '**/services/logger/**',
  '**/services/logger.ts',
  '**/services/logger/index.ts',
  '**/README.md',
  '**/*.md'
];

// Function to determine logger method based on console method
function getLoggerMethod(consoleMethod) {
  switch (consoleMethod) {
    case 'log':
      return 'info';
    case 'error':
      return 'error';
    case 'warn':
      return 'warn';
    default:
      return 'info';
  }
}

// Function to extract context from file path
function getContextFromPath(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1].replace(/\.(ts|tsx|js|jsx)$/, '');
  
  // Try to determine context from path
  if (filePath.includes('/components/')) return fileName;
  if (filePath.includes('/hooks/')) return fileName;
  if (filePath.includes('/services/')) return fileName;
  if (filePath.includes('/features/')) {
    // For features, include the feature name
    const featureMatch = filePath.match(/\/features\/([^\/]+)\//);
    if (featureMatch) {
      return `${featureMatch[1]}:${fileName}`;
    }
  }
  if (filePath.includes('/api/')) return `API:${fileName}`;
  if (filePath.includes('/store/')) return `Store:${fileName}`;
  if (filePath.includes('/lib/')) return `Lib:${fileName}`;
  if (filePath.includes('/app/')) return `Page:${fileName}`;
  
  return fileName;
}

// Helper function to find first comma outside quotes and parentheses
function findFirstCommaOutsideQuotes(str) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplate = false;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';
    
    // Skip escaped characters
    if (prevChar === '\\') continue;
    
    // Track quote state
    if (char === "'" && !inDoubleQuote && !inTemplate) inSingleQuote = !inSingleQuote;
    if (char === '"' && !inSingleQuote && !inTemplate) inDoubleQuote = !inDoubleQuote;
    if (char === '`' && !inSingleQuote && !inDoubleQuote) inTemplate = !inTemplate;
    
    // Track parentheses, braces, and brackets
    if (!inSingleQuote && !inDoubleQuote && !inTemplate) {
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
      if (char === '[') bracketDepth++;
      if (char === ']') bracketDepth--;
      
      // Found comma at top level
      if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
        return i;
      }
    }
  }
  
  return -1;
}

// Function to process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file has console statements
    const matches = content.match(consolePattern);
    if (!matches) {
      return { noChanges: true };
    }
    
    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/services/logger'") || 
                           content.includes('from "@/services/logger"');
    
    // Get context from file path
    const context = getContextFromPath(filePath);
    
    // Count replacements
    let replacementCount = 0;
    
    // Replace console statements
    content = content.replace(/console\.(log|error|warn)\s*\(([\s\S]*?)\)(?=\s*;|\s*\n|\s*\}|\s*\)|,)/g, (match, method, args) => {
      const loggerMethod = getLoggerMethod(method);
      replacementCount++;
      
      // Clean up args
      args = args.trim();
      
      // Handle different argument patterns
      const firstCommaIndex = findFirstCommaOutsideQuotes(args);
      
      if (firstCommaIndex !== -1) {
        const message = args.substring(0, firstCommaIndex).trim();
        const restArgs = args.substring(firstCommaIndex + 1).trim();
        
        // If second argument looks like an object or variable, use it as data
        if (restArgs && !restArgs.startsWith('"') && !restArgs.startsWith("'") && !restArgs.startsWith('`')) {
          return `logger.${loggerMethod}(${message}, '${context}', ${restArgs})`;
        } else {
          // If it's another string, combine them
          return `logger.${loggerMethod}(${message} + ' ' + ${restArgs}, '${context}')`;
        }
      }
      
      // Single argument
      return `logger.${loggerMethod}(${args}, '${context}')`;
    });
    
    // Add logger import if needed and file was modified
    if (!hasLoggerImport && content !== originalContent) {
      // Find the right place to add import
      const importMatch = content.match(/^(import .* from .*;\n)+/m);
      if (importMatch) {
        // Add after existing imports
        const lastImportIndex = importMatch.index + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + loggerImport + '\n' + content.slice(lastImportIndex);
      } else {
        // Add at the beginning if no imports found
        const useClientMatch = content.match(/^'use client';\n/);
        if (useClientMatch) {
          // After 'use client'
          content = content.replace(/^('use client';\n\n?)/, `$1${loggerImport}\n\n`);
        } else {
          // At the very beginning
          content = loggerImport + '\n\n' + content;
        }
      }
    }
    
    // Write back if changed
    if (content !== originalContent) {
      // Create backup
      const backupPath = filePath + '.backup';
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, originalContent, 'utf8');
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      return { updated: true, replacements: replacementCount };
    }
    
    return { noChanges: true };
    
  } catch (error) {
    return { error: error.message };
  }
}

// Main function
function main() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  console.log('Starting console.log replacement for all files...');
  console.log('Creating backups of modified files...\n');
  
  // Find all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    cwd: srcPath,
    absolute: true,
    ignore: skipPatterns
  });
  
  console.log(`Found ${files.length} files to process...\n`);
  
  const results = {
    updated: 0,
    skipped: 0,
    noChanges: 0,
    errors: 0,
    totalReplacements: 0,
    errorFiles: []
  };
  
  // Process files in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, Math.min(i + batchSize, files.length));
    
    batch.forEach(filePath => {
      const relativePath = path.relative(srcPath, filePath);
      process.stdout.write(`Processing: ${relativePath}... `);
      
      const result = processFile(filePath);
      
      if (result.updated) {
        results.updated++;
        results.totalReplacements += result.replacements;
        console.log(`✓ (${result.replacements} replacements)`);
      } else if (result.noChanges) {
        results.noChanges++;
        console.log('no changes');
      } else if (result.error) {
        results.errors++;
        results.errorFiles.push({ file: relativePath, error: result.error });
        console.log(`✗ ERROR: ${result.error}`);
      }
    });
    
    // Progress update
    const processed = Math.min(i + batchSize, files.length);
    if (processed % 50 === 0 || processed === files.length) {
      console.log(`\nProgress: ${processed}/${files.length} files processed`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files updated: ${results.updated}`);
  console.log(`Files with no changes: ${results.noChanges}`);
  console.log(`Files with errors: ${results.errors}`);
  console.log(`Total replacements: ${results.totalReplacements}`);
  
  if (results.errorFiles.length > 0) {
    console.log('\nFiles with errors:');
    results.errorFiles.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  if (results.updated > 0) {
    console.log('\n✓ Console.log replacement completed!');
    console.log('Backup files created with .backup extension');
    console.log('Run "npm run build" to verify everything still works correctly');
  }
}

// Run the script
main();