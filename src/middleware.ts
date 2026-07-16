import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/coach-dashboard',
  '/coach-availability',
  '/coach-packages',
  '/coach-wallet',
  '/coach-sessions',
  '/coach-messages',
  '/messages',
  '/sessions',
  '/growth-room',
  '/tribe',
  '/profile',
  '/settings',
  '/notifications',
  '/admin',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isProtected) return NextResponse.next()

  const token =
    req.cookies.get('mg_token')?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '')

  console.log(`[middleware] ${pathname} | cookie=${req.cookies.get('mg_token')?.value?.slice(0, 20) ?? 'none'}...`)

  if (!token) {
    console.log('[middleware] no token → redirect /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    console.log('[middleware] invalid token → redirect /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }
  console.log(`[middleware] authed uid=${payload.sub} role=${payload.role}`)

  // First-time rehjoo users must complete onboarding before accessing the app.
  // Coaches (rahbalad) and admins have their own flows and are exempt. Tokens
  // issued before this feature lack the claim (undefined) and are not forced.
  if (
    payload.role === 'rehjoo' &&
    !payload.adminRole &&
    payload.onboardingCompleted === false
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  const isCoachPath =
    pathname.startsWith('/coach-dashboard') ||
    pathname.startsWith('/coach-availability') ||
    pathname.startsWith('/coach-packages') ||
    pathname.startsWith('/coach-wallet') ||
    pathname.startsWith('/coach-sessions') ||
    pathname.startsWith('/coach-messages')

  // Coach paths: only rahbalad role (a user can be rahbalad AND have adminRole simultaneously)
  if (isCoachPath && payload.role !== 'rahbalad') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect plain rehjoo hitting /dashboard to their dashboard (rahbalad goes to coach-dashboard)
  if (pathname.startsWith('/dashboard') && payload.role === 'rahbalad') {
    return NextResponse.redirect(new URL('/coach-dashboard', req.url))
  }

  // Admin paths: check adminRole JWT claim (set at login from admin_roles table)
  // A coach (rahbalad) with an admin_roles entry can access both /coach-* AND /admin
  if (pathname.startsWith('/admin') && !payload.adminRole) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/coach-dashboard/:path*',
    '/coach-availability/:path*',
    '/coach-packages/:path*',
    '/coach-wallet/:path*',
    '/coach-sessions/:path*',
    '/coach-messages/:path*',
    '/messages/:path*',
    '/sessions/:path*',
    '/growth-room/:path*',
    '/tribe/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/admin/:path*',
  ],
}
