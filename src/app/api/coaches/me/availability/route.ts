import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getCoachId(req: NextRequest): Promise<{ coachId: string } | NextResponse> {
  const token = req.cookies.get('mg_token')?.value
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const coach = await prisma.coachProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } })
  if (!coach) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'پروفایل راه‌بلد یافت نشد' } }, { status: 404 })

  return { coachId: coach.id }
}

export async function GET(req: NextRequest) {
  const result = await getCoachId(req)
  if (result instanceof NextResponse) return result

  const slots = await prisma.timeSlot.findMany({
    where: { coachId: result.coachId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json({ success: true, data: { slots } })
}

export async function PUT(req: NextRequest) {
  const result = await getCoachId(req)
  if (result instanceof NextResponse) return result

  const body = await req.json()
  const { slots } = body as {
    slots: { day_of_week: number; start_time: string; end_time: string }[]
  }

  if (!Array.isArray(slots)) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_PARAMS', message: 'فرمت slots نادرست است' } }, { status: 400 })
  }

  // Validate each slot
  for (const s of slots) {
    if (s.day_of_week < 0 || s.day_of_week > 6) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PARAMS', message: `روز ${s.day_of_week} نامعتبر است` } }, { status: 400 })
    }
    if (s.start_time >= s.end_time) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PARAMS', message: 'زمان شروع باید قبل از زمان پایان باشد' } }, { status: 400 })
    }
  }

  await prisma.$transaction([
    prisma.timeSlot.deleteMany({ where: { coachId: result.coachId } }),
    ...(slots.length > 0
      ? [
          prisma.timeSlot.createMany({
            data: slots.map((s) => ({
              coachId:     result.coachId,
              dayOfWeek:   s.day_of_week,
              startTime:   s.start_time,
              endTime:     s.end_time,
              isAvailable: true,
            })),
          }),
        ]
      : []),
  ])

  return NextResponse.json({ success: true, message: 'زمان‌بندی با موفقیت ذخیره شد' })
}
