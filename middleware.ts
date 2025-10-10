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
     * - manifest.json (PWA manifest)
     * - sw.js, workbox-*.js (service worker files)
     * - icon-*.png, apple-touch-icon.png (PWA icons)
     * - /auth (authentication pages)
     * - /api/auth (authentication API routes)
     * - /api/digest (digest test endpoint)
     * - /api/cron (automated email cron jobs)
     */
    '/((?!_next/static|_next/image|favicon|manifest.json|sw.js|workbox-|icon-|apple-touch-icon|auth/|api/auth/|api/digest/|api/cron/).*)',
  ],
}
