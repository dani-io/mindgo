import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jalaali from 'jalaali-js'

// Map JS day (0=Sun) → Jalali DOW (0=شنبه)
function jalaliDow(jsDay: number) {
  return (jsDay + 1) % 7
}

function generateSlots(startTime: string, endTime: string, stepMinutes = 60): string[] {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  const slots: string[] = []
  while (cur + stepMinutes <= end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`)
    cur += stepMinutes
  }
  return slots
}

// Fallback when coach has no time slots configured (for demo)
const DEFAULT_SLOTS = [
  { dayOfWeek: 0, startTime: '10:00', endTime: '18:00' }, // شنبه
  { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' }, // دوشنبه
  { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' }, // چهارشنبه
]

export async function GET(
  req: NextRequest,
  { params }: { params: { coachId: string } }
) {
  const { searchParams } = req.nextUrl
  const year  = Number(searchParams.get('year')  || 0)
  const month = Number(searchParams.get('month') || 0)

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'سال و ماه الزامی است' } },
      { status: 400 }
    )
  }

  const coach = await prisma.coachProfile.findUnique({
    where: { id: params.coachId },
    include: { timeSlots: { where: { isAvailable: true } } },
  })

  if (!coach || coach.status !== 'approved') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'کوچ یافت نشد' } },
      { status: 404 }
    )
  }

  const rawSlots = coach.timeSlots.length > 0 ? coach.timeSlots : DEFAULT_SLOTS

  // Build map: jalaliDow → [{startTime, endTime}]
  const slotsByDow = new Map<number, { startTime: string; endTime: string }[]>()
  for (const ts of rawSlots) {
    const list = slotsByDow.get(ts.dayOfWeek) ?? []
    list.push({ startTime: ts.startTime, endTime: ts.endTime })
    slotsByDow.set(ts.dayOfWeek, list)
  }

  const daysInMonth = jalaali.jalaaliMonthLength(year, month)

  // Today in Jalali
  const now = new Date()
  const todayJ = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())

  // Get existing bookings for the month
  const monthStartG = jalaali.toGregorian(year, month, 1)
  const monthEndG   = jalaali.toGregorian(year, month, daysInMonth)

  const existingBookings = await prisma.booking.findMany({
    where: {
      coachId: params.coachId,
      sessionDate: {
        gte: new Date(monthStartG.gy, monthStartG.gm - 1, monthStartG.gd),
        lte: new Date(monthEndG.gy,   monthEndG.gm - 1,   monthEndG.gd, 23, 59, 59),
      },
      status: { in: ['pending', 'confirmed'] },
    },
    select: { sessionDate: true, sessionTime: true },
  })

  const bookedSet = new Set<string>()
  for (const b of existingBookings) {
    const d = b.sessionDate
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${b.sessionTime}`
    bookedSet.add(key)
  }

  const availableDays: { date: string; slots: string[] }[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    // Skip today and past
    const isPast =
      year < todayJ.jy ||
      (year === todayJ.jy && month < todayJ.jm) ||
      (year === todayJ.jy && month === todayJ.jm && day <= todayJ.jd)
    if (isPast) continue

    const g = jalaali.toGregorian(year, month, day)
    const jsDay = new Date(g.gy, g.gm - 1, g.gd).getDay()
    const dow   = jalaliDow(jsDay)

    const daySlots = slotsByDow.get(dow)
    if (!daySlots) continue

    const gregStr = `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
    const allSlots = daySlots.flatMap((ts) => generateSlots(ts.startTime, ts.endTime))
    const freeSlots = allSlots.filter((s) => !bookedSet.has(`${gregStr} ${s}`))

    if (freeSlots.length > 0) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      availableDays.push({ date: dateStr, slots: freeSlots })
    }
  }

  return NextResponse.json({ success: true, data: { available_days: availableDays } })
}
