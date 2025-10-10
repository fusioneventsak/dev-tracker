// Supabase database service
import { createClient, createServiceClient } from '@/lib/supabase/server';
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
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter projects by user access:
  // 1. User owns the project (user_id matches)
  // 2. Project is visible to all (visibility = 'all')
  // 3. User is in the sharedWith list (shared_with contains userId)
  const filteredData = data.filter(p =>
    p.user_id === userId ||
    p.visibility === 'all' ||
    (p.shared_with && Array.isArray(p.shared_with) && p.shared_with.includes(userId))
  );

  return filteredData.map(p => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    visibility: p.visibility,
    sharedWith: p.shared_with,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  // Check if user has access to this project:
  // 1. User owns the project (user_id matches)
  // 2. Project is visible to all (visibility = 'all')
  // 3. User is in the sharedWith list (shared_with contains userId)
  const hasAccess =
    data.user_id === userId ||
    data.visibility === 'all' ||
    (data.shared_with && Array.isArray(data.shared_with) && data.shared_with.includes(userId));

  if (!hasAccess) {
    return null; // User doesn't have permission to view this project
  }

  return {
    id: data.id,
    userId: data.user_id,
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
    userId: data.user_id,
    name: data.name,
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  // First check if user has permission to update this project
  const existingProject = await getProjectById(id);
  if (!existingProject || existingProject.userId !== userId) {
    return null; // Only owner can update the project
  }

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
    userId: data.user_id,
    name: data.name,
    visibility: data.visibility,
    sharedWith: data.shared_with,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  // First check if user has permission to delete this project
  const existingProject = await getProjectById(id);
  if (!existingProject || existingProject.userId !== userId) {
    return false; // Only owner can delete the project
  }

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

  // Get the team member's email first
  const { data: member } = await supabase
    .from('team_members')
    .select('email')
    .eq('id', id)
    .single();

  // Delete the team member
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);

  if (error) return false;

  // Also delete any pending invitations for this email
  if (member?.email) {
    await supabase
      .from('user_invitations')
      .delete()
      .eq('email', member.email.toLowerCase());
  }

  return true;
}

export async function deleteAuthenticatedUser(userId: string): Promise<boolean> {
  try {
    // Use service role client to bypass RLS (no auth check needed - service role has full access)
    const supabase = createServiceClient();

    console.log(`🗑️ Starting deletion process for user: ${userId}`);

    // Step 1: Delete all tasks created by this user
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);

    if (tasksError) {
      console.error('Error deleting user tasks:', tasksError);
    } else {
      console.log(`✓ Deleted tasks for user ${userId}`);
    }

    // Step 2: Delete all projects created by this user
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId);

    if (projectsError) {
      console.error('Error deleting user projects:', projectsError);
    } else {
      console.log(`✓ Deleted projects for user ${userId}`);
    }

    // Step 3: Delete all comments created by this user
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('user_id', userId);

    if (commentsError) {
      console.error('Error deleting user comments:', commentsError);
    } else {
      console.log(`✓ Deleted comments for user ${userId}`);
    }

    // Step 4: Delete all task files uploaded by this user
    const { error: taskFilesError } = await supabase
      .from('task_files')
      .delete()
      .eq('uploaded_by', userId);

    if (taskFilesError) {
      console.error('Error deleting user task files:', taskFilesError);
    } else {
      console.log(`✓ Deleted task files for user ${userId}`);
    }

    // Step 5: Delete all messages sent by this user (this will cascade delete message_files)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('sender_id', userId);

    if (messagesError) {
      console.error('Error deleting user messages:', messagesError);
    } else {
      console.log(`✓ Deleted messages for user ${userId}`);
    }

    // Step 6: Delete all chats created by this user (this will cascade delete chat_participants)
    const { error: chatsError } = await supabase
      .from('chats')
      .delete()
      .eq('created_by', userId);

    if (chatsError) {
      console.error('Error deleting chats:', chatsError);
    } else {
      console.log(`✓ Deleted chats created by user ${userId}`);
    }

    // Step 7: Delete user from chat_participants (remaining ones where user didn't create the chat)
    const { error: chatParticipantsError } = await supabase
      .from('chat_participants')
      .delete()
      .eq('user_id', userId);

    if (chatParticipantsError) {
      console.error('Error deleting chat participants:', chatParticipantsError);
    } else {
      console.log(`✓ Deleted chat participants for user ${userId}`);
    }

    // Step 8: Delete invitations sent by this user
    const { error: invitationsError } = await supabase
      .from('user_invitations')
      .delete()
      .eq('invited_by', userId);

    if (invitationsError) {
      console.error('Error deleting user invitations:', invitationsError);
    } else {
      console.log(`✓ Deleted invitations sent by user ${userId}`);
    }

    // Step 9: Delete all team members created by this user
    const { error: teamMembersError } = await supabase
      .from('team_members')
      .delete()
      .eq('user_id', userId);

    if (teamMembersError) {
      console.error('Error deleting team members:', teamMembersError);
    } else {
      console.log(`✓ Deleted team members for user ${userId}`);
    }

    // Step 10: Delete the user's profile (CRITICAL - must happen before auth user deletion)
    // The profiles table has FK to auth.users without CASCADE, so we must delete it explicitly
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return false;
    } else {
      console.log(`✓ Deleted profile for user ${userId}`);
    }

    // Step 11: Delete user from auth.users (profile is now gone, so this will succeed)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting authenticated user from auth:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error status:', error.status);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }

    console.log(`✅ Successfully deleted user and all associated data: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error in deleteAuthenticatedUser:', error);
    return false;
  }
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

// Chat operations
export async function getOrCreateAllChat(): Promise<{ id: string; name: string | null; type: string }> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  // Try to find existing "all" chat
  const { data: existingChat } = await supabase
    .from('chats')
    .select('*')
    .eq('type', 'all')
    .single();

  if (existingChat) {
    // Ensure current user is a participant
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', existingChat.id)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      await supabase
        .from('chat_participants')
        .insert([{
          chat_id: existingChat.id,
          user_id: userId
        }]);
    }

    return existingChat;
  }

  // Create "all" chat if it doesn't exist
  const { data: newChat, error: chatError } = await supabase
    .from('chats')
    .insert([{
      name: 'All Team',
      type: 'all',
      created_by: userId
    }])
    .select()
    .single();

  if (chatError) throw chatError;

  // Add creator as participant
  await supabase
    .from('chat_participants')
    .insert([{
      chat_id: newChat.id,
      user_id: userId
    }]);

  return newChat;
}

export async function getMessages(chatId: string, limit: number = 50) {
  const supabase = await createClient();
  const currentUserId = await getCurrentUserId();

  // Fetch messages with files and reactions
  const { data, error } = await supabase
    .from('messages')
    .select('*, message_files (*), message_reactions (*)')
    .eq('chat_id', chatId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Get current user's email
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserEmail = user?.email || 'Unknown';

  // Get all unique sender IDs from messages
  const senderIds = [...new Set(data.map(m => m.sender_id))].filter(id => id !== currentUserId);

  // Get all unique user IDs from reactions
  const reactionUserIds = [...new Set(data.flatMap(m =>
    m.message_reactions?.map((r: { user_id: string }) => r.user_id) || []
  ))].filter(id => id !== currentUserId);

  // Combine all user IDs
  const allUserIds = [...new Set([...senderIds, ...reactionUserIds])];

  // Fetch user information for all users from the profiles table
  const { data: usersData } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', allUserIds);

  // Create a map of user_id to user name/email
  const userMap = new Map<string, string>();
  usersData?.forEach(u => {
    userMap.set(u.id, u.name || u.email?.split('@')[0] || 'Unknown');
  });

  return data.map(m => ({
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    content: m.content,
    replyTo: m.reply_to,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    isDeleted: m.is_deleted,
    senderEmail: m.sender_id === currentUserId ? currentUserEmail : (userMap.get(m.sender_id) || 'Unknown'),
    files: m.message_files?.map((f: { id: string; message_id: string; file_name: string; file_size: number; file_type: string; storage_path: string; uploaded_at: string }) => ({
      id: f.id,
      messageId: f.message_id,
      fileName: f.file_name,
      fileSize: f.file_size,
      fileType: f.file_type,
      storagePath: f.storage_path,
      uploadedAt: f.uploaded_at
    })) || [],
    reactions: m.message_reactions?.map((r: { id: string; message_id: string; user_id: string; reaction: string; created_at: string }) => ({
      id: r.id,
      messageId: r.message_id,
      userId: r.user_id,
      reaction: r.reaction,
      createdAt: r.created_at,
      userName: r.user_id === currentUserId ? currentUserEmail : (userMap.get(r.user_id) || 'Unknown')
    })) || []
  })).reverse();
}

export async function sendMessage(chatId: string, content: string, replyTo: string | null = null) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  // Insert message with optional reply_to
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_id: chatId,
      sender_id: userId,
      content,
      reply_to: replyTo
    }])
    .select()
    .single();

  if (error) throw error;

  // Get current user's email
  const { data: { user } } = await supabase.auth.getUser();

  return {
    id: data.id,
    chatId: data.chat_id,
    senderId: data.sender_id,
    content: data.content,
    replyTo: data.reply_to,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isDeleted: data.is_deleted,
    senderEmail: user?.email || 'Unknown'
  };
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  await getCurrentUserId();

  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId);

  return !error;
}

export async function updateLastRead(chatId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .eq('user_id', userId);

  return !error;
}

// Notification operations
export async function createNotification(params: {
  userId: string;
  type: 'chat_message' | 'task_assigned' | 'task_updated' | 'comment_added';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata || {}
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}
