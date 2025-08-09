#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern to match console.log, console.error, console.warn
const consolePattern = /console\.(log|error|warn)\s*\(/g;

// Import statement for logger
const loggerImport = "import { logger } from '@/services/logger';";

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
  if (filePath.includes('/api/')) return `API:${fileName}`;
  if (filePath.includes('/store/')) return `Store:${fileName}`;
  if (filePath.includes('/lib/')) return `Lib:${fileName}`;
  
  return fileName;
}

// Function to process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Skip if file is a test file
    if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__')) {
      console.log(`Skipping test file: ${filePath}`);
      return;
    }
    
    // Skip if file is the logger itself
    if (filePath.includes('services/logger') || filePath.includes('services/logger/index.ts')) {
      console.log(`Skipping logger file: ${filePath}`);
      return;
    }
    
    // Check if file has console statements
    if (!consolePattern.test(content)) {
      return;
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Check if logger is already imported
    const hasLoggerImport = content.includes("from '@/services/logger'") || 
                           content.includes('from "@/services/logger"');
    
    // Get context from file path
    const context = getContextFromPath(filePath);
    
    // Replace console statements
    content = content.replace(/console\.(log|error|warn)\s*\((.*?)\);/g, (match, method, args) => {
      const loggerMethod = getLoggerMethod(method);
      
      // Handle different argument patterns
      if (args.includes(',')) {
        // Multiple arguments - try to extract message and data
        const parts = args.split(',');
        const message = parts[0].trim();
        const restArgs = parts.slice(1).join(',').trim();
        
        // If second argument looks like an object or variable, use it as data
        if (restArgs && !restArgs.startsWith('"') && !restArgs.startsWith("'")) {
          return `logger.${loggerMethod}(${message}, '${context}', ${restArgs});`;
        } else {
          return `logger.${loggerMethod}(${message}, '${context}');`;
        }
      } else {
        // Single argument
        return `logger.${loggerMethod}(${args}, '${context}');`;
      }
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
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  // Find all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    cwd: srcPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  console.log(`Found ${files.length} files to process...`);
  
  let processedCount = 0;
  files.forEach(file => {
    processFile(file);
    processedCount++;
    if (processedCount % 50 === 0) {
      console.log(`Processed ${processedCount}/${files.length} files...`);
    }
  });
  
  console.log(`\nFinished processing ${files.length} files!`);
}

// Run the script
main();