import { prisma } from '@/lib/db'

export type XPAction = 'mood_log' | 'journal_entry' | 'habit_check' | 'session_completed' | 'goal_completed'

const XP_MAP: Record<XPAction, number> = {
  mood_log:          10,
  journal_entry:     20,
  habit_check:       30,
  session_completed: 50,
  goal_completed:    100,
}

type BadgeDef = {
  id:        string
  condition: (uid: string) => Promise<boolean>
}

const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'kitabkhan',
    condition: async (uid) => (await prisma.journalEntry.count({ where: { userId: uid } })) >= 10,
  },
  {
    id: 'zehnaagah',
    condition: async (uid) => (await prisma.mood.count({ where: { userId: uid } })) >= 10,
  },
  {
    id: 'hadafmand',
    condition: async (uid) => (await prisma.goal.count({ where: { userId: uid, status: 'completed' } })) >= 1,
  },
]

function parseBadges(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

export async function grantXP(userId: string, action: XPAction): Promise<void> {
  const xp = XP_MAP[action]

  // Increment XP
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { xpPoints: { increment: xp } },
    select: { xpPoints: true, badges: true },
  })

  const newLevel  = Math.floor(user.xpPoints / 100) + 1
  const existing  = parseBadges(user.badges)
  const newBadges = [...existing]

  for (const def of BADGE_DEFS) {
    if (!newBadges.includes(def.id) && await def.condition(userId)) {
      newBadges.push(def.id)
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { level: newLevel, badges: newBadges },
  })
}

export async function awardStreakBadge(userId: string, streak: number): Promise<void> {
  if (streak !== 7 && streak < 30) return
  const badgeId = streak >= 30 ? 'aatashin' : 'sahrkheez'
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { badges: true } })
  if (!user) return
  const existing = parseBadges(user.badges)
  if (!existing.includes(badgeId)) {
    await prisma.user.update({ where: { id: userId }, data: { badges: [...existing, badgeId] } })
  }
}
