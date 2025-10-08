// Email service using Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  userEmail: string;
  userName: string;
}

interface AdminNotificationProps {
  userEmail: string;
  userName: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail({ userEmail, userName }: WelcomeEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Dev Tracker <noreply@fusionprojects.pro>',
      to: [userEmail],
      subject: 'Welcome to Dev Tracker!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); padding: 40px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #60a5fa; margin: 0; font-size: 28px; font-weight: bold;">
                Dev Tracker
              </h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${userName}! 👋</h2>

              <p style="color: #475569; font-size: 16px;">
                Thank you for signing up for Dev Tracker! We're excited to have you on board.
              </p>

              <p style="color: #475569; font-size: 16px;">
                Dev Tracker helps you manage projects, track tasks, collaborate with your team, and stay organized.
              </p>

              <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">Getting Started:</h3>
                <ul style="color: #475569; padding-left: 20px;">
                  <li>Create your first project</li>
                  <li>Add tasks and assign team members</li>
                  <li>Track progress with status updates</li>
                  <li>Collaborate with comments</li>
                </ul>
              </div>

              <a href="https://fusionprojects.pro"
                 style="display: inline-block; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
                Go to Dev Tracker
              </a>

              <p style="color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
              <p>Dev Tracker - Project Management for Development Teams</p>
              <p>fusionprojects.pro</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    return { success: false, error };
  }
}

/**
 * Send admin notification about new user signup
 */
export async function sendAdminNotification({ userEmail, userName }: AdminNotificationProps) {
  // Only send if admin email is configured
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('No admin email configured, skipping admin notification');
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Dev Tracker <noreply@fusionprojects.pro>',
      to: [adminEmail],
      subject: 'New User Signup - Dev Tracker',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #60a5fa; margin: 0;">New User Signup</h2>
            </div>

            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 16px;">
                A new user has signed up for Dev Tracker:
              </p>

              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error };
    }

    console.log('Admin notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
    return { success: false, error };
  }
}

interface DailyDigestProps {
  userEmail: string;
  userName: string;
  projects: Array<{
    name: string;
    tasks: Array<{
      featureTask: string;
      status: string;
      priority: string;
      targetDate?: string;
      assignedTo: string;
    }>;
    stats: {
      total: number;
      completed: number;
      inProgress: number;
      percentComplete: number;
    };
  }>;
}

/**
 * Send daily digest email with project and task summary
 */
export async function sendDailyDigest({ userEmail, userName, projects }: DailyDigestProps) {
  try {
    // Calculate overall stats
    const totalTasks = projects.reduce((sum, p) => sum + p.stats.total, 0);
    const completedTasks = projects.reduce((sum, p) => sum + p.stats.completed, 0);
    const inProgressTasks = projects.reduce((sum, p) => sum + p.stats.inProgress, 0);

    // Get tasks due soon (within 3 days)
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const upcomingTasks = projects.flatMap(p =>
      p.tasks
        .filter(t => {
          if (!t.targetDate || t.status === 'Done') return false;
          const targetDate = new Date(t.targetDate);
          return targetDate >= today && targetDate <= threeDaysFromNow;
        })
        .map(t => ({ ...t, projectName: p.name }))
    ).sort((a, b) => {
      const dateA = new Date(a.targetDate!).getTime();
      const dateB = new Date(b.targetDate!).getTime();
      return dateA - dateB;
    });

    const { data, error } = await resend.emails.send({
      from: 'Dev Tracker <noreply@fusionprojects.pro>',
      to: [userEmail],
      subject: `Daily Digest - ${totalTasks} Tasks Across ${projects.length} Projects`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

            <!-- Header -->
            <div style="background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #60a5fa; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">
                Good morning, ${userName}! 👋
              </h1>
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <!-- Overall Stats -->
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">📊 Your Overview</h2>
              <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 120px; background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${totalTasks}</div>
                  <div style="font-size: 12px; color: #64748b;">Total Tasks</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${completedTasks}</div>
                  <div style="font-size: 12px; color: #64748b;">Completed</div>
                </div>
                <div style="flex: 1; min-width: 120px; background: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center;">
                  <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${inProgressTasks}</div>
                  <div style="font-size: 12px; color: #64748b;">In Progress</div>
                </div>
              </div>
            </div>

            ${upcomingTasks.length > 0 ? `
            <!-- Upcoming Deadlines -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⏰ Upcoming Deadlines (Next 3 Days)</h3>
              ${upcomingTasks.map(task => `
                <div style="background: #ffffff; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#94a3b8'};">
                  <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">${task.featureTask}</div>
                  <div style="font-size: 13px; color: #64748b;">
                    📁 ${task.projectName} • 📅 ${new Date(task.targetDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} •
                    <span style="color: ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#94a3b8'};">●</span> ${task.priority}
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Project Breakdown -->
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">📋 Your Projects</h2>

              ${projects.map(project => `
                <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #1e293b; font-size: 16px;">${project.name}</h3>
                    <span style="background: ${project.stats.percentComplete === 100 ? '#22c55e' : project.stats.percentComplete > 50 ? '#3b82f6' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ${project.stats.percentComplete}%
                    </span>
                  </div>

                  <!-- Progress Bar -->
                  <div style="background: #e2e8f0; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 12px;">
                    <div style="background: linear-gradient(to right, #3b82f6, #06b6d4); height: 100%; width: ${project.stats.percentComplete}%; transition: width 0.3s;"></div>
                  </div>

                  <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
                    ${project.stats.total} tasks • ${project.stats.completed} completed • ${project.stats.inProgress} in progress
                  </div>

                  ${project.tasks.filter(t => t.status !== 'Done').slice(0, 3).length > 0 ? `
                    <div style="font-size: 13px; color: #475569; font-weight: 600; margin-bottom: 8px;">Active Tasks:</div>
                    ${project.tasks.filter(t => t.status !== 'Done').slice(0, 3).map(task => `
                      <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; font-size: 13px;">
                        <span style="color: ${task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#94a3b8'};">●</span>
                        ${task.featureTask}
                        ${task.assignedTo ? `<span style="color: #64748b;"> • ${task.assignedTo}</span>` : ''}
                      </div>
                    `).join('')}
                    ${project.tasks.filter(t => t.status !== 'Done').length > 3 ? `
                      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                        +${project.tasks.filter(t => t.status !== 'Done').length - 3} more tasks
                      </div>
                    ` : ''}
                  ` : `
                    <div style="font-size: 13px; color: #22c55e; font-style: italic;">✅ All tasks completed!</div>
                  `}
                </div>
              `).join('')}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://fusionprojects.netlify.app"
                 style="display: inline-block; background: linear-gradient(to right, #3b82f6, #06b6d4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                View Full Dashboard
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
                Have a productive day! 🚀
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin: 5px 0;">
                Dev Tracker Daily Digest • fusionprojects.netlify.app
              </p>
              <p style="color: #cbd5e1; font-size: 11px; margin: 5px 0;">
                You're receiving this because you have active projects in Dev Tracker
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending daily digest:', error);
      return { success: false, error };
    }

    console.log('Daily digest sent successfully to:', userEmail);
    return { success: true, data };
  } catch (error) {
    console.error('Error in sendDailyDigest:', error);
    return { success: false, error };
  }
}
