'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Mail, Loader2, User, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export default function TeamPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: '',
    email: '',
    role: 'member'
  });
  const [profileFormData, setProfileFormData] = useState({
    name: ''
  });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch current user and all users
      const [profileRes, usersRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/users')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCurrentUser(profileData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        // Filter out the current user from allUsers since they're shown separately
        const otherUsers = usersData.allProfiles?.filter((u: UserProfile) => u.id !== usersData.currentUser?.id) || [];
        setAllUsers(otherUsers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function openInviteDialog() {
    setInviteFormData({ name: '', email: '', role: 'member' });
    setInviteSuccess(null);
    setInviteError(null);
    setInviteDialogOpen(true);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    if (!inviteFormData.name.trim() || !inviteFormData.email.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteFormData)
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invitation');
        setIsInviting(false);
        return;
      }

      setInviteSuccess(`Invitation sent successfully to ${inviteFormData.email}!`);
      setInviteFormData({ name: '', email: '', role: 'member' });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setInviteDialogOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setInviteError('Failed to send invitation. Please try again.');
    } finally {
      setIsInviting(false);
    }
  }

  function openProfileDialog() {
    if (currentUser) {
      setProfileFormData({ name: currentUser.name || '' });
      setProfileDialogOpen(true);
    }
  }

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (!profileFormData.name.trim()) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileFormData)
      });

      if (res.ok) {
        const updatedProfile = await res.json();
        setCurrentUser(updatedProfile);
        setProfileDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  function openDeleteDialog(user: UserProfile) {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!userToDelete) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/team/${userToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Remove from UI
        setAllUsers(allUsers.filter(u => u.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-100 sm:truncate sm:text-3xl sm:tracking-tight">
            Team Members
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Manage your development team
          </p>
        </div>
        <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
          <Button onClick={openInviteDialog}>
            <Mail className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">Team Members</CardTitle>
          <CardDescription className="text-slate-400">
            {(currentUser ? 1 : 0) + allUsers.length} {((currentUser ? 1 : 0) + allUsers.length) === 1 ? 'member' : 'members'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!currentUser && allUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No team members yet. Invite your first team member!</p>
              <Button onClick={openInviteDialog}>
                <Mail className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Current User */}
                {currentUser && (
                  <TableRow className="bg-slate-800/30 border-slate-700">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {currentUser.name || currentUser.email}
                        <Badge variant="secondary" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          You
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{currentUser.email}</TableCell>
                    <TableCell>Account Owner</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openProfileDialog}
                          title="Edit your profile"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Other Authenticated Users */}
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {user.name || user.email}
                        <Badge variant="outline" className="text-xs">
                          User
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>Team Member</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(user)}
                          title="Remove from team (deletes all their data)"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Team Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an email invitation to join your team. They'll receive a link to create their account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {inviteSuccess && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-md p-3 text-sm text-green-400">
                  {inviteSuccess}
                </div>
              )}

              {inviteError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
                  {inviteError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="inviteName">Name *</Label>
                <Input
                  id="inviteName"
                  value={inviteFormData.name}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                  autoFocus
                  disabled={isInviting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  disabled={isInviting}
                />
                <p className="text-xs text-slate-400">
                  An invitation email will be sent to this address
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Input
                  id="inviteRole"
                  value={inviteFormData.role}
                  onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                  placeholder="e.g., Developer, Designer, Manager"
                  disabled={isInviting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting || !inviteFormData.name || !inviteFormData.email}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription asChild>
              <div>
                Are you sure you want to remove <strong>{userToDelete?.name || userToDelete?.email}</strong> from the team?
                <br /><br />
                <strong className="text-red-400">⚠️ Warning:</strong> This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All their tasks</li>
                  <li>All their projects</li>
                  <li>All their comments</li>
                  <li>All their messages</li>
                  <li>Their user account</li>
                </ul>
                <br />
                This action cannot be undone.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Member & All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <form onSubmit={handleProfileUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Your Profile</DialogTitle>
              <DialogDescription>
                Update your profile information. This will be displayed across the application.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="profileName">Name *</Label>
                <Input
                  id="profileName"
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profileEmail">Email</Label>
                <Input
                  id="profileEmail"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="bg-slate-800/50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">
                  Email cannot be changed
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
