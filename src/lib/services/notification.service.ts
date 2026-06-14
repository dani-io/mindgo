import { prisma } from '@/lib/db'

type NotificationCategory = 'session_reminder' | 'booking_confirmed' | 'payout' | 'challenge' | 'system'

export async function createInAppNotification(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string,
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type: 'in_app', category, title, body },
  })
}

export async function sendSessionReminder(userId: string, coachName: string, sessionTime: string): Promise<void> {
  await createInAppNotification(
    userId,
    'session_reminder',
    'یادآور جلسه',
    `کمتر از ۳۰ دقیقه تا شروع جلسه با ${coachName} (${sessionTime})`,
  )
}

export async function sendBookingConfirmed(userId: string, packageName: string): Promise<void> {
  await createInAppNotification(
    userId,
    'booking_confirmed',
    'رزرو تأیید شد',
    `رزرو پکیج «${packageName}» با موفقیت ثبت شد.`,
  )
}

export async function sendStreakAtRiskAlert(userId: string, streak: number): Promise<void> {
  await createInAppNotification(
    userId,
    'system',
    'زنجیره موفقیتت در خطره! 🔥',
    `${streak} روز زنجیره داری — امروز یه عادت ثبت کن تا از دست نره.`,
  )
}

export async function sendChallengeUpdate(userId: string, participantName: string, challengeTitle: string, day: number): Promise<void> {
  await createInAppNotification(
    userId,
    'challenge',
    'به‌روزرسانی چالش',
    `${participantName} روز ${day}م چالش «${challengeTitle}» رو تیک زد!`,
  )
}

export async function sendWeeklyDigest(userId: string, sessions: number, habits: number, goals: number): Promise<void> {
  await createInAppNotification(
    userId,
    'system',
    'خلاصه هفتگی رشد تو',
    `این هفته: ${sessions} جلسه، ${habits} عادت، ${goals} هدف تکمیل شد. آفرین!`,
  )
}

export async function sendMotivational(userId: string, message: string): Promise<void> {
  await createInAppNotification(userId, 'system', 'پیام انگیزشی', message)
}
