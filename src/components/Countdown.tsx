import { fmtDuration } from '../utils/time'

interface CountdownProps {
  now: Date
  startTime: Date
  mintingEnabled: boolean | null
}

export function Countdown({ now, startTime, mintingEnabled }: CountdownProps) {
  if (now >= startTime || mintingEnabled === true) return null

  return (
    <div className="status">
      <p>Mint starts at {startTime.toUTCString().slice(5, 22)} UTC</p>
      <p>
        Available in <strong>{fmtDuration(startTime.getTime() - now.getTime())}</strong>
      </p>
    </div>
  )
}
