import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/health — container healthcheck target.
// 200 only when the process is up AND the database answers.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ success: true, data: { status: 'ok', db: 'up' } })
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'database unreachable' } },
      { status: 503 },
    )
  }
}
