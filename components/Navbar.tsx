'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  userEmail?: string | null;
}

export default function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    return null;
  }

  async function handleSignOut() {
    await signout();
  }

  return (
    <nav className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Dev Tracker
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-100 border-b-2 border-transparent hover:border-blue-400 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/team"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-400 border-b-2 border-transparent hover:border-blue-400 hover:text-slate-100 transition-colors"
              >
                Team
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-slate-400">{userEmail}</span>
            )}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
