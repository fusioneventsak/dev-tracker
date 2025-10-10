import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAllUsers, getAllUsersWeeklyActivity, getPreviousWeekDates } from '@/lib/emails/data';
import { generateWeeklyReportEmail } from '@/lib/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting weekly report email job...');

    // Get previous week's date range
    const { weekStart, weekEnd } = getPreviousWeekDates();
    console.log(`Generating report for week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);

    // Get all users
    const users = await getAllUsers();
    console.log(`Found ${users.length} users to send reports to`);

    // Get all users' weekly activity
    const userActivities = await getAllUsersWeeklyActivity(weekStart, weekEnd);
    console.log(`Processed activity for ${userActivities.length} users`);

    // Calculate totals
    const totalTasksCreated = userActivities.reduce((sum, u) => sum + u.tasksCreated, 0);
    const totalTasksCompleted = userActivities.reduce((sum, u) => sum + u.tasksCompleted, 0);
    const totalComments = userActivities.reduce((sum, u) => sum + u.commentsAdded, 0);
    const totalProjects = userActivities.reduce((sum, u) => sum + u.projectsCreated, 0);

    // Skip if there's no activity
    if (totalTasksCreated === 0 && totalTasksCompleted === 0 && totalComments === 0 && totalProjects === 0) {
      console.log('No activity this week, skipping report');
      return NextResponse.json({
        message: 'No activity to report',
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString()
      });
    }

    // Generate email HTML (same for all users)
    const emailHtml = generateWeeklyReportEmail({
      userActivities,
      totalTasksCreated,
      totalTasksCompleted,
      totalComments,
      totalProjects,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString()
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send to all users
    for (const user of users) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
          to: user.email,
          subject: `📊 Weekly Team Activity Report - ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html: emailHtml
        });

        console.log(`✓ Sent weekly report to ${user.email}`);
        results.success++;

      } catch (error) {
        console.error(`✗ Failed to send to ${user.email}:`, error);
        results.failed++;
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Weekly report job completed:', results);

    return NextResponse.json({
      message: 'Weekly reports sent',
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      stats: {
        totalTasksCreated,
        totalTasksCompleted,
        totalComments,
        totalProjects
      },
      results
    });

  } catch (error) {
    console.error('Error in weekly report job:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
