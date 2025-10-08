// Type definitions for the project management tracker

export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Backlog' | 'In Progress' | 'Code Review' | 'Testing' | 'Done';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  done: boolean;
  featureTask: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  status: Status;
  startDate: string | null;
  targetDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Database {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  comments: TaskComment[];
}

export interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  backlog: number;
  percentComplete: number;
}

export interface CreateProjectDto {
  name: string;
}

export interface UpdateProjectDto {
  name?: string;
}

export interface CreateTaskDto {
  projectId: string;
  featureTask: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  status: Status;
  startDate?: string | null;
  targetDate?: string | null;
  notes?: string;
}

export interface UpdateTaskDto {
  done?: boolean;
  featureTask?: string;
  description?: string;
  assignedTo?: string;
  priority?: Priority;
  status?: Status;
  startDate?: string | null;
  targetDate?: string | null;
  notes?: string;
}

export interface CreateTeamMemberDto {
  name: string;
  email: string;
  role: string;
}

export interface CreateCommentDto {
  taskId: string;
  author: string;
  content: string;
}
