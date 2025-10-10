'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, XCircle, Eye, EyeOff } from 'lucide-react';

interface InvitationDetails {
  email: string;
  name: string;
  role: string;
  expiresAt: string;
}

export default function SetupPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, [token]);

  async function validateToken() {
    try {
      const res = await fetch(`/api/auth/setup-password?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid invitation link');
        setIsLoading(false);
        return;
      }

      setInvitation(data.invitation);
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function validatePassword() {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    setPasswordError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validatePassword()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/');
    } catch (err) {
      console.error('Error setting up password:', err);
      setError('Failed to create account. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-slate-100">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-400 mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-slate-100">Welcome to Dev Tracker! 🎉</CardTitle>
          <CardDescription className="mt-2">
            You have been invited to join the team
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Invitation Details */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Name:</span>
                <span className="text-sm text-slate-100 font-medium">{invitation?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Email:</span>
                <span className="text-sm text-slate-100 font-medium">{invitation?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Role:</span>
                <span className="text-sm text-blue-400 font-medium capitalize">{invitation?.role}</span>
              </div>
            </div>
          </div>

          {/* Password Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-900/50 border-slate-700 text-slate-100 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="bg-slate-900/50 border-slate-700 text-slate-100 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
                {passwordError}
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>Create Account &amp; Sign In</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
