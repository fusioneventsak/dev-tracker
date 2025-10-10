import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAllUsers, getUserDailySnapshot } from '@/lib/emails/data';
import { generateDailySnapshotEmail } from '@/lib/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily snapshot email job...');

    // Get all users
    const users = await getAllUsers();
    console.log(`Found ${users.length} users to process`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Send email to each user
    for (const user of users) {
      try {
        // Get user's daily snapshot data
        const snapshot = await getUserDailySnapshot(user.id);

        if (!snapshot) {
          console.log(`Skipping user ${user.email} - could not fetch snapshot`);
          results.skipped++;
          continue;
        }

        // Skip if user has no tasks
        if (snapshot.tasks.length === 0) {
          console.log(`Skipping user ${user.email} - no tasks`);
          results.skipped++;
          continue;
        }

        // Generate email HTML
        const emailHtml = generateDailySnapshotEmail({
          userName: snapshot.userName,
          tasks: snapshot.tasks,
          projects: snapshot.projects,
          overdueCount: snapshot.overdueCount,
          dueTodayCount: snapshot.dueTodayCount,
          inProgressCount: snapshot.inProgressCount
        });

        // Send email
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
          to: user.email,
          subject: `📋 Your Daily Task Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html: emailHtml
        });

        console.log(`✓ Sent daily snapshot to ${user.email}`);
        results.success++;

      } catch (error) {
        console.error(`✗ Failed to send to ${user.email}:`, error);
        results.failed++;
        results.errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Daily snapshot job completed:', results);

    return NextResponse.json({
      message: 'Daily snapshot emails sent',
      results
    });

  } catch (error) {
    console.error('Error in daily snapshot job:', error);
    return NextResponse.json(
      { error: 'Failed to send daily snapshots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
