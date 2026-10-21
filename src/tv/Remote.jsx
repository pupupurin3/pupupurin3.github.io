import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTV } from './TVContext'

// A chunky 90s remote. It is not a modal: it floats in the corner and the
// page stays usable while it is open.
export default function Remote() {
  const tv = useTV()
  const [blink, setBlink] = useState(0)
  const press = (fn) => () => { setBlink((n) => n + 1); fn() }
  const on = tv.power === 'on'
  const ifOn = (fn) => press(() => on && fn())

  const eject = () => {
    tv.flash('EJECT ⏏')
    tv.tune('lab')
    setTimeout(() => window.dispatchEvent(new CustomEvent('lab-tab', { detail: 'shelf' })), 200)
  }

  return (
    <>
      <button
        className={`remote-toggle ${tv.remoteOpen ? 'open' : ''}`}
        onClick={() => tv.setRemoteOpen(!tv.remoteOpen)}
        aria-expanded={tv.remoteOpen}
        aria-controls="tv-remote"
      >
        <span className="remote-toggle-icon" aria-hidden="true"><i /><i /><i /></span>
        Remote
      </button>
      <AnimatePresence>
        {tv.remoteOpen && (
          <motion.div
            id="tv-remote"
            className="remote"
            role="group"
            aria-label="TV remote"
            initial={{ opacity: 0, y: 40, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: 40, rotate: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="remote-head">
              <span key={blink} className="remote-ir" />
              <span className="remote-brand">PURIN·VISION</span>
              <button className="remote-close" onClick={() => tv.setRemoteOpen(false)} aria-label="Close remote">×</button>
            </div>

            <div className="remote-row">
              <button className="r-btn power" onClick={press(tv.togglePower)} title="Power">⏻</button>
              <button className="r-btn" onClick={ifOn(tv.toggleMute)} title="Mute">{tv.settings.sound ? 'MUTE' : 'SOUND'}</button>
              <button className="r-btn" onClick={ifOn(() => tv.setDisplay(!tv.display))} title="Display (I)">DISP</button>
            </div>

            <div className="remote-pad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button key={n} className="r-btn num" onClick={ifOn(() => tv.tune(n - 1))} title={`Channel ${n}`}>{n}</button>
              ))}
              <button className="r-btn" onClick={ifOn(() => tv.setMenuOpen(true))} title="Menu (M)">MENU</button>
              <button className="r-btn num" onClick={ifOn(() => tv.tune(9))} title="Channel 10">0</button>
              <button className="r-btn" onClick={ifOn(eject)} title="Eject to the tape shelf">⏏</button>
            </div>

            <div className="remote-rockers">
              <div className="rocker">
                <button onClick={ifOn(() => tv.changeVolume(1))} aria-label="Volume up">+</button>
                <span>VOL</span>
                <button onClick={ifOn(() => tv.changeVolume(-1))} aria-label="Volume down">−</button>
              </div>
              <div className="rocker">
                <button onClick={ifOn(() => tv.step(1))} aria-label="Channel up">▲</button>
                <span>CH</span>
                <button onClick={ifOn(() => tv.step(-1))} aria-label="Channel down">▼</button>
              </div>
            </div>

            <div className="remote-vcr">
              <button className="r-btn" onClick={ifOn(() => tv.setVcr('rew'))} title="Rewind (J)" aria-label="Rewind">◀◀</button>
              <button className="r-btn play" onClick={ifOn(() => tv.setVcr('play'))} title="Play" aria-label="Play">▶</button>
              <button className="r-btn" onClick={ifOn(() => tv.setVcr('pause'))} title="Pause (K)" aria-label="Pause">❚❚</button>
              <button className="r-btn" onClick={ifOn(() => tv.setVcr('ff'))} title="Fast-forward (L)" aria-label="Fast-forward">▶▶</button>
              <button className="r-btn" onClick={ifOn(() => tv.setVcr('stop'))} title="Stop" aria-label="Stop">■</button>
            </div>
            <p className="remote-hint">Keys: 1–5 channels · J K L tape · M menu · − + volume</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
