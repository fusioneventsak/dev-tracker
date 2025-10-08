// JSON file-based database service
import fs from 'fs/promises';
import path from 'path';
import { Database, Project, Task, TeamMember, ProjectStats, TaskComment } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read database
async function readDb(): Promise<Database> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    const defaultDb: Database = {
      projects: [],
      tasks: [],
      teamMembers: [],
      comments: []
    };
    await writeDb(defaultDb);
    return defaultDb;
  }
}

// Write database
async function writeDb(data: Database): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Project operations
export async function getProjects(): Promise<Project[]> {
  const db = await readDb();
  return db.projects;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = await readDb();
  return db.projects.find(p => p.id === id) || null;
}

export async function createProject(dto: { name: string; visibility?: string; sharedWith?: string[] }): Promise<Project> {
  const db = await readDb();
  const newProject: Project = {
    id: generateId(),
    name: dto.name,
    visibility: (dto.visibility as 'private' | 'specific' | 'all') || 'private',
    sharedWith: dto.sharedWith || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.projects.push(newProject);
  await writeDb(db);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const db = await readDb();
  const index = db.projects.findIndex(p => p.id === id);
  if (index === -1) return null;

  db.projects[index] = {
    ...db.projects[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await writeDb(db);
  return db.projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== id);
  db.tasks = db.tasks.filter(t => t.projectId !== id); // Delete associated tasks

  if (db.projects.length < initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// Task operations
export async function getTasks(projectId?: string): Promise<Task[]> {
  const db = await readDb();
  if (projectId) {
    return db.tasks.filter(t => t.projectId === projectId);
  }
  return db.tasks;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await readDb();
  return db.tasks.find(t => t.id === id) || null;
}

export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'done'>): Promise<Task> {
  const db = await readDb();
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    done: taskData.status === 'Done',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.tasks.push(newTask);
  await writeDb(db);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const db = await readDb();
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const updatedTask = {
    ...db.tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Auto-update done status based on status field
  if (updates.status === 'Done') {
    updatedTask.done = true;
  } else if (updates.status) {
    updatedTask.done = false;
  }

  db.tasks[index] = updatedTask;
  await writeDb(db);
  return updatedTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.tasks.length;
  db.tasks = db.tasks.filter(t => t.id !== id);

  if (db.tasks.length < initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// Team member operations
export async function getTeamMembers(): Promise<TeamMember[]> {
  const db = await readDb();
  return db.teamMembers;
}

export async function createTeamMember(memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const db = await readDb();
  const newMember: TeamMember = {
    ...memberData,
    id: generateId()
  };
  db.teamMembers.push(newMember);
  await writeDb(db);
  return newMember;
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
  const db = await readDb();
  const index = db.teamMembers.findIndex(m => m.id === id);
  if (index === -1) return null;

  db.teamMembers[index] = {
    ...db.teamMembers[index],
    ...updates
  };
  await writeDb(db);
  return db.teamMembers[index];
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.teamMembers.length;
  db.teamMembers = db.teamMembers.filter(m => m.id !== id);

  if (db.teamMembers.length < initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// Comment operations
export async function getCommentsByTask(taskId: string): Promise<TaskComment[]> {
  const db = await readDb();
  return db.comments.filter(c => c.taskId === taskId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createComment(commentData: Omit<TaskComment, 'id' | 'createdAt'>): Promise<TaskComment> {
  const db = await readDb();
  const newComment: TaskComment = {
    ...commentData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  db.comments.push(newComment);
  await writeDb(db);
  return newComment;
}

export async function deleteComment(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.comments.length;
  db.comments = db.comments.filter(c => c.id !== id);

  if (db.comments.length < initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
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
