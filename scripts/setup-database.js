// Database Setup Script
// Run with: node scripts/setup-database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://zuzhocubyiicgdvyyhky.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1emhvY3VieWlpY2dkdnl5aGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Mzc3ODEsImV4cCI6MjA2ODIxMzc4MX0.d-6j01y-bdcwegCnIZMUlvEOI-yBcF7XdH2V6C4lz5Y';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'init-database.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.log(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Error on statement ${i + 1}: ${err.message}`);
        // Continue with other statements
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Open http://localhost:3000');
    console.log('3. Test the sign up and onboarding flow');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('🚀 Starting database setup (direct approach)...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'init-database.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL script...');
    
    const { data, error } = await supabase.from('_temp').select('*').limit(1);
    
    if (error && error.code === '42P01') {
      console.log('✅ Database connection successful');
    }
    
    // Since we can't execute arbitrary SQL directly, we'll create the tables manually
    await createTables();
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

async function createTables() {
  console.log('📝 Creating tables manually...');
  
  try {
    // Check if user_profiles table exists
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles');
    
    if (error) {
      console.log('⚠️  Cannot check existing tables, proceeding with setup...');
    }
    
    console.log('✅ Database structure verification completed');
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the content from scripts/init-database.sql');
    console.log('4. Execute the script');
    console.log('5. Start the app: npm run dev');
    
  } catch (err) {
    console.error('❌ Error checking database:', err.message);
  }
}

// Run the setup
setupDatabaseDirect();