import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

// GET /api/users/me — current user profile + privacy settings
export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: payload.sub },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
      isPrivateProfile: true,
      hideFromLeaderboard: true,
      shareWithCoach: true,
      onboardingCompleted: true,
    },
  })

  if (!user) return Response.json({ success: false, error: { message: 'کاربر یافت نشد' } }, { status: 404 })

  return Response.json({ success: true, data: user })
}

// PATCH /api/users/me — update profile fields and/or privacy settings
export async function PATCH(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    name?:                string
    avatarUrl?:           string
    isPrivateProfile?:    boolean
    hideFromLeaderboard?: boolean
    shareWithCoach?:      boolean
  }

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string')                data.name                = body.name.trim()
  if (body.avatarUrl !== undefined)                 data.avatarUrl           = body.avatarUrl
  if (typeof body.isPrivateProfile === 'boolean')   data.isPrivateProfile    = body.isPrivateProfile
  if (typeof body.hideFromLeaderboard === 'boolean') data.hideFromLeaderboard = body.hideFromLeaderboard
  if (typeof body.shareWithCoach === 'boolean')     data.shareWithCoach      = body.shareWithCoach

  if (Object.keys(data).length === 0) {
    return Response.json({ success: false, error: { message: 'داده‌ای برای بروزرسانی ارسال نشده است' } }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where:  { id: payload.sub },
    data,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isPrivateProfile: true,
      hideFromLeaderboard: true,
      shareWithCoach: true,
    },
  })

  return Response.json({ success: true, data: updated })
}
