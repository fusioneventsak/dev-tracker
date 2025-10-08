import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask } from '@/lib/db';
import { CreateTaskDto } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

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
      sharedWith: body.sharedWith || []
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
