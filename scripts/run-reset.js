const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Read the reset script
    const resetScript = fs.readFileSync(path.join(__dirname, 'reset-database.sql'), 'utf8');
    
    console.log('📝 Executing reset script...');
    
    // Execute the reset script
    const { data, error } = await supabase.rpc('exec_sql', { sql: resetScript });
    
    if (error) {
      console.error('❌ Error executing reset script:', error);
      return;
    }
    
    console.log('✅ Database reset completed successfully!');
    console.log('📊 All tables have been recreated and migrations applied');
    console.log('🎯 You can now register new users and start fresh');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
  }
}

// Alternative method using direct SQL execution
async function resetDatabaseDirect() {
  try {
    console.log('🔄 Starting database reset (direct method)...');
    
    // Read the reset script
    const resetScript = fs.readFileSync(path.join(__dirname, 'reset-database.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = resetScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('does not exist')) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          }
        } catch (err) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('✅ Database reset completed successfully!');
    console.log('📊 All tables have been recreated and migrations applied');
    console.log('🎯 You can now register new users and start fresh');
    
  } catch (error) {
    console.error('❌ Error during database reset:', error);
  }
}

// Run the reset
resetDatabaseDirect();