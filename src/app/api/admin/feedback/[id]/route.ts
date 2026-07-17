import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAuth, authError } from '@/lib/rbac'

// PATCH /api/admin/feedback/[id] — update status and/or admin notes.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminAuth(req, 'support_agent')
  if (!auth.ok) return authError(auth.status, auth.message)

  const body = await req.json().catch(() => ({})) as { status?: string; adminNotes?: string }

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!['new', 'reviewed', 'resolved'].includes(body.status)) {
      return Response.json({ success: false, error: { message: 'وضعیت نامعتبر است' } }, { status: 400 })
    }
    data.status = body.status
  }
  if (body.adminNotes !== undefined) data.adminNotes = String(body.adminNotes).trim() || null

  if (Object.keys(data).length === 0) {
    return Response.json({ success: false, error: { message: 'داده‌ای برای بروزرسانی ارسال نشده است' } }, { status: 400 })
  }

  const existing = await prisma.feedback.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!existing) return Response.json({ success: false, error: { message: 'بازخورد یافت نشد' } }, { status: 404 })

  const updated = await prisma.feedback.update({
    where:  { id: params.id },
    data,
    select: { id: true, status: true, adminNotes: true },
  })

  return Response.json({ success: true, data: updated })
}
