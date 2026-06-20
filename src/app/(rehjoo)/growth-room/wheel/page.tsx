'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

const STD  = [1, 2, 3, 4, 5]
const SNGL = [2, 4, 6, 8, 10]

const DIMENSIONS = [
  {
    key: 'physical', label: 'وضعیت جسمانی', short: 'جسمانی', icon: '💪',
    scale: STD, maxPerQ: 5,
    questions: [
      'من عموماً در زندگی احساس خوبی دارم',
      'من هر روز زمانی را به استراحت و تمدد اعصاب اختصاص می‌دهم',
      'من از ظاهر اندام و وزن فعلی‌ام راضی و خوشحال هستم',
      'من از میزان و کیفیت خوابی که دارم، راضی هستم',
      'من نگران سطح استرسم نیستم',
      'من هر روز حداقل ۱.۵ لیتر آب تازه می‌نوشم',
      'من هر هفته حداقل سه بار به انجام حرکات ورزشی می‌پردازم',
      'من یک رژیم غذایی متعادل دارم و غذاهای سالم می‌خورم',
      'من سیگار، قلیان و هر چیزی که برای بدن ضرر دارد مصرف نمی‌کنم',
      'من در مورد بررسی‌ها و چکاپ‌های مربوط به سلامتی‌ام کاملاً به‌روز هستم',
    ],
  },
  {
    key: 'relations', label: 'روابط با خانواده و دیگران', short: 'روابط', icon: '🤝',
    scale: STD, maxPerQ: 5,
    questions: [
      'من به آنهایی که برایم مهم هستند، مرتباً نشان می‌دهم که دوستشان دارم',
      'من رابطه‌ی لذت‌بخش و بسیار خوبی با افراد خانواده‌ام دارم',
      'من روزهای تولد افراد خانواده و دوستانم را به یاد دارم',
      'من مرتباً با کسانی که برایم اهمیت دارند، زمانی را صرف می‌کنم',
      'خانواده و دوستانم می‌توانند روی من حساب کنند',
      'من می‌توانم روی خانواده و دوستانم حساب کنم',
      'من دوستی‌های جدیدی را با دیگران برقرار می‌کنم',
      'من از زندگی اجتماعی‌ام راضی و خوشنود هستم',
      'هیچ‌کسی نیست که من نگران مواجهه با او باشم',
      'من در کارهای اجتماعی همکاری و مشارکت می‌کنم',
    ],
  },
  {
    key: 'career', label: 'شغل و حرفه', short: 'شغل', icon: '💼',
    scale: STD, maxPerQ: 5,
    questions: [
      'من از رفتن به محل کارم لذت می‌برم',
      'من عاشق شغلم هستم',
      'شغل من، استرس‌های بی‌جهت ایجاد نمی‌کند',
      'شغل من، به من اجازه‌ی فراغت و آسودگی می‌دهد',
      'من از سهم و نقشی که در پیشرفت کسب‌وکارم دارم، به خودم می‌بالم',
      'من همکارانم را صمیمانه دوست دارم',
      'من اجازه نمی‌دهم کارهای اداری‌ام انباشته شوند',
      'من در طی ۲۴ ساعت، به تماس‌ها و ایمیل‌های کاری‌ام پاسخ می‌دهم',
      'من از درآمدی که از شغلم دارم، راضی و خوشنود هستم',
      'من اهداف شغلی شفاف و واضحی برای خودم انتخاب کرده‌ام',
    ],
  },
  {
    key: 'finance', label: 'وضعیت مالی', short: 'مالی', icon: '💰',
    scale: STD, maxPerQ: 5,
    questions: [
      'من درباره‌ی پول و مسائل مالی استرس چندانی ندارم',
      'من یک بودجه‌ی دخل و خرج مشخص دارم',
      'من دقیقاً می‌دانم پولم را چگونه خرج می‌کنم',
      'من حداقل ۱۰ درصد از درآمد ماهیانه‌ام را پس‌انداز می‌کنم',
      'من حداقل سه ماه از مخارج زندگی‌ام را پس‌انداز دارم',
      'من مالیات‌هایم را به موقع پرداخت می‌کنم',
      'من مخارجم را به ماه بعد موکول نمی‌کنم',
      'من صورت‌حساب‌هایم را به موقع پرداخت می‌کنم',
      'من یک استراتژی سرمایه‌گذاری فعال و مؤثر دارم',
      'من اهداف مالی مشخص و واضحی دارم',
    ],
  },
  {
    key: 'leisure', label: 'فراغت و سرگرمی', short: 'تفریح', icon: '🎯',
    scale: STD, maxPerQ: 5,
    questions: [
      'من هر سال از تمامی مرخصی‌هایم استفاده می‌کنم',
      'من سرگرمی‌هایی دارم که از آنها بسیار لذت می‌برم',
      'من در سه ماه گذشته، یک کار خوب برای خودم انجام داده‌ام',
      'من آدم خندان و بشاشی هستم',
      'من خارج از محیط کاری، زندگی فوق‌العاده‌ای دارم',
      'من هر سال روز تولدم را جشن می‌گیرم',
      'من هر هفته درباره‌ی چیزهایی که قرار است اتفاق بیفتند هیجان‌زده هستم',
      'من از سطح سرگرمی‌ها و شادی زندگی‌ام راضی هستم',
      'من عموماً از زندگی‌ام لذت می‌برم',
      'من احساس می‌کنم قوه‌ی خلاقیتم فعال است',
    ],
  },
  {
    key: 'love', label: 'مسائل عشقی', short: 'عشقی', icon: '❤️',
    scale: STD, maxPerQ: 5,
    questions: [], // set dynamically based on maritalStatus
  },
  {
    key: 'spiritual', label: 'مسائل معنوی', short: 'معنوی', icon: '🙏',
    scale: STD, maxPerQ: 5,
    questions: [
      'من خودم را شخصی معتقد و با ایمان می‌دانم',
      'هر روز حداقل ۲۰ دقیقه را به مراقبه و تفکر اختصاص می‌دهم',
      'من یک رابطه‌ی شخصی با خدای خود دارم',
      'من خودم را دوست دارم',
      'هر روز اعتقادات معنوی‌ام را بررسی می‌کنم',
      'هر روز در مورد اعتقادات معنوی‌ام آموزش می‌بینم',
      'من کاملاً در تطابق با اعتقادات معنوی‌ام زندگی می‌کنم',
      'من از نیروی معنویتم برای حل مشکلاتم استفاده می‌کنم',
      'من از نیروی معنویتم برای کمک به دیگران استفاده می‌کنم',
      'من هر روز دعا و نیایش انجام می‌دهم',
    ],
  },
  {
    key: 'mental', label: 'مسائل ذهنی و روانی', short: 'ذهنی', icon: '🧠',
    scale: STD, maxPerQ: 5,
    questions: [
      'هر روز حداقل ۳۰ دقیقه مطلب آموزشی یا الهام‌بخش مطالعه می‌کنم',
      'هر روز حداقل ۳۰ دقیقه فایل صوتی آموزشی گوش می‌دهم',
      'من کاملاً در جریان اخبار صنعت مربوط به شغلم هستم',
      'من هر روز اطلاعات آموزشی مربوط به کارم را جستجو می‌کنم',
      'من یک مربی دارم که به او اعتماد دارم',
      'همه دوستان من تأثیر مثبت و سازنده‌ای دارند',
      'هرگز به شایعات نمی‌پردازم',
      'هر روز اهداف اصلی‌ام را مرور می‌کنم',
      'هر روز چیزهایی که برایشان قدردانم را مرور می‌کنم',
      'همیشه به درخواست‌هایی که با اهدافم همخوانی ندارد جواب رد می‌دهم',
    ],
  },
] as const

const LOVE_SINGLE_Q = [
  'من از شرایط فعلی‌ام (مجرد بودن) راضی هستم',
  'من درباره‌ی همسر ایده‌آلم کاملاً شفاف هستم',
  'من از ملاقات با افراد جدید حس بدی ندارم',
  'من در سه ماه گذشته یک قرار عاشقانه داشته‌ام',
  'من معتقدم می‌توانم همسر ایده‌آلم را ملاقات کنم',
]

const LOVE_MARRIED_Q = [
  'من از شرایط فعلی‌ام (متأهل بودن) راضی و خوشنود هستم',
  'من از بودن در کنار همسرم لذت می‌برم',
  'من با همسرم کاملاً صادقانه رفتار می‌کنم',
  'من و همسرم احترام دوجانبه به هم می‌گذاریم',
  'من از سطح صمیمیت بین خودم و همسرم راضی هستم',
  'من به همسرم اعتماد دارم',
  'من و همسرم زمان‌های باکیفیت خوبی را سپری می‌کنیم',
  'من تلاش می‌کنم اشتیاق بین خودم و همسرم را زنده نگه دارم',
  'من و همسرم از با هم بودن لذت می‌بریم',
  'من با رضایت در کارهای مورد علاقه‌ی همسرم سهیم می‌شوم',
]

const LOVE_IDX = 5
const DRAFT_KEY = 'wol_wizard_v2'

// ─── Types ────────────────────────────────────────────────────────────────────

type DimKey = typeof DIMENSIONS[number]['key']
type MaritalStatus = 'مجرد' | 'متأهل'
type AnswerMap = Record<string, (number | null)[]>

interface PrevAssessment {
  physical: number; relations: number; career: number; finance: number
  leisure: number;  love: number;      spiritual: number; mental: number
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toPersian(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function calcScore(answers: (number | null)[], numQ: number, maxPerQ: number): number {
  const filled = answers.filter((a): a is number => a !== null)
  if (filled.length === 0) return 0
  return Math.round((filled.reduce((s, a) => s + a, 0) / (numQ * maxPerQ)) * 10)
}

function getLoveConfig(status: MaritalStatus) {
  if (status === 'مجرد') return { questions: LOVE_SINGLE_Q, scale: SNGL, maxPerQ: 10 }
  return { questions: LOVE_MARRIED_Q, scale: STD, maxPerQ: 5 }
}

function initAnswers(): AnswerMap {
  const map: AnswerMap = {}
  for (const d of DIMENSIONS) {
    map[d.key] = d.key === 'love' ? [] : new Array(d.questions.length).fill(null)
  }
  return map
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WheelPage() {
  const router = useRouter()

  const [step,          setStep]          = useState(0)          // 0-7 = dims, 8 = results
  const [answers,       setAnswers]       = useState<AnswerMap>(initAnswers)
  const [marital,       setMarital]       = useState<MaritalStatus | null>(null)
  const [lovePhase,     setLovePhase]     = useState<'select' | 'questions'>('select')
  const [saving,        setSaving]        = useState(false)
  const [draftSaved,    setDraftSaved]    = useState(false)
  const [prevData,      setPrevData]      = useState<PrevAssessment | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Load draft + previous assessment
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        const draft = JSON.parse(raw)
        if (draft.answers)   setAnswers(draft.answers)
        if (draft.marital)   setMarital(draft.marital)
        if (draft.lovePhase) setLovePhase(draft.lovePhase)
        if (typeof draft.step === 'number') setStep(draft.step)
      } catch { /* ignore */ }
    }

    const token = localStorage.getItem('mg_token')
    fetch('/api/wheel-of-life', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data.history?.length > 1) {
          const prev = j.data.history[1]
          // Only use prev if it has new-format fields
          if (prev.physical || prev.relations || prev.leisure) {
            setPrevData(prev)
          }
        }
      })
      .catch(() => {})
  }, [])

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isLoveStep = step === LOVE_IDX
  const dim = DIMENSIONS[step] as typeof DIMENSIONS[number] | undefined

  const loveConfig = marital ? getLoveConfig(marital) : null

  const currentQuestions: readonly string[] =
    isLoveStep && lovePhase === 'questions' && loveConfig
      ? loveConfig.questions
      : (dim?.key !== 'love' ? dim?.questions ?? [] : [])

  const currentScale: number[] =
    isLoveStep && lovePhase === 'questions' && loveConfig
      ? loveConfig.scale
      : (dim ? [...dim.scale] : STD)

  const currentMaxPerQ: number =
    isLoveStep && lovePhase === 'questions' && loveConfig
      ? loveConfig.maxPerQ
      : 5

  const currentAnswers = answers[dim?.key ?? ''] ?? []

  const stepComplete: boolean = (() => {
    if (step >= 8) return true
    if (isLoveStep) {
      if (lovePhase === 'select') return false
      return currentAnswers.every((a) => a !== null) && currentAnswers.length === currentQuestions.length
    }
    return currentAnswers.length > 0 && currentAnswers.every((a) => a !== null)
  })()

  const scores = (() => {
    const map: Record<string, number> = {}
    for (const d of DIMENSIONS) {
      if (d.key === 'love') {
        if (marital && loveConfig) {
          map.love = calcScore(answers.love, loveConfig.questions.length, loveConfig.maxPerQ)
        } else {
          map.love = 0
        }
      } else {
        map[d.key] = calcScore(answers[d.key], d.questions.length, d.maxPerQ)
      }
    }
    return map
  })()

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleAnswer(qIdx: number, val: number) {
    const key = dim?.key
    if (!key) return
    setAnswers((prev) => {
      const arr = [...(prev[key] ?? [])]
      arr[qIdx] = val
      return { ...prev, [key]: arr }
    })
    // Auto-scroll to next question
    const next = questionRefs.current[qIdx + 1]
    if (next) setTimeout(() => next.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }

  function handleMaritalSelect(status: MaritalStatus) {
    setMarital(status)
    const cfg = getLoveConfig(status)
    setAnswers((prev) => ({ ...prev, love: new Array(cfg.questions.length).fill(null) }))
    setLovePhase('questions')
  }

  function goNext() {
    if (!stepComplete) return
    if (isLoveStep && lovePhase === 'select') { setLovePhase('questions'); return }
    transition(() => {
      setStep((s) => s + 1)
      questionRefs.current = []
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  function goBack() {
    if (isLoveStep && lovePhase === 'questions') { setLovePhase('select'); return }
    if (step === 0) { router.back(); return }
    transition(() => {
      setStep((s) => s - 1)
      questionRefs.current = []
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  function transition(fn: () => void) {
    setTransitioning(true)
    setTimeout(() => { fn(); setTransitioning(false) }, 200)
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers, marital, lovePhase }))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const token = localStorage.getItem('mg_token')
      const body = {
        ...scores,
        maritalStatus: marital,
        answers,
      }
      const res  = await fetch('/api/wheel-of-life', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        localStorage.removeItem(DRAFT_KEY)
        transition(() => setStep(8))
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── Render: Results ──────────────────────────────────────────────────────

  if (step === 8) {
    const chartData = DIMENSIONS.map((d) => ({
      dimension: d.short,
      current:   scores[d.key] ?? 0,
      previous:  prevData ? ((prevData as unknown) as Record<string, number>)[d.key] ?? 0 : 0,
    }))

    const avg = Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / 8 * 10) / 10

    return (
      <div dir="rtl" className="max-w-lg mx-auto px-4 pt-6 pb-10 min-h-screen" style={{ background: '#0F172A', color: '#F8FAFC' }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{ background: '#1E293B' }}>
            ›
          </button>
          <div>
            <h1 className="text-xl font-bold">🕸️ چرخ حیات</h1>
            <p className="text-xs" style={{ color: '#94A3B8' }}>میانگین: {toPersian(avg)} از ۱۰</p>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: '#1E293B' }}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData} outerRadius={100}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'IRANSansX' }} />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar name="فعلی" dataKey="current" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
              {prevData && (
                <Radar name="قبلی" dataKey="previous" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.08} strokeDasharray="4 2" />
              )}
            </RadarChart>
          </ResponsiveContainer>
          {prevData && (
            <div className="flex justify-center gap-5 text-xs mt-1" style={{ color: '#94A3B8' }}>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#8B5CF6' }} />ارزیابی فعلی</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#3B82F6' }} />ارزیابی قبلی</span>
            </div>
          )}
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {DIMENSIONS.map((d) => {
            const score = scores[d.key] ?? 0
            const pct   = score * 10
            return (
              <div key={d.key} className="rounded-xl p-3 text-center" style={{ background: '#1E293B' }}>
                <p className="text-lg mb-1">{d.icon}</p>
                <p className="text-[10px] mb-2" style={{ color: '#94A3B8' }}>{d.short}</p>
                <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: '#334155' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#8B5CF6' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{toPersian(score)}</p>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => { setStep(0); setAnswers(initAnswers()); setMarital(null); setLovePhase('select') }}
          className="w-full py-3.5 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
        >
          + ارزیابی جدید
        </button>
      </div>
    )
  }

  // ─── Render: Wizard ───────────────────────────────────────────────────────

  const progressPct = ((step) / 8) * 100

  return (
    <div dir="rtl" className="max-w-lg mx-auto px-4 pt-5 pb-32 min-h-screen" style={{ background: '#0F172A', color: '#F8FAFC' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{ background: '#1E293B' }}>
            ›
          </button>
          <h1 className="text-base font-bold">🕸️ چرخ حیات</h1>
        </div>
        <button
          onClick={saveDraft}
          className="text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: draftSaved ? 'rgba(16,185,129,0.15)' : '#1E293B', color: draftSaved ? '#10B981' : '#94A3B8' }}
        >
          {draftSaved ? '✓ ذخیره شد' : '💾 ذخیره موقت'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#64748B' }}>
          <span>مرحله {toPersian(step + 1)} از ۸</span>
          <span>{toPersian(Math.round(progressPct))}٪</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E293B' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #7C3AED, #8B5CF6)' }}
          />
        </div>
      </div>

      {/* Step content */}
      <div
        className="transition-all duration-200"
        style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)' }}
      >

        {/* Dimension header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{dim?.icon}</span>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#8B5CF6' }}>بُعد {toPersian(step + 1)}</p>
              <h2 className="text-lg font-bold">{dim?.label}</h2>
            </div>
          </div>
          {!(isLoveStep && lovePhase === 'select') && (
            <p className="text-xs mt-2 mr-11" style={{ color: '#94A3B8' }}>
              {currentQuestions.length} سؤال — هر سؤال را از {toPersian(currentScale[0])} تا {toPersian(currentScale[currentScale.length - 1])} ارزیابی کن
            </p>
          )}
        </div>

        {/* Love: marital status selector */}
        {isLoveStep && lovePhase === 'select' && (
          <div className="space-y-3">
            <p className="text-sm font-medium mb-4" style={{ color: '#CBD5E1' }}>وضعیت تأهل شما؟</p>
            {(['مجرد', 'متأهل'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleMaritalSelect(opt)}
                className="w-full py-4 rounded-2xl text-base font-bold text-right px-5 transition-all"
                style={{
                  background: marital === opt ? 'rgba(139,92,246,0.2)' : '#1E293B',
                  border: `2px solid ${marital === opt ? '#8B5CF6' : '#334155'}`,
                  color: marital === opt ? '#A78BFA' : '#CBD5E1',
                }}
              >
                {opt === 'مجرد' ? '🧑 مجرد' : '💑 متأهل'}
              </button>
            ))}
          </div>
        )}

        {/* Questions */}
        {!(isLoveStep && lovePhase === 'select') && (
          <div className="space-y-5">
            {currentQuestions.map((q, qi) => {
              const val = currentAnswers[qi] ?? null
              return (
                <div
                  key={qi}
                  ref={(el) => { questionRefs.current[qi] = el }}
                  className="rounded-2xl p-4"
                  style={{
                    background: '#1E293B',
                    border: `1px solid ${val !== null ? 'rgba(139,92,246,0.4)' : '#334155'}`,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <p className="text-sm leading-7 mb-4" style={{ color: '#CBD5E1' }}>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ml-2" style={{ background: 'rgba(139,92,246,0.2)', color: '#8B5CF6' }}>
                      {toPersian(qi + 1)}
                    </span>
                    {q}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {currentScale.map((score) => {
                      const selected = val === score
                      return (
                        <button
                          key={score}
                          onClick={() => handleAnswer(qi, score)}
                          className="flex-1 aspect-square rounded-xl text-sm font-bold transition-all duration-150 active:scale-90"
                          style={{
                            background:   selected ? '#8B5CF6' : '#0F172A',
                            color:        selected ? '#FFFFFF'  : '#64748B',
                            border:       `2px solid ${selected ? '#8B5CF6' : '#334155'}`,
                            boxShadow:    selected ? '0 0 12px rgba(139,92,246,0.4)' : 'none',
                            maxWidth:     '52px',
                          }}
                        >
                          {toPersian(score)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky nav */}
      <div
        className="fixed bottom-0 right-0 left-0 px-4 py-4 max-w-lg mx-auto"
        style={{ background: 'linear-gradient(to top, #0F172A 70%, transparent)' }}
      >
        {/* Submit on last dim */}
        {step === 7 ? (
          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: '#1E293B', color: '#94A3B8' }}
            >
              ‹
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !stepComplete}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: (!stepComplete || saving) ? '#334155' : '#8B5CF6', color: (!stepComplete || saving) ? '#64748B' : '#fff' }}
            >
              {saving ? 'در حال ثبت...' : '✓ ثبت نتایج'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: '#1E293B', color: '#94A3B8' }}
            >
              ‹
            </button>
            <button
              onClick={goNext}
              disabled={!stepComplete}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: stepComplete ? '#8B5CF6' : '#1E293B', color: stepComplete ? '#fff' : '#475569' }}
            >
              بعدی ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
