// Minimal in-app console tap + event bus
export type LogLevel = 'log' | 'info' | 'warn' | 'error'
type LogEvent = { level: LogLevel; args: any[]; ts: number }

const EVT = 'app:log'
let installed = false
const originals: Partial<Record<LogLevel, (...a: any[]) => void>> = {}

export function installMiniLogger() {
  if (installed) return () => {}
  installed = true

  ;(['log', 'info', 'warn', 'error'] as LogLevel[]).forEach((lvl) => {
    originals[lvl] = console[lvl].bind(console)
    console[lvl] = (...args: any[]) => {
      originals[lvl]?.(...args) // keep DevTools logs
      window.dispatchEvent(new CustomEvent<LogEvent>(EVT, {
        detail: { level: lvl, args, ts: Date.now() },
      }))
    }
  })

  return () => {
    if (!installed) return
    ;(['log', 'info', 'warn', 'error'] as LogLevel[]).forEach((lvl) => {
      if (originals[lvl]) console[lvl] = originals[lvl]!
    })
    installed = false
  }
}

export function onLog(handler: (e: LogEvent) => void) {
  const fn = (ev: Event) => handler((ev as CustomEvent<LogEvent>).detail)
  window.addEventListener(EVT, fn as EventListener)
  return () => window.removeEventListener(EVT, fn as EventListener)
}
