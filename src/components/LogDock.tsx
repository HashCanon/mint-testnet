import React, { useEffect, useMemo, useRef, useState } from 'react'

/* types */
type Level = 'log' | 'info' | 'warn' | 'error' | 'debug'
type Entry = { id: number; ts: number; level: Level; args: any[] }
type Props = { enabled?: boolean }

/* constants */
const MAX_ENTRIES = 200

/* hook: mirror console to state */
function useConsoleTap(enabled: boolean) {
  const [entries, setEntries] = useState<Entry[]>([])
  const idRef = useRef(0)
  const originals = useRef<Partial<Record<Level, (...a: any[]) => void>>>({})

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const methods: Level[] = ['log', 'info', 'warn', 'error', 'debug']
    originals.current = {}

    const make = (level: Level) => (...args: any[]) => {
      setEntries(prev => {
        const next = [...prev, { id: ++idRef.current, ts: Date.now(), level, args }]
        return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
      })
      const orig = originals.current[level]
      if (orig) orig.apply(console, args)
    }

    /* save originals & override */
    methods.forEach(m => {
      originals.current[m] = (console as any)[m]?.bind(console) ?? (() => {})
      ;(console as any)[m] = make(m)
    })

    return () => {
      /* restore originals */
      methods.forEach(m => {
        if (originals.current[m]) (console as any)[m] = originals.current[m]!
      })
    }
  }, [enabled])

  return {
    entries,
    clear: () => setEntries([]),
  }
}

/* utils */
function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString(undefined, { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
}

function levelClass(level: Level) {
  switch (level) {
    case 'error':
      return 'text-red-600'
    case 'warn':
      return 'text-yellow-700'
    case 'info':
      return 'text-sky-700'
    case 'debug':
      return 'text-purple-700'
    default:
      return 'text-gray-800'
  }
}

/* component */
export default function LogDock({ enabled }: Props) {
  // decide enabled: prop > ?debug=1 > DEV
  const debug = useMemo(() => {
    if (typeof enabled === 'boolean') return enabled
    if (typeof window === 'undefined') return false
    const p = new URLSearchParams(window.location.search)
    const flag = p.get('debug')
    if (flag === '1' || flag === 'true') return true
    if (flag === '0' || flag === 'false') return false
    return import.meta.env.DEV === true
  }, [enabled])

  const [open, setOpen] = useState(debug)
  const { entries, clear } = useConsoleTap(debug)

  if (!debug) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: '960px',
          borderTop: '1px solid #e5e7eb',
          background: '#f8fafc',
          boxShadow: '0 -4px 10px rgba(0,0,0,0.06)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
          }}
        >
          <strong style={{ fontSize: 12 }}>Debug Log</strong>
          <span style={{ fontSize: 11, color: '#6b7280' }}>({entries.length})</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={() => setOpen(v => !v)}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                background: '#fff',
              }}
            >
              {open ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => clear()}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                background: '#fff',
              }}
            >
              Clear
            </button>
            <button
              onClick={async () => {
                const text = entries
                  .map(e => `[${fmtTime(e.ts)}] ${e.level}: ${e.args.map(String).join(' ')}`)
                  .join('\n')
                try {
                  await navigator.clipboard.writeText(text)
                  console.info('[logdock] copied to clipboard')
                } catch {
                  console.warn('[logdock] clipboard copy failed')
                }
              }}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                background: '#fff',
              }}
            >
              Copy
            </button>
          </div>
        </div>

        {/* body */}
        {open && (
          <div
            style={{
              maxHeight: 220,
              overflowY: 'auto',
              padding: '6px 12px 10px',
              fontSize: 12,
              lineHeight: 1.35,
              background: '#f1f5f9',
            }}
          >
            {entries.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No logs yet…</div>
            ) : (
              entries.map(e => (
                <div
                  key={e.id}
                  style={{ display: 'flex', gap: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  <span style={{ color: '#94a3b8', width: 86, flex: '0 0 auto' }}>
                    [{fmtTime(e.ts)}]
                  </span>
                  <span className={levelClass(e.level)} style={{ width: 48, flex: '0 0 auto' }}>
                    {e.level}
                  </span>
                  <span style={{ color: '#111827' }}>
                    {e.args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
