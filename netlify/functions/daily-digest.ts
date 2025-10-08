import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { sendDailyDigest } from "../../lib/email";

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

// Scheduled to run at 7am ET (12pm UTC during EST, 11am UTC during EDT)
// Using 12pm UTC as baseline (7am EST)
export const handler = schedule("0 12 * * *", async (event) => {
  console.log("Starting daily digest email job at:", new Date().toISOString());

  try {
    // Fetch all users from Supabase Auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch users" })
      };
    }

    if (!users || users.length === 0) {
      console.log("No users found");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No users to send digest to" })
      };
    }

    console.log(`Found ${users.length} users`);

    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          // Validate user has email
          if (!user.email) {
            console.log('Skipping user without email');
            return null;
          }

          // Fetch all projects for this user
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) {
            console.error(`Error fetching projects for user ${user.email}:`, projectsError);
            return null;
          }

          // Skip users with no projects
          if (!projects || projects.length === 0) {
            console.log(`User ${user.email} has no projects, skipping`);
            return null;
          }

          // Fetch tasks and calculate stats for each project
          const projectsWithData = await Promise.all(
            projects.map(async (project) => {
              // Fetch tasks for this project
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

          // Filter out null projects and ensure we have valid data
          const validProjects = projectsWithData.filter(p => p !== null);

          if (validProjects.length === 0) {
            console.log(`User ${user.email} has no valid project data, skipping`);
            return null;
          }

          // Send daily digest email
          const userName = user.user_metadata?.name || user.email.split('@')[0];

          const result = await sendDailyDigest({
            userEmail: user.email,
            userName,
            projects: validProjects
          });

          if (result.success) {
            console.log(`✅ Sent daily digest to ${user.email}`);
          } else {
            console.error(`❌ Failed to send daily digest to ${user.email}:`, result.error);
          }

          return result;
        } catch (error) {
          console.error(`Error processing user ${user.email}:`, error);
          return null;
        }
      })
    );

    // Count successful and failed sends
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - successful;

    console.log(`Daily digest job completed: ${successful} sent, ${failed} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily digest job completed",
        totalUsers: users.length,
        emailsSent: successful,
        emailsFailed: failed,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error("Fatal error in daily digest job:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Daily digest job failed",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
});
