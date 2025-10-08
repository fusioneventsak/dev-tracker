import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByTask, createComment } from '@/lib/db';
import { CreateCommentDto } from '@/lib/types';

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

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
