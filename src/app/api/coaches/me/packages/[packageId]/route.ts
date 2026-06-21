import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getCoachId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const coach = await prisma.coachProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
  return coach?.id ?? null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  const coachId = await getCoachId(req)
  if (!coachId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const pkg = await prisma.package.findUnique({ where: { id: params.packageId } })
  if (!pkg || pkg.coachId !== coachId) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'پکیج یافت نشد' } }, { status: 404 })
  }

  const body = await req.json()
  const { name, description, session_count, duration_minutes, price_toman, includes_chat, is_intro, is_active } = body

  const updates: Record<string, unknown> = {}
  if (name              !== undefined) updates.name            = name
  if (description       !== undefined) updates.description     = description
  if (session_count     !== undefined) updates.sessionCount    = Number(session_count)
  if (duration_minutes  !== undefined) updates.durationMinutes = Number(duration_minutes)
  if (price_toman       !== undefined) updates.priceToman      = Number(price_toman)
  if (includes_chat     !== undefined) updates.includesChat    = includes_chat
  if (is_intro          !== undefined) updates.isIntro         = is_intro
  if (is_active         !== undefined) updates.isActive        = Boolean(is_active)

  const updated = await prisma.package.update({ where: { id: params.packageId }, data: updates })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  const coachId = await getCoachId(req)
  if (!coachId) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const pkg = await prisma.package.findUnique({ where: { id: params.packageId } })
  if (!pkg || pkg.coachId !== coachId) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'پکیج یافت نشد' } }, { status: 404 })
  }

  // Block hard-delete if active bookings reference this package
  const bookingCount = await prisma.booking.count({ where: { packageId: params.packageId } })
  if (bookingCount > 0) {
    return NextResponse.json({
      success: false,
      error: { message: 'این پکیج دارای رزرو است. برای حذف ابتدا پکیج را غیرفعال کنید.' },
    }, { status: 409 })
  }

  await prisma.package.delete({ where: { id: params.packageId } })

  return NextResponse.json({ success: true, message: 'پکیج حذف شد' })
}
