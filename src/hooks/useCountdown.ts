import { useEffect, useState } from 'react'
import { fmtDuration } from '../utils/time'

export function useCountdown(startTime: Date) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const msLeft = startTime.getTime() - now.getTime()
  const leftLabel = fmtDuration(msLeft)

  return { now, msLeft, leftLabel }
}
