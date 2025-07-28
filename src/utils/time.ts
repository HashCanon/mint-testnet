/** Converts milliseconds into "d h mm ss" string */
export const fmtDuration = (ms: number): string => {
    const total = Math.max(0, Math.floor(ms / 1000))
  
    const d = Math.floor(total / 86_400)
    const h = Math.floor((total % 86_400) / 3_600)
    const m = Math.floor((total % 3_600) / 60)
    const s = total % 60
  
    const parts: string[] = []
    if (d) parts.push(`${d} d`)
    parts.push(`${h} h`)
    parts.push(`${m.toString().padStart(2, '0')} m`)
    parts.push(`${s.toString().padStart(2, '0')} s`)
    return parts.join(' ')
  }
  