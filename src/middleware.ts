import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/coach-dashboard',
  '/coach-availability',
  '/coach-packages',
  '/coach-wallet',
  '/coach-sessions',
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

  const isCoachPath =
    pathname.startsWith('/coach-dashboard') ||
    pathname.startsWith('/coach-availability') ||
    pathname.startsWith('/coach-packages') ||
    pathname.startsWith('/coach-wallet') ||
    pathname.startsWith('/coach-sessions')

  if (isCoachPath && payload.role !== 'rahbalad') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname.startsWith('/dashboard') && payload.role === 'rahbalad') {
    return NextResponse.redirect(new URL('/coach-dashboard', req.url))
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
  ],
}
