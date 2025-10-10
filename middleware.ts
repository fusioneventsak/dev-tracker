import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth (authentication pages)
     * - /api/auth (authentication API routes)
     * - /api/digest (digest test endpoint)
     * - /api/cron (automated email cron jobs)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|api/auth/|api/digest/|api/cron/).*)',
  ],
}
