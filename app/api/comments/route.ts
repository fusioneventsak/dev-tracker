import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByTask, createComment, getTaskById } from '@/lib/db';
import { CreateCommentDto } from '@/lib/types';
import { Resend } from 'resend';
import { generateTaskCommentEmail } from '@/lib/emails/templates';
import { createServiceClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const comments = await getCommentsByTask(taskId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCommentDto = await request.json();

    if (!body.taskId || !body.content?.trim()) {
      return NextResponse.json({ error: 'Task ID and content are required' }, { status: 400 });
    }

    if (!body.author?.trim()) {
      return NextResponse.json({ error: 'Author is required' }, { status: 400 });
    }

    const comment = await createComment({
      taskId: body.taskId,
      author: body.author.trim(),
      content: body.content.trim()
    });

    // Send notification email to task assignee
    try {
      const supabase = createServiceClient();

      // Get task details
      const task = await getTaskById(body.taskId);
      console.log(`💬 Comment created by ${body.author} on task assigned to: ${task?.assignedTo || 'unassigned'}`);

      if (task && task.assignedTo && task.assignedTo !== '') {
        // Get assignee's email (person who should receive notification)
        const { data: assigneeProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('name', task.assignedTo)
          .single();

        console.log('📧 Comment notification - Assignee profile:', assigneeProfile);
        console.log('❌ Comment notification - Profile error:', profileError);

        // Only send email if assignee exists and is not the commenter
        if (assigneeProfile?.email && assigneeProfile.name !== body.author.trim()) {
          // Get project name
          const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', task.projectId)
            .single();

          const emailHtml = generateTaskCommentEmail({
            recipientName: assigneeProfile.name || assigneeProfile.email.split('@')[0],
            commenterName: body.author.trim(),
            taskTitle: task.featureTask,
            commentText: body.content.trim(),
            projectName: project?.name,
            taskUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${task.projectId}`
          });

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Dev Tracker <onboarding@fusiontracker.pro>',
            to: assigneeProfile.email,
            subject: `💬 New comment on: ${task.featureTask}`,
            html: emailHtml
          });

          console.log(`✓ Sent comment notification email to ${assigneeProfile.email}`);
        }
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Error sending comment notification email:', emailError);
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
