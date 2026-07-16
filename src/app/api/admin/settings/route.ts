import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

const DEFAULTS = {
  commissionRate:           70,
  minPayoutAmount:          500000,
  payoutDay:                'monday',
  autoConfirmHours:         24,
  maxAdvanceBookingDays:    30,
  otpExpiryMinutes:         2,
  maxOtpAttempts:           3,
  otpCodeLength:            6,
  maxActiveChallenges:      10,
  allowAnonymousPosts:      true,
  allowAnonymousChallenges: true,
  platformName:             'Mindgo',
  platformDescription:      '',
  contactEmail:             '',
  contactPhone:             '',
}

// GET /api/admin/settings  (super_admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const row = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })
  const config = { ...DEFAULTS, ...(row?.config as object ?? {}) }

  return NextResponse.json({ success: true, data: config })
}

// PATCH /api/admin/settings  body: partial config  (super_admin only)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'super_admin')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))

  const existing = await prisma.platformSettings.findUnique({ where: { id: 'singleton' } })
  const prev     = { ...DEFAULTS, ...(existing?.config as object ?? {}) }
  const merged   = { ...prev, ...body }

  const row = await prisma.platformSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', config: merged },
    update: { config: merged },
  })

  return NextResponse.json({ success: true, data: { ...DEFAULTS, ...(row.config as object) } })
}
