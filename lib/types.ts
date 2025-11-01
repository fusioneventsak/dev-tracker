// Type definitions for the project management tracker

export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Backlog' | 'In Progress' | 'Code Review' | 'Testing' | 'Done';
export type Visibility = 'private' | 'specific' | 'all';

export interface Project {
  id: string;
  userId: string;
  name: string;
  visibility: Visibility;
  sharedWith: string[];
  billed: boolean;
  billedDate: string | null;
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
  visibility: Visibility;
  sharedWith: string[];
  billed: boolean;
  billedDate: string | null;
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
  visibility?: Visibility;
  sharedWith?: string[];
  billed?: boolean;
  billedDate?: string | null;
}

export interface UpdateProjectDto {
  name?: string;
  visibility?: Visibility;
  sharedWith?: string[];
  billed?: boolean;
  billedDate?: string | null;
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
  visibility?: Visibility;
  sharedWith?: string[];
  billed?: boolean;
  billedDate?: string | null;
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
  visibility?: Visibility;
  sharedWith?: string[];
  billed?: boolean;
  billedDate?: string | null;
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

// Chat system types
export type ChatType = 'direct' | 'group' | 'all';

export interface Chat {
  id: string;
  name: string | null;
  type: ChatType;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: string;
  userName?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  replyTo?: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  senderName?: string;
  senderEmail?: string;
  files?: MessageFile[];
  reactions?: MessageReaction[];
  repliedMessage?: Message | null;
}

export interface MessageFile {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedAt: string;
}

export interface TaskFile {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateMessageDto {
  chatId: string;
  content: string;
  files?: File[];
}

export interface ChatWithDetails extends Chat {
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

// Notification types
export type NotificationType = 'chat_message' | 'task_assigned' | 'task_updated' | 'comment_added';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
