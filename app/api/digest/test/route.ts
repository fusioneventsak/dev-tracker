import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDailyDigest } from '@/lib/email';

// Initialize Supabase with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Manual trigger endpoint for testing daily digest emails
 * GET /api/digest/test - Send digest to all users
 * GET /api/digest/test?email=user@example.com - Send digest to specific user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email');

    // Fetch users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { message: "No users found" },
        { status: 200 }
      );
    }

    // Filter to specific user if email provided
    const targetUsers = testEmail
      ? users.filter((u) => u.email === testEmail)
      : users;

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: `No user found with email: ${testEmail}` },
        { status: 404 }
      );
    }

    console.log(`Sending test digest to ${targetUsers.length} user(s)`);

    const results = await Promise.allSettled(
      targetUsers.map(async (user) => {
        try {
          // Fetch all projects for this user
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) {
            console.error(`Error fetching projects for user ${user.email}:`, projectsError);
            return { success: false, error: projectsError, email: user.email };
          }

          // Skip users with no projects
          if (!projects || projects.length === 0) {
            return { success: false, error: 'No projects', email: user.email };
          }

          // Fetch tasks and calculate stats for each project
          const projectsWithData = await Promise.all(
            projects.map(async (project) => {
              const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false });

              if (tasksError) {
                console.error(`Error fetching tasks for project ${project.id}:`, tasksError);
                return null;
              }

              const allTasks = tasks || [];
              const total = allTasks.length;
              const completed = allTasks.filter(t => t.done || t.status === 'Done').length;
              const inProgress = allTasks.filter(t => t.status === 'In Progress').length;
              const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

              return {
                name: project.name,
                tasks: allTasks.map(t => ({
                  featureTask: t.feature_task,
                  status: t.status,
                  priority: t.priority,
                  targetDate: t.target_date,
                  assignedTo: t.assigned_to || ''
                })),
                stats: {
                  total,
                  completed,
                  inProgress,
                  percentComplete
                }
              };
            })
          );

          const validProjects = projectsWithData.filter(p => p !== null);

          if (validProjects.length === 0) {
            return { success: false, error: 'No valid projects', email: user.email };
          }

          // Send daily digest email
          const userName = user.user_metadata?.name || user.email.split('@')[0];

          const result = await sendDailyDigest({
            userEmail: user.email,
            userName,
            projects: validProjects
          });

          return { ...result, email: user.email };
        } catch (error) {
          console.error(`Error processing user ${user.email}:`, error);
          return { success: false, error, email: user.email };
        }
      })
    );

    // Format results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

    return NextResponse.json({
      message: "Test digest completed",
      totalUsers: targetUsers.length,
      emailsSent: successful.length,
      emailsFailed: failed.length,
      results: {
        successful: successful.map(r => r.status === 'fulfilled' ? r.value.email : null),
        failed: failed.map(r => ({
          email: r.status === 'fulfilled' ? r.value?.email : 'unknown',
          error: r.status === 'fulfilled' ? r.value?.error : r.reason
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Fatal error in test digest:", error);
    return NextResponse.json(
      {
        error: "Test digest failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
