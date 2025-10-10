import { NextRequest, NextResponse } from 'next/server';
import { getTaskById, updateTask, deleteTask } from '@/lib/db';
import { UpdateTaskDto } from '@/lib/types';
import { Resend } from 'resend';
import { generateTaskAssignmentEmail } from '@/lib/emails/templates';
import { createServiceClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTaskDto = await request.json();

    console.log('PUT /api/tasks/[id] - ID:', id);
    console.log('PUT /api/tasks/[id] - Body:', JSON.stringify(body, null, 2));

    // Get old task to detect changes
    const oldTask = await getTaskById(id);
    const task = await updateTask(id, body);

    if (!task) {
      console.log('PUT /api/tasks - updateTask returned null for ID:', id);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task was assigned to someone new
    if (
      body.assignedTo &&
      oldTask &&
      body.assignedTo !== oldTask.assignedTo &&
      body.assignedTo !== ''
    ) {
      console.log(`🔔 Task assignment detected: ${oldTask.assignedTo} → ${body.assignedTo}`);
      try {
        const supabase = createServiceClient();

        // Get assignee's email
        const { data: assigneeProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('name', body.assignedTo)
          .single();

        console.log('📧 Assignee profile:', assigneeProfile);
        console.log('❌ Profile error:', profileError);

        // Get current user (who made the assignment)
        const { data: { user } } = await supabase.auth.getUser();
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user?.id || '')
          .single();

        // Get project name
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', task.projectId)
          .single();

        if (assigneeProfile?.email) {
          const emailHtml = generateTaskAssignmentEmail({
            assigneeName: assigneeProfile.name || assigneeProfile.email.split('@')[0],
            assignedBy: currentUserProfile?.name || currentUserProfile?.email?.split('@')[0] || 'Someone',
            taskTitle: task.featureTask,
            taskDescription: task.description,
            projectName: project?.name,
            priority: task.priority,
            targetDate: task.targetDate || undefined,
            taskUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${task.projectId}`
          });

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
            to: assigneeProfile.email,
            subject: `✅ You've been assigned: ${task.featureTask}`,
            html: emailHtml
          });

          console.log(`✓ Sent task assignment email to ${assigneeProfile.email}`);
        }
      } catch (emailError) {
        // Don't fail the request if email fails
        console.error('Error sending task assignment email:', emailError);
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteTask(id);

    if (!success) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
