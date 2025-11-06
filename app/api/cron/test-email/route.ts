import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateDailySnapshotEmail, generateWeeklyReportEmail } from '@/lib/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'daily';
    const email = url.searchParams.get('email') || 'test@example.com';

    console.log(`Sending test ${type} email to ${email}...`);

    if (type === 'daily') {
      // Generate sample daily snapshot email
      const emailHtml = generateDailySnapshotEmail({
        userName: 'Test User',
        tasks: [
          {
            id: '1',
            projectId: 'proj-1',
            done: false,
            featureTask: 'Complete authentication system',
            description: 'Implement JWT-based authentication',
            assignedTo: 'Test User',
            priority: 'High' as const,
            status: 'In Progress' as const,
            startDate: new Date().toISOString().split('T')[0],
            targetDate: new Date().toISOString().split('T')[0],
            notes: '',
            visibility: 'private',
            sharedWith: [],
            billed: false,
            billedDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            projectId: 'proj-1',
            done: false,
            featureTask: 'Build user dashboard',
            description: 'Create responsive dashboard with charts',
            assignedTo: 'Test User',
            priority: 'High' as const,
            status: 'Backlog' as const,
            startDate: null,
            targetDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday (overdue)
            notes: '',
            visibility: 'private',
            sharedWith: [],
            billed: false,
            billedDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        projects: [],
        overdueCount: 1,
        dueTodayCount: 1,
        inProgressCount: 1
      });

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
        to: email,
        subject: `📋 [TEST] Daily Task Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: emailHtml
      });

      console.log('✅ Test daily email sent:', result);

      return NextResponse.json({
        message: 'Test daily snapshot email sent',
        emailId: result.data?.id,
        to: email
      });

    } else if (type === 'weekly') {
      // Generate sample weekly report email
      const emailHtml = generateWeeklyReportEmail({
        userActivities: [
          {
            userId: 'user-1',
            userName: 'Alice Johnson',
            userEmail: 'alice@example.com',
            tasksCreated: 8,
            tasksCompleted: 12,
            commentsAdded: 15,
            projectsCreated: 2
          },
          {
            userId: 'user-2',
            userName: 'Bob Smith',
            userEmail: 'bob@example.com',
            tasksCreated: 5,
            tasksCompleted: 7,
            commentsAdded: 8,
            projectsCreated: 1
          },
          {
            userId: 'user-3',
            userName: 'Carol Davis',
            userEmail: 'carol@example.com',
            tasksCreated: 3,
            tasksCompleted: 4,
            commentsAdded: 5,
            projectsCreated: 0
          }
        ],
        totalTasksCreated: 16,
        totalTasksCompleted: 23,
        totalComments: 28,
        totalProjects: 3,
        weekStart: new Date(Date.now() - 7 * 86400000).toISOString(),
        weekEnd: new Date().toISOString()
      });

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
        to: email,
        subject: `📊 [TEST] Weekly Team Activity Report`,
        html: emailHtml
      });

      console.log('✅ Test weekly email sent:', result);

      return NextResponse.json({
        message: 'Test weekly report email sent',
        emailId: result.data?.id,
        to: email
      });

    } else {
      return NextResponse.json({ error: 'Invalid type. Use ?type=daily or ?type=weekly' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
