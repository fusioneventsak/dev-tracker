import { createServiceClient } from '@/lib/supabase/server';
import { Task, Project } from '@/lib/types';

export interface UserTaskSnapshot {
  userId: string;
  userName: string;
  userEmail: string;
  tasks: Task[];
  projects: Project[];
  overdueCount: number;
  dueTodayCount: number;
  inProgressCount: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  userEmail: string;
  tasksCreated: number;
  tasksCompleted: number;
  commentsAdded: number;
  projectsCreated: number;
}

/**
 * Get all active users from profiles table
 */
export async function getAllUsers() {
  const supabase = createServiceClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, name')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return profiles.map(p => ({
    id: p.id,
    email: p.email || '',
    name: p.name || p.email?.split('@')[0] || 'User'
  }));
}

/**
 * Get daily task snapshot for a specific user
 */
export async function getUserDailySnapshot(userId: string): Promise<UserTaskSnapshot | null> {
  const supabase = createServiceClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  // Get user's tasks (not completed)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('done', false)
    .order('target_date', { ascending: true });

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  const taskList: Task[] = (tasks || []).map(t => ({
    id: t.id,
    projectId: t.project_id,
    done: t.done,
    featureTask: t.feature_task,
    description: t.description || '',
    assignedTo: t.assigned_to || '',
    priority: t.priority,
    status: t.status,
    startDate: t.start_date,
    targetDate: t.target_date,
    notes: t.notes || '',
    visibility: t.visibility,
    sharedWith: t.shared_with,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  }));

  const projectList: Project[] = (projects || []).map(p => ({
    id: p.id,
    name: p.name,
    visibility: p.visibility,
    sharedWith: p.shared_with,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = taskList.filter(t => {
    if (!t.targetDate) return false;
    return t.targetDate < today && !t.done;
  }).length;

  const dueTodayCount = taskList.filter(t => {
    if (!t.targetDate) return false;
    return t.targetDate === today && !t.done;
  }).length;

  const inProgressCount = taskList.filter(t => t.status === 'In Progress').length;

  return {
    userId,
    userName: profile.name || profile.email?.split('@')[0] || 'User',
    userEmail: profile.email || '',
    tasks: taskList,
    projects: projectList,
    overdueCount,
    dueTodayCount,
    inProgressCount
  };
}

/**
 * Get weekly activity for a specific user
 */
export async function getUserWeeklyActivity(userId: string, weekStart: Date, weekEnd: Date): Promise<UserActivity | null> {
  const supabase = createServiceClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  // Tasks created this week
  const { data: tasksCreated } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  // Tasks completed this week (based on updated_at when done was set to true)
  const { data: tasksCompleted } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('done', true)
    .gte('updated_at', weekStart.toISOString())
    .lte('updated_at', weekEnd.toISOString());

  // Comments added this week
  const { data: comments } = await supabase
    .from('comments')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  // Projects created this week
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  return {
    userId,
    userName: profile.name || profile.email?.split('@')[0] || 'User',
    userEmail: profile.email || '',
    tasksCreated: tasksCreated?.length || 0,
    tasksCompleted: tasksCompleted?.length || 0,
    commentsAdded: comments?.length || 0,
    projectsCreated: projects?.length || 0
  };
}

/**
 * Get weekly activity for all users
 */
export async function getAllUsersWeeklyActivity(weekStart: Date, weekEnd: Date): Promise<UserActivity[]> {
  const users = await getAllUsers();
  const activities: UserActivity[] = [];

  for (const user of users) {
    const activity = await getUserWeeklyActivity(user.id, weekStart, weekEnd);
    if (activity) {
      activities.push(activity);
    }
  }

  // Sort by total activity (descending)
  return activities.sort((a, b) => {
    const totalA = a.tasksCreated + a.tasksCompleted + a.commentsAdded + a.projectsCreated;
    const totalB = b.tasksCreated + b.tasksCompleted + b.commentsAdded + b.projectsCreated;
    return totalB - totalA;
  });
}

/**
 * Get the start and end of the current week (Monday to Sunday)
 */
export function getCurrentWeekDates(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate Monday of current week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Calculate Sunday of current week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

/**
 * Get the start and end of the previous week (Monday to Sunday)
 */
export function getPreviousWeekDates(): { weekStart: Date; weekEnd: Date } {
  const { weekStart: currentWeekStart } = getCurrentWeekDates();

  const weekStart = new Date(currentWeekStart);
  weekStart.setDate(currentWeekStart.getDate() - 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}
