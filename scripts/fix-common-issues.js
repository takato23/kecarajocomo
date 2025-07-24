#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing common ESLint issues...\n');

// Helper function to fix files
function fixFile(filePath, fixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        changed = true;
        content = newContent;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix 1: Replace <img> with Next.js Image component
console.log('📸 Step 1: Converting <img> tags to Next.js Image components...');
const imgFiles = glob.sync('**/*.{tsx,jsx}', { 
  ignore: ['node_modules/**', '.next/**', 'training-data/**'] 
});

imgFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Skip if already has next/image import
  if (content.includes('from "next/image"') || content.includes("from 'next/image'")) {
    return;
  }
  
  // Check if file contains <img tags
  if (content.includes('<img')) {
    // Add import at the top
    const importPattern = /^(import[\s\S]*?)\n\n/m;
    const importMatch = content.match(importPattern);
    
    if (importMatch) {
      const newContent = content.replace(
        importPattern,
        `$1\nimport Image from 'next/image';\n\n`
      );
      
      // Replace <img> tags with <Image />
      const imgReplaced = newContent.replace(
        /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)\/>/g,
        (match, before, src, after) => {
          // Extract width and height if present
          const widthMatch = (before + after).match(/width=["']?(\d+)["']?/);
          const heightMatch = (before + after).match(/height=["']?(\d+)["']?/);
          const altMatch = (before + after).match(/alt=["']([^"']+)["']/);
          
          const width = widthMatch ? widthMatch[1] : '100';
          const height = heightMatch ? heightMatch[1] : '100';
          const alt = altMatch ? altMatch[1] : '';
          
          // Remove width/height/alt from the remaining attributes
          let attrs = (before + after)
            .replace(/width=["']?\d+["']?/g, '')
            .replace(/height=["']?\d+["']?/g, '')
            .replace(/alt=["'][^"']+["']/g, '')
            .trim();
          
          return `<Image src="${src}" alt="${alt}" width={${width}} height={${height}} ${attrs} />`;
        }
      );
      
      fs.writeFileSync(file, imgReplaced);
      console.log(`✅ Converted img tags in: ${file}`);
    }
  }
});

// Fix 2: Remove console.log statements
console.log('\n🚫 Step 2: Removing console.log statements...');
const jsFiles = glob.sync('**/*.{ts,tsx,js,jsx}', { 
  ignore: ['node_modules/**', '.next/**', 'training-data/**', 'scripts/**'] 
});

jsFiles.forEach(file => {
  fixFile(file, [
    {
      pattern: /^\s*console\.log\([\s\S]*?\);\s*$/gm,
      replacement: ''
    }
  ]);
});

// Fix 3: Fix TypeScript any types with proper types
console.log('\n📝 Step 3: Replacing some any types with unknown...');
const tsFiles = glob.sync('**/*.{ts,tsx}', { 
  ignore: ['node_modules/**', '.next/**', 'training-data/**'] 
});

tsFiles.forEach(file => {
  fixFile(file, [
    // Replace (error: any) with (error: unknown) in catch blocks
    {
      pattern: /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g,
      replacement: 'catch ($1: unknown)'
    },
    // Replace } catch (error) with } catch (error: unknown)
    {
      pattern: /catch\s*\(\s*(\w+)\s*\)/g,
      replacement: 'catch ($1: unknown)'
    }
  ]);
});

// Fix 4: Remove duplicate React imports
console.log('\n🔄 Step 4: Cleaning up duplicate imports...');
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const importMap = new Map();
  const newLines = [];
  
  lines.forEach(line => {
    if (line.startsWith('import ')) {
      const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
      if (fromMatch) {
        const module = fromMatch[1];
        if (!importMap.has(module)) {
          importMap.set(module, line);
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  });
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`✅ Cleaned imports in: ${file}`);
  }
});

// Count remaining issues
console.log('\n📊 Step 5: Counting remaining issues...');
try {
  const result = execSync('npm run lint 2>&1 | grep -E "(Error:|Warning:)" | wc -l', { encoding: 'utf-8' });
  const count = parseInt(result.trim());
  console.log(`\n📈 Remaining issues: ${count}`);
} catch (error) {
  console.log('Could not count remaining issues');
}

console.log('\n✨ Common issues fixed!');