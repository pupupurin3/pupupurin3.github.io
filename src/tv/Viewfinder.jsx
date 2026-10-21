import { useEffect, useState } from 'react'
import { pad } from './TVContext'

// Camcorder viewfinder framing for the hero render: corner brackets, a
// blinking REC light, battery, the date stamp and a running timecode.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export default function Viewfinder() {
  const [now, setNow] = useState(() => new Date())
  const [start] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.floor((now - start) / 1000)
  const h = now.getHours()
  return (
    <div className="vf" aria-hidden="true">
      <i className="vf-corner tl" /><i className="vf-corner tr" /><i className="vf-corner bl" /><i className="vf-corner br" />
      <span className="vf-rec"><b />REC</span>
      <span className="vf-batt">SP <i /></span>
      <span className="vf-date">
        {h < 12 ? 'AM' : 'PM'} {h % 12 || 12}:{pad(now.getMinutes())}
        <br />
        {MONTHS[now.getMonth()]}. {now.getDate()} {now.getFullYear()}
      </span>
      <span className="vf-tc">{pad(Math.floor(s / 3600))}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}</span>
    </div>
  )
}
