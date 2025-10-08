'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, ProjectStats, Visibility, TeamMember } from '@/lib/types';
import { Plus, Users, Lock, Globe, Settings } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projectsRes, statsRes, teamRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/stats'),
        fetch('/api/team')
      ]);

      if (projectsRes.ok && statsRes.ok) {
        const projectsData = await projectsRes.json();
        const statsData = await statsRes.json();
        const teamData = teamRes.ok ? await teamRes.json() : [];

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setStats(statsData || {});
        setTeamMembers(Array.isArray(teamData) ? teamData : []);
      } else {
        setProjects([]);
        setStats({});
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProjects([]);
      setStats({});
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          visibility,
          sharedWith: visibility === 'specific' ? selectedUsers : []
        })
      });

      if (res.ok) {
        setNewProjectName('');
        setVisibility('private');
        setSelectedUsers([]);
        setEditingProject(null);
        setDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  }

  function openEditDialog(project: Project, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setNewProjectName(project.name);
    setVisibility(project.visibility);
    setSelectedUsers(project.sharedWith);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingProject(null);
    setNewProjectName('');
    setVisibility('private');
    setSelectedUsers([]);
    setDialogOpen(true);
  }

  function toggleUserSelection(userId: string) {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-300">Loading...</div>
      </div>
    );
  }

  const overallStats = Object.values(stats).reduce(
    (acc, curr) => ({
      total: acc.total + curr.total,
      completed: acc.completed + curr.completed,
      inProgress: acc.inProgress + curr.inProgress,
      backlog: acc.backlog + curr.backlog,
      percentComplete: 0
    }),
    { total: 0, completed: 0, inProgress: 0, backlog: 0, percentComplete: 0 }
  );

  overallStats.percentComplete = overallStats.total > 0
    ? Math.round((overallStats.completed / overallStats.total) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-100 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Overview of all your projects and tasks
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
                  <DialogDescription>
                    {editingProject ? 'Update project details and permissions.' : 'Add a new project to track your development tasks.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Enter project name"
                      autoFocus
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visibility">Who can view this project?</Label>
                    <Select value={visibility} onValueChange={(value: Visibility) => {
                      setVisibility(value);
                      if (value !== 'specific') setSelectedUsers([]);
                    }}>
                      <SelectTrigger id="visibility">
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
                </div>
                <DialogFooter>
                  <Button type="submit">{editingProject ? 'Update Project' : 'Create Project'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Total Tasks</CardDescription>
            <CardTitle className="text-3xl text-slate-100">{overallStats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Completed</CardDescription>
            <CardTitle className="text-3xl text-green-400">{overallStats.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-400">{overallStats.inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Backlog</CardDescription>
            <CardTitle className="text-3xl text-slate-400">{overallStats.backlog}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">% Complete</CardDescription>
            <CardTitle className="text-3xl text-slate-100">{overallStats.percentComplete}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Projects */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Projects</h3>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-400 mb-4">No projects yet. Create your first project to get started!</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const projectStats = stats[project.id] || {
              total: 0,
              completed: 0,
              inProgress: 0,
              backlog: 0,
              percentComplete: 0
            };

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-100">{project.name}</CardTitle>
                        <CardDescription className="text-slate-400">
                          {projectStats.total} {projectStats.total === 1 ? 'task' : 'tasks'}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEditDialog(project, e)}
                        className="h-8 w-8 p-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Progress</span>
                        <span className="font-medium text-slate-200">{projectStats.percentComplete}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${projectStats.percentComplete}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-400">{projectStats.completed}</div>
                          <div className="text-xs text-slate-500">Done</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-400">{projectStats.inProgress}</div>
                          <div className="text-xs text-slate-500">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-slate-400">{projectStats.backlog}</div>
                          <div className="text-xs text-slate-500">Backlog</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
