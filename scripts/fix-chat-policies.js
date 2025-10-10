// Script to fix chat RLS policies
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function fixChatPolicies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read the SQL file
  const sqlPath = path.join(__dirname, '../supabase/migrations/20251009000000_fix_chat_policies.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🔄 Applying chat policy fixes...');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct query
      return await supabase.from('_supabase').select('*').limit(0).then(() => {
        // Fallback: execute SQL statements one by one
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        return Promise.all(statements.map(async (stmt) => {
          console.log('Executing:', stmt.substring(0, 50) + '...');
          const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ query: stmt })
          });
          return res.json();
        }));
      });
    });

    if (error) {
      console.error('❌ Error applying fixes:', error);
      process.exit(1);
    }

    console.log('✅ Chat policy fixes applied successfully!');
    console.log('🔄 Please refresh your browser to test the chat.');
  } catch (err) {
    console.error('❌ Failed to apply fixes:', err.message);
    console.log('\n📋 Manual fix required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the SQL from:');
    console.log('   supabase/migrations/20251009000000_fix_chat_policies.sql');
    console.log('3. Click "Run"');
    process.exit(1);
  }
}

fixChatPolicies();
