import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function auth(req: NextRequest) {
  const token = req.cookies.get('mg_token')?.value ?? req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

const VALID_TYPES = ['bug', 'suggestion', 'comment']

// POST /api/feedback — submit feedback. Auth required, but userId is dropped
// when the user opts to send anonymously.
export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return Response.json({ success: false, error: { message: 'احراز هویت الزامی است' } }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    type?:          string
    content?:       string
    screenshotUrl?: string
    pageUrl?:       string
    isAnonymous?:   boolean
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return Response.json({ success: false, error: { message: 'نوع بازخورد نامعتبر است' } }, { status: 400 })
  }
  const content = (body.content ?? '').trim()
  if (content.length < 10) {
    return Response.json({ success: false, error: { message: 'متن بازخورد باید حداقل ۱۰ کاراکتر باشد' } }, { status: 400 })
  }

  const isAnonymous = body.isAnonymous === true

  const feedback = await prisma.feedback.create({
    data: {
      userId:        isAnonymous ? null : payload.sub,
      type:          body.type as 'bug' | 'suggestion' | 'comment',
      content,
      screenshotUrl: body.screenshotUrl?.trim() || null,
      pageUrl:       body.pageUrl?.trim().slice(0, 500) || null,
      isAnonymous,
      status:        'new',
    },
    select: { id: true, status: true },
  })

  return Response.json({ success: true, data: feedback }, { status: 201 })
}
