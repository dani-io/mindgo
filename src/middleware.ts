import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PROTECTED_PREFIXES = ['/dashboard', '/coach-dashboard']

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

  // Role-based guard: coach dashboard only for rahbalad
  if (pathname.startsWith('/coach-dashboard') && payload.role !== 'rahbalad') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rehjoo dashboard only for rehjoo
  if (pathname.startsWith('/dashboard') && payload.role === 'rahbalad') {
    return NextResponse.redirect(new URL('/coach-dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/coach-dashboard/:path*'],
}
