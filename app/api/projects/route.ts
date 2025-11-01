import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';
import { CreateProjectDto } from '@/lib/types';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectDto = await request.json();

    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await createProject({
      name: body.name.trim(),
      visibility: body.visibility,
      sharedWith: body.sharedWith,
      billed: body.billed,
      billedDate: body.billedDate ?? null
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
