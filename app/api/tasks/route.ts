import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, createNotification } from '@/lib/db';
import { CreateTaskDto } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Ensure the requester is authenticated; avoid throwing 500 on unauthenticated access
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await getTasks(projectId || undefined);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskDto = await request.json();

    if (!body.featureTask || body.featureTask.trim() === '') {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    if (!body.projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const task = await createTask({
      projectId: body.projectId,
      featureTask: body.featureTask.trim(),
      description: body.description || '',
      assignedTo: body.assignedTo || '',
      priority: body.priority || 'Medium',
      status: body.status || 'Backlog',
      startDate: body.startDate || null,
      targetDate: body.targetDate || null,
      notes: body.notes || '',
      visibility: body.visibility || 'private',
      sharedWith: body.sharedWith || [],
      billed: !!body.billed,
      billedDate: body.billed ? (body.billedDate ?? null) : null
    });

    // Create notification if task is assigned to someone
    if (body.assignedTo && body.assignedTo.trim()) {
      const supabase = await createClient();

      // Get the assignee's user ID from team members
      const { data: assignee } = await supabase
        .from('team_members')
        .select('id, email')
        .eq('email', body.assignedTo.toLowerCase())
        .single();

      if (assignee) {
        // Get project name
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', body.projectId)
          .single();

        const projectName = project?.name || 'a project';

        // Get current user's info
        const { data: { user } } = await supabase.auth.getUser();
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user?.id || '')
          .single();

        const creatorName = creatorProfile?.name || creatorProfile?.email?.split('@')[0] || 'Someone';

        // Find the user ID of the assignee from profiles
        const { data: assigneeUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', body.assignedTo.toLowerCase())
          .single();

        if (assigneeUser) {
          await createNotification({
            userId: assigneeUser.id,
            type: 'task_assigned',
            title: `New task assigned: ${body.featureTask.trim()}`,
            message: `${creatorName} assigned you a task in ${projectName}`,
            link: `/projects/${body.projectId}`,
            metadata: {
              taskId: task.id,
              projectId: body.projectId,
              projectName,
              creatorId: user?.id,
              creatorName,
            },
          });
        }
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
