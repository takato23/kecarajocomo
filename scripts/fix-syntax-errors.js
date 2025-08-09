#\!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const filesToFix = [
  "src/app/api/ai/recipes/generate/route.ts",
  "src/app/api/ai/recipes/personalized/route.ts"
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (\!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, "utf8");
  let hasChanges = false;
  
  // Fix missing closing braces in object syntax
  content = content.replace(/(\w+:\s*[^,}]+)\s*}\);/g, "$1\n      }\n    });");
  hasChanges = true;
  
  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

filesToFix.forEach(fixFile);
