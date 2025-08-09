const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in the api directory
const apiFiles = glob.sync('src/app/api/**/*.ts');

apiFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the import statement
  if (content.includes("import { logger } from '@/services/logger'")) {
    content = content.replace(
      "import { logger } from '@/services/logger'",
      "import { logger } from '@/lib/logger'"
    );
    
    fs.writeFileSync(file, content);
    console.log(`Fixed logger import in: ${file}`);
  }
});

console.log('Logger imports fixed!');