// Script to check all foreign key constraints referencing auth.users
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConstraints() {
  // Query to find all foreign key constraints referencing auth.users
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        rc.delete_rule,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.unique_constraint_schema = ccu.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.table_schema = 'auth'
      ORDER BY tc.table_name;
    `
  });

  if (error) {
    console.error('Error querying constraints:', error);

    // Alternative approach: Use a direct postgres query
    console.log('\nTrying alternative query...\n');

    const { data: altData, error: altError } = await supabase
      .from('information_schema.table_constraints')
      .select('*');

    console.log('Alternative result:', altData, altError);
    return;
  }

  console.log('Foreign Key Constraints referencing auth.users(id):\n');
  console.log(JSON.stringify(data, null, 2));
}

checkConstraints().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
