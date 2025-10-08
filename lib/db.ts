// Supabase database service
import { createClient } from '@/lib/supabase/server';
import { Database, Project, Task, TeamMember, ProjectStats, TaskComment, Priority, Status } from './types';

// Helper to get current user ID
async function getCurrentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// Project operations
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(p => ({
    id: p.id,
    name: p.name,
    visibility: p.visibility,
    sharedWith: p.shared_with,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return {
    id: data.id,
    name: data.name,
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function createProject(dto: { name: string; visibility?: string; sharedWith?: string[] }): Promise<Project> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('projects')
    .insert([{
      name: dto.name,
      user_id: userId,
      visibility: dto.visibility || 'private',
      shared_with: dto.sharedWith || []
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
  if (updates.sharedWith !== undefined) updateData.shared_with = updates.sharedWith;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return {
    id: data.id,
    name: data.name,
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  return !error;
}

// Task operations
export async function getTasks(projectId?: string): Promise<Task[]> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  let query = supabase
    .from('tasks')
    .select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(t => ({
    id: t.id,
    projectId: t.project_id,
    done: t.done,
    featureTask: t.feature_task,
    description: t.description || '',
    assignedTo: t.assigned_to || '',
    priority: t.priority as Priority,
    status: t.status as Status,
    startDate: t.start_date,
    targetDate: t.target_date,
    notes: t.notes || '',
    visibility: t.visibility,
    sharedWith: t.shared_with,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return {
    id: data.id,
    projectId: data.project_id,
    done: data.done,
    featureTask: data.feature_task,
    description: data.description || '',
    assignedTo: data.assigned_to || '',
    priority: data.priority as Priority,
    status: data.status as Status,
    startDate: data.start_date,
    targetDate: data.target_date,
    notes: data.notes || '',
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'done'>): Promise<Task> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      project_id: taskData.projectId,
      user_id: userId,
      done: taskData.status === 'Done',
      feature_task: taskData.featureTask,
      description: taskData.description,
      assigned_to: taskData.assignedTo,
      priority: taskData.priority,
      status: taskData.status,
      start_date: taskData.startDate || null,
      target_date: taskData.targetDate || null,
      notes: taskData.notes,
      visibility: taskData.visibility,
      shared_with: taskData.sharedWith
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    projectId: data.project_id,
    done: data.done,
    featureTask: data.feature_task,
    description: data.description || '',
    assignedTo: data.assigned_to || '',
    priority: data.priority as Priority,
    status: data.status as Status,
    startDate: data.start_date,
    targetDate: data.target_date,
    notes: data.notes || '',
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const supabase = await createClient();
  await getCurrentUserId();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (updates.featureTask !== undefined) updateData.feature_task = updates.featureTask;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) {
    updateData.status = updates.status;
    updateData.done = updates.status === 'Done';
  }
  if (updates.done !== undefined) updateData.done = updates.done;
  if (updates.startDate !== undefined) updateData.start_date = updates.startDate || null;
  if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate || null;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
  if (updates.sharedWith !== undefined) updateData.shared_with = updates.sharedWith;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    console.error('Task ID:', id);
    console.error('Update data:', updateData);
    return null;
  }
  return {
    id: data.id,
    projectId: data.project_id,
    done: data.done,
    featureTask: data.feature_task,
    description: data.description || '',
    assignedTo: data.assigned_to || '',
    priority: data.priority as Priority,
    status: data.status as Status,
    startDate: data.start_date,
    targetDate: data.target_date,
    notes: data.notes || '',
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deleteTask(id: string): Promise<boolean> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  return !error;
}

// Team member operations
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTeamMember(memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('team_members')
    .insert([{ ...memberData, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  return !error;
}

// Comment operations
export async function getCommentsByTask(taskId: string): Promise<TaskComment[]> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(c => ({
    id: c.id,
    taskId: c.task_id,
    author: c.author,
    content: c.content,
    createdAt: c.created_at
  }));
}

export async function createComment(commentData: Omit<TaskComment, 'id' | 'createdAt'>): Promise<TaskComment> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('comments')
    .insert([{
      task_id: commentData.taskId,
      user_id: userId,
      author: commentData.author,
      content: commentData.content
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    taskId: data.task_id,
    author: data.author,
    content: data.content,
    createdAt: data.created_at
  };
}

export async function deleteComment(id: string): Promise<boolean> {
  const supabase = await createClient();
  await getCurrentUserId(); // Ensure authenticated

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  return !error;
}

// Statistics
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
  const tasks = await getTasks(projectId);
  const total = tasks.length;
  const completed = tasks.filter(t => t.done || t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const backlog = tasks.filter(t => t.status === 'Backlog').length;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    backlog,
    percentComplete
  };
}

export async function getAllStats(): Promise<Record<string, ProjectStats>> {
  const projects = await getProjects();
  const stats: Record<string, ProjectStats> = {};

  for (const project of projects) {
    stats[project.id] = await getProjectStats(project.id);
  }

  return stats;
}
