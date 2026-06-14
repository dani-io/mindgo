'use client'

import { useEffect, useRef, useState } from 'react'

// ── Jitsi External API type declaration ───────────────────

interface JitsiApi {
  addEventListener:    (event: string, listener: () => void) => void
  removeEventListener: (event: string, listener: () => void) => void
  dispose:             () => void
  executeCommand:      (command: string, ...args: unknown[]) => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: {
        roomName:               string
        parentNode:             HTMLElement
        width:                  string | number
        height:                 string | number
        configOverwrite?:       Record<string, unknown>
        interfaceConfigOverwrite?: Record<string, unknown>
        userInfo?:              { displayName?: string }
      }
    ) => JitsiApi
  }
}

// ── Props ─────────────────────────────────────────────────

interface JitsiRoomProps {
  jitsiRoomId:  string
  userName:     string
  sessionId:    string
  durationMins: number   // scheduled session length
  onEnd:        () => void
}

// ── Helpers ───────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toPersian(s: string) {
  return s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function fmtTimer(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const base = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  return toPersian(base)
}

// ── Component ─────────────────────────────────────────────

export default function JitsiRoom({
  jitsiRoomId, userName, sessionId, durationMins, onEnd,
}: JitsiRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef       = useRef<JitsiApi | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const [elapsed,   setElapsed]   = useState(0)
  const [apiReady,  setApiReady]  = useState(false)
  const [scriptErr, setScriptErr] = useState(false)
  const [ending,    setEnding]    = useState(false)

  // Mark session as in_progress on mount
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'in_progress' }),
    }).catch(() => {/* best-effort */})
  }, [sessionId])

  // Load Jitsi External API script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Script already loaded
    if (window.JitsiMeetExternalAPI) {
      initJitsi()
      return
    }

    const script    = document.createElement('script')
    script.src      = 'https://meet.jit.si/external_api.js'
    script.async    = true
    script.onload   = () => initJitsi()
    script.onerror  = () => setScriptErr(true)
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initJitsi() {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return

    apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName:   jitsiRoomId,
      parentNode: containerRef.current,
      width:      '100%',
      height:     '100%',
      configOverwrite: {
        prejoinPageEnabled:         false,
        startWithAudioMuted:        false,
        startWithVideoMuted:        false,
        disableWatermarks:          true,
        defaultLanguage:            'fa',
        enableNoisyMicDetection:    false,
        enableClosePage:            false,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'chat',
          'raisehand', 'tileview', 'fullscreen',
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK:           false,
        SHOW_WATERMARK_FOR_GUESTS:      false,
        APP_NAME:                       'Mindgo',
        NATIVE_APP_NAME:                'Mindgo',
        HIDE_INVITE_MORE_HEADER:        true,
        MOBILE_APP_PROMO:               false,
      },
      userInfo: { displayName: userName },
    })

    apiRef.current.addEventListener('readyToClose', handleJitsiEnd)
    setApiReady(true)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (apiRef.current) {
        apiRef.current.removeEventListener('readyToClose', handleJitsiEnd)
        apiRef.current.dispose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start timer once API is ready
  useEffect(() => {
    if (!apiReady) return
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [apiReady])

  function handleJitsiEnd() {
    if (ending) return
    setEnding(true)
    if (timerRef.current) clearInterval(timerRef.current)
    onEnd()
  }

  function handleEndButton() {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup')
      // readyToClose event fires after hangup
    } else {
      handleJitsiEnd()
    }
  }

  const isOverTime = elapsed > durationMins * 60

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', background: '#0A0A0A' }}
    >
      {/* Custom header */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 52, background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Session info */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}
          >
            🧠
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>Mindgo</p>
            <p className="text-[10px]" style={{ color: '#64748B' }}>جلسه در حال برگزاری</p>
          </div>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: isOverTime ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: isOverTime ? '#EF4444' : '#10B981' }}
          />
          <span
            className="text-sm font-mono font-bold"
            style={{ color: isOverTime ? '#EF4444' : '#10B981', letterSpacing: '0.05em' }}
          >
            {apiReady ? fmtTimer(elapsed) : '۰۰:۰۰'}
          </span>
          <span className="text-[10px]" style={{ color: '#64748B' }}>
            / {toPersian(String(durationMins))} دقیقه
          </span>
        </div>

        {/* End button */}
        <button
          onClick={handleEndButton}
          disabled={ending}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95"
          style={{ background: ending ? '#374151' : '#DC2626' }}
        >
          {ending ? '...' : '🔴 پایان جلسه'}
        </button>
      </div>

      {/* Jitsi container */}
      <div className="flex-1 relative" style={{ background: '#0A0A0A' }}>
        {scriptErr ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>خطا در بارگذاری اتاق گفتگو</p>
            <a
              href={`https://meet.jit.si/${jitsiRoomId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#10B981' }}
            >
              باز کردن در مرورگر
            </a>
          </div>
        ) : !apiReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full animate-pulse" style={{ background: 'rgba(16,185,129,0.2)' }} />
            <p className="text-sm" style={{ color: '#64748B' }}>در حال اتصال به اتاق گفتگو...</p>
          </div>
        ) : null}

        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
