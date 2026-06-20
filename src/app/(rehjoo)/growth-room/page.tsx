'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/layout/ThemeToggle'

const SECTIONS = [
  {
    href:    '/growth-room/journal',
    icon:    '📓',
    title:   'دفترچه افکار',
    desc:    'ثبت شکرگزاری، تأمل و نوشتار آزاد',
    color:   '#F59E0B',
    bg:      'rgba(245,158,11,0.1)',
  },
  {
    href:    '/growth-room/goals',
    icon:    '🎯',
    title:   'اهداف من',
    desc:    'هدف‌گذاری SMART و پیگیری پیشرفت',
    color:   '#10B981',
    bg:      'rgba(16,185,129,0.1)',
  },
  {
    href:    '/growth-room/habits',
    icon:    '✅',
    title:   'عادت‌ها',
    desc:    'ردیاب عادت‌های روزانه و زنجیره موفقیت',
    color:   '#3B82F6',
    bg:      'rgba(59,130,246,0.1)',
  },
  {
    href:    '/growth-room/wheel',
    icon:    '🕸️',
    title:   'چرخ زندگی',
    desc:    'ارزیابی ابعاد مختلف زندگی',
    color:   '#8B5CF6',
    bg:      'rgba(139,92,246,0.1)',
  },
  {
    href:    '/growth-room/learn',
    icon:    '📖',
    title:   'دوز آگاهی',
    desc:    'پادکست، ویدیو و خلاصه کتاب روزانه',
    color:   '#EF4444',
    bg:      'rgba(239,68,68,0.1)',
  },
  {
    href:    '/growth-room/exercises',
    icon:    '🌿',
    title:   'کتابخانه تمرینات',
    desc:    'مدیتیشن هدایت‌شده، تنفس، برنامه‌ریزی',
    color:   '#10B981',
    bg:      'rgba(16,185,129,0.1)',
  },
]

export default function GrowthRoomPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--content-primary)' }}>
            🌱 اتاق رشد
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
            فضای خصوصی و امن تو
          </p>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {SECTIONS.map(({ href, icon, title, desc, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl p-4 transition-all active:scale-[0.98]"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
          >
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: bg }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base" style={{ color: 'var(--content-primary)' }}>
                {title}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--content-secondary)' }}>
                {desc}
              </p>
            </div>
            <svg
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              style={{ color, flexShrink: 0, transform: 'rotate(180deg)' }}
            >
              <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Quote */}
      <div
        className="mt-6 rounded-2xl p-5 text-center"
        style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--content-secondary)' }}>
          «رشد یعنی آگاهی از اینکه کجا هستی و کجا می‌خواهی باشی»
        </p>
      </div>

    </div>
  )
}
