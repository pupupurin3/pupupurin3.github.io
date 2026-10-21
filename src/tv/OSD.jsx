import { useEffect, useState } from 'react'
import { CHANNELS, pad, useTV } from './TVContext'

// On-screen display in the blocky style of a 90s TV and VCR: the channel
// number when you tune, the tape transport state, a tape counter that
// follows how far down the "tape" (page) you are, and volume bars.

const SHOW_MS = 2600
const VCR_LABEL = { play: 'PLAY ▶', pause: 'PAUSE ❚❚', ff: '▶▶ FF', rew: '◀◀ REW', stop: 'STOP ■' }

function counter(y) {
  const s = Math.floor(y / 12)
  return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

export default function OSD() {
  const { power, channel, osd, vcr, display, settings } = useTV()
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 200)
    return () => clearInterval(t)
  }, [])
  if (power !== 'on') return null

  const now = Date.now()
  const showChannel = display || now - osd.channelAt < SHOW_MS
  const showVcr = display || vcr !== 'play' || now - osd.vcrAt < SHOW_MS
  const showMsg = osd.msg && now - osd.msgAt < SHOW_MS
  const ch = CHANNELS[channel]

  return (
    <div className="osd" aria-hidden="true">
      <div className={`osd-ch ${showChannel ? 'show' : ''}`}>
        <strong>CH {pad(channel + 1)}</strong>
        <span>{ch.label}</span>
      </div>
      <div className="osd-right">
        <div className={`osd-vcr ${showVcr ? 'show' : ''} ${vcr === 'pause' ? 'blink' : ''}`}>{VCR_LABEL[vcr]}</div>
        {showVcr && <div className="osd-counter">SP {counter(window.scrollY)}</div>}
      </div>
      {showMsg && (
        <div className="osd-msg">
          {osd.msg === 'VOLUME' ? (
            settings.sound ? (
              <>
                <span>VOLUME</span>
                <span className="osd-bars">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < settings.volume ? 'on' : ''} />)}</span>
                <span>{pad(settings.volume)}</span>
              </>
            ) : <span>MUTE</span>
          ) : <span>{osd.msg}</span>}
        </div>
      )}
    </div>
  )
}
