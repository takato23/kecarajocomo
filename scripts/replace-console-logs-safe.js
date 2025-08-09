#\!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Safe fix for syntax errors in API routes
 */

function fixSyntaxErrors() {
  const problematicFiles = [
    'src/app/api/ai/recipes/proxy/route.ts',
    'src/app/api/ai/recipes/suggest-pantry/route.ts',
    'src/app/api/pantry/analysis/route.ts',
    'src/app/api/pantry/availability/route.ts',
    'src/app/api/pantry/consume/route.ts'
  ];

  problematicFiles.forEach(file => {
    try {
      if (\!fs.existsSync(file)) return;
      
      let content = fs.readFileSync(file, 'utf8');
      let originalContent = content;
      
      // Fix specific patterns
      // 1. Fix generation config closing
      content = content.replace(/maxOutputTokens:\s*\d+,\s*\}\),/g, 'maxOutputTokens: 2048\n        }\n      ),');
      
      // 2. Fix object closing patterns
      content = content.replace(/(\s+)(\w+:\s*[^,\n}]+)\s*\}\)/gm, '$1$2\n$1}\n$1)');
      
      // 3. Fix array forEach pattern
      content = content.replace(/\}\);$/gm, '}');
      
      // 4. Fix semicolon in object
      content = content.replace(/(\s+)\};\s*$/gm, '$1}');
      
      // 5. Fix misplaced closing braces
      content = content.replace(/(\s+)\}\)\s*$/gm, '$1})');
      
      if (content \!== originalContent) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  });
}

fixSyntaxErrors();
console.log('✅ Safe syntax fixes completed\!');
EOF < /dev/null