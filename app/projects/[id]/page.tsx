'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, Task, Priority, Status, Visibility } from '@/lib/types';
import { Plus, ArrowLeft, Trash2, Pencil, MessageSquare, Users, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import TaskComments from '@/components/TaskComments';
import { createClient } from '@/lib/supabase/client';

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('Anonymous');

  // Form state
  const [formData, setFormData] = useState({
    featureTask: '',
    description: '',
    assignedTo: '',
    priority: 'Medium' as Priority,
    status: 'Backlog' as Status,
    startDate: '',
    targetDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, [projectId]);

  async function fetchCurrentUser() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  async function fetchData() {
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch('/api/users')
      ]);

      if (!projectRes.ok) {
        router.push('/');
        return;
      }

      const projectData = await projectRes.json();
      const tasksData = await tasksRes.json();
      const usersData = await usersRes.json();

      setProject(projectData);
      setTasks(tasksData);

      // Map all profiles (including current user) to team members for assignment
      const allUsers = usersData.allProfiles || [];
      setTeamMembers(allUsers.map((profile: { id: string; name: string | null; email: string }) => ({
        id: profile.id,
        name: profile.name || profile.email,
        email: profile.email
      })));

      // Fetch comment counts for all tasks
      const counts: Record<string, number> = {};
      await Promise.all(
        tasksData.map(async (task: Task) => {
          try {
            const res = await fetch(`/api/comments?taskId=${task.id}`);
            if (res.ok) {
              const comments = await res.json();
              counts[task.id] = comments.length;
            }
          } catch (error) {
            console.error(`Error fetching comments for task ${task.id}:`, error);
          }
        })
      );
      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function openAddDialog() {
    setEditingTask(null);
    setFormData({
      featureTask: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      status: 'Backlog',
      startDate: '',
      targetDate: '',
      notes: ''
    });
    setVisibility('private');
    setSelectedUsers([]);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setFormData({
      featureTask: task.featureTask,
      description: task.description,
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: task.status,
      startDate: task.startDate || '',
      targetDate: task.targetDate || '',
      notes: task.notes
    });
    setVisibility(task.visibility);
    setSelectedUsers(task.sharedWith);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.featureTask.trim()) return;

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PUT' : 'POST';

      const body = editingTask
        ? { ...formData, visibility, sharedWith: visibility === 'specific' ? selectedUsers : [] }
        : { ...formData, projectId, visibility, sharedWith: visibility === 'specific' ? selectedUsers : [] };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  function toggleUserSelection(userId: string) {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  async function toggleTaskDone(task: Task) {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          done: !task.done,
          status: !task.done ? 'Done' : 'In Progress'
        })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-100">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.done || t.status === 'Done').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    backlog: tasks.filter(t => t.status === 'Backlog').length
  };
  const percentComplete = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  function getPriorityColor(priority: Priority) {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
    }
  }

  function getStatusColor(status: Status) {
    switch (status) {
      case 'Done': return 'bg-green-400/20 text-green-400 border border-green-400/30';
      case 'In Progress': return 'bg-blue-400/20 text-blue-400 border border-blue-400/30';
      case 'Code Review': return 'bg-purple-400/20 text-purple-400 border border-purple-400/30';
      case 'Testing': return 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30';
      case 'Backlog': return 'bg-slate-400/20 text-slate-400 border border-slate-400/30';
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-300 mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-slate-100 sm:truncate sm:text-3xl sm:tracking-tight">
              {project.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {stats.total} {stats.total === 1 ? 'task' : 'tasks'} • {percentComplete}% complete
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl text-slate-100">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-400">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-400">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription>Backlog</CardDescription>
            <CardTitle className="text-3xl text-cyan-500">{stats.backlog}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Manage your project tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No tasks yet. Add your first task to get started!</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Done</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} className="hover:bg-slate-900/50 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all cursor-pointer" onClick={() => openEditDialog(task)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task)}
                          className="h-4 w-4 rounded border-slate-800"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className={`flex items-center gap-2 ${task.done ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            <span>{task.featureTask}</span>
                            {commentCounts[task.id] > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-400/20 text-blue-400 border border-blue-400/30">
                                <MessageSquare className="h-3 w-3" />
                                {commentCounts[task.id]}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <div className="text-sm text-slate-400 mt-1">{task.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{task.assignedTo || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {task.targetDate ? format(new Date(task.targetDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update the task details below.' : 'Add a new task to your project.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="featureTask">Task Name *</Label>
                <Input
                  id="featureTask"
                  value={formData.featureTask}
                  onChange={(e) => setFormData({ ...formData, featureTask: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={(() => {
                      // Convert name to ID for Select value (to match SelectItem values which use IDs)
                      if (!formData.assignedTo) return "unassigned";
                      const member = teamMembers.find(m => m.name === formData.assignedTo);
                      return member ? member.id : "unassigned";
                    })()}
                    onValueChange={(value) => {
                      if (value === "unassigned") {
                        setFormData({ ...formData, assignedTo: "" });
                      } else {
                        // Find the member by ID and store their name (for backward compatibility)
                        const member = teamMembers.find(m => m.id === value);
                        if (member) {
                          setFormData({ ...formData, assignedTo: member.name });
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Code Review">Code Review</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="taskVisibility">Who can view this task?</Label>
                <Select value={visibility} onValueChange={(value: Visibility) => {
                  setVisibility(value);
                  if (value !== 'specific') setSelectedUsers([]);
                }}>
                  <SelectTrigger id="taskVisibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Private (Only Me)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="specific">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Specific Users</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>All Users</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {visibility === 'specific' && (
                <div className="grid gap-2">
                  <Label>Select Users</Label>
                  <div className="border border-slate-700 rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-slate-400">No team members found. Add team members first.</p>
                    ) : (
                      teamMembers.map((member) => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-800 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(member.id)}
                            onChange={() => toggleUserSelection(member.id)}
                            className="rounded border-slate-600"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-200">{member.name}</span>
                            <span className="text-xs text-slate-400">{member.email}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Task Comments Section - Only show when editing */}
              {editingTask && (
                <div className="border-t border-slate-700 pt-4 mt-2">
                  <TaskComments
                    taskId={editingTask.id}
                    currentUser={currentUserEmail}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit">{editingTask ? 'Update Task' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
