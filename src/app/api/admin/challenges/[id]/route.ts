import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// PATCH /api/admin/challenges/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({}))
  const { title, description, status, startsAt, durationDays } = body as {
    title?:       string
    description?: string
    status?:      string
    startsAt?:    string
    durationDays?: number
  }

  const data: Record<string, unknown> = {}
  if (title?.trim())               data.title       = title.trim()
  if (description !== undefined)   data.description = description?.trim() || null
  if (status && ['upcoming', 'active', 'completed'].includes(status)) data.status = status

  if (startsAt) {
    const start = new Date(startsAt)
    data.startsAt = start
    if (durationDays) {
      const end = new Date(start)
      end.setDate(end.getDate() + durationDays)
      data.endsAt      = end
      data.durationDays = durationDays
    }
  }

  const updated = await prisma.challenge.update({
    where: { id: params.id },
    data,
  }).catch(() => null)

  if (!updated) return NextResponse.json({ success: false, error: { message: 'چالش یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true, data: updated })
}

// DELETE /api/admin/challenges/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_manager')
  if (!auth.ok) return authError(auth.status, auth.message)

  await prisma.challengeParticipant.deleteMany({ where: { challengeId: params.id } })
  const deleted = await prisma.challenge.delete({ where: { id: params.id } }).catch(() => null)

  if (!deleted) return NextResponse.json({ success: false, error: { message: 'چالش یافت نشد' } }, { status: 404 })
  return NextResponse.json({ success: true })
}
