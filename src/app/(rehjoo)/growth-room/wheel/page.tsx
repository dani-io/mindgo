'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'

const DIMENSIONS = [
  { key: 'health',    label: 'سلامت',  icon: '💪' },
  { key: 'finance',   label: 'مالی',   icon: '💰' },
  { key: 'career',    label: 'شغل',    icon: '💼' },
  { key: 'skills',    label: 'مهارت',  icon: '📚' },
  { key: 'relations', label: 'روابط',  icon: '🤝' },
  { key: 'mind',      label: 'ذهن',    icon: '🧠' },
] as const

type DimKey = typeof DIMENSIONS[number]['key']

interface Assessment {
  id:        string
  health:    number
  finance:   number
  career:    number
  skills:    number
  relations: number
  mind:      number
  createdAt: string
}

function toPersian(s: string | number) {
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default function WheelPage() {
  const router = useRouter()

  const [current,  setCurrent]  = useState<Assessment | null>(null)
  const [history,  setHistory]  = useState<Assessment[]>([])
  const [editMode, setEditMode] = useState(false)
  const [sliders,  setSliders]  = useState<Record<DimKey, number>>({
    health: 5, finance: 5, career: 5, skills: 5, relations: 5, mind: 5,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('mg_token')
        const res   = await fetch('/api/wheel-of-life', { headers: { Authorization: `Bearer ${token}` } })
        const json  = await res.json()
        if (json.success) {
          setCurrent(json.data.current)
          setHistory(json.data.history)
          if (json.data.current) {
            const c = json.data.current as Assessment
            setSliders({
              health: c.health, finance: c.finance, career: c.career,
              skills: c.skills, relations: c.relations, mind: c.mind,
            })
          }
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const token = localStorage.getItem('mg_token')
      const res   = await fetch('/api/wheel-of-life', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(sliders),
      })
      const json = await res.json()
      if (json.success) {
        setCurrent(json.data)
        setHistory((h) => [json.data, ...h].slice(0, 5))
        setEditMode(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // Chart data
  const previous = history[1] ?? null
  const chartData = DIMENSIONS.map((d) => ({
    dimension: d.label,
    current:   current ? current[d.key] : 0,
    previous:  previous ? previous[d.key] : 0,
  }))

  const avgScore = current
    ? Math.round(DIMENSIONS.reduce((s, d) => s + current[d.key], 0) / DIMENSIONS.length * 10) / 10
    : 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'var(--surface-secondary)', color: 'var(--content-primary)' }}
          >
            ›
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--content-primary)' }}>🕸️ چرخ حیات</h1>
            {current && (
              <p className="text-xs" style={{ color: 'var(--content-tertiary)' }}>
                میانگین: {toPersian(avgScore)} از ۱۰
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: editMode ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
            color:      editMode ? '#EF4444' : '#8B5CF6',
          }}
        >
          {editMode ? 'لغو' : '+ ارزیابی جدید'}
        </button>
      </div>

      {loading ? (
        <div className="h-72 rounded-2xl animate-pulse" style={{ background: 'var(--surface-secondary)' }} />
      ) : !current && !editMode ? (
        /* Empty state */
        <div
          className="rounded-2xl p-8 text-center space-y-3"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-4xl">🕸️</p>
          <p className="font-semibold" style={{ color: 'var(--content-primary)' }}>هنوز ارزیابی نداری</p>
          <p className="text-sm" style={{ color: 'var(--content-tertiary)' }}>
            اولین ارزیابی چرخ حیاتت رو ثبت کن
          </p>
          <button
            onClick={() => setEditMode(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#8B5CF6' }}
          >
            شروع ارزیابی
          </button>
        </div>
      ) : null}

      {/* Radar Chart */}
      {current && !editMode && (
        <div
          className="rounded-2xl p-4 mb-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={chartData} outerRadius={100}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: 'var(--content-secondary)', fontSize: 12, fontFamily: 'IRANSansX' }}
              />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                name="فعلی"
                dataKey="current"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.25}
              />
              {previous && (
                <Radar
                  name="قبلی"
                  dataKey="previous"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.08}
                  strokeDasharray="4 2"
                />
              )}
            </RadarChart>
          </ResponsiveContainer>

          {previous && (
            <div className="flex items-center justify-center gap-5 mt-2 text-xs" style={{ color: 'var(--content-tertiary)' }}>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#10B981' }} />
                ارزیابی فعلی
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 inline-block rounded" style={{ background: '#3B82F6' }} />
                ارزیابی قبلی
              </span>
            </div>
          )}
        </div>
      )}

      {/* Scores grid */}
      {current && !editMode && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {DIMENSIONS.map((d) => {
            const score = current[d.key]
            const pct   = (score / 10) * 100
            return (
              <div
                key={d.key}
                className="rounded-xl p-3 text-center"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-xl mb-1">{d.icon}</p>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--content-secondary)' }}>{d.label}</p>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--surface-secondary)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#8B5CF6' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{toPersian(score)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit sliders */}
      {editMode && (
        <div
          className="rounded-2xl p-5 mb-5 space-y-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--content-secondary)' }}>
            وضعیت فعلی هر بُعد از زندگی‌ات رو از ۱ تا ۱۰ ارزیابی کن
          </p>

          {DIMENSIONS.map((d) => (
            <div key={d.key}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--content-primary)' }}>
                  {d.icon} {d.label}
                </span>
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                  {toPersian(sliders[d.key])} / ۱۰
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sliders[d.key]}
                onChange={(e) => setSliders((s) => ({ ...s, [d.key]: parseInt(e.target.value) }))}
                className="w-full"
                style={{ accentColor: '#8B5CF6' }}
              />
              <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--content-tertiary)' }}>
                <span>۱</span><span>۱۰</span>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: saving ? '#374151' : '#8B5CF6' }}
          >
            {saving ? 'در حال ذخیره...' : '💾 ذخیره ارزیابی'}
          </button>
        </div>
      )}

      {/* History */}
      {history.length > 1 && !editMode && (
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--content-secondary)' }}>
            تاریخچه ارزیابی‌ها
          </p>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => (
              <div
                key={h.id}
                className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border-color)' }}
              >
                <span className="text-sm" style={{ color: 'var(--content-secondary)' }}>
                  {new Date(h.createdAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex gap-1.5">
                  {DIMENSIONS.map((d) => (
                    <div key={d.key} className="text-center">
                      <div className="text-[10px]" style={{ color: 'var(--content-tertiary)' }}>{d.icon}</div>
                      <div className="text-xs font-bold" style={{ color: '#8B5CF6' }}>{toPersian(h[d.key])}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
