'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project, ProjectStats } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Record<string, ProjectStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/stats')
      ]);

      if (projectsRes.ok && statsRes.ok) {
        const projectsData = await projectsRes.json();
        const statsData = await statsRes.json();

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setStats(statsData || {});
      } else {
        setProjects([]);
        setStats({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProjects([]);
      setStats({});
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      });

      if (res.ok) {
        setNewProjectName('');
        setDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={createProject}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to track your development tasks.
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
                </div>
                <DialogFooter>
                  <Button type="submit">Create Project</Button>
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
            <Button onClick={() => setDialogOpen(true)}>
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
                    <CardTitle className="text-slate-100">{project.name}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {projectStats.total} {projectStats.total === 1 ? 'task' : 'tasks'}
                    </CardDescription>
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
