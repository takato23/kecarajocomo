#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script to migrate from NextAuth to Supabase Auth
 * This will update all API routes and components
 */

const replacements = [
  // Import replacements
  {
    from: /import\s+{\s*getServerSession\s*}\s+from\s+['"]@\/lib\/auth['"]/g,
    to: 'import { getUser } from \'@/lib/auth/supabase-auth\''
  },
  {
    from: /import\s+{\s*getServerSession\s*}\s+from\s+['"]next-auth['"]/g,
    to: 'import { getUser } from \'@/lib/auth/supabase-auth\''
  },
  {
    from: /import\s+{\s*authOptions\s*}\s+from\s+['"]@\/lib\/auth['"]/g,
    to: '// authOptions removed - using Supabase Auth'
  },
  // Function call replacements
  {
    from: /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)/g,
    to: 'const user = await getUser()'
  },
  {
    from: /const\s+session\s*=\s*await\s+getServerSession\(\)/g,
    to: 'const user = await getUser()'
  },
  // Session check replacements
  {
    from: /if\s*\(!session\)/g,
    to: 'if (!user)'
  },
  {
    from: /if\s*\(!session\.user\)/g,
    to: 'if (!user)'
  },
  {
    from: /session\.user\.id/g,
    to: 'user.id'
  },
  {
    from: /session\.user\.email/g,
    to: 'user.email'
  },
  {
    from: /session\.user/g,
    to: 'user'
  }
];

// Files to process
const patterns = [
  'src/app/api/**/*.ts',
  'src/app/api/**/*.tsx',
  'src/app/(app)/**/*.ts',
  'src/app/(app)/**/*.tsx',
  'src/app/(protected)/**/*.ts',
  'src/app/(protected)/**/*.tsx',
  'src/components/**/*.ts',
  'src/components/**/*.tsx',
  'src/lib/**/*.ts',
  'src/lib/**/*.tsx'
];

let filesProcessed = 0;
let filesModified = 0;

console.log('🔄 Starting auth migration from NextAuth to Supabase...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/supabase-auth.ts'] });
  
  files.forEach(file => {
    filesProcessed++;
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      filesModified++;
      console.log(`✅ Updated: ${file}`);
    }
  });
});

console.log(`\n📊 Migration Summary:`);
console.log(`   - Files processed: ${filesProcessed}`);
console.log(`   - Files modified: ${filesModified}`);

// Create a migration report
const report = {
  date: new Date().toISOString(),
  filesProcessed,
  filesModified,
  patterns,
  replacements: replacements.map(r => ({ from: r.from.toString(), to: r.to }))
};

fs.writeFileSync(
  path.join(process.cwd(), 'auth-migration-report.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('\n📄 Migration report saved to auth-migration-report.json');
console.log('\n⚠️  Next steps:');
console.log('1. Review modified files for any edge cases');
console.log('2. Update environment variables (remove NEXTAUTH_* and ensure SUPABASE_* are set)');
console.log('3. Test authentication flow thoroughly');
console.log('4. Update middleware.ts to use Supabase auth');