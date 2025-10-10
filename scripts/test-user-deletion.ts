/**
 * Test script to verify user deletion works correctly
 *
 * This script tests that:
 * 1. User can be deleted via the API
 * 2. All user data is properly cleaned up (profile, tasks, projects, etc.)
 * 3. No orphaned records remain
 *
 * Run with: npx tsx scripts/test-user-deletion.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createServiceClient } from '@/lib/supabase/server';

async function testUserDeletion() {
  console.log('🧪 Starting user deletion test...\n');

  const supabase = createServiceClient();

  // Step 1: Create a test user
  console.log('1️⃣ Creating test user...');
  const testEmail = `test-delete-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: 'Test Delete User' }
  });

  if (authError || !authData.user) {
    console.error('❌ Failed to create test user:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`   ✓ Created user: ${userId} (${testEmail})\n`);

  // Step 2: Create test data for this user
  console.log('2️⃣ Creating test data...');

  // Create a project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      name: 'Test Project',
      user_id: userId,
      visibility: 'private'
    }])
    .select()
    .single();

  if (projectError || !project) {
    console.error('❌ Failed to create project:', projectError);
    return;
  }
  console.log(`   ✓ Created project: ${project.id}`);

  // Create a task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert([{
      project_id: project.id,
      user_id: userId,
      feature_task: 'Test Task',
      description: 'Test task for deletion',
      priority: 'Medium',
      status: 'Backlog'
    }])
    .select()
    .single();

  if (taskError || !task) {
    console.error('❌ Failed to create task:', taskError);
    return;
  }
  console.log(`   ✓ Created task: ${task.id}`);

  // Create a comment
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .insert([{
      task_id: task.id,
      user_id: userId,
      author: 'Test Delete User',
      content: 'Test comment'
    }])
    .select()
    .single();

  if (commentError || !comment) {
    console.error('❌ Failed to create comment:', commentError);
    return;
  }
  console.log(`   ✓ Created comment: ${comment.id}\n`);

  // Step 3: Verify data exists
  console.log('3️⃣ Verifying data exists...');
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log(`   ✓ Profile exists: ${profile?.email}`);
  console.log(`   ✓ Project exists: ${project.name}`);
  console.log(`   ✓ Task exists: ${task.feature_task}`);
  console.log(`   ✓ Comment exists: ${comment.content}\n`);

  // Step 4: Test the deletion via API
  console.log('4️⃣ Testing user deletion via API...');

  // Import the deleteAuthenticatedUser function
  const { deleteAuthenticatedUser } = await import('@/lib/db');

  const deleteSuccess = await deleteAuthenticatedUser(userId);

  if (!deleteSuccess) {
    console.error('❌ User deletion FAILED!');
    console.error('   Check the logs above for error details.');
    return;
  }

  console.log('   ✓ User deletion completed\n');

  // Step 5: Verify all data is deleted
  console.log('5️⃣ Verifying all data is cleaned up...');

  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: projectCheck } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project.id)
    .single();

  const { data: taskCheck } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', task.id)
    .single();

  const { data: commentCheck } = await supabase
    .from('comments')
    .select('*')
    .eq('id', comment.id)
    .single();

  const { data: authCheck } = await supabase.auth.admin.getUserById(userId);

  // Check results
  const allDeleted =
    !profileCheck &&
    !projectCheck &&
    !taskCheck &&
    !commentCheck &&
    !authCheck.user;

  if (allDeleted) {
    console.log('   ✅ Profile deleted: ✓');
    console.log('   ✅ Project deleted: ✓');
    console.log('   ✅ Task deleted: ✓');
    console.log('   ✅ Comment deleted: ✓');
    console.log('   ✅ Auth user deleted: ✓\n');
    console.log('🎉 TEST PASSED! User deletion works correctly!\n');
  } else {
    console.log('   ❌ Profile deleted:', !profileCheck ? '✓' : '✗');
    console.log('   ❌ Project deleted:', !projectCheck ? '✓' : '✗');
    console.log('   ❌ Task deleted:', !taskCheck ? '✓' : '✗');
    console.log('   ❌ Comment deleted:', !commentCheck ? '✓' : '✗');
    console.log('   ❌ Auth user deleted:', !authCheck.user ? '✓' : '✗\n');
    console.log('❌ TEST FAILED! Some data was not deleted.\n');
  }
}

// Run the test
testUserDeletion().catch(console.error);
