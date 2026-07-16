import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, signToken } from '@/lib/auth'
import { getAdminRole } from '@/lib/rbac'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

const FOCUS_AREAS = ['career', 'relationships', 'health', 'financial', 'mental', 'spiritual']
const EXPERIENCE  = ['none', 'some', 'experienced']
const GENDER_PREF = ['any', 'female', 'male']
const MARITAL     = ['single', 'married']

// POST /api/users/me/onboarding — save wizard answers, mark onboarding complete,
// and re-issue a fresh token carrying onboardingCompleted=true.
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    name?:               string
    avatarUrl?:          string
    focusAreas?:         string[]
    goal?:               string
    coachingExperience?: string
    coachGenderPref?:    string
    maritalStatus?:      string
  }

  const name = (body.name ?? '').trim()
  if (!name) {
    return Response.json({ success: false, error: { message: 'نام الزامی است' } }, { status: 400 })
  }

  // Sanitize answers against known option sets (ignore anything unexpected).
  const focusAreas = Array.isArray(body.focusAreas)
    ? body.focusAreas.filter((a) => FOCUS_AREAS.includes(a))
    : []

  const onboardingAnswers = {
    focusAreas,
    goal: (body.goal ?? '').trim(),
    coachingExperience: EXPERIENCE.includes(body.coachingExperience ?? '') ? body.coachingExperience : null,
    coachGenderPref: GENDER_PREF.includes(body.coachGenderPref ?? '') ? body.coachGenderPref : 'any',
    maritalStatus: MARITAL.includes(body.maritalStatus ?? '') ? body.maritalStatus : null,
  }

  const user = await prisma.user.update({
    where: { id: payload.sub },
    data: {
      name,
      ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
      onboardingAnswers,
      onboardingCompleted: true,
    },
    select: { id: true, name: true, phone: true, role: true, avatarUrl: true, onboardingCompleted: true },
  })

  // Re-issue token so middleware no longer redirects to /onboarding.
  const adminRole = await getAdminRole(user.id)
  const tokenPayload: {
    sub: string; phone: string; role: string; adminRole?: string; onboardingCompleted: boolean
  } = {
    sub: user.id,
    phone: user.phone,
    role: user.role,
    onboardingCompleted: true,
  }
  if (adminRole) tokenPayload.adminRole = adminRole

  const token = await signToken(tokenPayload)

  const res = NextResponse.json({
    success: true,
    data: { token, user, answers: onboardingAnswers },
  })

  res.cookies.set('mg_token', token, {
    httpOnly: false,
    maxAge: 86400,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return res
}
